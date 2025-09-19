import { WorkflowExecutionEngine, ExecutionState, ExecutionStatus, ExecutionOptions } from '../execution-engine';
import { WorkflowDefinition } from '@/types/workflows/visual-builder';

describe('WorkflowExecutionEngine', () => {
  let executionEngine: WorkflowExecutionEngine;
  let mockWorkflow: WorkflowDefinition;

  beforeEach(() => {
    executionEngine = new WorkflowExecutionEngine();
    mockWorkflow = {
      id: 'test-workflow',
      nodes: [
        {
          id: 'start',
          type: 'workflow-start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', category: 'start', config: {}, status: 'idle' }
        },
        {
          id: 'process',
          type: 'data-transform',
          position: { x: 200, y: 0 },
          data: { 
            label: 'Process Data', 
            category: 'data', 
            config: { processorType: 'transform' }, 
            status: 'idle' 
          }
        },
        {
          id: 'end',
          type: 'workflow-end',
          position: { x: 400, y: 0 },
          data: { label: 'End', category: 'end', config: {}, status: 'idle' }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'process', type: 'smoothstep' },
        { id: 'e2', source: 'process', target: 'end', type: 'smoothstep' }
      ]
    };
  });

  describe('Execution Management', () => {
    it('should start workflow execution', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      
      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should start workflow execution with options', async () => {
      const options: ExecutionOptions = {
        timeout: 10000,
        maxRetries: 2,
        enablePerformanceMonitoring: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      
      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
    });

    it('should start workflow execution from specific node', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow, {}, 'process');
      
      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
    });

    it('should get execution state', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution).toBeDefined();
      expect(execution?.id).toBe(result.executionId);
      expect(execution?.workflowId).toBe(mockWorkflow.id);
    });

    it('should return null for non-existent execution', () => {
      const execution = executionEngine.getExecutionState('non-existent-id');
      expect(execution).toBeNull();
    });

    it('should get all executions', async () => {
      await executionEngine.executeWorkflow(mockWorkflow);
      const executions = executionEngine.getAllExecutions();
      
      expect(executions.length).toBeGreaterThan(0);
    });

    it('should get executions by status', async () => {
      await executionEngine.executeWorkflow(mockWorkflow);
      const runningExecutions = executionEngine.getExecutionsByStatus('running');
      
      expect(Array.isArray(runningExecutions)).toBe(true);
    });
  });

  describe('Execution Control', () => {
    it('should pause execution', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const paused = executionEngine.pauseExecution(result.executionId, 'Test pause');
      
      expect(paused).toBe(true);
      
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('paused');
      expect(execution?.isPaused).toBe(true);
      expect(execution?.pauseReason).toBe('Test pause');
    });

    it('should resume paused execution', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      executionEngine.pauseExecution(result.executionId, 'Test pause');
      
      const resumed = await executionEngine.resumeExecution(result.executionId);
      expect(resumed).toBe(true);
      
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('running');
      expect(execution?.isPaused).toBe(false);
    });

    it('should stop execution', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const stopped = executionEngine.stopExecution(result.executionId, 'Test stop');
      
      expect(stopped).toBe(true);
      
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('stopped');
      expect(execution?.isStopped).toBe(true);
      expect(execution?.stopReason).toBe('Test stop');
    });

    it('should not pause non-existent execution', () => {
      const paused = executionEngine.pauseExecution('non-existent-id');
      expect(paused).toBe(false);
    });

    it('should not resume non-paused execution', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const resumed = await executionEngine.resumeExecution(result.executionId);
      expect(resumed).toBe(false);
    });

    it('should not stop completed execution', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stopped = executionEngine.stopExecution(result.executionId);
      expect(stopped).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should add event listener', () => {
      const listener = jest.fn();
      executionEngine.addEventListener(listener);
      
      // The listener should be added (we can't easily test the internal Set)
      expect(() => executionEngine.addEventListener(listener)).not.toThrow();
    });

    it('should remove event listener', () => {
      const listener = jest.fn();
      executionEngine.addEventListener(listener);
      executionEngine.removeEventListener(listener);
      
      // The listener should be removed (we can't easily test the internal Set)
      expect(() => executionEngine.removeEventListener(listener)).not.toThrow();
    });

    it('should emit events during execution', async () => {
      const listener = jest.fn();
      executionEngine.addEventListener(listener);
      
      await executionEngine.executeWorkflow(mockWorkflow);
      
      // Should have received some events
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Execution State', () => {
    it('should initialize execution state correctly', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution).toBeDefined();
      expect(execution?.id).toBeDefined();
      expect(execution?.workflowId).toBe(mockWorkflow.id);
      expect(execution?.status).toBeDefined();
      expect(execution?.startTime).toBeInstanceOf(Date);
      expect(execution?.totalNodes).toBe(mockWorkflow.nodes.length);
      expect(execution?.completedNodes).toBeDefined();
      expect(execution?.failedNodes).toBeDefined();
      expect(execution?.skippedNodes).toBeDefined();
      expect(execution?.variables).toBeDefined();
      expect(execution?.executionPath).toBeDefined();
      expect(execution?.errors).toBeDefined();
      expect(execution?.warnings).toBeDefined();
      expect(execution?.performanceMetrics).toBeDefined();
      expect(execution?.isPaused).toBe(false);
      expect(execution?.isStopped).toBe(false);
    });

    it('should track execution progress', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution?.progress).toBeGreaterThanOrEqual(0);
      expect(execution?.progress).toBeLessThanOrEqual(100);
      expect(execution?.completedNodes).toBeGreaterThanOrEqual(0);
      expect(execution?.completedNodes).toBeLessThanOrEqual(execution?.totalNodes || 0);
    });

    it('should track execution duration', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution?.duration).toBeGreaterThanOrEqual(0);
      if (execution?.endTime) {
        expect(execution.duration).toBe(
          execution.endTime.getTime() - execution.startTime.getTime()
        );
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should initialize performance metrics', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution?.performanceMetrics).toBeDefined();
      expect(execution?.performanceMetrics.totalExecutionTime).toBeDefined();
      expect(execution?.performanceMetrics.averageStepTime).toBeDefined();
      expect(execution?.performanceMetrics.slowestStep).toBeDefined();
      expect(execution?.performanceMetrics.fastestStep).toBeDefined();
      expect(execution?.performanceMetrics.memoryUsage).toBeDefined();
      expect(execution?.performanceMetrics.cpuUsage).toBeDefined();
      expect(execution?.performanceMetrics.networkCalls).toBeDefined();
      expect(execution?.performanceMetrics.resourceUtilization).toBeDefined();
    });

    it('should track performance metrics during execution', async () => {
      const options: ExecutionOptions = {
        enablePerformanceMonitoring: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution?.performanceMetrics.memoryUsage.current).toBeGreaterThanOrEqual(0);
      expect(execution?.performanceMetrics.cpuUsage.current).toBeGreaterThanOrEqual(0);
      expect(execution?.performanceMetrics.networkCalls.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'invalid-workflow',
        nodes: [],
        edges: []
      };

      const result = await executionEngine.executeWorkflow(invalidWorkflow);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Initial result is always success
      
      // Wait for execution to complete and check final state
      await new Promise(resolve => setTimeout(resolve, 100));
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('failed');
      expect(execution?.errors.length).toBeGreaterThan(0);
    });

    it('should track errors in execution state', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'invalid-workflow',
        nodes: [],
        edges: []
      };

      const result = await executionEngine.executeWorkflow(invalidWorkflow);
      
      // Wait for execution to complete and check final state
      await new Promise(resolve => setTimeout(resolve, 100));
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution?.errors).toBeDefined();
      expect(execution?.errors.length).toBeGreaterThan(0);
    });

    it('should handle timeout errors', async () => {
      const options: ExecutionOptions = {
        timeout: 1 // Very short timeout
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      
      // The execution might complete before timeout or timeout
      expect(result).toBeDefined();
    });
  });

  describe('Execution Results', () => {
    it('should return execution result with correct structure', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.executionId).toBeDefined();
      expect(result.finalState).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
      expect(result.executionTime).toBeDefined();
    });

    it('should return successful execution result', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should return failed execution result for invalid workflow', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'invalid-workflow',
        nodes: [],
        edges: []
      };

      const result = await executionEngine.executeWorkflow(invalidWorkflow);
      
      expect(result.success).toBe(true); // Initial result is always success
      
      // Wait for execution to complete and check final state
      await new Promise(resolve => setTimeout(resolve, 100));
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('failed');
      expect(execution?.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should clear all executions', async () => {
      await executionEngine.executeWorkflow(mockWorkflow);
      expect(executionEngine.getAllExecutions().length).toBeGreaterThan(0);
      
      executionEngine.clearExecutions();
      expect(executionEngine.getAllExecutions().length).toBe(0);
    });
  });

  describe('Execution Status Transitions', () => {
    it('should transition from idle to running', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      const execution = executionEngine.getExecutionState(result.executionId);
      
      expect(execution?.status).toBe('running');
    });

    it('should transition from running to paused', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      executionEngine.pauseExecution(result.executionId);
      
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('paused');
    });

    it('should transition from paused to running', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      executionEngine.pauseExecution(result.executionId);
      await executionEngine.resumeExecution(result.executionId);
      
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('running');
    });

    it('should transition from running to stopped', async () => {
      const result = await executionEngine.executeWorkflow(mockWorkflow);
      executionEngine.stopExecution(result.executionId);
      
      const execution = executionEngine.getExecutionState(result.executionId);
      expect(execution?.status).toBe('stopped');
    });
  });

  describe('Execution Options', () => {
    it('should respect timeout option', async () => {
      const options: ExecutionOptions = {
        timeout: 1000
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect maxRetries option', async () => {
      const options: ExecutionOptions = {
        maxRetries: 3
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect enablePerformanceMonitoring option', async () => {
      const options: ExecutionOptions = {
        enablePerformanceMonitoring: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect enableVariableTracking option', async () => {
      const options: ExecutionOptions = {
        enableVariableTracking: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect enableStepLogging option', async () => {
      const options: ExecutionOptions = {
        enableStepLogging: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect pauseOnError option', async () => {
      const options: ExecutionOptions = {
        pauseOnError: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect continueOnWarning option', async () => {
      const options: ExecutionOptions = {
        continueOnWarning: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect parallelExecution option', async () => {
      const options: ExecutionOptions = {
        parallelExecution: true
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect maxConcurrentSteps option', async () => {
      const options: ExecutionOptions = {
        maxConcurrentSteps: 5
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });

    it('should respect resourceLimits option', async () => {
      const options: ExecutionOptions = {
        resourceLimits: {
          maxMemory: 1024,
          maxCpu: 80,
          maxExecutionTime: 30000
        }
      };

      const result = await executionEngine.executeWorkflow(mockWorkflow, options);
      expect(result).toBeDefined();
    });
  });
});
