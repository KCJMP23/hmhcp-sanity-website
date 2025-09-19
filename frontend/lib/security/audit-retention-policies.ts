/**
 * HIPAA-Compliant Audit Log Retention Policies
 * Implements automated retention management with healthcare regulatory compliance
 * 
 * HIPAA Requirements:
 * - Minimum 7-year retention for healthcare audit logs
 * - Legal hold capabilities for ongoing litigation
 * - Secure deletion after retention period
 * - Audit trail of retention actions
 * 
 * Story 1.6 Task 3: Healthcare Compliance Audit Logging
 */

import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import { HIPAAAuditLogger, AuditEventType, AuditSeverity, ComplianceFramework } from './audit-logging'

// HIPAA minimum retention period (7 years in days)
const HIPAA_MIN_RETENTION_DAYS = 7 * 365 // 2555 days

export interface RetentionPolicy {
  id: string
  name: string
  description: string
  retention_period_days: number
  applies_to_event_types: string[] // AuditEventType values
  applies_to_severity: string[] // AuditSeverity values
  requires_legal_hold: boolean
  auto_delete_enabled: boolean
  compliance_frameworks: ComplianceFramework[]
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface LegalHold {
  id: string
  case_number: string
  description: string
  initiated_by: string
  start_date: string
  end_date: string | null
  affected_audit_ids: string[]
  status: 'active' | 'released' | 'expired'
  created_at: string
  updated_at: string
}

export interface RetentionAction {
  id: string
  action_type: 'delete' | 'archive' | 'legal_hold_apply' | 'legal_hold_release'
  audit_log_id: string
  policy_id: string
  executed_at: string
  executed_by: string
  result: 'success' | 'failed' | 'skipped'
  reason: string
  error_details?: string
}

export class AuditRetentionManager {
  private supabase = createClient()
  private auditLogger = new HIPAAAuditLogger()

