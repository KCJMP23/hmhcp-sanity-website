// Enterprise Plugin Policy Manager
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { PluginDefinition, PluginInstallation } from '@/types/plugins/marketplace';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface EnterprisePolicy {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  type: 'security' | 'compliance' | 'performance' | 'resource' | 'access';
  rules: PolicyRule[];
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PolicyRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  action: 'allow' | 'deny' | 'require_approval' | 'warn';
  message?: string;
}

export interface PolicyEvaluation {
  policy_id: string;
  plugin_id: string;
  passed: boolean;
  violations: PolicyViolation[];
  evaluated_at: string;
  evaluated_by: string;
}

export interface PolicyViolation {
  rule_id: string;
  field: string;
  expected_value: any;
  actual_value: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  steps: ApprovalStep[];
  auto_approve_conditions: PolicyRule[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStep {
  id: string;
  name: string;
  description: string;
  approvers: string[];
  required_approvals: number;
  timeout_hours: number;
  order: number;
}

export interface ApprovalRequest {
  id: string;
  workflow_id: string;
  plugin_id: string;
  installation_id?: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  current_step: number;
  approvals: ApprovalRecord[];
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ApprovalRecord {
  id: string;
  step_id: string;
  approver_id: string;
  decision: 'approved' | 'rejected';
  comments?: string;
  approved_at: string;
}

export class EnterprisePolicyManager {
  /**
   * Create enterprise policy
   */
  async createPolicy(
    organizationId: string,
    policyData: Omit<EnterprisePolicy, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ): Promise<EnterprisePolicy> {
    try {
      const policy: EnterprisePolicy = {
        id: this.generatePolicyId(),
        organization_id: organizationId,
        ...policyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('enterprise_plugin_policies')
        .insert({
          id: policy.id,
          organization_id: organizationId,
          name: policy.name,
          description: policy.description,
          type: policy.type,
          rules: policy.rules,
          priority: policy.priority,
          enabled: policy.enabled,
          created_at: policy.created_at,
          updated_at: policy.updated_at,
          created_by: policy.created_by
        });

      if (error) {
        throw new Error(error.message);
      }

      return policy;

    } catch (error) {
      console.error('Failed to create policy:', error);
      throw error;
    }
  }

  /**
   * Update enterprise policy
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<Omit<EnterprisePolicy, 'id' | 'organization_id' | 'created_at' | 'created_by'>>
  ): Promise<EnterprisePolicy> {
    try {
      const { data, error } = await supabase
        .from('enterprise_plugin_policies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', policyId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to update policy:', error);
      throw error;
    }
  }

  /**
   * Delete enterprise policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_plugin_policies')
        .delete()
        .eq('id', policyId);

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Failed to delete policy:', error);
      throw error;
    }
  }

  /**
   * Get policies for organization
   */
  async getOrganizationPolicies(organizationId: string): Promise<EnterprisePolicy[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_plugin_policies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('enabled', true)
        .order('priority', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get organization policies:', error);
      throw error;
    }
  }

  /**
   * Evaluate plugin against policies
   */
  async evaluatePlugin(
    plugin: PluginDefinition,
    organizationId: string,
    evaluatedBy: string
  ): Promise<PolicyEvaluation[]> {
    try {
      const policies = await this.getOrganizationPolicies(organizationId);
      const evaluations: PolicyEvaluation[] = [];

      for (const policy of policies) {
        const evaluation = await this.evaluatePluginAgainstPolicy(plugin, policy, evaluatedBy);
        evaluations.push(evaluation);
      }

      return evaluations;

    } catch (error) {
      console.error('Failed to evaluate plugin:', error);
      throw error;
    }
  }

  /**
   * Evaluate plugin against specific policy
   */
  private async evaluatePluginAgainstPolicy(
    plugin: PluginDefinition,
    policy: EnterprisePolicy,
    evaluatedBy: string
  ): Promise<PolicyEvaluation> {
    const violations: PolicyViolation[] = [];
    let passed = true;

    for (const rule of policy.rules) {
      const violation = await this.evaluateRule(plugin, rule);
      if (violation) {
        violations.push(violation);
        if (rule.action === 'deny') {
          passed = false;
        }
      }
    }

    const evaluation: PolicyEvaluation = {
      policy_id: policy.id,
      plugin_id: plugin.id,
      passed,
      violations,
      evaluated_at: new Date().toISOString(),
      evaluated_by: evaluatedBy
    };

    // Store evaluation
    await this.storePolicyEvaluation(evaluation);

    return evaluation;
  }

  /**
   * Evaluate individual rule
   */
  private async evaluateRule(plugin: PluginDefinition, rule: PolicyRule): Promise<PolicyViolation | null> {
    const actualValue = this.getNestedValue(plugin, rule.field);
    const expectedValue = rule.value;

    let rulePassed = false;

    switch (rule.operator) {
      case 'equals':
        rulePassed = actualValue === expectedValue;
        break;
      case 'not_equals':
        rulePassed = actualValue !== expectedValue;
        break;
      case 'contains':
        rulePassed = String(actualValue).includes(String(expectedValue));
        break;
      case 'not_contains':
        rulePassed = !String(actualValue).includes(String(expectedValue));
        break;
      case 'greater_than':
        rulePassed = Number(actualValue) > Number(expectedValue);
        break;
      case 'less_than':
        rulePassed = Number(actualValue) < Number(expectedValue);
        break;
      case 'in':
        rulePassed = Array.isArray(expectedValue) && expectedValue.includes(actualValue);
        break;
      case 'not_in':
        rulePassed = Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
        break;
    }

    if (!rulePassed) {
      return {
        rule_id: rule.id,
        field: rule.field,
        expected_value: expectedValue,
        actual_value: actualValue,
        severity: this.getViolationSeverity(rule.action),
        message: rule.message || `Rule violation: ${rule.field} ${rule.operator} ${expectedValue}`
      };
    }

    return null;
  }

  /**
   * Get violation severity based on action
   */
  private getViolationSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (action) {
      case 'deny':
        return 'critical';
      case 'require_approval':
        return 'high';
      case 'warn':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Create approval workflow
   */
  async createApprovalWorkflow(
    organizationId: string,
    workflowData: Omit<ApprovalWorkflow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ): Promise<ApprovalWorkflow> {
    try {
      const workflow: ApprovalWorkflow = {
        id: this.generateWorkflowId(),
        organization_id: organizationId,
        ...workflowData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('enterprise_approval_workflows')
        .insert({
          id: workflow.id,
          organization_id: organizationId,
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          auto_approve_conditions: workflow.auto_approve_conditions,
          enabled: workflow.enabled,
          created_at: workflow.created_at,
          updated_at: workflow.updated_at
        });

      if (error) {
        throw new Error(error.message);
      }

      return workflow;

    } catch (error) {
      console.error('Failed to create approval workflow:', error);
      throw error;
    }
  }

  /**
   * Create approval request
   */
  async createApprovalRequest(
    workflowId: string,
    pluginId: string,
    requestedBy: string,
    installationId?: string
  ): Promise<ApprovalRequest> {
    try {
      const workflow = await this.getApprovalWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Check if auto-approval conditions are met
      const autoApprove = await this.checkAutoApprovalConditions(pluginId, workflow.auto_approve_conditions);
      
      const request: ApprovalRequest = {
        id: this.generateRequestId(),
        workflow_id: workflowId,
        plugin_id: pluginId,
        installation_id: installationId,
        requested_by: requestedBy,
        status: autoApprove ? 'approved' : 'pending',
        current_step: autoApprove ? workflow.steps.length : 0,
        approvals: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const { error } = await supabase
        .from('enterprise_approval_requests')
        .insert({
          id: request.id,
          workflow_id: workflowId,
          plugin_id: pluginId,
          installation_id: installationId,
          requested_by: requestedBy,
          status: request.status,
          current_step: request.current_step,
          approvals: request.approvals,
          created_at: request.created_at,
          updated_at: request.updated_at,
          expires_at: request.expires_at
        });

      if (error) {
        throw new Error(error.message);
      }

      return request;

    } catch (error) {
      console.error('Failed to create approval request:', error);
      throw error;
    }
  }

  /**
   * Process approval
   */
  async processApproval(
    requestId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<ApprovalRequest> {
    try {
      const request = await this.getApprovalRequest(requestId);
      if (!request) {
        throw new Error('Approval request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      const workflow = await this.getApprovalWorkflow(request.workflow_id);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const currentStep = workflow.steps[request.current_step];
      if (!currentStep) {
        throw new Error('Invalid workflow step');
      }

      // Record approval
      const approval: ApprovalRecord = {
        id: this.generateApprovalId(),
        step_id: currentStep.id,
        approver_id: approverId,
        decision,
        comments,
        approved_at: new Date().toISOString()
      };

      request.approvals.push(approval);
      request.updated_at = new Date().toISOString();

      if (decision === 'rejected') {
        request.status = 'rejected';
      } else {
        // Check if current step is complete
        const stepApprovals = request.approvals.filter(a => a.step_id === currentStep.id);
        if (stepApprovals.length >= currentStep.required_approvals) {
          // Move to next step
          request.current_step++;
          if (request.current_step >= workflow.steps.length) {
            request.status = 'approved';
          }
        }
      }

      // Update request
      const { error } = await supabase
        .from('enterprise_approval_requests')
        .update({
          status: request.status,
          current_step: request.current_step,
          approvals: request.approvals,
          updated_at: request.updated_at
        })
        .eq('id', requestId);

      if (error) {
        throw new Error(error.message);
      }

      return request;

    } catch (error) {
      console.error('Failed to process approval:', error);
      throw error;
    }
  }

  /**
   * Get approval workflow
   */
  private async getApprovalWorkflow(workflowId: string): Promise<ApprovalWorkflow | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_approval_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get approval workflow:', error);
      throw error;
    }
  }

  /**
   * Get approval request
   */
  private async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get approval request:', error);
      throw error;
    }
  }

  /**
   * Check auto-approval conditions
   */
  private async checkAutoApprovalConditions(
    pluginId: string,
    conditions: PolicyRule[]
  ): Promise<boolean> {
    // This would check if plugin meets auto-approval conditions
    // Implementation depends on your specific requirements
    return false;
  }

  /**
   * Store policy evaluation
   */
  private async storePolicyEvaluation(evaluation: PolicyEvaluation): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_policy_evaluations')
        .insert({
          policy_id: evaluation.policy_id,
          plugin_id: evaluation.plugin_id,
          passed: evaluation.passed,
          violations: evaluation.violations,
          evaluated_at: evaluation.evaluated_at,
          evaluated_by: evaluation.evaluated_by
        });

      if (error) {
        console.error('Failed to store policy evaluation:', error);
      }
    } catch (error) {
      console.error('Failed to store policy evaluation:', error);
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate policy ID
   */
  private generatePolicyId(): string {
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate approval ID
   */
  private generateApprovalId(): string {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
