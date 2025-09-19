import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis client
const redis = process.env.REDIS_URL
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN || ''
    })
  : null

// Create rate limiters for different tiers
const rateLimiters = {
  standard: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
        analytics: true,
        prefix: 'webhook:standard'
      })
    : null,
  premium: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(500, '1 m'), // 500 requests per minute
        analytics: true,
        prefix: 'webhook:premium'
      })
    : null,
  enterprise: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2000, '1 m'), // 2000 requests per minute
        analytics: true,
        prefix: 'webhook:enterprise'
      })
    : null
}

// In-memory rate limiter as fallback
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(limit: number, windowMs: number) {
    this.maxRequests = limit
    this.windowMs = windowMs
  }

  async limit(identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: Date
  }> {
    const now = Date.now()
    const key = identifier
    const record = this.requests.get(key)

    if (!record || now > record.resetAt) {
      // Create new window
      const resetAt = now + this.windowMs
      this.requests.set(key, { count: 1, resetAt })
      
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: new Date(resetAt)
      }
    }

    if (record.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: new Date(record.resetAt)
      }
    }

    // Increment counter
    record.count++
    this.requests.set(key, record)

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      reset: new Date(record.resetAt)
    }
  }

  // Clean up old entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key)
      }
    }
  }
}

// Fallback rate limiters
const inMemoryLimiters = {
  standard: new InMemoryRateLimiter(100, 60000),
  premium: new InMemoryRateLimiter(500, 60000),
  enterprise: new InMemoryRateLimiter(2000, 60000)
}

// Clean up in-memory limiters periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    inMemoryLimiters.standard.cleanup()
    inMemoryLimiters.premium.cleanup()
    inMemoryLimiters.enterprise.cleanup()
  }, 60000) // Clean up every minute
}

export type RateLimitTier = 'standard' | 'premium' | 'enterprise'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  tier: RateLimitTier
}

/**
 * Check rate limit for an identifier
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'standard'
): Promise<RateLimitResult> {
  try {
    // Try Redis rate limiter first
    const limiter = rateLimiters[tier]
    if (limiter) {
      const result = await limiter.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
        tier
      }
    }
  } catch (error) {
    console.warn('[Rate Limiter] Redis error, falling back to in-memory:', error)
  }

  // Fallback to in-memory rate limiter
  const inMemoryLimiter = inMemoryLimiters[tier]
  const result = await inMemoryLimiter.limit(identifier)
  
  return {
    ...result,
    tier
  }
}

/**
 * Get rate limit tier based on API key or subscription
 */
export function getRateLimitTier(apiKey?: string, subscription?: any): RateLimitTier {
  // Determine tier based on subscription or API key prefix
  if (subscription?.plan === 'enterprise') {
    return 'enterprise'
  }
  
  if (subscription?.plan === 'premium' || apiKey?.includes('_premium_')) {
    return 'premium'
  }
  
  return 'standard'
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export async function rateLimitMiddleware(
  request: Request,
  options: {
    identifier?: string
    tier?: RateLimitTier
    bypassForAdmin?: boolean
  } = {}
): Promise<RateLimitResult | null> {
  // Extract identifier (API key, IP, or user ID)
  const identifier = options.identifier || 
    request.headers.get('x-api-key') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'anonymous'

  // Check if admin bypass is enabled
  if (options.bypassForAdmin) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.includes('admin')) {
      return null // Bypass rate limiting for admins
    }
  }

  // Determine tier
  const tier = options.tier || getRateLimitTier(identifier)

  // Check rate limit
  const result = await checkRateLimit(identifier, tier)

  // Add rate limit headers to response
  if (!result.success) {
    console.log(`[Rate Limiter] Limit exceeded for ${identifier} (${tier})`)
  }

  return result
}

/**
 * Format rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    'X-RateLimit-Tier': result.tier
  }
}

// Export functions for backward compatibility
export const rateLimit = checkRateLimit;