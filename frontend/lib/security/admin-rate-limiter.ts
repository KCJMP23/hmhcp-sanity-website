/**
 * Comprehensive Admin API Rate Limiting System
 * Implements tiered rate limiting with role-based limits, user-specific controls,
 * and advanced monitoring for healthcare platform security
 */

import { EnhancedRateLimiter, RateLimitConfig, RateLimitResult } from './enhanced-rate-limiter'
import { AdminRole } from '@/lib/dal/admin/types'
import { logger } from '@/lib/logging/client-safe-logger'

// Operation types for categorizing endpoints
export enum OperationType {
  READ = 'read',
  WRITE = 'write', 
  DELETE = 'delete',
  BULK = 'bulk',
  AUTH = 'auth',
  ANALYTICS = 'analytics',
  MEDIA_UPLOAD = 'media_upload',
  EXPORT = 'export',
  SYSTEM = 'system'
}

// Risk levels for different operations
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Rate limiting configuration by operation type and role
interface RoleLimits {
  [AdminRole.SUPER_ADMIN]: RateLimitConfig
  [AdminRole.ADMIN]: RateLimitConfig
  [AdminRole.EDITOR]: RateLimitConfig
  [AdminRole.AUTHOR]: RateLimitConfig
}

// Comprehensive rate limiting rules
const RATE_LIMIT_CONFIGS: Record<OperationType, RoleLimits> = {
  [OperationType.READ]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 2000,
      windowMs: 60000, // 1 minute
      keyGenerator: (id) => `admin:read:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 1500,
      windowMs: 60000,
      keyGenerator: (id) => `admin:read:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 1000,
      windowMs: 60000,
      keyGenerator: (id) => `admin:read:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 500,
      windowMs: 60000,
      keyGenerator: (id) => `admin:read:author:${id}`
    }
  },

  [OperationType.WRITE]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 1000,
      windowMs: 60000,
      blockDurationMs: 300000, // 5 minutes
      keyGenerator: (id) => `admin:write:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 750,
      windowMs: 60000,
      blockDurationMs: 300000,
      keyGenerator: (id) => `admin:write:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 500,
      windowMs: 60000,
      blockDurationMs: 300000,
      keyGenerator: (id) => `admin:write:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 250,
      windowMs: 60000,
      blockDurationMs: 300000,
      keyGenerator: (id) => `admin:write:author:${id}`
    }
  },

  [OperationType.DELETE]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 200,
      windowMs: 60000,
      blockDurationMs: 600000, // 10 minutes
      keyGenerator: (id) => `admin:delete:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 150,
      windowMs: 60000,
      blockDurationMs: 600000,
      keyGenerator: (id) => `admin:delete:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 100,
      windowMs: 60000,
      blockDurationMs: 600000,
      keyGenerator: (id) => `admin:delete:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 50,
      windowMs: 60000,
      blockDurationMs: 600000,
      keyGenerator: (id) => `admin:delete:author:${id}`
    }
  },

  [OperationType.BULK]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 100,
      windowMs: 300000, // 5 minutes
      blockDurationMs: 1800000, // 30 minutes
      keyGenerator: (id) => `admin:bulk:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 75,
      windowMs: 300000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:bulk:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 50,
      windowMs: 300000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:bulk:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 25,
      windowMs: 300000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:bulk:author:${id}`
    }
  },

  [OperationType.AUTH]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 20,
      windowMs: 900000, // 15 minutes
      blockDurationMs: 3600000, // 1 hour
      keyGenerator: (id) => `admin:auth:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 15,
      windowMs: 900000,
      blockDurationMs: 3600000,
      keyGenerator: (id) => `admin:auth:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 10,
      windowMs: 900000,
      blockDurationMs: 3600000,
      keyGenerator: (id) => `admin:auth:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 10,
      windowMs: 900000,
      blockDurationMs: 3600000,
      keyGenerator: (id) => `admin:auth:author:${id}`
    }
  },

  [OperationType.ANALYTICS]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 500,
      windowMs: 60000,
      keyGenerator: (id) => `admin:analytics:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 300,
      windowMs: 60000,
      keyGenerator: (id) => `admin:analytics:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 200,
      windowMs: 60000,
      keyGenerator: (id) => `admin:analytics:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 100,
      windowMs: 60000,
      keyGenerator: (id) => `admin:analytics:author:${id}`
    }
  },

  [OperationType.MEDIA_UPLOAD]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 200,
      windowMs: 300000, // 5 minutes
      blockDurationMs: 900000, // 15 minutes
      keyGenerator: (id) => `admin:media:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 150,
      windowMs: 300000,
      blockDurationMs: 900000,
      keyGenerator: (id) => `admin:media:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 100,
      windowMs: 300000,
      blockDurationMs: 900000,
      keyGenerator: (id) => `admin:media:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 50,
      windowMs: 300000,
      blockDurationMs: 900000,
      keyGenerator: (id) => `admin:media:author:${id}`
    }
  },

  [OperationType.EXPORT]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 50,
      windowMs: 600000, // 10 minutes
      blockDurationMs: 1800000, // 30 minutes
      keyGenerator: (id) => `admin:export:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 30,
      windowMs: 600000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:export:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 20,
      windowMs: 600000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:export:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 10,
      windowMs: 600000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:export:author:${id}`
    }
  },

  [OperationType.SYSTEM]: {
    [AdminRole.SUPER_ADMIN]: {
      maxRequests: 100,
      windowMs: 60000,
      blockDurationMs: 1800000, // 30 minutes
      keyGenerator: (id) => `admin:system:super:${id}`
    },
    [AdminRole.ADMIN]: {
      maxRequests: 50,
      windowMs: 60000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:system:admin:${id}`
    },
    [AdminRole.EDITOR]: {
      maxRequests: 10,
      windowMs: 60000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:system:editor:${id}`
    },
    [AdminRole.AUTHOR]: {
      maxRequests: 5,
      windowMs: 60000,
      blockDurationMs: 1800000,
      keyGenerator: (id) => `admin:system:author:${id}`
    }
  }
}

