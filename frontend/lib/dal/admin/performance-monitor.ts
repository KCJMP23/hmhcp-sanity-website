/**
 * Performance Monitor for HMHCP Admin System
 * Tracks N+1 queries, slow queries, and provides optimization insights
 */

import { logger } from '@/lib/logger'
import { 
  globalBatchLoader, 
  queryPerformanceMonitor,
  QueryPerformanceMonitor 
} from './utils'

export interface QueryOptimizationSuggestion {
  queryType: string
  issue: 'slow_query' | 'n_plus_one' | 'missing_index' | 'inefficient_join'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestion: string
  expectedImprovement: string
  implementationEffort: 'low' | 'medium' | 'high'
}

export interface PerformanceReport {
  summary: {
    totalQueries: number
    slowQueries: number
    averageQueryTime: number
    cacheHitRate: number
    nPlusOneDetected: number
  }
  topSlowQueries: Array<{
    queryType: string
    avgTime: number
    count: number
    impact: 'low' | 'medium' | 'high'
  }>
  batchLoaderMetrics: Record<string, {
    totalQueries: number
    avgExecutionTime: number
    avgBatchSize: number
    cacheHitRatio: number
  }>
  optimizationSuggestions: QueryOptimizationSuggestion[]
  indexingRecommendations: Array<{
    table: string
    columns: string[]
    type: 'btree' | 'gin' | 'gist' | 'hash'
    reason: string
    priority: 'low' | 'medium' | 'high'
  }>
}

export class PerformanceAnalyzer {
  private queryMonitor: QueryPerformanceMonitor
  private nPlusOnePatterns: Map<string, { count: number; lastSeen: number }> = new Map()

  constructor() {
    this.queryMonitor = queryPerformanceMonitor
  }

