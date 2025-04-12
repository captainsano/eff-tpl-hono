import { Effect, Logger, pipe } from "effect"
import express from "express"
import { hello } from "./hello.ts"
import { log } from "./otel/log.ts"

const otelLogger = Logger.make(({ logLevel, message }) => {
  log.emit({ body: String(message), severityText: String(logLevel).toUpperCase() })
})

const app = express()

app.get("/hello", async (_, res) => {
  await pipe(
    hello,
    Effect.provide(Logger.replace(Logger.defaultLogger, otelLogger)),
    Effect.runPromise,
  )

  res.send("hello")
})

const PORT = Number.parseInt(process.env.PORT ?? "8000")

app.listen(PORT, () => {
  console.log("server listening...")
  log.emit({ attributes: { port: PORT }, severityText: "INFO", body: "server listening" })
})
