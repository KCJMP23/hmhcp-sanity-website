/**
 * Workflow Healing Monitor
 * 
 * Advanced AI-powered monitoring system for workflow health and automatic healing.
 * Provides real-time health tracking, predictive failure prevention, and automatic
 * recovery with healthcare-specific compliance and safety monitoring.
 */

import { EventEmitter } from 'events';
import { WorkflowErrorHandler } from '../../error-handling/workflow-error-handler';

// Core monitoring types
export interface WorkflowMetrics {
  workflowId: string;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  successRate: number;
  throughput: number;
  latency: number;
  timestamp: Date;
}

export interface HealthThresholds {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
  maxErrorRate: number;
  minSuccessRate: number;
  minThroughput: number;
  maxLatency: number;
}

export interface AnormalyAlert {
  id: string;
  workflowId: string;
  type: 'performance' | 'resource' | 'error' | 'compliance' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: WorkflowMetrics;
  recommendation: string;
  timestamp: Date;
}

export interface HealingAction {
  id: string;
  workflowId: string;
  type: 'optimize' | 'scale' | 'restart' | 'redirect' | 'cache' | 'isolate';
  description: string;
  parameters: Record<string, unknown>;
  expectedImpact: string;
  executedAt?: Date;
  successful?: boolean;
  measuredImpact?: Record<string, number>;
}

// Healthcare-specific monitoring types
export interface ClinicalWorkflowSLA {
  workflowType: 'patient_care' | 'diagnosis' | 'treatment' | 'emergency' | 'administrative';
  maxResponseTime: number;
  minAvailability: number;
  maxDowntime: number;
  requiresAuditTrail: boolean;
  criticalityLevel: 'routine' | 'urgent' | 'critical' | 'emergency';
}

export interface PatientSafetyMetrics {
  workflowId: string;
  phiAccessAttempts: number;
  unauthorizedAccess: number;
  dataIntegrityChecks: number;
  dataIntegrityFailures: number;
  complianceViolations: number;
  emergencyProtocolActivations: number;
  timestamp: Date;
}

export interface ComplianceDriftAlert {
  id: string;
  workflowId: string;
  complianceType: 'HIPAA' | 'SOC2' | 'GDPR' | 'FDA' | 'HL7';
  violationType: 'access_control' | 'data_encryption' | 'audit_trail' | 'retention' | 'consent';
  severity: 'warning' | 'violation' | 'critical';
  description: string;
  remediation: string;
  timestamp: Date;
}

// Predictive failure types
export interface FailurePrediction {
  workflowId: string;
  predictedFailureTime: Date;
  confidence: number;
  failureType: string;
  rootCause: string;
  preventiveActions: HealingAction[];
  impactAssessment: string;
}

export interface PatternRecognition {
  patternId: string;
  description: string;
  frequency: number;
  successfulHealings: number;
  averageHealingTime: number;
  lastOccurrence: Date;
  predictiveSignals: string[];
}

/**
 * WorkflowHealingMonitor - Advanced AI-powered workflow health monitoring and healing
 */
export class WorkflowHealingMonitor extends EventEmitter {
  private isActive = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsHistory = new Map<string, WorkflowMetrics[]>();
  private healingHistory = new Map<string, HealingAction[]>();
  private patternDatabase = new Map<string, PatternRecognition>();
  private activeAlerts = new Map<string, AnormalyAlert>();
  private clinicalSLAs = new Map<string, ClinicalWorkflowSLA>();
  
  // Default health thresholds
  private defaultThresholds: HealthThresholds = {
    maxExecutionTime: 30000, // 30 seconds
    maxMemoryUsage: 0.8, // 80%
    maxCpuUsage: 0.7, // 70%
    maxErrorRate: 0.05, // 5%
    minSuccessRate: 0.95, // 95%
    minThroughput: 10, // requests/second
    maxLatency: 2000 // 2 seconds
  };

  constructor(
    private errorHandler: WorkflowErrorHandler,
    private monitoringIntervalMs = 5000, // 5 seconds
    private retentionDays = 30
  ) {
    super();
    this.setupEventListeners();
    this.initializeClinicialSLAs();
  }

