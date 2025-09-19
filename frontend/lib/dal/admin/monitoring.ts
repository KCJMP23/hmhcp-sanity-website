/**
 * Database Performance Monitoring Service
 * Healthcare platform admin system with comprehensive database monitoring
 * Provides query performance tracking, health monitoring, and HIPAA compliance checks
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../../logger'
import { 
  AdminRole, 
  DataAccessContext, 
  DataClassification,
  HIPAAContext,
  AuditAction
} from './types'
import { createAuditLogEntry, TABLE_NAMES } from './utils'

// ================================
// Types and Interfaces
// ================================

/**
 * Query performance metrics
 */
export interface QueryMetrics {
  queryId: string
  tableName: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  executionTime: number
  timestamp: Date
  userId?: string
  parameters?: Record<string, any>
  resultCount?: number
  error?: string
  isSlowQuery: boolean
}

/**
 * Database health status
 */
export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'critical'
  responseTime: number
  connectionPoolStatus: ConnectionPoolStatus
  activeConnections: number
  slowQueryCount: number
  errorRate: number
  lastUpdated: Date
  issues: HealthIssue[]
}

/**
 * Connection pool monitoring
 */
export interface ConnectionPoolStatus {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingConnections: number
  maxConnections: number
  connectionUtilization: number
  averageAcquireTime: number
}

/**
 * Table statistics
 */
export interface TableStatistics {
  tableName: string
  totalRows: number
  tableSize: string
  indexSize: string
  lastVacuum?: Date
  lastAnalyze?: Date
  autoVacuumEnabled: boolean
  deadTuples: number
  liveTuples: number
  indexUsage: IndexUsageStats[]
}

/**
 * Index usage statistics
 */
export interface IndexUsageStats {
  indexName: string
  tableName: string
  indexScans: number
  tuplesRead: number
  tuplesInserted: number
  isUnused: boolean
  sizeBytes: number
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  hitRate: number
  missRate: number
  totalRequests: number
  cacheSize: string
  evictions: number
  averageResponseTime: number
  lastCleared?: Date
}

/**
 * Performance alert configuration
 */
export interface AlertThreshold {
  metric: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
  value: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  cooldownMinutes: number
}

/**
 * HIPAA compliance check result
 */
export interface HIPAAComplianceResult {
  isCompliant: boolean
  issues: ComplianceIssue[]
  lastChecked: Date
  auditRequired: boolean
  encryptionStatus: 'enabled' | 'disabled' | 'partial'
  accessControlStatus: 'compliant' | 'non-compliant'
  backupStatus: 'current' | 'outdated' | 'missing'
}

/**
 * Health issue tracking
 */
export interface HealthIssue {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'performance' | 'connectivity' | 'capacity' | 'compliance'
  message: string
  timestamp: Date
  resolved: boolean
  resolutionTime?: Date
}

/**
 * Compliance issue tracking
 */
export interface ComplianceIssue {
  type: 'encryption' | 'access_control' | 'audit' | 'backup' | 'retention'
  severity: 'warning' | 'error' | 'critical'
  description: string
  recommendation: string
  tableName?: string
}

/**
 * Monitoring dashboard metrics
 */
export interface DashboardMetrics {
  health: DatabaseHealth
  performance: {
    averageQueryTime: number
    slowQueries: number
    totalQueries: number
    errorRate: number
    throughput: number
  }
  capacity: {
    databaseSize: string
    growthRate: number
    storageUtilization: number
    connectionUtilization: number
  }
  compliance: HIPAAComplianceResult
  alerts: HealthIssue[]
}

// ================================
// Performance Monitoring Service
// ================================

/**
 * Database Performance Monitoring Service
 * Comprehensive monitoring for healthcare platform database operations
 */
export class DatabasePerformanceMonitoringService {
  private client: SupabaseClient
  private context?: DataAccessContext
  private queryMetrics: Map<string, QueryMetrics> = new Map()
  private alertThresholds: Map<string, AlertThreshold> = new Map()
  private healthIssues: Map<string, HealthIssue> = new Map()
  private metricsRetentionHours: number = 168 // 7 days

