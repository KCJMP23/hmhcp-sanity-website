/**
 * Enhanced Cursor Utilities for Memory-Safe Pagination
 * Implements efficient cursor encoding/decoding with memory optimization
 */

import { logger } from '@/lib/logger'
import { memoryManager } from './memory-manager'

export interface CursorData {
  id: string
  sortValue: any
  timestamp: number
  checksum?: string
}

export interface CursorOptions {
  encrypt?: boolean
  compress?: boolean
  ttl?: number
  maxSize?: number
}

export interface CursorCondition {
  field: string
  value: any
  op?: string
  fallback?: {
    field: string
    op: string
    value: any
  }
}

export class CursorUtils {
  private static readonly CURSOR_VERSION = 'v2'
  private static readonly MAX_CURSOR_SIZE = 1024 // 1KB max cursor size
  private static readonly CURSOR_CACHE = new Map<string, CursorData>()
  private static readonly MAX_CACHE_SIZE = 1000

  /**
   * Encode a cursor from entity data
   */
  static encode(
    entity: any,
    sortField: string = 'created_at',
    options: CursorOptions = {}
  ): string {
    try {
      // Check memory before encoding
      const estimatedSize = JSON.stringify(entity).length
      if (!memoryManager.canAllocate(estimatedSize, 'cursor_encoding')) {
        logger.warn('Memory pressure too high for cursor encoding')
        // Return simplified cursor
        return this.encodeSimple(entity.id)
      }

      const cursorData: CursorData = {
        id: entity.id || entity._id,
        sortValue: entity[sortField],
        timestamp: Date.now()
      }

      // Add checksum for integrity
      if (options.encrypt) {
        cursorData.checksum = this.generateChecksum(cursorData)
      }

      let encoded = JSON.stringify(cursorData)

      // Compress if requested and beneficial
      if (options.compress && encoded.length > 100) {
        encoded = this.compress(encoded)
      }

      // Check size limit
      if (encoded.length > this.MAX_CURSOR_SIZE) {
        logger.warn('Cursor too large, using simplified version', {
          size: encoded.length,
          maxSize: this.MAX_CURSOR_SIZE
        })
        return this.encodeSimple(cursorData.id)
      }

      // Base64 encode
      const cursor = Buffer.from(encoded).toString('base64url')

      // Cache for faster decoding
      this.cacheAdd(cursor, cursorData)

      return `${this.CURSOR_VERSION}:${cursor}`
    } catch (error) {
      logger.error('Cursor encoding failed', { error })
      return this.encodeSimple(entity.id || entity._id)
    }
  }

  /**
   * Decode a cursor to retrieve data
   */
  static decode(cursor: string, options: CursorOptions = {}): CursorData | null {
    try {
      // Check cache first
      const cached = this.cacheGet(cursor)
      if (cached) {
        return cached
      }

      // Remove version prefix if present
      let encodedCursor = cursor
      if (cursor.startsWith(`${this.CURSOR_VERSION}:`)) {
        encodedCursor = cursor.substring(this.CURSOR_VERSION.length + 1)
      } else if (cursor.startsWith('v1:')) {
        // Handle legacy v1 cursors
        return this.decodeLegacy(cursor)
      }

      // Base64 decode
      let decoded = Buffer.from(encodedCursor, 'base64url').toString('utf-8')

      // Decompress if needed
      if (this.isCompressed(decoded)) {
        decoded = this.decompress(decoded)
      }

      const cursorData = JSON.parse(decoded) as CursorData

      // Validate checksum if present
      if (options.encrypt && cursorData.checksum) {
        const expectedChecksum = this.generateChecksum({
          ...cursorData,
          checksum: undefined
        })
        if (cursorData.checksum !== expectedChecksum) {
          logger.warn('Cursor checksum validation failed')
          return null
        }
      }

      // Check TTL if specified
      if (options.ttl && cursorData.timestamp) {
        const age = Date.now() - cursorData.timestamp
        if (age > options.ttl) {
          logger.warn('Cursor expired', { age, ttl: options.ttl })
          return null
        }
      }

      // Cache for future use
      this.cacheAdd(cursor, cursorData)

      return cursorData
    } catch (error) {
      logger.error('Cursor decoding failed', { error, cursor })
      return null
    }
  }

