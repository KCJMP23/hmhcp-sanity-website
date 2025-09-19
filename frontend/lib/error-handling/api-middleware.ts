/**
 * API Error Handling Middleware for HMHCP Admin System
 * 
 * Provides comprehensive middleware for:
 * - Centralized error handling across all API routes
 * - Request/response logging with correlation IDs
 * - Rate limiting with graceful degradation
 * - Authentication/authorization error handling
 * - Database connection retry logic
 * - HIPAA-compliant error responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AdminErrorHandler } from './error-handler'
import { createEnhancedRequestLogger, type EnhancedRequestLogger } from './request-logger'
import { verifySession } from '@/lib/dal/supabase-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import rateLimit from '@/lib/security/rate-limiter'

// Middleware configuration types
export interface ApiMiddlewareConfig {
  requireAuth?: boolean
  requireAdminRole?: boolean
  allowedRoles?: string[]
  rateLimit?: {
    requests: number
    windowMs: number
    skipSuccessfulRequests?: boolean
  }
  validation?: {
    body?: z.ZodSchema
    query?: z.ZodSchema
    params?: z.ZodSchema
  }
  database?: {
    maxRetries?: number
    retryDelayMs?: number
    timeoutMs?: number
  }
  cors?: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  }
  logging?: {
    logRequests?: boolean
    logResponses?: boolean
    logErrors?: boolean
    includeBody?: boolean
  }
}

// Request context extended with middleware data
export interface ApiRequestContext {
  logger: EnhancedRequestLogger
  user?: {
    id: string
    email: string
    role: string
    sessionId: string
  }
  validatedData?: {
    body?: any
    query?: any
    params?: any
  }
  startTime: number
  correlationId: string
}

// Middleware result types
export type MiddlewareResult = 
  | { success: true; context: ApiRequestContext }
  | { success: false; response: NextResponse }

/**
 * Main API middleware function
 */
export async function withApiMiddleware(
  request: NextRequest,
  config: ApiMiddlewareConfig = {}
): Promise<MiddlewareResult> {
  
  const startTime = Date.now()
  const logger = createEnhancedRequestLogger(request)
  const correlationId = logger.getCorrelationId()
  
  try {
    logger.setBusinessContext('api', 'middleware', 'request')
    
    // Initialize request context
    let context: ApiRequestContext = {
      logger,
      startTime,
      correlationId
    }
    
    // 1. Apply CORS headers if configured
    if (config.cors) {
      const corsResult = await applyCorsHeaders(request, config.cors, logger)
      if (!corsResult.success) {
        return { success: false, response: corsResult.response }
      }
    }
    
    // 2. Apply rate limiting
    if (config.rateLimit) {
      const rateLimitResult = await applyRateLimit(request, config.rateLimit, logger)
      if (!rateLimitResult.success) {
        return { success: false, response: rateLimitResult.response }
      }
    }
    
    // 3. Validate request data
    if (config.validation) {
      const validationResult = await validateRequestData(request, config.validation, logger)
      if (!validationResult.success) {
        return { success: false, response: validationResult.response }
      }
      context.validatedData = validationResult.data
    }
    
    // 4. Handle authentication
    if (config.requireAuth) {
      const authResult = await handleAuthentication(request, config, logger)
      if (!authResult.success) {
        return { success: false, response: authResult.response }
      }
      context.user = authResult.user
      logger.setUserContext(authResult.user.id, authResult.user.role, authResult.user.sessionId)
    }
    
    // 5. Test database connection if needed
    if (config.database) {
      const dbResult = await testDatabaseConnection(config.database, logger)
      if (!dbResult.success) {
        return { success: false, response: dbResult.response }
      }
    }
    
    logger.logSuccess(200, { middleware: 'completed' })
    return { success: true, context }
    
  } catch (error) {
    return {
      success: false,
      response: await AdminErrorHandler.handleApiError(
        error,
        {
          correlationId,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          ipAddress: logger.context?.ipAddress || 'unknown'
        }
      )
    }
  }
}

/**
 * Apply CORS headers to response
 */
async function applyCorsHeaders(
  request: NextRequest,
  corsConfig: NonNullable<ApiMiddlewareConfig['cors']>,
  logger: EnhancedRequestLogger
): Promise<{ success: true } | { success: false; response: NextResponse }> {
  
  try {
    const origin = request.headers.get('origin')
    
    // Check if origin is allowed
    if (corsConfig.origin) {
      const allowedOrigins = Array.isArray(corsConfig.origin) 
        ? corsConfig.origin 
        : [corsConfig.origin]
      
      if (origin && !allowedOrigins.includes(origin) && !allowedOrigins.includes('*')) {
        logger.logSecurityEvent('access_denied', {
          reason: 'CORS origin not allowed',
          origin,
          allowedOrigins
        })
        
        return {
          success: false,
          response: await AdminErrorHandler.handleApiError(
            new Error('CORS origin not allowed'),
            {
              correlationId: logger.getCorrelationId(),
              endpoint: request.nextUrl.pathname,
              method: request.method,
              ipAddress: logger.context?.ipAddress || 'unknown'
            }
          )
        }
      }
    }
    
    return { success: true }
    
  } catch (error) {
    logger.logError(error as Error, 500, { middleware: 'cors' })
    return {
      success: false,
      response: await AdminErrorHandler.handleApiError(
        error,
        {
          correlationId: logger.getCorrelationId(),
          endpoint: request.nextUrl.pathname,
          method: request.method,
          ipAddress: logger.context?.ipAddress || 'unknown'
        }
      )
    }
  }
}

