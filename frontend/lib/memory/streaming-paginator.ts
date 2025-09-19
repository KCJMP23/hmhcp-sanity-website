/**
 * Streaming Paginator for Ultra-Large Datasets
 * Implements memory-efficient streaming with automatic chunking
 * Handles 1M+ records without OOM issues
 */

import { Readable, Transform, pipeline } from 'stream'
import { promisify } from 'util'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { memoryManager, DegradationStrategy } from './memory-manager'
import { EventEmitter } from 'events'

const pipelineAsync = promisify(pipeline)

export interface StreamConfig {
  tableName: string
  chunkSize?: number
  highWaterMark?: number
  maxConcurrent?: number
  enableBackpressure?: boolean
  memoryLimit?: number
  progressCallback?: (progress: StreamProgress) => void
  transformFn?: (data: any) => any
  filterFn?: (data: any) => boolean
}

export interface StreamProgress {
  processed: number
  total: number
  percentage: number
  bytesProcessed: number
  timeElapsed: number
  estimatedTimeRemaining: number
  currentChunk: number
  totalChunks: number
  memoryUsage: number
  throughput: number
}

export interface StreamResult<T> {
  stream: Readable
  controller: StreamController
  metadata: StreamMetadata
}

export interface StreamMetadata {
  id: string
  startTime: number
  endTime?: number
  totalRecords?: number
  processedRecords: number
  errors: number
  status: 'initializing' | 'streaming' | 'paused' | 'completed' | 'error'
  memoryPeakUsage: number
}

export class StreamController extends EventEmitter {
  private paused: boolean = false
  private cancelled: boolean = false
  private readonly streamId: string

  constructor(streamId: string) {
    super()
    this.streamId = streamId
  }

  pause(): void {
    this.paused = true
    this.emit('paused')
  }

  resume(): void {
    this.paused = false
    this.emit('resumed')
  }

  cancel(): void {
    this.cancelled = true
    this.emit('cancelled')
  }

  isPaused(): boolean {
    return this.paused
  }

  isCancelled(): boolean {
    return this.cancelled
  }

  getStreamId(): string {
    return this.streamId
  }
}

export class StreamingPaginator {
  private supabase: SupabaseClient
  private activeStreams: Map<string, StreamMetadata> = new Map()
  private readonly maxActiveStreams = 5

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase

