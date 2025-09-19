import { createClient } from '@supabase/supabase-js';

// Core integration service for connecting frontend to new backend systems
export class CoreIntegrationService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // =====================================================
  // AI Content Generation System Integration
  // =====================================================

  async getContentTemplates(contentType?: string) {
    const { data, error } = await this.supabase
      .from('content_templates')
      .select('*')
      .eq('is_active', true)
      .eq('content_type', contentType || '')
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data;
  }

  async generateAIContent(templateId: string, variables: Record<string, string>) {
    const { data: template, error: templateError } = await this.supabase
      .from('content_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Here you would integrate with your AI service
    // For now, we'll return a placeholder
    const generatedContent = this.interpolateTemplate(
      typeof template.prompt_template === 'string' ? template.prompt_template : '', 
      variables
    );

    // Log the generation
    const { error: logError } = await this.supabase
      .from('ai_generation_history')
      .insert({
        request_data: { template_id: templateId, variables },
        response_data: { generated_content: generatedContent },
        status: 'success',
        model_used: 'gpt-4',
        tokens_used: 150
      });

    if (logError) console.error('Failed to log AI generation:', logError);

    return generatedContent;
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  }

  // =====================================================
  // Analytics System Integration
  // =====================================================

  async trackPageView(pagePath: string, userId?: string) {
    const { error } = await this.supabase
      .from('analytics_page_views')
      .insert({
        page_path: pagePath,
        user_id: userId,
        session_id: this.getSessionId(),
        referrer: document.referrer,
        user_agent: navigator.userAgent
      });

    if (error) console.error('Failed to track page view:', error);
  }

  async trackEvent(eventName: string, eventData: any, userId?: string) {
    const { error } = await this.supabase
      .from('analytics_events')
      .insert({
        event_name: eventName,
        event_data: eventData,
        user_id: userId,
        session_id: this.getSessionId()
      });

    if (error) console.error('Failed to track event:', error);
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('hmhcp_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('hmhcp_session_id', sessionId);
    }
    return sessionId;
  }

  // =====================================================
  // Multi-language System Integration
  // =====================================================

  async getLanguages() {
    const { data, error } = await this.supabase
      .from('languages')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getTranslation(key: string, languageCode: string = 'en') {
    const { data, error } = await this.supabase
      .from('translations')
      .select('translation_text')
      .eq('key_name', key)
      .eq('language_code', languageCode)
      .eq('is_active', true)
      .single();

    if (error) return key; // Fallback to key if translation not found
    return data.translation_text;
  }

  async getLocalizedContent(contentId: string, contentType: string, languageCode: string = 'en') {
    const { data, error } = await this.supabase
      .from('content_localization')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('language_code', languageCode)
      .eq('is_published', true)
      .single();

    if (error) return null;
    return data;
  }

  // =====================================================
  // User Management System Integration
  // =====================================================

  async getUserRoles() {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  async getUserPermissions(userId: string) {
    const { data, error } = await this.supabase
      .from('role_permissions')
      .select(`
        user_roles(name, description),
        user_permissions(name, resource, action)
      `)
      .eq('user_roles.id', userId);

    if (error) throw error;
    return data;
  }

  async logUserActivity(activityType: string, action: string, metadata?: any) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await this.supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        action,
        metadata: metadata || {},
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });

    if (error) console.error('Failed to log user activity:', error);
  }

  private async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  // =====================================================
  // API & Webhook System Integration
  // =====================================================

  async getAPIEndpoints() {
    const { data, error } = await this.supabase
      .from('api_endpoints')
      .select('*')
      .eq('is_active', true)
      .order('path');

    if (error) throw error;
    return data;
  }

  async generateOpenAPISpec(version: string = 'v1') {
    const { data, error } = await this.supabase
      .rpc('generate_openapi_spec', { p_version: version });

    if (error) throw error;
    return data;
  }

  // =====================================================
  // Feature Flags System Integration
  // =====================================================

  async isFeatureEnabled(featureName: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return false;

    const { data, error } = await this.supabase
      .rpc('is_feature_enabled', {
        p_flag_name: featureName,
        p_user_id: user.id
      });

    if (error) {
      console.error('Failed to check feature flag:', error);
      return false;
    }

    return typeof data === 'boolean' ? data : false;
  }

  // =====================================================
  // System Monitoring Integration
  // =====================================================

  async logSystemMetric(metricName: string, value: number, category: string = 'frontend') {
    const { error } = await this.supabase
      .rpc('log_system_metric', {
        p_metric_name: metricName,
        p_metric_value: value,
        p_category: category
      });

    if (error) console.error('Failed to log system metric:', error);
  }

  // =====================================================
  // Deployment Configuration Integration
  // =====================================================

  async getDeploymentConfig(environment: string = 'production', configKey?: string) {
    const { data, error } = await this.supabase
      .rpc('get_deployment_config', {
        p_environment: environment,
        p_config_key: configKey
      });

    if (error) throw error;
    return data;
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('system_health_checks')
        .select('*')
        .limit(1);

      if (error) throw error;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() };
    }
  }

  // Initialize the service
  async initialize() {
    try {
      // Check system health
      const health = await this.healthCheck();
      
      // Log initialization
      await this.logSystemMetric('initialization', 1, 'system');
      
      console.log('Core Integration Service initialized:', health);
      return health;
    } catch (error) {
      console.error('Failed to initialize Core Integration Service:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const coreIntegrationService = new CoreIntegrationService();
