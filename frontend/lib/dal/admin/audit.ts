/**
 * Comprehensive Audit Logging System for HM Healthcare Partners Admin
 * Healthcare platform audit logging with HIPAA compliance and security
 * 
 * Features:
 * - Immutable audit trails with cryptographic integrity
 * - Healthcare-sensitive data masking and PHI protection
 * - Batch logging with performance optimization
 * - Retention policies and compliance reporting
 * - Real-time monitoring and suspicious activity detection
 * - Role-based access to audit logs
 * - Export capabilities for external compliance review
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import crypto from 'crypto'
import { logger } from '@/lib/logger'
import {
  AuditLog,
  AuditAction,
  AdminRole,
  DataClassification,
  HIPAAContext,
  QueryResult,
  PaginatedResult,
  QueryOptions,
  DataAccessContext
} from './types'
import {
  sanitizeHealthcareDataForLogging,
  determineHIPAAContext,
  shouldAuditOperation,
  TABLE_NAMES,
  QUERY_LIMITS,
  safeDatabaseOperation,
  retryDatabaseOperation,
  buildPaginationParams,
  applyQueryConditions
} from './utils'

// ================================
// Enhanced Audit Types
// ================================

export enum AlertLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditEventType {
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SYSTEM_EVENT = 'system_event',
  SECURITY_EVENT = 'security_event',
  COMPLIANCE_EVENT = 'compliance_event'
}

export enum SuspiciousActivityType {
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  BULK_DATA_ACCESS = 'bulk_data_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  PHI_ACCESS_ANOMALY = 'phi_access_anomaly',
  OFF_HOURS_ACTIVITY = 'off_hours_activity',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly'
}

export interface EnhancedAuditLog extends AuditLog {
  event_type: AuditEventType
  alert_level: AlertLevel
  session_id?: string
  geographic_info?: {
    country?: string
    region?: string
    city?: string
  }
  security_context?: {
    risk_score: number
    confidence_level: number
    flags: string[]
  }
  data_classification?: DataClassification
  hipaa_context?: HIPAAContext
  signature?: string
  previous_hash?: string
  compliance_tags?: string[]
}

export interface AuditBatch {
  entries: EnhancedAuditLog[]
  batch_id: string
  timestamp: string
  signature: string
}

export interface RetentionPolicy {
  data_classification: DataClassification
  retention_years: number
  archive_after_months: number
  require_legal_hold: boolean
}

export interface ComplianceReport {
  report_id: string
  report_type: 'hipaa' | 'sox' | 'gdpr' | 'custom'
  date_range: {
    start: string
    end: string
  }
  filters: {
    event_types?: AuditEventType[]
    alert_levels?: AlertLevel[]
    users?: string[]
    resource_types?: string[]
  }
  summary: {
    total_events: number
    critical_events: number
    phi_access_events: number
    failed_access_attempts: number
    suspicious_activities: number
  }
  events: EnhancedAuditLog[]
  generated_at: string
  generated_by: string
  signature: string
}

export interface SuspiciousActivity {
  id: string
  type: SuspiciousActivityType
  severity: AlertLevel
  user_id: string
  description: string
  indicators: Record<string, any>
  related_audit_ids: string[]
  detected_at: string
  resolved_at?: string
  resolution_notes?: string
  false_positive?: boolean
}

// ================================
// Validation Schemas
// ================================

const EnhancedAuditLogCreateSchema = z.object({
  user_id: z.string().uuid('Valid user ID required'),
  action: z.nativeEnum(AuditAction),
  event_type: z.nativeEnum(AuditEventType),
  alert_level: z.nativeEnum(AlertLevel).default(AlertLevel.LOW),
  resource_type: z.string().min(1, 'Resource type is required'),
  resource_id: z.string().uuid().optional(),
  details: z.record(z.any()).default({}),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  session_id: z.string().optional(),
  geographic_info: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional()
  }).optional(),
  data_classification: z.nativeEnum(DataClassification).optional(),
  hipaa_context: z.object({
    isHealthcareData: z.boolean(),
    complianceLevel: z.enum(['none', 'basic', 'strict']),
    auditRequired: z.boolean(),
    encryptionRequired: z.boolean()
  }).optional(),
  compliance_tags: z.array(z.string()).optional()
})

const ComplianceReportCreateSchema = z.object({
  report_type: z.enum(['hipaa', 'sox', 'gdpr', 'custom']),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  filters: z.object({
    event_types: z.array(z.nativeEnum(AuditEventType)).optional(),
    alert_levels: z.array(z.nativeEnum(AlertLevel)).optional(),
    users: z.array(z.string().uuid()).optional(),
    resource_types: z.array(z.string()).optional()
  }).optional()
})

// ================================
// AuditLogger Class
// ================================

/**
 * Comprehensive audit logging service with healthcare compliance
 * Provides immutable audit trails, data masking, and compliance reporting
 */
export class AuditLogger {
  private client: SupabaseClient
  private context?: DataAccessContext
  private secretKey: string
  private batchSize: number = 100
  private batchTimeout: number = 5000 // 5 seconds
  private pendingBatch: EnhancedAuditLog[] = []
  private batchTimer?: NodeJS.Timeout
  private lastHash?: string

