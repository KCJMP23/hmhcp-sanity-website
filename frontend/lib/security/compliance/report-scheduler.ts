/**
 * Compliance Report Scheduling System
 * 
 * Automated scheduling and generation of compliance reports:
 * - Periodic report generation (daily, weekly, monthly, quarterly)
 * - Custom report schedules with cron expressions
 * - Email delivery and notifications
 * - Report retention and cleanup
 * - Emergency report triggers
 * 
 * Story 1.6 Task 8: Compliance Reporting & Audit Exports
 */

import * as crypto from 'crypto'
import * as cron from 'node-cron'
import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditSeverity, ComplianceFramework } from '../audit-logging'
import { complianceReporter, type ComplianceReportOptions } from './compliance-reporter'

export interface ReportSchedule {
  id: string
  name: string
  description: string
  framework: ComplianceFramework
  reportType: 'summary' | 'detailed' | 'violation' | 'access_control' | 'data_integrity'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'
  cronExpression?: string
  enabled: boolean
  reportOptions: ComplianceReportOptions
  deliveryOptions: DeliveryOptions
  retentionDays: number
  lastGenerated?: string
  nextScheduled?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface DeliveryOptions {
  emailEnabled: boolean
  emailRecipients: string[]
  emailSubject?: string
  emailTemplate?: string
  webhookEnabled: boolean
  webhookUrl?: string
  webhookHeaders?: Record<string, string>
  storageEnabled: boolean
  storageLocation?: string
  notificationChannels: string[]
}

export interface ScheduledReportExecution {
  id: string
  scheduleId: string
  executedAt: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  reportId?: string
  filePath?: string
  fileSize?: number
  executionTime?: number
  error?: string
  deliveryStatus: {
    email: 'pending' | 'sent' | 'failed'
    webhook: 'pending' | 'sent' | 'failed'
    storage: 'pending' | 'saved' | 'failed'
  }
}

export interface ReportSchedulerConfig {
  maxConcurrentReports: number
  defaultRetentionDays: number
  emailServiceEnabled: boolean
  webhookTimeout: number
  maxReportSize: number
}

export class ReportScheduler {
  private static instance: ReportScheduler
  private schedules: Map<string, ReportSchedule> = new Map()
  private cronJobs: Map<string, cron.ScheduledTask> = new Map()
  private runningExecutions: Map<string, ScheduledReportExecution> = new Map()
  private config: ReportSchedulerConfig
  private isInitialized: boolean = false
  
  private constructor(config?: ReportSchedulerConfig) {
    this.config = {
      maxConcurrentReports: 5,
      defaultRetentionDays: 90,
      emailServiceEnabled: process.env.EMAIL_SERVICE_ENABLED === 'true',
      webhookTimeout: 30000,
      maxReportSize: 100 * 1024 * 1024, // 100MB
      ...config
    }
  }
  
  public static getInstance(config?: ReportSchedulerConfig): ReportScheduler {
    if (!ReportScheduler.instance) {
      ReportScheduler.instance = new ReportScheduler(config)
    }
    return ReportScheduler.instance
  }
  
