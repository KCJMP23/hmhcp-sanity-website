/**
 * AI Orchestrator Logging and Monitoring Infrastructure
 * Healthcare-compliant logging with audit trails and compliance monitoring
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { createHash } from 'crypto';
import type {
  OrchestratorEvent,
  EventType,
  EventSeverity,
  TaskResult,
  TaskError,
  ComplianceViolation,
  SecurityContext,
  AgentMetrics,
  PerformanceMetrics,
  OrchestratorMetrics,
  DataClassification
} from '../../types/ai/orchestrator';

export interface LogEntry {
  readonly id: string;
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly source: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly correlationId?: string;
  readonly complianceLevel: ComplianceLevel;
  readonly encryptedData?: string;
  readonly dataHash: string;
  readonly retentionDays: number;
}

export interface AuditLogEntry extends LogEntry {
  readonly action: AuditAction;
  readonly resourceId?: string;
  readonly resourceType?: string;
  readonly beforeState?: Record<string, unknown>;
  readonly afterState?: Record<string, unknown>;
  readonly complianceImpact: boolean;
  readonly riskScore: number;
}

export interface MetricsSnapshot {
  readonly timestamp: Date;
  readonly orchestratorMetrics: OrchestratorMetrics;
  readonly systemMetrics: SystemMetrics;
  readonly complianceMetrics: ComplianceMetrics;
  readonly securityMetrics: SecurityMetrics;
}

export interface SystemMetrics {
  readonly cpuUsage: number;
  readonly memoryUsage: number;
  readonly diskUsage: number;
  readonly networkLatency: number;
  readonly activeConnections: number;
  readonly queueDepth: number;
  readonly cacheHitRate: number;
  readonly errorRate: number;
  readonly throughput: number;
}

export interface ComplianceMetrics {
  readonly hipaaViolations: number;
  readonly gdprViolations: number;
  readonly encryptionCompliance: number;
  readonly auditTrailIntegrity: number;
  readonly dataRetentionCompliance: number;
  readonly accessControlViolations: number;
  readonly lastComplianceCheck: Date;
}

export interface SecurityMetrics {
  readonly failedAuthAttempts: number;
  readonly suspiciousActivities: number;
  readonly dataBreachAttempts: number;
  readonly encryptionFailures: number;
  readonly accessControlFailures: number;
  readonly threatLevel: ThreatLevel;
  readonly lastSecurityScan: Date;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type ComplianceLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'access' | 'modify' | 'export';
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HealthcareLoggerOptions {
  redis: Redis;
  logLevel: LogLevel;
  enableAuditLogging: boolean;
  enableComplianceMonitoring: boolean;
  encryptSensitiveData: boolean;
  auditRetentionDays: number;
  metricsRetentionDays: number;
  batchSize: number;
  flushInterval: number;
}

export class HealthcareAILogger extends EventEmitter {
  private readonly redis: Redis;
  private readonly options: HealthcareLoggerOptions;
  private readonly logBuffer: LogEntry[] = [];
  private readonly auditBuffer: AuditLogEntry[] = [];
  private readonly metricsBuffer: MetricsSnapshot[] = [];
  private readonly flushTimer: NodeJS.Timeout;
  private readonly performanceCollector: PerformanceCollector;
  private readonly complianceMonitor: ComplianceMonitor;

  constructor(options: HealthcareLoggerOptions) {
    super();
    this.redis = options.redis;
    this.options = options;

    // Initialize performance collector
    this.performanceCollector = new PerformanceCollector();

    // Initialize compliance monitor
    this.complianceMonitor = new ComplianceMonitor(options);

    // Set up periodic flush
    this.flushTimer = setInterval(
      () => this.flush(),
      options.flushInterval
    );

    // Start performance monitoring
    this.performanceCollector.start();
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, unknown>, context?: SecurityContext): void {
    if (this.shouldLog('debug')) {
      this.log('debug', 'orchestrator', message, data, context);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, unknown>, context?: SecurityContext): void {
    if (this.shouldLog('info')) {
      this.log('info', 'orchestrator', message, data, context);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, unknown>, context?: SecurityContext): void {
    if (this.shouldLog('warn')) {
      this.log('warn', 'orchestrator', message, data, context);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | TaskError, data?: Record<string, unknown>, context?: SecurityContext): void {
    if (this.shouldLog('error')) {
      const errorData = error ? {
        ...data,
        error: {
          message: error.message,
          stack: error instanceof Error ? error.stack : undefined,
          code: 'code' in error ? error.code : undefined,
          details: 'details' in error ? error.details : undefined
        }
      } : data;

      this.log('error', 'orchestrator', message, errorData, context);
    }
  }

  /**
   * Log a critical message
   */
  critical(message: string, data?: Record<string, unknown>, context?: SecurityContext): void {
    this.log('critical', 'orchestrator', message, data, context);
    
    // Immediately flush critical logs
    this.flush().catch(err => {
      console.error('Failed to flush critical log:', err);
    });
  }

  /**
   * Log an orchestrator event
   */
  logEvent(event: OrchestratorEvent, context?: SecurityContext): void {
    const level = this.severityToLogLevel(event.severity);
    this.log(level, event.source, `Event: ${event.type}`, event.data, context, event.id);
  }

  /**
   * Log an audit event
   */
  async logAudit(
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    message: string,
    context: SecurityContext,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ): Promise<void> {
    if (!this.options.enableAuditLogging) {
      return;
    }

    const riskScore = this.calculateRiskScore(action, resourceType, context);
    const complianceImpact = this.assessComplianceImpact(action, resourceType, beforeState, afterState);

    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: riskScore > 7 ? 'critical' : riskScore > 5 ? 'error' : 'info',
      source: 'audit',
      message,
      data: {
        action,
        resourceType,
        resourceId,
        riskScore,
        complianceImpact
      },
      userId: context.userId,
      sessionId: context.sessionId,
      correlationId: context.sessionId,
      complianceLevel: this.determineComplianceLevel(context.dataClassifications),
      encryptedData: this.options.encryptSensitiveData ? 
        await this.encryptSensitiveData({ beforeState, afterState }) : undefined,
      dataHash: this.generateDataHash({ action, resourceType, resourceId, beforeState, afterState }),
      retentionDays: this.options.auditRetentionDays,
      action,
      resourceId,
      resourceType,
      beforeState,
      afterState,
      complianceImpact,
      riskScore
    };

    this.auditBuffer.push(auditEntry);

    // Emit audit event for real-time monitoring
    this.emit('audit-logged', auditEntry);

    // Check if this is a high-risk audit event
    if (riskScore > 7 || complianceImpact) {
      this.emit('high-risk-audit', auditEntry);
    }
  }

  /**
   * Log performance metrics
   */
  logMetrics(orchestratorMetrics: OrchestratorMetrics): void {
    const systemMetrics = this.performanceCollector.collectSystemMetrics();
    const complianceMetrics = this.complianceMonitor.getMetrics();
    const securityMetrics = this.complianceMonitor.getSecurityMetrics();

    const snapshot: MetricsSnapshot = {
      timestamp: new Date(),
      orchestratorMetrics,
      systemMetrics,
      complianceMetrics,
      securityMetrics
    };

    this.metricsBuffer.push(snapshot);

    // Check for performance alerts
    this.checkPerformanceAlerts(snapshot);
  }

  /**
   * Log compliance violation
   */
  logComplianceViolation(violation: ComplianceViolation, context: SecurityContext): void {
    this.critical(
      `Compliance violation: ${violation.type} - ${violation.description}`,
      {
        violationId: violation.id,
        type: violation.type,
        severity: violation.severity,
        affectedData: violation.affectedData,
        detectedAt: violation.detectedAt
      },
      context
    );

    // Also log as audit event
    this.logAudit(
      'access',
      'compliance-violation',
      violation.id,
      `Compliance violation detected: ${violation.description}`,
      context,
      undefined,
      { violation }
    );
  }

  /**
   * Search logs
   */
  async searchLogs(
    query: {
      level?: LogLevel;
      source?: string;
      userId?: string;
      sessionId?: string;
      fromDate?: Date;
      toDate?: Date;
      keyword?: string;
    },
    limit: number = 100
  ): Promise<LogEntry[]> {
    const searchKey = `logs:search:${this.generateSearchKey(query)}`;
    
    // Check cache first
    const cached = await this.redis.get(searchKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Perform search (in a real implementation, this would use a proper search index)
    const pattern = 'logs:*';
    const keys = await this.redis.keys(pattern);
    const results: LogEntry[] = [];

    for (const key of keys.slice(0, limit)) {
      const logData = await this.redis.get(key);
      if (logData) {
        const log: LogEntry = JSON.parse(logData);
        
        // Apply filters
        if (this.matchesQuery(log, query)) {
          results.push(log);
        }
      }
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Cache search results for 5 minutes
    await this.redis.setex(searchKey, 300, JSON.stringify(results));

    return results.slice(0, limit);
  }

  /**
   * Get audit trail for a resource
   */
  async getAuditTrail(resourceType: string, resourceId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    const pattern = `audit:${resourceType}:${resourceId}:*`;
    const keys = await this.redis.keys(pattern);
    const results: AuditLogEntry[] = [];

    for (const key of keys) {
      const auditData = await this.redis.get(key);
      if (auditData) {
        results.push(JSON.parse(auditData));
      }
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return results.slice(0, limit);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(fromDate: Date, toDate: Date): Promise<{
    totalAuditEvents: number;
    complianceViolations: ComplianceViolation[];
    riskScore: number;
    recommendations: string[];
  }> {
    // Get all audit logs in date range
    const auditLogs = await this.searchLogs({
      source: 'audit',
      fromDate,
      toDate
    }) as AuditLogEntry[];

    // Get compliance violations
    const violations = await this.getComplianceViolations(fromDate, toDate);

    // Calculate overall risk score
    const riskScore = auditLogs.reduce((sum, log) => sum + log.riskScore, 0) / auditLogs.length || 0;

    // Generate recommendations
    const recommendations = this.generateComplianceRecommendations(auditLogs, violations);

    return {
      totalAuditEvents: auditLogs.length,
      complianceViolations: violations,
      riskScore,
      recommendations
    };
  }

  /**
   * Flush pending logs to Redis
   */
  async flush(): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Flush regular logs
    for (const log of this.logBuffer) {
      const key = `logs:${log.level}:${log.timestamp.getTime()}:${log.id}`;
      pipeline.setex(key, log.retentionDays * 24 * 60 * 60, JSON.stringify(log));
    }

    // Flush audit logs
    for (const audit of this.auditBuffer) {
      const key = `audit:${audit.resourceType}:${audit.resourceId}:${audit.timestamp.getTime()}:${audit.id}`;
      pipeline.setex(key, audit.retentionDays * 24 * 60 * 60, JSON.stringify(audit));
    }

    // Flush metrics
    for (const metrics of this.metricsBuffer) {
      const key = `metrics:${metrics.timestamp.getTime()}`;
      pipeline.setex(key, this.options.metricsRetentionDays * 24 * 60 * 60, JSON.stringify(metrics));
    }

    try {
      await pipeline.exec();

      // Clear buffers
      this.logBuffer.length = 0;
      this.auditBuffer.length = 0;
      this.metricsBuffer.length = 0;

    } catch (error) {
      console.error('Failed to flush logs to Redis:', error);
      throw error;
    }
  }

  /**
   * Shutdown the logger
   */
  async shutdown(): Promise<void> {
    clearInterval(this.flushTimer);
    this.performanceCollector.stop();
    
    // Final flush
    await this.flush();
    
    this.removeAllListeners();
    console.log('Healthcare AI Logger shut down successfully');
  }

  private log(
    level: LogLevel,
    source: string,
    message: string,
    data?: Record<string, unknown>,
    context?: SecurityContext,
    correlationId?: string
  ): void {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      source,
      message,
      data,
      userId: context?.userId,
      sessionId: context?.sessionId,
      correlationId: correlationId || context?.sessionId,
      complianceLevel: context ? this.determineComplianceLevel(context.dataClassifications) : 'public',
      encryptedData: undefined, // Regular logs don't encrypt data unless specified
      dataHash: this.generateDataHash({ message, data }),
      retentionDays: this.getRetentionDays(level, context)
    };

    this.logBuffer.push(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'critical' || level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${source}: ${message}`, data);
    }

    // Emit log event
    this.emit('log', entry);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    const currentLevelIndex = levels.indexOf(this.options.logLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  private severityToLogLevel(severity: EventSeverity): LogLevel {
    switch (severity) {
      case 'info': return 'info';
      case 'warning': return 'warn';
      case 'error': return 'error';
      case 'critical': return 'critical';
      default: return 'info';
    }
  }

  private determineComplianceLevel(dataClassifications: DataClassification[]): ComplianceLevel {
    if (dataClassifications.includes('phi') || dataClassifications.includes('pii')) {
      return 'restricted';
    }
    if (dataClassifications.includes('confidential')) {
      return 'confidential';
    }
    if (dataClassifications.includes('internal')) {
      return 'internal';
    }
    return 'public';
  }

  private getRetentionDays(level: LogLevel, context?: SecurityContext): number {
    // Healthcare compliance requires longer retention for audit logs
    if (context && context.auditRequired) {
      return this.options.auditRetentionDays;
    }

    // Critical and error logs kept longer
    switch (level) {
      case 'critical': return this.options.auditRetentionDays;
      case 'error': return Math.min(this.options.auditRetentionDays, 365);
      case 'warn': return 90;
      case 'info': return 30;
      case 'debug': return 7;
      default: return 30;
    }
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDataHash(data: any): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private generateSearchKey(query: any): string {
    return createHash('md5').update(JSON.stringify(query)).digest('hex');
  }

  private async encryptSensitiveData(data: any): Promise<string> {
    // In a real implementation, this would use proper encryption
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private calculateRiskScore(action: AuditAction, resourceType: string, context: SecurityContext): number {
    let score = 0;

    // Base risk by action type
    switch (action) {
      case 'delete': score += 8; break;
      case 'modify': score += 6; break;
      case 'create': score += 4; break;
      case 'update': score += 4; break;
      case 'execute': score += 5; break;
      case 'access': score += 2; break;
      case 'read': score += 1; break;
      case 'export': score += 7; break;
    }

    // Risk by data classification
    if (context.dataClassifications.includes('phi')) score += 3;
    if (context.dataClassifications.includes('pii')) score += 2;
    if (context.dataClassifications.includes('confidential')) score += 2;

    // Risk by encryption level
    if (context.encryptionLevel === 'none') score += 2;

    return Math.min(10, score);
  }

  private assessComplianceImpact(
    action: AuditAction,
    resourceType: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ): boolean {
    // High-risk actions always have compliance impact
    if (['delete', 'export', 'modify'].includes(action)) {
      return true;
    }

    // Check for sensitive data changes
    if (beforeState && afterState) {
      const sensitiveFields = ['ssn', 'dob', 'medical_record', 'diagnosis', 'prescription'];
      const hasChangeInSensitiveField = sensitiveFields.some(field => 
        beforeState[field] !== afterState[field]
      );
      
      if (hasChangeInSensitiveField) {
        return true;
      }
    }

    return false;
  }

  private matchesQuery(log: LogEntry, query: any): boolean {
    if (query.level && log.level !== query.level) return false;
    if (query.source && log.source !== query.source) return false;
    if (query.userId && log.userId !== query.userId) return false;
    if (query.sessionId && log.sessionId !== query.sessionId) return false;
    if (query.fromDate && log.timestamp < query.fromDate) return false;
    if (query.toDate && log.timestamp > query.toDate) return false;
    if (query.keyword && !log.message.toLowerCase().includes(query.keyword.toLowerCase())) return false;

    return true;
  }

  private checkPerformanceAlerts(snapshot: MetricsSnapshot): void {
    const { systemMetrics, securityMetrics, complianceMetrics } = snapshot;

    // CPU usage alert
    if (systemMetrics.cpuUsage > 0.8) {
      this.warn('High CPU usage detected', { cpuUsage: systemMetrics.cpuUsage });
    }

    // Memory usage alert
    if (systemMetrics.memoryUsage > 0.85) {
      this.error('High memory usage detected', { memoryUsage: systemMetrics.memoryUsage });
    }

    // Security threat level alert
    if (securityMetrics.threatLevel === 'critical' || securityMetrics.threatLevel === 'high') {
      this.critical('High security threat level detected', { threatLevel: securityMetrics.threatLevel });
    }

    // Compliance violation alert
    if (complianceMetrics.hipaaViolations > 0 || complianceMetrics.gdprViolations > 0) {
      this.critical('Compliance violations detected', {
        hipaaViolations: complianceMetrics.hipaaViolations,
        gdprViolations: complianceMetrics.gdprViolations
      });
    }
  }

  private async getComplianceViolations(fromDate: Date, toDate: Date): Promise<ComplianceViolation[]> {
    // In a real implementation, this would query a dedicated compliance violations store
    const auditLogs = await this.searchLogs({
      source: 'audit',
      fromDate,
      toDate
    }) as AuditLogEntry[];

    return auditLogs
      .filter(log => log.complianceImpact && log.riskScore > 7)
      .map(log => ({
        id: log.id,
        type: 'audit-violation' as any,
        severity: log.level === 'critical' ? 'critical' as any : 'high' as any,
        description: log.message,
        affectedData: log.data ? Object.keys(log.data) : [],
        detectedAt: log.timestamp,
        resolvedAt: undefined,
        remediation: []
      }));
  }

  private generateComplianceRecommendations(
    auditLogs: AuditLogEntry[],
    violations: ComplianceViolation[]
  ): string[] {
    const recommendations: string[] = [];

    // High risk score recommendation
    const averageRiskScore = auditLogs.reduce((sum, log) => sum + log.riskScore, 0) / auditLogs.length;
    if (averageRiskScore > 6) {
      recommendations.push('Consider implementing additional access controls to reduce risk scores');
    }

    // Compliance violations recommendation
    if (violations.length > 0) {
      recommendations.push('Address all compliance violations to maintain regulatory compliance');
    }

    // Data access pattern recommendations
    const highRiskActions = auditLogs.filter(log => log.riskScore > 7);
    if (highRiskActions.length > auditLogs.length * 0.1) {
      recommendations.push('Review high-risk actions and consider implementing approval workflows');
    }

    return recommendations;
  }
}

/**
 * Performance metrics collector
 */
class PerformanceCollector {
  private startTime = Date.now();
  private readonly metrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    queueDepth: 0,
    cacheHitRate: 0.95,
    errorRate: 0,
    throughput: 0
  };

  start(): void {
    // In a real implementation, this would collect actual system metrics
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  stop(): void {
    // Clean up any monitoring resources
  }

  collectSystemMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  private updateMetrics(): void {
    // Simulate metric collection (replace with actual implementation)
    this.metrics.cpuUsage = Math.random() * 0.5 + 0.2; // 20-70%
    this.metrics.memoryUsage = Math.random() * 0.4 + 0.3; // 30-70%
    this.metrics.diskUsage = Math.random() * 0.2 + 0.4; // 40-60%
    this.metrics.networkLatency = Math.random() * 50 + 10; // 10-60ms
    this.metrics.activeConnections = Math.floor(Math.random() * 100) + 10;
    this.metrics.queueDepth = Math.floor(Math.random() * 10);
    this.metrics.errorRate = Math.random() * 0.02; // 0-2%
    this.metrics.throughput = Math.random() * 1000 + 500; // 500-1500 ops/sec
  }
}

/**
 * Compliance monitoring system
 */
class ComplianceMonitor {
  private readonly options: HealthcareLoggerOptions;
  private complianceMetrics: ComplianceMetrics;
  private securityMetrics: SecurityMetrics;

  constructor(options: HealthcareLoggerOptions) {
    this.options = options;
    this.complianceMetrics = this.initializeComplianceMetrics();
    this.securityMetrics = this.initializeSecurityMetrics();
  }

  getMetrics(): ComplianceMetrics {
    return { ...this.complianceMetrics };
  }

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics };
  }

  private initializeComplianceMetrics(): ComplianceMetrics {
    return {
      hipaaViolations: 0,
      gdprViolations: 0,
      encryptionCompliance: 1.0,
      auditTrailIntegrity: 1.0,
      dataRetentionCompliance: 1.0,
      accessControlViolations: 0,
      lastComplianceCheck: new Date()
    };
  }

  private initializeSecurityMetrics(): SecurityMetrics {
    return {
      failedAuthAttempts: 0,
      suspiciousActivities: 0,
      dataBreachAttempts: 0,
      encryptionFailures: 0,
      accessControlFailures: 0,
      threatLevel: 'low',
      lastSecurityScan: new Date()
    };
  }
}

export default HealthcareAILogger;