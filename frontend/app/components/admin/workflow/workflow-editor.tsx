'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WorkflowTemplate, WorkflowNode, WorkflowConnection, WorkflowCategory } from '../../../types/workflow/workflow-template-types';

interface WorkflowEditorProps {
  template?: WorkflowTemplate;
  onSave?: (template: WorkflowTemplate) => void;
  onCancel?: () => void;
  className?: string;
}

export function WorkflowEditor({
  template,
  onSave,
  onCancel,
  className = ''
}: WorkflowEditorProps) {
  const [workflowTemplate, setWorkflowTemplate] = useState<WorkflowTemplate | null>(template || null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Initialize empty template if none provided
  useEffect(() => {
    if (!workflowTemplate) {
      const emptyTemplate: WorkflowTemplate = {
        id: '',
        name: 'New Workflow',
        description: '',
        version: '1.0.0',
        organization_id: '',
        created_by: '',
        created_at: '',
        updated_at: '',
        is_active: true,
        is_public: false,
        category: 'custom',
        tags: [],
        metadata: {
          estimated_duration: 0,
          complexity_level: 'low',
          required_permissions: [],
          target_roles: [],
          department: '',
          specialty: '',
          last_tested: '',
          test_coverage: 0,
          changelog: []
        },
        nodes: [],
        connections: [],
        variables: [],
        triggers: [],
        conditions: [],
        actions: [],
        compliance_requirements: [],
        healthcare_context: {
          patient_safety_priority: 'low',
          clinical_urgency: 'routine',
          regulatory_framework: [],
          quality_measures: [],
          evidence_level: 'C',
          clinical_guidelines: [],
          best_practices: [],
          risk_assessment: {
            risk_level: 'low',
            risk_factors: [],
            mitigation_strategies: [],
            monitoring_requirements: []
          },
          mitigation_strategies: [],
          monitoring_requirements: [],
          reporting_requirements: []
        },
        validation_rules: [],
        execution_settings: {
          timeout: 300000,
          retry_attempts: 3,
          retry_delay: 1000,
          parallel_execution: false,
          max_parallel_tasks: 1,
          resource_limits: {
            cpu_limit: '100m',
            memory_limit: '128Mi',
            storage_limit: '1Gi',
            network_limit: '100M',
            concurrent_executions: 10
          },
          monitoring: {
            enabled: true,
            metrics: [],
            alerts: [],
            dashboards: [],
            reporting: {
              frequency: 'daily',
              format: 'json',
              recipients: [],
              templates: []
            }
          },
          logging: {
            level: 'info',
            destinations: [],
            retention_period: '30d',
            sensitive_data_masking: true,
            audit_logging: true
          },
          error_handling: {
            strategy: 'retry',
            max_retries: 3,
            retry_delay: 1000,
            escalation_roles: [],
            notification_settings: {
              channels: [],
              templates: {},
              escalation_rules: [],
              quiet_hours: {
                enabled: false,
                start_time: '22:00',
                end_time: '08:00',
                timezone: 'UTC',
                days: ['saturday', 'sunday']
              }
            }
          },
          performance_tuning: {
            optimization_level: 'medium',
            caching_enabled: true,
            parallel_processing: false,
            resource_monitoring: true,
            auto_scaling: false
          }
        },
        sharing_settings: {
          is_public: false,
          is_template: false,
          sharing_level: 'private',
          allowed_organizations: [],
          allowed_roles: [],
          usage_restrictions: [],
          licensing: {
            license_type: 'free',
            terms: '',
            restrictions: []
          },
          attribution_required: false,
          modification_allowed: true,
          commercial_use_allowed: false
        },
        version_history: [],
        usage_stats: {
          total_executions: 0,
          successful_executions: 0,
          failed_executions: 0,
          average_execution_time: 0,
          last_executed: '',
          most_active_users: [],
          execution_trends: [],
          error_analysis: {
            total_errors: 0,
            error_types: [],
            error_trends: [],
            resolution_time: 0
          },
          performance_metrics: {
            average_execution_time: 0,
            p95_execution_time: 0,
            p99_execution_time: 0,
            throughput: 0,
            error_rate: 0,
            availability: 100
          }
        }
      };
      setWorkflowTemplate(emptyTemplate);
    }
  }, [template]);

  const handleNodeDragStart = useCallback((node: WorkflowNode, event: React.MouseEvent) => {
    setIsDragging(true);
    setSelectedNode(node);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }, []);

  const handleNodeDrag = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !selectedNode || !workflowTemplate) return;

    const newPosition = {
      x: event.clientX - dragOffset.x,
      y: event.clientY - dragOffset.y
    };

    const updatedNodes = workflowTemplate.nodes.map(node =>
      node.id === selectedNode.id
        ? { ...node, position: newPosition }
        : node
    );

    setWorkflowTemplate({
      ...workflowTemplate,
      nodes: updatedNodes
    });
  }, [isDragging, selectedNode, dragOffset, workflowTemplate]);

  const handleNodeDragEnd = useCallback(() => {
    setIsDragging(false);
    setSelectedNode(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleAddNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    if (!workflowTemplate) return;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType as any,
      name: `New ${nodeType}`,
      description: '',
      position,
      size: { width: 200, height: 100 },
      data: {
        label: `New ${nodeType}`,
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
        }
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
        color: '#2196F3',
        border_color: '#333333',
        background_color: '#ffffff',
        text_color: '#000000',
        icon: '📋',
        shape: 'rectangle',
        size: 'medium'
      },
      healthcare_context: {
        patient_data_required: false,
        phi_access_level: 'none',
        clinical_decision_support: false,
        evidence_based: false,
        quality_metrics: [],
        safety_checks: [],
        regulatory_requirements: [],
        audit_trail_required: false,
        consent_required: false,
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
        timeout: 300000,
        timeout_action: 'fail'
      }
    };

    setWorkflowTemplate({
      ...workflowTemplate,
      nodes: [...workflowTemplate.nodes, newNode]
    });
  }, [workflowTemplate]);

  const handleSave = useCallback(() => {
    if (workflowTemplate && onSave) {
      onSave(workflowTemplate);
    }
  }, [workflowTemplate, onSave]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const validateWorkflow = useCallback(async () => {
    if (!workflowTemplate) return;

    try {
      const response = await fetch('/api/admin/workflow-templates/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ template: workflowTemplate })
      });

      const result = await response.json();
      
      if (result.success) {
        setValidationErrors([]);
        setValidationWarnings(result.warnings || []);
      } else {
        setValidationErrors(result.errors || []);
        setValidationWarnings(result.warnings || []);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationErrors(['Failed to validate workflow']);
    }
  }, [workflowTemplate]);

  if (!workflowTemplate) {
    return <div>Loading workflow editor...</div>;
  }

  return (
    <div className={`flex h-screen bg-gray-100 ${className}`}>
      {/* Node Palette */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Workflow Nodes</h3>
        <div className="space-y-2">
          {[
            { type: 'start', name: 'Start', icon: '▶️' },
            { type: 'end', name: 'End', icon: '⏹️' },
            { type: 'task', name: 'Task', icon: '📋' },
            { type: 'decision', name: 'Decision', icon: '❓' },
            { type: 'parallel', name: 'Parallel', icon: '⚡' },
            { type: 'merge', name: 'Merge', icon: '🔀' },
            { type: 'timer', name: 'Timer', icon: '⏰' },
            { type: 'condition', name: 'Condition', icon: '🔍' },
            { type: 'notification', name: 'Notification', icon: '📢' },
            { type: 'approval', name: 'Approval', icon: '✅' },
            { type: 'data_collection', name: 'Data Collection', icon: '📊' },
            { type: 'validation', name: 'Validation', icon: '✔️' },
            { type: 'integration', name: 'Integration', icon: '🔗' }
          ].map((node) => (
            <button
              key={node.type}
              onClick={() => handleAddNode(node.type, { x: 100, y: 100 })}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <span className="text-xl">{node.icon}</span>
              <span>{node.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">{workflowTemplate.name}</h2>
            <span className="text-sm text-gray-500">v{workflowTemplate.version}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={validateWorkflow}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Validate
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="w-full h-full relative"
            onMouseMove={handleNodeDrag}
            onMouseUp={handleNodeDragEnd}
            onMouseLeave={handleNodeDragEnd}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ccc" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Workflow Nodes */}
            {workflowTemplate.nodes.map((node) => (
              <div
                key={node.id}
                className="absolute border-2 border-gray-300 rounded-lg bg-white shadow-md cursor-move"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: node.size.width,
                  height: node.size.height,
                  borderColor: node.styling.border_color,
                  backgroundColor: node.styling.background_color
                }}
                onMouseDown={(e) => handleNodeDragStart(node, e)}
              >
                <div className="p-3 h-full flex flex-col justify-center items-center">
                  <div className="text-2xl mb-1">{node.styling.icon}</div>
                  <div className="text-sm font-medium text-center">{node.name}</div>
                </div>
              </div>
            ))}

            {/* Workflow Connections */}
            <svg className="absolute inset-0 pointer-events-none">
              {workflowTemplate.connections.map((connection) => {
                const sourceNode = workflowTemplate.nodes.find(n => n.id === connection.source_node_id);
                const targetNode = workflowTemplate.nodes.find(n => n.id === connection.target_node_id);
                
                if (!sourceNode || !targetNode) return null;

                const startX = sourceNode.position.x + sourceNode.size.width / 2;
                const startY = sourceNode.position.y + sourceNode.size.height / 2;
                const endX = targetNode.position.x + targetNode.size.width / 2;
                const endY = targetNode.position.y + targetNode.size.height / 2;

                return (
                  <line
                    key={connection.id}
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={connection.styling.color}
                    strokeWidth={connection.styling.width}
                    strokeDasharray={connection.styling.style === 'dashed' ? '5,5' : 'none'}
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#333"
                  />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        {/* Validation Panel */}
        {(validationErrors.length > 0 || validationWarnings.length > 0) && (
          <div className="bg-white border-t border-gray-200 p-4 max-h-32 overflow-y-auto">
            {validationErrors.length > 0 && (
              <div className="mb-2">
                <h4 className="text-sm font-semibold text-red-600 mb-1">Errors:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationWarnings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-600 mb-1">Warnings:</h4>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
