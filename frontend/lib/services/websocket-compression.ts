/**
 * WebSocket Compression Module
 * 
 * Implements compression for WebSocket messages to optimize bandwidth
 * Supports multiple compression algorithms with fallback
 */

import pako from 'pako'
import { logger } from '@/lib/logger'

export interface CompressionOptions {
  algorithm: 'gzip' | 'deflate' | 'brotli' | 'none'
  level: number // 1-9
  threshold: number // Minimum message size in bytes to compress
  enabledByDefault: boolean
}

export interface CompressedMessage {
  compressed: boolean
  algorithm?: string
  originalSize?: number
  compressedSize?: number
  data: string | ArrayBuffer
}

export class WebSocketCompression {
  private options: CompressionOptions
  private compressionRatio: number = 0
  private totalOriginalSize: number = 0
  private totalCompressedSize: number = 0
  private messageCount: number = 0

  constructor(options: Partial<CompressionOptions> = {}) {
    this.options = {
      algorithm: options.algorithm || 'gzip',
      level: options.level || 6,
      threshold: options.threshold || 1024, // 1KB default threshold
      enabledByDefault: options.enabledByDefault !== false
    }
  }

  /**
   * Compress a message if it meets the threshold
   */
  async compress(data: string | object): Promise<CompressedMessage> {
    const startTime = performance.now()
    
    try {
      // Convert to string if object
      const stringData = typeof data === 'string' ? data : JSON.stringify(data)
      const originalSize = new TextEncoder().encode(stringData).length

      // Check if compression is worth it
      if (!this.options.enabledByDefault || originalSize < this.options.threshold) {
        return {
          compressed: false,
          originalSize,
          data: stringData
        }
      }

      // Compress based on algorithm
      let compressed: Uint8Array
      
      switch (this.options.algorithm) {
        case 'gzip':
          compressed = pako.gzip(stringData, { level: this.options.level })
          break
        case 'deflate':
          compressed = pako.deflate(stringData, { level: this.options.level })
          break
        case 'brotli':
          // For brotli, we'd need a different library or native support
          // Fallback to gzip for now
          compressed = pako.gzip(stringData, { level: this.options.level })
          break
        default:
          return {
            compressed: false,
            originalSize,
            data: stringData
          }
      }

      const compressedSize = compressed.length
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

      // Update statistics
      this.updateStatistics(originalSize, compressedSize)

      // Only use compression if it actually reduces size
      if (compressedSize >= originalSize) {
        return {
          compressed: false,
          originalSize,
          data: stringData
        }
      }

      const duration = performance.now() - startTime
      
      logger.debug('Message compressed', {
        algorithm: this.options.algorithm,
        originalSize,
        compressedSize,
        ratio: `${compressionRatio.toFixed(2)}%`,
        duration: `${duration.toFixed(2)}ms`
      })

      // Convert to base64 for transmission
      const base64 = btoa(String.fromCharCode(...compressed))
      
      return {
        compressed: true,
        algorithm: this.options.algorithm,
        originalSize,
        compressedSize,
        data: base64
      }
    } catch (error) {
      logger.error('Compression failed', { error })
      
      // Fallback to uncompressed
      const stringData = typeof data === 'string' ? data : JSON.stringify(data)
      return {
        compressed: false,
        data: stringData
      }
    }
  }

  /**
   * Decompress a message
   */
  async decompress(message: CompressedMessage): Promise<string | object> {
    const startTime = performance.now()
    
    try {
      if (!message.compressed) {
        // Not compressed, return as-is
        if (typeof message.data === 'string') {
          try {
            return JSON.parse(message.data)
          } catch {
            return message.data
          }
        }
        return message.data
      }

      // Convert base64 back to Uint8Array
      const binaryString = atob(message.data as string)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Decompress based on algorithm
      let decompressed: string
      
      switch (message.algorithm) {
        case 'gzip':
          decompressed = pako.ungzip(bytes, { to: 'string' })
          break
        case 'deflate':
          decompressed = pako.inflate(bytes, { to: 'string' })
          break
        default:
          throw new Error(`Unsupported decompression algorithm: ${message.algorithm}`)
      }

      const duration = performance.now() - startTime
      
      logger.debug('Message decompressed', {
        algorithm: message.algorithm,
        originalSize: message.originalSize,
        compressedSize: message.compressedSize,
        duration: `${duration.toFixed(2)}ms`
      })

      // Try to parse as JSON
      try {
        return JSON.parse(decompressed)
      } catch {
        return decompressed
      }
    } catch (error) {
      logger.error('Decompression failed', { error })
      throw error
    }
  }

  /**
   * Update compression statistics
   */
  private updateStatistics(originalSize: number, compressedSize: number): void {
    this.totalOriginalSize += originalSize
    this.totalCompressedSize += compressedSize
    this.messageCount++
    
    if (this.totalOriginalSize > 0) {
      this.compressionRatio = ((this.totalOriginalSize - this.totalCompressedSize) / this.totalOriginalSize) * 100
    }
  }

  /**
   * Get compression statistics
   */
  getStatistics() {
    return {
      messageCount: this.messageCount,
      totalOriginalSize: this.totalOriginalSize,
      totalCompressedSize: this.totalCompressedSize,
      compressionRatio: this.compressionRatio,
      averageOriginalSize: this.messageCount > 0 ? this.totalOriginalSize / this.messageCount : 0,
      averageCompressedSize: this.messageCount > 0 ? this.totalCompressedSize / this.messageCount : 0,
      totalSaved: this.totalOriginalSize - this.totalCompressedSize
    }
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.compressionRatio = 0
    this.totalOriginalSize = 0
    this.totalCompressedSize = 0
    this.messageCount = 0
  }

  /**
   * Update compression options
   */
  updateOptions(options: Partial<CompressionOptions>): void {
    this.options = {
      ...this.options,
      ...options
    }
  }

  /**
   * Check if compression is enabled
   */
  isEnabled(): boolean {
    return this.options.enabledByDefault && this.options.algorithm !== 'none'
  }

  /**
   * Get current compression algorithm
   */
  getAlgorithm(): string {
    return this.options.algorithm
  }

  /**
   * Estimate compression ratio for a message
   */
  estimateCompressionRatio(data: string | object): number {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data)
    const originalSize = new TextEncoder().encode(stringData).length
    
    // Use historical average if available
    if (this.messageCount > 10 && this.compressionRatio > 0) {
      return this.compressionRatio
    }
    
    // Estimate based on content type
    // JSON typically compresses 60-80%
    // Plain text typically compresses 50-70%
    // Already compressed data won't compress much
    
    if (stringData.includes('{') && stringData.includes('}')) {
      // Likely JSON
      return 70
    } else if (stringData.match(/^[A-Za-z0-9+/=]+$/)) {
      // Likely base64 (already compressed)
      return 5
    } else {
      // Plain text
      return 60
    }
  }
}

// Export singleton instance for easy use
export const wsCompression = new WebSocketCompression()

// Export utility functions
export function compressMessage(data: string | object): Promise<CompressedMessage> {
  return wsCompression.compress(data)
}

export function decompressMessage(message: CompressedMessage): Promise<string | object> {
  return wsCompression.decompress(message)
}

export function getCompressionStats() {
  return wsCompression.getStatistics()
}