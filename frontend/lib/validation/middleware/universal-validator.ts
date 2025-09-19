/**
 * Universal Validation Middleware Wrapper
 * 
 * Provides a unified interface for applying validation to all API routes
 * 
 * @module lib/validation/middleware/universal-validator
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'
import { APIValidator, ValidationConfig } from './api-validator'
import { apiSchemas } from '../schemas/api-schemas'
import { RateLimiter } from '@/lib/security/rate-limiter'
import { CSRFProtection } from '@/lib/security/csrf'
import { AuditLogger } from '@/lib/monitoring/audit-logger'

/**
 * Route validation configuration
 */
interface RouteValidationConfig {
  schema?: {
    body?: ZodSchema
    query?: ZodSchema
    headers?: ZodSchema
    params?: ZodSchema
    response?: ZodSchema
  }
  config?: ValidationConfig
  rateLimit?: {
    requests: number
    windowMs: number
  }
  requireAuth?: boolean
  requireCSRF?: boolean
  allowedRoles?: string[]
  customValidators?: Array<(req: NextRequest) => Promise<boolean>>
}

/**
 * API route handler type
 */
type ApiRouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse

/**
 * Validated request extension
 */
interface ValidatedRequest extends NextRequest {
  validated?: {
    body?: any
    query?: any
    headers?: any
    params?: any
  }
  user?: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
}

/**
 * Universal validation wrapper
 */
export function withValidation(
  handler: ApiRouteHandler,
  validationConfig?: RouteValidationConfig
): ApiRouteHandler {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now()
    const requestId = generateRequestId()
    
    try {
      // 1. Rate limiting
      if (validationConfig?.rateLimit) {
        const rateLimiter = new RateLimiter({
          windowMs: validationConfig.rateLimit.windowMs,
          max: validationConfig.rateLimit.requests
        })
        
        const clientId = getClientIdentifier(request)
        const allowed = await rateLimiter.checkLimit(clientId)
        
        if (!allowed) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { 
              status: 429,
              headers: {
                'Retry-After': String(validationConfig.rateLimit.windowMs / 1000),
                'X-RateLimit-Limit': String(validationConfig.rateLimit.requests),
                'X-RateLimit-Remaining': '0',
                'X-Request-Id': requestId
              }
            }
          )
        }
      }

      // 2. CSRF protection for state-changing operations
      if (validationConfig?.requireCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const csrfProtection = new CSRFProtection()
        const csrfToken = request.headers.get('x-csrf-token')
        
        if (!csrfToken || !await csrfProtection.validateToken(csrfToken)) {
          return NextResponse.json(
            { error: 'Invalid or missing CSRF token' },
            { 
              status: 403,
              headers: { 'X-Request-Id': requestId }
            }
          )
        }
      }

      // 3. Authentication check
      if (validationConfig?.requireAuth) {
        const authHeader = request.headers.get('authorization')
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { 
              status: 401,
              headers: { 
                'WWW-Authenticate': 'Bearer',
                'X-Request-Id': requestId
              }
            }
          )
        }
        
        // Validate JWT and extract user
        const token = authHeader.substring(7)
        const user = await validateJWT(token)
        
        if (!user) {
          return NextResponse.json(
            { error: 'Invalid authentication token' },
            { 
              status: 401,
              headers: { 'X-Request-Id': requestId }
            }
          )
        }
        
        // Check role-based access
        if (validationConfig.allowedRoles && !validationConfig.allowedRoles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { 
              status: 403,
              headers: { 'X-Request-Id': requestId }
            }
          )
        }
        
        // Attach user to request
        (request as ValidatedRequest).user = user
      }

      // 4. Input validation
      const validator = new APIValidator(validationConfig?.config)
      const validationResult = await validator.validateRequest(
        request,
        validationConfig?.schema
      )
      
      if (!validationResult.valid) {
        // Log validation failure
        const auditLogger = new AuditLogger()
        await auditLogger.log({
          action: 'VALIDATION_FAILURE',
          requestId,
          path: request.url,
          method: request.method,
          errors: validationResult.errors,
          clientId: getClientIdentifier(request)
        })
        
        return NextResponse.json(
          {
            error: 'Validation failed',
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            requestId
          },
          { 
            status: 400,
            headers: { 'X-Request-Id': requestId }
          }
        )
      }
      
      // Attach validated data to request
      (request as ValidatedRequest).validated = validationResult.sanitizedData

      // 5. Custom validators
      if (validationConfig?.customValidators) {
        for (const validator of validationConfig.customValidators) {
          const isValid = await validator(request)
          if (!isValid) {
            return NextResponse.json(
              { error: 'Custom validation failed', requestId },
              { 
                status: 400,
                headers: { 'X-Request-Id': requestId }
              }
            )
          }
        }
      }

      // 6. Execute the actual handler
      const response = await handler(request as ValidatedRequest, context)
      
      // 7. Response validation (if configured)
      if (validationConfig?.schema?.response) {
        try {
          const responseData = await response.json()
          const responseValidation = await validator.validateResponse(
            responseData,
            validationConfig.schema.response
          )
          
          if (!responseValidation.valid) {
            // Log response validation failure (but still return the response)
            console.error('Response validation failed:', responseValidation.errors)
          }
          
          // Return the original response with validation metadata
          return NextResponse.json(responseData, {
            status: response.status,
            headers: {
              ...Object.fromEntries(response.headers.entries()),
              'X-Request-Id': requestId,
              'X-Response-Time': String(Date.now() - startTime)
            }
          })
        } catch (error) {
          // If response is not JSON, return as-is
          return response
        }
      }
      
      // Add request metadata to response
      const headers = new Headers(response.headers)
      headers.set('X-Request-Id', requestId)
      headers.set('X-Response-Time', String(Date.now() - startTime))
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
      
    } catch (error) {
      // Log unexpected errors
      console.error('Validation middleware error:', error)
      
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred during request processing',
          requestId
        },
        { 
          status: 500,
          headers: { 'X-Request-Id': requestId }
        }
      )
    }
  }
}

