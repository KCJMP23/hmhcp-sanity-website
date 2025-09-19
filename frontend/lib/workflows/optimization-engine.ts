/**
 * Workflow Optimization Engine
 * Microsoft Power Automate-inspired optimization with healthcare compliance
 */

import {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
  WorkflowValidationResult,
} from '@/types/workflows/visual-builder';

export class WorkflowOptimizationEngine {
  private readonly MAX_PARALLEL_NODES = 10;
  private readonly OPTIMIZATION_THRESHOLD = 0.8; // 80% efficiency threshold

  async optimizeWorkflow(workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }): Promise<{
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    optimizations: WorkflowOptimization[];
  }> {
    const optimizations: WorkflowOptimization[] = [];
    let optimizedNodes = [...workflow.nodes];
    let optimizedEdges = [...workflow.edges];

    // 1. Remove redundant nodes
    const redundancyResult = this.removeRedundantNodes(optimizedNodes, optimizedEdges);
    optimizedNodes = redundancyResult.nodes;
    optimizedEdges = redundancyResult.edges;
    optimizations.push(...redundancyResult.optimizations);

    // 2. Optimize node order
    const orderingResult = this.optimizeNodeOrder(optimizedNodes, optimizedEdges);
    optimizedNodes = orderingResult.nodes;
    optimizedEdges = orderingResult.edges;
    optimizations.push(...orderingResult.optimizations);

    // 3. Enable parallel execution
    const parallelResult = this.enableParallelExecution(optimizedNodes, optimizedEdges);
    optimizedNodes = parallelResult.nodes;
    optimizedEdges = parallelResult.edges;
    optimizations.push(...parallelResult.optimizations);

    // 4. Optimize data flow
    const dataFlowResult = this.optimizeDataFlow(optimizedNodes, optimizedEdges);
    optimizedNodes = dataFlowResult.nodes;
    optimizedEdges = dataFlowResult.edges;
    optimizations.push(...dataFlowResult.optimizations);

    // 5. Optimize for healthcare compliance
    const complianceResult = this.optimizeForCompliance(optimizedNodes, optimizedEdges);
    optimizedNodes = complianceResult.nodes;
    optimizedEdges = complianceResult.edges;
    optimizations.push(...complianceResult.optimizations);

    return {
      nodes: optimizedNodes,
      edges: optimizedEdges,
      optimizations,
    };
  }

  private removeRedundantNodes(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    optimizations: WorkflowOptimization[];
  } {
    const optimizations: WorkflowOptimization[] = [];
    const optimizedNodes = [...nodes];
    const optimizedEdges = [...edges];

    // Find duplicate nodes with same configuration
    const nodeGroups = new Map<string, WorkflowNode[]>();
    
    optimizedNodes.forEach(node => {
      const key = this.getNodeConfigurationKey(node);
      if (!nodeGroups.has(key)) {
        nodeGroups.set(key, []);
      }
      nodeGroups.get(key)!.push(node);
    });

    // Merge duplicate nodes
    nodeGroups.forEach((duplicateNodes, key) => {
      if (duplicateNodes.length > 1) {
        const primaryNode = duplicateNodes[0];
        const redundantNodes = duplicateNodes.slice(1);

        // Update edges to point to primary node
        redundantNodes.forEach(redundantNode => {
          optimizedEdges.forEach(edge => {
            if (edge.source === redundantNode.id) {
              edge.source = primaryNode.id;
            }
            if (edge.target === redundantNode.id) {
              edge.target = primaryNode.id;
            }
          });
        });

        // Remove redundant nodes
        redundantNodes.forEach(node => {
          const index = optimizedNodes.findIndex(n => n.id === node.id);
          if (index !== -1) {
            optimizedNodes.splice(index, 1);
          }
        });

        // Remove self-referencing edges
        optimizedEdges.forEach((edge, index) => {
          if (edge.source === edge.target) {
            optimizedEdges.splice(index, 1);
          }
        });

        optimizations.push({
          type: 'redundancy-removal',
          description: `Merged ${duplicateNodes.length} duplicate nodes`,
          impact: 'performance',
          nodesAffected: redundantNodes.map(n => n.id),
        });
      }
    });

    return { nodes: optimizedNodes, edges: optimizedEdges, optimizations };
  }

  private optimizeNodeOrder(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    optimizations: WorkflowOptimization[];
  } {
    const optimizations: WorkflowOptimization[] = [];
    const optimizedNodes = [...nodes];
    const optimizedEdges = [...edges];

    // Topological sort to optimize execution order
    const sortedNodes = this.topologicalSort(optimizedNodes, optimizedEdges);
    
    if (sortedNodes.length === optimizedNodes.length) {
      // Update node positions based on execution order
      sortedNodes.forEach((node, index) => {
        const nodeIndex = optimizedNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          optimizedNodes[nodeIndex].position = {
            x: index * 200,
            y: 0,
          };
        }
      });

      optimizations.push({
        type: 'execution-order',
        description: 'Optimized node execution order',
        impact: 'performance',
        nodesAffected: sortedNodes.map(n => n.id),
      });
    }

    return { nodes: optimizedNodes, edges: optimizedEdges, optimizations };
  }

  private enableParallelExecution(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    optimizations: WorkflowOptimization[];
  } {
    const optimizations: WorkflowOptimization[] = [];
    const optimizedNodes = [...nodes];
    const optimizedEdges = [...edges];

    // Find independent nodes that can run in parallel
    const independentGroups = this.findIndependentNodeGroups(optimizedNodes, optimizedEdges);
    
    independentGroups.forEach((group, index) => {
      if (group.length > 1) {
        // Add parallel execution markers
        group.forEach(node => {
          const nodeIndex = optimizedNodes.findIndex(n => n.id === node.id);
          if (nodeIndex !== -1) {
            optimizedNodes[nodeIndex].data = {
              ...optimizedNodes[nodeIndex].data,
              parallelGroup: index,
              canExecuteInParallel: true,
            };
          }
        });

        optimizations.push({
          type: 'parallel-execution',
          description: `Enabled parallel execution for ${group.length} nodes`,
          impact: 'performance',
          nodesAffected: group.map(n => n.id),
        });
      }
    });

    return { nodes: optimizedNodes, edges: optimizedEdges, optimizations };
  }

  private optimizeDataFlow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    optimizations: WorkflowOptimization[];
  } {
    const optimizations: WorkflowOptimization[] = [];
    const optimizedNodes = [...nodes];
    const optimizedEdges = [...edges];

    // Optimize data transformation chains
    const transformationChains = this.findTransformationChains(optimizedNodes, optimizedEdges);
    
    transformationChains.forEach(chain => {
      if (chain.length > 2) {
        // Merge consecutive transformations
        const mergedNode = this.mergeTransformationChain(chain);
        const chainIds = chain.map(n => n.id);
        
        // Replace chain with merged node
        const mergedNodeIndex = optimizedNodes.findIndex(n => n.id === chain[0].id);
        if (mergedNodeIndex !== -1) {
          optimizedNodes[mergedNodeIndex] = mergedNode;
          
          // Remove other nodes in chain
          chain.slice(1).forEach(node => {
            const index = optimizedNodes.findIndex(n => n.id === node.id);
            if (index !== -1) {
              optimizedNodes.splice(index, 1);
            }
          });
        }

        optimizations.push({
          type: 'data-flow-optimization',
          description: `Merged ${chain.length} consecutive transformations`,
          impact: 'performance',
          nodesAffected: chainIds,
        });
      }
    });

    return { nodes: optimizedNodes, edges: optimizedEdges, optimizations };
  }

  private optimizeForCompliance(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    optimizations: WorkflowOptimization[];
  } {
    const optimizations: WorkflowOptimization[] = [];
    const optimizedNodes = [...nodes];
    const optimizedEdges = [...edges];

    // Add compliance validation nodes where needed
    const healthcareNodes = optimizedNodes.filter(node => 
      node.data.healthcareCompliance?.level
    );

    healthcareNodes.forEach(node => {
      const nodeIndex = optimizedNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        const compliance = node.data.healthcareCompliance;
        
        // Add audit trail if missing
        if (compliance.level === 'critical' && !compliance.auditTrail) {
          optimizedNodes[nodeIndex].data.healthcareCompliance.auditTrail = true;
          
          optimizations.push({
            type: 'compliance-enhancement',
            description: 'Added audit trail for critical healthcare compliance',
            impact: 'compliance',
            nodesAffected: [node.id],
          });
        }

        // Add data validation if missing
        if (compliance.level !== 'basic' && !this.hasDataValidation(node, optimizedEdges)) {
          const validationNode = this.createDataValidationNode(node);
          optimizedNodes.push(validationNode);
          
          // Add edge from node to validation
          optimizedEdges.push({
            id: `validation-${node.id}`,
            source: node.id,
            target: validationNode.id,
            type: 'smoothstep',
          });

          optimizations.push({
            type: 'compliance-enhancement',
            description: 'Added data validation for healthcare compliance',
            impact: 'compliance',
            nodesAffected: [node.id, validationNode.id],
          });
        }
      }
    });

    return { nodes: optimizedNodes, edges: optimizedEdges, optimizations };
  }

  private getNodeConfigurationKey(node: WorkflowNode): string {
    // Create a key based on node type and configuration
    const config = JSON.stringify(node.data.config || {});
    return `${node.type}-${config}`;
  }

  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();
    const sorted: WorkflowNode[] = [];

    // Initialize in-degree and adjacency list
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    });

    edges.forEach(edge => {
      const currentInDegree = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, currentInDegree + 1);
      
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    // Find nodes with no incoming edges
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    // Process nodes
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        sorted.push(node);
      }

      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        const currentInDegree = inDegree.get(neighborId) || 0;
        inDegree.set(neighborId, currentInDegree - 1);
        
        if (inDegree.get(neighborId) === 0) {
          queue.push(neighborId);
        }
      });
    }

    return sorted;
  }

  private findIndependentNodeGroups(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): WorkflowNode[][] {
    const groups: WorkflowNode[][] = [];
    const visited = new Set<string>();

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const group = this.getIndependentNodes(node, nodes, edges, visited);
        if (group.length > 1) {
          groups.push(group);
        }
      }
    });

    return groups;
  }

  private getIndependentNodes(
    startNode: WorkflowNode,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    visited: Set<string>
  ): WorkflowNode[] {
    const group: WorkflowNode[] = [startNode];
    visited.add(startNode.id);

    // Find nodes that can run in parallel with this node
    const outgoingEdges = edges.filter(e => e.source === startNode.id);
    const targetNodes = outgoingEdges.map(e => e.target);

    targetNodes.forEach(targetId => {
      if (!visited.has(targetId)) {
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) {
          group.push(targetNode);
          visited.add(targetId);
        }
      }
    });

    return group;
  }

  private findTransformationChains(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): WorkflowNode[][] {
    const chains: WorkflowNode[][] = [];
    const visited = new Set<string>();

    nodes.forEach(node => {
      if (node.type.startsWith('data-') && !visited.has(node.id)) {
        const chain = this.getTransformationChain(node, nodes, edges, visited);
        if (chain.length > 1) {
          chains.push(chain);
        }
      }
    });

    return chains;
  }

  private getTransformationChain(
    startNode: WorkflowNode,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    visited: Set<string>
  ): WorkflowNode[] {
    const chain: WorkflowNode[] = [startNode];
    visited.add(startNode.id);

    // Follow outgoing edges to find consecutive transformations
    const outgoingEdges = edges.filter(e => e.source === startNode.id);
    
    for (const edge of outgoingEdges) {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (targetNode && targetNode.type.startsWith('data-') && !visited.has(targetNode.id)) {
        const subChain = this.getTransformationChain(targetNode, nodes, edges, visited);
        chain.push(...subChain);
      }
    }

    return chain;
  }

  private mergeTransformationChain(chain: WorkflowNode[]): WorkflowNode {
    const firstNode = chain[0];
    const mergedConfig = { ...firstNode.data.config };

    // Merge configurations from all nodes in chain
    chain.slice(1).forEach(node => {
      Object.assign(mergedConfig, node.data.config);
    });

    return {
      ...firstNode,
      data: {
        ...firstNode.data,
        config: mergedConfig,
        label: `Merged ${chain.length} Transformations`,
        description: `Combined transformations: ${chain.map(n => n.data.label).join(' → ')}`,
      },
    };
  }

  private hasDataValidation(node: WorkflowNode, edges: WorkflowEdge[]): boolean {
    const outgoingEdges = edges.filter(e => e.source === node.id);
    return outgoingEdges.some(edge => {
      // Check if target node is a validation node
      // This would need to be implemented based on your node structure
      return false;
    });
  }

  private createDataValidationNode(sourceNode: WorkflowNode): WorkflowNode {
    return {
      id: `validation-${sourceNode.id}-${Date.now()}`,
      type: 'data-validate',
      position: {
        x: sourceNode.position.x + 200,
        y: sourceNode.position.y,
      },
      data: {
        label: 'Healthcare Data Validation',
        description: 'Validates data for healthcare compliance',
        category: 'data-processing',
        config: {
          validationRules: ['hipaa', 'fda', 'gdpr'],
          strictMode: true,
        },
        healthcareCompliance: {
          level: 'critical',
          requirements: ['data-encryption', 'access-control', 'audit-trail'],
          validations: [
            { type: 'hipaa', required: true, validated: false },
            { type: 'fda', required: true, validated: false },
            { type: 'gdpr', required: true, validated: false },
          ],
          auditTrail: true,
          dataRetention: 2555, // 7 years
        },
        inputs: [
          {
            id: 'input-1',
            label: 'Data Input',
            type: 'input',
            dataType: 'healthcare-data',
            required: true,
          },
        ],
        outputs: [
          {
            id: 'output-1',
            label: 'Validated Data',
            type: 'output',
            dataType: 'healthcare-data',
            required: true,
          },
        ],
        status: 'idle',
      },
    };
  }
}

interface WorkflowOptimization {
  type: 'redundancy-removal' | 'execution-order' | 'parallel-execution' | 'data-flow-optimization' | 'compliance-enhancement';
  description: string;
  impact: 'performance' | 'compliance' | 'maintainability';
  nodesAffected: string[];
}
