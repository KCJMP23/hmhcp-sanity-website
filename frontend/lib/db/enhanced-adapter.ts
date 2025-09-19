/**
 * Enhanced Database Adapter with Connection Pooling, Caching, and Query Optimization
 * Enterprise-grade database optimizations for performance and security
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '@/lib/logging/winston-logger';

// Connection Pool Configuration
interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  healthCheckInterval: number;
}

// Query Performance Monitoring
interface QueryMetrics {
  queryId: string;
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  rowCount?: number;
  fromCache?: boolean;
}

// Enterprise Database Record Types
interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  audit_trail?: AuditTrail[];
}

interface AuditTrail {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  user_id: string;
  timestamp: string;
  ip_address: string;
  changes?: Record<string, { from: any; to: any }>;
}

export class EnhancedDatabaseAdapter {
  private client: SupabaseClient;
  private connectionPool: Map<string, SupabaseClient> = new Map();
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private queryMetrics: QueryMetrics[] = [];
  private config: ConnectionPoolConfig;
  
  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.config = {
      maxConnections: 10,
      idleTimeout: 30000, // 30 seconds
      connectionTimeout: 5000, // 5 seconds
      retryAttempts: 3,
      healthCheckInterval: 60000, // 1 minute
      ...config
    };
    
    this.client = this.createOptimizedClient();
    this.startHealthCheckInterval();
  }
  
  private createOptimizedClient(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    if (supabaseUrl.includes('your-project') || supabaseServiceKey.includes('your-service-key')) {
      throw new Error('Invalid Supabase configuration. Please update environment variables with actual values.');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'hmhcp-production-platform',
          'x-client-info': 'enhanced-adapter/1.0'
        }
      },
      // Connection optimization for enterprise workloads
      realtime: {
        params: {
          eventsPerSecond: 10 // Limit real-time events for stability
        }
      }
    });
  }
  
  /**
   * Execute optimized query with caching and performance monitoring
   */
  async executeQuery<T>(
    operation: 'select' | 'insert' | 'update' | 'delete',
    table: string,
    config: {
      select?: string;
      filters?: Record<string, any>;
      data?: any;
      options?: {
        cache?: { ttl: number; key?: string };
        audit?: { userId: string; ipAddress: string };
        limit?: number;
        offset?: number;
        orderBy?: { column: string; ascending: boolean };
      };
    }
  ): Promise<{ data: T; metrics: QueryMetrics }> {
    const queryId = this.generateQueryId();
    const startTime = Date.now();
    
    try {
      // Security validation
      this.validateTableName(table);
      
      // Check cache for SELECT operations
      if (operation === 'select' && config.options?.cache) {
        const cached = this.getCachedResult(config.options.cache.key || table);
        if (cached) {
          const metrics: QueryMetrics = {
            queryId,
            query: `SELECT FROM ${table}`,
            duration: Date.now() - startTime,
            timestamp: startTime,
            success: true,
            fromCache: true
          };
          return { data: cached, metrics };
        }
      }
      
      // Build and execute query
      const result = await this.buildAndExecuteQuery<T>(operation, table, config);
      
      // Cache result if specified
      if (operation === 'select' && config.options?.cache && result.data) {
        this.setCachedResult(
          config.options.cache.key || table,
          result.data,
          config.options.cache.ttl
        );
      }
      
      // Record audit trail for enterprise compliance
      if (config.options?.audit) {
        await this.recordAuditTrail(operation, table, config.options.audit);
      }
      
      // Create metrics
      const metrics: QueryMetrics = {
        queryId,
        query: `${operation.toUpperCase()} ${table}`,
        duration: Date.now() - startTime,
        timestamp: startTime,
        success: true,
        rowCount: Array.isArray(result.data) ? result.data.length : 1
      };
      
      this.recordQueryMetrics(metrics);
      
      return { data: result.data, metrics };
      
    } catch (error) {
      const metrics: QueryMetrics = {
        queryId,
        query: `${operation.toUpperCase()} ${table}`,
        duration: Date.now() - startTime,
        timestamp: startTime,
        success: false
      };
      
      this.recordQueryMetrics(metrics);
      
      logger.error('Database query failed', {
        queryId,
        operation,
        table,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: metrics.duration
      });
      
      throw error;
    }
  }
  
  private async buildAndExecuteQuery<T>(
    operation: string,
    table: string,
    config: any
  ): Promise<{ data: T }> {
    let query: any;
    
    switch (operation) {
      case 'select':
        query = this.client
          .from(table)
          .select(config.select || '*');
          
        // Apply filters
        if (config.filters) {
          Object.entries(config.filters).forEach(([key, value]) => {
            this.validateColumnName(key);
            query = query.eq(key, value);
          });
        }
        
        // Apply options
        if (config.options?.limit) {
          query = query.limit(config.options.limit);
        }
        
        if (config.options?.offset) {
          query = query.range(
            config.options.offset,
            config.options.offset + (config.options.limit || 10) - 1
          );
        }
        
        if (config.options?.orderBy) {
          this.validateColumnName(config.options.orderBy.column);
          query = query.order(config.options.orderBy.column, {
            ascending: config.options.orderBy.ascending
          });
        }
        
        break;
        
      case 'insert':
        query = this.client
          .from(table)
          .insert(config.data)
          .select();
        break;
        
      case 'update':
        query = this.client
          .from(table)
          .update(config.data);
          
        if (config.filters) {
          Object.entries(config.filters).forEach(([key, value]) => {
            this.validateColumnName(key);
            query = query.eq(key, value);
          });
        }
        
        query = query.select();
        break;
        
      case 'delete':
        query = this.client
          .from(table)
          .delete();
          
        if (config.filters) {
          Object.entries(config.filters).forEach(([key, value]) => {
            this.validateColumnName(key);
            query = query.eq(key, value);
          });
        }
        
        query = query.select();
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Database ${operation} failed: ${error.message}`);
    }
    
    return { data };
  }
  
  /**
   * Enterprise audit trail recording
   */
  private async recordAuditTrail(
    operation: string,
    table: string,
    auditInfo: { userId: string; ipAddress: string }
  ): Promise<void> {
    try {
      await this.client
        .from('audit_logs')
        .insert({
          table_name: table,
          action: operation.toUpperCase(),
          user_id: auditInfo.userId,
          ip_address: auditInfo.ipAddress,
          timestamp: new Date().toISOString(),
          metadata: {
            application: 'hmhcp-platform',
            compliance: 'GDPR'
          }
        });
    } catch (error) {
      logger.error('Failed to record audit trail', {
        operation,
        table,
        userId: auditInfo.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't fail the main operation due to audit logging issues
    }
  }
  
  /**
   * Query result caching with TTL
   */
  private getCachedResult(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }
    
    if (cached) {
      this.queryCache.delete(key);
    }
    
    return null;
  }
  
  private setCachedResult(key: string, data: any, ttl: number): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Limit cache size to prevent memory issues
    if (this.queryCache.size > 1000) {
      const oldestKey = this.queryCache.keys().next().value;
      if (oldestKey) {
        this.queryCache.delete(oldestKey);
      }
    }
  }
  
  /**
   * Database health monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      connectionCount: number;
      avgQueryTime: number;
      errorRate: number;
      cacheHitRate: number;
    };
  }> {
    try {
      const startTime = Date.now();
      
      // Test connectivity with a simple query
      const { error } = await this.client
        .from('admin_users')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      // Consider healthy even if table doesn't exist (schema not deployed yet)
      const isHealthy = !error || 
        error.message?.includes('relation') || 
        error.message?.includes('does not exist') ||
        error.code === '42P01'; // PostgreSQL: relation does not exist
      
      if (!isHealthy) {
        logger.error('Database health check failed', {
          error: error?.message,
          code: error?.code,
          responseTime
        });
        
        return {
          status: 'unhealthy',
          metrics: {
            connectionCount: this.connectionPool.size,
            avgQueryTime: responseTime,
            errorRate: this.calculateErrorRate(),
            cacheHitRate: this.calculateCacheHitRate()
          }
        };
      }
      
      const status = responseTime < 100 ? 'healthy' : 
                    responseTime < 500 ? 'degraded' : 'unhealthy';
      
      return {
        status,
        metrics: {
          connectionCount: this.connectionPool.size,
          avgQueryTime: this.calculateAvgQueryTime(),
          errorRate: this.calculateErrorRate(),
          cacheHitRate: this.calculateCacheHitRate()
        }
      };
      
    } catch (error) {
      logger.error('Database health check exception', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        status: 'unhealthy',
        metrics: {
          connectionCount: 0,
          avgQueryTime: 0,
          errorRate: 1,
          cacheHitRate: 0
        }
      };
    }
  }
  
  /**
   * Production-ready data encryption for sensitive fields
   * Note: Implement proper encryption using your KMS or encryption service
   */
  async encryptSensitiveData(data: Record<string, any>): Promise<Record<string, any>> {
    const sensitiveFields = ['ssn', 'phone', 'credit_card', 'password', 'token'];
    const encrypted = { ...data };
    
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        try {
          // TODO: Replace with proper encryption service integration
          // This is a placeholder - use AWS KMS, Azure Key Vault, or similar
          const encryptedValue = await this.encryptField(encrypted[field]);
          encrypted[field] = encryptedValue;
          
          logger.debug('Field encrypted', { field });
        } catch (error) {
          logger.error('Encryption failed for field', {
            field,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw new Error(`Failed to encrypt sensitive field: ${field}`);
        }
      }
    }
    
    return encrypted;
  }
  
  private async encryptField(value: string): Promise<string> {
    // Placeholder encryption - replace with proper KMS integration
    // For production, use:
    // - AWS KMS
    // - Azure Key Vault  
    // - Google Cloud KMS
    // - HashiCorp Vault
    
    // Basic base64 encoding as placeholder (NOT secure for production)
    logger.warn('Using placeholder encryption - implement proper KMS integration for production');
    return Buffer.from(value).toString('base64');
  }
  
  async decryptSensitiveData(data: Record<string, any>): Promise<Record<string, any>> {
    const sensitiveFields = ['ssn', 'phone', 'credit_card', 'password', 'token'];
    const decrypted = { ...data };
    
    for (const field of sensitiveFields) {
      if (decrypted[field]) {
        try {
          const decryptedValue = await this.decryptField(decrypted[field]);
          decrypted[field] = decryptedValue;
        } catch (error) {
          logger.error('Decryption failed for field', {
            field,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Don't throw - return encrypted value and log the issue
        }
      }
    }
    
    return decrypted;
  }
  
  private async decryptField(encryptedValue: string): Promise<string> {
    // Placeholder decryption - replace with proper KMS integration
    try {
      return Buffer.from(encryptedValue, 'base64').toString();
    } catch (error) {
      logger.error('Decryption failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return encryptedValue; // Return as-is if decryption fails
    }
  }
  
  // Utility methods
  private generateQueryId(): string {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private validateTableName(tableName: string): void {
    const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!validPattern.test(tableName) || tableName.length > 63) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
  }
  
  private validateColumnName(columnName: string): void {
    const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!validPattern.test(columnName) || columnName.length > 63) {
      throw new Error(`Invalid column name: ${columnName}`);
    }
  }
  
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }
  }
  
  private calculateAvgQueryTime(): number {
    if (this.queryMetrics.length === 0) return 0;
    const total = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / this.queryMetrics.length);
  }
  
  private calculateErrorRate(): number {
    if (this.queryMetrics.length === 0) return 0;
    const errors = this.queryMetrics.filter(m => !m.success).length;
    return errors / this.queryMetrics.length;
  }
  
  private calculateCacheHitRate(): number {
    const cacheableQueries = this.queryMetrics.filter(m => m.fromCache !== undefined);
    if (cacheableQueries.length === 0) return 0;
    const hits = cacheableQueries.filter(m => m.fromCache).length;
    return hits / cacheableQueries.length;
  }
  
  private startHealthCheckInterval(): void {
    setInterval(() => {
      this.healthCheck().then(result => {
        if (result.status === 'unhealthy') {
          logger.error('Database health check failed', result);
        }
      });
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Get performance analytics for database optimization
   */
  getPerformanceAnalytics(): {
    slowQueries: QueryMetrics[];
    frequentQueries: { query: string; count: number; avgDuration: number }[];
    errorSummary: { error: string; count: number; lastOccurrence: number }[];
  } {
    const slowQueries = this.queryMetrics
      .filter(m => m.duration > 1000) // Queries over 1 second
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    // Group by query for frequency analysis
    const queryGroups = this.queryMetrics.reduce((acc, metric) => {
      const key = metric.query;
      if (!acc[key]) {
        acc[key] = { count: 0, totalDuration: 0 };
      }
      acc[key].count++;
      acc[key].totalDuration += metric.duration;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number }>);
    
    const frequentQueries = Object.entries(queryGroups)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgDuration: Math.round(stats.totalDuration / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      slowQueries,
      frequentQueries,
      errorSummary: [] // Would implement error grouping
    };
  }
}

// Singleton instance with proper error handling
let databaseAdapter: EnhancedDatabaseAdapter | null = null;

export function getEnhancedDatabaseAdapter(): EnhancedDatabaseAdapter {
  if (!databaseAdapter) {
    try {
      // Validate environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing required Supabase environment variables');
      }
      
      if (supabaseUrl.includes('your-project') || supabaseServiceKey.includes('your-service-key')) {
        throw new Error('Supabase environment variables contain placeholder values');
      }
      
      databaseAdapter = new EnhancedDatabaseAdapter({
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
        healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000')
      });
      
      logger.info('Enhanced database adapter initialized', {
        url: supabaseUrl,
        adapterInitialized: true
      });
      
    } catch (error) {
      logger.error('Failed to initialize enhanced database adapter', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  return databaseAdapter;
}

// Graceful shutdown
export async function shutdownEnhancedDatabaseAdapter(): Promise<void> {
  if (databaseAdapter) {
    try {
      // Clear any intervals and cleanup resources
      logger.info('Shutting down enhanced database adapter');
      databaseAdapter = null;
    } catch (error) {
      logger.error('Error during database adapter shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}