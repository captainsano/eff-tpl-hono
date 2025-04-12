import { resourceFromAttributes } from "@opentelemetry/resources"
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions"

export const otelResource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "agent-service-otel",
  [ATTR_SERVICE_VERSION]: "1.0.0",
})