// IP-based rate limiting for additional security
const IP_RATE_LIMITS: Record<RiskLevel, RateLimitConfig> = {
  [RiskLevel.LOW]: {
    maxRequests: 5000,
    windowMs: 300000, // 5 minutes
    keyGenerator: (ip) => `ip:low:${ip}`
  },
  [RiskLevel.MEDIUM]: {
    maxRequests: 2000,
    windowMs: 300000,
    blockDurationMs: 600000, // 10 minutes
    keyGenerator: (ip) => `ip:medium:${ip}`
  },
  [RiskLevel.HIGH]: {
    maxRequests: 500,
    windowMs: 300000,
    blockDurationMs: 1800000, // 30 minutes
    keyGenerator: (ip) => `ip:high:${ip}`
  },
  [RiskLevel.CRITICAL]: {
    maxRequests: 100,
    windowMs: 300000,
    blockDurationMs: 3600000, // 1 hour
    keyGenerator: (ip) => `ip:critical:${ip}`
  }
}

// Endpoint to operation type mapping
const ENDPOINT_OPERATIONS: Record<string, OperationType> = {
  // Authentication operations
  '/api/admin/auth': OperationType.AUTH,
  
  // Content read operations
  '/api/admin/content': OperationType.READ,
  '/api/admin/blog': OperationType.READ,
  '/api/admin/pages': OperationType.READ,
  '/api/admin/team': OperationType.READ,
  '/api/admin/platforms': OperationType.READ,
  '/api/admin/services': OperationType.READ,
  '/api/admin/publications': OperationType.READ,
  '/api/admin/categories': OperationType.READ,
  '/api/admin/tags': OperationType.READ,
  '/api/admin/comments': OperationType.READ,
  '/api/admin/users': OperationType.READ,
  '/api/admin/dashboard': OperationType.READ,
  '/api/admin/navigation': OperationType.READ,
  
  // Analytics operations
  '/api/admin/analytics': OperationType.ANALYTICS,
  '/api/admin/reports': OperationType.ANALYTICS,
  '/api/admin/performance': OperationType.ANALYTICS,
  
  // Bulk operations
  '/api/admin/bulk': OperationType.BULK,
  '/api/admin/export': OperationType.EXPORT,
  
  // Media operations
  '/api/admin/media': OperationType.MEDIA_UPLOAD,
  '/api/admin/blog/upload-image': OperationType.MEDIA_UPLOAD,
  '/api/admin/team/upload': OperationType.MEDIA_UPLOAD,
  
  // System operations
  '/api/admin/database': OperationType.SYSTEM,
  '/api/admin/backup': OperationType.SYSTEM,
  '/api/admin/security': OperationType.SYSTEM,
  '/api/admin/audit': OperationType.SYSTEM,
  '/api/admin/disaster-recovery': OperationType.SYSTEM,
  '/api/admin/agents': OperationType.SYSTEM,
  '/api/admin/ai': OperationType.SYSTEM,
  '/api/admin/make': OperationType.SYSTEM,
  '/api/admin/scheduling': OperationType.SYSTEM,
  '/api/admin/workflow': OperationType.SYSTEM,
  
  // Settings operations
  '/api/admin/settings': OperationType.WRITE,
  '/api/admin/profile': OperationType.WRITE,
  '/api/admin/roles': OperationType.WRITE,
  '/api/admin/groups': OperationType.WRITE,
  '/api/admin/subscriptions': OperationType.WRITE,
  '/api/admin/email': OperationType.WRITE,
  '/api/admin/seo': OperationType.WRITE,
  '/api/admin/social': OperationType.WRITE,
  '/api/admin/homepage': OperationType.WRITE,
  '/api/admin/cms': OperationType.WRITE,
  
  // Healthcare operations
  '/api/admin/healthcare': OperationType.READ,
  '/api/admin/research': OperationType.READ
}

