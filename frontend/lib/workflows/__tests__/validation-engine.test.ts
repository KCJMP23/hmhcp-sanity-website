import { WorkflowValidationEngine } from '../validation-engine';
import { WorkflowNode, WorkflowEdge } from '@/types/workflows/visual-builder';

describe('WorkflowValidationEngine', () => {
  let validationEngine: WorkflowValidationEngine;

  beforeEach(() => {
    validationEngine = new WorkflowValidationEngine();
  });

  describe('validateWorkflow', () => {
    it('should validate empty workflow', async () => {
      const workflow = { nodes: [], edges: [] };
      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Workflow must contain at least one node');
    });

    it('should validate workflow with start and end nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: 'start-1',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: {
              label: 'Start',
              description: 'Start node',
              category: 'workflow-control',
              config: {},
              status: 'idle',
            },
          },
          {
            id: 'end-1',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: {
              label: 'End',
              description: 'End node',
              category: 'workflow-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start-1',
            target: 'end-1',
            type: 'smoothstep',
          },
        ],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing start node', async () => {
      const workflow = {
        nodes: [
          {
            id: 'end-1',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: {
              label: 'End',
              description: 'End node',
              category: 'workflow-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Workflow must have a start node'))).toBe(true);
    });

    it('should detect missing end node', async () => {
      const workflow = {
        nodes: [
          {
            id: 'start-1',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: {
              label: 'Start',
              description: 'Start node',
              category: 'workflow-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(warning => warning.message.includes('Workflow should have an end node'))).toBe(true);
    });

    it('should detect invalid connections', async () => {
      const workflow = {
        nodes: [
          {
            id: 'start-1',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: {
              label: 'Start',
              description: 'Start node',
              category: 'workflow-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start-1',
            target: 'non-existent',
            type: 'smoothstep',
          },
        ],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Edge references non-existent target node'))).toBe(true);
    });

    it('should detect self-connections', async () => {
      const workflow = {
        nodes: [
          {
            id: 'start-1',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: {
              label: 'Start',
              description: 'Start node',
              category: 'workflow-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start-1',
            target: 'start-1',
            type: 'smoothstep',
          },
        ],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Node cannot connect to itself'))).toBe(true);
    });

    it('should validate AI agent nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: 'ai-1',
            type: 'ai-agent',
            position: { x: 0, y: 0 },
            data: {
              label: 'AI Agent',
              description: 'AI processing',
              category: 'ai-agents',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('AI agent must specify agent type'))).toBe(true);
    });

    it('should validate conditional logic nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: 'conditional-1',
            type: 'logic-conditional',
            position: { x: 0, y: 0 },
            data: {
              label: 'Conditional',
              description: 'Conditional logic',
              category: 'logic-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Conditional node must have a condition'))).toBe(true);
    });

    it('should validate loop nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: 'loop-1',
            type: 'logic-loop',
            position: { x: 0, y: 0 },
            data: {
              label: 'Loop',
              description: 'Loop logic',
              category: 'logic-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Loop node must specify maximum iterations'))).toBe(true);
    });

    it('should validate delay nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: 'delay-1',
            type: 'logic-delay',
            position: { x: 0, y: 0 },
            data: {
              label: 'Delay',
              description: 'Delay logic',
              category: 'logic-control',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Delay node must specify delay duration'))).toBe(true);
    });

    it('should validate data validation nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: 'validate-1',
            type: 'data-validate',
            position: { x: 0, y: 0 },
            data: {
              label: 'Validate',
              description: 'Data validation',
              category: 'data-processing',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Data validation node must have validation rules'))).toBe(true);
    });

    it('should validate data transform nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: 'transform-1',
            type: 'data-transform',
            position: { x: 0, y: 0 },
            data: {
              label: 'Transform',
              description: 'Data transformation',
              category: 'data-processing',
              config: {},
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Data transform node must have transformation logic'))).toBe(true);
    });

    it('should validate healthcare compliance', async () => {
      const workflow = {
        nodes: [
          {
            id: 'ai-1',
            type: 'ai-agent',
            position: { x: 0, y: 0 },
            data: {
              label: 'AI Agent',
              description: 'AI processing',
              category: 'ai-agents',
              config: {
                agentType: 'research',
                healthcareData: true,
              },
              healthcareCompliance: {
                level: 'critical',
                requirements: [],
                validations: [],
                auditTrail: false,
                dataRetention: 0,
              },
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Critical healthcare compliance requires audit trail'))).toBe(true);
    });

    it('should detect workflow cycles', async () => {
      const workflow = {
        nodes: [
          {
            id: 'node-1',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: {
              label: 'Start',
              description: 'Start node',
              category: 'workflow-control',
              config: {},
              status: 'idle',
            },
          },
          {
            id: 'node-2',
            type: 'ai-agent',
            position: { x: 200, y: 0 },
            data: {
              label: 'AI Agent',
              description: 'AI processing',
              category: 'ai-agents',
              config: { agentType: 'research' },
              status: 'idle',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'smoothstep',
          },
          {
            id: 'edge-2',
            source: 'node-2',
            target: 'node-1',
            type: 'smoothstep',
          },
        ],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.message.includes('Workflow contains') && error.message.includes('cycle(s)'))).toBe(true);
    });

    it('should provide performance analysis', async () => {
      const workflow = {
        nodes: [
          {
            id: 'ai-1',
            type: 'ai-agent',
            position: { x: 0, y: 0 },
            data: {
              label: 'AI Agent',
              description: 'AI processing',
              category: 'ai-agents',
              config: { agentType: 'research' },
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.performance).toBeDefined();
      expect(result.performance.estimatedExecutionTime).toBeGreaterThan(0);
      expect(result.performance.memoryUsage).toBeGreaterThan(0);
      expect(result.performance.costEstimate).toBeGreaterThan(0);
    });

    it('should provide compliance analysis', async () => {
      const workflow = {
        nodes: [
          {
            id: 'ai-1',
            type: 'ai-agent',
            position: { x: 0, y: 0 },
            data: {
              label: 'AI Agent',
              description: 'AI processing',
              category: 'ai-agents',
              config: { agentType: 'research' },
              status: 'idle',
            },
          },
        ],
        edges: [],
      };

      const result = await validationEngine.validateWorkflow(workflow);

      expect(result.compliance).toBeDefined();
      expect(typeof result.compliance.hipaaCompliant).toBe('boolean');
      expect(typeof result.compliance.fdaCompliant).toBe('boolean');
      expect(typeof result.compliance.gdprCompliant).toBe('boolean');
    });
  });
});
