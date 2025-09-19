/**
 * Disaster Recovery Management System
 * Coordinates all disaster recovery components with centralized control
 */

import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditOutcome, AuditAction } from '@/lib/security/audit-logging'
import { databaseBackupManager, BackupMetadata } from './database-backup'
import { applicationBackupManager, ApplicationBackupMetadata } from './application-backup'
import { infrastructureMonitor, ServiceEndpoint } from './infrastructure-monitor'
import { recoveryTestingManager, RecoveryTestType, RecoveryTestResult } from './recovery-testing'

export interface DisasterRecoveryConfig {
  schedules: {
    databaseBackup: string // cron format
    applicationBackup: string
    recoveryTesting: string
    healthChecks: string
  }
  retention: {
    databaseBackups: number // days
    applicationBackups: number
    testResults: number
  }
  notifications: {
    enabled: boolean
    channels: string[]
    severity: 'all' | 'critical' | 'emergency'
  }
  autoFailover: {
    enabled: boolean
    threshold: number
    cooldown: number // minutes
  }
}

export interface DisasterRecoveryStatus {
  overall: 'healthy' | 'degraded' | 'critical'
  components: {
    database: {
      status: 'healthy' | 'degraded' | 'critical'
      lastBackup: Date | null
      backupCount: number
      totalSize: number
    }
    application: {
      status: 'healthy' | 'degraded' | 'critical'
      lastBackup: Date | null
      backupCount: number
      components: string[]
    }
    infrastructure: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      services: Record<string, string>
      failoverHistory: number
    }
    testing: {
      status: 'healthy' | 'degraded' | 'critical'
      lastTest: Date | null
      successRate: number
      recentFailures: number
    }
  }
  lastUpdate: Date
}

export interface RecoveryPlan {
  id: string
  name: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedRTO: number // minutes
  estimatedRPO: number // minutes
  steps: RecoveryStep[]
  dependencies: string[]
  autoExecute: boolean
}

export interface RecoveryStep {
  id: string
  name: string
  description: string
  type: 'database' | 'application' | 'infrastructure' | 'manual'
  action: string
  parameters: Record<string, any>
  timeout: number // minutes
  rollback?: RecoveryStep
}

const DEFAULT_CONFIG: DisasterRecoveryConfig = {
  schedules: {
    databaseBackup: '0 2 * * *', // Daily at 2 AM
    applicationBackup: '0 3 * * *', // Daily at 3 AM
    recoveryTesting: '0 4 * * 0', // Weekly on Sunday at 4 AM
    healthChecks: '*/5 * * * *' // Every 5 minutes
  },
  retention: {
    databaseBackups: 90,
    applicationBackups: 30,
    testResults: 30
  },
  notifications: {
    enabled: true,
    channels: ['email', 'slack'],
    severity: 'critical'
  },
  autoFailover: {
    enabled: true,
    threshold: 3,
    cooldown: 15
  }
}

class DisasterRecoveryManager {
  private config: DisasterRecoveryConfig
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map()
  private recoveryPlans: Map<string, RecoveryPlan> = new Map()
  private activeRecovery: string | null = null

  constructor(config: Partial<DisasterRecoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeRecoveryPlans()
  }

