/**
 * Uptime and Health Monitoring System
 * Monitors application health, API endpoints, and external dependencies
 */

import { logger } from '@/lib/logger'

// Health check configuration
interface HealthCheck {
  name: string
  url: string
  method: 'GET' | 'POST' | 'HEAD'
  timeout: number
  expectedStatus: number[]
  critical: boolean
  headers?: Record<string, string>
  body?: string
}

// Health check result
interface HealthCheckResult {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime: number
  statusCode?: number
  error?: string
  timestamp: number
  critical: boolean
}

// System health status
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  checks: HealthCheckResult[]
  lastCheck: number
  incidents: number
}

class UptimeMonitor {
  private healthChecks: HealthCheck[] = []
  private results: HealthCheckResult[] = []
  private intervalId: NodeJS.Timeout | null = null
  private checkInterval: number = 60000 // 1 minute
  private maxResults: number = 100
  private startTime: number = Date.now()

  constructor() {
    this.initializeHealthChecks()
    this.startMonitoring()
  }

  /**
   * Initialize default health checks
   */
  private initializeHealthChecks(): void {
    // Internal API endpoints
    this.addHealthCheck({
      name: 'Health API',
      url: '/api/health',
      method: 'GET',
      timeout: 5000,
      expectedStatus: [200],
      critical: true
    })

    this.addHealthCheck({
      name: 'Content API',
      url: '/api/admin/content?limit=1',
      method: 'GET',
      timeout: 10000,
      expectedStatus: [200, 401], // May be protected
      critical: false
    })

    // Database connectivity (through API)
    this.addHealthCheck({
      name: 'Database Connectivity',
      url: '/api/health/database',
      method: 'GET',
      timeout: 15000,
      expectedStatus: [200],
      critical: true
    })

    // External dependencies
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      this.addHealthCheck({
        name: 'Supabase Status',
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        method: 'HEAD',
        timeout: 10000,
        expectedStatus: [200, 401, 403], // Various auth states are OK
        critical: true,
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      })
    }

