import { supabase } from '@/lib/supabase/client'

export interface WebhookEvent {
  event: 'blog.created' | 'blog.updated' | 'blog.deleted' | 'blog.published'
  data: {
    id: string
    title: string
    slug: string
    status: string
    author?: string
    tags?: string[]
    excerpt?: string
    url: string
    timestamp: string
  }
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(event: WebhookEvent) {
  try {
    // Get all active API keys that have webhook URLs configured
    const { data: activeKeys } = await supabase
      .from('api_keys')
      .select('id, name, service, service_webhook_url')
      .eq('is_active', true)
      .not('service_webhook_url', 'is', null)

    if (!activeKeys || activeKeys.length === 0) {
      return { success: true, message: 'No active webhooks to trigger' }
    }

    // Send webhook to each configured endpoint
    const results = await Promise.allSettled(
      activeKeys.map(async (key) => {
        const startTime = Date.now()
        
        try {
          const response = await fetch(key.service_webhook_url!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-HMHCP-Event': event.event,
              'X-HMHCP-Signature': generateSignature(event, key.id),
              'X-HMHCP-Timestamp': event.data.timestamp
            },
            body: JSON.stringify(event)
          })

          const responseBody = await response.text()
          
          // Log the webhook delivery attempt
          await supabase
            .from('webhook_logs')
            .insert({
              api_key_id: key.id,
              endpoint: key.service_webhook_url,
              method: 'POST',
              headers: {
                'X-HMHCP-Event': event.event
              },
              payload: event,
              status_code: response.status,
              response_body: responseBody ? { message: responseBody } : null,
              success: response.ok,
              processing_time_ms: Date.now() - startTime,
              received_at: new Date().toISOString(),
              processed_at: new Date().toISOString()
            })

          return {
            keyId: key.id,
            name: key.name,
            success: response.ok,
            status: response.status
          }
        } catch (error) {
          // Log failed delivery attempt
          await supabase
            .from('webhook_logs')
            .insert({
              api_key_id: key.id,
              endpoint: key.service_webhook_url,
              method: 'POST',
              headers: {
                'X-HMHCP-Event': event.event
              },
              payload: event,
              status_code: 0,
              success: false,
              error_type: 'DELIVERY_FAILED',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              processing_time_ms: Date.now() - startTime,
              received_at: new Date().toISOString(),
              processed_at: new Date().toISOString()
            })

          return {
            keyId: key.id,
            name: key.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return {
      success: true,
      message: `Webhooks triggered: ${successful} successful, ${failed} failed`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger webhooks'
    }
  }
}

/**
 * Generate a signature for webhook verification
 */
function generateSignature(event: WebhookEvent, keyId: string): string {
  // In production, use a proper HMAC signature with a secret
  // For now, we'll use a simple hash
  const crypto = require('crypto')
  const data = `${event.event}:${event.data.id}:${event.data.timestamp}:${keyId}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Trigger webhook for blog post creation
 */
export async function triggerBlogCreatedWebhook(blogPost: any) {
  const event: WebhookEvent = {
    event: 'blog.created',
    data: {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      status: blogPost.status,
      author: blogPost.author,
      tags: blogPost.tags,
      excerpt: blogPost.excerpt,
      url: `/blog/${blogPost.slug}`,
      timestamp: new Date().toISOString()
    }
  }
  
  return triggerWebhooks(event)
}

/**
 * Trigger webhook for blog post update
 */
export async function triggerBlogUpdatedWebhook(blogPost: any) {
  const event: WebhookEvent = {
    event: 'blog.updated',
    data: {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      status: blogPost.status,
      author: blogPost.author,
      tags: blogPost.tags,
      excerpt: blogPost.excerpt,
      url: `/blog/${blogPost.slug}`,
      timestamp: new Date().toISOString()
    }
  }
  
  return triggerWebhooks(event)
}

/**
 * Trigger webhook for blog post deletion
 */
export async function triggerBlogDeletedWebhook(blogPost: any) {
  const event: WebhookEvent = {
    event: 'blog.deleted',
    data: {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      status: 'deleted',
      author: blogPost.author,
      tags: blogPost.tags,
      excerpt: blogPost.excerpt,
      url: '',
      timestamp: new Date().toISOString()
    }
  }
  
  return triggerWebhooks(event)
}

/**
 * Trigger webhook for blog post publication
 */
export async function triggerBlogPublishedWebhook(blogPost: any) {
  const event: WebhookEvent = {
    event: 'blog.published',
    data: {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      status: 'published',
      author: blogPost.author,
      tags: blogPost.tags,
      excerpt: blogPost.excerpt,
      url: `/blog/${blogPost.slug}`,
      timestamp: new Date().toISOString()
    }
  }
  
  return triggerWebhooks(event)
}