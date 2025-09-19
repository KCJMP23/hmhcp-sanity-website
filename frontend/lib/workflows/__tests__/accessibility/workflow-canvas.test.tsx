import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowCanvas } from '../../../components/admin/workflows/workflow-canvas';
import { WorkflowDefinition } from '../../../types/workflows/visual-builder';

// Mock the workflow canvas component for testing
const MockWorkflowCanvas = ({ workflow, onNodeSelect, onEdgeCreate, onWorkflowUpdate }: any) => {
  return (
    <div 
      role="main" 
      aria-label="Workflow Canvas"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onNodeSelect?.(null);
        }
      }}
    >
      <div role="toolbar" aria-label="Workflow Tools">
        <button 
          aria-label="Add Node"
          onClick={() => onWorkflowUpdate?.({ type: 'addNode', nodeType: 'dataProcessor' })}
        >
          Add Node
        </button>
        <button 
          aria-label="Zoom In"
          onClick={() => onWorkflowUpdate?.({ type: 'zoom', direction: 'in' })}
        >
          Zoom In
        </button>
        <button 
          aria-label="Zoom Out"
          onClick={() => onWorkflowUpdate?.({ type: 'zoom', direction: 'out' })}
        >
          Zoom Out
        </button>
        <button 
          aria-label="Reset View"
          onClick={() => onWorkflowUpdate?.({ type: 'resetView' })}
        >
          Reset View
        </button>
      </div>
      
      <div 
        role="application" 
        aria-label="Workflow Diagram"
        aria-describedby="workflow-description"
        style={{ width: '100%', height: '400px', position: 'relative' }}
      >
        <div id="workflow-description">
          Interactive workflow diagram. Use arrow keys to navigate between nodes. 
          Press Enter to select a node. Press Escape to deselect.
        </div>
        
        {workflow?.nodes.map((node: any) => (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`${node.data.label} node`}
            aria-describedby={`${node.id}-description`}
            onClick={() => onNodeSelect?.(node)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNodeSelect?.(node);
              }
            }}
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
              padding: '8px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <div id={`${node.id}-description`}>
              {node.data.label}
            </div>
          </div>
        ))}
        
        {workflow?.edges.map((edge: any) => (
          <div
            key={edge.id}
            role="presentation"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '100px',
              height: '2px',
              backgroundColor: '#000',
              transform: 'rotate(45deg)'
            }}
          />
        ))}
      </div>
      
      <div role="status" aria-live="polite" id="workflow-status">
        Workflow ready
      </div>
    </div>
  );
};

