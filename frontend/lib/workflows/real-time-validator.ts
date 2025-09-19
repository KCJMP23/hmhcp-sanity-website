import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowValidationResult,
  WorkflowValidationError,
  WorkflowValidationWarning,
  WorkflowOptimizationSuggestion,
  HealthcareComplianceReport,
  WorkflowPerformanceMetrics,
  NodeCategory,
  HealthcareComplianceLevel,
} from '@/types/workflows/visual-builder';

export interface ValidationContext {
  workflow: WorkflowDefinition;
  nodeStates: Map<string, any>;
  executionHistory: any[];
  userPreferences: {
    strictMode: boolean;
    healthcareCompliance: HealthcareComplianceLevel[];
    performanceThreshold: number;
  };
}

export interface RealTimeValidationResult extends WorkflowValidationResult {
  timestamp: Date;
  validationTimeMs: number;
  suggestions: WorkflowOptimizationSuggestion[];
  autoFixAvailable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class RealTimeValidator {
  private validationCache: Map<string, RealTimeValidationResult> = new Map();
  private validationQueue: Set<string> = new Set();
  private isProcessing = false;
  private validationCallbacks: Set<(result: RealTimeValidationResult) => void> = new Set();

  constructor() {
    this.startValidationProcessor();
  }

  public async validateWorkflow(
    workflow: WorkflowDefinition,
    context?: Partial<ValidationContext>
  ): Promise<RealTimeValidationResult> {
    const startTime = Date.now();
    const workflowId = this.generateWorkflowId(workflow);
    
    // Check cache first
    const cached = this.validationCache.get(workflowId);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Add to validation queue
    this.validationQueue.add(workflowId);
    
    // Process validation
    const result = await this.performValidation(workflow, context);
    
    // Cache result
    this.validationCache.set(workflowId, result);
    
    // Notify callbacks
    this.notifyCallbacks(result);
    
    return result;
  }

  public subscribe(callback: (result: RealTimeValidationResult) => void): () => void {
    this.validationCallbacks.add(callback);
    return () => this.validationCallbacks.delete(callback);
  }

  public getAutoFixSuggestions(workflow: WorkflowDefinition): WorkflowOptimizationSuggestion[] {
    const suggestions: WorkflowOptimizationSuggestion[] = [];
    
    // Check for common issues and provide auto-fix suggestions
    const issues = this.identifyCommonIssues(workflow);
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing-start-node':
          suggestions.push({
            id: 'add-start-node',
            type: 'structure',
            message: 'Add a start node to begin the workflow',
            details: 'Workflows must have at least one start node',
            autoFix: () => this.addStartNode(workflow),
          });
          break;
          
        case 'missing-end-node':
          suggestions.push({
            id: 'add-end-node',
            type: 'structure',
            message: 'Add an end node to complete the workflow',
            details: 'Workflows must have at least one end node',
            autoFix: () => this.addEndNode(workflow),
          });
          break;
          
        case 'orphaned-nodes':
          suggestions.push({
            id: 'connect-orphaned-nodes',
            type: 'structure',
            message: `Connect ${issue.count} orphaned nodes`,
            details: 'Some nodes are not connected to the main workflow',
            autoFix: () => this.connectOrphanedNodes(workflow, issue.nodeIds),
          });
          break;
          
        case 'performance-issue':
          suggestions.push({
            id: 'optimize-performance',
            type: 'performance',
            message: 'Optimize workflow for better performance',
            details: `Estimated execution time: ${issue.estimatedTime}ms`,
            autoFix: () => this.optimizeWorkflow(workflow),
          });
          break;
          
        case 'compliance-issue':
          suggestions.push({
            id: 'fix-compliance',
            type: 'compliance',
            message: 'Fix healthcare compliance issues',
            details: `Found ${issue.violations.length} compliance violations`,
            autoFix: () => this.fixComplianceIssues(workflow, issue.violations),
          });
          break;
      }
    });
    
    return suggestions;
  }

  public applyAutoFix(
    workflow: WorkflowDefinition,
    suggestionId: string
  ): { success: boolean; updatedWorkflow?: WorkflowDefinition; error?: string } {
    try {
      const suggestions = this.getAutoFixSuggestions(workflow);
      const suggestion = suggestions.find(s => s.id === suggestionId);
      
      if (!suggestion || !suggestion.autoFix) {
        return { success: false, error: 'Auto-fix not available for this suggestion' };
      }
      
      const updatedWorkflow = suggestion.autoFix();
      return { success: true, updatedWorkflow };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  private async performValidation(
    workflow: WorkflowDefinition,
    context?: Partial<ValidationContext>
  ): Promise<RealTimeValidationResult> {
    const startTime = Date.now();
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];
    const suggestions: WorkflowOptimizationSuggestion[] = [];

    // Structural validation
    this.validateStructure(workflow, errors, warnings);
    
    // Connection validation
    this.validateConnections(workflow, errors, warnings);
    
    // Node configuration validation
    this.validateNodeConfigurations(workflow, errors, warnings);
    
    // Healthcare compliance validation
    const complianceReport = this.validateHealthcareCompliance(workflow, errors, warnings);
    
    // Performance analysis
    const performanceMetrics = this.analyzePerformance(workflow, suggestions);
    
    // Real-time specific validations
    this.validateRealTimeConstraints(workflow, errors, warnings, context);

    const validationTime = Date.now() - startTime;
    const isValid = errors.length === 0;
    const severity = this.calculateSeverity(errors, warnings);

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      complianceReport,
      performanceMetrics,
      timestamp: new Date(),
      validationTimeMs: validationTime,
      autoFixAvailable: suggestions.some(s => s.autoFix !== undefined),
      severity,
    };
  }

  private validateStructure(
    workflow: WorkflowDefinition,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    const { nodes, edges } = workflow;

    // Check for start nodes
    const startNodes = nodes.filter(node => node.type === 'workflow-start');
    if (startNodes.length === 0) {
      errors.push({
        id: 'missing-start-node',
        type: 'structure',
        severity: 'error',
        message: 'Workflow must have at least one start node',
      });
    } else if (startNodes.length > 1) {
      warnings.push({
        id: 'multiple-start-nodes',
        type: 'structure',
        severity: 'warning',
        message: 'Multiple start nodes detected. Consider consolidating for clarity',
      });
    }

    // Check for end nodes
    const endNodes = nodes.filter(node => node.type === 'workflow-end');
    if (endNodes.length === 0) {
      errors.push({
        id: 'missing-end-node',
        type: 'structure',
        severity: 'error',
        message: 'Workflow must have at least one end node',
      });
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const orphanedNodes = nodes.filter(node => 
      !connectedNodeIds.has(node.id) && 
      node.type !== 'workflow-start' && 
      node.type !== 'workflow-end'
    );
    
    if (orphanedNodes.length > 0) {
      warnings.push({
        id: 'orphaned-nodes',
        type: 'structure',
        severity: 'warning',
        message: `${orphanedNodes.length} orphaned nodes detected`,
        details: `Nodes: ${orphanedNodes.map(n => n.id).join(', ')}`,
      });
    }
  }

  private validateConnections(
    workflow: WorkflowDefinition,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    const { nodes, edges } = workflow;
    const nodeIds = new Set(nodes.map(n => n.id));

    edges.forEach(edge => {
      // Validate source and target exist
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
          message: `Self-connection detected on node: ${edge.source}`,
          edgeId: edge.id,
          nodeId: edge.source,
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
        details: `Cycles detected: ${cycles.map(c => c.join(' -> ')).join('; ')}`,
      });
    }
  }

  private validateNodeConfigurations(
    workflow: WorkflowDefinition,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): void {
    workflow.nodes.forEach(node => {
      // Validate AI agent nodes
      if (node.type === 'ai-agent') {
        const config = node.data.config as any;
        if (!config.prompt && !config.template) {
          errors.push({
            id: `ai-agent-config-${node.id}`,
            type: 'configuration',
            severity: 'error',
            message: 'AI agent must have either a prompt or template',
            nodeId: node.id,
          });
        }

        if (config.model && !this.isValidModel(config.model)) {
          warnings.push({
            id: `invalid-model-${node.id}`,
            type: 'configuration',
            severity: 'warning',
            message: `Unknown model: ${config.model}`,
            nodeId: node.id,
          });
        }
      }

      // Validate logic nodes
      if (node.type?.startsWith('logic-')) {
        const config = node.data.config as any;
        if (config.logicType === 'if-else' && !config.condition) {
          errors.push({
            id: `missing-condition-${node.id}`,
            type: 'configuration',
            severity: 'error',
            message: 'If/else node must have a condition',
            nodeId: node.id,
          });
        }

        if (config.logicType === 'loop' && (!config.iterations || config.iterations < 1)) {
          errors.push({
            id: `invalid-iterations-${node.id}`,
            type: 'configuration',
            severity: 'error',
            message: 'Loop node must have valid iterations count',
            nodeId: node.id,
          });
        }
      }

      // Validate data processor nodes
      if (node.type?.startsWith('data-')) {
        const config = node.data.config as any;
        if (config.processorType === 'validate' && !config.validationRules) {
          errors.push({
            id: `missing-validation-rules-${node.id}`,
            type: 'configuration',
            severity: 'error',
            message: 'Validation node must have validation rules',
            nodeId: node.id,
          });
        }
      }
    });
  }

  private validateHealthcareCompliance(
    workflow: WorkflowDefinition,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): HealthcareComplianceReport {
    const violations: any[] = [];
    const recommendations: string[] = [];

    workflow.nodes.forEach(node => {
      const compliance = node.data.healthcareCompliance;
      if (compliance) {
        // Check HIPAA compliance
        if (compliance.level === 'HIPAA') {
          if (!this.isHIPAACompliant(node)) {
            violations.push({
              rule: 'HIPAA-DATA-HANDLING',
              description: 'Node does not meet HIPAA data handling requirements',
              severity: 'critical',
              nodeId: node.id,
            });
            
            errors.push({
              id: `hipaa-violation-${node.id}`,
              type: 'compliance',
              severity: 'error',
              message: `Node ${node.id} has HIPAA compliance issues`,
              nodeId: node.id,
            });
          }
        }

        // Check GDPR compliance
        if (compliance.level === 'GDPR') {
          if (!this.isGDPRCompliant(node)) {
            violations.push({
              rule: 'GDPR-DATA-PROTECTION',
              description: 'Node does not meet GDPR data protection requirements',
              severity: 'high',
              nodeId: node.id,
            });
          }
        }
      } else {
        warnings.push({
          id: `no-compliance-${node.id}`,
          type: 'compliance',
          severity: 'warning',
          message: 'No healthcare compliance level specified',
          nodeId: node.id,
        });
      }
    });

    return {
      overallStatus: violations.length === 0 ? 'compliant' : 'non-compliant',
      violations,
      recommendations,
    };
  }

  private analyzePerformance(
    workflow: WorkflowDefinition,
    suggestions: WorkflowOptimizationSuggestion[]
  ): WorkflowPerformanceMetrics {
    const { nodes, edges } = workflow;
    
    // Calculate estimated execution time
    let estimatedTime = 0;
    nodes.forEach(node => {
      switch (node.type) {
        case 'ai-agent':
          estimatedTime += 2000; // 2 seconds for AI processing
          break;
        case 'data-transform':
        case 'data-filter':
        case 'data-aggregate':
          estimatedTime += 500; // 0.5 seconds for data processing
          break;
        case 'logic-delay':
          const config = node.data.config as any;
          estimatedTime += config.delayMs || 1000;
          break;
        default:
          estimatedTime += 100; // 0.1 seconds for other nodes
      }
    });

    // Calculate estimated cost
    const estimatedCost = nodes.length * 0.01; // $0.01 per node

    // Calculate optimization potential
    let optimizationPotential = 0;
    if (estimatedTime > 10000) { // More than 10 seconds
      optimizationPotential += 30;
    }
    if (nodes.length > 20) { // More than 20 nodes
      optimizationPotential += 20;
    }
    if (edges.length > nodes.length * 2) { // Complex connections
      optimizationPotential += 15;
    }

    if (optimizationPotential > 20) {
      suggestions.push({
        id: 'performance-optimization',
        type: 'performance',
        message: 'Consider optimizing workflow for better performance',
        details: `Current estimated time: ${estimatedTime}ms, potential savings: ${optimizationPotential}%`,
      });
    }

    return {
      estimatedExecutionTimeMs: estimatedTime,
      estimatedCostUnits: estimatedCost,
      optimizationPotential,
    };
  }

  private validateRealTimeConstraints(
    workflow: WorkflowDefinition,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[],
    context?: Partial<ValidationContext>
  ): void {
    if (!context) return;

    // Check execution time constraints
    const performanceMetrics = this.analyzePerformance(workflow, []);
    if (context.userPreferences?.performanceThreshold) {
      const threshold = context.userPreferences.performanceThreshold;
      if (performanceMetrics.estimatedExecutionTimeMs > threshold) {
        warnings.push({
          id: 'performance-threshold-exceeded',
          type: 'performance',
          severity: 'warning',
          message: `Workflow execution time (${performanceMetrics.estimatedExecutionTimeMs}ms) exceeds threshold (${threshold}ms)`,
        });
      }
    }

    // Check for real-time constraints
    const hasDelayNodes = workflow.nodes.some(node => node.type === 'logic-delay');
    if (hasDelayNodes && context.userPreferences?.strictMode) {
      warnings.push({
        id: 'delay-in-strict-mode',
        type: 'best-practice',
        severity: 'warning',
        message: 'Delay nodes detected in strict mode. Consider using event-based triggers instead',
      });
    }
  }

  private identifyCommonIssues(workflow: WorkflowDefinition): any[] {
    const issues: any[] = [];
    
    // Check for missing start node
    const startNodes = workflow.nodes.filter(node => node.type === 'workflow-start');
    if (startNodes.length === 0) {
      issues.push({ type: 'missing-start-node' });
    }
    
    // Check for missing end node
    const endNodes = workflow.nodes.filter(node => node.type === 'workflow-end');
    if (endNodes.length === 0) {
      issues.push({ type: 'missing-end-node' });
    }
    
    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    workflow.edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const orphanedNodes = workflow.nodes.filter(node => 
      !connectedNodeIds.has(node.id) && 
      node.type !== 'workflow-start' && 
      node.type !== 'workflow-end'
    );
    
    if (orphanedNodes.length > 0) {
      issues.push({
        type: 'orphaned-nodes',
        count: orphanedNodes.length,
        nodeIds: orphanedNodes.map(n => n.id),
      });
    }
    
    // Check performance
    const performanceMetrics = this.analyzePerformance(workflow, []);
    if (performanceMetrics.estimatedExecutionTimeMs > 5000) {
      issues.push({
        type: 'performance-issue',
        estimatedTime: performanceMetrics.estimatedExecutionTimeMs,
      });
    }
    
    return issues;
  }

  private calculateSeverity(
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationWarning[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (errors.length === 0 && warnings.length === 0) return 'low';
    if (errors.length === 0 && warnings.length <= 3) return 'medium';
    if (errors.length <= 2 && warnings.length <= 5) return 'high';
    return 'critical';
  }

  private generateWorkflowId(workflow: WorkflowDefinition): string {
    // Simple hash of workflow structure for caching
    const content = JSON.stringify({
      nodes: workflow.nodes.map(n => ({ id: n.id, type: n.type, config: n.data.config })),
      edges: workflow.edges.map(e => ({ source: e.source, target: e.target })),
    });
    return btoa(content).slice(0, 16);
  }

  private isCacheValid(result: RealTimeValidationResult): boolean {
    const now = Date.now();
    const cacheAge = now - result.timestamp.getTime();
    return cacheAge < 5000; // 5 seconds cache validity
  }

  private startValidationProcessor(): void {
    setInterval(() => {
      if (this.isProcessing || this.validationQueue.size === 0) return;
      
      this.isProcessing = true;
      this.processValidationQueue();
      this.isProcessing = false;
    }, 100); // Process every 100ms
  }

  private async processValidationQueue(): Promise<void> {
    const workflowIds = Array.from(this.validationQueue);
    this.validationQueue.clear();
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < workflowIds.length; i += batchSize) {
      const batch = workflowIds.slice(i, i + batchSize);
      await Promise.all(batch.map(id => this.processWorkflowValidation(id)));
    }
  }

  private async processWorkflowValidation(workflowId: string): Promise<void> {
    // This would typically fetch the workflow from storage
    // For now, we'll skip this implementation
  }

  private notifyCallbacks(result: RealTimeValidationResult): void {
    this.validationCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in validation callback:', error);
      }
    });
  }

  // Auto-fix implementations
  private addStartNode(workflow: WorkflowDefinition): WorkflowDefinition {
    const startNode: WorkflowNode = {
      id: 'start-' + Date.now(),
      type: 'workflow-start',
      position: { x: 0, y: 0 },
      data: {
        label: 'Start',
        category: 'start',
        config: {},
        status: 'idle',
      },
    };
    
    return {
      ...workflow,
      nodes: [startNode, ...workflow.nodes],
    };
  }

  private addEndNode(workflow: WorkflowDefinition): WorkflowDefinition {
    const endNode: WorkflowNode = {
      id: 'end-' + Date.now(),
      type: 'workflow-end',
      position: { x: 500, y: 0 },
      data: {
        label: 'End',
        category: 'end',
        config: {},
        status: 'idle',
      },
    };
    
    return {
      ...workflow,
      nodes: [...workflow.nodes, endNode],
    };
  }

  private connectOrphanedNodes(workflow: WorkflowDefinition, nodeIds: string[]): WorkflowDefinition {
    // Simple implementation - connect orphaned nodes to the nearest connected node
    const connectedNodeIds = new Set<string>();
    workflow.edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const connectedNodes = workflow.nodes.filter(node => connectedNodeIds.has(node.id));
    const orphanedNodes = workflow.nodes.filter(node => nodeIds.includes(node.id));
    
    if (connectedNodes.length === 0 || orphanedNodes.length === 0) {
      return workflow;
    }
    
    const newEdges = [...workflow.edges];
    orphanedNodes.forEach((orphan, index) => {
      const target = connectedNodes[index % connectedNodes.length];
      newEdges.push({
        id: `auto-connect-${orphan.id}-${target.id}`,
        source: orphan.id,
        target: target.id,
        type: 'smoothstep',
      });
    });
    
    return {
      ...workflow,
      edges: newEdges,
    };
  }

  private optimizeWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
    // Simple optimization - remove redundant nodes and simplify connections
    return workflow; // Placeholder implementation
  }

  private fixComplianceIssues(workflow: WorkflowDefinition, violations: any[]): WorkflowDefinition {
    // Simple compliance fix - add compliance metadata to nodes
    const updatedNodes = workflow.nodes.map(node => {
      if (violations.some(v => v.nodeId === node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            healthcareCompliance: {
              level: 'HIPAA',
              details: 'Auto-fixed compliance issues',
            },
          },
        };
      }
      return node;
    });
    
    return {
      ...workflow,
      nodes: updatedNodes,
    };
  }

  private detectCycles(workflow: WorkflowDefinition): string[][] {
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

  private isValidModel(model: string): boolean {
    const validModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2'];
    return validModels.includes(model);
  }

  private isHIPAACompliant(node: WorkflowNode): boolean {
    // Simplified HIPAA compliance check
    const config = node.data.config as any;
    return config && config.encryption && config.auditLogging;
  }

  private isGDPRCompliant(node: WorkflowNode): boolean {
    // Simplified GDPR compliance check
    const config = node.data.config as any;
    return config && config.dataRetention && config.consentManagement;
  }
}
