/**
 * HMHCP Database Performance Monitoring System
 * Real-time performance tracking with automated alerts and optimization suggestions
 */

import { createClient } from '@/lib/supabase-server'
import logger from '@/lib/logging/winston-logger'

export interface DatabaseMetrics {
  timestamp: Date
  connectionPool: {
    active: number
    idle: number
    waiting: number
    total: number
  }
  queryPerformance: {
    avgResponseTime: number
    slowQueries: number
    totalQueries: number
    errorRate: number
  }
  resourceUsage: {
    cpuPercent: number
    memoryPercent: number
    diskIOPS: number
    connectionCount: number
  }
  tableStats: {
    tableName: string
    size: string
    indexSize: string
    rowCount: number
    autoVacuumStatus: string
    lastAnalyze: Date
  }[]
  cacheStats: {
    hitRatio: number
    buffersSharedHit: number
    buffersSharedRead: number
    tempFileCount: number
    tempFileSize: number
  }
}

export interface PerformanceAlert {
  id: string
  type: 'warning' | 'critical' | 'info'
  title: string
  description: string
  metric: string
  threshold: number
  currentValue: number
  recommendation: string
  timestamp: Date
  acknowledged: boolean
}

export interface OptimizationSuggestion {
  id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'indexing' | 'query' | 'schema' | 'configuration'
  title: string
  description: string
  implementation: string
  estimatedImpact: string
  estimatedEffort: string
  sqlQueries?: string[]
}

export class DatabasePerformanceMonitor {
  private supabase
  private alertThresholds: Record<string, number>
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false

