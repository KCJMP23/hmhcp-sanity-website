/**
 * CSRF Protection Module - Server Side
 * Implements Double Submit Cookie pattern for CSRF protection
 * Server-only functions that use next/headers
 */

import crypto from 'crypto'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logging/client-safe-logger'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

/**
 * Set CSRF token in cookies
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
  const cookieStore = await cookies()
  
  cookieStore.set({
    name: CSRF_TOKEN_NAME,
    value: token,
    httpOnly: false, // Must be accessible to JavaScript for double submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  return token
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get(CSRF_TOKEN_NAME)
    return tokenCookie?.value || null
  } catch (error) {
    logger.error('Failed to get CSRF token', { error })
    return null
  }
}

/**
 * Verify CSRF token from request
 */
export async function verifyCSRFToken(request: Request): Promise<boolean> {
  try {
    // Skip CSRF check for GET requests
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return true
    }

    // Get token from cookie
    const cookieToken = await getCSRFToken()
    
    if (!cookieToken) {
      logger.warn('CSRF token missing from cookies')
      return false
    }

    // Get token from header or body
    const headerToken = request.headers.get(CSRF_HEADER_NAME)
    
    let bodyToken: string | null = null
    try {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const body = await request.clone().json()
        bodyToken = body.csrfToken || body.csrf_token || body._csrf
      }
    } catch {
      // Body parsing failed, continue with header check
    }

    const requestToken = headerToken || bodyToken

    if (!requestToken) {
      logger.warn('CSRF token missing from request')
      return false
    }

    // Compare tokens using timing-safe comparison
    const tokensMatch = crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(requestToken)
    )

    if (!tokensMatch) {
      logger.warn('CSRF token mismatch', {
        cookieTokenLength: cookieToken.length,
        requestTokenLength: requestToken.length
      })
      return false
    }

    return true
  } catch (error) {
    logger.error('CSRF verification error', { error })
    return false
  }
}

/**
 * CSRF middleware for API routes
 */
export async function csrfMiddleware(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  // Development mode bypass for testing
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF === 'true') {
    logger.debug('CSRF protection disabled in development')
    return handler()
  }

  const isValid = await verifyCSRFToken(request)
  
  if (!isValid) {
    logger.warn('CSRF validation failed', {
      method: request.method,
      url: request.url
    })
    
    return new Response(
      JSON.stringify({ error: 'CSRF validation failed' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  return handler()
}

/**
 * Generate CSRF meta tag for HTML pages
 */
export async function getCSRFMetaTag(): Promise<string> {
  const token = await getCSRFToken() || await setCSRFToken()
  return `<meta name="csrf-token" content="${token}" />`
}

// Export functions for backward compatibility
export const validateCSRF = verifyCSRFToken;
