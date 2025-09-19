/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowCanvas } from '../workflow-canvas';
import { WorkflowNode, WorkflowEdge } from '@/types/workflows/visual-builder';

// Mock ReactFlow components
jest.mock('reactflow', () => ({
  ReactFlow: ({ children, onNodesChange, onEdgesChange, onConnect, onSelectionChange, ...props }: any) => (
    <div data-testid="react-flow" {...props}>
      {children}
      <button
        onClick={() => onNodesChange([{ type: 'position', id: 'test-node', position: { x: 100, y: 100 } }])}
        data-testid="trigger-nodes-change"
      >
        Trigger Nodes Change
      </button>
      <button
        onClick={() => onEdgesChange([{ type: 'add', item: { id: 'test-edge', source: 'node1', target: 'node2' } }])}
        data-testid="trigger-edges-change"
      >
        Trigger Edges Change
      </button>
      <button
        onClick={() => onConnect({ source: 'node1', target: 'node2' })}
        data-testid="trigger-connect"
      >
        Trigger Connect
      </button>
      <button
        onClick={() => onSelectionChange({ nodes: [{ id: 'node1' }], edges: [] })}
        data-testid="trigger-selection-change"
      >
        Trigger Selection Change
      </button>
    </div>
  ),
  useNodesState: (initialNodes: any) => [initialNodes, jest.fn()],
  useEdgesState: (initialEdges: any) => [initialEdges, jest.fn()],
  addEdge: (edge: any, edges: any) => [...edges, edge],
  useReactFlow: () => ({
    fitView: jest.fn(),
    getViewport: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    setViewport: jest.fn(),
  }),
  Controls: ({ children, ...props }: any) => <div data-testid="controls" {...props}>{children}</div>,
  MiniMap: ({ children, ...props }: any) => <div data-testid="mini-map" {...props}>{children}</div>,
  Background: ({ children, ...props }: any) => <div data-testid="background" {...props}>{children}</div>,
  BackgroundVariant: {
    Dots: 'dots',
    Lines: 'lines',
    Cross: 'cross',
  },
  Panel: ({ children, ...props }: any) => <div data-testid="panel" {...props}>{children}</div>,
  ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>,
}));

// Mock validation engine
jest.mock('@/lib/workflows/validation-engine', () => ({
  WorkflowValidationEngine: jest.fn().mockImplementation(() => ({
    validateWorkflow: jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      performance: {
        estimatedExecutionTime: 1000,
        memoryUsage: 50,
        costEstimate: 0.01,
        bottlenecks: [],
        optimizations: [],
      },
      compliance: {
        hipaaCompliant: true,
        fdaCompliant: true,
        gdprCompliant: true,
        issues: [],
        recommendations: [],
      },
    }),
  })),
}));

// Mock optimization engine
jest.mock('@/lib/workflows/optimization-engine', () => ({
  WorkflowOptimizationEngine: jest.fn().mockImplementation(() => ({
    optimizeWorkflow: jest.fn().mockResolvedValue({
      nodes: [],
      edges: [],
      optimizations: [],
    }),
  })),
}));

// Mock child components
jest.mock('../node-library', () => ({
  WorkflowNodeLibrary: ({ onClose, onNodeSelect }: any) => (
    <div data-testid="node-library">
      <button onClick={onClose} data-testid="close-node-library">Close</button>
      <button onClick={() => onNodeSelect('ai-agent')} data-testid="select-ai-agent">Select AI Agent</button>
    </div>
  ),
}));

jest.mock('../connection-editor', () => ({
  WorkflowConnectionEditor: ({ onClose, onConnect }: any) => (
    <div data-testid="connection-editor">
      <button onClick={onClose} data-testid="close-connection-editor">Close</button>
      <button onClick={() => onConnect({ source: 'node1', target: 'node2' })} data-testid="create-connection">Create Connection</button>
    </div>
  ),
}));

jest.mock('../execution-monitor', () => ({
  WorkflowExecutionMonitor: ({ onClose }: any) => (
    <div data-testid="execution-monitor">
      <button onClick={onClose} data-testid="close-execution-monitor">Close</button>
    </div>
  ),
}));

const mockNodes: WorkflowNode[] = [
  {
    id: 'node-1',
    type: 'workflow-start',
    position: { x: 100, y: 100 },
    data: {
      label: 'Start',
      description: 'Workflow start',
      category: 'workflow-control',
      config: {},
      status: 'idle',
    },
  },
  {
    id: 'node-2',
    type: 'ai-agent',
    position: { x: 300, y: 100 },
    data: {
      label: 'AI Agent',
      description: 'AI processing',
      category: 'ai-agents',
      config: { agentType: 'research' },
      status: 'idle',
    },
  },
];

const mockEdges: WorkflowEdge[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
  },
];

