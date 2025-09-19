import { EventEmitter } from 'events';
import { WorkflowDefinition, WorkflowNode } from '../types/workflows/visual-builder';

export interface Breakpoint {
  id: string;
  nodeId: string;
  enabled: boolean;
  condition?: string;
  hitCount: number;
  createdAt: Date;
  lastHit?: Date;
}

export interface VariableWatch {
  id: string;
  name: string;
  expression?: string;
  enabled: boolean;
  value?: any;
  type?: string;
  lastUpdated?: Date;
}

export interface DebugSession {
  id: string;
  workflowId: string;
  executionId: string;
  isActive: boolean;
  breakpoints: Map<string, Breakpoint>;
  watches: Map<string, VariableWatch>;
  callStack: CallStackFrame[];
  currentStep: number;
  totalSteps: number;
  variables: Map<string, any>;
  logs: DebugLog[];
  createdAt: Date;
  lastActivity: Date;
}

export interface CallStackFrame {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  variables: Map<string, any>;
  timestamp: Date;
  depth: number;
}

export interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
  nodeName?: string;
  data?: any;
  stackTrace?: string;
}

export interface StepResult {
  success: boolean;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  variables: Map<string, any>;
  output?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface ExecutionTrace {
  id: string;
  workflowId: string;
  executionId: string;
  steps: StepResult[];
  totalDuration: number;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
}

export class WorkflowDebugManager extends EventEmitter {
  private sessions: Map<string, DebugSession> = new Map();
  private traces: Map<string, ExecutionTrace> = new Map();
  private globalBreakpoints: Map<string, Breakpoint> = new Map();
  private globalWatches: Map<string, VariableWatch> = new Map();

  /**
   * Create a new debug session
   */
  public createDebugSession(
    workflowId: string,
    executionId: string
  ): DebugSession {
    const sessionId = this.generateSessionId();
    const session: DebugSession = {
      id: sessionId,
      workflowId,
      executionId,
      isActive: true,
      breakpoints: new Map(),
      watches: new Map(),
      callStack: [],
      currentStep: 0,
      totalSteps: 0,
      variables: new Map(),
      logs: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    this.emit('session-created', sessionId, session);
    return session;
  }

  /**
   * Start debugging a workflow execution
   */
  public startDebugging(
    sessionId: string,
    workflow: WorkflowDefinition
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    // Initialize trace
    const trace: ExecutionTrace = {
      id: this.generateTraceId(),
      workflowId: workflow.id,
      executionId: session.executionId,
      steps: [],
      totalDuration: 0,
      startTime: new Date(),
      status: 'running'
    };

    this.traces.set(trace.id, trace);
    session.totalSteps = workflow.nodes.length;

    this.emit('debugging-started', sessionId, trace);
    return true;
  }

  /**
   * Add a breakpoint to a node
   */
  public addBreakpoint(
    sessionId: string,
    nodeId: string,
    condition?: string
  ): Breakpoint | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return null;
    }

    const breakpoint: Breakpoint = {
      id: this.generateBreakpointId(),
      nodeId,
      enabled: true,
      condition,
      hitCount: 0,
      createdAt: new Date()
    };

    session.breakpoints.set(breakpoint.id, breakpoint);
    this.emit('breakpoint-added', sessionId, breakpoint);
    return breakpoint;
  }

  /**
   * Remove a breakpoint
   */
  public removeBreakpoint(sessionId: string, breakpointId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const removed = session.breakpoints.delete(breakpointId);
    if (removed) {
      this.emit('breakpoint-removed', sessionId, breakpointId);
    }
    return removed;
  }

  /**
   * Toggle breakpoint enabled state
   */
  public toggleBreakpoint(sessionId: string, breakpointId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const breakpoint = session.breakpoints.get(breakpointId);
    if (!breakpoint) {
      return false;
    }

    breakpoint.enabled = !breakpoint.enabled;
    this.emit('breakpoint-toggled', sessionId, breakpoint);
    return true;
  }

