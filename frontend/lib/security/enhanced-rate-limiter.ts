// Lightweight TTL cache to avoid external dependencies in serverless builds
class SimpleTTLCache<K, V> {
  private store: Map<K, { value: V; expiresAt: number | null }>
  private readonly max: number
  private readonly ttl: number | undefined

  constructor(options: { max: number; ttl?: number }) {
    this.store = new Map()
    this.max = options.max
    this.ttl = options.ttl
  }

  private evictIfNeeded(): void {
    if (this.store.size <= this.max) return
    // Evict oldest entries
    const numToEvict = this.store.size - this.max
    let removed = 0
    for (const key of this.store.keys()) {
      this.store.delete(key)
      removed++
      if (removed >= numToEvict) break
    }
  }

  private isExpired(entry: { value: V; expiresAt: number | null }): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (this.isExpired(entry)) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: K, value: V): void {
    const expiresAt = this.ttl ? Date.now() + this.ttl : null
    this.store.set(key, { value, expiresAt })
    this.evictIfNeeded()
  }

  delete(key: K): void {
    this.store.delete(key)
  }
}

/**
 * Enhanced rate limiter with multiple strategies
 */
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  blockDurationMs?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (identifier: string) => string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Token bucket implementation for smooth rate limiting
 */
class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number

  constructor(maxTokens: number, refillRateMs: number) {
    this.maxTokens = maxTokens
    this.tokens = maxTokens
    this.refillRate = refillRateMs
    this.lastRefill = Date.now()
  }

  consume(tokens: number = 1): boolean {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    
    return false
  }

  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = Math.floor(timePassed / this.refillRate)
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }

  getTokens(): number {
    this.refill()
    return this.tokens
  }

  getResetTime(): number {
    const tokensNeeded = this.maxTokens - this.tokens
    return Date.now() + (tokensNeeded * this.refillRate)
  }
}

/**
 * Enhanced rate limiter with multiple strategies
 */
export class EnhancedRateLimiter {
  private readonly windowCache: SimpleTTLCache<string, number[]>
  private readonly tokenBuckets: SimpleTTLCache<string, TokenBucket>
  private readonly blockedUntil: SimpleTTLCache<string, number>
  
  constructor(
    private readonly config: RateLimitConfig
  ) {
    // Sliding window cache
    this.windowCache = new SimpleTTLCache<string, number[]>({ max: 10000, ttl: config.windowMs })
    
    // Token bucket cache
    this.tokenBuckets = new SimpleTTLCache<string, TokenBucket>({ max: 10000, ttl: config.windowMs * 2 })
    
    // Blocked IPs cache
    this.blockedUntil = new SimpleTTLCache<string, number>({ max: 1000, ttl: config.blockDurationMs || 300000 })
  }

  /**
   * Check rate limit using sliding window algorithm
   */
  checkLimit(identifier: string, weight: number = 1): RateLimitResult {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    const now = Date.now()
    
    // Check if blocked
    const blockExpiry = this.blockedUntil.get(key)
    if (blockExpiry && blockExpiry > now) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: blockExpiry,
        retryAfter: Math.ceil((blockExpiry - now) / 1000)
      }
    }
    
    // Get or create request history
    let requests = this.windowCache.get(key) || []
    
    // Remove old requests outside the window
    const windowStart = now - this.config.windowMs
    requests = requests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (requests.length >= this.config.maxRequests) {
      // Block if configured
      if (this.config.blockDurationMs) {
        const blockUntil = now + this.config.blockDurationMs
        this.blockedUntil.set(key, blockUntil)
        
        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime: blockUntil,
          retryAfter: Math.ceil(this.config.blockDurationMs / 1000)
        }
      }
      
      const oldestRequest = Math.min(...requests)
      const resetTime = oldestRequest + this.config.windowMs
      
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      }
    }
    
    // Add current request
    for (let i = 0; i < weight; i++) {
      requests.push(now)
    }
    this.windowCache.set(key, requests)
    
    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - requests.length),
      resetTime: now + this.config.windowMs
    }
  }

  /**
   * Check rate limit using token bucket algorithm
   */
  checkTokenBucket(identifier: string, tokens: number = 1): RateLimitResult {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    
    // Get or create token bucket
    let bucket = this.tokenBuckets.get(key)
    if (!bucket) {
      const refillRate = this.config.windowMs / this.config.maxRequests
      bucket = new TokenBucket(this.config.maxRequests, refillRate)
      this.tokenBuckets.set(key, bucket)
    }
    
    const success = bucket.consume(tokens)
    const remaining = bucket.getTokens()
    const resetTime = bucket.getResetTime()
    
    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
      retryAfter: success ? undefined : Math.ceil((resetTime - Date.now()) / 1000)
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    this.windowCache.delete(key)
    this.tokenBuckets.delete(key)
    this.blockedUntil.delete(key)
  }

  /**
   * Check if identifier is currently blocked
   */
  isBlocked(identifier: string): boolean {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    const blockExpiry = this.blockedUntil.get(key)
    return blockExpiry !== undefined && blockExpiry > Date.now()
  }

  /**
   * Manually block an identifier
   */
  block(identifier: string, durationMs?: number): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    const duration = durationMs || this.config.blockDurationMs || 300000
    this.blockedUntil.set(key, Date.now() + duration)
  }

  /**
   * Unblock an identifier
   */
  unblock(identifier: string): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    this.blockedUntil.delete(key)
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // Strict limit for authentication endpoints
  auth: new EnhancedRateLimiter({
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000, // 5 minutes
    keyGenerator: (ip) => `auth:${ip}`
  }),
  
  // API endpoints general limit
  api: new EnhancedRateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    keyGenerator: (ip) => `api:${ip}`
  }),
  
  // Contact form limit
  contact: new EnhancedRateLimiter({
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
    blockDurationMs: 3600000, // 1 hour
    keyGenerator: (ip) => `contact:${ip}`
  }),
  
  // Password reset limit
  passwordReset: new EnhancedRateLimiter({
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
    blockDurationMs: 3600000, // 1 hour
    keyGenerator: (email) => `reset:${email}`
  }),
  
  // Heavy operations limit
  heavy: new EnhancedRateLimiter({
    maxRequests: 10,
    windowMs: 300000, // 5 minutes
    keyGenerator: (ip) => `heavy:${ip}`
  })
}

/**
 * Middleware helper for rate limiting
 */
export async function withRateLimit(
  request: Request,
  limiter: EnhancedRateLimiter,
  identifier?: string
): Promise<RateLimitResult> {
  const id = identifier || 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  
  return limiter.checkLimit(id)
}