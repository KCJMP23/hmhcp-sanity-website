/**
 * Enhanced Request Logger with Correlation IDs for HMHCP Admin System
 * 
 * Provides structured logging with:
 * - Request correlation IDs for distributed tracing
 * - HIPAA-compliant context sanitization
 * - Performance metrics tracking
 * - Security event logging
 */

import { NextRequest } from 'next/server'
import logger from '@/lib/logging/winston-logger'

export interface RequestContext {
  correlationId: string
  endpoint: string
  method: string
  timestamp: Date
  userId?: string
  sessionId?: string
  ipAddress: string
  userAgent?: string
  
  // Performance tracking
  startTime: number
  
  // Security context
  isAdmin?: boolean
  role?: string
  
  // Business context (sanitized)
  businessContext?: {
    feature: string
    operation: string
    resourceType?: string
    resourceId?: string
  }
}

export interface RequestMetrics {
  duration: number
  endpoint: string
  method: string
  statusCode: number
  userId?: string
  timestamp: Date
  
  // Performance metrics
  dbQueryCount?: number
  cacheHits?: number
  cacheMisses?: number
  externalApiCalls?: number
}

export class EnhancedRequestLogger {
  private context: RequestContext
  private metrics: Partial<RequestMetrics>
  
  constructor(correlationId: string, requestDetails: Partial<RequestContext>) {
    this.context = {
      correlationId,
      timestamp: new Date(),
      startTime: Date.now(),
      endpoint: requestDetails.endpoint || 'unknown',
      method: requestDetails.method || 'unknown',
      ipAddress: requestDetails.ipAddress || 'unknown',
      ...requestDetails
    }
    
    this.metrics = {
      endpoint: this.context.endpoint,
      method: this.context.method,
      timestamp: this.context.timestamp,
      dbQueryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      externalApiCalls: 0
    }
    
    this.logRequestStart()
  }
  
  /**
   * Create logger from NextRequest with automatic context extraction
   */
  static fromRequest(request: NextRequest, additionalContext?: Partial<RequestContext>): EnhancedRequestLogger {
    const correlationId = 
      request.headers.get('x-correlation-id') || 
      request.headers.get('x-request-id') || 
      crypto.randomUUID()
    
    const ipAddress = this.extractClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined
    
    const context: Partial<RequestContext> = {
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ipAddress,
      userAgent,
      ...additionalContext
    }
    
    return new EnhancedRequestLogger(correlationId, context)
  }
  
  /**
   * Extract client IP address with fallback chain
   */
  private static extractClientIP(request: NextRequest): string {
    // Check various headers for real client IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
    
    const realIP = request.headers.get('x-real-ip')
    if (realIP) return realIP
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) return cfConnectingIP
    