/**
 * Create validated API route handlers
 */
export function createValidatedRoute(
  methods: Record<string, {
    handler: ApiRouteHandler
    validation?: RouteValidationConfig
  }>
) {
  return async (request: NextRequest, context?: any) => {
    const method = request.method.toUpperCase()
    
    if (!methods[method]) {
      return NextResponse.json(
        { error: `Method ${method} not allowed` },
        { 
          status: 405,
          headers: { 'Allow': Object.keys(methods).join(', ') }
        }
      )
    }
    
    const { handler, validation } = methods[method]
    const validatedHandler = withValidation(handler, validation)
    
    return validatedHandler(request, context)
  }
}

/**
 * Pre-configured validation setups for common route types
 */
export const validationPresets = {
  // Public read-only endpoint
  publicRead: {
    config: {
      validateQuery: true,
      validateHeaders: true,
      preventSQLInjection: true,
      preventXSS: true,
      maxRequestSize: 1024 * 1024 // 1MB
    },
    rateLimit: {
      requests: 100,
      windowMs: 60000 // 1 minute
    }
  },
  
  // Public form submission
  publicForm: {
    config: {
      validateBody: true,
      validateHeaders: true,
      preventSQLInjection: true,
      preventXSS: true,
      preventNoSQLInjection: true,
      detectPII: true,
      maxRequestSize: 5 * 1024 * 1024 // 5MB
    },
    requireCSRF: true,
    rateLimit: {
      requests: 10,
      windowMs: 60000 // 1 minute
    }
  },
  
  // Authenticated API endpoint
  authenticatedApi: {
    config: {
      validateBody: true,
      validateQuery: true,
      validateHeaders: true,
      preventSQLInjection: true,
      preventXSS: true,
      preventNoSQLInjection: true,
      hipaaCompliant: true,
      detectPII: true,
      enableAuditLog: true
    },
    requireAuth: true,
    requireCSRF: true,
    rateLimit: {
      requests: 50,
      windowMs: 60000 // 1 minute
    }
  },
  
  // Admin endpoint
  adminOnly: {
    config: {
      validateBody: true,
      validateQuery: true,
      validateHeaders: true,
      preventSQLInjection: true,
      preventXSS: true,
      preventNoSQLInjection: true,
      hipaaCompliant: true,
      detectPII: true,
      enableAuditLog: true,
      enablePerformanceMonitoring: true
    },
    requireAuth: true,
    requireCSRF: true,
    allowedRoles: ['admin'],
    rateLimit: {
      requests: 30,
      windowMs: 60000 // 1 minute
    }
  },
  
  // Healthcare data endpoint
  healthcareData: {
    config: {
      validateBody: true,
      validateQuery: true,
      validateHeaders: true,
      preventSQLInjection: true,
      preventXSS: true,
      preventNoSQLInjection: true,
      hipaaCompliant: true,
      detectPII: true,
      enableAuditLog: true,
      enablePerformanceMonitoring: true,
      maxRequestSize: 10 * 1024 * 1024 // 10MB
    },
    requireAuth: true,
    requireCSRF: true,
    allowedRoles: ['admin', 'healthcare_provider'],
    rateLimit: {
      requests: 20,
      windowMs: 60000 // 1 minute
    }
  },
  
  // File upload endpoint
  fileUpload: {
    config: {
      validateBody: true,
      validateHeaders: true,
      preventXSS: true,
      maxRequestSize: 50 * 1024 * 1024, // 50MB
      allowedContentTypes: ['multipart/form-data'],
      enableAuditLog: true
    },
    requireAuth: true,
    requireCSRF: true,
    rateLimit: {
      requests: 5,
      windowMs: 60000 // 1 minute
    }
  },
  
  // Webhook endpoint
  webhook: {
    config: {
      validateBody: true,
      validateHeaders: true,
      preventSQLInjection: true,
      preventNoSQLInjection: true,
      enableAuditLog: true,
      maxRequestSize: 5 * 1024 * 1024 // 5MB
    },
    rateLimit: {
      requests: 1000,
      windowMs: 60000 // 1 minute
    }
  }
}

