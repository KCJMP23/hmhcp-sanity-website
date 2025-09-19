import { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '@/types/workflows/visual-builder';

export interface ConditionalExpression {
  id: string;
  type: 'comparison' | 'logical' | 'function' | 'variable';
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  leftOperand: ConditionalExpression | string | number | boolean;
  rightOperand?: ConditionalExpression | string | number | boolean;
  functionName?: string;
  parameters?: (ConditionalExpression | string | number | boolean)[];
  variableName?: string;
  defaultValue?: any;
}

export interface LoopConfiguration {
  type: 'for' | 'while' | 'foreach' | 'do-while';
  condition?: ConditionalExpression;
  iterations?: number;
  iterator?: string;
  collection?: string;
  breakCondition?: ConditionalExpression;
  continueCondition?: ConditionalExpression;
}

export interface SwitchConfiguration {
  variable: string;
  cases: {
    value: string | number | boolean;
    condition?: ConditionalExpression;
    actions: string[];
  }[];
  defaultCase?: {
    actions: string[];
  };
}

export interface ExceptionHandling {
  tryBlock: string[];
  catchBlocks: {
    exceptionType: string;
    variable: string;
    actions: string[];
  }[];
  finallyBlock?: string[];
}

export interface ParallelExecution {
  branches: {
    id: string;
    condition?: ConditionalExpression;
    actions: string[];
    timeout?: number;
  }[];
  synchronization: 'wait-all' | 'wait-any' | 'race';
  timeout?: number;
}

export interface ControlFlowResult {
  nextNodes: string[];
  shouldBreak: boolean;
  shouldContinue: boolean;
  exception?: {
    type: string;
    message: string;
    data?: any;
  };
  variables: Record<string, any>;
}

export class ConditionalLogicEngine {
  private variables: Map<string, any> = new Map();
  private context: Record<string, any> = {};

  constructor(context?: Record<string, any>) {
    this.context = context || {};
  }

  public evaluateCondition(expression: ConditionalExpression): boolean {
    try {
      switch (expression.type) {
        case 'comparison':
          return this.evaluateComparison(expression);
        case 'logical':
          return this.evaluateLogical(expression);
        case 'function':
          return this.evaluateFunction(expression);
        case 'variable':
          return this.evaluateVariable(expression);
        default:
          console.warn(`Unknown expression type: ${expression.type}`);
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  // Method for testing error conditions that should throw
  public evaluateConditionStrict(expression: ConditionalExpression): boolean {
    switch (expression.type) {
      case 'comparison':
        return this.evaluateComparison(expression);
      case 'logical':
        return this.evaluateLogical(expression);
      case 'function':
        return this.evaluateFunction(expression);
      case 'variable':
        return this.evaluateVariable(expression);
      default:
        throw new Error(`Unknown expression type: ${expression.type}`);
    }
  }

  public executeIfElse(
    condition: ConditionalExpression,
    trueActions: string[],
    falseActions: string[],
    workflow: WorkflowDefinition
  ): ControlFlowResult {
    const conditionResult = this.evaluateCondition(condition);
    const nextNodes = conditionResult ? trueActions : falseActions;
    
    return {
      nextNodes: this.resolveNodeIds(nextNodes, workflow),
      shouldBreak: false,
      shouldContinue: false,
      variables: Object.fromEntries(this.variables),
    };
  }

  public executeLoop(
    config: LoopConfiguration,
    actions: string[],
    workflow: WorkflowDefinition
  ): ControlFlowResult {
    const results: ControlFlowResult[] = [];
    let iterationCount = 0;
    const maxIterations = config.iterations || 1000;

    try {
      switch (config.type) {
        case 'for':
          return this.executeForLoop(config, actions, workflow, maxIterations);
        case 'while':
          return this.executeWhileLoop(config, actions, workflow, maxIterations);
        case 'foreach':
          return this.executeForEachLoop(config, actions, workflow);
        case 'do-while':
          return this.executeDoWhileLoop(config, actions, workflow, maxIterations);
        default:
          throw new Error(`Unknown loop type: ${config.type}`);
      }
    } catch (error) {
      return {
        nextNodes: [],
        shouldBreak: true,
        shouldContinue: false,
        exception: {
          type: 'LoopError',
          message: error instanceof Error ? error.message : 'Unknown loop error',
        },
        variables: Object.fromEntries(this.variables),
      };
    }
  }

  public executeSwitch(
    config: SwitchConfiguration,
    workflow: WorkflowDefinition
  ): ControlFlowResult {
    const variableValue = this.getVariable(config.variable);
    let matchedCase = config.cases.find(c => {
      if (c.condition) {
        return this.evaluateCondition(c.condition);
      }
      return this.compareValues(variableValue, c.value);
    });

    if (!matchedCase && config.defaultCase) {
      matchedCase = config.defaultCase;
    }

    const nextNodes = matchedCase ? this.resolveNodeIds(matchedCase.actions, workflow) : [];

    return {
      nextNodes,
      shouldBreak: false,
      shouldContinue: false,
      variables: Object.fromEntries(this.variables),
    };
  }

  public executeExceptionHandling(
    config: ExceptionHandling,
    workflow: WorkflowDefinition
  ): ControlFlowResult {
    try {
      // Execute try block
      const tryResult = this.executeActions(config.tryBlock, workflow);
      
      return {
        nextNodes: tryResult.nextNodes,
        shouldBreak: false,
        shouldContinue: false,
        variables: Object.fromEntries(this.variables),
      };
    } catch (error) {
      // Find matching catch block
      const catchBlock = config.catchBlocks.find(cb => 
        cb.exceptionType === 'any' || 
        error instanceof Error && error.constructor.name === cb.exceptionType
      );

      if (catchBlock) {
        // Set exception variable
        this.setVariable(catchBlock.variable, {
          type: error instanceof Error ? error.constructor.name : 'Error',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        const catchResult = this.executeActions(catchBlock.actions, workflow);
        
        return {
          nextNodes: catchResult.nextNodes,
          shouldBreak: false,
          shouldContinue: false,
          variables: Object.fromEntries(this.variables),
        };
      } else {
        // Re-throw if no catch block matches
        throw error;
      }
    } finally {
      // Execute finally block if present
      if (config.finallyBlock) {
        this.executeActions(config.finallyBlock, workflow);
      }
    }
  }

  public executeParallel(
    config: ParallelExecution,
    workflow: WorkflowDefinition
  ): ControlFlowResult {
    const promises = config.branches.map(branch => 
      this.executeBranch(branch, workflow, config.timeout)
    );

    return new Promise((resolve, reject) => {
      const timeout = config.timeout || 30000;
      const timeoutId = setTimeout(() => {
        reject(new Error('Parallel execution timeout'));
      }, timeout);

      switch (config.synchronization) {
        case 'wait-all':
          Promise.all(promises).then(results => {
            clearTimeout(timeoutId);
            resolve(this.mergeParallelResults(results));
          }).catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
          break;
        case 'wait-any':
          Promise.race(promises).then(result => {
            clearTimeout(timeoutId);
            resolve(result);
          }).catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
          break;
        case 'race':
          Promise.race(promises).then(result => {
            clearTimeout(timeoutId);
            resolve(result);
          }).catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
          break;
      }
    }) as any; // Type assertion for Promise handling
  }

  public setVariable(name: string, value: any): void {
    this.variables.set(name, value);
  }

  public getVariable(name: string): any {
    return this.variables.get(name) ?? this.context[name];
  }

  public setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  public clearVariables(): void {
    this.variables.clear();
  }

  private evaluateComparison(expression: ConditionalExpression): boolean {
    if (!expression.operator) {
      throw new Error('Missing comparison operator');
    }

    const left = this.evaluateOperand(expression.leftOperand);
    const right = this.evaluateOperand(expression.rightOperand!);

    switch (expression.operator) {
      case 'eq':
        return this.compareValues(left, right) === 0;
      case 'ne':
        return this.compareValues(left, right) !== 0;
      case 'gt':
        return this.compareValues(left, right) > 0;
      case 'gte':
        return this.compareValues(left, right) >= 0;
      case 'lt':
        return this.compareValues(left, right) < 0;
      case 'lte':
        return this.compareValues(left, right) <= 0;
      case 'contains':
        return typeof left === 'string' && typeof right === 'string' && left.includes(right);
      case 'startsWith':
        return typeof left === 'string' && typeof right === 'string' && left.startsWith(right);
      case 'endsWith':
        return typeof left === 'string' && typeof right === 'string' && left.endsWith(right);
      case 'regex':
        return typeof left === 'string' && typeof right === 'string' && new RegExp(right).test(left);
      default:
        throw new Error(`Unknown comparison operator: ${expression.operator}`);
    }
  }

  private evaluateLogical(expression: ConditionalExpression): boolean {
    const left = this.evaluateOperand(expression.leftOperand);
    const right = this.evaluateOperand(expression.rightOperand!);

    switch (expression.operator) {
      case 'eq': // AND
        return left && right;
      case 'ne': // OR
        return left || right;
      default:
        throw new Error(`Unknown logical operator: ${expression.operator}`);
    }
  }

  private evaluateFunction(expression: ConditionalExpression): boolean {
    if (!expression.functionName) {
      throw new Error('Function name is required for function expressions');
    }

    if (!expression.parameters || expression.parameters.length === 0) {
      throw new Error('Function parameters are required');
    }

    const parameters = expression.parameters.map(p => this.evaluateOperand(p));

    switch (expression.functionName) {
      case 'isEmpty':
        return parameters[0] == null || parameters[0] === '' || 
               (Array.isArray(parameters[0]) && parameters[0].length === 0);
      case 'isNotEmpty':
        return !this.evaluateFunction({ ...expression, functionName: 'isEmpty' });
      case 'isNull':
        return parameters[0] == null;
      case 'isNotNull':
        return parameters[0] != null;
      case 'isNumber':
        return typeof parameters[0] === 'number' && !isNaN(parameters[0]);
      case 'isString':
        return typeof parameters[0] === 'string';
      case 'isArray':
        return Array.isArray(parameters[0]);
      case 'isObject':
        return typeof parameters[0] === 'object' && parameters[0] != null && !Array.isArray(parameters[0]);
      case 'length':
        return Array.isArray(parameters[0]) ? parameters[0].length : 
               typeof parameters[0] === 'string' ? parameters[0].length : 0;
      case 'matches':
        return typeof parameters[0] === 'string' && typeof parameters[1] === 'string' && 
               new RegExp(parameters[1]).test(parameters[0]);
      default:
        throw new Error(`Unknown function: ${expression.functionName}`);
    }
  }

  private evaluateVariable(expression: ConditionalExpression): boolean {
    const value = this.getVariable(expression.variableName!);
    return Boolean(value);
  }

  private evaluateOperand(operand: ConditionalExpression | string | number | boolean): any {
    if (typeof operand === 'object' && operand !== null && 'type' in operand) {
      return this.evaluateCondition(operand as ConditionalExpression);
    }
    return operand;
  }

  private compareValues(left: any, right: any): number {
    if (left === right) return 0;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  private executeForLoop(
    config: LoopConfiguration,
    actions: string[],
    workflow: WorkflowDefinition,
    maxIterations: number
  ): ControlFlowResult {
    const results: ControlFlowResult[] = [];
    const iterations = config.iterations || 1;

    for (let i = 0; i < iterations && i < maxIterations; i++) {
      this.setVariable('__loop_index', i);
      
      const result = this.executeActions(actions, workflow);
      results.push(result);

      // Check break condition
      if (config.breakCondition && this.evaluateCondition(config.breakCondition)) {
        return {
          nextNodes: this.resolveNodeIds(actions, workflow),
          shouldBreak: true,
          shouldContinue: false,
          variables: Object.fromEntries(this.variables),
        };
      }

      // Check continue condition
      if (config.continueCondition && this.evaluateCondition(config.continueCondition)) {
        continue;
      }
    }

    return this.mergeResults(results);
  }

  private executeWhileLoop(
    config: LoopConfiguration,
    actions: string[],
    workflow: WorkflowDefinition,
    maxIterations: number
  ): ControlFlowResult {
    const results: ControlFlowResult[] = [];
    let iterationCount = 0;

    while (config.condition && this.evaluateCondition(config.condition) && iterationCount < maxIterations) {
      this.setVariable('__loop_index', iterationCount);
      
      const result = this.executeActions(actions, workflow);
      results.push(result);

      // Check break condition
      if (config.breakCondition && this.evaluateCondition(config.breakCondition)) {
        return {
          nextNodes: this.resolveNodeIds(actions, workflow),
          shouldBreak: true,
          shouldContinue: false,
          variables: Object.fromEntries(this.variables),
        };
      }

      // Check continue condition
      if (config.continueCondition && this.evaluateCondition(config.continueCondition)) {
        continue;
      }

      iterationCount++;
    }

    return this.mergeResults(results);
  }

  private executeForEachLoop(
    config: LoopConfiguration,
    actions: string[],
    workflow: WorkflowDefinition
  ): ControlFlowResult {
    const results: ControlFlowResult[] = [];
    const collection = this.getVariable(config.collection!);

    if (!Array.isArray(collection)) {
      throw new Error(`Collection ${config.collection} is not an array`);
    }

    collection.forEach((item, index) => {
      this.setVariable(config.iterator!, item);
      this.setVariable('__loop_index', index);
      
      const result = this.executeActions(actions, workflow);
      results.push(result);

      // Check break condition
      if (config.breakCondition && this.evaluateCondition(config.breakCondition)) {
        return {
          nextNodes: this.resolveNodeIds(actions, workflow),
          shouldBreak: true,
          shouldContinue: false,
          variables: Object.fromEntries(this.variables),
        };
      }

      // Check continue condition
      if (config.continueCondition && this.evaluateCondition(config.continueCondition)) {
        return;
      }
    });

    return this.mergeResults(results);
  }

  private executeDoWhileLoop(
    config: LoopConfiguration,
    actions: string[],
    workflow: WorkflowDefinition,
    maxIterations: number
  ): ControlFlowResult {
    const results: ControlFlowResult[] = [];
    let iterationCount = 0;

    do {
      this.setVariable('__loop_index', iterationCount);
      
      const result = this.executeActions(actions, workflow);
      results.push(result);

      // Check break condition
      if (config.breakCondition && this.evaluateCondition(config.breakCondition)) {
        return {
          nextNodes: this.resolveNodeIds(actions, workflow),
          shouldBreak: true,
          shouldContinue: false,
          variables: Object.fromEntries(this.variables),
        };
      }

      // Check continue condition
      if (config.continueCondition && this.evaluateCondition(config.continueCondition)) {
        continue;
      }

      iterationCount++;
    } while (config.condition && this.evaluateCondition(config.condition) && iterationCount < maxIterations);

    return this.mergeResults(results);
  }

  private async executeBranch(
    branch: { id: string; condition?: ConditionalExpression; actions: string[]; timeout?: number },
    workflow: WorkflowDefinition,
    globalTimeout?: number
  ): Promise<ControlFlowResult> {
    if (branch.condition && !this.evaluateCondition(branch.condition)) {
      return {
        nextNodes: [],
        shouldBreak: false,
        shouldContinue: false,
        variables: Object.fromEntries(this.variables),
      };
    }

    const timeout = branch.timeout || globalTimeout || 30000;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Branch ${branch.id} execution timeout`));
      }, timeout);

      try {
        const result = this.executeActions(branch.actions, workflow);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private executeActions(actions: string[], workflow: WorkflowDefinition): ControlFlowResult {
    const nextNodes = this.resolveNodeIds(actions, workflow);
    
    return {
      nextNodes,
      shouldBreak: false,
      shouldContinue: false,
      variables: Object.fromEntries(this.variables),
    };
  }

  private resolveNodeIds(nodeIds: string[], workflow: WorkflowDefinition): string[] {
    return nodeIds.filter(id => workflow.nodes.some(node => node.id === id));
  }

  private mergeResults(results: ControlFlowResult[]): ControlFlowResult {
    const allNextNodes = results.flatMap(r => r.nextNodes);
    const hasBreak = results.some(r => r.shouldBreak);
    const hasContinue = results.some(r => r.shouldContinue);
    const lastException = results.find(r => r.exception)?.exception;

    return {
      nextNodes: allNextNodes,
      shouldBreak: hasBreak,
      shouldContinue: hasContinue,
      exception: lastException,
      variables: Object.fromEntries(this.variables),
    };
  }

  private mergeParallelResults(results: ControlFlowResult[]): ControlFlowResult {
    return this.mergeResults(results);
  }
}
