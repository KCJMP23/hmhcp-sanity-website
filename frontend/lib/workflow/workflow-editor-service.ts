/**
 * Workflow Editor Service
 * Visual workflow template editor with healthcare-specific nodes
 */

import {
  WorkflowTemplate,
  WorkflowNode,
  WorkflowConnection,
  WorkflowNodeType,
  WorkflowCategory
} from '../../types/workflow/workflow-template-types';

export class WorkflowEditorService {
  private nodeTypes: WorkflowNodeType[] = [
    'start', 'end', 'task', 'decision', 'parallel', 'merge',
    'timer', 'condition', 'loop', 'subprocess', 'notification',
    'approval', 'data_collection', 'validation', 'integration', 'custom'
  ];

  private healthcareNodeTypes: WorkflowNodeType[] = [
    'patient_admission', 'patient_discharge', 'medication_review',
    'lab_result_processing', 'imaging_review', 'clinical_decision',
    'compliance_check', 'quality_assurance', 'safety_check'
  ];

  /**
   * Create a new workflow node
   */
  async createWorkflowNode(
    type: WorkflowNodeType,
    position: { x: number; y: number },
    data: Partial<WorkflowNode['data']> = {}
  ): Promise<WorkflowNode> {
    const nodeId = this.generateNodeId();
    
    return {
      id: nodeId,
      type,
      name: this.getDefaultNodeName(type),
      description: this.getDefaultNodeDescription(type),
      position,
      size: { width: 200, height: 100 },
      data: {
        label: this.getDefaultNodeName(type),
        instructions: '',
        required_fields: [],
        optional_fields: [],
        output_fields: [],
        input_validation: [],
        output_validation: [],
        business_rules: [],
        healthcare_rules: [],
        data_transformation: [],
        integration_config: {} as any,
        ui_config: {
          layout: 'form',
          fields: [],
          styling: {} as any,
          accessibility: {} as any,
          responsive: {} as any
        },
        accessibility_config: {
          wcag_level: 'AA',
          screen_reader_support: true,
          keyboard_navigation: true,
          color_contrast: true,
          text_scaling: true,
          custom_requirements: []
        },
        ...data
      },
      validation: {
        required: true,
        validation_rules: [],
        custom_validators: [],
        error_messages: {},
        warning_messages: {},
        success_criteria: []
      },
      permissions: {
        view_roles: [],
        edit_roles: [],
        execute_roles: [],
        approve_roles: [],
        admin_roles: [],
        custom_permissions: []
      },
      styling: {
        color: this.getDefaultNodeColor(type),
        border_color: '#333333',
        background_color: '#ffffff',
        text_color: '#000000',
        icon: this.getDefaultNodeIcon(type),
        shape: this.getDefaultNodeShape(type),
        size: 'medium'
      },
      healthcare_context: {
        patient_data_required: this.isPatientDataRequired(type),
        phi_access_level: this.getDefaultPHIAccessLevel(type),
        clinical_decision_support: this.hasClinicalDecisionSupport(type),
        evidence_based: this.isEvidenceBased(type),
        quality_metrics: [],
        safety_checks: [],
        regulatory_requirements: [],
        audit_trail_required: this.isAuditTrailRequired(type),
        consent_required: this.isConsentRequired(type),
        documentation_requirements: []
      },
      compliance_checks: [],
      error_handling: {
        strategy: 'retry',
        max_retries: 3,
        retry_delay: 1000,
        escalation_roles: [],
        notification_roles: []
      },
      retry_settings: {
        max_attempts: 3,
        delay: 1000,
        backoff_multiplier: 2,
        max_delay: 10000,
        jitter: true
      },
      timeout_settings: {
        timeout: 300000, // 5 minutes
        timeout_action: 'fail'
      }
    };
  }

  /**
   * Create a workflow connection
   */
  async createWorkflowConnection(
    sourceNodeId: string,
    targetNodeId: string,
    label?: string
  ): Promise<WorkflowConnection> {
    return {
      id: this.generateConnectionId(),
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      label,
      data_mapping: [],
      validation: {
        required: false,
        validation_rules: [],
        error_messages: {}
      },
      styling: {
        color: '#333333',
        width: 2,
        style: 'solid',
        arrow_style: 'arrow'
      },
      healthcare_context: {
        data_flow_type: 'clinical_data',
        privacy_level: 'confidential',
        audit_required: true,
        encryption_required: true,
        consent_required: false
      }
    };
  }

  /**
   * Validate workflow template structure
   */
  async validateWorkflowStructure(template: WorkflowTemplate): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for start and end nodes
    const startNodes = template.nodes.filter(n => n.type === 'start');
    const endNodes = template.nodes.filter(n => n.type === 'end');

    if (startNodes.length === 0) {
      errors.push('Workflow must have at least one start node');
    }

    if (startNodes.length > 1) {
      warnings.push('Workflow has multiple start nodes');
    }

    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one end node');
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    template.connections.forEach(conn => {
      connectedNodeIds.add(conn.source_node_id);
      connectedNodeIds.add(conn.target_node_id);
    });

