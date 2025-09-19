// Job Queue System for Bulk Operations
import { createClient } from '@/lib/supabase/server'
import logger from '@/lib/logging/winston-logger'

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type JobType = 'bulk_posts' | 'bulk_pages' | 'bulk_users' | 'bulk_media' | 'bulk_tags' | 'bulk_categories'

export interface BulkJob {
  id: string
  type: JobType
  status: JobStatus
  progress: number
  total_items: number
  processed_items: number
  failed_items: number
  user_id: string
  payload: any
  results?: {
    success: number
    failed: number
    errors: Array<{ id: string; error: string }>
    processed: string[]
  }
  error_message?: string
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

export interface JobProgress {
  jobId: string
  status: JobStatus
  progress: number
  message: string
  current_item?: number
  total_items?: number
  errors?: Array<{ id: string; error: string }>
}

// In-memory job storage (in production, use Redis or similar)
const jobs = new Map<string, BulkJob>()
const jobListeners = new Map<string, Array<(progress: JobProgress) => void>>()

export class BulkJobQueue {
  private static instance: BulkJobQueue

  static getInstance(): BulkJobQueue {
    if (!BulkJobQueue.instance) {
      BulkJobQueue.instance = new BulkJobQueue()
    }
    return BulkJobQueue.instance
  }

  private async getSupabaseClient() {
    return await createClient()
  }

  /**
   * Create a new bulk operation job
   */
  async createJob(
    type: JobType,
    userId: string,
    payload: any,
    totalItems: number
  ): Promise<string> {
    const jobId = crypto.randomUUID()
    
    const job: BulkJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      total_items: totalItems,
      processed_items: 0,
      failed_items: 0,
      user_id: userId,
      payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Store in memory
    jobs.set(jobId, job)

    // Store in database for persistence
    const supabase = await this.getSupabaseClient()
    await supabase
      .from('bulk_jobs')
      .insert({
        id: jobId,
        type,
        status: 'pending',
        progress: 0,
        total_items: totalItems,
        processed_items: 0,
        failed_items: 0,
        user_id: userId,
        payload,
        created_at: job.created_at,
        updated_at: job.updated_at
      })

    logger.info('Bulk job created', { jobId, type, totalItems, userId })
    
    return jobId
  }

  /**
   * Get job status and progress
   */
  async getJob(jobId: string): Promise<BulkJob | null> {
    // Try memory first
    let job = jobs.get(jobId)
    
    if (!job) {
      // Fallback to database
      const supabase = await this.getSupabaseClient()
      const { data } = await supabase
        .from('bulk_jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      
      if (data) {
        job = data as BulkJob
        jobs.set(jobId, job) // Cache it
      }
    }
    
    return job || null
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string,
    updates: Partial<{
      status: JobStatus
      progress: number
      processed_items: number
      failed_items: number
      results: any
      error_message: string
    }>
  ): Promise<void> {
    const job = jobs.get(jobId)
    if (!job) return

    // Update in memory
    Object.assign(job, {
      ...updates,
      updated_at: new Date().toISOString(),
      ...(updates.status === 'running' && !job.started_at ? { started_at: new Date().toISOString() } : {}),
      ...(updates.status === 'completed' || updates.status === 'failed' ? { completed_at: new Date().toISOString() } : {})
    })

    // Update in database
    const supabase = await this.getSupabaseClient()
    await supabase
      .from('bulk_jobs')
      .update({
        ...updates,
        updated_at: job.updated_at,
        ...(updates.status === 'running' && !job.started_at ? { started_at: job.updated_at } : {}),
        ...(updates.status === 'completed' || updates.status === 'failed' ? { completed_at: job.updated_at } : {})
      })
      .eq('id', jobId)

    // Notify listeners
    this.notifyListeners(jobId, {
      jobId,
      status: job.status,
      progress: job.progress,
      message: this.getStatusMessage(job),
      current_item: job.processed_items,
      total_items: job.total_items,
      errors: job.results?.errors
    })

    logger.info('Job progress updated', { 
      jobId, 
      status: job.status, 
      progress: job.progress,
      processed: job.processed_items,
      total: job.total_items
    })
  }

  /**
   * Start processing a job
   */
  async startJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId)
    if (!job) throw new Error('Job not found')

