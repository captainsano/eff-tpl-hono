import { Config, Context, Effect, Layer } from "effect"

export class ServerConfig extends Context.Tag("ServerConfig")<
  ServerConfig,
  {
    readonly port: number
  }
>() {
  static default = Layer.effect(
    ServerConfig,
    Effect.gen(function* () {
      const port = yield* Config.port("SERVER_PORT")

      return ServerConfig.of({
        port,
      })
    }),
  )
}
