// Power BI-inspired report builder utilities
// Story: 4.6 - Advanced Reporting & Business Intelligence

import type {
  CustomReportTemplate,
  ReportTemplateDefinition,
  DataSource,
  Visualization,
  HealthcareMetrics,
  ROIMetrics,
  QualityIndicator,
  ExecutiveDashboardMetrics,
  ROIAnalysisData,
  HealthcareContext,
  AIInsights,
  EngagementMetrics,
  PredictiveScores
} from '@/types/reporting';

export class CustomReportBuilder {
  private templates: Map<string, CustomReportTemplate> = new Map();

  // Template Management
  createTemplate(
    name: string,
    category: 'executive' | 'compliance' | 'operational' | 'clinical',
    definition: ReportTemplateDefinition,
    healthcareMetrics?: HealthcareMetrics
  ): CustomReportTemplate {
    const template: CustomReportTemplate = {
      id: this.generateId(),
      name,
      description: '',
      category,
      template_definition: definition,
      healthcare_metrics: healthcareMetrics || {},
      stakeholder_roles: [],
      compliance_framework: 'standard',
      created_by: '',
      organization_id: '',
      is_public: false,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.templates.set(template.id, template);
    return template;
  }

  // Data Source Management
  createDataSource(
    name: string,
    type: 'database' | 'api' | 'file' | 'ai_insights',
    config: {
      query?: string;
      endpoint?: string;
      parameters?: Record<string, any>;
      healthcare_compliance_level: 'standard' | 'enhanced' | 'expert_review';
    }
  ): DataSource {
    return {
      id: this.generateId(),
      name,
      type,
      query: config.query,
      endpoint: config.endpoint,
      parameters: config.parameters,
      healthcare_compliance_level: config.healthcare_compliance_level
    };
  }

  // Visualization Management
  createVisualization(
    type: 'chart' | 'table' | 'metric' | 'kpi' | 'trend',
    title: string,
    dataSourceId: string,
    config: any,
    position: { x: number; y: number; width: number; height: number }
  ): Visualization {
    return {
      id: this.generateId(),
      type,
      title,
      data_source_id: dataSourceId,
      config,
      position
    };
  }

  // Healthcare Metrics Calculation
  calculateHealthcareMetrics(data: any[]): HealthcareMetrics {
    const metrics: HealthcareMetrics = {};

    // Patient Engagement Score
    const patientEngagement = this.calculatePatientEngagement(data);
    if (patientEngagement !== null) {
      metrics.patient_engagement_score = patientEngagement;
    }

    // Professional Productivity Score
    const professionalProductivity = this.calculateProfessionalProductivity(data);
    if (professionalProductivity !== null) {
      metrics.professional_productivity_score = professionalProductivity;
    }

    // Platform Adoption Rate
    const platformAdoption = this.calculatePlatformAdoption(data);
    if (platformAdoption !== null) {
      metrics.platform_adoption_rate = platformAdoption;
    }

    // Compliance Score
    const complianceScore = this.calculateComplianceScore(data);
    if (complianceScore !== null) {
      metrics.compliance_score = complianceScore;
    }

    // ROI Metrics
    const roiMetrics = this.calculateROIMetrics(data);
    if (roiMetrics) {
      metrics.roi_metrics = roiMetrics;
    }

    // Quality Indicators
    const qualityIndicators = this.calculateQualityIndicators(data);
    if (qualityIndicators.length > 0) {
      metrics.quality_indicators = qualityIndicators;
    }

    return metrics;
  }

  private calculatePatientEngagement(data: any[]): number | null {
    const engagementData = data.filter(d => d.user_type === 'patient');
    if (engagementData.length === 0) return null;

    const avgTimeOnPage = engagementData.reduce((sum, d) => sum + (d.time_on_page || 0), 0) / engagementData.length;
    const avgPageViews = engagementData.reduce((sum, d) => sum + (d.page_views || 0), 0) / engagementData.length;
    const avgBounceRate = engagementData.reduce((sum, d) => sum + (d.bounce_rate || 0), 0) / engagementData.length;

    // Weighted score: time on page (40%), page views (30%), bounce rate (30%)
    const score = (avgTimeOnPage * 0.4) + (avgPageViews * 0.3) + ((1 - avgBounceRate) * 0.3);
    return Math.min(Math.max(score, 0), 1); // Normalize to 0-1
  }

  private calculateProfessionalProductivity(data: any[]): number | null {
    const professionalData = data.filter(d => d.user_type === 'professional');
    if (professionalData.length === 0) return null;

    const avgTasksCompleted = professionalData.reduce((sum, d) => sum + (d.tasks_completed || 0), 0) / professionalData.length;
    const avgEfficiencyScore = professionalData.reduce((sum, d) => sum + (d.efficiency_score || 0), 0) / professionalData.length;
    const avgSatisfactionScore = professionalData.reduce((sum, d) => sum + (d.satisfaction_score || 0), 0) / professionalData.length;

    // Weighted score: tasks completed (40%), efficiency (35%), satisfaction (25%)
    const score = (avgTasksCompleted * 0.4) + (avgEfficiencyScore * 0.35) + (avgSatisfactionScore * 0.25);
    return Math.min(Math.max(score, 0), 1); // Normalize to 0-1
  }

  private calculatePlatformAdoption(data: any[]): number | null {
    const totalUsers = data.length;
    if (totalUsers === 0) return null;

    const activeUsers = data.filter(d => d.last_active && new Date(d.last_active) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    return activeUsers / totalUsers;
  }

  private calculateComplianceScore(data: any[]): number | null {
    const complianceData = data.filter(d => d.compliance_score !== undefined);
    if (complianceData.length === 0) return null;

    const avgComplianceScore = complianceData.reduce((sum, d) => sum + d.compliance_score, 0) / complianceData.length;
    return Math.min(Math.max(avgComplianceScore, 0), 1); // Normalize to 0-1
  }

  private calculateROIMetrics(data: any[]): ROIMetrics | null {
    const roiData = data.filter(d => d.roi_metrics);
    if (roiData.length === 0) return null;

    const totalInvestment = roiData.reduce((sum, d) => sum + (d.roi_metrics?.total_investment || 0), 0);
    const totalCostSavings = roiData.reduce((sum, d) => sum + (d.roi_metrics?.cost_savings || 0), 0);
    const totalRevenueGenerated = roiData.reduce((sum, d) => sum + (d.roi_metrics?.revenue_generated || 0), 0);
    const totalTimeSaved = roiData.reduce((sum, d) => sum + (d.roi_metrics?.time_saved_hours || 0), 0);

    const netBenefit = totalCostSavings + totalRevenueGenerated;
    const paybackPeriodMonths = totalInvestment > 0 ? (totalInvestment / (netBenefit / 12)) : 0;
    const efficiencyGainPercentage = totalInvestment > 0 ? ((netBenefit / totalInvestment) * 100) : 0;

    return {
      total_investment: totalInvestment,
      cost_savings: totalCostSavings,
      revenue_generated: totalRevenueGenerated,
      time_saved_hours: totalTimeSaved,
      efficiency_gain_percentage: efficiencyGainPercentage,
      payback_period_months: paybackPeriodMonths
    };
  }

  private calculateQualityIndicators(data: any[]): QualityIndicator[] {
    const indicators: QualityIndicator[] = [];

    // Patient Satisfaction
    const patientSatisfaction = data.filter(d => d.user_type === 'patient' && d.satisfaction_score !== undefined);
    if (patientSatisfaction.length > 0) {
      const avgSatisfaction = patientSatisfaction.reduce((sum, d) => sum + d.satisfaction_score, 0) / patientSatisfaction.length;
      indicators.push({
        name: 'Patient Satisfaction',
        value: avgSatisfaction,
        target: 0.8,
        unit: 'score',
        trend: avgSatisfaction > 0.8 ? 'improving' : avgSatisfaction > 0.6 ? 'stable' : 'declining'
      });
    }

    // Clinical Efficiency
    const clinicalEfficiency = data.filter(d => d.efficiency_score !== undefined);
    if (clinicalEfficiency.length > 0) {
      const avgEfficiency = clinicalEfficiency.reduce((sum, d) => sum + d.efficiency_score, 0) / clinicalEfficiency.length;
      indicators.push({
        name: 'Clinical Efficiency',
        value: avgEfficiency,
        target: 0.85,
        unit: 'score',
        trend: avgEfficiency > 0.85 ? 'improving' : avgEfficiency > 0.7 ? 'stable' : 'declining'
      });
    }

    // Compliance Rate
    const complianceRate = data.filter(d => d.compliance_score !== undefined);
    if (complianceRate.length > 0) {
      const avgCompliance = complianceRate.reduce((sum, d) => sum + d.compliance_score, 0) / complianceRate.length;
      indicators.push({
        name: 'Compliance Rate',
        value: avgCompliance,
        target: 0.95,
        unit: 'percentage',
        trend: avgCompliance > 0.95 ? 'improving' : avgCompliance > 0.9 ? 'stable' : 'declining'
      });
    }

    return indicators;
  }

  // Report Generation
  async generateReport(template: CustomReportTemplate, data: any[], filters?: Record<string, any>): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Apply filters
      const filteredData = this.applyFilters(data, filters || {});
      
      // Calculate metrics
      const healthcareMetrics = this.calculateHealthcareMetrics(filteredData);
      
      // Generate visualizations
      const visualizations = await this.generateVisualizations(template.template_definition.visualizations, filteredData);
      
      // Create report data
      const reportData = {
        template_id: template.id,
        template_name: template.name,
        generated_at: new Date().toISOString(),
        data_points: filteredData.length,
        healthcare_metrics: healthcareMetrics,
        visualizations,
        filters_applied: filters || {},
        generation_time_ms: Date.now() - startTime
      };

      return reportData;
    } catch (error) {
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyFilters(data: any[], filters: Record<string, any>): any[] {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined) return true;
        
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        
        if (typeof value === 'object' && value.start && value.end) {
          const itemDate = new Date(item[key]);
          return itemDate >= new Date(value.start) && itemDate <= new Date(value.end);
        }
        
        return item[key] === value;
      });
    });
  }

  private async generateVisualizations(visualizations: Visualization[], data: any[]): Promise<any[]> {
    return visualizations.map(viz => {
      const vizData = data.filter(item => item.data_source_id === viz.data_source_id);
      
      switch (viz.type) {
        case 'chart':
          return this.generateChartVisualization(viz, vizData);
        case 'table':
          return this.generateTableVisualization(viz, vizData);
        case 'metric':
          return this.generateMetricVisualization(viz, vizData);
        case 'kpi':
          return this.generateKPIVisualization(viz, vizData);
        case 'trend':
          return this.generateTrendVisualization(viz, vizData);
        default:
          return { ...viz, data: vizData, error: 'Unknown visualization type' };
      }
    });
  }

  private generateChartVisualization(viz: Visualization, data: any[]): any {
    const config = viz.config;
    const aggregatedData = this.aggregateData(data, config.aggregation || 'sum', config.x_axis, config.y_axis);
    
    return {
      ...viz,
      data: aggregatedData,
      chart_config: {
        type: config.chart_type || 'bar',
        x_axis: config.x_axis,
        y_axis: config.y_axis,
        color_scheme: config.color_scheme || 'healthcare',
        show_legend: config.show_legend !== false,
        show_tooltips: config.show_tooltips !== false
      }
    };
  }

  private generateTableVisualization(viz: Visualization, data: any[]): any {
    return {
      ...viz,
      data: data.slice(0, 100), // Limit to 100 rows for performance
      table_config: {
        columns: Object.keys(data[0] || {}),
        sortable: true,
        filterable: true
      }
    };
  }

  private generateMetricVisualization(viz: Visualization, data: any[]): any {
    const config = viz.config;
    const value = this.aggregateData(data, config.aggregation || 'sum', config.y_axis)[0]?.value || 0;
    
    return {
      ...viz,
      data: { value, unit: config.unit || '' },
      metric_config: {
        format: config.format || 'number',
        color: value > (config.threshold || 0) ? 'green' : 'red'
      }
    };
  }

  private generateKPIVisualization(viz: Visualization, data: any[]): any {
    const config = viz.config;
    const currentValue = this.aggregateData(data, config.aggregation || 'sum', config.y_axis)[0]?.value || 0;
    const targetValue = config.target || 0;
    const trend = this.calculateTrend(data, config.y_axis);
    
    return {
      ...viz,
      data: {
        current_value: currentValue,
        target_value: targetValue,
        achievement_rate: targetValue > 0 ? (currentValue / targetValue) * 100 : 0,
        trend: trend
      },
      kpi_config: {
        format: config.format || 'percentage',
        color: currentValue >= targetValue ? 'green' : 'orange'
      }
    };
  }

  private generateTrendVisualization(viz: Visualization, data: any[]): any {
    const config = viz.config;
    const trendData = this.calculateTrendData(data, config.x_axis, config.y_axis);
    
    return {
      ...viz,
      data: trendData,
      trend_config: {
        type: 'line',
        x_axis: config.x_axis,
        y_axis: config.y_axis,
        show_trend_line: true
      }
    };
  }

  private aggregateData(data: any[], aggregation: string, xAxis?: string, yAxis?: string): any[] {
    if (!yAxis) return data;

    const grouped = data.reduce((acc, item) => {
      const key = xAxis ? item[xAxis] : 'all';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item[yAxis]);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped).map(([key, values]) => {
      let value: number;
      switch (aggregation) {
        case 'sum':
          value = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          value = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'count':
          value = values.length;
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'max':
          value = Math.max(...values);
          break;
        default:
          value = values.reduce((sum, val) => sum + val, 0);
      }
      return { [xAxis || 'category']: key, value };
    });
  }

  private calculateTrend(data: any[], yAxis?: string): 'up' | 'down' | 'stable' {
    if (!yAxis || data.length < 2) return 'stable';
    
    const values = data.map(item => item[yAxis]).filter(val => typeof val === 'number');
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  }

  private calculateTrendData(data: any[], xAxis?: string, yAxis?: string): any[] {
    if (!xAxis || !yAxis) return data;
    
    return data
      .map(item => ({ [xAxis]: item[xAxis], [yAxis]: item[yAxis] }))
      .sort((a, b) => new Date(a[xAxis]).getTime() - new Date(b[xAxis]).getTime());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const customReportBuilder = new CustomReportBuilder();