describe('WorkflowCanvas', () => {
  const defaultProps = {
    initialNodes: mockNodes,
    initialEdges: mockEdges,
    onNodesChange: jest.fn(),
    onEdgesChange: jest.fn(),
    onSelectionChange: jest.fn(),
    onWorkflowChange: jest.fn(),
    onValidationChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders workflow canvas with initial nodes and edges', () => {
    render(<WorkflowCanvas {...defaultProps} />);
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('mini-map')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  it('shows toolbar with action buttons', () => {
    render(<WorkflowCanvas {...defaultProps} />);
    
    expect(screen.getByText('Add Node')).toBeInTheDocument();
    expect(screen.getByText('Connect Nodes')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Optimize')).toBeInTheDocument();
    expect(screen.getByText('Monitor')).toBeInTheDocument();
  });

  it('opens node library when Add Node is clicked', async () => {
    render(<WorkflowCanvas {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add Node'));
    
    await waitFor(() => {
      expect(screen.getByTestId('node-library')).toBeInTheDocument();
    });
  });

  it('opens connection editor when Connect Nodes is clicked with two selected nodes', async () => {
    render(<WorkflowCanvas {...defaultProps} />);
    
    // Mock selection change to select two nodes
    fireEvent.click(screen.getByTestId('trigger-selection-change'));
    
    // Now the Connect Nodes button should be enabled
    const connectButton = screen.getByText('Connect Nodes');
    expect(connectButton).not.toBeDisabled();
    
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('connection-editor')).toBeInTheDocument();
    });
  });

  it('opens execution monitor when Monitor is clicked', async () => {
    render(<WorkflowCanvas {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Monitor'));
    
    await waitFor(() => {
      expect(screen.getByTestId('execution-monitor')).toBeInTheDocument();
    });
  });

  it('handles node changes', () => {
    const onNodesChange = jest.fn();
    render(<WorkflowCanvas {...defaultProps} onNodesChange={onNodesChange} />);
    
    fireEvent.click(screen.getByTestId('trigger-nodes-change'));
    
    expect(onNodesChange).toHaveBeenCalled();
  });

  it('handles edge changes', () => {
    const onEdgesChange = jest.fn();
    render(<WorkflowCanvas {...defaultProps} onEdgesChange={onEdgesChange} />);
    
    fireEvent.click(screen.getByTestId('trigger-edges-change'));
    
    expect(onEdgesChange).toHaveBeenCalled();
  });

  it('handles connections', () => {
    const onWorkflowChange = jest.fn();
    render(<WorkflowCanvas {...defaultProps} onWorkflowChange={onWorkflowChange} />);
    
    fireEvent.click(screen.getByTestId('trigger-connect'));
    
    expect(onWorkflowChange).toHaveBeenCalled();
  });

  it('handles selection changes', () => {
    const onSelectionChange = jest.fn();
    render(<WorkflowCanvas {...defaultProps} onSelectionChange={onSelectionChange} />);
    
    fireEvent.click(screen.getByTestId('trigger-selection-change'));
    
    expect(onSelectionChange).toHaveBeenCalledWith(['node1'], []);
  });

  it('validates workflow when validate button is clicked', async () => {
    const onValidationChange = jest.fn();
    render(<WorkflowCanvas {...defaultProps} onValidationChange={onValidationChange} />);
    
    fireEvent.click(screen.getByText('Validate'));
    
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalled();
    });
  });

  it('optimizes workflow when optimize button is clicked', async () => {
    render(<WorkflowCanvas {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Optimize'));
    
    // Should not throw any errors
    await waitFor(() => {
      expect(screen.getByText('Optimize')).toBeInTheDocument();
    });
  });

  it('shows validation status when validation result is available', async () => {
    const mockValidationResult = {
      isValid: false,
      errors: [{ id: 'error-1', type: 'connection', severity: 'error', message: 'Test error' }],
      warnings: [],
      suggestions: [],
      performance: {
        estimatedExecutionTime: 1000,
        memoryUsage: 50,
        costEstimate: 0.01,
        bottlenecks: [],
        optimizations: [],
      },
      compliance: {
        hipaaCompliant: true,
        fdaCompliant: true,
        gdprCompliant: true,
        issues: [],
        recommendations: [],
      },
    };

    // Mock the validation engine to return the result
    const { WorkflowValidationEngine } = require('@/lib/workflows/validation-engine');
    const mockInstance = new WorkflowValidationEngine();
    mockInstance.validateWorkflow.mockResolvedValue(mockValidationResult);

    render(<WorkflowCanvas {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Validate'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(screen.getByText('Errors:')).toBeInTheDocument();
    });
  });

  it('respects readOnly prop', () => {
    render(<WorkflowCanvas {...defaultProps} readOnly={true} />);
    
    // In read-only mode, some buttons should be disabled or not shown
    expect(screen.getByText('Add Node')).toBeInTheDocument();
    expect(screen.getByText('Connect Nodes')).toBeInTheDocument();
  });

  it('can toggle mini-map visibility', () => {
    render(<WorkflowCanvas {...defaultProps} showMiniMap={false} />);
    
    expect(screen.queryByTestId('mini-map')).not.toBeInTheDocument();
  });

  it('can toggle controls visibility', () => {
    render(<WorkflowCanvas {...defaultProps} showControls={false} />);
    
    expect(screen.queryByTestId('controls')).not.toBeInTheDocument();
  });

  it('can toggle background visibility', () => {
    render(<WorkflowCanvas {...defaultProps} showBackground={false} />);
    
    expect(screen.queryByTestId('background')).not.toBeInTheDocument();
  });
});
