/**
 * Enterprise API Monitoring and Analytics Service
 * Healthcare-compliant monitoring with real-time analytics
 */

import { createClient } from '@supabase/supabase-js';

export interface APIMetrics {
  id: string;
  timestamp: string;
  organizationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  healthcarePriority: boolean;
  complianceFlags: string[];
  errorRate: number;
  throughput: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  availability: number;
}

export interface HealthcareMetrics {
  organizationId: string;
  timeRange: {
    start: string;
    end: string;
  };
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  healthcareRequests: number;
  complianceViolations: number;
  averageResponseTime: number;
  errorRate: number;
  availability: number;
  topEndpoints: EndpointMetrics[];
  errorBreakdown: ErrorMetrics[];
  complianceStatus: ComplianceMetrics;
  performanceTrends: PerformanceTrend[];
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  healthcarePriority: boolean;
  complianceScore: number;
}

export interface ErrorMetrics {
  statusCode: number;
  count: number;
  percentage: number;
  description: string;
  healthcareImpact: boolean;
}

export interface ComplianceMetrics {
  hipaaCompliance: number;
  fhirCompliance: number;
  auditLogging: number;
  dataEncryption: number;
  accessControl: number;
  overallScore: number;
}

export interface PerformanceTrend {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  healthcareImpact: boolean;
  notificationChannels: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  organizationId: string;
  severity: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  healthcareImpact: boolean;
  complianceFlags: string[];
}