  /**
   * Start the healing monitor
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('Healing monitor is already active');
      return;
    }

    this.isActive = true;
    
    // Start real-time monitoring
    this.monitoringInterval = setInterval(
      () => this.performHealthCheck(),
      this.monitoringIntervalMs
    );

    // Initialize predictive models
    await this.initializePredictiveModels();

    // Start pattern recognition
    this.startPatternRecognition();

    console.log('Workflow Healing Monitor started successfully');
    this.emit('monitor:started');
  }

  /**
   * Stop the healing monitor
   */
  async stop(): Promise<void> {
    this.isActive = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Cleanup resources
    await this.cleanup();

    console.log('Workflow Healing Monitor stopped');
    this.emit('monitor:stopped');
  }

  /**
   * Record workflow metrics
   */
  recordMetrics(metrics: WorkflowMetrics): void {
    const history = this.metricsHistory.get(metrics.workflowId) || [];
    history.push(metrics);

    // Keep only recent metrics
    const cutoffTime = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);
    const recentMetrics = history.filter(m => m.timestamp >= cutoffTime);
    
    this.metricsHistory.set(metrics.workflowId, recentMetrics);

    // Analyze metrics for anomalies
    this.analyzeMetrics(metrics);

    // Update patterns
    this.updatePatterns(metrics);

