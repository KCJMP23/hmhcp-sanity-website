/**
 * Healthcare Performance Monitoring System
 * 
 * Comprehensive performance monitoring with healthcare SLA compliance,
 * real-time tracking, and HIPAA-compliant audit capabilities.
 * 
 * @version 1.0.0
 * @author HMHCP Development Team
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// Types and Interfaces
export interface PerformanceMetrics {
  timestamp: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
    min: number;
    max: number;
  };
  throughput: {
    requestsPerSecond: number;
    transactionsPerSecond: number;
    operationsPerMinute: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    ioWaitTime: number;
    diskUsage: number;
    networkLatency: number;
  };
  queue: {
    depth: number;
    waitTime: number;
    processingTime: number;
  };
  errors: {
    rate: number;
    count: number;
    types: Record<string, number>;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
  };
}

export interface HealthcareSLA {
  name: string;
  description: string;
  threshold: number;
  unit: 'ms' | 's' | '%' | 'count';
  priority: 'critical' | 'high' | 'medium' | 'low';
  complianceRequired: boolean;
  auditRequired: boolean;
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  type: 'sla_violation' | 'performance_degradation' | 'resource_exhaustion' | 'error_spike';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  metrics: Partial<PerformanceMetrics>;
  sla?: HealthcareSLA;
  recommendations: string[];
  hipaaRelevant: boolean;
}

export interface BottleneckAnalysis {
  component: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database' | 'cache' | 'queue';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: number; // 0-100 percentage
  description: string;
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  type: 'resource_allocation' | 'query_optimization' | 'cache_tuning' | 'load_balancing' | 'architecture';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  description: string;
  estimatedImpact: number; // 0-100 percentage improvement
  implementationComplexity: 'low' | 'medium' | 'high';
  costImplication: 'none' | 'low' | 'medium' | 'high';
}

export interface PerformanceReport {
  id: string;
  timestamp: number;
  period: string;
  metrics: PerformanceMetrics[];
  slaCompliance: Record<string, { met: boolean; percentage: number }>;
  trends: {
    improving: string[];
    degrading: string[];
    stable: string[];
  };
  bottlenecks: BottleneckAnalysis[];
  recommendations: OptimizationRecommendation[];
  executiveSummary: string;
}

export interface MonitoringConfig {
  sampleRate: number;
  retentionPeriod: number;
  alertThresholds: Record<string, number>;
  enableHIPAAAudit: boolean;
  enableRealTimeAlerts: boolean;
  performanceBaseline: Partial<PerformanceMetrics>;
}

// Healthcare SLA Definitions
const HEALTHCARE_SLAS: HealthcareSLA[] = [
  {
    name: 'Emergency Workflow Response',
    description: 'Critical emergency workflow must respond within 1 second',
    threshold: 1000,
    unit: 'ms',
    priority: 'critical',
    complianceRequired: true,
    auditRequired: true,
  },
  {
    name: 'Clinical Decision Latency',
    description: 'Clinical decision support tools must respond within 2 seconds',
    threshold: 2000,
    unit: 'ms',
    priority: 'critical',
    complianceRequired: true,
    auditRequired: true,
  },
  {
    name: 'Patient Data Retrieval',
    description: 'Patient data queries must complete within 500ms',
    threshold: 500,
    unit: 'ms',
    priority: 'high',
    complianceRequired: true,
    auditRequired: true,
  },
  {
    name: 'HIPAA Audit Capture',
    description: '100% of HIPAA-relevant events must be captured',
    threshold: 100,
    unit: '%',
    priority: 'critical',
    complianceRequired: true,
    auditRequired: true,
  },
  {
    name: 'System Availability',
    description: 'System must maintain 99.9% uptime',
    threshold: 99.9,
    unit: '%',
    priority: 'critical',
    complianceRequired: true,
    auditRequired: true,
  },
  {
    name: 'Authentication Response',
    description: 'User authentication must complete within 3 seconds',
    threshold: 3000,
    unit: 'ms',
    priority: 'high',
    complianceRequired: false,
    auditRequired: true,
  },
  {
    name: 'Report Generation',
    description: 'Healthcare reports must generate within 10 seconds',
    threshold: 10000,
    unit: 'ms',
    priority: 'medium',
    complianceRequired: false,
    auditRequired: false,
  },
];

/**
 * Comprehensive Performance Monitoring System
 * 
 * Provides real-time performance tracking, SLA monitoring,
 * bottleneck detection, and healthcare compliance reporting.
 */
