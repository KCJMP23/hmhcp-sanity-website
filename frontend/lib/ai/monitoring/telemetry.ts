/**
 * Comprehensive Telemetry System for Healthcare AI Platform
 * 
 * Features:
 * - Distributed tracing with OpenTelemetry compatibility
 * - Healthcare-specific audit trails and compliance tracking
 * - Performance profiling for AI operations
 * - Context propagation across microservices
 * - PHI data flow monitoring
 * 
 * @author HMHCP Development Team
 * @version 1.0.0
 */

import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';

// OpenTelemetry-compatible interfaces
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
  traceState?: string;
  baggage?: Record<string, string>;
}

interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | boolean[];
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: SpanAttributes;
}

// Healthcare-specific telemetry types
interface HealthcareTelemetryContext {
  patientId?: string;
  encounterId?: string;
  clinicalWorkflowId?: string;
  phiDataLevel: 'none' | 'limited' | 'full';
  complianceFlags: string[];
  emergencyContext?: boolean;
  clinicalDecisionPoint?: string;
}

interface PerformanceProfile {
  cpuUsage: number;
  memoryUsage: number;
  heapUsed: number;
  heapTotal: number;
  eventLoopLag: number;
  gcStats: {
    collections: number;
    duration: number;
  };
  databaseQueries: {
    count: number;
    totalDuration: number;
    slowestQuery: number;
  };
  aiOperations: {
    inferenceTime: number;
    modelLoadTime: number;
    tokenProcessed: number;
  };
}

interface TelemetryConfiguration {
  serviceName: string;
  serviceVersion: string;
  environment: 'development' | 'staging' | 'production';
  samplingRate: number;
  enablePerformanceProfiling: boolean;
  enableHealthcareAudit: boolean;
  exportInterval: number;
  maxSpansPerTrace: number;
  jaegerEndpoint?: string;
  customAttributes: SpanAttributes;
}

// Span status and kind enums
enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

/**
 * Distributed tracing span implementation
 */
class TelemetrySpan {
  private readonly _traceId: string;
  private readonly _spanId: string;
  private readonly _parentSpanId?: string;
  private readonly _startTime: number;
  private readonly _kind: SpanKind;
  private readonly _name: string;
  private _endTime?: number;
  private _status: SpanStatus;
  private _attributes: SpanAttributes;
  private _events: SpanEvent[];
  private _links: SpanLink[];
  private _healthcareContext?: HealthcareTelemetryContext;

  constructor(
    name: string,
    context: TraceContext,
    kind: SpanKind = SpanKind.INTERNAL,
    healthcareContext?: HealthcareTelemetryContext
  ) {
    this._name = name;
    this._traceId = context.traceId;
    this._spanId = context.spanId;
    this._parentSpanId = context.parentSpanId;
    this._startTime = performance.now();
    this._kind = kind;
    this._status = { code: SpanStatusCode.UNSET };
    this._attributes = {};
    this._events = [];
    this._links = [];
    this._healthcareContext = healthcareContext;

    // Add healthcare-specific attributes
    if (healthcareContext) {
      this._attributes['healthcare.phi_level'] = healthcareContext.phiDataLevel;
      this._attributes['healthcare.compliance_flags'] = healthcareContext.complianceFlags.join(',');
      if (healthcareContext.emergencyContext) {
        this._attributes['healthcare.emergency'] = true;
      }
    }
  }

  // Span lifecycle methods
  public setAttributes(attributes: SpanAttributes): void {
    Object.assign(this._attributes, attributes);
  }

  public setAttribute(key: string, value: string | number | boolean): void {
    this._attributes[key] = value;
  }

  public addEvent(name: string, attributes?: SpanAttributes): void {
    this._events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
  }

  public addLink(traceId: string, spanId: string, attributes?: SpanAttributes): void {
    this._links.push({ traceId, spanId, attributes });
  }

  public setStatus(status: SpanStatus): void {
    this._status = status;
  }

  public recordException(exception: Error): void {
    this.addEvent('exception', {
      'exception.type': exception.constructor.name,
      'exception.message': exception.message,
      'exception.stacktrace': exception.stack || '',
    });
    this.setStatus({
      code: SpanStatusCode.ERROR,
      message: exception.message,
    });
  }

