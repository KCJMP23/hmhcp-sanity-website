// Email Batch Processing
// Created: 2025-01-27
// Purpose: Optimize bulk email operations for better performance

import { EmailServiceManager } from '../services/EmailServiceManager'
import { emailCache } from '../caching/email-cache'

interface BatchJob {
  id: string
  type: 'send_campaign' | 'import_contacts' | 'export_data' | 'process_unsubscribes'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total: number
  processed: number
  errors: string[]
  created_at: Date
  started_at?: Date
  completed_at?: Date
  metadata: Record<string, any>
}

interface BatchProcessorConfig {
  maxConcurrency: number
  batchSize: number
  retryAttempts: number
  retryDelay: number
  timeout: number
}

export class EmailBatchProcessor {
  private emailService: EmailServiceManager
  private config: BatchProcessorConfig
  private activeJobs: Map<string, BatchJob> = new Map()
  private jobQueue: BatchJob[] = []
  private isProcessing: boolean = false

  constructor(emailService: EmailServiceManager, config: BatchProcessorConfig) {
    this.emailService = emailService
    this.config = config
  }

  // Create a new batch job
  async createBatchJob(
    type: BatchJob['type'],
    metadata: Record<string, any>
  ): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const job: BatchJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      total: 0,
      processed: 0,
      errors: [],
      created_at: new Date(),
      metadata
    }

    this.activeJobs.set(jobId, job)
    this.jobQueue.push(job)
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue()
    }

    return jobId
  }

  // Process campaign sending in batches
  async processCampaignBatch(
    campaignId: string,
    contactIds: string[],
    batchSize: number = this.config.batchSize
  ): Promise<string> {
    const jobId = await this.createBatchJob('send_campaign', {
      campaignId,
      contactIds,
      batchSize
    })

    return jobId
  }

  // Process contact import in batches
  async processContactImport(
    contacts: any[],
    batchSize: number = this.config.batchSize
  ): Promise<string> {
    const jobId = await this.createBatchJob('import_contacts', {
      contacts,
      batchSize
    })

    return jobId
  }

  // Process data export in batches
  async processDataExport(
    dataType: string,
    filters: Record<string, any>,
    batchSize: number = this.config.batchSize
  ): Promise<string> {
    const jobId = await this.createBatchJob('export_data', {
      dataType,
      filters,
      batchSize
    })

    return jobId
  }

  // Process unsubscribe requests in batches
  async processUnsubscribeBatch(
    unsubscribeRequests: any[],
    batchSize: number = this.config.batchSize
  ): Promise<string> {
    const jobId = await this.createBatchJob('process_unsubscribes', {
      unsubscribeRequests,
      batchSize
    })

    return jobId
  }

  // Get job status
  getJobStatus(jobId: string): BatchJob | null {
    return this.activeJobs.get(jobId) || null
  }

  // Get all active jobs
  getAllJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values())
  }

  // Cancel a job
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job) return false

    if (job.status === 'pending') {
      job.status = 'failed'
      job.errors.push('Job cancelled by user')
      this.activeJobs.set(jobId, job)
      return true
    }

    return false
  }

  // Process the job queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return
    
    this.isProcessing = true

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift()
      if (!job) break

      try {
        await this.processJob(job)
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        job.status = 'failed'
        job.errors.push(error instanceof Error ? error.message : 'Unknown error')
        this.activeJobs.set(job.id, job)
      }
    }

    this.isProcessing = false
  }

  // Process individual job
  private async processJob(job: BatchJob): Promise<void> {
    job.status = 'processing'
    job.started_at = new Date()
    this.activeJobs.set(job.id, job)

    try {
      switch (job.type) {
        case 'send_campaign':
          await this.processCampaignSending(job)
          break
        case 'import_contacts':
          await this.processContactImporting(job)
          break
        case 'export_data':
          await this.processDataExporting(job)
          break
        case 'process_unsubscribes':
          await this.processUnsubscribeProcessing(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      job.status = 'completed'
      job.completed_at = new Date()
      job.progress = 100
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    this.activeJobs.set(job.id, job)
  }

  // Process campaign sending
  private async processCampaignSending(job: BatchJob): Promise<void> {
    const { campaignId, contactIds, batchSize } = job.metadata
    const total = contactIds.length
    job.total = total

    // Get campaign data
    const campaign = await emailCache.getCampaign(campaignId)
    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Process in batches
    for (let i = 0; i < total; i += batchSize) {
      const batch = contactIds.slice(i, i + batchSize)
      
      try {
        // Send emails in parallel within batch
        const promises = batch.map(contactId => 
          this.sendEmailToContact(campaign, contactId)
        )
        
        await Promise.allSettled(promises)
        
        job.processed += batch.length
        job.progress = Math.round((job.processed / total) * 100)
        this.activeJobs.set(job.id, job)
        
        // Small delay between batches to avoid overwhelming the email service
        await this.delay(100)
      } catch (error) {
        job.errors.push(`Batch ${i}-${i + batchSize}: ${error}`)
      }
    }
  }

  // Process contact importing
  private async processContactImporting(job: BatchJob): Promise<void> {
    const { contacts, batchSize } = job.metadata
    const total = contacts.length
    job.total = total

    // Process in batches
    for (let i = 0; i < total; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)
      
      try {
        // Import contacts in parallel within batch
        const promises = batch.map(contact => 
          this.importContact(contact)
        )
        
        const results = await Promise.allSettled(promises)
        
        // Count successful imports
        const successful = results.filter(r => r.status === 'fulfilled').length
        job.processed += successful
        
        // Count errors
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            job.errors.push(`Contact ${batch[index].email}: ${result.reason}`)
          }
        })
        
        job.progress = Math.round((job.processed / total) * 100)
        this.activeJobs.set(job.id, job)
        
        await this.delay(50)
      } catch (error) {
        job.errors.push(`Batch ${i}-${i + batchSize}: ${error}`)
      }
    }
  }

  // Process data exporting
  private async processDataExporting(job: BatchJob): Promise<void> {
    const { dataType, filters, batchSize } = job.metadata
    
    // This would integrate with your data export system
    // For now, simulate the process
    job.total = 1000 // Simulated total
    job.processed = 1000
    job.progress = 100
    this.activeJobs.set(job.id, job)
  }

  // Process unsubscribe requests
  private async processUnsubscribeProcessing(job: BatchJob): Promise<void> {
    const { unsubscribeRequests, batchSize } = job.metadata
    const total = unsubscribeRequests.length
    job.total = total

    // Process in batches
    for (let i = 0; i < total; i += batchSize) {
      const batch = unsubscribeRequests.slice(i, i + batchSize)
      
      try {
        // Process unsubscribes in parallel within batch
        const promises = batch.map(request => 
          this.processUnsubscribeRequest(request)
        )
        
        const results = await Promise.allSettled(promises)
        
        const successful = results.filter(r => r.status === 'fulfilled').length
        job.processed += successful
        
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            job.errors.push(`Unsubscribe ${batch[index].id}: ${result.reason}`)
          }
        })
        
        job.progress = Math.round((job.processed / total) * 100)
        this.activeJobs.set(job.id, job)
        
        await this.delay(50)
      } catch (error) {
        job.errors.push(`Batch ${i}-${i + batchSize}: ${error}`)
      }
    }
  }

  // Helper methods
  private async sendEmailToContact(campaign: any, contactId: string): Promise<void> {
    // Get contact data
    const contact = await emailCache.getContact(contactId)
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`)
    }

    // Send email using email service
    await this.emailService.sendEmail({
      to: contact.email,
      subject: campaign.subject,
      content: campaign.content,
      from: campaign.from_email,
      fromName: campaign.from_name
    })
  }

  private async importContact(contact: any): Promise<void> {
    // This would integrate with your contact import system
    // For now, simulate the process
    await this.delay(10)
  }

  private async processUnsubscribeRequest(request: any): Promise<void> {
    // This would integrate with your unsubscribe processing system
    // For now, simulate the process
    await this.delay(10)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Clean up completed jobs older than specified time
  async cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = new Date(Date.now() - maxAge)
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.completed_at && job.completed_at < cutoff) {
        this.activeJobs.delete(jobId)
      }
    }
  }

  // Get processing statistics
  getStats(): {
    totalJobs: number
    activeJobs: number
    completedJobs: number
    failedJobs: number
    averageProcessingTime: number
  } {
    const jobs = Array.from(this.activeJobs.values())
    const completed = jobs.filter(j => j.status === 'completed')
    const failed = jobs.filter(j => j.status === 'failed')
    const active = jobs.filter(j => j.status === 'processing' || j.status === 'pending')

    const avgProcessingTime = completed.reduce((sum, job) => {
      if (job.started_at && job.completed_at) {
        return sum + (job.completed_at.getTime() - job.started_at.getTime())
      }
      return sum
    }, 0) / completed.length || 0

    return {
      totalJobs: jobs.length,
      activeJobs: active.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      averageProcessingTime: avgProcessingTime
    }
  }
}

// Default configuration
export const defaultBatchConfig: BatchProcessorConfig = {
  maxConcurrency: 5,
  batchSize: 100,
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000
}
