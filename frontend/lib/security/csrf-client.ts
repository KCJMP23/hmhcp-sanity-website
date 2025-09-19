/**
 * CSRF Protection Module - Client Side
 * Client-safe functions for CSRF protection
 * These functions can be safely imported in client components
 */

import { logger } from '@/lib/logging/client-safe-logger'

const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Client-side helper to get CSRF token from meta tag
 */
export function getCSRFTokenFromMeta(): string | null {
  if (typeof window === 'undefined') return null
  
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta?.getAttribute('content') || null
}

/**
 * Add CSRF token to fetch headers
 */
export function addCSRFToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFTokenFromMeta()
  
  if (!token) {
    logger.warn('CSRF token not found in meta tag')
    return headers
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token
  }
}

/**
 * Add CSRF token to request body (for form submissions)
 */
export function addCSRFToBody(body: any, token: string): any {
  if (!token) {
    logger.warn('CSRF token not provided for body')
    return body
  }

  if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
    return {
      ...body,
      csrfToken: token
    }
  }

  return body
}