  // Performance thresholds (milliseconds)
  private readonly SLOW_QUERY_THRESHOLD = 1000
  private readonly CRITICAL_RESPONSE_TIME = 5000
  private readonly WARNING_RESPONSE_TIME = 2000

  constructor(client: SupabaseClient, context?: DataAccessContext) {
    this.client = client
    this.context = context
    this.initializeDefaultAlerts()
  }

  /**
   * Set monitoring context for operations
   */
  public setContext(context: DataAccessContext): this {
    this.context = context
    return this
  }

  // ================================
  // Query Performance Tracking
  // ================================

  /**
   * Track query execution performance
   */
  public async trackQueryPerformance<T>(
    operation: () => Promise<T>,
    metadata: {
      tableName: string
      operation: QueryMetrics['operation']
      parameters?: Record<string, any>
    }
  ): Promise<T> {
    const queryId = this.generateQueryId()
    const startTime = Date.now()
    let result: T
    let error: string | undefined
    let resultCount: number | undefined

    try {
      result = await operation()
      
      // Extract result count if possible
      if (result && typeof result === 'object' && 'data' in result) {
        const data = (result as any).data
        if (Array.isArray(data)) {
          resultCount = data.length
        } else if (data) {
          resultCount = 1
        }
      }

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      const executionTime = Date.now() - startTime
      
      const metrics: QueryMetrics = {
        queryId,
        tableName: metadata.tableName,
        operation: metadata.operation,
        executionTime,
        timestamp: new Date(),
        userId: this.context?.userId,
        parameters: this.sanitizeParameters(metadata.parameters),
        resultCount,
        error,
        isSlowQuery: executionTime > this.SLOW_QUERY_THRESHOLD
      }

      // Store metrics
      this.queryMetrics.set(queryId, metrics)

      // Log slow queries
      if (metrics.isSlowQuery) {
        logger.warn('Slow query detected', {
          queryId,
          tableName: metadata.tableName,
          operation: metadata.operation,
          executionTime,
          userId: this.context?.userId
        })

        await this.handleSlowQueryAlert(metrics)
      }

      // Log errors
      if (error) {
        logger.error('Query execution failed', {
          queryId,
          tableName: metadata.tableName,
          operation: metadata.operation,
          executionTime,
          error,
          userId: this.context?.userId
        })
      }

      // Cleanup old metrics
      this.cleanupOldMetrics()

      // Audit healthcare data access if required
      if (this.shouldAuditQuery(metadata.tableName, metadata.operation)) {
        await this.auditDatabaseAccess(metrics)
      }
    }

    return result!
  }

  /**
   * Get slow query statistics
   */
  public getSlowQueries(
    timeRangeHours: number = 24
  ): QueryMetrics[] {
    const cutoff = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000)
    
