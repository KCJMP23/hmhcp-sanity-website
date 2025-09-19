// Performance Monitoring Service
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface PerformanceReport {
  period: string;
  startTime: string;
  endTime: string;
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private thresholds: Map<string, { warning: number; critical: number }> = new Map();

  constructor() {
    this.initializeThresholds();
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags: Record<string, string> = {}
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Check for alerts
    this.checkThresholds(name, value);

    // Keep only last 1000 metrics per name
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  /**
   * Record API response time
   */
  recordApiResponseTime(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number
  ): void {
    this.recordMetric('api_response_time', responseTime, 'ms', {
      endpoint,
      method,
      status_code: statusCode.toString()
    });
  }

  /**
   * Record database query time
   */
  recordDatabaseQueryTime(
    query: string,
    table: string,
    queryTime: number,
    rowsAffected: number
  ): void {
    this.recordMetric('database_query_time', queryTime, 'ms', {
      query: query.substring(0, 100), // Truncate long queries
      table,
      rows_affected: rowsAffected.toString()
    });
  }

  /**
   * Record cache hit/miss
   */
  recordCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key: string,
    responseTime: number
  ): void {
    this.recordMetric('cache_operation', responseTime, 'ms', {
      operation,
      key: key.substring(0, 50) // Truncate long keys
    });
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(usage: number, unit: 'MB' | 'GB' = 'MB'): void {
    this.recordMetric('memory_usage', usage, unit, {
      type: 'heap'
    });
  }

  /**
   * Record CPU usage
   */
  recordCpuUsage(usage: number): void {
    this.recordMetric('cpu_usage', usage, 'percent', {
      type: 'process'
    });
  }

  /**
   * Record error rate
   */
  recordErrorRate(service: string, errorRate: number): void {
    this.recordMetric('error_rate', errorRate, 'percent', {
      service
    });
  }

  /**
   * Record throughput
   */
  recordThroughput(service: string, requestsPerSecond: number): void {
    this.recordMetric('throughput', requestsPerSecond, 'rps', {
      service
    });
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-limit);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PerformanceAlert[] {
    return this.alerts;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Generate performance report
   */
  generateReport(
    startTime: string,
    endTime: string,
    period: string = '1h'
  ): PerformanceReport {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const reportMetrics: PerformanceMetric[] = [];
    const reportAlerts: PerformanceAlert[] = [];

    // Filter metrics by time range
    this.metrics.forEach(metrics => {
      const filtered = metrics.filter(metric => {
        const timestamp = new Date(metric.timestamp);
        return timestamp >= start && timestamp <= end;
      });
      reportMetrics.push(...filtered);
    });

    // Filter alerts by time range
    reportAlerts.push(...this.alerts.filter(alert => {
      const timestamp = new Date(alert.timestamp);
      return timestamp >= start && timestamp <= end;
    }));

    // Calculate summary
    const apiMetrics = reportMetrics.filter(m => m.name === 'api_response_time');
    const errorMetrics = reportMetrics.filter(m => m.name === 'error_rate');
    const throughputMetrics = reportMetrics.filter(m => m.name === 'throughput');

    const totalRequests = apiMetrics.length;
    const averageResponseTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0;
    const errorRate = errorMetrics.length > 0 
      ? errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length 
      : 0;
    const throughput = throughputMetrics.length > 0 
      ? throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length 
      : 0;

    return {
      period,
      startTime,
      endTime,
      metrics: reportMetrics,
      alerts: reportAlerts,
      summary: {
        totalRequests,
        averageResponseTime,
        errorRate,
        throughput
      }
    };
  }

  /**
   * Get performance trends
   */
  getTrends(
    metricName: string,
    timeWindow: number = 3600000 // 1 hour in milliseconds
  ): {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  } {
    const metrics = this.getMetrics(metricName, 100);
    const now = Date.now();
    const cutoff = now - timeWindow;

    const recent = metrics.filter(m => new Date(m.timestamp).getTime() > cutoff);
    const previous = metrics.filter(m => {
      const timestamp = new Date(m.timestamp).getTime();
      return timestamp <= cutoff && timestamp > cutoff - timeWindow;
    });

    const current = recent.length > 0 
      ? recent.reduce((sum, m) => sum + m.value, 0) / recent.length 
      : 0;
    const prev = previous.length > 0 
      ? previous.reduce((sum, m) => sum + m.value, 0) / previous.length 
      : 0;

    const change = prev > 0 ? ((current - prev) / prev) * 100 : 0;
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';

    return {
      current,
      previous: prev,
      trend,
      change
    };
  }

  /**
   * Check thresholds and create alerts
   */
  private checkThresholds(metricName: string, value: number): void {
    const threshold = this.thresholds.get(metricName);
    if (!threshold) return;

    let severity: 'low' | 'medium' | 'high' | 'critical' | null = null;
    let message = '';

    if (value >= threshold.critical) {
      severity = 'critical';
      message = `${metricName} is critically high: ${value}`;
    } else if (value >= threshold.warning) {
      severity = 'high';
      message = `${metricName} is high: ${value}`;
    }

    if (severity) {
      const alert: PerformanceAlert = {
        id: this.generateId(),
        metric: metricName,
        threshold: threshold.warning,
        currentValue: value,
        severity,
        message,
        timestamp: new Date().toISOString(),
        resolved: false
      };

      this.alerts.push(alert);
    }
  }

  /**
   * Initialize default thresholds
   */
  private initializeThresholds(): void {
    this.thresholds.set('api_response_time', { warning: 1000, critical: 5000 });
    this.thresholds.set('database_query_time', { warning: 500, critical: 2000 });
    this.thresholds.set('memory_usage', { warning: 80, critical: 95 });
    this.thresholds.set('cpu_usage', { warning: 80, critical: 95 });
    this.thresholds.set('error_rate', { warning: 5, critical: 10 });
    this.thresholds.set('throughput', { warning: 1000, critical: 5000 });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Clean up old data
   */
  cleanup(maxAge: number = 86400000): void { // 24 hours default
    const cutoff = Date.now() - maxAge;

    // Clean up old metrics
    this.metrics.forEach((metrics, name) => {
      const filtered = metrics.filter(m => 
        new Date(m.timestamp).getTime() > cutoff
      );
      this.metrics.set(name, filtered);
    });

    // Clean up old alerts
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoff
    );
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