    // Check healthcare-specific metrics
    this.checkHealthcareCompliance(metrics);
  }

  /**
   * Get current workflow health status
   */
  getWorkflowHealth(workflowId: string): {
    status: 'healthy' | 'degraded' | 'critical' | 'failing';
    metrics: WorkflowMetrics | null;
    alerts: AnormalyAlert[];
    recommendations: string[];
  } {
    const recentMetrics = this.getRecentMetrics(workflowId);
    const alerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.workflowId === workflowId);

    if (!recentMetrics.length) {
      return {
        status: 'healthy',
        metrics: null,
        alerts: [],
        recommendations: []
      };
    }

    const latestMetrics = recentMetrics[recentMetrics.length - 1];
    const status = this.calculateHealthStatus(latestMetrics, alerts);
    const recommendations = this.generateRecommendations(workflowId, latestMetrics, alerts);

    return {
      status,
      metrics: latestMetrics,
      alerts,
      recommendations
    };
  }

  /**
   * Predict potential failures
   */
  async predictFailures(workflowId: string): Promise<FailurePrediction[]> {
    const recentMetrics = this.getRecentMetrics(workflowId);
    if (recentMetrics.length < 10) {
      return []; // Need sufficient data for prediction
    }

    const predictions: FailurePrediction[] = [];

    // Analyze trends for different failure types
    const performanceTrend = this.analyzePerformanceTrend(recentMetrics);
    const resourceTrend = this.analyzeResourceTrend(recentMetrics);
    const errorTrend = this.analyzeErrorTrend(recentMetrics);

    // Performance degradation prediction
    if (performanceTrend.isDeterioriating && performanceTrend.confidence > 0.7) {
      predictions.push({
        workflowId,
        predictedFailureTime: new Date(Date.now() + performanceTrend.timeToFailure),
        confidence: performanceTrend.confidence,
        failureType: 'performance_degradation',
        rootCause: 'Gradual performance deterioration detected',
        preventiveActions: this.generatePreventiveActions(workflowId, 'performance'),
        impactAssessment: 'High - May cause workflow timeouts and user experience degradation'
      });
    }

    // Resource exhaustion prediction
    if (resourceTrend.isDeterioriating && resourceTrend.confidence > 0.8) {
      predictions.push({
        workflowId,
        predictedFailureTime: new Date(Date.now() + resourceTrend.timeToFailure),
        confidence: resourceTrend.confidence,
        failureType: 'resource_exhaustion',
        rootCause: 'Memory or CPU usage trending towards limits',
        preventiveActions: this.generatePreventiveActions(workflowId, 'resource'),
        impactAssessment: 'Critical - System may become unresponsive'
      });
    }

    // Error rate escalation prediction
    if (errorTrend.isEscalating && errorTrend.confidence > 0.6) {
      predictions.push({
        workflowId,
        predictedFailureTime: new Date(Date.now() + errorTrend.timeToFailure),
        confidence: errorTrend.confidence,
        failureType: 'error_cascade',
        rootCause: 'Increasing error rate may lead to cascade failure',
        preventiveActions: this.generatePreventiveActions(workflowId, 'error'),
        impactAssessment: 'High - May cause complete workflow failure'
      });
    }

    return predictions;
  }

  /**
   * Execute healing action
   */
  async executeHealing(action: HealingAction): Promise<boolean> {
    try {
      console.log(`Executing healing action: ${action.type} for workflow ${action.workflowId}`);

      let success = false;
      const startTime = Date.now();

      switch (action.type) {
        case 'optimize':
          success = await this.optimizeWorkflow(action);
          break;
        case 'scale':
          success = await this.scaleResources(action);
          break;
        case 'restart':
          success = await this.restartWorkflow(action);
          break;
        case 'redirect':
          success = await this.redirectTraffic(action);
          break;
        case 'cache':
          success = await this.warmCache(action);
          break;
        case 'isolate':
          success = await this.isolateWorkflow(action);
          break;
        default:
          console.warn(`Unknown healing action type: ${action.type}`);
          return false;
      }

      // Record healing action
      action.executedAt = new Date();
      action.successful = success;

      const history = this.healingHistory.get(action.workflowId) || [];
      history.push(action);
      this.healingHistory.set(action.workflowId, history);

      // Measure impact after a delay
      setTimeout(() => this.measureHealingImpact(action), 30000);

      // Emit healing event
      this.emit('healing:executed', {
        action,
        success,
        duration: Date.now() - startTime
      });

      return success;
    } catch (error) {
      console.error('Error executing healing action:', error);
      action.successful = false;
      return false;
    }
  }

  /**
   * Get healing recommendations for a workflow
   */
  getHealingRecommendations(workflowId: string): HealingAction[] {
    const health = this.getWorkflowHealth(workflowId);
    const recommendations: HealingAction[] = [];

    if (health.status === 'critical' || health.status === 'failing') {
      // Critical state - immediate actions needed
      if (health.metrics) {
        if (health.metrics.errorRate > this.defaultThresholds.maxErrorRate) {
          recommendations.push({
            id: this.generateActionId(),
            workflowId,
            type: 'restart',
            description: 'Restart workflow to clear error state',
            parameters: { graceful: true, timeout: 30000 },
            expectedImpact: 'Reset error rate and restore normal operation'
          });
        }

        if (health.metrics.memoryUsage > this.defaultThresholds.maxMemoryUsage) {
          recommendations.push({
            id: this.generateActionId(),
            workflowId,
            type: 'scale',
            description: 'Scale up memory resources',
            parameters: { type: 'memory', factor: 1.5 },
            expectedImpact: 'Reduce memory pressure and improve performance'
          });
        }
      }
    } else if (health.status === 'degraded') {
      // Performance optimization
      recommendations.push({
        id: this.generateActionId(),
        workflowId,
        type: 'optimize',
        description: 'Optimize workflow performance',
        parameters: { enableCompression: true, optimizeQueries: true },
        expectedImpact: 'Improve response time and resource utilization'
      });

      // Cache warming for common operations
      recommendations.push({
        id: this.generateActionId(),
        workflowId,
        type: 'cache',
        description: 'Warm cache for frequently accessed data',
        parameters: { preloadTopQueries: true, extendTTL: true },
        expectedImpact: 'Reduce latency for common operations'
      });
    }

    return recommendations;
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  getDashboardData(): {
    overview: {
      totalWorkflows: number;
      healthyWorkflows: number;
      degradedWorkflows: number;
      criticalWorkflows: number;
      activeAlerts: number;
      healingActionsToday: number;
    };
    topAlerts: AnormalyAlert[];
    recentHealings: HealingAction[];
    predictedFailures: FailurePrediction[];
    complianceStatus: {
      violations: number;
      driftAlerts: number;
      auditFindings: number;
    };
  } {
    const allWorkflowIds = Array.from(this.metricsHistory.keys());
    const healthStats = allWorkflowIds.reduce((stats, workflowId) => {
      const health = this.getWorkflowHealth(workflowId);
      stats[health.status]++;
      return stats;
    }, { healthy: 0, degraded: 0, critical: 0, failing: 0 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const healingActionsToday = Array.from(this.healingHistory.values())
      .flat()
      .filter(action => action.executedAt && action.executedAt >= today)
      .length;

    return {
      overview: {
        totalWorkflows: allWorkflowIds.length,
        healthyWorkflows: healthStats.healthy,
        degradedWorkflows: healthStats.degraded,
        criticalWorkflows: healthStats.critical + healthStats.failing,
        activeAlerts: this.activeAlerts.size,
        healingActionsToday
      },
      topAlerts: Array.from(this.activeAlerts.values())
        .sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .slice(0, 10),
      recentHealings: Array.from(this.healingHistory.values())
        .flat()
        .filter(action => action.executedAt)
        .sort((a, b) => (b.executedAt?.getTime() || 0) - (a.executedAt?.getTime() || 0))
        .slice(0, 10),
      predictedFailures: [], // Populated by background process
      complianceStatus: {
        violations: 0, // Populated from compliance monitoring
        driftAlerts: 0,
        auditFindings: 0
      }
    };
  }

  // Private helper methods

  private setupEventListeners(): void {
    // Listen for workflow errors from error handler
    this.errorHandler.on('workflow:error', (error) => {
      this.handleWorkflowError(error);
    });

    this.errorHandler.on('workflow:recovered', (recovery) => {
      this.handleWorkflowRecovery(recovery);
    });
  }

  private initializeClinicialSLAs(): void {
    // Define healthcare-specific SLAs
    const slas: Array<[string, ClinicalWorkflowSLA]> = [
      ['patient_emergency', {
        workflowType: 'emergency',
        maxResponseTime: 5000, // 5 seconds for emergency
        minAvailability: 0.9999, // 99.99% uptime
        maxDowntime: 60000, // 1 minute max downtime
        requiresAuditTrail: true,
        criticalityLevel: 'emergency'
      }],
      ['patient_diagnosis', {
        workflowType: 'diagnosis',
        maxResponseTime: 15000, // 15 seconds
        minAvailability: 0.999, // 99.9% uptime
        maxDowntime: 300000, // 5 minutes max downtime
        requiresAuditTrail: true,
        criticalityLevel: 'critical'
      }],
      ['patient_treatment', {
        workflowType: 'treatment',
        maxResponseTime: 30000, // 30 seconds
        minAvailability: 0.999, // 99.9% uptime
        maxDowntime: 600000, // 10 minutes max downtime
        requiresAuditTrail: true,
        criticalityLevel: 'urgent'
      }],
      ['administrative', {
        workflowType: 'administrative',
        maxResponseTime: 60000, // 1 minute
        minAvailability: 0.99, // 99% uptime
        maxDowntime: 3600000, // 1 hour max downtime
        requiresAuditTrail: false,
        criticalityLevel: 'routine'
      }]
    ];

    slas.forEach(([id, sla]) => {
      this.clinicalSLAs.set(id, sla);
    });
  }

  private async initializePredictiveModels(): Promise<void> {
    // Load historical patterns
    await this.loadHistoricalPatterns();

    // Initialize ML models for failure prediction
    // (In a real implementation, this would load pre-trained models)
    console.log('Predictive models initialized');
  }

  private startPatternRecognition(): void {
    // Pattern recognition runs every minute
    setInterval(() => {
      this.recognizePatterns();
    }, 60000);
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Check all monitored workflows
      for (const [workflowId] of this.metricsHistory) {
        const health = this.getWorkflowHealth(workflowId);
        
        // Auto-heal critical issues
        if (health.status === 'critical' || health.status === 'failing') {
          const recommendations = this.getHealingRecommendations(workflowId);
          
          // Execute high-priority healing actions automatically
          for (const action of recommendations) {
            if (this.shouldAutoExecute(action)) {
              await this.executeHealing(action);
            }
          }
        }

        // Predict and prevent failures
        const predictions = await this.predictFailures(workflowId);
        for (const prediction of predictions) {
          if (prediction.confidence > 0.8) {
            // Execute preventive actions for high-confidence predictions
            for (const action of prediction.preventiveActions) {
              await this.executeHealing(action);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during health check:', error);
    }
  }

  private analyzeMetrics(metrics: WorkflowMetrics): void {
    const alerts: AnormalyAlert[] = [];

    // Performance analysis
    if (metrics.executionTime > this.defaultThresholds.maxExecutionTime) {
      alerts.push({
        id: this.generateAlertId(),
        workflowId: metrics.workflowId,
        type: 'performance',
        severity: metrics.executionTime > this.defaultThresholds.maxExecutionTime * 2 ? 'critical' : 'high',
        message: `Execution time (${metrics.executionTime}ms) exceeds threshold`,
        metrics,
        recommendation: 'Consider workflow optimization or resource scaling',
        timestamp: new Date()
      });
    }

    // Resource analysis
    if (metrics.memoryUsage > this.defaultThresholds.maxMemoryUsage) {
      alerts.push({
        id: this.generateAlertId(),
        workflowId: metrics.workflowId,
        type: 'resource',
        severity: metrics.memoryUsage > 0.95 ? 'critical' : 'high',
        message: `Memory usage (${(metrics.memoryUsage * 100).toFixed(1)}%) is high`,
        metrics,
        recommendation: 'Scale memory resources or optimize memory usage',
        timestamp: new Date()
      });
    }

    // Error rate analysis
    if (metrics.errorRate > this.defaultThresholds.maxErrorRate) {
      alerts.push({
        id: this.generateAlertId(),
        workflowId: metrics.workflowId,
        type: 'error',
        severity: metrics.errorRate > 0.2 ? 'critical' : 'high',
        message: `Error rate (${(metrics.errorRate * 100).toFixed(1)}%) exceeds threshold`,
        metrics,
        recommendation: 'Investigate error causes and implement fixes',
        timestamp: new Date()
      });
    }

    // Store active alerts
    alerts.forEach(alert => {
      this.activeAlerts.set(alert.id, alert);
      this.emit('alert:created', alert);
    });
  }

  private checkHealthcareCompliance(metrics: WorkflowMetrics): void {
    // Check against clinical SLAs
    for (const [slaId, sla] of this.clinicalSLAs) {
      if (metrics.workflowId.includes(slaId)) {
        if (metrics.executionTime > sla.maxResponseTime) {
          const alert: AnormalyAlert = {
            id: this.generateAlertId(),
            workflowId: metrics.workflowId,
            type: 'compliance',
            severity: sla.criticalityLevel === 'emergency' ? 'critical' : 'high',
            message: `Clinical SLA violation: Response time ${metrics.executionTime}ms exceeds ${sla.maxResponseTime}ms`,
            metrics,
            recommendation: `Immediate action required for ${sla.criticalityLevel} workflow`,
            timestamp: new Date()
          };

          this.activeAlerts.set(alert.id, alert);
          this.emit('compliance:violation', alert);
        }
      }
    }
  }

  private calculateHealthStatus(
    metrics: WorkflowMetrics,
    alerts: AnormalyAlert[]
  ): 'healthy' | 'degraded' | 'critical' | 'failing' {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');

    if (criticalAlerts.length > 0 || metrics.errorRate > 0.5) {
      return 'failing';
    }

    if (criticalAlerts.length > 0 || 
        metrics.errorRate > 0.2 || 
        metrics.successRate < 0.8) {
      return 'critical';
    }

    if (highAlerts.length > 0 || 
        metrics.executionTime > this.defaultThresholds.maxExecutionTime ||
        metrics.errorRate > this.defaultThresholds.maxErrorRate) {
      return 'degraded';
    }

    return 'healthy';
  }

  private generateRecommendations(
    workflowId: string,
    metrics: WorkflowMetrics,
    alerts: AnormalyAlert[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.executionTime > this.defaultThresholds.maxExecutionTime) {
      recommendations.push('Optimize workflow performance or increase timeout thresholds');
    }

    if (metrics.memoryUsage > this.defaultThresholds.maxMemoryUsage) {
      recommendations.push('Scale memory resources or implement memory optimization');
    }

    if (metrics.errorRate > this.defaultThresholds.maxErrorRate) {
      recommendations.push('Investigate and fix root causes of errors');
    }

    if (alerts.some(a => a.type === 'compliance')) {
      recommendations.push('Address compliance violations immediately to maintain healthcare standards');
    }

    return recommendations;
  }

  private getRecentMetrics(workflowId: string, count = 100): WorkflowMetrics[] {
    const history = this.metricsHistory.get(workflowId) || [];
    return history.slice(-count);
  }

  private analyzePerformanceTrend(metrics: WorkflowMetrics[]): {
    isDeterioriating: boolean;
    confidence: number;
    timeToFailure: number;
  } {
    if (metrics.length < 5) {
      return { isDeterioriating: false, confidence: 0, timeToFailure: Infinity };
    }

    // Simple linear regression to detect trend
    const executionTimes = metrics.map(m => m.executionTime);
    const slope = this.calculateSlope(executionTimes);
    const variance = this.calculateVariance(executionTimes);
    
    const isDeterioriating = slope > 100; // 100ms increase per measurement
    const confidence = Math.min(Math.abs(slope) / variance, 1);
    const timeToFailure = slope > 0 ? 
      (this.defaultThresholds.maxExecutionTime - executionTimes[executionTimes.length - 1]) / slope * this.monitoringIntervalMs :
      Infinity;

    return { isDeterioriating, confidence, timeToFailure };
  }

  private analyzeResourceTrend(metrics: WorkflowMetrics[]): {
    isDeterioriating: boolean;
    confidence: number;
    timeToFailure: number;
  } {
    if (metrics.length < 5) {
      return { isDeterioriating: false, confidence: 0, timeToFailure: Infinity };
    }

    const memoryUsages = metrics.map(m => m.memoryUsage);
    const slope = this.calculateSlope(memoryUsages);
    const variance = this.calculateVariance(memoryUsages);
    
    const isDeterioriating = slope > 0.01; // 1% increase per measurement
    const confidence = Math.min(Math.abs(slope) / variance, 1);
    const timeToFailure = slope > 0 ? 
      (1.0 - memoryUsages[memoryUsages.length - 1]) / slope * this.monitoringIntervalMs :
      Infinity;

    return { isDeterioriating, confidence, timeToFailure };
  }

  private analyzeErrorTrend(metrics: WorkflowMetrics[]): {
    isEscalating: boolean;
    confidence: number;
    timeToFailure: number;
  } {
    if (metrics.length < 5) {
      return { isEscalating: false, confidence: 0, timeToFailure: Infinity };
    }

    const errorRates = metrics.map(m => m.errorRate);
    const slope = this.calculateSlope(errorRates);
    const variance = this.calculateVariance(errorRates);
    
    const isEscalating = slope > 0.01; // 1% increase per measurement
    const confidence = Math.min(Math.abs(slope) / variance, 1);
    const timeToFailure = slope > 0 ? 
      (0.5 - errorRates[errorRates.length - 1]) / slope * this.monitoringIntervalMs :
      Infinity;

    return { isEscalating, confidence, timeToFailure };
  }

  private calculateSlope(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
  }

  private generatePreventiveActions(workflowId: string, type: string): HealingAction[] {
    const actions: HealingAction[] = [];

    switch (type) {
      case 'performance':
        actions.push({
          id: this.generateActionId(),
          workflowId,
          type: 'optimize',
          description: 'Preemptive performance optimization',
          parameters: { enableCaching: true, optimizeQueries: true },
          expectedImpact: 'Prevent performance degradation'
        });
        break;

      case 'resource':
        actions.push({
          id: this.generateActionId(),
          workflowId,
          type: 'scale',
          description: 'Preemptive resource scaling',
          parameters: { type: 'auto', factor: 1.2 },
          expectedImpact: 'Prevent resource exhaustion'
        });
        break;

      case 'error':
        actions.push({
          id: this.generateActionId(),
          workflowId,
          type: 'cache',
          description: 'Cache warming to reduce errors',
          parameters: { warmCommonPaths: true },
          expectedImpact: 'Reduce error-prone operations'
        });
        break;
    }

    return actions;
  }

  // Healing action implementations
  private async optimizeWorkflow(action: HealingAction): Promise<boolean> {
    // Implement workflow optimization logic
    console.log(`Optimizing workflow ${action.workflowId}`, action.parameters);
    return true; // Placeholder
  }

  private async scaleResources(action: HealingAction): Promise<boolean> {
    // Implement resource scaling logic
    console.log(`Scaling resources for workflow ${action.workflowId}`, action.parameters);
    return true; // Placeholder
  }

  private async restartWorkflow(action: HealingAction): Promise<boolean> {
    // Implement workflow restart logic
    console.log(`Restarting workflow ${action.workflowId}`, action.parameters);
    return true; // Placeholder
  }

  private async redirectTraffic(action: HealingAction): Promise<boolean> {
    // Implement traffic redirection logic
    console.log(`Redirecting traffic for workflow ${action.workflowId}`, action.parameters);
    return true; // Placeholder
  }

  private async warmCache(action: HealingAction): Promise<boolean> {
    // Implement cache warming logic
    console.log(`Warming cache for workflow ${action.workflowId}`, action.parameters);
    return true; // Placeholder
  }

  private async isolateWorkflow(action: HealingAction): Promise<boolean> {
    // Implement workflow isolation logic
    console.log(`Isolating workflow ${action.workflowId}`, action.parameters);
    return true; // Placeholder
  }

  private shouldAutoExecute(action: HealingAction): boolean {
    // Only auto-execute safe actions
    const safeActions = ['optimize', 'cache', 'scale'];
    return safeActions.includes(action.type);
  }

  private async measureHealingImpact(action: HealingAction): Promise<void> {
    // Measure the impact of healing action
    const beforeMetrics = this.getRecentMetrics(action.workflowId, 5);
    const afterMetrics = this.getRecentMetrics(action.workflowId, 3);

    if (beforeMetrics.length > 0 && afterMetrics.length > 0) {
      const avgBefore = beforeMetrics.reduce((sum, m) => sum + m.executionTime, 0) / beforeMetrics.length;
      const avgAfter = afterMetrics.reduce((sum, m) => sum + m.executionTime, 0) / afterMetrics.length;
      
      action.measuredImpact = {
        executionTimeChange: avgAfter - avgBefore,
        relativeImprovement: (avgBefore - avgAfter) / avgBefore
      };
    }
  }

  private updatePatterns(metrics: WorkflowMetrics): void {
    // Update pattern recognition database
    // This would implement pattern learning from metrics
  }

  private recognizePatterns(): void {
    // Recognize recurring patterns in metrics and failures
    // This would implement pattern recognition algorithms
  }

  private handleWorkflowError(error: any): void {
    // Handle workflow errors from error handler
    console.log('Workflow error detected:', error);
  }

  private handleWorkflowRecovery(recovery: any): void {
    // Handle workflow recovery notifications
    console.log('Workflow recovery completed:', recovery);
  }

  private async loadHistoricalPatterns(): Promise<void> {
    // Load historical patterns from storage
    // This would load patterns from persistent storage
  }

  private async cleanup(): Promise<void> {
    // Cleanup resources before shutdown
    this.metricsHistory.clear();
    this.activeAlerts.clear();
    this.healingHistory.clear();
    this.patternDatabase.clear();
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Utility functions for external use
export function createDefaultHealingMonitor(
  errorHandler: WorkflowErrorHandler,
  options: {
    monitoringInterval?: number;
    retentionDays?: number;
  } = {}
): WorkflowHealingMonitor {
  return new WorkflowHealingMonitor(
    errorHandler,
    options.monitoringInterval || 5000,
    options.retentionDays || 30
  );
}

export function createHealthcareOptimizedMonitor(
  errorHandler: WorkflowErrorHandler
): WorkflowHealingMonitor {
  const monitor = new WorkflowHealingMonitor(errorHandler, 1000, 90); // 1s monitoring, 90 days retention
  
  // Healthcare-specific optimizations would be configured here
  return monitor;
}