/**
 * Apply rate limiting
 */
async function applyRateLimit(
  request: NextRequest,
  rateLimitConfig: NonNullable<ApiMiddlewareConfig['rateLimit']>,
  logger: EnhancedRequestLogger
): Promise<{ success: true } | { success: false; response: NextResponse }> {
  
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 
                    'unknown'
    
    const rateLimitResult = await rateLimit({
      request,
      limit: rateLimitConfig.requests,
      windowMs: rateLimitConfig.windowMs,
      keyGenerator: () => `api:${clientIP}:${request.nextUrl.pathname}`,
      skipSuccessfulRequests: rateLimitConfig.skipSuccessfulRequests
    })
    
    if (!rateLimitResult.success) {
      logger.logSecurityEvent('suspicious_activity', {
        reason: 'Rate limit exceeded',
        limit: rateLimitConfig.requests,
        windowMs: rateLimitConfig.windowMs,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      })
      
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          correlationId: logger.getCorrelationId(),
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
      
      response.headers.set('X-RateLimit-Limit', rateLimitConfig.requests.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
      response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())
      
      return { success: false, response }
    }
    
    return { success: true }
    
  } catch (error) {
    logger.logError(error as Error, 500, { middleware: 'rateLimit' })
    return {
      success: false,
      response: await AdminErrorHandler.handleApiError(
        error,
        {
          correlationId: logger.getCorrelationId(),
          endpoint: request.nextUrl.pathname,
          method: request.method,
          ipAddress: logger.context?.ipAddress || 'unknown'
        }
      )
    }
  }
}

/**
 * Validate request data using Zod schemas
 */
async function validateRequestData(
  request: NextRequest,
  validationConfig: NonNullable<ApiMiddlewareConfig['validation']>,
  logger: EnhancedRequestLogger
): Promise<{ success: true; data: any } | { success: false; response: NextResponse }> {
  
  try {
    const validatedData: any = {}
    
    // Validate request body
    if (validationConfig.body) {
      try {
        const body = await request.json()
        validatedData.body = validationConfig.body.parse(body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.logError(new Error('Request body validation failed'), 400, {
            middleware: 'validation',
            validationErrors: error.errors
          })
          
          return {
            success: false,
            response: NextResponse.json({
              error: 'Invalid request body',
              correlationId: logger.getCorrelationId(),
              details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
              }))
            }, { status: 400 })
          }
        }
        throw error
      }
    }
    
    // Validate query parameters
    if (validationConfig.query) {
      try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries())
        validatedData.query = validationConfig.query.parse(queryParams)
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.logError(new Error('Query parameter validation failed'), 400, {
            middleware: 'validation',
            validationErrors: error.errors
          })
          
          return {
            success: false,
            response: NextResponse.json({
              error: 'Invalid query parameters',
              correlationId: logger.getCorrelationId(),
              details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
              }))
            }, { status: 400 })
          }
        }
        throw error
      }
    }
    
    // Validate route parameters
    if (validationConfig.params) {
      // This would need to be passed in from the route handler
      // For now, we'll skip params validation in middleware
    }
    
    return { success: true, data: validatedData }
    
  } catch (error) {
    logger.logError(error as Error, 500, { middleware: 'validation' })
    return {
      success: false,
      response: await AdminErrorHandler.handleApiError(
        error,
        {
          correlationId: logger.getCorrelationId(),
          endpoint: request.nextUrl.pathname,
          method: request.method,
          ipAddress: logger.context?.ipAddress || 'unknown'
        }
      )
    }
  }
}

/**
 * Handle authentication and authorization
 */