    // CDN and static assets
    this.addHealthCheck({
      name: 'Static Assets',
      url: '/favicon.ico',
      method: 'HEAD',
      timeout: 5000,
      expectedStatus: [200],
      critical: false
    })
  }

  /**
   * Add a health check
   */
  addHealthCheck(check: HealthCheck): void {
    this.healthChecks.push(check)
  }

  /**
   * Remove a health check
   */
  removeHealthCheck(name: string): void {
    this.healthChecks = this.healthChecks.filter(check => check.name !== name)
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // Run initial check
    this.runHealthChecks()

    // Set up interval for regular checks
    this.intervalId = setInterval(() => {
      this.runHealthChecks()
    }, this.checkInterval)

    // Run checks when page becomes visible (for client-side)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.runHealthChecks()
        }
      })
    }
  }

  /**
   * Run all health checks
   */
  private async runHealthChecks(): Promise<void> {
    const checkPromises = this.healthChecks.map(check => this.runSingleCheck(check))
    
    try {
      const results = await Promise.allSettled(checkPromises)
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.addResult(result.value)
        } else {
          // Create failed result for rejected promises
          const check = this.healthChecks[index]
          this.addResult({
            name: check.name,
            status: 'down',
            responseTime: 0,
            error: result.reason?.message || 'Health check failed',
            timestamp: Date.now(),
            critical: check.critical
          })
        }
      })

      // Log system health status
      const systemHealth = this.getSystemHealth()
      if (systemHealth.status !== 'healthy') {
        logger.warn('System health degraded', {
          action: 'health_check',
          metadata: {
            status: systemHealth.status,
            incidents: systemHealth.incidents,
            failedChecks: systemHealth.checks.filter(c => c.status !== 'up').map(c => c.name)
          }
        })
      }

    } catch (error) {
      logger.error('Failed to run health checks', {
        error: error instanceof Error ? error : new Error(String(error)),
        action: 'error_logged'
      })
    }
  }

  /**
   * Run a single health check
   */
  private async runSingleCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), check.timeout)

      const response = await fetch(check.url, {
        method: check.method,
        headers: check.headers,
        body: check.body,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      const responseTime = Date.now() - startTime
      const isExpectedStatus = check.expectedStatus.includes(response.status)
      
      return {
        name: check.name,
        status: isExpectedStatus ? 'up' : 'degraded',
        responseTime,
        statusCode: response.status,
        timestamp: Date.now(),
        critical: check.critical,
        error: isExpectedStatus ? undefined : `Unexpected status: ${response.status}`
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        name: check.name,
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        critical: check.critical
      }
    }
  }

  /**
   * Add a health check result
   */
  private addResult(result: HealthCheckResult): void {
    this.results.unshift(result)
    
    // Keep only the latest results
    if (this.results.length > this.maxResults) {
      this.results = this.results.slice(0, this.maxResults)
    }

    // Log critical failures
    if (result.critical && result.status === 'down') {
      logger.error(`Critical service down: ${result.name}`, {
        action: 'critical_service_down',
        metadata: {
          service: result.name,
          error: result.error,
          responseTime: result.responseTime
        }
      })
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    const recentResults = this.getRecentResults()
    const groupedResults = this.groupResultsByName(recentResults)
    
    const checks: HealthCheckResult[] = Object.values(groupedResults).map(results =>
      results[0] // Most recent result for each check
    )

    const criticalDown = checks.filter(c => c.critical && c.status === 'down').length
    const anyDown = checks.filter(c => c.status === 'down').length
    const anyDegraded = checks.filter(c => c.status === 'degraded').length

    let status: 'healthy' | 'degraded' | 'down'
    if (criticalDown > 0) {
      status = 'down'
    } else if (anyDown > 0 || anyDegraded > 0) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    return {
      status,
      uptime: Date.now() - this.startTime,
      checks,
      lastCheck: Math.max(...checks.map(c => c.timestamp), 0),
      incidents: this.countRecentIncidents()
    }
  }

  /**
   * Get recent results (last hour)
   */
  private getRecentResults(): HealthCheckResult[] {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    return this.results.filter(result => result.timestamp > oneHourAgo)
  }

  /**
   * Group results by check name
   */
  private groupResultsByName(results: HealthCheckResult[]): Record<string, HealthCheckResult[]> {
    return results.reduce((groups, result) => {
      if (!groups[result.name]) {
        groups[result.name] = []
      }
      groups[result.name].push(result)
      return groups
    }, {} as Record<string, HealthCheckResult[]>)
  }

  /**
   * Count recent incidents (failures in last 24 hours)
   */
  private countRecentIncidents(): number {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
    return this.results.filter(result => 
      result.timestamp > twentyFourHoursAgo && 
      result.status !== 'up'
    ).length
  }

  /**
   * Get uptime percentage for a specific service
   */
  getUptimePercentage(serviceName: string, hours: number = 24): number {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    const serviceResults = this.results.filter(result => 
      result.name === serviceName && result.timestamp > cutoffTime
    )

    if (serviceResults.length === 0) return 100

    const upResults = serviceResults.filter(result => result.status === 'up')
    return (upResults.length / serviceResults.length) * 100
  }

  /**
   * Get average response time for a service
   */
  getAverageResponseTime(serviceName: string, hours: number = 24): number {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    const serviceResults = this.results.filter(result => 
      result.name === serviceName && 
      result.timestamp > cutoffTime &&
      result.status === 'up'
    )

    if (serviceResults.length === 0) return 0

    const totalTime = serviceResults.reduce((sum, result) => sum + result.responseTime, 0)
    return totalTime / serviceResults.length
  }

  /**
   * Get all results
   */
  getAllResults(): HealthCheckResult[] {
    return [...this.results]
  }

  /**
   * Get results for a specific service
   */
  getServiceResults(serviceName: string, limit: number = 50): HealthCheckResult[] {
    return this.results
      .filter(result => result.name === serviceName)
      .slice(0, limit)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Set check interval
   */
  setCheckInterval(milliseconds: number): void {
    this.checkInterval = milliseconds
    
    // Restart monitoring with new interval
    if (this.intervalId) {
      this.stop()
      this.startMonitoring()
    }
  }
}

// Create singleton instance
const uptimeMonitor = new UptimeMonitor()

// Export convenience functions
export const getSystemHealth = () => uptimeMonitor.getSystemHealth()
export const getUptimePercentage = (service: string, hours?: number) => 
  uptimeMonitor.getUptimePercentage(service, hours)
export const getAverageResponseTime = (service: string, hours?: number) => 
  uptimeMonitor.getAverageResponseTime(service, hours)
export const addHealthCheck = (check: HealthCheck) => uptimeMonitor.addHealthCheck(check)
export const removeHealthCheck = (name: string) => uptimeMonitor.removeHealthCheck(name)
export const getAllHealthResults = () => uptimeMonitor.getAllResults()
export const getServiceResults = (service: string, limit?: number) => 
  uptimeMonitor.getServiceResults(service, limit)

// Export types
export type { HealthCheck, HealthCheckResult, SystemHealth }

export default uptimeMonitor