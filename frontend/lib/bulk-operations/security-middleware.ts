// Security Middleware for Bulk Operations
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal/supabase-auth'
import logger from '@/lib/logging/winston-logger'
import { bulkAuditLogger } from './audit-logger'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface SecurityConfig {
  maxItemsPerOperation: number
  maxConcurrentOperations: number
  rateLimitWindow: number // minutes
  rateLimitMax: number // max requests per window
  requiredRoles: string[]
  allowedActions: string[]
  ipWhitelist?: string[]
  requireMFA?: boolean
}

export const BULK_SECURITY_CONFIGS: Record<string, SecurityConfig> = {
  // Posts operations
  'bulk_posts': {
    maxItemsPerOperation: 1000,
    maxConcurrentOperations: 3,
    rateLimitWindow: 10, // 10 minutes
    rateLimitMax: 20, // 20 operations per 10 minutes
    requiredRoles: ['super_admin', 'admin', 'editor'],
    allowedActions: ['publish', 'unpublish', 'archive', 'delete', 'update', 'duplicate']
  },
  
  // Pages operations - more restricted
  'bulk_pages': {
    maxItemsPerOperation: 500,
    maxConcurrentOperations: 2,
    rateLimitWindow: 15,
    rateLimitMax: 10,
    requiredRoles: ['super_admin', 'admin'],
    allowedActions: ['publish', 'unpublish', 'archive', 'delete', 'update', 'duplicate']
  },
  
  // User operations - highly restricted
  'bulk_users': {
    maxItemsPerOperation: 100,
    maxConcurrentOperations: 1,
    rateLimitWindow: 30,
    rateLimitMax: 5,
    requiredRoles: ['super_admin', 'admin'],
    allowedActions: ['activate', 'deactivate', 'change_role', 'delete'],
    requireMFA: true
  },
  
  // Media operations
  'bulk_media': {
    maxItemsPerOperation: 2000,
    maxConcurrentOperations: 2,
    rateLimitWindow: 10,
    rateLimitMax: 15,
    requiredRoles: ['super_admin', 'admin', 'editor', 'author'],
    allowedActions: ['delete', 'optimize', 'move', 'tag']
  },
  
  // Categories/Tags - moderate restrictions
  'bulk_categories': {
    maxItemsPerOperation: 200,
    maxConcurrentOperations: 2,
    rateLimitWindow: 5,
    rateLimitMax: 30,
    requiredRoles: ['super_admin', 'admin', 'editor'],
    allowedActions: ['merge', 'delete', 'rename', 'move']
  }
}

export interface SecurityValidationResult {
  allowed: boolean
  error?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  restrictions?: string[]
}

