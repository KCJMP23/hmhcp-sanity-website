/**
 * Universal API Request Validation Middleware
 * 
 * Provides comprehensive request validation for all API routes
 * with security-focused validation, healthcare compliance, and performance optimization
 * 
 * @module lib/validation/middleware/api-validator
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError, ZodSchema, ZodType } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { createHash } from 'crypto'
import { RateLimiter } from '@/lib/security/rate-limiter'
import { SecurityHeaders } from '@/lib/security/headers'
import { AuditLogger } from '@/lib/monitoring/audit-logger'
import { PerformanceMonitor } from '@/lib/monitoring/performance'
import { validateHealthcareData } from './healthcare-validator'
import { SecurityValidator } from './security-validator'
import { InputSanitizer } from './input-sanitizer'
import { ValidationCache } from './validation-cache'
import { ErrorFormatter } from './error-formatter'

/**
 * Validation configuration options
 */
export interface ValidationConfig {
  /** Enable request body validation */
  validateBody?: boolean
  /** Enable query parameter validation */
  validateQuery?: boolean
  /** Enable header validation */
  validateHeaders?: boolean
  /** Enable path parameter validation */
  validateParams?: boolean
  /** Enable response validation */
  validateResponse?: boolean
  /** Maximum request size in bytes */
  maxRequestSize?: number
  /** Request timeout in milliseconds */
  requestTimeout?: number
  /** Enable HIPAA compliance validation */
  hipaaCompliant?: boolean
  /** Enable PII detection */
  detectPII?: boolean
  /** Enable SQL injection protection */
  preventSQLInjection?: boolean
  /** Enable XSS protection */
  preventXSS?: boolean
  /** Enable NoSQL injection protection */
  preventNoSQLInjection?: boolean
  /** Custom error messages */
  errorMessages?: Record<string, string>
  /** Enable validation caching */
  enableCache?: boolean
  /** Cache TTL in seconds */
  cacheTTL?: number
  /** Enable audit logging */
  enableAuditLog?: boolean
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean
  /** Allowed content types */
  allowedContentTypes?: string[]
  /** Allowed methods */
  allowedMethods?: string[]
  /** Required headers */
  requiredHeaders?: string[]
  /** Forbidden headers */
  forbiddenHeaders?: string[]
  /** Enable progressive validation */
  progressiveValidation?: boolean
  /** Multi-language support */
  locale?: string
  /** Custom validation rules */
  customValidators?: Array<(data: any) => Promise<boolean>>
}

/**
 * Default validation configuration
 */
const DEFAULT_CONFIG: ValidationConfig = {
  validateBody: true,
  validateQuery: true,
  validateHeaders: true,
  validateParams: true,
  validateResponse: false,
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  requestTimeout: 30000, // 30 seconds
  hipaaCompliant: true,
  detectPII: true,
  preventSQLInjection: true,
  preventXSS: true,
  preventNoSQLInjection: true,
  enableCache: true,
  cacheTTL: 300, // 5 minutes
  enableAuditLog: true,
  enablePerformanceMonitoring: true,
  allowedContentTypes: ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  progressiveValidation: true,
  locale: 'en'
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  sanitizedData?: any
  metadata?: ValidationMetadata
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'critical'
  suggestion?: string
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  field: string
  message: string
  code: string
  suggestion?: string
}

/**
 * Validation metadata interface
 */
export interface ValidationMetadata {
  validationTime: number
  schemaVersion: string
  validatorVersion: string
  cached: boolean
  complianceChecks: {
    hipaa: boolean
    pii: boolean
    injection: boolean
  }
}

/**
 * Main API validator class
 */
export class APIValidator {
  private config: ValidationConfig
  private rateLimiter: RateLimiter
  private securityHeaders: SecurityHeaders
  private auditLogger: AuditLogger
  private performanceMonitor: PerformanceMonitor
  private securityValidator: SecurityValidator
  private inputSanitizer: InputSanitizer
  private validationCache: ValidationCache
  private errorFormatter: ErrorFormatter
  private compiledSchemas: Map<string, ZodSchema> = new Map()

  constructor(config: ValidationConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.rateLimiter = new RateLimiter()
    this.securityHeaders = new SecurityHeaders()
    this.auditLogger = new AuditLogger()
    this.performanceMonitor = new PerformanceMonitor()
    this.securityValidator = new SecurityValidator(this.config)
    this.inputSanitizer = new InputSanitizer(this.config)
    this.validationCache = new ValidationCache(this.config.cacheTTL || 300)
    this.errorFormatter = new ErrorFormatter(this.config.locale || 'en')
  }

