/**
 * Standardized Error Handling Utilities
 * 
 * This module provides consistent error handling and response formatting
 * for all API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'

export interface ApiError {
  error: string
  message?: string
  details?: any
  code?: string
  timestamp: string
  path: string
  method: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  request: NextRequest,
  error: string | Error,
  statusCode: number = 500,
  details?: any,
  code?: string
): NextResponse<ApiResponse> {
  const apiError: ApiError = {
    error: typeof error === 'string' ? error : error.message,
    message: typeof error === 'string' ? error : error.message,
    details,
    code,
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    method: request.method
  }

  const response: ApiResponse = {
    success: false,
    error: apiError
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore
    }
  }

  return NextResponse.json(response)
}

/**
 * Handle common database errors
 */
export function handleDatabaseError(
  request: NextRequest,
  error: any
): NextResponse<ApiResponse> {
  console.error('Database error:', error)

  // Handle specific database error codes
  if (error.code === '23505') {
    return createErrorResponse(
      request,
      'Resource already exists',
      409,
      { field: error.detail },
      'DUPLICATE_ENTRY'
    )
  }

  if (error.code === '23503') {
    return createErrorResponse(
      request,
      'Referenced resource not found',
      400,
      { constraint: error.constraint },
      'FOREIGN_KEY_VIOLATION'
    )
  }

  if (error.code === '42P01') {
    return createErrorResponse(
      request,
      'Table not found',
      500,
      { table: error.table },
      'TABLE_NOT_FOUND'
    )
  }

  // Generic database error
  return createErrorResponse(
    request,
    'Database operation failed',
    500,
    { originalError: error.message },
    'DATABASE_ERROR'
  )
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  request: NextRequest,
  errors: any[]
): NextResponse<ApiResponse> {
  return createErrorResponse(
    request,
    'Validation failed',
    400,
    { validationErrors: errors },
    'VALIDATION_ERROR'
  )
}

/**
 * Handle authentication errors
 */
export function handleAuthError(
  request: NextRequest,
  error: string,
  statusCode: number = 401
): NextResponse<ApiResponse> {
  return createErrorResponse(
    request,
    error,
    statusCode,
    undefined,
    'AUTHENTICATION_ERROR'
  )
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(
  request: NextRequest,
  error: string,
  statusCode: number = 403
): NextResponse<ApiResponse> {
  return createErrorResponse(
    request,
    error,
    statusCode,
    undefined,
    'AUTHORIZATION_ERROR'
  )
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  request: NextRequest,
  resource: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    request,
    `${resource} not found`,
    404,
    undefined,
    'NOT_FOUND'
  )
}

/**
 * Handle rate limiting errors
 */
export function handleRateLimitError(
  request: NextRequest
): NextResponse<ApiResponse> {
  return createErrorResponse(
    request,
    'Too many requests',
    429,
    { retryAfter: 60 },
    'RATE_LIMIT_EXCEEDED'
  )
}

/**
 * Global error handler wrapper
 */
export function withErrorHandling<T>(
  handler: (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('Unhandled error in API:', error)
      
      if (error instanceof Error) {
        return createErrorResponse(
          request,
          error.message,
          500,
          { stack: error.stack },
          'INTERNAL_ERROR'
        )
      }

      return createErrorResponse(
        request,
        'Internal server error',
        500,
        { error: String(error) },
        'INTERNAL_ERROR'
      )
    }
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`Field '${field}' is required`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize input data
 */
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data.trim()
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput)
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return data
}