  // Default retention policies (HIPAA compliant)
  private defaultRetentionPolicies: RetentionPolicy[] = [
    {
      data_classification: DataClassification.PHI,
      retention_years: 7, // HIPAA minimum
      archive_after_months: 12,
      require_legal_hold: true
    },
    {
      data_classification: DataClassification.CONFIDENTIAL,
      retention_years: 5,
      archive_after_months: 24,
      require_legal_hold: false
    },
    {
      data_classification: DataClassification.INTERNAL,
      retention_years: 3,
      archive_after_months: 36,
      require_legal_hold: false
    },
    {
      data_classification: DataClassification.PUBLIC,
      retention_years: 1,
      archive_after_months: 12,
      require_legal_hold: false
    }
  ]

  constructor(
    client: SupabaseClient,
    secretKey: string = process.env.AUDIT_SECRET_KEY || 'default-audit-key'
  ) {
    this.client = client
    this.secretKey = secretKey
    this.initializeAuditSystem()
  }

  /**
   * Initialize audit system and load last hash
   */
  private async initializeAuditSystem(): Promise<void> {
    try {
      // Get the last audit entry to maintain hash chain
      const { data } = await this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .select('signature')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data?.signature) {
        this.lastHash = data.signature
      }

      logger.info('Audit system initialized', {
        hasLastHash: !!this.lastHash,
        batchSize: this.batchSize,
        batchTimeout: this.batchTimeout
      })
    } catch (error) {
      logger.warn('Could not load last audit hash (might be first run)', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Set audit context for operations
   */
  public setContext(context: DataAccessContext): this {
    this.context = context
    return this
  }

  // ================================
  // Core Audit Logging Methods
  // ================================

  /**
   * Log a single audit event
   */
  public async logEvent(
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>,
    options?: {
      eventType?: AuditEventType
      alertLevel?: AlertLevel
      ipAddress?: string
      userAgent?: string
      sessionId?: string
      geographicInfo?: { country?: string; region?: string; city?: string }
      complianceTags?: string[]
    }
  ): Promise<QueryResult<EnhancedAuditLog>> {
    if (!this.context) {
      return { data: null, error: 'Audit context is required' }
    }

    try {
      // Determine data classification and HIPAA context
      const dataClassification = this.determineDataClassification(resourceType, details)
      const hipaaContext = determineHIPAAContext(details || {})

      // Check if audit is required
      if (!shouldAuditOperation(action, resourceType, details)) {
        return { data: null, error: null } // No audit required
      }

      // Calculate risk score
      const securityContext = this.calculateSecurityContext(
        action,
        resourceType,
        details,
        options?.ipAddress
      )

      // Create enhanced audit entry
      const auditEntry: Partial<EnhancedAuditLog> = {
        user_id: this.context.userId,
        action,
        event_type: options?.eventType || this.determineEventType(action, resourceType),
        alert_level: options?.alertLevel || this.determineAlertLevel(action, securityContext),
        resource_type: resourceType,
        resource_id: resourceId,
        details: sanitizeHealthcareDataForLogging(details || {}),
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
        session_id: options?.sessionId,
        geographic_info: options?.geographicInfo,
        security_context: securityContext,
        data_classification: dataClassification,
        hipaa_context: hipaaContext,
        compliance_tags: options?.complianceTags,
        created_at: new Date().toISOString()
      }

      // Add cryptographic signature for integrity
      const signature = this.createSignature(auditEntry)
      auditEntry.signature = signature
      auditEntry.previous_hash = this.lastHash

      // Validate audit entry
      const validation = EnhancedAuditLogCreateSchema.safeParse(auditEntry)
      if (!validation.success) {
        logger.error('Audit entry validation failed', {
          errors: validation.error.errors,
          entry: auditEntry
        })
        return { data: null, error: 'Invalid audit entry' }
      }

      const validatedEntry = validation.data as EnhancedAuditLog

      // Add to batch or log immediately based on priority
      if (validatedEntry.alert_level === AlertLevel.CRITICAL) {
        // Critical events are logged immediately
        const result = await this.writeAuditEntry(validatedEntry)
        if (result.data) {
          this.lastHash = result.data.signature
          await this.checkSuspiciousActivity(result.data)
        }
        return result
      } else {
        // Non-critical events are batched
        this.addToBatch(validatedEntry)
        return { data: validatedEntry, error: null }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to log audit event', {
        action,
        resourceType,
        resourceId,
        error: errorMessage,
        userId: this.context?.userId
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Log authentication events
   */
  public async logAuthEvent(
    action: AuditAction.LOGIN | AuditAction.LOGOUT,
    userId: string,
    success: boolean,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<QueryResult<EnhancedAuditLog>> {
    const tempContext: DataAccessContext = {
      userId,
      role: AdminRole.AUTHOR, // Temporary role for auth events
      permissions: [],
      classification: DataClassification.INTERNAL,
      hipaaContext: { isHealthcareData: false, complianceLevel: 'basic', auditRequired: true, encryptionRequired: false },
      auditRequired: true
    }

    const previousContext = this.context
    this.setContext(tempContext)

    const result = await this.logEvent(
      action,
      'authentication',
      userId,
      { success, ...details },
      {
        eventType: AuditEventType.AUTHENTICATION,
        alertLevel: success ? AlertLevel.LOW : AlertLevel.MEDIUM,
        ipAddress,
        userAgent,
        complianceTags: ['authentication', 'security']
      }
    )

    if (previousContext) {
      this.setContext(previousContext)
    }

    // Check for suspicious authentication patterns
    if (!success) {
      await this.checkFailedLoginPattern(userId, ipAddress)
    }

    return result
  }

  /**
   * Log PHI access events (special handling for healthcare data)
   */
  public async logPHIAccess(
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    phiDetails: Record<string, any>,
    accessPurpose: string,
    ipAddress?: string
  ): Promise<QueryResult<EnhancedAuditLog>> {
    if (!this.context) {
      return { data: null, error: 'Audit context is required for PHI access' }
    }

    return await this.logEvent(
      action,
      resourceType,
      resourceId,
      {
        phi_access: true,
        access_purpose: accessPurpose,
        phi_data_summary: this.createPHISummary(phiDetails)
      },
      {
        eventType: AuditEventType.DATA_ACCESS,
        alertLevel: AlertLevel.HIGH,
        ipAddress,
        complianceTags: ['phi', 'hipaa', 'healthcare']
      }
    )
  }

  /**
   * Add entry to batch for performance optimization
   */
  private addToBatch(entry: EnhancedAuditLog): void {
    this.pendingBatch.push(entry)

    // Set batch timer if not already set
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch()
      }, this.batchTimeout)
    }

    // Flush batch if it reaches max size
    if (this.pendingBatch.length >= this.batchSize) {
      this.flushBatch()
    }
  }

  /**
   * Flush pending batch to database
   */
  public async flushBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return

    try {
      const batchId = crypto.randomUUID()
      const batch: AuditBatch = {
        entries: [...this.pendingBatch],
        batch_id: batchId,
        timestamp: new Date().toISOString(),
        signature: this.createBatchSignature(this.pendingBatch, batchId)
      }

      // Clear batch and timer
      this.pendingBatch = []
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
        this.batchTimer = undefined
      }

      // Write batch to database
      const result = await retryDatabaseOperation(async () => {
        return await this.client
          .from(TABLE_NAMES.AUDIT_LOGS)
          .insert(batch.entries.map(entry => ({
            ...entry,
            batch_id: batchId
          })))
      })

      if (result.error) {
        logger.error('Failed to write audit batch', {
          batchId,
          entryCount: batch.entries.length,
          error: result.error.message
        })
        // Re-add entries to batch for retry
        this.pendingBatch.unshift(...batch.entries)
      } else {
        // Update last hash with the last entry in the batch
        const lastEntry = batch.entries[batch.entries.length - 1]
        if (lastEntry.signature) {
          this.lastHash = lastEntry.signature
        }

        logger.info('Audit batch written successfully', {
          batchId,
          entryCount: batch.entries.length
        })

        // Check for suspicious activities in the batch
        for (const entry of batch.entries) {
          await this.checkSuspiciousActivity(entry)
        }
      }

    } catch (error) {
      logger.error('Error flushing audit batch', {
        error: error instanceof Error ? error.message : 'Unknown error',
        batchSize: this.pendingBatch.length
      })
    }
  }

  /**
   * Write single audit entry to database
   */
  private async writeAuditEntry(entry: EnhancedAuditLog): Promise<QueryResult<EnhancedAuditLog>> {
    try {
      const result = await retryDatabaseOperation(async () => {
        return await this.client
          .from(TABLE_NAMES.AUDIT_LOGS)
          .insert(entry)
          .select()
          .single()
      })

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      logger.debug('Audit entry written', {
        id: result.data.id,
        action: result.data.action,
        resourceType: result.data.resource_type,
        alertLevel: result.data.alert_level
      })

      return { data: result.data, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to write audit entry', {
        error: errorMessage,
        entry: { ...entry, details: '[REDACTED]' }
      })
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Query and Retrieval Methods
  // ================================

  /**
   * Get audit logs with filtering and pagination
   */
  public async getAuditLogs(options: QueryOptions & {
    eventTypes?: AuditEventType[]
    alertLevels?: AlertLevel[]
    dateRange?: { start: string; end: string }
    userIds?: string[]
    resourceTypes?: string[]
    includePHI?: boolean
  } = {}): Promise<PaginatedResult<EnhancedAuditLog>> {
    try {
      if (!this.context) {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: QUERY_LIMITS.DEFAULT_PAGE_SIZE,
          hasNext: false,
          hasPrev: false
        }
      }

      // Check permission to access audit logs
      const hasAccess = this.validateAuditLogAccess()
      if (!hasAccess) {
        logger.warn('Unauthorized audit log access attempt', {
          userId: this.context.userId,
          role: this.context.role
        })
        return {
          data: [],
          total: 0,
          page: 1,
          limit: QUERY_LIMITS.DEFAULT_PAGE_SIZE,
          hasNext: false,
          hasPrev: false
        }
      }

      const { from, to, page, limit } = buildPaginationParams(options)

      // Build base query
      let query = this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .select('*', { count: 'exact' })

      // Apply filters
      if (options.eventTypes?.length) {
        query = query.in('event_type', options.eventTypes)
      }

      if (options.alertLevels?.length) {
        query = query.in('alert_level', options.alertLevels)
      }

      if (options.userIds?.length) {
        query = query.in('user_id', options.userIds)
      }

      if (options.resourceTypes?.length) {
        query = query.in('resource_type', options.resourceTypes)
      }

      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.start)
          .lte('created_at', options.dateRange.end)
      }

      // Filter out PHI data if user doesn't have access
      if (!options.includePHI && !this.canAccessPHI()) {
        query = query.neq('data_classification', DataClassification.PHI)
      }

      // Apply common query conditions
      const searchableColumns = ['action', 'resource_type', 'details']
      query = applyQueryConditions(query, options, searchableColumns)

      // Apply pagination
      query = query.range(from, to)

      const result = await safeDatabaseOperation(
        () => query,
        'Getting audit logs'
      )

      if (result.error) {
        logger.error('Failed to retrieve audit logs', {
          error: result.error.message,
          options
        })
        return {
          data: [],
          total: 0,
          page,
          limit,
          hasNext: false,
          hasPrev: false
        }
      }

      const auditLogs = (result.data || []).map(log => this.sanitizeAuditLog(log))
      const total = result.data?.length || 0

      return {
        data: auditLogs,
        total,
        page,
        limit,
        hasNext: to < total - 1,
        hasPrev: page > 1
      }

    } catch (error) {
      logger.error('Error retrieving audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      })
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || QUERY_LIMITS.DEFAULT_PAGE_SIZE,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  /**
   * Get audit log by ID
   */
  public async getAuditLogById(id: string): Promise<QueryResult<EnhancedAuditLog>> {
    if (!this.context) {
      return { data: null, error: 'Audit context is required' }
    }

    if (!this.validateAuditLogAccess()) {
      return { data: null, error: 'Insufficient permissions' }
    }

    try {
      const result = await safeDatabaseOperation(
        () => this.client
          .from(TABLE_NAMES.AUDIT_LOGS)
          .select('*')
          .eq('id', id)
          .single(),
        'Getting audit log by ID'
      )

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      if (!result.data) {
        return { data: null, error: 'Audit log not found' }
      }

      const sanitizedLog = this.sanitizeAuditLog(result.data)
      return { data: sanitizedLog, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to get audit log by ID', {
        id,
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Compliance Reporting Methods
  // ================================

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    reportType: 'hipaa' | 'sox' | 'gdpr' | 'custom',
    dateRange: { start: string; end: string },
    filters?: {
      eventTypes?: AuditEventType[]
      alertLevels?: AlertLevel[]
      users?: string[]
      resourceTypes?: string[]
    }
  ): Promise<QueryResult<ComplianceReport>> {
    if (!this.context) {
      return { data: null, error: 'Audit context is required' }
    }

    // Only admins and super admins can generate compliance reports
    if (![AdminRole.ADMIN, AdminRole.SUPER_ADMIN].includes(this.context.role)) {
      return { data: null, error: 'Insufficient permissions for compliance reporting' }
    }

    try {
      // Validate input
      const validation = ComplianceReportCreateSchema.safeParse({
        report_type: reportType,
        date_range: dateRange,
        filters
      })

      if (!validation.success) {
        return { data: null, error: 'Invalid report parameters' }
      }

      // Build query based on compliance requirements
      let query = this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      // Apply report-specific filters
      if (reportType === 'hipaa') {
        query = query.or('data_classification.eq.phi,compliance_tags.cs.{hipaa}')
      }

      if (filters?.eventTypes?.length) {
        query = query.in('event_type', filters.eventTypes)
      }

      if (filters?.alertLevels?.length) {
        query = query.in('alert_level', filters.alertLevels)
      }

      if (filters?.users?.length) {
        query = query.in('user_id', filters.users)
      }

      if (filters?.resourceTypes?.length) {
        query = query.in('resource_type', filters.resourceTypes)
      }

      const result = await safeDatabaseOperation(
        () => query.order('created_at', { ascending: false }),
        'Generating compliance report'
      )

      if (result.error) {
        return { data: null, error: result.error.message }
      }

      const events = (result.data || []).map(log => this.sanitizeAuditLog(log, true))

      // Calculate summary statistics
      const summary = {
        total_events: events.length,
        critical_events: events.filter(e => e.alert_level === AlertLevel.CRITICAL).length,
        phi_access_events: events.filter(e => e.data_classification === DataClassification.PHI).length,
        failed_access_attempts: events.filter(e => 
          e.event_type === AuditEventType.AUTHENTICATION && 
          e.details?.success === false
        ).length,
        suspicious_activities: events.filter(e => 
          e.alert_level === AlertLevel.HIGH || e.alert_level === AlertLevel.CRITICAL
        ).length
      }

      const report: ComplianceReport = {
        report_id: crypto.randomUUID(),
        report_type: reportType,
        date_range: dateRange,
        filters: filters || {},
        summary,
        events,
        generated_at: new Date().toISOString(),
        generated_by: this.context.userId,
        signature: this.createReportSignature(events, dateRange)
      }

      logger.info('Compliance report generated', {
        reportId: report.report_id,
        reportType,
        eventCount: events.length,
        generatedBy: this.context.userId
      })

      return { data: report, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to generate compliance report', {
        reportType,
        dateRange,
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Export audit logs for external review
   */
  public async exportAuditLogs(
    format: 'json' | 'csv' | 'xml',
    filters?: {
      dateRange?: { start: string; end: string }
      eventTypes?: AuditEventType[]
      alertLevels?: AlertLevel[]
    }
  ): Promise<QueryResult<{ data: string; filename: string; contentType: string }>> {
    if (!this.context) {
      return { data: null, error: 'Audit context is required' }
    }

    // Only admins and super admins can export audit logs
    if (![AdminRole.ADMIN, AdminRole.SUPER_ADMIN].includes(this.context.role)) {
      return { data: null, error: 'Insufficient permissions for audit log export' }
    }

    try {
      const auditLogs = await this.getAuditLogs({
        ...filters,
        limit: 10000 // Large export limit
      })

      if (!auditLogs.data.length) {
        return { data: null, error: 'No audit logs found for export' }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      let exportData: string
      let filename: string
      let contentType: string

      switch (format) {
        case 'json':
          exportData = JSON.stringify(auditLogs.data, null, 2)
          filename = `audit-logs-${timestamp}.json`
          contentType = 'application/json'
          break

        case 'csv':
          exportData = this.convertToCSV(auditLogs.data)
          filename = `audit-logs-${timestamp}.csv`
          contentType = 'text/csv'
          break

        case 'xml':
          exportData = this.convertToXML(auditLogs.data)
          filename = `audit-logs-${timestamp}.xml`
          contentType = 'application/xml'
          break

        default:
          return { data: null, error: 'Unsupported export format' }
      }

      // Log the export activity
      await this.logEvent(
        AuditAction.VIEW,
        'audit_export',
        undefined,
        {
          export_format: format,
          record_count: auditLogs.data.length,
          filters
        },
        {
          eventType: AuditEventType.DATA_ACCESS,
          alertLevel: AlertLevel.MEDIUM,
          complianceTags: ['export', 'audit']
        }
      )

      return {
        data: {
          data: exportData,
          filename,
          contentType
        },
        error: null
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to export audit logs', {
        format,
        filters,
        error: errorMessage
      })
      return { data: null, error: errorMessage }
    }
  }

  // ================================
  // Suspicious Activity Detection
  // ================================

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(auditEntry: EnhancedAuditLog): Promise<void> {
    try {
      const checks = [
        () => this.checkBulkDataAccess(auditEntry),
        () => this.checkPrivilegeEscalation(auditEntry),
        () => this.checkPHIAccessAnomaly(auditEntry),
        () => this.checkOffHoursActivity(auditEntry),
        () => this.checkUnusualAccessPattern(auditEntry)
      ]

      for (const check of checks) {
        await check()
      }

    } catch (error) {
      logger.error('Error in suspicious activity check', {
        auditId: auditEntry.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check for multiple failed login attempts
   */
  private async checkFailedLoginPattern(userId: string, ipAddress?: string): Promise<void> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      let query = this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .select('*')
        .eq('user_id', userId)
        .eq('action', AuditAction.LOGIN)
        .gte('created_at', fiveMinutesAgo)

      if (ipAddress) {
        query = query.eq('ip_address', ipAddress)
      }

      const result = await query

      if (result.data && result.data.length >= 5) {
        const failedAttempts = result.data.filter(log => log.details?.success === false)

        if (failedAttempts.length >= 5) {
          await this.createSuspiciousActivityAlert({
            type: SuspiciousActivityType.MULTIPLE_FAILED_LOGINS,
            severity: AlertLevel.HIGH,
            user_id: userId,
            description: `Multiple failed login attempts detected (${failedAttempts.length} in 5 minutes)`,
            indicators: {
              failed_attempts: failedAttempts.length,
              ip_address: ipAddress,
              time_window: '5_minutes'
            },
            related_audit_ids: failedAttempts.map(log => log.id)
          })
        }
      }

    } catch (error) {
      logger.error('Error checking failed login pattern', {
        userId,
        ipAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check for bulk data access patterns
   */
  private async checkBulkDataAccess(auditEntry: EnhancedAuditLog): Promise<void> {
    if (auditEntry.action !== AuditAction.VIEW) return

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const result = await this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .select('*')
        .eq('user_id', auditEntry.user_id)
        .eq('action', AuditAction.VIEW)
        .gte('created_at', oneHourAgo)

      if (result.data && result.data.length >= 100) {
        await this.createSuspiciousActivityAlert({
          type: SuspiciousActivityType.BULK_DATA_ACCESS,
          severity: AlertLevel.MEDIUM,
          user_id: auditEntry.user_id,
          description: `Bulk data access detected (${result.data.length} views in 1 hour)`,
          indicators: {
            access_count: result.data.length,
            time_window: '1_hour',
            resource_types: [...new Set(result.data.map(log => log.resource_type))]
          },
          related_audit_ids: result.data.map(log => log.id)
        })
      }

    } catch (error) {
      logger.error('Error checking bulk data access', {
        auditId: auditEntry.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check for privilege escalation attempts
   */
  private async checkPrivilegeEscalation(auditEntry: EnhancedAuditLog): Promise<void> {
    if (auditEntry.action !== AuditAction.PERMISSION_CHANGE) return

    try {
      await this.createSuspiciousActivityAlert({
        type: SuspiciousActivityType.PRIVILEGE_ESCALATION,
        severity: AlertLevel.CRITICAL,
        user_id: auditEntry.user_id,
        description: 'Permission change detected - potential privilege escalation',
        indicators: {
          resource_type: auditEntry.resource_type,
          resource_id: auditEntry.resource_id,
          changes: auditEntry.details
        },
        related_audit_ids: [auditEntry.id || '']
      })

    } catch (error) {
      logger.error('Error checking privilege escalation', {
        auditId: auditEntry.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check for PHI access anomalies
   */
  private async checkPHIAccessAnomaly(auditEntry: EnhancedAuditLog): Promise<void> {
    if (auditEntry.data_classification !== DataClassification.PHI) return

    try {
      // Check if user has appropriate role for PHI access
      const userRoles = [AdminRole.ADMIN, AdminRole.SUPER_ADMIN]
      if (this.context && !userRoles.includes(this.context.role)) {
        await this.createSuspiciousActivityAlert({
          type: SuspiciousActivityType.PHI_ACCESS_ANOMALY,
          severity: AlertLevel.HIGH,
          user_id: auditEntry.user_id,
          description: 'Potential unauthorized PHI access',
          indicators: {
            user_role: this.context.role,
            resource_type: auditEntry.resource_type,
            resource_id: auditEntry.resource_id
          },
          related_audit_ids: [auditEntry.id || '']
        })
      }

    } catch (error) {
      logger.error('Error checking PHI access anomaly', {
        auditId: auditEntry.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check for off-hours activity
   */
  private async checkOffHoursActivity(auditEntry: EnhancedAuditLog): Promise<void> {
    try {
      const hour = new Date(auditEntry.created_at).getHours()
      const isWeekend = [0, 6].includes(new Date(auditEntry.created_at).getDay())
      const isOffHours = hour < 6 || hour > 22 // Outside 6 AM - 10 PM

      if (isOffHours || isWeekend) {
        await this.createSuspiciousActivityAlert({
          type: SuspiciousActivityType.OFF_HOURS_ACTIVITY,
          severity: AlertLevel.MEDIUM,
          user_id: auditEntry.user_id,
          description: 'Off-hours activity detected',
          indicators: {
            hour,
            is_weekend: isWeekend,
            is_off_hours: isOffHours,
            action: auditEntry.action,
            resource_type: auditEntry.resource_type
          },
          related_audit_ids: [auditEntry.id || '']
        })
      }

    } catch (error) {
      logger.error('Error checking off-hours activity', {
        auditId: auditEntry.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check for unusual access patterns
   */
  private async checkUnusualAccessPattern(auditEntry: EnhancedAuditLog): Promise<void> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      
      const result = await this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .select('*')
        .eq('user_id', auditEntry.user_id)
        .gte('created_at', oneWeekAgo)

      if (result.data && result.data.length > 0) {
        const currentIP = auditEntry.ip_address
        const historicalIPs = [...new Set(result.data.map(log => log.ip_address).filter(Boolean))]
        
        // Check for new IP address
        if (currentIP && !historicalIPs.includes(currentIP)) {
          await this.createSuspiciousActivityAlert({
            type: SuspiciousActivityType.UNUSUAL_ACCESS_PATTERN,
            severity: AlertLevel.MEDIUM,
            user_id: auditEntry.user_id,
            description: 'Access from new IP address detected',
            indicators: {
              new_ip: currentIP,
              historical_ips: historicalIPs.slice(-5), // Last 5 IPs
              user_agent: auditEntry.user_agent
            },
            related_audit_ids: [auditEntry.id || '']
          })
        }
      }

    } catch (error) {
      logger.error('Error checking unusual access pattern', {
        auditId: auditEntry.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Create suspicious activity alert
   */
  private async createSuspiciousActivityAlert(alert: Omit<SuspiciousActivity, 'id' | 'detected_at'>): Promise<void> {
    try {
      const suspiciousActivity: SuspiciousActivity = {
        id: crypto.randomUUID(),
        ...alert,
        detected_at: new Date().toISOString()
      }

      // Store alert (would typically be in a separate table)
      logger.warn('Suspicious activity detected', {
        alertId: suspiciousActivity.id,
        type: suspiciousActivity.type,
        severity: suspiciousActivity.severity,
        userId: suspiciousActivity.user_id,
        description: suspiciousActivity.description
      })

      // Could also trigger notifications, webhooks, etc.
      await this.notifySecurityTeam(suspiciousActivity)

    } catch (error) {
      logger.error('Failed to create suspicious activity alert', {
        alert,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // ================================
  // Retention and Cleanup Methods
  // ================================

  /**
   * Apply retention policies and clean up old audit logs
   */
  public async applyRetentionPolicies(): Promise<{
    archived: number
    deleted: number
    errors: string[]
  }> {
    if (!this.context) {
      return { archived: 0, deleted: 0, errors: ['Audit context is required'] }
    }

    // Only super admins can apply retention policies
    if (this.context.role !== AdminRole.SUPER_ADMIN) {
      return { archived: 0, deleted: 0, errors: ['Insufficient permissions'] }
    }

    const results = { archived: 0, deleted: 0, errors: [] }

    try {
      for (const policy of this.defaultRetentionPolicies) {
        try {
          const result = await this.applyRetentionPolicy(policy)
          results.archived += result.archived
          results.deleted += result.deleted
        } catch (error) {
          results.errors.push(`Policy ${policy.data_classification}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      logger.info('Retention policies applied', results)

    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error')
      logger.error('Error applying retention policies', { error: results.errors })
    }

    return results
  }

  /**
   * Apply individual retention policy
   */
  private async applyRetentionPolicy(policy: RetentionPolicy): Promise<{
    archived: number
    deleted: number
  }> {
    const results = { archived: 0, deleted: 0 }

    try {
      // Calculate cutoff dates
      const archiveDate = new Date()
      archiveDate.setMonth(archiveDate.getMonth() - policy.archive_after_months)
      
      const deleteDate = new Date()
      deleteDate.setFullYear(deleteDate.getFullYear() - policy.retention_years)

      // Archive old records
      const archiveQuery = this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .select('id')
        .eq('data_classification', policy.data_classification)
        .lt('created_at', archiveDate.toISOString())
        .is('archived_at', null)

      const archiveResult = await archiveQuery
      
      if (archiveResult.data) {
        // Mark records as archived (in practice, you'd move them to archive storage)
        const archiveUpdateResult = await this.client
          .from(TABLE_NAMES.AUDIT_LOGS)
          .update({ archived_at: new Date().toISOString() })
          .in('id', archiveResult.data.map(r => r.id))

        results.archived = archiveResult.data.length
      }

      // Delete very old records (only if not requiring legal hold)
      if (!policy.require_legal_hold) {
        const deleteQuery = this.client
          .from(TABLE_NAMES.AUDIT_LOGS)
          .select('id')
          .eq('data_classification', policy.data_classification)
          .lt('created_at', deleteDate.toISOString())

        const deleteResult = await deleteQuery

        if (deleteResult.data) {
          const deleteUpdateResult = await this.client
            .from(TABLE_NAMES.AUDIT_LOGS)
            .delete()
            .in('id', deleteResult.data.map(r => r.id))

          results.deleted = deleteResult.data.length
        }
      }

    } catch (error) {
      logger.error('Error applying retention policy', {
        policy,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }

    return results
  }

  // ================================
  // Utility and Helper Methods
  // ================================

  /**
   * Create cryptographic signature for audit entry integrity
   */
  private createSignature(entry: Partial<EnhancedAuditLog>): string {
    const data = {
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      created_at: entry.created_at,
      previous_hash: this.lastHash
    }

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(data))
      .digest('hex')
  }

  /**
   * Create batch signature
   */
  private createBatchSignature(entries: EnhancedAuditLog[], batchId: string): string {
    const data = {
      batch_id: batchId,
      entry_count: entries.length,
      first_entry_id: entries[0]?.id,
      last_entry_id: entries[entries.length - 1]?.id
    }

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(data))
      .digest('hex')
  }

  /**
   * Create compliance report signature
   */
  private createReportSignature(events: EnhancedAuditLog[], dateRange: { start: string; end: string }): string {
    const data = {
      event_count: events.length,
      date_range: dateRange,
      first_event_id: events[0]?.id,
      last_event_id: events[events.length - 1]?.id
    }

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(data))
      .digest('hex')
  }

  /**
   * Determine data classification for resource
   */
  private determineDataClassification(resourceType: string, details?: Record<string, any>): DataClassification {
    // PHI data detection
    if (details && (details.phi_access || details.patient_data || details.medical_record)) {
      return DataClassification.PHI
    }

    // Check for sensitive resource types
    const confidentialResources = ['admin_users', 'admin_sessions', 'audit_logs']
    if (confidentialResources.includes(resourceType)) {
      return DataClassification.CONFIDENTIAL
    }

    // Check for public resources
    const publicResources = ['blog_posts', 'pages', 'testimonials']
    if (publicResources.includes(resourceType)) {
      return DataClassification.PUBLIC
    }

    return DataClassification.INTERNAL
  }

  /**
   * Determine event type based on action and resource
   */
  private determineEventType(action: AuditAction, resourceType: string): AuditEventType {
    switch (action) {
      case AuditAction.LOGIN:
      case AuditAction.LOGOUT:
        return AuditEventType.AUTHENTICATION

      case AuditAction.PERMISSION_CHANGE:
        return AuditEventType.AUTHORIZATION

      case AuditAction.VIEW:
        return AuditEventType.DATA_ACCESS

      case AuditAction.CREATE:
      case AuditAction.UPDATE:
      case AuditAction.DELETE:
        return AuditEventType.DATA_MODIFICATION

      default:
        return AuditEventType.SYSTEM_EVENT
    }
  }

  /**
   * Determine alert level based on action and security context
   */
  private determineAlertLevel(
    action: AuditAction,
    securityContext: { risk_score: number; confidence_level: number; flags: string[] }
  ): AlertLevel {
    // Critical actions
    if ([AuditAction.DELETE, AuditAction.PERMISSION_CHANGE].includes(action)) {
      return AlertLevel.HIGH
    }

    // High risk score
    if (securityContext.risk_score >= 0.8) {
      return AlertLevel.CRITICAL
    }

    if (securityContext.risk_score >= 0.6) {
      return AlertLevel.HIGH
    }

    if (securityContext.risk_score >= 0.4) {
      return AlertLevel.MEDIUM
    }

    return AlertLevel.LOW
  }

  /**
   * Calculate security context and risk score
   */
  private calculateSecurityContext(
    action: AuditAction,
    resourceType: string,
    details?: Record<string, any>,
    ipAddress?: string
  ): { risk_score: number; confidence_level: number; flags: string[] } {
    let riskScore = 0
    let confidenceLevel = 0.5
    const flags: string[] = []

    // Action-based risk
    switch (action) {
      case AuditAction.DELETE:
        riskScore += 0.4
        flags.push('destructive_action')
        break
      case AuditAction.PERMISSION_CHANGE:
        riskScore += 0.6
        flags.push('permission_change')
        break
      case AuditAction.CREATE:
      case AuditAction.UPDATE:
        riskScore += 0.2
        break
    }

    // Resource-based risk
    const highRiskResources = ['admin_users', 'admin_sessions', 'audit_logs']
    if (highRiskResources.includes(resourceType)) {
      riskScore += 0.3
      flags.push('sensitive_resource')
    }

    // PHI data access
    if (details && (details.phi_access || details.patient_data)) {
      riskScore += 0.4
      flags.push('phi_access')
      confidenceLevel = 0.8
    }

    // IP-based risk (simplified - would use threat intelligence in practice)
    if (ipAddress && ipAddress.startsWith('192.168.')) {
      // Internal IP - lower risk
      riskScore -= 0.1
    } else if (ipAddress) {
      // External IP - higher risk
      riskScore += 0.1
      flags.push('external_ip')
    }

    // Time-based risk
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      riskScore += 0.2
      flags.push('off_hours')
    }

    return {
      risk_score: Math.min(1.0, Math.max(0.0, riskScore)),
      confidence_level: Math.min(1.0, Math.max(0.0, confidenceLevel)),
      flags
    }
  }

  /**
   * Create PHI summary for audit logs
   */
  private createPHISummary(phiDetails: Record<string, any>): Record<string, any> {
    return {
      data_types: Object.keys(phiDetails),
      record_count: Array.isArray(phiDetails) ? phiDetails.length : 1,
      contains_identifiers: this.containsIdentifiers(phiDetails),
      compliance_level: 'strict'
    }
  }

  /**
   * Check if data contains personal identifiers
   */
  private containsIdentifiers(data: any): boolean {
    const identifierPatterns = [
      'ssn', 'social_security_number', 'patient_id', 'medical_record_number',
      'email', 'phone', 'address', 'name', 'dob', 'birthdate'
    ]

    const dataString = JSON.stringify(data).toLowerCase()
    return identifierPatterns.some(pattern => dataString.includes(pattern))
  }

  /**
   * Validate audit log access permissions
   */
  private validateAuditLogAccess(): boolean {
    if (!this.context) return false

    // Audit logs require at least editor role
    return [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR].includes(this.context.role)
  }

  /**
   * Check if user can access PHI data
   */
  private canAccessPHI(): boolean {
    if (!this.context) return false

    // PHI access requires admin or super admin role
    return [AdminRole.SUPER_ADMIN, AdminRole.ADMIN].includes(this.context.role)
  }

  /**
   * Sanitize audit log for output
   */
  private sanitizeAuditLog(log: any, includeDetails: boolean = false): EnhancedAuditLog {
    const sanitized = { ...log }

    // Remove sensitive system information
    delete sanitized.signature
    delete sanitized.previous_hash

    // Sanitize details based on user permissions
    if (sanitized.details && !includeDetails) {
      // Remove potentially sensitive details for non-admin users
      if (!this.canAccessPHI()) {
        sanitized.details = sanitizeHealthcareDataForLogging(sanitized.details)
      }
    }

    return sanitized
  }

  /**
   * Convert audit logs to CSV format
   */
  private convertToCSV(logs: EnhancedAuditLog[]): string {
    if (logs.length === 0) return ''

    const headers = [
      'id', 'user_id', 'action', 'event_type', 'alert_level', 'resource_type',
      'resource_id', 'ip_address', 'created_at', 'data_classification'
    ]

    const csvRows = [
      headers.join(','),
      ...logs.map(log => headers.map(header => {
        const value = log[header as keyof EnhancedAuditLog]
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || ''
      }).join(','))
    ]

    return csvRows.join('\n')
  }

  /**
   * Convert audit logs to XML format
   */
  private convertToXML(logs: EnhancedAuditLog[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<audit_logs>\n'

    for (const log of logs) {
      xml += '  <audit_log>\n'
      xml += `    <id>${log.id}</id>\n`
      xml += `    <user_id>${log.user_id}</user_id>\n`
      xml += `    <action>${log.action}</action>\n`
      xml += `    <event_type>${log.event_type}</event_type>\n`
      xml += `    <alert_level>${log.alert_level}</alert_level>\n`
      xml += `    <resource_type>${log.resource_type}</resource_type>\n`
      if (log.resource_id) xml += `    <resource_id>${log.resource_id}</resource_id>\n`
      if (log.ip_address) xml += `    <ip_address>${log.ip_address}</ip_address>\n`
      xml += `    <created_at>${log.created_at}</created_at>\n`
      if (log.data_classification) xml += `    <data_classification>${log.data_classification}</data_classification>\n`
      xml += '  </audit_log>\n'
    }

    xml += '</audit_logs>'
    return xml
  }

  /**
   * Notify security team of suspicious activity
   */
  private async notifySecurityTeam(activity: SuspiciousActivity): Promise<void> {
    try {
      // In production, this would trigger notifications via email, Slack, etc.
      logger.warn('SECURITY ALERT', {
        alertId: activity.id,
        type: activity.type,
        severity: activity.severity,
        userId: activity.user_id,
        description: activity.description,
        indicators: activity.indicators
      })

      // Could also integrate with SIEM systems, security platforms, etc.
    } catch (error) {
      logger.error('Failed to notify security team', {
        activity,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Ensure batch is flushed when instance is destroyed
   */
  public async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }
    await this.flushBatch()
  }
}

// ================================
// Factory Functions
// ================================

/**
 * Create audit logger instance with proper configuration
 */
export function createAuditLogger(
  client: SupabaseClient,
  secretKey?: string
): AuditLogger {
  return new AuditLogger(client, secretKey)
}

/**
 * Create audit logger with context
 */
export function createAuditLoggerWithContext(
  client: SupabaseClient,
  context: DataAccessContext,
  secretKey?: string
): AuditLogger {
  const logger = new AuditLogger(client, secretKey)
  logger.setContext(context)
  return logger
}

// ================================
// Exports
// ================================

export default AuditLogger
export type {
  EnhancedAuditLog,
  AuditBatch,
  ComplianceReport,
  SuspiciousActivity,
  RetentionPolicy
}
export {
  AlertLevel,
  AuditEventType,
  SuspiciousActivityType
}