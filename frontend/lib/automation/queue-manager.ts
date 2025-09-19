/**
 * Queue Manager - Bull Queue Implementation
 * Story 1.1: Admin Foundation & Core Automation Infrastructure
 * 
 * Manages background task processing with Redis-backed queues
 * 
 * @module QueueManager
 * @description Enterprise-grade task queue management with healthcare compliance.
 * Implements singleton pattern for centralized queue management.
 * 
 * @example
 * ```typescript
 * const queueManager = QueueManager.getInstance()
 * await queueManager.initialize()
 * const jobId = await queueManager.addTask(TaskType.EMAIL, 'Send Email', data)
 * ```
 */

import Queue from 'bull'
import { Redis } from 'ioredis'
import { logger } from '@/lib/logging/client-safe-logger'
import { TaskType, TaskStatus, TaskPriority, AutomationTask } from '@/types/admin'

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 1000, 5000)
    return delay
  }
}

// Queue configuration
const queueOptions = {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
}

// Define queues for different task types
export class QueueManager {
  private static instance: QueueManager
  private queues: Map<string, Queue.Queue>
  private redis: Redis | null = null
  private isInitialized = false

  private constructor() {
    this.queues = new Map()
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager()
    }
    return QueueManager.instance
  }

  /**
   * Initialize the queue manager and connect to Redis
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize Redis connection for monitoring
      this.redis = new Redis(redisConfig)
      
      await this.redis.ping()
      logger.info('Queue Manager: Redis connection established')

      // Initialize queues for different task types
      this.initializeQueues()
      
      // Set up queue event handlers
      this.setupQueueEventHandlers()
      
      this.isInitialized = true
      logger.info('Queue Manager: Initialized successfully')
    } catch (error) {
      logger.error('Queue Manager: Failed to initialize', { error })
      throw error
    }
  }

  /**
   * Initialize queues for different task types
   */
  private initializeQueues(): void {
    // Create a queue for each task type
    const taskTypes: TaskType[] = [
      TaskType.EMAIL,
      TaskType.CONTENT_GENERATION,
      TaskType.DATA_SYNC,
      TaskType.BACKUP,
      TaskType.REPORT_GENERATION,
      TaskType.WORKFLOW,
      TaskType.IMPORT,
      TaskType.EXPORT,
      TaskType.ANALYSIS,
      TaskType.CUSTOM
    ]

    taskTypes.forEach(type => {
      const queueName = `hmhcp-${type}`
      const queue = new Queue(queueName, queueOptions)
      this.queues.set(type, queue)
      logger.info(`Queue Manager: Created queue ${queueName}`)
    })
  }

  /**
   * Set up event handlers for queue monitoring
   */
  private setupQueueEventHandlers(): void {
    this.queues.forEach((queue, type) => {
      // Job completed successfully
      queue.on('completed', (job, result) => {
        logger.info(`Queue ${type}: Job ${job.id} completed`, {
          jobId: job.id,
          result: result ? JSON.stringify(result).substring(0, 100) : null
        })
      })

      // Job failed after all attempts
      queue.on('failed', (job, err) => {
        logger.error(`Queue ${type}: Job ${job.id} failed`, {
          jobId: job.id,
          error: err.message,
          attempts: job.attemptsMade
        })
      })

      // Job is being processed
      queue.on('active', (job) => {
        logger.info(`Queue ${type}: Job ${job.id} started processing`, {
          jobId: job.id,
          attempt: job.attemptsMade + 1
        })
      })

      // Job stalled
      queue.on('stalled', (job) => {
        logger.warn(`Queue ${type}: Job ${job.id} stalled`, {
          jobId: job.id
        })
      })

      // Queue error
      queue.on('error', (error) => {
        logger.error(`Queue ${type}: Error occurred`, {
          error: error.message
        })
      })
    })
  }

  /**
   * Add a task to the appropriate queue
   */
  public async addTask(
    type: TaskType,
    name: string,
    payload: any,
    options?: {
      priority?: TaskPriority
      delay?: number
      attempts?: number
      scheduledAt?: Date
    }
  ): Promise<string> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    const jobOptions: Queue.JobOptions = {
      priority: options?.priority || TaskPriority.NORMAL,
      delay: options?.delay || (options?.scheduledAt ? 
        new Date(options.scheduledAt).getTime() - Date.now() : 0),
      attempts: options?.attempts || 3
    }

    try {
      const job = await queue.add(name, payload, jobOptions)
      
      logger.info(`Queue Manager: Task added to ${type} queue`, {
        jobId: job.id,
        name,
        priority: jobOptions.priority
      })

      return job.id as string
    } catch (error) {
      logger.error('Queue Manager: Failed to add task', {
        type,
        name,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Get task status by ID
   */
  public async getTaskStatus(type: TaskType, taskId: string): Promise<AutomationTask | null> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    try {
      const job = await queue.getJob(taskId)
      
      if (!job) {
        return null
      }

      const state = await job.getState()
      
      return {
        id: job.id as string,
        name: job.name,
        type,
        status: this.mapJobStateToTaskStatus(state),
        priority: job.opts.priority || TaskPriority.NORMAL,
        payload: job.data,
        result: job.returnvalue,
        error: job.failedReason,
        attempts: job.attemptsMade || 0,
        maxAttempts: job.opts.attempts,
        createdAt: new Date(job.timestamp),
        startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined
      }
    } catch (error) {
      logger.error('Queue Manager: Failed to get task status', {
        type,
        taskId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Cancel a task
   */
  public async cancelTask(type: TaskType, taskId: string): Promise<boolean> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    try {
      const job = await queue.getJob(taskId)
      
      if (!job) {
        return false
      }

      await job.remove()
      
      logger.info(`Queue Manager: Task ${taskId} cancelled`, {
        type,
        taskId
      })

      return true
    } catch (error) {
      logger.error('Queue Manager: Failed to cancel task', {
        type,
        taskId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(type: TaskType): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount()
      ])

      return {
        waiting,
        active,
        completed,
        failed,
        delayed
      }
    } catch (error) {
      logger.error('Queue Manager: Failed to get queue stats', {
        type,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Clear completed jobs from a queue
   */
  public async clearCompleted(type: TaskType): Promise<void> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    try {
      await queue.clean(0, 'completed')
      logger.info(`Queue Manager: Cleared completed jobs from ${type} queue`)
    } catch (error) {
      logger.error('Queue Manager: Failed to clear completed jobs', {
        type,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Clear failed jobs from a queue
   */
  public async clearFailed(type: TaskType): Promise<void> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    try {
      await queue.clean(0, 'failed')
      logger.info(`Queue Manager: Cleared failed jobs from ${type} queue`)
    } catch (error) {
      logger.error('Queue Manager: Failed to clear failed jobs', {
        type,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Pause a queue
   */
  public async pauseQueue(type: TaskType): Promise<void> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    try {
      await queue.pause()
      logger.info(`Queue Manager: Paused ${type} queue`)
    } catch (error) {
      logger.error('Queue Manager: Failed to pause queue', {
        type,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Resume a paused queue
   */
  public async resumeQueue(type: TaskType): Promise<void> {
    const queue = this.queues.get(type)
    
    if (!queue) {
      throw new Error(`Queue for task type ${type} not found`)
    }

    try {
      await queue.resume()
      logger.info(`Queue Manager: Resumed ${type} queue`)
    } catch (error) {
      logger.error('Queue Manager: Failed to resume queue', {
        type,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Close all queues and disconnect from Redis
   */
  public async shutdown(): Promise<void> {
    try {
      // Close all queues
      await Promise.all(
        Array.from(this.queues.values()).map(queue => queue.close())
      )

      // Disconnect from Redis
      if (this.redis) {
        this.redis.disconnect()
      }

      this.isInitialized = false
      logger.info('Queue Manager: Shutdown complete')
    } catch (error) {
      logger.error('Queue Manager: Error during shutdown', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Map Bull job state to TaskStatus
   */
  private mapJobStateToTaskStatus(state: string): TaskStatus {
    switch (state) {
      case 'waiting':
        return TaskStatus.QUEUED
      case 'active':
        return TaskStatus.RUNNING
      case 'completed':
        return TaskStatus.COMPLETED
      case 'failed':
        return TaskStatus.FAILED
      case 'delayed':
        return TaskStatus.PENDING
      default:
        return TaskStatus.PENDING
    }
  }

  /**
   * Get a specific queue instance (for advanced operations)
   */
  public getQueue(type: TaskType): Queue.Queue | undefined {
    return this.queues.get(type)
  }
}

// Export singleton instance
export const queueManager = QueueManager.getInstance()