  /**
   * Initialize report scheduler
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      logger.info('Initializing report scheduler')
      
      // Load schedules from database
      await this.loadSchedules()
      
      // Start scheduled jobs
      await this.startScheduledJobs()
      
      // Schedule cleanup task
      this.scheduleCleanupTask()
      
      this.isInitialized = true
      logger.info(`Report scheduler initialized with ${this.schedules.size} schedules`)
      
    } catch (error) {
      logger.error('Failed to initialize report scheduler', { error })
      throw error
    }
  }
  
  /**
   * Create new report schedule
   */
  async createSchedule(schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean
    scheduleId?: string
    error?: string
  }> {
    try {
      const scheduleId = crypto.randomUUID()
      const now = new Date().toISOString()
      
      const newSchedule: ReportSchedule = {
        ...schedule,
        id: scheduleId,
        createdAt: now,
        updatedAt: now,
        nextScheduled: this.calculateNextExecution(schedule.frequency, schedule.cronExpression)
      }
      
      // Validate cron expression if custom frequency
      if (schedule.frequency === 'custom') {
        if (!schedule.cronExpression || !cron.validate(schedule.cronExpression)) {
          return { success: false, error: 'Invalid cron expression' }
        }
      }
      
      // Store in database
      const supabase = createClient()
      const { error } = await supabase
        .from('report_schedules')
        .insert(newSchedule)
      
      if (error) {
        return { success: false, error: 'Failed to store schedule' }
      }
      
      // Add to memory and start cron job
      this.schedules.set(scheduleId, newSchedule)
      
      if (newSchedule.enabled) {
        await this.startCronJob(newSchedule)
      }
      
      // Log schedule creation
      await auditLogger.logEvent({
        event_type: AuditEventType.SYSTEM_CONFIG,
        severity: AuditSeverity.INFO,
        user_id: schedule.createdBy,
        session_id: null,
        resource_type: 'report_schedule',
        resource_id: scheduleId,
        action_performed: 'report_schedule_created',
        client_ip: '127.0.0.1',
        user_agent: 'Report-Scheduler',
        request_id: crypto.randomUUID(),
        compliance_frameworks: [schedule.framework],
        sensitive_data_involved: false,
        status: 'success'
      })
      
      return { success: true, scheduleId }
      
    } catch (error) {
      logger.error('Failed to create report schedule', { error })
      return { success: false, error: 'Schedule creation failed' }
    }
  }
  
  /**
   * Update existing schedule
   */
  async updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const existingSchedule = this.schedules.get(scheduleId)
      if (!existingSchedule) {
        return { success: false, error: 'Schedule not found' }
      }
      
      const updatedSchedule: ReportSchedule = {
        ...existingSchedule,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // Validate cron expression if changed
      if (updates.frequency === 'custom' && updates.cronExpression) {
        if (!cron.validate(updates.cronExpression)) {
          return { success: false, error: 'Invalid cron expression' }
        }
      }
      
      // Update next scheduled time if frequency changed
      if (updates.frequency || updates.cronExpression) {
        updatedSchedule.nextScheduled = this.calculateNextExecution(
          updatedSchedule.frequency,
          updatedSchedule.cronExpression
        )
      }
      
      // Update in database
      const supabase = createClient()
      const { error } = await supabase
        .from('report_schedules')
        .update(updatedSchedule)
        .eq('id', scheduleId)
      
      if (error) {
        return { success: false, error: 'Failed to update schedule' }
      }
      
      // Update in memory
      this.schedules.set(scheduleId, updatedSchedule)
      
      // Restart cron job if enabled
      this.stopCronJob(scheduleId)
      if (updatedSchedule.enabled) {
        await this.startCronJob(updatedSchedule)
      }
      
      return { success: true }
      
    } catch (error) {
      logger.error('Failed to update report schedule', { error, scheduleId })
      return { success: false, error: 'Schedule update failed' }
    }
  }
  
  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop cron job
      this.stopCronJob(scheduleId)
      
      // Remove from database
      const supabase = createClient()
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', scheduleId)
      
      if (error) {
        return { success: false, error: 'Failed to delete schedule' }
      }
      
      // Remove from memory
      this.schedules.delete(scheduleId)
      
