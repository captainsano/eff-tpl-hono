import { NodeSdk } from "@effect/opentelemetry"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node"
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions"
import { Effect, pipe } from "effect"
import express from "express"
import { log } from "./otel/log.ts"
import { otelResource } from "./otel/resource.ts"

const nodeSdkLayer = NodeSdk.layer(() => ({
  logRecordProcessor: new SimpleLogRecordProcessor(new OTLPLogExporter()),
  metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() }),
  resource: {
    serviceName: otelResource.attributes[ATTR_SERVICE_NAME]?.toString() ?? "unknown-service",
    serviceVersion: otelResource.attributes[ATTR_SERVICE_VERSION]?.toString() ?? "unknown-version",
  },
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
}))

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
  await pipe(parent, Effect.withSpan("GET /hello"), Effect.provide(nodeSdkLayer), Effect.runPromise)

  res.send("hello")
})

const PORT = Number.parseInt(process.env.PORT ?? "8000")

app.listen(PORT, () => {
  console.log("server listening...")
  log.emit({ attributes: { port: PORT }, severityText: "INFO", body: "server listening" })
})
