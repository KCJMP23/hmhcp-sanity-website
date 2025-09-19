// Comprehensive Audit Logging System for Bulk Operations
import { createClient } from '@/lib/supabase/server'
import logger from '@/lib/logging/winston-logger'

export type AuditAction = 
  | 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'bulk_publish' | 'bulk_unpublish' 
  | 'bulk_archive' | 'bulk_restore' | 'bulk_duplicate' | 'bulk_move' | 'bulk_assign'
  | 'bulk_role_change' | 'bulk_activate' | 'bulk_deactivate'

export type ResourceType = 
  | 'posts' | 'pages' | 'users' | 'media' | 'comments' | 'tags' | 'categories' | 'settings'

export interface AuditLogEntry {
  id?: string
  user_id: string
  action: AuditAction
  resource_type: ResourceType
  resource_ids: string[]
  details: {
    operation_type: 'bulk_action' | 'bulk_update' | 'scheduled_bulk'
    batch_size: number
    duration_ms?: number
    success_count: number
    failure_count: number
    errors?: Array<{ id: string; error: string }>
    changes?: Record<string, any>
    ip_address?: string
    user_agent?: string
    session_id?: string
    job_id?: string
    transaction_id?: string
  }
  metadata?: {
    admin_notes?: string
    compliance_flags?: string[]
    risk_level?: 'low' | 'medium' | 'high' | 'critical'
    affected_user_count?: number
    data_sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted'
  }
  created_at?: string
  ip_address?: string
  user_agent?: string
}

export interface ComplianceReport {
  period: { start: string; end: string }
  summary: {
    total_operations: number
    successful_operations: number
    failed_operations: number
    users_involved: number
    resources_modified: number
    high_risk_operations: number
  }
  by_action: Record<AuditAction, number>
  by_resource_type: Record<ResourceType, number>
  by_user: Array<{ user_id: string; operation_count: number; success_rate: number }>
  security_incidents: Array<{
    type: string
    description: string
    timestamp: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

export class BulkAuditLogger {
  private logBuffer: AuditLogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly bufferSize = 100
  private readonly flushIntervalMs = 30000 // 30 seconds

  constructor() {
    this.startAutoFlush()
  }

  private async getSupabaseClient() {
    return await createClient()
  }

  /**
   * Log a bulk operation with comprehensive details
   */
  async logBulkOperation(entry: AuditLogEntry): Promise<void> {
    try {
      // Enrich entry with additional metadata
      const enrichedEntry: AuditLogEntry = {
        ...entry,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        metadata: {
          ...entry.metadata,
          risk_level: this.calculateRiskLevel(entry),
          affected_user_count: entry.resource_type === 'users' ? entry.resource_ids.length : undefined
        }
      }

      // Add to buffer
      this.logBuffer.push(enrichedEntry)

      // Immediate flush for high-risk operations
      if (enrichedEntry.metadata?.risk_level === 'critical' || this.logBuffer.length >= this.bufferSize) {
        await this.flush()
      }

      // Log to application logs as well
      logger.info('Bulk operation audited', {
        userId: entry.user_id,
        action: entry.action,
        resourceType: entry.resource_type,
        resourceCount: entry.resource_ids.length,
        successCount: entry.details.success_count,
        failureCount: entry.details.failure_count,
        riskLevel: enrichedEntry.metadata?.risk_level
      })

    } catch (error) {
      logger.error('Failed to log audit entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entry
      })
    }
  }

  /**
   * Log a security incident related to bulk operations
   */
  async logSecurityIncident(
    userId: string,
    incidentType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      await supabase
        .from('security_incidents')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          incident_type: incidentType,
          description,
          severity,
          metadata,
          created_at: new Date().toISOString()
        })

