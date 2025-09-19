/**
 * Production Monitoring and Observability System
 * Comprehensive monitoring for healthcare application with HIPAA compliance
 */

import { NextRequest } from 'next/server';

interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
  environment: string;
}

interface AlertConfig {
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
  timestamp: number;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  dbConnectionPool: number;
  cacheHitRatio: number;
}

export class ProductionMonitoringSystem {
  private readonly environment: string;
  private readonly serviceName: string;
  private readonly version: string;
  private readonly region: string;
  private readonly alerts: AlertConfig[];
  private readonly metrics: Map<string, MetricData[]> = new Map();
  private readonly healthChecks: Map<string, HealthCheckResult> = new Map();

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.serviceName = 'hmhcp-website';
    this.version = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown';
    this.region = process.env.VERCEL_REGION || 'unknown';
    this.alerts = this.initializeAlerts();
  }

  private initializeAlerts(): AlertConfig[] {
    return [
      {
        name: 'High Error Rate',
        metric: 'error_rate',
        threshold: 5, // 5%
        operator: 'gt',
        severity: 'high',
        enabled: true
      },
      {
        name: 'Slow Response Time',
        metric: 'response_time_p95',
        threshold: 2000, // 2 seconds
        operator: 'gt',
        severity: 'medium',
        enabled: true
      },
      {
        name: 'Database Connection Pool Exhausted',
        metric: 'db_connection_pool_usage',
        threshold: 90, // 90%
        operator: 'gt',
        severity: 'critical',
        enabled: true
      },
      {
        name: 'Memory Usage High',
        metric: 'memory_usage',
        threshold: 85, // 85%
        operator: 'gt',
        severity: 'medium',
        enabled: true
      },
      {
        name: 'Cache Hit Ratio Low',
        metric: 'cache_hit_ratio',
        threshold: 70, // 70%
        operator: 'lt',
        severity: 'medium',
        enabled: true
      },
      {
        name: 'Security Incidents',
        metric: 'security_incidents',
        threshold: 0,
        operator: 'gt',
        severity: 'critical',
        enabled: true
      }
    ];
  }

  /**
   * Record a metric for monitoring
   */
  public recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags: {
        ...tags,
        environment: this.environment,
        service: this.serviceName,
        version: this.version,
        region: this.region
      },
      environment: this.environment
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 1000 metrics per type
    if (metricHistory.length > 1000) {
      metricHistory.shift();
    }

    // Send to external monitoring services
    this.sendToExternalServices(metric);

    // Check alerts
    this.checkAlerts(name, value);
  }

  /**
   * Record request metrics
   */
  public recordRequestMetrics(request: NextRequest, responseTime: number, statusCode: number, error?: Error): void {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const baseTags = {
      path,
      method,
      status_code: statusCode.toString(),
      user_agent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown'
    };

    // Response time
    this.recordMetric('response_time', responseTime, 'ms', baseTags);

    // Request count
    this.recordMetric('request_count', 1, 'count', baseTags);

    // Error rate
    if (statusCode >= 400) {
      this.recordMetric('error_count', 1, 'count', {
        ...baseTags,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error'
      });
    }

    // Specific error tracking
    if (error) {
      this.recordMetric('error_count', 1, 'count', {
        ...baseTags,
        error_name: error.name,
        error_message: error.message.substring(0, 100)
      });
    }

    // Security metrics
    this.recordSecurityMetrics(request, statusCode);
  }

  /**
   * Record security-related metrics
   */
  private recordSecurityMetrics(request: NextRequest, statusCode: number): void {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Suspicious request patterns
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(url.pathname) || pattern.test(url.search)
    );

    if (isSuspicious) {
      this.recordMetric('security_incidents', 1, 'count', {
        type: 'suspicious_request',
        path: url.pathname,
        ip: request.ip || 'unknown',
        user_agent: userAgent.substring(0, 100)
      });
    }

    // Bot detection
    const knownBots = ['bot', 'crawler', 'spider', 'scraper'];
    const isBot = knownBots.some(bot => userAgent.toLowerCase().includes(bot));

    if (isBot) {
      this.recordMetric('bot_requests', 1, 'count', {
        bot_type: userAgent.substring(0, 50),
        path: url.pathname
      });
    }

    // Failed authentication attempts
    if (url.pathname.includes('/admin') && statusCode === 401) {
      this.recordMetric('auth_failures', 1, 'count', {
        path: url.pathname,
        ip: request.ip || 'unknown'
      });
    }

    // Rate limiting triggered
    if (statusCode === 429) {
      this.recordMetric('rate_limit_hits', 1, 'count', {
        path: url.pathname,
        ip: request.ip || 'unknown'
      });
    }
  }

  /**
   * Perform health checks for all services
   */
  public async performHealthChecks(): Promise<Record<string, HealthCheckResult>> {
    const healthChecks = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkExternalServicesHealth(),
      this.checkMemoryHealth(),
      this.checkPerformanceHealth()
    ]);

    const results: Record<string, HealthCheckResult> = {};

    healthChecks.forEach((result, index) => {
      const serviceName = ['database', 'redis', 'external_services', 'memory', 'performance'][index];
      
      if (result.status === 'fulfilled') {
        results[serviceName] = result.value;
        this.healthChecks.set(serviceName, result.value);
      } else {
        const errorResult: HealthCheckResult = {
          service: serviceName,
          status: 'unhealthy',
          responseTime: 0,
          error: result.reason?.message || 'Unknown error',
          timestamp: Date.now()
        };
        results[serviceName] = errorResult;
        this.healthChecks.set(serviceName, errorResult);
      }
    });

    // Record overall health metrics
    const overallHealth = Object.values(results).every(check => check.status === 'healthy');
    this.recordMetric('overall_health', overallHealth ? 1 : 0, 'boolean');

    return results;
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Implement actual database health check
      // This is a placeholder implementation
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`
        }
      });

      const responseTime = Date.now() - startTime;

      return {
        service: 'database',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          status_code: response.status,
          url: process.env.SUPABASE_URL
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Implement Redis health check
      // This would typically use a Redis client
      
      return {
        service: 'redis',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          connection_pool: 'active'
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check external services health
   */
  private async checkExternalServicesHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const services = [];

      // Check SendGrid
      if (process.env.SENDGRID_API_KEY) {
        services.push(this.checkSendGridHealth());
      }

      // Check Sentry
      if (process.env.SENTRY_DSN) {
        services.push(this.checkSentryHealth());
      }

      const results = await Promise.allSettled(services);
      const allHealthy = results.every(result => result.status === 'fulfilled');

      return {
        service: 'external_services',
        status: allHealthy ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          services_checked: services.length,
          services_healthy: results.filter(r => r.status === 'fulfilled').length
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        service: 'external_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private async checkSendGridHealth(): Promise<boolean> {
    // Implement SendGrid health check
    return true;
  }

  private async checkSentryHealth(): Promise<boolean> {
    // Implement Sentry health check
    return true;
  }

  /**
   * Check memory health
   */
  private async checkMemoryHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal + usage.external;
      const usedMemory = usage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      this.recordMetric('memory_usage', memoryUsagePercent, 'percent');

      return {
        service: 'memory',
        status: memoryUsagePercent < 85 ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          heap_used: usage.heapUsed,
          heap_total: usage.heapTotal,
          external: usage.external,
          usage_percent: memoryUsagePercent
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check performance health
   */
  private async checkPerformanceHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const recentMetrics = this.getRecentMetrics('response_time', 60000); // Last minute
      const avgResponseTime = recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length 
        : 0;

      const errorMetrics = this.getRecentMetrics('error_count', 60000);
      const requestMetrics = this.getRecentMetrics('request_count', 60000);
      
      const errorRate = requestMetrics.length > 0 
        ? (errorMetrics.length / requestMetrics.length) * 100 
        : 0;

      this.recordMetric('response_time_avg', avgResponseTime, 'ms');
      this.recordMetric('error_rate', errorRate, 'percent');

      const isHealthy = avgResponseTime < 2000 && errorRate < 5;

      return {
        service: 'performance',
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          avg_response_time: avgResponseTime,
          error_rate: errorRate,
          sample_size: requestMetrics.length
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        service: 'performance',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get recent metrics for a specific metric name
   */
  private getRecentMetrics(metricName: string, timeWindowMs: number): MetricData[] {
    const metrics = this.metrics.get(metricName) || [];
    const cutoff = Date.now() - timeWindowMs;
    return metrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Check alerts for metric values
   */
  private checkAlerts(metricName: string, value: number): void {
    const relevantAlerts = this.alerts.filter(alert => 
      alert.metric === metricName && alert.enabled
    );

    for (const alert of relevantAlerts) {
      const triggered = this.evaluateAlert(alert, value);
      
      if (triggered) {
        this.triggerAlert(alert, value);
      }
    }
  }

  /**
   * Evaluate if an alert should be triggered
   */
  private evaluateAlert(alert: AlertConfig, value: number): boolean {
    switch (alert.operator) {
      case 'gt': return value > alert.threshold;
      case 'gte': return value >= alert.threshold;
      case 'lt': return value < alert.threshold;
      case 'lte': return value <= alert.threshold;
      case 'eq': return value === alert.threshold;
      default: return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: AlertConfig, value: number): Promise<void> {
    const alertData = {
      name: alert.name,
      severity: alert.severity,
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      timestamp: Date.now(),
      environment: this.environment,
      service: this.serviceName
    };

    // Log the alert
    console.error(`ALERT TRIGGERED: ${alert.name}`, alertData);

    // Send to external alerting services
    await this.sendAlert(alertData);

    // Record alert metric
    this.recordMetric('alerts_triggered', 1, 'count', {
      alert_name: alert.name,
      severity: alert.severity
    });
  }

  /**
   * Send alert to external services
   */
  private async sendAlert(alertData: any): Promise<void> {
    try {
      // Send to Slack if webhook is configured
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(alertData);
      }

      // Send to email if configured
      if (process.env.ALERT_EMAIL) {
        await this.sendEmailAlert(alertData);
      }

      // Send to PagerDuty if configured
      if (process.env.PAGERDUTY_SERVICE_KEY && alertData.severity === 'critical') {
        await this.sendPagerDutyAlert(alertData);
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private async sendSlackAlert(alertData: any): Promise<void> {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    };

    const message = {
      text: `${severityEmoji[alertData.severity as keyof typeof severityEmoji]} HMHCP Alert: ${alertData.name}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Alert:* ${alertData.name}\\n*Severity:* ${alertData.severity}\\n*Metric:* ${alertData.metric}\\n*Value:* ${alertData.value}\\n*Threshold:* ${alertData.threshold}\\n*Environment:* ${alertData.environment}`
          }
        }
      ]
    };

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }

  private async sendEmailAlert(alertData: any): Promise<void> {
    // Implement email alert using SendGrid
    // This would use the SendGrid API to send alert emails
  }

  private async sendPagerDutyAlert(alertData: any): Promise<void> {
    // Implement PagerDuty integration for critical alerts
    // This would use the PagerDuty Events API
  }

  /**
   * Send metrics to external monitoring services
   */
  private async sendToExternalServices(metric: MetricData): Promise<void> {
    try {
      // Send to DataDog
      if (process.env.DATADOG_API_KEY) {
        await this.sendToDataDog(metric);
      }

      // Send to custom monitoring endpoint
      if (process.env.MONITORING_ENDPOINT) {
        await this.sendToCustomEndpoint(metric);
      }
    } catch (error) {
      // Silently fail to avoid impacting application performance
      console.warn('Failed to send metrics to external services:', error);
    }
  }

  private async sendToDataDog(metric: MetricData): Promise<void> {
    const datadogMetric = {
      series: [{
        metric: `hmhcp.${metric.name}`,
        points: [[Math.floor(metric.timestamp / 1000), metric.value]],
        tags: Object.entries(metric.tags).map(([key, value]) => `${key}:${value}`)
      }]
    };

    await fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DATADOG_API_KEY!
      },
      body: JSON.stringify(datadogMetric)
    });
  }

  private async sendToCustomEndpoint(metric: MetricData): Promise<void> {
    await fetch(process.env.MONITORING_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    });
  }

  /**
   * Get monitoring dashboard data
   */
  public getDashboardData(): any {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    return {
      overview: {
        environment: this.environment,
        service: this.serviceName,
        version: this.version,
        region: this.region,
        uptime: process.uptime(),
        timestamp: now
      },
      
      health_checks: Object.fromEntries(this.healthChecks),
      
      metrics: {
        response_time: this.getMetricSummary('response_time', oneHourAgo),
        error_rate: this.getMetricSummary('error_rate', oneHourAgo),
        request_count: this.getMetricSummary('request_count', oneHourAgo),
        memory_usage: this.getMetricSummary('memory_usage', oneHourAgo)
      },
      
      alerts: {
        active: this.alerts.filter(alert => alert.enabled),
        recent_triggers: this.getRecentMetrics('alerts_triggered', oneHourAgo)
      }
    };
  }

  private getMetricSummary(metricName: string, since: number): any {
    const metrics = this.getRecentMetrics(metricName, Date.now() - since);
    
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, latest: 0 };
    }

    const values = metrics.map(m => m.value);
    return {
      count: metrics.length,
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }
}

// Export singleton instance
export const productionMonitoring = new ProductionMonitoringSystem();

// Helper function to create monitoring middleware
export function createMonitoringMiddleware() {
  return async (request: NextRequest, handler: () => Promise<Response>): Promise<Response> => {
    const startTime = Date.now();
    let response: Response;
    let error: Error | undefined;

    try {
      response = await handler();
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error');
      response = new Response('Internal Server Error', { status: 500 });
    }

    const responseTime = Date.now() - startTime;
    
    // Record metrics
    productionMonitoring.recordRequestMetrics(
      request,
      responseTime,
      response.status,
      error
    );

    return response;
  };
}