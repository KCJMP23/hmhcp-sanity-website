// Supabase client for Advanced Reporting & Business Intelligence
// Story: 4.6 - Advanced Reporting & Business Intelligence

import { createClient } from '@supabase/supabase-js';
import type {
  CustomReportTemplate,
  ExecutiveDashboardMetrics,
  ROIAnalysisData,
  ReportSchedule,
  ReportGenerationLog,
  ExecutiveDashboardSummary,
  CreateReportTemplateRequest,
  UpdateReportTemplateRequest,
  GenerateReportRequest,
  ScheduleReportRequest,
  ExportReportRequest,
  ReportGenerationResponse,
  ReportingError,
  HealthcareContext,
  AIInsights,
  EngagementMetrics,
  PredictiveScores
} from '@/types/reporting';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class ReportingClient {
  private client = supabase;

  // Custom Report Templates
  async getReportTemplates(organizationId?: string): Promise<CustomReportTemplate[]> {
    const { data, error } = await this.client
      .from('custom_report_templates')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'is_public', organizationId || true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch report templates: ${error.message}`);
    return data || [];
  }

  async getReportTemplate(id: string): Promise<CustomReportTemplate | null> {
    const { data, error } = await this.client
      .from('custom_report_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch report template: ${error.message}`);
    }
    return data;
  }

  async createReportTemplate(template: CreateReportTemplateRequest, organizationId: string, userId: string): Promise<CustomReportTemplate> {
    const { data, error } = await this.client
      .from('custom_report_templates')
      .insert({
        ...template,
        organization_id: organizationId,
        created_by: userId,
        healthcare_metrics: template.healthcare_metrics || {},
        stakeholder_roles: template.stakeholder_roles || [],
        compliance_framework: template.compliance_framework || 'standard'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create report template: ${error.message}`);
    return data;
  }

  async updateReportTemplate(id: string, updates: UpdateReportTemplateRequest): Promise<CustomReportTemplate> {
    const { data, error } = await this.client
      .from('custom_report_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update report template: ${error.message}`);
    return data;
  }

  async deleteReportTemplate(id: string): Promise<void> {
    const { error } = await this.client
      .from('custom_report_templates')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete report template: ${error.message}`);
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    const { error } = await this.client
      .from('custom_report_templates')
      .update({ 
        usage_count: this.client.raw('usage_count + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to increment template usage: ${error.message}`);
  }

  // Executive Dashboard Metrics
  async getDashboardMetrics(organizationId: string, metricType?: string, limit = 100): Promise<ExecutiveDashboardMetrics[]> {
    let query = this.client
      .from('executive_dashboard_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('calculated_at', { ascending: false })
      .limit(limit);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
    return data || [];
  }

  async getDashboardSummary(organizationId: string): Promise<ExecutiveDashboardSummary[]> {
    const { data, error } = await this.client
      .from('executive_dashboard_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .order('calculation_date', { ascending: false });

    if (error) throw new Error(`Failed to fetch dashboard summary: ${error.message}`);
    return data || [];
  }

  async createDashboardMetric(
    organizationId: string,
    metricType: string,
    metricName: string,
    metricValue: number,
    metricUnit: string,
    healthcareContext: HealthcareContext,
    aiInsights: AIInsights,
    engagementMetrics: EngagementMetrics,
    predictiveScores: PredictiveScores,
    periodStart?: string,
    periodEnd?: string
  ): Promise<ExecutiveDashboardMetrics> {
    const { data, error } = await this.client
      .from('executive_dashboard_metrics')
      .insert({
        organization_id: organizationId,
        metric_type: metricType,
        metric_name: metricName,
        metric_value: metricValue,
        metric_unit: metricUnit,
        healthcare_context: healthcareContext,
        ai_insights: aiInsights,
        engagement_metrics: engagementMetrics,
        predictive_scores: predictiveScores,
        period_start: periodStart,
        period_end: periodEnd
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create dashboard metric: ${error.message}`);
    return data;
  }

  // ROI Analysis Data
  async getROIAnalysis(organizationId: string, forecastPeriod?: string): Promise<ROIAnalysisData[]> {
    let query = this.client
      .from('roi_analysis_data')
      .select('*')
      .eq('organization_id', organizationId)
      .order('generated_at', { ascending: false });

    if (forecastPeriod) {
      query = query.eq('forecast_period', forecastPeriod);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch ROI analysis: ${error.message}`);
    return data || [];
  }

  async createROIAnalysis(
    organizationId: string,
    analysisName: string,
    forecastPeriod: '7_days' | '30_days' | '90_days' | '1_year',
    predictions: any,
    confidenceIntervals: any,
    recommendedActions: any[],
    modelVersion: string,
    costBenefitAnalysis: any,
    healthcareImpactMetrics: any,
    userId: string,
    expiresAt?: string
  ): Promise<ROIAnalysisData> {
    const { data, error } = await this.client
      .from('roi_analysis_data')
      .insert({
        organization_id: organizationId,
        analysis_name: analysisName,
        forecast_period: forecastPeriod,
        predictions,
        confidence_intervals: confidenceIntervals,
        recommended_actions: recommendedActions,
        model_version: modelVersion,
        cost_benefit_analysis: costBenefitAnalysis,
        healthcare_impact_metrics: healthcareImpactMetrics,
        created_by: userId,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create ROI analysis: ${error.message}`);
    return data;
  }

  // Report Schedules
  async getReportSchedules(organizationId: string): Promise<ReportSchedule[]> {
    const { data, error } = await this.client
      .from('report_schedules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch report schedules: ${error.message}`);
    return data || [];
  }

  async createReportSchedule(schedule: ScheduleReportRequest, organizationId: string, userId: string): Promise<ReportSchedule> {
    const { data, error } = await this.client
      .from('report_schedules')
      .insert({
        ...schedule,
        organization_id: organizationId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create report schedule: ${error.message}`);
    return data;
  }

  async updateReportSchedule(id: string, updates: Partial<ScheduleReportRequest>): Promise<ReportSchedule> {
    const { data, error } = await this.client
      .from('report_schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update report schedule: ${error.message}`);
    return data;
  }

  async deleteReportSchedule(id: string): Promise<void> {
    const { error } = await this.client
      .from('report_schedules')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete report schedule: ${error.message}`);
  }

  // Report Generation Logs
  async getGenerationLogs(organizationId: string, limit = 50): Promise<ReportGenerationLog[]> {
    const { data, error } = await this.client
      .from('report_generation_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch generation logs: ${error.message}`);
    return data || [];
  }

  async createGenerationLog(
    organizationId: string,
    generationStatus: 'pending' | 'generating' | 'completed' | 'failed',
    generatedBy: string,
    reportTemplateId?: string,
    scheduleId?: string,
    filePath?: string,
    fileSizeBytes?: number,
    generationTimeMs?: number,
    errorMessage?: string
  ): Promise<ReportGenerationLog> {
    const { data, error } = await this.client
      .from('report_generation_logs')
      .insert({
        organization_id: organizationId,
        report_template_id: reportTemplateId,
        schedule_id: scheduleId,
        generation_status: generationStatus,
        file_path: filePath,
        file_size_bytes: fileSizeBytes,
        generation_time_ms: generationTimeMs,
        error_message: errorMessage,
        generated_by: generatedBy
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create generation log: ${error.message}`);
    return data;
  }

  async updateGenerationLog(
    id: string,
    updates: {
      generation_status?: 'pending' | 'generating' | 'completed' | 'failed';
      file_path?: string;
      file_size_bytes?: number;
      generation_time_ms?: number;
      error_message?: string;
    }
  ): Promise<ReportGenerationLog> {
    const { data, error } = await this.client
      .from('report_generation_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update generation log: ${error.message}`);
    return data;
  }

  // Healthcare Compliance Validation
  async validateHealthcareCompliance(
    data: any,
    complianceFramework: string,
    dataSensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // HIPAA compliance checks
    if (complianceFramework === 'hipaa' || dataSensitivity === 'confidential' || dataSensitivity === 'restricted') {
      if (data.patient_identifiers && Object.keys(data.patient_identifiers).length > 0) {
        errors.push('Patient identifiers detected in non-HIPAA compliant context');
      }
    }

    // FDA advertising standards
    if (complianceFramework === 'fda_advertising') {
      if (data.medical_claims && !data.disclaimers) {
        errors.push('Medical claims require appropriate disclaimers for FDA compliance');
      }
    }

    // General healthcare data validation
    if (data.medical_accuracy_score && data.medical_accuracy_score < 0.8) {
      errors.push('Medical accuracy score below acceptable threshold for healthcare reporting');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Refresh materialized view
  async refreshDashboardSummary(): Promise<void> {
    const { error } = await this.client
      .rpc('refresh_materialized_view', { view_name: 'executive_dashboard_summary' });

    if (error) throw new Error(`Failed to refresh dashboard summary: ${error.message}`);
  }
}

export const reportingClient = new ReportingClient();
