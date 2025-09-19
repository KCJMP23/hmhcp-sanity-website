// Email Campaign Supabase Client
// Created: 2025-01-27
// Purpose: Enhanced Supabase client for email campaign data with healthcare compliance

import { createClient } from '@supabase/supabase-js';
import type {
  EmailTemplate,
  EmailContact,
  EmailCampaign,
  EmailAnalytics,
  EmailDeliverability,
  ABTestResult,
  EmailWebhookEvent,
  EmailCampaignSummary,
  CreateEmailTemplateRequest,
  CreateEmailCampaignRequest,
  SendEmailCampaignRequest,
  EmailAnalyticsRequest,
  ContactSegmentationRequest,
  EmailTemplateWithStats,
  EmailCampaignWithAnalytics,
  ContactWithEngagement
} from '@/types/email-campaigns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

export const emailClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Email Templates
export class EmailTemplateService {
  static async createTemplate(data: CreateEmailTemplateRequest): Promise<EmailTemplate> {
    const { data: template, error } = await emailClient
      .from('email_templates')
      .insert({
        ...data,
        healthcare_compliance: {
          can_spam_compliant: false,
          fda_advertising_compliant: false,
          hipaa_compliant: false,
          required_disclaimers: [],
          consent_required: true,
          audit_trail_enabled: true
        }
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create email template: ${error.message}`);
    return template;
  }

  static async getTemplates(category?: string): Promise<EmailTemplate[]> {
    let query = emailClient
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;
    if (error) throw new Error(`Failed to fetch email templates: ${error.message}`);
    return templates || [];
  }

  static async getTemplate(id: string): Promise<EmailTemplate> {
    const { data: template, error } = await emailClient
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch email template: ${error.message}`);
    return template;
  }

  static async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const { data: template, error } = await emailClient
      .from('email_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update email template: ${error.message}`);
    return template;
  }

  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await emailClient
      .from('email_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete email template: ${error.message}`);
  }

  static async getTemplatesWithStats(): Promise<EmailTemplateWithStats[]> {
    const { data: templates, error } = await emailClient
      .from('email_templates')
      .select(`
        *,
        usage_count:email_campaigns(count),
        last_used:email_campaigns(created_at),
        performance_metrics:email_campaign_summary(avg_open_rate, avg_click_rate, total_sent)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch templates with stats: ${error.message}`);
    return templates || [];
  }
}

// Email Contacts
export class EmailContactService {
  static async createContact(contact: Omit<EmailContact, 'id' | 'created_at' | 'updated_at'>): Promise<EmailContact> {
    const { data, error } = await emailClient
      .from('email_contacts')
      .insert(contact)
      .select()
      .single();

    if (error) throw new Error(`Failed to create email contact: ${error.message}`);
    return data;
  }

  static async getContacts(filters?: ContactSegmentationRequest): Promise<EmailContact[]> {
    let query = emailClient
      .from('email_contacts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.contact_types?.length) {
      query = query.in('contact_type', filters.contact_types);
    }

    if (filters?.healthcare_specialties?.length) {
      query = query.in('healthcare_specialty', filters.healthcare_specialties);
    }

    if (filters?.organization_ids?.length) {
      query = query.in('organization_id', filters.organization_ids);
    }

    const { data: contacts, error } = await query;
    if (error) throw new Error(`Failed to fetch email contacts: ${error.message}`);
    return contacts || [];
  }