  public end(): void {
    this._endTime = performance.now();
  }

  // Healthcare-specific methods
  public recordPhiAccess(dataType: string, accessReason: string): void {
    this.addEvent('phi_access', {
      'phi.data_type': dataType,
      'phi.access_reason': accessReason,
      'phi.timestamp': new Date().toISOString(),
    });
  }

  public recordClinicalDecision(decisionPoint: string, outcome: string): void {
    this.addEvent('clinical_decision', {
      'clinical.decision_point': decisionPoint,
      'clinical.outcome': outcome,
      'clinical.timestamp': new Date().toISOString(),
    });
  }

  public recordComplianceCheckpoint(checkpoint: string, status: 'pass' | 'fail' | 'warning'): void {
    this.addEvent('compliance_checkpoint', {
      'compliance.checkpoint': checkpoint,
      'compliance.status': status,
      'compliance.timestamp': new Date().toISOString(),
    });
  }

  // Getters for span data
  public get traceId(): string { return this._traceId; }
  public get spanId(): string { return this._spanId; }
  public get parentSpanId(): string | undefined { return this._parentSpanId; }
  public get name(): string { return this._name; }
  public get startTime(): number { return this._startTime; }
  public get endTime(): number | undefined { return this._endTime; }
  public get duration(): number | undefined {
    return this._endTime ? this._endTime - this._startTime : undefined;
  }
  public get status(): SpanStatus { return this._status; }
  public get attributes(): SpanAttributes { return { ...this._attributes }; }
  public get events(): SpanEvent[] { return [...this._events]; }
  public get links(): SpanLink[] { return [...this._links]; }
  public get healthcareContext(): HealthcareTelemetryContext | undefined {
    return this._healthcareContext;
  }

  // Export span data in Jaeger format
  public toJaegerFormat(): any {
    return {
      traceID: this._traceId,
      spanID: this._spanId,
      parentSpanID: this._parentSpanId,
      operationName: this._name,
      startTime: this._startTime * 1000, // Convert to microseconds
      duration: this.duration ? this.duration * 1000 : 0,
      tags: Object.entries(this._attributes).map(([key, value]) => ({
        key,
        type: typeof value === 'string' ? 'string' : 'number',
        value: String(value),
      })),
      logs: this._events.map(event => ({
        timestamp: event.timestamp * 1000,
        fields: [
          { key: 'event', value: event.name },
          ...Object.entries(event.attributes || {}).map(([key, value]) => ({
            key,
            value: String(value),
          })),
        ],
      })),
      process: {
        serviceName: 'hmhcp-telemetry',
        tags: [],
      },
    };
  }
}

/**
 * Performance profiler for AI operations
 */
class PerformanceProfiler {
  private readonly _profiles: Map<string, PerformanceProfile> = new Map();
  private _gcStats = { collections: 0, duration: 0 };
  private _queryStats = { count: 0, totalDuration: 0, slowestQuery: 0 };
  private _aiStats = { inferenceTime: 0, modelLoadTime: 0, tokenProcessed: 0 };

  constructor() {
    // Monitor garbage collection if available
    if (global.gc) {
      const originalGc = global.gc;
      global.gc = () => {
        const start = performance.now();
        originalGc();
        this._gcStats.collections++;
        this._gcStats.duration += performance.now() - start;
      };
    }
  }

  public startProfiling(operationId: string): void {
    const profile: PerformanceProfile = {
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      eventLoopLag: this._measureEventLoopLag(),
      gcStats: { ...this._gcStats },
      databaseQueries: { ...this._queryStats },
      aiOperations: { ...this._aiStats },
    };

    this._profiles.set(operationId, profile);
  }

