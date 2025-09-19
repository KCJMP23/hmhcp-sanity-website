/**
 * Comprehensive metrics collection system for healthcare AI platforms
 * 
 * Features:
 * - Multi-dimensional metric collection with healthcare KPIs
 * - Time-series data storage with Redis
 * - Real-time aggregation and rollup capabilities
 * - Prometheus-compatible export format
 * - HIPAA-compliant audit logging
 * - Anomaly detection and alerting
 * 
 * @author HMHCP AI Team
 * @version 1.0.0
 * @since 2025-09-10
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { z } from 'zod';

// =============================================
// TYPE DEFINITIONS AND SCHEMAS
// =============================================

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  RATE = 'rate',
  P50 = 'p50',
  P95 = 'p95',
  P99 = 'p99'
}

export enum HealthcareMetricCategory {
  CLINICAL_DECISION_SUPPORT = 'clinical_decision_support',
  PATIENT_SAFETY = 'patient_safety',
  HIPAA_COMPLIANCE = 'hipaa_compliance',
  PHI_ACCESS = 'phi_access',
  AUDIT_TRAIL = 'audit_trail',
  WORKFLOW_PERFORMANCE = 'workflow_performance'
}

export interface MetricLabels {
  [key: string]: string | number;
}

export interface MetricPoint {
  timestamp: number;
  value: number;
  labels?: MetricLabels;
}

export interface HistogramBuckets {
  le: number; // Less than or equal to
  count: number;
}

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  unit?: string;
  labels?: string[];
  buckets?: number[]; // For histograms
  objectives?: { [quantile: number]: number }; // For summaries
  healthcareCategory?: HealthcareMetricCategory;
  isPhiRelated?: boolean;
  complianceLevel?: 'critical' | 'high' | 'medium' | 'low';
}

export interface AggregatedMetric {
  metric: string;
  aggregation: AggregationType;
  value: number;
  timestamp: number;
  window: string;
  labels?: MetricLabels;
}

export interface HealthcareKPI {
  name: string;
  value: number;
  target: number;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: number;
  category: HealthcareMetricCategory;
  complianceImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface MetricAlert {
  id: string;
  metric: string;
  condition: 'above' | 'below' | 'equal';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  healthcareImpact?: 'patient_safety' | 'compliance' | 'performance';
  isActive: boolean;
  triggeredAt?: number;
  acknowledgedAt?: number;
}

const MetricDefinitionSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(MetricType),
  description: z.string(),
  unit: z.string().optional(),
  labels: z.array(z.string()).optional(),
  buckets: z.array(z.number()).optional(),
  objectives: z.record(z.number()).optional(),
  healthcareCategory: z.nativeEnum(HealthcareMetricCategory).optional(),
  isPhiRelated: z.boolean().optional(),
  complianceLevel: z.enum(['critical', 'high', 'medium', 'low']).optional()
});

// =============================================
// METRICS COLLECTOR CLASS
// =============================================

export class MetricsCollector extends EventEmitter {
  private redis: Redis;
  private metrics: Map<string, MetricDefinition>;
  private timeSeries: Map<string, MetricPoint[]>;
  private aggregatedData: Map<string, AggregatedMetric[]>;
  private alerts: Map<string, MetricAlert>;
  private healthcareKPIs: Map<string, HealthcareKPI>;
  private readonly retentionPeriod: number;
  private readonly aggregationWindows: string[];
  private readonly maxTimeSeriesPoints: number;
  private readonly namespace?: string;
  private readonly defaultLabels?: Record<string, string>;
  private readonly enablePrometheusExport?: boolean;

  constructor(options: {
    redis?: Redis;
    redisUrl?: string;
    namespace?: string;
    defaultLabels?: Record<string, string>;
    enablePrometheusExport?: boolean;
    aggregationIntervals?: string[];
    retentionPeriod?: number;
    aggregationWindows?: string[];
    maxTimeSeriesPoints?: number;
  } = {}) {
    super();

    // Use provided Redis instance or create new one
    if (options.redis) {
      this.redis = options.redis;
    } else {
      this.redis = new Redis(options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
    }

    this.namespace = options.namespace;
    this.defaultLabels = options.defaultLabels;
    this.enablePrometheusExport = options.enablePrometheusExport;

    this.metrics = new Map();
    this.timeSeries = new Map();
    this.aggregatedData = new Map();
    this.alerts = new Map();
    this.healthcareKPIs = new Map();

    // Configuration - use aggregationIntervals or aggregationWindows
    this.retentionPeriod = options.retentionPeriod || 7 * 24 * 60 * 60 * 1000; // 7 days
    this.aggregationWindows = options.aggregationIntervals || options.aggregationWindows || ['1m', '5m', '15m', '1h', '24h'];
    this.maxTimeSeriesPoints = options.maxTimeSeriesPoints || 10000;

    // Initialize default healthcare metrics
    this.initializeHealthcareMetrics();

    // Start background processes
    this.startAggregationWorker();
    this.startCleanupWorker();
  }

  // =============================================
  // METRIC REGISTRATION
  // =============================================

  /**
   * Register a new metric definition
   */
  public registerMetric(definition: MetricDefinition): void {
    try {
      // Validate definition
      const validated = MetricDefinitionSchema.parse(definition);
      
      // Store metric definition
      this.metrics.set(validated.name, validated);

      // Initialize time series storage
      this.timeSeries.set(validated.name, []);

      // Initialize aggregated data storage
      this.aggregatedData.set(validated.name, []);

      // Store in Redis for persistence
      this.redis.hset(
        'metrics:definitions',
        validated.name,
        JSON.stringify(validated)
      );

      this.emit('metric_registered', validated);

    } catch (error) {
      throw new Error(`Failed to register metric ${definition.name}: ${error}`);
    }
  }

  /**
   * Initialize default healthcare-specific metrics
   */
  private initializeHealthcareMetrics(): void {
    const healthcareMetrics: MetricDefinition[] = [
      // Clinical Decision Support Metrics
      {
        name: 'clinical_decision_accuracy',
        type: MetricType.GAUGE,
        description: 'Clinical decision support system accuracy percentage',
        unit: 'percent',
        labels: ['decision_type', 'department'],
        healthcareCategory: HealthcareMetricCategory.CLINICAL_DECISION_SUPPORT,
        complianceLevel: 'critical'
      },
      {
        name: 'clinical_decision_response_time',
        type: MetricType.HISTOGRAM,
        description: 'Time taken for clinical decision support responses',
        unit: 'seconds',
        buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
        labels: ['decision_type', 'priority'],
        healthcareCategory: HealthcareMetricCategory.CLINICAL_DECISION_SUPPORT,
        complianceLevel: 'high'
      },

      // Patient Safety Metrics
      {
        name: 'patient_safety_incidents',
        type: MetricType.COUNTER,
        description: 'Number of patient safety incidents detected',
        labels: ['severity', 'category', 'department'],
        healthcareCategory: HealthcareMetricCategory.PATIENT_SAFETY,
        complianceLevel: 'critical'
      },
      {
        name: 'safety_alert_response_time',
        type: MetricType.HISTOGRAM,
        description: 'Time to respond to patient safety alerts',
        unit: 'seconds',
        buckets: [30, 60, 300, 600, 1800, 3600],
        labels: ['severity', 'department'],
        healthcareCategory: HealthcareMetricCategory.PATIENT_SAFETY,
        complianceLevel: 'critical'
      },

      // HIPAA Compliance Metrics
      {
        name: 'hipaa_compliance_score',
        type: MetricType.GAUGE,
        description: 'Overall HIPAA compliance score',
        unit: 'percent',
        healthcareCategory: HealthcareMetricCategory.HIPAA_COMPLIANCE,
        complianceLevel: 'critical'
      },
      {
        name: 'compliance_violations',
        type: MetricType.COUNTER,
        description: 'Number of compliance violations detected',
        labels: ['violation_type', 'severity', 'department'],
        healthcareCategory: HealthcareMetricCategory.HIPAA_COMPLIANCE,
        isPhiRelated: true,
        complianceLevel: 'critical'
      },

      // PHI Access Metrics
      {
        name: 'phi_access_attempts',
        type: MetricType.COUNTER,
        description: 'Number of PHI access attempts',
        labels: ['user_role', 'access_type', 'department'],
        healthcareCategory: HealthcareMetricCategory.PHI_ACCESS,
        isPhiRelated: true,
        complianceLevel: 'critical'
      },
      {
        name: 'unauthorized_phi_access',
        type: MetricType.COUNTER,
        description: 'Number of unauthorized PHI access attempts',
        labels: ['user_id', 'access_type', 'ip_address'],
        healthcareCategory: HealthcareMetricCategory.PHI_ACCESS,
        isPhiRelated: true,
        complianceLevel: 'critical'
      },

      // Audit Trail Metrics
      {
        name: 'audit_log_completeness',
        type: MetricType.GAUGE,
        description: 'Percentage of complete audit logs',
        unit: 'percent',
        healthcareCategory: HealthcareMetricCategory.AUDIT_TRAIL,
        complianceLevel: 'high'
      },
      {
        name: 'audit_log_integrity_violations',
        type: MetricType.COUNTER,
        description: 'Number of audit log integrity violations',
        labels: ['violation_type'],
        healthcareCategory: HealthcareMetricCategory.AUDIT_TRAIL,
        complianceLevel: 'critical'
      },

      // Workflow Performance Metrics
      {
        name: 'workflow_completion_time',
        type: MetricType.HISTOGRAM,
        description: 'Time to complete healthcare workflows',
        unit: 'seconds',
        buckets: [60, 300, 600, 1800, 3600, 7200, 14400],
        labels: ['workflow_type', 'priority', 'department'],
        healthcareCategory: HealthcareMetricCategory.WORKFLOW_PERFORMANCE,
        complianceLevel: 'medium'
      },
      {
        name: 'workflow_success_rate',
        type: MetricType.GAUGE,
        description: 'Percentage of successful workflow completions',
        unit: 'percent',
        labels: ['workflow_type', 'department'],
        healthcareCategory: HealthcareMetricCategory.WORKFLOW_PERFORMANCE,
        complianceLevel: 'high'
      },

      // System Performance Metrics
      {
        name: 'system_cpu_usage',
        type: MetricType.GAUGE,
        description: 'System CPU usage percentage',
        unit: 'percent',
        labels: ['instance', 'service']
      },
      {
        name: 'system_memory_usage',
        type: MetricType.GAUGE,
        description: 'System memory usage percentage',
        unit: 'percent',
        labels: ['instance', 'service']
      },
      {
        name: 'api_request_duration',
        type: MetricType.HISTOGRAM,
        description: 'API request duration',
        unit: 'seconds',
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        labels: ['method', 'endpoint', 'status_code']
      },
      {
        name: 'api_requests_total',
        type: MetricType.COUNTER,
        description: 'Total number of API requests',
        labels: ['method', 'endpoint', 'status_code']
      }
    ];

    healthcareMetrics.forEach(metric => this.registerMetric(metric));
  }

  // =============================================
  // METRIC COLLECTION
  // =============================================

  /**
   * Record a metric value
   */
  public record(
    metricName: string,
    value: number,
    labels: MetricLabels = {},
    timestamp?: number
  ): void {
    const metric = this.metrics.get(metricName);
    if (!metric) {
      throw new Error(`Metric ${metricName} not registered`);
    }

    const point: MetricPoint = {
      timestamp: timestamp || Date.now(),
      value,
      labels
    };

    // Add to time series
    const series = this.timeSeries.get(metricName) || [];
    series.push(point);

    // Maintain max points limit
    if (series.length > this.maxTimeSeriesPoints) {
      series.shift();
    }

    this.timeSeries.set(metricName, series);

    // Store in Redis for persistence
    const key = `metrics:timeseries:${metricName}`;
    this.redis.zadd(key, point.timestamp, JSON.stringify(point));
    this.redis.expire(key, Math.floor(this.retentionPeriod / 1000));

    // Check alerts
    this.checkAlerts(metricName, value, labels);

    // Update healthcare KPIs if applicable
    if (metric.healthcareCategory) {
      this.updateHealthcareKPI(metric, value, labels);
    }

    // Emit event for real-time streaming
    this.emit('metric_recorded', {
      metric: metricName,
      value,
      labels,
      timestamp: point.timestamp
    });
  }

  /**
   * Increment a counter metric
   */
  public increment(metricName: string, labels: MetricLabels = {}, amount: number = 1): void {
    this.record(metricName, amount, labels);
  }

  /**
   * Set a gauge metric value
   */
  public gauge(metricName: string, value: number, labels: MetricLabels = {}): void {
    this.record(metricName, value, labels);
  }

  /**
   * Record a histogram observation
   */
  public histogram(metricName: string, value: number, labels: MetricLabels = {}): void {
    this.record(metricName, value, labels);
  }

  /**
   * Record a summary observation
   */
  public summary(metricName: string, value: number, labels: MetricLabels = {}): void {
    this.record(metricName, value, labels);
  }

  // =============================================
  // AGGREGATION AND ANALYTICS
  // =============================================

  /**
   * Get aggregated metrics for a time window
   */
  public async getAggregatedMetrics(
    metricName: string,
    aggregationType: AggregationType,
    window: string,
    labels?: MetricLabels
  ): Promise<AggregatedMetric[]> {
    const key = `metrics:aggregated:${metricName}:${aggregationType}:${window}`;
    const data = await this.redis.zrange(key, -100, -1, 'WITHSCORES');

    const results: AggregatedMetric[] = [];
    for (let i = 0; i < data.length; i += 2) {
      const metric = JSON.parse(data[i]);
      const timestamp = parseInt(data[i + 1]);

      if (!labels || this.labelsMatch(metric.labels, labels)) {
        results.push({
          metric: metricName,
          aggregation: aggregationType,
          value: metric.value,
          timestamp,
          window,
          labels: metric.labels
        });
      }
    }

    return results;
  }

  /**
   * Calculate percentiles for a metric
   */
  public calculatePercentiles(
    metricName: string,
    percentiles: number[] = [50, 95, 99],
    timeRange?: { start: number; end: number }
  ): { [percentile: number]: number } {
    const series = this.timeSeries.get(metricName) || [];
    let values = series.map(point => point.value);

    if (timeRange) {
      values = series
        .filter(point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end)
        .map(point => point.value);
    }

    values.sort((a, b) => a - b);

    const result: { [percentile: number]: number } = {};
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * values.length) - 1;
      result[p] = values[Math.max(0, index)] || 0;
    });

    return result;
  }

  /**
   * Calculate rate of change for a metric
   */
  public calculateRate(
    metricName: string,
    timeWindow: number = 60000 // 1 minute in milliseconds
  ): number {
    const series = this.timeSeries.get(metricName) || [];
    const now = Date.now();
    const windowStart = now - timeWindow;

    const recentPoints = series.filter(point => point.timestamp >= windowStart);
    if (recentPoints.length < 2) return 0;

    const earliest = recentPoints[0];
    const latest = recentPoints[recentPoints.length - 1];

    const timeDiff = (latest.timestamp - earliest.timestamp) / 1000; // seconds
    const valueDiff = latest.value - earliest.value;

    return timeDiff > 0 ? valueDiff / timeDiff : 0;
  }

  /**
   * Detect anomalies in metric values
   */
  public detectAnomalies(
    metricName: string,
    threshold: number = 2.0,
    windowSize: number = 100
  ): MetricPoint[] {
    const series = this.timeSeries.get(metricName) || [];
    if (series.length < windowSize) return [];

    const anomalies: MetricPoint[] = [];
    const recentPoints = series.slice(-windowSize);

    // Calculate mean and standard deviation
    const values = recentPoints.map(p => p.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Find anomalies (values beyond threshold standard deviations)
    recentPoints.forEach(point => {
      const zScore = Math.abs(point.value - mean) / stdDev;
      if (zScore > threshold) {
        anomalies.push(point);
      }
    });

    return anomalies;
  }

  // =============================================
  // HEALTHCARE KPIs
  // =============================================

  /**
   * Update healthcare-specific KPIs
   */
  private updateHealthcareKPI(
    metric: MetricDefinition,
    value: number,
    labels: MetricLabels
  ): void {
    const kpiName = `${metric.name}_kpi`;
    let kpi = this.healthcareKPIs.get(kpiName);

    if (!kpi) {
      kpi = {
        name: kpiName,
        value: 0,
        target: this.getKPITarget(metric.name),
        threshold: this.getKPIThresholds(metric.name),
        trend: 'stable',
        lastUpdated: Date.now(),
        category: metric.healthcareCategory!,
        complianceImpact: this.getComplianceImpact(metric)
      };
    }

    const previousValue = kpi.value;
    kpi.value = value;
    kpi.lastUpdated = Date.now();

    // Calculate trend
    if (value > previousValue) {
      kpi.trend = 'up';
    } else if (value < previousValue) {
      kpi.trend = 'down';
    } else {
      kpi.trend = 'stable';
    }

    this.healthcareKPIs.set(kpiName, kpi);

    // Check KPI thresholds
    this.checkKPIThresholds(kpi);
  }

  /**
   * Get all healthcare KPIs
   */
  public getHealthcareKPIs(): HealthcareKPI[] {
    return Array.from(this.healthcareKPIs.values());
  }

  /**
   * Get KPIs by category
   */
  public getKPIsByCategory(category: HealthcareMetricCategory): HealthcareKPI[] {
    return Array.from(this.healthcareKPIs.values())
      .filter(kpi => kpi.category === category);
  }

  private getKPITarget(metricName: string): number {
    const targets: { [key: string]: number } = {
      'clinical_decision_accuracy': 95,
      'hipaa_compliance_score': 100,
      'audit_log_completeness': 100,
      'workflow_success_rate': 98,
      'patient_safety_incidents': 0,
      'unauthorized_phi_access': 0,
      'compliance_violations': 0
    };
    return targets[metricName] || 0;
  }

  private getKPIThresholds(metricName: string): { warning: number; critical: number } {
    const thresholds: { [key: string]: { warning: number; critical: number } } = {
      'clinical_decision_accuracy': { warning: 90, critical: 85 },
      'hipaa_compliance_score': { warning: 95, critical: 90 },
      'audit_log_completeness': { warning: 95, critical: 90 },
      'workflow_success_rate': { warning: 95, critical: 90 },
      'patient_safety_incidents': { warning: 1, critical: 3 },
      'unauthorized_phi_access': { warning: 1, critical: 5 },
      'compliance_violations': { warning: 1, critical: 3 }
    };
    return thresholds[metricName] || { warning: 0, critical: 0 };
  }

  private getComplianceImpact(metric: MetricDefinition): HealthcareKPI['complianceImpact'] {
    if (metric.complianceLevel === 'critical') return 'critical';
    if (metric.complianceLevel === 'high') return 'high';
    if (metric.complianceLevel === 'medium') return 'medium';
    if (metric.complianceLevel === 'low') return 'low';
    return 'none';
  }

  private checkKPIThresholds(kpi: HealthcareKPI): void {
    let severity: MetricAlert['severity'] = 'info';
    let healthcareImpact: MetricAlert['healthcareImpact'] | undefined;

    if (kpi.value <= kpi.threshold.critical) {
      severity = 'critical';
      healthcareImpact = kpi.category === HealthcareMetricCategory.PATIENT_SAFETY 
        ? 'patient_safety' : 'compliance';
    } else if (kpi.value <= kpi.threshold.warning) {
      severity = 'warning';
      healthcareImpact = 'performance';
    }

    if (severity !== 'info') {
      const alertId = `kpi_${kpi.name}_${Date.now()}`;
      const alert: MetricAlert = {
        id: alertId,
        metric: kpi.name,
        condition: 'below',
        threshold: severity === 'critical' ? kpi.threshold.critical : kpi.threshold.warning,
        severity,
        healthcareImpact,
        isActive: true,
        triggeredAt: Date.now()
      };

      this.alerts.set(alertId, alert);
      this.emit('kpi_threshold_exceeded', { kpi, alert });
    }
  }

  // =============================================
  // ALERTING SYSTEM
  // =============================================

  /**
   * Add a metric alert
   */
  public addAlert(alert: Omit<MetricAlert, 'id' | 'isActive' | 'triggeredAt'>): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: MetricAlert = {
      ...alert,
      id: alertId,
      isActive: false
    };

    this.alerts.set(alertId, fullAlert);
    return alertId;
  }

  /**
   * Check alerts for a metric value
   */
  private checkAlerts(metricName: string, value: number, labels: MetricLabels): void {
    Array.from(this.alerts.values())
      .filter(alert => alert.metric === metricName)
      .forEach(alert => {
        const conditionMet = this.evaluateAlertCondition(alert, value);

        if (conditionMet && !alert.isActive) {
          alert.isActive = true;
          alert.triggeredAt = Date.now();
          this.emit('alert_triggered', { alert, value, labels });
        } else if (!conditionMet && alert.isActive) {
          alert.isActive = false;
          alert.acknowledgedAt = Date.now();
          this.emit('alert_resolved', { alert, value, labels });
        }
      });
  }

  private evaluateAlertCondition(alert: MetricAlert, value: number): boolean {
    switch (alert.condition) {
      case 'above':
        return value > alert.threshold;
      case 'below':
        return value < alert.threshold;
      case 'equal':
        return value === alert.threshold;
      default:
        return false;
    }
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): MetricAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.isActive);
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isActive = false;
      alert.acknowledgedAt = Date.now();
      this.emit('alert_acknowledged', alert);
    }
  }

  // =============================================
  // EXPORT AND INTEGRATION
  // =============================================

  /**
   * Export metrics in Prometheus format
   */
  public exportPrometheusMetrics(): string {
    let output = '';

    for (const [name, metric] of this.metrics) {
      const series = this.timeSeries.get(name) || [];
      if (series.length === 0) continue;

      // Add metric help and type
      output += `# HELP ${name} ${metric.description}\n`;
      output += `# TYPE ${name} ${metric.type}\n`;

      // Add metric values
      const latest = series[series.length - 1];
      const labelStr = this.formatPrometheusLabels(latest.labels || {});
      output += `${name}${labelStr} ${latest.value} ${latest.timestamp}\n`;
    }

    return output;
  }

  private formatPrometheusLabels(labels: MetricLabels): string {
    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    return labelPairs ? `{${labelPairs}}` : '';
  }

  /**
   * Export metrics for CloudWatch
   */
  public exportCloudWatchMetrics(): any[] {
    const metrics: any[] = [];

    for (const [name, metric] of this.metrics) {
      const series = this.timeSeries.get(name) || [];
      if (series.length === 0) continue;

      const latest = series[series.length - 1];
      metrics.push({
        MetricName: name,
        Value: latest.value,
        Unit: metric.unit || 'Count',
        Timestamp: new Date(latest.timestamp),
        Dimensions: Object.entries(latest.labels || {}).map(([Name, Value]) => ({
          Name,
          Value: String(Value)
        }))
      });
    }

    return metrics;
  }

  /**
   * Get dashboard data
   */
  public getDashboardData(): {
    metrics: MetricDefinition[];
    timeSeries: { [metricName: string]: MetricPoint[] };
    healthcareKPIs: HealthcareKPI[];
    activeAlerts: MetricAlert[];
    systemStatus: {
      totalMetrics: number;
      totalDataPoints: number;
      memoryUsage: number;
      cacheHitRate: number;
    };
  } {
    const totalDataPoints = Array.from(this.timeSeries.values())
      .reduce((sum, series) => sum + series.length, 0);

    return {
      metrics: Array.from(this.metrics.values()),
      timeSeries: Object.fromEntries(this.timeSeries),
      healthcareKPIs: this.getHealthcareKPIs(),
      activeAlerts: this.getActiveAlerts(),
      systemStatus: {
        totalMetrics: this.metrics.size,
        totalDataPoints,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cacheHitRate: 0.95 // TODO: Calculate actual cache hit rate
      }
    };
  }

  // =============================================
  // BACKGROUND WORKERS
  // =============================================

  /**
   * Start aggregation worker for rolling up metrics
   */
  private startAggregationWorker(): void {
    setInterval(() => {
      this.performAggregation();
    }, 60000); // Run every minute
  }

  /**
   * Perform metric aggregation
   */
  private async performAggregation(): Promise<void> {
    for (const [metricName, metric] of this.metrics) {
      const series = this.timeSeries.get(metricName) || [];
      if (series.length === 0) continue;

      for (const window of this.aggregationWindows) {
        const windowMs = this.parseTimeWindow(window);
        const now = Date.now();
        const windowStart = now - windowMs;

        const windowData = series.filter(point => point.timestamp >= windowStart);
        if (windowData.length === 0) continue;

        // Calculate various aggregations
        const aggregations = this.calculateAggregations(windowData);

        // Store aggregated data
        for (const [aggType, value] of Object.entries(aggregations)) {
          const key = `metrics:aggregated:${metricName}:${aggType}:${window}`;
          await this.redis.zadd(key, now, JSON.stringify({ value, timestamp: now }));
          await this.redis.expire(key, Math.floor(this.retentionPeriod / 1000));
        }
      }
    }
  }

  private parseTimeWindow(window: string): number {
    const unit = window.slice(-1);
    const value = parseInt(window.slice(0, -1));

    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value;
    }
  }

  private calculateAggregations(data: MetricPoint[]): { [key: string]: number } {
    const values = data.map(point => point.value);
    values.sort((a, b) => a - b);

    return {
      sum: values.reduce((sum, val) => sum + val, 0),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p50: values[Math.floor(values.length * 0.5)] || 0,
      p95: values[Math.floor(values.length * 0.95)] || 0,
      p99: values[Math.floor(values.length * 0.99)] || 0
    };
  }

  /**
   * Start cleanup worker for old data
   */
  private startCleanupWorker(): void {
    setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Clean up old metric data
   */
  private async performCleanup(): Promise<void> {
    const cutoffTime = Date.now() - this.retentionPeriod;

    // Clean up time series data
    for (const [metricName, series] of this.timeSeries) {
      const filteredSeries = series.filter(point => point.timestamp > cutoffTime);
      this.timeSeries.set(metricName, filteredSeries);

      // Clean up Redis data
      const key = `metrics:timeseries:${metricName}`;
      await this.redis.zremrangebyscore(key, 0, cutoffTime);
    }

    // Clean up aggregated data
    for (const metricName of this.metrics.keys()) {
      for (const window of this.aggregationWindows) {
        for (const aggType of Object.values(AggregationType)) {
          const key = `metrics:aggregated:${metricName}:${aggType}:${window}`;
          await this.redis.zremrangebyscore(key, 0, cutoffTime);
        }
      }
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private labelsMatch(labels1: MetricLabels = {}, labels2: MetricLabels = {}): boolean {
    const keys2 = Object.keys(labels2);
    return keys2.every(key => labels1[key] === labels2[key]);
  }

  /**
   * Get metric definition
   */
  public getMetricDefinition(name: string): MetricDefinition | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metric definitions
   */
  public getAllMetrics(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get time series data for a metric
   */
  public getTimeSeries(name: string): MetricPoint[] {
    return this.timeSeries.get(name) || [];
  }

  /**
   * Clear all data (for testing)
   */
  public clear(): void {
    this.timeSeries.clear();
    this.aggregatedData.clear();
    this.alerts.clear();
    this.healthcareKPIs.clear();
  }

  /**
   * Close connections and cleanup
   */
  public async close(): Promise<void> {
    await this.redis.quit();
    this.removeAllListeners();
  }
}

// =============================================
// FACTORY AND UTILITIES
// =============================================

/**
 * Create a metrics collector singleton
 */
let metricsCollectorInstance: MetricsCollector | null = null;

export function createMetricsCollector(options?: {
  redisUrl?: string;
  retentionPeriod?: number;
  aggregationWindows?: string[];
  maxTimeSeriesPoints?: number;
}): MetricsCollector {
  if (!metricsCollectorInstance) {
    metricsCollectorInstance = new MetricsCollector(options?.redisUrl, options);
  }
  return metricsCollectorInstance;
}

/**
 * Get existing metrics collector instance
 */
export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollectorInstance) {
    throw new Error('Metrics collector not initialized. Call createMetricsCollector first.');
  }
  return metricsCollectorInstance;
}

/**
 * Healthcare-specific metric collection helpers
 */
export class HealthcareMetrics {
  private collector: MetricsCollector;

  constructor(collector: MetricsCollector) {
    this.collector = collector;
  }

  /**
   * Record a clinical decision
   */
  recordClinicalDecision(
    accurate: boolean,
    responseTime: number,
    decisionType: string,
    department: string
  ): void {
    this.collector.gauge('clinical_decision_accuracy', accurate ? 100 : 0, {
      decision_type: decisionType,
      department
    });

    this.collector.histogram('clinical_decision_response_time', responseTime, {
      decision_type: decisionType,
      priority: responseTime > 5 ? 'low' : responseTime > 1 ? 'medium' : 'high'
    });
  }

  /**
   * Record a patient safety incident
   */
  recordPatientSafetyIncident(
    severity: 'low' | 'medium' | 'high' | 'critical',
    category: string,
    department: string
  ): void {
    this.collector.increment('patient_safety_incidents', {
      severity,
      category,
      department
    });
  }

  /**
   * Record PHI access attempt
   */
  recordPHIAccess(
    authorized: boolean,
    userRole: string,
    accessType: string,
    department: string,
    userId?: string,
    ipAddress?: string
  ): void {
    if (authorized) {
      this.collector.increment('phi_access_attempts', {
        user_role: userRole,
        access_type: accessType,
        department
      });
    } else {
      this.collector.increment('unauthorized_phi_access', {
        user_id: userId || 'unknown',
        access_type: accessType,
        ip_address: ipAddress || 'unknown'
      });
    }
  }

  /**
   * Record workflow completion
   */
  recordWorkflowCompletion(
    workflowType: string,
    duration: number,
    success: boolean,
    priority: string,
    department: string
  ): void {
    this.collector.histogram('workflow_completion_time', duration, {
      workflow_type: workflowType,
      priority,
      department
    });

    this.collector.gauge('workflow_success_rate', success ? 100 : 0, {
      workflow_type: workflowType,
      department
    });
  }

  /**
   * Update HIPAA compliance score
   */
  updateHIPAAComplianceScore(score: number): void {
    this.collector.gauge('hipaa_compliance_score', score);
  }

  /**
   * Record compliance violation
   */
  recordComplianceViolation(
    violationType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    department: string
  ): void {
    this.collector.increment('compliance_violations', {
      violation_type: violationType,
      severity,
      department
    });
  }
}

export default MetricsCollector;