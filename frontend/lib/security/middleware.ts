/**
 * Security Middleware for Next.js
 * Integrates all security components into request processing pipeline
 */

import { NextRequest, NextResponse } from 'next/server'
import { threatDetection, ThreatAnalysisRequest } from './threat-detection'
import { auditLogger, AuditEventType, AuditOutcome } from './audit-logging'
import { securityHeaders } from './security-headers'
import { InputValidator } from './input-validation'
import { logger } from '@/lib/logger'

export interface SecurityMiddlewareOptions {
  enableThreatDetection?: boolean
  enableInputValidation?: boolean
  enableAuditLogging?: boolean
  enableSecurityHeaders?: boolean
  skipPaths?: string[]
  trustedIPs?: string[]
}

const DEFAULT_OPTIONS: SecurityMiddlewareOptions = {
  enableThreatDetection: true,
  enableInputValidation: true,
  enableAuditLogging: true,
  enableSecurityHeaders: true,
  skipPaths: [
    '/api/health',
    '/favicon.ico',
    '/_next/',
    '/studio/'
  ],
  trustedIPs: ['127.0.0.1', '::1']
}

/**
 * Main security middleware function for Next.js
 */
export async function securityMiddleware(
  request: NextRequest,
  options: SecurityMiddlewareOptions = {}
): Promise<NextResponse> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const pathname = request.nextUrl.pathname
  const clientIP = getClientIP(request)
  
  try {
    // Skip security checks for certain paths
    if (shouldSkipPath(pathname, config.skipPaths || [])) {
      return NextResponse.next()
    }

    // Apply security headers first
    let response = NextResponse.next()
    if (config.enableSecurityHeaders) {
      response = securityHeaders.applyHeaders(request, response)
    }

    // Skip further checks for trusted IPs
    if (config.trustedIPs?.includes(clientIP)) {
      return response
    }

    // Input validation for POST/PUT/PATCH requests
    if (config.enableInputValidation && hasRequestBody(request.method)) {
      const validationResult = await validateRequestInput(request)
      if (!validationResult.isValid) {
        await logSecurityViolation(request, 'INPUT_VALIDATION_FAILED', validationResult.errors)
        return createSecurityResponse('Invalid input detected', 400)
      }
    }

    // Threat detection analysis
    if (config.enableThreatDetection) {
      const threatEvent = await analyzeThreatIndicators(request)
      if (threatEvent) {
        // Log the threat
        if (config.enableAuditLogging) {
          auditLogger.logSecurityEvent({
            eventType: AuditEventType.SECURITY_VIOLATION,
            resource: pathname,
            outcome: AuditOutcome.WARNING,
            ipAddress: clientIP,
            userAgent: request.headers.get('user-agent') || undefined,
            details: {
              threatType: threatEvent.threatType,
              severity: threatEvent.severity,
              score: threatEvent.score
            }
          })
        }

        // Return appropriate response based on threat severity
        const blockResponse = shouldBlockRequest(threatEvent)
        if (blockResponse) {
          return blockResponse
        }
      }
    }

    // Log successful request if audit logging enabled
    if (config.enableAuditLogging && pathname.startsWith('/api/')) {
      auditLogger.logSystemEvent({
        eventType: AuditEventType.APPLICATION_ERROR, // Will be overridden by actual event type
        resource: pathname,
        action: request.method as any,
        outcome: AuditOutcome.SUCCESS,
        details: {
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          method: request.method
        }
      })
    }

    return response

  } catch (error) {
    logger.error('Security middleware error:', { error: error instanceof Error ? error.message : 'Unknown error' })
    
    // Log the error
    if (config.enableAuditLogging) {
      auditLogger.logSystemEvent({
        eventType: AuditEventType.APPLICATION_ERROR,
        resource: pathname,
        action: 'MONITOR' as any,
        outcome: AuditOutcome.FAILURE,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      })
    }

    // Don't block requests due to middleware errors
    return NextResponse.next()
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return request.ip || '127.0.0.1'
}

/**
 * Check if path should skip security processing
 */
function shouldSkipPath(pathname: string, skipPaths: string[]): boolean {
  return skipPaths.some(skip => {
    if (skip.endsWith('/')) {
      return pathname.startsWith(skip)
    }
    return pathname === skip || pathname.startsWith(skip + '/')
  })
}

/**
 * Check if request method has body content
 */
function hasRequestBody(method: string): boolean {
  return ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
}

/**
 * Validate request input using InputValidator
 */
