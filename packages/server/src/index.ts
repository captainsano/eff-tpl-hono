import { Effect, pipe } from "effect"
import { Hono } from "hono"

const app = new Hono()

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

app.get("/hello", async (c) => {
  const response = await pipe(parent, Effect.withSpan("GET /hello"), Effect.runPromise)

  return c.text(response)
})

const PORT = Number.parseInt(process.env.PORT ?? "8000")

export default {
  port: PORT,
  fetch: app.fetch,
}
