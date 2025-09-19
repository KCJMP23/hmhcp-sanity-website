/**
 * Export Audit Logger for HIPAA Compliance
 * 
 * Provides comprehensive audit logging for bulk export operations
 * to meet healthcare data export compliance requirements
 */

import logger, { createRequestLogger } from '@/lib/logging/winston-logger'
import { sanitizeText } from '@/lib/security/xss-protection'
import type { ExportFormat, BulkExportRequest } from '@/types/publications'

export interface ExportAuditEvent {
  eventType: 'export_started' | 'export_progress' | 'export_completed' | 'export_failed' | 'export_downloaded' | 'export_cancelled'
  exportId: string
  userId: string
  userRole?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  formats?: ExportFormat[]
  recordCount?: number
  filters?: any
  options?: any
  error?: string
  processingTimeMs?: number
  fileSize?: number
  downloadAttempt?: boolean
}

export interface ExportSecurityEvent {
  eventType: 'suspicious_export_pattern' | 'rate_limit_exceeded' | 'unauthorized_access' | 'bulk_export_abuse'
  userId?: string
  ipAddress?: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: any
  timestamp: string
}

class ExportAuditLogger {
  private requestLogger: ReturnType<typeof createRequestLogger>

  constructor(correlationId: string) {
    this.requestLogger = createRequestLogger(correlationId, {
      service: 'export-audit'
    })
  }

