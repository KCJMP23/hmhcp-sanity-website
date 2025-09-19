import { createClient } from '@supabase/supabase-js'
import { redis } from '@/lib/redis'
import { CircuitBreakerRegistry } from './circuit-breaker'
import { webhookTracer } from '@/lib/observability/tracing'

interface RetryJob {
  id: string
  webhookLogId: string
  endpoint: string
  payload: any
  headers: Record<string, string>
  attempt: number
  maxAttempts: number
  nextRetryAt: Date
  lastError?: string
  createdAt: Date
  completedAt?: Date
}

interface RetryOptions {
  maxAttempts?: number
  backoffMultiplier?: number
  initialDelayMs?: number
  maxDelayMs?: number
  enableJitter?: boolean
}

/**
 * Webhook Retry Queue Manager
 * Implements exponential backoff with jitter for failed webhook deliveries
 */
export class WebhookRetryQueue {
  private static instance: WebhookRetryQueue
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  private circuitBreakers = new CircuitBreakerRegistry()
  private processing = false
  private processInterval: NodeJS.Timeout | null = null

  private constructor(
    private defaultOptions: Required<RetryOptions> = {
      maxAttempts: 5,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 300000, // 5 minutes
      enableJitter: true,
    }
  ) {}

  static getInstance(): WebhookRetryQueue {
    if (!WebhookRetryQueue.instance) {
      WebhookRetryQueue.instance = new WebhookRetryQueue()
    }
    return WebhookRetryQueue.instance
  }

