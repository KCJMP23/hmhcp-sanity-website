/**
 * Comprehensive Security Headers Configuration
 * Implements enterprise-grade security headers for healthcare compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export interface SecurityConfig {
  // Content Security Policy
  csp: {
    enabled: boolean
    reportOnly: boolean
    directives: Record<string, string[]>
    reportUri?: string
  }
  
  // HTTP Strict Transport Security
  hsts: {
    enabled: boolean
    maxAge: number
    includeSubDomains: boolean
    preload: boolean
  }
  
  // Additional security headers
  headers: {
    xFrameOptions: string
    xContentTypeOptions: boolean
    referrerPolicy: string
    permissionsPolicy: string[]
    crossOriginEmbedderPolicy: string
    crossOriginOpenerPolicy: string
    crossOriginResourcePolicy: string
  }
  
  // Rate limiting
  rateLimiting: {
    enabled: boolean
    windowMs: number
    maxRequests: number
    authWindowMs: number
    authMaxRequests: number
  }
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  csp: {
    enabled: true,
    reportOnly: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js in development
        "'unsafe-eval'", // Required for development hot reload
        'https://cdn.sanity.io',
        'https://www.googletagmanager.com',
        'https://analytics.google.com',
        'https://www.google-analytics.com',
        'https://js.sentry-cdn.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and Tailwind
        'https://fonts.googleapis.com',
        'https://cdn.sanity.io'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://images.unsplash.com',
        'https://cdn.sanity.io',
        'https://via.placeholder.com',
        'https://www.google-analytics.com',
        'https://analytics.google.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.sanity.io'
      ],
      'connect-src': [
        "'self'",
        'https://api.sanity.io',
        'https://cdn.sanity.io',
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        'https://www.google-analytics.com',
        'https://analytics.google.com',
        'https://sentry.io',
        'wss://localhost:*', // WebSocket for development
        'ws://localhost:*'
      ].filter(Boolean),
      'frame-src': [
        "'self'",
        'https://www.youtube.com',
        'https://player.vimeo.com'
      ],
      'media-src': [
        "'self'",
        'data:',
        'blob:',
        'https://cdn.sanity.io'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    },
    reportUri: '/api/security/csp-report'
  },
  
  hsts: {
    enabled: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test',
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  headers: {
    xFrameOptions: 'DENY',
    xContentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()'
    ],
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin'
  },
  
  rateLimiting: {
    enabled: true,
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // requests per window
    authWindowMs: 15 * 60 * 1000, // 15 minutes for auth endpoints
    authMaxRequests: 10 // auth requests per window
  }
}

class SecurityHeaders {
  private config: SecurityConfig
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(config?: Partial<SecurityConfig>) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config }
    this.cleanupRateLimitStore()
  }

  /**
   * Apply security headers to response
   */
  applyHeaders(request: NextRequest, response: NextResponse): NextResponse {
    try {
      // Content Security Policy
      if (this.config.csp.enabled) {
        const cspHeader = this.buildCSPHeader()
        const headerName = this.config.csp.reportOnly 
          ? 'Content-Security-Policy-Report-Only' 
          : 'Content-Security-Policy'
        response.headers.set(headerName, cspHeader)
      }

      // HTTP Strict Transport Security
      if (this.config.hsts.enabled) {
        const hstsValue = this.buildHSTSHeader()
        response.headers.set('Strict-Transport-Security', hstsValue)
      }

      // X-Frame-Options
      response.headers.set('X-Frame-Options', this.config.headers.xFrameOptions)

      // X-Content-Type-Options
      if (this.config.headers.xContentTypeOptions) {
        response.headers.set('X-Content-Type-Options', 'nosniff')
      }

      // Referrer Policy
      response.headers.set('Referrer-Policy', this.config.headers.referrerPolicy)

      // Permissions Policy
      if (this.config.headers.permissionsPolicy.length > 0) {
        response.headers.set('Permissions-Policy', this.config.headers.permissionsPolicy.join(', '))
      }

      // Cross-Origin headers
      response.headers.set('Cross-Origin-Embedder-Policy', this.config.headers.crossOriginEmbedderPolicy)
      response.headers.set('Cross-Origin-Opener-Policy', this.config.headers.crossOriginOpenerPolicy)
      response.headers.set('Cross-Origin-Resource-Policy', this.config.headers.crossOriginResourcePolicy)

      // Security-specific headers
      response.headers.set('X-Powered-By', '') // Remove X-Powered-By header
      response.headers.set('Server', '') // Remove Server header
      response.headers.set('X-DNS-Prefetch-Control', 'off')
      response.headers.set('X-Download-Options', 'noopen')
      response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

      // Healthcare-specific security headers
      response.headers.set('X-Content-Security-Policy', 'default-src \'self\'')
      response.headers.set('X-WebKit-CSP', 'default-src \'self\'')
      
      // Cache control for sensitive pages
      if (this.isSensitivePath(request.nextUrl.pathname)) {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
      }

      return response

    } catch (error) {
      logger.error('Error applying security headers:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return response
    }
  }

  /**
   * Check rate limits for incoming requests
   */
  checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    if (!this.config.rateLimiting.enabled) {
      return { allowed: true, remaining: Infinity, resetTime: 0 }
    }

    const clientIP = this.getClientIP(request)
    const isAuthEndpoint = this.isAuthEndpoint(request.nextUrl.pathname)
    
    const windowMs = isAuthEndpoint 
      ? this.config.rateLimiting.authWindowMs 
      : this.config.rateLimiting.windowMs
    
    const maxRequests = isAuthEndpoint 
      ? this.config.rateLimiting.authMaxRequests 
      : this.config.rateLimiting.maxRequests

    const key = `${clientIP}-${isAuthEndpoint ? 'auth' : 'general'}`
    const now = Date.now()
    const rateLimitData = this.rateLimitStore.get(key)

    if (!rateLimitData || now > rateLimitData.resetTime) {
      // First request or window expired
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      }
    }

    if (rateLimitData.count >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimitData.resetTime
      }
    }

    // Increment count
    rateLimitData.count++
    this.rateLimitStore.set(key, rateLimitData)

    return {
      allowed: true,
      remaining: maxRequests - rateLimitData.count,
      resetTime: rateLimitData.resetTime
    }
  }

  /**
   * Add rate limit headers to response
   */
  addRateLimitHeaders(response: NextResponse, rateLimit: { remaining: number; resetTime: number }): void {
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString())
  }

  /**
   * Build Content Security Policy header value
   */
  private buildCSPHeader(): string {
    const directives = Object.entries(this.config.csp.directives)
      .map(([directive, values]) => {
        if (values.length === 0) {
          return directive
        }
        return `${directive} ${values.join(' ')}`
      })
      .join('; ')

    if (this.config.csp.reportUri) {
      return `${directives}; report-uri ${this.config.csp.reportUri}`
    }

    return directives
  }

  /**
   * Build HSTS header value
   */
  private buildHSTSHeader(): string {
    let hsts = `max-age=${this.config.hsts.maxAge}`
    
    if (this.config.hsts.includeSubDomains) {
      hsts += '; includeSubDomains'
    }
    
    if (this.config.hsts.preload) {
      hsts += '; preload'
    }
    
    return hsts
  }

  /**
   * Get client IP address with proxy support
   */
  private getClientIP(request: NextRequest): string {
    // Check various headers that might contain the real IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwardedFor) return forwardedFor.split(',')[0].trim()
    
    return request.ip || '127.0.0.1'
  }

  /**
   * Check if path is an authentication endpoint
   */
  private isAuthEndpoint(pathname: string): boolean {
    const authPaths = [
      '/api/auth',
      '/api/admin/auth',
      '/admin/login',
      '/admin/signup',
      '/api/login',
      '/api/signup',
      '/api/reset-password',
      '/api/verify-email'
    ]

    return authPaths.some(path => pathname.startsWith(path))
  }

  /**
   * Check if path contains sensitive information
   */
  private isSensitivePath(pathname: string): boolean {
    const sensitivePaths = [
      '/admin',
      '/api/admin',
      '/dashboard',
      '/profile',
      '/settings',
      '/api/user',
      '/api/patient',
      '/api/medical'
    ]

    return sensitivePaths.some(path => pathname.startsWith(path))
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitStore(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, data] of this.rateLimitStore.entries()) {
        if (now > data.resetTime) {
          this.rateLimitStore.delete(key)
        }
      }
    }, 60000) // Cleanup every minute
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    logger.info('Security configuration updated')
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config }
  }

  /**
   * Validate CSP directive
   */
  validateCSPDirective(directive: string, values: string[]): boolean {
    const validDirectives = [
      'default-src', 'script-src', 'style-src', 'img-src', 
      'font-src', 'connect-src', 'frame-src', 'media-src',
      'object-src', 'base-uri', 'form-action', 'frame-ancestors'
    ]

    if (!validDirectives.includes(directive)) {
      return false
    }

    // Validate values
    for (const value of values) {
      if (!this.isValidCSPValue(value)) {
        return false
      }
    }

    return true
  }

  /**
   * Check if CSP value is valid
   */
  private isValidCSPValue(value: string): boolean {
    // Allow common CSP values
    const validPatterns = [
      /^'self'$/,
      /^'none'$/,
      /^'unsafe-inline'$/,
      /^'unsafe-eval'$/,
      /^'strict-dynamic'$/,
      /^data:$/,
      /^blob:$/,
      /^https?:\/\/.+/,
      /^wss?:\/\/.+/,
      /^'nonce-.+'$/,
      /^'sha\d+-[A-Za-z0-9+\/]+=*'$/
    ]

    return validPatterns.some(pattern => pattern.test(value))
  }
}

// Export singleton instance
export const securityHeaders = new SecurityHeaders()

// Export class for custom instances
export { SecurityHeaders }

// SecurityConfig is already exported as interface above