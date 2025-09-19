import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api'

// Initialize OpenTelemetry SDK
export function initializeTracing() {
  if (process.env.NODE_ENV === 'test') return

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'hmhcp-webhook-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  })

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {
      'x-api-key': process.env.OTEL_API_KEY || '',
    },
  })

  const sdk = new NodeSDK({
    resource,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable file system instrumentation
        },
      }),
    ],
    spanProcessor: new BatchSpanProcessor(traceExporter),
  })

  sdk.start()
    .then(() => console.log('OpenTelemetry tracing initialized'))
    .catch((error) => console.error('Error initializing tracing:', error))

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry terminated'))
      .catch((error) => console.error('Error terminating OpenTelemetry:', error))
      .finally(() => process.exit(0))
  })
}

// Get tracer instance
export function getTracer(name: string = 'webhook-tracer') {
  return trace.getTracer(name)
}

// Webhook-specific tracing utilities
export class WebhookTracer {
  private tracer = getTracer('webhook-operations')

  /**
   * Trace webhook processing
   */
  async traceWebhookProcessing<T>(
    webhookId: string,
    source: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const span = this.tracer.startSpan('webhook.process', {
      kind: SpanKind.SERVER,
      attributes: {
        'webhook.id': webhookId,
        'webhook.source': source,
        'webhook.timestamp': new Date().toISOString(),
      },
    })

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await operation()
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      } finally {
        span.end()
      }
    })
  }

  /**
   * Trace API key validation
   */
  async traceApiKeyValidation(
    apiKey: string,
    operation: () => Promise<boolean>
  ): Promise<boolean> {
    const span = this.tracer.startSpan('webhook.validate_api_key', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'api_key.prefix': apiKey.substring(0, 10),
      },
    })

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const isValid = await operation()
        span.setAttributes({
          'api_key.valid': isValid,
        })
        span.setStatus({ code: SpanStatusCode.OK })
        return isValid
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw error
      } finally {
        span.end()
      }
    })
  }

  /**
   * Trace rate limiting check
   */
  async traceRateLimiting(
    apiKey: string,
    operation: () => Promise<{ allowed: boolean; remaining: number }>
  ) {
    const span = this.tracer.startSpan('webhook.rate_limit', {
      kind: SpanKind.INTERNAL,
    })

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await operation()
        span.setAttributes({
          'rate_limit.allowed': result.allowed,
          'rate_limit.remaining': result.remaining,
        })
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw error
      } finally {
        span.end()
      }
    })
  }

  /**
   * Trace content transformation
   */
  async traceContentTransformation(
    source: string,
    operation: () => Promise<any>
  ) {
    const span = this.tracer.startSpan('webhook.transform_content', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'transform.source': source,
      },
    })

    return context.with(trace.setSpan(context.active(), span), async () => {
      const startTime = Date.now()
      try {
        const result = await operation()
        span.setAttributes({
          'transform.duration_ms': Date.now() - startTime,
          'transform.success': true,
        })
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw error
      } finally {
        span.end()
      }
    })
  }

  /**
   * Trace database operations
   */
  async traceDatabaseOperation<T>(
    operation: string,
    table: string,
    query: () => Promise<T>
  ): Promise<T> {
    const span = this.tracer.startSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': operation,
        'db.table': table,
      },
    })

    return context.with(trace.setSpan(context.active(), span), async () => {
      const startTime = Date.now()
      try {
        const result = await query()
        span.setAttributes({
          'db.duration_ms': Date.now() - startTime,
        })
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw error
      } finally {
        span.end()
      }
    })
  }
}

// Export singleton instance
export const webhookTracer = new WebhookTracer()

// Metrics for webhook operations
export class WebhookMetrics {
  private static instance: WebhookMetrics
  private metrics: Map<string, number> = new Map()

  static getInstance(): WebhookMetrics {
    if (!WebhookMetrics.instance) {
      WebhookMetrics.instance = new WebhookMetrics()
    }
    return WebhookMetrics.instance
  }

  incrementCounter(name: string, value: number = 1) {
    const current = this.metrics.get(name) || 0
    this.metrics.set(name, current + value)
  }

  recordLatency(name: string, duration: number) {
    this.metrics.set(`${name}.latency`, duration)
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  reset() {
    this.metrics.clear()
  }
}

export const webhookMetrics = WebhookMetrics.getInstance()