  static async getContact(id: string): Promise<EmailContact> {
    const { data: contact, error } = await emailClient
      .from('email_contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch email contact: ${error.message}`);
    return contact;
  }

  static async updateContact(id: string, updates: Partial<EmailContact>): Promise<EmailContact> {
    const { data: contact, error } = await emailClient
      .from('email_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update email contact: ${error.message}`);
    return contact;
  }

  static async getContactsWithEngagement(): Promise<ContactWithEngagement[]> {
    const { data: contacts, error } = await emailClient
      .from('email_contacts')
      .select(`
        *,
        engagement_metrics:email_analytics(
          total_emails_received:count,
          total_emails_opened:count(event_type.eq.opened),
          total_emails_clicked:count(event_type.eq.clicked),
          last_email_opened:max(created_at),
          last_email_clicked:max(created_at)
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch contacts with engagement: ${error.message}`);
    return contacts || [];
  }
}

// Email Campaigns
export class EmailCampaignService {
  static async createCampaign(data: CreateEmailCampaignRequest, createdBy: string): Promise<EmailCampaign> {
    const { data: campaign, error } = await emailClient
      .from('email_campaigns')
      .insert({
        ...data,
        created_by: createdBy,
        compliance_status: 'pending'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create email campaign: ${error.message}`);
    return campaign;
  }

  static async getCampaigns(createdBy?: string): Promise<EmailCampaign[]> {
    let query = emailClient
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data: campaigns, error } = await query;
    if (error) throw new Error(`Failed to fetch email campaigns: ${error.message}`);
    return campaigns || [];
  }

  static async getCampaign(id: string): Promise<EmailCampaign> {
    const { data: campaign, error } = await emailClient
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch email campaign: ${error.message}`);
    return campaign;
  }

  static async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const { data: campaign, error } = await emailClient
      .from('email_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update email campaign: ${error.message}`);
    return campaign;
  }

  static async getCampaignsWithAnalytics(): Promise<EmailCampaignWithAnalytics[]> {
    const { data: campaigns, error } = await emailClient
      .from('email_campaigns')
      .select(`
        *,
        analytics:email_campaign_summary(*),
        template:email_templates(*),
        ab_test_results:email_ab_test_results(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch campaigns with analytics: ${error.message}`);
    return campaigns || [];
  }
}

// Email Analytics
export class EmailAnalyticsService {
  static async recordEvent(event: Omit<EmailAnalytics, 'id' | 'created_at'>): Promise<EmailAnalytics> {
    const { data, error } = await emailClient
      .from('email_analytics')
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(`Failed to record email event: ${error.message}`);
    return data;
  }

  static async getAnalytics(filters: EmailAnalyticsRequest): Promise<EmailAnalytics[]> {
    let query = emailClient
      .from('email_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id);
    }

    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data: analytics, error } = await query;
    if (error) throw new Error(`Failed to fetch email analytics: ${error.message}`);
    return analytics || [];
  }

  static async getCampaignSummary(campaignId: string): Promise<EmailCampaignSummary> {
    const { data: summary, error } = await emailClient
      .from('email_campaign_summary')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (error) throw new Error(`Failed to fetch campaign summary: ${error.message}`);
    return summary;
  }

  static async refreshCampaignSummary(): Promise<void> {
    const { error } = await emailClient.rpc('refresh_email_campaign_summary');
    if (error) throw new Error(`Failed to refresh campaign summary: ${error.message}`);
  }
}

// A/B Testing
export class ABTestService {
  static async createABTestResult(result: Omit<ABTestResult, 'id' | 'created_at'>): Promise<ABTestResult> {
    const { data, error } = await emailClient
      .from('email_ab_test_results')
      .insert(result)
      .select()
      .single();

    if (error) throw new Error(`Failed to create A/B test result: ${error.message}`);
    return data;
  }

  static async getABTestResults(campaignId: string): Promise<ABTestResult[]> {
    const { data: results, error } = await emailClient
      .from('email_ab_test_results')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch A/B test results: ${error.message}`);
    return results || [];
  }

  static async updateABTestWinner(campaignId: string, winnerVariant: string): Promise<void> {
    const { error } = await emailClient
      .from('email_ab_test_results')
      .update({ winner: false })
      .eq('campaign_id', campaignId);

    if (error) throw new Error(`Failed to reset winners: ${error.message}`);

    const { error: updateError } = await emailClient
      .from('email_ab_test_results')
      .update({ winner: true })
      .eq('campaign_id', campaignId)
      .eq('variant_name', winnerVariant);

    if (updateError) throw new Error(`Failed to set winner: ${updateError.message}`);
  }
}

// Webhook Events
export class WebhookService {
  static async createWebhookEvent(event: Omit<EmailWebhookEvent, 'id' | 'created_at'>): Promise<EmailWebhookEvent> {
    const { data, error } = await emailClient
      .from('email_webhook_events')
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(`Failed to create webhook event: ${error.message}`);
    return data;
  }

  static async getUnprocessedWebhookEvents(): Promise<EmailWebhookEvent[]> {
    const { data: events, error } = await emailClient
      .from('email_webhook_events')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch unprocessed webhook events: ${error.message}`);
    return events || [];
  }

  static async markWebhookEventProcessed(id: string): Promise<void> {
    const { error } = await emailClient
      .from('email_webhook_events')
      .update({ processed: true })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark webhook event as processed: ${error.message}`);
  }
}

// Healthcare Compliance Validation
export class ComplianceService {
  static async validateEmailContent(content: string, template: EmailTemplate): Promise<{
    isCompliant: boolean;
    violations: Array<{
      type: string;
      severity: 'error' | 'warning';
      message: string;
      field?: string;
      suggestion?: string;
    }>;
  }> {
    const violations = [];

    // CAN-SPAM Compliance Check
    if (!content.includes('unsubscribe') && !content.includes('opt-out')) {
      violations.push({
        type: 'can_spam',
        severity: 'error',
        message: 'Email must include unsubscribe link for CAN-SPAM compliance',
        field: 'content',
        suggestion: 'Add unsubscribe link in email footer'
      });
    }

    // FDA Advertising Compliance Check
    if (template.category === 'promotional') {
      if (!content.includes('disclaimer') && !content.includes('consult your doctor')) {
        violations.push({
          type: 'fda_advertising',
          severity: 'warning',
          message: 'Promotional healthcare content should include medical disclaimer',
          field: 'content',
          suggestion: 'Add "Consult your healthcare provider" disclaimer'
        });
      }
    }

    // HIPAA Compliance Check
    if (content.match(/\b(patient|medical record|diagnosis|treatment)\b/i)) {
      violations.push({
        type: 'hipaa',
        severity: 'error',
        message: 'Email content may contain protected health information',
        field: 'content',
        suggestion: 'Remove or anonymize protected health information'
      });
    }

    return {
      isCompliant: violations.filter(v => v.severity === 'error').length === 0,
      violations
    };
  }
}

export default {
  EmailTemplateService,
  EmailContactService,
  EmailCampaignService,
  EmailAnalyticsService,
  ABTestService,
  WebhookService,
  ComplianceService
};
