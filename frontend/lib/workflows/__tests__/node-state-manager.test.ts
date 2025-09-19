import { NodeStateManager, NodeStateUpdate } from '../node-state-manager';
import { WorkflowStatus } from '@/types/workflows/visual-builder';

describe('NodeStateManager', () => {
  let stateManager: NodeStateManager;

  beforeEach(() => {
    stateManager = new NodeStateManager();
  });

  afterEach(() => {
    stateManager.reset();
  });

  describe('Node State Management', () => {
    it('should initialize with empty state', () => {
      expect(stateManager.getAllNodeStates().size).toBe(0);
    });

    it('should update node state correctly', () => {
      const update: NodeStateUpdate = {
        nodeId: 'node-1',
        status: 'running',
        progress: 50,
        data: { result: 'test' },
      };

      stateManager.updateNodeState(update);

      const state = stateManager.getNodeState('node-1');
      expect(state).toBeDefined();
      expect(state?.status).toBe('running');
      expect(state?.progress).toBe(50);
      expect(state?.data).toEqual({ result: 'test' });
    });

    it('should update multiple node states', () => {
      const updates: NodeStateUpdate[] = [
        { nodeId: 'node-1', status: 'running' },
        { nodeId: 'node-2', status: 'completed' },
        { nodeId: 'node-3', status: 'failed', error: 'Test error' },
      ];

      stateManager.updateMultipleNodeStates(updates);

      expect(stateManager.getNodeState('node-1')?.status).toBe('running');
      expect(stateManager.getNodeState('node-2')?.status).toBe('completed');
      expect(stateManager.getNodeState('node-3')?.status).toBe('failed');
      expect(stateManager.getNodeState('node-3')?.error).toBe('Test error');
    });

    it('should set node status correctly', () => {
      stateManager.setNodeStatus('node-1', 'running');
      expect(stateManager.getNodeState('node-1')?.status).toBe('running');
    });

    it('should set node error correctly', () => {
      stateManager.setNodeError('node-1', 'Test error');
      const state = stateManager.getNodeState('node-1');
      expect(state?.status).toBe('failed');
      expect(state?.error).toBe('Test error');
    });

    it('should set node progress correctly', () => {
      stateManager.setNodeProgress('node-1', 75);
      expect(stateManager.getNodeState('node-1')?.progress).toBe(75);
    });

    it('should clamp progress between 0 and 100', () => {
      stateManager.setNodeProgress('node-1', 150);
      expect(stateManager.getNodeState('node-1')?.progress).toBe(100);

      stateManager.setNodeProgress('node-2', -50);
      expect(stateManager.getNodeState('node-2')?.progress).toBe(0);
    });

    it('should set node data correctly', () => {
      const data = { result: 'test', count: 42 };
      stateManager.setNodeData('node-1', data);
      expect(stateManager.getNodeState('node-1')?.data).toEqual(data);
    });

    it('should clear node error correctly', () => {
      stateManager.setNodeError('node-1', 'Test error');
      stateManager.clearNodeError('node-1');
      
      const state = stateManager.getNodeState('node-1');
      expect(state?.error).toBeUndefined();
      expect(state?.status).toBe('idle');
    });

    it('should reset node state correctly', () => {
      stateManager.updateNodeState({
        nodeId: 'node-1',
        status: 'running',
        progress: 50,
        data: { test: 'data' },
        error: 'Test error',
      });

      stateManager.resetNodeState('node-1');

      const state = stateManager.getNodeState('node-1');
      expect(state?.status).toBe('idle');
      expect(state?.progress).toBeUndefined();
      expect(state?.data).toBeUndefined();
      expect(state?.error).toBeUndefined();
    });

    it('should reset all node states', () => {
      stateManager.updateNodeState({ nodeId: 'node-1', status: 'running' });
      stateManager.updateNodeState({ nodeId: 'node-2', status: 'completed' });

      stateManager.resetAllNodeStates();

      expect(stateManager.getAllNodeStates().size).toBe(0);
    });
  });

  describe('Node Filtering', () => {
    beforeEach(() => {
      stateManager.updateMultipleNodeStates([
        { nodeId: 'node-1', status: 'idle' },
        { nodeId: 'node-2', status: 'running' },
        { nodeId: 'node-3', status: 'completed' },
        { nodeId: 'node-4', status: 'failed' },
        { nodeId: 'node-5', status: 'paused' },
        { nodeId: 'node-6', status: 'validating' },
        { nodeId: 'node-7', status: 'optimizing' },
      ]);
    });

    it('should get nodes by status', () => {
      const runningNodes = stateManager.getNodesByStatus('running');
      expect(runningNodes).toHaveLength(1);
      expect(runningNodes[0].nodeId).toBe('node-2');

      const completedNodes = stateManager.getNodesByStatus('completed');
      expect(completedNodes).toHaveLength(1);
      expect(completedNodes[0].nodeId).toBe('node-3');
    });

    it('should get failed nodes', () => {
      const failedNodes = stateManager.getFailedNodes();
      expect(failedNodes).toHaveLength(1);
      expect(failedNodes[0].nodeId).toBe('node-4');
    });

    it('should get running nodes', () => {
      const runningNodes = stateManager.getRunningNodes();
      expect(runningNodes).toHaveLength(1);
      expect(runningNodes[0].nodeId).toBe('node-2');
    });

    it('should get completed nodes', () => {
      const completedNodes = stateManager.getCompletedNodes();
      expect(completedNodes).toHaveLength(1);
      expect(completedNodes[0].nodeId).toBe('node-3');
    });
  });

  describe('Execution Order', () => {
    it('should determine execution order for simple workflow', () => {
      const nodes = [
        { id: 'start', data: { dependencies: [] } },
        { id: 'middle', data: { dependencies: ['start'] } },
        { id: 'end', data: { dependencies: ['middle'] } },
      ] as any[];

      const order = stateManager.getNodeExecutionOrder(nodes);
      expect(order).toEqual(['start', 'middle', 'end']);
    });

    it('should handle parallel dependencies', () => {
      const nodes = [
        { id: 'start', data: { dependencies: [] } },
        { id: 'parallel1', data: { dependencies: ['start'] } },
        { id: 'parallel2', data: { dependencies: ['start'] } },
        { id: 'end', data: { dependencies: ['parallel1', 'parallel2'] } },
      ] as any[];

      const order = stateManager.getNodeExecutionOrder(nodes);
      expect(order).toContain('start');
      expect(order).toContain('parallel1');
      expect(order).toContain('parallel2');
      expect(order).toContain('end');
      expect(order.indexOf('start')).toBeLessThan(order.indexOf('parallel1'));
      expect(order.indexOf('start')).toBeLessThan(order.indexOf('parallel2'));
      expect(order.indexOf('parallel1')).toBeLessThan(order.indexOf('end'));
      expect(order.indexOf('parallel2')).toBeLessThan(order.indexOf('end'));
    });

    it('should throw error for circular dependencies', () => {
      const nodes = [
        { id: 'node1', data: { dependencies: ['node2'] } },
        { id: 'node2', data: { dependencies: ['node1'] } },
      ] as any[];

      expect(() => stateManager.getNodeExecutionOrder(nodes)).toThrow('Circular dependency detected');
    });
  });

  describe('State Validation', () => {
    it('should validate node state correctly', () => {
      const nodeData = {
        label: 'Test Node',
        category: 'ai-agents' as const,
        config: {},
        status: 'idle' as WorkflowStatus,
        healthcareCompliance: {
          level: 'HIPAA' as const,
          details: 'HIPAA compliant',
        },
      };

      stateManager.updateNodeState({ nodeId: 'node-1', status: 'running', progress: 50 });

      const validation = stateManager.validateNodeState('node-1', nodeData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid progress values', () => {
      stateManager.updateNodeState({ nodeId: 'node-1', progress: 150 });

      const nodeData = {
        label: 'Test Node',
        category: 'ai-agents' as const,
        config: {},
        status: 'idle' as WorkflowStatus,
      };

      const validation = stateManager.validateNodeState('node-1', nodeData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Progress must be between 0 and 100');
    });

    it('should detect invalid healthcare compliance levels', () => {
      const nodeData = {
        label: 'Test Node',
        category: 'ai-agents' as const,
        config: {},
        status: 'idle' as WorkflowStatus,
        healthcareCompliance: {
          level: 'INVALID' as any,
          details: 'Invalid compliance',
        },
      };

      stateManager.updateNodeState({ nodeId: 'node-1', status: 'idle' });

      const validation = stateManager.validateNodeState('node-1', nodeData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid healthcare compliance level');
    });
  });

  describe('Execution Summary', () => {
    it('should provide correct execution summary', () => {
      stateManager.updateMultipleNodeStates([
        { nodeId: 'node-1', status: 'idle' },
        { nodeId: 'node-2', status: 'running' },
        { nodeId: 'node-3', status: 'completed' },
        { nodeId: 'node-4', status: 'failed' },
        { nodeId: 'node-5', status: 'paused' },
        { nodeId: 'node-6', status: 'validating' },
        { nodeId: 'node-7', status: 'optimizing' },
      ]);

      const summary = stateManager.getExecutionSummary();
      expect(summary.total).toBe(7);
      expect(summary.idle).toBe(1);
      expect(summary.running).toBe(1);
      expect(summary.completed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.paused).toBe(1);
      expect(summary.validating).toBe(1);
      expect(summary.optimizing).toBe(1);
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners on state changes', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe(listener);

      stateManager.updateNodeState({ nodeId: 'node-1', status: 'running' });

      expect(listener).toHaveBeenCalledWith('node-1', expect.objectContaining({
        nodeId: 'node-1',
        status: 'running',
      }));

      unsubscribe();
    });

    it('should allow unsubscribing from listeners', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe(listener);

      unsubscribe();
      stateManager.updateNodeState({ nodeId: 'node-1', status: 'running' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      stateManager.subscribe(errorListener);
      stateManager.subscribe(normalListener);

      // Should not throw error and should still call normal listener
      expect(() => {
        stateManager.updateNodeState({ nodeId: 'node-1', status: 'running' });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });
});
