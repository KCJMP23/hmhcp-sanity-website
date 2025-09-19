import { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '@/types/workflows/visual-builder';
import { 
  ConditionalLogicEngine, 
  ConditionalExpression, 
  LoopConfiguration, 
  SwitchConfiguration, 
  ExceptionHandling, 
  ParallelExecution,
  ControlFlowResult 
} from './conditional-logic-engine';

export interface ControlFlowContext {
  currentNode: string;
  workflow: WorkflowDefinition;
  variables: Record<string, any>;
  executionHistory: ExecutionStep[];
  parentContext?: ControlFlowContext;
}

export interface ExecutionStep {
  nodeId: string;
  timestamp: Date;
  action: 'start' | 'complete' | 'error' | 'break' | 'continue';
  variables?: Record<string, any>;
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

export interface ControlFlowState {
  currentNode: string;
  nextNodes: string[];
  isExecuting: boolean;
  isPaused: boolean;
  isStopped: boolean;
  variables: Record<string, any>;
  executionHistory: ExecutionStep[];
  currentLoop?: {
    type: string;
    iteration: number;
    maxIterations: number;
  };
  currentException?: {
    type: string;
    message: string;
    data?: any;
  };
}

export class ControlFlowManager {
  private logicEngine: ConditionalLogicEngine;
  private state: ControlFlowState;
  private listeners: Map<string, Set<(state: ControlFlowState) => void>> = new Map();

  constructor(initialContext?: Record<string, any>) {
    this.logicEngine = new ConditionalLogicEngine(initialContext);
    this.state = {
      currentNode: '',
      nextNodes: [],
      isExecuting: false,
      isPaused: false,
      isStopped: false,
      variables: {},
      executionHistory: [],
    };
  }

  public async executeWorkflow(
    workflow: WorkflowDefinition,
    startNodeId?: string
  ): Promise<ControlFlowResult> {
    const startNode = startNodeId 
      ? workflow.nodes.find(n => n.id === startNodeId)
      : workflow.nodes.find(n => n.type === 'workflow-start');

    if (!startNode) {
      throw new Error('No start node found in workflow');
    }

    this.state.isExecuting = true;
    this.state.isPaused = false;
    this.state.isStopped = false;
    this.state.currentNode = startNode.id;
    this.state.executionHistory = [];

    this.notifyListeners('execution-started');

    try {
      let currentNode = startNode;
      let result: ControlFlowResult = {
        nextNodes: [],
        shouldBreak: false,
        shouldContinue: false,
        variables: this.state.variables,
      };

      // Execute nodes until we reach an end node or encounter a break condition
      while (currentNode && !this.state.isStopped && !this.state.isPaused) {
        result = await this.executeNode(currentNode, workflow);
        
        // If we should break, stop execution
        if (result.shouldBreak) {
          break;
        }

        // If there are no next nodes, stop execution
        if (result.nextNodes.length === 0) {
          break;
        }

        // Move to the next node
        const nextNodeId = result.nextNodes[0]; // Take the first next node
        currentNode = workflow.nodes.find(n => n.id === nextNodeId);
      }

      this.state.isExecuting = false;
      this.notifyListeners('execution-completed');
      return result;
    } catch (error) {
      this.state.isExecuting = false;
      this.state.currentException = {
        type: error instanceof Error ? error.constructor.name : 'Error',
        message: error instanceof Error ? error.message : String(error),
        data: error,
      };
      this.notifyListeners('execution-error');
      throw error;
    }
  }

  public async executeNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    this.logExecutionStep(node.id, 'start');
    this.state.currentNode = node.id;

    try {
      let result: ControlFlowResult;

      switch (node.type) {
        case 'workflow-start':
          result = await this.executeStartNode(node, workflow);
          break;
        case 'workflow-end':
          result = await this.executeEndNode(node, workflow);
          break;
        case 'logic-if-else':
          result = await this.executeIfElseNode(node, workflow);
          break;
        case 'logic-loop':
          result = await this.executeLoopNode(node, workflow);
          break;
        case 'logic-switch':
          result = await this.executeSwitchNode(node, workflow);
          break;
        case 'logic-delay':
          result = await this.executeDelayNode(node, workflow);
          break;
        case 'logic-exception':
          result = await this.executeExceptionNode(node, workflow);
          break;
        case 'logic-parallel':
          result = await this.executeParallelNode(node, workflow);
          break;
        case 'ai-agent':
          result = await this.executeAIAgentNode(node, workflow);
          break;
        case 'data-transform':
        case 'data-filter':
        case 'data-aggregate':
        case 'data-validate':
          result = await this.executeDataProcessorNode(node, workflow);
          break;
        default:
          result = await this.executeGenericNode(node, workflow);
      }

      this.logExecutionStep(node.id, 'complete', result.variables);
      this.state.variables = { ...this.state.variables, ...result.variables };
      this.state.nextNodes = result.nextNodes;

      if (result.shouldBreak) {
        this.logExecutionStep(node.id, 'break');
        this.state.isStopped = true;
      }

      if (result.shouldContinue) {
        this.logExecutionStep(node.id, 'continue');
      }

      if (result.exception) {
        this.state.currentException = result.exception;
        this.logExecutionStep(node.id, 'error', undefined, result.exception);
      }

      this.notifyListeners('node-completed');
      return result;

    } catch (error) {
      this.logExecutionStep(node.id, 'error', undefined, {
        type: error instanceof Error ? error.constructor.name : 'Error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public pauseExecution(): void {
    this.state.isPaused = true;
    this.notifyListeners('execution-paused');
  }

  public resumeExecution(): void {
    this.state.isPaused = false;
    this.notifyListeners('execution-resumed');
  }

  public stopExecution(): void {
    this.state.isStopped = true;
    this.state.isExecuting = false;
    this.notifyListeners('execution-stopped');
  }

  public getState(): ControlFlowState {
    return { ...this.state };
  }

  public setVariable(name: string, value: any): void {
    this.logicEngine.setVariable(name, value);
    this.state.variables[name] = value;
    this.notifyListeners('variable-changed');
  }

  public getVariable(name: string): any {
    return this.logicEngine.getVariable(name);
  }

  public subscribe(event: string, callback: (state: ControlFlowState) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private async executeStartNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
    const nextNodes = outgoingEdges.map(e => e.target);

    return {
      nextNodes,
      shouldBreak: false,
      shouldContinue: false,
      variables: this.state.variables,
    };
  }

  private async executeEndNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    return {
      nextNodes: [],
      shouldBreak: true,
      shouldContinue: false,
      variables: this.state.variables,
    };
  }

  private async executeIfElseNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const config = node.data.config as any;
    const condition = config.condition as ConditionalExpression;
    const trueActions = config.trueActions || [];
    const falseActions = config.falseActions || [];

    return this.logicEngine.executeIfElse(condition, trueActions, falseActions, workflow);
  }

  private async executeLoopNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const config = node.data.config as any;
    const loopConfig = config.loopConfig as LoopConfiguration;
    const actions = config.actions || [];

    this.state.currentLoop = {
      type: loopConfig.type,
      iteration: 0,
      maxIterations: loopConfig.iterations || 1000,
    };

    const result = this.logicEngine.executeLoop(loopConfig, actions, workflow);

    if (this.state.currentLoop) {
      this.state.currentLoop.iteration++;
    }

    return result;
  }

  private async executeSwitchNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const config = node.data.config as any;
    const switchConfig = config.switchConfig as SwitchConfiguration;

    return this.logicEngine.executeSwitch(switchConfig, workflow);
  }

  private async executeDelayNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const config = node.data.config as any;
    const delayMs = config.delayMs || 1000;

    await new Promise(resolve => setTimeout(resolve, delayMs));

    const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
    const nextNodes = outgoingEdges.map(e => e.target);

    return {
      nextNodes,
      shouldBreak: false,
      shouldContinue: false,
      variables: this.state.variables,
    };
  }

  private async executeExceptionNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const config = node.data.config as any;
    const exceptionConfig = config.exceptionConfig as ExceptionHandling;

    return this.logicEngine.executeExceptionHandling(exceptionConfig, workflow);
  }

  private async executeParallelNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const config = node.data.config as any;
    const parallelConfig = config.parallelConfig as ParallelExecution;

    return this.logicEngine.executeParallel(parallelConfig, workflow);
  }

  private async executeAIAgentNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    // Simulate AI agent execution
    const config = node.data.config as any;
    const agentType = config.agentType || 'research';
    const prompt = config.prompt || '';

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate AI response
    const response = `AI Agent (${agentType}) processed: ${prompt.substring(0, 50)}...`;
    this.setVariable(`${node.id}_response`, response);

    const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
    const nextNodes = outgoingEdges.map(e => e.target);

    return {
      nextNodes,
      shouldBreak: false,
      shouldContinue: false,
      variables: this.state.variables,
    };
  }

  private async executeDataProcessorNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const config = node.data.config as any;
    const processorType = config.processorType || 'transform';
    const inputData = this.getVariable('input_data');

    let result: any;

    try {
      switch (processorType) {
        case 'transform':
          result = this.executeDataTransform(inputData, config);
          break;
        case 'filter':
          result = this.executeDataFilter(inputData, config);
          break;
        case 'aggregate':
          result = this.executeDataAggregate(inputData, config);
          break;
        case 'validate':
          result = this.executeDataValidate(inputData, config);
          break;
        default:
          result = inputData;
      }

      this.setVariable(`${node.id}_result`, result);

      const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
      const nextNodes = outgoingEdges.map(e => e.target);

      return {
        nextNodes,
        shouldBreak: false,
        shouldContinue: false,
        variables: this.state.variables,
      };
    } catch (error) {
      // For validation errors, re-throw to let the test catch them
      if (processorType === 'validate') {
        throw error;
      }
      
      // For other processor types, return error in result
      this.setVariable(`${node.id}_result`, { 
        data: {}, 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
      const nextNodes = outgoingEdges.map(e => e.target);

      return {
        nextNodes,
        shouldBreak: false,
        shouldContinue: false,
        variables: this.state.variables,
      };
    }
  }

  private async executeGenericNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): Promise<ControlFlowResult> {
    const outgoingEdges = workflow.edges.filter(e => e.source === node.id);
    const nextNodes = outgoingEdges.map(e => e.target);

    return {
      nextNodes,
      shouldBreak: false,
      shouldContinue: false,
      variables: this.state.variables,
    };
  }

  private executeDataTransform(inputData: any, config: any): any {
    const transformScript = config.transformScript || 'return data;';
    
    try {
      // In a real implementation, this would use a safe JavaScript evaluator
      // For now, we'll simulate basic transformations
      if (typeof inputData === 'object' && inputData !== null) {
        return { ...inputData, transformed: true, timestamp: new Date().toISOString() };
      }
      return inputData;
    } catch (error) {
      throw new Error(`Transform error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeDataFilter(inputData: any, config: any): any {
    const filterExpression = config.filterExpression || 'true';
    
    try {
      if (Array.isArray(inputData)) {
        // Simulate filtering
        return inputData.filter(item => {
          // In a real implementation, this would evaluate the filter expression safely
          return true;
        });
      }
      return inputData;
    } catch (error) {
      throw new Error(`Filter error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeDataAggregate(inputData: any, config: any): any {
    const aggregationType = config.aggregationType || 'count';
    
    try {
      if (Array.isArray(inputData)) {
        switch (aggregationType) {
          case 'count':
            return { count: inputData.length };
          case 'sum':
            return { sum: inputData.reduce((acc, item) => acc + (typeof item === 'number' ? item : 0), 0) };
          case 'average':
            const numbers = inputData.filter(item => typeof item === 'number');
            return { average: numbers.length > 0 ? numbers.reduce((acc, item) => acc + item, 0) / numbers.length : 0 };
          default:
            return { count: inputData.length };
        }
      }
      return inputData;
    } catch (error) {
      throw new Error(`Aggregation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeDataValidate(inputData: any, config: any): any {
    const validationRules = config.validationRules || {};
    
    try {
      // Simulate validation
      const errors: string[] = [];
      
      if (validationRules.required && !inputData) {
        errors.push('Field is required');
      }
      
      if (validationRules.minLength && typeof inputData === 'string' && inputData.length < validationRules.minLength) {
        errors.push(`Minimum length is ${validationRules.minLength}`);
      }
      
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      return { valid: true, data: inputData };
    } catch (error) {
      throw new Error(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private logExecutionStep(
    nodeId: string,
    action: 'start' | 'complete' | 'error' | 'break' | 'continue',
    variables?: Record<string, any>,
    error?: { type: string; message: string; stack?: string }
  ): void {
    const step: ExecutionStep = {
      nodeId,
      timestamp: new Date(),
      action,
      variables,
      error,
    };

    this.state.executionHistory.push(step);
    this.notifyListeners('step-logged');
  }

  private notifyListeners(event: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(this.state);
        } catch (error) {
          console.error('Error in control flow listener:', error);
        }
      });
    }
  }
}
