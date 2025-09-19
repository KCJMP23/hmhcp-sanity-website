/**
 * Production-ready Winston logging service
 * Replaces all console.* statements with structured logging
 * 
 * Features:
 * - Multiple transports (Console, File, HTTP)
 * - Log rotation and retention
 * - Environment-based configuration
 * - Request correlation IDs
 * - Error tracking integration
 * - Performance monitoring
 */

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// Custom log levels following RFC5424 with additional monitoring levels
const customLevels = {
  levels: {
    error: 0,    // System errors, exceptions
    warn: 1,     // Warnings, deprecated usage
    info: 2,     // General information
    http: 3,     // HTTP requests/responses
    debug: 4,    // Debug information
    verbose: 5,  // Verbose debugging
    silly: 6,    // Everything else
    monitor: 7,  // Performance monitoring
    audit: 8     // Audit trails
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
    verbose: 'cyan',
    silly: 'grey',
    monitor: 'blue',
    audit: 'brightYellow'
  }
}

// Custom format for better readability and structured data
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

// JSON format for production logging (file output)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
)

// Determine log level based on environment
const getLogLevel = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production': return 'info'
    case 'development': return 'debug'
    case 'test': return 'warn'
    default: return 'debug'
  }
}

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs')

// File rotation transport for errors
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: jsonFormat,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  handleExceptions: true,
  handleRejections: true
})

// File rotation transport for all logs
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'), 
  datePattern: 'YYYY-MM-DD',
  format: jsonFormat,
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true
})

// File rotation transport for audit logs
const auditRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'audit',
  format: jsonFormat,
  maxSize: '20m', 
  maxFiles: '90d', // Keep audit logs longer
  zippedArchive: true
})

// Console transport with custom formatting
const consoleTransport = new winston.transports.Console({
  level: getLogLevel(),
  format: process.env.NODE_ENV === 'production' ? jsonFormat : customFormat,
  handleExceptions: true,
  handleRejections: true
})

// HTTP transport for external logging service (optional)
const httpTransport = process.env.LOG_HTTP_URL ? new winston.transports.Http({
  host: process.env.LOG_HTTP_HOST || 'localhost',
  port: parseInt(process.env.LOG_HTTP_PORT || '3001'),
  path: process.env.LOG_HTTP_PATH || '/logs',
  level: 'error', // Only send errors to external service
  format: jsonFormat
}) : null

// Create the main logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: customLevels.levels,
  format: jsonFormat,
  defaultMeta: { 
    service: 'hmhcp-website',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    consoleTransport,
    combinedRotateTransport,
    errorRotateTransport,
    auditRotateTransport,
    ...(httpTransport ? [httpTransport] : [])
  ],
  exitOnError: false
})

// Add colors to winston
winston.addColors(customLevels.colors)

// Enhanced logging interface with additional methods
export interface Logger {
  error(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  info(message: string, meta?: any): void
  http(message: string, meta?: any): void
  debug(message: string, meta?: any): void
  verbose(message: string, meta?: any): void
  silly(message: string, meta?: any): void
  monitor(message: string, meta?: any): void
  audit(message: string, meta?: any): void
  
  // Enhanced methods for specific use cases
  apiRequest(method: string, url: string, statusCode: number, responseTime: number, meta?: any): void
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any): void
  performanceMetric(metric: string, value: number, unit: string, meta?: any): void
  databaseQuery(query: string, duration: number, meta?: any): void
  contactSubmission(submission: any): void
}

