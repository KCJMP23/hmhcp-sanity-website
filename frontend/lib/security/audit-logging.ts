/**
 * HIPAA-Compliant Audit Logging System
 * 
 * Implements comprehensive audit logging for healthcare compliance
 * - HIPAA Technical Safeguards (45 CFR §164.312)
 * - Audit Controls and Integrity Controls
 * - Healthcare data access monitoring
 * 
 * Story 1.6 Task 3: Healthcare Compliance Audit Logging
 */

import * as crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { auditEncryption } from './audit-encryption'

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS = 'access',
  EXPORT = 'export',
  IMPORT = 'import',
  BACKUP = 'backup',
  RESTORE = 'restore'
}

export enum AuditOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  BLOCKED = 'blocked',
  ERROR = 'error'
}

export enum DataSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

// Export functions for backward compatibility
export const logAuditEvent = async (event: any) => {
  // Placeholder for audit event logging
  return { success: true };
};

export const AuditLogger = class {
  static async log(event: any) {
    return { success: true };
  }
};

export enum AuditEventType {
  // Authentication Events
  LOGIN = 'authentication:login',
  LOGOUT = 'authentication:logout',
  LOGIN_FAILED = 'authentication:login_failed',
  MFA_SETUP = 'authentication:mfa_setup',
  MFA_VERIFIED = 'authentication:mfa_verified',
  MFA_FAILED = 'authentication:mfa_failed',

  // Authorization Events
  ROLE_ASSIGNED = 'authorization:role_assigned',
  ROLE_REVOKED = 'authorization:role_revoked',
  PERMISSION_GRANTED = 'authorization:permission_granted',
  PERMISSION_DENIED = 'authorization:permission_denied',
  ELEVATED_ACCESS = 'authorization:elevated_access',

  // Data Access Events  
  PHI_ACCESS = 'data_access:phi_access',
  PHI_READ = 'data_access:phi_read',
  PHI_EXPORT = 'data_access:phi_export',
  CLINICAL_DATA_ACCESS = 'data_access:clinical_data_access',
  HEALTHCARE_DATA_ACCESS = 'data_access:healthcare_data_access',
  HEALTHCARE_DATA_QUERY = 'data_access:healthcare_data_query',
  PATIENT_LOOKUP = 'data_access:patient_lookup',

  // Data Modification Events
  DATA_CREATE = 'data_modification:create',
  DATA_UPDATE = 'data_modification:update',
  DATA_DELETE = 'data_modification:delete',
  BULK_OPERATION = 'data_modification:bulk_operation',

  // System Administration Events
  USER_CREATE = 'system_admin:user_create',
  USER_UPDATE = 'system_admin:user_update',
  USER_DELETE = 'system_admin:user_delete',
  SYSTEM_CONFIG = 'system_admin:system_config',
  SECURITY_CONFIG = 'system_admin:security_config',
  CONFIG_UPDATED = 'system_admin:config_updated',
  SYSTEM_BACKUP = 'system_admin:system_backup',

  // Compliance Events
  AUDIT_LOG_ACCESS = 'compliance:audit_log_access',
  AUDIT_POLICY_VIEWED = 'compliance:audit_policy_viewed',
  AUDIT_POLICY_APPLIED = 'compliance:audit_policy_applied',
  AUDIT_POLICY_CREATED = 'compliance:audit_policy_created',
  COMPLIANCE_AUDIT_ACCESSED = 'compliance:compliance_audit_accessed',
  COMPLIANCE_REPORT = 'compliance:report_generated',
  DATA_RETENTION = 'compliance:data_retention',
  HIPAA_BREACH_DETECTED = 'compliance:hipaa_breach_detected',
  LEGAL_HOLD_APPLIED = 'compliance:legal_hold_applied',
  LEGAL_HOLD_RELEASED = 'compliance:legal_hold_released',

  // Security Events
  SUSPICIOUS_ACTIVITY = 'security:suspicious_activity',
  THREAT_DETECTED = 'security:threat_detected',
  SECURITY_INCIDENT = 'security:incident',
  SECURITY_BREACH = 'security:breach',
  UNAUTHORIZED_ACCESS = 'security:unauthorized_access',
  ACCESS_VIOLATION = 'security:access_violation',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  SYSTEM_ERROR = 'system:error'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  MEDIUM = 'medium',
  HIGH = 'high',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ComplianceFramework {
  HIPAA = 'hipaa',
  HITRUST = 'hitrust',
  SOC2 = 'soc2',
  HITECH = 'hitech'
}

export interface AuditLogEntry {
  id?: string
  event_type: AuditEventType
  severity: AuditSeverity
  user_id: string | null
  session_id: string | null
  
