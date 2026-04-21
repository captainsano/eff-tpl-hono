import { BunContext, BunRuntime } from "@effect/platform-bun"
import { serve } from "bun"
import { Effect, Layer, pipe, Runtime } from "effect"
import { Hono } from "hono"
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
    const runPromise = Runtime.runPromise(Runtime.defaultRuntime)
    const serverConfig = yield* ServerConfig

    yield* Effect.logInfo("Starting server on port ", serverConfig.port)

    const app = new Hono()

    app.get("/hello", async (c) => {
      const response = await pipe(parent, Effect.withSpan("GET /hello"), runPromise)

      return c.text(response)
    })

    const server = yield* Effect.sync(() =>
      serve({ development: false, port: serverConfig.port, fetch: app.fetch }),
    )

    yield* Effect.addFinalizer(
      Effect.fn(function* () {
        yield* Effect.logInfo("Shutting down server on port ", serverConfig.port)
        yield* Effect.promise(() => server.stop())
      }),
    )
  }),
)

const dependencies = pipe(
  Layer.empty,
  Layer.provideMerge(ServerConfig.default),
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
