import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"

export const periodicMetricReader = new PeriodicExportingMetricReader({
  exportIntervalMillis: 1000,
  exporter: new OTLPMetricExporter(),
})