/**
 * Helper functions
 */

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // Add user agent for better identification
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return `${ip}_${Buffer.from(userAgent).toString('base64').substring(0, 10)}`
}

async function validateJWT(token: string): Promise<any | null> {
  // This is a placeholder - implement actual JWT validation
  // You would typically use a library like jose or jsonwebtoken
  try {
    // Validate token and extract user info
    // const decoded = await verifyJWT(token)
    // return decoded.user
    
    // Placeholder return
    return {
      id: 'user_123',
      email: 'user@example.com',
      role: 'user',
      permissions: []
    }
  } catch (error) {
    return null
  }
}

/**
 * Export route-specific validators
 */
export const routeValidators = {
  // Auth routes
  '/api/auth/login': {
    POST: {
      schema: apiSchemas.auth.login,
      ...validationPresets.publicForm
    }
  },
  '/api/auth/register': {
    POST: {
      schema: apiSchemas.auth.register,
      ...validationPresets.publicForm
    }
  },
  '/api/auth/logout': {
    POST: {
      schema: apiSchemas.auth.logout,
      ...validationPresets.authenticatedApi
    }
  },
  
  // CMS routes
  '/api/cms/content': {
    GET: {
      schema: apiSchemas.cms.getContent,
      ...validationPresets.publicRead
    },
    POST: {
      schema: apiSchemas.cms.createContent,
      ...validationPresets.adminOnly
    }
  },
  
  // Blog routes
  '/api/blog/posts': {
    GET: {
      schema: apiSchemas.blog.getPosts,
      ...validationPresets.publicRead
    },
    POST: {
      schema: apiSchemas.blog.createPost,
      ...validationPresets.adminOnly
    }
  },
  
  // Contact routes
  '/api/contact': {
    POST: {
      schema: apiSchemas.contact.basicContact,
      ...validationPresets.publicForm
    }
  },
  
  // Platform routes
  '/api/platforms/mybc-health/signup': {
    POST: {
      schema: apiSchemas.platform.mybcSignup,
      ...validationPresets.healthcareData
    }
  },
  
  // Admin routes
  '/api/admin/users': {
    GET: {
      schema: apiSchemas.admin.getUsers,
      ...validationPresets.adminOnly
    },
    POST: {
      schema: apiSchemas.admin.createUser,
      ...validationPresets.adminOnly
    }
  }
}

export default withValidation