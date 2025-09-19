/**
 * Automation API Security Middleware
 * 
 * Comprehensive security layer for blog automation system with:
 * - JWT token validation (no mock users)
 * - Input sanitization and validation
 * - Rate limiting per endpoint
 * - CSRF protection
 * - HIPAA compliance audit logging
 * - Security headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { checkRateLimit, RateLimitConfig } from './rate-limiting'
import { createHash, randomBytes } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Security error codes for consistent error handling
export enum SecurityErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_INPUT = 'INVALID_INPUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_VALIDATION_FAILED = 'CSRF_VALIDATION_FAILED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION'
}

// Audit event types for HIPAA compliance
export enum AuditEventType {
  ACCESS_ATTEMPT = 'ACCESS_ATTEMPT',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  DATA_CREATE = 'DATA_CREATE',
  DATA_READ = 'DATA_READ',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// User context for authenticated requests
export interface AuthenticatedContext {
  user: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
  session: {
    id: string
    createdAt: Date
    expiresAt: Date
  }
  requestId: string
  ipAddress: string
  userAgent: string
}

// Input validation schemas for blog automation
export const BlogGenerateSchema = z.object({
  topic: z.string().min(1).max(500).optional(),
  category: z.enum(['health-conditions', 'medical-technology', 'patient-care', 'prevention-wellness', 'healthcare-trends']).optional(),
  priority: z.number().min(1).max(5).optional(),
  scheduledFor: z.string().datetime().optional()
})

export const BlogTopicSchema = z.object({
  title: z.string().min(1).max(500),
  instructions: z.string().max(2000).optional(),
  tone: z.enum(['professional', 'empathetic', 'educational', 'conversational']).optional(),
  priority: z.number().min(1).max(5).default(2),
  category: z.enum(['health-conditions', 'medical-technology', 'patient-care', 'prevention-wellness', 'healthcare-trends']),
  targetKeywords: z.array(z.string().max(100)).max(10).optional()
})

export const BlogScheduleSchema = z.object({
  topicId: z.string().uuid(),
  scheduledFor: z.string().datetime(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly']).optional()
})

// CSRF token management
class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex')
  }

  static async validateToken(request: NextRequest): Promise<boolean> {
    // Skip CSRF for GET requests
    if (request.method === 'GET' || request.method === 'HEAD') {
      return true
    }

    const headerToken = request.headers.get('x-csrf-token')
    
    // Skip cookie check during build time
    if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
      return !!headerToken
    }
    
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = cookies()
      const cookieToken = cookieStore.get('csrf-token')?.value
      
      if (!headerToken || !cookieToken) {
        logger.warn('CSRF token missing', {
          hasHeader: !!headerToken,
          hasCookie: !!cookieToken,
          path: request.nextUrl.pathname
        })
        return false
      }

      // Validate tokens match
      const isValid = headerToken === cookieToken

      if (!isValid) {
        logger.warn('CSRF token mismatch', {
          path: request.nextUrl.pathname,
          method: request.method
        })
        return false
      }

      return isValid
    } catch (error) {
      // If cookies are not available (e.g., during build), fall back to header-only validation
      logger.warn('Cookie access failed, using header-only CSRF validation', { error })
      return !!headerToken
    }
  }

  static setToken(response: NextResponse): void {
    const token = this.generateToken()
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.TOKEN_EXPIRY / 1000,
      path: '/'
    })
    response.headers.set('x-csrf-token', token)
  }
}

// Audit logging for HIPAA compliance
class AuditLogger {
  static async log(
    event: AuditEventType,
    context: Partial<AuthenticatedContext>,
    details: Record<string, any> = {}
  ): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType: event,
      userId: context.user?.id || 'anonymous',
      userEmail: context.user?.email || 'unknown',
      userRole: context.user?.role || 'unknown',
      requestId: context.requestId || 'unknown',
      ipAddress: context.ipAddress || 'unknown',
      userAgent: context.userAgent || 'unknown',
      details: {
        ...details,
        // Remove sensitive data from logs
        password: undefined,
        token: undefined,
        apiKey: undefined
      }
    }

    // Log to structured logging system
    logger.info('AUDIT_LOG', auditEntry)

    // Store in database for compliance reporting
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      await supabase.from('audit_logs').insert({
        event_type: event,
        user_id: auditEntry.userId,
        user_email: auditEntry.userEmail,
        user_role: auditEntry.userRole,
        request_id: auditEntry.requestId,
        ip_address: auditEntry.ipAddress,
        user_agent: auditEntry.userAgent,
        details: auditEntry.details,
        created_at: auditEntry.timestamp
      })
    } catch (error) {
      logger.error('Failed to store audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event
      })
    }
  }
}

// Security headers for API responses
function setSecurityHeaders(response: NextResponse): void {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';")
  
  // Prevent information leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // HSTS for HTTPS enforcement
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Remove server identification
  response.headers.delete('X-Powered-By')
  response.headers.set('Server', 'Healthcare-API')
}

// Input sanitization
function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    // Remove potential XSS vectors
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput)
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(data[key])
      }
    }
    return sanitized
  }
  
  return data
}

// Validate and authenticate request
async function validateAuthentication(request: NextRequest): Promise<AuthenticatedContext | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Extract authentication token
    const authHeader = request.headers.get('authorization')
    
    // Skip cookie access during build
    let token = ''
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // Try to get from cookies if available (runtime only)
    try {
      if (process.env.NEXT_RUNTIME) {
        const { cookies } = await import('next/headers')
        const cookieStore = cookies()
        const sessionToken = cookieStore.get('sb-access-token')?.value
        
        if (!token && sessionToken) {
          token = sessionToken
        }
      }
    } catch (error) {
      // Cookie access failed (likely during build), continue with header token
    }
    
    if (!token) {
      logger.warn('No authentication token provided', {
        path: request.nextUrl.pathname,
        method: request.method
      })
      return null
    }
    
    // Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      logger.warn('Invalid authentication token', {
        error: error?.message,
        path: request.nextUrl.pathname
      })
      return null
    }
    
    // Get user profile with permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role_permissions(*)')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      logger.warn('User profile not found', { userId: user.id })
      return null
    }
    
    // Check if account is active
    if (profile.status !== 'active') {
      logger.warn('Inactive account attempted access', {
        userId: user.id,
        status: profile.status
      })
      return null
    }
    
    // Build authenticated context
    const context: AuthenticatedContext = {
      user: {
        id: user.id,
        email: user.email || profile.email,
        role: profile.role,
        permissions: profile.role_permissions?.map((p: any) => p.permission) || []
      },
      session: {
        id: user.aud || 'session',
        createdAt: new Date(user.created_at || Date.now()),
        expiresAt: new Date(user.exp ? user.exp * 1000 : Date.now() + 3600000)
      },
      requestId: randomBytes(16).toString('hex'),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
    
    return context
  } catch (error) {
    logger.error('Authentication validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: request.nextUrl.pathname
    })
    return null
  }
}

// Main security middleware for automation endpoints
export function withAutomationSecurity(
  handler: (request: NextRequest, context: AuthenticatedContext) => Promise<NextResponse>,
  options: {
    requiredPermissions?: string[]
    rateLimitConfig?: Partial<RateLimitConfig>
    validateInput?: z.ZodSchema
    requireCSRF?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    let context: AuthenticatedContext | null = null
    
    try {
      // 1. Rate limiting check
      const rateLimitConfig: RateLimitConfig = {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30, // 30 requests per minute for automation
        strategy: 'sliding',
        ...options.rateLimitConfig
      }
      
      const { allowed, info } = await checkRateLimit(request, rateLimitConfig)
      
      if (!allowed) {
        await AuditLogger.log(AuditEventType.RATE_LIMIT_EXCEEDED, {
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown'
        }, {
          path: request.nextUrl.pathname,
          rateLimitInfo: info
        })
        
        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: SecurityErrorCode.RATE_LIMIT_EXCEEDED,
            retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )
        
        response.headers.set('Retry-After', Math.ceil((info.resetTime - Date.now()) / 1000).toString())
        setSecurityHeaders(response)
        return response
      }
      
      // 2. CSRF validation for state-changing operations
      if (options.requireCSRF !== false && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfValid = await CSRFProtection.validateToken(request)
        
        if (!csrfValid) {
          await AuditLogger.log(AuditEventType.SECURITY_VIOLATION, {
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown'
          }, {
            type: 'CSRF_VALIDATION_FAILED',
            path: request.nextUrl.pathname,
            method: request.method
          })
          
          const response = NextResponse.json(
            {
              error: 'CSRF validation failed',
              code: SecurityErrorCode.CSRF_VALIDATION_FAILED
            },
            { status: 403 }
          )
          
          setSecurityHeaders(response)
          return response
        }
      }
      
      // 3. Authentication validation
      context = await validateAuthentication(request)
      
      if (!context) {
        await AuditLogger.log(AuditEventType.ACCESS_DENIED, {
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown'
        }, {
          reason: 'Invalid or missing authentication',
          path: request.nextUrl.pathname
        })
        
        const response = NextResponse.json(
          {
            error: 'Authentication required',
            code: SecurityErrorCode.INVALID_TOKEN
          },
          { status: 401 }
        )
        
        setSecurityHeaders(response)
        return response
      }
      
      // 4. Permission checking
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasPermission = options.requiredPermissions.some(
          permission => context.user.permissions.includes(permission)
        )
        
        if (!hasPermission) {
          await AuditLogger.log(AuditEventType.ACCESS_DENIED, context, {
            reason: 'Insufficient permissions',
            requiredPermissions: options.requiredPermissions,
            userPermissions: context.user.permissions
          })
          
          const response = NextResponse.json(
            {
              error: 'Insufficient permissions',
              code: SecurityErrorCode.INSUFFICIENT_PERMISSIONS
            },
            { status: 403 }
          )
          
          setSecurityHeaders(response)
          return response
        }
      }
      
      // 5. Input validation and sanitization
      let validatedBody: any = null
      
      if (options.validateInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const rawBody = await request.json()
          const sanitizedBody = sanitizeInput(rawBody)
          validatedBody = options.validateInput.parse(sanitizedBody)
        } catch (error) {
          await AuditLogger.log(AuditEventType.SECURITY_VIOLATION, context, {
            type: 'INVALID_INPUT',
            error: error instanceof z.ZodError ? error.errors : 'Unknown validation error',
            path: request.nextUrl.pathname
          })
          
          const response = NextResponse.json(
            {
              error: 'Invalid input',
              code: SecurityErrorCode.INVALID_INPUT,
              details: error instanceof z.ZodError ? error.errors : undefined
            },
            { status: 400 }
          )
          
          setSecurityHeaders(response)
          return response
        }
      }
      
      // 6. Log successful access
      await AuditLogger.log(AuditEventType.ACCESS_GRANTED, context, {
        path: request.nextUrl.pathname,
        method: request.method,
        processingTime: Date.now() - startTime
      })
      
      // 7. Create modified request with validated body
      if (validatedBody) {
        const modifiedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(validatedBody)
        })
        
        // Call handler with modified request
        const response = await handler(modifiedRequest, context)
        setSecurityHeaders(response)
        
        // Set new CSRF token for GET requests
        if (request.method === 'GET') {
          CSRFProtection.setToken(response)
        }
        
        return response
      }
      
      // Call handler with original request
      const response = await handler(request, context)
      setSecurityHeaders(response)
      
      // Set new CSRF token for GET requests
      if (request.method === 'GET') {
        CSRFProtection.setToken(response)
      }
      
      return response
      
    } catch (error) {
      // Log unexpected errors
      logger.error('Security middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: request.nextUrl.pathname,
        userId: context?.user?.id
      })
      
      // Don't leak error details in production
      const response = NextResponse.json(
        {
          error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error instanceof Error ? error.message : 'Unknown error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
      
      setSecurityHeaders(response)
      return response
    }
  }
}

// Specialized middleware for admin-only automation endpoints
export function withAdminAutomation(
  handler: (request: NextRequest, context: AuthenticatedContext) => Promise<NextResponse>,
  options: Omit<Parameters<typeof withAutomationSecurity>[1], 'requiredPermissions'> = {}
) {
  return withAutomationSecurity(handler, {
    ...options,
    requiredPermissions: ['automation.manage', 'admin.full']
  })
}

// Export audit logger for use in handlers
export { AuditLogger }