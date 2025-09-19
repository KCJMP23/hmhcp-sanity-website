import { WorkflowExecutionEngine } from '../../execution-engine';
import { WorkflowValidationEngine } from '../../validation-engine';
import { WorkflowBuilder } from '../../workflow-builder';
import { WorkflowDefinition } from '../../../types/workflows/visual-builder';

describe('Large Workflow Performance Tests', () => {
  let executionEngine: WorkflowExecutionEngine;
  let validationEngine: WorkflowValidationEngine;
  let workflowBuilder: WorkflowBuilder;

  beforeEach(() => {
    executionEngine = new WorkflowExecutionEngine();
    validationEngine = new WorkflowValidationEngine();
    workflowBuilder = new WorkflowBuilder();
  });

  describe('Large Workflow Creation', () => {
    it('should create workflows with 1000+ nodes efficiently', () => {
      const startTime = Date.now();
      
      const workflowId = workflowBuilder.createWorkflow(
        'Large Workflow',
        'A workflow with 1000+ nodes for performance testing'
      );

      // Create 1000 nodes
      const nodeIds = [];
      for (let i = 0; i < 1000; i++) {
        const nodeId = workflowBuilder.addNode(workflowId, {
          type: 'dataProcessor',
          position: { x: i * 10, y: 0 },
          data: { 
            label: `Node ${i}`,
            operation: 'transform',
            config: { field: 'data', value: `step${i}` }
          }
        });
        nodeIds.push(nodeId);
      }

      // Add start and end nodes
      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: -10, y: 0 },
        data: { label: 'Start' }
      });

      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 10000, y: 0 },
        data: { label: 'End' }
      });

      // Create linear connections
      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: nodeIds[0]
      });

      for (let i = 0; i < nodeIds.length - 1; i++) {
        workflowBuilder.addEdge(workflowId, {
          source: nodeIds[i],
          target: nodeIds[i + 1]
        });
      }

      workflowBuilder.addEdge(workflowId, {
        source: nodeIds[nodeIds.length - 1],
        target: endNodeId
      });

      const endTime = Date.now();
      const creationTime = endTime - startTime;

      // Should create 1000+ nodes in less than 5 seconds
      expect(creationTime).toBeLessThan(5000);

      const workflow = workflowBuilder.getWorkflow(workflowId);
      expect(workflow?.nodes).toHaveLength(1002); // 1000 + start + end
      expect(workflow?.edges).toHaveLength(1001); // 1000 + start connection
    });

    it('should create workflows with complex branching efficiently', () => {
      const startTime = Date.now();
      
      const workflowId = workflowBuilder.createWorkflow(
        'Complex Branching Workflow',
        'A workflow with complex branching for performance testing'
      );

      // Create a tree structure with 1000 nodes
      const createTree = (parentId: string, depth: number, maxDepth: number): string[] => {
        if (depth >= maxDepth) return [];
        
        const children = [];
        for (let i = 0; i < 3; i++) { // 3 children per node
          const childId = workflowBuilder.addNode(workflowId, {
            type: 'dataProcessor',
            position: { x: depth * 100 + i * 50, y: depth * 50 },
            data: { 
              label: `Node ${depth}-${i}`,
              operation: 'transform',
              config: { field: 'data', value: `step${depth}-${i}` }
            }
          });
          
          workflowBuilder.addEdge(workflowId, {
            source: parentId,
            target: childId
          });
          
          children.push(childId);
          children.push(...createTree(childId, depth + 1, maxDepth));
        }
        
        return children;
      };

      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      });

      createTree(startNodeId, 0, 6); // Creates 3^6 = 729 nodes

      const endTime = Date.now();
      const creationTime = endTime - startTime;

      // Should create complex branching in less than 3 seconds
      expect(creationTime).toBeLessThan(3000);

      const workflow = workflowBuilder.getWorkflow(workflowId);
      expect(workflow?.nodes.length).toBeGreaterThan(700);
    });
  });

  describe('Large Workflow Validation', () => {
    it('should validate large workflows efficiently', () => {
      // Create a large workflow
      const workflowId = workflowBuilder.createWorkflow(
        'Large Validation Workflow',
        'A large workflow for validation performance testing'
      );

      // Create 500 nodes
      const nodeIds = [];
      for (let i = 0; i < 500; i++) {
        const nodeId = workflowBuilder.addNode(workflowId, {
          type: 'dataProcessor',
          position: { x: i * 10, y: 0 },
          data: { 
            label: `Node ${i}`,
            operation: 'transform',
            config: { field: 'data', value: `step${i}` }
          }
        });
        nodeIds.push(nodeId);
      }

      // Add start and end nodes
      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: -10, y: 0 },
        data: { label: 'Start' }
      });

      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 5000, y: 0 },
        data: { label: 'End' }
      });

      // Create connections
      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: nodeIds[0]
      });

      for (let i = 0; i < nodeIds.length - 1; i++) {
        workflowBuilder.addEdge(workflowId, {
          source: nodeIds[i],
          target: nodeIds[i + 1]
        });
      }

      workflowBuilder.addEdge(workflowId, {
        source: nodeIds[nodeIds.length - 1],
        target: endNodeId
      });

      const workflow = workflowBuilder.getWorkflow(workflowId);
      
      const startTime = Date.now();
      const validationResult = validationEngine.validateWorkflow(workflow!);
      const endTime = Date.now();
      
      const validationTime = endTime - startTime;

      // Should validate 500+ nodes in less than 1 second
      expect(validationTime).toBeLessThan(1000);
      expect(validationResult.isValid).toBe(true);
    });

    it('should handle validation errors in large workflows efficiently', () => {
      // Create a large workflow with errors
      const workflowId = workflowBuilder.createWorkflow(
        'Large Error Workflow',
        'A large workflow with errors for validation performance testing'
      );

      // Create 300 nodes with some errors
      const nodeIds = [];
      for (let i = 0; i < 300; i++) {
        const nodeId = workflowBuilder.addNode(workflowId, {
          type: 'dataProcessor',
          position: { x: i * 10, y: 0 },
          data: { 
            label: `Node ${i}`,
            operation: i === 150 ? 'invalidOperation' : 'transform', // Error at node 150
            config: { field: 'data', value: `step${i}` }
          }
        });
        nodeIds.push(nodeId);
      }

      // Add start and end nodes
      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: -10, y: 0 },
        data: { label: 'Start' }
      });

      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 3000, y: 0 },
        data: { label: 'End' }
      });

      // Create connections
      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: nodeIds[0]
      });

      for (let i = 0; i < nodeIds.length - 1; i++) {
        workflowBuilder.addEdge(workflowId, {
          source: nodeIds[i],
          target: nodeIds[i + 1]
        });
      }

      workflowBuilder.addEdge(workflowId, {
        source: nodeIds[nodeIds.length - 1],
        target: endNodeId
      });

      const workflow = workflowBuilder.getWorkflow(workflowId);
      
      const startTime = Date.now();
      const validationResult = validationEngine.validateWorkflow(workflow!);
      const endTime = Date.now();
      
      const validationTime = endTime - startTime;

      // Should validate 300+ nodes with errors in less than 1 second
      expect(validationTime).toBeLessThan(1000);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Large Workflow Execution', () => {
    it('should execute large workflows efficiently', async () => {
      // Create a large workflow
      const workflowId = workflowBuilder.createWorkflow(
        'Large Execution Workflow',
        'A large workflow for execution performance testing'
      );

      // Create 200 nodes
      const nodeIds = [];
      for (let i = 0; i < 200; i++) {
        const nodeId = workflowBuilder.addNode(workflowId, {
          type: 'dataProcessor',
          position: { x: i * 10, y: 0 },
          data: { 
            label: `Node ${i}`,
            operation: 'transform',
            config: { field: 'data', value: `step${i}` }
          }
        });
        nodeIds.push(nodeId);
      }

      // Add start and end nodes
      const startNodeId = workflowBuilder.addNode(workflowId, {
        type: 'start',
        position: { x: -10, y: 0 },
        data: { label: 'Start' }
      });

      const endNodeId = workflowBuilder.addNode(workflowId, {
        type: 'end',
        position: { x: 2000, y: 0 },
        data: { label: 'End' }
      });

      // Create linear connections
      workflowBuilder.addEdge(workflowId, {
        source: startNodeId,
        target: nodeIds[0]
      });

      for (let i = 0; i < nodeIds.length - 1; i++) {
        workflowBuilder.addEdge(workflowId, {
          source: nodeIds[i],
          target: nodeIds[i + 1]
        });
      }

      workflowBuilder.addEdge(workflowId, {
        source: nodeIds[nodeIds.length - 1],
        target: endNodeId
      });

      const workflow = workflowBuilder.getWorkflow(workflowId);
      
      const startTime = Date.now();
      const executionResult = executionEngine.executeWorkflow(workflow!, { data: 'test' });
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;

      // Should start execution of 200+ nodes in less than 500ms
      expect(executionTime).toBeLessThan(500);
      expect(executionResult.success).toBe(true);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 300));

      const execution = executionEngine.getExecutionState(executionResult.executionId!);
      expect(execution?.status).toBe('completed');
    });

    it('should handle concurrent execution of large workflows', async () => {
      // Create multiple large workflows
      const workflows = [];
      for (let w = 0; w < 5; w++) {
        const workflowId = workflowBuilder.createWorkflow(
          `Concurrent Workflow ${w}`,
          `A workflow for concurrent execution testing ${w}`
        );

        // Create 100 nodes per workflow
        const nodeIds = [];
        for (let i = 0; i < 100; i++) {
          const nodeId = workflowBuilder.addNode(workflowId, {
            type: 'dataProcessor',
            position: { x: i * 10, y: w * 100 },
            data: { 
              label: `Node ${w}-${i}`,
              operation: 'transform',
              config: { field: 'data', value: `step${w}-${i}` }
            }
          });
          nodeIds.push(nodeId);
        }

        // Add start and end nodes
        const startNodeId = workflowBuilder.addNode(workflowId, {
          type: 'start',
          position: { x: -10, y: w * 100 },
          data: { label: 'Start' }
        });

        const endNodeId = workflowBuilder.addNode(workflowId, {
          type: 'end',
          position: { x: 1000, y: w * 100 },
          data: { label: 'End' }
        });

        // Create connections
        workflowBuilder.addEdge(workflowId, {
          source: startNodeId,
          target: nodeIds[0]
        });

        for (let i = 0; i < nodeIds.length - 1; i++) {
          workflowBuilder.addEdge(workflowId, {
            source: nodeIds[i],
            target: nodeIds[i + 1]
          });
        }

        workflowBuilder.addEdge(workflowId, {
          source: nodeIds[nodeIds.length - 1],
          target: endNodeId
        });

        workflows.push(workflowBuilder.getWorkflow(workflowId)!);
      }

      const startTime = Date.now();
      
      // Execute all workflows concurrently
      const executionResults = workflows.map(workflow => 
        executionEngine.executeWorkflow(workflow, { data: 'test' })
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should start all executions in less than 1 second
      expect(executionTime).toBeLessThan(1000);
      
      // All should start successfully
      executionResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // All should complete successfully
      executionResults.forEach(result => {
        const execution = executionEngine.getExecutionState(result.executionId!);
        expect(execution?.status).toBe('completed');
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not exceed memory limits with large workflows', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create multiple large workflows
      const workflows = [];
      for (let w = 0; w < 10; w++) {
        const workflowId = workflowBuilder.createWorkflow(
          `Memory Test Workflow ${w}`,
          `A workflow for memory testing ${w}`
        );

        // Create 500 nodes per workflow
        const nodeIds = [];
        for (let i = 0; i < 500; i++) {
          const nodeId = workflowBuilder.addNode(workflowId, {
            type: 'dataProcessor',
            position: { x: i * 10, y: w * 100 },
            data: { 
              label: `Node ${w}-${i}`,
              operation: 'transform',
              config: { field: 'data', value: `step${w}-${i}` }
            }
          });
          nodeIds.push(nodeId);
        }

        workflows.push(workflowBuilder.getWorkflow(workflowId)!);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Scalability Limits', () => {
    it('should handle the maximum recommended workflow size', () => {
      const startTime = Date.now();
      
      const workflowId = workflowBuilder.createWorkflow(
        'Maximum Size Workflow',
        'A workflow at the maximum recommended size'
      );

      // Create 2000 nodes (maximum recommended)
      const nodeIds = [];
      for (let i = 0; i < 2000; i++) {
        const nodeId = workflowBuilder.addNode(workflowId, {
          type: 'dataProcessor',
          position: { x: i * 5, y: 0 },
          data: { 
            label: `Node ${i}`,
            operation: 'transform',
            config: { field: 'data', value: `step${i}` }
          }
        });
        nodeIds.push(nodeId);
      }

      const endTime = Date.now();
      const creationTime = endTime - startTime;

      // Should create 2000 nodes in less than 10 seconds
      expect(creationTime).toBeLessThan(10000);

      const workflow = workflowBuilder.getWorkflow(workflowId);
      expect(workflow?.nodes).toHaveLength(2000);
    });
  });
});
