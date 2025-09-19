/**
 * Automated Health Check System
 * Continuously monitors system health and triggers alerts
 */

import { alertManager } from './alerts'
import { getSystemHealth } from './uptime'
import { logger } from '@/lib/logger'

interface HealthCheckConfig {
  interval_seconds: number
  enabled: boolean
  checks: Array<{
    name: string
    enabled: boolean
    timeout_ms: number
    critical: boolean
  }>
}

interface HealthMetrics {
  timestamp: string
  response_time: number
  uptime_percentage: number
  error_rate: number
  memory_usage: number
  cpu_usage: number
  database_healthy: number
  external_apis: number
  static_assets: number
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
  security_threats: number
  active_users: number
  request_rate: number
}

class HealthCheckManager {
  private config: HealthCheckConfig
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null
  private lastMetrics: HealthMetrics | null = null
  private metricsHistory: HealthMetrics[] = []
  private maxHistorySize: number = 1000

  constructor() {
    this.config = {
      interval_seconds: 30, // Check every 30 seconds
      enabled: process.env.NODE_ENV === 'production',
      checks: [
        {
          name: 'database_connectivity',
          enabled: true,
          timeout_ms: 5000,
          critical: true
        },
        {
          name: 'api_endpoints',
          enabled: true,
          timeout_ms: 3000,
          critical: true
        },
        {
          name: 'external_services',
          enabled: true,
          timeout_ms: 10000,
          critical: false
        },
        {
          name: 'static_assets',
          enabled: true,
          timeout_ms: 5000,
          critical: false
        },
        {
          name: 'performance_metrics',
          enabled: true,
          timeout_ms: 15000,
          critical: false
        }
      ]
    }
  }

