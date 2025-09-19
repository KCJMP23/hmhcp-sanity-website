// =============================================
// ENTERPRISE CACHE WARMING & INVALIDATION
// Target: 95%+ cache hit ratio, intelligent warming
// =============================================

import { getRedisCache, CACHE_TTL } from './redis-cache'
import { getSupabaseServiceClient, performOptimizedQuery } from './optimized-supabase-client'
import { logger } from '@/lib/logger'

interface CacheStrategy {
  key: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  warmingFunction: () => Promise<any>
  ttl: number
  dependencies: string[]
  tags: string[]
}

interface CacheWarmingPlan {
  strategies: CacheStrategy[]
  estimatedTime: number
  totalItems: number
  parallelBatches: number
}

interface InvalidationRule {
  trigger: string
  pattern: string[]
  cascades: string[]
  delay?: number
}

class CacheWarmingManager {
  private warmingInProgress = false
  private lastWarmingTime: Date | null = null
  private warmingSchedule: NodeJS.Timeout | null = null
  private cache = getRedisCache()

  // Cache strategies configuration
  private strategies: CacheStrategy[] = [
    {
      key: 'public_content',
      priority: 'critical',
      warmingFunction: this.warmPublicContent.bind(this),
      ttl: CACHE_TTL.PUBLIC_CONTENT,
      dependencies: ['managed_content'],
      tags: ['content', 'public']
    },
    {
      key: 'featured_content',
      priority: 'high',
      warmingFunction: this.warmFeaturedContent.bind(this),
      ttl: CACHE_TTL.PUBLIC_CONTENT,
      dependencies: ['managed_content'],
      tags: ['content', 'featured']
    },
    {
      key: 'navigation_data',
      priority: 'critical',
      warmingFunction: this.warmNavigationData.bind(this),
      ttl: CACHE_TTL.METADATA,
      dependencies: ['managed_content'],
      tags: ['navigation', 'metadata']
    },
    {
      key: 'search_popular_queries',
      priority: 'medium',
      warmingFunction: this.warmPopularSearches.bind(this),
      ttl: CACHE_TTL.SEARCH_RESULTS,
      dependencies: ['audit_logs'],
      tags: ['search', 'analytics']
    },
    {
      key: 'analytics_dashboard',
      priority: 'medium',
      warmingFunction: this.warmAnalyticsDashboard.bind(this),
      ttl: CACHE_TTL.ANALYTICS,
      dependencies: ['managed_content', 'admin_users', 'audit_logs'],
      tags: ['analytics', 'dashboard']
    },
    {
      key: 'user_permissions',
      priority: 'high',
      warmingFunction: this.warmUserPermissions.bind(this),
      ttl: CACHE_TTL.USER_SESSIONS,
      dependencies: ['admin_users'],
      tags: ['auth', 'permissions']
    }
  ]

  // Invalidation rules
  private invalidationRules: InvalidationRule[] = [
    {
      trigger: 'content_published',
      pattern: ['public_content:*', 'featured_content:*', 'navigation_data:*'],
      cascades: ['analytics_dashboard:*', 'search_popular_queries:*']
    },
    {
      trigger: 'content_updated',
      pattern: ['public_content:*', 'search_results:*'],
      cascades: ['analytics_dashboard:*']
    },
    {
      trigger: 'user_role_changed',
      pattern: ['user_permissions:*'],
      cascades: ['analytics_dashboard:*']
    },
    {
      trigger: 'navigation_updated',
      pattern: ['navigation_data:*'],
      cascades: []
    },
    {
      trigger: 'search_performed',
      pattern: [],
      cascades: ['analytics_dashboard:*'],
      delay: 300000 // 5 minutes delay for analytics
    }
  ]

  constructor() {
    this.scheduleRegularWarming()
  }

  private scheduleRegularWarming(): void {
    // Schedule cache warming every 4 hours
    this.warmingSchedule = setInterval(async () => {
      await this.warmCriticalCaches()
    }, 4 * 60 * 60 * 1000)

    // Initial warming on startup
    setTimeout(() => {
      this.warmCriticalCaches()
    }, 5000) // 5 second delay after startup
  }

  // =============================================
  // CACHE WARMING STRATEGIES
  // =============================================

