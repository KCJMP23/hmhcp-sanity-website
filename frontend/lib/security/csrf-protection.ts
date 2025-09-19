import { randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * CSRF Token configuration
 */
const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = '__Host-csrf'
const CSRF_HEADER_NAME = 'X-CSRF-Token'
const CSRF_FORM_FIELD = '_csrf'
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Token storage with expiry
 */
interface TokenData {
  token: string
  expires: number
}

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Store CSRF token in secure cookie
 */
export async function setCSRFToken(response: NextResponse): Promise<string> {
  const token = generateCSRFToken()
  const expires = Date.now() + TOKEN_EXPIRY
  
  const tokenData: TokenData = {
    token,
    expires
  }
  
  // Use __Host- prefix for additional security
  response.cookies.set(CSRF_COOKIE_NAME, JSON.stringify(tokenData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY / 1000
  })
  
  return token
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFToken(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = request.cookies
    const tokenCookie = cookieStore.get(CSRF_COOKIE_NAME)
    
    if (!tokenCookie?.value) {
      return null
    }
    
    const tokenData: TokenData = JSON.parse(tokenCookie.value)
    
    // Check if token has expired
    if (tokenData.expires < Date.now()) {
      return null
    }
    
    return tokenData.token
  } catch {
    return null
  }
}

/**
 * Extract CSRF token from request (header or body)
 */
export function extractCSRFTokenFromRequest(request: NextRequest, body?: any): string | null {
  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) {
    return headerToken
  }
  
  // Check body if provided
  if (body && typeof body === 'object') {
    return body[CSRF_FORM_FIELD] || null
  }
  
  return null
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(storedToken: string, providedToken: string): boolean {
  if (!storedToken || !providedToken) {
    return false
  }
  
  if (storedToken.length !== providedToken.length) {
    return false
  }
  
  try {
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(storedToken),
      Buffer.from(providedToken)
    )
  } catch {
    return false
  }
}

/**
 * CSRF protection middleware for API routes
 */
export async function csrfProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return handler(request)
  }
  
  // Get stored token
  const storedToken = await getCSRFToken(request)
  
  if (!storedToken) {
    return NextResponse.json(
      { error: 'CSRF token missing or expired' },
      { status: 403 }
    )
  }
  
  // Parse body if needed
  let body = null
  if (request.headers.get('content-type')?.includes('application/json')) {
    try {
      body = await request.json()
      // Create new request with body for handler
      const newRequest = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body)
      })
      
      // Extract provided token
      const providedToken = extractCSRFTokenFromRequest(request, body)
      
      if (!providedToken || !validateCSRFToken(storedToken, providedToken)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
      
      return handler(newRequest)
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }
  
  // For non-JSON requests, check header only
  const providedToken = extractCSRFTokenFromRequest(request)
  
  if (!providedToken || !validateCSRFToken(storedToken, providedToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }
  
  return handler(request)
}

/**
 * Generate CSRF meta tag for HTML pages
 */
export function generateCSRFMetaTag(token: string): string {
  return `<meta name="csrf-token" content="${token}" />`
}

/**
 * Helper to add CSRF token to fetch requests
 */
export function addCSRFToRequest(init: RequestInit = {}): RequestInit {
  const csrfMeta = typeof document !== 'undefined' 
    ? document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
    : null
    
  if (csrfMeta?.content) {
    return {
      ...init,
      headers: {
        ...init.headers,
        [CSRF_HEADER_NAME]: csrfMeta.content
      }
    }
  }
  
  return init
}

/**
 * React hook for CSRF token management
 */
export function useCSRFToken(): {
  token: string | null
  addToRequest: (init?: RequestInit) => RequestInit
} {
  if (typeof window === 'undefined') {
    return {
      token: null,
      addToRequest: (init = {}) => init
    }
  }
  
  const csrfMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
  const token = csrfMeta?.content || null
  
  return {
    token,
    addToRequest: addCSRFToRequest
  }
}