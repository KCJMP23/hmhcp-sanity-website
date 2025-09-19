/**
 * Rate Limiter for RBAC Permission Checks
 * Story 3.4: User Management & Role-Based Access Control
 */

import { cache } from '@/lib/cache/redis-cache';
import { RBAC_RATE_LIMITS } from './rbac-config';
import logger from '@/lib/logging/winston-logger';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export class RBACRateLimiter {
  private static instance: RBACRateLimiter;

  private constructor() {}

  public static getInstance(): RBACRateLimiter {
    if (!RBACRateLimiter.instance) {
      RBACRateLimiter.instance = new RBACRateLimiter();
    }
    return RBACRateLimiter.instance;
  }

  /**
   * Check if a permission check is allowed based on rate limits
   */
  async checkPermissionRateLimit(userId: string): Promise<RateLimitResult> {
    const key = `rate_limit:permission:${userId}`;
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = RBAC_RATE_LIMITS.PERMISSION_CHECKS_PER_MINUTE;

    try {
      // Get current window data
      const windowData = await cache.get(key);
      const now = Date.now();
      
      if (!windowData) {
        // First request in window
        await cache.set(key, JSON.stringify({
          count: 1,
          windowStart: now
        }), 60); // Expire after 1 minute

        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: new Date(now + windowMs)
        };
      }

      const data = JSON.parse(windowData);
      const windowAge = now - data.windowStart;

      if (windowAge > windowMs) {
        // Window has expired, start new window
        await cache.set(key, JSON.stringify({
          count: 1,
          windowStart: now
        }), 60);

        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: new Date(now + windowMs)
        };
      }

      // Check if limit exceeded
      if (data.count >= maxRequests) {
        const resetAt = new Date(data.windowStart + windowMs);
        
        logger.warn('Permission check rate limit exceeded', {
          userId,
          count: data.count,
          maxRequests,
          resetAt
        });

        return {
          allowed: false,
          remaining: 0,
          resetAt
        };
      }

      // Increment counter
      data.count++;
      const ttl = Math.ceil((windowMs - windowAge) / 1000);
      await cache.set(key, JSON.stringify(data), ttl);

      return {
        allowed: true,
        remaining: maxRequests - data.count,
        resetAt: new Date(data.windowStart + windowMs)
      };
    } catch (error) {
      // On error, allow the request but log the issue
      logger.error('Rate limiter error', { error, userId });
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowMs)
      };
    }
  }

  /**
   * Check rate limit for API key
   */
  async checkApiKeyRateLimit(apiKey: string, customLimit?: number): Promise<RateLimitResult> {
    const key = `rate_limit:api_key:${apiKey}`;
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = customLimit || RBAC_RATE_LIMITS.API_KEY_DEFAULT_RATE_LIMIT;

    try {
      const windowData = await cache.get(key);
      const now = Date.now();
      
      if (!windowData) {
        await cache.set(key, JSON.stringify({
          count: 1,
          windowStart: now
        }), 60);

        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: new Date(now + windowMs)
        };
      }

      const data = JSON.parse(windowData);
      const windowAge = now - data.windowStart;

      if (windowAge > windowMs) {
        await cache.set(key, JSON.stringify({
          count: 1,
          windowStart: now
        }), 60);

        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: new Date(now + windowMs)
        };
      }

      if (data.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(data.windowStart + windowMs)
        };
      }

      data.count++;
      const ttl = Math.ceil((windowMs - windowAge) / 1000);
      await cache.set(key, JSON.stringify(data), ttl);

      return {
        allowed: true,
        remaining: maxRequests - data.count,
        resetAt: new Date(data.windowStart + windowMs)
      };
    } catch (error) {
      logger.error('API key rate limiter error', { error, apiKey });
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowMs)
      };
    }
  }

  /**
   * Track failed login attempts
   */
  async trackFailedLogin(email: string): Promise<{ locked: boolean; attemptsRemaining: number }> {
    const key = `login_attempts:${email}`;
    const maxAttempts = RBAC_RATE_LIMITS.MAX_LOGIN_ATTEMPTS;
    const lockDurationMs = RBAC_RATE_LIMITS.LOCK_DURATION_MINUTES * 60 * 1000;

    try {
      const data = await cache.get(key);
      
      if (!data) {
        // First failed attempt
        await cache.set(key, JSON.stringify({
          attempts: 1,
          firstAttempt: Date.now()
        }), RBAC_RATE_LIMITS.LOCK_DURATION_MINUTES * 60);

        return {
          locked: false,
          attemptsRemaining: maxAttempts - 1
        };
      }

      const attemptData = JSON.parse(data);
      attemptData.attempts++;

      if (attemptData.attempts >= maxAttempts) {
        // Lock the account
        await cache.set(key, JSON.stringify({
          ...attemptData,
          locked: true,
          lockedUntil: Date.now() + lockDurationMs
        }), RBAC_RATE_LIMITS.LOCK_DURATION_MINUTES * 60);

        logger.warn('Account locked due to failed login attempts', {
          email,
          attempts: attemptData.attempts
        });

        return {
          locked: true,
          attemptsRemaining: 0
        };
      }

      // Update attempt count
      const ttl = Math.ceil((lockDurationMs - (Date.now() - attemptData.firstAttempt)) / 1000);
      await cache.set(key, JSON.stringify(attemptData), ttl);

      return {
        locked: false,
        attemptsRemaining: maxAttempts - attemptData.attempts
      };
    } catch (error) {
      logger.error('Failed login tracking error', { error, email });
      return {
        locked: false,
        attemptsRemaining: maxAttempts
      };
    }
  }

  /**
   * Clear failed login attempts after successful login
   */
  async clearFailedLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    try {
      await cache.del(key);
    } catch (error) {
      logger.error('Failed to clear login attempts', { error, email });
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const key = `login_attempts:${email}`;
    try {
      const data = await cache.get(key);
      if (!data) return false;

      const attemptData = JSON.parse(data);
      if (!attemptData.locked) return false;

      // Check if lock has expired
      if (attemptData.lockedUntil && Date.now() > attemptData.lockedUntil) {
        await cache.del(key);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check account lock status', { error, email });
      return false;
    }
  }
}

// Export singleton instance
export const rbacRateLimiter = RBACRateLimiter.getInstance();