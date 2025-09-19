import { RealTimeValidator, ValidationContext } from '../real-time-validator';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflows/visual-builder';

describe('RealTimeValidator', () => {
  let validator: RealTimeValidator;

  beforeEach(() => {
    validator = new RealTimeValidator();
  });

  afterEach(() => {
    // Clean up any subscriptions
  });

  describe('Basic Validation', () => {
    it('should validate a simple valid workflow', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'end', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.validationTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should detect missing start node', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('start node');
    });

    it('should detect missing end node', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('end node');
    });

    it('should detect invalid connections', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'nonexistent', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('non-existent target node'))).toBe(true);
    });

    it('should detect self-connections', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'start', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Self-connection'))).toBe(true);
    });

    it('should detect cycles', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'node1',
            type: 'ai-agent',
            position: { x: 0, y: 0 },
            data: { label: 'Node 1', category: 'ai-agents', config: { agentType: 'research' }, status: 'idle' },
          },
          {
            id: 'node2',
            type: 'ai-agent',
            position: { x: 200, y: 0 },
            data: { label: 'Node 2', category: 'ai-agents', config: { agentType: 'research' }, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'node1', target: 'node2', type: 'smoothstep' },
          { id: 'e2', source: 'node2', target: 'node1', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('cycle'))).toBe(true);
    });
  });

  describe('Node Configuration Validation', () => {
    it('should validate AI agent nodes', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
          {
            id: 'ai-agent',
            type: 'ai-agent',
            position: { x: 100, y: 0 },
            data: { 
              label: 'AI Agent', 
              category: 'ai-agents', 
              config: { agentType: 'research' }, // Missing prompt/template
              status: 'idle' 
            },
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'ai-agent', type: 'smoothstep' },
          { id: 'e2', source: 'ai-agent', target: 'end', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('prompt or template'))).toBe(true);
    });

    it('should validate logic nodes', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
          {
            id: 'logic',
            type: 'logic-if-else',
            position: { x: 100, y: 0 },
            data: { 
              label: 'If/Else', 
              category: 'logic', 
              config: { logicType: 'if-else' }, // Missing condition
              status: 'idle' 
            },
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'logic', type: 'smoothstep' },
          { id: 'e2', source: 'logic', target: 'end', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('condition'))).toBe(true);
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze workflow performance', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
          {
            id: 'ai-agent',
            type: 'ai-agent',
            position: { x: 100, y: 0 },
            data: { 
              label: 'AI Agent', 
              category: 'ai-agents', 
              config: { agentType: 'research', prompt: 'Test prompt' },
              status: 'idle' 
            },
          },
          {
            id: 'delay',
            type: 'logic-delay',
            position: { x: 200, y: 0 },
            data: { 
              label: 'Delay', 
              category: 'logic', 
              config: { logicType: 'delay', delayMs: 2000 },
              status: 'idle' 
            },
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 300, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'ai-agent', type: 'smoothstep' },
          { id: 'e2', source: 'ai-agent', target: 'delay', type: 'smoothstep' },
          { id: 'e3', source: 'delay', target: 'end', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.performanceMetrics.estimatedExecutionTimeMs).toBeGreaterThan(0);
      expect(result.performanceMetrics.estimatedCostUnits).toBeGreaterThan(0);
      expect(result.performanceMetrics.optimizationPotential).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Auto-fix Suggestions', () => {
    it('should provide auto-fix suggestions for missing start node', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const suggestions = validator.getAutoFixSuggestions(workflow);
      const startNodeSuggestion = suggestions.find(s => s.id === 'add-start-node');

      expect(startNodeSuggestion).toBeDefined();
      expect(startNodeSuggestion?.message).toContain('start node');
      expect(startNodeSuggestion?.autoFix).toBeDefined();
    });

    it('should provide auto-fix suggestions for missing end node', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const suggestions = validator.getAutoFixSuggestions(workflow);
      const endNodeSuggestion = suggestions.find(s => s.id === 'add-end-node');

      expect(endNodeSuggestion).toBeDefined();
      expect(endNodeSuggestion?.message).toContain('end node');
      expect(endNodeSuggestion?.autoFix).toBeDefined();
    });

    it('should apply auto-fix for missing start node', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const result = validator.applyAutoFix(workflow, 'add-start-node');

      expect(result.success).toBe(true);
      expect(result.updatedWorkflow).toBeDefined();
      expect(result.updatedWorkflow?.nodes).toHaveLength(2);
      expect(result.updatedWorkflow?.nodes.some(n => n.type === 'workflow-start')).toBe(true);
    });

    it('should apply auto-fix for missing end node', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const result = validator.applyAutoFix(workflow, 'add-end-node');

      expect(result.success).toBe(true);
      expect(result.updatedWorkflow).toBeDefined();
      expect(result.updatedWorkflow?.nodes).toHaveLength(2);
      expect(result.updatedWorkflow?.nodes.some(n => n.type === 'workflow-end')).toBe(true);
    });
  });

  describe('Real-time Features', () => {
    it('should provide real-time validation results', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'end', type: 'smoothstep' },
        ],
      };

      const result = await validator.validateWorkflow(workflow);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.validationTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.severity).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(result.severity);
    });

    it('should support validation callbacks', (done) => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const unsubscribe = validator.subscribe((result) => {
        expect(result).toBeDefined();
        expect(result.timestamp).toBeInstanceOf(Date);
        unsubscribe();
        done();
      });

      validator.validateWorkflow(workflow);
    });
  });

  describe('Caching', () => {
    it('should cache validation results', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
        ],
        edges: [],
      };

      const result1 = await validator.validateWorkflow(workflow);
      const result2 = await validator.validateWorkflow(workflow);

      // Should return the same result (cached)
      expect(result1.timestamp.getTime()).toBe(result2.timestamp.getTime());
    });
  });

  describe('Context-aware Validation', () => {
    it('should validate with user preferences', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          {
            id: 'start',
            type: 'workflow-start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', category: 'start', config: {}, status: 'idle' },
          },
          {
            id: 'delay',
            type: 'logic-delay',
            position: { x: 100, y: 0 },
            data: { 
              label: 'Delay', 
              category: 'logic', 
              config: { logicType: 'delay', delayMs: 5000 },
              status: 'idle' 
            },
          },
          {
            id: 'end',
            type: 'workflow-end',
            position: { x: 200, y: 0 },
            data: { label: 'End', category: 'end', config: {}, status: 'idle' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'delay', type: 'smoothstep' },
          { id: 'e2', source: 'delay', target: 'end', type: 'smoothstep' },
        ],
      };

      const context: Partial<ValidationContext> = {
        userPreferences: {
          strictMode: true,
          healthcareCompliance: ['HIPAA'],
          performanceThreshold: 3000,
        },
      };

      const result = await validator.validateWorkflow(workflow, context);

      // Should have warnings about performance threshold and strict mode
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
