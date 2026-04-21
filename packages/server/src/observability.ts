import { Otlp, OtlpSerialization } from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { Effect, Layer, Logger, pipe } from "effect"
import { LoggerConfig } from "./config/logger"
import { ObservabilityConfig } from "./config/observability"

export const ObservabilityLayer = pipe(
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
  Layer.unwrapEffect,
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(OtlpSerialization.layerProtobuf),
)

export const LoggerLayer = pipe(
  Effect.gen(function* () {
    const config = yield* LoggerConfig

    if (config.pretty) {
      return Logger.pretty
    }

    return Logger.structured
  }),
  Layer.unwrapEffect,
)
