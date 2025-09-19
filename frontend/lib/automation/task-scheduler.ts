/**
 * Task Scheduler Framework
 * Story 1.1: Admin Foundation & Core Automation Infrastructure
 * 
 * Provides cron-like scheduling capabilities for recurring tasks
 * 
 * @module TaskScheduler
 * @description Enterprise-grade cron scheduler for healthcare automation tasks.
 * Implements singleton pattern for centralized scheduling management with timezone support.
 * 
 * @example
 * ```typescript
 * const scheduler = TaskScheduler.getInstance()
 * await scheduler.initialize()
 * 
 * // Schedule a new task
 * await scheduler.scheduleTask({
 *   id: 'daily-report',
 *   name: 'Daily Report Generation',
 *   cronExpression: '0 9 * * *',
 *   taskType: TaskType.REPORT_GENERATION,
 *   payload: { format: 'pdf' },
 *   priority: TaskPriority.HIGH,
 *   timezone: 'America/New_York',
 *   isActive: true
 * })
 * 
 * // Manual trigger
 * const jobId = await scheduler.runTaskNow('daily-report')
 * ```
 */

import { CronJob, CronTime } from 'cron'
import { queueManager } from './queue-manager'
import { TaskType, TaskPriority } from '@/types/admin'
import { logger } from '@/lib/logging/client-safe-logger'

/**
 * Scheduled task configuration
 * @interface ScheduledTask
 */
export interface ScheduledTask {
  /** Unique task identifier */
  id: string
  /** Human-readable task name */
  name: string
  /** Optional task description */
  description?: string
  /** Cron expression for scheduling (e.g., '0 9 * * *' for 9 AM daily) */
  cronExpression: string
  /** Type of task to execute */
  taskType: TaskType
  /** Task payload data */
  payload: any
  /** Task execution priority */
  priority?: TaskPriority
  /** Timezone for schedule (default: 'America/New_York') */
  timezone?: string
  /** Whether the task is currently active */
  isActive: boolean
  /** Additional metadata for the task */
  metadata?: Record<string, any>
}

/**
 * Manages cron-based task scheduling for the automation infrastructure
 * @class TaskScheduler
 */
export class TaskScheduler {
  private static instance: TaskScheduler
  private scheduledJobs: Map<string, CronJob>
  private taskDefinitions: Map<string, ScheduledTask>
  private isInitialized = false

  private constructor() {
    this.scheduledJobs = new Map()
    this.taskDefinitions = new Map()
  }

  /**
   * Get singleton instance
   * @returns {TaskScheduler} The singleton TaskScheduler instance
   */
  public static getInstance(): TaskScheduler {
    if (!TaskScheduler.instance) {
      TaskScheduler.instance = new TaskScheduler()
    }
    return TaskScheduler.instance
  }

  /**
   * Initialize the task scheduler
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize queue manager if not already initialized
      await queueManager.initialize()
      
      // Load scheduled tasks from configuration or database
      await this.loadScheduledTasks()
      
      this.isInitialized = true
      logger.info('Task Scheduler: Initialized successfully')
    } catch (error) {
      logger.error('Task Scheduler: Failed to initialize', { error })
      throw error
    }
  }

  /**
   * Load scheduled tasks (would typically load from database)
   */
  private async loadScheduledTasks(): Promise<void> {
    // Default scheduled tasks for healthcare platform
    const defaultTasks: ScheduledTask[] = [
      {
        id: 'daily-backup',
        name: 'Daily Database Backup',
        description: 'Performs daily backup of the database',
        cronExpression: '0 2 * * *', // 2 AM every day
        taskType: TaskType.BACKUP,
        payload: { type: 'full', compress: true },
        priority: TaskPriority.HIGH,
        timezone: 'America/New_York',
        isActive: true
      },
      {
        id: 'weekly-report',
        name: 'Weekly Analytics Report',
        description: 'Generates weekly analytics report',
        cronExpression: '0 9 * * 1', // 9 AM every Monday
        taskType: TaskType.REPORT_GENERATION,
        payload: { reportType: 'weekly-analytics', format: 'pdf' },
        priority: TaskPriority.NORMAL,
        timezone: 'America/New_York',
        isActive: true
      },
      {
        id: 'hourly-sync',
        name: 'Hourly Data Sync',
        description: 'Syncs data with external systems',
        cronExpression: '0 * * * *', // Every hour
        taskType: TaskType.DATA_SYNC,
        payload: { systems: ['ehr', 'research-db'] },
        priority: TaskPriority.NORMAL,
        timezone: 'America/New_York',
        isActive: false // Disabled by default
      },
      {
        id: 'content-audit',
        name: 'Monthly Content Audit',
        description: 'Audits content for compliance and quality',
        cronExpression: '0 0 1 * *', // First day of each month
        taskType: TaskType.ANALYSIS,
        payload: { auditType: 'compliance', includeArchived: false },
        priority: TaskPriority.LOW,
        timezone: 'America/New_York',
        isActive: true
      }
    ]

    // Register default tasks
    for (const task of defaultTasks) {
      if (task.isActive) {
        await this.scheduleTask(task)
      }
      this.taskDefinitions.set(task.id, task)
    }
  }

