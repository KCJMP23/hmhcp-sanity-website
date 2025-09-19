// Enterprise Plugin Deployment Manager
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { PluginDefinition, PluginInstallation } from '@/types/plugins/marketplace';
import { EnterprisePolicyManager, PolicyEvaluation } from './policy-manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DeploymentPlan {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  plugins: DeploymentPlugin[];
  environment: 'development' | 'staging' | 'production';
  status: 'draft' | 'pending_approval' | 'approved' | 'deploying' | 'completed' | 'failed';
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  deployed_at?: string;
}

export interface DeploymentPlugin {
  plugin_id: string;
  version: string;
  configuration: any;
  dependencies: string[];
  order: number;
}

export interface DeploymentStep {
  id: string;
  deployment_id: string;
  plugin_id: string;
  step_type: 'pre_install' | 'install' | 'configure' | 'post_install' | 'verify' | 'rollback';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  logs: string[];
}

export interface DeploymentEnvironment {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  environment_type: 'development' | 'staging' | 'production';
  configuration: {
    max_plugins: number;
    resource_limits: {
      memory: number;
      cpu: number;
      storage: number;
    };
    security_policies: string[];
    compliance_requirements: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface DeploymentMetrics {
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  average_deployment_time: number;
  plugins_deployed: number;
  environments_active: number;
}

export class EnterpriseDeploymentManager {
  private policyManager: EnterprisePolicyManager;

  constructor() {
    this.policyManager = new EnterprisePolicyManager();
  }

  /**
   * Create deployment plan
   */
  async createDeploymentPlan(
    organizationId: string,
    planData: Omit<DeploymentPlan, 'id' | 'organization_id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<DeploymentPlan> {
    try {
      const plan: DeploymentPlan = {
        id: this.generateDeploymentId(),
        organization_id: organizationId,
        ...planData,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('enterprise_deployment_plans')
        .insert({
          id: plan.id,
          organization_id: organizationId,
          name: plan.name,
          description: plan.description,
          plugins: plan.plugins,
          environment: plan.environment,
          status: plan.status,
          created_by: plan.created_by,
          created_at: plan.created_at,
          updated_at: plan.updated_at
        });

      if (error) {
        throw new Error(error.message);
      }

      return plan;

    } catch (error) {
      console.error('Failed to create deployment plan:', error);
      throw error;
    }
  }

  /**
   * Validate deployment plan
   */
  async validateDeploymentPlan(
    planId: string,
    organizationId: string
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    policy_evaluations: PolicyEvaluation[];
  }> {
    try {
      const plan = await this.getDeploymentPlan(planId);
      if (!plan) {
        throw new Error('Deployment plan not found');
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const policyEvaluations: PolicyEvaluation[] = [];

      // Validate each plugin
      for (const deploymentPlugin of plan.plugins) {
        const plugin = await this.getPluginDefinition(deploymentPlugin.plugin_id);
        if (!plugin) {
          errors.push(`Plugin ${deploymentPlugin.plugin_id} not found`);
          continue;
        }

        // Check version compatibility
        if (plugin.version !== deploymentPlugin.version) {
          warnings.push(`Plugin ${plugin.name} version mismatch: requested ${deploymentPlugin.version}, available ${plugin.version}`);
        }

        // Evaluate against policies
        const evaluations = await this.policyManager.evaluatePlugin(
          plugin,
          organizationId,
          plan.created_by
        );
        policyEvaluations.push(...evaluations);

        // Check for policy violations
        for (const evaluation of evaluations) {
          if (!evaluation.passed) {
            for (const violation of evaluation.violations) {
              if (violation.severity === 'critical' || violation.severity === 'high') {
                errors.push(`Policy violation: ${violation.message}`);
              } else {
                warnings.push(`Policy warning: ${violation.message}`);
              }
            }
          }
        }

        // Check dependencies
        for (const dependency of deploymentPlugin.dependencies) {
          const isDependencyIncluded = plan.plugins.some(p => p.plugin_id === dependency);
          if (!isDependencyIncluded) {
            errors.push(`Missing dependency: ${dependency} for plugin ${plugin.name}`);
          }
        }
      }

      // Check environment limits
      const environment = await this.getDeploymentEnvironment(plan.environment, organizationId);
      if (environment) {
        if (plan.plugins.length > environment.configuration.max_plugins) {
          errors.push(`Too many plugins: ${plan.plugins.length} exceeds limit of ${environment.configuration.max_plugins}`);
        }

        const totalMemory = plan.plugins.reduce((sum, p) => {
          const plugin = this.getPluginDefinition(p.plugin_id);
          return sum + (plugin?.resources?.memory || 0);
        }, 0);

        if (totalMemory > environment.configuration.resource_limits.memory) {
          errors.push(`Memory limit exceeded: ${totalMemory}MB exceeds limit of ${environment.configuration.resource_limits.memory}MB`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        policy_evaluations: policyEvaluations
      };

    } catch (error) {
      console.error('Failed to validate deployment plan:', error);
      throw error;
    }
  }

  /**
   * Deploy plugins
   */
  async deployPlugins(
    planId: string,
    organizationId: string
  ): Promise<{
    deployment_id: string;
    status: 'started' | 'failed';
    steps: DeploymentStep[];
  }> {
    try {
      const plan = await this.getDeploymentPlan(planId);
      if (!plan) {
        throw new Error('Deployment plan not found');
      }

      if (plan.status !== 'approved') {
        throw new Error('Deployment plan must be approved before deployment');
      }

      // Create deployment steps
      const steps = await this.createDeploymentSteps(plan);

      // Update plan status
      await this.updateDeploymentPlanStatus(planId, 'deploying');

      // Start deployment process
      this.startDeploymentProcess(plan, steps);

      return {
        deployment_id: planId,
        status: 'started',
        steps
      };

    } catch (error) {
      console.error('Failed to deploy plugins:', error);
      throw error;
    }
  }

  /**
   * Create deployment steps
   */
  private async createDeploymentSteps(plan: DeploymentPlan): Promise<DeploymentStep[]> {
    const steps: DeploymentStep[] = [];

    for (const deploymentPlugin of plan.plugins) {
      const pluginSteps = [
        {
          step_type: 'pre_install' as const,
          order: 1
        },
        {
          step_type: 'install' as const,
          order: 2
        },
        {
          step_type: 'configure' as const,
          order: 3
        },
        {
          step_type: 'post_install' as const,
          order: 4
        },
        {
          step_type: 'verify' as const,
          order: 5
        }
      ];

      for (const stepData of pluginSteps) {
        const step: DeploymentStep = {
          id: this.generateStepId(),
          deployment_id: plan.id,
          plugin_id: deploymentPlugin.plugin_id,
          step_type: stepData.step_type,
          status: 'pending',
          logs: []
        };

        steps.push(step);

        // Store step in database
        await this.storeDeploymentStep(step);
      }
    }

    return steps;
  }

  /**
   * Start deployment process
   */
  private async startDeploymentProcess(plan: DeploymentPlan, steps: DeploymentStep[]): Promise<void> {
    try {
      // Process steps in order
      for (const step of steps) {
        await this.executeDeploymentStep(step);
      }

      // Update plan status to completed
      await this.updateDeploymentPlanStatus(plan.id, 'completed');

    } catch (error) {
      console.error('Deployment failed:', error);
      await this.updateDeploymentPlanStatus(plan.id, 'failed');
      await this.rollbackDeployment(plan.id);
    }
  }

  /**
   * Execute deployment step
   */
  private async executeDeploymentStep(step: DeploymentStep): Promise<void> {
    try {
      // Update step status to running
      await this.updateDeploymentStepStatus(step.id, 'running');

      // Execute step based on type
      switch (step.step_type) {
        case 'pre_install':
          await this.executePreInstallStep(step);
          break;
        case 'install':
          await this.executeInstallStep(step);
          break;
        case 'configure':
          await this.executeConfigureStep(step);
          break;
        case 'post_install':
          await this.executePostInstallStep(step);
          break;
        case 'verify':
          await this.executeVerifyStep(step);
          break;
        case 'rollback':
          await this.executeRollbackStep(step);
          break;
      }

      // Update step status to completed
      await this.updateDeploymentStepStatus(step.id, 'completed');

    } catch (error) {
      console.error(`Deployment step ${step.id} failed:`, error);
      await this.updateDeploymentStepStatus(step.id, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Execute pre-install step
   */
  private async executePreInstallStep(step: DeploymentStep): Promise<void> {
    // This would execute pre-installation tasks
    // Implementation depends on your specific requirements
    console.log(`Executing pre-install step for plugin ${step.plugin_id}`);
  }

  /**
   * Execute install step
   */
  private async executeInstallStep(step: DeploymentStep): Promise<void> {
    // This would execute installation tasks
    // Implementation depends on your specific requirements
    console.log(`Executing install step for plugin ${step.plugin_id}`);
  }

  /**
   * Execute configure step
   */
  private async executeConfigureStep(step: DeploymentStep): Promise<void> {
    // This would execute configuration tasks
    // Implementation depends on your specific requirements
    console.log(`Executing configure step for plugin ${step.plugin_id}`);
  }

  /**
   * Execute post-install step
   */
  private async executePostInstallStep(step: DeploymentStep): Promise<void> {
    // This would execute post-installation tasks
    // Implementation depends on your specific requirements
    console.log(`Executing post-install step for plugin ${step.plugin_id}`);
  }

  /**
   * Execute verify step
   */
  private async executeVerifyStep(step: DeploymentStep): Promise<void> {
    // This would execute verification tasks
    // Implementation depends on your specific requirements
    console.log(`Executing verify step for plugin ${step.plugin_id}`);
  }

  /**
   * Execute rollback step
   */
  private async executeRollbackStep(step: DeploymentStep): Promise<void> {
    // This would execute rollback tasks
    // Implementation depends on your specific requirements
    console.log(`Executing rollback step for plugin ${step.plugin_id}`);
  }

  /**
   * Rollback deployment
   */
  private async rollbackDeployment(deploymentId: string): Promise<void> {
    try {
      // This would implement rollback logic
      // Implementation depends on your specific requirements
      console.log(`Rolling back deployment ${deploymentId}`);
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  /**
   * Get deployment plan
   */
  private async getDeploymentPlan(planId: string): Promise<DeploymentPlan | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_deployment_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get deployment plan:', error);
      throw error;
    }
  }

  /**
   * Get plugin definition
   */
  private async getPluginDefinition(pluginId: string): Promise<PluginDefinition | null> {
    try {
      const { data, error } = await supabase
        .from('plugin_definitions')
        .select('*')
        .eq('id', pluginId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get plugin definition:', error);
      throw error;
    }
  }

  /**
   * Get deployment environment
   */
  private async getDeploymentEnvironment(
    environmentType: string,
    organizationId: string
  ): Promise<DeploymentEnvironment | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_deployment_environments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('environment_type', environmentType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get deployment environment:', error);
      throw error;
    }
  }

  /**
   * Update deployment plan status
   */
  private async updateDeploymentPlanStatus(
    planId: string,
    status: DeploymentPlan['status']
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_deployment_plans')
        .update({
          status,
          updated_at: new Date().toISOString(),
          deployed_at: status === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('id', planId);

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Failed to update deployment plan status:', error);
      throw error;
    }
  }

  /**
   * Store deployment step
   */
  private async storeDeploymentStep(step: DeploymentStep): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_deployment_steps')
        .insert({
          id: step.id,
          deployment_id: step.deployment_id,
          plugin_id: step.plugin_id,
          step_type: step.step_type,
          status: step.status,
          logs: step.logs
        });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Failed to store deployment step:', error);
      throw error;
    }
  }

  /**
   * Update deployment step status
   */
  private async updateDeploymentStepStatus(
    stepId: string,
    status: DeploymentStep['status'],
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_deployment_steps')
        .update({
          status,
          error_message: errorMessage,
          started_at: status === 'running' ? new Date().toISOString() : undefined,
          completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined
        })
        .eq('id', stepId);

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Failed to update deployment step status:', error);
      throw error;
    }
  }

  /**
   * Get deployment metrics
   */
  async getDeploymentMetrics(organizationId: string): Promise<DeploymentMetrics> {
    try {
      const { data, error } = await supabase
        .from('enterprise_deployment_plans')
        .select('status, created_at, deployed_at')
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(error.message);
      }

      const deployments = data || [];
      const totalDeployments = deployments.length;
      const successfulDeployments = deployments.filter(d => d.status === 'completed').length;
      const failedDeployments = deployments.filter(d => d.status === 'failed').length;

      // Calculate average deployment time
      const completedDeployments = deployments.filter(d => d.status === 'completed' && d.deployed_at);
      const averageDeploymentTime = completedDeployments.length > 0
        ? completedDeployments.reduce((sum, d) => {
            const start = new Date(d.created_at).getTime();
            const end = new Date(d.deployed_at).getTime();
            return sum + (end - start);
          }, 0) / completedDeployments.length
        : 0;

      // Count plugins deployed
      const pluginsDeployed = deployments.reduce((sum, d) => {
        return sum + (d.plugins?.length || 0);
      }, 0);

      // Count active environments
      const { data: environments } = await supabase
        .from('enterprise_deployment_environments')
        .select('id')
        .eq('organization_id', organizationId);

      return {
        total_deployments: totalDeployments,
        successful_deployments: successfulDeployments,
        failed_deployments: failedDeployments,
        average_deployment_time: averageDeploymentTime,
        plugins_deployed: pluginsDeployed,
        environments_active: environments?.length || 0
      };

    } catch (error) {
      console.error('Failed to get deployment metrics:', error);
      throw error;
    }
  }

  /**
   * Generate deployment ID
   */
  private generateDeploymentId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate step ID
   */
  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
