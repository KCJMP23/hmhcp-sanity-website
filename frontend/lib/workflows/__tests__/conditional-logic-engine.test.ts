import { ConditionalLogicEngine, ConditionalExpression, LoopConfiguration } from '../conditional-logic-engine';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflows/visual-builder';

describe('ConditionalLogicEngine', () => {
  let engine: ConditionalLogicEngine;

  beforeEach(() => {
    engine = new ConditionalLogicEngine();
  });

  describe('Basic Condition Evaluation', () => {
    it('should evaluate simple comparison conditions', () => {
      const condition: ConditionalExpression = {
        id: 'test1',
        type: 'comparison',
        operator: 'eq',
        leftOperand: 'hello',
        rightOperand: 'hello',
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate numeric comparisons', () => {
      const condition: ConditionalExpression = {
        id: 'test2',
        type: 'comparison',
        operator: 'gt',
        leftOperand: 10,
        rightOperand: 5,
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate string comparisons', () => {
      const condition: ConditionalExpression = {
        id: 'test3',
        type: 'comparison',
        operator: 'contains',
        leftOperand: 'hello world',
        rightOperand: 'world',
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate regex matches', () => {
      const condition: ConditionalExpression = {
        id: 'test4',
        type: 'comparison',
        operator: 'regex',
        leftOperand: 'test@example.com',
        rightOperand: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });
  });

  describe('Function Evaluations', () => {
    it('should evaluate isEmpty function', () => {
      const condition: ConditionalExpression = {
        id: 'test5',
        type: 'function',
        functionName: 'isEmpty',
        parameters: [''],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate isNotEmpty function', () => {
      const condition: ConditionalExpression = {
        id: 'test6',
        type: 'function',
        functionName: 'isNotEmpty',
        parameters: ['hello'],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate isNull function', () => {
      const condition: ConditionalExpression = {
        id: 'test7',
        type: 'function',
        functionName: 'isNull',
        parameters: [null],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate isNotNull function', () => {
      const condition: ConditionalExpression = {
        id: 'test8',
        type: 'function',
        functionName: 'isNotNull',
        parameters: ['hello'],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate isNumber function', () => {
      const condition: ConditionalExpression = {
        id: 'test9',
        type: 'function',
        functionName: 'isNumber',
        parameters: [42],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate isString function', () => {
      const condition: ConditionalExpression = {
        id: 'test10',
        type: 'function',
        functionName: 'isString',
        parameters: ['hello'],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate isArray function', () => {
      const condition: ConditionalExpression = {
        id: 'test11',
        type: 'function',
        functionName: 'isArray',
        parameters: [[1, 2, 3]],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate isObject function', () => {
      const condition: ConditionalExpression = {
        id: 'test12',
        type: 'function',
        functionName: 'isObject',
        parameters: [{ key: 'value' }],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should evaluate length function', () => {
      const condition: ConditionalExpression = {
        id: 'test13',
        type: 'function',
        functionName: 'length',
        parameters: ['hello'],
      };

      expect(engine.evaluateCondition(condition)).toBe(5);
    });

    it('should evaluate matches function', () => {
      const condition: ConditionalExpression = {
        id: 'test14',
        type: 'function',
        functionName: 'matches',
        parameters: ['hello world', 'hello.*'],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });
  });

  describe('Variable Evaluations', () => {
    it('should evaluate variable conditions', () => {
      engine.setVariable('testVar', 'hello');
      
      const condition: ConditionalExpression = {
        id: 'test15',
        type: 'variable',
        variableName: 'testVar',
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should return false for undefined variables', () => {
      const condition: ConditionalExpression = {
        id: 'test16',
        type: 'variable',
        variableName: 'undefinedVar',
      };

      expect(engine.evaluateCondition(condition)).toBe(false);
    });
  });

  describe('If/Else Execution', () => {
    const createSimpleWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'true-node',
          type: 'ai-agent',
          position: { x: 100, y: 0 },
          data: { label: 'True Node', category: 'ai-agents', config: {}, status: 'idle' },
        },
        {
          id: 'false-node',
          type: 'ai-agent',
          position: { x: 200, y: 0 },
          data: { label: 'False Node', category: 'ai-agents', config: {}, status: 'idle' },
        },
      ],
      edges: [],
    });

    it('should execute true branch when condition is true', () => {
      const workflow = createSimpleWorkflow();
      const condition: ConditionalExpression = {
        id: 'test17',
        type: 'comparison',
        operator: 'eq',
        leftOperand: 'hello',
        rightOperand: 'hello',
      };

      const result = engine.executeIfElse(condition, ['true-node'], ['false-node'], workflow);

      expect(result.nextNodes).toContain('true-node');
      expect(result.nextNodes).not.toContain('false-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });

    it('should execute false branch when condition is false', () => {
      const workflow = createSimpleWorkflow();
      const condition: ConditionalExpression = {
        id: 'test18',
        type: 'comparison',
        operator: 'eq',
        leftOperand: 'hello',
        rightOperand: 'world',
      };

      const result = engine.executeIfElse(condition, ['true-node'], ['false-node'], workflow);

      expect(result.nextNodes).not.toContain('true-node');
      expect(result.nextNodes).toContain('false-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });
  });

  describe('Loop Execution', () => {
    const createLoopWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'loop-node',
          type: 'ai-agent',
          position: { x: 100, y: 0 },
          data: { label: 'Loop Node', category: 'ai-agents', config: {}, status: 'idle' },
        },
      ],
      edges: [],
    });

    it('should execute for loop with specified iterations', () => {
      const workflow = createLoopWorkflow();
      const loopConfig: LoopConfiguration = {
        type: 'for',
        iterations: 3,
      };

      const result = engine.executeLoop(loopConfig, ['loop-node'], workflow);

      expect(result.nextNodes).toContain('loop-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });

    it('should execute while loop with condition', () => {
      const workflow = createLoopWorkflow();
      const loopConfig: LoopConfiguration = {
        type: 'while',
        condition: {
          id: 'test19',
          type: 'comparison',
          operator: 'eq',
          leftOperand: 'continue',
          rightOperand: 'continue',
        },
      };

      const result = engine.executeLoop(loopConfig, ['loop-node'], workflow);

      expect(result.nextNodes).toContain('loop-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });

    it('should execute foreach loop with array', () => {
      const workflow = createLoopWorkflow();
      engine.setVariable('testArray', ['item1', 'item2', 'item3']);
      
      const loopConfig: LoopConfiguration = {
        type: 'foreach',
        collection: 'testArray',
        iterator: 'item',
      };

      const result = engine.executeLoop(loopConfig, ['loop-node'], workflow);

      expect(result.nextNodes).toContain('loop-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });

    it('should handle break condition in loop', () => {
      const workflow = createLoopWorkflow();
      const loopConfig: LoopConfiguration = {
        type: 'for',
        iterations: 5,
        breakCondition: {
          id: 'test20',
          type: 'comparison',
          operator: 'eq',
          leftOperand: 'break',
          rightOperand: 'break',
        },
      };

      // Set a variable that will trigger the break condition
      engine.setVariable('break', 'break');

      const result = engine.executeLoop(loopConfig, ['loop-node'], workflow);

      expect(result.shouldBreak).toBe(true);
    });
  });

  describe('Variable Management', () => {
    it('should set and get variables', () => {
      engine.setVariable('testVar', 'hello world');
      expect(engine.getVariable('testVar')).toBe('hello world');
    });

    it('should update existing variables', () => {
      engine.setVariable('testVar', 'hello');
      engine.setVariable('testVar', 'world');
      expect(engine.getVariable('testVar')).toBe('world');
    });

    it('should return undefined for non-existent variables', () => {
      expect(engine.getVariable('nonExistent')).toBeUndefined();
    });

    it('should clear all variables', () => {
      engine.setVariable('var1', 'value1');
      engine.setVariable('var2', 'value2');
      engine.clearVariables();
      
      expect(engine.getVariable('var1')).toBeUndefined();
      expect(engine.getVariable('var2')).toBeUndefined();
    });

    it('should use context variables when local variables are not set', () => {
      const contextEngine = new ConditionalLogicEngine({ contextVar: 'context value' });
      expect(contextEngine.getVariable('contextVar')).toBe('context value');
    });

    it('should prioritize local variables over context variables', () => {
      const contextEngine = new ConditionalLogicEngine({ testVar: 'context value' });
      contextEngine.setVariable('testVar', 'local value');
      expect(contextEngine.getVariable('testVar')).toBe('local value');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid expression types gracefully', () => {
      const invalidCondition = {
        id: 'test21',
        type: 'invalid' as any,
      } as ConditionalExpression;

      expect(engine.evaluateCondition(invalidCondition)).toBe(false);
    });

    it('should handle missing operators gracefully', () => {
      const condition: ConditionalExpression = {
        id: 'test22',
        type: 'comparison',
        leftOperand: 'hello',
        rightOperand: 'world',
      };

      expect(() => engine.evaluateConditionStrict(condition)).toThrow();
    });

    it('should handle invalid function names gracefully', () => {
      const condition: ConditionalExpression = {
        id: 'test23',
        type: 'function',
        functionName: 'invalidFunction',
        parameters: ['test'],
      };

      expect(() => engine.evaluateConditionStrict(condition)).toThrow();
    });

    it('should handle missing function parameters gracefully', () => {
      const condition: ConditionalExpression = {
        id: 'test24',
        type: 'function',
        functionName: 'isEmpty',
        parameters: [],
      };

      expect(() => engine.evaluateConditionStrict(condition)).toThrow();
    });
  });

  describe('Complex Conditions', () => {
    it('should handle nested conditions', () => {
      const condition: ConditionalExpression = {
        id: 'test25',
        type: 'comparison',
        operator: 'eq',
        leftOperand: {
          id: 'nested1',
          type: 'function',
          functionName: 'length',
          parameters: ['hello'],
        },
        rightOperand: 5,
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });

    it('should handle multiple function parameters', () => {
      const condition: ConditionalExpression = {
        id: 'test26',
        type: 'function',
        functionName: 'matches',
        parameters: ['hello world', 'hello.*'],
      };

      expect(engine.evaluateCondition(condition)).toBe(true);
    });
  });
});