  public endProfiling(operationId: string): PerformanceProfile | null {
    const startProfile = this._profiles.get(operationId);
    if (!startProfile) return null;

    const endCpu = process.cpuUsage().user / 1000000;
    const endMemory = process.memoryUsage();

    const finalProfile: PerformanceProfile = {
      cpuUsage: endCpu - startProfile.cpuUsage,
      memoryUsage: endMemory.rss - startProfile.memoryUsage,
      heapUsed: endMemory.heapUsed - startProfile.heapUsed,
      heapTotal: endMemory.heapTotal,
      eventLoopLag: this._measureEventLoopLag(),
      gcStats: {
        collections: this._gcStats.collections - startProfile.gcStats.collections,
        duration: this._gcStats.duration - startProfile.gcStats.duration,
      },
      databaseQueries: {
        count: this._queryStats.count - startProfile.databaseQueries.count,
        totalDuration: this._queryStats.totalDuration - startProfile.databaseQueries.totalDuration,
        slowestQuery: Math.max(this._queryStats.slowestQuery, startProfile.databaseQueries.slowestQuery),
      },
      aiOperations: {
        inferenceTime: this._aiStats.inferenceTime - startProfile.aiOperations.inferenceTime,
        modelLoadTime: this._aiStats.modelLoadTime - startProfile.aiOperations.modelLoadTime,
        tokenProcessed: this._aiStats.tokenProcessed - startProfile.aiOperations.tokenProcessed,
      },
    };

    this._profiles.delete(operationId);
    return finalProfile;
  }

  public recordDatabaseQuery(duration: number): void {
    this._queryStats.count++;
    this._queryStats.totalDuration += duration;
    this._queryStats.slowestQuery = Math.max(this._queryStats.slowestQuery, duration);
  }

  public recordAiOperation(
    inferenceTime: number,
    modelLoadTime: number = 0,
    tokensProcessed: number = 0
  ): void {
    this._aiStats.inferenceTime += inferenceTime;
    this._aiStats.modelLoadTime += modelLoadTime;
    this._aiStats.tokenProcessed += tokensProcessed;
  }

  private _measureEventLoopLag(): number {
    const start = performance.now();
    return new Promise<number>((resolve) => {
      // Use setTimeout with 0 delay for cross-platform compatibility
      setTimeout(() => {
        resolve(performance.now() - start);
      }, 0);
    }) as any; // Simplified for synchronous usage
  }
}

/**
 * Main telemetry system class
 */
export class TelemetrySystem {
  private readonly _config: TelemetryConfiguration;
  private readonly _activeSpans: Map<string, TelemetrySpan> = new Map();
  private readonly _completedSpans: TelemetrySpan[] = [];
  private readonly _profiler: PerformanceProfiler;
  private _currentContext: TraceContext | null = null;
  private _exportTimer?: NodeJS.Timeout;

  constructor(config: Partial<TelemetryConfiguration> = {}) {
    this._config = {
      serviceName: 'hmhcp-ai-platform',
      serviceVersion: '1.0.0',
      environment: 'development',
      samplingRate: 1.0,
      enablePerformanceProfiling: true,
      enableHealthcareAudit: true,
      exportInterval: 30000, // 30 seconds
      maxSpansPerTrace: 1000,
      customAttributes: {},
      ...config,
    };

    this._profiler = new PerformanceProfiler();
    this._startExportTimer();
  }

  // Context management
  public createTraceContext(parentContext?: TraceContext): TraceContext {
    const traceId = parentContext?.traceId || this._generateTraceId();
    const spanId = this._generateSpanId();

    return {
      traceId,
      spanId,
      parentSpanId: parentContext?.spanId,
      traceFlags: 1, // Sampled
      baggage: parentContext?.baggage || {},
    };
  }

  public setCurrentContext(context: TraceContext): void {
    this._currentContext = context;
  }

  public getCurrentContext(): TraceContext | null {
    return this._currentContext;
  }

  public propagateContext(baggage: Record<string, string>): void {
    if (this._currentContext) {
      this._currentContext.baggage = {
        ...this._currentContext.baggage,
        ...baggage,
      };
    }
  }

  // Span management
  public startSpan(
    name: string,
    kind: SpanKind = SpanKind.INTERNAL,
    healthcareContext?: HealthcareTelemetryContext,
    parentContext?: TraceContext
  ): TelemetrySpan {
    const context = parentContext || this.createTraceContext(this._currentContext || undefined);
    const span = new TelemetrySpan(name, context, kind, healthcareContext);

    // Apply sampling
    if (!this._shouldSample()) {
      return span; // Return non-recording span
    }

    // Add service attributes
    span.setAttributes({
      'service.name': this._config.serviceName,
      'service.version': this._config.serviceVersion,
      'service.environment': this._config.environment,
      ...this._config.customAttributes,
    });

    this._activeSpans.set(span.spanId, span);
    this.setCurrentContext(context);

    // Start performance profiling if enabled
    if (this._config.enablePerformanceProfiling) {
      this._profiler.startProfiling(span.spanId);
    }

    return span;
  }