async function validateRequestInput(request: NextRequest): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
}> {
  try {
    const url = new URL(request.url)
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validate URL parameters
    for (const [key, value] of url.searchParams.entries()) {
      const result = InputValidator.validate(value, { maxLength: 1000 })
      if (!result.isValid) {
        errors.push(`Invalid URL parameter ${key}: ${result.errors.join(', ')}`)
      }
      if (result.securityFlags.length > 0) {
        warnings.push(`Security flags in parameter ${key}: ${result.securityFlags.join(', ')}`)
      }
    }
    
    // Validate request body if present
    if (hasRequestBody(request.method)) {
      try {
        const body = await request.clone().text()
        if (body) {
          const result = InputValidator.validate(body, { 
            maxLength: 100000, // 100KB limit
            allowHtml: false 
          })
          
          if (!result.isValid) {
            errors.push(`Invalid request body: ${result.errors.join(', ')}`)
          }
          
          if (result.securityFlags.length > 0) {
            warnings.push(`Security flags in body: ${result.securityFlags.join(', ')}`)
          }
        }
      } catch (error) {
        // Body might not be text, that's okay
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
    
  } catch (error) {
    logger.error('Input validation error:', { error: error instanceof Error ? error.message : 'Unknown error' })
    return {
      isValid: true, // Don't block on validation errors
      errors: [],
      warnings: []
    }
  }
}

/**
 * Analyze request for threat indicators
 */
async function analyzeThreatIndicators(request: NextRequest): Promise<any> {
  try {
    const url = new URL(request.url)
    const headers: Record<string, string> = {}
    
    // Convert headers to plain object
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    
    // Get request body for analysis
    let body: any = undefined
    if (hasRequestBody(request.method)) {
      try {
        const bodyText = await request.clone().text()
        if (bodyText) {
          try {
            body = JSON.parse(bodyText)
          } catch {
            body = bodyText
          }
        }
      } catch {
        // Body read failed, continue without it
      }
    }
    
    // Create threat analysis request
    const analysisRequest: ThreatAnalysisRequest = {
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      userId: undefined, // Would be extracted from session
      sessionId: undefined, // Would be extracted from session
      endpoint: url.pathname,
      method: request.method,
      headers,
      body,
      parameters: Object.fromEntries(url.searchParams.entries()),
      timestamp: new Date()
    }
    
    return await threatDetection.analyzeRequest(analysisRequest)
    
  } catch (error) {
    logger.error('Threat analysis error:', { error: error instanceof Error ? error.message : 'Unknown error' })
    return null
  }
}

/**
 * Determine if request should be blocked based on threat
 */
function shouldBlockRequest(threatEvent: any): NextResponse | null {
  // Block critical threats immediately
  if (threatEvent.severity === 'CRITICAL') {
    return createSecurityResponse('Access blocked due to security threat', 403)
  }
  
  // Block high severity threats with certain indicators
  if (threatEvent.severity === 'HIGH') {
    const dangerousIndicators = [
      'sql_injection_pattern',
      'xss_pattern',
      'command_injection_pattern'
    ]
    
    const hasDangerousIndicator = threatEvent.indicators.some((indicator: any) =>
      dangerousIndicators.includes(indicator.name)
    )
    
    if (hasDangerousIndicator) {
      return createSecurityResponse('Access blocked due to malicious pattern', 403)
    }
  }
  
  // Rate limit violations
  const hasRateLimitViolation = threatEvent.indicators.some((indicator: any) =>
    indicator.name === 'rate_limit_violation'
  )
  
  if (hasRateLimitViolation) {
    return createSecurityResponse('Rate limit exceeded', 429)
  }
  
  return null
}

/**
 * Create security response with proper headers
 */
function createSecurityResponse(message: string, status: number): NextResponse {
  const response = NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    { status }
  )
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

/**
 * Log security violation
 */
async function logSecurityViolation(
  request: NextRequest,
  violationType: string,
  details: any
): Promise<void> {
  try {
    auditLogger.logSecurityEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      resource: request.nextUrl.pathname,
      outcome: AuditOutcome.FAILURE,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: {
        violationType,
        details,
        method: request.method,
        url: request.url
      }
    })
  } catch (error) {
    logger.error('Failed to log security violation:', { error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

/**
 * Middleware factory with configuration
 */
export function createSecurityMiddleware(options: SecurityMiddlewareOptions = {}) {
  return (request: NextRequest) => securityMiddleware(request, options)
}

// Export individual functions for testing
export {
  getClientIP,
  shouldSkipPath,
  validateRequestInput,
  analyzeThreatIndicators
}