  /**
   * Build cursor condition for database query
   */
  static buildCursorCondition(
    cursor: string,
    direction: 'before' | 'after',
    sortField: string = 'created_at',
    ascending: boolean = true
  ): CursorCondition {
    const cursorData = this.decode(cursor)
    
    if (!cursorData) {
      throw new Error('Invalid cursor')
    }

    const condition: CursorCondition = {
      field: sortField,
      value: cursorData.sortValue,
      fallback: {
        field: 'id',
        op: direction === 'after' ? 'gt' : 'lt',
        value: cursorData.id
      }
    }

    // Determine operator based on direction and sort order
    if (ascending) {
      condition.op = direction === 'after' ? 'gt' : 'lt'
    } else {
      condition.op = direction === 'after' ? 'lt' : 'gt'
    }

    return condition
  }

  /**
   * Create a simplified cursor (fallback)
   */
  private static encodeSimple(id: string): string {
    return `simple:${Buffer.from(id).toString('base64url')}`
  }

  /**
   * Decode legacy v1 cursor
   */
  private static decodeLegacy(cursor: string): CursorData | null {
    try {
      const encoded = cursor.substring(3) // Remove 'v1:'
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
      const [id, sortValue] = decoded.split('|')
      
      return {
        id,
        sortValue,
        timestamp: Date.now()
      }
    } catch (error) {
      logger.error('Legacy cursor decoding failed', { error })
      return null
    }
  }

