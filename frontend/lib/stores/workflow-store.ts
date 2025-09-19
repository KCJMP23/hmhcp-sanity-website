import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  Workflow, 
  WorkflowExecution, 
  WorkflowStep, 
  WorkflowMessage,
  LogEntry,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTemplate,
  AgentMetrics,
  WorkflowError,
  WorkflowErrorCode,
  ExecutionStatus
} from '@/types/ai/workflows';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

interface WorkflowState {
  // Current workflow
  currentWorkflow: Workflow | null;
  isDirty: boolean;
  
  // Execution state
  activeExecutions: Map<string, WorkflowExecution>;
  executionLogs: Map<string, LogEntry[]>;
  
  // UI state
  selectedNodeId: string | null;
  canvasZoom: number;
  canvasPosition: { x: number; y: number; };
  
  // WebSocket connection
  wsConnection: WebSocket | null;
  wsConnected: boolean;
  
  // Actions
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  executeWorkflow: (params?: Record<string, any>) => Promise<string>;
  pauseExecution: (executionId: string) => Promise<void>;
  resumeExecution: (executionId: string) => Promise<void>;
  cancelExecution: (executionId: string) => Promise<void>;
  
  // Node operations
  addNode: (node: WorkflowStep) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowStep>) => void;
  deleteNode: (nodeId: string) => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  
  // WebSocket management
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  handleWorkflowMessage: (message: WorkflowMessage) => void;
  
  // UI operations
  setSelectedNode: (nodeId: string | null) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentWorkflow: null,
    isDirty: false,
    activeExecutions: new Map(),
    executionLogs: new Map(),
    selectedNodeId: null,
    canvasZoom: 1,
    canvasPosition: { x: 0, y: 0 },
    wsConnection: null,
    wsConnected: false,

    // Load workflow
    loadWorkflow: async (id: string) => {
      try {
        const response = await fetch(`/api/ai/workflows/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to load workflow');
        
        const data = await response.json();
        set({ 
          currentWorkflow: data.workflow,
          isDirty: false 
        });
      } catch (error) {
        console.error('Error loading workflow:', error);
        throw error;
      }
    },

    // Save workflow
    saveWorkflow: async () => {
      const { currentWorkflow } = get();
      if (!currentWorkflow) return;

      try {
        const response = await fetch(
          currentWorkflow.id 
            ? `/api/ai/workflows/${currentWorkflow.id}`
            : '/api/ai/workflows',
          {
            method: currentWorkflow.id ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(currentWorkflow)
          }
        );
        
        if (!response.ok) throw new Error('Failed to save workflow');
        
        const data = await response.json();
        set({ 
          currentWorkflow: data.workflow,
          isDirty: false 
        });
      } catch (error) {
        console.error('Error saving workflow:', error);
        throw error;
      }
    },

    // Execute workflow
    executeWorkflow: async (params?: Record<string, any>) => {
      const { currentWorkflow } = get();
      if (!currentWorkflow) throw new Error('No workflow loaded');

      try {
        const response = await fetch(
          `/api/ai/workflows/${currentWorkflow.id}/execute`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              parameters: params,
              priority: currentWorkflow.workflowDefinition.config.priority
            })
          }
        );
        
        if (!response.ok) throw new Error('Failed to execute workflow');
        
        const data = await response.json();
        return data.executionId;
      } catch (error) {
        console.error('Error executing workflow:', error);
        throw error;
      }
    },

    // Pause execution
    pauseExecution: async (executionId: string) => {
      try {
        const response = await fetch(
          `/api/ai/workflows/executions/${executionId}/pause`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to pause execution');
      } catch (error) {
        console.error('Error pausing execution:', error);
        throw error;
      }
    },

    // Resume execution
    resumeExecution: async (executionId: string) => {
      try {
        const response = await fetch(
          `/api/ai/workflows/executions/${executionId}/resume`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to resume execution');
      } catch (error) {
        console.error('Error resuming execution:', error);
        throw error;
      }
    },

    // Cancel execution
    cancelExecution: async (executionId: string) => {
      try {
        const response = await fetch(
          `/api/ai/workflows/executions/${executionId}/cancel`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to cancel execution');
      } catch (error) {
        console.error('Error cancelling execution:', error);
        throw error;
      }
    },

    // Add node
    addNode: (node: WorkflowStep) => {
      set((state) => {
        if (!state.currentWorkflow) return state;
        
        return {
          currentWorkflow: {
            ...state.currentWorkflow,
            workflowDefinition: {
              ...state.currentWorkflow.workflowDefinition,
              steps: [...state.currentWorkflow.workflowDefinition.steps, node]
            }
          },
          isDirty: true
        };
      });
    },

    // Update node
    updateNode: (nodeId: string, updates: Partial<WorkflowStep>) => {
      set((state) => {
        if (!state.currentWorkflow) return state;
        
        return {
          currentWorkflow: {
            ...state.currentWorkflow,
            workflowDefinition: {
              ...state.currentWorkflow.workflowDefinition,
              steps: state.currentWorkflow.workflowDefinition.steps.map(
                step => step.id === nodeId ? { ...step, ...updates } : step
              )
            }
          },
          isDirty: true
        };
      });
    },

    // Delete node
    deleteNode: (nodeId: string) => {
      set((state) => {
        if (!state.currentWorkflow) return state;
        
        return {
          currentWorkflow: {
            ...state.currentWorkflow,
            workflowDefinition: {
              ...state.currentWorkflow.workflowDefinition,
              steps: state.currentWorkflow.workflowDefinition.steps.filter(
                step => step.id !== nodeId
              )
            }
          },
          isDirty: true,
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
        };
      });
    },

    // Connect nodes
    connectNodes: (sourceId: string, targetId: string) => {
      set((state) => {
        if (!state.currentWorkflow) return state;
        
        return {
          currentWorkflow: {
            ...state.currentWorkflow,
            workflowDefinition: {
              ...state.currentWorkflow.workflowDefinition,
              steps: state.currentWorkflow.workflowDefinition.steps.map(
                step => {
                  if (step.id === sourceId) {
                    return {
                      ...step,
                      nextSteps: [...(step.nextSteps || []), { stepId: targetId }]
                    };
                  }
                  return step;
                }
              )
            }
          },
          isDirty: true
        };
      });
    },

    // WebSocket connection
    connectWebSocket: () => {
      const ws = new WebSocket(
        process.env.NEXT_PUBLIC_WORKFLOW_WS_URL || 'wss://localhost:3001/api/ai/workflows/realtime'
      );

      ws.onopen = () => {
        set({ wsConnection: ws, wsConnected: true });
        
        // Send authentication
        ws.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('token')
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WorkflowMessage;
          get().handleWorkflowMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        set({ wsConnection: null, wsConnected: false });
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!get().wsConnected) {
            get().connectWebSocket();
          }
        }, 5000);
      };

      set({ wsConnection: ws });
    },

    // Disconnect WebSocket
    disconnectWebSocket: () => {
      const { wsConnection } = get();
      if (wsConnection) {
        wsConnection.close();
        set({ wsConnection: null, wsConnected: false });
      }
    },

    // Handle workflow message
    handleWorkflowMessage: (message: WorkflowMessage) => {
      set((state) => {
        const newExecutions = new Map(state.activeExecutions);
        const newLogs = new Map(state.executionLogs);

        switch (message.type) {
          case 'workflow.started':
            if (message.executionId) {
              newExecutions.set(message.executionId, message.payload);
            }
            break;

          case 'workflow.completed':
          case 'workflow.failed':
          case 'workflow.cancelled':
            if (message.executionId) {
              const execution = newExecutions.get(message.executionId);
              if (execution) {
                newExecutions.set(message.executionId, {
                  ...execution,
                  ...message.payload
                });
              }
            }
            break;

          case 'log.entry':
            if (message.executionId) {
              const logs = newLogs.get(message.executionId) || [];
              newLogs.set(message.executionId, [...logs, message.payload]);
            }
            break;

          case 'metrics.update':
            // Handle metrics updates
            break;
        }

        return {
          activeExecutions: newExecutions,
          executionLogs: newLogs
        };
      });
    },

    // UI operations
    setSelectedNode: (nodeId: string | null) => {
      set({ selectedNodeId: nodeId });
    },

    setCanvasZoom: (zoom: number) => {
      set({ canvasZoom: Math.max(0.1, Math.min(2, zoom)) });
    },

    setCanvasPosition: (position: { x: number; y: number }) => {
      set({ canvasPosition: position });
    }
  }))
);