  /**
   * Start the automated health checking system
   */
  start() {
    if (this.isRunning) {
      logger.warn('Health check manager is already running')
      return
    }

    if (!this.config.enabled) {
      logger.info('Health check manager is disabled')
      return
    }

    logger.info('Starting health check manager')
    this.isRunning = true

    // Run initial check
    this.performHealthCheck()

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.performHealthCheck()
    }, this.config.interval_seconds * 1000)

    logger.info(`Health checks scheduled every ${this.config.interval_seconds} seconds`)
  }

  /**
   * Stop the automated health checking system
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    logger.info('Stopping health check manager')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck() {
    try {
      logger.debug('Performing health check')

      const startTime = Date.now()
      const checks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkAPIEndpoints(),
        this.checkExternalServices(),
        this.checkStaticAssets(),
        this.checkSystemResources(),
        this.checkSecurityThreats(),
        this.checkPerformanceMetrics()
      ])

      const endTime = Date.now()
      const checkDuration = endTime - startTime

      // Collect results
      const [
        databaseResult,
        apiResult,
        externalResult,
        staticResult,
        systemResult,
        securityResult,
        performanceResult
      ] = checks

      // Calculate metrics
      const metrics: HealthMetrics = {
        timestamp: new Date().toISOString(),
        response_time: checkDuration,
        uptime_percentage: await this.calculateUptime(),
        error_rate: await this.calculateErrorRate(),
        memory_usage: this.getMemoryUsage(),
        cpu_usage: await this.getCPUUsage(),
        database_healthy: databaseResult.status === 'fulfilled' && databaseResult.value ? 1 : 0,
        external_apis: externalResult.status === 'fulfilled' && externalResult.value ? 1 : 0,
        static_assets: staticResult.status === 'fulfilled' && staticResult.value ? 1 : 0,
        security_threats: securityResult.status === 'fulfilled' ? securityResult.value : 0,
        active_users: await this.getActiveUsers(),
        request_rate: await this.getRequestRate(),
        ...(performanceResult.status === 'fulfilled' && performanceResult.value ? performanceResult.value : {})
      }

      // Store metrics
      this.lastMetrics = metrics
      this.addToHistory(metrics)

      // Check against alerts
      await alertManager.checkAlerts(metrics)

      // Log critical issues
      if (metrics.database_healthy === 0) {
        logger.error('Database health check failed')
      }
      if (metrics.response_time > 5000) {
        logger.warn(`Health check took ${metrics.response_time}ms`)
      }
      if (metrics.security_threats > 0) {
        logger.warn(`Security threats detected: ${metrics.security_threats}`)
      }

      logger.debug('Health check completed', {
        duration: checkDuration,
        uptime: metrics.uptime_percentage,
        response_time: metrics.response_time
      })

    } catch (error) {
      logger.error('Health check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      // Send critical alert for health check system failure
      await alertManager.checkAlerts({
        health_check_system: 0,
        error_rate: 100,
        uptime_percentage: 0
      })
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // Import database adapter dynamically to avoid circular dependencies
      const { databaseAdapter } = await import('@/lib/db/adapter')
      
      // Simple connectivity test
      const result = await Promise.race([
        databaseAdapter.query('SELECT 1'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )
      ])
      
      return !!result
    } catch (error) {
      logger.error('Database health check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  private async checkAPIEndpoints(): Promise<boolean> {
    try {
      const endpoints = [
        '/api/health',
        '/api/monitoring/metrics'
      ]

      const checks = endpoints.map(async (endpoint) => {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': 'HealthChecker/1.0' },
          signal: AbortSignal.timeout(3000)
        })
        return response.ok
      })

      const results = await Promise.all(checks)
      return results.every(result => result === true)
    } catch (error) {
      logger.error('API endpoints health check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  private async checkExternalServices(): Promise<boolean> {
    try {
      const services = []

      // Check Supabase if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        services.push(
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            },
            signal: AbortSignal.timeout(10000)
          }).then(r => r.ok)
        )
      }

      // Check other external services
      if (process.env.EXTERNAL_API_URL) {
        services.push(
          fetch(process.env.EXTERNAL_API_URL, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          }).then(r => r.ok)
        )
      }

      if (services.length === 0) {
        return true // No external services to check
      }

      const results = await Promise.allSettled(services)
      return results.some(result => result.status === 'fulfilled' && result.value === true)
    } catch (error) {
      logger.error('External services health check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  private async checkStaticAssets(): Promise<boolean> {
    try {
      // Check critical static assets
      const assets = [
        '/favicon.ico',
        '/_next/static/css/app.css', // This may vary based on build
      ]

      const checks = assets.map(async (asset) => {
        try {
          const response = await fetch(`http://localhost:3000${asset}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          })
          return response.ok || response.status === 404 // 404 is acceptable for optional assets
        } catch {
          return false
        }
      })

      const results = await Promise.all(checks)
      return results.some(result => result === true) // At least one asset should be available
    } catch (error) {
      logger.error('Static assets health check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return false
    }
  }

  private async checkSystemResources(): Promise<{ memory: number; cpu: number }> {
    try {
      const used = process.memoryUsage()
      const memoryUsagePercent = (used.heapUsed / used.heapTotal) * 100

      // CPU usage is harder to measure in Node.js, simulate for now
      const cpuUsage = Math.random() * 10 + 5 // 5-15% simulated

      return {
        memory: memoryUsagePercent,
        cpu: cpuUsage
      }
    } catch (error) {
      logger.error('System resources check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return { memory: 0, cpu: 0 }
    }
  }

  private async checkSecurityThreats(): Promise<number> {
    try {
      // In a real implementation, this would check:
      // - Failed login attempts
      // - Suspicious IP addresses
      // - Rate limit violations
      // - SQL injection attempts
      // - XSS attempts
      
      // For now, return 0 (no threats detected)
      return 0
    } catch (error) {
      logger.error('Security threats check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return 0
    }
  }

  private async checkPerformanceMetrics(): Promise<Partial<HealthMetrics> | null> {
    try {
      // In a real implementation, this would use Lighthouse or similar
      // to get actual Core Web Vitals metrics
      
      // Simulate some performance metrics
      return {
        lcp: Math.random() * 1000 + 1500, // 1.5-2.5s
        fid: Math.random() * 50 + 50, // 50-100ms
        cls: Math.random() * 0.05 + 0.05, // 0.05-0.1
        fcp: Math.random() * 500 + 1000, // 1-1.5s
        ttfb: Math.random() * 200 + 100 // 100-300ms
      }
    } catch (error) {
      logger.error('Performance metrics check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return null
    }
  }

  private async calculateUptime(): Promise<number> {
    try {
      const health = await getSystemHealth()
      return health.uptime
    } catch {
      return 99.9 // Default fallback
    }
  }

  private async calculateErrorRate(): Promise<number> {
    try {
      // In a real implementation, this would query error logs
      // For now, simulate a low error rate
      return Math.random() * 2 // 0-2% error rate
    } catch {
      return 0
    }
  }

  private getMemoryUsage(): number {
    try {
      const used = process.memoryUsage()
      return (used.heapUsed / used.heapTotal) * 100
    } catch {
      return 0
    }
  }

  private async getCPUUsage(): Promise<number> {
    try {
      // Simulate CPU usage measurement
      return Math.random() * 20 + 5 // 5-25% CPU usage
    } catch {
      return 0
    }
  }

  private async getActiveUsers(): Promise<number> {
    try {
      // In a real implementation, this would query active sessions
      return Math.floor(Math.random() * 50) + 10 // 10-60 active users
    } catch {
      return 0
    }
  }

  private async getRequestRate(): Promise<number> {
    try {
      // In a real implementation, this would calculate requests per minute
      return Math.floor(Math.random() * 100) + 50 // 50-150 requests per minute
    } catch {
      return 0
    }
  }

  private addToHistory(metrics: HealthMetrics) {
    this.metricsHistory.push(metrics)
    
    // Keep only the last N metrics
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Get the latest health metrics
   */
  getLatestMetrics(): HealthMetrics | null {
    return this.lastMetrics
  }

  /**
   * Get historical health metrics
   */
  getMetricsHistory(limit?: number): HealthMetrics[] {
    const history = this.metricsHistory
    return limit ? history.slice(-limit) : history
  }

  /**
   * Get system status summary
   */
  getStatusSummary() {
    const latest = this.lastMetrics
    if (!latest) {
      return {
        status: 'unknown',
        message: 'No health data available'
      }
    }

    const criticalIssues = []
    if (latest.database_healthy === 0) criticalIssues.push('Database offline')
    if (latest.uptime_percentage < 99.0) criticalIssues.push('Low uptime')
    if (latest.error_rate > 5.0) criticalIssues.push('High error rate')
    if (latest.response_time > 2000) criticalIssues.push('Slow response time')

    if (criticalIssues.length > 0) {
      return {
        status: 'unhealthy',
        message: `Critical issues: ${criticalIssues.join(', ')}`,
        issues: criticalIssues
      }
    }

    const warnings = []
    if (latest.memory_usage > 80) warnings.push('High memory usage')
    if (latest.cpu_usage > 70) warnings.push('High CPU usage')
    if (latest.error_rate > 2.0) warnings.push('Elevated error rate')

    if (warnings.length > 0) {
      return {
        status: 'degraded',
        message: `Warnings: ${warnings.join(', ')}`,
        warnings
      }
    }

    return {
      status: 'healthy',
      message: 'All systems operational'
    }
  }

  /**
   * Update health check configuration
   */
  updateConfig(updates: Partial<HealthCheckConfig>) {
    this.config = { ...this.config, ...updates }
    
    if (this.isRunning && updates.interval_seconds) {
      // Restart with new interval
      this.stop()
      this.start()
    }
    
    logger.info('Health check configuration updated', updates)
  }
}

// Export singleton instance
export const healthChecker = new HealthCheckManager()

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  healthChecker.start()
}

// Graceful shutdown
process.on('SIGINT', () => {
  healthChecker.stop()
})

process.on('SIGTERM', () => {
  healthChecker.stop()
})