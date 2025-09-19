/**
 * Redis-based Rate Limiting Service
 * Production-ready rate limiting for healthcare API endpoints
 */

import { Redis } from 'ioredis';

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private redis: Redis;

  constructor() {
    this.redis = redis;
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is within rate limit
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const key = config.keyGenerator 
        ? config.keyGenerator(identifier)
        : `rate_limit:${identifier}`;

      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, '-inf', windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const currentCount = results[1][1] as number;
      const remaining = Math.max(0, config.maxRequests - currentCount - 1);
      const resetTime = now + config.windowMs;

      return {
        allowed: currentCount < config.maxRequests,
        remaining,
        resetTime,
        retryAfter: currentCount >= config.maxRequests 
          ? Math.ceil((windowStart + config.windowMs - now) / 1000)
          : undefined
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      };
    }
  }

  /**
   * Healthcare API rate limiting configuration
   */
  static getHealthcareRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      keyGenerator: (identifier: string) => `healthcare_api:${identifier}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };
  }

  /**
   * Admin API rate limiting configuration
   */
  static getAdminRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200, // 200 requests per minute for admin
      keyGenerator: (identifier: string) => `admin_api:${identifier}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };
  }

  /**
   * User management API rate limiting configuration
   */
  static getUserManagementRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 requests per minute for user management
      keyGenerator: (identifier: string) => `user_mgmt:${identifier}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(
    handler: (req: any, res: any) => Promise<any>
  ) {
    return async function (req: any, res: any) {
      const rateLimiter = RateLimiter.getInstance();
      
      // Extract identifier (IP address or user ID)
      const identifier = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection?.remoteAddress || 
                        'unknown';

      const rateLimitResult = await rateLimiter.checkRateLimit(identifier, config);

      if (!rateLimitResult.allowed) {
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
        
        if (rateLimitResult.retryAfter) {
          res.setHeader('Retry-After', rateLimitResult.retryAfter);
        }

        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        });
      }

      // Add rate limit headers to successful responses
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

      return handler(req, res);
    };
  };
}
