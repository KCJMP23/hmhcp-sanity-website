/**
 * Enhanced Workflow Execution Engine
 * Microsoft Copilot-inspired workflow orchestration and state management
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/security/audit-logging';
import { EnhancedSharedMemoryPool, MemoryType, MemoryPriority } from './SharedMemoryPool';
import { AgentCommunicationFramework, MessageType, MessagePriority } from './AgentCommunicationFramework';

// Workflow execution types
export enum WorkflowStatus {
  DRAFT = 'draft',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NodeType {
  START = 'start',
  TASK = 'task',
  DECISION = 'decision',
  PARALLEL = 'parallel',
  MERGE = 'merge',
  END = 'end',
  TIMER = 'timer',
  CONDITION = 'condition',
  LOOP = 'loop',
  SUBWORKFLOW = 'subworkflow'
}

export enum ExecutionStrategy {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  LOOP = 'loop',
  RETRY = 'retry'
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  config: NodeConfig;
  position: { x: number; y: number };
  dependencies: string[];
  conditions?: WorkflowCondition[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
  metadata: Record<string, any>;
}

export interface NodeConfig {
  agentId?: string;
  taskType?: string;
  parameters?: Record<string, any>;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  parallelBranches?: string[][];
  conditionExpression?: string;
  loopCount?: number;
  subworkflowId?: string;
  timerDuration?: number;
  timerExpression?: string;
}

export interface WorkflowCondition {
  id: string;
  expression: string;
  truePath: string;
  falsePath: string;
  description?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
  metadata: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string;
  metadata: Record<string, any>;
}

export interface WorkflowVariable {
  name: string;
  type: string;
  defaultValue?: any;
  description?: string;
  required: boolean;
  scope: 'global' | 'local' | 'node';
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface WorkflowMetadata {
  author: string;
  tags: string[];
  category: string;
  healthcareCompliant: boolean;
  complianceLevel: 'basic' | 'hipaa' | 'phi' | 'sensitive_phi';
  estimatedDuration: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: WorkflowStatus;
  currentNodes: string[];
  completedNodes: string[];
  failedNodes: string[];
  variables: Map<string, any>;
  context: WorkflowContext;
  executionHistory: ExecutionStep[];
  startedAt: Date;
  completedAt?: Date;
  error?: WorkflowError;
  metadata: Record<string, any>;
}

export interface WorkflowContext {
  sessionId: string;
  userId?: string;
  workflowId: string;
  parentWorkflowId?: string;
  environment: 'development' | 'staging' | 'production';
  complianceRequirements: string[];
  securityContext: Record<string, any>;
  sharedMemory: Map<string, any>;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: WorkflowError;
  retryCount: number;
  agentId?: string;
  metadata: Record<string, any>;
}

export interface WorkflowError {
  code: string;
  message: string;
  details: Record<string, any>;
  nodeId?: string;
  stepId?: string;
  timestamp: Date;
  isRetryable: boolean;
  complianceImpact: boolean;
}

export interface WorkflowExecutionConfig {
  redis: Redis;
  supabase: any;
  sharedMemoryPool: EnhancedSharedMemoryPool;
  communicationFramework: AgentCommunicationFramework;
  maxConcurrentWorkflows: number;
  defaultTimeout: number;
  enableAuditLogging: boolean;
  enableComplianceValidation: boolean;
  enablePerformanceMonitoring: boolean;
}

/**
 * Enhanced Workflow Execution Engine
 */
export class WorkflowExecutionEngine extends EventEmitter {
  private readonly redis: Redis;
  private readonly supabase: any;
  private readonly auditLogger: AuditLogger;
  private readonly sharedMemoryPool: EnhancedSharedMemoryPool;
  private readonly communicationFramework: AgentCommunicationFramework;
  private readonly config: WorkflowExecutionConfig;
  
  private readonly activeWorkflows = new Map<string, WorkflowInstance>();
  private readonly workflowDefinitions = new Map<string, WorkflowDefinition>();
  private readonly executionQueue = new Map<string, WorkflowInstance>();
  