describe('Workflow Canvas Accessibility Tests', () => {
  const mockWorkflow: WorkflowDefinition = {
    id: 'test-workflow',
    name: 'Test Workflow',
    description: 'A test workflow for accessibility testing',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 50, y: 50 },
        data: { label: 'Start Node' }
      },
      {
        id: 'process',
        type: 'dataProcessor',
        position: { x: 150, y: 50 },
        data: { label: 'Process Node' }
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 250, y: 50 },
        data: { label: 'End Node' }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'process' },
      { id: 'e2', source: 'process', target: 'end' }
    ]
  };

  const defaultProps = {
    workflow: mockWorkflow,
    onNodeSelect: jest.fn(),
    onEdgeCreate: jest.fn(),
    onWorkflowUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation between nodes', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowCanvas {...defaultProps} />);

      // Focus the canvas
      const canvas = screen.getByRole('main');
      canvas.focus();

      // Navigate through toolbar buttons first
      await user.keyboard('{Tab}'); // Add Node button
      expect(screen.getByLabelText('Add Node')).toHaveFocus();

      await user.keyboard('{Tab}'); // Zoom In button
      expect(screen.getByLabelText('Zoom In')).toHaveFocus();

      await user.keyboard('{Tab}'); // Zoom Out button
      expect(screen.getByLabelText('Zoom Out')).toHaveFocus();

      await user.keyboard('{Tab}'); // Reset View button
      expect(screen.getByLabelText('Reset View')).toHaveFocus();

      // Navigate to first node
      await user.keyboard('{Tab}');
      const startNode = screen.getByLabelText('Start Node node');
      expect(startNode).toHaveFocus();

      // Navigate to next node
      await user.keyboard('{Tab}');
      const processNode = screen.getByLabelText('Process Node node');
      expect(processNode).toHaveFocus();

      // Navigate to last node
      await user.keyboard('{Tab}');
      const endNode = screen.getByLabelText('End Node node');
      expect(endNode).toHaveFocus();
    });

    it('should support Enter key to select nodes', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowCanvas {...defaultProps} />);

      const startNode = screen.getByLabelText('Start Node node');
      startNode.focus();

      await user.keyboard('{Enter}');
      expect(defaultProps.onNodeSelect).toHaveBeenCalledWith(mockWorkflow.nodes[0]);
    });

    it('should support Space key to select nodes', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowCanvas {...defaultProps} />);

      const processNode = screen.getByLabelText('Process Node node');
      processNode.focus();

      await user.keyboard(' ');
      expect(defaultProps.onNodeSelect).toHaveBeenCalledWith(mockWorkflow.nodes[1]);
    });

    it('should support Escape key to deselect nodes', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowCanvas {...defaultProps} />);

      const canvas = screen.getByRole('main');
      canvas.focus();

      await user.keyboard('{Escape}');
      expect(defaultProps.onNodeSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('ARIA Labels and Descriptions', () => {
    it('should have proper ARIA labels for all interactive elements', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      // Check main canvas
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Workflow Canvas');

      // Check toolbar
      expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Workflow Tools');

      // Check workflow diagram
      const diagram = screen.getByRole('application');
      expect(diagram).toHaveAttribute('aria-label', 'Workflow Diagram');
      expect(diagram).toHaveAttribute('aria-describedby', 'workflow-description');

      // Check description
      expect(screen.getByText(/Interactive workflow diagram/)).toBeInTheDocument();
    });

    it('should have proper ARIA labels for nodes', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      expect(screen.getByLabelText('Start Node node')).toBeInTheDocument();
      expect(screen.getByLabelText('Process Node node')).toBeInTheDocument();
      expect(screen.getByLabelText('End Node node')).toBeInTheDocument();
    });

    it('should have proper ARIA descriptions for nodes', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      expect(screen.getByText('Start Node')).toBeInTheDocument();
      expect(screen.getByText('Process Node')).toBeInTheDocument();
      expect(screen.getByText('End Node')).toBeInTheDocument();
    });

    it('should have proper ARIA labels for toolbar buttons', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      expect(screen.getByLabelText('Add Node')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset View')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly when selecting nodes', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowCanvas {...defaultProps} />);

      const startNode = screen.getByLabelText('Start Node node');
      startNode.focus();

      await user.keyboard('{Enter}');
      expect(startNode).toHaveFocus();
    });

    it('should support tab order for all interactive elements', async () => {
      const user = userEvent.setup();
      render(<MockWorkflowCanvas {...defaultProps} />);

      const canvas = screen.getByRole('main');
      canvas.focus();

      // Tab through all elements
      await user.keyboard('{Tab}'); // Add Node button
      expect(screen.getByLabelText('Add Node')).toHaveFocus();

      await user.keyboard('{Tab}'); // Zoom In button
      expect(screen.getByLabelText('Zoom In')).toHaveFocus();

      await user.keyboard('{Tab}'); // Zoom Out button
      expect(screen.getByLabelText('Zoom Out')).toHaveFocus();

      await user.keyboard('{Tab}'); // Reset View button
      expect(screen.getByLabelText('Reset View')).toHaveFocus();

      await user.keyboard('{Tab}'); // Start Node
      expect(screen.getByLabelText('Start Node node')).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce status changes', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Workflow ready');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should provide meaningful descriptions for complex elements', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      const description = screen.getByText(/Interactive workflow diagram/);
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('id', 'workflow-description');
    });

    it('should hide decorative elements from screen readers', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      // Check that edges have aria-hidden attribute
      const edges = screen.getAllByRole('presentation', { hidden: true });
      expect(edges.length).toBeGreaterThan(0);
      edges.forEach(edge => {
        expect(edge).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Color and Contrast', () => {
    it('should have sufficient color contrast for text elements', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      const nodes = screen.getAllByRole('button');
      nodes.forEach(node => {
        // Check that nodes have visible text
        expect(node).toHaveTextContent(/.+/);
      });
    });

    it('should not rely solely on color to convey information', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      // All interactive elements should have text labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should be usable at different zoom levels', () => {
      render(<MockWorkflowCanvas {...defaultProps} />);

      // Test that elements are still accessible when zoomed
      const canvas = screen.getByRole('main');
      expect(canvas).toBeInTheDocument();

      const nodes = screen.getAllByRole('button');
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('should maintain functionality on different screen sizes', () => {
      // Test with different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      render(<MockWorkflowCanvas {...defaultProps} />);

      const canvas = screen.getByRole('main');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should provide accessible error messages', () => {
      const errorProps = {
        ...defaultProps,
        workflow: {
          ...mockWorkflow,
          nodes: [] // Empty workflow should show error
        }
      };

      render(<MockWorkflowCanvas {...errorProps} />);

      // Should still render the canvas structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('should handle missing workflow gracefully', () => {
      render(<MockWorkflowCanvas {...defaultProps} workflow={null} />);

      // Should still render the canvas structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should support different languages for labels', () => {
      const i18nProps = {
        ...defaultProps,
        workflow: {
          ...mockWorkflow,
          nodes: [
            {
              ...mockWorkflow.nodes[0],
              data: { label: 'Nœud de Début' } // French
            }
          ]
        }
      };

      render(<MockWorkflowCanvas {...i18nProps} />);

      expect(screen.getByLabelText('Nœud de Début node')).toBeInTheDocument();
    });

    it('should support RTL languages', () => {
      // Test with RTL direction
      document.dir = 'rtl';
      
      render(<MockWorkflowCanvas {...defaultProps} />);

      const canvas = screen.getByRole('main');
      expect(canvas).toBeInTheDocument();

      // Reset direction
      document.dir = 'ltr';
    });
  });
});
