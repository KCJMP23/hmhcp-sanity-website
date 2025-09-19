import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createRequestLogger } from '@/lib/logging/winston-logger'
import type { 
  ApiResponse as ApiResponseType, 
  PaginatedResponse, 
  ApiErrorResponse, 
  ValidationError,
  PaginationMeta,
  RateLimitInfo 
} from '@/types/api'

/**
 * Enhanced API Response Handler for HMHCP Website CRUD Operations
 * Provides comprehensive response handling with validation, caching, and security features
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
  errors?: ValidationError[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  meta?: {
    timestamp: string
    correlationId: string
    version: string
    requestId?: string
  }
}

export interface PaginationOptions {
  page: number
  limit: number
  total: number
}

export interface ApiErrorOptions {
  correlationId?: string
  details?: any
  statusCode?: number
}

export class ApiResponseHandler {
  private correlationId: string
  private requestLogger: ReturnType<typeof createRequestLogger>

  constructor(correlationId: string, endpoint?: string, method?: string) {
    this.correlationId = correlationId
    this.requestLogger = createRequestLogger(correlationId, {
      endpoint: endpoint || 'unknown',
      method: method || 'unknown'
    })
  }

  /**
   * Create a successful response with optional data and pagination
   */
  success<T>(
    data?: T, 
    message?: string, 
    pagination?: PaginationOptions,
    statusCode: number = 200
  ): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: this.correlationId,
        version: '1.0'
      }
    }

    if (pagination) {
      response.pagination = {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    }

    this.requestLogger.info('API request successful', {
      statusCode,
      hasData: !!data,
      hasPagination: !!pagination
    })

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Create an error response with consistent structure
   */
  error(
    message: string, 
    options: ApiErrorOptions = {}
  ): NextResponse<ApiResponse> {
    const statusCode = options.statusCode || 500
    
    const response: ApiResponse = {
      success: false,
      error: message,
      details: options.details,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: options.correlationId || this.correlationId,
        version: '1.0'
      }
    }

    this.requestLogger.error('API request failed', {
      error: message,
      statusCode,
      details: options.details
    })

    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Create a validation error response (400) with Zod error support
   */
  validationError(
    message: string = 'Validation failed', 
    details?: any,
    zodError?: z.ZodError
  ): NextResponse<ApiResponse> {
    const errors: ValidationError[] = zodError 
      ? zodError.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      : []

    const response: ApiResponse = {
      success: false,
      error: message,
      details,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: this.correlationId,
        version: '1.0',
        requestId: this.generateRequestId()
      }
    }

    this.requestLogger.error('Validation error', {
      error: message,
      statusCode: 400,
      details,
      validationErrors: errors
    })

    return NextResponse.json(response, { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': response.meta!.requestId!
      }
    })
  }

  /**
   * Create an unauthorized error response (401)
   */
  unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
    return this.error(message, { statusCode: 401 })
  }

  /**
   * Create a forbidden error response (403)
   */
  forbidden(message: string = 'Forbidden'): NextResponse<ApiResponse> {
    return this.error(message, { statusCode: 403 })
  }

  /**
   * Create a not found error response (404)
   */
  notFound(message: string = 'Resource not found'): NextResponse<ApiResponse> {
    return this.error(message, { statusCode: 404 })
  }

  /**
   * Create a conflict error response (409)
   */
  conflict(message: string = 'Resource conflict'): NextResponse<ApiResponse> {
    return this.error(message, { statusCode: 409 })
  }

  /**
   * Create a rate limit error response (429)
   */
  rateLimited(message: string = 'Rate limit exceeded'): NextResponse<ApiResponse> {
    return this.error(message, { statusCode: 429 })
  }

  /**
   * Create an internal server error response (500)
   */
  internalError(
    message: string = 'Internal server error', 
    details?: any
  ): NextResponse<ApiResponse> {
    return this.error(message, { statusCode: 500, details })
  }

  /**
   * Create a created response (201)
   */
  created<T>(
    data: T, 
    message: string = 'Resource created successfully'
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, undefined, 201)
  }

  /**
   * Create an accepted response (202)
   */
  accepted<T>(
    data?: T, 
    message: string = 'Request accepted for processing'
  ): NextResponse<ApiResponse<T>> {
    return this.success(data, message, undefined, 202)
  }

  /**
   * Create a no content response (204)
   */
  noContent(): NextResponse {
    this.requestLogger.info('API request successful - no content', {
      statusCode: 204
    })
    
    return new NextResponse(null, { status: 204 })
  }

  /**
   * Create rate limit error response with headers
   */
  rateLimitExceeded(
    rateLimitInfo: RateLimitInfo,
    message: string = 'Rate limit exceeded'
  ): NextResponse<ApiResponse> {
    const headers = {
      'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
      'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
      'Content-Type': 'application/json',
      ...(rateLimitInfo.retry_after && {
        'Retry-After': rateLimitInfo.retry_after.toString()
      })
    }

    const response: ApiResponse = {
      success: false,
      error: message,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: this.correlationId,
        version: '1.0',
        requestId: this.generateRequestId()
      }
    }

    this.requestLogger.warn('Rate limit exceeded', {
      rateLimitInfo,
      statusCode: 429
    })

    return NextResponse.json(response, { status: 429, headers })
  }

  /**
   * Validate request body with Zod schema
   */
  async validateRequestBody<T>(
    request: Request,
    schema: z.ZodSchema<T>
  ): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiResponse> }> {
    try {
      const body = await request.json()
      const result = schema.safeParse(body)
      
      if (!result.success) {
        return {
          success: false,
          response: this.validationError('Invalid request body', undefined, result.error)
        }
      }
      
      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        response: this.error('Invalid JSON in request body', { statusCode: 400 })
      }
    }
  }

  /**
   * Validate search parameters with Zod schema
   */
  validateSearchParams<T>(
    searchParams: URLSearchParams,
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; response: NextResponse<ApiResponse> } {
    const params: Record<string, any> = {}
    
    for (const [key, value] of searchParams.entries()) {
      // Handle arrays (key[] format)
      if (key.endsWith('[]')) {
        const arrayKey = key.slice(0, -2)
        if (!params[arrayKey]) {
          params[arrayKey] = []
        }
        params[arrayKey].push(value)
      }
      // Handle booleans
      else if (value === 'true' || value === 'false') {
        params[key] = value === 'true'
      }
      // Handle numbers
      else if (!isNaN(Number(value)) && value !== '') {
        params[key] = Number(value)
      }
      // Handle strings
      else {
        params[key] = value
      }
    }
    
    const result = schema.safeParse(params)
    
    if (!result.success) {
      return {
        success: false,
        response: this.validationError('Invalid query parameters', undefined, result.error)
      }
    }
    
    return {
      success: true,
      data: result.data
    }
  }

  /**
   * Create paginated response with enhanced pagination metadata
   */
  paginated<T>(
    items: T[],
    pagination: PaginationMeta,
    message?: string,
    cacheHeaders?: Record<string, string>
  ): NextResponse<ApiResponse<T[]>> {
    const response: ApiResponse<T[]> = {
      success: true,
      data: items,
      message,
      pagination: {
        page: pagination.current_page,
        limit: pagination.per_page,
        total: pagination.total,
        totalPages: pagination.last_page,
        hasNext: pagination.current_page < pagination.last_page,
        hasPrev: pagination.current_page > 1
      },
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: this.correlationId,
        version: '1.0',
        requestId: this.generateRequestId()
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': response.meta!.requestId!,
      'X-Total-Count': pagination.total.toString(),
      'X-Page': pagination.current_page.toString(),
      'X-Per-Page': pagination.per_page.toString(),
      ...cacheHeaders
    }

    this.requestLogger.info('Paginated response created', {
      itemCount: items.length,
      pagination,
      statusCode: 200
    })

    return NextResponse.json(response, { status: 200, headers })
  }

  /**
   * Add cache headers to response
   */
  addCacheHeaders(
    headers: Record<string, string>,
    maxAge: number,
    tags?: string[]
  ): Record<string, string> {
    return {
      ...headers,
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'CDN-Cache-Control': `public, max-age=${maxAge}`,
      'Vercel-CDN-Cache-Control': `public, max-age=${maxAge}`,
      ...(tags && { 'Cache-Tag': tags.join(',') })
    }
  }

  /**
   * Add security headers to response
   */
  addSecurityHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    return {
      ...headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }

  /**
   * Extract user context from request headers
   */
  extractUserContext(request: Request): {
    user_id?: string
    session_id?: string
    ip_address?: string
    user_agent?: string
  } {
    return {
      user_id: request.headers.get('x-user-id') || undefined,
      session_id: request.headers.get('x-session-id') || undefined,
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  undefined,
      user_agent: request.headers.get('user-agent') || undefined
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
}

/**
 * Utility function to create a response handler with correlation ID
 */
export function createApiResponseHandler(
  correlationId?: string,
  endpoint?: string,
  method?: string
): ApiResponseHandler {
  return new ApiResponseHandler(
    correlationId || crypto.randomUUID(),
    endpoint,
    method
  )
}

/**
 * Legacy helper functions for backward compatibility
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  pagination?: PaginationOptions,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  const handler = createApiResponseHandler()
  return handler.success(data, message, pagination, statusCode)
}

export function errorResponse(
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse<ApiResponse> {
  const handler = createApiResponseHandler()
  return handler.error(message, { statusCode, details })
}

export function validationErrorResponse(
  message: string = 'Validation failed',
  details?: any
): NextResponse<ApiResponse> {
  const handler = createApiResponseHandler()
  return handler.validationError(message, details)
}