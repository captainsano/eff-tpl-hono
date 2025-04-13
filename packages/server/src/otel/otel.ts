import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { log, logRecordProcessor } from "./log.ts"
import { periodicMetricReader } from "./metrics.ts"
import { otelResource } from "./resource.ts"

const sdk = new NodeSDK({
  resource: otelResource,
  traceExporter: new OTLPTraceExporter(),
  logRecordProcessors: [logRecordProcessor],
  metricReader: periodicMetricReader,
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
log.emit({ body: "Telemetry SDK started", severityText: "INFO", severityNumber: 9 })
