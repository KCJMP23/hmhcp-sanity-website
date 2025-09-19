import { NextRequest, NextResponse } from 'next/server'
import { requireCSRFToken, type CSRFConfig } from '@/lib/csrf-server'
import { logger } from '@/lib/logger';

type ApiHandler = (request: NextRequest) => Promise<NextResponse> | NextResponse

interface ApiMiddlewareOptions {
  csrf?: boolean | CSRFConfig
  auth?: boolean
  rateLimit?: {
    requests: number
    windowMs: number
  }
}

/**
 * Wrapper for API routes that adds CSRF protection and other middleware
 */
export function withApiMiddleware(
  handler: ApiHandler,
  options: ApiMiddlewareOptions = {}
): ApiHandler {
  return async (request: NextRequest) => {
    try {
      // CSRF Protection
      if (options.csrf !== false && request.method !== 'GET' && request.method !== 'HEAD') {
        const csrfConfig = typeof options.csrf === 'object' ? options.csrf : undefined
        
        try {
          await requireCSRFToken(request, csrfConfig)
        } catch (error) {
          return NextResponse.json(
            { 
              error: 'Invalid CSRF token',
              message: 'Please refresh the page and try again.'
            },
            { status: 403 }
          )
        }
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      logger.error('API handler error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      
      if (error instanceof Error) {
        return NextResponse.json(
          { 
            error: error.message,
            message: 'An error occurred processing your request'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: 'An unexpected error occurred'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to create standardized API responses
 */
export function apiResponse<T = any>(
  data: T,
  status: number = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(data, { status, headers })
}

/**
 * Helper to create error responses
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details })
    },
    { status }
  )
}