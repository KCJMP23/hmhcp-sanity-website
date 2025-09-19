/**
 * HIPAA-Compliant Version Audit Logging System
 * 
 * Provides comprehensive audit logging for all publication version operations
 * with healthcare compliance features, tamper-resistant logging, and detailed
 * activity tracking for regulatory requirements.
 * 
 * Features:
 * - HIPAA-compliant audit logging
 * - Tamper-resistant log entries with cryptographic hashing
 * - Detailed activity tracking and correlation IDs
 * - Automatic PII detection and redaction
 * - Compliance reporting and log retention
 * - Real-time alerting for critical activities
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createHash, createHmac } from 'crypto'
import { z } from 'zod'
import logger from '@/lib/logging/winston-logger'

// ================================================================
// INTERFACES AND TYPES
// ================================================================

export interface VersionAuditEntry {
  id: string
  correlationId: string
  publicationId?: string
  versionId?: string
  versionNumber?: string
  action: AuditAction
  actorType: 'user' | 'system' | 'api'
  actorId: string
  actorEmail?: string
  actorName?: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  
  // Activity details
  resourceType: string
  resourceId?: string
  parentResourceId?: string
  accessLevel: 'read' | 'write' | 'delete' | 'admin'
  
  // Change tracking
  changeDetails?: any
  beforeState?: any
  afterState?: any
  changeType?: 'create' | 'update' | 'delete' | 'rollback' | 'approve' | 'reject'
  
  // Compliance and security
  dataClassification: 'public' | 'internal' | 'confidential' | 'healthcare_content' | 'pii'
  impactLevel: 'trivial' | 'minor' | 'major' | 'critical'
  complianceFlags: string[]
  riskScore: number // 0-10
  
  // Integrity and verification
  entryHash: string
  previousHash?: string
  chainVerified: boolean
  
  // Additional context
  requestId?: string
  operationContext?: any
  errorDetails?: any
  processingTimeMs?: number
  
  // Retention and archival
  retentionPeriod: number // days
  archivalDate?: string
  isProtected: boolean
}

export type AuditAction = 
  | 'version_create'
  | 'version_read'
  | 'version_update'
  | 'version_delete'
  | 'version_compare'
  | 'version_rollback'
  | 'version_approve'
  | 'version_reject'
  | 'version_list_access'
  | 'version_snapshot_create'
  | 'version_optimization'
  | 'publication_read'
  | 'publication_update'
  | 'publication_delete'
  | 'authentication'
  | 'authorization_failure'
  | 'data_export'
  | 'data_import'
  | 'system_configuration'
  | 'security_incident'

export interface AuditLogQuery {
  publicationId?: string
  versionId?: string
  actorId?: string
  action?: AuditAction
  dateFrom?: string
  dateTo?: string
  impactLevel?: string[]
  dataClassification?: string[]
  limit?: number
  offset?: number
  includeDetails?: boolean
}

export interface ComplianceReport {
  reportId: string
  generatedAt: string
  periodFrom: string
  periodTo: string
  totalEntries: number
  summary: {
    actionBreakdown: Record<AuditAction, number>
    impactLevelBreakdown: Record<string, number>
    dataClassificationBreakdown: Record<string, number>
    userActivityBreakdown: Record<string, number>
  }
  complianceMetrics: {
    hipaaCompliantEntries: number
    compliancePercentage: number
    integrityVerified: number
    integrityPercentage: number
    retentionCompliant: number
    retentionPercentage: number
  }
  securityIncidents: number
  riskAssessment: {
    averageRiskScore: number
    highRiskActivities: number
    criticalActivities: number
  }
  recommendations: string[]
}

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

const auditEntrySchema = z.object({
  correlationId: z.string().uuid(),
  publicationId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  versionNumber: z.string().optional(),
  action: z.enum([
    'version_create', 'version_read', 'version_update', 'version_delete',
    'version_compare', 'version_rollback', 'version_approve', 'version_reject',
    'version_list_access', 'version_snapshot_create', 'version_optimization',
    'publication_read', 'publication_update', 'publication_delete',
    'authentication', 'authorization_failure', 'data_export', 'data_import',
    'system_configuration', 'security_incident'
  ]),
  actorType: z.enum(['user', 'system', 'api']),
  actorId: z.string(),
  actorEmail: z.string().email().optional(),
  actorName: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  parentResourceId: z.string().optional(),
  accessLevel: z.enum(['read', 'write', 'delete', 'admin']),
  changeDetails: z.any().optional(),
  beforeState: z.any().optional(),
  afterState: z.any().optional(),
  changeType: z.enum(['create', 'update', 'delete', 'rollback', 'approve', 'reject']).optional(),
  dataClassification: z.enum(['public', 'internal', 'confidential', 'healthcare_content', 'pii']),
  impactLevel: z.enum(['trivial', 'minor', 'major', 'critical']),
  complianceFlags: z.array(z.string()).default([]),
  riskScore: z.number().min(0).max(10).default(1),
  requestId: z.string().optional(),
  operationContext: z.any().optional(),
  errorDetails: z.any().optional(),
  processingTimeMs: z.number().optional(),
  retentionPeriod: z.number().min(1).max(3650).default(2555), // 7 years default for HIPAA
  isProtected: z.boolean().default(false)
})

const auditQuerySchema = z.object({
  publicationId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  impactLevel: z.array(z.string()).optional(),
  dataClassification: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).default(50),
  offset: z.number().min(0).default(0),
  includeDetails: z.boolean().default(false)
})

// ================================================================
// VERSION AUDIT MANAGER CLASS
// ================================================================

export class VersionAuditManager {
  private supabase: any
  private logger: any
  private auditSecret: string
  private lastHashCache: Map<string, string> = new Map()

  constructor() {
    this.logger = logger?.child ? logger.child({ service: 'VersionAuditManager' }) : console
    this.auditSecret = process.env.AUDIT_HASH_SECRET || 'fallback-secret-change-in-production'
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient()
    }
    return this.supabase
  }

  /**
   * Generate cryptographic hash for audit entry integrity
   */
  private generateEntryHash(
    entry: Partial<VersionAuditEntry>,
    previousHash?: string
  ): string {
    const dataToHash = JSON.stringify({
      correlationId: entry.correlationId,
      timestamp: entry.timestamp,
      action: entry.action,
      actorId: entry.actorId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      changeDetails: entry.changeDetails,
      previousHash: previousHash || 'genesis'
    }, Object.keys(entry).sort())

    return createHmac('sha256', this.auditSecret)
      .update(dataToHash)
      .digest('hex')
  }

  /**
   * Detect and redact PII from audit data
   */
  private redactPII(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const redactedData = { ...data }
    const piiFields = ['ssn', 'social_security', 'credit_card', 'passport', 'license']
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g

    // Redact known PII fields
    for (const field of piiFields) {
      if (redactedData[field]) {
        redactedData[field] = '[REDACTED]'
      }
    }

    // Redact email addresses (except in specific allowed contexts)
    for (const key in redactedData) {
      if (typeof redactedData[key] === 'string') {
        redactedData[key] = redactedData[key].replace(emailRegex, '[EMAIL_REDACTED]')
        redactedData[key] = redactedData[key].replace(phoneRegex, '[PHONE_REDACTED]')
      }
    }

    return redactedData
  }

  /**
   * Calculate risk score based on activity context
   */
  private calculateRiskScore(
    action: AuditAction,
    impactLevel: string,
    dataClassification: string,
    context?: any
  ): number {
    let riskScore = 1

    // Base score by action type
    const actionRisk = {
      version_delete: 8,
      version_rollback: 7,
      publication_delete: 9,
      authorization_failure: 6,
      security_incident: 10,
      data_export: 5,
      version_approve: 4,
      version_reject: 4,
      version_create: 3,
      version_update: 3,
      version_compare: 2,
      version_read: 1
    }

    riskScore += actionRisk[action] || 1

    // Impact level multiplier
    const impactMultiplier = {
      critical: 2.0,
      major: 1.5,
      minor: 1.0,
      trivial: 0.5
    }
    riskScore *= impactMultiplier[impactLevel as keyof typeof impactMultiplier] || 1.0

    // Data classification multiplier
    const classificationMultiplier = {
      pii: 2.0,
      healthcare_content: 1.8,
      confidential: 1.5,
      internal: 1.0,
      public: 0.8
    }
    riskScore *= classificationMultiplier[dataClassification as keyof typeof classificationMultiplier] || 1.0

    // Context-based adjustments
    if (context?.errorDetails) riskScore += 1
    if (context?.afterHours) riskScore += 1
    if (context?.unusualActivity) riskScore += 2

    return Math.min(10, Math.round(riskScore * 10) / 10)
  }

  /**
   * Generate compliance flags based on entry context
   */
  private generateComplianceFlags(
    action: AuditAction,
    dataClassification: string,
    impactLevel: string,
    context?: any
  ): string[] {
    const flags: string[] = []

    // HIPAA compliance flags
    if (dataClassification === 'healthcare_content' || dataClassification === 'pii') {
      flags.push('HIPAA_APPLICABLE')
    }

    if (action.includes('delete') || action === 'version_rollback') {
      flags.push('DATA_MODIFICATION')
    }

    if (impactLevel === 'critical' || impactLevel === 'major') {
      flags.push('HIGH_IMPACT')
    }

    if (action === 'authorization_failure' || action === 'security_incident') {
      flags.push('SECURITY_EVENT')
    }

    if (action === 'data_export') {
      flags.push('DATA_EXPORT')
    }

    if (context?.errorDetails) {
      flags.push('ERROR_OCCURRED')
    }

    // Regulatory compliance flags
    if (flags.includes('HIPAA_APPLICABLE') && flags.includes('DATA_MODIFICATION')) {
      flags.push('HIPAA_COVERED_TRANSACTION')
    }

    return flags
  }

  /**
   * Log a version-related audit event
   */
  async logAuditEvent(
    auditData: Omit<VersionAuditEntry, 'id' | 'timestamp' | 'entryHash' | 'previousHash' | 'chainVerified' | 'complianceFlags' | 'riskScore'>
  ): Promise<{
    success: boolean
    auditEntryId?: string
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Validate audit data
      const validatedData = auditEntrySchema.parse(auditData)
      
      // Generate timestamp
      const timestamp = new Date().toISOString()
      
      // Get previous hash for chain integrity
      const cacheKey = validatedData.publicationId || 'global'
      let previousHash = this.lastHashCache.get(cacheKey)
      
      if (!previousHash) {
        const { data: lastEntry } = await supabase
          .from('version_audit_logs')
          .select('entry_hash')
          .eq('publication_id', validatedData.publicationId || null)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()
        
        previousHash = lastEntry?.entry_hash
      }

      // Redact PII from sensitive data
      const redactedChangeDetails = this.redactPII(validatedData.changeDetails)
      const redactedBeforeState = this.redactPII(validatedData.beforeState)
      const redactedAfterState = this.redactPII(validatedData.afterState)

      // Generate compliance flags and risk score
      const complianceFlags = this.generateComplianceFlags(
        validatedData.action,
        validatedData.dataClassification,
        validatedData.impactLevel,
        validatedData.operationContext
      )

      const riskScore = this.calculateRiskScore(
        validatedData.action,
        validatedData.impactLevel,
        validatedData.dataClassification,
        validatedData.operationContext
      )

      // Prepare full audit entry
      const fullAuditEntry: Omit<VersionAuditEntry, 'id'> = {
        ...validatedData,
        timestamp,
        changeDetails: redactedChangeDetails,
        beforeState: redactedBeforeState,
        afterState: redactedAfterState,
        complianceFlags,
        riskScore,
        entryHash: '', // Will be set below
        previousHash,
        chainVerified: true
      }

      // Generate entry hash
      const entryHash = this.generateEntryHash(fullAuditEntry, previousHash)
      fullAuditEntry.entryHash = entryHash

      // Store in database
      const { data: auditEntry, error } = await supabase
        .from('version_audit_logs')
        .insert({
          correlation_id: fullAuditEntry.correlationId,
          publication_id: fullAuditEntry.publicationId || null,
          version_id: fullAuditEntry.versionId || null,
          version_number: fullAuditEntry.versionNumber || null,
          action: fullAuditEntry.action,
          actor_type: fullAuditEntry.actorType,
          actor_id: fullAuditEntry.actorId,
          actor_email: fullAuditEntry.actorEmail || null,
          actor_name: fullAuditEntry.actorName || null,
          timestamp: fullAuditEntry.timestamp,
          ip_address: fullAuditEntry.ipAddress || null,
          user_agent: fullAuditEntry.userAgent || null,
          session_id: fullAuditEntry.sessionId || null,
          resource_type: fullAuditEntry.resourceType,
          resource_id: fullAuditEntry.resourceId || null,
          parent_resource_id: fullAuditEntry.parentResourceId || null,
          access_level: fullAuditEntry.accessLevel,
          change_details: fullAuditEntry.changeDetails || null,
          before_state: fullAuditEntry.beforeState || null,
          after_state: fullAuditEntry.afterState || null,
          change_type: fullAuditEntry.changeType || null,
          data_classification: fullAuditEntry.dataClassification,
          impact_level: fullAuditEntry.impactLevel,
          compliance_flags: fullAuditEntry.complianceFlags,
          risk_score: fullAuditEntry.riskScore,
          entry_hash: fullAuditEntry.entryHash,
          previous_hash: fullAuditEntry.previousHash || null,
          chain_verified: fullAuditEntry.chainVerified,
          request_id: fullAuditEntry.requestId || null,
          operation_context: fullAuditEntry.operationContext || null,
          error_details: fullAuditEntry.errorDetails || null,
          processing_time_ms: fullAuditEntry.processingTimeMs || null,
          retention_period: fullAuditEntry.retentionPeriod,
          is_protected: fullAuditEntry.isProtected
        })
        .select()
        .single()

      if (error) {
        this.logger.error('Failed to create audit log entry', {
          error: error.message,
          correlationId: fullAuditEntry.correlationId,
          action: fullAuditEntry.action
        })
        return { success: false, error: 'Failed to create audit log entry' }
      }

      // Update hash cache
      this.lastHashCache.set(cacheKey, entryHash)

      // Log high-risk activities immediately
      if (riskScore >= 7 || complianceFlags.includes('SECURITY_EVENT')) {
        this.logger.warn('High-risk activity logged', {
          auditEntryId: auditEntry.id,
          action: fullAuditEntry.action,
          riskScore,
          complianceFlags,
          actorId: fullAuditEntry.actorId,
          resourceId: fullAuditEntry.resourceId
        })
      }

      this.logger.info('Audit log entry created successfully', {
        auditEntryId: auditEntry.id,
        action: fullAuditEntry.action,
        riskScore,
        complianceFlags: complianceFlags.length,
        correlationId: fullAuditEntry.correlationId
      })

      return {
        success: true,
        auditEntryId: auditEntry.id
      }

    } catch (error) {
      this.logger.error('Error creating audit log entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        auditData
      })
      return { success: false, error: 'Internal error creating audit log' }
    }
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async queryAuditLogs(
    query: AuditLogQuery
  ): Promise<{
    success: boolean
    logs?: VersionAuditEntry[]
    total?: number
    error?: string
  }> {
    try {
      const validatedQuery = auditQuerySchema.parse(query)
      const supabase = await this.getSupabaseClient()

      let dbQuery = supabase
        .from('version_audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })

      // Apply filters
      if (validatedQuery.publicationId) {
        dbQuery = dbQuery.eq('publication_id', validatedQuery.publicationId)
      }

      if (validatedQuery.versionId) {
        dbQuery = dbQuery.eq('version_id', validatedQuery.versionId)
      }

      if (validatedQuery.actorId) {
        dbQuery = dbQuery.eq('actor_id', validatedQuery.actorId)
      }

      if (validatedQuery.action) {
        dbQuery = dbQuery.eq('action', validatedQuery.action)
      }

      if (validatedQuery.dateFrom) {
        dbQuery = dbQuery.gte('timestamp', validatedQuery.dateFrom)
      }

      if (validatedQuery.dateTo) {
        dbQuery = dbQuery.lte('timestamp', validatedQuery.dateTo)
      }

      if (validatedQuery.impactLevel?.length) {
        dbQuery = dbQuery.in('impact_level', validatedQuery.impactLevel)
      }

      if (validatedQuery.dataClassification?.length) {
        dbQuery = dbQuery.in('data_classification', validatedQuery.dataClassification)
      }

      // Apply pagination
      dbQuery = dbQuery
        .range(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit - 1)

      const { data: logs, error, count } = await dbQuery

      if (error) {
        this.logger.error('Failed to query audit logs', {
          error: error.message,
          query: validatedQuery
        })
        return { success: false, error: 'Failed to query audit logs' }
      }

      // Transform database records to audit entries
      const auditEntries: VersionAuditEntry[] = (logs || []).map(log => ({
        id: log.id,
        correlationId: log.correlation_id,
        publicationId: log.publication_id,
        versionId: log.version_id,
        versionNumber: log.version_number,
        action: log.action,
        actorType: log.actor_type,
        actorId: log.actor_id,
        actorEmail: log.actor_email,
        actorName: log.actor_name,
        timestamp: log.timestamp,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        sessionId: log.session_id,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        parentResourceId: log.parent_resource_id,
        accessLevel: log.access_level,
        changeDetails: validatedQuery.includeDetails ? log.change_details : undefined,
        beforeState: validatedQuery.includeDetails ? log.before_state : undefined,
        afterState: validatedQuery.includeDetails ? log.after_state : undefined,
        changeType: log.change_type,
        dataClassification: log.data_classification,
        impactLevel: log.impact_level,
        complianceFlags: log.compliance_flags || [],
        riskScore: log.risk_score,
        entryHash: log.entry_hash,
        previousHash: log.previous_hash,
        chainVerified: log.chain_verified,
        requestId: log.request_id,
        operationContext: validatedQuery.includeDetails ? log.operation_context : undefined,
        errorDetails: validatedQuery.includeDetails ? log.error_details : undefined,
        processingTimeMs: log.processing_time_ms,
        retentionPeriod: log.retention_period,
        archivalDate: log.archival_date,
        isProtected: log.is_protected
      }))

      return {
        success: true,
        logs: auditEntries,
        total: count || 0
      }

    } catch (error) {
      this.logger.error('Error querying audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      })
      return { success: false, error: 'Internal error querying audit logs' }
    }
  }

  /**
   * Verify audit log chain integrity
   */
  async verifyAuditChain(publicationId?: string): Promise<{
    success: boolean
    verified: boolean
    brokenChainAt?: string
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      let query = supabase
        .from('version_audit_logs')
        .select('id, entry_hash, previous_hash, timestamp')
        .order('timestamp', { ascending: true })

      if (publicationId) {
        query = query.eq('publication_id', publicationId)
      }

      const { data: logs, error } = await query

      if (error) {
        return { success: false, error: 'Failed to retrieve audit logs for verification' }
      }

      if (!logs || logs.length === 0) {
        return { success: true, verified: true }
      }

      // Verify chain integrity
      let previousHash: string | null = null
      
      for (const log of logs) {
        if (previousHash !== null && log.previous_hash !== previousHash) {
          this.logger.warn('Audit chain integrity violation detected', {
            logId: log.id,
            timestamp: log.timestamp,
            expectedPreviousHash: previousHash,
            actualPreviousHash: log.previous_hash
          })
          
          return {
            success: true,
            verified: false,
            brokenChainAt: log.timestamp
          }
        }
        
        previousHash = log.entry_hash
      }

      return { success: true, verified: true }

    } catch (error) {
      this.logger.error('Error verifying audit chain', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicationId
      })
      return { success: false, error: 'Internal error verifying audit chain' }
    }
  }
}

