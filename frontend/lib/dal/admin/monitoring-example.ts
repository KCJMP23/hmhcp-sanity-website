/**
 * Database Performance Monitoring Service Usage Example
 * Healthcare platform admin system monitoring implementation examples
 * Shows how to integrate monitoring into existing DAL operations
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { DatabasePerformanceMonitoringService } from './monitoring'
import { DatabaseHealthCheckService } from './health-check'
import { DataAccessContext, AdminRole, DataClassification, HIPAAContext } from './types'
import { logger } from '../../logger'

// ================================
// Example Usage Scenarios
// ================================

/**
 * Example: Setting up monitoring service with admin context
 */
async function setupMonitoringService(client: SupabaseClient) {
  // Create admin context for monitoring operations
  const adminContext: DataAccessContext = {
    userId: 'admin-user-123',
    role: AdminRole.ADMIN,
    permissions: ['monitor_database', 'view_health_metrics'],
    classification: DataClassification.INTERNAL,
    hipaaContext: {
      isHealthcareData: true,
      complianceLevel: 'strict',
      auditRequired: true,
      encryptionRequired: true
    },
    auditRequired: true
  }

  // Initialize monitoring service
  const monitoringService = new DatabasePerformanceMonitoringService(client, adminContext)
  
  logger.info('Database monitoring service initialized', {
    userId: adminContext.userId,
    role: adminContext.role
  })

  return monitoringService
}

/**
 * Example: Monitoring database operations with performance tracking
 */
async function monitoredDatabaseOperation(
  client: SupabaseClient,
  monitoringService: DatabasePerformanceMonitoringService
) {
  // Example: Track a blog post query operation
  const blogPosts = await monitoringService.trackQueryPerformance(
    () => client
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10),
    {
      tableName: 'blog_posts',
      operation: 'SELECT',
      parameters: {
        status: 'published',
        limit: 10,
        orderBy: 'created_at DESC'
      }
    }
  )

  logger.info('Blog posts query completed', {
    resultCount: blogPosts.data?.length || 0
  })

  return blogPosts
}

/**
 * Example: Healthcare data operation with HIPAA compliance monitoring
 */
async function monitorHealthcareDataOperation(
  client: SupabaseClient,
  monitoringService: DatabasePerformanceMonitoringService
) {
  // Example: Track a sensitive healthcare-related operation
  const auditLogs = await monitoringService.trackQueryPerformance(
    () => client
      .from('audit_logs')
      .select('*')
      .eq('resource_type', 'patient_records')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    {
      tableName: 'audit_logs',
      operation: 'SELECT',
      parameters: {
        resource_type: 'patient_records',
        timeRange: '24h'
      }
    }
  )

  // This operation will be automatically audited due to healthcare context
  logger.info('Healthcare audit logs query completed', {
    recordCount: auditLogs.data?.length || 0,
    compliance: 'HIPAA monitored'
  })

  return auditLogs
}

/**
 * Example: Comprehensive database health check
 */