  /**
   * Add a failed webhook to the retry queue
   */
  async enqueue(
    webhookLogId: string,
    endpoint: string,
    payload: any,
    headers: Record<string, string>,
    lastError: string,
    options?: RetryOptions
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options }
    const jobId = `retry_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const job: RetryJob = {
      id: jobId,
      webhookLogId,
      endpoint,
      payload,
      headers,
      attempt: 1,
      maxAttempts: opts.maxAttempts,
      nextRetryAt: new Date(Date.now() + this.calculateDelay(1, opts)),
      lastError,
      createdAt: new Date(),
    }

    // Store in database
    const { error } = await this.supabase
      .from('webhook_retry_queue')
      .insert({
        id: jobId,
        webhook_log_id: webhookLogId,
        endpoint_url: endpoint,
        payload,
        headers,
        retry_count: 0,
        max_retries: opts.maxAttempts,
        next_retry_at: job.nextRetryAt.toISOString(),
        last_error: lastError,
      })

    if (error) {
      console.error('Failed to enqueue retry job:', error)
      throw error
    }

    // Also store in Redis for fast access
    await this.storeInRedis(job)

    // Start processing if not already running
    this.startProcessing()

    return jobId
  }

  /**
   * Process pending retry jobs
   */
  async processPendingJobs(): Promise<void> {
    if (this.processing) return
    
    this.processing = true
    
    try {
      await webhookTracer.traceWebhookProcessing(
        'retry-queue',
        'system',
        async () => {
          const now = new Date()
          
          // Get jobs ready for retry
          const { data: jobs, error } = await this.supabase
            .from('webhook_retry_queue')
            .select('*')
            .lte('next_retry_at', now.toISOString())
            .is('completed_at', null)
            .limit(10)

          if (error || !jobs || jobs.length === 0) {
            return
          }

          // Process jobs in parallel with concurrency limit
          const concurrency = 3
          for (let i = 0; i < jobs.length; i += concurrency) {
            const batch = jobs.slice(i, i + concurrency)
            await Promise.allSettled(
              batch.map(job => this.processJob(job))
            )
          }
        }
      )
    } finally {
      this.processing = false
    }
  }

  /**
   * Process a single retry job
   */
  private async processJob(job: any): Promise<void> {
    const circuitBreaker = this.circuitBreakers.getCircuitBreaker(
      `webhook_${new URL(job.endpoint_url).hostname}`
    )

    try {
      // Check circuit breaker
      await circuitBreaker.execute(async () => {
        const response = await fetch(job.endpoint_url, {
          method: 'POST',
          headers: job.headers,
          body: JSON.stringify(job.payload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Success - mark as completed
        await this.markCompleted(job.id)
        
        // Update webhook log
        await this.supabase
          .from('webhook_logs')
          .update({
            response_status: response.status,
            success: true,
            error_message: null,
          })
          .eq('id', job.webhook_log_id)
      })
    } catch (error) {
      await this.handleRetryFailure(job, error)
    }
  }

  /**
   * Handle retry failure
   */
  private async handleRetryFailure(job: any, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const nextAttempt = job.retry_count + 2

    if (nextAttempt > job.max_retries) {
      // Max attempts reached - mark as failed
      await this.markFailed(job.id, errorMessage)
      
      // Send alert for critical webhook failures
      await this.sendFailureAlert(job, errorMessage)
    } else {
      // Schedule next retry
      const delay = this.calculateDelay(nextAttempt, this.defaultOptions)
      const nextRetryAt = new Date(Date.now() + delay)

      await this.supabase
        .from('webhook_retry_queue')
        .update({
          retry_count: nextAttempt - 1,
          next_retry_at: nextRetryAt.toISOString(),
          last_error: errorMessage,
        })
        .eq('id', job.id)
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1)
    
    // Cap at max delay
    delay = Math.min(delay, options.maxDelayMs)
    
    // Add jitter to prevent thundering herd
    if (options.enableJitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }
    
    return Math.round(delay)
  }

  /**
   * Mark job as completed
   */
  private async markCompleted(jobId: string): Promise<void> {
    await this.supabase
      .from('webhook_retry_queue')
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Remove from Redis
    await this.removeFromRedis(jobId)
  }

  /**
   * Mark job as failed
   */
  private async markFailed(jobId: string, error: string): Promise<void> {
    await this.supabase
      .from('webhook_retry_queue')
      .update({
        completed_at: new Date().toISOString(),
        last_error: error,
      })
      .eq('id', jobId)

    // Remove from Redis
    await this.removeFromRedis(jobId)
  }

  /**
   * Send alert for critical webhook failures
   */
  private async sendFailureAlert(job: any, error: string): Promise<void> {
    // In production, this would send to monitoring service
    console.error(`CRITICAL: Webhook failed after ${job.max_retries} attempts`, {
      jobId: job.id,
      endpoint: job.endpoint_url,
      error,
    })

    // Could integrate with PagerDuty, Slack, etc.
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Webhook Delivery Failed`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Webhook delivery failed after ${job.max_retries} attempts*\n` +
                      `Endpoint: ${job.endpoint_url}\n` +
                      `Error: ${error}\n` +
                      `Job ID: ${job.id}`,
              },
            },
          ],
        }),
      }).catch(console.error)
    }
  }

  /**
   * Store job in Redis for fast access
   */
  private async storeInRedis(job: RetryJob): Promise<void> {
    if (!redis) return
    
    try {
      const key = `webhook:retry:${job.id}`
      await redis.set(
        key,
        JSON.stringify(job),
        'EX',
        86400 // 24 hours
      )
      
      // Add to sorted set for efficient range queries
      await redis.zadd(
        'webhook:retry:queue',
        job.nextRetryAt.getTime(),
        job.id
      )
    } catch (error) {
      console.error('Redis storage failed:', error)
      // Continue without Redis - database is source of truth
    }
  }

  /**
   * Remove job from Redis
   */
  private async removeFromRedis(jobId: string): Promise<void> {
    if (!redis) return
    
    try {
      await redis.del(`webhook:retry:${jobId}`)
      await redis.zrem('webhook:retry:queue', jobId)
    } catch (error) {
      console.error('Redis removal failed:', error)
    }
  }

  /**
   * Start processing loop
   */
  startProcessing(): void {
    if (this.processInterval) return
    
    // Process every 30 seconds
    this.processInterval = setInterval(() => {
      this.processPendingJobs().catch(console.error)
    }, 30000)
    
    // Process immediately
    this.processPendingJobs().catch(console.error)
  }

  /**
   * Stop processing loop
   */
  stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }
  }

  /**
   * Get retry queue statistics
   */
  async getStatistics(): Promise<{
    pending: number
    completed: number
    failed: number
    averageRetries: number
  }> {
    const { data } = await this.supabase
      .from('webhook_retry_queue')
      .select('completed_at, retry_count')
    
    if (!data) {
      return { pending: 0, completed: 0, failed: 0, averageRetries: 0 }
    }

    const pending = data.filter(j => !j.completed_at).length
    const completed = data.filter(j => j.completed_at && j.retry_count < 5).length
    const failed = data.filter(j => j.completed_at && j.retry_count >= 5).length
    const averageRetries = data.reduce((sum, j) => sum + j.retry_count, 0) / data.length || 0

    return { pending, completed, failed, averageRetries }
  }

  /**
   * Manual retry of a specific job
   */
  async retryJob(jobId: string): Promise<void> {
    const { data: job } = await this.supabase
      .from('webhook_retry_queue')
      .select('*')
      .eq('id', jobId)
      .single()

    if (job) {
      await this.processJob(job)
    }
  }

  /**
   * Clear completed jobs older than specified days
   */
  async cleanupOldJobs(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await this.supabase
      .from('webhook_retry_queue')
      .delete()
      .lt('completed_at', cutoffDate.toISOString())
      .select('id')

    return data?.length || 0
  }
}

// Export singleton instance
export const webhookRetryQueue = WebhookRetryQueue.getInstance()