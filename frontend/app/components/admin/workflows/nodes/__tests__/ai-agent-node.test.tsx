import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIAgentNode } from '../ai-agent-node';
import { AgentNodeConfig, WorkflowStatus, HealthcareComplianceLevel } from '@/types/workflows/visual-builder';

// Mock ReactFlow components
jest.mock('reactflow', () => ({
  Handle: ({ children, ...props }: any) => <div data-testid="handle" {...props}>{children}</div>,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
  },
}));

const mockNodeData = {
  label: 'Test AI Agent',
  description: 'Test description',
  category: 'ai-agents' as const,
  config: {
    agentType: 'research',
    prompt: 'Test prompt',
    model: 'gpt-4',
  } as AgentNodeConfig,
  status: 'idle' as WorkflowStatus,
  healthcareCompliance: {
    level: 'HIPAA' as HealthcareComplianceLevel,
    details: 'HIPAA compliant',
  },
};

const mockProps = {
  id: 'test-node',
  data: mockNodeData,
  selected: false,
  type: 'ai-agent',
  position: { x: 0, y: 0 },
  dragging: false,
  dragHandle: undefined,
  sourcePosition: 'bottom' as any,
  targetPosition: 'top' as any,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  zIndex: 0,
  width: 300,
  height: 200,
};

describe('AIAgentNode', () => {
  it('renders with correct label and status', () => {
    render(<AIAgentNode {...mockProps} />);
    
    expect(screen.getByText('Test AI Agent')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('HIPAA')).toBeInTheDocument();
  });

  it('shows configuration panel when settings button is clicked', () => {
    render(<AIAgentNode {...mockProps} />);
    
    const settingsButton = screen.getByRole('button');
    fireEvent.click(settingsButton);
    
    expect(screen.getByText('Agent Type')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Prompt')).toBeInTheDocument();
  });

  it('allows editing configuration when edit button is clicked', async () => {
    render(<AIAgentNode {...mockProps} />);
    
    const settingsButton = screen.getByRole('button');
    fireEvent.click(settingsButton);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('research')).toBeInTheDocument();
      expect(screen.getByDisplayValue('gpt-4')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test prompt')).toBeInTheDocument();
    });
  });

  it('shows correct status icon for different statuses', () => {
    const runningProps = { ...mockProps, data: { ...mockNodeData, status: 'running' as WorkflowStatus } };
    const { rerender } = render(<AIAgentNode {...runningProps} />);
    
    // Test running status - check that handles are present
    expect(screen.getAllByTestId('handle')).toHaveLength(2);
    
    // Test completed status
    const completedProps = { ...mockProps, data: { ...mockNodeData, status: 'completed' as WorkflowStatus } };
    rerender(<AIAgentNode {...completedProps} />);
    
    // Test failed status
    const failedProps = { ...mockProps, data: { ...mockNodeData, status: 'failed' as WorkflowStatus } };
    rerender(<AIAgentNode {...failedProps} />);
  });

  it('displays healthcare compliance badge correctly', () => {
    render(<AIAgentNode {...mockProps} />);
    
    expect(screen.getByText('HIPAA')).toBeInTheDocument();
  });

  it('shows node information in collapsed state', () => {
    render(<AIAgentNode {...mockProps} />);
    
    expect(screen.getByText('Type: research')).toBeInTheDocument();
    expect(screen.getByText('Model: gpt-4')).toBeInTheDocument();
    expect(screen.getByText(/Prompt: Test prompt/)).toBeInTheDocument();
  });

  it('handles configuration changes correctly', async () => {
    render(<AIAgentNode {...mockProps} />);
    
    const settingsButton = screen.getByRole('button');
    fireEvent.click(settingsButton);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    const promptTextarea = screen.getByDisplayValue('Test prompt');
    fireEvent.change(promptTextarea, { target: { value: 'Updated prompt' } });
    
    expect(promptTextarea).toHaveValue('Updated prompt');
  });

  it('cancels configuration changes when cancel button is clicked', async () => {
    render(<AIAgentNode {...mockProps} />);
    
    const settingsButton = screen.getByRole('button');
    fireEvent.click(settingsButton);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    const promptTextarea = screen.getByDisplayValue('Test prompt');
    fireEvent.change(promptTextarea, { target: { value: 'Updated prompt' } });
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  it('saves configuration changes when save button is clicked', async () => {
    render(<AIAgentNode {...mockProps} />);
    
    const settingsButton = screen.getByRole('button');
    fireEvent.click(settingsButton);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });
});