  /**
   * Initialize disaster recovery system
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing disaster recovery system')

      auditLogger.logSystemEvent({
        eventType: AuditEventType.SYSTEM_STARTUP,
        resource: 'disaster_recovery',
        action: AuditAction.EXECUTE,
        outcome: AuditOutcome.SUCCESS,
        details: { config: this.config }
      })

      // Start scheduled operations
      this.startScheduledOperations()

      // Initialize infrastructure monitoring
      await this.initializeInfrastructureMonitoring()

      // Perform initial health check
      const status = await this.getSystemStatus()
      
      logger.info('Disaster recovery system initialized successfully', {
        overallStatus: status.overall,
        components: Object.keys(status.components)
      })

    } catch (error) {
      logger.error('Failed to initialize disaster recovery system:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<DisasterRecoveryStatus> {
    try {
      // Get database backup status
      const dbStatus = databaseBackupManager.getBackupStatus()
      
      // Get application backup status  
      const appStatus = applicationBackupManager.getBackupStatus()
      
      // Get infrastructure health
      const infraHealth = infrastructureMonitor.getSystemHealth()
      
      // Get testing summary
      const testSummary = recoveryTestingManager.getTestResultsSummary(30)

      const status: DisasterRecoveryStatus = {
        overall: this.calculateOverallStatus(dbStatus, appStatus, infraHealth, testSummary),
        components: {
          database: {
            status: this.mapDatabaseStatus(dbStatus),
            lastBackup: dbStatus.lastBackup,
            backupCount: dbStatus.totalBackups,
            totalSize: dbStatus.totalSize
          },
          application: {
            status: this.mapApplicationStatus(appStatus),
            lastBackup: appStatus.lastBackup,
            backupCount: appStatus.totalBackups,
            components: appStatus.components
          },
          infrastructure: {
            status: infraHealth.overallStatus,
            services: Object.fromEntries(
              Object.entries(infraHealth.services).map(([name, service]) => [name, service.status])
            ),
            failoverHistory: infrastructureMonitor.getFailoverHistory().length
          },
          testing: {
            status: this.mapTestingStatus(testSummary),
            lastTest: testSummary.totalTests > 0 ? new Date() : null,
            successRate: testSummary.totalTests > 0 ? (testSummary.passedTests / testSummary.totalTests) * 100 : 0,
            recentFailures: testSummary.failedTests
          }
        },
        lastUpdate: new Date()
      }

      return status
    } catch (error) {
      logger.error('Failed to get system status:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  /**
   * Execute comprehensive backup across all systems
   */
  async executeComprehensiveBackup(description?: string): Promise<{
    database: BackupMetadata
    application: ApplicationBackupMetadata
  }> {
    try {
      logger.info('Starting comprehensive backup')

      auditLogger.logSystemEvent({
        eventType: AuditEventType.BACKUP_CREATED,
        resource: 'comprehensive',
        action: AuditAction.BACKUP,
        outcome: AuditOutcome.SUCCESS,
        details: { description }
      })

      // Execute database backup
      const databaseBackup = await databaseBackupManager.createFullBackup(
        description ? `DB: ${description}` : 'Comprehensive backup - Database'
      )

      // Execute application backup
      const applicationBackup = await applicationBackupManager.createApplicationBackup(
        description ? `App: ${description}` : 'Comprehensive backup - Application'
      )

      logger.info('Comprehensive backup completed successfully', {
        databaseBackupId: databaseBackup.id,
        applicationBackupId: applicationBackup.id,
        totalSize: databaseBackup.size + applicationBackup.size
      })

      return { database: databaseBackup, application: applicationBackup }

    } catch (error) {
      logger.error('Comprehensive backup failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      
      auditLogger.logSystemEvent({
        eventType: AuditEventType.BACKUP_CREATED,
        resource: 'comprehensive',
        action: AuditAction.BACKUP,
        outcome: AuditOutcome.FAILURE,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })

      throw error
    }
  }

  /**
   * Execute recovery plan
   */
  async executeRecoveryPlan(planId: string, options: {
    dryRun?: boolean
    skipConfirmation?: boolean
  } = {}): Promise<{ success: boolean; steps: any[] }> {
    try {
      const plan = this.recoveryPlans.get(planId)
      if (!plan) {
        throw new Error(`Recovery plan ${planId} not found`)
      }

      if (this.activeRecovery && !options.dryRun) {
        throw new Error('Another recovery operation is already in progress')
      }

      logger.info(`Executing recovery plan: ${plan.name}`, { planId, options })

      if (!options.dryRun) {
        this.activeRecovery = planId
      }

      auditLogger.logSystemEvent({
        eventType: AuditEventType.SYSTEM_STARTUP,
        resource: 'recovery_plan',
        action: AuditAction.EXECUTE,
        outcome: AuditOutcome.SUCCESS,
        details: { planId, planName: plan.name, dryRun: options.dryRun }
      })

      const executedSteps: any[] = []

      // Execute each step in the recovery plan
      for (const step of plan.steps) {
        try {
          logger.info(`Executing recovery step: ${step.name}`, { stepId: step.id })

          const stepResult = await this.executeRecoveryStep(step, options.dryRun || false)
          executedSteps.push({
            stepId: step.id,
            name: step.name,
            status: 'completed',
            result: stepResult,
            timestamp: new Date()
          })

          logger.info(`Recovery step completed: ${step.name}`)

        } catch (error) {
          logger.error(`Recovery step failed: ${step.name}`, { error: error instanceof Error ? error.message : 'Unknown error' })
          
          const stepResult: any = {
            stepId: step.id,
            name: step.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          }
          
          executedSteps.push(stepResult)

          // Execute rollback if available
          if (step.rollback && !options.dryRun) {
            try {
              logger.info(`Executing rollback for step: ${step.name}`)
              await this.executeRecoveryStep(step.rollback, false)
              stepResult.rollback = 'completed'
            } catch (rollbackError) {
              logger.error(`Rollback failed for step: ${step.name}`, { error: rollbackError instanceof Error ? rollbackError.message : 'Unknown error' })
              stepResult.rollback = 'failed'
            }
          }

          // Stop execution on critical failures unless configured otherwise
          if (plan.priority === 'critical') {
            break
          }
        }
      }

      if (!options.dryRun) {
        this.activeRecovery = null
      }

      const success = executedSteps.every(step => step.status === 'completed')
      
      logger.info(`Recovery plan execution ${success ? 'completed' : 'failed'}`, {
        planId,
        stepsExecuted: executedSteps.length,
        successfulSteps: executedSteps.filter(s => s.status === 'completed').length
      })

      return { success, steps: executedSteps }

    } catch (error) {
      if (this.activeRecovery === planId) {
        this.activeRecovery = null
      }

      logger.error(`Recovery plan execution failed: ${planId}`, { error: error instanceof Error ? error.message : 'Unknown error' })
      
      auditLogger.logSystemEvent({
        eventType: AuditEventType.SYSTEM_STARTUP,
        resource: 'recovery_plan',
        action: AuditAction.EXECUTE,
        outcome: AuditOutcome.FAILURE,
        details: { planId, error: error instanceof Error ? error.message : 'Unknown error' }
      })

      throw error
    }
  }

  /**
   * Run comprehensive disaster recovery test
   */
  async runComprehensiveTest(): Promise<RecoveryTestResult[]> {
    try {
      logger.info('Starting comprehensive disaster recovery test')

      const testTypes: RecoveryTestType[] = [
        RecoveryTestType.DATABASE_BACKUP_RESTORE,
        RecoveryTestType.APPLICATION_STATE_RESTORE,
        RecoveryTestType.INFRASTRUCTURE_FAILOVER,
        RecoveryTestType.END_TO_END_RECOVERY
      ]

      const results: RecoveryTestResult[] = []

      for (const testType of testTypes) {
        try {
          const result = await recoveryTestingManager.runRecoveryTest(testType)
          results.push(result)
        } catch (error) {
          logger.error(`Recovery test ${testType} failed:`, { error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }

      const overallSuccess = results.every(r => r.status === 'passed')
      
      logger.info('Comprehensive disaster recovery test completed', {
        totalTests: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        overallSuccess
      })

      return results

    } catch (error) {
      logger.error('Comprehensive disaster recovery test failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  /**
   * Get available recovery plans
   */
  getRecoveryPlans(): RecoveryPlan[] {
    return Array.from(this.recoveryPlans.values())
      .sort((a, b) => {
        const priorities = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorities[b.priority] - priorities[a.priority]
      })
  }

  /**
   * Stop all disaster recovery operations
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down disaster recovery system')

      // Stop all scheduled jobs
      for (const [jobName, interval] of this.scheduledJobs.entries()) {
        clearInterval(interval)
        this.scheduledJobs.delete(jobName)
        logger.info(`Stopped scheduled job: ${jobName}`)
      }

      // Stop infrastructure monitoring
      infrastructureMonitor.stopMonitoring()

      // Cancel active recovery if running
      if (this.activeRecovery) {
        logger.warn(`Cancelling active recovery operation: ${this.activeRecovery}`)
        this.activeRecovery = null
      }

      auditLogger.logSystemEvent({
        eventType: AuditEventType.SYSTEM_SHUTDOWN,
        resource: 'disaster_recovery',
        action: AuditAction.EXECUTE,
        outcome: AuditOutcome.SUCCESS,
        details: {}
      })

      logger.info('Disaster recovery system shutdown completed')

    } catch (error) {
      logger.error('Error during disaster recovery shutdown:', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  // Private methods

  private startScheduledOperations(): void {
    // Schedule database backups
    const dbBackupInterval = this.parseCronToInterval(this.config.schedules.databaseBackup)
    const dbBackupJob = setInterval(async () => {
      try {
        await databaseBackupManager.createFullBackup('Scheduled backup')
        await databaseBackupManager.cleanupOldBackups()
      } catch (error) {
        logger.error('Scheduled database backup failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }, dbBackupInterval)
    this.scheduledJobs.set('database_backup', dbBackupJob)

    // Schedule application backups
    const appBackupInterval = this.parseCronToInterval(this.config.schedules.applicationBackup)
    const appBackupJob = setInterval(async () => {
      try {
        await applicationBackupManager.createApplicationBackup('Scheduled backup')
      } catch (error) {
        logger.error('Scheduled application backup failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }, appBackupInterval)
    this.scheduledJobs.set('application_backup', appBackupJob)

    // Schedule recovery testing
    const testingInterval = this.parseCronToInterval(this.config.schedules.recoveryTesting)
    const testingJob = setInterval(async () => {
      try {
        await recoveryTestingManager.runTestSuite('comprehensive')
      } catch (error) {
        logger.error('Scheduled recovery testing failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }, testingInterval)
    this.scheduledJobs.set('recovery_testing', testingJob)

    logger.info('Scheduled disaster recovery operations started')
  }

  private async initializeInfrastructureMonitoring(): Promise<void> {
    // Register core services for monitoring
    const coreServices: ServiceEndpoint[] = [
      {
        id: 'main_app',
        name: 'Main Application',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        type: 'primary',
        priority: 1,
        healthCheck: {
          path: '/api/health',
          expectedStatus: 200,
          expectedResponse: 'OK',
          timeout: 5000
        }
      },
      {
        id: 'database',
        name: 'Database',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        type: 'primary',
        priority: 1,
        healthCheck: {
          path: '/rest/v1/',
          expectedStatus: 200,
          timeout: 10000
        }
      }
    ]

    if (coreServices.some(service => service.url)) {
      infrastructureMonitor.registerService('core', coreServices.filter(s => s.url))
      infrastructureMonitor.startMonitoring()
    }
  }

  private async executeRecoveryStep(step: RecoveryStep, dryRun: boolean): Promise<any> {
    if (dryRun) {
      logger.info(`[DRY RUN] Would execute step: ${step.name}`)
      return { simulated: true, step: step.name }
    }

    switch (step.type) {
      case 'database':
        return await this.executeDatabaseRecoveryStep(step)
      case 'application':
        return await this.executeApplicationRecoveryStep(step)
      case 'infrastructure':
        return await this.executeInfrastructureRecoveryStep(step)
      case 'manual':
        return { manual: true, instructions: step.description }
      default:
        throw new Error(`Unknown recovery step type: ${step.type}`)
    }
  }

  private async executeDatabaseRecoveryStep(step: RecoveryStep): Promise<any> {
    switch (step.action) {
      case 'restore_backup':
        const backupId = step.parameters.backupId
        return await databaseBackupManager.restoreFromBackup(backupId, step.parameters.options)
      case 'create_backup':
        return await databaseBackupManager.createFullBackup(step.parameters.description)
      default:
        throw new Error(`Unknown database recovery action: ${step.action}`)
    }
  }

  private async executeApplicationRecoveryStep(step: RecoveryStep): Promise<any> {
    switch (step.action) {
      case 'restore_state':
        const backupId = step.parameters.backupId
        return await applicationBackupManager.restoreApplicationState(backupId, step.parameters.options)
      case 'create_backup':
        return await applicationBackupManager.createApplicationBackup(step.parameters.description)
      default:
        throw new Error(`Unknown application recovery action: ${step.action}`)
    }
  }

  private async executeInfrastructureRecoveryStep(step: RecoveryStep): Promise<any> {
    switch (step.action) {
      case 'manual_failover':
        return await infrastructureMonitor.performManualFailover(
          step.parameters.serviceName,
          step.parameters.targetEndpoint,
          step.parameters.reason
        )
      default:
        throw new Error(`Unknown infrastructure recovery action: ${step.action}`)
    }
  }

  private initializeRecoveryPlans(): void {
    // Database Recovery Plan
    this.recoveryPlans.set('database_recovery', {
      id: 'database_recovery',
      name: 'Database Recovery Plan',
      description: 'Comprehensive database recovery from backup',
      priority: 'critical',
      estimatedRTO: 30, // 30 minutes
      estimatedRPO: 60, // 1 hour
      autoExecute: false,
      dependencies: [],
      steps: [
        {
          id: 'db_restore',
          name: 'Restore Database from Latest Backup',
          description: 'Restore database from the most recent backup',
          type: 'database',
          action: 'restore_backup',
          parameters: { backupId: 'latest', options: { overwriteExisting: true } },
          timeout: 30
        }
      ]
    })

    // Application Recovery Plan
    this.recoveryPlans.set('application_recovery', {
      id: 'application_recovery',
      name: 'Application Recovery Plan',
      description: 'Restore application state and configuration',
      priority: 'high',
      estimatedRTO: 15,
      estimatedRPO: 30,
      autoExecute: false,
      dependencies: ['database_recovery'],
      steps: [
        {
          id: 'app_restore',
          name: 'Restore Application State',
          description: 'Restore CMS content and system settings',
          type: 'application',
          action: 'restore_state',
          parameters: { backupId: 'latest', options: { preserveExisting: false } },
          timeout: 15
        }
      ]
    })

    // Full System Recovery Plan
    this.recoveryPlans.set('full_system_recovery', {
      id: 'full_system_recovery',
      name: 'Full System Recovery Plan',
      description: 'Complete system recovery including database, application, and infrastructure',
      priority: 'critical',
      estimatedRTO: 60,
      estimatedRPO: 120,
      autoExecute: false,
      dependencies: [],
      steps: [
        {
          id: 'infra_check',
          name: 'Verify Infrastructure Health',
          description: 'Check infrastructure status before recovery',
          type: 'manual',
          action: 'verify_infrastructure',
          parameters: {},
          timeout: 5
        },
        {
          id: 'db_restore',
          name: 'Restore Database',
          description: 'Restore database from backup',
          type: 'database',
          action: 'restore_backup',
          parameters: { backupId: 'latest', options: { overwriteExisting: true } },
          timeout: 30
        },
        {
          id: 'app_restore',
          name: 'Restore Application',
          description: 'Restore application state',
          type: 'application',
          action: 'restore_state',
          parameters: { backupId: 'latest', options: { preserveExisting: false } },
          timeout: 15
        }
      ]
    })
  }

  private calculateOverallStatus(dbStatus: any, appStatus: any, infraHealth: any, testSummary: any): 'healthy' | 'degraded' | 'critical' {
    const dbHealthy = dbStatus.totalBackups > 0 && dbStatus.lastBackup && (Date.now() - dbStatus.lastBackup.getTime()) < 25 * 60 * 60 * 1000 // 25 hours
    const appHealthy = appStatus.totalBackups > 0 && appStatus.lastBackup && (Date.now() - appStatus.lastBackup.getTime()) < 25 * 60 * 60 * 1000
    const infraHealthy = infraHealth.overallStatus === 'healthy'
    const testHealthy = testSummary.totalTests === 0 || testSummary.averageScore >= 80

    const healthyComponents = [dbHealthy, appHealthy, infraHealthy, testHealthy].filter(Boolean).length

    if (healthyComponents === 4) return 'healthy'
    if (healthyComponents >= 2) return 'degraded'
    return 'critical'
  }

  private mapDatabaseStatus(status: any): 'healthy' | 'degraded' | 'critical' {
    if (status.totalBackups === 0) return 'critical'
    if (!status.lastBackup || (Date.now() - status.lastBackup.getTime()) > 25 * 60 * 60 * 1000) return 'degraded'
    return 'healthy'
  }

  private mapApplicationStatus(status: any): 'healthy' | 'degraded' | 'critical' {
    if (status.totalBackups === 0) return 'critical'
    if (!status.lastBackup || (Date.now() - status.lastBackup.getTime()) > 25 * 60 * 60 * 1000) return 'degraded'
    return 'healthy'
  }

  private mapTestingStatus(summary: any): 'healthy' | 'degraded' | 'critical' {
    if (summary.totalTests === 0) return 'degraded' // No tests run yet
    if (summary.averageScore >= 90) return 'healthy'
    if (summary.averageScore >= 70) return 'degraded'
    return 'critical'
  }

  private parseCronToInterval(cron: string): number {
    // Simplified cron parsing - in production would use proper cron parser
    // For now, return appropriate intervals based on common patterns
    if (cron.includes('* * *')) return 24 * 60 * 60 * 1000 // Daily
    if (cron.includes('* * 0')) return 7 * 24 * 60 * 60 * 1000 // Weekly
    if (cron.includes('*/5')) return 5 * 60 * 1000 // Every 5 minutes
    return 60 * 60 * 1000 // Default: hourly
  }
}

// Export singleton instance
export const disasterRecoveryManager = new DisasterRecoveryManager()

// Export types and class
export { DisasterRecoveryManager }