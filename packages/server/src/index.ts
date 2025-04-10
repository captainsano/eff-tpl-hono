import { Effect } from "effect"
import { hello } from "./hello.ts"

await Effect.runPromise(hello)