  async warmCriticalCaches(): Promise<void> {
    if (this.warmingInProgress) {
      logger.info('Cache warming already in progress, skipping')
      return
    }

    this.warmingInProgress = true
    const startTime = performance.now()

    try {
      logger.info('Starting critical cache warming')

      const criticalStrategies = this.strategies.filter(s => s.priority === 'critical')
      await this.executePlan({ 
        strategies: criticalStrategies,
        estimatedTime: 30000,
        totalItems: criticalStrategies.length,
        parallelBatches: 2
      })

      const duration = performance.now() - startTime
      this.lastWarmingTime = new Date()

      logger.info('Critical cache warming completed', {
        duration: `${duration.toFixed(2)}ms`,
        strategies_warmed: criticalStrategies.length
      })

    } catch (error) {
      logger.error('Critical cache warming failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      this.warmingInProgress = false
    }
  }

  async warmAllCaches(): Promise<void> {
    if (this.warmingInProgress) {
      logger.warn('Cache warming already in progress')
      return
    }

    this.warmingInProgress = true
    const startTime = performance.now()

    try {
      logger.info('Starting comprehensive cache warming')

      // Sort strategies by priority
      const sortedStrategies = this.strategies.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      await this.executePlan({
        strategies: sortedStrategies,
        estimatedTime: 120000,
        totalItems: sortedStrategies.length,
        parallelBatches: 3
      })

      const duration = performance.now() - startTime
      this.lastWarmingTime = new Date()

      logger.info('Comprehensive cache warming completed', {
        duration: `${duration.toFixed(2)}ms`,
        strategies_warmed: sortedStrategies.length
      })

    } catch (error) {
      logger.error('Comprehensive cache warming failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      this.warmingInProgress = false
    }
  }

  private async executePlan(plan: CacheWarmingPlan): Promise<void> {
    const batchSize = Math.ceil(plan.strategies.length / plan.parallelBatches)
    
    for (let i = 0; i < plan.strategies.length; i += batchSize) {
      const batch = plan.strategies.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(strategy => this.executeStrategy(strategy))
      )
    }
  }

  private async executeStrategy(strategy: CacheStrategy): Promise<void> {
    const startTime = performance.now()
    
    try {
      logger.debug(`Warming cache strategy: ${strategy.key}`)
      
      const data = await strategy.warmingFunction()
      const duration = performance.now() - startTime

      // Store the warmed data
      await this.cache.set(
        'warmed_cache',
        strategy.key,
        {
          data,
          warming_time: duration,
          warmed_at: new Date(),
          strategy: strategy.key
        },
        strategy.ttl
      )

      logger.debug(`Cache strategy ${strategy.key} completed in ${duration.toFixed(2)}ms`)

    } catch (error) {
      logger.error(`Cache warming strategy ${strategy.key} failed`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // =============================================
  // INDIVIDUAL WARMING FUNCTIONS
  // =============================================

  private async warmPublicContent(): Promise<any> {
    const client = getSupabaseServiceClient()
    
    // Use optimized materialized view
    const { data, error } = await performOptimizedQuery(
      client.from('mv_public_content').select('*').limit(50),
      'warm_public_content'
    )

    if (error) throw error
    
    // Cache individual content pieces as well
    if (data) {
      const cachePromises = data.map((content: any) => 
        this.cache.set('content', content.slug, content, CACHE_TTL.PUBLIC_CONTENT)
      )
      await Promise.allSettled(cachePromises)
    }

    return data
  }

  private async warmFeaturedContent(): Promise<any> {
    const client = getSupabaseServiceClient()
    
    const { data, error } = await performOptimizedQuery(
      client
        .from('mv_public_content')
        .select('*')
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(10),
      'warm_featured_content'
    )

    if (error) throw error
    return data
  }

  private async warmNavigationData(): Promise<any> {
    const client = getSupabaseServiceClient()
    
    const { data, error } = await performOptimizedQuery(
      client
        .from('managed_content')
        .select('id, title, slug, type, parent_id, sort_order')
        .eq('type', 'navigation')
        .eq('status', 'published')
        .order('sort_order'),
      'warm_navigation'
    )

    if (error) throw error
    
    // Build hierarchical navigation structure
    const navigationTree = this.buildNavigationTree(data || [])
    return navigationTree
  }

  private async warmPopularSearches(): Promise<any> {
    const client = getSupabaseServiceClient()
    
    // Get popular search queries from audit logs
    const { data, error } = await performOptimizedQuery(
      client
        .from('audit_logs')
        .select('details')
        .eq('action', 'content_search')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      'warm_popular_searches'
    )

    if (error) throw error

    // Extract and count search terms
    const searchTerms: Record<string, number> = {}
    
    data?.forEach((log: any) => {
      const searchTerm = log.details?.search_query
      if (searchTerm) {
        searchTerms[searchTerm] = (searchTerms[searchTerm] || 0) + 1
      }
    })

    // Sort by popularity and take top 20
    const popularTerms = Object.entries(searchTerms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([term, count]) => ({ term, count }))

    // Pre-cache search results for popular terms
    for (const { term } of popularTerms.slice(0, 10)) {
      try {
        const searchResults = await this.executeSearch(term)
        await this.cache.cacheSearchResults(term, searchResults)
      } catch (error) {
        logger.warn(`Failed to warm search cache for term: ${term}`)
      }
    }

    return popularTerms
  }

  private async warmAnalyticsDashboard(): Promise<any> {
    const client = getSupabaseServiceClient()
    
    // Use materialized view for dashboard analytics
    const { data, error } = await performOptimizedQuery(
      client.from('mv_dashboard_analytics').select('*'),
      'warm_analytics'
    )

    if (error) throw error
    return data?.[0] || {}
  }

  private async warmUserPermissions(): Promise<any> {
    const client = getSupabaseServiceClient()
    
    const { data, error } = await performOptimizedQuery(
      client
        .from('admin_users')
        .select('id, email, role, is_active')
        .eq('is_active', true),
      'warm_user_permissions'
    )

    if (error) throw error

    // Cache individual user permissions
    if (data) {
      const permissionPromises = data.map((user: any) => 
        this.cache.set('user_permissions', user.id, {
          role: user.role,
          permissions: this.getRolePermissions(user.role)
        }, CACHE_TTL.USER_SESSIONS)
      )
      await Promise.allSettled(permissionPromises)
    }

    return data
  }

  // =============================================
  // CACHE INVALIDATION SYSTEM
  // =============================================

  async invalidateCache(trigger: string, context?: Record<string, any>): Promise<void> {
    const startTime = performance.now()
    
    try {
      logger.info(`Processing cache invalidation for trigger: ${trigger}`, context)

      const applicableRules = this.invalidationRules.filter(rule => rule.trigger === trigger)
      
      if (applicableRules.length === 0) {
        logger.debug(`No invalidation rules found for trigger: ${trigger}`)
        return
      }

      for (const rule of applicableRules) {
        await this.executeInvalidationRule(rule, context)
      }

      const duration = performance.now() - startTime
      logger.info(`Cache invalidation completed for ${trigger}`, {
        duration: `${duration.toFixed(2)}ms`,
        rules_executed: applicableRules.length
      })

    } catch (error) {
      logger.error(`Cache invalidation failed for trigger: ${trigger}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        context
      })
    }
  }

  private async executeInvalidationRule(rule: InvalidationRule, context?: Record<string, any>): Promise<void> {
    // Execute immediate invalidations
    for (const pattern of rule.pattern) {
      await this.invalidatePattern(pattern, context)
    }

    // Execute cascaded invalidations (with optional delay)
    if (rule.cascades.length > 0) {
      const executeFunction = async () => {
        for (const cascade of rule.cascades) {
          await this.invalidatePattern(cascade, context)
        }
      }

      if (rule.delay) {
        setTimeout(executeFunction, rule.delay)
      } else {
        await executeFunction()
      }
    }
  }

  private async invalidatePattern(pattern: string, context?: Record<string, any>): Promise<void> {
    try {
      if (pattern.includes('*')) {
        // Wildcard pattern - invalidate multiple keys
        const [prefix, suffix] = pattern.split('*')
        await this.cache.invalidate(prefix)
        logger.debug(`Invalidated cache pattern: ${pattern}`)
      } else {
        // Specific key
        const [prefixPart, keyPart] = pattern.split(':')
        await this.cache.invalidate(prefixPart, keyPart)
        logger.debug(`Invalidated cache key: ${pattern}`)
      }
    } catch (error) {
      logger.error(`Failed to invalidate pattern: ${pattern}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Smart invalidation based on content changes
  async invalidateForContentChange(contentId: string, changeType: string, contentData?: any): Promise<void> {
    const triggers = []

    switch (changeType) {
      case 'publish':
        triggers.push('content_published')
        break
      case 'update':
        triggers.push('content_updated')
        break
      case 'delete':
        triggers.push('content_deleted')
        break
      case 'feature':
        triggers.push('content_featured')
        break
    }

    for (const trigger of triggers) {
      await this.invalidateCache(trigger, { contentId, contentData })
    }

    // Re-warm critical caches if content was published
    if (changeType === 'publish') {
      setTimeout(() => {
        this.warmCriticalCaches()
      }, 1000) // 1 second delay to allow DB changes to propagate
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  private buildNavigationTree(items: any[]): any[] {
    const itemMap = new Map()
    const rootItems: any[] = []

    // Create map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] })
    })

    // Build tree structure
    items.forEach(item => {
      const mappedItem = itemMap.get(item.id)
      
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id).children.push(mappedItem)
      } else {
        rootItems.push(mappedItem)
      }
    })

    return rootItems
  }

  private async executeSearch(searchTerm: string): Promise<any[]> {
    const client = getSupabaseServiceClient()
    
    const { data, error } = await performOptimizedQuery(
      client.rpc('search_content', {
        search_query: searchTerm,
        limit_count: 20
      }),
      'search_execution'
    )

    if (error) throw error
    return data || []
  }

  private getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      'super_admin': ['*'],
      'admin': ['content:*', 'users:read', 'users:update', 'analytics:read'],
      'editor': ['content:read', 'content:update', 'content:publish'],
      'author': ['content:read', 'content:create', 'content:update:own']
    }

    return permissions[role] || []
  }

  // =============================================
  // PUBLIC API
  // =============================================

  async getCacheWarmingStatus(): Promise<any> {
    return {
      warming_in_progress: this.warmingInProgress,
      last_warming_time: this.lastWarmingTime,
      strategies_count: this.strategies.length,
      critical_strategies: this.strategies.filter(s => s.priority === 'critical').length,
      next_scheduled_warming: this.warmingSchedule ? 'Every 4 hours' : 'Not scheduled'
    }
  }

  async getInvalidationRules(): Promise<InvalidationRule[]> {
    return [...this.invalidationRules]
  }

  async addCustomStrategy(strategy: CacheStrategy): Promise<void> {
    this.strategies.push(strategy)
    logger.info(`Added custom cache strategy: ${strategy.key}`)
  }

  async addInvalidationRule(rule: InvalidationRule): Promise<void> {
    this.invalidationRules.push(rule)
    logger.info(`Added custom invalidation rule for trigger: ${rule.trigger}`)
  }

  // Cleanup method
  destroy(): void {
    if (this.warmingSchedule) {
      clearInterval(this.warmingSchedule)
      this.warmingSchedule = null
    }
    
    this.warmingInProgress = false
  }
}

// Singleton instance
let cacheManagerInstance: CacheWarmingManager | null = null

export function getCacheWarmingManager(): CacheWarmingManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheWarmingManager()
  }
  return cacheManagerInstance
}

// Convenience exports
export const cacheStrategies = {
  warmCritical: () => getCacheWarmingManager().warmCriticalCaches(),
  warmAll: () => getCacheWarmingManager().warmAllCaches(),
  invalidate: (trigger: string, context?: Record<string, any>) => 
    getCacheWarmingManager().invalidateCache(trigger, context),
  invalidateContent: (contentId: string, changeType: string, contentData?: any) =>
    getCacheWarmingManager().invalidateForContentChange(contentId, changeType, contentData),
  getStatus: () => getCacheWarmingManager().getCacheWarmingStatus()
}

export type { CacheStrategy, CacheWarmingPlan, InvalidationRule }
export default getCacheWarmingManager