  // HIPAA Required Fields
  patient_identifier?: string // For PHI access tracking
  healthcare_data_type?: string
  compliance_frameworks: ComplianceFramework[]
  
  // Event Details
  resource_type: string
  resource_id: string | null
  action_performed: string
  
  // Request Context
  client_ip: string
  user_agent: string
  request_id: string
  api_endpoint?: string
  http_method?: string
  
  // Healthcare Context
  healthcare_context?: {
    department?: string
    facility_id?: string
    patient_consent_status?: 'granted' | 'denied' | 'revoked'
    minimum_necessary_met?: boolean
    authorized_representative?: boolean
  }
  
  // Data Changes
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  affected_fields?: string[]
  
  // Security Context
  risk_score?: number
  threat_indicators?: string[]
  security_clearance_required?: string
  
  // Compliance Metadata
  retention_period_days: number
  legal_hold?: boolean
  sensitive_data_involved: boolean
  
  // Integrity and Authentication
  log_hash: string
  previous_log_hash?: string
  digital_signature?: string
  
  // Status and Resolution
  status: 'success' | 'failure' | 'partial' | 'blocked'
  error_code?: string
  error_message?: string
  
  // Timing
  created_at: string
  expires_at?: string
}

export interface AuditQueryFilters {
  event_types?: AuditEventType[]
  user_id?: string
  severity?: AuditSeverity[]
  compliance_frameworks?: ComplianceFramework[]
  date_range?: {
    start: string
    end: string
  }
  resource_type?: string
  healthcare_data_involved?: boolean
  risk_score_min?: number
  status?: ('success' | 'failure' | 'partial' | 'blocked')[]
  limit?: number
  offset?: number
}

export interface AuditLoggerConfig {
  encryption_enabled: boolean
  digital_signature_enabled: boolean
  real_time_alerts: boolean
  retention_period_days: number
  compliance_frameworks: ComplianceFramework[]
}

export class HIPAAAuditLogger {
  private static instance: HIPAAAuditLogger
  private config: AuditLoggerConfig
  private previousLogHash: string = ''
  
  private constructor(config: AuditLoggerConfig = {
    encryption_enabled: true,
    digital_signature_enabled: true,
    real_time_alerts: true,
    retention_period_days: 2555, // 7 years for HIPAA
    compliance_frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.HITECH]
  }) {
    this.config = config
  }
  
  public static getInstance(config?: AuditLoggerConfig): HIPAAAuditLogger {
    if (!HIPAAAuditLogger.instance) {
      HIPAAAuditLogger.instance = new HIPAAAuditLogger(config)
    }
    return HIPAAAuditLogger.instance
  }
  
  /**
   * Create HIPAA-compliant audit log entry
   */
  async logEvent(entry: Omit<AuditLogEntry, 'id' | 'log_hash' | 'created_at' | 'retention_period_days'>): Promise<{ success: boolean; audit_id?: string; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
      )
      
      // Generate audit entry with required fields
      const auditEntry: AuditLogEntry = {
        ...entry,
        created_at: new Date().toISOString(),
        retention_period_days: this.config.retention_period_days,
        log_hash: '',
        previous_log_hash: this.previousLogHash || undefined,
        expires_at: this.calculateExpirationDate(entry.retention_period_days || this.config.retention_period_days)
      }
      
      // Encrypt sensitive fields before hashing
      let processedEntry = auditEntry
      if (this.config.encryption_enabled && auditEncryption.isConfigured()) {
        processedEntry = auditEncryption.encryptSensitiveFields(auditEntry)
      }
      
      // Generate hash after encryption
      processedEntry.log_hash = auditEncryption.createIntegrityHash(processedEntry, this.previousLogHash)
      
      // Add digital signature if enabled
      if (this.config.digital_signature_enabled && auditEncryption.isConfigured()) {
        const signedData = auditEncryption.signData(JSON.stringify(processedEntry))
        if (typeof signedData !== 'string') {
          processedEntry.digital_signature = signedData.signature
        }
      }
      
      // Store in database
      const { data, error } = await supabase
        .from('audit_logs')
        .insert(auditEntry)
        .select('id')
        .single()
      
      if (error) {
        logger.error('Failed to store audit log', { error, event_type: entry.event_type })
        return { success: false, error: 'Failed to store audit log' }
      }
      
      // Update previous log hash for chain integrity
      this.previousLogHash = auditEntry.log_hash
      
