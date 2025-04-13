import { Effect, pipe } from "effect"
import express from "express"

const app = express()

const child = Effect.gen(function* () {
  yield* Effect.sleep("100 millis")
  yield* Effect.logInfo("this is the child log")
}).pipe(Effect.withSpan("child"))

const parent = Effect.gen(function* () {
  yield* Effect.sleep("20 millis")
  yield* Effect.logInfo("This is a parent log")
  yield* child
  yield* Effect.sleep("10 millis")
}).pipe(Effect.withSpan("parent"))

app.get("/hello", async (_, res) => {
  await pipe(parent, Effect.withSpan("GET /hello"), Effect.runPromise)

  res.send("hello")
})

const PORT = Number.parseInt(process.env.PORT ?? "8000")

app.listen(PORT, () => {
  console.log("server listening...", { port: PORT })
})
