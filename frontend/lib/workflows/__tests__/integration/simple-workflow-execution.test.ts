import { WorkflowExecutionEngine } from '../../execution-engine';
import { WorkflowValidationEngine } from '../../validation-engine';
import { WorkflowDefinition } from '../../../types/workflows/visual-builder';

describe('Simple Workflow Execution Integration Tests', () => {
  let executionEngine: WorkflowExecutionEngine;
  let validationEngine: WorkflowValidationEngine;

  beforeEach(() => {
    executionEngine = new WorkflowExecutionEngine();
    validationEngine = new WorkflowValidationEngine();
  });

  describe('Basic Workflow Execution', () => {
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
            id: 'process',
            type: 'dataProcessor',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Process Data',
              operation: 'transform',
              config: { field: 'name', value: 'uppercase' }
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
});
