import { createClient } from '@supabase/supabase-js'
import { ImageProcessor } from './image-processor'
import Redis from 'ioredis'

interface OptimizationJob {
  id: string
  mediaId: string
  filePath: string
  mimeType: string
  priority: 'high' | 'normal' | 'low'
  retries: number
  createdAt: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export class OptimizationQueue {
  private redis: Redis | null = null
  private processor: ImageProcessor
  private supabase: ReturnType<typeof createClient>
  private processing = false
  private concurrency = 3
  private activeJobs = new Map<string, OptimizationJob>()

  constructor() {
    this.processor = new ImageProcessor()
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL)
    }
  }

  async addJob(job: Omit<OptimizationJob, 'id' | 'createdAt' | 'status' | 'retries'>): Promise<string> {
    const jobId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullJob: OptimizationJob = {
      ...job,
      id: jobId,
      createdAt: new Date(),
      status: 'pending',
      retries: 0
    }

    if (this.redis) {
      // Store in Redis queue
      const queueKey = `optimization:${job.priority}`
      await this.redis.zadd(queueKey, Date.now(), JSON.stringify(fullJob))
    } else {
      // Fallback to in-memory queue
      this.activeJobs.set(jobId, fullJob)
      // Start processing if not already running
      if (!this.processing) {
        this.startProcessing()
      }
    }

    return jobId
  }

  async getJobStatus(jobId: string): Promise<OptimizationJob | null> {
    if (this.redis) {
      const job = await this.redis.get(`job:${jobId}`)
      return job ? JSON.parse(job) : null
    } else {
      return this.activeJobs.get(jobId) || null
    }
  }

  private async startProcessing() {
    if (this.processing) return
    this.processing = true

    while (this.activeJobs.size > 0 || await this.hasPendingJobs()) {
      const jobs = await this.getNextJobs(this.concurrency)
      
      if (jobs.length === 0) {
        await this.sleep(1000)
        continue
      }

      await Promise.all(jobs.map(job => this.processJob(job)))
    }

    this.processing = false
  }

  private async hasPendingJobs(): Promise<boolean> {
    if (this.redis) {
      const priorities = ['high', 'normal', 'low']
      for (const priority of priorities) {
        const count = await this.redis.zcard(`optimization:${priority}`)
        if (count > 0) return true
      }
    }
    return false
  }

  private async getNextJobs(count: number): Promise<OptimizationJob[]> {
    const jobs: OptimizationJob[] = []
    
    if (this.redis) {
      const priorities = ['high', 'normal', 'low']
      
      for (const priority of priorities) {
        if (jobs.length >= count) break
        
        const queueKey = `optimization:${priority}`
        const remaining = count - jobs.length
        const rawJobs = await this.redis.zpopmin(queueKey, remaining)
        
        for (let i = 0; i < rawJobs.length; i += 2) {
          const jobData = rawJobs[i]
          if (typeof jobData === 'string') {
            jobs.push(JSON.parse(jobData))
          }
        }
      }
    } else {
      // Get from in-memory queue
      const sortedJobs = Array.from(this.activeJobs.values())
        .filter(j => j.status === 'pending')
        .sort((a, b) => {
          // Sort by priority then by creation time
          const priorityOrder = { high: 0, normal: 1, low: 2 }
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          }
          return a.createdAt.getTime() - b.createdAt.getTime()
        })
        .slice(0, count)
      
      jobs.push(...sortedJobs)
    }
    
    return jobs
  }

  private async processJob(job: OptimizationJob) {
    try {
      // Update job status
      job.status = 'processing'
      await this.updateJobStatus(job)

      // Download file from Supabase
      const { data: fileData, error: downloadError } = await this.supabase
        .storage
        .from('media-public')
        .download(job.filePath)

      if (downloadError) throw downloadError

      // Convert blob to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer())

      // Process image
      const optimized = await this.processor.optimizeImage(buffer, job.mimeType)

      // Upload optimized versions
      const basePath = job.filePath.replace(/\.[^/.]+$/, '')
      
      for (const [variant, data] of Object.entries(optimized)) {
        const variantPath = `${basePath}_${variant}.webp`
        
        const { error: uploadError } = await this.supabase
          .storage
          .from('media-public')
          .upload(variantPath, data, {
            contentType: 'image/webp',
            upsert: true
          })

        if (uploadError) {
          console.error(`Failed to upload ${variant}:`, uploadError)
        }
      }

      // Update media record with optimization status
      const { error: updateError } = await this.supabase
        .from('media_library')
        .update({
          optimization_status: 'completed',
          optimized_versions: Object.keys(optimized).reduce((acc, variant) => {
            acc[variant] = `${basePath}_${variant}.webp`
            return acc
          }, {} as Record<string, string>),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.mediaId)

      if (updateError) throw updateError

      // Mark job as completed
      job.status = 'completed'
      await this.updateJobStatus(job)

    } catch (error) {
      console.error('Optimization job failed:', error)
      
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.retries++

      // Retry if under limit
      if (job.retries < 3) {
        job.status = 'pending'
        await this.addJob(job)
      } else {
        await this.updateJobStatus(job)
      }
    }
  }

  private async updateJobStatus(job: OptimizationJob) {
    if (this.redis) {
      await this.redis.set(
        `job:${job.id}`,
        JSON.stringify(job),
        'EX',
        86400 // Expire after 24 hours
      )
    } else {
      this.activeJobs.set(job.id, job)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getQueueStats() {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    }

    if (this.redis) {
      const priorities = ['high', 'normal', 'low']
      for (const priority of priorities) {
        stats.pending += await this.redis.zcard(`optimization:${priority}`)
      }
      
      // Get job stats from stored jobs
      const keys = await this.redis.keys('job:*')
      for (const key of keys) {
        const job = await this.redis.get(key)
        if (job) {
          const parsed = JSON.parse(job) as OptimizationJob
          stats[parsed.status]++
        }
      }
    } else {
      // Get from in-memory
      this.activeJobs.forEach(job => {
        stats[job.status]++
      })
    }

    return stats
  }

  async clearCompleted() {
    if (this.redis) {
      const keys = await this.redis.keys('job:*')
      for (const key of keys) {
        const job = await this.redis.get(key)
        if (job) {
          const parsed = JSON.parse(job) as OptimizationJob
          if (parsed.status === 'completed') {
            await this.redis.del(key)
          }
        }
      }
    } else {
      // Clear from in-memory
      for (const [id, job] of this.activeJobs.entries()) {
        if (job.status === 'completed') {
          this.activeJobs.delete(id)
        }
      }
    }
  }
}