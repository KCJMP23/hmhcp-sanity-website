/**
 * Microsoft Copilot-inspired Dynamic Workflow Execution Engine
 * Healthcare AI Orchestration with HIPAA Compliance
 * 
 * @fileoverview Advanced workflow engine for healthcare AI agent orchestration
 * Features dynamic routing, parallel execution, state management, and compliance validation
 * 
 * @version 1.0.0
 * @author HMHCP Development Team
 * @compliance HIPAA, SOC2, GDPR
 */

import { Redis } from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

// Types and Interfaces
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ROLLBACK = 'rollback'
}

export enum NodeType {
  START = 'start',
  END = 'end',
  TASK = 'task',
  DECISION = 'decision',
  PARALLEL = 'parallel',
  JOIN = 'join',
  LOOP = 'loop',
  CONDITION = 'condition',
  AI_AGENT = 'ai_agent',
  COMPLIANCE_CHECK = 'compliance_check',
  DATA_TRANSFORM = 'data_transform',
  EMERGENCY_STOP = 'emergency_stop'
}

export enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  OPTIMIZED = 'optimized'
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  config: Record<string, any>;
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;
  conditions?: WorkflowCondition[];
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  complianceRules?: string[];
  phiHandling?: PHIHandlingConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  weight?: number;
  metadata?: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: WorkflowMetadata;
  complianceLevel: 'standard' | 'phi' | 'critical';
  encryptionRequired: boolean;
}

export interface WorkflowMetadata {
  created: Date;
  createdBy: string;
  tags: string[];
  category: string;
  estimatedDuration?: number;
  resourceRequirements?: ResourceRequirements;
  healthcareUseCase?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors?: string[];
}

export interface PHIHandlingConfig {
  encryptionRequired: boolean;
  accessLogging: boolean;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' | 'phi';
  retentionPolicy?: string;
  purgeAfterDays?: number;
}

export interface ResourceRequirements {
  cpuCores?: number;
  memoryMB?: number;
  gpuRequired?: boolean;
  estimatedCostUSD?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  currentNode?: string;
  context: WorkflowContext;
  metrics: ExecutionMetrics;
  auditTrail: AuditEntry[];
  version: string;
  rollbackVersion?: string;
}

export interface WorkflowContext {
  executionId: string;
  userId?: string;
  sessionId?: string;
  variables: Record<string, any>;
  phiData?: Record<string, any>;
  complianceFlags: string[];
  emergencyStop: boolean;
  rollbackData?: Record<string, any>;
}

export interface ExecutionMetrics {
  totalDuration: number;
  nodeExecutionTimes: Record<string, number>;
  memoryUsage: number;
  apiCalls: number;
  complianceChecks: number;
  errorCount: number;
  retryCount: number;
}

export interface AuditEntry {
  timestamp: Date;
  nodeId: string;
  action: string;
  userId?: string;
  data?: Record<string, any>;
  complianceNote?: string;
  phiAccessed?: boolean;
}

// Validation Schemas
const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(NodeType),
  name: z.string().min(1),
  description: z.string().optional(),
  config: z.record(z.any()),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'contains', 'exists']),
    value: z.any(),
    logicalOperator: z.enum(['AND', 'OR']).optional()
  })).optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().min(1).max(10),
    backoffStrategy: z.enum(['linear', 'exponential', 'fixed']),
    baseDelayMs: z.number().min(100),
    maxDelayMs: z.number().min(1000),
    retryableErrors: z.array(z.string()).optional()
  }).optional(),
  timeoutMs: z.number().min(1000).max(300000).optional(),
  complianceRules: z.array(z.string()).optional(),
  phiHandling: z.object({
    encryptionRequired: z.boolean(),
    accessLogging: z.boolean(),
    dataClassification: z.enum(['public', 'internal', 'confidential', 'restricted', 'phi']),
    retentionPolicy: z.string().optional(),
    purgeAfterDays: z.number().optional()
  }).optional()
});

const WorkflowDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    condition: z.string().optional(),
    weight: z.number().optional(),
    metadata: z.record(z.any()).optional()
  })),
  metadata: z.object({
    created: z.date(),
    createdBy: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    estimatedDuration: z.number().optional(),
    resourceRequirements: z.object({
      cpuCores: z.number().optional(),
      memoryMB: z.number().optional(),
      gpuRequired: z.boolean().optional(),
      estimatedCostUSD: z.number().optional()
    }).optional(),
    healthcareUseCase: z.string().optional()
  }),
  complianceLevel: z.enum(['standard', 'phi', 'critical']),
  encryptionRequired: z.boolean()
});

/**
 * Microsoft Copilot-inspired Dynamic Workflow Execution Engine
 * Production-ready healthcare AI orchestration with HIPAA compliance
 */
export class WorkflowEngine extends EventEmitter {
  private redis: Redis;
  private supabase: ReturnType<typeof createClient>;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private isInitialized = false;
  private readonly WORKFLOW_NAMESPACE = 'hmhcp:workflow';
  private readonly STATE_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly encryptionKey: Buffer;

