/**
 * Plugin Registry - Central Plugin Definition Management
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

import { createClient } from '@supabase/supabase-js';
import { PluginDefinition, PluginType, MarketplaceStatus } from '@/types/plugins/marketplace';

export interface PluginRegistryConfig {
  supabaseUrl: string;
  supabaseKey: string;
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
}

export interface PluginSearchOptions {
  query?: string;
  type?: PluginType;
  status?: MarketplaceStatus;
  organizationId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'rating' | 'installation_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export class PluginRegistry {
  private readonly supabase: any;
  private readonly config: PluginRegistryConfig;
  private readonly cache = new Map<string, { data: any; expires: number }>();

  constructor(supabaseUrl: string, supabaseKey: string, config?: Partial<PluginRegistryConfig>) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = {
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
      ...config
    };
  }

  /**
   * Get plugin definition by ID
   */
  async getPluginDefinition(pluginId: string): Promise<PluginDefinition | null> {
    const cacheKey = `plugin:${pluginId}`;
    
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select('*')
        .eq('id', pluginId)
        .single();

      if (error) {
        console.error('Error fetching plugin definition:', error);
        return null;
      }

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          data,
          expires: Date.now() + (this.config.cacheTTL * 1000)
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching plugin definition:', error);
      return null;
    }
  }

  /**
   * Get plugin definition by slug
   */
  async getPluginBySlug(slug: string): Promise<PluginDefinition | null> {
    const cacheKey = `plugin:slug:${slug}`;
    
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching plugin by slug:', error);
        return null;
      }

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          data,
          expires: Date.now() + (this.config.cacheTTL * 1000)
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching plugin by slug:', error);
      return null;
    }
  }

  /**
   * Search plugins
   */
  async searchPlugins(options: PluginSearchOptions = {}): Promise<{
    plugins: PluginDefinition[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      query,
      type,
      status = 'approved',
      organizationId,
      limit = 20,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    try {
      let queryBuilder = this.supabase
        .from('plugin_definitions')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,keywords.cs.{${query}}`);
      }

      if (type) {
        queryBuilder = queryBuilder.eq('plugin_type', type);
      }

      if (status) {
        queryBuilder = queryBuilder.eq('marketplace_status', status);
      }

      // Apply sorting
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Error searching plugins:', error);
        return { plugins: [], total: 0, hasMore: false };
      }

      return {
        plugins: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error searching plugins:', error);
      return { plugins: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get plugins by category
   */
  async getPluginsByCategory(categoryId: string, options: Omit<PluginSearchOptions, 'query'> = {}): Promise<{
    plugins: PluginDefinition[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let queryBuilder = this.supabase
        .from('plugin_definitions')
        .select('*', { count: 'exact' })
        .eq('category_id', categoryId);

      // Apply other filters
      if (options.type) {
        queryBuilder = queryBuilder.eq('plugin_type', options.type);
      }

      if (options.status) {
        queryBuilder = queryBuilder.eq('marketplace_status', options.status);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'name';
      const sortOrder = options.sortOrder || 'asc';
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Error fetching plugins by category:', error);
        return { plugins: [], total: 0, hasMore: false };
      }

      return {
        plugins: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error fetching plugins by category:', error);
      return { plugins: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get featured plugins
   */
  async getFeaturedPlugins(limit: number = 10): Promise<PluginDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select('*')
        .eq('featured', true)
        .eq('marketplace_status', 'approved')
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured plugins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching featured plugins:', error);
      return [];
    }
  }

  /**
   * Get popular plugins
   */
  async getPopularPlugins(limit: number = 10): Promise<PluginDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select('*')
        .eq('marketplace_status', 'approved')
        .order('installation_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching popular plugins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching popular plugins:', error);
      return [];
    }
  }

  /**
   * Get recent plugins
   */
  async getRecentPlugins(limit: number = 10): Promise<PluginDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select('*')
        .eq('marketplace_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent plugins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent plugins:', error);
      return [];
    }
  }

  /**
   * Get plugins by author
   */
  async getPluginsByAuthor(authorId: string, options: Omit<PluginSearchOptions, 'query'> = {}): Promise<{
    plugins: PluginDefinition[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let queryBuilder = this.supabase
        .from('plugin_definitions')
        .select('*', { count: 'exact' })
        .eq('author_id', authorId);

      // Apply other filters
      if (options.type) {
        queryBuilder = queryBuilder.eq('plugin_type', options.type);
      }

      if (options.status) {
        queryBuilder = queryBuilder.eq('marketplace_status', options.status);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Error fetching plugins by author:', error);
        return { plugins: [], total: 0, hasMore: false };
      }

      return {
        plugins: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error fetching plugins by author:', error);
      return { plugins: [], total: 0, hasMore: false };
    }
  }

  /**
   * Register a new plugin
   */
  async registerPlugin(pluginData: Partial<PluginDefinition>): Promise<PluginDefinition> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .insert(pluginData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to register plugin: ${error.message}`);
      }

      // Clear cache
      this.clearCache();

      return data;
    } catch (error) {
      console.error('Error registering plugin:', error);
      throw error;
    }
  }

  /**
   * Update plugin definition
   */
  async updatePlugin(pluginId: string, updates: Partial<PluginDefinition>): Promise<PluginDefinition> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', pluginId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update plugin: ${error.message}`);
      }

      // Clear cache for this plugin
      this.clearCacheForPlugin(pluginId);

      return data;
    } catch (error) {
      console.error('Error updating plugin:', error);
      throw error;
    }
  }

  /**
   * Delete plugin definition
   */
  async deletePlugin(pluginId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('plugin_definitions')
        .delete()
        .eq('id', pluginId);

      if (error) {
        throw new Error(`Failed to delete plugin: ${error.message}`);
      }

      // Clear cache for this plugin
      this.clearCacheForPlugin(pluginId);
    } catch (error) {
      console.error('Error deleting plugin:', error);
      throw error;
    }
  }

  /**
   * Get plugin categories
   */
  async getCategories(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get plugin statistics
   */
  async getPluginStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    byType: Record<PluginType, number>;
    byCategory: Record<string, number>;
  }> {
    try {
      // Get total counts
      const { data: statusData, error: statusError } = await this.supabase
        .from('plugin_definitions')
        .select('marketplace_status, plugin_type, category_id');

      if (statusError) {
        throw new Error(`Failed to fetch plugin stats: ${statusError.message}`);
      }

      const stats = {
        total: statusData.length,
        approved: 0,
        pending: 0,
        rejected: 0,
        byType: {} as Record<PluginType, number>,
        byCategory: {} as Record<string, number>
      };

      // Count by status
      statusData.forEach(plugin => {
        switch (plugin.marketplace_status) {
          case 'approved':
            stats.approved++;
            break;
          case 'pending':
            stats.pending++;
            break;
          case 'rejected':
            stats.rejected++;
            break;
        }

        // Count by type
        const type = plugin.plugin_type as PluginType;
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Count by category
        if (plugin.category_id) {
          stats.byCategory[plugin.category_id] = (stats.byCategory[plugin.category_id] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching plugin stats:', error);
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        byType: {} as Record<PluginType, number>,
        byCategory: {} as Record<string, number>
      };
    }
  }

  /**
   * Clear cache for a specific plugin
   */
  private clearCacheForPlugin(pluginId: string): void {
    this.cache.delete(`plugin:${pluginId}`);
    // Clear slug-based cache as well
    for (const key of this.cache.keys()) {
      if (key.startsWith(`plugin:slug:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default PluginRegistry;