// Endpoint to risk level mapping
const ENDPOINT_RISK_LEVELS: Record<string, RiskLevel> = {
  '/api/admin/auth': RiskLevel.CRITICAL,
  '/api/admin/database': RiskLevel.CRITICAL,
  '/api/admin/backup': RiskLevel.CRITICAL,
  '/api/admin/disaster-recovery': RiskLevel.CRITICAL,
  '/api/admin/security': RiskLevel.CRITICAL,
  '/api/admin/audit': RiskLevel.HIGH,
  '/api/admin/bulk': RiskLevel.HIGH,
  '/api/admin/export': RiskLevel.HIGH,
  '/api/admin/users': RiskLevel.HIGH,
  '/api/admin/roles': RiskLevel.HIGH,
  '/api/admin/agents': RiskLevel.MEDIUM,
  '/api/admin/ai': RiskLevel.MEDIUM,
  '/api/admin/media': RiskLevel.MEDIUM,
  '/api/admin/analytics': RiskLevel.LOW,
  '/api/admin/content': RiskLevel.LOW,
  '/api/admin/blog': RiskLevel.LOW,
  '/api/admin/pages': RiskLevel.LOW
}

/**
 * Comprehensive Admin Rate Limiter Manager
 */
export class AdminRateLimiterManager {
  private rateLimiters: Map<string, EnhancedRateLimiter> = new Map()
  private ipLimiters: Map<string, EnhancedRateLimiter> = new Map()
  private metrics: Map<string, RateLimitMetrics> = new Map()

  constructor() {
    this.initializeRateLimiters()
  }

  private initializeRateLimiters(): void {
    // Initialize user-based rate limiters
    for (const [operation, roleLimits] of Object.entries(RATE_LIMIT_CONFIGS)) {
      for (const [role, config] of Object.entries(roleLimits)) {
        const key = `${operation}:${role}`
        this.rateLimiters.set(key, new EnhancedRateLimiter(config))
      }
    }

    // Initialize IP-based rate limiters
    for (const [riskLevel, config] of Object.entries(IP_RATE_LIMITS)) {
      this.ipLimiters.set(riskLevel, new EnhancedRateLimiter(config))
    }

    logger.info('Admin rate limiters initialized', {
      userLimiters: this.rateLimiters.size,
      ipLimiters: this.ipLimiters.size
    })
  }

  /**
   * Determine operation type from endpoint path
   */
  private determineOperationType(path: string, method: string): OperationType {
    // Check for exact matches first
    for (const [endpoint, operation] of Object.entries(ENDPOINT_OPERATIONS)) {
      if (path.startsWith(endpoint)) {
        // For write operations, check the HTTP method
        if (operation === OperationType.READ && ['POST', 'PUT', 'PATCH'].includes(method)) {
          return OperationType.WRITE
        }
        if (operation === OperationType.READ && method === 'DELETE') {
          return OperationType.DELETE
        }
        return operation
      }
    }

    // Fallback based on HTTP method
    switch (method) {
      case 'GET': return OperationType.READ
      case 'POST': return OperationType.WRITE
      case 'PUT':
      case 'PATCH': return OperationType.WRITE
      case 'DELETE': return OperationType.DELETE
      default: return OperationType.SYSTEM
    }
  }

  /**
   * Determine risk level from endpoint path
   */
  private determineRiskLevel(path: string): RiskLevel {
    for (const [endpoint, riskLevel] of Object.entries(ENDPOINT_RISK_LEVELS)) {
      if (path.startsWith(endpoint)) {
        return riskLevel
      }
    }
    return RiskLevel.LOW
  }

  /**
   * Check rate limits for a user request
   */
  async checkUserRateLimit(
    userId: string,
    role: AdminRole,
    path: string,
    method: string
  ): Promise<RateLimitResult> {
    const operationType = this.determineOperationType(path, method)
    const key = `${operationType}:${role}`
    
    const limiter = this.rateLimiters.get(key)
    if (!limiter) {
      logger.error('Rate limiter not found', { key, operationType, role })
      return {
        success: true,
        limit: 1000,
        remaining: 1000,
        resetTime: Date.now() + 60000
      }
    }

    const result = limiter.checkLimit(userId)
    
    // Update metrics
    this.updateMetrics(userId, operationType, role, result)
    
    return result
  }