  /**
   * Initialize default HIPAA-compliant retention policies
   */
  async initializeDefaultPolicies(): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultPolicies: Omit<RetentionPolicy, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          name: 'HIPAA Standard Retention',
          description: 'HIPAA-compliant 7-year retention for all healthcare audit logs',
          retention_period_days: HIPAA_MIN_RETENTION_DAYS,
          applies_to_event_types: [], // Empty means applies to all
          applies_to_severity: [], // Empty means applies to all
          requires_legal_hold: false,
          auto_delete_enabled: true,
          compliance_frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.HITECH],
          is_active: true
        },
        {
          name: 'PHI Access Extended Retention',
          description: 'Extended 10-year retention for PHI access logs',
          retention_period_days: 10 * 365, // 10 years
          applies_to_event_types: [
            AuditEventType.PHI_ACCESS,
            AuditEventType.PHI_EXPORT,
            AuditEventType.PATIENT_LOOKUP,
            AuditEventType.HEALTHCARE_DATA_ACCESS
          ],
          applies_to_severity: [],
          requires_legal_hold: true,
          auto_delete_enabled: false, // Manual review required
          compliance_frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.HITECH],
          is_active: true
        },
        {
          name: 'Security Incident Long-term',
          description: 'Long-term retention for security incidents and breaches',
          retention_period_days: 15 * 365, // 15 years
          applies_to_event_types: [
            AuditEventType.SECURITY_BREACH,
            AuditEventType.UNAUTHORIZED_ACCESS,
            AuditEventType.SUSPICIOUS_ACTIVITY
          ],
          applies_to_severity: [AuditSeverity.CRITICAL, AuditSeverity.HIGH],
          requires_legal_hold: true,
          auto_delete_enabled: false,
          compliance_frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.SOC2],
          is_active: true
        },
        {
          name: 'Administrative Standard',
          description: 'Standard retention for administrative actions',
          retention_period_days: HIPAA_MIN_RETENTION_DAYS,
          applies_to_event_types: [
            AuditEventType.USER_ROLE_ASSIGNED,
            AuditEventType.USER_ROLE_REVOKED,
            AuditEventType.CONFIG_UPDATED,
            AuditEventType.SYSTEM_BACKUP
          ],
          applies_to_severity: [],
          requires_legal_hold: false,
          auto_delete_enabled: true,
          compliance_frameworks: [ComplianceFramework.HIPAA],
          is_active: true
        }
      ]

      // Insert policies if they don't exist
      for (const policy of defaultPolicies) {
        const { data: existing } = await this.supabase
          .from('audit_retention_policies')
          .select('id')
          .eq('name', policy.name)
          .single()

        if (!existing) {
          const { error } = await this.supabase
            .from('audit_retention_policies')
            .insert(policy)

          if (error) {
            throw new Error(`Failed to create policy ${policy.name}: ${error.message}`)
          }
        }
      }

      logger.info('Default audit retention policies initialized successfully')
      return { success: true }
    } catch (error) {
      logger.error('Failed to initialize default retention policies:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Apply retention policies to audit logs
   */
  async applyRetentionPolicies(): Promise<{ success: boolean; processed: number; deleted: number; errors: string[] }> {
    try {
      logger.info('Starting audit log retention policy application')
      
      let totalProcessed = 0
      let totalDeleted = 0
      const errors: string[] = []

      // Get all active retention policies
      const { data: policies, error: policiesError } = await this.supabase
        .from('audit_retention_policies')
        .select('*')
        .eq('is_active', true)

      if (policiesError) {
        throw new Error(`Failed to fetch retention policies: ${policiesError.message}`)
      }

      if (!policies || policies.length === 0) {
        logger.warn('No active retention policies found')
        return { success: true, processed: 0, deleted: 0, errors: [] }
      }

      // Process each policy
      for (const policy of policies) {
        try {
          const result = await this.applySpecificPolicy(policy)
          totalProcessed += result.processed
          totalDeleted += result.deleted
          if (result.errors.length > 0) {
            errors.push(...result.errors)
          }
        } catch (error) {
          const errorMsg = `Failed to apply policy ${policy.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          logger.error(errorMsg)
        }
      }

      // Log retention policy application
      await this.auditLogger.logEvent({
        event_type: AuditEventType.SYSTEM_MAINTENANCE,
        severity: AuditSeverity.INFO,
        user_id: null, // System action
        session_id: null,
        description: `Audit retention policies applied: ${totalProcessed} processed, ${totalDeleted} deleted`,
        metadata: {
          processed_count: totalProcessed,
          deleted_count: totalDeleted,
          error_count: errors.length
        },
        resource_type: 'audit_logs',
        action_performed: 'retention_policy_application',
        compliance_frameworks: [ComplianceFramework.HIPAA]
      })

      logger.info(`Retention policy application completed: ${totalProcessed} processed, ${totalDeleted} deleted, ${errors.length} errors`)

      return {
        success: errors.length === 0,
        processed: totalProcessed,
        deleted: totalDeleted,
        errors
      }
    } catch (error) {
      logger.error('Failed to apply retention policies:', error)
      return {
        success: false,
        processed: 0,
        deleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Apply a specific retention policy
   */
  private async applySpecificPolicy(policy: RetentionPolicy): Promise<{ processed: number; deleted: number; errors: string[] }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_period_days)

    let processed = 0
    let deleted = 0
    const errors: string[] = []

    try {
      // Build query for logs that match this policy and are past retention
      let query = this.supabase
        .from('audit_logs')
        .select('id, event_type, severity, created_at, patient_identifier')
        .lt('created_at', cutoffDate.toISOString())

      // Apply event type filters if specified
      if (policy.applies_to_event_types.length > 0) {
        query = query.in('event_type', policy.applies_to_event_types)
      }

      // Apply severity filters if specified
      if (policy.applies_to_severity.length > 0) {
        query = query.in('severity', policy.applies_to_severity)
      }

      const { data: expiredLogs, error: queryError } = await query

      if (queryError) {
        throw new Error(`Query failed: ${queryError.message}`)
      }

      if (!expiredLogs || expiredLogs.length === 0) {
        return { processed: 0, deleted: 0, errors: [] }
      }

      // Check for legal holds that would prevent deletion
      const { data: activeLegalHolds, error: holdError } = await this.supabase
        .from('audit_legal_holds')
        .select('affected_audit_ids')
        .eq('status', 'active')

      if (holdError) {
        throw new Error(`Failed to check legal holds: ${holdError.message}`)
      }

      const protectedIds = new Set<string>()
      if (activeLegalHolds) {
        activeLegalHolds.forEach(hold => {
          hold.affected_audit_ids?.forEach((id: string) => protectedIds.add(id))
        })
      }

      // Process each expired log
      for (const log of expiredLogs) {
        processed++

        try {
          // Skip if under legal hold
          if (protectedIds.has(log.id)) {
            await this.recordRetentionAction({
              action_type: 'delete',
              audit_log_id: log.id,
              policy_id: policy.id,
              executed_by: 'system',
              result: 'skipped',
              reason: 'Legal hold prevents deletion'
            })
            continue
          }

          // Skip auto-deletion if policy doesn't allow it
          if (!policy.auto_delete_enabled) {
            await this.recordRetentionAction({
              action_type: 'delete',
              audit_log_id: log.id,
              policy_id: policy.id,
              executed_by: 'system',
              result: 'skipped',
              reason: 'Auto-deletion disabled - manual review required'
            })
            continue
          }

          // Delete the log
          const { error: deleteError } = await this.supabase
            .from('audit_logs')
            .delete()
            .eq('id', log.id)

          if (deleteError) {
            throw new Error(`Failed to delete log ${log.id}: ${deleteError.message}`)
          }

          deleted++

          // Record successful deletion
          await this.recordRetentionAction({
            action_type: 'delete',
            audit_log_id: log.id,
            policy_id: policy.id,
            executed_by: 'system',
            result: 'success',
            reason: `Retention period expired (${policy.retention_period_days} days)`
          })

        } catch (error) {
          const errorMsg = `Failed to process log ${log.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          
          // Record failed action
          await this.recordRetentionAction({
            action_type: 'delete',
            audit_log_id: log.id,
            policy_id: policy.id,
            executed_by: 'system',
            result: 'failed',
            reason: 'Deletion failed',
            error_details: errorMsg
          })
        }
      }

      return { processed, deleted, errors }
    } catch (error) {
      const errorMsg = `Policy ${policy.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      return { processed, deleted, errors }
    }
  }

  /**
   * Create a legal hold to prevent deletion of audit logs
   */
  async createLegalHold(hold: Omit<LegalHold, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; hold_id?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('audit_legal_holds')
        .insert(hold)
        .select('id')
        .single()

      if (error) {
        throw new Error(`Failed to create legal hold: ${error.message}`)
      }

      // Log the legal hold creation
      await this.auditLogger.logEvent({
        event_type: AuditEventType.LEGAL_HOLD_APPLIED,
        severity: AuditSeverity.HIGH,
        user_id: hold.initiated_by,
        session_id: null,
        description: `Legal hold created for case ${hold.case_number}`,
        metadata: {
          case_number: hold.case_number,
          affected_logs_count: hold.affected_audit_ids.length,
          hold_id: data.id
        },
        resource_type: 'audit_logs',
        action_performed: 'legal_hold_creation',
        compliance_frameworks: [ComplianceFramework.HIPAA]
      })

      logger.info(`Legal hold created successfully: ${data.id}`)
      return { success: true, hold_id: data.id }
    } catch (error) {
      logger.error('Failed to create legal hold:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Release a legal hold
   */
  async releaseLegalHold(holdId: string, releasedBy: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get hold details
      const { data: hold, error: fetchError } = await this.supabase
        .from('audit_legal_holds')
        .select('*')
        .eq('id', holdId)
        .single()

      if (fetchError || !hold) {
        throw new Error('Legal hold not found')
      }

      // Update hold status
      const { error: updateError } = await this.supabase
        .from('audit_legal_holds')
        .update({
          status: 'released',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', holdId)

      if (updateError) {
        throw new Error(`Failed to release legal hold: ${updateError.message}`)
      }

      // Log the legal hold release
      await this.auditLogger.logEvent({
        event_type: AuditEventType.LEGAL_HOLD_RELEASED,
        severity: AuditSeverity.MEDIUM,
        user_id: releasedBy,
        session_id: null,
        description: `Legal hold released for case ${hold.case_number}: ${reason}`,
        metadata: {
          case_number: hold.case_number,
          hold_id: holdId,
          release_reason: reason,
          affected_logs_count: hold.affected_audit_ids.length
        },
        resource_type: 'audit_logs',
        action_performed: 'legal_hold_release',
        compliance_frameworks: [ComplianceFramework.HIPAA]
      })

      logger.info(`Legal hold released successfully: ${holdId}`)
      return { success: true }
    } catch (error) {
      logger.error('Failed to release legal hold:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get retention statistics
   */
  async getRetentionStatistics(): Promise<{
    success: boolean
    statistics?: {
      total_audit_logs: number
      logs_due_for_deletion: number
      logs_under_legal_hold: number
      active_legal_holds: number
      retention_policies: number
      oldest_log_date: string | null
      storage_usage_mb: number
    }
    error?: string
  }> {
    try {
      // Get total audit log count
      const { count: totalLogs, error: countError } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw new Error(`Failed to count audit logs: ${countError.message}`)
      }

      // Get logs due for deletion (based on default HIPAA policy)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - HIPAA_MIN_RETENTION_DAYS)

      const { count: dueForDeletion, error: dueError } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString())

      if (dueError) {
        throw new Error(`Failed to count logs due for deletion: ${dueError.message}`)
      }

      // Get logs under legal hold
      const { data: legalHolds, error: holdError } = await this.supabase
        .from('audit_legal_holds')
        .select('affected_audit_ids')
        .eq('status', 'active')

      if (holdError) {
        throw new Error(`Failed to fetch legal holds: ${holdError.message}`)
      }

      const logsUnderHold = new Set<string>()
      legalHolds?.forEach(hold => {
        hold.affected_audit_ids?.forEach((id: string) => logsUnderHold.add(id))
      })

      // Get active legal holds count
      const { count: activeLegalHolds, error: holdCountError } = await this.supabase
        .from('audit_legal_holds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (holdCountError) {
        throw new Error(`Failed to count legal holds: ${holdCountError.message}`)
      }

      // Get retention policies count
      const { count: retentionPolicies, error: policyError } = await this.supabase
        .from('audit_retention_policies')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (policyError) {
        throw new Error(`Failed to count retention policies: ${policyError.message}`)
      }

      // Get oldest log date
      const { data: oldestLog, error: oldestError } = await this.supabase
        .from('audit_logs')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)

      if (oldestError) {
        throw new Error(`Failed to find oldest log: ${oldestError.message}`)
      }

      // Estimate storage usage (rough calculation based on average log size)
      const averageLogSizeKB = 2 // Rough estimate
      const storageUsageMB = ((totalLogs || 0) * averageLogSizeKB) / 1024

      return {
        success: true,
        statistics: {
          total_audit_logs: totalLogs || 0,
          logs_due_for_deletion: dueForDeletion || 0,
          logs_under_legal_hold: logsUnderHold.size,
          active_legal_holds: activeLegalHolds || 0,
          retention_policies: retentionPolicies || 0,
          oldest_log_date: oldestLog?.[0]?.created_at || null,
          storage_usage_mb: Math.round(storageUsageMB * 100) / 100
        }
      }
    } catch (error) {
      logger.error('Failed to get retention statistics:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Record a retention action for audit purposes
   */
  private async recordRetentionAction(action: Omit<RetentionAction, 'id' | 'executed_at'>): Promise<void> {
    try {
      await this.supabase
        .from('audit_retention_actions')
        .insert({
          ...action,
          executed_at: new Date().toISOString()
        })
    } catch (error) {
      logger.error('Failed to record retention action:', error)
      // Don't throw here as this is auxiliary logging
    }
  }
}

// Singleton instance for application-wide use
export const auditRetentionManager = new AuditRetentionManager()