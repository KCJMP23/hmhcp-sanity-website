/**
 * Healthcare AI Orchestrator
 * Microsoft Copilot-style AI orchestration system for healthcare applications
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import HealthcareAgentRegistry from './agent-registry';
import HealthcareAILogger from './logger';
import { orchestratorConfig, validateConfig } from './config';
import type {
  OrchestratorConfig,
  OrchestratorState,
  WorkflowTask,
  TaskStatus,
  TaskResult,
  TaskError,
  AgentConfiguration,
  AgentInstance,
  SecurityContext,
  ComplianceStatus,
  CollaborationContext,
  OrchestratorEvent,
  OrchestratorMetrics,
  SessionMetrics,
  WorkflowMetrics,
  PerformanceMetrics,
  TaskType,
  TaskPriority,
  RecoveryStrategy,
  RecoveryAction
} from '../types/ai/orchestrator';

export interface OrchestratorOptions extends Partial<OrchestratorConfig> {
  enableRecovery?: boolean;
  enableCollaboration?: boolean;
  enableMetrics?: boolean;
  customRecoveryStrategies?: RecoveryStrategy[];
}

export class HealthcareAIOrchestrator extends EventEmitter {
  private readonly config: OrchestratorConfig;
  private readonly redis: Redis;
  private readonly agentRegistry: HealthcareAgentRegistry;
  private readonly logger: HealthcareAILogger;
  
  private orchestratorState: OrchestratorState;
  private readonly taskQueue = new Map<string, WorkflowTask>();
  private readonly activeTasks = new Map<string, WorkflowTask>();
  private readonly completedTasks = new Map<string, TaskResult>();
  private readonly taskHistory = new Map<string, WorkflowTask[]>();
  
  private readonly collaborationContexts = new Map<string, CollaborationContext>();
  private readonly recoveryStrategies: RecoveryStrategy[];
  
  private readonly metricsCollectionTimer: NodeJS.Timeout;
  private readonly taskProcessingTimer: NodeJS.Timeout;
  private readonly healthCheckTimer: NodeJS.Timeout;
  
  private isShuttingDown = false;

  constructor(options: OrchestratorOptions = {}) {
    super();
    
    // Merge configuration with defaults
    this.config = {
      ...orchestratorConfig,
      ...options,
      agents: options.agents || orchestratorConfig.agents
    };

    // Validate configuration
    if (!validateConfig(this.config)) {
      throw new Error('Invalid orchestrator configuration');
    }

    // Initialize Redis connection
    this.redis = new Redis(this.config.redis);

    // Initialize agent registry
    this.agentRegistry = new HealthcareAgentRegistry({
      redis: this.redis,
      healthCheckInterval: 30000, // 30 seconds
      maxIdleTime: 300000, // 5 minutes
      enableLoadBalancing: true,
      complianceValidation: this.config.compliance.hipaaEnabled
    });

    // Initialize logger
    this.logger = new HealthcareAILogger({
      redis: this.redis,
      logLevel: this.config.monitoring.logLevel,
      enableAuditLogging: this.config.security.auditLogging,
      enableComplianceMonitoring: this.config.compliance.hipaaEnabled,
      encryptSensitiveData: this.config.security.encryptionEnabled,
      auditRetentionDays: this.config.compliance.auditRetentionDays,
      metricsRetentionDays: 90,
      batchSize: 100,
      flushInterval: 10000 // 10 seconds
    });

    // Initialize orchestrator state
    this.orchestratorState = this.initializeState();

    // Initialize recovery strategies
    this.recoveryStrategies = [
      ...this.getDefaultRecoveryStrategies(),
      ...(options.customRecoveryStrategies || [])
    ];

    // Set up periodic tasks
    this.taskProcessingTimer = setInterval(() => this.processTaskQueue(), 1000);
    this.healthCheckTimer = setInterval(() => this.performHealthCheck(), 30000);
    
    if (options.enableMetrics !== false) {
      this.metricsCollectionTimer = setInterval(() => this.collectMetrics(), 60000);
    }

    // Set up event handlers
    this.setupEventHandlers();

    // Register default agents
    this.registerDefaultAgents();

    this.logger.info('Healthcare AI Orchestrator initialized successfully', {
      sessionId: this.orchestratorState.sessionId,
      agentCount: this.config.agents.length,
      hipaaEnabled: this.config.compliance.hipaaEnabled
    });
  }

  /**
   * Submit a workflow task to the orchestrator
   */
  async submitTask(
    task: Omit<WorkflowTask, 'id' | 'status' | 'createdAt'>,
    context?: SecurityContext
  ): Promise<string> {
    const taskId = uuidv4();
    
    const workflowTask: WorkflowTask = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: new Date()
    };

    // Validate task security requirements
    await this.validateTaskSecurity(workflowTask, context);

    // Add to task queue
    this.taskQueue.set(taskId, workflowTask);

    // Log task submission
    await this.logger.logAudit(
      'create',
      'workflow-task',
      taskId,
      `Task submitted: ${workflowTask.type}`,
      context || this.createDefaultSecurityContext(),
      undefined,
      { task: workflowTask }
    );

    this.logger.info('Task submitted to orchestrator', {
      taskId,
      type: workflowTask.type,
      priority: workflowTask.priority
    }, context);

    // Emit task creation event
    this.emit('task-created', {
      id: `task-created-${taskId}`,
      type: 'task-created',
      source: 'orchestrator',
      timestamp: new Date(),
      data: { taskId, task: workflowTask },
      severity: 'info',
      requiresResponse: false
    } as OrchestratorEvent);

    return taskId;
  }

  /**
   * Get task status and result
   */
  async getTaskStatus(taskId: string): Promise<{
    status: TaskStatus;
    result?: TaskResult;
    error?: TaskError;
    progress?: number;
  }> {
    // Check active tasks
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      return {
        status: activeTask.status,
        result: activeTask.result,
        error: activeTask.error,
        progress: this.calculateTaskProgress(activeTask)
      };
    }

    // Check completed tasks
    const completedResult = this.completedTasks.get(taskId);
    if (completedResult) {
      return {
        status: 'completed',
        result: completedResult,
        progress: 1.0
      };
    }

    // Check task queue
    const queuedTask = this.taskQueue.get(taskId);
    if (queuedTask) {
      return {
        status: queuedTask.status,
        result: queuedTask.result,
        error: queuedTask.error,
        progress: 0
      };
    }

    throw new Error(`Task ${taskId} not found`);
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, context?: SecurityContext): Promise<void> {
    const task = this.taskQueue.get(taskId) || this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === 'completed' || task.status === 'failed') {
      throw new Error(`Cannot cancel task ${taskId} - already ${task.status}`);
    }

    // Update task status
    task.status = 'cancelled';

    // Remove from queues
    this.taskQueue.delete(taskId);
    this.activeTasks.delete(taskId);

    // If task was assigned to an agent, free the agent
    if (task.assignedAgentId) {
      await this.agentRegistry.completeTaskForAgent(task.assignedAgentId, taskId, false);
    }

    // Log cancellation
    await this.logger.logAudit(
      'delete',
      'workflow-task',
      taskId,
      `Task cancelled: ${task.type}`,
      context || this.createDefaultSecurityContext(),
      { task },
      { cancelled: true }
    );

    this.logger.info('Task cancelled', { taskId }, context);

    // Emit cancellation event
    this.emit('task-cancelled', {
      id: `task-cancelled-${taskId}`,
      type: 'task-failed' as any, // Using existing event type
      source: 'orchestrator',
      timestamp: new Date(),
      data: { taskId, reason: 'cancelled' },
      severity: 'info',
      requiresResponse: false
    } as OrchestratorEvent);
  }

  /**
   * Create a collaboration session
   */
  async createCollaborationSession(
    participants: string[],
    context: SecurityContext
  ): Promise<string> {
    const sessionId = uuidv4();
    
    const collaborationContext: CollaborationContext = {
      sessionId,
      participants: participants.map(id => ({
        id,
        type: 'human',
        role: 'viewer',
        permissions: [],
        isActive: true,
        lastSeen: new Date()
      })),
      sharedState: new Map(),
      messageHistory: [],
      lockManager: {
        activeLocks: new Map(),
        lockTimeout: 300000, // 5 minutes
        maxLocksPerSession: 10
      },
      syncStatus: {
        isInSync: true,
        lastSyncAt: new Date(),
        conflictCount: 0,
        pendingUpdates: 0
      }
    };

    this.collaborationContexts.set(sessionId, collaborationContext);

    this.logger.info('Collaboration session created', {
      sessionId,
      participantCount: participants.length
    }, context);

    return sessionId;
  }

  /**
   * Register a new agent
   */
  async registerAgent(config: AgentConfiguration, context?: SecurityContext): Promise<void> {
    await this.agentRegistry.registerAgent(config);

    // Log agent registration
    await this.logger.logAudit(
      'create',
      'agent',
      config.id,
      `Agent registered: ${config.name}`,
      context || this.createDefaultSecurityContext(),
      undefined,
      { config }
    );

    this.orchestratorState.activeAgents.set(config.id, this.agentRegistry.getAgent(config.id)!);
    this.logger.info('Agent registered with orchestrator', { agentId: config.id }, context);
  }

  /**
   * Deregister an agent
   */
  async deregisterAgent(agentId: string, context?: SecurityContext): Promise<void> {
    await this.agentRegistry.deregisterAgent(agentId);

    // Log agent deregistration
    await this.logger.logAudit(
      'delete',
      'agent',
      agentId,
      'Agent deregistered',
      context || this.createDefaultSecurityContext(),
      { agentId },
      undefined
    );

    this.orchestratorState.activeAgents.delete(agentId);
    this.logger.info('Agent deregistered from orchestrator', { agentId }, context);
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics(): OrchestratorMetrics {
    return this.orchestratorState.metrics;
  }

  /**
   * Get orchestrator state
   */
  getState(): Readonly<OrchestratorState> {
    return {
      ...this.orchestratorState,
      activeAgents: new Map(this.orchestratorState.activeAgents),
      workflowQueue: [...this.orchestratorState.workflowQueue],
      collaborationContext: { ...this.orchestratorState.collaborationContext },
      metrics: { ...this.orchestratorState.metrics },
      complianceStatus: { ...this.orchestratorState.complianceStatus }
    };
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: OrchestratorMetrics;
  }> {
    const issues: string[] = [];
    
    // Check Redis connection
    try {
      await this.redis.ping();
    } catch (error) {
      issues.push('Redis connection failed');
    }

    // Check agent health
    const agents = this.agentRegistry.getAllAgents();
    const unhealthyAgents = agents.filter(agent => 
      agent.status === 'error' || agent.status === 'offline'
    );
    
    if (unhealthyAgents.length > 0) {
      issues.push(`${unhealthyAgents.length} agents are unhealthy`);
    }

    // Check queue depth
    if (this.taskQueue.size > 100) {
      issues.push(`High task queue depth: ${this.taskQueue.size}`);
    }

    // Check compliance status
    if (!this.orchestratorState.complianceStatus.isCompliant) {
      issues.push('Compliance violations detected');
    }

    const healthy = issues.length === 0;
    
    if (!healthy) {
      this.logger.warn('Health check failed', { issues });
    }

    return {
      healthy,
      issues,
      metrics: this.orchestratorState.metrics
    };
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    this.logger.info('Initiating orchestrator shutdown');

    // Stop timers
    clearInterval(this.taskProcessingTimer);
    clearInterval(this.healthCheckTimer);
    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
    }

    // Cancel all pending tasks
    for (const [taskId, task] of this.taskQueue) {
      try {
        await this.cancelTask(taskId);
      } catch (error) {
        this.logger.error(`Error cancelling task ${taskId} during shutdown`, error);
      }
    }

    // Shutdown components
    await this.agentRegistry.shutdown();
    await this.logger.shutdown();
    await this.redis.disconnect();

    this.removeAllListeners();
    this.logger.info('Healthcare AI Orchestrator shut down successfully');
  }

  private initializeState(): OrchestratorState {
    return {
      sessionId: uuidv4(),
      activeAgents: new Map(),
      workflowQueue: [],
      collaborationContext: {
        sessionId: uuidv4(),
        participants: [],
        sharedState: new Map(),
        messageHistory: [],
        lockManager: {
          activeLocks: new Map(),
          lockTimeout: 300000,
          maxLocksPerSession: 10
        },
        syncStatus: {
          isInSync: true,
          lastSyncAt: new Date(),
          conflictCount: 0,
          pendingUpdates: 0
        }
      },
      metrics: {
        sessionMetrics: {
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          averageTaskDuration: 0,
          activeAgentCount: 0,
          throughput: 0,
          errorRate: 0
        },
        agentMetrics: new Map(),
        workflowMetrics: {
          totalWorkflows: 0,
          activeWorkflows: 0,
          completedWorkflows: 0,
          averageWorkflowDuration: 0,
          bottlenecks: []
        },
        complianceMetrics: {
          hipaaViolations: 0,
          gdprViolations: 0,
          encryptionCompliance: 1.0,
          auditTrailIntegrity: 1.0,
          dataRetentionCompliance: 1.0,
          accessControlViolations: 0,
          lastComplianceCheck: new Date()
        },
        performanceMetrics: {
          cpuUsage: 0,
          memoryUsage: 0,
          responseTime: 0,
          concurrentConnections: 0,
          cacheHitRate: 0,
          errorRate: 0
        }
      },
      lastActivity: new Date(),
      complianceStatus: {
        isCompliant: true,
        violations: [],
        lastAudit: new Date(),
        nextAuditDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        certifications: []
      }
    };
  }

  private async registerDefaultAgents(): Promise<void> {
    for (const agentConfig of this.config.agents) {
      try {
        await this.agentRegistry.registerAgent(agentConfig);
        this.orchestratorState.activeAgents.set(
          agentConfig.id, 
          this.agentRegistry.getAgent(agentConfig.id)!
        );
      } catch (error) {
        this.logger.error(`Failed to register default agent ${agentConfig.id}`, error);
      }
    }
  }

  private setupEventHandlers(): void {
    // Agent registry events
    this.agentRegistry.on('agent-registered', (event) => this.handleAgentEvent(event));
    this.agentRegistry.on('agent-deregistered', (event) => this.handleAgentEvent(event));
    this.agentRegistry.on('agent-status-changed', (event) => this.handleAgentEvent(event));

    // Logger events
    this.logger.on('high-risk-audit', (entry) => this.handleHighRiskAudit(entry));
    this.logger.on('audit-logged', (entry) => this.handleAuditLogged(entry));

    // Task processing events
    this.on('task-completed', (event) => this.handleTaskCompleted(event));
    this.on('task-failed', (event) => this.handleTaskFailed(event));
  }

  private async processTaskQueue(): Promise<void> {
    if (this.isShuttingDown || this.taskQueue.size === 0) {
      return;
    }

    // Get highest priority tasks
    const tasks = Array.from(this.taskQueue.values())
      .sort((a, b) => this.compareTaskPriority(a.priority, b.priority))
      .slice(0, this.config.performance.maxConcurrentTasks);

    for (const task of tasks) {
      try {
        await this.processTask(task);
      } catch (error) {
        this.logger.error(`Error processing task ${task.id}`, error);
        await this.handleTaskError(task, error as Error);
      }
    }
  }

  private async processTask(task: WorkflowTask): Promise<void> {
    // Find suitable agent
    const agent = await this.agentRegistry.findBestAgentForTask(task);
    
    if (!agent) {
      // No suitable agent available - keep task in queue
      this.logger.debug(`No suitable agent found for task ${task.id}`, {
        taskType: task.type,
        requiredCapabilities: task.requiredCapabilities
      });
      return;
    }

    // Remove from queue and add to active tasks
    this.taskQueue.delete(task.id);
    task.status = 'assigned';
    task.assignedAgentId = agent.id;
    this.activeTasks.set(task.id, task);

    // Assign task to agent
    await this.agentRegistry.assignTaskToAgent(agent.id, task);

    // Log task assignment
    this.logger.info('Task assigned to agent', {
      taskId: task.id,
      agentId: agent.id,
      taskType: task.type
    });

    // Emit task assignment event
    this.emit('task-assigned', {
      id: `task-assigned-${task.id}`,
      type: 'task-assigned',
      source: 'orchestrator',
      timestamp: new Date(),
      data: { taskId: task.id, agentId: agent.id },
      severity: 'info',
      requiresResponse: false
    } as OrchestratorEvent);

    // Simulate task execution (in a real implementation, this would invoke the actual agent)
    setTimeout(async () => {
      await this.simulateTaskExecution(task);
    }, Math.random() * 5000 + 1000); // 1-6 seconds
  }

  private async simulateTaskExecution(task: WorkflowTask): Promise<void> {
    try {
      // Simulate task execution
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        const result: TaskResult = {
          data: { message: `Task ${task.id} completed successfully` },
          metadata: {
            executionTime: Math.random() * 4000 + 1000,
            agentId: task.assignedAgentId!,
            version: '1.0.0',
            confidence: Math.random() * 0.3 + 0.7,
            qualityScore: Math.random() * 0.3 + 0.7
          },
          complianceReport: {
            isCompliant: true,
            checks: [
              {
                name: 'HIPAA Compliance',
                passed: true,
                details: 'All HIPAA requirements satisfied'
              }
            ],
            generatedAt: new Date(),
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          executionMetrics: {
            startTime: new Date(Date.now() - Math.random() * 5000),
            endTime: new Date(),
            cpuTime: Math.random() * 1000,
            memoryUsage: Math.random() * 100,
            networkCalls: Math.floor(Math.random() * 5),
            cacheHits: Math.floor(Math.random() * 10)
          }
        };

        await this.completeTask(task.id, result);
      } else {
        const error: TaskError = {
          code: 'EXECUTION_FAILED',
          message: 'Task execution failed due to simulated error',
          details: { taskId: task.id, simulationError: true },
          isRetryable: true,
          complianceImpact: false,
          timestamp: new Date()
        };

        await this.failTask(task.id, error);
      }
    } catch (error) {
      await this.handleTaskError(task, error as Error);
    }
  }

  private async completeTask(taskId: string, result: TaskResult): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in active tasks`);
    }

    // Update task status
    task.status = 'completed';
    task.result = result;

    // Move to completed tasks
    this.activeTasks.delete(taskId);
    this.completedTasks.set(taskId, result);

    // Free the agent
    if (task.assignedAgentId) {
      await this.agentRegistry.completeTaskForAgent(task.assignedAgentId, taskId, true);
    }

    // Update metrics
    this.orchestratorState.metrics.sessionMetrics.completedTasks++;
    this.updateTaskDurationMetrics(task, result.metadata.executionTime);

    this.logger.info('Task completed successfully', {
      taskId,
      executionTime: result.metadata.executionTime,
      confidence: result.metadata.confidence
    });

    // Emit completion event
    this.emit('task-completed', {
      id: `task-completed-${taskId}`,
      type: 'task-completed',
      source: 'orchestrator',
      timestamp: new Date(),
      data: { taskId, result },
      severity: 'info',
      requiresResponse: false
    } as OrchestratorEvent);
  }

  private async failTask(taskId: string, error: TaskError): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in active tasks`);
    }

    // Check if task should be retried
    if (error.isRetryable && this.shouldRetryTask(task)) {
      await this.retryTask(task);
      return;
    }

    // Update task status
    task.status = 'failed';
    task.error = error;

    // Remove from active tasks
    this.activeTasks.delete(taskId);

    // Free the agent
    if (task.assignedAgentId) {
      await this.agentRegistry.completeTaskForAgent(task.assignedAgentId, taskId, false);
    }

    // Update metrics
    this.orchestratorState.metrics.sessionMetrics.failedTasks++;

    this.logger.error('Task failed', error, { taskId });

    // Emit failure event
    this.emit('task-failed', {
      id: `task-failed-${taskId}`,
      type: 'task-failed',
      source: 'orchestrator',
      timestamp: new Date(),
      data: { taskId, error },
      severity: 'error',
      requiresResponse: true
    } as OrchestratorEvent);
  }

  private async retryTask(task: WorkflowTask): Promise<void> {
    // Reset task status
    task.status = 'pending';
    task.assignedAgentId = undefined;

    // Move back to queue
    this.activeTasks.delete(task.id);
    this.taskQueue.set(task.id, task);

    this.logger.info('Task queued for retry', { taskId: task.id });
  }

  private shouldRetryTask(task: WorkflowTask): boolean {
    // Simple retry logic - in a real implementation, this would be more sophisticated
    return true; // For now, always retry retryable tasks
  }

  private async handleTaskError(task: WorkflowTask, error: Error): Promise<void> {
    const taskError: TaskError = {
      code: 'SYSTEM_ERROR',
      message: error.message,
      details: { stack: error.stack },
      isRetryable: true,
      complianceImpact: false,
      timestamp: new Date()
    };

    await this.failTask(task.id, taskError);
  }

  private compareTaskPriority(a: TaskPriority, b: TaskPriority): number {
    const priorities: Record<TaskPriority, number> = {
      'critical': 5,
      'urgent': 4,
      'high': 3,
      'normal': 2,
      'low': 1
    };

    return priorities[b] - priorities[a]; // Higher priority first
  }

  private calculateTaskProgress(task: WorkflowTask): number {
    // Simple progress calculation - in a real implementation, this would be more sophisticated
    switch (task.status) {
      case 'pending': return 0;
      case 'assigned': return 0.1;
      case 'running': return 0.5;
      case 'completed': return 1.0;
      case 'failed':
      case 'cancelled': return 1.0;
      default: return 0;
    }
  }

  private async validateTaskSecurity(task: WorkflowTask, context?: SecurityContext): Promise<void> {
    // Validate security context requirements
    if (task.constraints.requiredEncryption && !this.config.security.encryptionEnabled) {
      throw new Error('Task requires encryption but encryption is not enabled');
    }

    // Validate compliance requirements
    if (task.context.complianceRequirements.some(req => req.mandatory)) {
      if (!this.config.compliance.hipaaEnabled) {
        throw new Error('Task has mandatory compliance requirements but HIPAA compliance is not enabled');
      }
    }

    // Validate data classifications
    const hasRestrictedData = task.input.securityContext.dataClassifications.includes('phi') ||
                             task.input.securityContext.dataClassifications.includes('pii');
    
    if (hasRestrictedData && !task.constraints.auditTrail) {
      throw new Error('Tasks with restricted data must enable audit trail');
    }
  }

  private createDefaultSecurityContext(): SecurityContext {
    return {
      sessionId: this.orchestratorState.sessionId,
      permissions: [],
      dataClassifications: ['public'],
      encryptionLevel: 'none',
      auditRequired: false
    };
  }

  private updateTaskDurationMetrics(task: WorkflowTask, duration: number): void {
    const metrics = this.orchestratorState.metrics.sessionMetrics;
    const totalTasks = metrics.completedTasks + metrics.failedTasks;
    
    if (totalTasks === 1) {
      metrics.averageTaskDuration = duration;
    } else {
      metrics.averageTaskDuration = 
        (metrics.averageTaskDuration * (totalTasks - 1) + duration) / totalTasks;
    }
  }

  private async collectMetrics(): Promise<void> {
    // Update session metrics
    this.orchestratorState.metrics.sessionMetrics.totalTasks = 
      this.taskQueue.size + this.activeTasks.size + this.completedTasks.size;
    
    this.orchestratorState.metrics.sessionMetrics.activeAgentCount = 
      this.orchestratorState.activeAgents.size;

    // Calculate throughput and error rate
    const totalCompleted = this.orchestratorState.metrics.sessionMetrics.completedTasks;
    const totalFailed = this.orchestratorState.metrics.sessionMetrics.failedTasks;
    const totalProcessed = totalCompleted + totalFailed;

    if (totalProcessed > 0) {
      this.orchestratorState.metrics.sessionMetrics.errorRate = totalFailed / totalProcessed;
    }

    // Log metrics
    this.logger.logMetrics(this.orchestratorState.metrics);
  }

  private handleAgentEvent(event: OrchestratorEvent): void {
    this.logger.logEvent(event);
    this.emit('agent-event', event);
  }

  private handleHighRiskAudit(entry: any): void {
    this.logger.critical('High-risk audit event detected', { auditEntry: entry });
    
    // Trigger security response
    this.emit('security-alert', {
      id: `security-alert-${Date.now()}`,
      type: 'security-alert',
      source: 'audit-system',
      timestamp: new Date(),
      data: { auditEntry: entry },
      severity: 'critical',
      requiresResponse: true
    } as OrchestratorEvent);
  }

  private handleAuditLogged(entry: any): void {
    // Update compliance metrics based on audit log
    if (entry.complianceImpact) {
      this.orchestratorState.complianceStatus.violations.push({
        id: entry.id,
        type: 'audit-violation',
        severity: 'medium',
        description: entry.message,
        affectedData: entry.data ? Object.keys(entry.data) : [],
        detectedAt: entry.timestamp,
        remediation: []
      });
    }
  }

  private handleTaskCompleted(event: OrchestratorEvent): void {
    this.logger.logEvent(event);
  }

  private handleTaskFailed(event: OrchestratorEvent): void {
    this.logger.logEvent(event);
    
    // Trigger recovery strategies if enabled
    const task = this.activeTasks.get(event.data.taskId);
    if (task) {
      this.triggerRecoveryStrategies(task, event.data.error);
    }
  }

  private triggerRecoveryStrategies(task: WorkflowTask, error: TaskError): void {
    const applicableStrategies = this.recoveryStrategies.filter(strategy =>
      strategy.conditions.some(condition => this.matchesRecoveryCondition(condition, task, error))
    );

    if (applicableStrategies.length > 0) {
      // Sort by priority and execute the best strategy
      const bestStrategy = applicableStrategies.sort((a, b) => b.priority - a.priority)[0];
      this.executeRecoveryStrategy(bestStrategy, task, error);
    }
  }

  private matchesRecoveryCondition(condition: any, task: WorkflowTask, error: TaskError): boolean {
    switch (condition.type) {
      case 'error-type':
        return error.code.toLowerCase().includes(condition.pattern.toLowerCase());
      case 'agent-failure':
        return task.assignedAgentId !== undefined;
      case 'timeout':
        return error.code === 'TIMEOUT';
      default:
        return false;
    }
  }

  private executeRecoveryStrategy(strategy: RecoveryStrategy, task: WorkflowTask, error: TaskError): void {
    this.logger.info('Executing recovery strategy', {
      strategyName: strategy.name,
      taskId: task.id,
      errorCode: error.code
    });

    for (const action of strategy.actions) {
      this.executeRecoveryAction(action, task, error);
    }
  }

  private executeRecoveryAction(action: RecoveryAction, task: WorkflowTask, error: TaskError): void {
    switch (action.type) {
      case 'retry':
        setTimeout(() => {
          this.retryTask(task);
        }, action.delay);
        break;
      
      case 'reassign':
        // Mark current agent as problematic and reassign
        task.assignedAgentId = undefined;
        this.retryTask(task);
        break;
      
      case 'escalate':
        this.emit('task-escalation', {
          id: `task-escalation-${task.id}`,
          type: 'task-failed',
          source: 'recovery-system',
          timestamp: new Date(),
          data: { taskId: task.id, error, action },
          severity: 'warning',
          requiresResponse: true
        } as OrchestratorEvent);
        break;
      
      case 'fallback':
        // Implement fallback logic
        this.logger.warn('Fallback recovery action not implemented', { taskId: task.id });
        break;
      
      case 'notify':
        this.logger.critical('Recovery notification triggered', {
          taskId: task.id,
          error,
          action: action.parameters
        });
        break;
    }
  }

  private getDefaultRecoveryStrategies(): RecoveryStrategy[] {
    return [
      {
        name: 'Agent Timeout Recovery',
        conditions: [
          { type: 'timeout', pattern: 'TIMEOUT', severity: 'medium' }
        ],
        actions: [
          { type: 'reassign', parameters: {}, delay: 1000 }
        ],
        priority: 8,
        maxAttempts: 2
      },
      {
        name: 'Agent Failure Recovery',
        conditions: [
          { type: 'agent-failure', pattern: 'AGENT_.*', severity: 'high' }
        ],
        actions: [
          { type: 'reassign', parameters: {}, delay: 2000 }
        ],
        priority: 9,
        maxAttempts: 1
      },
      {
        name: 'Critical Error Escalation',
        conditions: [
          { type: 'error-type', pattern: 'CRITICAL', severity: 'critical' }
        ],
        actions: [
          { type: 'escalate', parameters: { urgency: 'high' }, delay: 0 },
          { type: 'notify', parameters: { channels: ['admin', 'security'] }, delay: 0 }
        ],
        priority: 10,
        maxAttempts: 1
      }
    ];
  }
}

export default HealthcareAIOrchestrator;

// Export functions for backward compatibility
export const HealthcareOrchestrator = HealthcareAIOrchestrator;