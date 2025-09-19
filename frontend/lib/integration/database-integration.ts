/**
 * Database Integration Service
 * Handles database operations with proper error handling and connection management
 */

import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

export class DatabaseIntegrationService {
  private supabase: SupabaseClient
  private connectionPool: Map<string, SupabaseClient> = new Map()

  constructor() {
    this.supabase = createSupabaseServiceClient()
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await this.supabase
        .from('managed_content')
        .select('count(*)', { count: 'exact', head: true })

      if (error) {
        throw error
      }

      const latency = Date.now() - startTime
      return { success: true, latency }
    } catch (error) {
      const latency = Date.now() - startTime
      return { 
        success: false, 
        latency, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Execute raw SQL query (for testing purposes)
   */
  async executeQuery<T = any>(
    query: string, 
    params?: any[]
  ): Promise<{ data: T[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query,
        params: params || []
      })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Query execution failed' 
      }
    }
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics(): Promise<{
    connectionCount: number
    activeQueries: number
    avgQueryTime: number
    error?: string
  }> {
    try {
      // This would typically query pg_stat_activity or similar
      // For now, return mock data
      return {
        connectionCount: 5,
        activeQueries: 2,
        avgQueryTime: 45
      }
    } catch (error) {
      return {
        connectionCount: 0,
        activeQueries: 0,
        avgQueryTime: 0,
        error: error instanceof Error ? error.message : 'Failed to get metrics'
      }
    }
  }

  /**
   * Test concurrent connections
   */
  async testConcurrentConnections(connectionCount: number): Promise<{
    success: boolean
    results: Array<{ success: boolean; latency: number; error?: string }>
  }> {
    const promises = Array(connectionCount).fill(null).map(async (_, index) => {
      return this.testConnection()
    })

    try {
      const results = await Promise.all(promises)
      const success = results.every(r => r.success)
      
      return { success, results }
    } catch (error) {
      return { 
        success: false, 
        results: [{ 
          success: false, 
          latency: 0, 
          error: error instanceof Error ? error.message : 'Concurrent test failed' 
        }] 
      }
    }
  }

  /**
   * Cleanup connections
   */
  async cleanup(): Promise<void> {
    // Close any additional connections in the pool
    for (const [key, client] of this.connectionPool) {
      try {
        // Supabase clients don't need explicit cleanup
        this.connectionPool.delete(key)
      } catch (error) {
        logger.error(`Failed to cleanup connection ${key}:`, error)
      }
    }
  }
}

// Export singleton instance
export const databaseIntegration = new DatabaseIntegrationService()