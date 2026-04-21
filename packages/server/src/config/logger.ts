import { Config, Context, Effect, Layer } from "effect"

export class LoggerConfig extends Context.Tag("server/LoggerConfig")<
  LoggerConfig,
  {
    readonly pretty: boolean
  }
>() {
  static layer = Layer.effect(
    LoggerConfig,
    Effect.gen(function* () {
      const pretty = yield* Config.boolean("PRETTY_LOGGER_ENABLED").pipe(Config.withDefault(false))

      return LoggerConfig.of({ pretty })
    }),
  )
}
