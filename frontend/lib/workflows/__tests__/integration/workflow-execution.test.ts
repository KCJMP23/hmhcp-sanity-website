import { WorkflowExecutionEngine } from '../../execution-engine';
import { WorkflowValidationEngine } from '../../validation-engine';
import { WorkflowDefinition } from '../../../types/workflows/visual-builder';

describe('Workflow Execution Integration Tests', () => {
  let executionEngine: WorkflowExecutionEngine;
  let validationEngine: WorkflowValidationEngine;

  beforeEach(() => {
    executionEngine = new WorkflowExecutionEngine();
    validationEngine = new WorkflowValidationEngine();
  });

  describe('Complete Workflow Execution', () => {
    it('should execute a simple linear workflow end-to-end', async () => {
      const workflow: WorkflowDefinition = {
        id: 'simple-workflow',
        name: 'Simple Linear Workflow',
        description: 'A simple linear workflow for testing',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'process1',
            type: 'dataProcessor',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Process Data',
              operation: 'transform',
              config: { field: 'name', value: 'uppercase' }
            }
          },
          {
            id: 'process2',
            type: 'dataProcessor',
            position: { x: 200, y: 0 },
            data: { 
              label: 'Validate Data',
              operation: 'validate',
              config: { rules: ['required', 'minLength:3'] }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 300, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'process1' },
          { id: 'e2', source: 'process1', target: 'process2' },
          { id: 'e3', source: 'process2', target: 'end' }
        ]
      };

      // Validate workflow
      const validationResult = await validationEngine.validateWorkflow(workflow);
      if (!validationResult.isValid) {
        console.log('Validation errors:', validationResult.errors);
      }
      expect(validationResult.isValid).toBe(true);

      // Execute workflow
      const result = await executionEngine.executeWorkflow(workflow, { name: 'test' });
      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = executionEngine.getExecutionState(result.executionId!);
      expect(execution?.status).toBe('completed');
      expect(execution?.currentNode).toBe('end');
      expect(execution?.errors).toHaveLength(0);
    });

    it('should execute a workflow with conditional branching', async () => {
      const workflow: WorkflowDefinition = {
        id: 'conditional-workflow',
        name: 'Conditional Branching Workflow',
        description: 'A workflow with conditional branching',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'condition',
            type: 'if',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Check Value',
              condition: 'input.value > 10'
            }
          },
          {
            id: 'high-value',
            type: 'dataProcessor',
            position: { x: 200, y: -50 },
            data: { 
              label: 'High Value Process',
              operation: 'transform',
              config: { field: 'value', value: 'multiply:2' }
            }
          },
          {
            id: 'low-value',
            type: 'dataProcessor',
            position: { x: 200, y: 50 },
            data: { 
              label: 'Low Value Process',
              operation: 'transform',
              config: { field: 'value', value: 'add:5' }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 300, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'condition' },
          { id: 'e2', source: 'condition', target: 'high-value', condition: 'true' },
          { id: 'e3', source: 'condition', target: 'low-value', condition: 'false' },
          { id: 'e4', source: 'high-value', target: 'end' },
          { id: 'e5', source: 'low-value', target: 'end' }
        ]
      };

      // Test high value path
      const highValueResult = await executionEngine.executeWorkflow(workflow, { value: 15 });
      expect(highValueResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const highValueExecution = executionEngine.getExecutionState(highValueResult.executionId!);
      expect(highValueExecution?.status).toBe('completed');
      expect(highValueExecution?.executedNodes).toContain('high-value');
      expect(highValueExecution?.executedNodes).not.toContain('low-value');

      // Test low value path
      const lowValueResult = await executionEngine.executeWorkflow(workflow, { value: 5 });
      expect(lowValueResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const lowValueExecution = executionEngine.getExecutionState(lowValueResult.executionId!);
      expect(lowValueExecution?.status).toBe('completed');
      expect(lowValueExecution?.executedNodes).toContain('low-value');
      expect(lowValueExecution?.executedNodes).not.toContain('high-value');
    });

    it('should execute a workflow with loops', async () => {
      const workflow: WorkflowDefinition = {
        id: 'loop-workflow',
        name: 'Loop Workflow',
        description: 'A workflow with a loop',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'loop',
            type: 'loop',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Process Items',
              loopType: 'foreach',
              config: { 
                items: 'input.items',
                maxIterations: 10
              }
            }
          },
          {
            id: 'process-item',
            type: 'dataProcessor',
            position: { x: 200, y: 0 },
            data: { 
              label: 'Process Item',
              operation: 'transform',
              config: { field: 'item', value: 'uppercase' }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 300, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'loop' },
          { id: 'e2', source: 'loop', target: 'process-item' },
          { id: 'e3', source: 'process-item', target: 'loop' },
          { id: 'e4', source: 'loop', target: 'end', condition: 'loopComplete' }
        ]
      };

      const result = await executionEngine.executeWorkflow(workflow, { 
        items: ['item1', 'item2', 'item3'] 
      });
      expect(result.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = executionEngine.getExecutionState(result.executionId!);
      expect(execution?.status).toBe('completed');
      expect(execution?.executedNodes).toContain('process-item');
    });

    it('should handle workflow execution errors gracefully', async () => {
      const workflow: WorkflowDefinition = {
        id: 'error-workflow',
        name: 'Error Workflow',
        description: 'A workflow that will encounter errors',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'error-node',
            type: 'dataProcessor',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Error Node',
              operation: 'invalidOperation',
              config: { field: 'invalid' }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'error-node' },
          { id: 'e2', source: 'error-node', target: 'end' }
        ]
      };

      const result = await executionEngine.executeWorkflow(workflow, { test: 'data' });
      expect(result.success).toBe(true); // Initial execution starts successfully

      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = executionEngine.getExecutionState(result.executionId!);
      expect(execution?.status).toBe('failed');
      expect(execution?.errors).toHaveLength(1);
      expect(execution?.errors[0].message).toContain('invalidOperation');
    });

    it('should execute a complex workflow with multiple paths', async () => {
      const workflow: WorkflowDefinition = {
        id: 'complex-workflow',
        name: 'Complex Multi-Path Workflow',
        description: 'A complex workflow with multiple execution paths',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'switch',
            type: 'switch',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Route by Type',
              field: 'input.type',
              cases: {
                'user': 'user-path',
                'admin': 'admin-path',
                'guest': 'guest-path'
              }
            }
          },
          {
            id: 'user-path',
            type: 'dataProcessor',
            position: { x: 200, y: -100 },
            data: { 
              label: 'User Processing',
              operation: 'transform',
              config: { field: 'data', value: 'userTransform' }
            }
          },
          {
            id: 'admin-path',
            type: 'dataProcessor',
            position: { x: 200, y: 0 },
            data: { 
              label: 'Admin Processing',
              operation: 'transform',
              config: { field: 'data', value: 'adminTransform' }
            }
          },
          {
            id: 'guest-path',
            type: 'dataProcessor',
            position: { x: 200, y: 100 },
            data: { 
              label: 'Guest Processing',
              operation: 'transform',
              config: { field: 'data', value: 'guestTransform' }
            }
          },
          {
            id: 'merge',
            type: 'dataProcessor',
            position: { x: 300, y: 0 },
            data: { 
              label: 'Merge Results',
              operation: 'merge',
              config: { strategy: 'combine' }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 400, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'switch' },
          { id: 'e2', source: 'switch', target: 'user-path', condition: 'user' },
          { id: 'e3', source: 'switch', target: 'admin-path', condition: 'admin' },
          { id: 'e4', source: 'switch', target: 'guest-path', condition: 'guest' },
          { id: 'e5', source: 'user-path', target: 'merge' },
          { id: 'e6', source: 'admin-path', target: 'merge' },
          { id: 'e7', source: 'guest-path', target: 'merge' },
          { id: 'e8', source: 'merge', target: 'end' }
        ]
      };

      // Test user path
      const userResult = await executionEngine.executeWorkflow(workflow, { 
        type: 'user', 
        data: { name: 'John' } 
      });
      expect(userResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const userExecution = executionEngine.getExecutionState(userResult.executionId!);
      expect(userExecution?.status).toBe('completed');
      expect(userExecution?.executedNodes).toContain('user-path');
      expect(userExecution?.executedNodes).toContain('merge');
    });
  });

  describe('Workflow Execution Control', () => {
    it('should pause and resume workflow execution', async () => {
      const workflow: WorkflowDefinition = {
        id: 'pause-workflow',
        name: 'Pause Test Workflow',
        description: 'A workflow for testing pause/resume',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'process1',
            type: 'dataProcessor',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Process 1',
              operation: 'transform',
              config: { field: 'data', value: 'step1' }
            }
          },
          {
            id: 'process2',
            type: 'dataProcessor',
            position: { x: 200, y: 0 },
            data: { 
              label: 'Process 2',
              operation: 'transform',
              config: { field: 'data', value: 'step2' }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 300, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'process1' },
          { id: 'e2', source: 'process1', target: 'process2' },
          { id: 'e3', source: 'process2', target: 'end' }
        ]
      };

      const result = await executionEngine.executeWorkflow(workflow, { data: 'test' });
      expect(result.success).toBe(true);

      // Pause execution
      const pauseResult = executionEngine.pauseExecution(result.executionId!);
      expect(pauseResult).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 50));

      let execution = executionEngine.getExecutionState(result.executionId!);
      expect(execution?.status).toBe('paused');

      // Resume execution
      const resumeResult = executionEngine.resumeExecution(result.executionId!);
      expect(resumeResult).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      execution = executionEngine.getExecutionState(result.executionId!);
      expect(execution?.status).toBe('completed');
    });

    it('should stop workflow execution', async () => {
      const workflow: WorkflowDefinition = {
        id: 'stop-workflow',
        name: 'Stop Test Workflow',
        description: 'A workflow for testing stop functionality',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'process1',
            type: 'dataProcessor',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Process 1',
              operation: 'transform',
              config: { field: 'data', value: 'step1' }
            }
          },
          {
            id: 'process2',
            type: 'dataProcessor',
            position: { x: 200, y: 0 },
            data: { 
              label: 'Process 2',
              operation: 'transform',
              config: { field: 'data', value: 'step2' }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 300, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'process1' },
          { id: 'e2', source: 'process1', target: 'process2' },
          { id: 'e3', source: 'process2', target: 'end' }
        ]
      };

      const result = await executionEngine.executeWorkflow(workflow, { data: 'test' });
      expect(result.success).toBe(true);

      // Stop execution
      const stopResult = executionEngine.stopExecution(result.executionId!);
      expect(stopResult).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 50));

      const execution = executionEngine.getExecutionState(result.executionId!);
      expect(execution?.status).toBe('stopped');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large workflows efficiently', async () => {
      const largeWorkflow: WorkflowDefinition = {
        id: 'large-workflow',
        name: 'Large Workflow',
        description: 'A workflow with many nodes for performance testing',
        nodes: [],
        edges: []
      };

      // Create 100 nodes
      for (let i = 0; i < 100; i++) {
        largeWorkflow.nodes.push({
          id: `node-${i}`,
          type: 'dataProcessor',
          position: { x: i * 10, y: 0 },
          data: { 
            label: `Node ${i}`,
            operation: 'transform',
            config: { field: 'data', value: `step${i}` }
          }
        });

        if (i > 0) {
          largeWorkflow.edges.push({
            id: `edge-${i}`,
            source: `node-${i - 1}`,
            target: `node-${i}`
          });
        }
      }

      // Add start and end nodes
      largeWorkflow.nodes.unshift({
        id: 'start',
        type: 'workflow-start',
        position: { x: -10, y: 0 },
        data: { label: 'Start' }
      });

      largeWorkflow.nodes.push({
        id: 'end',
        type: 'workflow-end',
        position: { x: 1000, y: 0 },
        data: { label: 'End' }
      });

      largeWorkflow.edges.unshift({
        id: 'edge-start',
        source: 'start',
        target: 'node-0'
      });

      largeWorkflow.edges.push({
        id: 'edge-end',
        source: 'node-99',
        target: 'end'
      });

      const startTime = Date.now();
      const result = await executionEngine.executeWorkflow(largeWorkflow, { data: 'test' });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      await new Promise(resolve => setTimeout(resolve, 200));

      const execution = executionEngine.getExecutionState(result.executionId!);
      expect(execution?.status).toBe('completed');
    });

    it('should handle concurrent workflow executions', async () => {
      const workflow: WorkflowDefinition = {
        id: 'concurrent-workflow',
        name: 'Concurrent Workflow',
        description: 'A workflow for concurrent execution testing',
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start' }
          },
          {
            id: 'process',
            type: 'dataProcessor',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Process',
              operation: 'transform',
              config: { field: 'data', value: 'process' }
            }
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End' }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'process' },
          { id: 'e2', source: 'process', target: 'end' }
        ]
      };

      // Execute 10 workflows concurrently
      const executions = [];
      for (let i = 0; i < 10; i++) {
        const result = await executionEngine.executeWorkflow(workflow, { 
          data: `test-${i}` 
        });
        executions.push(result);
      }

      // All should start successfully
      executions.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // All should complete successfully
      executions.forEach(result => {
        const execution = executionEngine.getExecutionState(result.executionId!);
        expect(execution?.status).toBe('completed');
      });
    });
  });
});
