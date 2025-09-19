/**
 * Standardized Logging Middleware
 * 
 * This module provides consistent logging functionality for
 * all API endpoints, including request/response logging and
 * performance monitoring.
 */

import { NextRequest, NextResponse } from 'next/server'

export interface LogEntry {
  timestamp: string
  method: string
  path: string
  statusCode: number
  duration: number
  userAgent?: string
  ip?: string
  userId?: string
  requestSize?: number
  responseSize?: number
  error?: string
  metadata?: Record<string, any>
}

export interface LoggingConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  includeHeaders: boolean
  includeBody: boolean
  includeQueryParams: boolean
  maskSensitiveFields: string[]
  logPerformance: boolean
  logErrors: boolean
}

// Default logging configuration
export const defaultLoggingConfig: LoggingConfig = {
  enabled: true,
  logLevel: 'info',
  includeHeaders: false,
  includeBody: false,
  includeQueryParams: true,
  maskSensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
  logPerformance: true,
  logErrors: true
}

/**
 * Mask sensitive data in objects
 */
function maskSensitiveData(data: any, sensitiveFields: string[]): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, sensitiveFields))
  }

  const masked: any = {}
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '[REDACTED]'
    } else {
      masked[key] = maskSensitiveData(value, sensitiveFields)
    }
  }

  return masked
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
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
  
  return request.ip || 'unknown'
}

/**
 * Calculate response size
 */
function getResponseSize(response: NextResponse): number {
  try {
    const body = response.body?.toString() || ''
    return new Blob([body]).size
  } catch {
    return 0
  }
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `${entry.method} ${entry.path}`,
    `${entry.statusCode}`,
    `${entry.duration}ms`
  ]

  if (entry.userId) {
    parts.push(`user:${entry.userId}`)
  }

  if (entry.ip && entry.ip !== 'unknown') {
    parts.push(`ip:${entry.ip}`)
  }

  if (entry.error) {
    parts.push(`error:${entry.error}`)
  }

  return parts.join(' ')
}

/**
 * Log entry to console (in production, send to logging service)
 */
function logToConsole(entry: LogEntry, config: LoggingConfig) {
  const level = entry.statusCode >= 400 ? 'error' : 
                entry.statusCode >= 300 ? 'warn' : 
                entry.duration > 1000 ? 'warn' : 'info'

  if (level === 'error' && !config.logErrors) return
  if (level === 'warn' && config.logLevel === 'error') return
  if (level === 'info' && (config.logLevel === 'warn' || config.logLevel === 'error')) return

  const formatted = formatLogEntry(entry)
  
  switch (level) {
    case 'error':
      console.error(formatted)
      if (entry.metadata) {
        console.error('Metadata:', entry.metadata)
      }
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'info':
      console.info(formatted)
      break
  }
}

/**
 * Logging middleware wrapper
 */
export function withLogging(
  config: Partial<LoggingConfig> = {},
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const fullConfig: LoggingConfig = { ...defaultLoggingConfig, ...config }
  
  return async (request: NextRequest): Promise<NextResponse> => {
    if (!fullConfig.enabled) {
      return await handler(request)
    }

    const startTime = Date.now()
    const startTimestamp = new Date().toISOString()
    
    // Extract request information
    const method = request.method
    const path = request.nextUrl.pathname
    const userAgent = request.headers.get('user-agent') || undefined
    const ip = getClientIP(request) || undefined
    const userId = request.headers.get('x-user-id') || undefined
    
    // Log request details
    if (fullConfig.logLevel === 'debug') {
      console.debug(`Request: ${method} ${path}`, {
        userAgent,
        ip,
        userId,
        headers: fullConfig.includeHeaders ? Object.fromEntries(request.headers.entries()) : undefined,
        query: fullConfig.includeQueryParams ? Object.fromEntries(request.nextUrl.searchParams.entries()) : undefined
      })
    }

    try {
      // Execute handler
      const response = await handler(request)
      const duration = Date.now() - startTime
      
      // Create log entry
      const logEntry: LogEntry = {
        timestamp: startTimestamp,
        method,
        path,
        statusCode: response.status,
        duration,
        userAgent,
        ip,
        userId,
        responseSize: getResponseSize(response)
      }

      // Log the entry
      logToConsole(logEntry, fullConfig)
      
      return response
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Create error log entry
      const logEntry: LogEntry = {
        timestamp: startTimestamp,
        method,
        path,
        statusCode: 500,
        duration,
        userAgent,
        ip,
        userId,
        error: errorMessage,
        metadata: {
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        }
      }

      // Log the error
      logToConsole(logEntry, fullConfig)
      
      // Re-throw the error
      throw error
    }
  }
}

/**
 * Performance logging middleware
 */
export function withPerformanceLogging(
  threshold: number = 1000, // Log requests slower than 1 second
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    
    try {
      const response = await handler(request)
      const duration = Date.now() - startTime
      
      if (duration > threshold) {
        console.warn(`Slow request: ${request.method} ${request.nextUrl.pathname} took ${duration}ms`)
      }
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`Request failed after ${duration}ms:`, error)
      throw error
    }
  }
}

/**
 * Request body logging middleware (for debugging)
 */
export function withRequestBodyLogging(
  sensitiveFields: string[] = ['password', 'token'],
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const clonedRequest = request.clone()
        const body = await clonedRequest.text()
        
        if (body) {
          let parsedBody
          try {
            parsedBody = JSON.parse(body)
            parsedBody = maskSensitiveData(parsedBody, sensitiveFields)
          } catch {
            parsedBody = body
          }
          
          console.debug(`Request body for ${request.method} ${request.nextUrl.pathname}:`, parsedBody)
        }
      } catch (error) {
        console.debug('Could not log request body:', error)
      }
    }
    
    return await handler(request)
  }
}

/**
 * Response logging middleware (for debugging)
 */
export function withResponseLogging(
  sensitiveFields: string[] = ['token', 'secret'],
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)
    
    try {
      const clonedResponse = response.clone()
      const body = await clonedResponse.text()
      
      if (body) {
        let parsedBody
        try {
          parsedBody = JSON.parse(body)
          parsedBody = maskSensitiveData(parsedBody, sensitiveFields)
        } catch {
          parsedBody = body
        }
        
        console.debug(`Response for ${request.method} ${request.nextUrl.pathname}:`, {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody
        })
      }
    } catch (error) {
      console.debug('Could not log response:', error)
    }
    
    return response
  }
}

/**
 * Comprehensive logging middleware combining all features
 */
export function withComprehensiveLogging(
  config: Partial<LoggingConfig> = {},
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withLogging(
    config,
    withPerformanceLogging(
      config.logPerformance ? 1000 : Infinity,
      withRequestBodyLogging(
        config.maskSensitiveFields,
        withResponseLogging(
          config.maskSensitiveFields,
          handler
        )
      )
    )
  )
}

/**
 * Simple API request logging function
 */
export function logAPIRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    method,
    path,
    statusCode,
    duration,
    metadata
  }

  logToConsole(entry, defaultLoggingConfig)
}

/**
 * Get logging statistics
 */
export function getLoggingStats(): {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  slowRequests: number
} {
  // This would typically come from a logging service
  // For now, return placeholder data
  return {
    totalRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    slowRequests: 0
  }
}