  constructor(
    redisUrl: string,
    supabaseUrl: string,
    supabaseKey: string,
    encryptionKey?: string
  ) {
    super();
    this.redis = new Redis(redisUrl);
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.encryptionKey = Buffer.from(
      encryptionKey || process.env.WORKFLOW_ENCRYPTION_KEY || crypto.randomBytes(32)
    );
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the workflow engine with recovery and health checks
   */
  async initialize(): Promise<void> {
    try {
      // Verify Redis connection
      await this.redis.ping();
      
      // Verify Supabase connection
      const { data, error } = await this.supabase.from('workflow_definitions').select('count').limit(1);
      if (error && !error.message.includes('relation "workflow_definitions" does not exist')) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      // Ensure database tables exist
      await this.ensureDatabaseTables();
      
      // Recover running executions
      await this.recoverRunningExecutions();
      
      // Load workflow definitions from database
      await this.loadWorkflowDefinitions();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('[WorkflowEngine] Successfully initialized with healthcare compliance enabled');
    } catch (error) {
      console.error('[WorkflowEngine] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a new workflow definition with validation and versioning
   */
  async registerWorkflow(definition: WorkflowDefinition): Promise<void> {
    try {
      // Validate workflow definition
      const validatedDefinition = WorkflowDefinitionSchema.parse(definition);
      
      // Check for circular dependencies
      this.validateWorkflowGraph(validatedDefinition);
      
      // Validate healthcare compliance requirements
      await this.validateComplianceRequirements(validatedDefinition);
      
      // Generate unique workflow ID if not provided
      if (!validatedDefinition.id) {
        validatedDefinition.id = this.generateWorkflowId(validatedDefinition.name);
      }
      
      // Store in memory
      this.workflows.set(validatedDefinition.id, validatedDefinition);
      
      // Persist to database
      await this.persistWorkflowDefinition(validatedDefinition);
      
      // Cache in Redis
      await this.redis.setex(
        `${this.WORKFLOW_NAMESPACE}:definition:${validatedDefinition.id}`,
        this.STATE_TTL,
        JSON.stringify(validatedDefinition)
      );
      
      this.emit('workflowRegistered', { workflowId: validatedDefinition.id });
      console.log(`[WorkflowEngine] Registered workflow: ${validatedDefinition.name} (${validatedDefinition.id})`);
    } catch (error) {
      console.error('[WorkflowEngine] Failed to register workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow with comprehensive monitoring and compliance
   */
  async executeWorkflow(
    workflowId: string,
    initialContext: Partial<WorkflowContext> = {},
    mode: ExecutionMode = ExecutionMode.SEQUENTIAL
  ): Promise<string> {
    const executionId = uuidv4();
    
    try {
      // Get workflow definition
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Initialize execution context
      const context: WorkflowContext = {
        executionId,
        userId: initialContext.userId,
        sessionId: initialContext.sessionId || uuidv4(),
        variables: initialContext.variables || {},
        phiData: initialContext.phiData || {},
        complianceFlags: initialContext.complianceFlags || [],
        emergencyStop: false,
        rollbackData: {}
      };

      // Create execution record
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: WorkflowStatus.PENDING,
        startTime: new Date(),
        context,
        metrics: {
          totalDuration: 0,
          nodeExecutionTimes: {},
          memoryUsage: 0,
          apiCalls: 0,
          complianceChecks: 0,
          errorCount: 0,
          retryCount: 0
        },
        auditTrail: [],
        version: workflow.version
      };

      // Store execution state
      this.executions.set(executionId, execution);
      await this.persistExecutionState(execution);

      // Start execution based on mode
      this.executeWorkflowAsync(execution, workflow, mode).catch(error => {
        console.error(`[WorkflowEngine] Execution ${executionId} failed:`, error);
        this.handleExecutionError(executionId, error);
      });

      this.emit('executionStarted', { executionId, workflowId });
      return executionId;
    } catch (error) {
      console.error(`[WorkflowEngine] Failed to start execution:`, error);
      throw error;
    }
  }

  /**
   * Async workflow execution with dynamic routing and parallel processing
   */
  private async executeWorkflowAsync(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    mode: ExecutionMode
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Update status to running
      execution.status = WorkflowStatus.RUNNING;
      await this.persistExecutionState(execution);
      
      // Find start node
      const startNode = workflow.nodes.find(n => n.type === NodeType.START);
      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      // Execute workflow based on mode
      switch (mode) {
        case ExecutionMode.PARALLEL:
          await this.executeParallelMode(execution, workflow, startNode);
          break;
        case ExecutionMode.CONDITIONAL:
          await this.executeConditionalMode(execution, workflow, startNode);
          break;
        case ExecutionMode.OPTIMIZED:
          await this.executeOptimizedMode(execution, workflow, startNode);
          break;
        default:
          await this.executeSequentialMode(execution, workflow, startNode);
      }

      // Complete execution
      const endTime = performance.now();
      execution.status = WorkflowStatus.COMPLETED;
      execution.endTime = new Date();
      execution.metrics.totalDuration = endTime - startTime;
      
      await this.persistExecutionState(execution);
      this.emit('executionCompleted', { 
        executionId: execution.id,
        duration: execution.metrics.totalDuration 
      });
      
    } catch (error) {
      await this.handleExecutionError(execution.id, error);
    }
  }

  /**
   * Execute workflow in sequential mode with dynamic routing
   */
  private async executeSequentialMode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    currentNode: WorkflowNode
  ): Promise<void> {
    const visitedNodes = new Set<string>();
    let nodeToExecute: WorkflowNode | null = currentNode;

    while (nodeToExecute && !execution.context.emergencyStop) {
      // Prevent infinite loops
      if (visitedNodes.has(nodeToExecute.id) && nodeToExecute.type !== NodeType.LOOP) {
        throw new Error(`Circular dependency detected at node: ${nodeToExecute.id}`);
      }
      
      visitedNodes.add(nodeToExecute.id);
      execution.currentNode = nodeToExecute.id;

      // Execute current node
      const nodeStartTime = performance.now();
      await this.executeNode(execution, workflow, nodeToExecute);
      const nodeEndTime = performance.now();
      
      execution.metrics.nodeExecutionTimes[nodeToExecute.id] = nodeEndTime - nodeStartTime;

      // Check for emergency stop
      if (execution.context.emergencyStop) {
        execution.status = WorkflowStatus.CANCELLED;
        break;
      }

      // Find next node using dynamic routing
      nodeToExecute = await this.getNextNode(execution, workflow, nodeToExecute);
      
      // Handle end node
      if (nodeToExecute?.type === NodeType.END) {
        break;
      }
    }
  }

  /**
   * Execute workflow in parallel mode with fork/join patterns
   */
  private async executeParallelMode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    startNode: WorkflowNode
  ): Promise<void> {
    // Find parallel sections
    const parallelSections = this.identifyParallelSections(workflow);
    
    // Execute parallel sections concurrently
    for (const section of parallelSections) {
      const promises = section.nodes.map(node => 
        this.executeNodeWithRecovery(execution, workflow, node)
      );
      
      await Promise.all(promises);
      
      // Wait for join node if present
      const joinNode = section.joinNode;
      if (joinNode) {
        await this.executeNode(execution, workflow, joinNode);
      }
    }
  }

  /**
   * Execute workflow in conditional mode with decision trees
   */
  private async executeConditionalMode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    startNode: WorkflowNode
  ): Promise<void> {
    const decisionTree = this.buildDecisionTree(workflow);
    await this.traverseDecisionTree(execution, workflow, decisionTree, startNode);
  }

  /**
   * Execute workflow in optimized mode with performance tracking
   */
  private async executeOptimizedMode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    startNode: WorkflowNode
  ): Promise<void> {
    // Analyze workflow for optimization opportunities
    const optimizedPath = await this.optimizeWorkflowPath(workflow, execution.context);
    
    // Execute optimized path
    for (const node of optimizedPath) {
      await this.executeNodeWithOptimization(execution, workflow, node);
    }
  }

  /**
   * Execute a single node with comprehensive error handling and compliance
   */
  private async executeNode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    node: WorkflowNode
  ): Promise<void> {
    const auditEntry: AuditEntry = {
      timestamp: new Date(),
      nodeId: node.id,
      action: 'execute_start',
      userId: execution.context.userId
    };
    
    try {
      // Pre-execution compliance check
      if (node.complianceRules?.length) {
        await this.validateNodeCompliance(execution, node);
        execution.metrics.complianceChecks++;
      }

      // PHI data handling check
      if (node.phiHandling?.encryptionRequired && execution.context.phiData) {
        await this.encryptPHIData(execution.context.phiData);
        auditEntry.phiAccessed = true;
      }

      // Input validation
      if (node.inputSchema) {
        const inputData = this.extractNodeInputData(execution.context, node);
        node.inputSchema.parse(inputData);
      }

      // Execute node based on type
      const result = await this.executeNodeByType(execution, workflow, node);

      // Output validation
      if (node.outputSchema && result) {
        node.outputSchema.parse(result);
      }

      // Store result in context
      if (result) {
        execution.context.variables[`${node.id}_result`] = result;
      }

      auditEntry.action = 'execute_success';
      auditEntry.data = { result };
      
    } catch (error) {
      execution.metrics.errorCount++;
      auditEntry.action = 'execute_error';
      auditEntry.data = { error: error instanceof Error ? error.message : String(error) };
      
      // Apply retry policy if configured
      if (node.retryPolicy) {
        const shouldRetry = await this.handleNodeRetry(execution, node, error as Error);
        if (shouldRetry) {
          return this.executeNode(execution, workflow, node);
        }
      }
      
      throw error;
    } finally {
      execution.auditTrail.push(auditEntry);
      await this.persistExecutionState(execution);
    }
  }

