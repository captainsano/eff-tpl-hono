import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { log, logRecordProcessor } from "./log.ts"
import { otelResource } from "./resource.ts"

const sdk = new NodeSDK({
  resource: otelResource,
  traceExporter: new OTLPTraceExporter(),
  logRecordProcessors: [logRecordProcessor],
  metricReader: new PeriodicExportingMetricReader({
    exportIntervalMillis: 1000,
    exporter: new OTLPMetricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
log.emit({ body: "Telemetry SDK started", severityText: "INFO", severityNumber: 9 })