async function handleAuthentication(
  request: NextRequest,
  config: ApiMiddlewareConfig,
  logger: EnhancedRequestLogger
): Promise<{ success: true; user: NonNullable<ApiRequestContext['user']> } | { success: false; response: NextResponse }> {
  
  try {
    // Verify user session
    const user = await verifySession()
    
    if (!user) {
      logger.logSecurityEvent('login_failure', {
        reason: 'No valid session',
        endpoint: request.nextUrl.pathname
      })
      
      return {
        success: false,
        response: NextResponse.json({
          error: 'Authentication required',
          correlationId: logger.getCorrelationId()
        }, { status: 401 })
      }
    }
    
    // Get user role from database
    const supabase = await createServerSupabaseClient()
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    
    const userRole = adminUser?.role || user.user_metadata?.role
    const isActive = adminUser?.is_active !== false
    
    if (!isActive) {
      logger.logSecurityEvent('access_denied', {
        reason: 'User account is inactive',
        userId: user.id
      })
      
      return {
        success: false,
        response: NextResponse.json({
          error: 'Account is inactive',
          correlationId: logger.getCorrelationId()
        }, { status: 403 })
      }
    }
    
    // Check admin role requirement
    if (config.requireAdminRole && !['admin', 'super_admin'].includes(userRole)) {
      logger.logSecurityEvent('access_denied', {
        reason: 'Admin role required',
        userId: user.id,
        userRole
      })
      
      return {
        success: false,
        response: NextResponse.json({
          error: 'Admin privileges required',
          correlationId: logger.getCorrelationId()
        }, { status: 403 })
      }
    }
    
    // Check allowed roles
    if (config.allowedRoles && !config.allowedRoles.includes(userRole)) {
      logger.logSecurityEvent('access_denied', {
        reason: 'Role not allowed',
        userId: user.id,
        userRole,
        allowedRoles: config.allowedRoles
      })
      
      return {
        success: false,
        response: NextResponse.json({
          error: 'Insufficient privileges',
          correlationId: logger.getCorrelationId()
        }, { status: 403 })
      }
    }
    
    logger.logSecurityEvent('login_success', {
      userId: user.id,
      role: userRole,
      endpoint: request.nextUrl.pathname
    })
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: userRole,
        sessionId: 'session-id' // This would come from session management
      }
    }
    
  } catch (error) {
    logger.logError(error as Error, 500, { middleware: 'authentication' })
    return {
      success: false,
      response: await AdminErrorHandler.handleApiError(
        error,
        {
          correlationId: logger.getCorrelationId(),
          endpoint: request.nextUrl.pathname,
          method: request.method,
          ipAddress: logger.context?.ipAddress || 'unknown'
        }
      )
    }
  }
}

/**
 * Test database connection with retry logic
 */
async function testDatabaseConnection(
  dbConfig: NonNullable<ApiMiddlewareConfig['database']>,
  logger: EnhancedRequestLogger
): Promise<{ success: true } | { success: false; response: NextResponse }> {
  
  const maxRetries = dbConfig.maxRetries || 3
  const retryDelay = dbConfig.retryDelayMs || 1000
  const timeout = dbConfig.timeoutMs || 5000
  
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const supabase = await createServerSupabaseClient()
      
      // Test database connection with a simple query
      const startTime = Date.now()
      const { error } = await Promise.race([
        supabase.from('admin_users').select('count').limit(1).single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), timeout)
        )
      ]) as any
      
      const duration = Date.now() - startTime
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }
      
      logger.logDatabaseOperation('SELECT', 'admin_users', true, duration, 1)
      return { success: true }
      
    } catch (error) {
      lastError = error as Error
      logger.logDatabaseOperation('SELECT', 'admin_users', false, 0, 0)
      
      if (attempt < maxRetries) {
        logger.logError(
          new Error(`Database connection attempt ${attempt} failed, retrying in ${retryDelay}ms`),
          500,
          { middleware: 'database', attempt, maxRetries }
        )
        
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }
  
  logger.logError(
    new Error(`Database connection failed after ${maxRetries} attempts`),
    503,
    { middleware: 'database', finalError: lastError?.message }
  )
  
  return {
    success: false,
    response: await AdminErrorHandler.handleApiError(
      new Error('Database connection failed'),
      {
        correlationId: logger.getCorrelationId(),
        endpoint: 'middleware',
        method: 'database-test',
        ipAddress: logger.context?.ipAddress || 'unknown'
      }
    )
  }
}

/**
 * Wrapper function to create API route handlers with middleware
 */
export function createApiHandler<T = any>(
  handler: (
    request: NextRequest,
    context: ApiRequestContext,
    params?: any
  ) => Promise<NextResponse<T>>,
  config: ApiMiddlewareConfig = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse<T>> => {
    
    const middlewareResult = await withApiMiddleware(request, config)
    
    if (!middlewareResult.success) {
      return middlewareResult.response
    }
    
    try {
      const response = await handler(request, middlewareResult.context, params)
      
      // Add correlation ID to response headers
      response.headers.set('X-Correlation-ID', middlewareResult.context.correlationId)
      
      // Add CORS headers if configured
      if (config.cors) {
        const origin = request.headers.get('origin')
        if (config.cors.origin && (
          config.cors.origin === '*' || 
          (Array.isArray(config.cors.origin) && config.cors.origin.includes(origin || '')) ||
          config.cors.origin === origin
        )) {
          response.headers.set('Access-Control-Allow-Origin', origin || '*')
          
          if (config.cors.methods) {
            response.headers.set('Access-Control-Allow-Methods', config.cors.methods.join(', '))
          }
          
          if (config.cors.headers) {
            response.headers.set('Access-Control-Allow-Headers', config.cors.headers.join(', '))
          }
        }
      }
      
      middlewareResult.context.logger.logSuccess(response.status)
      return response
      
    } catch (error) {
      middlewareResult.context.logger.logError(error as Error)
      return await AdminErrorHandler.handleApiError(
        error,
        {
          correlationId: middlewareResult.context.correlationId,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          ipAddress: middlewareResult.context.logger.context?.ipAddress || 'unknown',
          userId: middlewareResult.context.user?.id
        }
      )
    }
  }
}