  constructor() {
    this.supabase = createClient()
    
    // Default alert thresholds
    this.alertThresholds = {
      avgResponseTime: 1000, // ms
      slowQueryThreshold: 5000, // ms
      errorRate: 5, // percentage
      cpuPercent: 80,
      memoryPercent: 85,
      connectionCount: 90, // percentage of max
      cacheHitRatio: 95, // percentage
      diskIOPS: 1000,
      tableSize: 1024 * 1024 * 1024, // 1GB
      indexBloat: 30 // percentage
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already running')
      return
    }

    this.isMonitoring = true
    logger.info('Starting database performance monitoring', { intervalMs })

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectAndAnalyzeMetrics()
      } catch (error) {
        logger.error('Performance monitoring cycle failed', { error })
      }
    }, intervalMs)

    // Initial metrics collection
    this.collectAndAnalyzeMetrics()
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    logger.info('Database performance monitoring stopped')
  }

  /**
   * Collect comprehensive database metrics
   */
  async collectMetrics(): Promise<DatabaseMetrics> {
    const timestamp = new Date()

    try {
      // Parallel collection of all metrics
      const [
        connectionPool,
        queryPerformance,
        resourceUsage,
        tableStats,
        cacheStats
      ] = await Promise.all([
        this.getConnectionPoolMetrics(),
        this.getQueryPerformanceMetrics(),
        this.getResourceUsageMetrics(),
        this.getTableStatistics(),
        this.getCacheStatistics()
      ])

      const metrics: DatabaseMetrics = {
        timestamp,
        connectionPool,
        queryPerformance,
        resourceUsage,
        tableStats,
        cacheStats
      }

      // Store metrics for historical analysis
      await this.storeMetrics(metrics)

      return metrics
    } catch (error) {
      logger.error('Failed to collect database metrics', { error })
      throw error
    }
  }

  /**
   * Get connection pool metrics
   */
  private async getConnectionPoolMetrics(): Promise<DatabaseMetrics['connectionPool']> {
    const { data, error } = await this.supabase.rpc('get_connection_pool_stats')
    
    if (error) {
      logger.error('Failed to get connection pool metrics', { error })
      return { active: 0, idle: 0, waiting: 0, total: 0 }
    }

    return {
      active: data?.active || 0,
      idle: data?.idle || 0,
      waiting: data?.waiting || 0,
      total: data?.total || 0
    }
  }

  /**
   * Get query performance metrics
   */
  private async getQueryPerformanceMetrics(): Promise<DatabaseMetrics['queryPerformance']> {
    const { data, error } = await this.supabase.rpc('get_query_performance_stats')
    
    if (error) {
      logger.error('Failed to get query performance metrics', { error })
      return { avgResponseTime: 0, slowQueries: 0, totalQueries: 0, errorRate: 0 }
    }

    return {
      avgResponseTime: data?.avg_response_time || 0,
      slowQueries: data?.slow_queries || 0,
      totalQueries: data?.total_queries || 0,
      errorRate: data?.error_rate || 0
    }
  }

  /**
   * Get resource usage metrics
   */
  private async getResourceUsageMetrics(): Promise<DatabaseMetrics['resourceUsage']> {
    const { data, error } = await this.supabase.rpc('get_resource_usage_stats')
    
    if (error) {
      logger.error('Failed to get resource usage metrics', { error })
      return { cpuPercent: 0, memoryPercent: 0, diskIOPS: 0, connectionCount: 0 }
    }

    return {
      cpuPercent: data?.cpu_percent || 0,
      memoryPercent: data?.memory_percent || 0,
      diskIOPS: data?.disk_iops || 0,
      connectionCount: data?.connection_count || 0
    }
  }

  /**
   * Get table statistics
   */
  private async getTableStatistics(): Promise<DatabaseMetrics['tableStats']> {
    const { data, error } = await this.supabase.rpc('get_table_statistics')
    
    if (error) {
      logger.error('Failed to get table statistics', { error })
      return []
    }

    return data || []
  }

  /**
   * Get cache statistics
   */
  private async getCacheStatistics(): Promise<DatabaseMetrics['cacheStats']> {
    const { data, error } = await this.supabase.rpc('get_cache_statistics')
    
    if (error) {
      logger.error('Failed to get cache statistics', { error })
      return {
        hitRatio: 0,
        buffersSharedHit: 0,
        buffersSharedRead: 0,
        tempFileCount: 0,
        tempFileSize: 0
      }
    }

    return {
      hitRatio: data?.hit_ratio || 0,
      buffersSharedHit: data?.buffers_shared_hit || 0,
      buffersSharedRead: data?.buffers_shared_read || 0,
      tempFileCount: data?.temp_file_count || 0,
      tempFileSize: data?.temp_file_size || 0
    }
  }

  /**
   * Analyze metrics and generate alerts
   */
  async analyzeMetrics(metrics: DatabaseMetrics): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = []

    // Query performance alerts
    if (metrics.queryPerformance.avgResponseTime > this.alertThresholds.avgResponseTime) {
      alerts.push({
        id: `alert-${Date.now()}-response-time`,
        type: 'warning',
        title: 'High Average Response Time',
        description: `Average query response time is ${metrics.queryPerformance.avgResponseTime}ms`,
        metric: 'avgResponseTime',
        threshold: this.alertThresholds.avgResponseTime,
        currentValue: metrics.queryPerformance.avgResponseTime,
        recommendation: 'Review slow queries and consider adding indexes or optimizing query plans',
        timestamp: new Date(),
        acknowledged: false
      })
    }

    if (metrics.queryPerformance.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        id: `alert-${Date.now()}-error-rate`,
        type: 'critical',
        title: 'High Query Error Rate',
        description: `Query error rate is ${metrics.queryPerformance.errorRate}%`,
        metric: 'errorRate',
        threshold: this.alertThresholds.errorRate,
        currentValue: metrics.queryPerformance.errorRate,
        recommendation: 'Investigate failing queries and fix application-level issues',
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Resource usage alerts
    if (metrics.resourceUsage.cpuPercent > this.alertThresholds.cpuPercent) {
      alerts.push({
        id: `alert-${Date.now()}-cpu`,
        type: 'warning',
        title: 'High CPU Usage',
        description: `CPU usage is ${metrics.resourceUsage.cpuPercent}%`,
        metric: 'cpuPercent',
        threshold: this.alertThresholds.cpuPercent,
        currentValue: metrics.resourceUsage.cpuPercent,
        recommendation: 'Consider upgrading instance or optimizing expensive queries',
        timestamp: new Date(),
        acknowledged: false
      })
    }

    if (metrics.resourceUsage.memoryPercent > this.alertThresholds.memoryPercent) {
      alerts.push({
        id: `alert-${Date.now()}-memory`,
        type: 'critical',
        title: 'High Memory Usage',
        description: `Memory usage is ${metrics.resourceUsage.memoryPercent}%`,
        metric: 'memoryPercent',
        threshold: this.alertThresholds.memoryPercent,
        currentValue: metrics.resourceUsage.memoryPercent,
        recommendation: 'Increase shared_buffers or upgrade instance memory',
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Cache performance alerts
    if (metrics.cacheStats.hitRatio < this.alertThresholds.cacheHitRatio) {
      alerts.push({
        id: `alert-${Date.now()}-cache-hit-ratio`,
        type: 'warning',
        title: 'Low Cache Hit Ratio',
        description: `Cache hit ratio is ${metrics.cacheStats.hitRatio}%`,
        metric: 'cacheHitRatio',
        threshold: this.alertThresholds.cacheHitRatio,
        currentValue: metrics.cacheStats.hitRatio,
        recommendation: 'Increase shared_buffers or review working set size',
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Connection pool alerts
    const connectionUtilization = (metrics.connectionPool.active / metrics.connectionPool.total) * 100
    if (connectionUtilization > this.alertThresholds.connectionCount) {
      alerts.push({
        id: `alert-${Date.now()}-connections`,
        type: 'warning',
        title: 'High Connection Pool Utilization',
        description: `Connection pool is ${connectionUtilization.toFixed(1)}% utilized`,
        metric: 'connectionCount',
        threshold: this.alertThresholds.connectionCount,
        currentValue: connectionUtilization,
        recommendation: 'Implement connection pooling or increase max_connections',
        timestamp: new Date(),
        acknowledged: false
      })
    }

    return alerts
  }

  /**
   * Generate optimization suggestions
   */
  async generateOptimizationSuggestions(metrics: DatabaseMetrics): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = []

    // Analyze slow queries
    const { data: slowQueries } = await this.supabase.rpc('get_slow_queries', { limit: 10 })
    
    if (slowQueries && slowQueries.length > 0) {
      suggestions.push({
        id: `opt-${Date.now()}-slow-queries`,
        priority: 'high',
        category: 'query',
        title: 'Optimize Slow Queries',
        description: `Found ${slowQueries.length} queries taking over 1 second to execute`,
        implementation: 'Review execution plans and add appropriate indexes',
        estimatedImpact: 'High - Could improve response times by 50-80%',
        estimatedEffort: 'Medium - 4-8 hours',
        sqlQueries: slowQueries.map((q: any) => q.query)
      })
    }

    // Analyze missing indexes
    const { data: missingIndexes } = await this.supabase.rpc('get_missing_indexes')
    
    if (missingIndexes && missingIndexes.length > 0) {
      suggestions.push({
        id: `opt-${Date.now()}-missing-indexes`,
        priority: 'high',
        category: 'indexing',
        title: 'Add Missing Indexes',
        description: `Found ${missingIndexes.length} tables that could benefit from additional indexes`,
        implementation: 'Create composite indexes for frequently queried columns',
        estimatedImpact: 'High - Could improve query performance by 2-10x',
        estimatedEffort: 'Low - 1-2 hours',
        sqlQueries: missingIndexes.map((idx: any) => idx.create_statement)
      })
    }

    // Analyze table bloat
    const bloatedTables = metrics.tableStats.filter(table => {
      const sizeGB = parseFloat(table.size.replace(/[^0-9.]/g, ''))
      return sizeGB > 1 && table.autoVacuumStatus === 'overdue'
    })

    if (bloatedTables.length > 0) {
      suggestions.push({
        id: `opt-${Date.now()}-table-bloat`,
        priority: 'medium',
        category: 'schema',
        title: 'Address Table Bloat',
        description: `${bloatedTables.length} tables may be experiencing bloat`,
        implementation: 'Run VACUUM FULL or consider pg_repack',
        estimatedImpact: 'Medium - Could reduce storage by 20-40%',
        estimatedEffort: 'Medium - 2-4 hours maintenance window',
        sqlQueries: bloatedTables.map(table => `VACUUM FULL ${table.tableName};`)
      })
    }

    // Cache optimization
    if (metrics.cacheStats.hitRatio < 95) {
      suggestions.push({
        id: `opt-${Date.now()}-cache-tuning`,
        priority: 'medium',
        category: 'configuration',
        title: 'Optimize Cache Configuration',
        description: `Cache hit ratio is ${metrics.cacheStats.hitRatio}%, should be >95%`,
        implementation: 'Increase shared_buffers and effective_cache_size',
        estimatedImpact: 'Medium - Could improve read performance by 20-30%',
        estimatedEffort: 'Low - Configuration change only'
      })
    }

    return suggestions
  }

  /**
   * Collect and analyze metrics in one operation
   */
  private async collectAndAnalyzeMetrics(): Promise<void> {
    try {
      const metrics = await this.collectMetrics()
      const alerts = await this.analyzeMetrics(metrics)
      const suggestions = await this.generateOptimizationSuggestions(metrics)

      // Log critical alerts
      alerts.filter(alert => alert.type === 'critical').forEach(alert => {
        logger.error('Critical database performance alert', { alert })
      })

      // Store alerts and suggestions
      if (alerts.length > 0) {
        await this.storeAlerts(alerts)
      }

      if (suggestions.length > 0) {
        await this.storeSuggestions(suggestions)
      }

      logger.info('Performance monitoring cycle completed', {
        metricsCollected: true,
        alertsGenerated: alerts.length,
        suggestionsGenerated: suggestions.length
      })

    } catch (error) {
      logger.error('Performance monitoring cycle failed', { error })
    }
  }

  /**
   * Store metrics for historical analysis
   */
  private async storeMetrics(metrics: DatabaseMetrics): Promise<void> {
    const { error } = await this.supabase
      .from('database_performance_metrics')
      .insert({
        timestamp: metrics.timestamp.toISOString(),
        connection_pool: metrics.connectionPool,
        query_performance: metrics.queryPerformance,
        resource_usage: metrics.resourceUsage,
        table_stats: metrics.tableStats,
        cache_stats: metrics.cacheStats
      })

    if (error) {
      logger.error('Failed to store performance metrics', { error })
    }
  }

  /**
   * Store alerts
   */
  private async storeAlerts(alerts: PerformanceAlert[]): Promise<void> {
    const { error } = await this.supabase
      .from('database_performance_alerts')
      .insert(alerts.map(alert => ({
        alert_id: alert.id,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        metric: alert.metric,
        threshold: alert.threshold,
        current_value: alert.currentValue,
        recommendation: alert.recommendation,
        acknowledged: alert.acknowledged,
        created_at: alert.timestamp.toISOString()
      })))

    if (error) {
      logger.error('Failed to store performance alerts', { error })
    }
  }

  /**
   * Store optimization suggestions
   */
  private async storeSuggestions(suggestions: OptimizationSuggestion[]): Promise<void> {
    const { error } = await this.supabase
      .from('database_optimization_suggestions')
      .insert(suggestions.map(suggestion => ({
        suggestion_id: suggestion.id,
        priority: suggestion.priority,
        category: suggestion.category,
        title: suggestion.title,
        description: suggestion.description,
        implementation: suggestion.implementation,
        estimated_impact: suggestion.estimatedImpact,
        estimated_effort: suggestion.estimatedEffort,
        sql_queries: suggestion.sqlQueries || [],
        created_at: new Date().toISOString()
      })))

    if (error) {
      logger.error('Failed to store optimization suggestions', { error })
    }
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    currentMetrics: DatabaseMetrics
    historicalTrends: any[]
    activeAlerts: PerformanceAlert[]
    suggestions: OptimizationSuggestion[]
  }> {
    const intervalMap = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    }

    try {
      const [currentMetrics, historicalData, activeAlerts, suggestions] = await Promise.all([
        this.collectMetrics(),
        this.supabase
          .from('database_performance_metrics')
          .select('*')
          .gte('timestamp', new Date(Date.now() - (timeRange === '1h' ? 3600000 : timeRange === '24h' ? 86400000 : timeRange === '7d' ? 604800000 : 2592000000)).toISOString())
          .order('timestamp', { ascending: true }),
        this.supabase
          .from('database_performance_alerts')
          .select('*')
          .eq('acknowledged', false)
          .order('created_at', { ascending: false }),
        this.supabase
          .from('database_optimization_suggestions')
          .select('*')
          .order('priority', { ascending: false })
          .limit(10)
      ])

      return {
        currentMetrics,
        historicalTrends: historicalData.data || [],
        activeAlerts: (activeAlerts.data || []).map(this.mapAlertFromDb),
        suggestions: (suggestions.data || []).map(this.mapSuggestionFromDb)
      }
    } catch (error) {
      logger.error('Failed to get dashboard data', { error })
      throw error
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('database_performance_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('alert_id', alertId)

    if (error) {
      logger.error('Failed to acknowledge alert', { error, alertId })
      throw error
    }
  }

  /**
   * Helper methods for data mapping
   */
  private mapAlertFromDb(row: any): PerformanceAlert {
    return {
      id: row.alert_id,
      type: row.type,
      title: row.title,
      description: row.description,
      metric: row.metric,
      threshold: row.threshold,
      currentValue: row.current_value,
      recommendation: row.recommendation,
      timestamp: new Date(row.created_at),
      acknowledged: row.acknowledged
    }
  }

  private mapSuggestionFromDb(row: any): OptimizationSuggestion {
    return {
      id: row.suggestion_id,
      priority: row.priority,
      category: row.category,
      title: row.title,
      description: row.description,
      implementation: row.implementation,
      estimatedImpact: row.estimated_impact,
      estimatedEffort: row.estimated_effort,
      sqlQueries: row.sql_queries || []
    }
  }
}

export const databasePerformanceMonitor = new DatabasePerformanceMonitor()