// Workflow Validation Service
// Validates workflow definitions and provides error checking

import { WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowValidationError, WorkflowValidationResult } from '@/types/workflows/visual-builder';

export class WorkflowValidator {
  static validate(workflow: WorkflowDefinition): WorkflowValidationResult {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationError[] = [];
    const suggestions: string[] = [];

    // Validate workflow structure
    this.validateWorkflowStructure(workflow, errors, warnings);
    
    // Only validate nodes, edges, and connectivity if definition exists
    if (workflow.definition) {
      // Validate nodes
      this.validateNodes(workflow.definition.nodes, workflow.definition.edges, errors, warnings);
      
      // Validate edges
      this.validateEdges(workflow.definition.edges, workflow.definition.nodes, errors, warnings);
      
      // Validate workflow connectivity
      this.validateConnectivity(workflow.definition.nodes, workflow.definition.edges, errors, warnings);
    }
    
    // Generate suggestions
    this.generateSuggestions(workflow, suggestions);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private static validateWorkflowStructure(
    workflow: WorkflowDefinition, 
    errors: WorkflowValidationError[], 
    warnings: WorkflowValidationError[]
  ): void {
    if (!workflow.name || workflow.name.trim().length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow name is required'
      });
    }

    if (!workflow.definition) {
      errors.push({
        type: 'error',
        message: 'Workflow definition is required'
      });
    }