export class APIMonitoringService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Record API metrics
   */
  async recordMetrics(metrics: Omit<APIMetrics, 'id' | 'timestamp'>): Promise<void> {
    try {
      const metricRecord: APIMetrics = {
        ...metrics,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      await this.supabase
        .from('api_metrics')
        .insert([metricRecord]);

      // Check for alerts
      await this.checkAlerts(metricRecord);
    } catch (error) {
      console.error('Failed to record metrics:', error);
    }
  }

  /**
   * Get healthcare metrics for organization
   */
  async getHealthcareMetrics(
    organizationId: string,
    timeRange: { start: string; end: string }
  ): Promise<HealthcareMetrics> {
    try {
      const { data: metrics, error } = await this.supabase
        .from('api_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', timeRange.start)
        .lte('timestamp', timeRange.end);

      if (error) throw error;

      return this.calculateHealthcareMetrics(metrics || [], organizationId, timeRange);
    } catch (error) {
      console.error('Failed to get healthcare metrics:', error);
      throw new Error('Failed to retrieve healthcare metrics');
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(organizationId: string): Promise<any> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const { data: metrics, error } = await this.supabase
        .from('api_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', oneHourAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return this.calculateRealTimeMetrics(metrics || []);
    } catch (error) {
      console.error('Failed to get real-time metrics:', error);
      throw new Error('Failed to retrieve real-time metrics');
    }
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    organizationId: string,
    timeRange: { start: string; end: string },
    granularity: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<PerformanceTrend[]> {
    try {
      const { data: metrics, error } = await this.supabase
        .from('api_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', timeRange.start)
        .lte('timestamp', timeRange.end)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return this.calculatePerformanceTrends(metrics || [], granularity);
    } catch (error) {
      console.error('Failed to get performance trends:', error);
      throw new Error('Failed to retrieve performance trends');
    }
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(organizationId: string): Promise<ComplianceMetrics> {
    try {
      const { data: metrics, error } = await this.supabase
        .from('api_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      return this.calculateComplianceMetrics(metrics || []);
    } catch (error) {
      console.error('Failed to get compliance metrics:', error);
      throw new Error('Failed to retrieve compliance metrics');
    }
  }

  /**
   * Create alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      const id = crypto.randomUUID();
      const alertRule: AlertRule = {
        ...rule,
        id
      };

      const { data, error } = await this.supabase
        .from('alert_rules')
        .insert([alertRule])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create alert rule:', error);
      throw new Error('Alert rule creation failed');
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(organizationId: string): Promise<Alert[]> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('resolved', false)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      throw new Error('Failed to retrieve active alerts');
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw new Error('Alert resolution failed');
    }
  }

  /**
   * Get cost analytics
   */
  async getCostAnalytics(
    organizationId: string,
    timeRange: { start: string; end: string }
  ): Promise<any> {
    try {
      const { data: metrics, error } = await this.supabase
        .from('api_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', timeRange.start)
        .lte('timestamp', timeRange.end);

      if (error) throw error;

      return this.calculateCostAnalytics(metrics || []);
    } catch (error) {
      console.error('Failed to get cost analytics:', error);
      throw new Error('Failed to retrieve cost analytics');
    }
  }

  // Private helper methods

  private calculateHealthcareMetrics(
    metrics: any[],
    organizationId: string,
    timeRange: { start: string; end: string }
  ): HealthcareMetrics {
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.status_code >= 200 && m.status_code < 300).length;
    const failedRequests = metrics.filter(m => m.status_code >= 400).length;
    const healthcareRequests = metrics.filter(m => m.healthcare_priority).length;
    const complianceViolations = metrics.filter(m => m.compliance_flags?.length > 0).length;

    const averageResponseTime = metrics.reduce((sum, m) => sum + m.response_time, 0) / totalRequests;
    const errorRate = (failedRequests / totalRequests) * 100;
    const availability = ((totalRequests - failedRequests) / totalRequests) * 100;

    // Calculate top endpoints
    const endpointMap = new Map();
    metrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, {
          endpoint: m.endpoint,
          method: m.method,
          requestCount: 0,
          totalResponseTime: 0,
          errorCount: 0,
          healthcarePriority: m.healthcare_priority,
          complianceFlags: m.compliance_flags || []
        });
      }
      const endpoint = endpointMap.get(key);
      endpoint.requestCount++;
      endpoint.totalResponseTime += m.response_time;
      if (m.status_code >= 400) endpoint.errorCount++;
    });

    const topEndpoints: EndpointMetrics[] = Array.from(endpointMap.values())
      .map(endpoint => ({
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        requestCount: endpoint.requestCount,
        averageResponseTime: endpoint.totalResponseTime / endpoint.requestCount,
        errorRate: (endpoint.errorCount / endpoint.requestCount) * 100,
        healthcarePriority: endpoint.healthcarePriority,
        complianceScore: this.calculateComplianceScore(endpoint.complianceFlags)
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    // Calculate error breakdown
    const errorMap = new Map();
    metrics.filter(m => m.status_code >= 400).forEach(m => {
      const key = m.status_code;
      if (!errorMap.has(key)) {
        errorMap.set(key, {
          statusCode: key,
          count: 0,
          healthcareImpact: m.healthcare_priority
        });
      }
      errorMap.get(key).count++;
    });

    const errorBreakdown: ErrorMetrics[] = Array.from(errorMap.values())
      .map(error => ({
        statusCode: error.statusCode,
        count: error.count,
        percentage: (error.count / failedRequests) * 100,
        description: this.getErrorDescription(error.statusCode),
        healthcareImpact: error.healthcareImpact
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate compliance status
    const complianceStatus = this.calculateComplianceMetrics(metrics);

    // Calculate performance trends
    const performanceTrends = this.calculatePerformanceTrends(metrics, 'hour');

    return {
      organizationId,
      timeRange,
      totalRequests,
      successfulRequests,
      failedRequests,
      healthcareRequests,
      complianceViolations,
      averageResponseTime,
      errorRate,
      availability,
      topEndpoints,
      errorBreakdown,
      complianceStatus,
      performanceTrends
    };
  }

  private calculateRealTimeMetrics(metrics: any[]): any {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentMetrics = metrics.filter(m => new Date(m.timestamp) >= oneMinuteAgo);
    const fiveMinuteMetrics = metrics.filter(m => new Date(m.timestamp) >= fiveMinutesAgo);

    const currentThroughput = recentMetrics.length;
    const fiveMinuteThroughput = fiveMinuteMetrics.length / 5; // per minute

    const responseTimes = recentMetrics.map(m => m.response_time);
    const p50 = this.percentile(responseTimes, 0.5);
    const p95 = this.percentile(responseTimes, 0.95);
    const p99 = this.percentile(responseTimes, 0.99);

    const errorRate = recentMetrics.length > 0 
      ? (recentMetrics.filter(m => m.status_code >= 400).length / recentMetrics.length) * 100 
      : 0;

    return {
      currentThroughput,
      fiveMinuteThroughput,
      latency: { p50, p95, p99 },
      errorRate,
      timestamp: now.toISOString()
    };
  }

  private calculatePerformanceTrends(metrics: any[], granularity: string): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const timeGroups = new Map();

    // Group metrics by time intervals
    metrics.forEach(metric => {
      const timestamp = new Date(metric.timestamp);
      let key: string;

      switch (granularity) {
        case 'minute':
          key = timestamp.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
          break;
        case 'hour':
          key = timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
          break;
        case 'day':
          key = timestamp.toISOString().substring(0, 10); // YYYY-MM-DD
          break;
        default:
          key = timestamp.toISOString().substring(0, 13);
      }

      if (!timeGroups.has(key)) {
        timeGroups.set(key, []);
      }
      timeGroups.get(key).push(metric);
    });

    // Calculate trends for each time group
    timeGroups.forEach((groupMetrics, timeKey) => {
      const totalRequests = groupMetrics.length;
      const successfulRequests = groupMetrics.filter((m: any) => m.status_code >= 200 && m.status_code < 300).length;
      const responseTimes = groupMetrics.map((m: any) => m.response_time);
      
      trends.push({
        timestamp: timeKey,
        responseTime: responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length,
        throughput: totalRequests,
        errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100,
        availability: (successfulRequests / totalRequests) * 100
      });
    });

    return trends.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private calculateComplianceMetrics(metrics: any[]): ComplianceMetrics {
    const totalMetrics = metrics.length;
    if (totalMetrics === 0) {
      return {
        hipaaCompliance: 100,
        fhirCompliance: 100,
        auditLogging: 100,
        dataEncryption: 100,
        accessControl: 100,
        overallScore: 100
      };
    }

    const hipaaCompliant = metrics.filter(m => m.compliance_flags?.includes('HIPAA_COMPLIANT')).length;
    const fhirCompliant = metrics.filter(m => m.compliance_flags?.includes('FHIR_COMPLIANT')).length;
    const auditLogged = metrics.filter(m => m.compliance_flags?.includes('AUDIT_LOGGED')).length;
    const dataEncrypted = metrics.filter(m => m.compliance_flags?.includes('DATA_ENCRYPTED')).length;
    const accessControlled = metrics.filter(m => m.compliance_flags?.includes('ACCESS_CONTROLLED')).length;

    return {
      hipaaCompliance: (hipaaCompliant / totalMetrics) * 100,
      fhirCompliance: (fhirCompliant / totalMetrics) * 100,
      auditLogging: (auditLogged / totalMetrics) * 100,
      dataEncryption: (dataEncrypted / totalMetrics) * 100,
      accessControl: (accessControlled / totalMetrics) * 100,
      overallScore: (
        (hipaaCompliant + fhirCompliant + auditLogged + dataEncrypted + accessControlled) / 
        (totalMetrics * 5)
      ) * 100
    };
  }

  private calculateCostAnalytics(metrics: any[]): any {
    // This would calculate costs based on API usage
    // For now, return mock data
    return {
      totalCost: 1250.50,
      costBreakdown: {
        compute: 450.25,
        storage: 200.75,
        bandwidth: 150.00,
        healthcare: 449.50
      },
      costTrends: [],
      optimization: {
        potentialSavings: 125.50,
        recommendations: [
          'Optimize response caching',
          'Implement request batching',
          'Use healthcare priority routing'
        ]
      }
    };
  }

  private calculateComplianceScore(complianceFlags: string[]): number {
    if (!complianceFlags || complianceFlags.length === 0) return 100;
    
    const totalFlags = 5; // HIPAA, FHIR, Audit, Encryption, Access Control
    const compliantFlags = complianceFlags.filter(flag => 
      !flag.includes('VIOLATION') && !flag.includes('FAILED')
    ).length;
    
    return (compliantFlags / totalFlags) * 100;
  }

  private getErrorDescription(statusCode: number): string {
    const descriptions: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return descriptions[statusCode] || 'Unknown Error';
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  private async checkAlerts(metrics: APIMetrics): Promise<void> {
    // This would check alert rules and create alerts if thresholds are exceeded
    // For now, just log the metrics
    console.log('Checking alerts for metrics:', metrics);
  }
}

export default APIMonitoringService;

// Export functions for backward compatibility
export const createAPIMonitoringService = () => new APIMonitoringService();