    const orphanedNodes = template.nodes.filter(n => 
      n.type !== 'start' && n.type !== 'end' && !connectedNodeIds.has(n.id)
    );

    if (orphanedNodes.length > 0) {
      warnings.push(`Found ${orphanedNodes.length} orphaned nodes`);
    }

    // Check for cycles
    const hasCycle = this.detectCycle(template);
    if (hasCycle) {
      warnings.push('Workflow contains cycles');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get available node types for category
   */
  async getNodeTypesForCategory(category: WorkflowCategory): Promise<WorkflowNodeType[]> {
    const baseTypes = [...this.nodeTypes];
    
    if (this.isHealthcareCategory(category)) {
      return [...baseTypes, ...this.healthcareNodeTypes];
    }
    
    return baseTypes;
  }

  /**
   * Get node templates for category
   */
  async getNodeTemplates(category: WorkflowCategory): Promise<WorkflowNode[]> {
    const nodeTypes = await this.getNodeTypesForCategory(category);
    const templates: WorkflowNode[] = [];

    for (const nodeType of nodeTypes) {
      const template = await this.createWorkflowNode(nodeType, { x: 0, y: 0 });
      templates.push(template);
    }

    return templates;
  }

  /**
   * Auto-layout workflow nodes
   */
  async autoLayoutNodes(nodes: WorkflowNode[], connections: WorkflowConnection[]): Promise<WorkflowNode[]> {
    const layout = this.calculateNodeLayout(nodes, connections);
    
    return nodes.map(node => ({
      ...node,
      position: layout[node.id] || node.position
    }));
  }

  // Private helper methods
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultNodeName(type: WorkflowNodeType): string {
    const names: Record<WorkflowNodeType, string> = {
      start: 'Start',
      end: 'End',
      task: 'Task',
      decision: 'Decision',
      parallel: 'Parallel',
      merge: 'Merge',
      timer: 'Timer',
      condition: 'Condition',
      loop: 'Loop',
      subprocess: 'Subprocess',
      notification: 'Notification',
      approval: 'Approval',
      data_collection: 'Data Collection',
      validation: 'Validation',
      integration: 'Integration',
      custom: 'Custom Node',
      patient_admission: 'Patient Admission',
      patient_discharge: 'Patient Discharge',
      medication_review: 'Medication Review',
      lab_result_processing: 'Lab Result Processing',
      imaging_review: 'Imaging Review',
      clinical_decision: 'Clinical Decision',
      compliance_check: 'Compliance Check',
      quality_assurance: 'Quality Assurance',
      safety_check: 'Safety Check'
    };
    return names[type] || 'Unknown Node';
  }

  private getDefaultNodeDescription(type: WorkflowNodeType): string {
    const descriptions: Record<WorkflowNodeType, string> = {
      start: 'Starting point of the workflow',
      end: 'Ending point of the workflow',
      task: 'A task to be performed',
      decision: 'A decision point in the workflow',
      parallel: 'Parallel execution of tasks',
      merge: 'Merge parallel branches',
      timer: 'Wait for a specified time',
      condition: 'Conditional logic',
      loop: 'Loop through items',
      subprocess: 'Execute a subprocess',
      notification: 'Send a notification',
      approval: 'Require approval',
      data_collection: 'Collect data from user',
      validation: 'Validate data',
      integration: 'Integrate with external system',
      custom: 'Custom node implementation',
      patient_admission: 'Process patient admission',
      patient_discharge: 'Process patient discharge',
      medication_review: 'Review medication orders',
      lab_result_processing: 'Process lab results',
      imaging_review: 'Review imaging studies',
      clinical_decision: 'Make clinical decision',
      compliance_check: 'Check compliance requirements',
      quality_assurance: 'Perform quality assurance',
      safety_check: 'Perform safety check'
    };
    return descriptions[type] || 'No description available';
  }

  private getDefaultNodeColor(type: WorkflowNodeType): string {
    const colors: Record<WorkflowNodeType, string> = {
      start: '#4CAF50',
      end: '#F44336',
      task: '#2196F3',
      decision: '#FF9800',
      parallel: '#9C27B0',
      merge: '#9C27B0',
      timer: '#607D8B',
      condition: '#FF9800',
      loop: '#795548',
      subprocess: '#3F51B5',
      notification: '#00BCD4',
      approval: '#FF5722',
      data_collection: '#8BC34A',
      validation: '#FFC107',
      integration: '#E91E63',
      custom: '#9E9E9E',
      patient_admission: '#4CAF50',
      patient_discharge: '#F44336',
      medication_review: '#2196F3',
      lab_result_processing: '#FF9800',
      imaging_review: '#9C27B0',
      clinical_decision: '#FF5722',
      compliance_check: '#FFC107',
      quality_assurance: '#8BC34A',
      safety_check: '#F44336'
    };
    return colors[type] || '#9E9E9E';
  }

  private getDefaultNodeIcon(type: WorkflowNodeType): string {
    const icons: Record<WorkflowNodeType, string> = {
      start: '▶️',
      end: '⏹️',
      task: '📋',
      decision: '❓',
      parallel: '⚡',
      merge: '🔀',
      timer: '⏰',
      condition: '🔍',
      loop: '🔄',
      subprocess: '📦',
      notification: '📢',
      approval: '✅',
      data_collection: '📊',
      validation: '✔️',
      integration: '🔗',
      custom: '⚙️',
      patient_admission: '🏥',
      patient_discharge: '🚪',
      medication_review: '💊',
      lab_result_processing: '🧪',
      imaging_review: '📷',
      clinical_decision: '🧠',
      compliance_check: '📋',
      quality_assurance: '⭐',
      safety_check: '🛡️'
    };
    return icons[type] || '❓';
  }

  private getDefaultNodeShape(type: WorkflowNodeType): 'rectangle' | 'circle' | 'diamond' | 'hexagon' {
    const shapes: Record<WorkflowNodeType, 'rectangle' | 'circle' | 'diamond' | 'hexagon'> = {
      start: 'circle',
      end: 'circle',
      task: 'rectangle',
      decision: 'diamond',
      parallel: 'rectangle',
      merge: 'rectangle',
      timer: 'rectangle',
      condition: 'diamond',
      loop: 'rectangle',
      subprocess: 'rectangle',
      notification: 'rectangle',
      approval: 'diamond',
      data_collection: 'rectangle',
      validation: 'rectangle',
      integration: 'rectangle',
      custom: 'rectangle',
      patient_admission: 'rectangle',
      patient_discharge: 'rectangle',
      medication_review: 'rectangle',
      lab_result_processing: 'rectangle',
      imaging_review: 'rectangle',
      clinical_decision: 'diamond',
      compliance_check: 'rectangle',
      quality_assurance: 'rectangle',
      safety_check: 'rectangle'
    };
    return shapes[type] || 'rectangle';
  }

  private isPatientDataRequired(type: WorkflowNodeType): boolean {
    const patientDataTypes: WorkflowNodeType[] = [
      'patient_admission', 'patient_discharge', 'medication_review',
      'lab_result_processing', 'imaging_review', 'clinical_decision'
    ];
    return patientDataTypes.includes(type);
  }

  private getDefaultPHIAccessLevel(type: WorkflowNodeType): 'none' | 'limited' | 'full' {
    const fullAccessTypes: WorkflowNodeType[] = [
      'patient_admission', 'patient_discharge', 'medication_review',
      'lab_result_processing', 'imaging_review', 'clinical_decision'
    ];
    const limitedAccessTypes: WorkflowNodeType[] = [
      'compliance_check', 'quality_assurance', 'safety_check'
    ];
    
    if (fullAccessTypes.includes(type)) return 'full';
    if (limitedAccessTypes.includes(type)) return 'limited';
    return 'none';
  }

  private hasClinicalDecisionSupport(type: WorkflowNodeType): boolean {
    const clinicalTypes: WorkflowNodeType[] = [
      'clinical_decision', 'medication_review', 'lab_result_processing',
      'imaging_review', 'patient_admission', 'patient_discharge'
    ];
    return clinicalTypes.includes(type);
  }

  private isEvidenceBased(type: WorkflowNodeType): boolean {
    const evidenceTypes: WorkflowNodeType[] = [
      'clinical_decision', 'medication_review', 'compliance_check',
      'quality_assurance', 'safety_check'
    ];
    return evidenceTypes.includes(type);
  }

  private isAuditTrailRequired(type: WorkflowNodeType): boolean {
    const auditTypes: WorkflowNodeType[] = [
      'patient_admission', 'patient_discharge', 'medication_review',
      'clinical_decision', 'compliance_check', 'approval'
    ];
    return auditTypes.includes(type);
  }

  private isConsentRequired(type: WorkflowNodeType): boolean {
    const consentTypes: WorkflowNodeType[] = [
      'patient_admission', 'patient_discharge', 'medication_review',
      'lab_result_processing', 'imaging_review', 'clinical_decision'
    ];
    return consentTypes.includes(type);
  }

  private isHealthcareCategory(category: WorkflowCategory): boolean {
    const healthcareCategories: WorkflowCategory[] = [
      'patient_admission', 'patient_discharge', 'medication_management',
      'lab_results_review', 'imaging_review', 'surgical_procedures',
      'emergency_protocols', 'patient_safety', 'clinical_documentation'
    ];
    return healthcareCategories.includes(category);
  }

  private detectCycle(template: WorkflowTemplate): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingConnections = template.connections.filter(
        conn => conn.source_node_id === nodeId
      );

      for (const connection of outgoingConnections) {
        if (hasCycleDFS(connection.target_node_id)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of template.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) {
          return true;
        }
      }
    }

    return false;
  }

  private calculateNodeLayout(
    nodes: WorkflowNode[],
    connections: WorkflowConnection[]
  ): Record<string, { x: number; y: number }> {
    const layout: Record<string, { x: number; y: number }> = {};
    const nodeWidth = 200;
    const nodeHeight = 100;
    const spacing = 50;

    // Simple grid layout
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);

    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      layout[node.id] = {
        x: col * (nodeWidth + spacing),
        y: row * (nodeHeight + spacing)
      };
    });

    return layout;
  }
}
