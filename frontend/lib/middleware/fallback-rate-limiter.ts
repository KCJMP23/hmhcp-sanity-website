/**
 * Fallback Rate Limiter for when Redis is unavailable
 * Uses in-memory storage with automatic cleanup
 */

import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from './error-handling'

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // 5 minutes

export interface FallbackRateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
  message?: string
}

/**
 * Simple in-memory rate limiting
 */
export function fallbackRateLimit(
  request: NextRequest,
  config: FallbackRateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = config.keyGenerator ? config.keyGenerator(request) : getDefaultKey(request)
  
  let entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      firstRequest: now
    }
  }
  
  entry.count++
  rateLimitStore.set(key, entry)
  
  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime
  }
}

/**
 * Rate limiting middleware with fallback
 */
export function withFallbackRateLimit(
  config: FallbackRateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { allowed, remaining, resetTime } = fallbackRateLimit(request, config)
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      
      const response = createErrorResponse(
        request,
        config.message || 'Too many requests',
        429,
        { 
          retryAfter,
          remaining,
          resetTime
        },
        'RATE_LIMIT_EXCEEDED'
      )

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', resetTime.toString())
      response.headers.set('Retry-After', retryAfter.toString())

      return response
    }
    
    // Add rate limit headers to successful response
    const response = await handler(request)
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', resetTime.toString())
    
    return response
  }
}

function getDefaultKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown'
  return `fallback_rate_limit:${ip}`
}

export default withFallbackRateLimit