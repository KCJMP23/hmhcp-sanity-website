// Plugin Marketplace Integration
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { 
  PluginDefinition, 
  PluginSearchFilters, 
  PluginSearchResults,
  PluginCategory,
  PluginReview,
  PluginMarketplaceStats,
  PluginType,
  MarketplaceStatus
} from '@/types/plugins/marketplace';

export class PluginMarketplace {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Search plugins with filters
   */
  async searchPlugins(filters: PluginSearchFilters): Promise<PluginSearchResults> {
    try {
      let query = this.supabase
        .from('plugin_definitions')
        .select(`
          *,
          plugin_categories!inner(name, slug, healthcare_specialty),
          plugin_reviews(rating, review_text, created_at)
        `);

      // Apply filters
      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%, description.ilike.%${filters.query}%`);
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('plugin_categories.slug', filters.categories);
      }

      if (filters.plugin_types && filters.plugin_types.length > 0) {
        query = query.in('plugin_type', filters.plugin_types);
      }

      if (filters.healthcare_specialties && filters.healthcare_specialties.length > 0) {
        query = query.overlaps('healthcare_specializations', filters.healthcare_specialties);
      }

      if (filters.marketplace_status && filters.marketplace_status.length > 0) {
        query = query.in('marketplace_status', filters.marketplace_status);
      }

      if (filters.min_rating !== undefined) {
        query = query.gte('rating', filters.min_rating);
      }

      if (filters.max_rating !== undefined) {
        query = query.lte('rating', filters.max_rating);
      }

      if (filters.author) {
        query = query.ilike('author', `%${filters.author}%`);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'rating';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: plugins, error, count } = await query;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      // Calculate average ratings for plugins
      const pluginsWithRatings = plugins?.map(plugin => ({
        ...plugin,
        rating: this.calculateAverageRating(plugin.plugin_reviews)
      })) || [];

      return {
        plugins: pluginsWithRatings,
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit,
        filters_applied: filters
      };

    } catch (error) {
      console.error('Plugin search failed:', error);
      throw error;
    }
  }

  /**
   * Get plugin by ID
   */
  async getPlugin(pluginId: string): Promise<PluginDefinition | null> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select(`
          *,
          plugin_categories(name, slug, healthcare_specialty),
          plugin_reviews(rating, review_text, created_at, user_id),
          plugin_dependencies(dependency_plugin_id, required_version, dependency_type)
        `)
        .eq('id', pluginId)
        .single();

      if (error) {
        console.error('Error fetching plugin:', error);
        return null;
      }

      return {
        ...data,
        rating: this.calculateAverageRating(data.plugin_reviews)
      };
    } catch (error) {
      console.error('Error fetching plugin:', error);
      return null;
    }
  }

  /**
   * Get plugin categories
   */
  async getCategories(): Promise<PluginCategory[]> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_categories')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
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
        .eq('marketplace_status', 'approved')
        .order('rating', { ascending: false })
        .order('installation_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch featured plugins: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching featured plugins:', error);
      throw error;
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
        throw new Error(`Failed to fetch recent plugins: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent plugins:', error);
      throw error;
    }
  }

  /**
   * Get plugin reviews
   */
  async getPluginReviews(pluginId: string, page: number = 1, limit: number = 20): Promise<{
    reviews: PluginReview[];
    total: number;
    has_more: boolean;
  }> {
    try {
      const offset = (page - 1) * limit;

      const { data: reviews, error, count } = await this.supabase
        .from('plugin_reviews')
        .select('*')
        .eq('plugin_id', pluginId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch reviews: ${error.message}`);
      }

      return {
        reviews: reviews || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error fetching plugin reviews:', error);
      throw error;
    }
  }

  /**
   * Add plugin review
   */
  async addPluginReview(review: Omit<PluginReview, 'id' | 'created_at' | 'updated_at'>): Promise<PluginReview> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_reviews')
        .insert({
          ...review,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add review: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding plugin review:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<PluginMarketplaceStats> {
    try {
      // Get total plugins
      const { count: totalPlugins } = await this.supabase
        .from('plugin_definitions')
        .select('*', { count: 'exact', head: true });

      // Get approved plugins
      const { count: approvedPlugins } = await this.supabase
        .from('plugin_definitions')
        .select('*', { count: 'exact', head: true })
        .eq('marketplace_status', 'approved');

      // Get pending plugins
      const { count: pendingPlugins } = await this.supabase
        .from('plugin_definitions')
        .select('*', { count: 'exact', head: true })
        .eq('marketplace_status', 'pending');

      // Get total installations
      const { count: totalInstallations } = await this.supabase
        .from('plugin_installations')
        .select('*', { count: 'exact', head: true });

      // Get active installations
      const { count: activeInstallations } = await this.supabase
        .from('plugin_installations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get average rating
      const { data: ratingData } = await this.supabase
        .from('plugin_definitions')
        .select('rating')
        .eq('marketplace_status', 'approved')
        .not('rating', 'is', null);

      const averageRating = ratingData?.length > 0 
        ? ratingData.reduce((sum, plugin) => sum + plugin.rating, 0) / ratingData.length 
        : 0;

      // Get category stats
      const { data: categoryStats } = await this.supabase
        .from('plugin_categories')
        .select(`
          id,
          name,
          plugin_category_assignments(plugin_id)
        `);

      const categories = categoryStats?.map(category => ({
        category_id: category.id,
        name: category.name,
        plugin_count: category.plugin_category_assignments?.length || 0,
        installation_count: 0, // TODO: Calculate from installations
        average_rating: 0 // TODO: Calculate from reviews
      })) || [];

      // Get top plugins
      const topPlugins = await this.getFeaturedPlugins(5);

      // Get recent plugins
      const recentPlugins = await this.getRecentPlugins(5);

      return {
        total_plugins: totalPlugins || 0,
        approved_plugins: approvedPlugins || 0,
        pending_plugins: pendingPlugins || 0,
        total_installations: totalInstallations || 0,
        active_installations: activeInstallations || 0,
        average_rating: averageRating,
        categories,
        top_plugins: topPlugins,
        recent_plugins: recentPlugins
      };
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      throw error;
    }
  }

  /**
   * Get plugins by category
   */
  async getPluginsByCategory(categorySlug: string, limit: number = 20): Promise<PluginDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select(`
          *,
          plugin_categories!inner(slug)
        `)
        .eq('plugin_categories.slug', categorySlug)
        .eq('marketplace_status', 'approved')
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch plugins by category: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching plugins by category:', error);
      throw error;
    }
  }

  /**
   * Get plugins by author
   */
  async getPluginsByAuthor(author: string, limit: number = 20): Promise<PluginDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select('*')
        .ilike('author', `%${author}%`)
        .eq('marketplace_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch plugins by author: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching plugins by author:', error);
      throw error;
    }
  }

  /**
   * Calculate average rating from reviews
   */
  private calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) {
      return 0;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Submit plugin for approval
   */
  async submitPlugin(pluginData: Omit<PluginDefinition, 'id' | 'created_at' | 'updated_at' | 'installation_count' | 'rating'>): Promise<PluginDefinition> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .insert({
          ...pluginData,
          marketplace_status: 'pending',
          installation_count: 0,
          rating: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit plugin: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error submitting plugin:', error);
      throw error;
    }
  }

  /**
   * Update plugin status
   */
  async updatePluginStatus(pluginId: string, status: MarketplaceStatus): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('plugin_definitions')
        .update({ 
          marketplace_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', pluginId);

      if (error) {
        throw new Error(`Failed to update plugin status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating plugin status:', error);
      throw error;
    }
  }
}