async function performScheduledHealthCheck(client: SupabaseClient) {
  const healthService = new DatabaseHealthCheckService(client)
  
  // Set admin context for health checks
  healthService.setContext({
    userId: 'health-check-system',
    role: AdminRole.SUPER_ADMIN,
    permissions: ['system_health', 'database_admin'],
    classification: DataClassification.INTERNAL,
    hipaaContext: {
      isHealthcareData: false,
      complianceLevel: 'basic',
      auditRequired: true,
      encryptionRequired: false
    },
    auditRequired: true
  })

  try {
    // Perform comprehensive health check
    const healthResult = await healthService.performComprehensiveHealthCheck()

    // Log health status
    logger.info('Database health check completed', {
      overallHealth: healthResult.overallHealth,
      responseTime: healthResult.connectivity.responseTime,
      tableCount: healthResult.tables.length,
      issueCount: healthResult.tables.reduce((sum, t) => sum + t.issues.length, 0),
      recommendations: healthResult.recommendations.length
    })

    // Handle critical issues
    if (healthResult.overallHealth === 'critical') {
      logger.error('CRITICAL: Database health issues detected', {
        connectivity: healthResult.connectivity.error,
        criticalTables: healthResult.tables
          .filter(t => t.issues.some(i => i.severity === 'critical'))
          .map(t => t.tableName),
        recommendations: healthResult.recommendations
      })

      // In a production system, this would trigger alerts
      await sendHealthAlert(healthResult)
    }

    return healthResult

  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Example: Getting performance dashboard metrics
 */
async function getDashboardMetrics(
  monitoringService: DatabasePerformanceMonitoringService
) {
  try {
    const dashboardMetrics = await monitoringService.getDashboardMetrics()

    logger.info('Dashboard metrics retrieved', {
      healthStatus: dashboardMetrics.health.status,
      averageQueryTime: dashboardMetrics.performance.averageQueryTime,
      slowQueries: dashboardMetrics.performance.slowQueries,
      errorRate: dashboardMetrics.performance.errorRate,
      hipaaCompliant: dashboardMetrics.compliance.isCompliant,
      activeAlerts: dashboardMetrics.alerts.length
    })

    // Example: Handle performance alerts
    if (dashboardMetrics.performance.averageQueryTime > 1000) {
      logger.warn('Performance degradation detected', {
        averageQueryTime: dashboardMetrics.performance.averageQueryTime,
        slowQueries: dashboardMetrics.performance.slowQueries,
        recommendation: 'Consider database optimization'
      })
    }

    // Example: Handle compliance issues
    if (!dashboardMetrics.compliance.isCompliant) {
      logger.error('HIPAA compliance issues detected', {
        issues: dashboardMetrics.compliance.issues,
        recommendation: 'Address compliance issues immediately'
      })
    }

    return dashboardMetrics

  } catch (error) {
    logger.error('Failed to get dashboard metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Example: Monitoring slow queries and performance issues
 */
async function monitorPerformanceIssues(
  monitoringService: DatabasePerformanceMonitoringService
) {
  // Get slow queries from the last hour
  const slowQueries = monitoringService.getSlowQueries(1)
  
  if (slowQueries.length > 0) {
    logger.warn('Slow queries detected', {
      count: slowQueries.length,
      queries: slowQueries.map(q => ({
        table: q.tableName,
        operation: q.operation,
        executionTime: q.executionTime,
        timestamp: q.timestamp
      }))
    })

    // Example: Analyze slow query patterns
    const tableAnalysis: Record<string, { count: number; avgTime: number }> = {}
    
    slowQueries.forEach(query => {
      if (!tableAnalysis[query.tableName]) {
        tableAnalysis[query.tableName] = { count: 0, avgTime: 0 }
      }
      tableAnalysis[query.tableName].count++
      tableAnalysis[query.tableName].avgTime = 
        (tableAnalysis[query.tableName].avgTime + query.executionTime) / 2
    })

    logger.info('Slow query analysis by table', { tableAnalysis })
  }

  // Get performance statistics
  const perfStats = monitoringService.getPerformanceStatistics(1)
  
  logger.info('Performance statistics (last hour)', {
    totalQueries: perfStats.totalQueries,
    averageTime: perfStats.averageExecutionTime,
    slowQueries: perfStats.slowQueryCount,
    errors: perfStats.errorCount,
    throughput: perfStats.throughput,
    operations: perfStats.operationBreakdown
  })

  return { slowQueries, perfStats, tableAnalysis }
}

/**
 * Example: Setting up alert thresholds
 */
async function configureAlertThresholds(
  monitoringService: DatabasePerformanceMonitoringService
) {
  // Configure custom alert thresholds for healthcare platform
  monitoringService.setAlertThreshold('slow_query_patient_data', {
    operator: 'gt',
    value: 500, // 500ms threshold for patient data queries
    severity: 'high',
    enabled: true,
    cooldownMinutes: 5
  })

  monitoringService.setAlertThreshold('error_rate_critical', {
    operator: 'gt',
    value: 0.5, // 0.5% error rate threshold
    severity: 'critical',
    enabled: true,
    cooldownMinutes: 10
  })

  monitoringService.setAlertThreshold('connection_utilization', {
    operator: 'gt',
    value: 80, // 80% connection pool utilization
    severity: 'medium',
    enabled: true,
    cooldownMinutes: 15
  })

  logger.info('Alert thresholds configured for healthcare platform')
}

/**
 * Example: Handling health issue resolution
 */
async function resolveHealthIssues(
  monitoringService: DatabasePerformanceMonitoringService
) {
  const activeAlerts = monitoringService.getActiveAlerts()

  for (const alert of activeAlerts) {
    logger.info('Processing health issue', {
      issueId: alert.id,
      severity: alert.severity,
      category: alert.category,
      message: alert.message,
      timestamp: alert.timestamp
    })

    // Example: Auto-resolve certain types of issues
    if (alert.category === 'performance' && alert.severity === 'low') {
      // Simulate issue resolution
      const resolved = monitoringService.resolveHealthIssue(alert.id)
      
      if (resolved) {
        logger.info('Health issue auto-resolved', {
          issueId: alert.id,
          category: alert.category
        })
      }
    }
  }

  return activeAlerts
}

/**
 * Example: Simulated alert notification system
 */
async function sendHealthAlert(healthResult: any) {
  // In a production system, this would send real alerts via email, Slack, etc.
  logger.error('ALERT: Critical database health issue', {
    timestamp: new Date().toISOString(),
    overallHealth: healthResult.overallHealth,
    connectivity: healthResult.connectivity,
    criticalIssues: healthResult.tables
      .filter((t: any) => t.issues.some((i: any) => i.severity === 'critical'))
      .length,
    recommendations: healthResult.recommendations,
    action: 'Immediate database administrator attention required'
  })

  // Simulate notification
  console.log('🚨 CRITICAL DATABASE ALERT SENT 🚨')
  console.log('Database administrators have been notified')
}

/**
 * Example: Complete monitoring workflow for healthcare platform
 */
export async function healthcareMonitoringWorkflow(client: SupabaseClient) {
  try {
    // 1. Setup monitoring services
    const monitoringService = await setupMonitoringService(client)
    
    // 2. Configure healthcare-specific alert thresholds
    await configureAlertThresholds(monitoringService)
    
    // 3. Perform monitored database operations
    await monitoredDatabaseOperation(client, monitoringService)
    await monitorHealthcareDataOperation(client, monitoringService)
    
    // 4. Check database health
    const healthResult = await performScheduledHealthCheck(client)
    
    // 5. Get dashboard metrics
    const dashboardMetrics = await getDashboardMetrics(monitoringService)
    
    // 6. Monitor performance issues
    const performanceAnalysis = await monitorPerformanceIssues(monitoringService)
    
    // 7. Resolve any actionable issues
    await resolveHealthIssues(monitoringService)
    
    logger.info('Healthcare monitoring workflow completed successfully', {
      healthStatus: healthResult.overallHealth,
      compliance: dashboardMetrics.compliance.isCompliant,
      performanceIssues: performanceAnalysis.slowQueries.length,
      totalQueries: performanceAnalysis.perfStats.totalQueries
    })

    return {
      health: healthResult,
      dashboard: dashboardMetrics,
      performance: performanceAnalysis
    }

  } catch (error) {
    logger.error('Healthcare monitoring workflow failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

export default {
  setupMonitoringService,
  monitoredDatabaseOperation,
  monitorHealthcareDataOperation,
  performScheduledHealthCheck,
  getDashboardMetrics,
  monitorPerformanceIssues,
  configureAlertThresholds,
  resolveHealthIssues,
  healthcareMonitoringWorkflow
}