export class BulkSecurityValidator {
  /**
   * Comprehensive security validation for bulk operations
   */
  static async validateBulkOperation(
    request: NextRequest,
    operationType: string,
    action: string,
    itemIds: string[],
    options: any = {}
  ): Promise<SecurityValidationResult> {
    try {
      // 1. Authentication check
      const user = await verifySession()
      if (!user) {
        return { 
          allowed: false, 
          error: 'Authentication required',
          riskLevel: 'high'
        }
      }

      // 2. Get security configuration
      const config = BULK_SECURITY_CONFIGS[operationType]
      if (!config) {
        return { 
          allowed: false, 
          error: 'Invalid operation type',
          riskLevel: 'high'
        }
      }

      // 3. Role-based access control
      const userRole = user.user_metadata?.role || 'viewer'
      if (!config.requiredRoles.includes(userRole)) {
        await bulkAuditLogger.logSecurityIncident(
          user.id,
          'unauthorized_bulk_operation',
          `User with role '${userRole}' attempted ${operationType} operation`,
          'high',
          { action, itemCount: itemIds.length }
        )

        return { 
          allowed: false, 
          error: 'Insufficient permissions',
          riskLevel: 'high'
        }
      }

      // 4. Action validation
      if (!config.allowedActions.includes(action)) {
        return { 
          allowed: false, 
          error: `Action '${action}' not allowed for ${operationType}`,
          riskLevel: 'medium'
        }
      }

      // 5. Volume validation
      if (itemIds.length > config.maxItemsPerOperation) {
        return { 
          allowed: false, 
          error: `Too many items. Maximum allowed: ${config.maxItemsPerOperation}`,
          riskLevel: 'high'
        }
      }

      // 6. Rate limiting
      const rateLimitResult = this.checkRateLimit(user.id, operationType, config)
      if (!rateLimitResult.allowed) {
        await bulkAuditLogger.logSecurityIncident(
          user.id,
          'bulk_rate_limit_exceeded',
          `Rate limit exceeded for ${operationType}`,
          'medium',
          { remainingTime: rateLimitResult.resetTimeMinutes }
        )

        return rateLimitResult
      }

      // 7. Concurrent operations check
      const concurrentResult = await this.checkConcurrentOperations(user.id, config)
      if (!concurrentResult.allowed) {
        return concurrentResult
      }

      // 8. IP whitelist check (if configured)
      if (config.ipWhitelist) {
        const clientIP = this.getClientIP(request)
        if (!config.ipWhitelist.includes(clientIP)) {
          await bulkAuditLogger.logSecurityIncident(
            user.id,
            'bulk_ip_not_whitelisted',
            `Bulk operation from non-whitelisted IP: ${clientIP}`,
            'high',
            { operationType, action }
          )

          return { 
            allowed: false, 
            error: 'Access denied from this IP address',
            riskLevel: 'critical'
          }
        }
      }

      // 9. MFA requirement check
      if (config.requireMFA && !user.user_metadata?.mfa_verified) {
        return { 
          allowed: false, 
          error: 'Multi-factor authentication required for this operation',
          riskLevel: 'high'
        }
      }

      // 10. Business hour restrictions for high-risk operations
      const riskLevel = this.calculateRiskLevel(operationType, action, itemIds.length)
      if (riskLevel === 'critical' && !this.isBusinessHours()) {
        return { 
          allowed: false, 
          error: 'Critical bulk operations are only allowed during business hours (9 AM - 5 PM UTC)',
          riskLevel: 'critical',
          restrictions: ['business_hours_only']
        }
      }

      // 11. Content-specific validations
      const contentValidation = await this.validateContentSpecificRules(
        operationType, 
        action, 
        itemIds, 
        options, 
        user
      )
      
      if (!contentValidation.allowed) {
        return contentValidation
      }

      // All validations passed
      return { 
        allowed: true, 
        riskLevel,
        restrictions: this.getApplicableRestrictions(config, riskLevel)
      }

    } catch (error) {
      logger.error('Security validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operationType,
        action
      })

      return { 
        allowed: false, 
        error: 'Security validation failed',
        riskLevel: 'critical'
      }
    }
  }

  /**
   * Rate limiting implementation
   */
  private static checkRateLimit(
    userId: string, 
    operationType: string, 
    config: SecurityConfig
  ): SecurityValidationResult & { resetTimeMinutes?: number } {
    const key = `${userId}:${operationType}`
    const now = Date.now()
    const windowMs = config.rateLimitWindow * 60 * 1000

    const current = rateLimitStore.get(key)
    
    if (!current || now > current.resetTime) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return { allowed: true, riskLevel: 'low' }
    }

    if (current.count >= config.rateLimitMax) {
      const resetTimeMinutes = Math.ceil((current.resetTime - now) / (60 * 1000))
      return { 
        allowed: false, 
        error: `Rate limit exceeded. Try again in ${resetTimeMinutes} minutes.`,
        riskLevel: 'medium',
        resetTimeMinutes
      }
    }

    // Increment counter
    current.count++
    return { allowed: true, riskLevel: 'low' }
  }

  /**
   * Check concurrent operations limit
   */
  private static async checkConcurrentOperations(
    userId: string, 
    config: SecurityConfig
  ): Promise<SecurityValidationResult> {
    // In a real implementation, you'd check active jobs from the job queue
    // For now, this is a simplified check
    const activeJobsCount = 0 // This would come from jobQueue.getUserJobs()
    
    if (activeJobsCount >= config.maxConcurrentOperations) {
      return { 
        allowed: false, 
        error: `Too many concurrent operations. Maximum allowed: ${config.maxConcurrentOperations}`,
        riskLevel: 'medium'
      }
    }

    return { allowed: true, riskLevel: 'low' }
  }

  /**
   * Calculate risk level based on operation characteristics
   */
  private static calculateRiskLevel(
    operationType: string, 
    action: string, 
    itemCount: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0

    // Operation type scoring
    if (operationType === 'bulk_users') score += 3
    else if (operationType === 'bulk_pages') score += 2
    else score += 1

    // Action scoring
    if (['delete', 'deactivate'].includes(action)) score += 3
    else if (['change_role', 'update'].includes(action)) score += 2
    else score += 1

    // Volume scoring
    if (itemCount > 500) score += 3
    else if (itemCount > 100) score += 2
    else if (itemCount > 10) score += 1

    if (score >= 9) return 'critical'
    if (score >= 6) return 'high'
    if (score >= 4) return 'medium'
    return 'low'
  }

  /**
   * Content-specific validation rules
   */
  private static async validateContentSpecificRules(
    operationType: string,
    action: string,
    itemIds: string[],
    options: any,
    user: any
  ): Promise<SecurityValidationResult> {
    // User-specific validations
    if (operationType === 'bulk_users') {
      // Prevent self-targeting for critical operations
      if (['delete', 'deactivate', 'change_role'].includes(action)) {
        if (itemIds.includes(user.id)) {
          return { 
            allowed: false, 
            error: 'Cannot perform this action on your own account',
            riskLevel: 'high'
          }
        }
      }

      // Super admin protection
      if (action === 'delete' && user.user_metadata?.role !== 'super_admin') {
        return { 
          allowed: false, 
          error: 'Only super administrators can delete user accounts',
          riskLevel: 'critical'
        }
      }
    }

    // Posts/Pages validations
    if (['bulk_posts', 'bulk_pages'].includes(operationType)) {
      // Check for published content in delete operations
      if (action === 'delete' && itemIds.length > 50) {
        return { 
          allowed: false, 
          error: 'Large-scale deletion requires manual confirmation',
          riskLevel: 'high'
        }
      }
    }

    return { allowed: true, riskLevel: 'low' }
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return 'unknown'
  }

  /**
   * Check if current time is within business hours
   */
  private static isBusinessHours(): boolean {
    const now = new Date()
    const utcHour = now.getUTCHours()
    
    // Business hours: 9 AM - 5 PM UTC (Monday-Friday)
    const isWeekday = now.getUTCDay() >= 1 && now.getUTCDay() <= 5
    const isBusinessHour = utcHour >= 9 && utcHour < 17
    
    return isWeekday && isBusinessHour
  }

  /**
   * Get applicable restrictions for the operation
   */
  private static getApplicableRestrictions(
    config: SecurityConfig, 
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const restrictions: string[] = []

    if (config.requireMFA) {
      restrictions.push('mfa_required')
    }

    if (riskLevel === 'critical') {
      restrictions.push('business_hours_only', 'manual_review_required')
    }

    if (config.ipWhitelist) {
      restrictions.push('ip_whitelist_only')
    }

    return restrictions
  }
}

/**
 * Middleware function to be used in API routes
 */
export async function withBulkSecurity(
  request: NextRequest,
  operationType: string,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract operation details from request
    const body = await request.json()
    const { action, ids = [], ...options } = body

    // Validate the bulk operation
    const validation = await BulkSecurityValidator.validateBulkOperation(
      request,
      operationType,
      action,
      ids,
      options
    )

    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.error,
          riskLevel: validation.riskLevel,
          restrictions: validation.restrictions
        }, 
        { status: 403 }
      )
    }

    // Log security-approved operation
    if (validation.riskLevel && ['high', 'critical'].includes(validation.riskLevel)) {
      logger.warn('High-risk bulk operation approved', {
        operationType,
        action,
        itemCount: ids.length,
        riskLevel: validation.riskLevel,
        restrictions: validation.restrictions
      })
    }

    // Continue with the original handler
    return handler(request)

  } catch (error) {
    logger.error('Bulk security middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operationType
    })

    return NextResponse.json(
      { error: 'Security validation failed' }, 
      { status: 500 }
    )
  }
}