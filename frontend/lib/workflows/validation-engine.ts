/**
 * Workflow Validation Engine
 * Microsoft Power Automate-inspired validation with healthcare compliance
 */

import {
  WorkflowNode,
  WorkflowEdge,
  WorkflowValidationResult,
  WorkflowValidationError,
  WorkflowValidationWarning,
  WorkflowValidationSuggestion,
  WorkflowPerformanceAnalysis,
  WorkflowComplianceAnalysis,
  WorkflowNodeType,
  WorkflowDataType,
} from '@/types/workflows/visual-builder';

export class WorkflowValidationEngine {
  private readonly MAX_NODES = 100;
  private readonly MAX_EDGES = 200;
  private readonly MAX_EXECUTION_TIME = 300000; // 5 minutes
  private readonly MAX_MEMORY_USAGE = 1024; // 1GB

  async validateWorkflow(workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }): Promise<WorkflowValidationResult> {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];
    const suggestions: WorkflowValidationSuggestion[] = [];

    // Basic structure validation
    this.validateBasicStructure(workflow, errors, warnings);
    
    // Connection validation
    this.validateConnections(workflow, errors, warnings);
    
    // Node configuration validation
    this.validateNodeConfigurations(workflow, errors, warnings);
    
    // Healthcare compliance validation
    this.validateHealthcareCompliance(workflow, errors, warnings);
    
    // Performance validation
    const performance = this.analyzePerformance(workflow, warnings, suggestions);
    
    // Compliance analysis
    const compliance = this.analyzeCompliance(workflow, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      performance,
      compliance,
    };
  }

  private validateBasicStructure(
    workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    // Check for empty workflow
    if (workflow.nodes.length === 0) {
      errors.push({
        id: 'empty-workflow',
        type: 'configuration',
        severity: 'error',
        message: 'Workflow must contain at least one node',
      });
      return;
    }

    // Check node limits
    if (workflow.nodes.length > this.MAX_NODES) {
      errors.push({
        id: 'too-many-nodes',
        type: 'performance',
        severity: 'error',
        message: `Workflow contains ${workflow.nodes.length} nodes, maximum allowed is ${this.MAX_NODES}`,
      });
    }

    // Check edge limits
    if (workflow.edges.length > this.MAX_EDGES) {
      errors.push({
        id: 'too-many-edges',
        type: 'performance',
        severity: 'error',
        message: `Workflow contains ${workflow.edges.length} edges, maximum allowed is ${this.MAX_EDGES}`,
      });
    }

    // Check for start and end nodes
    const hasStartNode = workflow.nodes.some(node => node.type === 'workflow-start');
    const hasEndNode = workflow.nodes.some(node => node.type === 'workflow-end');

    if (!hasStartNode) {
      errors.push({
        id: 'no-start-node',
        type: 'configuration',
        severity: 'error',
        message: 'Workflow must have a start node',
      });
    }

    if (!hasEndNode) {
      warnings.push({
        id: 'no-end-node',
        type: 'best-practice',
        message: 'Workflow should have an end node for clarity',
      });
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    workflow.edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const orphanedNodes = workflow.nodes.filter(
      node => !connectedNodeIds.has(node.id) && node.type !== 'workflow-start'
    );

    if (orphanedNodes.length > 0) {
      warnings.push({
        id: 'orphaned-nodes',
        type: 'best-practice',
        message: `Found ${orphanedNodes.length} orphaned nodes that are not connected to the workflow`,
        nodeId: orphanedNodes[0].id,
      });
    }
  }

  private validateConnections(
    workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    const nodeIds = new Set(workflow.nodes.map(node => node.id));

    workflow.edges.forEach(edge => {
      // Check if source and target nodes exist
      if (!nodeIds.has(edge.source)) {
        errors.push({
          id: `invalid-source-${edge.id}`,
          type: 'connection',
          severity: 'error',
          message: `Edge references non-existent source node: ${edge.source}`,
          edgeId: edge.id,
        });
      }

      if (!nodeIds.has(edge.target)) {
        errors.push({
          id: `invalid-target-${edge.id}`,
          type: 'connection',
          severity: 'error',
          message: `Edge references non-existent target node: ${edge.target}`,
          edgeId: edge.id,
        });
      }

      // Check for self-connections
      if (edge.source === edge.target) {
        errors.push({
          id: `self-connection-${edge.id}`,
          type: 'connection',
          severity: 'error',
          message: 'Node cannot connect to itself',
          edgeId: edge.id,
        });
      }

      // Check for duplicate connections
      const duplicateEdge = workflow.edges.find(
        otherEdge => 
          otherEdge.id !== edge.id &&
          otherEdge.source === edge.source &&
          otherEdge.target === edge.target
      );

      if (duplicateEdge) {
        warnings.push({
          id: `duplicate-connection-${edge.id}`,
          type: 'best-practice',
          message: 'Duplicate connection detected',
          edgeId: edge.id,
        });
      }
    });

    // Check for cycles
    const cycles = this.detectCycles(workflow);
    if (cycles.length > 0) {
      errors.push({
        id: 'workflow-cycles',
        type: 'connection',
        severity: 'error',
        message: `Workflow contains ${cycles.length} cycle(s) which can cause infinite loops`,
        fix: {
          type: 'manual',
          description: 'Remove or modify connections to eliminate cycles',
        },
      });
    }
  }

  private validateNodeConfigurations(
    workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    workflow.nodes.forEach(node => {
      // Validate node data
      if (!node.data || !node.data.label) {
        errors.push({
          id: `invalid-node-data-${node.id}`,
          type: 'configuration',
          severity: 'error',
          message: 'Node must have valid data and label',
          nodeId: node.id,
        });
      }

      // Validate AI agent nodes
      if (node.type === 'ai-agent') {
        this.validateAIAgentNode(node, errors, warnings);
      }

      // Validate logic nodes
      if (node.type.startsWith('logic-')) {
        this.validateLogicNode(node, errors, warnings);
      }

      // Validate data processing nodes
      if (node.type.startsWith('data-')) {
        this.validateDataProcessingNode(node, errors, warnings);
      }

      // Validate workflow control nodes
      if (node.type.startsWith('workflow-')) {
        this.validateWorkflowControlNode(node, errors, warnings);
      }
    });
  }

  private validateAIAgentNode(
    node: WorkflowNode,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    const config = node.data.config;
    
    if (!config.agentType) {
      errors.push({
        id: `ai-agent-type-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: 'AI agent must specify agent type',
        nodeId: node.id,
      });
    }

    if (!config.prompt && !config.template) {
      errors.push({
        id: `ai-agent-prompt-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: 'AI agent must have either a prompt or template',
        nodeId: node.id,
      });
    }

    // Validate healthcare compliance
    if (config.healthcareData && !config.complianceLevel) {
      warnings.push({
        id: `ai-agent-compliance-${node.id}`,
        type: 'compliance',
        message: 'AI agent processing healthcare data should specify compliance level',
        nodeId: node.id,
      });
    }
  }

  private validateLogicNode(
    node: WorkflowNode,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    const config = node.data.config;

    if (node.type === 'logic-conditional') {
      if (!config.condition) {
        errors.push({
          id: `conditional-condition-${node.id}`,
          type: 'configuration',
          severity: 'error',
          message: 'Conditional node must have a condition',
          nodeId: node.id,
        });
      }
    }

    if (node.type === 'logic-loop') {
      if (!config.maxIterations || config.maxIterations <= 0) {
        errors.push({
          id: `loop-iterations-${node.id}`,
          type: 'configuration',
          severity: 'error',
          message: 'Loop node must specify maximum iterations',
          nodeId: node.id,
        });
      }

      if (config.maxIterations > 1000) {
        warnings.push({
          id: `loop-iterations-high-${node.id}`,
          type: 'performance',
          message: 'High iteration count may impact performance',
          nodeId: node.id,
        });
      }
    }

    if (node.type === 'logic-delay') {
      if (!config.delay || config.delay <= 0) {
        errors.push({
          id: `delay-duration-${node.id}`,
          type: 'configuration',
          severity: 'error',
          message: 'Delay node must specify delay duration',
          nodeId: node.id,
        });
      }

      if (config.delay > 300000) { // 5 minutes
        warnings.push({
          id: `delay-duration-long-${node.id}`,
          type: 'performance',
          message: 'Long delays may impact workflow performance',
          nodeId: node.id,
        });
      }
    }
  }

  private validateDataProcessingNode(
    node: WorkflowNode,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    const config = node.data.config;

    if (node.type === 'data-validate') {
      if (!config.validationRules || config.validationRules.length === 0) {
        errors.push({
          id: `validation-rules-${node.id}`,
          type: 'configuration',
          severity: 'error',
          message: 'Data validation node must have validation rules',
          nodeId: node.id,
        });
      }
    }

    if (node.type === 'data-transform') {
      if (!config.transformation) {
        errors.push({
          id: `transformation-${node.id}`,
          type: 'configuration',
          severity: 'error',
          message: 'Data transform node must have transformation logic',
          nodeId: node.id,
        });
      }
    }
  }

  private validateWorkflowControlNode(
    node: WorkflowNode,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    // Start nodes should not have incoming edges
    if (node.type === 'workflow-start') {
      const incomingEdges = this.getIncomingEdges(node.id, this.getAllEdges());
      if (incomingEdges.length > 0) {
        errors.push({
          id: `start-node-incoming-${node.id}`,
          type: 'connection',
          severity: 'error',
          message: 'Start node cannot have incoming edges',
          nodeId: node.id,
        });
      }
    }

    // End nodes should not have outgoing edges
    if (node.type === 'workflow-end') {
      const outgoingEdges = this.getOutgoingEdges(node.id, this.getAllEdges());
      if (outgoingEdges.length > 0) {
        errors.push({
          id: `end-node-outgoing-${node.id}`,
          type: 'connection',
          severity: 'error',
          message: 'End node cannot have outgoing edges',
          nodeId: node.id,
        });
      }
    }
  }

  private validateHealthcareCompliance(
    workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    const healthcareNodes = workflow.nodes.filter(
      node => node.data.healthcareCompliance?.level
    );

    if (healthcareNodes.length === 0) {
      warnings.push({
        id: 'no-healthcare-compliance',
        type: 'compliance',
        message: 'Workflow does not specify healthcare compliance requirements',
      });
    }

    healthcareNodes.forEach(node => {
      const compliance = node.data.healthcareCompliance;
      
      if (compliance.level === 'critical' && !compliance.auditTrail) {
        errors.push({
          id: `critical-compliance-audit-${node.id}`,
          type: 'compliance',
          severity: 'error',
          message: 'Critical healthcare compliance requires audit trail',
          nodeId: node.id,
        });
      }

      if (compliance.requirements.length === 0) {
        warnings.push({
          id: `compliance-requirements-${node.id}`,
          type: 'compliance',
          message: 'Healthcare compliance should specify requirements',
          nodeId: node.id,
        });
      }
    });
  }

  private analyzePerformance(
    workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    warnings: WorkflowValidationWarning[],
    suggestions: WorkflowValidationSuggestion[]
  ): WorkflowPerformanceAnalysis {
    const estimatedExecutionTime = this.estimateExecutionTime(workflow);
    const memoryUsage = this.estimateMemoryUsage(workflow);
    const costEstimate = this.estimateCost(workflow);
    const bottlenecks: string[] = [];
    const optimizations: string[] = [];

    // Identify bottlenecks
    if (estimatedExecutionTime > this.MAX_EXECUTION_TIME) {
      bottlenecks.push('Execution time exceeds recommended limits');
      optimizations.push('Consider breaking workflow into smaller parts');
    }

    if (memoryUsage > this.MAX_MEMORY_USAGE) {
      bottlenecks.push('Memory usage exceeds recommended limits');
      optimizations.push('Optimize data processing nodes');
    }

    // Check for parallel execution opportunities
    const parallelOpportunities = this.findParallelOpportunities(workflow);
    if (parallelOpportunities.length > 0) {
      suggestions.push({
        id: 'parallel-execution',
        type: 'optimization',
        message: 'Consider parallel execution for independent nodes',
        action: 'Enable parallel processing',
      });
    }

    return {
      estimatedExecutionTime,
      memoryUsage,
      costEstimate,
      bottlenecks,
      optimizations,
    };
  }

  private analyzeCompliance(
    workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): WorkflowComplianceAnalysis {
    const hipaaCompliant = this.checkHIPAACompliance(workflow);
    const fdaCompliant = this.checkFDACompliance(workflow);
    const gdprCompliant = this.checkGDPRCompliance(workflow);
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!hipaaCompliant) {
      issues.push('Workflow does not meet HIPAA compliance requirements');
      recommendations.push('Add proper data encryption and access controls');
    }

    if (!fdaCompliant) {
      issues.push('Workflow does not meet FDA compliance requirements');
      recommendations.push('Add medical device validation and documentation');
    }

    if (!gdprCompliant) {
      issues.push('Workflow does not meet GDPR compliance requirements');
      recommendations.push('Add data protection and privacy controls');
    }

    return {
      hipaaCompliant,
      fdaCompliant,
      gdprCompliant,
      issues,
      recommendations,
    };
  }

  private detectCycles(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        dfs(edge.target, [...path, nodeId]);
      }

      recursionStack.delete(nodeId);
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return cycles;
  }

  private getIncomingEdges(nodeId: string, edges: WorkflowEdge[]): WorkflowEdge[] {
    return edges.filter(edge => edge.target === nodeId);
  }

  private getOutgoingEdges(nodeId: string, edges: WorkflowEdge[]): WorkflowEdge[] {
    return edges.filter(edge => edge.source === nodeId);
  }

  private getAllEdges(): WorkflowEdge[] {
    // This would be passed from the workflow context
    return [];
  }

  private estimateExecutionTime(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): number {
    // Simple estimation based on node types and complexity
    let totalTime = 0;
    
    workflow.nodes.forEach(node => {
      switch (node.type) {
        case 'ai-agent':
          totalTime += 5000; // 5 seconds for AI processing
          break;
        case 'data-transform':
          totalTime += 1000; // 1 second for data transformation
          break;
        case 'data-validate':
          totalTime += 500; // 0.5 seconds for validation
          break;
        case 'logic-delay':
          totalTime += node.data.config?.delay || 0;
          break;
        default:
          totalTime += 100; // 0.1 seconds for other nodes
      }
    });

    return totalTime;
  }

  private estimateMemoryUsage(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): number {
    // Simple estimation based on node types
    let memoryUsage = 0;
    
    workflow.nodes.forEach(node => {
      switch (node.type) {
        case 'ai-agent':
          memoryUsage += 100; // 100MB for AI processing
          break;
        case 'data-aggregate':
          memoryUsage += 50; // 50MB for data aggregation
          break;
        default:
          memoryUsage += 10; // 10MB for other nodes
      }
    });

    return memoryUsage;
  }

  private estimateCost(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): number {
    // Simple cost estimation based on AI usage
    let cost = 0;
    
    workflow.nodes.forEach(node => {
      if (node.type === 'ai-agent') {
        cost += 0.01; // $0.01 per AI agent call
      }
    });

    return cost;
  }

  private findParallelOpportunities(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): string[] {
    // Find nodes that can be executed in parallel
    const opportunities: string[] = [];
    
    // This is a simplified implementation
    // In practice, you'd analyze the dependency graph to find independent nodes
    const independentNodes = workflow.nodes.filter(node => {
      const incomingEdges = this.getIncomingEdges(node.id, workflow.edges);
      return incomingEdges.length <= 1; // Nodes with 0 or 1 incoming edge
    });

    if (independentNodes.length > 1) {
      opportunities.push(...independentNodes.map(node => node.id));
    }

    return opportunities;
  }

  private checkHIPAACompliance(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): boolean {
    // Check if workflow meets HIPAA requirements
    const hasEncryption = workflow.nodes.some(node => 
      node.data.config?.encryption === true
    );
    const hasAuditTrail = workflow.nodes.some(node => 
      node.data.healthcareCompliance?.auditTrail === true
    );
    
    return hasEncryption && hasAuditTrail;
  }

  private checkFDACompliance(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): boolean {
    // Check if workflow meets FDA requirements
    const hasValidation = workflow.nodes.some(node => 
      node.type === 'data-validate' && node.data.config?.fdaValidation === true
    );
    
    return hasValidation;
  }

  private checkGDPRCompliance(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): boolean {
    // Check if workflow meets GDPR requirements
    const hasDataProtection = workflow.nodes.some(node => 
      node.data.config?.dataProtection === true
    );
    const hasPrivacyControls = workflow.nodes.some(node => 
      node.data.config?.privacyControls === true
    );
    
    return hasDataProtection && hasPrivacyControls;
  }
}