    return request.ip || '127.0.0.1'
  }
  
  /**
   * Log request start with context
   */
  private logRequestStart(): void {
    const startContext = {
      correlationId: this.context.correlationId,
      request: {
        endpoint: this.context.endpoint,
        method: this.context.method,
        timestamp: this.context.timestamp.toISOString(),
        ipAddress: this.context.ipAddress,
        userAgent: this.sanitizeUserAgent(this.context.userAgent)
      },
      user: this.context.userId ? {
        id: this.context.userId,
        role: this.context.role,
        sessionId: this.context.sessionId ? this.maskSessionId(this.context.sessionId) : undefined
      } : undefined,
      business: this.context.businessContext
    }
    
    logger.info('Request started', startContext)
  }
  
  /**
   * Log successful request completion
   */
  logSuccess(statusCode: number = 200, additionalData?: Record<string, any>): void {
    const duration = Date.now() - this.context.startTime
    
    this.metrics.duration = duration
    this.metrics.statusCode = statusCode
    this.metrics.userId = this.context.userId
    
    const successContext = {
      correlationId: this.context.correlationId,
      request: {
        endpoint: this.context.endpoint,
        method: this.context.method,
        statusCode,
        duration
      },
      metrics: this.metrics,
      data: this.sanitizeLogData(additionalData)
    }
    
    logger.info('Request completed successfully', successContext)
    this.recordPerformanceMetrics()
  }
  
  /**
   * Log request failure with error details
   */
  logError(error: Error | string, statusCode: number = 500, additionalContext?: Record<string, any>): void {
    const duration = Date.now() - this.context.startTime
    
    const errorMessage = error instanceof Error ? error.message : error
    const stackTrace = error instanceof Error ? error.stack : undefined
    
    this.metrics.duration = duration
    this.metrics.statusCode = statusCode
    
    const errorContext = {
      correlationId: this.context.correlationId,
      error: {
        message: this.sanitizeErrorMessage(errorMessage),
        name: error instanceof Error ? error.name : 'Error',
        stack: stackTrace,
        statusCode
      },
      request: {
        endpoint: this.context.endpoint,
        method: this.context.method,
        duration,
        ipAddress: this.context.ipAddress
      },
      user: this.context.userId ? {
        id: this.context.userId,
        role: this.context.role
      } : undefined,
      context: this.sanitizeLogData(additionalContext),
      metrics: this.metrics
    }
    
    // Log at appropriate level based on status code
    if (statusCode >= 500) {
      logger.error('Request failed with server error', errorContext)
    } else if (statusCode >= 400) {
      logger.warn('Request failed with client error', errorContext)
    } else {
      logger.info('Request completed with warning', errorContext)
    }
    
    this.recordErrorMetrics(statusCode)
  }
  
  /**
   * Log security events (authentication, authorization, suspicious activity)
   */
  logSecurityEvent(
    eventType: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'access_denied' | 'suspicious_activity',
    details: Record<string, any>
  ): void {
    const securityContext = {
      correlationId: this.context.correlationId,
      security: {
        eventType,
        timestamp: new Date().toISOString(),
        ipAddress: this.context.ipAddress,
        userAgent: this.sanitizeUserAgent(this.context.userAgent),
        endpoint: this.context.endpoint,
        userId: this.context.userId,
        sessionId: this.context.sessionId ? this.maskSessionId(this.context.sessionId) : undefined
      },
      details: this.sanitizeSecurityData(details)
    }
    
    // Security events are always logged as warnings or errors
    if (eventType.includes('failure') || eventType === 'suspicious_activity' || eventType === 'access_denied') {
      logger.error('Security event detected', securityContext)
    } else {
      logger.warn('Security event logged', securityContext)
    }
  }
  
  /**
   * Log API calls to external services
   */
  logExternalApiCall(
    service: string,
    operation: string,
    success: boolean,
    duration: number,
    statusCode?: number
  ): void {
    this.metrics.externalApiCalls = (this.metrics.externalApiCalls || 0) + 1
    
    const apiContext = {
      correlationId: this.context.correlationId,
      externalApi: {
        service,
        operation,
        success,
        duration,
        statusCode,
        timestamp: new Date().toISOString()
      },
      parentRequest: {
        endpoint: this.context.endpoint,
        method: this.context.method
      }
    }
    
    if (success) {
      logger.info('External API call successful', apiContext)
    } else {
      logger.warn('External API call failed', apiContext)
    }
  }
  
  /**
   * Log database operations
   */
  logDatabaseOperation(
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    success: boolean,
    duration: number,
    recordCount?: number
  ): void {
    this.metrics.dbQueryCount = (this.metrics.dbQueryCount || 0) + 1
    
    const dbContext = {
      correlationId: this.context.correlationId,
      database: {
        operation,
        table,
        success,
        duration,
        recordCount,
        timestamp: new Date().toISOString()
      },
      parentRequest: {
        endpoint: this.context.endpoint,
        method: this.context.method
      }
    }
    
    if (success) {
      logger.info('Database operation completed', dbContext)
    } else {
      logger.error('Database operation failed', dbContext)
    }
  }
  
  /**
   * Log cache operations
   */
  logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): void {
    if (operation === 'hit') {
      this.metrics.cacheHits = (this.metrics.cacheHits || 0) + 1
    } else if (operation === 'miss') {
      this.metrics.cacheMisses = (this.metrics.cacheMisses || 0) + 1
    }
    
    const cacheContext = {
      correlationId: this.context.correlationId,
      cache: {
        operation,
        key: this.sanitizeCacheKey(key),
        duration,
        timestamp: new Date().toISOString()
      }
    }
    
    logger.debug('Cache operation', cacheContext)
  }
  
  /**
   * Update user context (for authenticated requests)
   */
  setUserContext(userId: string, role?: string, sessionId?: string): void {
    this.context.userId = userId
    this.context.role = role
    this.context.sessionId = sessionId
    
    logger.info('User context updated', {
      correlationId: this.context.correlationId,
      userId,
      role,
      sessionId: sessionId ? this.maskSessionId(sessionId) : undefined
    })
  }
  
  /**
   * Set business context for the request
   */
  setBusinessContext(feature: string, operation: string, resourceType?: string, resourceId?: string): void {
    this.context.businessContext = {
      feature,
      operation,
      resourceType,
      resourceId: resourceId ? this.maskResourceId(resourceId) : undefined
    }
  }
  
  /**
   * Get correlation ID for response headers
   */
  getCorrelationId(): string {
    return this.context.correlationId
  }
  
  /**
   * Get current request metrics
   */
  getMetrics(): RequestMetrics {
    return {
      ...this.metrics,
      duration: Date.now() - this.context.startTime,
      timestamp: this.context.timestamp
    } as RequestMetrics
  }
  
  // Private sanitization methods
  
  private sanitizeUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined
    
    // Remove potentially identifying information but keep browser/OS info
    return userAgent
      .replace(/\d+\.\d+\.\d+\.\d+/g, '[VERSION]') // Version numbers
      .substring(0, 200) // Limit length
  }
  
  private sanitizeErrorMessage(message: string): string {
    return message
      .replace(/password/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/key/gi, '[REDACTED]')
      .replace(/secret/gi, '[REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL-REDACTED]')
      .substring(0, 500) // Limit message length
  }
  
  private sanitizeLogData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined
    
    const sanitized = { ...data }
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }
  
  private sanitizeSecurityData(data: Record<string, any>): Record<string, any> {
    const sanitized = this.sanitizeLogData(data) || {}
    
    // Additional security-specific sanitization
    if ('email' in sanitized && typeof sanitized.email === 'string') {
      sanitized.email = this.maskEmail(sanitized.email)
    }
    
    return sanitized
  }
  
  private maskSessionId(sessionId: string): string {
    return sessionId.substring(0, 8) + '***'
  }
  
  private maskResourceId(resourceId: string): string {
    return resourceId.length > 8 ? resourceId.substring(0, 8) + '***' : resourceId
  }
  
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!domain) return '[INVALID-EMAIL]'
    
    const maskedLocal = local.length > 3 ? local.substring(0, 3) + '***' : '***'
    return `${maskedLocal}@${domain}`
  }
  
  private sanitizeCacheKey(key: string): string {
    // Remove potentially sensitive parts of cache keys
    return key
      .replace(/user:\w+/g, 'user:[ID]')
      .replace(/session:\w+/g, 'session:[ID]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
  }
  
  private recordPerformanceMetrics(): void {
    // In a production environment, this would send metrics to a monitoring system
    if (this.metrics.duration && this.metrics.duration > 5000) {
      logger.warn('Slow request detected', {
        correlationId: this.context.correlationId,
        endpoint: this.context.endpoint,
        duration: this.metrics.duration,
        metrics: this.metrics
      })
    }
  }
  
  private recordErrorMetrics(statusCode: number): void {
    // Record error metrics for monitoring
    const errorType = statusCode >= 500 ? 'server_error' : 'client_error'
    
    logger.info('Error metrics recorded', {
      correlationId: this.context.correlationId,
      errorType,
      statusCode,
      endpoint: this.context.endpoint,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Factory function to create request logger from NextRequest
 */
export function createEnhancedRequestLogger(
  request: NextRequest,
  additionalContext?: Partial<RequestContext>
): EnhancedRequestLogger {
  return EnhancedRequestLogger.fromRequest(request, additionalContext)
}

/**
 * Factory function to create request logger with manual context
 */
export function createManualRequestLogger(
  correlationId: string,
  context: Partial<RequestContext>
): EnhancedRequestLogger {
  return new EnhancedRequestLogger(correlationId, context)
}