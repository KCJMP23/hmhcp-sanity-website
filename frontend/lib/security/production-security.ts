/**
 * Production Security Configuration
 * Comprehensive security measures for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Security headers configuration
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.vercel.app",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '),
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),
  
  // HSTS (only in production)
  'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains; preload' 
    : '',
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

// Rate limiting configuration
export const RATE_LIMITS = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Public content
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    standardHeaders: true,
    legacyHeaders: false
  }
}

// IP whitelist for admin access
export const ADMIN_IP_WHITELIST = [
  '127.0.0.1',
  '::1',
  // Add production admin IPs here
]

// Suspicious patterns to block
export const SUSPICIOUS_PATTERNS = [
  /\.\./, // Path traversal
  /<script/i, // XSS attempts
  /union.*select/i, // SQL injection
  /javascript:/i, // JavaScript protocol
  /vbscript:/i, // VBScript protocol
  /onload=/i, // Event handler injection
  /onerror=/i, // Event handler injection
  /eval\(/i, // Code injection
  /expression\(/i, // CSS expression
  /url\(javascript:/i, // CSS injection
]

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })
  
  return response
}

/**
 * Check if IP is whitelisted for admin access
 */
export function isAdminIPAllowed(ip: string): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return ADMIN_IP_WHITELIST.includes(ip)
}

/**
 * Check for suspicious patterns in request
 */
export function isSuspiciousRequest(request: NextRequest): boolean {
  const url = request.url
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check URL for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      return true
    }
  }
  
  // Check for common attack vectors
  const suspiciousParams = [
    'cmd', 'exec', 'eval', 'system', 'shell',
    'script', 'javascript', 'vbscript',
    'union', 'select', 'insert', 'update', 'delete',
    'drop', 'create', 'alter', 'grant', 'revoke'
  ]
  
  const searchParams = request.nextUrl.searchParams
  for (const param of suspiciousParams) {
    if (searchParams.has(param)) {
      return true
    }
  }
  
  return false
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Security middleware
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    const clientIP = getClientIP(req)
    
    // Block suspicious requests
    if (isSuspiciousRequest(req)) {
      console.warn(`Blocked suspicious request from ${clientIP}: ${req.url}`)
      return NextResponse.json(
        { error: 'Request blocked for security reasons' },
        { status: 403 }
      )
    }
    
    // Check admin access
    if (req.nextUrl.pathname.startsWith('/admin') && !isAdminIPAllowed(clientIP)) {
      console.warn(`Blocked admin access from ${clientIP}`)
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    try {
      const response = await handler(req)
      return addSecurityHeaders(response)
    } catch (error) {
      console.error(`Security middleware error: ${error}`)
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
      return addSecurityHeaders(errorResponse)
    }
  }
}

/**
 * CORS configuration for production
 */
export const CORS_CONFIG = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhcp.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}

/**
 * Add CORS headers
 */
export function addCORSHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigin = CORS_CONFIG.origin.includes(origin || '') ? origin : CORS_CONFIG.origin[0]
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin || '*')
  response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', CORS_CONFIG.credentials.toString())
  response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString())
  
  return response
}

/**
 * Request logging for security monitoring
 */
export function logSecurityEvent(
  event: string,
  request: NextRequest,
  details: Record<string, any> = {}
): void {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ip: clientIP,
    userAgent,
    url: request.url,
    method: request.method,
    ...details
  }))
}

export default {
  addSecurityHeaders,
  isAdminIPAllowed,
  isSuspiciousRequest,
  getClientIP,
  withSecurity,
  addCORSHeaders,
  logSecurityEvent
}