// Enhanced logger with additional methods
const enhancedLogger: Logger = {
  // Standard log levels
  error: (message: string, meta?: any) => { if (!isShuttingDown) logger.error(message, meta) },
  warn: (message: string, meta?: any) => { if (!isShuttingDown) logger.warn(message, meta) },
  info: (message: string, meta?: any) => { if (!isShuttingDown) logger.info(message, meta) }, 
  http: (message: string, meta?: any) => { if (!isShuttingDown) logger.http(message, meta) },
  debug: (message: string, meta?: any) => { if (!isShuttingDown) logger.debug(message, meta) },
  verbose: (message: string, meta?: any) => { if (!isShuttingDown) logger.verbose(message, meta) },
  silly: (message: string, meta?: any) => { if (!isShuttingDown) logger.silly(message, meta) },
  monitor: (message: string, meta?: any) => { if (!isShuttingDown) logger.log('monitor', message, meta) },
  audit: (message: string, meta?: any) => { if (!isShuttingDown) logger.log('audit', message, meta) },

  // Enhanced methods for specific use cases
  apiRequest: (method: string, url: string, statusCode: number, responseTime: number, meta?: any) => {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http'
    logger.log(level, `${method} ${url} ${statusCode} - ${responseTime}ms`, {
      method,
      url,
      statusCode,
      responseTime,
      ...meta
    })
  },

  securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any) => {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info'
    logger.log(level, `Security Event: ${event}`, {
      event,
      severity,
      securityEvent: true,
      ...meta
    })
  },

  performanceMetric: (metric: string, value: number, unit: string, meta?: any) => {
    logger.log('monitor', `Performance Metric: ${metric} = ${value}${unit}`, {
      metric,
      value,
      unit,
      performanceMetric: true,
      ...meta
    })
  },

  databaseQuery: (query: string, duration: number, meta?: any) => {
    const level = duration > 1000 ? 'warn' : 'debug' // Warn on slow queries
    logger.log(level, `Database Query (${duration}ms): ${query.slice(0, 100)}${query.length > 100 ? '...' : ''}`, {
      query: query.length > 500 ? query.slice(0, 500) + '...' : query,
      duration,
      databaseQuery: true,
      ...meta
    })
  },

  contactSubmission: (submission: any) => {
    logger.log('audit', 'Contact form submission received', {
      contactSubmission: true,
      submissionId: submission.id,
      name: submission.name,
      email: submission.email,
      organization: submission.organization,
      department: submission.department,
      subject: submission.subject,
      submittedAt: submission.submitted_at,
      // Don't log the actual message content for privacy
      messageLength: submission.message?.length || 0
    })
  }
}

// Create request-scoped logger with correlation ID
export const createRequestLogger = (correlationId: string, requestMeta?: any): Logger => {
  const requestDefaultMeta = {
    correlationId,
    ...requestMeta
  }

  return {
    error: (message: string, meta?: any) => enhancedLogger.error(message, { ...requestDefaultMeta, ...meta }),
    warn: (message: string, meta?: any) => enhancedLogger.warn(message, { ...requestDefaultMeta, ...meta }),
    info: (message: string, meta?: any) => enhancedLogger.info(message, { ...requestDefaultMeta, ...meta }),
    http: (message: string, meta?: any) => enhancedLogger.http(message, { ...requestDefaultMeta, ...meta }),
    debug: (message: string, meta?: any) => enhancedLogger.debug(message, { ...requestDefaultMeta, ...meta }),
    verbose: (message: string, meta?: any) => enhancedLogger.verbose(message, { ...requestDefaultMeta, ...meta }),
    silly: (message: string, meta?: any) => enhancedLogger.silly(message, { ...requestDefaultMeta, ...meta }),
    monitor: (message: string, meta?: any) => enhancedLogger.monitor(message, { ...requestDefaultMeta, ...meta }),
    audit: (message: string, meta?: any) => enhancedLogger.audit(message, { ...requestDefaultMeta, ...meta }),
    
    apiRequest: (method: string, url: string, statusCode: number, responseTime: number, meta?: any) => 
      enhancedLogger.apiRequest(method, url, statusCode, responseTime, { ...requestDefaultMeta, ...meta }),
    securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any) => 
      enhancedLogger.securityEvent(event, severity, { ...requestDefaultMeta, ...meta }),
    performanceMetric: (metric: string, value: number, unit: string, meta?: any) => 
      enhancedLogger.performanceMetric(metric, value, unit, { ...requestDefaultMeta, ...meta }),
    databaseQuery: (query: string, duration: number, meta?: any) => 
      enhancedLogger.databaseQuery(query, duration, { ...requestDefaultMeta, ...meta }),
    contactSubmission: (submission: any) => 
      enhancedLogger.contactSubmission({ ...submission, correlationId })
  }
}

// Graceful shutdown handling
let isShuttingDown = false
const gracefulShutdown = () => {
  if (isShuttingDown) {
    return // Prevent multiple shutdown attempts
  }
  isShuttingDown = true
  
  try {
    logger.info('Shutting down logger...')
    logger.end()
  } catch (error) {
    // Ignore errors during shutdown
  }
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
process.on('exit', gracefulShutdown)

export default enhancedLogger