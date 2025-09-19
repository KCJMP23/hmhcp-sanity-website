/**
 * Enhanced Security Middleware
 * Comprehensive security layer for all requests
 * OWASP Top 10 compliant with enterprise-grade protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { SecurityMonitoring, SecurityEventType } from './security-monitoring'
import { AuthenticationProtection } from './auth-protection'
import { parseJSON } from './json-parser'
import { InputValidator } from './input-validation'
import { logger } from '@/lib/logger'

export interface SecurityMiddlewareConfig {
  enableCSP: boolean
  enableHSTS: boolean
  enableRateLimiting: boolean
  enableAnomalyDetection: boolean
  enableInputValidation: boolean
  blockSuspiciousRequests: boolean
  logSecurityEvents: boolean
}

const DEFAULT_CONFIG: SecurityMiddlewareConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableRateLimiting: true,
  enableAnomalyDetection: true,
  enableInputValidation: true,
  blockSuspiciousRequests: true,
  logSecurityEvents: true
}

export class EnhancedSecurityMiddleware {
  private config: SecurityMiddlewareConfig

  constructor(config: Partial<SecurityMiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Process request through security layers
   */
  async processRequest(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now()
    const url = new URL(request.url)
    const path = url.pathname
    
    try {
      // Layer 1: Anomaly Detection
      if (this.config.enableAnomalyDetection) {
        const anomalyCheck = SecurityMonitoring.detectAnomalies(request)
        
        if (anomalyCheck.shouldBlock && this.config.blockSuspiciousRequests) {
          if (this.config.logSecurityEvents) {
            await SecurityMonitoring.logSecurityEvent(
              SecurityEventType.SUSPICIOUS_LOGIN,
              request,
              { 
                anomalies: anomalyCheck.anomalies,
                riskScore: anomalyCheck.riskScore 
              },
              { block: true }
            )
          }
          
          logger.warn('Request blocked due to anomalies', {
            path,
            anomalies: anomalyCheck.anomalies,
            riskScore: anomalyCheck.riskScore
          })
          
          return this.createBlockedResponse('Suspicious request detected')
        }
      }

      // Layer 2: Rate Limiting
      if (this.config.enableRateLimiting) {
        const ip = this.getClientIP(request)
        const rateLimitCheck = await AuthenticationProtection.checkIPRateLimit(ip)
        
        if (!rateLimitCheck.allowed) {
          if (this.config.logSecurityEvents) {
            await SecurityMonitoring.logSecurityEvent(
              SecurityEventType.RATE_LIMIT_EXCEEDED,
              request,
              { 
                ip,
                remaining: rateLimitCheck.remaining,
                resetTime: rateLimitCheck.resetTime 
              },
              { block: true }
            )
          }
          
          return this.createRateLimitResponse(rateLimitCheck)
        }
      }

      // Layer 3: Input Validation for POST/PUT/PATCH requests
      if (this.config.enableInputValidation && this.hasBody(request)) {
        const validationResult = await this.validateRequestBody(request)
        
        if (!validationResult.isValid) {
          if (this.config.logSecurityEvents) {
            const eventType = this.determineAttackType(validationResult.threats)
            await SecurityMonitoring.logSecurityEvent(
              eventType,
              request,
              { 
                threats: validationResult.threats,
                errors: validationResult.errors 
              },
              { block: true }
            )
          }
          
          return this.createValidationErrorResponse(validationResult)
        }
      }

      // Layer 4: Path Security
      const pathSecurityCheck = this.checkPathSecurity(path)
      if (!pathSecurityCheck.isSecure) {
        if (this.config.logSecurityEvents) {
          await SecurityMonitoring.logSecurityEvent(
            SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
            request,
            { 
              path,
              issue: pathSecurityCheck.issue 
            },
            { block: true }
          )
        }
        
        return this.createBlockedResponse('Invalid path')
      }

      // Layer 5: Headers Security Check
      const headerCheck = this.checkHeaderSecurity(request.headers)
      if (!headerCheck.isSecure) {
        if (this.config.logSecurityEvents) {
          await SecurityMonitoring.logSecurityEvent(
            SecurityEventType.SUSPICIOUS_LOGIN,
            request,
            { 
              issue: headerCheck.issue,
              headers: headerCheck.suspiciousHeaders 
            },
            { block: true }
          )
        }
        
        if (this.config.blockSuspiciousRequests && headerCheck.critical) {
          return this.createBlockedResponse('Invalid request headers')
        }
      }

      // All checks passed
      return null // Continue to next middleware/route

    } catch (error) {
      logger.error('Security middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path,
        duration: Date.now() - startTime
      })
      
      // Fail closed - block on error
      return this.createErrorResponse()
    }
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse, isProduction: boolean = false): NextResponse {
    // Core security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Download-Options', 'noopen')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
    
    // Remove fingerprinting headers
    response.headers.delete('X-Powered-By')
    response.headers.delete('Server')
    
    // Permissions Policy
    response.headers.set('Permissions-Policy', [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()',
      'battery=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'gamepad=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'serial=()',
      'speaker-selection=()',
      'sync-xhr=()',
      'xr-spatial-tracking=()'
    ].join(', '))
    
    // HSTS (production only)
    if (this.config.enableHSTS && isProduction) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
      )
    }
    
    // Enhanced CSP
    if (this.config.enableCSP) {
      const cspDirectives = this.buildCSP(isProduction)
      response.headers.set('Content-Security-Policy', cspDirectives)
    }
    
    // CORP headers
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
    
    return response
  }

  /**
   * Build Content Security Policy
   */
  private buildCSP(isProduction: boolean): string {
    const directives = [
      `default-src 'self'`,
      `script-src 'self' ${isProduction ? '' : "'unsafe-inline' 'unsafe-eval'"} https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: https: blob:`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' https://*.supabase.co https://www.google-analytics.com ${isProduction ? '' : 'ws://localhost:* wss://localhost:*'}`,
      `media-src 'self'`,
      `object-src 'none'`,
      `child-src 'self'`,
      `frame-src 'self' https://www.youtube.com https://player.vimeo.com`,
      `worker-src 'self' blob:`,
      `form-action 'self'`,
      `base-uri 'self'`,
      `frame-ancestors 'none'`,
      `manifest-src 'self'`,
      isProduction ? `upgrade-insecure-requests` : '',
      `block-all-mixed-content`,
      `require-trusted-types-for 'script'`
    ].filter(Boolean).join('; ')
    
    return directives
  }

  /**
   * Validate request body
   */
  private async validateRequestBody(request: NextRequest): Promise<{
    isValid: boolean
    threats: string[]
    errors: string[]
  }> {
    const threats: string[] = []
    const errors: string[] = []
    
    try {
      const contentType = request.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        const body = await request.text()
        
        // Check body size
        if (body.length > 1000000) { // 1MB limit
          errors.push('Request body too large')
          return { isValid: false, threats, errors }
        }
        
        // Parse JSON safely
        const parseResult = parseJSON(body, {
          maxDepth: 10,
          maxLength: 1000000,
          sanitize: true
        })
        
        if (!parseResult.success) {
          errors.push('Invalid JSON format')
          return { isValid: false, threats, errors }
        }
        
        // Check for dangerous patterns
        const patternCheck = InputValidator.checkDangerousPatterns(body)
        if (patternCheck.flags.length > 0) {
          threats.push(...patternCheck.flags)
        }
        
        return { 
          isValid: threats.length === 0, 
          threats, 
          errors 
        }
      }
      
      return { isValid: true, threats, errors }
      
    } catch (error) {
      logger.error('Body validation error', { error })
      errors.push('Validation error')
      return { isValid: false, threats, errors }
    }
  }

  /**
   * Check path security
   */
  private checkPathSecurity(path: string): {
    isSecure: boolean
    issue?: string
  } {
    // Check for path traversal
    if (path.includes('..') || path.includes('//')) {
      return { isSecure: false, issue: 'path_traversal' }
    }
    
    // Check for null bytes
    if (path.includes('\0')) {
      return { isSecure: false, issue: 'null_byte' }
    }
    
    // Check for encoded traversal
    if (/%2e%2e|%252e%252e/i.test(path)) {
      return { isSecure: false, issue: 'encoded_traversal' }
    }
    
    // Check for suspicious extensions
    const suspiciousExtensions = [
      '.env', '.git', '.svn', '.htaccess', '.htpasswd',
      '.bak', '.backup', '.old', '.orig', '.save',
      '.swp', '.swo', '.DS_Store', '.idea'
    ]
    
    if (suspiciousExtensions.some(ext => path.endsWith(ext))) {
      return { isSecure: false, issue: 'suspicious_file' }
    }
    
    return { isSecure: true }
  }

  /**
   * Check header security
   */
  private checkHeaderSecurity(headers: Headers): {
    isSecure: boolean
    issue?: string
    suspiciousHeaders?: string[]
    critical?: boolean
  } {
    const suspicious: string[] = []
    let critical = false
    
    // Check for header injection
    headers.forEach((value, key) => {
      if (value.includes('\r') || value.includes('\n')) {
        suspicious.push(`${key}: header_injection`)
        critical = true
      }
      
      // Check for oversized headers
      if (value.length > 8192) {
        suspicious.push(`${key}: oversized`)
      }
    })
    
    // Check for suspicious header combinations
    if (headers.get('x-forwarded-host') && headers.get('x-original-host')) {
      suspicious.push('multiple_host_headers')
    }
    
    // Check for cache poisoning attempts
    if (headers.get('x-forwarded-prefix') || headers.get('x-forwarded-path')) {
      suspicious.push('potential_cache_poisoning')
    }
    
    return {
      isSecure: suspicious.length === 0,
      issue: suspicious.join(', '),
      suspiciousHeaders: suspicious,
      critical
    }
  }

  /**
   * Determine attack type from threats
   */
  private determineAttackType(threats: string[]): SecurityEventType {
    if (threats.includes('sql_injection_attempt')) {
      return SecurityEventType.SQL_INJECTION_ATTEMPT
    }
    if (threats.includes('xss_attempt')) {
      return SecurityEventType.XSS_ATTEMPT
    }
    if (threats.includes('command_injection_attempt')) {
      return SecurityEventType.COMMAND_INJECTION_ATTEMPT
    }
    if (threats.includes('path_traversal_attempt')) {
      return SecurityEventType.PATH_TRAVERSAL_ATTEMPT
    }
    if (threats.includes('ldap_injection_attempt')) {
      return SecurityEventType.LDAP_INJECTION_ATTEMPT
    }
    return SecurityEventType.SUSPICIOUS_LOGIN
  }

  /**
   * Check if request has body
   */
  private hasBody(request: NextRequest): boolean {
    const method = request.method.toUpperCase()
    return ['POST', 'PUT', 'PATCH'].includes(method)
  }

  /**
   * Get client IP
   */
  private getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwardedFor) return forwardedFor.split(',')[0].trim()
    
    return request.ip || '127.0.0.1'
  }

  /**
   * Create blocked response
   */
  private createBlockedResponse(message: string): NextResponse {
    return NextResponse.json(
      { error: message },
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  }

  /**
   * Create rate limit response
   */
  private createRateLimitResponse(rateLimit: any): NextResponse {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        retryAfter: rateLimit.retryAfter 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': rateLimit.retryAfter?.toString() || '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toISOString(),
          'Cache-Control': 'no-store'
        }
      }
    )
  }

  /**
   * Create validation error response
   */
  private createValidationErrorResponse(validation: any): NextResponse {
    return NextResponse.json(
      { 
        error: 'Invalid request',
        details: process.env.NODE_ENV === 'development' ? validation.errors : undefined
      },
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  }

  /**
   * Create error response
   */
  private createErrorResponse(): NextResponse {
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}

// Export singleton instance with default config
export const securityMiddleware = new EnhancedSecurityMiddleware()

// Export function for use in middleware.ts
export async function applySecurityMiddleware(
  request: NextRequest,
  config?: Partial<SecurityMiddlewareConfig>
): Promise<NextResponse | null> {
  const middleware = config ? new EnhancedSecurityMiddleware(config) : securityMiddleware
  return middleware.processRequest(request)
}

export default EnhancedSecurityMiddleware