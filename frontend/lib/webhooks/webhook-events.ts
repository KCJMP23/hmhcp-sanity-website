import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
import { createHash, createHmac } from 'crypto'

export type WebhookEvent = 
  | 'blog.created'
  | 'blog.updated'
  | 'blog.deleted'
  | 'blog.published'
  | 'blog.unpublished'
  | 'blog.scheduled'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'webhook.test'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  metadata?: {
    source?: string
    userId?: string
    apiKeyId?: string
    requestId?: string
  }
}

export interface WebhookEndpoint {
  id: string
  url: string
  events: WebhookEvent[]
  secret?: string
  headers?: Record<string, string>
  is_active: boolean
  retry_config?: {
    max_attempts: number
    backoff_seconds: number[]
  }
}

/**
 * Trigger a webhook event to all subscribed endpoints
 */
export async function triggerWebhookEvent(
  event: WebhookEvent,
  data: any,
  metadata?: WebhookPayload['metadata']
): Promise<void> {
  try {
    // Get all active endpoints subscribed to this event
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event])

    if (error || !endpoints || endpoints.length === 0) {
      console.log(`No active endpoints for event: ${event}`)
      return
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata
    }

    // Send webhook to each endpoint
    const promises = endpoints.map((endpoint) => 
      sendWebhook(endpoint, payload)
    )

    await Promise.allSettled(promises)
  } catch (error) {
    console.error(`Error triggering webhook event ${event}:`, error)
  }
}

/**
 * Send webhook to a specific endpoint
 */
async function sendWebhook(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload
): Promise<void> {
  const maxAttempts = endpoint.retry_config?.max_attempts || 3
  const backoffSeconds = endpoint.retry_config?.backoff_seconds || [1, 5, 30]

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const body = JSON.stringify(payload)
      const signature = endpoint.secret 
        ? generateSignature(body, endpoint.secret)
        : undefined

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          'X-Webhook-ID': createHash('md5').update(`${endpoint.id}-${payload.timestamp}`).digest('hex'),
          ...(signature && { 'X-Webhook-Signature': signature }),
          ...endpoint.headers
        },
        body
      })

      // Log delivery attempt
      await logWebhookDelivery({
        endpoint_id: endpoint.id,
        event: payload.event,
        payload,
        attempt,
        status_code: response.status,
        success: response.ok,
        response_body: await response.text()
      })

      if (response.ok) {
        console.log(`Webhook delivered to ${endpoint.url} for event ${payload.event}`)
        return
      }

      // Don't retry for client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        console.error(`Client error for webhook ${endpoint.url}: ${response.status}`)
        return
      }

      // Retry with backoff for server errors
      if (attempt < maxAttempts) {
        const delaySeconds = backoffSeconds[Math.min(attempt - 1, backoffSeconds.length - 1)]
        console.log(`Retrying webhook ${endpoint.url} in ${delaySeconds}s (attempt ${attempt}/${maxAttempts})`)
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000))
      }
    } catch (error) {
      // Log delivery failure
      await logWebhookDelivery({
        endpoint_id: endpoint.id,
        event: payload.event,
        payload,
        attempt,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })

      if (attempt < maxAttempts) {
        const delaySeconds = backoffSeconds[Math.min(attempt - 1, backoffSeconds.length - 1)]
        console.log(`Retrying webhook ${endpoint.url} after error in ${delaySeconds}s`)
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000))
      }
    }
  }

  console.error(`Failed to deliver webhook to ${endpoint.url} after ${maxAttempts} attempts`)
}

/**
 * Generate HMAC signature for webhook security
 */
function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret)
  return signature === expectedSignature
}

/**
 * Log webhook delivery attempt
 */
async function logWebhookDelivery({
  endpoint_id,
  event,
  payload,
  attempt,
  status_code,
  success,
  response_body,
  error_message
}: {
  endpoint_id: string
  event: string
  payload: any
  attempt: number
  status_code?: number
  success: boolean
  response_body?: string
  error_message?: string
}): Promise<void> {
  try {
    await supabase
      .from('webhook_delivery_logs')
      .insert({
        endpoint_id,
        event,
        payload,
        attempt,
        status_code,
        response_body,
        success,
        error_message,
        delivered_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log webhook delivery:', error)
  }
}

/**
 * Test webhook endpoint
 */
export async function testWebhookEndpoint(
  endpoint: WebhookEndpoint
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from HMHCP',
        endpoint_id: endpoint.id,
        test: true
      }
    }

    const body = JSON.stringify(testPayload)
    const signature = endpoint.secret 
      ? generateSignature(body, endpoint.secret)
      : undefined

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'webhook.test',
        'X-Webhook-Test': 'true',
        ...(signature && { 'X-Webhook-Signature': signature }),
        ...endpoint.headers
      },
      body
    })

    if (response.ok) {
      return {
        success: true,
        message: 'Test webhook sent successfully',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      }
    } else {
      return {
        success: false,
        message: `Test webhook failed with status ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          error: await response.text()
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send test webhook',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Register common webhook event handlers
 */
export function registerWebhookHandlers() {
  // Blog post events
  if (typeof window === 'undefined') {
    // Server-side only
    const { EventEmitter } = require('events')
    const webhookEmitter = new EventEmitter()

    webhookEmitter.on('blog.created', async (data: any) => {
      await triggerWebhookEvent('blog.created', data)
    })

    webhookEmitter.on('blog.updated', async (data: any) => {
      await triggerWebhookEvent('blog.updated', data)
    })

    webhookEmitter.on('blog.published', async (data: any) => {
      await triggerWebhookEvent('blog.published', data)
    })

    webhookEmitter.on('blog.deleted', async (data: any) => {
      await triggerWebhookEvent('blog.deleted', data)
    })

    return webhookEmitter
  }
  
  return null
}

// Export event emitter for use in other modules
export const webhookEmitter = registerWebhookHandlers()