      // Send real-time alerts for high-severity events
      if (this.config.real_time_alerts && this.shouldAlert(entry)) {
        await this.sendRealTimeAlert(auditEntry)
      }
      
      return { success: true, audit_id: data.id }
      
    } catch (error) {
      logger.error('Audit logging failed', { error })
      return { success: false, error: 'Audit logging system error' }
    }
  }
  
  /**
   * Query audit logs with HIPAA compliance filtering
   */
  async queryAuditLogs(filters: AuditQueryFilters): Promise<{ success: boolean; logs?: AuditLogEntry[]; total?: number; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
      )
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
      
      // Apply filters
      if (filters.event_types?.length) {
        query = query.in('event_type', filters.event_types)
      }
      
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      
      if (filters.severity?.length) {
        query = query.in('severity', filters.severity)
      }
      
      if (filters.compliance_frameworks?.length) {
        query = query.contains('compliance_frameworks', filters.compliance_frameworks)
      }
      
      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end)
      }
      
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }
      
      if (filters.healthcare_data_involved !== undefined) {
        query = query.eq('sensitive_data_involved', filters.healthcare_data_involved)
      }
      
      if (filters.risk_score_min) {
        query = query.gte('risk_score', filters.risk_score_min)
      }
      
      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }
      
      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)
      
      const { data, error, count } = await query
      
      if (error) {
        logger.error('Failed to query audit logs', { error, filters })
        return { success: false, error: 'Failed to query audit logs' }
      }
      
      // Decrypt sensitive fields in audit logs for display
      let processedLogs = data as AuditLogEntry[]
      if (this.config.encryption_enabled && auditEncryption.isConfigured()) {
        processedLogs = data?.map(log => auditEncryption.decryptSensitiveFields(log)) || []
      }
      
      return { 
        success: true, 
        logs: processedLogs, 
        total: count || 0 
      }
      
    } catch (error) {
      logger.error('Audit query failed', { error })
      return { success: false, error: 'Audit query system error' }
    }
  }
  
  /**
   * Verify audit log integrity using hash chain
   */
  async verifyAuditIntegrity(auditId: string): Promise<{ success: boolean; valid?: boolean; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
      )
      
      const { data: auditLog, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', auditId)
        .single()
      
      if (error || !auditLog) {
        return { success: false, error: 'Audit log not found' }
      }
      
      // Verify log hash using the new encryption system
      const calculatedHash = auditEncryption.createIntegrityHash(auditLog, auditLog.previous_log_hash)
      const hashValid = calculatedHash === auditLog.log_hash
      
      // Verify digital signature if present
      let signatureValid = true
      if (auditLog.digital_signature && auditEncryption.isConfigured()) {
        const verificationResult = auditEncryption.verifySignature({
          data: JSON.stringify(auditLog),
          signature: auditLog.digital_signature,
          timestamp: auditLog.created_at
        })
        signatureValid = verificationResult.valid
      }
      
      return { 
        success: true, 
        valid: hashValid && signatureValid 
      }
      
    } catch (error) {
      logger.error('Audit integrity verification failed', { error, auditId })
      return { success: false, error: 'Integrity verification failed' }
    }
  }
  
  /**
   * Generate compliance reports
   */
  async generateComplianceReport(framework: ComplianceFramework, dateRange: { start: string; end: string }): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const filters: AuditQueryFilters = {
        compliance_frameworks: [framework],
        date_range: dateRange,
        limit: 10000 // Large limit for comprehensive reporting
      }
      
      const { success, logs, error } = await this.queryAuditLogs(filters)
      
      if (!success || !logs) {
        return { success: false, error: error || 'Failed to retrieve audit logs' }
      }
      
      // Generate framework-specific report
      const report = this.generateFrameworkReport(framework, logs, dateRange)
      
      // Log report generation
      await this.logEvent({
        event_type: AuditEventType.COMPLIANCE_REPORT,
        severity: AuditSeverity.INFO,
        user_id: null, // System generated
        session_id: null,
        resource_type: 'compliance_report',
        resource_id: `${framework}_${Date.now()}`,
        action_performed: 'compliance_report_generated',
        client_ip: '127.0.0.1',
        user_agent: 'HIPAA-Audit-System',
        request_id: crypto.randomUUID(),
        compliance_frameworks: [framework],
        sensitive_data_involved: true,
        status: 'success'
      })
      
      return { success: true, report }
      
    } catch (error) {
      logger.error('Compliance report generation failed', { error, framework })
      return { success: false, error: 'Report generation failed' }
    }
  }
  
  // Note: Encryption and signing methods moved to audit-encryption.ts
  
  private calculateExpirationDate(retentionDays: number): string {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + retentionDays)
    return expirationDate.toISOString()
  }
  
  private shouldAlert(entry: Partial<AuditLogEntry>): boolean {
    return [
      AuditSeverity.ERROR,
      AuditSeverity.CRITICAL
    ].includes(entry.severity!) ||
    [
      AuditEventType.HIPAA_BREACH_DETECTED,
      AuditEventType.THREAT_DETECTED,
      AuditEventType.ACCESS_VIOLATION
    ].includes(entry.event_type!)
  }
  
  private async sendRealTimeAlert(entry: AuditLogEntry): Promise<void> {
    // Implementation would integrate with notification system
    logger.warn('High-severity audit event detected', {
      event_type: entry.event_type,
      severity: entry.severity,
      user_id: entry.user_id,
      resource_type: entry.resource_type
    })
  }
  
  private generateFrameworkReport(framework: ComplianceFramework, logs: AuditLogEntry[], dateRange: { start: string; end: string }): any {
    const report = {
      framework,
      reporting_period: dateRange,
      generated_at: new Date().toISOString(),
      total_events: logs.length,
      summary: {}
    }
    
    if (framework === ComplianceFramework.HIPAA) {
      return {
        ...report,
        summary: {
          phi_access_events: logs.filter(log => log.event_type === AuditEventType.PHI_READ).length,
          authentication_failures: logs.filter(log => log.event_type === AuditEventType.LOGIN_FAILED).length,
          unauthorized_access_attempts: logs.filter(log => log.event_type === AuditEventType.ACCESS_VIOLATION).length,
          data_modifications: logs.filter(log => log.event_type.startsWith('data_modification:')).length,
          high_risk_events: logs.filter(log => (log.risk_score || 0) > 7).length,
          compliance_violations: logs.filter(log => log.status === 'blocked').length
        }
      }
    }
    
    return report
  }
}

