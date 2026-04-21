import { Config, Context, Duration, Effect, Layer } from "effect"

export class ObservabilityConfig extends Context.Tag("server/ObservabilityConfig")<
  ObservabilityConfig,
  {
    serviceName: string
    baseUrl: string
    metricsExportInterval: Duration.DurationInput
    tracerExportInterval: Duration.DurationInput
    loggerExportInterval: Duration.DurationInput
  }
>() {
  static default = Layer.effect(
    ObservabilityConfig,
    Effect.gen(function* () {
      const serviceName = yield* Config.string("OBSERVABILITY_SERVICE_NAME")
      const baseUrl = yield* Config.string("OBSERVABILITY_BASE_URL")
      const metricsExportInterval = yield* Config.duration(
        "OBSERVABILITY_METRICS_EXPORT_INTERVAL",
      ).pipe(Config.withDefault(Duration.seconds(10)))
      const tracerExportInterval = yield* Config.duration(
        "OBSERVABILITY_TRACER_EXPORT_INTERVAL",
      ).pipe(Config.withDefault(Duration.seconds(10)))
      const loggerExportInterval = yield* Config.duration(
        "OBSERVABILITY_LOGGER_EXPORT_INTERVAL",
      ).pipe(Config.withDefault(Duration.seconds(10)))

      return ObservabilityConfig.of({
        serviceName,
        baseUrl: baseUrl,
        metricsExportInterval,
        tracerExportInterval,
        loggerExportInterval,
      })
    }),
  )
}
