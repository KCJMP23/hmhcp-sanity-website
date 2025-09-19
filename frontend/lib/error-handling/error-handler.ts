/**
 * Centralized Error Handler for HMHCP Admin System
 * 
 * Provides comprehensive error handling with:
 * - HIPAA-compliant error sanitization
 * - Structured logging with correlation IDs
 * - Security-aware error classification
 * - Healthcare-specific error patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRequestLogger } from '@/lib/logging/winston-logger'
import { z } from 'zod'

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error categories for healthcare compliance
export type ErrorCategory = 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'database' 
  | 'network' 
  | 'business_logic' 
  | 'security' 
  | 'compliance' 
  | 'system'

// HIPAA-compliant error context (no PHI)
export interface ErrorContext {
  correlationId: string
  userId?: string
  endpoint: string
  method: string
  timestamp: Date
  requestId?: string
  userAgent?: string
  ipAddress: string
  sessionId?: string
  
  // System context (safe to log)
  systemInfo?: {
    nodeVersion?: string
    environment?: string
    region?: string
  }
  
  // Business context (sanitized)
  businessContext?: {
    feature: string
    operation: string
    resourceType?: string
    resourceCount?: number
  }
}

// Internal error details (server-side only)
interface InternalErrorDetails {
  originalError: Error
  stackTrace?: string
  sqlQuery?: string
  databaseError?: any
  validationErrors?: z.ZodError[]
  securityFlags?: string[]
}

// Public error response (user-facing)
export interface PublicErrorResponse {
  error: string
  correlationId: string
  timestamp: string
  category: ErrorCategory
  severity: ErrorSeverity
  retryable: boolean
  userMessage: string
  supportInfo?: {
    documentationUrl?: string
    contactSupport?: boolean
    expectedResolution?: string
  }
}

// Error classification rules
const ERROR_CLASSIFICATIONS = {
  // Database errors
  'connection refused': { category: 'database' as ErrorCategory, severity: 'high' as ErrorSeverity, retryable: true },
  'timeout': { category: 'database' as ErrorCategory, severity: 'medium' as ErrorSeverity, retryable: true },
  'duplicate key': { category: 'validation' as ErrorCategory, severity: 'low' as ErrorSeverity, retryable: false },
  
  // Authentication errors
  'invalid credentials': { category: 'authentication' as ErrorCategory, severity: 'medium' as ErrorSeverity, retryable: false },
  'session expired': { category: 'authentication' as ErrorCategory, severity: 'low' as ErrorSeverity, retryable: false },
  'account locked': { category: 'security' as ErrorCategory, severity: 'medium' as ErrorSeverity, retryable: false },
  
  // Authorization errors
  'insufficient privileges': { category: 'authorization' as ErrorCategory, severity: 'medium' as ErrorSeverity, retryable: false },
  'access denied': { category: 'authorization' as ErrorCategory, severity: 'medium' as ErrorSeverity, retryable: false },
  
  // Rate limiting
  'rate limit exceeded': { category: 'security' as ErrorCategory, severity: 'medium' as ErrorSeverity, retryable: true },
  
  // Validation errors
  'validation failed': { category: 'validation' as ErrorCategory, severity: 'low' as ErrorSeverity, retryable: false },
  'invalid input': { category: 'validation' as ErrorCategory, severity: 'low' as ErrorSeverity, retryable: false },
  
  // System errors
  'out of memory': { category: 'system' as ErrorCategory, severity: 'critical' as ErrorSeverity, retryable: true },
  'service unavailable': { category: 'system' as ErrorCategory, severity: 'high' as ErrorSeverity, retryable: true },
}

export class AdminErrorHandler {
  
  /**
   * Handle errors in API routes with HIPAA compliance
   */
  static async handleApiError(
    error: unknown,
    context: Partial<ErrorContext>,
    internalDetails?: Partial<InternalErrorDetails>
  ): Promise<NextResponse> {
    
    const correlationId = context.correlationId || crypto.randomUUID()
    const timestamp = new Date()
    
    // Create structured error context
    const errorContext: ErrorContext = {
      correlationId,
      timestamp,
      endpoint: context.endpoint || 'unknown',
      method: context.method || 'unknown',
      ipAddress: context.ipAddress || 'unknown',
      ...context
    }
    
    // Initialize logger with correlation ID
    const logger = createRequestLogger(correlationId, {
      endpoint: errorContext.endpoint,
      method: errorContext.method
    })
    
    // Classify the error
    const classification = this.classifyError(error)
    
    // Create internal error record (server-side logging only)
    const internalError = this.createInternalErrorRecord(
      error,
      errorContext,
      classification,
      internalDetails
    )
    
    // Log error server-side with full details
    await this.logInternalError(logger, internalError)
    
    // Create sanitized public response
    const publicResponse = this.createPublicErrorResponse(
      classification,
      errorContext,
      internalError
    )
    
    // Record security events if needed
    if (classification.category === 'security' || classification.severity === 'critical') {
      await this.recordSecurityEvent(internalError, errorContext)
    }
    
    // Return appropriate HTTP response
    return this.createHttpResponse(publicResponse, classification)
  }
  
  /**
   * Handle frontend errors with user-friendly messages
   */
  static handleClientError(error: unknown, context: Partial<ErrorContext>): PublicErrorResponse {
    const correlationId = context.correlationId || crypto.randomUUID()
    const classification = this.classifyError(error)
    
    const errorContext: ErrorContext = {
      correlationId,
      timestamp: new Date(),
      endpoint: context.endpoint || 'client',
      method: context.method || 'unknown',
      ipAddress: context.ipAddress || 'unknown',
      ...context
    }
    
    return this.createPublicErrorResponse(
      classification,
      errorContext,
      { originalError: error as Error }
    )
  }
  
  /**
   * Classify error type and determine handling approach
   */
  private static classifyError(error: unknown): { 
    category: ErrorCategory
    severity: ErrorSeverity
    retryable: boolean
    statusCode: number
  } {
    
    let errorMessage = ''
    
    if (error instanceof Error) {
      errorMessage = error.message.toLowerCase()
    } else if (typeof error === 'string') {
      errorMessage = error.toLowerCase()
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message).toLowerCase()
    }
    
    // Check known error patterns
    for (const [pattern, classification] of Object.entries(ERROR_CLASSIFICATIONS)) {
      if (errorMessage.includes(pattern)) {
        return {
          ...classification,
          statusCode: this.getHttpStatusCode(classification.category)
        }
      }
    }
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        category: 'validation',
        severity: 'low',
        retryable: false,
        statusCode: 400
      }
    }
    
    // Handle database specific errors
    if (errorMessage.includes('database') || errorMessage.includes('postgres') || errorMessage.includes('sql')) {
      return {
        category: 'database',
        severity: 'high',
        retryable: true,
        statusCode: 503
      }
    }
    
    // Default classification for unknown errors
    return {
      category: 'system',
      severity: 'medium',
      retryable: true,
      statusCode: 500
    }
  }
  
  /**
   * Create internal error record with full details (server-side only)
   */
  private static createInternalErrorRecord(
    error: unknown,
    context: ErrorContext,
    classification: ReturnType<typeof this.classifyError>,
    internalDetails?: Partial<InternalErrorDetails>
  ): InternalErrorDetails & { context: ErrorContext; classification: ReturnType<typeof this.classifyError> } {
    
    const originalError = error instanceof Error ? error : new Error(String(error))
    
    return {
      originalError,
      stackTrace: originalError.stack,
      ...internalDetails,
      context,
      classification
    }
  }
  
  /**
   * Log internal error with full details
   */
  private static async logInternalError(
    logger: ReturnType<typeof createRequestLogger>,
    internalError: ReturnType<typeof this.createInternalErrorRecord>
  ): Promise<void> {
    
    const { originalError, context, classification, stackTrace, sqlQuery, databaseError, validationErrors, securityFlags } = internalError
    
    const logLevel = this.getLogLevel(classification.severity)
    
    const logData = {
      correlationId: context.correlationId,
      error: {
        message: originalError.message,
        name: originalError.name,
        stack: stackTrace
      },
      context: {
        endpoint: context.endpoint,
        method: context.method,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: context.timestamp.toISOString()
      },
      classification: {
        category: classification.category,
        severity: classification.severity,
        retryable: classification.retryable
      },
      technical: {
        sqlQuery: sqlQuery ? this.sanitizeSqlQuery(sqlQuery) : undefined,
        databaseError: databaseError ? this.sanitizeDatabaseError(databaseError) : undefined,
        validationErrors: validationErrors?.map(err => err.errors) || undefined,
        securityFlags
      }
    }
    
    // Log based on severity
    switch (logLevel) {
      case 'error':
        logger.error('Admin system error', logData)
        break
      case 'warn':
        logger.warn('Admin system warning', logData)
        break
      default:
        logger.info('Admin system info', logData)
    }
  }
  
  /**
   * Create HIPAA-compliant public error response
   */
  private static createPublicErrorResponse(
    classification: ReturnType<typeof this.classifyError>,
    context: ErrorContext,
    internalError: { originalError: Error }
  ): PublicErrorResponse {
    
    // Get user-friendly message based on category
    const userMessage = this.getUserFriendlyMessage(classification.category, classification.severity)
    
    // Get sanitized error message
    const sanitizedError = this.sanitizeErrorMessage(
      internalError.originalError.message,
      classification.category
    )
    
    return {
      error: sanitizedError,
      correlationId: context.correlationId,
      timestamp: context.timestamp.toISOString(),
      category: classification.category,
      severity: classification.severity,
      retryable: classification.retryable,
      userMessage,
      supportInfo: this.getSupportInfo(classification.category, classification.severity)
    }
  }
  
  /**
   * Get user-friendly error messages
   */
  private static getUserFriendlyMessage(category: ErrorCategory, severity: ErrorSeverity): string {
    const messages = {
      authentication: {
        low: 'Please check your login credentials and try again.',
        medium: 'There was an issue with your authentication. Please log in again.',
        high: 'Authentication service is temporarily unavailable. Please try again in a few minutes.',
        critical: 'Authentication system is experiencing issues. Please contact support.'
      },
      authorization: {
        low: 'You do not have permission to perform this action.',
        medium: 'Access denied. Please contact your administrator if you believe this is an error.',
        high: 'Authorization service is temporarily unavailable.',
        critical: 'Critical authorization error. Please contact support immediately.'
      },
      validation: {
        low: 'Please check your input and try again.',
        medium: 'Some of the provided data is invalid. Please review and correct.',
        high: 'Data validation failed. Please contact support if the issue persists.',
        critical: 'Critical validation error. Please contact support.'
      },
      database: {
        low: 'Data operation could not be completed. Please try again.',
        medium: 'Database is temporarily busy. Please try again in a moment.',
        high: 'Database service is experiencing issues. Please try again later.',
        critical: 'Critical database error. Please contact support immediately.'
      },
      network: {
        low: 'Network request failed. Please check your connection and try again.',
        medium: 'Network connectivity issues detected. Please try again.',
        high: 'Network services are experiencing issues.',
        critical: 'Critical network failure. Please contact support.'
      },
      security: {
        low: 'Security check failed. Please try again.',
        medium: 'Security policy violation detected. Please contact support.',
        high: 'Security service is temporarily unavailable.',
        critical: 'Critical security incident detected. Please contact support immediately.'
      },
      system: {
        low: 'A system error occurred. Please try again.',
        medium: 'System is temporarily busy. Please try again in a moment.',
        high: 'System is experiencing issues. Please try again later.',
        critical: 'Critical system error. Please contact support immediately.'
      }
    } as const
    
    return messages[category]?.[severity] || messages.system[severity]
  }
  
  /**
   * Sanitize error messages to prevent information disclosure
   */
  private static sanitizeErrorMessage(message: string, category: ErrorCategory): string {
    // Remove potentially sensitive information
    const sanitized = message
      .replace(/password/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/key/gi, '[REDACTED]')
      .replace(/secret/gi, '[REDACTED]')
      .replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, '[CARD-REDACTED]') // Credit card patterns
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-REDACTED]') // SSN patterns
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL-REDACTED]') // Email patterns
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP-REDACTED]') // IP addresses
      .replace(/\/[^\s]+/g, '[PATH-REDACTED]') // File paths
    
    // Category-specific sanitization
    switch (category) {
      case 'database':
        return 'Database operation failed'
      case 'authentication':
        return 'Authentication failed'
      case 'authorization':
        return 'Access denied'
      case 'security':
        return 'Security check failed'
      default:
        return sanitized.substring(0, 100) // Limit message length
    }
  }
  
  /**
   * Record security events for monitoring
   */
  private static async recordSecurityEvent(
    internalError: ReturnType<typeof this.createInternalErrorRecord>,
    context: ErrorContext
  ): Promise<void> {
    // Implementation would send to security monitoring system
    // For now, just enhanced logging
    console.warn('SECURITY EVENT:', {
      correlationId: context.correlationId,
      category: internalError.classification.category,
      severity: internalError.classification.severity,
      endpoint: context.endpoint,
      userId: context.userId,
      ipAddress: context.ipAddress,
      timestamp: context.timestamp
    })
  }
  
  /**
   * Helper methods
   */
  private static getHttpStatusCode(category: ErrorCategory): number {
    const statusMap = {
      authentication: 401,
      authorization: 403,
      validation: 400,
      database: 503,
      network: 503,
      security: 403,
      business_logic: 400,
      compliance: 400,
      system: 500
    }
    return statusMap[category] || 500
  }
  
  private static getLogLevel(severity: ErrorSeverity): 'info' | 'warn' | 'error' {
    const levelMap = {
      low: 'info' as const,
      medium: 'warn' as const,
      high: 'error' as const,
      critical: 'error' as const
    }
    return levelMap[severity]
  }
  
  private static getSupportInfo(category: ErrorCategory, severity: ErrorSeverity) {
    if (severity === 'critical' || category === 'security') {
      return {
        contactSupport: true,
        expectedResolution: 'Immediate attention required',
        documentationUrl: '/docs/troubleshooting'
      }
    }
    
    if (severity === 'high') {
      return {
        contactSupport: true,
        expectedResolution: 'Within 24 hours',
        documentationUrl: '/docs/common-issues'
      }
    }
    
    return {
      documentationUrl: '/docs/help',
      expectedResolution: 'Self-service resolution available'
    }
  }
  
  private static sanitizeSqlQuery(query: string): string {
    // Remove potentially sensitive data from SQL queries
    return query
      .replace(/VALUES\s*\([^)]*\)/gi, 'VALUES ([REDACTED])')
      .replace(/SET\s+[^=]+=\s*'[^']*'/gi, 'SET [FIELD] = [REDACTED]')
      .replace(/WHERE\s+[^=]+=\s*'[^']*'/gi, 'WHERE [CONDITION] = [REDACTED]')
  }
  
  private static sanitizeDatabaseError(dbError: any): any {
    if (typeof dbError === 'object' && dbError !== null) {
      const sanitized = { ...dbError }
      delete sanitized.query
      delete sanitized.parameters
      return sanitized
    }
    return String(dbError).substring(0, 200)
  }
  
  /**
   * Create HTTP response with appropriate headers
   */
  private static createHttpResponse(
    publicResponse: PublicErrorResponse,
    classification: ReturnType<typeof this.classifyError>
  ): NextResponse {
    
    const response = NextResponse.json(publicResponse, {
      status: classification.statusCode
    })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    
    // Add correlation header for tracking
    response.headers.set('X-Correlation-ID', publicResponse.correlationId)
    
    // Add retry headers for retryable errors
    if (classification.retryable) {
      const retryAfter = this.getRetryDelay(classification.severity)
      response.headers.set('Retry-After', retryAfter.toString())
    }
    
    return response
  }
  
  private static getRetryDelay(severity: ErrorSeverity): number {
    const delayMap = {
      low: 1,
      medium: 5,
      high: 30,
      critical: 300
    }
    return delayMap[severity]
  }
}

/**
 * Convenience wrapper for API route error handling
 */
export const handleApiError = AdminErrorHandler.handleApiError

/**
 * Convenience wrapper for client error handling  
 */
export const handleClientError = AdminErrorHandler.handleClientError