    if (!workflow.definition?.nodes || workflow.definition.nodes.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'Workflow has no nodes'
      });
    }

    if (!workflow.definition?.edges || workflow.definition.edges.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'Workflow has no connections between nodes'
      });
    }
  }

  private static validateNodes(
    nodes: WorkflowNode[], 
    edges: WorkflowEdge[],
    errors: WorkflowValidationError[], 
    warnings: WorkflowValidationError[]
  ): void {
    const nodeIds = new Set<string>();

    nodes.forEach((node, index) => {
      // Check for duplicate node IDs
      if (nodeIds.has(node.id)) {
        errors.push({
          nodeId: node.id,
          type: 'error',
          message: `Duplicate node ID: ${node.id}`
        });
      }
      nodeIds.add(node.id);

      // Validate node ID format
      if (!node.id || node.id.trim().length === 0) {
        errors.push({
          nodeId: node.id,
          type: 'error',
          message: 'Node ID is required'
        });
      }

      // Validate node type
      const validNodeTypes = [
        'schedule-trigger', 'webhook-trigger', 'event-trigger', 'manual-trigger',
        'research-agent', 'content-agent', 'seo-agent', 'image-agent', 'publishing-agent', 'qa-agent',
        'condition', 'loop', 'parallel', 'merge', 'switch',
        'database-action', 'api-call', 'notification', 'file-action', 'email', 'slack',
        'map-transform', 'filter-transform', 'reduce-transform', 'format-transform', 'split-transform', 'join-transform'
      ];

      if (!validNodeTypes.includes(node.type)) {
        errors.push({
          nodeId: node.id,
          type: 'error',
          message: `Invalid node type: ${node.type}`
        });
      }

      // Validate node position
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push({
          nodeId: node.id,
          type: 'error',
          message: 'Node position is required and must have x, y coordinates'
        });
      }

      // Validate node data
      if (!node.data) {
        errors.push({
          nodeId: node.id,
          type: 'error',
          message: 'Node data is required'
        });
      }

      // Check for orphaned nodes (nodes with no connections)
      const hasConnections = edges.some(edge => 
        edge.source === node.id || edge.target === node.id
      );
      
      if (!hasConnections && nodes.length > 1) {
        warnings.push({
          nodeId: node.id,
          type: 'warning',
          message: 'Node has no connections'
        });
      }
    });
  }

  private static validateEdges(
    edges: WorkflowEdge[], 
    nodes: WorkflowNode[], 
    errors: WorkflowValidationError[], 
    warnings: WorkflowValidationError[]
  ): void {
    const nodeIds = new Set(nodes.map(node => node.id));
    const edgeIds = new Set<string>();

    edges.forEach((edge, index) => {
      // Check for duplicate edge IDs
      if (edgeIds.has(edge.id)) {
        errors.push({
          edgeId: edge.id,
          type: 'error',
          message: `Duplicate edge ID: ${edge.id}`
        });
      }
      edgeIds.add(edge.id);

      // Validate edge source and target
      if (!nodeIds.has(edge.source)) {
        errors.push({
          edgeId: edge.id,
          type: 'error',
          message: `Edge source node not found: ${edge.source}`
        });
      }

      if (!nodeIds.has(edge.target)) {
        errors.push({
          edgeId: edge.id,
          type: 'error',
          message: `Edge target node not found: ${edge.target}`
        });
      }

      // Check for self-loops
      if (edge.source === edge.target) {
        warnings.push({
          edgeId: edge.id,
          type: 'warning',
          message: 'Edge connects node to itself'
        });
      }

      // Check for duplicate edges
      const duplicateEdge = edges.find((otherEdge, otherIndex) => 
        otherIndex !== index && 
        otherEdge.source === edge.source && 
        otherEdge.target === edge.target
      );

      if (duplicateEdge) {
        warnings.push({
          edgeId: edge.id,
          type: 'warning',
          message: 'Duplicate edge between same nodes'
        });
      }
    });
  }

  private static validateConnectivity(
    nodes: WorkflowNode[], 
    edges: WorkflowEdge[], 
    errors: WorkflowValidationError[], 
    warnings: WorkflowValidationError[]
  ): void {
    if (nodes.length === 0) return;

    // Check for trigger nodes
    const triggerNodes = nodes.filter(node => node.type.includes('trigger'));
    if (triggerNodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow must have at least one trigger node'
      });
    }

    // Check for multiple trigger nodes
    if (triggerNodes.length > 1) {
      warnings.push({
        type: 'warning',
        message: 'Workflow has multiple trigger nodes - only one will be active'
      });
    }

    // Check for unreachable nodes
    const reachableNodes = new Set<string>();
    const visited = new Set<string>();

    // Start from trigger nodes
    triggerNodes.forEach(triggerNode => {
      this.dfs(triggerNode.id, edges, reachableNodes, visited);
    });

    nodes.forEach(node => {
      if (!reachableNodes.has(node.id) && !node.type.includes('trigger')) {
        warnings.push({
          nodeId: node.id,
          type: 'warning',
          message: 'Node is not reachable from any trigger'
        });
      }
    });

    // Check for cycles
    const hasCycle = this.detectCycle(nodes, edges);
    if (hasCycle) {
      warnings.push({
        type: 'warning',
        message: 'Workflow contains cycles - ensure this is intentional'
      });
    }
  }

  private static dfs(
    nodeId: string, 
    edges: WorkflowEdge[], 
    reachableNodes: Set<string>, 
    visited: Set<string>
  ): void {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    reachableNodes.add(nodeId);

    // Find outgoing edges
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    outgoingEdges.forEach(edge => {
      this.dfs(edge.target, edges, reachableNodes, visited);
    });
  }

  private static detectCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycleDFS(edge.target)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) return true;
      }
    }

    return false;
  }

  private static generateSuggestions(workflow: WorkflowDefinition, suggestions: string[]): void {
    // Only generate suggestions if definition exists
    if (!workflow.definition) {
      return;
    }
    
    // Suggest adding error handling
    const hasErrorHandling = workflow.definition.nodes.some(node => 
      node.type === 'condition' && node.data.parameters?.condition?.includes('error')
    );

    if (!hasErrorHandling) {
      suggestions.push('Consider adding error handling nodes for robust workflows');
    }

    // Suggest adding logging
    const hasLogging = workflow.definition.nodes.some(node => 
      node.type === 'notification' || node.type === 'slack'
    );

    if (!hasLogging) {
      suggestions.push('Consider adding logging or notification nodes for monitoring');
    }

    // Suggest optimizing parallel execution
    const sequentialNodes = this.findSequentialNodes(workflow.definition.nodes, workflow.definition.edges);
    if (sequentialNodes.length > 3) {
      suggestions.push('Consider using parallel execution for independent nodes to improve performance');
    }

    // Suggest adding validation
    const hasValidation = workflow.definition.nodes.some(node => 
      node.type === 'condition' || node.type === 'filter-transform'
    );

    if (!hasValidation) {
      suggestions.push('Consider adding data validation nodes to ensure data quality');
    }
  }

  private static findSequentialNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    // Simple heuristic to find nodes that could potentially run in parallel
    const sequentialNodes: WorkflowNode[] = [];
    const nodeConnections = new Map<string, number>();

    nodes.forEach(node => {
      const incomingEdges = edges.filter(edge => edge.target === node.id);
      const outgoingEdges = edges.filter(edge => edge.source === node.id);
      
      nodeConnections.set(node.id, incomingEdges.length + outgoingEdges.length);
    });

    // Find nodes with only one connection (likely sequential)
    nodeConnections.forEach((count, nodeId) => {
      if (count <= 1) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) sequentialNodes.push(node);
      }
    });

    return sequentialNodes;
  }
}
