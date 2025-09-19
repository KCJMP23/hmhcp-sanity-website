// Query Performance Optimizer
// Story 4.3: Publications & Research Management - Performance Optimization
// Created: 2025-01-06

import { createClient } from '@/lib/supabase/server';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    // Log slow queries (>1 second)
    if (duration > 1000) {
      console.warn(`Slow query detected: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static async measureAsync<T>(
    label: string, 
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startTimer(label);
    const result = await operation();
    const duration = this.endTimer(label);
    return { result, duration };
  }
}

// Query optimization utilities
export class QueryOptimizer {
  // Optimized pagination for large datasets
  static getOptimizedPagination(page: number, limit: number, totalCount: number) {
    const maxLimit = 100; // Cap at 100 records per page for performance
    const optimizedLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * optimizedLimit;
    const totalPages = Math.ceil(totalCount / optimizedLimit);
    
    return {
      limit: optimizedLimit,
      offset,
      totalPages,
      hasMore: page < totalPages
    };
  }

  // Optimized field selection for different use cases
  static getOptimizedFields(context: 'list' | 'detail' | 'search'): string {
    switch (context) {
      case 'list':
        return `
          id,
          title,
          status,
          publication_type,
          publication_date,
          journal,
          authors,
          featured,
          created_at,
          updated_at
        `;
      case 'detail':
        return `
          *,
          publication_authors!inner(
            author_order,
            authors(
              id,
              name,
              email,
              affiliation,
              orcid
            )
          ),
          publication_topics(
            research_topics(
              id,
              name,
              description
            )
          )
        `;
      case 'search':
        return `
          id,
          title,
          abstract,
          authors,
          keywords,
          publication_type,
          status,
          publication_date,
          journal
        `;
      default:
        return '*';
    }
  }

  // Optimized sorting for large datasets
  static getOptimizedSort(sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') {
    // Use indexed columns for better performance
    const indexedColumns = ['created_at', 'updated_at', 'publication_date', 'title', 'status'];
    
    if (indexedColumns.includes(sortBy)) {
      return { column: sortBy, ascending: sortOrder === 'asc' };
    }
    
    // Fallback to created_at for non-indexed columns
    return { column: 'created_at', ascending: false };
  }

  // Batch processing for large operations
  static async processInBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Add small delay to prevent overwhelming the database
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }
}

// Database connection optimization
export class DatabaseOptimizer {
  private static connectionPool: Map<string, any> = new Map();

  static async getOptimizedConnection(connectionKey: string = 'default') {
    if (!this.connectionPool.has(connectionKey)) {
      const supabase = await createClient();
      this.connectionPool.set(connectionKey, supabase);
    }
    
    return this.connectionPool.get(connectionKey);
  }

  // Optimized query execution with retry logic
  static async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

// Memory optimization utilities
export class MemoryOptimizer {
  // Process large datasets in chunks to prevent memory issues
  static async processLargeDataset<T, R>(
    items: T[],
    chunkSize: number,
    processor: (chunk: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // Force garbage collection hint
      if (global.gc && i % (chunkSize * 5) === 0) {
        global.gc();
      }
    }
    
    return results;
  }

  // Optimize JSON serialization for large objects
  static optimizeJsonSerialization(data: any): string {
    try {
      return JSON.stringify(data, null, 0); // Compact JSON
    } catch (error) {
      console.error('JSON serialization error:', error);
      return '{}';
    }
  }
}

// Performance metrics collection
export class PerformanceMetrics {
  private static metrics = new Map<string, number[]>();

  static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push(duration);
  }

  static getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  static getSlowestOperations(limit: number = 10): Array<{ operation: string; avgTime: number }> {
    const operations = Array.from(this.metrics.entries())
      .map(([operation, times]) => ({
        operation,
        avgTime: this.getAverageTime(operation)
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
    
    return operations;
  }

  static resetMetrics(): void {
    this.metrics.clear();
  }
}