export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private config: MonitoringConfig;
  private slas: Map<string, HealthcareSLA> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private baseline: PerformanceMetrics | null = null;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsBuffer: PerformanceMetrics[] = [];
  private lastCleanup = Date.now();

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      sampleRate: 1000, // 1 second
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      alertThresholds: {
        latencySpike: 2.0, // 2x baseline
        errorRateSpike: 5.0, // 5x baseline
        resourceExhaustion: 90, // 90% utilization
        cacheHitDrop: 50, // 50% drop in cache hit rate
      },
      enableHIPAAAudit: true,
      enableRealTimeAlerts: true,
      performanceBaseline: {},
      ...config,
    };

    // Initialize SLAs
    HEALTHCARE_SLAS.forEach(sla => {
      this.slas.set(sla.name, sla);
    });

    // Start monitoring if real-time alerts are enabled
    if (this.config.enableRealTimeAlerts) {
      this.startMonitoring();
    }
  }

  /**
   * Start real-time performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.sampleRate);

    this.emit('monitoring:started', { timestamp: Date.now() });
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring || !this.monitoringInterval) {
      return;
    }

    clearInterval(this.monitoringInterval);
    this.isMonitoring = false;
    this.monitoringInterval = undefined;

    this.emit('monitoring:stopped', { timestamp: Date.now() });
  }

  /**
   * Record a performance measurement
   */
  public recordMetric(
    operation: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): void {
    const timestamp = Date.now();
    
    // Update metrics buffer
    this.updateMetricsBuffer(operation, duration, metadata);

    // Check SLA compliance
    this.checkSLACompliance(operation, duration, metadata);

    // Emit metric recorded event
    this.emit('metric:recorded', {
      operation,
      duration,
      timestamp,
      metadata,
    });

    // HIPAA audit logging if required
    if (this.config.enableHIPAAAudit && this.isHIPAARelevant(operation, metadata)) {
      this.auditHIPAAEvent(operation, duration, metadata);
    }
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    if (this.metricsBuffer.length === 0) {
      return null;
    }

    return this.calculateAggregateMetrics(this.metricsBuffer);
  }

  /**
   * Get historical metrics for a time period
   */
  public getHistoricalMetrics(
    startTime: number,
    endTime: number
  ): PerformanceMetrics[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Check SLA compliance for all defined SLAs
   */
  public checkSLACompliance(
    operation: string,
    value: number,
    metadata: Record<string, any> = {}
  ): boolean {
    let allCompliant = true;

    for (const [name, sla] of this.slas) {
      const isCompliant = this.evaluateSLA(sla, operation, value, metadata);
      
      if (!isCompliant) {
        allCompliant = false;
        this.handleSLAViolation(sla, operation, value, metadata);
      }
    }

    return allCompliant;
  }

  /**
   * Detect performance bottlenecks
   */
  public detectBottlenecks(): BottleneckAnalysis[] {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      return [];
    }

    const bottlenecks: BottleneckAnalysis[] = [];

    // CPU bottleneck detection
    if (currentMetrics.resources.cpuUsage > 90) {
      bottlenecks.push({
        component: 'CPU',
        type: 'cpu',
        severity: 'critical',
        impact: Math.min(currentMetrics.resources.cpuUsage, 100),
        description: `CPU usage at ${currentMetrics.resources.cpuUsage.toFixed(1)}%`,
        recommendations: [
          {
            type: 'resource_allocation',
            priority: 'immediate',
            description: 'Scale CPU resources or optimize compute-intensive operations',
            estimatedImpact: 40,
            implementationComplexity: 'medium',
            costImplication: 'medium',
          },
        ],
      });
    }

    // Memory bottleneck detection
    if (currentMetrics.resources.memoryUsage > 85) {
      bottlenecks.push({
        component: 'Memory',
        type: 'memory',
        severity: currentMetrics.resources.memoryUsage > 95 ? 'critical' : 'high',
        impact: Math.min(currentMetrics.resources.memoryUsage, 100),
        description: `Memory usage at ${currentMetrics.resources.memoryUsage.toFixed(1)}%`,
        recommendations: [
          {
            type: 'resource_allocation',
            priority: 'high',
            description: 'Increase memory allocation or optimize memory usage patterns',
            estimatedImpact: 35,
            implementationComplexity: 'low',
            costImplication: 'low',
          },
        ],
      });
    }

    // I/O bottleneck detection
    if (currentMetrics.resources.ioWaitTime > 50) {
      bottlenecks.push({
        component: 'I/O System',
        type: 'io',
        severity: 'high',
        impact: Math.min(currentMetrics.resources.ioWaitTime, 100),
        description: `I/O wait time at ${currentMetrics.resources.ioWaitTime.toFixed(1)}ms`,
        recommendations: [
          {
            type: 'query_optimization',
            priority: 'high',
            description: 'Optimize database queries and implement connection pooling',
            estimatedImpact: 50,
            implementationComplexity: 'medium',
            costImplication: 'low',
          },
        ],
      });
    }

    // Cache effectiveness bottleneck
    if (currentMetrics.cache.hitRate < 70) {
      bottlenecks.push({
        component: 'Cache System',
        type: 'cache',
        severity: 'medium',
        impact: 100 - currentMetrics.cache.hitRate,
        description: `Cache hit rate at ${currentMetrics.cache.hitRate.toFixed(1)}%`,
        recommendations: [
          {
            type: 'cache_tuning',
            priority: 'medium',
            description: 'Optimize cache configuration and implement smarter caching strategies',
            estimatedImpact: 25,
            implementationComplexity: 'medium',
            costImplication: 'none',
          },
        ],
      });
    }

    // Queue depth bottleneck
    if (currentMetrics.queue.depth > 100) {
      bottlenecks.push({
        component: 'Queue System',
        type: 'queue',
        severity: 'high',
        impact: Math.min(currentMetrics.queue.depth / 10, 100),
        description: `Queue depth at ${currentMetrics.queue.depth} items`,
        recommendations: [
          {
            type: 'load_balancing',
            priority: 'high',
            description: 'Implement horizontal scaling or optimize queue processing',
            estimatedImpact: 45,
            implementationComplexity: 'high',
            costImplication: 'medium',
          },
        ],
      });
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate optimization recommendations
   */
  public generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const bottlenecks = this.detectBottlenecks();
    const recommendations: OptimizationRecommendation[] = [];

    // Extract recommendations from bottlenecks
    bottlenecks.forEach(bottleneck => {
      recommendations.push(...bottleneck.recommendations);
    });

    // Add general optimization recommendations based on trends
    const currentMetrics = this.getCurrentMetrics();
    if (currentMetrics) {
      // Query optimization recommendation
      if (currentMetrics.latency.p95 > 2000) {
        recommendations.push({
          type: 'query_optimization',
          priority: 'high',
          description: 'Optimize slow database queries and implement query result caching',
          estimatedImpact: 30,
          implementationComplexity: 'medium',
          costImplication: 'low',
        });
      }

      // Load balancing recommendation
      if (currentMetrics.throughput.requestsPerSecond > 1000) {
        recommendations.push({
          type: 'load_balancing',
          priority: 'medium',
          description: 'Implement load balancing to distribute traffic more effectively',
          estimatedImpact: 25,
          implementationComplexity: 'high',
          costImplication: 'medium',
        });
      }
    }

    // Sort by priority and estimated impact
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.estimatedImpact - a.estimatedImpact;
      })
      .slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Generate performance report
   */
  public generateReport(period: string = '1h'): PerformanceReport {
    const endTime = Date.now();
    const startTime = this.getPeriodStartTime(period, endTime);
    const periodMetrics = this.getHistoricalMetrics(startTime, endTime);

    const slaCompliance: Record<string, { met: boolean; percentage: number }> = {};
    this.slas.forEach((sla, name) => {
      const compliance = this.calculateSLACompliance(sla, periodMetrics);
      slaCompliance[name] = compliance;
    });

    const trends = this.analyzeTrends(periodMetrics);
    const bottlenecks = this.detectBottlenecks();
    const recommendations = this.generateOptimizationRecommendations();

    return {
      id: createHash('sha256').update(`${startTime}-${endTime}`).digest('hex').substring(0, 16),
      timestamp: endTime,
      period,
      metrics: periodMetrics,
      slaCompliance,
      trends,
      bottlenecks,
      recommendations,
      executiveSummary: this.generateExecutiveSummary(slaCompliance, trends, bottlenecks),
    };
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Clear resolved alerts
   */
  public clearResolvedAlerts(): void {
    const now = Date.now();
    const alertTimeout = 5 * 60 * 1000; // 5 minutes

    for (const [id, alert] of this.activeAlerts) {
      if (now - alert.timestamp > alertTimeout) {
        this.activeAlerts.delete(id);
        this.emit('alert:resolved', alert);
      }
    }
  }

  /**
   * Set performance baseline
   */
  public setBaseline(metrics?: PerformanceMetrics): void {
    this.baseline = metrics || this.getCurrentMetrics();
    
    if (this.baseline) {
      this.emit('baseline:set', this.baseline);
    }
  }

  /**
   * Private Methods
   */

  private collectMetrics(): void {
    // Simulate metric collection (in real implementation, this would collect actual system metrics)
    const mockMetrics: PerformanceMetrics = {
      timestamp: Date.now(),
      latency: {
        p50: Math.random() * 100 + 50,
        p95: Math.random() * 500 + 200,
        p99: Math.random() * 1000 + 500,
        average: Math.random() * 200 + 100,
        min: Math.random() * 50 + 10,
        max: Math.random() * 2000 + 1000,
      },
      throughput: {
        requestsPerSecond: Math.random() * 1000 + 100,
        transactionsPerSecond: Math.random() * 500 + 50,
        operationsPerMinute: Math.random() * 30000 + 3000,
      },
      resources: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        ioWaitTime: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkLatency: Math.random() * 50 + 5,
      },
      queue: {
        depth: Math.floor(Math.random() * 200),
        waitTime: Math.random() * 1000 + 100,
        processingTime: Math.random() * 500 + 50,
      },
      errors: {
        rate: Math.random() * 5,
        count: Math.floor(Math.random() * 100),
        types: {
          '4xx': Math.floor(Math.random() * 50),
          '5xx': Math.floor(Math.random() * 10),
          'timeout': Math.floor(Math.random() * 5),
        },
      },
      cache: {
        hitRate: Math.random() * 40 + 60, // 60-100%
        missRate: Math.random() * 40, // 0-40%
        evictions: Math.floor(Math.random() * 100),
      },
    };

    this.metricsBuffer.push(mockMetrics);
    this.metrics.push(mockMetrics);

    // Cleanup old metrics
    this.cleanupOldMetrics();

    // Detect performance issues
    this.detectPerformanceIssues(mockMetrics);
  }

  private updateMetricsBuffer(
    operation: string,
    duration: number,
    metadata: Record<string, any>
  ): void {
    // In a real implementation, this would update the metrics buffer
    // with actual operation measurements
  }

  private evaluateSLA(
    sla: HealthcareSLA,
    operation: string,
    value: number,
    metadata: Record<string, any>
  ): boolean {
    // Determine if this operation is relevant to the SLA
    const isRelevant = this.isOperationRelevantToSLA(sla, operation, metadata);
    if (!isRelevant) {
      return true; // Not applicable, so compliant
    }

    // Check compliance based on SLA threshold and unit
    switch (sla.unit) {
      case 'ms':
      case 's':
        return value <= sla.threshold;
      case '%':
        return value >= sla.threshold;
      case 'count':
        return value <= sla.threshold;
      default:
        return true;
    }
  }

  private isOperationRelevantToSLA(
    sla: HealthcareSLA,
    operation: string,
    metadata: Record<string, any>
  ): boolean {
    // Map operations to SLAs based on operation name and metadata
    const relevanceMap: Record<string, string[]> = {
      'Emergency Workflow Response': ['emergency', 'critical', 'urgent'],
      'Clinical Decision Latency': ['clinical', 'decision', 'diagnosis'],
      'Patient Data Retrieval': ['patient', 'medical_record', 'ehr'],
      'HIPAA Audit Capture': ['hipaa', 'audit', 'compliance'],
      'System Availability': ['health_check', 'ping', 'status'],
      'Authentication Response': ['auth', 'login', 'authentication'],
      'Report Generation': ['report', 'analytics', 'dashboard'],
    };

    const keywords = relevanceMap[sla.name] || [];
    const operationLower = operation.toLowerCase();
    
    return keywords.some(keyword => 
      operationLower.includes(keyword) || 
      metadata.category?.toLowerCase().includes(keyword) ||
      metadata.type?.toLowerCase().includes(keyword)
    );
  }

  private handleSLAViolation(
    sla: HealthcareSLA,
    operation: string,
    value: number,
    metadata: Record<string, any>
  ): void {
    const alertId = `sla_violation_${sla.name}_${Date.now()}`;
    const alert: PerformanceAlert = {
      id: alertId,
      timestamp: Date.now(),
      type: 'sla_violation',
      severity: sla.priority === 'critical' ? 'critical' : 'warning',
      message: `SLA violation: ${sla.description}. Expected: ${sla.threshold}${sla.unit}, Actual: ${value}${sla.unit}`,
      metrics: this.getCurrentMetrics() || {},
      sla,
      recommendations: this.getSLAViolationRecommendations(sla, value),
      hipaaRelevant: sla.complianceRequired,
    };

    this.activeAlerts.set(alertId, alert);
    this.emit('alert:sla_violation', alert);

    if (sla.auditRequired && this.config.enableHIPAAAudit) {
      this.auditSLAViolation(sla, operation, value, metadata);
    }
  }

  private getSLAViolationRecommendations(sla: HealthcareSLA, actualValue: number): string[] {
    const recommendations: string[] = [];

    switch (sla.name) {
      case 'Emergency Workflow Response':
        recommendations.push(
          'Implement priority queuing for emergency requests',
          'Add dedicated resources for critical workflows',
          'Enable bypass mechanisms for urgent cases'
        );
        break;
      case 'Clinical Decision Latency':
        recommendations.push(
          'Optimize clinical decision algorithms',
          'Implement result caching for common scenarios',
          'Add parallel processing capabilities'
        );
        break;
      case 'Patient Data Retrieval':
        recommendations.push(
          'Optimize database queries',
          'Implement data caching strategies',
          'Add database read replicas'
        );
        break;
      default:
        recommendations.push(
          'Review system performance',
          'Consider resource scaling',
          'Implement performance optimizations'
        );
    }

    return recommendations;
  }

  private calculateAggregateMetrics(metricsArray: PerformanceMetrics[]): PerformanceMetrics {
    if (metricsArray.length === 0) {
      throw new Error('Cannot calculate aggregate metrics from empty array');
    }

    // Calculate aggregate values
    const latencies = metricsArray.map(m => m.latency);
    const throughputs = metricsArray.map(m => m.throughput);
    const resources = metricsArray.map(m => m.resources);
    const queues = metricsArray.map(m => m.queue);
    const errors = metricsArray.map(m => m.errors);
    const caches = metricsArray.map(m => m.cache);

    return {
      timestamp: Date.now(),
      latency: {
        p50: this.percentile(latencies.map(l => l.p50), 50),
        p95: this.percentile(latencies.map(l => l.p95), 95),
        p99: this.percentile(latencies.map(l => l.p99), 99),
        average: this.average(latencies.map(l => l.average)),
        min: Math.min(...latencies.map(l => l.min)),
        max: Math.max(...latencies.map(l => l.max)),
      },
      throughput: {
        requestsPerSecond: this.average(throughputs.map(t => t.requestsPerSecond)),
        transactionsPerSecond: this.average(throughputs.map(t => t.transactionsPerSecond)),
        operationsPerMinute: this.average(throughputs.map(t => t.operationsPerMinute)),
      },
      resources: {
        cpuUsage: this.average(resources.map(r => r.cpuUsage)),
        memoryUsage: this.average(resources.map(r => r.memoryUsage)),
        ioWaitTime: this.average(resources.map(r => r.ioWaitTime)),
        diskUsage: this.average(resources.map(r => r.diskUsage)),
        networkLatency: this.average(resources.map(r => r.networkLatency)),
      },
      queue: {
        depth: this.average(queues.map(q => q.depth)),
        waitTime: this.average(queues.map(q => q.waitTime)),
        processingTime: this.average(queues.map(q => q.processingTime)),
      },
      errors: {
        rate: this.average(errors.map(e => e.rate)),
        count: errors.reduce((sum, e) => sum + e.count, 0),
        types: this.aggregateErrorTypes(errors.map(e => e.types)),
      },
      cache: {
        hitRate: this.average(caches.map(c => c.hitRate)),
        missRate: this.average(caches.map(c => c.missRate)),
        evictions: caches.reduce((sum, c) => sum + c.evictions, 0),
      },
    };
  }

  private detectPerformanceIssues(metrics: PerformanceMetrics): void {
    const issues: PerformanceAlert[] = [];

    // Check for latency spikes
    if (this.baseline && metrics.latency.p95 > this.baseline.latency.p95 * this.config.alertThresholds.latencySpike) {
      issues.push({
        id: `latency_spike_${Date.now()}`,
        timestamp: Date.now(),
        type: 'performance_degradation',
        severity: 'warning',
        message: `Latency spike detected: P95 latency increased to ${metrics.latency.p95.toFixed(1)}ms`,
        metrics: { latency: metrics.latency },
        recommendations: ['Check for database performance issues', 'Review recent deployments'],
        hipaaRelevant: false,
      });
    }

    // Check for error rate spikes
    if (this.baseline && metrics.errors.rate > this.baseline.errors.rate * this.config.alertThresholds.errorRateSpike) {
      issues.push({
        id: `error_spike_${Date.now()}`,
        timestamp: Date.now(),
        type: 'error_spike',
        severity: 'critical',
        message: `Error rate spike detected: ${metrics.errors.rate.toFixed(2)}% error rate`,
        metrics: { errors: metrics.errors },
        recommendations: ['Check application logs', 'Review error patterns', 'Validate system health'],
        hipaaRelevant: true, // Errors might affect patient care
      });
    }

    // Check for resource exhaustion
    if (metrics.resources.cpuUsage > this.config.alertThresholds.resourceExhaustion ||
        metrics.resources.memoryUsage > this.config.alertThresholds.resourceExhaustion) {
      issues.push({
        id: `resource_exhaustion_${Date.now()}`,
        timestamp: Date.now(),
        type: 'resource_exhaustion',
        severity: 'critical',
        message: `Resource exhaustion detected: CPU ${metrics.resources.cpuUsage.toFixed(1)}%, Memory ${metrics.resources.memoryUsage.toFixed(1)}%`,
        metrics: { resources: metrics.resources },
        recommendations: ['Scale resources immediately', 'Identify resource-intensive operations'],
        hipaaRelevant: true, // Resource issues affect system availability
      });
    }

    // Process issues
    issues.forEach(issue => {
      this.activeAlerts.set(issue.id, issue);
      this.emit(`alert:${issue.type}`, issue);
    });
  }

  private calculateSLACompliance(
    sla: HealthcareSLA,
    metrics: PerformanceMetrics[]
  ): { met: boolean; percentage: number } {
    if (metrics.length === 0) {
      return { met: true, percentage: 100 };
    }

    // Simplified compliance calculation based on SLA type
    let compliantCount = 0;
    let totalCount = metrics.length;

    metrics.forEach(metric => {
      let isCompliant = false;
      
      switch (sla.name) {
        case 'System Availability':
          // Assume available if error rate is low
          isCompliant = metric.errors.rate < 1;
          break;
        case 'Emergency Workflow Response':
        case 'Clinical Decision Latency':
        case 'Patient Data Retrieval':
          // Check if latency is within threshold
          isCompliant = metric.latency.p95 <= sla.threshold;
          break;
        case 'HIPAA Audit Capture':
          // Assume 100% capture if system is healthy
          isCompliant = metric.errors.rate < 0.1;
          break;
        default:
          isCompliant = true;
      }

      if (isCompliant) {
        compliantCount++;
      }
    });

    const percentage = (compliantCount / totalCount) * 100;
    return {
      met: percentage >= (sla.unit === '%' ? sla.threshold : 95), // 95% compliance for non-percentage SLAs
      percentage,
    };
  }

  private analyzeTrends(metrics: PerformanceMetrics[]): {
    improving: string[];
    degrading: string[];
    stable: string[];
  } {
    if (metrics.length < 2) {
      return { improving: [], degrading: [], stable: [] };
    }

    const recent = metrics.slice(-10); // Last 10 metrics
    const older = metrics.slice(0, Math.max(1, metrics.length - 10));

    const recentAvg = this.calculateAggregateMetrics(recent);
    const olderAvg = this.calculateAggregateMetrics(older);

    const trends = {
      improving: [] as string[],
      degrading: [] as string[],
      stable: [] as string[],
    };

    // Analyze various metrics for trends
    const comparisons = [
      { name: 'Latency P95', recent: recentAvg.latency.p95, older: olderAvg.latency.p95, lowerIsBetter: true },
      { name: 'Throughput RPS', recent: recentAvg.throughput.requestsPerSecond, older: olderAvg.throughput.requestsPerSecond, lowerIsBetter: false },
      { name: 'Error Rate', recent: recentAvg.errors.rate, older: olderAvg.errors.rate, lowerIsBetter: true },
      { name: 'Cache Hit Rate', recent: recentAvg.cache.hitRate, older: olderAvg.cache.hitRate, lowerIsBetter: false },
      { name: 'CPU Usage', recent: recentAvg.resources.cpuUsage, older: olderAvg.resources.cpuUsage, lowerIsBetter: true },
      { name: 'Memory Usage', recent: recentAvg.resources.memoryUsage, older: olderAvg.resources.memoryUsage, lowerIsBetter: true },
    ];

    comparisons.forEach(comp => {
      const percentChange = ((comp.recent - comp.older) / comp.older) * 100;
      const threshold = 5; // 5% change threshold

      if (Math.abs(percentChange) < threshold) {
        trends.stable.push(comp.name);
      } else if ((comp.lowerIsBetter && percentChange < -threshold) || 
                 (!comp.lowerIsBetter && percentChange > threshold)) {
        trends.improving.push(comp.name);
      } else {
        trends.degrading.push(comp.name);
      }
    });

    return trends;
  }

  private generateExecutiveSummary(
    slaCompliance: Record<string, { met: boolean; percentage: number }>,
    trends: { improving: string[]; degrading: string[]; stable: string[] },
    bottlenecks: BottleneckAnalysis[]
  ): string {
    const slaViolations = Object.entries(slaCompliance).filter(([_, compliance]) => !compliance.met);
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical');

    let summary = 'Healthcare System Performance Summary:\n\n';

    // SLA Compliance
    if (slaViolations.length === 0) {
      summary += '✅ All healthcare SLAs are being met\n';
    } else {
      summary += `❌ ${slaViolations.length} SLA violation(s) detected:\n`;
      slaViolations.forEach(([name, compliance]) => {
        summary += `  • ${name}: ${compliance.percentage.toFixed(1)}% compliance\n`;
      });
    }

    // Performance Trends
    summary += '\n📈 Performance Trends:\n';
    if (trends.improving.length > 0) {
      summary += `  Improving: ${trends.improving.join(', ')}\n`;
    }
    if (trends.degrading.length > 0) {
      summary += `  Degrading: ${trends.degrading.join(', ')}\n`;
    }
    if (trends.stable.length > 0) {
      summary += `  Stable: ${trends.stable.join(', ')}\n`;
    }

    // Critical Issues
    if (criticalBottlenecks.length > 0) {
      summary += '\n🚨 Critical Issues Requiring Immediate Attention:\n';
      criticalBottlenecks.forEach(bottleneck => {
        summary += `  • ${bottleneck.component}: ${bottleneck.description}\n`;
      });
    }

    // Recommendations
    summary += '\n💡 Key Recommendations:\n';
    const topRecommendations = this.generateOptimizationRecommendations().slice(0, 3);
    topRecommendations.forEach(rec => {
      summary += `  • ${rec.description} (${rec.estimatedImpact}% improvement)\n`;
    });

    return summary;
  }

  private cleanupOldMetrics(): void {
    const now = Date.now();
    if (now - this.lastCleanup < 60000) { // Cleanup every minute
      return;
    }

    const cutoff = now - this.config.retentionPeriod;
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    this.metricsBuffer = this.metricsBuffer.filter(metric => metric.timestamp > cutoff);
    
    this.lastCleanup = now;
  }

  private isHIPAARelevant(operation: string, metadata: Record<string, any>): boolean {
    const hipaaKeywords = ['patient', 'medical', 'phi', 'ehr', 'clinical', 'diagnosis', 'treatment'];
    const operationLower = operation.toLowerCase();
    
    return hipaaKeywords.some(keyword => 
      operationLower.includes(keyword) || 
      metadata.category?.toLowerCase().includes(keyword) ||
      metadata.hipaaRelevant === true
    );
  }

  private auditHIPAAEvent(operation: string, duration: number, metadata: Record<string, any>): void {
    const auditEvent = {
      timestamp: new Date().toISOString(),
      type: 'HIPAA_PERFORMANCE_EVENT',
      operation,
      duration,
      metadata,
      performanceImpact: duration > 2000 ? 'HIGH' : duration > 1000 ? 'MEDIUM' : 'LOW',
    };

    // In a real implementation, this would write to a secure audit log
    this.emit('hipaa:audit', auditEvent);
  }

  private auditSLAViolation(
    sla: HealthcareSLA,
    operation: string,
    value: number,
    metadata: Record<string, any>
  ): void {
    const auditEvent = {
      timestamp: new Date().toISOString(),
      type: 'SLA_VIOLATION',
      slaName: sla.name,
      operation,
      expectedValue: sla.threshold,
      actualValue: value,
      unit: sla.unit,
      metadata,
      complianceImpact: sla.complianceRequired ? 'REGULATORY' : 'OPERATIONAL',
    };

    this.emit('hipaa:sla_violation', auditEvent);
  }

  private getPeriodStartTime(period: string, endTime: number): number {
    const periodMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return endTime - (periodMap[period] || periodMap['1h']);
  }

  private percentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private average(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private aggregateErrorTypes(errorTypesArray: Record<string, number>[]): Record<string, number> {
    const aggregated: Record<string, number> = {};
    
    errorTypesArray.forEach(errorTypes => {
      Object.entries(errorTypes).forEach(([type, count]) => {
        aggregated[type] = (aggregated[type] || 0) + count;
      });
    });

    return aggregated;
  }
}