  /**
   * Detect potential N+1 query patterns
   */
  detectNPlusOnePattern(queryType: string, metadata?: Record<string, any>): void {
    // Pattern: Multiple similar queries in short succession
    const now = Date.now()
    const pattern = this.nPlusOnePatterns.get(queryType) || { count: 0, lastSeen: 0 }
    
    if (now - pattern.lastSeen < 1000) { // Within 1 second
      pattern.count++
    } else {
      pattern.count = 1
    }
    
    pattern.lastSeen = now
    this.nPlusOnePatterns.set(queryType, pattern)

    // Alert if we detect N+1 pattern
    if (pattern.count > 10) {
      logger.warn('Potential N+1 query pattern detected', {
        queryType,
        occurrences: pattern.count,
        metadata
      })
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const queryMetrics = this.queryMonitor.getMetrics()
    const batchMetrics = globalBatchLoader.getPerformanceMetrics()
    const summary = this.queryMonitor.getSummaryReport()

    // Calculate cache hit rate from batch loader
    const totalBatchQueries = Object.values(batchMetrics).reduce((sum, metric) => sum + metric.totalQueries, 0)
    const avgCacheHitRate = totalBatchQueries > 0 
      ? Object.values(batchMetrics).reduce((sum, metric) => sum + metric.cacheHitRatio, 0) / Object.keys(batchMetrics).length 
      : 0

    // Detect N+1 patterns
    let nPlusOneDetected = 0
    this.nPlusOnePatterns.forEach(pattern => {
      if (pattern.count > 5) nPlusOneDetected++
    })

    // Generate optimization suggestions
    const suggestions = this.generateOptimizationSuggestions(queryMetrics, batchMetrics)
    
    // Generate indexing recommendations
    const indexingRecommendations = this.generateIndexingRecommendations(queryMetrics)

    // Categorize slow queries by impact
    const topSlowQueries = this.queryMonitor.getTopSlowQueries(10).map(query => ({
      queryType: query.queryType,
      avgTime: query.avgTime,
      count: query.slowCount,
      impact: this.categorizeQueryImpact(query.avgTime, query.slowCount)
    }))

    return {
      summary: {
        totalQueries: summary.totalQueries,
        slowQueries: summary.totalSlowQueries,
        averageQueryTime: summary.avgExecutionTime,
        cacheHitRate: avgCacheHitRate,
        nPlusOneDetected
      },
      topSlowQueries,
      batchLoaderMetrics: batchMetrics,
      optimizationSuggestions: suggestions,
      indexingRecommendations
    }
  }

  /**
   * Generate optimization suggestions based on metrics
   */
  private generateOptimizationSuggestions(
    queryMetrics: Record<string, any>,
    batchMetrics: Record<string, any>
  ): QueryOptimizationSuggestion[] {
    const suggestions: QueryOptimizationSuggestion[] = []

    // Analyze query metrics for slow queries
    Object.entries(queryMetrics).forEach(([queryType, metrics]) => {
      if (metrics.averageTime > 1000) {
        suggestions.push({
          queryType,
          issue: 'slow_query',
          severity: metrics.averageTime > 3000 ? 'critical' : 'high',
          description: `Query ${queryType} averages ${metrics.averageTime.toFixed(2)}ms execution time`,
          suggestion: 'Consider adding database indexes, optimizing join conditions, or implementing caching',
          expectedImprovement: '60-80% faster query execution',
          implementationEffort: 'medium'
        })
      }

      if (metrics.slowQueryPercentage > 20) {
        suggestions.push({
          queryType,
          issue: 'inefficient_join',
          severity: 'medium',
          description: `${metrics.slowQueryPercentage} of ${queryType} queries are slow`,
          suggestion: 'Review and optimize query conditions, consider breaking into smaller queries',
          expectedImprovement: '40-60% reduction in slow queries',
          implementationEffort: 'low'
        })
      }
    })

    // Analyze batch loader metrics
    Object.entries(batchMetrics).forEach(([loaderType, metrics]) => {
      if (metrics.cacheHitRatio < 0.3) {
        suggestions.push({
          queryType: loaderType,
          issue: 'n_plus_one',
          severity: 'medium',
          description: `Low cache hit ratio (${(metrics.cacheHitRatio * 100).toFixed(1)}%) for ${loaderType}`,
          suggestion: 'Increase cache TTL, implement preloading, or review query patterns',
          expectedImprovement: '30-50% reduction in database queries',
          implementationEffort: 'low'
        })
      }

      if (metrics.avgBatchSize < 5) {
        suggestions.push({
          queryType: loaderType,
          issue: 'n_plus_one',
          severity: 'low',
          description: `Small average batch size (${metrics.avgBatchSize.toFixed(1)}) for ${loaderType}`,
          suggestion: 'Increase batch timeout or implement more aggressive batching',
          expectedImprovement: '20-30% better batching efficiency',
          implementationEffort: 'low'
        })
      }
    })

    // Check for N+1 patterns
    this.nPlusOnePatterns.forEach((pattern, queryType) => {
      if (pattern.count > 10) {
        suggestions.push({
          queryType,
          issue: 'n_plus_one',
          severity: 'high',
          description: `Detected ${pattern.count} rapid successive queries of type ${queryType}`,
          suggestion: 'Implement batch loading, use joins, or add relationship preloading',
          expectedImprovement: '70-90% reduction in database queries',
          implementationEffort: 'medium'
        })
      }
    })

    return suggestions.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  /**
   * Generate database indexing recommendations
   */
  private generateIndexingRecommendations(queryMetrics: Record<string, any>): Array<{
    table: string
    columns: string[]
    type: 'btree' | 'gin' | 'gist' | 'hash'
    reason: string
    priority: 'low' | 'medium' | 'high'
  }> {
    const recommendations = []

    // Blog posts optimizations
    if (queryMetrics['blog_posts_by_category']?.averageTime > 500) {
      recommendations.push({
        table: 'blog_posts',
        columns: ['category_ids'],
        type: 'gin' as const,
        reason: 'Optimize array contains queries for category filtering',
        priority: 'high' as const
      })
    }

    if (queryMetrics['blog_posts_related']?.averageTime > 800) {
      recommendations.push({
        table: 'blog_posts',
        columns: ['tags'],
        type: 'gin' as const,
        reason: 'Optimize tag-based related post queries',
        priority: 'medium' as const
      })
    }

    // Team members optimizations
    if (queryMetrics['team_members_by_expertise']?.averageTime > 400) {
      recommendations.push({
        table: 'team_members',
        columns: ['expertise'],
        type: 'gin' as const,
        reason: 'Optimize expertise array searches',
        priority: 'medium' as const
      })
    }

    // General performance indexes
    recommendations.push(
      {
        table: 'blog_posts',
        columns: ['status', 'published_at'],
        type: 'btree' as const,
        reason: 'Optimize published post queries with date ordering',
        priority: 'high' as const
      },
      {
        table: 'blog_posts',
        columns: ['author_id', 'status'],
        type: 'btree' as const,
        reason: 'Optimize author post lookups',
        priority: 'medium' as const
      },
      {
        table: 'team_members',
        columns: ['status', 'is_featured', 'display_order'],
        type: 'btree' as const,
        reason: 'Optimize team member listing queries',
        priority: 'high' as const
      },
      {
        table: 'categories',
        columns: ['parent_id', 'display_order'],
        type: 'btree' as const,
        reason: 'Optimize hierarchical category queries',
        priority: 'medium' as const
      },
      {
        table: 'platforms',
        columns: ['status', 'category'],
        type: 'btree' as const,
        reason: 'Optimize platform filtering queries',
        priority: 'medium' as const
      }
    )

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Categorize query impact based on execution time and frequency
   */
  private categorizeQueryImpact(avgTime: number, slowCount: number): 'low' | 'medium' | 'high' {
    if (avgTime > 2000 || slowCount > 100) return 'high'
    if (avgTime > 800 || slowCount > 50) return 'medium'
    return 'low'
  }

  /**
   * Reset performance tracking
   */
  resetMetrics(): void {
    this.queryMonitor.reset()
    globalBatchLoader.clearCache()
    this.nPlusOnePatterns.clear()
  }

  /**
   * Get real-time performance status
   */
  getRealtimeStatus(): {
    activeQueries: number
    cacheSize: number
    recentSlowQueries: number
    avgResponseTime: number
  } {
    const metrics = this.queryMonitor.getMetrics()
    const batchMetrics = globalBatchLoader.getPerformanceMetrics()

    const recentSlowQueries = Object.values(metrics)
      .reduce((sum: number, metric: any) => sum + (metric.slowQueries || 0), 0)

    const totalQueries = Object.values(metrics)
      .reduce((sum: number, metric: any) => sum + (metric.totalQueries || 0), 0)
    
    const totalTime = Object.values(metrics)
      .reduce((sum: number, metric: any) => sum + (metric.totalTime || 0), 0)

    const cacheSize = Object.values(batchMetrics)
      .reduce((sum, metric) => sum + metric.cacheSize, 0)

    return {
      activeQueries: totalQueries,
      cacheSize,
      recentSlowQueries,
      avgResponseTime: totalQueries > 0 ? totalTime / totalQueries : 0
    }
  }
}

// Global instance
export const performanceAnalyzer = new PerformanceAnalyzer()

// Export SQL for creating recommended indexes
export const RECOMMENDED_INDEXES_SQL = `
-- Blog posts indexes for N+1 query optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_category_ids_gin ON blog_posts USING gin (category_ids);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_tags_gin ON blog_posts USING gin (tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_status_published_at ON blog_posts (status, published_at DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_author_status ON blog_posts (author_id, status) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_view_count_desc ON blog_posts (view_count DESC) WHERE status = 'published';

-- Team members indexes for expertise and platform queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_expertise_gin ON team_members USING gin (expertise);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_platform_ids_gin ON team_members USING gin (platform_ids);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_status_featured_order ON team_members (status, is_featured DESC, display_order ASC) WHERE status = 'published';

-- Categories indexes for hierarchical queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_display_order ON categories (parent_id, display_order) WHERE parent_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_type_status ON categories (type, status) WHERE status = 'active';

-- Platforms indexes for filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_platforms_status_category ON platforms (status, category) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_platforms_pricing_model ON platforms (pricing_model) WHERE status = 'active';

-- Services indexes for associations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_platform_ids_gin ON services USING gin (platform_ids);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_team_member_ids_gin ON services USING gin (team_member_ids);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category_status ON services (category, status) WHERE status = 'active';

-- Testimonials indexes for feature queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonials_featured_rating ON testimonials (is_featured DESC, rating DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonials_service_ids_gin ON testimonials USING gin (service_ids);

-- Audit logs indexes for performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_type_created_at ON audit_logs (resource_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_created_at ON audit_logs (user_id, action, created_at DESC);

-- Performance monitoring table (if needed)
CREATE TABLE IF NOT EXISTS query_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_type VARCHAR(255) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_performance_metrics_type_time ON query_performance_metrics (query_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_performance_metrics_execution_time ON query_performance_metrics (execution_time_ms DESC) WHERE execution_time_ms > 1000;
`;