      return { success: true }
      
    } catch (error) {
      logger.error('Failed to delete report schedule', { error, scheduleId })
      return { success: false, error: 'Schedule deletion failed' }
    }
  }
  
  /**
   * Execute report schedule manually
   */
  async executeSchedule(scheduleId: string): Promise<{
    success: boolean
    executionId?: string
    error?: string
  }> {
    try {
      const schedule = this.schedules.get(scheduleId)
      if (!schedule) {
        return { success: false, error: 'Schedule not found' }
      }
      
      // Check concurrent execution limit
      if (this.runningExecutions.size >= this.config.maxConcurrentReports) {
        return { success: false, error: 'Maximum concurrent reports reached' }
      }
      
      const executionId = crypto.randomUUID()
      const execution: ScheduledReportExecution = {
        id: executionId,
        scheduleId,
        executedAt: new Date().toISOString(),
        status: 'queued',
        deliveryStatus: {
          email: 'pending',
          webhook: 'pending',
          storage: 'pending'
        }
      }
      
      // Store execution record
      await this.storeExecution(execution)
      this.runningExecutions.set(executionId, execution)
      
      // Execute asynchronously
      setImmediate(() => this.performReportExecution(execution, schedule))
      
      return { success: true, executionId }
      
    } catch (error) {
      logger.error('Failed to execute report schedule', { error, scheduleId })
      return { success: false, error: 'Schedule execution failed' }
    }
  }
  
  /**
   * Get schedule status
   */
  getScheduleStatus(scheduleId: string): {
    exists: boolean
    schedule?: ReportSchedule
    isRunning: boolean
    lastExecution?: ScheduledReportExecution
  } {
    const schedule = this.schedules.get(scheduleId)
    const isRunning = Array.from(this.runningExecutions.values())
      .some(exec => exec.scheduleId === scheduleId && exec.status === 'running')
    
    return {
      exists: !!schedule,
      schedule,
      isRunning,
      lastExecution: this.getLastExecution(scheduleId)
    }
  }
  
  /**
   * Load schedules from database
   */
  private async loadSchedules(): Promise<void> {
    try {
      const supabase = createClient()
      const { data: schedules, error } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('enabled', true)
      
      if (error) {
        logger.error('Failed to load report schedules', { error })
        return
      }
      
      this.schedules.clear()
      for (const schedule of schedules || []) {
        this.schedules.set(schedule.id, schedule)
      }
      
    } catch (error) {
      logger.error('Error loading report schedules', { error })
    }
  }
  
  /**
   * Start all scheduled cron jobs
   */
  private async startScheduledJobs(): Promise<void> {
    for (const schedule of this.schedules.values()) {
      if (schedule.enabled) {
        await this.startCronJob(schedule)
      }
    }
  }
  
  /**
   * Start cron job for schedule
   */
  private async startCronJob(schedule: ReportSchedule): Promise<void> {
    try {
      const cronExpression = this.getCronExpression(schedule.frequency, schedule.cronExpression)
      
      if (!cronExpression || !cron.validate(cronExpression)) {
        logger.error('Invalid cron expression for schedule', { scheduleId: schedule.id, cronExpression })
        return
      }
      
      const task = cron.schedule(cronExpression, () => {
        this.executeSchedule(schedule.id).catch(error => {
          logger.error('Scheduled report execution failed', { error, scheduleId: schedule.id })
        })
      }, {
        scheduled: true,
        timezone: 'UTC'
      })
      
      this.cronJobs.set(schedule.id, task)
      logger.info('Started cron job for schedule', { scheduleId: schedule.id, cronExpression })
      
    } catch (error) {
      logger.error('Failed to start cron job', { error, scheduleId: schedule.id })
    }
  }
  
  /**
   * Stop cron job for schedule
   */
  private stopCronJob(scheduleId: string): void {
    const job = this.cronJobs.get(scheduleId)
    if (job) {
      job.stop()
      this.cronJobs.delete(scheduleId)
      logger.info('Stopped cron job for schedule', { scheduleId })
    }
  }
  
  /**
   * Perform report execution
   */
  private async performReportExecution(
    execution: ScheduledReportExecution,
    schedule: ReportSchedule
  ): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Update status to running
      execution.status = 'running'
      await this.updateExecution(execution)
      
      logger.info('Starting scheduled report generation', { 
        executionId: execution.id, 
        scheduleId: schedule.id 
      })
      
      // Calculate date range for report
      const dateRange = this.calculateDateRange(schedule.frequency)
      const reportOptions: ComplianceReportOptions = {
        ...schedule.reportOptions,
        dateRange
      }
      
      // Generate report
      const reportResult = await complianceReporter.generateReport(reportOptions)
      
      if (!reportResult.success) {
        throw new Error(reportResult.error || 'Report generation failed')
      }
      
      // Update execution with report details
      execution.reportId = reportResult.reportId
      execution.filePath = reportResult.exportedFile ? 'generated' : undefined
      execution.fileSize = reportResult.exportedFile?.length || 0
      execution.executionTime = Date.now() - startTime
      execution.status = 'completed'
      
      // Deliver report
      await this.deliverReport(execution, schedule, reportResult.exportedFile)
      
      // Update schedule's last generated time
      schedule.lastGenerated = new Date().toISOString()
      schedule.nextScheduled = this.calculateNextExecution(schedule.frequency, schedule.cronExpression)
      await this.updateScheduleInDatabase(schedule)
      
      logger.info('Scheduled report generation completed', { 
        executionId: execution.id,
        executionTime: execution.executionTime
      })
      
    } catch (error) {
      logger.error('Scheduled report execution failed', { 
        error, 
        executionId: execution.id,
        scheduleId: schedule.id 
      })
      
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      execution.executionTime = Date.now() - startTime
    } finally {
      // Update execution record
      await this.updateExecution(execution)
      
      // Remove from running executions
      this.runningExecutions.delete(execution.id)
    }
  }
  
  /**
   * Deliver report via configured channels
   */
  private async deliverReport(
    execution: ScheduledReportExecution,
    schedule: ReportSchedule,
    reportFile?: Buffer
  ): Promise<void> {
    const { deliveryOptions } = schedule
    
    // Email delivery
    if (deliveryOptions.emailEnabled && reportFile) {
      try {
        await this.sendReportEmail(schedule, reportFile, execution)
        execution.deliveryStatus.email = 'sent'
      } catch (error) {
        logger.error('Failed to send report email', { error, executionId: execution.id })
        execution.deliveryStatus.email = 'failed'
      }
    }
    
    // Webhook delivery
    if (deliveryOptions.webhookEnabled && deliveryOptions.webhookUrl) {
      try {
        await this.sendWebhookNotification(schedule, execution)
        execution.deliveryStatus.webhook = 'sent'
      } catch (error) {
        logger.error('Failed to send webhook notification', { error, executionId: execution.id })
        execution.deliveryStatus.webhook = 'failed'
      }
    }
    
    // Storage delivery
    if (deliveryOptions.storageEnabled && reportFile) {
      try {
        await this.storeReport(schedule, reportFile, execution)
        execution.deliveryStatus.storage = 'saved'
      } catch (error) {
        logger.error('Failed to store report', { error, executionId: execution.id })
        execution.deliveryStatus.storage = 'failed'
      }
    }
  }
  
  /**
   * Schedule cleanup task for old reports
   */
  private scheduleCleanupTask(): void {
    // Run cleanup daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.cleanupOldReports()
      } catch (error) {
        logger.error('Report cleanup failed', { error })
      }
    })
  }
  
  /**
   * Cleanup old reports based on retention policies
   */
  private async cleanupOldReports(): Promise<void> {
    try {
      const supabase = createClient()
      
      // Get schedules with retention policies
      for (const schedule of this.schedules.values()) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - schedule.retentionDays)
        
        const { error } = await supabase
          .from('scheduled_report_executions')
          .delete()
          .eq('schedule_id', schedule.id)
          .lt('executed_at', cutoffDate.toISOString())
        
        if (error) {
          logger.error('Failed to cleanup old reports for schedule', { 
            error, 
            scheduleId: schedule.id 
          })
        }
      }
      
      logger.info('Report cleanup completed')
      
    } catch (error) {
      logger.error('Report cleanup failed', { error })
    }
  }
  
  // Utility methods
  private getCronExpression(frequency: string, customExpression?: string): string {
    switch (frequency) {
      case 'daily':
        return '0 6 * * *' // 6 AM daily
      case 'weekly':
        return '0 6 * * 1' // 6 AM every Monday
      case 'monthly':
        return '0 6 1 * *' // 6 AM on 1st of every month
      case 'quarterly':
        return '0 6 1 */3 *' // 6 AM on 1st of every quarter
      case 'custom':
        return customExpression || '0 6 * * *'
      default:
        return '0 6 * * *'
    }
  }
  
  private calculateNextExecution(frequency: string, cronExpression?: string): string {
    const expression = this.getCronExpression(frequency, cronExpression)
    // Simplified next execution calculation
    // In production, use a proper cron parser
    const nextDate = new Date()
    nextDate.setHours(nextDate.getHours() + 24) // Simple daily increment
    return nextDate.toISOString()
  }
  
  private calculateDateRange(frequency: string): { start: string; end: string } {
    const end = new Date()
    const start = new Date()
    
    switch (frequency) {
      case 'daily':
        start.setDate(end.getDate() - 1)
        break
      case 'weekly':
        start.setDate(end.getDate() - 7)
        break
      case 'monthly':
        start.setMonth(end.getMonth() - 1)
        break
      case 'quarterly':
        start.setMonth(end.getMonth() - 3)
        break
      default:
        start.setDate(end.getDate() - 7)
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }
  
  private async storeExecution(execution: ScheduledReportExecution): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('scheduled_report_executions').insert(execution)
    } catch (error) {
      logger.error('Failed to store execution record', { error, executionId: execution.id })
    }
  }
  
  private async updateExecution(execution: ScheduledReportExecution): Promise<void> {
    try {
      const supabase = createClient()
      await supabase
        .from('scheduled_report_executions')
        .update(execution)
        .eq('id', execution.id)
    } catch (error) {
      logger.error('Failed to update execution record', { error, executionId: execution.id })
    }
  }
  
  private async updateScheduleInDatabase(schedule: ReportSchedule): Promise<void> {
    try {
      const supabase = createClient()
      await supabase
        .from('report_schedules')
        .update(schedule)
        .eq('id', schedule.id)
    } catch (error) {
      logger.error('Failed to update schedule in database', { error, scheduleId: schedule.id })
    }
  }
  
  private getLastExecution(scheduleId: string): ScheduledReportExecution | undefined {
    // In production, this would query the database
    return Array.from(this.runningExecutions.values())
      .filter(exec => exec.scheduleId === scheduleId)
      .sort((a, b) => b.executedAt.localeCompare(a.executedAt))[0]
  }
  
  // Delivery methods (simplified implementations)
  private async sendReportEmail(
    schedule: ReportSchedule, 
    reportFile: Buffer, 
    execution: ScheduledReportExecution
  ): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    logger.info('Email delivery simulated', { 
      scheduleId: schedule.id,
      recipients: schedule.deliveryOptions.emailRecipients 
    })
  }
  
  private async sendWebhookNotification(
    schedule: ReportSchedule, 
    execution: ScheduledReportExecution
  ): Promise<void> {
    // In production, make HTTP request to webhook URL
    logger.info('Webhook notification simulated', { 
      scheduleId: schedule.id,
      webhookUrl: schedule.deliveryOptions.webhookUrl 
    })
  }
  
  private async storeReport(
    schedule: ReportSchedule, 
    reportFile: Buffer, 
    execution: ScheduledReportExecution
  ): Promise<void> {
    // In production, store in configured storage location
    logger.info('Report storage simulated', { 
      scheduleId: schedule.id,
      storageLocation: schedule.deliveryOptions.storageLocation 
    })
  }
}

// Export singleton instance
export const reportScheduler = ReportScheduler.getInstance()

export default ReportScheduler