  /**
   * Log export operation start
   */
  logExportStarted(
    exportId: string,
    userId: string,
    request: BulkExportRequest,
    metadata: {
      ipAddress?: string
      userAgent?: string
      sessionId?: string
      userRole?: string
    } = {}
  ): void {
    const auditEvent: ExportAuditEvent = {
      eventType: 'export_started',
      exportId,
      userId: sanitizeText(userId),
      userRole: metadata.userRole ? sanitizeText(metadata.userRole) : undefined,
      sessionId: metadata.sessionId ? sanitizeText(metadata.sessionId) : undefined,
      ipAddress: metadata.ipAddress ? sanitizeText(metadata.ipAddress) : undefined,
      userAgent: metadata.userAgent ? sanitizeText(metadata.userAgent) : undefined,
      timestamp: new Date().toISOString(),
      formats: request.format,
      filters: this.sanitizeFilters(request.filters),
      options: request.options
    }

    this.requestLogger.info('Export operation started', {
      auditEvent,
      hipaaEvent: true,
      dataExport: true
    })

    // Additional security logging for bulk operations
    if (!request.publicationIds && this.isBroadExport(request)) {
      this.logSecurityEvent({
        eventType: 'bulk_export_abuse',
        userId,
        ipAddress: metadata.ipAddress,
        description: 'Broad bulk export attempted without specific filters',
        severity: 'medium',
        metadata: { filters: request.filters, formats: request.format },
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Log export progress update
   */
  logExportProgress(
    exportId: string,
    userId: string,
    progress: number,
    currentOperation: string,
    recordCount?: number
  ): void {
    // Only log progress at significant milestones to avoid spam
    const milestone = Math.floor(progress / 25) * 25
    if (progress > 0 && progress % 25 === 0) {
      const auditEvent: ExportAuditEvent = {
        eventType: 'export_progress',
        exportId,
        userId: sanitizeText(userId),
        timestamp: new Date().toISOString(),
        recordCount
      }

      this.requestLogger.info(`Export progress: ${milestone}%`, {
        auditEvent,
        hipaaEvent: true,
        currentOperation: sanitizeText(currentOperation)
      })
    }
  }

  /**
   * Log export completion
   */
  logExportCompleted(
    exportId: string,
    userId: string,
    formats: ExportFormat[],
    recordCount: number,
    processingTimeMs: number,
    fileSize?: number
  ): void {
    const auditEvent: ExportAuditEvent = {
      eventType: 'export_completed',
      exportId,
      userId: sanitizeText(userId),
      timestamp: new Date().toISOString(),
      formats,
      recordCount,
      processingTimeMs,
      fileSize
    }

    this.requestLogger.info('Export operation completed successfully', {
      auditEvent,
      hipaaEvent: true,
      dataExport: true,
      recordsExported: recordCount
    })

    // Log potential data breach concerns for large exports
    if (recordCount > 500 || (fileSize && fileSize > 50 * 1024 * 1024)) {
      this.logSecurityEvent({
        eventType: 'bulk_export_abuse',
        userId,
        description: `Large export completed: ${recordCount} records, ${fileSize ? Math.round(fileSize / 1024 / 1024) + 'MB' : 'unknown size'}`,
        severity: 'medium',
        metadata: { exportId, recordCount, fileSize, formats },
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Log export failure
   */
  logExportFailed(
    exportId: string,
    userId: string,
    error: string,
    processingTimeMs?: number
  ): void {
    const auditEvent: ExportAuditEvent = {
      eventType: 'export_failed',
      exportId,
      userId: sanitizeText(userId),
      timestamp: new Date().toISOString(),
      error: sanitizeText(error),
      processingTimeMs
    }

    this.requestLogger.error('Export operation failed', {
      auditEvent,
      hipaaEvent: true,
      dataExport: true,
      error
    })
  }

  /**
   * Log export download attempt
   */
  logExportDownloaded(
    exportId: string,
    userId: string,
    formats: ExportFormat[],
    recordCount: number,
    metadata: {
      ipAddress?: string
      userAgent?: string
      downloadSuccess: boolean
      fileSize?: number
    }
  ): void {
    const auditEvent: ExportAuditEvent = {
      eventType: 'export_downloaded',
      exportId,
      userId: sanitizeText(userId),
      ipAddress: metadata.ipAddress ? sanitizeText(metadata.ipAddress) : undefined,
      userAgent: metadata.userAgent ? sanitizeText(metadata.userAgent) : undefined,
      timestamp: new Date().toISOString(),
      formats,
      recordCount,
      fileSize: metadata.fileSize,
      downloadAttempt: true
    }

    if (metadata.downloadSuccess) {
      this.requestLogger.info('Export file downloaded', {
        auditEvent,
        hipaaEvent: true,
        dataExport: true,
        dataAccess: true,
        recordsAccessed: recordCount
      })
    } else {
      this.requestLogger.warn('Export download failed', {
        auditEvent,
        hipaaEvent: true,
        dataExport: true
      })
    }
  }

  /**
   * Log export cancellation
   */
  logExportCancelled(
    exportId: string,
    userId: string,
    reason: string = 'User requested'
  ): void {
    const auditEvent: ExportAuditEvent = {
      eventType: 'export_cancelled',
      exportId,
      userId: sanitizeText(userId),
      timestamp: new Date().toISOString(),
      error: sanitizeText(reason)
    }

    this.requestLogger.info('Export operation cancelled', {
      auditEvent,
      hipaaEvent: true,
      dataExport: true,
      reason: sanitizeText(reason)
    })
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: ExportSecurityEvent): void {
    this.requestLogger.warn('Export security event detected', {
      securityEvent: event,
      hipaaEvent: true,
      securityIncident: true,
      severity: event.severity
    })

    // For critical events, also log to error level
    if (event.severity === 'critical') {
      this.requestLogger.error('Critical export security event', {
        securityEvent: event,
        hipaaEvent: true,
        securityIncident: true
      })
    }
  }

  /**
   * Log rate limiting events
   */
  logRateLimitExceeded(
    userId: string,
    ipAddress: string,
    attemptedOperation: string,
    currentAttempts: number,
    windowMs: number
  ): void {
    this.logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      userId,
      ipAddress,
      description: `Rate limit exceeded for ${attemptedOperation}: ${currentAttempts} attempts in ${windowMs}ms`,
      severity: 'medium',
      metadata: {
        operation: attemptedOperation,
        attempts: currentAttempts,
        windowMs
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log unauthorized access attempts
   */
  logUnauthorizedAccess(
    ipAddress: string,
    userAgent: string,
    attemptedEndpoint: string,
    reason: string
  ): void {
    this.logSecurityEvent({
      eventType: 'unauthorized_access',
      ipAddress,
      description: `Unauthorized export access attempt: ${reason}`,
      severity: 'high',
      metadata: {
        endpoint: attemptedEndpoint,
        userAgent,
        reason
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Sanitize filter data for logging
   */
  private sanitizeFilters(filters?: BulkExportRequest['filters']): any {
    if (!filters) return null

    return {
      dateFrom: filters.dateFrom ? sanitizeText(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? sanitizeText(filters.dateTo) : undefined,
      publicationType: filters.publicationType ? sanitizeText(filters.publicationType) : undefined,
      authors: filters.authors ? filters.authors.map(a => sanitizeText(a)) : undefined,
      keywords: filters.keywords ? filters.keywords.map(k => sanitizeText(k)) : undefined,
      status: filters.status
    }
  }

  /**
   * Check if export is too broad (potential security concern)
   */
  private isBroadExport(request: BulkExportRequest): boolean {
    const hasSpecificIds = request.publicationIds && request.publicationIds.length > 0
    const hasSpecificFilters = request.filters && (
      request.filters.dateFrom ||
      request.filters.dateTo ||
      request.filters.publicationType ||
      request.filters.authors?.length ||
      request.filters.keywords?.length
    )

    return !hasSpecificIds && !hasSpecificFilters
  }
}

/**
 * Create audit logger instance
 */
export function createExportAuditLogger(correlationId: string): ExportAuditLogger {
  return new ExportAuditLogger(correlationId)
}

/**
 * Create audit logger from request context
 */
export function createExportAuditLoggerFromRequest(
  correlationId: string,
  request: Request
): ExportAuditLogger {
  const logger = new ExportAuditLogger(correlationId)
  
  // Extract request metadata for enhanced logging
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   request.headers.get('cf-connecting-ip') ||
                   'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return logger
}

/**
 * Default export audit patterns for monitoring
 */
export const EXPORT_AUDIT_PATTERNS = {
  SUSPICIOUS_BULK_EXPORT: {
    name: 'Suspicious Bulk Export',
    description: 'Large export without specific filters',
    threshold: 1000,
    severity: 'medium' as const
  },
  RAPID_EXPORT_REQUESTS: {
    name: 'Rapid Export Requests',
    description: 'Multiple export requests in short time',
    threshold: 3,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    severity: 'high' as const
  },
  FAILED_DOWNLOAD_ATTEMPTS: {
    name: 'Failed Download Attempts',
    description: 'Multiple failed download attempts',
    threshold: 5,
    timeWindow: 10 * 60 * 1000, // 10 minutes
    severity: 'medium' as const
  }
} as const