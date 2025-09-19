import { createClient } from '@supabase/supabase-js';

// TypeScript Types for Analytics
export interface HealthcareMetric {
  id?: string;
  metric_type: string;
  metric_value: number;
  metadata?: Record<string, any>;
  patient_segment?: string;
  content_category?: string;
  recorded_at?: Date;
  created_at?: Date;
}

export interface ContentEngagement {
  id?: string;
  page_path: string;
  scroll_depth: number;
  time_to_engagement: number;
  interactions_count: number;
  video_plays: number;
  downloads: number;
  session_id: string;
  visitor_id: string;
  created_at?: Date;
}

export interface SEOPerformance {
  id?: string;
  page_path: string;
  search_ranking?: number;
  keyword_performance?: Record<string, any>;
  organic_traffic?: number;
  bounce_rate?: number;
  avg_time_on_page?: number;
  created_at?: Date;
}

export interface AnalyticsAlert {
  id?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric_name: string;
  current_value: number;
  threshold_value: number;
  description?: string;
  is_resolved?: boolean;
  resolved_at?: Date;
  created_at?: Date;
}

// Analytics Data Access Layer
export class AnalyticsDAL {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Healthcare Metrics Methods
  async recordHealthcareMetric(metric: HealthcareMetric) {
    const { data, error } = await this.supabase
      .from('analytics_healthcare_metrics')
      .insert(metric)
      .select();

    if (error) throw error;
    return data;
  }

  async getHealthcareMetrics(filters: Partial<HealthcareMetric> = {}) {
    let query = this.supabase.from('analytics_healthcare_metrics').select('*');
    
    // Apply filters dynamically
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Content Engagement Methods
  async trackContentEngagement(engagement: ContentEngagement) {
    const { data, error } = await this.supabase
      .from('analytics_content_engagement')
      .insert(engagement)
      .select();

    if (error) throw error;
    return data;
  }

  async getContentEngagementAnalytics(page_path?: string) {
    let query = this.supabase.from('analytics_content_engagement').select('*');
    
    if (page_path) {
      query = query.eq('page_path', page_path);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // SEO Performance Methods
  async recordSEOPerformance(performance: SEOPerformance) {
    const { data, error } = await this.supabase
      .from('analytics_seo_performance')
      .insert(performance)
      .select();

    if (error) throw error;
    return data;
  }

  async getSEOPerformance(page_path?: string) {
    let query = this.supabase.from('analytics_seo_performance').select('*');
    
    if (page_path) {
      query = query.eq('page_path', page_path);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Alerts and Notifications
  async createAlert(alert: AnalyticsAlert) {
    const { data, error } = await this.supabase
      .from('analytics_alerts')
      .insert(alert)
      .select();

    if (error) throw error;
    return data;
  }

  async getActiveAlerts(severity?: AnalyticsAlert['severity']) {
    let query = this.supabase
      .from('analytics_alerts')
      .select('*')
      .eq('is_resolved', false);

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async resolveAlert(alertId: string) {
    const { data, error } = await this.supabase
      .from('analytics_alerts')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', alertId)
      .select();

    if (error) throw error;
    return data;
  }

  // Advanced Analytics Methods
  async getHealthcareContentPerformance() {
    const { data, error } = await this.supabase.rpc('get_healthcare_content_performance');
    if (error) throw error;
    return data;
  }

  async getPredictiveContentTrends() {
    const { data, error } = await this.supabase.rpc('predict_content_trends');
    if (error) throw error;
    return data;
  }
}

// Singleton instance for easy importing
export const analyticsDAL = new AnalyticsDAL();