  /**
   * Add a variable watch
   */
  public addWatch(
    sessionId: string,
    name: string,
    expression?: string
  ): VariableWatch | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return null;
    }

    const watch: VariableWatch = {
      id: this.generateWatchId(),
      name,
      expression,
      enabled: true,
      lastUpdated: new Date()
    };

    session.watches.set(watch.id, watch);
    this.emit('watch-added', sessionId, watch);
    return watch;
  }

  /**
   * Remove a variable watch
   */
  public removeWatch(sessionId: string, watchId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const removed = session.watches.delete(watchId);
    if (removed) {
      this.emit('watch-removed', sessionId, watchId);
    }
    return removed;
  }

  /**
   * Update variable watch values
   */
  public updateWatchValues(sessionId: string, variables: Map<string, any>): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return;
    }

    session.watches.forEach(watch => {
      if (watch.enabled) {
        if (watch.expression) {
          try {
            watch.value = this.evaluateExpression(watch.expression, variables);
          } catch (error) {
            watch.value = undefined;
          }
        } else {
          watch.value = variables.get(watch.name);
        }
        watch.type = typeof watch.value;
        watch.lastUpdated = new Date();
      }
    });

    this.emit('watch-values-updated', sessionId, session.watches);
  }

  /**
   * Step through execution
   */
  public stepOver(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    session.currentStep++;
    session.lastActivity = new Date();
    this.emit('step-over', sessionId, session.currentStep);
    return true;
  }

  /**
   * Step into execution (for nested workflows)
   */
  public stepInto(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    session.currentStep++;
    session.lastActivity = new Date();
    this.emit('step-into', sessionId, session.currentStep);
    return true;
  }

  /**
   * Step out of current execution context
   */
  public stepOut(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    session.currentStep++;
    session.lastActivity = new Date();
    this.emit('step-out', sessionId, session.currentStep);
    return true;
  }

  /**
   * Continue execution until next breakpoint
   */
  public continue(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    this.emit('continue', sessionId);
    return true;
  }

  /**
   * Pause execution
   */
  public pause(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    this.emit('pause', sessionId);
    return true;
  }

  /**
   * Stop debugging session
   */
  public stopDebugging(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.isActive = false;
    session.lastActivity = new Date();

    // Update trace status
    const trace = Array.from(this.traces.values())
      .find(t => t.executionId === session.executionId);
    if (trace) {
      trace.status = 'completed';
      trace.endTime = new Date();
      trace.totalDuration = trace.endTime.getTime() - trace.startTime.getTime();
    }

    this.emit('debugging-stopped', sessionId);
    return true;
  }

  /**
   * Add debug log entry
   */
  public addLog(
    sessionId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    nodeId?: string,
    nodeName?: string,
    data?: any,
    stackTrace?: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return;
    }

    const log: DebugLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      nodeId,
      nodeName,
      data,
      stackTrace
    };

    session.logs.push(log);
    this.emit('log-added', sessionId, log);
  }

  /**
   * Update call stack
   */
  public updateCallStack(
    sessionId: string,
    node: WorkflowNode,
    variables: Map<string, any>,
    depth: number = 0
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return;
    }

    const frame: CallStackFrame = {
      nodeId: node.id,
      nodeName: node.data.label || node.type,
      nodeType: node.type,
      variables: new Map(variables),
      timestamp: new Date(),
      depth
    };

    // Remove frames at same or deeper depth
    session.callStack = session.callStack.filter(f => f.depth < depth);
    session.callStack.push(frame);

    this.emit('call-stack-updated', sessionId, session.callStack);
  }

  /**
   * Record execution step
   */
  public recordStep(
    sessionId: string,
    step: StepResult
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return;
    }

    const trace = Array.from(this.traces.values())
      .find(t => t.executionId === session.executionId);
    if (trace) {
      trace.steps.push(step);
      this.emit('step-recorded', sessionId, step);
    }
  }

  /**
   * Check if execution should break at current node
   */
  public shouldBreak(
    sessionId: string,
    nodeId: string,
    variables: Map<string, any>
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const breakpoints = Array.from(session.breakpoints.values())
      .filter(bp => bp.enabled && bp.nodeId === nodeId);

    for (const breakpoint of breakpoints) {
      if (breakpoint.condition) {
        try {
          const shouldBreak = this.evaluateExpression(breakpoint.condition, variables);
          if (shouldBreak) {
            breakpoint.hitCount++;
            breakpoint.lastHit = new Date();
            this.emit('breakpoint-hit', sessionId, breakpoint, nodeId);
            return true;
          }
        } catch (error) {
          this.addLog(sessionId, 'error', `Breakpoint condition error: ${error}`, nodeId);
        }
      } else {
        breakpoint.hitCount++;
        breakpoint.lastHit = new Date();
        this.emit('breakpoint-hit', sessionId, breakpoint, nodeId);
        return true;
      }
    }

    return false;
  }

  /**
   * Get debug session
   */
  public getSession(sessionId: string): DebugSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get execution trace
   */
  public getTrace(traceId: string): ExecutionTrace | null {
    return this.traces.get(traceId) || null;
  }

  /**
   * Get all sessions
   */
  public getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get all traces
   */
  public getAllTraces(): ExecutionTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Clear debug session
   */
  public clearSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.breakpoints.clear();
    session.watches.clear();
    session.callStack = [];
    session.logs = [];
    session.variables.clear();

    this.emit('session-cleared', sessionId);
    return true;
  }

  /**
   * Clean up old sessions and traces
   */
  public cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);

    // Clean up old sessions
    for (const [id, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoff) {
        this.sessions.delete(id);
      }
    }

    // Clean up old traces
    for (const [id, trace] of this.traces.entries()) {
      if (trace.startTime < cutoff) {
        this.traces.delete(id);
      }
    }

    this.emit('cleanup-completed', { sessions: this.sessions.size, traces: this.traces.size });
  }

  /**
   * Evaluate expression for breakpoint conditions and watches
   */
  private evaluateExpression(expression: string, variables: Map<string, any>): any {
    // Simple expression evaluator - in production, use a proper expression parser
    try {
      // Create a safe evaluation context
      const context = Object.fromEntries(variables);
      const func = new Function('variables', `with (variables) { return ${expression}; }`);
      return func(context);
    } catch (error) {
      throw new Error(`Expression evaluation error: ${error}`);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `debug-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique breakpoint ID
   */
  private generateBreakpointId(): string {
    return `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique watch ID
   */
  private generateWatchId(): string {
    return `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