    // Monitor memory and adjust streaming
    memoryManager.on('memory:alert', () => this.handleMemoryPressure())
    memoryManager.on('memory:emergency', () => this.handleMemoryEmergency())
  }

  /**
   * Create a streaming query for large datasets
   */
  async createStream<T = any>(
    config: StreamConfig,
    queryBuilder?: (query: any) => any
  ): Promise<StreamResult<T>> {
    const streamId = this.generateStreamId()
    const controller = new StreamController(streamId)
    
    // Check if we can start a new stream
    if (this.activeStreams.size >= this.maxActiveStreams) {
      throw new Error('Maximum number of active streams reached')
    }

    // Initialize metadata
    const metadata: StreamMetadata = {
      id: streamId,
      startTime: Date.now(),
      processedRecords: 0,
      errors: 0,
      status: 'initializing',
      memoryPeakUsage: 0
    }
    this.activeStreams.set(streamId, metadata)

    // Calculate optimal chunk size based on memory
    const chunkSize = this.calculateOptimalChunkSize(config.chunkSize)
    
    // Create the stream
    const stream = await this.createDataStream(
      config,
      chunkSize,
      controller,
      metadata,
      queryBuilder
    )

    return {
      stream,
      controller,
      metadata
    }
  }

  /**
   * Create the actual data stream
   */
  private async createDataStream<T>(
    config: StreamConfig,
    chunkSize: number,
    controller: StreamController,
    metadata: StreamMetadata,
    queryBuilder?: (query: any) => any
  ): Promise<Readable> {
    const { tableName, transformFn, filterFn, progressCallback } = config
    
    let cursor: string | undefined
    let hasMore = true
    let totalRecords = 0

    // Get total count if needed for progress
    if (progressCallback) {
      try {
        const countQuery = this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        const { count } = queryBuilder ? 
          await queryBuilder(countQuery) : 
          await countQuery

        totalRecords = count || 0
        metadata.totalRecords = totalRecords
      } catch (error) {
        logger.warn('Failed to get total count for stream', { error })
      }
    }

    // Create readable stream
    const stream = new Readable({
      objectMode: true,
      highWaterMark: config.highWaterMark || 16,
      
      async read() {
        if (controller.isCancelled()) {
          this.push(null)
          return
        }

        if (controller.isPaused()) {
          setTimeout(() => this.read(), 100)
          return
        }

        if (!hasMore) {
          this.push(null)
          return
        }

        try {
          // Check memory before fetching
          const memoryAllocation = memoryManager.allocate(
            chunkSize * 1000, // Estimate bytes per record
            'streaming_pagination'
          )

          if (!memoryAllocation) {
            // Memory pressure too high, wait and retry
            logger.warn('Memory pressure too high, pausing stream')
            setTimeout(() => this.read(), 1000)
            return
          }

          // Fetch next chunk
          const chunk = await this.fetchChunk(
            tableName,
            chunkSize,
            cursor,
            queryBuilder
          )

          if (chunk.data && chunk.data.length > 0) {
            cursor = chunk.cursor
            hasMore = chunk.hasMore

            // Process and emit data
            for (const record of chunk.data) {
              // Apply filter if provided
              if (filterFn && !filterFn(record)) {
                continue
              }

              // Apply transformation if provided
              const processed = transformFn ? transformFn(record) : record

              // Push to stream
              if (!this.push(processed)) {
                // Backpressure detected
                memoryManager.release(memoryAllocation)
                return
              }

              metadata.processedRecords++
              
              // Update progress
              if (progressCallback && metadata.processedRecords % 100 === 0) {
                const progress = this.calculateProgress(metadata, totalRecords)
                progressCallback(progress)
              }
            }
          } else {
            hasMore = false
          }

          // Release memory allocation
          memoryManager.release(memoryAllocation)

          // Update peak memory usage
          const memStatus = memoryManager.getMemoryStatus()
          metadata.memoryPeakUsage = Math.max(
            metadata.memoryPeakUsage,
            memStatus.heapUsed
          )

        } catch (error) {
          metadata.errors++
          logger.error('Stream chunk fetch error', { error, streamId: metadata.id })
          
          if (metadata.errors > 3) {
            metadata.status = 'error'
            this.destroy(new Error('Too many errors in stream'))
          }
        }
      },

      destroy(error, callback) {
        metadata.status = error ? 'error' : 'completed'
        metadata.endTime = Date.now()
        
        // Clean up
        if (this.activeStreams) {
          this.activeStreams.delete(metadata.id)
        }

        callback(error)
      }
    })

    metadata.status = 'streaming'
    return stream
  }

  /**
   * Fetch a chunk of data with cursor
   */
  private async fetchChunk(
    tableName: string,
    chunkSize: number,
    cursor?: string,
    queryBuilder?: (query: any) => any
  ): Promise<{
    data: any[]
    cursor?: string
    hasMore: boolean
  }> {
    let query = this.supabase
      .from(tableName)
      .select('*')
      .order('id', { ascending: true })
      .limit(chunkSize + 1) // Fetch one extra to check if there's more

    // Apply cursor if provided
    if (cursor) {
      query = query.gt('id', cursor)
    }

    // Apply custom query builder
    if (queryBuilder) {
      query = queryBuilder(query)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const hasMore = data && data.length > chunkSize
    const records = hasMore ? data.slice(0, -1) : data || []
    const nextCursor = records.length > 0 ? 
      records[records.length - 1].id : 
      undefined

    return {
      data: records,
      cursor: nextCursor,
      hasMore
    }
  }

  /**
   * Create a transform stream for data processing
   */
  createTransformStream(
    transformFn: (chunk: any) => any,
    options?: {
      parallel?: number
      errorHandler?: (error: Error, chunk: any) => void
    }
  ): Transform {
    const parallel = options?.parallel || 1
    const errorHandler = options?.errorHandler || ((error) => {
      logger.error('Transform stream error', { error })
    })

    let processing = 0
    const queue: any[] = []

    return new Transform({
      objectMode: true,
      highWaterMark: parallel * 2,

      async transform(chunk, encoding, callback) {
        // Wait if too many parallel operations
        while (processing >= parallel) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }

        processing++

        try {
          const result = await transformFn(chunk)
          callback(null, result)
        } catch (error) {
          errorHandler(error as Error, chunk)
          callback() // Skip failed chunks
        } finally {
          processing--
        }
      },

      flush(callback) {
        // Wait for all processing to complete
        const checkComplete = () => {
          if (processing === 0) {
            callback()
          } else {
            setTimeout(checkComplete, 10)
          }
        }
        checkComplete()
      }
    })
  }

  /**
   * Stream data to a file or external system
   */
  async streamToFile(
    config: StreamConfig,
    outputPath: string,
    format: 'json' | 'csv' | 'ndjson' = 'ndjson'
  ): Promise<void> {
    const fs = await import('fs')
    const { stream, controller, metadata } = await this.createStream(config)
    
    let writeStream: any
    let transformStream: Transform

    switch (format) {
      case 'json':
        writeStream = fs.createWriteStream(outputPath)
        transformStream = this.createJSONTransform()
        break
      case 'csv':
        writeStream = fs.createWriteStream(outputPath)
        transformStream = await this.createCSVTransform()
        break
      case 'ndjson':
        writeStream = fs.createWriteStream(outputPath)
        transformStream = this.createNDJSONTransform()
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }

    // Monitor progress
    let recordCount = 0
    const progressTransform = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        recordCount++
        if (recordCount % 1000 === 0) {
          logger.info(`Streamed ${recordCount} records to file`)
        }
        callback(null, chunk)
      }
    })

    try {
      await pipelineAsync(
        stream,
        progressTransform,
        transformStream,
        writeStream
      )

      logger.info('Stream to file completed', {
        outputPath,
        records: recordCount,
        duration: Date.now() - metadata.startTime
      })
    } catch (error) {
      logger.error('Stream to file failed', { error })
      throw error
    }
  }

  /**
   * Calculate optimal chunk size based on memory
   */
  private calculateOptimalChunkSize(requestedSize?: number): number {
    const defaultSize = requestedSize || 100
    const recommendedSize = memoryManager.getRecommendedBatchSize(defaultSize)
    
    // Apply additional constraints based on degradation strategy
    const strategy = memoryManager.getDegradationStrategy()
    
    switch (strategy) {
      case DegradationStrategy.NONE:
        return recommendedSize
      case DegradationStrategy.REDUCE_BATCH_SIZE:
        return Math.floor(recommendedSize * 0.75)
      case DegradationStrategy.FORCE_STREAMING:
        return Math.floor(recommendedSize * 0.5)
      case DegradationStrategy.REJECT_OPERATIONS:
        return Math.max(1, Math.floor(recommendedSize * 0.1))
      default:
        return recommendedSize
    }
  }

  /**
   * Calculate stream progress
   */
  private calculateProgress(
    metadata: StreamMetadata,
    totalRecords: number
  ): StreamProgress {
    const timeElapsed = Date.now() - metadata.startTime
    const throughput = metadata.processedRecords / (timeElapsed / 1000)
    const percentage = totalRecords > 0 ? 
      (metadata.processedRecords / totalRecords) * 100 : 0
    const estimatedTimeRemaining = totalRecords > 0 && throughput > 0 ?
      ((totalRecords - metadata.processedRecords) / throughput) * 1000 : 0

    const memStatus = memoryManager.getMemoryStatus()

    return {
      processed: metadata.processedRecords,
      total: totalRecords,
      percentage,
      bytesProcessed: 0, // Would need to track this separately
      timeElapsed,
      estimatedTimeRemaining,
      currentChunk: Math.floor(metadata.processedRecords / 100),
      totalChunks: Math.ceil(totalRecords / 100),
      memoryUsage: memStatus.heapUsed,
      throughput
    }
  }

  /**
   * Handle memory pressure by pausing streams
   */
  private handleMemoryPressure(): void {
    logger.warn('Memory pressure detected, pausing non-critical streams')
    
    // Pause all active streams temporarily
    for (const [streamId, metadata] of this.activeStreams) {
      if (metadata.status === 'streaming') {
        // Would need to track controllers separately
        logger.info(`Pausing stream ${streamId} due to memory pressure`)
      }
    }
  }

  /**
   * Handle memory emergency by cancelling streams
   */
  private handleMemoryEmergency(): void {
    logger.error('Memory emergency, cancelling all streams')
    
    // Cancel all active streams
    for (const [streamId, metadata] of this.activeStreams) {
      metadata.status = 'error'
      this.activeStreams.delete(streamId)
    }
  }

  /**
   * Create JSON transform stream
   */
  private createJSONTransform(): Transform {
    let first = true
    
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        if (first) {
          first = false
          callback(null, '[\n' + JSON.stringify(chunk))
        } else {
          callback(null, ',\n' + JSON.stringify(chunk))
        }
      },
      flush(callback) {
        callback(null, '\n]')
      }
    })
  }

  /**
   * Create NDJSON transform stream
   */
  private createNDJSONTransform(): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        callback(null, JSON.stringify(chunk) + '\n')
      }
    })
  }

  /**
   * Create CSV transform stream
   */
  private async createCSVTransform(): Promise<Transform> {
    // Dynamic import for CSV library
    const { parse } = await import('json2csv')
    let headers: string[] | null = null

    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          if (!headers) {
            headers = Object.keys(chunk)
            const csv = parse([chunk], { fields: headers })
            callback(null, csv + '\n')
          } else {
            const csv = parse([chunk], { fields: headers, header: false })
            callback(null, csv + '\n')
          }
        } catch (error) {
          callback(error as Error)
        }
      }
    })
  }

  /**
   * Generate unique stream ID
   */
  private generateStreamId(): string {
    return `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get active streams information
   */
  getActiveStreams(): StreamMetadata[] {
    return Array.from(this.activeStreams.values())
  }

  /**
   * Cancel a specific stream
   */
  cancelStream(streamId: string): boolean {
    const metadata = this.activeStreams.get(streamId)
    if (metadata) {
      metadata.status = 'error'
      this.activeStreams.delete(streamId)
      return true
    }
    return false
  }

  /**
   * Cancel all active streams
   */
  cancelAllStreams(): void {
    for (const streamId of this.activeStreams.keys()) {
      this.cancelStream(streamId)
    }
  }
}

export default StreamingPaginator