  /**
   * Schedule a new task
   */
  public async scheduleTask(task: ScheduledTask): Promise<void> {
    try {
      // Remove existing job if it exists
      if (this.scheduledJobs.has(task.id)) {
        await this.unscheduleTask(task.id)
      }

      // Create cron job
      const job = new CronJob(
        task.cronExpression,
        async () => {
          await this.executeScheduledTask(task)
        },
        null, // onComplete
        false, // start
        task.timezone || 'America/New_York'
      )

      // Store job and task definition
      this.scheduledJobs.set(task.id, job)
      this.taskDefinitions.set(task.id, task)

      // Start job if active
      if (task.isActive) {
        job.start()
        logger.info(`Task Scheduler: Scheduled task ${task.id}`, {
          name: task.name,
          cron: task.cronExpression,
          nextRun: job.nextDates(1)[0]?.toISO()
        })
      }
    } catch (error) {
      logger.error('Task Scheduler: Failed to schedule task', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Unschedule a task
   */
  public async unscheduleTask(taskId: string): Promise<void> {
    const job = this.scheduledJobs.get(taskId)
    
    if (job) {
      job.stop()
      this.scheduledJobs.delete(taskId)
      logger.info(`Task Scheduler: Unscheduled task ${taskId}`)
    }
  }

  /**
   * Execute a scheduled task
   */
  private async executeScheduledTask(task: ScheduledTask): Promise<void> {
    try {
      logger.info(`Task Scheduler: Executing scheduled task ${task.id}`, {
        name: task.name,
        type: task.taskType
      })

      // Add task to queue
      const jobId = await queueManager.addTask(
        task.taskType,
        task.name,
        {
          ...task.payload,
          scheduledTaskId: task.id,
          scheduledAt: new Date().toISOString()
        },
        {
          priority: task.priority || TaskPriority.NORMAL
        }
      )

      logger.info(`Task Scheduler: Task ${task.id} queued`, {
        jobId,
        name: task.name
      })
    } catch (error) {
      logger.error('Task Scheduler: Failed to execute scheduled task', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Update task schedule
   */
  public async updateTaskSchedule(
    taskId: string,
    cronExpression: string
  ): Promise<void> {
    const task = this.taskDefinitions.get(taskId)
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    task.cronExpression = cronExpression
    
    // Reschedule if active
    if (task.isActive) {
      await this.scheduleTask(task)
    }

    logger.info(`Task Scheduler: Updated schedule for task ${taskId}`, {
      cron: cronExpression
    })
  }

  /**
   * Enable/disable a scheduled task
   */
  public async toggleTask(taskId: string, isActive: boolean): Promise<void> {
    const task = this.taskDefinitions.get(taskId)
    const job = this.scheduledJobs.get(taskId)
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    task.isActive = isActive

    if (job) {
      if (isActive) {
        job.start()
        logger.info(`Task Scheduler: Started task ${taskId}`)
      } else {
        job.stop()
        logger.info(`Task Scheduler: Stopped task ${taskId}`)
      }
    } else if (isActive) {
      // Schedule the task if it doesn't exist
      await this.scheduleTask(task)
    }
  }

  /**
   * Get all scheduled tasks
   */
  public getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.taskDefinitions.values())
  }

  /**
   * Get task by ID
   */
  public getTask(taskId: string): ScheduledTask | undefined {
    return this.taskDefinitions.get(taskId)
  }

  /**
   * Get next run times for a task
   */
  public getNextRunTimes(taskId: string, count: number = 5): Date[] {
    const job = this.scheduledJobs.get(taskId)
    
    if (!job) {
      return []
    }

    return job.nextDates(count).map(date => date.toJSDate())
  }

  /**
   * Run a scheduled task immediately (manual trigger)
   */
  public async runTaskNow(taskId: string): Promise<string> {
    const task = this.taskDefinitions.get(taskId)
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    logger.info(`Task Scheduler: Manually triggering task ${taskId}`)

    // Add task to queue with immediate execution
    const jobId = await queueManager.addTask(
      task.taskType,
      `${task.name} (Manual)`,
      {
        ...task.payload,
        scheduledTaskId: task.id,
        manualTrigger: true,
        triggeredAt: new Date().toISOString()
      },
      {
        priority: TaskPriority.HIGH // Manual triggers get high priority
      }
    )

    return jobId
  }

  /**
   * Validate cron expression
   */
  public validateCronExpression(expression: string): boolean {
    try {
      new CronTime(expression)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get human-readable description of cron expression
   */
  public describeCronExpression(expression: string): string {
    const patterns: Record<string, string> = {
      '0 * * * *': 'Every hour',
      '0 0 * * *': 'Daily at midnight',
      '0 2 * * *': 'Daily at 2:00 AM',
      '0 0 * * 0': 'Weekly on Sunday',
      '0 0 * * 1': 'Weekly on Monday',
      '0 0 1 * *': 'Monthly on the 1st',
      '0 0 15 * *': 'Monthly on the 15th',
      '*/5 * * * *': 'Every 5 minutes',
      '*/15 * * * *': 'Every 15 minutes',
      '*/30 * * * *': 'Every 30 minutes'
    }

    return patterns[expression] || expression
  }

  /**
   * Shutdown the scheduler
   */
  public async shutdown(): Promise<void> {
    try {
      // Stop all cron jobs
      this.scheduledJobs.forEach(job => job.stop())
      this.scheduledJobs.clear()
      
      this.isInitialized = false
      logger.info('Task Scheduler: Shutdown complete')
    } catch (error) {
      logger.error('Task Scheduler: Error during shutdown', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

// Export singleton instance
export const taskScheduler = TaskScheduler.getInstance()