      logger.warn('Security incident logged', {
        userId,
        incidentType,
        severity,
        description
      })

    } catch (error) {
      logger.error('Failed to log security incident', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        incidentType
      })
    }
  }

  /**
   * Generate compliance report for a given period
   */
  async generateComplianceReport(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<ComplianceReport> {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: auditLogs } = await query

      if (!auditLogs) {
        throw new Error('Failed to fetch audit logs')
      }

      // Calculate summary statistics
      const summary = {
        total_operations: auditLogs.length,
        successful_operations: auditLogs.filter(log => log.details.failure_count === 0).length,
        failed_operations: auditLogs.filter(log => log.details.failure_count > 0).length,
        users_involved: new Set(auditLogs.map(log => log.user_id)).size,
        resources_modified: auditLogs.reduce((sum, log) => sum + log.resource_ids.length, 0),
        high_risk_operations: auditLogs.filter(log => 
          log.metadata?.risk_level === 'high' || log.metadata?.risk_level === 'critical'
        ).length
      }

      // Group by action
      const by_action = auditLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {} as Record<AuditAction, number>)

      // Group by resource type
      const by_resource_type = auditLogs.reduce((acc, log) => {
        acc[log.resource_type] = (acc[log.resource_type] || 0) + 1
        return acc
      }, {} as Record<ResourceType, number>)

      // Group by user
      const userStats = auditLogs.reduce((acc, log) => {
        if (!acc[log.user_id]) {
          acc[log.user_id] = { total: 0, successful: 0 }
        }
        acc[log.user_id].total++
        if (log.details.failure_count === 0) {
          acc[log.user_id].successful++
        }
        return acc
      }, {} as Record<string, { total: number; successful: number }>)

      const by_user = Object.entries(userStats).map(([user_id, stats]) => {
        const typedStats = stats as { total: number; successful: number }
        return {
          user_id,
          operation_count: typedStats.total,
          success_rate: typedStats.total > 0 ? (typedStats.successful / typedStats.total) * 100 : 0
        }
      })

      // Get security incidents
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      const security_incidents = (incidents || []).map(incident => ({
        type: incident.incident_type,
        description: incident.description,
        timestamp: incident.created_at,
        severity: incident.severity
      }))

      return {
        period: { start: startDate, end: endDate },
        summary,
        by_action,
        by_resource_type,
        by_user,
        security_incidents
      }

    } catch (error) {
      logger.error('Failed to generate compliance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate
      })
      
      throw error
    }
  }

  /**
   * Search audit logs with filters
   */
  async searchAuditLogs(filters: {
    user_id?: string
    action?: AuditAction
    resource_type?: ResourceType
    start_date?: string
    end_date?: string
    risk_level?: 'low' | 'medium' | 'high' | 'critical'
    limit?: number
    offset?: number
  }): Promise<{
    logs: AuditLogEntry[]
    total: number
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.user_id) query = query.eq('user_id', filters.user_id)
      if (filters.action) query = query.eq('action', filters.action)
      if (filters.resource_type) query = query.eq('resource_type', filters.resource_type)
      if (filters.start_date) query = query.gte('created_at', filters.start_date)
      if (filters.end_date) query = query.lte('created_at', filters.end_date)
      if (filters.risk_level) query = query.eq('metadata->>risk_level', filters.risk_level)

      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset) + (filters.limit || 50) - 1)
      }

      const { data: logs, count, error } = await query

      if (error) {
        throw error
      }

      return {
        logs: logs || [],
        total: count || 0
      }

    } catch (error) {
      logger.error('Failed to search audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      })
      
      throw error
    }
  }

  /**
   * Clean up old audit logs (GDPR compliance)
   */
  async cleanupOldLogs(retentionDays = 2555): Promise<number> { // 7 years default
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        throw error
      }

      const deletedCount = Array.isArray(data) ? (data as any[]).length : 0
      
      logger.info('Cleaned up old audit logs', { 
        deletedCount, 
        cutoffDate: cutoffDate.toISOString() 
      })

      return deletedCount

    } catch (error) {
      logger.error('Failed to cleanup old audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return 0
    }
  }

  /**
   * Flush buffer to database
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const entriesToFlush = [...this.logBuffer]
    this.logBuffer = []

    try {
      const supabase = await this.getSupabaseClient()
      const { error } = await supabase
        .from('audit_logs')
        .insert(entriesToFlush)

      if (error) {
        throw error
      }

      logger.debug('Flushed audit log buffer', { count: entriesToFlush.length })

    } catch (error) {
      // Put entries back in buffer on failure
      this.logBuffer.unshift(...entriesToFlush)
      
      logger.error('Failed to flush audit log buffer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: entriesToFlush.length
      })
    }
  }

  /**
   * Calculate risk level based on operation characteristics
   */
  private calculateRiskLevel(entry: AuditLogEntry): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0

    // Action-based scoring
    if (['bulk_delete', 'bulk_deactivate'].includes(entry.action)) {
      score += 3
    } else if (['bulk_update', 'bulk_role_change'].includes(entry.action)) {
      score += 2
    } else {
      score += 1
    }

    // Resource type scoring
    if (['users', 'settings'].includes(entry.resource_type)) {
      score += 2
    } else if (['posts', 'pages'].includes(entry.resource_type)) {
      score += 1
    }

    // Volume scoring
    if (entry.resource_ids.length > 1000) {
      score += 3
    } else if (entry.resource_ids.length > 100) {
      score += 2
    } else if (entry.resource_ids.length > 10) {
      score += 1
    }

    // Failure rate scoring
    const failureRate = entry.details.failure_count / (entry.details.success_count + entry.details.failure_count)
    if (failureRate > 0.5) {
      score += 2
    } else if (failureRate > 0.2) {
      score += 1
    }

    // Return risk level
    if (score >= 8) return 'critical'
    if (score >= 6) return 'high'
    if (score >= 4) return 'medium'
    return 'low'
  }

  /**
   * Start automatic buffer flushing
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.flushIntervalMs)
  }

  /**
   * Stop automatic buffer flushing
   */
  public stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  /**
   * Ensure all buffered logs are flushed on shutdown
   */
  public async shutdown(): Promise<void> {
    this.stopAutoFlush()
    await this.flush()
  }
}

// Singleton instance
export const bulkAuditLogger = new BulkAuditLogger()

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await bulkAuditLogger.shutdown()
})

process.on('SIGINT', async () => {
  await bulkAuditLogger.shutdown()
})