  private executionTimer: NodeJS.Timeout | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: WorkflowExecutionConfig) {
    super();
    this.redis = config.redis;
    this.supabase = config.supabase;
    this.config = config;
    this.sharedMemoryPool = config.sharedMemoryPool;
    this.communicationFramework = config.communicationFramework;
    this.auditLogger = new AuditLogger(this.supabase);

    this.startTimers();
    this.setupEventHandlers();
  }

  /**
   * Register a workflow definition
   */
  async registerWorkflow(definition: WorkflowDefinition): Promise<void> {
    try {
      // Validate workflow definition
      await this.validateWorkflowDefinition(definition);

      // Store definition
      this.workflowDefinitions.set(definition.id, definition);

      // Store in Supabase
      await this.storeWorkflowDefinition(definition);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'workflow_registered',
          resource_type: 'workflow_definition',
          resource_id: definition.id,
          details: {
            name: definition.name,
            version: definition.version,
            nodeCount: definition.nodes.length,
            healthcareCompliant: definition.metadata.healthcareCompliant
          }
        });
      }

      // Emit event
      this.emit('workflow-registered', { definitionId: definition.id, name: definition.name });

      logger.info('Workflow definition registered', {
        definitionId: definition.id,
        name: definition.name,
        version: definition.version,
        nodeCount: definition.nodes.length
      });
    } catch (error) {
      logger.error('Failed to register workflow definition', { definitionId: definition.id, error });
      throw error;
    }
  }

  /**
   * Start a workflow execution
   */
  async startWorkflow(
    definitionId: string,
    context: Partial<WorkflowContext> = {},
    variables: Record<string, any> = {}
  ): Promise<string> {
    const definition = this.workflowDefinitions.get(definitionId);
    if (!definition) {
      throw new Error(`Workflow definition ${definitionId} not found`);
    }

    const instanceId = uuidv4();
    const now = new Date();

    const instance: WorkflowInstance = {
      id: instanceId,
      definitionId,
      status: WorkflowStatus.READY,
      currentNodes: [],
      completedNodes: [],
      failedNodes: [],
      variables: new Map(Object.entries(variables)),
      context: {
        sessionId: context.sessionId || uuidv4(),
        userId: context.userId,
        workflowId: instanceId,
        parentWorkflowId: context.parentWorkflowId,
        environment: context.environment || 'development',
        complianceRequirements: context.complianceRequirements || [],
        securityContext: context.securityContext || {},
        sharedMemory: new Map()
      },
      executionHistory: [],
      startedAt: now,
      metadata: {}
    };

    try {
      // Validate compliance requirements
      if (this.config.enableComplianceValidation) {
        await this.validateComplianceRequirements(definition, instance);
      }

      // Store instance
      this.activeWorkflows.set(instanceId, instance);

      // Store in Redis for distributed access
      await this.storeWorkflowInstance(instance);

      // Start execution
      await this.executeWorkflow(instance);

      // Audit logging
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logActivity({
          action: 'workflow_started',
          resource_type: 'workflow_instance',
          resource_id: instanceId,
          details: {
            definitionId,
            userId: context.userId,
            complianceLevel: definition.metadata.complianceLevel
          }
        });
      }

      // Emit event
      this.emit('workflow-started', { instanceId, definitionId });

      logger.info('Workflow execution started', {
        instanceId,
        definitionId,
        definitionName: definition.name
      });

      return instanceId;
    } catch (error) {
      logger.error('Failed to start workflow', { instanceId, definitionId, error });
      throw error;
    }
  }

  /**
   * Pause a workflow execution
   */
  async pauseWorkflow(instanceId: string): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    if (instance.status !== WorkflowStatus.RUNNING) {
      throw new Error(`Cannot pause workflow in status ${instance.status}`);
    }

    instance.status = WorkflowStatus.PAUSED;

    // Store updated instance
    await this.storeWorkflowInstance(instance);

    // Emit event
    this.emit('workflow-paused', { instanceId });

    logger.info('Workflow execution paused', { instanceId });
  }

  /**
   * Resume a paused workflow execution
   */
  async resumeWorkflow(instanceId: string): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    if (instance.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Cannot resume workflow in status ${instance.status}`);
    }

    instance.status = WorkflowStatus.RUNNING;

    // Store updated instance
    await this.storeWorkflowInstance(instance);

    // Continue execution
    await this.executeWorkflow(instance);

    // Emit event
    this.emit('workflow-resumed', { instanceId });

    logger.info('Workflow execution resumed', { instanceId });
  }

  /**
   * Cancel a workflow execution
   */
  async cancelWorkflow(instanceId: string, reason?: string): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    instance.status = WorkflowStatus.CANCELLED;
    instance.completedAt = new Date();

    // Store updated instance
    await this.storeWorkflowInstance(instance);

    // Emit event
    this.emit('workflow-cancelled', { instanceId, reason });

    logger.info('Workflow execution cancelled', { instanceId, reason });
  }

  /**
   * Get workflow instance status
   */
  getWorkflowStatus(instanceId: string): WorkflowInstance | undefined {
    return this.activeWorkflows.get(instanceId);
  }

  /**
   * Get workflow execution statistics
   */
  getExecutionStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    averageExecutionTime: number;
    workflowsByStatus: Record<WorkflowStatus, number>;
  } {
    const instances = Array.from(this.activeWorkflows.values());
    
    const workflowsByStatus: Record<WorkflowStatus, number> = {} as any;
    let totalExecutionTime = 0;
    let completedCount = 0;

    for (const instance of instances) {
      workflowsByStatus[instance.status] = (workflowsByStatus[instance.status] || 0) + 1;
      
      if (instance.completedAt) {
        const executionTime = instance.completedAt.getTime() - instance.startedAt.getTime();
        totalExecutionTime += executionTime;
        completedCount++;
      }
    }

    return {
      totalWorkflows: instances.length,
      activeWorkflows: instances.filter(i => i.status === WorkflowStatus.RUNNING).length,
      completedWorkflows: instances.filter(i => i.status === WorkflowStatus.COMPLETED).length,
      failedWorkflows: instances.filter(i => i.status === WorkflowStatus.FAILED).length,
      averageExecutionTime: completedCount > 0 ? totalExecutionTime / completedCount : 0,
      workflowsByStatus
    };
  }

  // Private methods
  private async executeWorkflow(instance: WorkflowInstance): Promise<void> {
    try {
      const definition = this.workflowDefinitions.get(instance.definitionId);
      if (!definition) {
        throw new Error(`Workflow definition ${instance.definitionId} not found`);
      }

      instance.status = WorkflowStatus.RUNNING;

      // Find start nodes
      const startNodes = definition.nodes.filter(node => node.type === NodeType.START);
      if (startNodes.length === 0) {
        throw new Error('Workflow must have at least one start node');
      }

      // Execute start nodes
      for (const startNode of startNodes) {
        await this.executeNode(instance, startNode);
      }

      // Continue with next nodes
      await this.executeNextNodes(instance);

    } catch (error) {
      instance.status = WorkflowStatus.FAILED;
      instance.error = {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { error: error instanceof Error ? error.stack : error },
        timestamp: new Date(),
        isRetryable: true,
        complianceImpact: false
      };
      
      logger.error('Workflow execution failed', { instanceId: instance.id, error });
    }
  }

  private async executeNode(instance: WorkflowInstance, node: WorkflowNode): Promise<void> {
    const stepId = uuidv4();
    const step: ExecutionStep = {
      id: stepId,
      nodeId: node.id,
      status: 'running',
      startedAt: new Date(),
      retryCount: 0,
      metadata: {}
    };

    instance.executionHistory.push(step);

    try {
      // Execute based on node type
      switch (node.type) {
        case NodeType.START:
          await this.executeStartNode(instance, node, step);
          break;
        case NodeType.TASK:
          await this.executeTaskNode(instance, node, step);
          break;
        case NodeType.DECISION:
          await this.executeDecisionNode(instance, node, step);
          break;
        case NodeType.PARALLEL:
          await this.executeParallelNode(instance, node, step);
          break;
        case NodeType.MERGE:
          await this.executeMergeNode(instance, node, step);
          break;
        case NodeType.TIMER:
          await this.executeTimerNode(instance, node, step);
          break;
        case NodeType.CONDITION:
          await this.executeConditionNode(instance, node, step);
          break;
        case NodeType.LOOP:
          await this.executeLoopNode(instance, node, step);
          break;
        case NodeType.SUBWORKFLOW:
          await this.executeSubworkflowNode(instance, node, step);
          break;
        case NodeType.END:
          await this.executeEndNode(instance, node, step);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      step.status = 'completed';
      step.completedAt = new Date();
      step.duration = step.completedAt.getTime() - step.startedAt.getTime();

      // Mark node as completed
      instance.completedNodes.push(node.id);
      instance.currentNodes = instance.currentNodes.filter(id => id !== node.id);

    } catch (error) {
      step.status = 'failed';
      step.error = {
        code: 'NODE_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { nodeId: node.id, error: error instanceof Error ? error.stack : error },
        nodeId: node.id,
        stepId: step.id,
        timestamp: new Date(),
        isRetryable: true,
        complianceImpact: false
      };

      instance.failedNodes.push(node.id);
      instance.currentNodes = instance.currentNodes.filter(id => id !== node.id);

      logger.error('Node execution failed', { instanceId: instance.id, nodeId: node.id, error });
    }
  }

  private async executeStartNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    // Start nodes typically just initialize the workflow
    step.output = { message: 'Workflow started' };
  }

  private async executeTaskNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    if (!node.config.agentId || !node.config.taskType) {
      throw new Error('Task node must have agentId and taskType configured');
    }

    // Create task for agent
    const task = {
      type: node.config.taskType,
      priority: 'normal' as const,
      requiredCapabilities: [],
      input: {
        data: node.config.parameters || {},
        metadata: {
          createdBy: instance.context.userId || 'system',
          tags: [],
          estimatedDuration: node.timeout || 30000,
          businessContext: 'workflow_execution',
          complianceFlags: instance.context.complianceRequirements
        },
        securityContext: {
          sessionId: instance.context.sessionId,
          permissions: [],
          dataClassifications: ['internal'],
          encryptionLevel: 'standard' as const,
          auditRequired: true
        }
      },
      expectedOutput: {
        type: 'any',
        schema: z.any(),
        validation: { required: true }
      },
      context: {
        sessionId: instance.context.sessionId,
        userId: instance.context.userId,
        workflowId: instance.id,
        parentTaskId: step.id,
        environment: instance.context.environment,
        complianceRequirements: instance.context.complianceRequirements.map(req => ({
          type: req,
          description: req,
          mandatory: true,
          validationRules: { required: true }
        }))
      },
      constraints: {
        maxExecutionTime: node.timeout || this.config.defaultTimeout,
        memoryLimit: 100000000, // 100MB
        dataAccessRestrictions: [],
        requiredEncryption: true,
        auditTrail: true
      },
      dependencies: [],
      deadline: node.timeout ? new Date(Date.now() + node.timeout) : undefined
    };

    // Send task to agent via communication framework
    await this.communicationFramework.sendMessage(
      'workflow-engine',
      [node.config.agentId],
      MessageType.TASK_DELEGATION,
      {
        text: `Execute task: ${node.name}`,
        data: { task, workflowId: instance.id, nodeId: node.id },
        workflowId: instance.id,
        taskId: step.id
      },
      {
        priority: MessagePriority.HIGH,
        requiresResponse: true,
        responseTimeout: node.timeout || this.config.defaultTimeout
      }
    );

    step.agentId = node.config.agentId;
    step.input = task.input.data;
  }

  private async executeDecisionNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    // Evaluate decision conditions
    const condition = node.conditions?.[0];
    if (!condition) {
      throw new Error('Decision node must have at least one condition');
    }

    // Simple condition evaluation (in production, this would use a proper expression evaluator)
    const result = this.evaluateCondition(condition.expression, instance.variables);
    
    step.output = { 
      decision: result,
      condition: condition.expression,
      nextPath: result ? condition.truePath : condition.falsePath
    };
  }

  private async executeParallelNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    const branches = node.config.parallelBranches || [];
    const parallelSteps: ExecutionStep[] = [];

    for (const branch of branches) {
      for (const nodeId of branch) {
        const branchNode = this.getNodeById(instance.definitionId, nodeId);
        if (branchNode) {
          const branchStep = {
            id: uuidv4(),
            nodeId: branchNode.id,
            status: 'running' as const,
            startedAt: new Date(),
            retryCount: 0,
            metadata: { parentStepId: step.id, branchId: branch.join(',') }
          };
          
          parallelSteps.push(branchStep);
          instance.executionHistory.push(branchStep);
          
          // Execute branch node
          await this.executeNode(instance, branchNode);
        }
      }
    }

    step.output = { 
      parallelBranches: branches.length,
      completedSteps: parallelSteps.length
    };
  }

  private async executeMergeNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    // Merge results from parallel branches
    const parallelSteps = instance.executionHistory.filter(s => 
      s.metadata.parentStepId === step.id
    );

    step.output = {
      mergedSteps: parallelSteps.length,
      results: parallelSteps.map(s => s.output)
    };
  }

  private async executeTimerNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    const duration = node.config.timerDuration || 1000; // Default 1 second
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    step.output = { 
      duration,
      completed: true
    };
  }

  private async executeConditionNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    const expression = node.config.conditionExpression;
    if (!expression) {
      throw new Error('Condition node must have conditionExpression configured');
    }

    const result = this.evaluateCondition(expression, instance.variables);
    
    step.output = { 
      condition: expression,
      result,
      passed: result
    };
  }

  private async executeLoopNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    const loopCount = node.config.loopCount || 1;
    const results: any[] = [];

    for (let i = 0; i < loopCount; i++) {
      // Execute loop body (simplified)
      const loopResult = { iteration: i, completed: true };
      results.push(loopResult);
    }

    step.output = { 
      loopCount,
      iterations: results.length,
      results
    };
  }

  private async executeSubworkflowNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    const subworkflowId = node.config.subworkflowId;
    if (!subworkflowId) {
      throw new Error('Subworkflow node must have subworkflowId configured');
    }

    // Start subworkflow
    const subworkflowInstanceId = await this.startWorkflow(
      subworkflowId,
      {
        ...instance.context,
        parentWorkflowId: instance.id
      },
      Object.fromEntries(instance.variables)
    );

    step.output = { 
      subworkflowId,
      subworkflowInstanceId,
      status: 'started'
    };
  }

  private async executeEndNode(instance: WorkflowInstance, node: WorkflowNode, step: ExecutionStep): Promise<void> {
    instance.status = WorkflowStatus.COMPLETED;
    instance.completedAt = new Date();
    
    step.output = { 
      message: 'Workflow completed',
      completedAt: instance.completedAt
    };

    // Emit completion event
    this.emit('workflow-completed', { instanceId: instance.id });
  }

  private async executeNextNodes(instance: WorkflowInstance): Promise<void> {
    const definition = this.workflowDefinitions.get(instance.definitionId);
    if (!definition) return;

    // Find next nodes to execute
    const nextNodes = definition.connections
      .filter(conn => instance.completedNodes.includes(conn.sourceNodeId))
      .map(conn => definition.nodes.find(node => node.id === conn.targetNodeId))
      .filter(node => node && !instance.completedNodes.includes(node.id) && !instance.failedNodes.includes(node.id));

    // Execute next nodes
    for (const node of nextNodes) {
      if (node) {
        instance.currentNodes.push(node.id);
        await this.executeNode(instance, node);
      }
    }
  }

  private getNodeById(definitionId: string, nodeId: string): WorkflowNode | undefined {
    const definition = this.workflowDefinitions.get(definitionId);
    return definition?.nodes.find(node => node.id === nodeId);
  }

  private evaluateCondition(expression: string, variables: Map<string, any>): boolean {
    // Simple condition evaluation (in production, use a proper expression evaluator)
    try {
      // Replace variables in expression
      let evalExpression = expression;
      for (const [key, value] of variables) {
        evalExpression = evalExpression.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
      }
      
      // Evaluate expression
      return Boolean(eval(evalExpression));
    } catch (error) {
      logger.error('Failed to evaluate condition', { expression, error });
      return false;
    }
  }

  private async validateWorkflowDefinition(definition: WorkflowDefinition): Promise<void> {
    // Basic validation
    if (!definition.id || !definition.name) {
      throw new Error('Workflow definition must have id and name');
    }

    if (!definition.nodes || definition.nodes.length === 0) {
      throw new Error('Workflow definition must have at least one node');
    }

    // Check for start nodes
    const startNodes = definition.nodes.filter(node => node.type === NodeType.START);
    if (startNodes.length === 0) {
      throw new Error('Workflow must have at least one start node');
    }

    // Check for end nodes
    const endNodes = definition.nodes.filter(node => node.type === NodeType.END);
    if (endNodes.length === 0) {
      throw new Error('Workflow must have at least one end node');
    }

    // Validate connections
    for (const connection of definition.connections) {
      const sourceNode = definition.nodes.find(node => node.id === connection.sourceNodeId);
      const targetNode = definition.nodes.find(node => node.id === connection.targetNodeId);
      
      if (!sourceNode) {
        throw new Error(`Connection references non-existent source node: ${connection.sourceNodeId}`);
      }
      
      if (!targetNode) {
        throw new Error(`Connection references non-existent target node: ${connection.targetNodeId}`);
      }
    }
  }

  private async validateComplianceRequirements(definition: WorkflowDefinition, instance: WorkflowInstance): Promise<void> {
    // Validate healthcare compliance
    if (definition.metadata.healthcareCompliant) {
      // Check if all required compliance requirements are met
      const requiredCompliance = ['hipaa', 'audit_trail', 'encryption'];
      const missingCompliance = requiredCompliance.filter(req => 
        !instance.context.complianceRequirements.includes(req)
      );
      
      if (missingCompliance.length > 0) {
        throw new Error(`Missing required compliance requirements: ${missingCompliance.join(', ')}`);
      }
    }
  }

  private async storeWorkflowDefinition(definition: WorkflowDefinition): Promise<void> {
    const { error } = await this.supabase
      .from('workflow_definitions')
      .upsert([{
        ...definition,
        nodes: JSON.stringify(definition.nodes),
        connections: JSON.stringify(definition.connections),
        variables: JSON.stringify(definition.variables),
        triggers: JSON.stringify(definition.triggers),
        metadata: JSON.stringify(definition.metadata),
        created_at: definition.createdAt.toISOString(),
        updated_at: definition.updatedAt.toISOString()
      }]);
    
    if (error) {
      logger.error('Failed to store workflow definition', { definitionId: definition.id, error });
    }
  }

  private async storeWorkflowInstance(instance: WorkflowInstance): Promise<void> {
    const { error } = await this.supabase
      .from('workflow_instances')
      .upsert([{
        ...instance,
        variables: JSON.stringify(Object.fromEntries(instance.variables)),
        context: JSON.stringify(instance.context),
        execution_history: JSON.stringify(instance.executionHistory),
        started_at: instance.startedAt.toISOString(),
        completed_at: instance.completedAt?.toISOString(),
        error: instance.error ? JSON.stringify(instance.error) : null,
        metadata: JSON.stringify(instance.metadata)
      }]);
    
    if (error) {
      logger.error('Failed to store workflow instance', { instanceId: instance.id, error });
    }
  }

  private startTimers(): void {
    // Execution timer
    this.executionTimer = setInterval(() => {
      this.processExecutionQueue();
    }, 1000);

    // Monitoring timer
    if (this.config.enablePerformanceMonitoring) {
      this.monitoringTimer = setInterval(() => {
        this.collectPerformanceMetrics();
      }, 30000);
    }

    // Cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupCompletedWorkflows();
    }, 300000); // 5 minutes
  }

  private processExecutionQueue(): void {
    // Process queued workflows
    for (const [instanceId, instance] of this.executionQueue) {
      if (instance.status === WorkflowStatus.READY) {
        this.executeWorkflow(instance).catch(error => {
          logger.error('Failed to execute queued workflow', { instanceId, error });
        });
        this.executionQueue.delete(instanceId);
      }
    }
  }

  private collectPerformanceMetrics(): void {
    const stats = this.getExecutionStats();
    this.emit('performance-metrics', stats);
  }

  private cleanupCompletedWorkflows(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    const toRemove: string[] = [];
    
    for (const [instanceId, instance] of this.activeWorkflows) {
      if (instance.completedAt && (now - instance.completedAt.getTime()) > maxAge) {
        toRemove.push(instanceId);
      }
    }
    
    for (const instanceId of toRemove) {
      this.activeWorkflows.delete(instanceId);
    }
    
    if (toRemove.length > 0) {
      logger.info('Cleaned up completed workflows', { count: toRemove.length });
    }
  }

  private setupEventHandlers(): void {
    this.on('workflow-started', (data) => {
      logger.debug('Workflow started event', data);
    });
    
    this.on('workflow-completed', (data) => {
      logger.debug('Workflow completed event', data);
    });
    
    this.on('workflow-failed', (data) => {
      logger.debug('Workflow failed event', data);
    });
  }

  /**
   * Shutdown the workflow execution engine
   */
  async shutdown(): Promise<void> {
    if (this.executionTimer) {
      clearInterval(this.executionTimer);
      this.executionTimer = null;
    }
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.removeAllListeners();
    logger.info('Workflow Execution Engine shutdown complete');
  }
}

export default WorkflowExecutionEngine;
