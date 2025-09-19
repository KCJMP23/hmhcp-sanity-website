/**
 * Blog Automation Scheduler
 * Handles daily scheduling of blog post generation
 */

import { blogAutomationSystem } from './blog-automation-system'
import logger from '@/lib/logging/winston-logger'

export class BlogAutomationScheduler {
  private isRunning = false
  private scheduleInterval: NodeJS.Timeout | null = null
  private dailyTimeout: NodeJS.Timeout | null = null

  /**
   * Initialize the scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running')
      return
    }

    this.isRunning = true
    this.scheduleNextRun()
    
    // Set up interval to check for scheduling every hour
    this.scheduleInterval = setInterval(() => {
      this.scheduleNextRun()
    }, 60 * 60 * 1000) // Every hour

    logger.info('Blog automation scheduler started')
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false

    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval)
      this.scheduleInterval = null
    }

    if (this.dailyTimeout) {
      clearTimeout(this.dailyTimeout)
      this.dailyTimeout = null
    }

    logger.info('Blog automation scheduler stopped')
  }

  /**
   * Schedule the next run
   */
  private scheduleNextRun(): void {
    if (!this.isRunning) return

    const now = new Date()
    const nextRun = this.getNextScheduledTime()
    const timeUntilRun = nextRun.getTime() - now.getTime()

    // Clear existing timeout
    if (this.dailyTimeout) {
      clearTimeout(this.dailyTimeout)
    }

    // Only schedule if the next run is in the future
    if (timeUntilRun > 0) {
      this.dailyTimeout = setTimeout(() => {
        this.runAutomation()
      }, timeUntilRun)

      logger.info('Next blog automation scheduled', {
        nextRun: nextRun.toISOString(),
        timeUntilRun: Math.round(timeUntilRun / 1000 / 60) + ' minutes'
      })
    }
  }

  /**
   * Run the automation
   */
  private async runAutomation(): Promise<void> {
    logger.info('Starting scheduled blog automation')

    try {
      await blogAutomationSystem.runDailyAutomation()
      logger.info('Scheduled blog automation completed successfully')
    } catch (error) {
      logger.error('Scheduled blog automation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }

    // Schedule the next run
    this.scheduleNextRun()
  }

  /**
   * Get next scheduled time (daily at 9 AM)
   */
  private getNextScheduledTime(): Date {
    const now = new Date()
    const next = new Date(now)
    
    // Set to 9 AM today
    next.setHours(9, 0, 0, 0)
    
    // If 9 AM has already passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    
    return next
  }

  /**
   * Force run automation now
   */
  async runNow(): Promise<void> {
    logger.info('Manual blog automation triggered')
    await this.runAutomation()
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean
    nextRun: Date | null
  } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? this.getNextScheduledTime() : null
    }
  }
}

// Global scheduler instance
export const blogScheduler = new BlogAutomationScheduler()

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  blogScheduler.start()
}