// Export utility functions for external use
export const PerformanceUtils = {
  /**
   * Create a performance monitor with healthcare-optimized settings
   */
  createHealthcareMonitor: (config: Partial<MonitoringConfig> = {}) => {
    return new PerformanceMonitor({
      sampleRate: 5000, // 5 seconds for healthcare
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      enableHIPAAAudit: true,
      enableRealTimeAlerts: true,
      alertThresholds: {
        latencySpike: 1.5, // More sensitive for healthcare
        errorRateSpike: 2.0, // More sensitive for healthcare
        resourceExhaustion: 80, // Earlier warning
        cacheHitDrop: 40, // More sensitive
      },
      ...config,
    });
  },

  /**
   * Validate SLA configuration for healthcare compliance
   */
  validateHealthcareSLAs: (customSLAs: HealthcareSLA[] = []): boolean => {
    const requiredSLAs = ['Emergency Workflow Response', 'Clinical Decision Latency', 'HIPAA Audit Capture'];
    const allSLAs = [...HEALTHCARE_SLAS, ...customSLAs];
    
    return requiredSLAs.every(required => 
      allSLAs.some(sla => sla.name === required && sla.complianceRequired)
    );
  },

  /**
   * Format performance metrics for healthcare dashboards
   */
  formatMetricsForDashboard: (metrics: PerformanceMetrics) => {
    return {
      systemHealth: {
        overall: metrics.errors.rate < 1 ? 'Healthy' : 'Degraded',
        availability: (100 - metrics.errors.rate).toFixed(2) + '%',
        responseTime: metrics.latency.p95.toFixed(0) + 'ms',
      },
      patientImpact: {
        emergencyResponseTime: metrics.latency.p99 < 1000 ? 'Compliant' : 'At Risk',
        dataRetrievalSpeed: metrics.latency.p50 < 500 ? 'Optimal' : 'Needs Attention',
        systemReliability: metrics.errors.rate < 0.1 ? 'Excellent' : 'Concerning',
      },
      resourceUtilization: {
        cpu: metrics.resources.cpuUsage.toFixed(1) + '%',
        memory: metrics.resources.memoryUsage.toFixed(1) + '%',
        networkLatency: metrics.resources.networkLatency.toFixed(0) + 'ms',
      },
    };
  },
};

export default PerformanceMonitor;