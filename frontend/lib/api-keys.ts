import { createHash, randomBytes } from 'crypto'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type ApiKey = Database['public']['Tables']['api_keys']['Row']

/**
 * Generate a new API key with prefix
 * Format: hmhcp_live_xxxxxxxxxxxxxxxxxxxx
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const prefix = 'hmhcp'
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test'
  const randomPart = randomBytes(24).toString('base64url')
  
  const key = `${prefix}_${environment}_${randomPart}`
  const hash = createHash('sha256').update(key).digest('hex')
  const keyPrefix = key.substring(0, 8)
  
  return { key, hash, prefix: keyPrefix }
}

/**
 * Validate an API key and check rate limits
 */
export async function validateApiKey(apiKey: string): Promise<{
  isValid: boolean
  apiKeyId?: string
  rateLimit?: number
  currentUsage?: number
  error?: string
}> {
  try {
    // Hash the provided key
    const keyHash = createHash('sha256').update(apiKey).digest('hex')
    
    // Call the database function to validate
    const { data, error } = await supabase.rpc('validate_api_key', {
      key_hash_param: keyHash
    })
    
    if (error) {
      console.error('Error validating API key:', error)
      return { isValid: false, error: 'Invalid API key' }
    }
    
    if (!data || data.length === 0) {
      return { isValid: false, error: 'Invalid API key' }
    }
    
    const result = data[0]
    
    // Check if rate limit exceeded
    if (!result.is_valid) {
      return {
        isValid: false,
        apiKeyId: result.api_key_id,
        rateLimit: result.rate_limit,
        currentUsage: result.current_usage,
        error: 'Rate limit exceeded'
      }
    }
    
    return {
      isValid: true,
      apiKeyId: result.api_key_id,
      rateLimit: result.rate_limit,
      currentUsage: result.current_usage
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return { isValid: false, error: 'Internal error' }
  }
}

/**
 * Track API key usage for rate limiting
 */
export async function trackApiKeyUsage(apiKeyId: string): Promise<void> {
  try {
    await supabase.rpc('track_rate_limit', {
      api_key_id_param: apiKeyId
    })
  } catch (error) {
    console.error('Error tracking API key usage:', error)
  }
}

/**
 * Create a new API key in the database
 */
export async function createApiKey({
  name,
  description,
  service,
  expiresAt
}: {
  name: string
  description?: string
  service: 'make.com' | 'zapier' | 'custom' | 'internal'
  expiresAt?: Date
}): Promise<{ key?: string; error?: string }> {
  try {
    const { key, hash, prefix } = generateApiKey()
    
    const { error } = await supabase
      .from('api_keys')
      .insert({
        key_hash: hash,
        key_prefix: prefix,
        name,
        description,
        service,
        expires_at: expiresAt?.toISOString(),
        allowed_endpoints: ['/api/cms/blog/webhook'],
        rate_limit: 100
      })
    
    if (error) {
      console.error('Error creating API key:', error)
      return { error: 'Failed to create API key' }
    }
    
    // Return the key only once - it cannot be retrieved later
    return { key }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { error: 'Internal error' }
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(apiKeyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', apiKeyId)
    
    if (error) {
      console.error('Error revoking API key:', error)
      return { success: false, error: 'Failed to revoke API key' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error revoking API key:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * List API keys (without the actual key values)
 */
export async function listApiKeys(): Promise<{ 
  keys?: Partial<ApiKey>[]
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, description, service, is_active, created_at, expires_at, last_used_at, usage_count')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error listing API keys:', error)
      return { error: 'Failed to list API keys' }
    }
    
    return { keys: data }
  } catch (error) {
    console.error('Error listing API keys:', error)
    return { error: 'Internal error' }
  }
}

/**
 * Log webhook request
 */
export async function logWebhookRequest({
  requestId,
  apiKeyId,
  endpoint,
  method,
  headers,
  payload,
  statusCode,
  responseBody,
  success,
  errorMessage,
  createdPostId,
  processingTimeMs,
  ipAddress
}: {
  requestId?: string
  apiKeyId?: string
  endpoint: string
  method: string
  headers: Record<string, any>
  payload: Record<string, any>
  statusCode: number
  responseBody?: Record<string, any>
  success: boolean
  errorMessage?: string
  createdPostId?: string
  processingTimeMs?: number
  ipAddress?: string
}): Promise<void> {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        request_id: requestId,
        api_key_id: apiKeyId,
        endpoint,
        method,
        headers,
        payload,
        status_code: statusCode,
        response_body: responseBody,
        success,
        error_message: errorMessage,
        created_post_id: createdPostId,
        processing_time_ms: processingTimeMs,
        ip_address: ipAddress,
        processed_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging webhook request:', error)
  }
}