  public finishSpan(span: TelemetrySpan): void {
    span.end();
    this._activeSpans.delete(span.spanId);

    // Add performance profile if available
    if (this._config.enablePerformanceProfiling) {
      const profile = this._profiler.endProfiling(span.spanId);
      if (profile) {
        span.setAttributes({
          'performance.cpu_usage': profile.cpuUsage,
          'performance.memory_usage': profile.memoryUsage,
          'performance.heap_used': profile.heapUsed,
          'performance.event_loop_lag': profile.eventLoopLag,
          'performance.gc_collections': profile.gcStats.collections,
          'performance.gc_duration': profile.gcStats.duration,
          'performance.db_queries': profile.databaseQueries.count,
          'performance.db_duration': profile.databaseQueries.totalDuration,
          'performance.ai_inference_time': profile.aiOperations.inferenceTime,
          'performance.ai_tokens_processed': profile.aiOperations.tokenProcessed,
        });
      }
    }

    this._completedSpans.push(span);

    // Limit span storage
    if (this._completedSpans.length > this._config.maxSpansPerTrace) {
      this._completedSpans.shift();
    }
  }

  // Automatic instrumentation decorator
  public instrument<T extends (...args: any[]) => any>(
    operationName: string,
    kind: SpanKind = SpanKind.INTERNAL,
    healthcareContext?: HealthcareTelemetryContext
  ) {
    return (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => {
      const method = descriptor.value!;
      
      descriptor.value = (async function (this: any, ...args: any[]) {
        const span = this.startSpan(
          `${target.constructor.name}.${operationName}`,
          kind,
          healthcareContext
        );

        try {
          span.setAttributes({
            'method.name': propertyName,
            'method.class': target.constructor.name,
          });

          const result = await method.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.recordException(error as Error);
          throw error;
        } finally {
          this.finishSpan(span);
        }
      } as T);

      return descriptor;
    };
  }

  // Healthcare-specific monitoring
  public tracePhiDataAccess(
    operationName: string,
    patientId: string,
    dataType: string,
    accessReason: string
  ): TelemetrySpan {
    const healthcareContext: HealthcareTelemetryContext = {
      patientId,
      phiDataLevel: 'full',
      complianceFlags: ['PHI_ACCESS', 'AUDIT_REQUIRED'],
    };

    const span = this.startSpan(
      `phi_access.${operationName}`,
      SpanKind.INTERNAL,
      healthcareContext
    );

    span.recordPhiAccess(dataType, accessReason);
    return span;
  }

  public traceClinicalWorkflow(
    workflowName: string,
    encounterId: string,
    emergencyContext: boolean = false
  ): TelemetrySpan {
    const healthcareContext: HealthcareTelemetryContext = {
      encounterId,
      clinicalWorkflowId: randomUUID(),
      phiDataLevel: 'full',
      complianceFlags: ['CLINICAL_WORKFLOW', 'DECISION_SUPPORT'],
      emergencyContext,
    };

    return this.startSpan(
      `clinical_workflow.${workflowName}`,
      SpanKind.SERVER,
      healthcareContext
    );
  }

  // Performance monitoring integration
  public recordDatabaseQuery(duration: number): void {
    this._profiler.recordDatabaseQuery(duration);
  }

  public recordAiOperation(
    inferenceTime: number,
    modelLoadTime?: number,
    tokensProcessed?: number
  ): void {
    this._profiler.recordAiOperation(inferenceTime, modelLoadTime, tokensProcessed);
  }

  // Export and visualization
  public exportTraces(): any[] {
    return this._completedSpans.map(span => span.toJaegerFormat());
  }

  public getActiveSpans(): TelemetrySpan[] {
    return Array.from(this._activeSpans.values());
  }

  public getCompletedSpans(): TelemetrySpan[] {
    return [...this._completedSpans];
  }

  public getTraceStatistics(): any {
    const totalSpans = this._completedSpans.length;
    const errorSpans = this._completedSpans.filter(
      span => span.status.code === SpanStatusCode.ERROR
    ).length;
    const avgDuration = this._completedSpans.reduce(
      (acc, span) => acc + (span.duration || 0), 0
    ) / totalSpans;

    return {
      totalSpans,
      errorSpans,
      errorRate: errorSpans / totalSpans,
      avgDuration,
      activeSpans: this._activeSpans.size,
    };
  }

  // Cleanup and shutdown
  public shutdown(): void {
    if (this._exportTimer) {
      clearInterval(this._exportTimer);
    }
    
    // Finish all active spans
    for (const span of this._activeSpans.values()) {
      this.finishSpan(span);
    }
    
    // Final export
    this._exportTraces();
  }

  // Private helper methods
  private _generateTraceId(): string {
    return randomUUID().replace(/-/g, '');
  }

  private _generateSpanId(): string {
    return randomUUID().replace(/-/g, '').substring(0, 16);
  }

  private _shouldSample(): boolean {
    return Math.random() < this._config.samplingRate;
  }

  private _startExportTimer(): void {
    this._exportTimer = setInterval(() => {
      this._exportTraces();
    }, this._config.exportInterval);
  }

  private _exportTraces(): void {
    if (this._completedSpans.length === 0) return;

    const traces = this.exportTraces();
    
    // In production, export to Jaeger or other tracing backend
    if (this._config.environment === 'production' && this._config.jaegerEndpoint) {
      this._sendToJaeger(traces);
    } else {
      // Development: log to console
      console.log('[TELEMETRY] Exported traces:', traces.length);
    }

    // Clear exported spans
    this._completedSpans.length = 0;
  }

  private async _sendToJaeger(traces: any[]): Promise<void> {
    if (!this._config.jaegerEndpoint) return;

    try {
      const response = await fetch(`${this._config.jaegerEndpoint}/api/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: traces,
        }),
      });

      if (!response.ok) {
        console.error('[TELEMETRY] Failed to export traces:', response.statusText);
      }
    } catch (error) {
      console.error('[TELEMETRY] Export error:', error);
    }
  }
}

// Global telemetry instance
let globalTelemetry: TelemetrySystem | null = null;

export function initializeTelemetry(config?: Partial<TelemetryConfiguration>): TelemetrySystem {
  if (!globalTelemetry) {
    globalTelemetry = new TelemetrySystem(config);
  }
  return globalTelemetry;
}

export function getTelemetry(): TelemetrySystem {
  if (!globalTelemetry) {
    globalTelemetry = new TelemetrySystem();
  }
  return globalTelemetry;
}

// Export types and enums
export {
  TelemetrySpan,
  PerformanceProfiler,
  SpanKind,
  SpanStatusCode,
  type TraceContext,
  type SpanAttributes,
  type SpanEvent,
  type SpanStatus,
  type HealthcareTelemetryContext,
  type PerformanceProfile,
  type TelemetryConfiguration,
};

// Utility functions for common patterns
export function withTelemetry<T>(
  operationName: string,
  operation: (span: TelemetrySpan) => Promise<T>,
  healthcareContext?: HealthcareTelemetryContext
): Promise<T> {
  const telemetry = getTelemetry();
  const span = telemetry.startSpan(operationName, SpanKind.INTERNAL, healthcareContext);

  return operation(span)
    .then(result => {
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    })
    .catch(error => {
      span.recordException(error);
      throw error;
    })
    .finally(() => {
      telemetry.finishSpan(span);
    });
}

export function withHealthcareTelemetry<T>(
  operationName: string,
  patientId: string,
  operation: (span: TelemetrySpan) => Promise<T>
): Promise<T> {
  const healthcareContext: HealthcareTelemetryContext = {
    patientId,
    phiDataLevel: 'full',
    complianceFlags: ['PHI_ACCESS', 'AUDIT_REQUIRED'],
  };

  return withTelemetry(operationName, operation, healthcareContext);
}