import { ControlFlowManager, ControlFlowState } from '../control-flow-manager';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflows/visual-builder';

describe('ControlFlowManager', () => {
  let manager: ControlFlowManager;

  beforeEach(() => {
    manager = new ControlFlowManager();
  });

  describe('Basic Workflow Execution', () => {
    const createSimpleWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'end',
          type: 'workflow-end',
          position: { x: 200, y: 0 },
          data: { label: 'End', category: 'end', config: {}, status: 'idle' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'end', type: 'smoothstep' },
      ],
    });

    it('should execute a simple workflow', async () => {
      const workflow = createSimpleWorkflow();
      
      const result = await manager.executeWorkflow(workflow);
      
      expect(result.nextNodes).toEqual([]);
      expect(result.shouldBreak).toBe(true);
      expect(result.shouldContinue).toBe(false);
    });

    it('should throw error when no start node is found', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      await expect(manager.executeWorkflow(workflow)).rejects.toThrow('No start node found in workflow');
    });

    it('should execute workflow with specific start node', async () => {
      const workflow = createSimpleWorkflow();
      
      const result = await manager.executeWorkflow(workflow, 'start');
      
      expect(result.nextNodes).toEqual([]);
      expect(result.shouldBreak).toBe(true);
    });
  });

  describe('If/Else Node Execution', () => {
    const createIfElseWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'if-else',
          type: 'logic-if-else',
          position: { x: 100, y: 0 },
          data: {
            label: 'If/Else',
            category: 'logic',
            config: {
              logicType: 'if-else',
              condition: {
                id: 'test1',
                type: 'comparison',
                operator: 'eq',
                leftOperand: 'test',
                rightOperand: 'test',
              },
              trueActions: ['true-node'],
              falseActions: ['false-node'],
            },
            status: 'idle',
          },
        },
        {
          id: 'true-node',
          type: 'ai-agent',
          position: { x: 200, y: 0 },
          data: { label: 'True Node', category: 'ai-agents', config: {}, status: 'idle' },
        },
        {
          id: 'false-node',
          type: 'ai-agent',
          position: { x: 200, y: 100 },
          data: { label: 'False Node', category: 'ai-agents', config: {}, status: 'idle' },
        },
        {
          id: 'end',
          type: 'workflow-end',
          position: { x: 300, y: 0 },
          data: { label: 'End', category: 'end', config: {}, status: 'idle' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'if-else', type: 'smoothstep' },
        { id: 'e2', source: 'if-else', target: 'true-node', type: 'smoothstep' },
        { id: 'e3', source: 'if-else', target: 'false-node', type: 'smoothstep' },
        { id: 'e4', source: 'true-node', target: 'end', type: 'smoothstep' },
        { id: 'e5', source: 'false-node', target: 'end', type: 'smoothstep' },
      ],
    });

    it('should execute if-else node with true condition', async () => {
      const workflow = createIfElseWorkflow();
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('true-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });

    it('should execute if-else node with false condition', async () => {
      const workflow = createIfElseWorkflow();
      // Modify the condition to be false
      workflow.nodes[1].data.config.condition.rightOperand = 'different';
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('false-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });
  });

  describe('Loop Node Execution', () => {
    const createLoopWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'loop',
          type: 'logic-loop',
          position: { x: 100, y: 0 },
          data: {
            label: 'Loop',
            category: 'logic',
            config: {
              logicType: 'loop',
              loopConfig: {
                type: 'for',
                iterations: 3,
              },
              actions: ['loop-node'],
            },
            status: 'idle',
          },
        },
        {
          id: 'loop-node',
          type: 'ai-agent',
          position: { x: 200, y: 0 },
          data: { label: 'Loop Node', category: 'ai-agents', config: {}, status: 'idle' },
        },
        {
          id: 'end',
          type: 'workflow-end',
          position: { x: 300, y: 0 },
          data: { label: 'End', category: 'end', config: {}, status: 'idle' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'loop', type: 'smoothstep' },
        { id: 'e2', source: 'loop', target: 'loop-node', type: 'smoothstep' },
        { id: 'e3', source: 'loop-node', target: 'end', type: 'smoothstep' },
      ],
    });

    it('should execute for loop node', async () => {
      const workflow = createLoopWorkflow();
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('loop-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });

    it('should execute while loop node', async () => {
      const workflow = createLoopWorkflow();
      workflow.nodes[1].data.config.loopConfig = {
        type: 'while',
        condition: {
          id: 'test2',
          type: 'comparison',
          operator: 'eq',
          leftOperand: 'continue',
          rightOperand: 'continue',
        },
      };
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('loop-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });

    it('should execute foreach loop node', async () => {
      const workflow = createLoopWorkflow();
      manager.setVariable('testArray', ['item1', 'item2', 'item3']);
      workflow.nodes[1].data.config.loopConfig = {
        type: 'foreach',
        collection: 'testArray',
        iterator: 'item',
      };
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('loop-node');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });
  });

  describe('Delay Node Execution', () => {
    const createDelayWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'delay',
          type: 'logic-delay',
          position: { x: 100, y: 0 },
          data: {
            label: 'Delay',
            category: 'logic',
            config: {
              logicType: 'delay',
              delayMs: 100,
            },
            status: 'idle',
          },
        },
        {
          id: 'end',
          type: 'workflow-end',
          position: { x: 200, y: 0 },
          data: { label: 'End', category: 'end', config: {}, status: 'idle' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'delay', type: 'smoothstep' },
        { id: 'e2', source: 'delay', target: 'end', type: 'smoothstep' },
      ],
    });

    it('should execute delay node with specified delay', async () => {
      const workflow = createDelayWorkflow();
      const startTime = Date.now();
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(result.nextNodes).toContain('end');
      expect(executionTime).toBeGreaterThanOrEqual(100);
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
    });
  });

  describe('AI Agent Node Execution', () => {
    const createAIAgentWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'ai-agent',
          type: 'ai-agent',
          position: { x: 100, y: 0 },
          data: {
            label: 'AI Agent',
            category: 'ai-agents',
            config: {
              agentType: 'research',
              prompt: 'Test prompt',
            },
            status: 'idle',
          },
        },
        {
          id: 'end',
          type: 'workflow-end',
          position: { x: 200, y: 0 },
          data: { label: 'End', category: 'end', config: {}, status: 'idle' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'ai-agent', type: 'smoothstep' },
        { id: 'e2', source: 'ai-agent', target: 'end', type: 'smoothstep' },
      ],
    });

    it('should execute AI agent node', async () => {
      const workflow = createAIAgentWorkflow();
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('end');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
      expect(manager.getVariable('ai-agent_response')).toContain('AI Agent (research) processed');
    });
  });

  describe('Data Processor Node Execution', () => {
    const createDataProcessorWorkflow = (): WorkflowDefinition => ({
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
        },
        {
          id: 'data-transform',
          type: 'data-transform',
          position: { x: 100, y: 0 },
          data: {
            label: 'Data Transform',
            category: 'data',
            config: {
              processorType: 'transform',
              transformScript: 'return data;',
            },
            status: 'idle',
          },
        },
        {
          id: 'end',
          type: 'workflow-end',
          position: { x: 200, y: 0 },
          data: { label: 'End', category: 'end', config: {}, status: 'idle' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'data-transform', type: 'smoothstep' },
        { id: 'e2', source: 'data-transform', target: 'end', type: 'smoothstep' },
      ],
    });

    it('should execute data transform node', async () => {
      const workflow = createDataProcessorWorkflow();
      manager.setVariable('input_data', { test: 'value' });
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('end');
      expect(result.shouldBreak).toBe(false);
      expect(result.shouldContinue).toBe(false);
      expect(manager.getVariable('data-transform_result')).toBeDefined();
    });

    it('should execute data filter node', async () => {
      const workflow = createDataProcessorWorkflow();
      workflow.nodes[1].type = 'data-filter';
      workflow.nodes[1].data.config.processorType = 'filter';
      manager.setVariable('input_data', [{ id: 1 }, { id: 2 }, { id: 3 }]);
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('end');
      expect(manager.getVariable('data-transform_result')).toBeDefined();
    });

    it('should execute data aggregate node', async () => {
      const workflow = createDataProcessorWorkflow();
      workflow.nodes[1].type = 'data-aggregate';
      workflow.nodes[1].data.config.processorType = 'aggregate';
      workflow.nodes[1].data.config.aggregationType = 'count';
      manager.setVariable('input_data', [1, 2, 3, 4, 5]);
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('end');
      expect(manager.getVariable('data-transform_result')).toEqual({ count: 5 });
    });

    it('should execute data validate node', async () => {
      const workflow = createDataProcessorWorkflow();
      workflow.nodes[1].type = 'data-validate';
      workflow.nodes[1].data.config.processorType = 'validate';
      workflow.nodes[1].data.config.validationRules = { required: true };
      manager.setVariable('input_data', 'test value');
      
      const result = await manager.executeNode(workflow.nodes[1], workflow);
      
      expect(result.nextNodes).toContain('end');
      expect(manager.getVariable('data-transform_result')).toEqual({ valid: true, data: 'test value' });
    });
  });

  describe('State Management', () => {
    it('should track execution state', () => {
      const state = manager.getState();
      
      expect(state.isExecuting).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.isStopped).toBe(false);
      expect(state.currentNode).toBe('');
      expect(state.nextNodes).toEqual([]);
      expect(state.variables).toEqual({});
      expect(state.executionHistory).toEqual([]);
    });

    it('should pause and resume execution', () => {
      manager.pauseExecution();
      let state = manager.getState();
      expect(state.isPaused).toBe(true);
      
      manager.resumeExecution();
      state = manager.getState();
      expect(state.isPaused).toBe(false);
    });

    it('should stop execution', () => {
      manager.stopExecution();
      const state = manager.getState();
      
      expect(state.isStopped).toBe(true);
      expect(state.isExecuting).toBe(false);
    });
  });

  describe('Variable Management', () => {
    it('should set and get variables', () => {
      manager.setVariable('testVar', 'hello world');
      expect(manager.getVariable('testVar')).toBe('hello world');
    });

    it('should update state when variables change', () => {
      manager.setVariable('testVar', 'hello world');
      const state = manager.getState();
      
      expect(state.variables.testVar).toBe('hello world');
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners on execution events', (done) => {
      const unsubscribe = manager.subscribe('execution-started', (state) => {
        expect(state.isExecuting).toBe(true);
        unsubscribe();
        done();
      });

      // Simulate execution start
      const workflow = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      manager.executeWorkflow(workflow).catch(() => {
        // Ignore errors for this test
      });
    });

    it('should notify listeners on node completion', (done) => {
      const unsubscribe = manager.subscribe('node-completed', (state) => {
        expect(state.currentNode).toBeDefined();
        unsubscribe();
        done();
      });

      const workflow = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      manager.executeNode(workflow.nodes[0], workflow).catch(() => {
        // Ignore errors for this test
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in node execution', async () => {
      const workflow = {
        nodes: [
          {
            id: 'error-node',
            type: 'data-validate',
            position: { x: 0, y: 0 },
            data: {
              label: 'Error Node',
              category: 'data',
              config: {
                processorType: 'validate',
                validationRules: { required: true },
              },
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      // Set invalid input data to trigger validation error
      manager.setVariable('input_data', null);

      await expect(manager.executeNode(workflow.nodes[0], workflow)).rejects.toThrow();
    });
  });
});