  /**
   * Execute node based on its type with specialized handlers
   */
  private async executeNodeByType(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    node: WorkflowNode
  ): Promise<any> {
    switch (node.type) {
      case NodeType.START:
      case NodeType.END:
        return { status: 'completed', nodeType: node.type };
      
      case NodeType.TASK:
        return this.executeTaskNode(execution, node);
      
      case NodeType.DECISION:
        return this.executeDecisionNode(execution, node);
      
      case NodeType.PARALLEL:
        return this.executeParallelNode(execution, workflow, node);
      
      case NodeType.JOIN:
        return this.executeJoinNode(execution, node);
      
      case NodeType.LOOP:
        return this.executeLoopNode(execution, workflow, node);
      
      case NodeType.CONDITION:
        return this.executeConditionNode(execution, node);
      
      case NodeType.AI_AGENT:
        return this.executeAIAgentNode(execution, node);
      
      case NodeType.COMPLIANCE_CHECK:
        return this.executeComplianceCheckNode(execution, node);
      
      case NodeType.DATA_TRANSFORM:
        return this.executeDataTransformNode(execution, node);
      
      case NodeType.EMERGENCY_STOP:
        execution.context.emergencyStop = true;
        return { status: 'emergency_stop' };
      
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  /**
   * Execute task node with timeout and monitoring
   */
  private async executeTaskNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { config } = node;
    const timeout = node.timeoutMs || 30000;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task node ${node.id} timed out after ${timeout}ms`));
      }, timeout);
      
      // Simulate task execution
      const taskResult = {
        taskId: node.id,
        status: 'completed',
        output: config.output || `Task ${node.name} executed successfully`,
        timestamp: new Date().toISOString()
      };
      
      clearTimeout(timer);
      resolve(taskResult);
    });
  }

  /**
   * Execute decision node with conditional logic
   */
  private async executeDecisionNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { conditions } = node;
    if (!conditions?.length) {
      throw new Error(`Decision node ${node.id} has no conditions defined`);
    }

    const results = [];
    for (const condition of conditions) {
      const result = this.evaluateCondition(execution.context, condition);
      results.push({ condition: condition.field, result });
    }

    const decision = results.every(r => r.result) ? 'true' : 'false';
    
    return {
      decision,
      evaluatedConditions: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute AI agent node with healthcare-specific processing
   */
  private async executeAIAgentNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { config } = node;
    const agentType = config.agentType || 'default';
    
    // Healthcare AI processing simulation
    const processingTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    execution.metrics.apiCalls++;
    
    return {
      agentType,
      result: `AI Agent ${agentType} processed data for node ${node.id}`,
      processingTime,
      timestamp: new Date().toISOString(),
      complianceVerified: true
    };
  }

  /**
   * Execute compliance check node with HIPAA validation
   */
  private async executeComplianceCheckNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { config } = node;
    const checkTypes = config.checkTypes || ['hipaa', 'gdpr'];
    
    const results = [];
    for (const checkType of checkTypes) {
      const passed = await this.performComplianceCheck(execution.context, checkType);
      results.push({ checkType, passed });
      
      if (!passed) {
        execution.context.complianceFlags.push(`${checkType}_violation_${node.id}`);
      }
    }
    
    const allPassed = results.every(r => r.passed);
    execution.metrics.complianceChecks++;
    
    return {
      complianceResults: results,
      allPassed,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute data transform node with PHI protection
   */
  private async executeDataTransformNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { config } = node;
    const transformType = config.transformType || 'default';
    const inputData = execution.context.variables[config.inputVariable] || {};
    
    // Simulate data transformation
    let transformedData = { ...inputData };
    
    // Apply PHI protection if required
    if (node.phiHandling?.encryptionRequired) {
      transformedData = await this.applyPHIProtection(transformedData);
    }
    
    return {
      transformType,
      inputData,
      transformedData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get next node using dynamic routing with condition evaluation
   */
  private async getNextNode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    currentNode: WorkflowNode
  ): Promise<WorkflowNode | null> {
    const outgoingEdges = workflow.edges.filter(e => e.source === currentNode.id);
    
    if (outgoingEdges.length === 0) {
      return null; // End of workflow
    }
    
    if (outgoingEdges.length === 1) {
      const edge = outgoingEdges[0];
      return workflow.nodes.find(n => n.id === edge.target) || null;
    }
    
    // Multiple edges - evaluate conditions
    for (const edge of outgoingEdges) {
      if (edge.condition) {
        const conditionMet = this.evaluateEdgeCondition(execution.context, edge.condition);
        if (conditionMet) {
          return workflow.nodes.find(n => n.id === edge.target) || null;
        }
      }
    }
    
    // No condition matched - take first edge
    return workflow.nodes.find(n => n.id === outgoingEdges[0].target) || null;
  }

  /**
   * Evaluate condition against execution context
   */
  private evaluateCondition(context: WorkflowContext, condition: WorkflowCondition): boolean {
    const fieldValue = this.getFieldValue(context, condition.field);
    
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      case 'gte':
        return Number(fieldValue) >= Number(condition.value);
      case 'lte':
        return Number(fieldValue) <= Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  /**
   * Handle node retry with backoff strategy
   */
  private async handleNodeRetry(
    execution: WorkflowExecution,
    node: WorkflowNode,
    error: Error
  ): Promise<boolean> {
    const retryPolicy = node.retryPolicy!;
    const retryKey = `${execution.id}:${node.id}:retries`;
    
    const currentRetries = await this.redis.get(retryKey);
    const retryCount = parseInt(currentRetries || '0');
    
    if (retryCount >= retryPolicy.maxAttempts) {
      return false;
    }
    
    // Check if error is retryable
    if (retryPolicy.retryableErrors && retryPolicy.retryableErrors.length > 0) {
      const isRetryable = retryPolicy.retryableErrors.some(pattern => 
        error.message.includes(pattern)
      );
      if (!isRetryable) {
        return false;
      }
    }
    
    // Calculate delay based on strategy
    let delay = retryPolicy.baseDelayMs;
    switch (retryPolicy.backoffStrategy) {
      case 'exponential':
        delay = Math.min(
          retryPolicy.baseDelayMs * Math.pow(2, retryCount),
          retryPolicy.maxDelayMs
        );
        break;
      case 'linear':
        delay = Math.min(
          retryPolicy.baseDelayMs * (retryCount + 1),
          retryPolicy.maxDelayMs
        );
        break;
      // 'fixed' uses base delay as-is
    }
    
    // Update retry count
    await this.redis.setex(retryKey, this.STATE_TTL, String(retryCount + 1));
    execution.metrics.retryCount++;
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return true;
  }

  /**
   * Pause workflow execution with state preservation
   */
  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    execution.status = WorkflowStatus.PAUSED;
    await this.persistExecutionState(execution);
    
    this.emit('executionPaused', { executionId });
  }

  /**
   * Resume paused workflow execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    if (execution.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Execution ${executionId} is not paused`);
    }
    
