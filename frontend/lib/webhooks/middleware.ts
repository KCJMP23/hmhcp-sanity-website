import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateApiKey } from '@/lib/api-keys'
import { rateLimitMiddleware, getRateLimitHeaders } from './rate-limiter'
import { generateDedupeKey, isDuplicateRequest, markRequestProcessed, isTimestampValid } from './deduplication'
import { logWebhookRequest } from '@/lib/api-keys'

export interface ValidationResult {
  valid: boolean
  data?: any
  apiKeyId?: string
  error?: string
  statusCode?: number
  response?: NextResponse
}

/**
 * Extract API key from request headers
 */
function extractApiKey(request: NextRequest): string | null {
  const apiKey = request.headers.get('x-api-key') || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  return apiKey
}

/**
 * Parse webhook payload from request
 */
async function parsePayload(request: NextRequest): Promise<any> {
  const contentType = request.headers.get('content-type') || ''
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData()
    const payloadField = formData.get('payload')
    return payloadField ? JSON.parse(payloadField as string) : Object.fromEntries(formData)
  }
  
  return request.json()
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  error: string,
  statusCode: number,
  details?: any
): NextResponse {
  return NextResponse.json(
    { 
      error,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    },
    { status: statusCode }
  )
}

/**
 * Webhook validation middleware
 */
export function webhookValidationMiddleware(
  schema: z.ZodSchema,
  options: {
    requireTimestamp?: boolean
    timestampTolerance?: number
    allowDuplicates?: boolean
    deduplicationTTL?: number
    maxPayloadSize?: number
  } = {}
) {
  return async (request: NextRequest): Promise<ValidationResult> => {
    const startTime = Date.now()
    let apiKeyId: string | undefined
    
    try {
      // 1. Check payload size limit
      if (options.maxPayloadSize) {
        const contentLength = request.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > options.maxPayloadSize) {
          return {
            valid: false,
            error: 'Payload too large',
            statusCode: 413,
            response: createErrorResponse('Payload too large', 413)
          }
        }
      }
      
      // 2. Extract and validate API key
      const apiKey = extractApiKey(request)
      if (!apiKey) {
        await logWebhookRequest({
          endpoint: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          payload: {},
          statusCode: 401,
          success: false,
          errorMessage: 'No API key provided',
          processingTimeMs: Date.now() - startTime
        })
        
        return {
          valid: false,
          error: 'API key required',
          statusCode: 401,
          response: createErrorResponse('API key required', 401)
        }
      }
      
      // 3. Validate API key
      const validation = await validateApiKey(apiKey)
      if (!validation.isValid) {
        const statusCode = validation.error === 'Rate limit exceeded' ? 429 : 401
        
        await logWebhookRequest({
          apiKeyId: validation.apiKeyId,
          endpoint: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          payload: {},
          statusCode,
          success: false,
          errorMessage: validation.error,
          processingTimeMs: Date.now() - startTime
        })
        
        const response = NextResponse.json(
          { 
            error: validation.error,
            ...(validation.error === 'Rate limit exceeded' && {
              rateLimit: validation.rateLimit,
              currentUsage: validation.currentUsage,
              resetAt: new Date(Date.now() + 60000).toISOString()
            })
          },
          { status: statusCode }
        )
        
        if (validation.error === 'Rate limit exceeded') {
          const rateLimitHeaders = getRateLimitHeaders({
            success: false,
            limit: validation.rateLimit || 100,
            remaining: 0,
            reset: new Date(Date.now() + 60000),
            tier: 'standard'
          })
          
          Object.entries(rateLimitHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        }
        
        return {
          valid: false,
          error: validation.error,
          statusCode,
          response
        }
      }
      
      apiKeyId = validation.apiKeyId
      
      // 4. Check rate limiting
      const rateLimitResult = await rateLimitMiddleware(request, {
        identifier: apiKeyId,
        bypassForAdmin: false
      })
      
      if (rateLimitResult && !rateLimitResult.success) {
        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests, please try again later',
            resetAt: rateLimitResult.reset.toISOString()
          },
          { status: 429 }
        )
        
        const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
        
        return {
          valid: false,
          error: 'Rate limit exceeded',
          statusCode: 429,
          response
        }
      }
      
      // 5. Parse payload
      const payload = await parsePayload(request)
      
      // 6. Check timestamp validity (replay attack prevention)
      if (options.requireTimestamp) {
        const timestamp = request.headers.get('x-webhook-timestamp') || 
                         payload.timestamp
        
        if (!timestamp || !isTimestampValid(timestamp, options.timestampTolerance)) {
          return {
            valid: false,
            error: 'Invalid or expired timestamp',
            statusCode: 400,
            response: createErrorResponse('Invalid or expired timestamp', 400)
          }
        }
      }
      
      // 7. Check for duplicate requests
      if (!options.allowDuplicates) {
        const requestId = request.headers.get('x-request-id') || 
                         request.headers.get('x-webhook-id')
        
        const dedupeKey = generateDedupeKey(requestId, payload, apiKeyId)
        const isDuplicate = await isDuplicateRequest(dedupeKey, options.deduplicationTTL)
        
        if (isDuplicate) {
          return {
            valid: false,
            error: 'Duplicate request',
            statusCode: 200, // Return 200 to prevent retries
            response: NextResponse.json({
              message: 'Request already processed',
              duplicate: true
            }, { status: 200 })
          }
        }
        
        // Mark as processed
        await markRequestProcessed(dedupeKey, options.deduplicationTTL)
      }
      
      // 8. Validate schema
      const validationResult = schema.safeParse(payload)
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        
        await logWebhookRequest({
          apiKeyId,
          endpoint: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          payload,
          statusCode: 400,
          success: false,
          errorMessage: `Validation failed: ${errors.map(e => e.message).join(', ')}`,
          processingTimeMs: Date.now() - startTime
        })
        
        return {
          valid: false,
          error: 'Validation failed',
          statusCode: 400,
          response: createErrorResponse('Validation failed', 400, errors)
        }
      }
      
      // Success - return validated data
      return {
        valid: true,
        data: validationResult.data,
        apiKeyId
      }
      
    } catch (error) {
      console.error('[Webhook Middleware Error]:', error)
      
      return {
        valid: false,
        error: 'Internal server error',
        statusCode: 500,
        response: createErrorResponse('Internal server error', 500)
      }
    }
  }
}