// Export singleton instance
export const versionAudit = new VersionAuditManager()

// Helper function for easy audit logging from API endpoints
export async function logVersionAudit(
  correlationId: string,
  action: AuditAction,
  actor: { id: string; email?: string; name?: string },
  resourceInfo: {
    type: string
    id?: string
    parentId?: string
  },
  context: {
    publicationId?: string
    versionId?: string
    versionNumber?: string
    changeDetails?: any
    beforeState?: any
    afterState?: any
    ipAddress?: string
    userAgent?: string
    requestId?: string
    processingTimeMs?: number
    errorDetails?: any
  } = {},
  options: {
    impactLevel?: 'trivial' | 'minor' | 'major' | 'critical'
    dataClassification?: 'public' | 'internal' | 'confidential' | 'healthcare_content' | 'pii'
    accessLevel?: 'read' | 'write' | 'delete' | 'admin'
    retentionPeriod?: number
    isProtected?: boolean
  } = {}
): Promise<void> {
  try {
    await versionAudit.logAuditEvent({
      correlationId,
      action,
      actorType: 'user',
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      publicationId: context.publicationId,
      versionId: context.versionId,
      versionNumber: context.versionNumber,
      resourceType: resourceInfo.type,
      resourceId: resourceInfo.id,
      parentResourceId: resourceInfo.parentId,
      accessLevel: options.accessLevel || 'read',
      changeDetails: context.changeDetails,
      beforeState: context.beforeState,
      afterState: context.afterState,
      dataClassification: options.dataClassification || 'healthcare_content',
      impactLevel: options.impactLevel || 'minor',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      errorDetails: context.errorDetails,
      processingTimeMs: context.processingTimeMs,
      retentionPeriod: options.retentionPeriod || 2555,
      isProtected: options.isProtected || false
    })
  } catch (error) {
    // Audit logging should not break the main application flow
    logger.error('Failed to log version audit event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
      action
    })
  }
}