/**
 * Monitoring Dashboard
 * Microsoft Copilot-inspired monitoring and observability for AI orchestration
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/security/audit-logging';

// Monitoring types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  condition: AlertCondition;
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  metadata: Record<string, any>;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  duration: number; // seconds
  labels?: Record<string, string>;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  config: WidgetConfig;
  data: any;
  lastUpdated: Date;
  refreshInterval: number;
}

export enum WidgetType {
  METRIC_CARD = 'metric_card',
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  TABLE = 'table',
  HEATMAP = 'heatmap',
  GAUGE = 'gauge',
  ALERT_LIST = 'alert_list',
  AGENT_STATUS = 'agent_status',
  WORKFLOW_STATUS = 'workflow_status',
  PERFORMANCE_OVERVIEW = 'performance_overview',
  COMPLIANCE_STATUS = 'compliance_status'
}

export interface WidgetConfig {
  metrics: string[];
  timeRange: TimeRange;
  aggregation?: AggregationType;
  filters?: Record<string, any>;
  displayOptions?: Record<string, any>;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: '1m' | '5m' | '15m' | '1h' | '1d';
}

export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  PERCENTILE = 'percentile'
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  permissions: DashboardPermissions;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: number;
  autoLayout: boolean;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
}

export interface HealthCheck {
  id: string;
  name: string;
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  error?: string;
  metadata: Record<string, any>;
}

export interface PerformanceReport {
  id: string;
  name: string;
  period: TimeRange;
  metrics: PerformanceMetrics;
  recommendations: Recommendation[];
  generatedAt: Date;
  generatedBy: string;
}

export interface PerformanceMetrics {
  throughput: number;
  latency: number;
  errorRate: number;
  availability: number;
  resourceUtilization: ResourceUtilization;
  complianceScore: number;
  securityScore: number;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  database: number;
  cache: number;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export enum RecommendationType {
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  COST = 'cost',
  RELIABILITY = 'reliability',
  SCALABILITY = 'scalability'
}

export interface MonitoringConfig {
  redis: Redis;
  supabase: any;
  enableRealTimeUpdates: boolean;
  enableAlerting: boolean;
  enablePerformanceMonitoring: boolean;
  enableComplianceMonitoring: boolean;
  enableSecurityMonitoring: boolean;
  metricsRetentionDays: number;
  alertRetentionDays: number;
  dashboardRefreshInterval: number;
  healthCheckInterval: number;
  enableAuditLogging: boolean;
}

/**
 * Monitoring Dashboard for Healthcare AI Orchestration
 */
export class MonitoringDashboard extends EventEmitter {
  private readonly redis: Redis;
  private readonly supabase: any;
  private readonly auditLogger: AuditLogger;
  private readonly config: MonitoringConfig;
  
  private readonly metrics = new Map<string, Metric>();
  private readonly alerts = new Map<string, Alert>();
  private readonly dashboards = new Map<string, Dashboard>();
  private readonly healthChecks = new Map<string, HealthCheck>();
  private readonly recommendations = new Map<string, Recommendation>();
  
