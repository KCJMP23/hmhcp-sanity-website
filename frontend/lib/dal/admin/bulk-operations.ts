/**
 * Memory-Safe Bulk Operations Manager
 * Handles large-scale data operations without OOM issues
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { memoryManager } from '@/lib/memory/memory-manager'
import { StreamingPaginator } from '@/lib/memory/streaming-paginator'
import { CursorUtils } from '@/lib/memory/cursor-utils'
import { EventEmitter } from 'events'

export interface BulkOperationConfig {
  tableName: string
  operation: 'insert' | 'update' | 'delete' | 'upsert'
  data?: any[]
  filter?: Record<string, any>
  batchSize?: number
  maxConcurrent?: number
  dryRun?: boolean
  progressCallback?: (progress: BulkOperationProgress) => void
  errorHandler?: (error: Error, item: any) => void
  validateFn?: (item: any) => boolean | Promise<boolean>
  transformFn?: (item: any) => any | Promise<any>
}

export interface BulkOperationProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  skipped: number
  percentage: number
  estimatedTimeRemaining: number
  currentBatch: number
  totalBatches: number
  memoryUsage: number
  throughput: number
  errors: Array<{ item: any; error: string }>
}

export interface BulkOperationResult {
  success: boolean
  processed: number
  succeeded: number
  failed: number
  skipped: number
  duration: number
  errors: Array<{ item: any; error: string }>
  memoryPeakUsage: number
  averageThroughput: number
}

export class BulkOperationsManager extends EventEmitter {
  private supabase: SupabaseClient
  private activeOperations: Map<string, BulkOperationProgress> = new Map()
  private readonly maxActiveOperations = 3

  constructor(supabase: SupabaseClient) {
    super()
    this.supabase = supabase

    // Monitor memory and adjust operations
    memoryManager.on('memory:alert', () => this.handleMemoryPressure())
    memoryManager.on('memory:emergency', () => this.handleMemoryEmergency())
  }

  /**
   * Execute bulk operation with memory safety
   */
  async executeBulk(config: BulkOperationConfig): Promise<BulkOperationResult> {
    const operationId = this.generateOperationId()
    const startTime = Date.now()
    
    // Check if we can start a new operation
    if (this.activeOperations.size >= this.maxActiveOperations) {
      throw new Error('Maximum number of concurrent bulk operations reached')
    }

    // Calculate memory-safe batch size
    const batchSize = this.calculateOptimalBatchSize(config.batchSize)
    
    // Initialize progress tracking
    const progress: BulkOperationProgress = {
      total: config.data?.length || 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      currentBatch: 0,
      totalBatches: Math.ceil((config.data?.length || 0) / batchSize),
      memoryUsage: 0,
      throughput: 0,
      errors: []
    }
    
    this.activeOperations.set(operationId, progress)
    let memoryPeakUsage = 0

    try {
      switch (config.operation) {
        case 'insert':
          return await this.executeBulkInsert(config, progress, batchSize, operationId)
        case 'update':
          return await this.executeBulkUpdate(config, progress, batchSize, operationId)
        case 'delete':
          return await this.executeBulkDelete(config, progress, batchSize, operationId)
        case 'upsert':
          return await this.executeBulkUpsert(config, progress, batchSize, operationId)
        default:
          throw new Error(`Unsupported operation: ${config.operation}`)
      }
    } finally {
      this.activeOperations.delete(operationId)
      
      const duration = Date.now() - startTime
      const result: BulkOperationResult = {
        success: progress.failed === 0,
        processed: progress.processed,
        succeeded: progress.succeeded,
        failed: progress.failed,
        skipped: progress.skipped,
        duration,
        errors: progress.errors,
        memoryPeakUsage,
        averageThroughput: progress.processed / (duration / 1000)
      }
      
      this.emit('operation:complete', result)
      return result
    }
  }

  /**
   * Execute bulk insert with batching
   */
  private async executeBulkInsert(
    config: BulkOperationConfig,
    progress: BulkOperationProgress,
    batchSize: number,
    operationId: string
  ): Promise<BulkOperationResult> {
    if (!config.data || config.data.length === 0) {
      throw new Error('No data provided for bulk insert')
    }

    const startTime = Date.now()
    const batches = this.createBatches(config.data, batchSize)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      progress.currentBatch = i + 1
      
      // Check memory before processing batch
      const memoryAllocation = memoryManager.allocate(
        batch.length * 1000, // Estimate bytes per record
        'bulk_insert'
      )
      
      if (!memoryAllocation) {
        // Memory pressure too high, wait and retry
        logger.warn('Memory pressure too high, waiting...')
        await this.delay(1000)
        i-- // Retry this batch
        continue
      }

      try {
        // Validate and transform batch items
        const processedBatch = []
        for (const item of batch) {
          // Validate if function provided
          if (config.validateFn) {
            const isValid = await config.validateFn(item)
            if (!isValid) {
              progress.skipped++
              continue
            }
          }

          // Transform if function provided
          const processed = config.transformFn ? 
            await config.transformFn(item) : item
          processedBatch.push(processed)
        }

        if (processedBatch.length > 0 && !config.dryRun) {
          // Execute insert
          const { data, error } = await this.supabase
            .from(config.tableName)
            .insert(processedBatch)
            .select()

          if (error) {
            progress.failed += processedBatch.length
            progress.errors.push({
              item: processedBatch,
              error: error.message
            })
            
            // Call error handler if provided
            if (config.errorHandler) {
              config.errorHandler(error, processedBatch)
            }
          } else {
            progress.succeeded += processedBatch.length
          }
        } else if (config.dryRun) {
          progress.succeeded += processedBatch.length
        }

        progress.processed += batch.length
        
        // Update progress
        this.updateProgress(progress, startTime)
        
        if (config.progressCallback) {
          config.progressCallback(progress)
        }
        
        // Update memory peak usage
        const memStatus = memoryManager.getMemoryStatus()
        if (memStatus.heapUsed > progress.memoryUsage) {
          progress.memoryUsage = memStatus.heapUsed
        }

      } finally {
        // Release memory allocation
        memoryManager.release(memoryAllocation)
      }

      // Add delay between batches to prevent overwhelming the database
      if (i < batches.length - 1) {
        await this.delay(100)
      }
    }

    return this.createResult(progress, startTime)
  }

  /**
   * Execute bulk update with streaming
   */
  private async executeBulkUpdate(
    config: BulkOperationConfig,
    progress: BulkOperationProgress,
    batchSize: number,
    operationId: string
  ): Promise<BulkOperationResult> {
    const startTime = Date.now()
    
    if (config.data && config.data.length > 0) {
      // Update specific records
      const batches = this.createBatches(config.data, batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        progress.currentBatch = i + 1
        
        // Check memory
        const memoryAllocation = memoryManager.allocate(
          batch.length * 1000,
          'bulk_update'
        )
        
        if (!memoryAllocation) {
          await this.delay(1000)
          i--
          continue
        }

        try {
          for (const item of batch) {
            if (!item.id) {
              progress.skipped++
              continue
            }

            const { id, ...updateData } = item
            
            // Transform if needed
            const processed = config.transformFn ? 
              await config.transformFn(updateData) : updateData

            if (!config.dryRun) {
              const { error } = await this.supabase
                .from(config.tableName)
                .update(processed)
                .eq('id', id)

              if (error) {
                progress.failed++
                progress.errors.push({ item, error: error.message })
                if (config.errorHandler) {
                  config.errorHandler(error, item)
                }
              } else {
                progress.succeeded++
              }
            } else {
              progress.succeeded++
            }

            progress.processed++
          }

          this.updateProgress(progress, startTime)
          if (config.progressCallback) {
            config.progressCallback(progress)
          }

        } finally {
          memoryManager.release(memoryAllocation)
        }

        await this.delay(100)
      }
    } else if (config.filter) {
      // Update by filter - use streaming for large datasets
      const paginator = new StreamingPaginator(this.supabase)
      const { stream, controller, metadata } = await paginator.createStream({
        tableName: config.tableName,
        chunkSize: batchSize,
        progressCallback: (streamProgress) => {
          progress.processed = streamProgress.processed
          progress.percentage = streamProgress.percentage
          this.updateProgress(progress, startTime)
          if (config.progressCallback) {
            config.progressCallback(progress)
          }
        }
      })

      // Process stream
      for await (const record of stream) {
        // Apply update logic
        const processed = config.transformFn ? 
          await config.transformFn(record) : record

        if (!config.dryRun) {
          const { error } = await this.supabase
            .from(config.tableName)
            .update(processed)
            .eq('id', record.id)

          if (error) {
            progress.failed++
            progress.errors.push({ item: record, error: error.message })
          } else {
            progress.succeeded++
          }
        } else {
          progress.succeeded++
        }
      }
    }

    return this.createResult(progress, startTime)
  }

  /**
   * Execute bulk delete with safety checks
   */
  private async executeBulkDelete(
    config: BulkOperationConfig,
    progress: BulkOperationProgress,
    batchSize: number,
    operationId: string
  ): Promise<BulkOperationResult> {
    const startTime = Date.now()
    
    if (config.data && config.data.length > 0) {
      // Delete specific records
      const ids = config.data.map(item => 
        typeof item === 'string' ? item : item.id
      ).filter(Boolean)
      
      const batches = this.createBatches(ids, batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        progress.currentBatch = i + 1
        
        if (!config.dryRun) {
          const { error } = await this.supabase
            .from(config.tableName)
            .delete()
            .in('id', batch)

          if (error) {
            progress.failed += batch.length
            progress.errors.push({ 
              item: batch, 
              error: error.message 
            })
          } else {
            progress.succeeded += batch.length
          }
        } else {
          progress.succeeded += batch.length
        }

        progress.processed += batch.length
        this.updateProgress(progress, startTime)
        
        if (config.progressCallback) {
          config.progressCallback(progress)
        }

        await this.delay(100)
      }
    } else if (config.filter) {
      // Delete by filter - requires confirmation
      if (!config.dryRun) {
        logger.warn('Bulk delete by filter - use with extreme caution')
        
        // First count records to be deleted
        const { count } = await this.supabase
          .from(config.tableName)
          .select('*', { count: 'exact', head: true })
          .match(config.filter)

        if (count && count > 1000) {
          throw new Error(`Attempting to delete ${count} records. Use streaming delete for large datasets.`)
        }

        const { error } = await this.supabase
          .from(config.tableName)
          .delete()
          .match(config.filter)

        if (error) {
          progress.failed = count || 0
          progress.errors.push({ 
            item: config.filter, 
            error: error.message 
          })
        } else {
          progress.succeeded = count || 0
        }
        
        progress.processed = count || 0
      }
    }

    return this.createResult(progress, startTime)
  }

  /**
   * Execute bulk upsert
   */
  private async executeBulkUpsert(
    config: BulkOperationConfig,
    progress: BulkOperationProgress,
    batchSize: number,
    operationId: string
  ): Promise<BulkOperationResult> {
    if (!config.data || config.data.length === 0) {
      throw new Error('No data provided for bulk upsert')
    }

    const startTime = Date.now()
    const batches = this.createBatches(config.data, batchSize)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      progress.currentBatch = i + 1
      
      const processedBatch = []
      for (const item of batch) {
        if (config.validateFn) {
          const isValid = await config.validateFn(item)
          if (!isValid) {
            progress.skipped++
            continue
          }
        }

        const processed = config.transformFn ? 
          await config.transformFn(item) : item
        processedBatch.push(processed)
      }

      if (processedBatch.length > 0 && !config.dryRun) {
        const { error } = await this.supabase
          .from(config.tableName)
          .upsert(processedBatch, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })

        if (error) {
          progress.failed += processedBatch.length
          progress.errors.push({
            item: processedBatch,
            error: error.message
          })
        } else {
          progress.succeeded += processedBatch.length
        }
      } else if (config.dryRun) {
        progress.succeeded += processedBatch.length
      }

      progress.processed += batch.length
      this.updateProgress(progress, startTime)
      
      if (config.progressCallback) {
        config.progressCallback(progress)
      }

      await this.delay(100)
    }

    return this.createResult(progress, startTime)
  }

  /**
   * Create batches from data array
   */
  private createBatches<T>(data: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Calculate optimal batch size based on memory
   */
  private calculateOptimalBatchSize(requestedSize?: number): number {
    const defaultSize = requestedSize || 100
    const recommendedSize = memoryManager.getRecommendedBatchSize(defaultSize)
    
    logger.info('Calculated optimal batch size', {
      requested: requestedSize,
      recommended: recommendedSize,
      memoryStatus: memoryManager.getMemoryStatus().percentage
    })
    
    return recommendedSize
  }

  /**
   * Update progress metrics
   */
  private updateProgress(progress: BulkOperationProgress, startTime: number): void {
    const elapsed = Date.now() - startTime
    progress.percentage = progress.total > 0 ? 
      (progress.processed / progress.total) * 100 : 0
    progress.throughput = progress.processed / (elapsed / 1000)
    progress.estimatedTimeRemaining = progress.throughput > 0 ?
      ((progress.total - progress.processed) / progress.throughput) * 1000 : 0
    
    const memStatus = memoryManager.getMemoryStatus()
    progress.memoryUsage = memStatus.heapUsed
  }

  /**
   * Create operation result
   */
  private createResult(
    progress: BulkOperationProgress,
    startTime: number
  ): BulkOperationResult {
    const duration = Date.now() - startTime
    
    return {
      success: progress.failed === 0,
      processed: progress.processed,
      succeeded: progress.succeeded,
      failed: progress.failed,
      skipped: progress.skipped,
      duration,
      errors: progress.errors.slice(0, 100), // Limit errors to prevent memory issues
      memoryPeakUsage: progress.memoryUsage,
      averageThroughput: progress.processed / (duration / 1000)
    }
  }

  /**
   * Handle memory pressure
   */
  private handleMemoryPressure(): void {
    logger.warn('Memory pressure detected in bulk operations')
    // Could pause operations or reduce batch sizes
  }

  /**
   * Handle memory emergency
   */
  private handleMemoryEmergency(): void {
    logger.error('Memory emergency in bulk operations - cancelling all operations')
    // Cancel all active operations
    this.activeOperations.clear()
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get active operations
   */
  getActiveOperations(): BulkOperationProgress[] {
    return Array.from(this.activeOperations.values())
  }

  /**
   * Cancel an operation
   */
  cancelOperation(operationId: string): boolean {
    return this.activeOperations.delete(operationId)
  }
}

export default BulkOperationsManager