/**
 * Combined Middleware Helpers
 * 
 * This module provides pre-configured middleware combinations
 * for common use cases like admin endpoints, public endpoints, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdminAuth, AuthenticatedUser } from './auth'
import { withErrorHandling, ApiResponse } from './error-handling'
import { withLogging, LoggingConfig } from './logging'
import { withRateLimit, adminRateLimit, RateLimitConfig } from './rate-limiting'

// Type definitions for middleware handlers
export type StandardHandler<T = any> = (request: NextRequest) => Promise<NextResponse<T>>
export type AuthenticatedHandler<T = any> = (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>

/**
 * Standard middleware for most API endpoints
 */
export function withStandardMiddleware<T>(
  handler: StandardHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        undefined, // Use default config
        handler as any
      ) as any
    ) as any
  )
}

/**
 * Admin-only middleware with enhanced security
 */
export function withAdminMiddleware<T>(
  handler: AuthenticatedHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        adminRateLimit,
        withAdminAuth(handler) as any
      ) as any
    ) as any
  )
}

/**
 * Public endpoint middleware with basic protection
 */
export function withPublicMiddleware<T>(
  handler: StandardHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        undefined, // Use default config
        handler as any
      ) as any
    ) as any
  )
}

/**
 * Authenticated user middleware (any logged-in user)
 */
export function withUserMiddleware<T>(
  handler: AuthenticatedHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        undefined, // Use default config
        withAuth(handler) as any
      ) as any
    ) as any
  )
}

/**
 * High-security admin middleware (super admin only)
 */
export function withSuperAdminMiddleware<T>(
  handler: AuthenticatedHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        adminRateLimit,
        withAuth(handler, ['super_admin']) as any
      ) as any
    ) as any
  )
}

/**
 * Content management middleware (editors and admins)
 */
export function withContentManagementMiddleware<T>(
  handler: AuthenticatedHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        undefined, // Use default config
        withAuth(handler, ['admin', 'super_admin', 'editor']) as any
      ) as any
    ) as any
  )
}

/**
 * User management middleware (admin and super admin only)
 */
export function withUserManagementMiddleware<T>(
  handler: AuthenticatedHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        adminRateLimit,
        withAuth(handler, ['admin', 'super_admin']) as any
      ) as any
    ) as any
  )
}

/**
 * System administration middleware (super admin only)
 */
export function withSystemAdminMiddleware<T>(
  handler: AuthenticatedHandler<T>
) {
  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        adminRateLimit,
        withAuth(handler, ['super_admin']) as any
      ) as any
    ) as any
  )
}

/**
 * API key middleware for external integrations
 */
export function withAPIKeyMiddleware<T>(
  handler: StandardHandler<T>,
  requiredScopes: string[] = []
) {
  const apiKeyHandler = async (request: NextRequest) => {
    // Validate API key
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      )
    }

    // In a real implementation, validate the API key and scopes
    // For now, just check if it exists
    if (apiKey === 'invalid') {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    return await handler(request)
  }

  return withErrorHandling(
    withLogging(
      {},
      withRateLimit(
        undefined, // Use default config
        apiKeyHandler as any
      ) as any
    ) as any
  )
}

/**
 * Webhook middleware for external service callbacks
 */
export function withWebhookMiddleware<T>(
  handler: StandardHandler<T>,
  secret: string
) {
  const webhookHandler = async (request: NextRequest) => {
    // Validate webhook signature
    const signature = request.headers.get('x-webhook-signature')
    if (!signature) {
      return NextResponse.json(
        { error: 'Webhook signature required' },
        { status: 401 }
      )
    }

    // In a real implementation, validate the signature
    // For now, just check if it exists
    if (signature !== secret) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    return await handler(request)
  }

  return withErrorHandling(
    withLogging(
      {},
      webhookHandler as any
    ) as any
  )
}