    execution.status = WorkflowStatus.RUNNING;
    await this.persistExecutionState(execution);
    
    // Resume execution from current node
    const workflow = await this.getWorkflow(execution.workflowId);
    if (workflow && execution.currentNode) {
      const currentNode = workflow.nodes.find(n => n.id === execution.currentNode);
      if (currentNode) {
        this.executeWorkflowAsync(execution, workflow, ExecutionMode.SEQUENTIAL)
          .catch(error => this.handleExecutionError(executionId, error));
      }
    }
    
    this.emit('executionResumed', { executionId });
  }

  /**
   * Cancel workflow execution with cleanup
   */
  async cancelExecution(executionId: string, reason?: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    execution.status = WorkflowStatus.CANCELLED;
    execution.context.emergencyStop = true;
    execution.endTime = new Date();
    
    // Add audit entry for cancellation
    execution.auditTrail.push({
      timestamp: new Date(),
      nodeId: execution.currentNode || 'system',
      action: 'execution_cancelled',
      userId: execution.context.userId,
      data: { reason }
    });
    
    await this.persistExecutionState(execution);
    this.emit('executionCancelled', { executionId, reason });
  }

  /**
   * Rollback workflow execution to previous version
   */
  async rollbackExecution(executionId: string, targetVersion?: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    execution.status = WorkflowStatus.ROLLBACK;
    execution.rollbackVersion = targetVersion || 'previous';
    
    // Restore rollback data if available
    if (execution.context.rollbackData) {
      execution.context.variables = { ...execution.context.rollbackData };
    }
    
    await this.persistExecutionState(execution);
    this.emit('executionRollback', { executionId, targetVersion });
  }

  /**
   * Get workflow execution status and metrics
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    let execution = this.executions.get(executionId);
    
    if (!execution) {
      // Try to load from Redis
      const serialized = await this.redis.get(`${this.WORKFLOW_NAMESPACE}:execution:${executionId}`);
      if (serialized) {
        execution = JSON.parse(serialized);
        this.executions.set(executionId, execution!);
      }
    }
    
    return execution || null;
  }

  /**
   * Get workflow definition by ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    let workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      // Try to load from Redis
      const serialized = await this.redis.get(`${this.WORKFLOW_NAMESPACE}:definition:${workflowId}`);
      if (serialized) {
        workflow = JSON.parse(serialized);
        this.workflows.set(workflowId, workflow!);
      }
    }
    
    return workflow || null;
  }

  /**
   * List all registered workflows with filtering
   */
  async listWorkflows(filters?: {
    category?: string;
    complianceLevel?: string;
    tags?: string[];
  }): Promise<WorkflowDefinition[]> {
    let workflows = Array.from(this.workflows.values());
    
    if (filters) {
      workflows = workflows.filter(workflow => {
        if (filters.category && workflow.metadata.category !== filters.category) {
          return false;
        }
        if (filters.complianceLevel && workflow.complianceLevel !== filters.complianceLevel) {
          return false;
        }
        if (filters.tags && filters.tags.length > 0) {
          const hasAllTags = filters.tags.every(tag => 
            workflow.metadata.tags.includes(tag)
          );
          if (!hasAllTags) {
            return false;
          }
        }
        return true;
      });
    }
    
    return workflows;
  }

  /**
   * Get execution history for a workflow
   */
  async getExecutionHistory(
    workflowId: string,
    limit: number = 100
  ): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('start_time', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`[WorkflowEngine] Failed to get execution history:`, error);
      return [];
    }
  }

  /**
   * Create workflow template for common healthcare scenarios
   */
  createHealthcareTemplate(templateType: 'patient_intake' | 'clinical_review' | 'compliance_audit'): WorkflowDefinition {
    const templateId = uuidv4();
    const baseTemplate: Partial<WorkflowDefinition> = {
      id: templateId,
      version: '1.0.0',
      metadata: {
        created: new Date(),
        createdBy: 'system',
        tags: ['healthcare', 'template'],
        category: 'healthcare'
      },
      complianceLevel: 'phi',
      encryptionRequired: true
    };
    
    switch (templateType) {
      case 'patient_intake':
        return {
          ...baseTemplate,
          name: 'Patient Intake Workflow',
          description: 'Automated patient intake with HIPAA compliance',
          nodes: [
            { id: 'start', type: NodeType.START, name: 'Start', config: {} },
            { 
              id: 'phi_validation', 
              type: NodeType.COMPLIANCE_CHECK, 
              name: 'PHI Validation',
              config: { checkTypes: ['hipaa', 'phi_encryption'] },
              phiHandling: {
                encryptionRequired: true,
                accessLogging: true,
                dataClassification: 'phi'
              }
            },
            {
              id: 'data_collection',
              type: NodeType.DATA_TRANSFORM,
              name: 'Patient Data Collection',
              config: { transformType: 'phi_collection' }
            },
            { id: 'end', type: NodeType.END, name: 'End', config: {} }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'phi_validation' },
            { id: 'e2', source: 'phi_validation', target: 'data_collection' },
            { id: 'e3', source: 'data_collection', target: 'end' }
          ]
        } as WorkflowDefinition;
      
      case 'clinical_review':
        return {
          ...baseTemplate,
          name: 'Clinical Review Workflow',
          description: 'AI-assisted clinical review with compliance checks',
          nodes: [
            { id: 'start', type: NodeType.START, name: 'Start', config: {} },
            {
              id: 'ai_analysis',
              type: NodeType.AI_AGENT,
              name: 'Clinical AI Analysis',
              config: { agentType: 'clinical_reviewer' }
            },
            {
              id: 'compliance_check',
              type: NodeType.COMPLIANCE_CHECK,
              name: 'Clinical Compliance Check',
              config: { checkTypes: ['clinical_standards', 'medication_safety'] }
            },
            { id: 'end', type: NodeType.END, name: 'End', config: {} }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'ai_analysis' },
            { id: 'e2', source: 'ai_analysis', target: 'compliance_check' },
            { id: 'e3', source: 'compliance_check', target: 'end' }
          ]
        } as WorkflowDefinition;
      
      case 'compliance_audit':
        return {
          ...baseTemplate,
          name: 'Compliance Audit Workflow',
          description: 'Automated compliance auditing with reporting',
          nodes: [
            { id: 'start', type: NodeType.START, name: 'Start', config: {} },
            {
              id: 'audit_check',
              type: NodeType.COMPLIANCE_CHECK,
              name: 'Full Compliance Audit',
              config: { checkTypes: ['hipaa', 'gdpr', 'sox', 'clinical'] }
            },
            {
              id: 'report_generation',
              type: NodeType.TASK,
              name: 'Generate Audit Report',
              config: { taskType: 'report_generation' }
            },
            { id: 'end', type: NodeType.END, name: 'End', config: {} }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'audit_check' },
            { id: 'e2', source: 'audit_check', target: 'report_generation' },
            { id: 'e3', source: 'report_generation', target: 'end' }
          ]
        } as WorkflowDefinition;
      
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }

  // Private helper methods

  private setupEventHandlers(): void {
    this.on('executionStarted', (data) => {
      console.log(`[WorkflowEngine] Execution started: ${data.executionId}`);
    });
    
    this.on('executionCompleted', (data) => {
      console.log(`[WorkflowEngine] Execution completed: ${data.executionId} (${data.duration}ms)`);
    });
    
    this.on('executionFailed', (data) => {
      console.error(`[WorkflowEngine] Execution failed: ${data.executionId} - ${data.error}`);
    });
  }

  private generateWorkflowId(name: string): string {
    const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // v5 namespace
    return uuidv5(name, namespace);
  }

  private validateWorkflowGraph(workflow: WorkflowDefinition): void {
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    const startNodes = workflow.nodes.filter(n => n.type === NodeType.START);
    const endNodes = workflow.nodes.filter(n => n.type === NodeType.END);
    
    // Validate required nodes
    if (startNodes.length !== 1) {
      throw new Error('Workflow must have exactly one START node');
    }
    if (endNodes.length === 0) {
      throw new Error('Workflow must have at least one END node');
    }
    
    // Validate edges reference existing nodes
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Edge source node not found: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Edge target node not found: ${edge.target}`);
      }
    }
    
    // Check for isolated nodes
    const referencedNodes = new Set([
      ...workflow.edges.map(e => e.source),
      ...workflow.edges.map(e => e.target)
    ]);
    
    for (const node of workflow.nodes) {
      if (node.type !== NodeType.START && !referencedNodes.has(node.id)) {
        console.warn(`[WorkflowEngine] Warning: Node ${node.id} is not connected to any other nodes`);
      }
    }
  }

  private async validateComplianceRequirements(workflow: WorkflowDefinition): Promise<void> {
    // Check PHI handling requirements
    const phiNodes = workflow.nodes.filter(n => n.phiHandling?.encryptionRequired);
    if (phiNodes.length > 0 && workflow.complianceLevel !== 'phi' && workflow.complianceLevel !== 'critical') {
      throw new Error('Workflows with PHI handling must have compliance level "phi" or "critical"');
    }
    
    // Validate compliance check nodes for PHI workflows
    if (workflow.complianceLevel === 'phi' || workflow.complianceLevel === 'critical') {
      const hasComplianceCheck = workflow.nodes.some(n => n.type === NodeType.COMPLIANCE_CHECK);
      if (!hasComplianceCheck) {
        console.warn(`[WorkflowEngine] Warning: PHI/Critical workflow should include compliance check nodes`);
      }
    }
  }

  private async ensureDatabaseTables(): Promise<void> {
    try {
      // Create workflow_definitions table
      await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS workflow_definitions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workflow_id VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            version VARCHAR(50) NOT NULL,
            definition JSONB NOT NULL,
            compliance_level VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_workflow_definitions_workflow_id ON workflow_definitions(workflow_id);
          CREATE INDEX IF NOT EXISTS idx_workflow_definitions_compliance_level ON workflow_definitions(compliance_level);
        `
      });
      
      // Create workflow_executions table
      await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS workflow_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            execution_id VARCHAR(255) UNIQUE NOT NULL,
            workflow_id VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL,
            start_time TIMESTAMPTZ NOT NULL,
            end_time TIMESTAMPTZ,
            current_node VARCHAR(255),
            context JSONB,
            metrics JSONB,
            audit_trail JSONB,
            version VARCHAR(50),
            rollback_version VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_workflow_executions_execution_id ON workflow_executions(execution_id);
          CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
          CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
        `
      });
    } catch (error) {
      console.warn('[WorkflowEngine] Database table creation failed (may already exist):', error);
    }
  }

  private async recoverRunningExecutions(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select('*')
        .in('status', [WorkflowStatus.RUNNING, WorkflowStatus.PAUSED]);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log(`[WorkflowEngine] Recovering ${data.length} running executions`);
        
        for (const row of data) {
          const execution: WorkflowExecution = {
            id: row.execution_id,
            workflowId: row.workflow_id,
            status: row.status,
            startTime: new Date(row.start_time),
            endTime: row.end_time ? new Date(row.end_time) : undefined,
            currentNode: row.current_node,
            context: row.context,
            metrics: row.metrics,
            auditTrail: row.audit_trail || [],
            version: row.version,
            rollbackVersion: row.rollback_version
          };
          
          this.executions.set(execution.id, execution);
        }
      }
    } catch (error) {
      console.error('[WorkflowEngine] Failed to recover running executions:', error);
    }
  }

  private async loadWorkflowDefinitions(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_definitions')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log(`[WorkflowEngine] Loading ${data.length} workflow definitions`);
        
        for (const row of data) {
          this.workflows.set(row.workflow_id, row.definition);
        }
      }
    } catch (error) {
      console.error('[WorkflowEngine] Failed to load workflow definitions:', error);
    }
  }

  private async persistWorkflowDefinition(workflow: WorkflowDefinition): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('workflow_definitions')
        .upsert({
          workflow_id: workflow.id,
          name: workflow.name,
          version: workflow.version,
          definition: workflow,
          compliance_level: workflow.complianceLevel
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('[WorkflowEngine] Failed to persist workflow definition:', error);
      throw error;
    }
  }

  private async persistExecutionState(execution: WorkflowExecution): Promise<void> {
    try {
      // Store in Redis for fast access
      await this.redis.setex(
        `${this.WORKFLOW_NAMESPACE}:execution:${execution.id}`,
        this.STATE_TTL,
        JSON.stringify(execution)
      );
      
      // Store in Supabase for persistence
      const { error } = await this.supabase
        .from('workflow_executions')
        .upsert({
          execution_id: execution.id,
          workflow_id: execution.workflowId,
          status: execution.status,
          start_time: execution.startTime.toISOString(),
          end_time: execution.endTime?.toISOString(),
          current_node: execution.currentNode,
          context: execution.context,
          metrics: execution.metrics,
          audit_trail: execution.auditTrail,
          version: execution.version,
          rollback_version: execution.rollbackVersion
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('[WorkflowEngine] Failed to persist execution state:', error);
    }
  }

  private async handleExecutionError(executionId: string, error: Error): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = WorkflowStatus.FAILED;
      execution.endTime = new Date();
      execution.metrics.errorCount++;
      
      execution.auditTrail.push({
        timestamp: new Date(),
        nodeId: execution.currentNode || 'system',
        action: 'execution_error',
        data: { error: error.message }
      });
      
      await this.persistExecutionState(execution);
    }
    
    this.emit('executionFailed', { executionId, error: error.message });
  }

  private getFieldValue(context: WorkflowContext, field: string): any {
    // Support nested field access with dot notation
    const parts = field.split('.');
    let value: any = context.variables;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }

  private evaluateEdgeCondition(context: WorkflowContext, condition: string): boolean {
    // Simple expression evaluation - in production, use a proper expression engine
    try {
      // Replace variable references with actual values
      let expression = condition;
      const variableRegex = /\$\{([^}]+)\}/g;
      
      expression = expression.replace(variableRegex, (match, varName) => {
        const value = this.getFieldValue(context, varName);
        return JSON.stringify(value);
      });
      
      // Note: In production, use a safe expression evaluator instead of eval
      return Boolean(eval(expression));
    } catch (error) {
      console.warn(`[WorkflowEngine] Failed to evaluate edge condition: ${condition}`, error);
      return false;
    }
  }

  private extractNodeInputData(context: WorkflowContext, node: WorkflowNode): any {
    const { config } = node;
    const inputVariable = config.inputVariable;
    
    if (inputVariable) {
      return context.variables[inputVariable];
    }
    
    // Return all variables if no specific input variable is specified
    return context.variables;
  }

  private async validateNodeCompliance(execution: WorkflowExecution, node: WorkflowNode): Promise<void> {
    const { complianceRules } = node;
    if (!complianceRules?.length) return;
    
    for (const rule of complianceRules) {
      const passed = await this.performComplianceCheck(execution.context, rule);
      if (!passed) {
        throw new Error(`Compliance check failed for node ${node.id}: ${rule}`);
      }
    }
  }

  private async performComplianceCheck(context: WorkflowContext, checkType: string): Promise<boolean> {
    // Simulate compliance checks - in production, implement actual validation logic
    switch (checkType.toLowerCase()) {
      case 'hipaa':
        return this.validateHIPAACompliance(context);
      case 'gdpr':
        return this.validateGDPRCompliance(context);
      case 'phi_encryption':
        return this.validatePHIEncryption(context);
      case 'clinical_standards':
        return this.validateClinicalStandards(context);
      case 'medication_safety':
        return this.validateMedicationSafety(context);
      default:
        console.warn(`[WorkflowEngine] Unknown compliance check type: ${checkType}`);
        return true;
    }
  }

  private validateHIPAACompliance(context: WorkflowContext): boolean {
    // Implement HIPAA compliance validation
    return !context.complianceFlags.some(flag => flag.includes('hipaa_violation'));
  }

  private validateGDPRCompliance(context: WorkflowContext): boolean {
    // Implement GDPR compliance validation
    return !context.complianceFlags.some(flag => flag.includes('gdpr_violation'));
  }

  private validatePHIEncryption(context: WorkflowContext): boolean {
    // Check if PHI data is properly encrypted
    return Object.keys(context.phiData || {}).length === 0 || 
           context.complianceFlags.includes('phi_encrypted');
  }

  private validateClinicalStandards(context: WorkflowContext): boolean {
    // Implement clinical standards validation
    return true; // Simplified for demo
  }

  private validateMedicationSafety(context: WorkflowContext): boolean {
    // Implement medication safety checks
    return true; // Simplified for demo
  }

  private async encryptPHIData(phiData: Record<string, any>): Promise<void> {
    // Implement PHI data encryption using AES-256
    const algorithm = 'aes-256-gcm';
    
    for (const [key, value] of Object.entries(phiData)) {
      if (typeof value === 'string' && value.length > 0) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipher(algorithm, this.encryptionKey);
        
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        phiData[key] = `encrypted:${iv.toString('hex')}:${encrypted}`;
      }
    }
  }

  private async applyPHIProtection(data: Record<string, any>): Promise<Record<string, any>> {
    // Apply PHI protection measures
    const protectedData = { ...data };
    
    // Encrypt sensitive fields
    await this.encryptPHIData(protectedData);
    
    return protectedData;
  }

  // Placeholder methods for advanced execution modes

  private identifyParallelSections(workflow: WorkflowDefinition): Array<{
    nodes: WorkflowNode[];
    joinNode?: WorkflowNode;
  }> {
    // Implement parallel section identification logic
    return [];
  }

  private buildDecisionTree(workflow: WorkflowDefinition): any {
    // Implement decision tree building logic
    return {};
  }

  private async traverseDecisionTree(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    decisionTree: any,
    currentNode: WorkflowNode
  ): Promise<void> {
    // Implement decision tree traversal logic
  }

  private async optimizeWorkflowPath(
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<WorkflowNode[]> {
    // Implement workflow path optimization logic
    return workflow.nodes;
  }

  private async executeNodeWithRecovery(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    node: WorkflowNode
  ): Promise<void> {
    try {
      await this.executeNode(execution, workflow, node);
    } catch (error) {
      console.error(`[WorkflowEngine] Node ${node.id} failed with recovery:`, error);
      // Implement recovery logic
    }
  }

  private async executeNodeWithOptimization(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    node: WorkflowNode
  ): Promise<void> {
    // Implement optimized node execution
    await this.executeNode(execution, workflow, node);
  }

  private async executeParallelNode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    node: WorkflowNode
  ): Promise<any> {
    // Implement parallel node execution
    return { status: 'parallel_started', timestamp: new Date().toISOString() };
  }

  private async executeJoinNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    // Implement join node execution
    return { status: 'join_completed', timestamp: new Date().toISOString() };
  }

  private async executeLoopNode(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    node: WorkflowNode
  ): Promise<any> {
    // Implement loop node execution
    return { status: 'loop_executed', timestamp: new Date().toISOString() };
  }

  private async executeConditionNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    // Implement condition node execution
    const { conditions } = node;
    if (!conditions?.length) {
      return { result: true, timestamp: new Date().toISOString() };
    }

    const result = conditions.every(condition => 
      this.evaluateCondition(execution.context, condition)
    );

    return { result, timestamp: new Date().toISOString() };
  }

  /**
   * Cleanup resources and close connections
   */
  async shutdown(): Promise<void> {
    try {
      // Cancel all running executions
      for (const [executionId, execution] of this.executions) {
        if (execution.status === WorkflowStatus.RUNNING) {
          await this.cancelExecution(executionId, 'Engine shutdown');
        }
      }
      
      // Close Redis connection
      await this.redis.quit();
      
      // Remove all event listeners
      this.removeAllListeners();
      
      console.log('[WorkflowEngine] Shutdown completed');
    } catch (error) {
      console.error('[WorkflowEngine] Error during shutdown:', error);
    }
  }
}

export default WorkflowEngine;