  private metricsTimer: NodeJS.Timeout | null = null;
  private alertTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private dashboardTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: MonitoringConfig) {
    super();
    this.redis = config.redis;
    this.supabase = config.supabase;
    this.config = config;
    this.auditLogger = new AuditLogger(this.supabase);

    this.startTimers();
    this.setupEventHandlers();
    this.initializeDefaultDashboards();
  }

  /**
   * Record a metric
   */
  async recordMetric(
    name: string,
    value: number,
    type: MetricType = MetricType.GAUGE,
    labels: Record<string, string> = {},
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const metricId = uuidv4();
    const now = new Date();

    const metric: Metric = {
      id: metricId,
      name,
      type,
      value,
      labels,
      timestamp: now,
      metadata
    };

    try {
      // Store metric
      this.metrics.set(metricId, metric);

      // Store in Redis
      await this.storeMetricInRedis(metric);

      // Store in Supabase
      await this.storeMetricInSupabase(metric);

      // Check for alerts
      await this.checkAlerts(metric);

      // Emit event
      this.emit('metric-recorded', { metricId, name, value, type });

      logger.debug('Metric recorded', { metricId, name, value, type });

      return metricId;
    } catch (error) {
      logger.error('Failed to record metric', { metricId, name, error });
      throw error;
    }
  }

  /**
   * Create an alert
   */
  async createAlert(
    name: string,
    description: string,
    condition: AlertCondition,
    severity: AlertSeverity = AlertSeverity.WARNING,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const alertId = uuidv4();
    const now = new Date();

    const alert: Alert = {
      id: alertId,
      name,
      description,
      severity,
      status: AlertStatus.ACTIVE,
      condition,
      threshold: condition.threshold,
      currentValue: 0,
      triggeredAt: now,
      metadata
    };

    try {
      // Store alert
      this.alerts.set(alertId, alert);

      // Store in Redis
      await this.storeAlertInRedis(alert);

      // Store in Supabase
      await this.storeAlertInSupabase(alert);

      // Emit event
      this.emit('alert-created', { alertId, name, severity });

      logger.info('Alert created', { alertId, name, severity });

      return alertId;
    } catch (error) {
      logger.error('Failed to create alert', { alertId, name, error });
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    comment?: string
  ): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    try {
      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;

      // Update metadata
      if (comment) {
        alert.metadata.comment = comment;
      }

      // Store updated alert
      await this.storeAlertInRedis(alert);
      await this.storeAlertInSupabase(alert);

      // Emit event
      this.emit('alert-acknowledged', { alertId, acknowledgedBy });

      logger.info('Alert acknowledged', { alertId, acknowledgedBy });

      return true;
    } catch (error) {
      logger.error('Failed to acknowledge alert', { alertId, error });
      return false;
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    comment?: string
  ): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    try {
      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;

      // Update metadata
      if (comment) {
        alert.metadata.resolutionComment = comment;
      }

      // Store updated alert
      await this.storeAlertInRedis(alert);
      await this.storeAlertInSupabase(alert);

      // Emit event
      this.emit('alert-resolved', { alertId, resolvedBy });

      logger.info('Alert resolved', { alertId, resolvedBy });

      return true;
    } catch (error) {
      logger.error('Failed to resolve alert', { alertId, error });
      return false;
    }
  }

  /**
   * Create a dashboard
   */
  async createDashboard(
    name: string,
    description: string,
    createdBy: string,
    widgets: DashboardWidget[] = [],
    isPublic: boolean = false,
    tags: string[] = []
  ): Promise<string> {
    const dashboardId = uuidv4();
    const now = new Date();

    const dashboard: Dashboard = {
      id: dashboardId,
      name,
      description,
      widgets,
      layout: {
        columns: 12,
        rows: 8,
        gridSize: 1,
        autoLayout: true
      },
      permissions: {
        view: isPublic ? ['*'] : [createdBy],
        edit: [createdBy],
        admin: [createdBy]
      },
      createdAt: now,
      updatedAt: now,
      createdBy,
      isPublic,
      tags
    };

    try {
      // Store dashboard
      this.dashboards.set(dashboardId, dashboard);

      // Store in Redis
      await this.storeDashboardInRedis(dashboard);

      // Store in Supabase
      await this.storeDashboardInSupabase(dashboard);

      // Emit event
      this.emit('dashboard-created', { dashboardId, name, createdBy });

      logger.info('Dashboard created', { dashboardId, name, createdBy });

      return dashboardId;
    } catch (error) {
      logger.error('Failed to create dashboard', { dashboardId, name, error });
      throw error;
    }
  }

  /**
   * Add widget to dashboard
   */
  async addWidgetToDashboard(
    dashboardId: string,
    widget: Omit<DashboardWidget, 'id' | 'lastUpdated'>
  ): Promise<string> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widgetId = uuidv4();
    const now = new Date();

    const fullWidget: DashboardWidget = {
      ...widget,
      id: widgetId,
      lastUpdated: now
    };

    try {
      // Add widget to dashboard
      dashboard.widgets.push(fullWidget);
      dashboard.updatedAt = now;

      // Store updated dashboard
      await this.storeDashboardInRedis(dashboard);
      await this.storeDashboardInSupabase(dashboard);

      // Emit event
      this.emit('widget-added', { dashboardId, widgetId, type: widget.type });

      logger.info('Widget added to dashboard', { dashboardId, widgetId, type: widget.type });

      return widgetId;
    } catch (error) {
      logger.error('Failed to add widget to dashboard', { dashboardId, widgetId, error });
      throw error;
    }
  }

  /**
   * Update widget data
   */
  async updateWidgetData(
    dashboardId: string,
    widgetId: string,
    data: any
  ): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return false;
    }

    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) {
      return false;
    }

    try {
      // Update widget data
      widget.data = data;
      widget.lastUpdated = new Date();
      dashboard.updatedAt = new Date();

      // Store updated dashboard
      await this.storeDashboardInRedis(dashboard);
      await this.storeDashboardInSupabase(dashboard);

      // Emit event
      this.emit('widget-updated', { dashboardId, widgetId });

      return true;
    } catch (error) {
      logger.error('Failed to update widget data', { dashboardId, widgetId, error });
      return false;
    }
  }

  /**
   * Get dashboard by ID
   */
  getDashboard(dashboardId: string): Dashboard | undefined {
    return this.dashboards.get(dashboardId);
  }

  /**
   * Get dashboards by user
   */
  getDashboardsByUser(userId: string): Dashboard[] {
    return Array.from(this.dashboards.values())
      .filter(dashboard => 
        dashboard.isPublic || 
        dashboard.permissions.view.includes('*') || 
        dashboard.permissions.view.includes(userId)
      );
  }

  /**
   * Get metrics by name and time range
   */
  getMetrics(
    name: string,
    timeRange: TimeRange,
    labels?: Record<string, string>
  ): Metric[] {
    const metrics = Array.from(this.metrics.values())
      .filter(metric => 
        metric.name === name &&
        metric.timestamp >= timeRange.start &&
        metric.timestamp <= timeRange.end
      );

    if (labels) {
      return metrics.filter(metric => 
        Object.entries(labels).every(([key, value]) => 
          metric.labels[key] === value
        )
      );
    }

    return metrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === AlertStatus.ACTIVE);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.severity === severity);
  }

  /**
   * Get health check status
   */
  getHealthCheckStatus(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get system overview
   */
  getSystemOverview(): {
    totalMetrics: number;
    activeAlerts: number;
    totalDashboards: number;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    performanceScore: number;
  } {
    const totalMetrics = this.metrics.size;
    const activeAlerts = this.getActiveAlerts().length;
    const totalDashboards = this.dashboards.size;
    
    const healthChecks = this.getHealthCheckStatus();
    const unhealthyCount = healthChecks.filter(h => h.status === 'unhealthy').length;
    const degradedCount = healthChecks.filter(h => h.status === 'degraded').length;
    
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      healthStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      healthStatus = 'degraded';
    }

    // Calculate performance score (simplified)
    const performanceScore = Math.max(0, 100 - (activeAlerts * 10) - (unhealthyCount * 20));

    return {
      totalMetrics,
      activeAlerts,
      totalDashboards,
      healthStatus,
      uptime: 99.9, // Mock value
      performanceScore
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    name: string,
    period: TimeRange,
    generatedBy: string
  ): Promise<string> {
    const reportId = uuidv4();
    const now = new Date();

    try {
      // Calculate performance metrics
      const metrics = this.calculatePerformanceMetrics(period);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(metrics);

      const report: PerformanceReport = {
        id: reportId,
        name,
        period,
        metrics,
        recommendations,
        generatedAt: now,
        generatedBy
      };

      // Store report
      await this.storeReportInSupabase(report);

      // Emit event
      this.emit('report-generated', { reportId, name, generatedBy });

      logger.info('Performance report generated', { reportId, name, generatedBy });

      return reportId;
    } catch (error) {
      logger.error('Failed to generate performance report', { reportId, name, error });
      throw error;
    }
  }

  // Private helper methods
  private async checkAlerts(metric: Metric): Promise<void> {
    for (const [alertId, alert] of this.alerts) {
      if (alert.status !== AlertStatus.ACTIVE) continue;
      if (alert.condition.metric !== metric.name) continue;

      // Check labels match
      if (alert.condition.labels) {
        const labelsMatch = Object.entries(alert.condition.labels).every(([key, value]) => 
          metric.labels[key] === value
        );
        if (!labelsMatch) continue;
      }

      // Check condition
      const conditionMet = this.evaluateCondition(metric.value, alert.condition);
      if (conditionMet) {
        await this.triggerAlert(alert, metric);
      }
    }
  }

  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'eq': return value === condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'ne': return value !== condition.threshold;
      default: return false;
    }
  }

  private async triggerAlert(alert: Alert, metric: Metric): Promise<void> {
    alert.currentValue = metric.value;
    alert.triggeredAt = new Date();

    // Store updated alert
    await this.storeAlertInRedis(alert);
    await this.storeAlertInSupabase(alert);

    // Emit event
    this.emit('alert-triggered', { alertId: alert.id, metric: metric.name, value: metric.value });

    logger.warn('Alert triggered', {
      alertId: alert.id,
      name: alert.name,
      metric: metric.name,
      value: metric.value,
      threshold: alert.threshold
    });
  }

  private calculatePerformanceMetrics(period: TimeRange): PerformanceMetrics {
    // Calculate performance metrics based on collected data
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.timestamp >= period.start && m.timestamp <= period.end);

    // Calculate throughput (requests per second)
    const throughput = this.calculateThroughput(metrics);

    // Calculate latency (average response time)
    const latency = this.calculateLatency(metrics);

    // Calculate error rate
    const errorRate = this.calculateErrorRate(metrics);

    // Calculate availability
    const availability = this.calculateAvailability(metrics);

    // Calculate resource utilization
    const resourceUtilization = this.calculateResourceUtilization(metrics);

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(metrics);

    // Calculate security score
    const securityScore = this.calculateSecurityScore(metrics);

    return {
      throughput,
      latency,
      errorRate,
      availability,
      resourceUtilization,
      complianceScore,
      securityScore
    };
  }

  private calculateThroughput(metrics: Metric[]): number {
    const requestMetrics = metrics.filter(m => m.name === 'requests_total');
    if (requestMetrics.length === 0) return 0;
    
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    const timeSpan = this.getTimeSpan(metrics);
    return totalRequests / timeSpan;
  }

  private calculateLatency(metrics: Metric[]): number {
    const latencyMetrics = metrics.filter(m => m.name === 'response_time');
    if (latencyMetrics.length === 0) return 0;
    
    const totalLatency = latencyMetrics.reduce((sum, m) => sum + m.value, 0);
    return totalLatency / latencyMetrics.length;
  }

  private calculateErrorRate(metrics: Metric[]): number {
    const errorMetrics = metrics.filter(m => m.name === 'errors_total');
    const requestMetrics = metrics.filter(m => m.name === 'requests_total');
    
    if (requestMetrics.length === 0) return 0;
    
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  private calculateAvailability(metrics: Metric[]): number {
    const uptimeMetrics = metrics.filter(m => m.name === 'uptime');
    if (uptimeMetrics.length === 0) return 100;
    
    const totalUptime = uptimeMetrics.reduce((sum, m) => sum + m.value, 0);
    const timeSpan = this.getTimeSpan(metrics);
    return Math.min(100, (totalUptime / timeSpan) * 100);
  }

  private calculateResourceUtilization(metrics: Metric[]): ResourceUtilization {
    const cpuMetrics = metrics.filter(m => m.name === 'cpu_usage');
    const memoryMetrics = metrics.filter(m => m.name === 'memory_usage');
    const diskMetrics = metrics.filter(m => m.name === 'disk_usage');
    const networkMetrics = metrics.filter(m => m.name === 'network_usage');
    const databaseMetrics = metrics.filter(m => m.name === 'database_usage');
    const cacheMetrics = metrics.filter(m => m.name === 'cache_usage');

    return {
      cpu: this.calculateAverage(cpuMetrics),
      memory: this.calculateAverage(memoryMetrics),
      disk: this.calculateAverage(diskMetrics),
      network: this.calculateAverage(networkMetrics),
      database: this.calculateAverage(databaseMetrics),
      cache: this.calculateAverage(cacheMetrics)
    };
  }

  private calculateComplianceScore(metrics: Metric[]): number {
    const complianceMetrics = metrics.filter(m => m.name === 'compliance_score');
    return this.calculateAverage(complianceMetrics);
  }

  private calculateSecurityScore(metrics: Metric[]): number {
    const securityMetrics = metrics.filter(m => m.name === 'security_score');
    return this.calculateAverage(securityMetrics);
  }

  private calculateAverage(metrics: Metric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  private getTimeSpan(metrics: Metric[]): number {
    if (metrics.length === 0) return 1;
    const timestamps = metrics.map(m => m.timestamp.getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    return (max - min) / 1000; // Convert to seconds
  }

  private async generateRecommendations(metrics: PerformanceMetrics): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Performance recommendations
    if (metrics.latency > 1000) {
      recommendations.push({
        id: uuidv4(),
        type: RecommendationType.PERFORMANCE,
        title: 'High Latency Detected',
        description: 'Response time is above 1000ms. Consider optimizing database queries or adding caching.',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        status: 'pending',
        createdAt: new Date(),
        metadata: { currentLatency: metrics.latency }
      });
    }

    if (metrics.errorRate > 5) {
      recommendations.push({
        id: uuidv4(),
        type: RecommendationType.RELIABILITY,
        title: 'High Error Rate',
        description: 'Error rate is above 5%. Review error logs and implement better error handling.',
        priority: 'critical',
        impact: 'high',
        effort: 'high',
        status: 'pending',
        createdAt: new Date(),
        metadata: { currentErrorRate: metrics.errorRate }
      });
    }

    if (metrics.resourceUtilization.cpu > 80) {
      recommendations.push({
        id: uuidv4(),
        type: RecommendationType.SCALABILITY,
        title: 'High CPU Usage',
        description: 'CPU utilization is above 80%. Consider scaling horizontally or optimizing CPU-intensive operations.',
        priority: 'medium',
        impact: 'medium',
        effort: 'medium',
        status: 'pending',
        createdAt: new Date(),
        metadata: { currentCpuUsage: metrics.resourceUtilization.cpu }
      });
    }

    return recommendations;
  }

  private async initializeDefaultDashboards(): Promise<void> {
    // Create default system dashboard
    await this.createDashboard(
      'System Overview',
      'Default system monitoring dashboard',
      'system',
      [
        {
          id: 'overview',
          type: WidgetType.PERFORMANCE_OVERVIEW,
          title: 'Performance Overview',
          position: { x: 0, y: 0, width: 12, height: 4 },
          config: {
            metrics: ['throughput', 'latency', 'error_rate'],
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(),
              granularity: '1h'
            }
          },
          data: {},
          lastUpdated: new Date(),
          refreshInterval: 30000
        },
        {
          id: 'alerts',
          type: WidgetType.ALERT_LIST,
          title: 'Active Alerts',
          position: { x: 0, y: 4, width: 6, height: 4 },
          config: {
            metrics: [],
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(),
              granularity: '1h'
            }
          },
          data: {},
          lastUpdated: new Date(),
          refreshInterval: 10000
        },
        {
          id: 'agents',
          type: WidgetType.AGENT_STATUS,
          title: 'Agent Status',
          position: { x: 6, y: 4, width: 6, height: 4 },
          config: {
            metrics: [],
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date(),
              granularity: '1h'
            }
          },
          data: {},
          lastUpdated: new Date(),
          refreshInterval: 30000
        }
      ],
      true,
      ['system', 'monitoring']
    );
  }

  private async storeMetricInRedis(metric: Metric): Promise<void> {
    const key = `metric:${metric.id}`;
    const ttl = this.config.metricsRetentionDays * 24 * 60 * 60;
    await this.redis.setex(key, ttl, JSON.stringify(metric));
  }

  private async storeMetricInSupabase(metric: Metric): Promise<void> {
    const { error } = await this.supabase
      .from('metrics')
      .insert([{
        ...metric,
        labels: JSON.stringify(metric.labels),
        metadata: JSON.stringify(metric.metadata),
        timestamp: metric.timestamp.toISOString()
      }]);
    
    if (error) {
      logger.error('Failed to store metric in Supabase', { metricId: metric.id, error });
    }
  }

  private async storeAlertInRedis(alert: Alert): Promise<void> {
    const key = `alert:${alert.id}`;
    const ttl = this.config.alertRetentionDays * 24 * 60 * 60;
    await this.redis.setex(key, ttl, JSON.stringify(alert));
  }

  private async storeAlertInSupabase(alert: Alert): Promise<void> {
    const { error } = await this.supabase
      .from('alerts')
      .upsert([{
        ...alert,
        condition: JSON.stringify(alert.condition),
        triggered_at: alert.triggeredAt.toISOString(),
        acknowledged_at: alert.acknowledgedAt?.toISOString(),
        resolved_at: alert.resolvedAt?.toISOString(),
        metadata: JSON.stringify(alert.metadata)
      }]);
    
    if (error) {
      logger.error('Failed to store alert in Supabase', { alertId: alert.id, error });
    }
  }

  private async storeDashboardInRedis(dashboard: Dashboard): Promise<void> {
    const key = `dashboard:${dashboard.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await this.redis.setex(key, ttl, JSON.stringify(dashboard));
  }

  private async storeDashboardInSupabase(dashboard: Dashboard): Promise<void> {
    const { error } = await this.supabase
      .from('dashboards')
      .upsert([{
        ...dashboard,
        widgets: JSON.stringify(dashboard.widgets),
        layout: JSON.stringify(dashboard.layout),
        permissions: JSON.stringify(dashboard.permissions),
        created_at: dashboard.createdAt.toISOString(),
        updated_at: dashboard.updatedAt.toISOString(),
        tags: JSON.stringify(dashboard.tags)
      }]);
    
    if (error) {
      logger.error('Failed to store dashboard in Supabase', { dashboardId: dashboard.id, error });
    }
  }

  private async storeReportInSupabase(report: PerformanceReport): Promise<void> {
    const { error } = await this.supabase
      .from('performance_reports')
      .insert([{
        ...report,
        period: JSON.stringify(report.period),
        metrics: JSON.stringify(report.metrics),
        recommendations: JSON.stringify(report.recommendations),
        generated_at: report.generatedAt.toISOString()
      }]);
    
    if (error) {
      logger.error('Failed to store report in Supabase', { reportId: report.id, error });
    }
  }

  private startTimers(): void {
    // Metrics collection timer
    this.metricsTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Alert checking timer
    this.alertTimer = setInterval(() => {
      this.checkAllAlerts();
    }, 10000);

    // Health check timer
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    // Dashboard refresh timer
    this.dashboardTimer = setInterval(() => {
      this.refreshDashboards();
    }, this.config.dashboardRefreshInterval);

    // Cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // 1 hour
  }

  private collectSystemMetrics(): void {
    // Collect system metrics
    this.recordMetric('system_uptime', process.uptime(), MetricType.GAUGE);
    this.recordMetric('memory_usage', process.memoryUsage().heapUsed, MetricType.GAUGE);
    this.recordMetric('cpu_usage', process.cpuUsage().user, MetricType.GAUGE);
  }

  private checkAllAlerts(): void {
    // Check all active alerts against current metrics
    for (const [alertId, alert] of this.alerts) {
      if (alert.status === AlertStatus.ACTIVE) {
        // This would typically check against real-time metrics
        // For now, we'll just log that we're checking
        logger.debug('Checking alert', { alertId, name: alert.name });
      }
    }
  }

  private performHealthChecks(): void {
    // Perform health checks on system components
    const components = ['redis', 'supabase', 'orchestrator', 'agents'];
    
    for (const component of components) {
      this.performHealthCheck(component);
    }
  }

  private async performHealthCheck(component: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Perform actual health check based on component
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let responseTime = 0;
      let error: string | undefined;

      switch (component) {
        case 'redis':
          await this.redis.ping();
          responseTime = Date.now() - startTime;
          break;
        case 'supabase':
          // Check Supabase connection
          responseTime = Date.now() - startTime;
          break;
        default:
          responseTime = Date.now() - startTime;
      }

      if (responseTime > 5000) {
        status = 'degraded';
      } else if (responseTime > 10000) {
        status = 'unhealthy';
        error = 'Response time too high';
      }

      const healthCheck: HealthCheck = {
        id: uuidv4(),
        name: `${component}_health`,
        component,
        status,
        lastCheck: new Date(),
        responseTime,
        error,
        metadata: {}
      };

      this.healthChecks.set(component, healthCheck);

    } catch (error) {
      const healthCheck: HealthCheck = {
        id: uuidv4(),
        name: `${component}_health`,
        component,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };

      this.healthChecks.set(component, healthCheck);
    }
  }

  private refreshDashboards(): void {
    // Refresh dashboard data
    for (const [dashboardId, dashboard] of this.dashboards) {
      this.refreshDashboard(dashboardId, dashboard);
    }
  }

  private async refreshDashboard(dashboardId: string, dashboard: Dashboard): Promise<void> {
    // Refresh each widget in the dashboard
    for (const widget of dashboard.widgets) {
      try {
        const data = await this.getWidgetData(widget);
        await this.updateWidgetData(dashboardId, widget.id, data);
      } catch (error) {
        logger.error('Failed to refresh widget', { dashboardId, widgetId: widget.id, error });
      }
    }
  }

  private async getWidgetData(widget: DashboardWidget): Promise<any> {
    // Get data for widget based on type
    switch (widget.type) {
      case WidgetType.METRIC_CARD:
        return this.getMetricCardData(widget);
      case WidgetType.LINE_CHART:
        return this.getLineChartData(widget);
      case WidgetType.BAR_CHART:
        return this.getBarChartData(widget);
      case WidgetType.ALERT_LIST:
        return this.getAlertListData(widget);
      default:
        return {};
    }
  }

  private getMetricCardData(widget: DashboardWidget): any {
    // Return metric card data
    return {
      value: 0,
      trend: 'up',
      change: 0
    };
  }

  private getLineChartData(widget: DashboardWidget): any {
    // Return line chart data
    return {
      series: [],
      labels: []
    };
  }

  private getBarChartData(widget: DashboardWidget): any {
    // Return bar chart data
    return {
      series: [],
      labels: []
    };
  }

  private getAlertListData(widget: DashboardWidget): any {
    // Return alert list data
    return {
      alerts: this.getActiveAlerts()
    };
  }

  private cleanupOldData(): void {
    const now = Date.now();
    const maxAge = this.config.metricsRetentionDays * 24 * 60 * 60 * 1000;

    // Clean up old metrics
    const oldMetrics: string[] = [];
    for (const [metricId, metric] of this.metrics) {
      if (now - metric.timestamp.getTime() > maxAge) {
        oldMetrics.push(metricId);
      }
    }

    for (const metricId of oldMetrics) {
      this.metrics.delete(metricId);
    }

    if (oldMetrics.length > 0) {
      logger.info('Cleaned up old metrics', { count: oldMetrics.length });
    }
  }

  private setupEventHandlers(): void {
    this.on('metric-recorded', (data) => {
      logger.debug('Metric recorded event', data);
    });
    
    this.on('alert-triggered', (data) => {
      logger.warn('Alert triggered event', data);
    });
    
    this.on('dashboard-created', (data) => {
      logger.debug('Dashboard created event', data);
    });
  }

  /**
   * Shutdown the monitoring dashboard
   */
  async shutdown(): Promise<void> {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
    
    if (this.alertTimer) {
      clearInterval(this.alertTimer);
      this.alertTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    if (this.dashboardTimer) {
      clearInterval(this.dashboardTimer);
      this.dashboardTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.removeAllListeners();
    logger.info('Monitoring Dashboard shutdown complete');
  }
}

export default MonitoringDashboard;
