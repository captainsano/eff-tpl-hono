import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc"
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { otelResource } from "./resource.ts"

const loggerProvider = new LoggerProvider({ resource: otelResource })
const logExporter = new OTLPLogExporter()
export const logRecordProcessor = new SimpleLogRecordProcessor(logExporter)

loggerProvider.addLogRecordProcessor(logRecordProcessor)

export const log = loggerProvider.getLogger("agent-service")
