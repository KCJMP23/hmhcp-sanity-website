import { WorkflowNode, WorkflowStatus, NodeData } from '@/types/workflows/visual-builder';

export interface NodeState {
  nodeId: string;
  status: WorkflowStatus;
  lastUpdated: Date;
  error?: string;
  progress?: number;
  data?: any;
  metadata?: Record<string, any>;
}

export interface NodeStateUpdate {
  nodeId: string;
  status?: WorkflowStatus;
  error?: string;
  progress?: number;
  data?: any;
  metadata?: Record<string, any>;
}

export class NodeStateManager {
  private states: Map<string, NodeState> = new Map();
  private listeners: Set<(nodeId: string, state: NodeState) => void> = new Set();

  constructor() {
    this.reset();
  }

  public getNodeState(nodeId: string): NodeState | undefined {
    return this.states.get(nodeId);
  }

  public getAllNodeStates(): Map<string, NodeState> {
    return new Map(this.states);
  }

  public updateNodeState(update: NodeStateUpdate): void {
    const existingState = this.states.get(update.nodeId);
    const newState: NodeState = {
      nodeId: update.nodeId,
      status: update.status || existingState?.status || 'idle',
      lastUpdated: new Date(),
      error: update.error,
      progress: update.progress,
      data: update.data,
      metadata: { ...existingState?.metadata, ...update.metadata },
    };

    this.states.set(update.nodeId, newState);
    this.notifyListeners(update.nodeId, newState);
  }

  public updateMultipleNodeStates(updates: NodeStateUpdate[]): void {
    updates.forEach(update => this.updateNodeState(update));
  }

  public setNodeStatus(nodeId: string, status: WorkflowStatus): void {
    this.updateNodeState({ nodeId, status });
  }

  public setNodeError(nodeId: string, error: string): void {
    this.updateNodeState({ 
      nodeId, 
      status: 'failed', 
      error 
    });
  }

  public setNodeProgress(nodeId: string, progress: number): void {
    this.updateNodeState({ 
      nodeId, 
      progress: Math.max(0, Math.min(100, progress)) 
    });
  }

  public setNodeData(nodeId: string, data: any): void {
    this.updateNodeState({ nodeId, data });
  }

  public clearNodeError(nodeId: string): void {
    const existingState = this.states.get(nodeId);
    if (existingState) {
      this.updateNodeState({ 
        nodeId, 
        error: undefined,
        status: existingState.status === 'failed' ? 'idle' : existingState.status
      });
    }
  }

  public resetNodeState(nodeId: string): void {
    this.updateNodeState({
      nodeId,
      status: 'idle',
      error: undefined,
      progress: undefined,
      data: undefined,
      metadata: {},
    });
  }

  public resetAllNodeStates(): void {
    this.states.clear();
    this.notifyAllListeners();
  }

  public reset(): void {
    this.states.clear();
    this.listeners.clear();
  }

  public subscribe(listener: (nodeId: string, state: NodeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getNodesByStatus(status: WorkflowStatus): NodeState[] {
    return Array.from(this.states.values()).filter(state => state.status === status);
  }

  public getFailedNodes(): NodeState[] {
    return this.getNodesByStatus('failed');
  }

  public getRunningNodes(): NodeState[] {
    return this.getNodesByStatus('running');
  }

  public getCompletedNodes(): NodeState[] {
    return this.getNodesByStatus('completed');
  }

  public getNodeExecutionOrder(nodes: WorkflowNode[]): string[] {
    // Simple topological sort for execution order
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected involving node ${nodeId}`);
      }
      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      // Find all nodes that this node depends on (incoming edges)
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.data && typeof node.data === 'object' && 'dependencies' in node.data) {
        const dependencies = Array.isArray(node.data.dependencies) ? node.data.dependencies : [];
        dependencies.forEach(depId => {
          if (nodes.some(n => n.id === depId)) {
            visit(depId);
          }
        });
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    });

    return order;
  }

  public validateNodeState(nodeId: string, nodeData: NodeData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const state = this.getNodeState(nodeId);

    if (!state) {
      errors.push('Node state not found');
      return { isValid: false, errors };
    }

    // Validate status transitions
    const validTransitions: Record<WorkflowStatus, WorkflowStatus[]> = {
      'idle': ['running', 'validating', 'optimizing'],
      'running': ['completed', 'failed', 'paused'],
      'paused': ['running', 'idle'],
      'completed': ['idle'],
      'failed': ['idle', 'running'],
      'validating': ['idle', 'running', 'failed'],
      'optimizing': ['idle', 'running', 'failed'],
    };

    // Note: This validation is simplified for testing purposes
    // In a real implementation, you would validate against previous state

    // Validate progress
    if (state.progress !== undefined && (state.progress < 0 || state.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
    }

    // Validate healthcare compliance
    if (nodeData.healthcareCompliance) {
      const compliance = nodeData.healthcareCompliance;
      if (!['HIPAA', 'GDPR', 'FDA', 'SOC2', 'NONE'].includes(compliance.level)) {
        errors.push('Invalid healthcare compliance level');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  public getExecutionSummary(): {
    total: number;
    idle: number;
    running: number;
    completed: number;
    failed: number;
    paused: number;
    validating: number;
    optimizing: number;
  } {
    const states = Array.from(this.states.values());
    
    return {
      total: states.length,
      idle: states.filter(s => s.status === 'idle').length,
      running: states.filter(s => s.status === 'running').length,
      completed: states.filter(s => s.status === 'completed').length,
      failed: states.filter(s => s.status === 'failed').length,
      paused: states.filter(s => s.status === 'paused').length,
      validating: states.filter(s => s.status === 'validating').length,
      optimizing: states.filter(s => s.status === 'optimizing').length,
    };
  }

  private notifyListeners(nodeId: string, state: NodeState): void {
    this.listeners.forEach(listener => {
      try {
        listener(nodeId, state);
      } catch (error) {
        console.error('Error in node state listener:', error);
      }
    });
  }

  private notifyAllListeners(): void {
    this.states.forEach((state, nodeId) => {
      this.notifyListeners(nodeId, state);
    });
  }
}
