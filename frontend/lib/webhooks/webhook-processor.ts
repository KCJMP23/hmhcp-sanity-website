import { supabase } from '@/lib/supabase/client'
import { slugify as generateSlug } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

interface ProcessWebhookPayloadParams {
  service: 'make.com' | 'zapier' | 'custom'
  payload: any
  apiKeyId?: string
  requestId?: string
}

interface ProcessResult {
  success: boolean
  postId?: string
  message?: string
  error?: string
  details?: any
}

/**
 * Process webhook payload and create/update blog post
 */
export async function processWebhookPayload({
  service,
  payload,
  apiKeyId,
  requestId
}: ProcessWebhookPayloadParams): Promise<ProcessResult> {
  try {
    // Transform payload based on service
    const blogPost = transformPayloadToBlogPost(payload, service)
    
    // Add webhook metadata
    blogPost.source = service
    blogPost.api_key_id = apiKeyId
    blogPost.webhook_data = {
      request_id: requestId,
      received_at: new Date().toISOString(),
      original_payload: payload
    }
    
    // Check if post with external_id exists (for updates)
    if (payload.external_id) {
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('external_id', payload.external_id)
        .eq('source', service)
        .single()
      
      if (existingPost) {
        // Update existing post
        const { data: updatedPost, error: updateError } = await supabase
          .from('blog_posts')
          .update({
            ...blogPost,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPost.id)
          .select()
          .single()
        
        if (updateError) {
          return {
            success: false,
            error: `Failed to update post: ${updateError.message}`
          }
        }
        
        // Trigger webhook events
        await triggerWebhookEvent('blog.updated', updatedPost)
        
        return {
          success: true,
          postId: updatedPost.id,
          message: 'Blog post updated successfully',
          details: {
            action: 'update',
            id: updatedPost.id,
            slug: updatedPost.slug
          }
        }
      }
    }
    
    // Create new post
    const { data: newPost, error: createError } = await supabase
      .from('blog_posts')
      .insert(blogPost)
      .select()
      .single()
    
    if (createError) {
      return {
        success: false,
        error: `Failed to create post: ${createError.message}`
      }
    }
    
    // Trigger webhook events
    await triggerWebhookEvent('blog.created', newPost)
    if (newPost.status === 'published') {
      await triggerWebhookEvent('blog.published', newPost)
    }
    
    return {
      success: true,
      postId: newPost.id,
      message: 'Blog post created successfully',
      details: {
        action: 'create',
        id: newPost.id,
        slug: newPost.slug,
        status: newPost.status
      }
    }
    
  } catch (error) {
    console.error('[Webhook Processor Error]:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    }
  }
}

/**
 * Transform webhook payload to blog post format
 */
function transformPayloadToBlogPost(payload: any, service: string): any {
  const postId = uuidv4()
  const now = new Date().toISOString()
  
  let blogPost: any = {
    id: postId,
    created_at: now,
    updated_at: now
  }
  
  switch (service) {
    case 'zapier':
      blogPost = {
        ...blogPost,
        title: payload.title,
        slug: generateSlug(payload.title),
        content: payload.body,
        excerpt: payload.body.substring(0, 200) + '...',
        author: payload.author_name || 'HMHCP Team',
        status: payload.publish ? 'published' : 'draft',
        published_at: payload.publish ? now : null,
        category: payload.category || 'Healthcare Technology',
        tags: payload.tags ? payload.tags.split(',').map((t: string) => t.trim()) : [],
        external_id: payload.external_id,
        seo_title: payload.meta_title || payload.title,
        seo_description: payload.meta_description || payload.body.substring(0, 160),
        featured_image: payload.featured_image || null
      }
      break
      
    case 'make.com':
      blogPost = {
        ...blogPost,
        title: payload.title,
        slug: generateSlug(payload.title),
        content: payload.content,
        excerpt: payload.content.substring(0, 200) + '...',
        author: payload.author || 'HMHCP Team',
        status: payload.status || 'draft',
        published_at: payload.status === 'published' ? now : null,
        category: 'Healthcare Technology',
        tags: payload.tags || [],
        external_id: payload.external_id,
        seo_title: payload.seo?.title || payload.title,
        seo_description: payload.seo?.description || payload.content.substring(0, 160),
        seo_keywords: payload.seo?.keywords || [],
        social_media_content: payload.social || {},
        scheduled_for: payload.scheduled_for || null,
        featured_image: payload.featured_image || null
      }
      break
      
    default:
      // Generic/custom format
      blogPost = {
        ...blogPost,
        title: payload.title,
        slug: generateSlug(payload.title),
        content: payload.content,
        excerpt: payload.content.substring(0, 200) + '...',
        author: payload.author || 'HMHCP Team',
        status: payload.status === 'published' ? 'published' : 'draft',
        published_at: payload.status === 'published' ? now : null,
        category: payload.category || 'Healthcare Technology',
        tags: Array.isArray(payload.tags) 
          ? payload.tags 
          : typeof payload.tags === 'string' 
            ? payload.tags.split(',').map((t: string) => t.trim())
            : [],
        external_id: payload.external_id,
        metadata: payload.metadata || {},
        featured_image: payload.featured_image || null
      }
  }
  
  // Ensure required fields
  if (!blogPost.excerpt && blogPost.content) {
    blogPost.excerpt = blogPost.content.substring(0, 200) + '...'
  }
  
  if (!blogPost.slug) {
    blogPost.slug = generateSlug(blogPost.title)
  }
  
  // Add healthcare compliance metadata
  blogPost.compliance_reviewed = false
  blogPost.medical_accuracy_verified = false
  
  return blogPost
}

/**
 * Trigger webhook events for other services
 */
async function triggerWebhookEvent(event: string, data: any): Promise<void> {
  try {
    // Get active webhook endpoints that listen to this event
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event])
    
    if (!endpoints || endpoints.length === 0) {
      return
    }
    
    // Send webhook to each endpoint
    const promises = endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-ID': uuidv4(),
            'X-Webhook-Timestamp': new Date().toISOString(),
            ...(endpoint.secret && {
              'X-Webhook-Signature': generateWebhookSignature(data, endpoint.secret)
            })
          },
          body: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString()
          })
        })
        
        // Log webhook delivery
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            endpoint_id: endpoint.id,
            event,
            payload: data,
            status_code: response.status,
            success: response.ok,
            response: await response.text()
          })
          
      } catch (error) {
        // Log failed delivery
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            endpoint_id: endpoint.id,
            event,
            payload: data,
            success: false,
            error_message: error instanceof Error ? error.message : 'Delivery failed'
          })
      }
    })
    
    await Promise.allSettled(promises)
    
  } catch (error) {
    console.error('[Webhook Event Trigger Error]:', error)
  }
}

/**
 * Generate webhook signature for security
 */
function generateWebhookSignature(payload: any, secret: string): string {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  return hmac.digest('hex')
}