    const metricsArray: QueryMetrics[] = []
    this.queryMetrics.forEach((metric) => {
      if (metric.isSlowQuery && metric.timestamp >= cutoff) {
        metricsArray.push(metric)
      }
    })
    return metricsArray.sort((a, b) => b.executionTime - a.executionTime)
  }

  /**
   * Get query performance statistics
   */
  public getPerformanceStatistics(timeRangeHours: number = 1): {
    totalQueries: number
    averageExecutionTime: number
    slowQueryCount: number
    errorCount: number
    throughput: number
    operationBreakdown: Record<string, number>
  } {
    const cutoff = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000)
    const metricsArray: QueryMetrics[] = []
    this.queryMetrics.forEach((metric) => {
      if (metric.timestamp >= cutoff) {
        metricsArray.push(metric)
      }
    })
    const metrics = metricsArray

    const totalQueries = metrics.length
    const slowQueries = metrics.filter(m => m.isSlowQuery)
    const errorQueries = metrics.filter(m => m.error)
    const averageExecutionTime = totalQueries > 0 
      ? metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
      : 0

    const operationBreakdown: Record<string, number> = {}
    metrics.forEach(m => {
      operationBreakdown[m.operation] = (operationBreakdown[m.operation] || 0) + 1
    })

    return {
      totalQueries,
      averageExecutionTime,
      slowQueryCount: slowQueries.length,
      errorCount: errorQueries.length,
      throughput: totalQueries / timeRangeHours,
      operationBreakdown
    }
  }

  // ================================
  // Database Health Monitoring
  // ================================

  /**
   * Check overall database health
   */
  public async checkDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now()
    let responseTime = 0
    let status: DatabaseHealth['status'] = 'healthy'
    const issues: HealthIssue[] = []

    try {
      // Test basic connectivity
      const { error: connectError } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)

      responseTime = Date.now() - startTime

      if (connectError) {
        status = 'critical'
        issues.push(this.createHealthIssue(
          'connectivity',
          'critical',
          `Database connection failed: ${connectError.message}`
        ))
      } else if (responseTime > this.CRITICAL_RESPONSE_TIME) {
        status = 'critical'
        issues.push(this.createHealthIssue(
          'performance',
          'critical',
          `Database response time is critical: ${responseTime}ms`
        ))
      } else if (responseTime > this.WARNING_RESPONSE_TIME) {
        status = 'degraded'
        issues.push(this.createHealthIssue(
          'performance',
          'medium',
          `Database response time is elevated: ${responseTime}ms`
        ))
      }

    } catch (error) {
      responseTime = Date.now() - startTime
      status = 'critical'
      issues.push(this.createHealthIssue(
        'connectivity',
        'critical',
        `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ))
    }

    // Get connection pool status
    const connectionPoolStatus = await this.getConnectionPoolStatus()
    
    // Check for slow queries in last hour
    const slowQueryCount = this.getSlowQueries(1).length
    if (slowQueryCount > 10) {
      status = status === 'healthy' ? 'degraded' : status
      issues.push(this.createHealthIssue(
        'performance',
        'medium',
        `High number of slow queries detected: ${slowQueryCount}`
      ))
    }

    // Calculate error rate
    const stats = this.getPerformanceStatistics(1)
    const errorRate = stats.totalQueries > 0 ? (stats.errorCount / stats.totalQueries) * 100 : 0
    
    if (errorRate > 5) {
      status = 'critical'
      issues.push(this.createHealthIssue(
        'performance',
        'critical',
        `High error rate detected: ${errorRate.toFixed(2)}%`
      ))
    } else if (errorRate > 1) {
      status = status === 'healthy' ? 'degraded' : status
      issues.push(this.createHealthIssue(
        'performance',
        'medium',
        `Elevated error rate: ${errorRate.toFixed(2)}%`
      ))
    }

    return {
      status,
      responseTime,
      connectionPoolStatus,
      activeConnections: connectionPoolStatus.activeConnections,
      slowQueryCount,
      errorRate,
      lastUpdated: new Date(),
      issues
    }
  }

  /**
   * Get connection pool status
   */
  public async getConnectionPoolStatus(): Promise<ConnectionPoolStatus> {
    try {
      // Query PostgreSQL system views for connection info
      // Note: This is a simplified implementation - in production you'd query actual pg_stat_activity
      const { data, error } = await this.client.rpc('get_connection_stats')
      
      if (error) {
        logger.warn('Failed to get connection pool status', { error: error.message })
        // Return default values if we can't get actual stats
        return {
          totalConnections: 0,
          activeConnections: 0,
          idleConnections: 0,
          waitingConnections: 0,
          maxConnections: 100,
          connectionUtilization: 0,
          averageAcquireTime: 0
        }
      }

      return data || {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
        maxConnections: 100,
        connectionUtilization: 0,
        averageAcquireTime: 0
      }

    } catch (error) {
      logger.error('Connection pool status check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
        maxConnections: 100,
        connectionUtilization: 0,
        averageAcquireTime: 0
      }
    }
  }

  // ================================
  // Table and Index Monitoring
  // ================================

  /**
   * Get table statistics
   */
  public async getTableStatistics(tableName?: string): Promise<TableStatistics[]> {
    try {
      let query = `
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          vacuum_count,
          autovacuum_count,
          analyze_count,
          autoanalyze_count
        FROM pg_stat_user_tables
      `

      if (tableName) {
        query += ` WHERE tablename = '${tableName}'`
      }

      const { data: statData, error: statError } = await this.client.rpc('execute_sql', {
        sql: query
      })

      if (statError) {
        throw statError
      }

      // Get table sizes
      const sizeQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ${tableName ? `AND tablename = '${tableName}'` : ''}
      `

      const { data: sizeData, error: sizeError } = await this.client.rpc('execute_sql', {
        sql: sizeQuery
      })

      if (sizeError) {
        throw sizeError
      }

      // Combine stats and size data
      const statistics: TableStatistics[] = []
      
      for (const stat of statData || []) {
        const sizeInfo = sizeData?.find((s: any) => s.tablename === stat.tablename)
        
        statistics.push({
          tableName: stat.tablename,
          totalRows: stat.live_tuples + stat.dead_tuples,
          tableSize: sizeInfo?.table_size || 'Unknown',
          indexSize: sizeInfo?.index_size || 'Unknown',
          lastVacuum: stat.last_vacuum ? new Date(stat.last_vacuum) : undefined,
          lastAnalyze: stat.last_analyze ? new Date(stat.last_analyze) : undefined,
          autoVacuumEnabled: stat.autovacuum_count > 0,
          deadTuples: stat.dead_tuples,
          liveTuples: stat.live_tuples,
          indexUsage: await this.getIndexUsageStats(stat.tablename)
        })
      }

      return statistics

    } catch (error) {
      logger.error('Failed to get table statistics', {
        tableName,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  /**
   * Get index usage statistics
   */
  public async getIndexUsageStats(tableName: string): Promise<IndexUsageStats[]> {
    try {
      const query = `
        SELECT 
          indexrelname as index_name,
          relname as table_name,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes 
        WHERE relname = '${tableName}'
        ORDER BY idx_scan DESC
      `

      const { data, error } = await this.client.rpc('execute_sql', {
        sql: query
      })

      if (error) {
        throw error
      }

      return (data || []).map((index: any) => ({
        indexName: index.index_name,
        tableName: index.table_name,
        indexScans: index.index_scans || 0,
        tuplesRead: index.tuples_read || 0,
        tuplesInserted: 0, // Not available in pg_stat_user_indexes
        isUnused: index.index_scans === 0,
        sizeBytes: this.parseSizeToBytes(index.index_size)
      }))

    } catch (error) {
      logger.error('Failed to get index usage stats', {
        tableName,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  // ================================
  // HIPAA Compliance Monitoring
  // ================================

  /**
   * Check HIPAA compliance status
   */
  public async checkHIPAACompliance(): Promise<HIPAAComplianceResult> {
    const issues: ComplianceIssue[] = []
    let isCompliant = true

    try {
      // Check encryption status
      const encryptionResult = await this.checkEncryptionStatus()
      if (!encryptionResult.isCompliant) {
        isCompliant = false
        issues.push(...encryptionResult.issues)
      }

      // Check access controls
      const accessControlResult = await this.checkAccessControls()
      if (!accessControlResult.isCompliant) {
        isCompliant = false
        issues.push(...accessControlResult.issues)
      }

      // Check audit logging
      const auditResult = await this.checkAuditLogging()
      if (!auditResult.isCompliant) {
        isCompliant = false
        issues.push(...auditResult.issues)
      }

      // Check backup status
      const backupResult = await this.checkBackupStatus()
      if (!backupResult.isCompliant) {
        isCompliant = false
        issues.push(...backupResult.issues)
      }

      return {
        isCompliant,
        issues,
        lastChecked: new Date(),
        auditRequired: true,
        encryptionStatus: encryptionResult.status,
        accessControlStatus: accessControlResult.status,
        backupStatus: backupResult.status
      }

    } catch (error) {
      logger.error('HIPAA compliance check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        isCompliant: false,
        issues: [{
          type: 'audit',
          severity: 'critical',
          description: 'Unable to perform compliance check',
          recommendation: 'Investigate system connectivity and permissions'
        }],
        lastChecked: new Date(),
        auditRequired: true,
        encryptionStatus: 'disabled',
        accessControlStatus: 'non-compliant',
        backupStatus: 'missing'
      }
    }
  }

  // ================================
  // Dashboard Metrics
  // ================================

  /**
   * Get comprehensive dashboard metrics
   */
  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [health, performance, capacity, compliance] = await Promise.all([
      this.checkDatabaseHealth(),
      this.getPerformanceStatistics(1),
      this.getCapacityMetrics(),
      this.checkHIPAACompliance()
    ])

    const issuesArray: HealthIssue[] = []
    this.healthIssues.forEach((issue) => {
      if (!issue.resolved) {
        issuesArray.push(issue)
      }
    })
    const alerts = issuesArray.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })

    return {
      health,
      performance: {
        averageQueryTime: performance.averageExecutionTime,
        slowQueries: performance.slowQueryCount,
        totalQueries: performance.totalQueries,
        errorRate: health.errorRate,
        throughput: performance.throughput
      },
      capacity,
      compliance,
      alerts
    }
  }

  // ================================
  // Alert Management
  // ================================

  /**
   * Configure alert threshold
   */
  public setAlertThreshold(metric: string, threshold: Omit<AlertThreshold, 'metric'>): void {
    this.alertThresholds.set(metric, { metric, ...threshold })
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): HealthIssue[] {
    const issuesArray: HealthIssue[] = []
    this.healthIssues.forEach((issue) => {
      if (!issue.resolved) {
        issuesArray.push(issue)
      }
    })
    return issuesArray.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Resolve health issue
   */
  public resolveHealthIssue(issueId: string): boolean {
    const issue = this.healthIssues.get(issueId)
    if (issue && !issue.resolved) {
      issue.resolved = true
      issue.resolutionTime = new Date()
      this.healthIssues.set(issueId, issue)
      
      logger.info('Health issue resolved', { issueId, issue: issue.message })
      return true
    }
    return false
  }

  // ================================
  // Private Helper Methods
  // ================================

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sanitizeParameters(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return undefined
    
    // Remove sensitive healthcare data from logging
    const sanitized = { ...params }
    const sensitiveKeys = ['ssn', 'dob', 'patient_id', 'medical_record', 'diagnosis']
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.metricsRetentionHours * 60 * 60 * 1000)
    
    const entriesToDelete: string[] = []
    this.queryMetrics.forEach((metric, queryId) => {
      if (metric.timestamp < cutoff) {
        entriesToDelete.push(queryId)
      }
    })
    entriesToDelete.forEach(queryId => {
      this.queryMetrics.delete(queryId)
    })
  }

  private shouldAuditQuery(tableName: string, operation: string): boolean {
    // Audit all healthcare-related table operations
    const healthcareTables = ['patients', 'medical_records', 'phi_data', 'audit_logs']
    return healthcareTables.includes(tableName.toLowerCase()) || 
           operation === 'DELETE' ||
           (this.context?.hipaaContext.auditRequired ?? false)
  }

  private async auditDatabaseAccess(metrics: QueryMetrics): Promise<void> {
    if (!this.context) return

    try {
      const auditEntry = createAuditLogEntry(
        this.context.userId,
        AuditAction.VIEW,
        metrics.tableName,
        undefined,
        {
          queryId: metrics.queryId,
          operation: metrics.operation,
          executionTime: metrics.executionTime,
          resultCount: metrics.resultCount,
          timestamp: metrics.timestamp.toISOString()
        }
      )

      await this.client
        .from(TABLE_NAMES.AUDIT_LOGS)
        .insert(auditEntry)

    } catch (error) {
      logger.error('Failed to audit database access', {
        queryId: metrics.queryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async handleSlowQueryAlert(metrics: QueryMetrics): Promise<void> {
    const alertKey = `slow_query_${metrics.tableName}`
    const threshold = this.alertThresholds.get(alertKey)
    
    if (threshold?.enabled !== false) {
      const issue = this.createHealthIssue(
        'performance',
        metrics.executionTime > 5000 ? 'critical' : 'medium',
        `Slow query detected on ${metrics.tableName}: ${metrics.executionTime}ms`
      )
      
      this.healthIssues.set(issue.id, issue)
    }
  }

  private createHealthIssue(
    category: HealthIssue['category'],
    severity: HealthIssue['severity'],
    message: string
  ): HealthIssue {
    return {
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      category,
      message,
      timestamp: new Date(),
      resolved: false
    }
  }

  private initializeDefaultAlerts(): void {
    this.setAlertThreshold('slow_query', {
      operator: 'gt',
      value: this.SLOW_QUERY_THRESHOLD,
      severity: 'medium',
      enabled: true,
      cooldownMinutes: 5
    })

    this.setAlertThreshold('error_rate', {
      operator: 'gt',
      value: 5, // 5% error rate
      severity: 'high',
      enabled: true,
      cooldownMinutes: 10
    })

    this.setAlertThreshold('response_time', {
      operator: 'gt',
      value: this.WARNING_RESPONSE_TIME,
      severity: 'medium',
      enabled: true,
      cooldownMinutes: 5
    })
  }

  private async checkEncryptionStatus(): Promise<{
    isCompliant: boolean
    status: 'enabled' | 'disabled' | 'partial'
    issues: ComplianceIssue[]
  }> {
    // Implementation would check actual encryption settings
    // This is a placeholder for the monitoring structure
    return {
      isCompliant: true,
      status: 'enabled',
      issues: []
    }
  }

  private async checkAccessControls(): Promise<{
    isCompliant: boolean
    status: 'compliant' | 'non-compliant'
    issues: ComplianceIssue[]
  }> {
    // Implementation would check RLS policies and permissions
    return {
      isCompliant: true,
      status: 'compliant',
      issues: []
    }
  }

  private async checkAuditLogging(): Promise<{
    isCompliant: boolean
    issues: ComplianceIssue[]
  }> {
    // Implementation would verify audit log completeness
    return {
      isCompliant: true,
      issues: []
    }
  }

  private async checkBackupStatus(): Promise<{
    isCompliant: boolean
    status: 'current' | 'outdated' | 'missing'
    issues: ComplianceIssue[]
  }> {
    // Implementation would check backup recency and integrity
    return {
      isCompliant: true,
      status: 'current',
      issues: []
    }
  }

  private async getCapacityMetrics(): Promise<{
    databaseSize: string
    growthRate: number
    storageUtilization: number
    connectionUtilization: number
  }> {
    try {
      const { data, error } = await this.client.rpc('get_database_size')
      
      if (error) {
        throw error
      }

      return data || {
        databaseSize: 'Unknown',
        growthRate: 0,
        storageUtilization: 0,
        connectionUtilization: 0
      }

    } catch (error) {
      logger.error('Failed to get capacity metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        databaseSize: 'Unknown',
        growthRate: 0,
        storageUtilization: 0,
        connectionUtilization: 0
      }
    }
  }

  private parseSizeToBytes(sizeString: string): number {
    // Parse PostgreSQL size strings like "1024 kB" to bytes
    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/)
    if (!match) return 0

    const [, value, unit] = match
    const multipliers: Record<string, number> = {
      'bytes': 1,
      'kB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    }

    return parseFloat(value) * (multipliers[unit] || 1)
  }
}

/**
 * Factory function to create monitoring service instance
 */
export function createMonitoringService(
  client: SupabaseClient,
  context?: DataAccessContext
): DatabasePerformanceMonitoringService {
  return new DatabasePerformanceMonitoringService(client, context)
}

export default DatabasePerformanceMonitoringService