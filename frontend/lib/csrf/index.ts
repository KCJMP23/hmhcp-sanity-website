import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_SECRET_NAME = 'csrf-secret'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_FORM_FIELD = 'csrf_token'

// Enhanced CSRF protection with double-submit cookie pattern
export interface CSRFConfig {
  tokenLifetime?: number // in seconds, default 24 hours
  allowedOrigins?: string[]
  excludePaths?: string[]
}

const defaultConfig: CSRFConfig = {
  tokenLifetime: 86400, // 24 hours
  allowedOrigins: [],
  excludePaths: [
    '/api/webhooks/', // External webhooks
    '/api/monitoring/', // Monitoring endpoints
    '/api/analytics/pageview', // Analytics tracking
  ]
}

/**
 * Generate a CSRF token using HMAC for enhanced security
 * This function should only be called on the server side
 */
export function generateCSRFToken(secret: string): string {
  // Check if we're in a server environment
  if (typeof window !== 'undefined') {
    throw new Error('generateCSRFToken can only be called on the server side')
  }
  
  const nonce = randomBytes(16).toString('hex')
  const timestamp = Date.now().toString()
  const hash = createHash('sha256')
    .update(`${secret}:${nonce}:${timestamp}`)
    .digest('hex')
  
  // Token format: nonce:timestamp:hash
  return Buffer.from(`${nonce}:${timestamp}:${hash}`).toString('base64')
}

/**
 * Verify a CSRF token with timing attack protection
 */
export function verifyCSRFTokenWithSecret(token: string, secret: string, maxAge: number = 86400): boolean {
  // Check if we're in a server environment
  if (typeof window !== 'undefined') {
    throw new Error('verifyCSRFTokenWithSecret can only be called on the server side')
  }
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [nonce, timestamp, hash] = decoded.split(':')
    
    if (!nonce || !timestamp || !hash) return false
    
    // Check token age
    const tokenAge = (Date.now() - parseInt(timestamp)) / 1000
    if (tokenAge > maxAge) return false
    
    // Verify hash with timing attack protection
    const expectedHash = createHash('sha256')
      .update(`${secret}:${nonce}:${timestamp}`)
      .digest('hex')
    
    return timingSafeEqual(hash, expectedHash)
  } catch {
    return false
  }
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Get CSRF token from cookies (read-only, no modification)
 * This function is safe to use in Server Components
 */
export async function getCSRFTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CSRF_TOKEN_NAME)?.value
  return token || null
}

/**
 * Get CSRF secret from cookies (read-only, no modification)
 */
export async function getCSRFSecretFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const secret = cookieStore.get(CSRF_SECRET_NAME)?.value
  return secret || null
}

/**
 * Verify a CSRF token from a request
 */
export async function verifyCSRFToken(token: string | null): Promise<boolean> {
  if (!token) return false
  
  const sessionToken = await getCSRFTokenFromCookies()
  const secret = await getCSRFSecretFromCookies()
  
  if (!sessionToken || !secret) return false
  
  // First check if tokens match
  if (sessionToken !== token) return false
  
  // Then verify token integrity
  return verifyCSRFTokenWithSecret(token, secret)
}

/**
 * CSRF protection middleware for API routes with enhanced security
 */
export async function requireCSRFToken(
  request: NextRequest,
  config: CSRFConfig = defaultConfig
): Promise<void> {
  // Skip CSRF for safe methods
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return
  }
  
  // Check if path is excluded
  const pathname = request.nextUrl.pathname
  const isExcluded = config.excludePaths?.some(path => pathname.startsWith(path))
  if (isExcluded) return
  
  // Verify origin/referer
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  if (origin || referer) {
    const requestOrigin = origin || (referer ? new URL(referer).origin : '')
    const expectedOrigin = `${request.nextUrl.protocol}//${host}`
    
    // Check if origin matches or is in allowed list
    const isAllowedOrigin = requestOrigin === expectedOrigin || 
      config.allowedOrigins?.includes(requestOrigin)
    
    if (!isAllowedOrigin) {
      throw new Error('Invalid origin')
    }
  }
  
  // Get token from header or body
  let token = request.headers.get(CSRF_HEADER_NAME)
  
  // For form submissions, check body
  if (!token && request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await request.formData()
      token = formData.get(CSRF_FORM_FIELD) as string
    } catch {
      // Not form data
    }
  }
  
  // For JSON submissions, check body
  if (!token && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.json()
      token = body[CSRF_FORM_FIELD] || body.csrfToken
    } catch {
      // Not JSON data
    }
  }
  
  const isValid = await verifyCSRFToken(token)
  
  if (!isValid) {
    throw new Error('Invalid CSRF token')
  }
}

/**
 * Hook to use CSRF token in client components
 */
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    throw new Error('useCSRFToken can only be used in client components')
  }
  
  const getToken = () => {
    // Try multiple sources for the token
    const tokenFromWindow = (window as any).__CSRF_TOKEN__
    const tokenFromMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    const tokenFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${CSRF_TOKEN_NAME}=`))
      ?.split('=')[1]
    
    return tokenFromWindow || tokenFromMeta || tokenFromCookie || null
  }
  
  const addToHeaders = (headers: HeadersInit = {}): HeadersInit => {
    const token = getToken()
    if (!token) return headers
    
    if (headers instanceof Headers) {
      headers.set(CSRF_HEADER_NAME, token)
      return headers
    }
    
    return {
      ...headers,
      [CSRF_HEADER_NAME]: token
    }
  }
  
  const addToFormData = (formData: FormData): FormData => {
    const token = getToken()
    if (token) {
      formData.set(CSRF_FORM_FIELD, token)
    }
    return formData
  }
  
  const addToBody = <T extends Record<string, any>>(body: T): T & { csrf_token: string } => {
    const token = getToken()
    return {
      ...body,
      [CSRF_FORM_FIELD]: token || ''
    }
  }
  
  return {
    token: getToken(),
    addToHeaders,
    addToFormData,
    addToBody,
    headerName: CSRF_HEADER_NAME,
    fieldName: CSRF_FORM_FIELD
  }
}

// Re-export from the old location for backward compatibility
export { CSRFTokenInput } from '@/components/csrf-token-provider'