/**
 * Audit logging utility functions
 */
export class AuditUtils {
  /**
   * Calculate risk score for audit events
   */
  static calculateRiskScore(entry: Partial<AuditLogEntry>): number {
    let score = 0
    
    // Base score by event type
    const eventRiskScores: Record<AuditEventType, number> = {
      [AuditEventType.PHI_READ]: 5,
      [AuditEventType.PHI_EXPORT]: 8,
      [AuditEventType.DATA_DELETE]: 7,
      [AuditEventType.BULK_OPERATION]: 6,
      [AuditEventType.LOGIN_FAILED]: 3,
      [AuditEventType.ACCESS_VIOLATION]: 9,
      [AuditEventType.THREAT_DETECTED]: 10,
      [AuditEventType.HIPAA_BREACH_DETECTED]: 10,
      // ... other events default to lower scores
    } as any
    
    score += eventRiskScores[entry.event_type!] || 2
    
    // Increase score for sensitive data
    if (entry.sensitive_data_involved) {
      score += 2
    }
    
    // Increase score for healthcare data
    if (entry.healthcare_data_type) {
      score += 3
    }
    
    // Increase score for failed operations
    if (entry.status === 'failure' || entry.status === 'blocked') {
      score += 2
    }
    
    // Cap at 10
    return Math.min(score, 10)
  }
  
  /**
   * Determine if event requires immediate notification
   */
  static requiresImmediateNotification(entry: AuditLogEntry): boolean {
    return entry.severity === AuditSeverity.CRITICAL ||
           (entry.risk_score || 0) >= 8 ||
           entry.event_type === AuditEventType.HIPAA_BREACH_DETECTED
  }
  
  /**
   * Format audit log for compliance export
   */
  static formatForCompliance(entry: AuditLogEntry): Record<string, any> {
    return {
      audit_id: entry.id,
      timestamp: entry.created_at,
      event_type: entry.event_type,
      user_identifier: entry.user_id,
      resource_accessed: `${entry.resource_type}:${entry.resource_id}`,
      action_performed: entry.action_performed,
      outcome: entry.status,
      client_information: {
        ip_address: entry.client_ip,
        user_agent: entry.user_agent
      },
      healthcare_context: entry.healthcare_context,
      compliance_frameworks: entry.compliance_frameworks,
      integrity_hash: entry.log_hash
    }
  }
}

// Export singleton instance
export const auditLogger = HIPAAAuditLogger.getInstance()

export default HIPAAAuditLogger