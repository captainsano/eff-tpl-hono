import { Otlp, OtlpSerialization } from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { serve } from "bun"
import { Clock, Effect, Exit, FiberSet, Layer, pipe, type Tracer } from "effect"
import { Hono } from "hono"
import { upgradeWebSocket, websocket } from "hono/bun"
import type { WSEvents } from "hono/ws"
import { ObservabilityConfig } from "./config/observability"
import { ServerConfig } from "./config/server"

const child = Effect.gen(function* () {
  yield* Effect.sleep("100 millis")
  yield* Effect.logInfo("this is the child log")
}).pipe(Effect.withSpan("child"))

const parent = Effect.gen(function* () {
  yield* Effect.sleep("20 millis")
  yield* Effect.logInfo("This is a parent log")
  yield* child
  yield* Effect.sleep("10 millis")
  return "hello world"
}).pipe(Effect.withSpan("parent"))

const serverLayer = Layer.scopedDiscard(
  Effect.gen(function* () {
    const runPromise = yield* FiberSet.makeRuntimePromise()
    const config = yield* ServerConfig

    yield* Effect.logInfo("Starting server on port ", config.port)

    const app = new Hono()

    app.get("/hello", async (c) => {
      const response = await pipe(parent, Effect.withSpan("GET /hello"), runPromise)

      return c.text(response)
    })

    app.get(
      "/ws",
      upgradeWebSocket(async (_c) => {
        const response = await pipe(
          Effect.gen(function* () {
            let trace: Tracer.Span

            return {
              onOpen() {
                runPromise(
                  Effect.gen(function* () {
                    trace = yield* Effect.makeSpan("GET /ws")
                    yield* Effect.logInfo("WebSocket connection opened")
                  }),
                )
              },
              onClose() {
                runPromise(
                  Effect.gen(function* () {
                    const currentTimeNanos = yield* Clock.currentTimeNanos
                    if (trace) {
                      trace.end(currentTimeNanos, Exit.succeed(void 0))
                    }
                    yield* Effect.logInfo("WebSocket connection closed")
                  }),
                )
              },
              onMessage(evt, _ws) {
                pipe(
                  Effect.gen(function* () {
                    yield* Effect.logInfo("Received message: ", evt.data)
                    yield* parent
                  }),
                  Effect.withParentSpan(trace),
                  runPromise,
                )
              },
            } as WSEvents
          }),
          Effect.withSpan("GET /ws upgradeWebSocket"),
          runPromise,
        )

        return response
      }),
    )

    const server = yield* Effect.sync(() =>
      serve({ development: false, port: config.port, fetch: app.fetch, websocket }),
    )

    yield* Effect.addFinalizer(
      Effect.fn(function* () {
        yield* Effect.logInfo("Shutting down server on port ", config.port)
        yield* Effect.promise(() => server.stop())
      }),
    )
  }),
)

const Observability = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* ObservabilityConfig

    return Otlp.layer({
      baseUrl: config.baseUrl,
      resource: { serviceName: config.serviceName },
      metricsExportInterval: config.metricsExportInterval,
      tracerExportInterval: config.tracerExportInterval,
      loggerExportInterval: config.loggerExportInterval,
    })
  }),
)

const dependencies = pipe(
  Layer.empty,
  Layer.provideMerge(Observability),
  Layer.provideMerge(ServerConfig.default),
  Layer.provideMerge(ObservabilityConfig.default),
  Layer.provideMerge(FetchHttpClient.layer),
  Layer.provideMerge(OtlpSerialization.layerProtobuf),
  Layer.provideMerge(BunContext.layer),
)

const program = pipe(
  Layer.launch(serverLayer),
  Effect.provide(dependencies),
  Effect.catchTag("ConfigError", (e) =>
    Effect.gen(function* () {
      yield* Effect.logError("Configuration Error: ", e.message)
      return yield* Effect.dieMessage(e.message)
    }),
  ),
  Effect.ensureErrorType<never>(),
  Effect.ensureRequirementsType<never>(),
)

BunRuntime.runMain(program)