  /**
   * Validate API request
   */
  async validateRequest(
    request: NextRequest,
    schema?: {
      body?: ZodSchema
      query?: ZodSchema
      headers?: ZodSchema
      params?: ZodSchema
    }
  ): Promise<ValidationResult> {
    const startTime = Date.now()
    const requestId = this.generateRequestId(request)
    
    try {
      // Performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.startTransaction(requestId)
      }

      // Check cache for validation result
      if (this.config.enableCache) {
        const cachedResult = await this.validationCache.get(requestId)
        if (cachedResult) {
          return {
            ...cachedResult,
            metadata: {
              ...cachedResult.metadata,
              cached: true,
              validationTime: Date.now() - startTime
            }
          }
        }
      }

      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      let sanitizedData: any = {}

      // 1. Security header validation
      const headerValidation = await this.validateHeaders(request, schema?.headers)
      if (!headerValidation.valid) {
        errors.push(...(headerValidation.errors || []))
      }
      warnings.push(...(headerValidation.warnings || []))

      // 2. Method validation
      if (!this.isMethodAllowed(request.method)) {
        errors.push({
          field: 'method',
          message: `Method ${request.method} is not allowed`,
          code: 'METHOD_NOT_ALLOWED',
          severity: 'error'
        })
      }

      // 3. Content-Type validation
      const contentType = request.headers.get('content-type')
      if (contentType && !this.isContentTypeAllowed(contentType)) {
        errors.push({
          field: 'content-type',
          message: `Content-Type ${contentType} is not allowed`,
          code: 'INVALID_CONTENT_TYPE',
          severity: 'error'
        })
      }

      // 4. Request size validation
      const contentLength = parseInt(request.headers.get('content-length') || '0')
      if (contentLength > (this.config.maxRequestSize || Infinity)) {
        errors.push({
          field: 'content-length',
          message: `Request size ${contentLength} exceeds maximum allowed size`,
          code: 'REQUEST_TOO_LARGE',
          severity: 'critical'
        })
      }

      // 5. Body validation
      if (this.config.validateBody && schema?.body && request.body) {
        const bodyValidation = await this.validateBody(request, schema.body)
        if (!bodyValidation.valid) {
          errors.push(...(bodyValidation.errors || []))
        } else {
          sanitizedData.body = bodyValidation.sanitizedData
        }
        warnings.push(...(bodyValidation.warnings || []))
      }

      // 6. Query parameter validation
      if (this.config.validateQuery && schema?.query) {
        const queryValidation = await this.validateQueryParams(request, schema.query)
        if (!queryValidation.valid) {
          errors.push(...(queryValidation.errors || []))
        } else {
          sanitizedData.query = queryValidation.sanitizedData
        }
        warnings.push(...(queryValidation.warnings || []))
      }

      // 7. Path parameter validation
      if (this.config.validateParams && schema?.params) {
        const paramsValidation = await this.validatePathParams(request, schema.params)
        if (!paramsValidation.valid) {
          errors.push(...(paramsValidation.errors || []))
        } else {
          sanitizedData.params = paramsValidation.sanitizedData
        }
        warnings.push(...(paramsValidation.warnings || []))
      }

      // 8. Security validation (SQL injection, XSS, NoSQL injection)
      const securityValidation = await this.securityValidator.validate(sanitizedData)
      if (!securityValidation.valid) {
        errors.push(...(securityValidation.errors || []))
      }
      warnings.push(...(securityValidation.warnings || []))

      // 9. Healthcare compliance validation
      if (this.config.hipaaCompliant) {
        const healthcareValidation = await validateHealthcareData(sanitizedData, {
          detectPII: this.config.detectPII || false,
          hipaaCompliant: true
        })
        if (!healthcareValidation.valid) {
          errors.push(...(healthcareValidation.errors || []))
        }
        warnings.push(...(healthcareValidation.warnings || []))
      }

      // 10. Custom validators
      if (this.config.customValidators) {
        for (const validator of this.config.customValidators) {
          const isValid = await validator(sanitizedData)
          if (!isValid) {
            errors.push({
              field: 'custom',
              message: 'Custom validation failed',
              code: 'CUSTOM_VALIDATION_FAILED',
              severity: 'error'
            })
          }
        }
      }

      const result: ValidationResult = {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        sanitizedData,
        metadata: {
          validationTime: Date.now() - startTime,
          schemaVersion: '1.0.0',
          validatorVersion: '1.0.0',
          cached: false,
          complianceChecks: {
            hipaa: this.config.hipaaCompliant || false,
            pii: this.config.detectPII || false,
            injection: this.config.preventSQLInjection || false
          }
        }
      }

      // Cache successful validation result
      if (this.config.enableCache && result.valid) {
        await this.validationCache.set(requestId, result)
      }

      // Audit logging
      if (this.config.enableAuditLog) {
        await this.auditLogger.log({
          action: 'API_VALIDATION',
          requestId,
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
          metadata: result.metadata
        })
      }

      // Performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.endTransaction(requestId, {
          validationTime: result.metadata?.validationTime,
          errors: errors.length,
          warnings: warnings.length
        })
      }

      return result

    } catch (error) {
      // Log validation error
      if (this.config.enableAuditLog) {
        await this.auditLogger.logError({
          action: 'API_VALIDATION_ERROR',
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      return {
        valid: false,
        errors: [{
          field: 'system',
          message: 'Internal validation error',
          code: 'INTERNAL_VALIDATION_ERROR',
          severity: 'critical'
        }],
        metadata: {
          validationTime: Date.now() - startTime,
          schemaVersion: '1.0.0',
          validatorVersion: '1.0.0',
          cached: false,
          complianceChecks: {
            hipaa: false,
            pii: false,
            injection: false
          }
        }
      }
    }
  }

  /**
   * Validate request headers
   */
  private async validateHeaders(
    request: NextRequest,
    schema?: ZodSchema
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let sanitizedData: any = {}

    // Check required headers
    if (this.config.requiredHeaders) {
      for (const header of this.config.requiredHeaders) {
        if (!request.headers.get(header)) {
          errors.push({
            field: `header.${header}`,
            message: `Required header '${header}' is missing`,
            code: 'MISSING_REQUIRED_HEADER',
            severity: 'error'
          })
        }
      }
    }

    // Check forbidden headers
    if (this.config.forbiddenHeaders) {
      for (const header of this.config.forbiddenHeaders) {
        if (request.headers.get(header)) {
          errors.push({
            field: `header.${header}`,
            message: `Forbidden header '${header}' is present`,
            code: 'FORBIDDEN_HEADER_PRESENT',
            severity: 'critical'
          })
        }
      }
    }

    // Validate against schema if provided
    if (schema) {
      const headers = Object.fromEntries(request.headers.entries())
      try {
        sanitizedData = await schema.parseAsync(headers)
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(...this.formatZodErrors(error))
        }
      }
    }

    // Security header checks
    const securityHeaderCheck = this.securityHeaders.validateHeaders(request.headers)
    if (!securityHeaderCheck.valid) {
      warnings.push(...securityHeaderCheck.warnings.map(w => ({
        field: `header.${w.header}`,
        message: w.message,
        code: 'SECURITY_HEADER_WARNING',
        suggestion: w.suggestion
      })))
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitizedData
    }
  }

  /**
   * Validate request body
   */
  private async validateBody(
    request: NextRequest,
    schema: ZodSchema
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let sanitizedData: any = {}

    try {
      const body = await request.json()
      
      // Sanitize input first
      const sanitized = await this.inputSanitizer.sanitize(body)
      
      // Validate against schema
      sanitizedData = await schema.parseAsync(sanitized)
      
      // Check for potential issues
      if (this.containsSuspiciousPatterns(sanitizedData)) {
        warnings.push({
          field: 'body',
          message: 'Request body contains potentially suspicious patterns',
          code: 'SUSPICIOUS_CONTENT',
          suggestion: 'Review the content for potential security issues'
        })
      }
      
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push(...this.formatZodErrors(error))
      } else {
        errors.push({
          field: 'body',
          message: 'Invalid request body',
          code: 'INVALID_BODY',
          severity: 'error'
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitizedData
    }
  }

  /**
   * Validate query parameters
   */
  private async validateQueryParams(
    request: NextRequest,
    schema: ZodSchema
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let sanitizedData: any = {}

    try {
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // Sanitize input first
      const sanitized = await this.inputSanitizer.sanitize(queryParams)
      
      // Validate against schema
      sanitizedData = await schema.parseAsync(sanitized)
      
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push(...this.formatZodErrors(error))
      } else {
        errors.push({
          field: 'query',
          message: 'Invalid query parameters',
          code: 'INVALID_QUERY',
          severity: 'error'
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitizedData
    }
  }

  /**
   * Validate path parameters
   */
  private async validatePathParams(
    request: NextRequest,
    schema: ZodSchema
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let sanitizedData: any = {}

    try {
      // Extract path params from the URL
      const pathParams = this.extractPathParams(request.url)
      
      // Sanitize input first
      const sanitized = await this.inputSanitizer.sanitize(pathParams)
      
      // Validate against schema
      sanitizedData = await schema.parseAsync(sanitized)
      
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push(...this.formatZodErrors(error))
      } else {
        errors.push({
          field: 'params',
          message: 'Invalid path parameters',
          code: 'INVALID_PARAMS',
          severity: 'error'
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitizedData
    }
  }

  /**
   * Validate API response
   */
  async validateResponse(
    response: any,
    schema: ZodSchema
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let sanitizedData: any = {}

    try {
      // Validate response against schema
      sanitizedData = await schema.parseAsync(response)
      
      // Check for sensitive data in response
      if (this.config.detectPII) {
        const piiCheck = await this.securityValidator.checkForPII(sanitizedData)
        if (piiCheck.found) {
          warnings.push({
            field: 'response',
            message: 'Response contains potential PII',
            code: 'PII_IN_RESPONSE',
            suggestion: 'Review and mask sensitive data before sending'
          })
        }
      }
      
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push(...this.formatZodErrors(error))
      } else {
        errors.push({
          field: 'response',
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
          severity: 'error'
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitizedData
    }
  }

  /**
   * Format Zod errors into ValidationError format
   */
  private formatZodErrors(error: ZodError): ValidationError[] {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: this.errorFormatter.format(err.message, err.code),
      code: err.code,
      severity: 'error' as const,
      suggestion: this.errorFormatter.getSuggestion(err.code)
    }))
  }

  /**
   * Check if method is allowed
   */
  private isMethodAllowed(method: string): boolean {
    return this.config.allowedMethods?.includes(method) || false
  }

  /**
   * Check if content type is allowed
   */
  private isContentTypeAllowed(contentType: string): boolean {
    const baseContentType = contentType.split(';')[0].trim()
    return this.config.allowedContentTypes?.includes(baseContentType) || false
  }

  /**
   * Check for suspicious patterns
   */
  private containsSuspiciousPatterns(data: any): boolean {
    const suspicious = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /union.*select/i,
      /insert.*into/i,
      /drop.*table/i,
      /\$where/i,
      /\$regex/i
    ]
    
    const dataStr = JSON.stringify(data)
    return suspicious.some(pattern => pattern.test(dataStr))
  }

  /**
   * Extract path parameters from URL
   */
  private extractPathParams(url: string): Record<string, string> {
    // This is a simplified implementation
    // In practice, you'd match against the route pattern
    const urlParts = new URL(url).pathname.split('/')
    const params: Record<string, string> = {}
    
    // Extract numeric IDs and slugs
    urlParts.forEach((part, index) => {
      if (/^\d+$/.test(part)) {
        params[`id_${index}`] = part
      } else if (part && index > 2) {
        params[`slug_${index}`] = part
      }
    })
    
    return params
  }

  /**
   * Generate unique request ID for caching
   */
  private generateRequestId(request: NextRequest): string {
    const method = request.method
    const url = request.url
    const headers = Array.from(request.headers.entries()).sort().join('|')
    const data = `${method}:${url}:${headers}`
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Create validation middleware
   */
  static middleware(
    schema?: {
      body?: ZodSchema
      query?: ZodSchema
      headers?: ZodSchema
      params?: ZodSchema
    },
    config?: ValidationConfig
  ) {
    const validator = new APIValidator(config)
    
    return async (request: NextRequest) => {
      const validation = await validator.validateRequest(request, schema)
      
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            errors: validation.errors,
            warnings: validation.warnings
          },
          { status: 400 }
        )
      }
      
      // Attach sanitized data to request for use in route handlers
      (request as any).validated = validation.sanitizedData
      
      return null // Continue to route handler
    }
  }
}

export default APIValidator