  /**
   * Check IP-based rate limits
   */
  async checkIPRateLimit(ip: string, path: string): Promise<RateLimitResult> {
    const riskLevel = this.determineRiskLevel(path)
    const limiter = this.ipLimiters.get(riskLevel)
    
    if (!limiter) {
      logger.error('IP rate limiter not found', { riskLevel })
      return {
        success: true,
        limit: 1000,
        remaining: 1000,
        resetTime: Date.now() + 60000
      }
    }

    const result = limiter.checkLimit(ip)
    
    // Log IP rate limiting events
    if (!result.success) {
      logger.warn('IP rate limit exceeded', {
        ip,
        path,
        riskLevel,
        limit: result.limit,
        remaining: result.remaining
      })
    }
    
    return result
  }

  /**
   * Update rate limiting metrics
   */
  private updateMetrics(
    userId: string,
    operation: OperationType,
    role: AdminRole,
    result: RateLimitResult
  ): void {
    const key = `${operation}:${role}`
    const existing = this.metrics.get(key) || {
      totalRequests: 0,
      blockedRequests: 0,
      lastUpdate: Date.now()
    }

    existing.totalRequests += 1
    if (!result.success) {
      existing.blockedRequests += 1
    }
    existing.lastUpdate = Date.now()

    this.metrics.set(key, existing)
  }

  /**
   * Get rate limiting metrics
   */
  getMetrics(): Record<string, RateLimitMetrics> {
    return Object.fromEntries(this.metrics.entries())
  }

  /**
   * Reset rate limits for a user (emergency function)
   */
  resetUserLimits(userId: string, role: AdminRole): void {
    for (const operation of Object.values(OperationType)) {
      const key = `${operation}:${role}`
      const limiter = this.rateLimiters.get(key)
      if (limiter) {
        limiter.reset(userId)
      }
    }
    
    logger.warn('User rate limits reset', { userId, role })
  }

  /**
   * Block a user across all operations (security function)
   */
  blockUser(userId: string, role: AdminRole, durationMs: number = 3600000): void {
    for (const operation of Object.values(OperationType)) {
      const key = `${operation}:${role}`
      const limiter = this.rateLimiters.get(key)
      if (limiter) {
        limiter.block(userId, durationMs)
      }
    }
    
    logger.warn('User blocked across all operations', { userId, role, durationMs })
  }

  /**
   * Block an IP address (security function)
   */
  blockIP(ip: string, durationMs: number = 3600000): void {
    for (const limiter of this.ipLimiters.values()) {
      limiter.block(ip, durationMs)
    }
    
    logger.warn('IP address blocked across all risk levels', { ip, durationMs })
  }

  /**
   * Check if user should be automatically blocked based on patterns
   */
  shouldBlockUser(userId: string): boolean {
    const userMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.includes(userId))
      .map(([, metrics]) => metrics)

    if (userMetrics.length === 0) return false

    const totalBlocked = userMetrics.reduce((sum, m) => sum + m.blockedRequests, 0)
    const totalRequests = userMetrics.reduce((sum, m) => sum + m.totalRequests, 0)

    // Block if more than 50% of recent requests were blocked
    return totalRequests > 10 && (totalBlocked / totalRequests) > 0.5
  }
}

// Rate limiting metrics interface
interface RateLimitMetrics {
  totalRequests: number
  blockedRequests: number
  lastUpdate: number
}

// Global admin rate limiter instance - lazy initialization
let _adminRateLimiter: AdminRateLimiterManager | null = null

export const adminRateLimiter = {
  get instance(): AdminRateLimiterManager {
    if (!_adminRateLimiter) {
      _adminRateLimiter = new AdminRateLimiterManager()
    }
    return _adminRateLimiter
  },
  
  checkUserRateLimit: (...args: Parameters<AdminRateLimiterManager['checkUserRateLimit']>) => {
    return adminRateLimiter.instance.checkUserRateLimit(...args)
  },
  
  checkIPRateLimit: (...args: Parameters<AdminRateLimiterManager['checkIPRateLimit']>) => {
    return adminRateLimiter.instance.checkIPRateLimit(...args)
  },
  
  getMetrics: () => {
    return adminRateLimiter.instance.getMetrics()
  },
  
  resetUserLimits: (...args: Parameters<AdminRateLimiterManager['resetUserLimits']>) => {
    return adminRateLimiter.instance.resetUserLimits(...args)
  },
  
  blockUser: (...args: Parameters<AdminRateLimiterManager['blockUser']>) => {
    return adminRateLimiter.instance.blockUser(...args)
  },
  
  blockIP: (...args: Parameters<AdminRateLimiterManager['blockIP']>) => {
    return adminRateLimiter.instance.blockIP(...args)
  },
  
  shouldBlockUser: (...args: Parameters<AdminRateLimiterManager['shouldBlockUser']>) => {
    return adminRateLimiter.instance.shouldBlockUser(...args)
  }
}

// Export types and utilities
export { ENDPOINT_OPERATIONS, ENDPOINT_RISK_LEVELS }
export type { RateLimitMetrics }