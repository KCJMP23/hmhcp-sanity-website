import { WorkflowBuilder } from '../../workflow-builder';
import { WorkflowExecutionEngine } from '../../execution-engine';
import { WorkflowValidationEngine } from '../../validation-engine';
import { WorkflowDefinition } from '../../../types/workflows/visual-builder';

describe('Workflow Builder E2E Tests', () => {
  let workflowBuilder: WorkflowBuilder;
  let executionEngine: WorkflowExecutionEngine;
  let validationEngine: WorkflowValidationEngine;

  beforeEach(() => {
    workflowBuilder = new WorkflowBuilder();
    executionEngine = new WorkflowExecutionEngine();
    validationEngine = new WorkflowValidationEngine();
  });

  describe('Complete Workflow Creation and Execution', () => {
    it('should create, validate, and execute a healthcare data processing workflow', async () => {
      // Step 1: Create a new workflow
      const workflowId = workflowBuilder.createWorkflow(
        'Healthcare Data Processing',
        'A comprehensive workflow for processing healthcare data with AI validation'
      );

      // Step 2: Add nodes to the workflow
      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start Processing' }
      });

      const dataInputNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataInput',
        position: { x: 100, y: 0 },
        data: { 
          label: 'Patient Data Input',
          config: { 
            source: 'database',
            table: 'patients',
            fields: ['id', 'name', 'age', 'diagnosis']
          }
        }
      });

      const validationNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 200, y: 0 },
        data: { 
          label: 'Data Validation',
          operation: 'validate',
          config: { 
            rules: [
              { field: 'id', type: 'required' },
              { field: 'name', type: 'required', minLength: 2 },
              { field: 'age', type: 'number', min: 0, max: 150 },
              { field: 'diagnosis', type: 'required' }
            ]
          }
        }
      });

      const aiAnalysisNodeId = workflowBuilder.addNode(workflowId, {
        type: 'aiAgent',
        position: { x: 300, y: 0 },
        data: { 
          label: 'AI Analysis',
          agentType: 'healthcare-analyzer',
          config: { 
            model: 'gpt-4',
            prompt: 'Analyze patient data for potential health risks',
            temperature: 0.3
          }
        }
      });

      const conditionalNodeId = workflowBuilder.addNode(workflowId, {
        type: 'if',
        position: { x: 400, y: 0 },
        data: { 
          label: 'Risk Assessment',
          condition: 'aiResult.riskLevel === "high"'
        }
      });

      const highRiskNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 500, y: -50 },
        data: { 
          label: 'High Risk Processing',
          operation: 'alert',
          config: { 
            alertType: 'urgent',
            recipients: ['doctor@hospital.com', 'nurse@hospital.com']
          }
        }
      });

      const normalRiskNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 500, y: 50 },
        data: { 
          label: 'Normal Processing',
          operation: 'log',
          config: { 
            level: 'info',
            message: 'Patient data processed normally'
          }
        }
      });

      const mergeNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 600, y: 0 },
        data: { 
          label: 'Merge Results',
          operation: 'merge',
          config: { 
            strategy: 'combine',
            outputFormat: 'json'
          }
        }
      });

      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 700, y: 0 },
        data: { label: 'Complete' }
      });

      // Step 3: Connect nodes with edges
      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: dataInputNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: dataInputNodeId,
        target: validationNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: validationNodeId,
        target: aiAnalysisNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: aiAnalysisNodeId,
        target: conditionalNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: conditionalNodeId,
        target: highRiskNodeId,
        condition: 'true'
      });

      workflowBuilder.addEdge(workflowId, {
        source: conditionalNodeId,
        target: normalRiskNodeId,
        condition: 'false'
      });

      workflowBuilder.addEdge(workflowId, {
        source: highRiskNodeId,
        target: mergeNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: normalRiskNodeId,
        target: mergeNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: mergeNodeId,
        target: endNodeId
      });

      // Step 4: Get the complete workflow definition
      const workflow = workflowBuilder.getWorkflow(workflowId);
      expect(workflow).toBeDefined();
      expect(workflow?.nodes).toHaveLength(9);
      expect(workflow?.edges).toHaveLength(9);

      // Step 5: Validate the workflow
      const validationResult = validationEngine.validateWorkflow(workflow!);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 6: Execute the workflow with test data
      const testData = {
        id: 'P001',
        name: 'John Doe',
        age: 45,
        diagnosis: 'Hypertension'
      };

      const executionResult = executionEngine.executeWorkflow(workflow!, testData);
      expect(executionResult.success).toBe(true);
      expect(executionResult.executionId).toBeDefined();

      // Step 7: Wait for execution to complete and verify results
      await new Promise(resolve => setTimeout(resolve, 200));

      const execution = executionEngine.getExecutionState(executionResult.executionId!);
      expect(execution?.status).toBe('completed');
      expect(execution?.currentNode).toBe(endNodeId);
      expect(execution?.errors).toHaveLength(0);
      expect(execution?.executedNodes).toContain(startNodeId);
      expect(execution?.executedNodes).toContain(dataInputNodeId);
      expect(execution?.executedNodes).toContain(validationNodeId);
      expect(execution?.executedNodes).toContain(aiAnalysisNodeId);
      expect(execution?.executedNodes).toContain(conditionalNodeId);
      expect(execution?.executedNodes).toContain(mergeNodeId);
      expect(execution?.executedNodes).toContain(endNodeId);
    });

    it('should create and execute a complex multi-branch workflow', async () => {
      // Create a workflow with multiple parallel branches
      const workflowId = workflowBuilder.createWorkflow(
        'Multi-Branch Processing',
        'A workflow with parallel processing branches'
      );

      // Add start node
      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      });

      // Add split node
      const splitNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 100, y: 0 },
        data: { 
          label: 'Split Data',
          operation: 'split',
          config: { 
            strategy: 'parallel',
            branches: ['branch1', 'branch2', 'branch3']
          }
        }
      });

      // Add parallel processing nodes
      const branch1NodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 200, y: -100 },
        data: { 
          label: 'Branch 1 Processing',
          operation: 'transform',
          config: { field: 'data', value: 'branch1Transform' }
        }
      });

      const branch2NodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 200, y: 0 },
        data: { 
          label: 'Branch 2 Processing',
          operation: 'transform',
          config: { field: 'data', value: 'branch2Transform' }
        }
      });

      const branch3NodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 200, y: 100 },
        data: { 
          label: 'Branch 3 Processing',
          operation: 'transform',
          config: { field: 'data', value: 'branch3Transform' }
        }
      });

      // Add merge node
      const mergeNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 300, y: 0 },
        data: { 
          label: 'Merge Results',
          operation: 'merge',
          config: { 
            strategy: 'combine',
            waitForAll: true
          }
        }
      });

      // Add end node
      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 400, y: 0 },
        data: { label: 'End' }
      });

      // Connect nodes
      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: splitNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: splitNodeId,
        target: branch1NodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: splitNodeId,
        target: branch2NodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: splitNodeId,
        target: branch3NodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: branch1NodeId,
        target: mergeNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: branch2NodeId,
        target: mergeNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: branch3NodeId,
        target: mergeNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: mergeNodeId,
        target: endNodeId
      });

      // Get and validate workflow
      const workflow = workflowBuilder.getWorkflow(workflowId);
      const validationResult = validationEngine.validateWorkflow(workflow!);
      expect(validationResult.isValid).toBe(true);

      // Execute workflow
      const executionResult = executionEngine.executeWorkflow(workflow!, { 
        data: 'test-data' 
      });
      expect(executionResult.success).toBe(true);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 200));

      const execution = executionEngine.getExecutionState(executionResult.executionId!);
      expect(execution?.status).toBe('completed');
      expect(execution?.executedNodes).toContain(branch1NodeId);
      expect(execution?.executedNodes).toContain(branch2NodeId);
      expect(execution?.executedNodes).toContain(branch3NodeId);
    });

    it('should handle workflow modification and re-execution', async () => {
      // Create initial workflow
      const workflowId = workflowBuilder.createWorkflow(
        'Modifiable Workflow',
        'A workflow that can be modified and re-executed'
      );

      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      });

      const processNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 100, y: 0 },
        data: { 
          label: 'Process Data',
          operation: 'transform',
          config: { field: 'data', value: 'original' }
        }
      });

      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 200, y: 0 },
        data: { label: 'End' }
      });

      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: processNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: processNodeId,
        target: endNodeId
      });

      // Execute initial workflow
      let workflow = workflowBuilder.getWorkflow(workflowId);
      let executionResult = executionEngine.executeWorkflow(workflow!, { data: 'test' });
      expect(executionResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Modify the workflow by updating node configuration
      workflowBuilder.updateNode(workflowId, processNodeId, {
        type: 'dataProcessor',
        position: { x: 100, y: 0 },
        data: { 
          label: 'Updated Process Data',
          operation: 'transform',
          config: { field: 'data', value: 'updated' }
        }
      });

      // Add a new node
      const newProcessNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 150, y: 0 },
        data: { 
          label: 'Additional Processing',
          operation: 'validate',
          config: { rules: ['required'] }
        }
      });

      // Update edges
      workflowBuilder.removeEdge(workflowId, {
        source: processNodeId,
        target: endNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: processNodeId,
        target: newProcessNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: newProcessNodeId,
        target: endNodeId
      });

      // Execute modified workflow
      workflow = workflowBuilder.getWorkflow(workflowId);
      const validationResult = validationEngine.validateWorkflow(workflow!);
      expect(validationResult.isValid).toBe(true);

      executionResult = executionEngine.executeWorkflow(workflow!, { data: 'test' });
      expect(executionResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = executionEngine.getExecutionState(executionResult.executionId!);
      expect(execution?.status).toBe('completed');
      expect(execution?.executedNodes).toContain(newProcessNodeId);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle workflow creation errors gracefully', () => {
      // Test invalid workflow creation
      expect(() => {
        workflowBuilder.createWorkflow('', 'Invalid workflow');
      }).toThrow();

      // Test invalid node addition
      const workflowId = workflowBuilder.createWorkflow('Test Workflow', 'Test');
      
      expect(() => {
        workflowBuilder.addNode(workflowId, {
          type: 'invalidType' as any,
          position: { x: 0, y: 0 },
          data: { label: 'Invalid' }
        });
      }).toThrow();

      // Test invalid edge addition
      expect(() => {
        workflowBuilder.addEdge(workflowId, {
          source: 'non-existent',
          target: 'also-non-existent'
        });
      }).toThrow();
    });

    it('should handle workflow execution errors and provide recovery options', async () => {
      const workflowId = workflowBuilder.createWorkflow(
        'Error Recovery Workflow',
        'A workflow that will encounter errors'
      );

      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      });

      const errorNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 100, y: 0 },
        data: { 
          label: 'Error Node',
          operation: 'invalidOperation',
          config: { field: 'invalid' }
        }
      });

      const recoveryNodeId = workflowBuilder.addNode(workflowId, {
        type: 'dataProcessor',
        position: { x: 200, y: 0 },
        data: { 
          label: 'Recovery Node',
          operation: 'fallback',
          config: { strategy: 'default' }
        }
      });

      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 300, y: 0 },
        data: { label: 'End' }
      });

      // Connect nodes
      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: errorNodeId
      });

      workflowBuilder.addEdge(workflowId, {
        source: errorNodeId,
        target: recoveryNodeId,
        condition: 'error'
      });

      workflowBuilder.addEdge(workflowId, {
        source: recoveryNodeId,
        target: endNodeId
      });

      // Execute workflow
      const workflow = workflowBuilder.getWorkflow(workflowId);
      const executionResult = executionEngine.executeWorkflow(workflow!, { data: 'test' });
      expect(executionResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = executionEngine.getExecutionState(executionResult.executionId!);
      expect(execution?.status).toBe('failed');
      expect(execution?.errors).toHaveLength(1);
      expect(execution?.currentNode).toBe(errorNodeId);
    });
  });
});