  /**
   * Generate checksum for cursor data
   */
  private static generateChecksum(data: Omit<CursorData, 'checksum'>): string {
    const crypto = require('crypto')
    const str = JSON.stringify(data)
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8)
  }

  /**
   * Simple compression using base encoding tricks
   */
  private static compress(data: string): string {
    // Simple compression by removing whitespace and using shorter keys
    const compressed = data
      .replace(/\"id\":/g, '"i":')
      .replace(/\"sortValue\":/g, '"s":')
      .replace(/\"timestamp\":/g, '"t":')
      .replace(/\"checksum\":/g, '"c":')
      .replace(/\s+/g, '')
    
    return `c:${compressed}`
  }

  /**
   * Decompress data
   */
  private static decompress(data: string): string {
    if (!data.startsWith('c:')) {
      return data
    }

    const compressed = data.substring(2)
    return compressed
      .replace(/\"i\":/g, '"id":')
      .replace(/\"s\":/g, '"sortValue":')
      .replace(/\"t\":/g, '"timestamp":')
      .replace(/\"c\":/g, '"checksum":')
  }

  /**
   * Check if data is compressed
   */
  private static isCompressed(data: string): boolean {
    return data.startsWith('c:')
  }

  /**
   * Add to cache with size management
   */
  private static cacheAdd(cursor: string, data: CursorData): void {
    // Check cache size
    if (this.CURSOR_CACHE.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries (FIFO)
      const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2) // Remove 20%
      const keys = Array.from(this.CURSOR_CACHE.keys())
      for (let i = 0; i < toRemove; i++) {
        this.CURSOR_CACHE.delete(keys[i])
      }
    }

    this.CURSOR_CACHE.set(cursor, data)
  }

  /**
   * Get from cache
   */
  private static cacheGet(cursor: string): CursorData | undefined {
    return this.CURSOR_CACHE.get(cursor)
  }

  /**
   * Clear cursor cache
   */
  static clearCache(): void {
    this.CURSOR_CACHE.clear()
  }

  /**
   * Generate cursor for offset-based pagination fallback
   */
  static generateOffsetCursor(page: number, limit: number): string {
    const offset = (page - 1) * limit
    return Buffer.from(`offset:${offset}:${limit}`).toString('base64url')
  }

  /**
   * Parse offset cursor
   */
  static parseOffsetCursor(cursor: string): { offset: number; limit: number } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf-8')
      if (!decoded.startsWith('offset:')) {
        return null
      }

      const [, offsetStr, limitStr] = decoded.split(':')
      return {
        offset: parseInt(offsetStr, 10),
        limit: parseInt(limitStr, 10)
      }
    } catch (error) {
      logger.error('Offset cursor parsing failed', { error })
      return null
    }
  }

  /**
   * Create a composite cursor for multiple sort fields
   */
  static encodeComposite(
    entity: any,
    sortFields: string[],
    options: CursorOptions = {}
  ): string {
    try {
      const values = sortFields.map(field => ({
        field,
        value: entity[field]
      }))

      const cursorData = {
        id: entity.id || entity._id,
        values,
        timestamp: Date.now()
      }

      const encoded = JSON.stringify(cursorData)
      
      // Check size
      if (encoded.length > this.MAX_CURSOR_SIZE) {
        // Fall back to simple cursor
        return this.encodeSimple(entity.id || entity._id)
      }

      return `composite:${Buffer.from(encoded).toString('base64url')}`
    } catch (error) {
      logger.error('Composite cursor encoding failed', { error })
      return this.encodeSimple(entity.id || entity._id)
    }
  }

  /**
   * Decode composite cursor
   */
  static decodeComposite(cursor: string): any | null {
    try {
      if (!cursor.startsWith('composite:')) {
        return null
      }

      const encoded = cursor.substring(10)
      const decoded = Buffer.from(encoded, 'base64url').toString('utf-8')
      return JSON.parse(decoded)
    } catch (error) {
      logger.error('Composite cursor decoding failed', { error })
      return null
    }
  }

  /**
   * Validate cursor format and integrity
   */
  static isValid(cursor: string): boolean {
    if (!cursor || typeof cursor !== 'string') {
      return false
    }

    // Check for known prefixes
    const validPrefixes = [
      `${this.CURSOR_VERSION}:`,
      'v1:',
      'simple:',
      'composite:',
      'offset:'
    ]

    const hasValidPrefix = validPrefixes.some(prefix => cursor.startsWith(prefix))
    if (!hasValidPrefix && !this.isBase64Url(cursor)) {
      return false
    }

    // Try to decode
    const decoded = this.decode(cursor)
    return decoded !== null
  }

  /**
   * Check if string is valid base64url
   */
  private static isBase64Url(str: string): boolean {
    const base64UrlRegex = /^[A-Za-z0-9_-]+$/
    return base64UrlRegex.test(str)
  }

  /**
   * Get cursor statistics
   */
  static getStats(): {
    cacheSize: number
    cacheHitRate: number
    averageCursorSize: number
  } {
    let totalSize = 0
    for (const [cursor, data] of this.CURSOR_CACHE.entries()) {
      totalSize += cursor.length + JSON.stringify(data).length
    }

    return {
      cacheSize: this.CURSOR_CACHE.size,
      cacheHitRate: 0, // Would need to track hits/misses
      averageCursorSize: this.CURSOR_CACHE.size > 0 ? 
        totalSize / this.CURSOR_CACHE.size : 0
    }
  }

  /**
   * Create cursor for resumable operations
   */
  static createResumableCursor(
    checkpoint: {
      lastId: string
      lastValue: any
      processedCount: number
      totalCount?: number
      metadata?: any
    }
  ): string {
    const data = {
      ...checkpoint,
      timestamp: Date.now(),
      version: this.CURSOR_VERSION
    }

    const encoded = JSON.stringify(data)
    return `resumable:${Buffer.from(encoded).toString('base64url')}`
  }

  /**
   * Parse resumable cursor
   */
  static parseResumableCursor(cursor: string): any | null {
    try {
      if (!cursor.startsWith('resumable:')) {
        return null
      }

      const encoded = cursor.substring(10)
      const decoded = Buffer.from(encoded, 'base64url').toString('utf-8')
      return JSON.parse(decoded)
    } catch (error) {
      logger.error('Resumable cursor parsing failed', { error })
      return null
    }
  }
}

export default CursorUtils