    if (job.status !== 'pending') {
      throw new Error(`Job is not pending (current status: ${job.status})`)
    }

    await this.updateJobProgress(jobId, { 
      status: 'running',
      progress: 0 
    })

    // Process the job based on type
    this.processJobAsync(job)
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId)
    if (!job) throw new Error('Job not found')

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error('Cannot cancel completed or failed job')
    }

    await this.updateJobProgress(jobId, { 
      status: 'cancelled',
      error_message: 'Job was cancelled by user' 
    })
  }

  /**
   * Subscribe to job progress updates
   */
  subscribeToJob(jobId: string, callback: (progress: JobProgress) => void): () => void {
    if (!jobListeners.has(jobId)) {
      jobListeners.set(jobId, [])
    }
    
    jobListeners.get(jobId)!.push(callback)

    // Return unsubscribe function
    return () => {
      const listeners = jobListeners.get(jobId)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
        if (listeners.length === 0) {
          jobListeners.delete(jobId)
        }
      }
    }
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string, limit = 50): Promise<BulkJob[]> {
    const supabase = await this.getSupabaseClient()
    const { data } = await supabase
      .from('bulk_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return data || []
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysOld = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const supabase = await this.getSupabaseClient()
    const { data } = await supabase
      .from('bulk_jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('completed_at', cutoffDate.toISOString())

    const deletedCount = Array.isArray(data) ? (data as any[]).length : 0
    logger.info(`Cleaned up ${deletedCount} old bulk jobs`)
    
    return deletedCount
  }

  private async processJobAsync(job: BulkJob): Promise<void> {
    try {
      switch (job.type) {
        case 'bulk_posts':
          await this.processBulkPosts(job)
          break
        case 'bulk_pages':
          await this.processBulkPages(job)
          break
        case 'bulk_users':
          await this.processBulkUsers(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }
    } catch (error) {
      logger.error('Job processing failed', { 
        jobId: job.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      
      await this.updateJobProgress(job.id, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async processBulkPosts(job: BulkJob): Promise<void> {
    const { action, ids, options } = job.payload
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>,
      processed: [] as string[]
    }

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      
      try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Here you would implement the actual bulk operation logic
        // This is a simplified version
        results.success++
        results.processed.push(id)
        
      } catch (error) {
        results.failed++
        results.errors.push({ 
          id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }

      // Update progress
      const progress = Math.round(((i + 1) / ids.length) * 100)
      await this.updateJobProgress(job.id, {
        progress,
        processed_items: i + 1,
        failed_items: results.failed
      })
    }

    // Mark as completed
    await this.updateJobProgress(job.id, {
      status: 'completed',
      progress: 100,
      results
    })
  }

  private async processBulkPages(job: BulkJob): Promise<void> {
    // Similar implementation to processBulkPosts
    // Implementation details would be specific to page operations
  }

  private async processBulkUsers(job: BulkJob): Promise<void> {
    // Similar implementation to processBulkPosts  
    // Implementation details would be specific to user operations
  }

  private notifyListeners(jobId: string, progress: JobProgress): void {
    const listeners = jobListeners.get(jobId)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(progress)
        } catch (error) {
          logger.error('Job listener callback failed', { jobId, error })
        }
      })
    }
  }

  private getStatusMessage(job: BulkJob): string {
    switch (job.status) {
      case 'pending':
        return 'Job is queued and waiting to start'
      case 'running':
        return `Processing ${job.processed_items} of ${job.total_items} items...`
      case 'completed':
        return `Completed successfully. ${job.results?.success || 0} items processed, ${job.results?.failed || 0} failed`
      case 'failed':
        return job.error_message || 'Job failed with unknown error'
      case 'cancelled':
        return 'Job was cancelled'
      default:
        return 'Unknown status'
    }
  }
}

// Singleton instance
export const jobQueue = BulkJobQueue.getInstance()