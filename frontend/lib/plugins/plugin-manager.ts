// Plugin Manager - Core Plugin Lifecycle Management
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { 
  PluginDefinition, 
  PluginInstallation, 
  PluginExecution,
  PluginType,
  MarketplaceStatus,
  InstallationStatus,
  ExecutionStatus
} from '@/types/plugins/marketplace';
import { 
  InstallationRequest, 
  InstallationValidation,
  PluginConfiguration,
  InstallationProgress
} from '@/types/plugins/installation';
import { 
  ExecutionRequest, 
  ExecutionResponse,
  ExecutionContext
} from '@/types/plugins/execution';

export class PluginManager {
  private supabase: any;
  private sandboxManager: any;
  private securityScanner: any;
  private complianceValidator: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    // Initialize other managers (will be implemented in subsequent tasks)
    this.sandboxManager = null;
    this.securityScanner = null;
    this.complianceValidator = null;
  }

  /**
   * Install a plugin for an organization
   */
  async installPlugin(request: InstallationRequest): Promise<PluginInstallation> {
    try {
      // Validate installation request
      const validation = await this.validateInstallation(request);
      if (!validation.valid) {
        throw new Error(`Installation validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Get plugin definition
      const plugin = await this.getPluginDefinition(request.plugin_id);
      if (!plugin) {
        throw new Error(`Plugin not found: ${request.plugin_id}`);
      }

      // Check if plugin is already installed
      const existingInstallation = await this.getPluginInstallation(
        request.plugin_id, 
        request.organization_id
      );
      if (existingInstallation) {
        throw new Error('Plugin is already installed for this organization');
      }

      // Create installation record
      const installation = await this.createInstallationRecord(plugin, request);
      
      // Initialize plugin in sandbox
      await this.initializePluginInSandbox(installation);

      // Update installation count
      await this.updatePluginInstallationCount(plugin.id, 1);

      return installation;
    } catch (error) {
      console.error('Plugin installation failed:', error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin from an organization
   */
  async uninstallPlugin(installationId: string): Promise<void> {
    try {
      const installation = await this.getInstallationById(installationId);
      if (!installation) {
        throw new Error(`Installation not found: ${installationId}`);
      }

      // Stop all executions
      await this.stopAllExecutions(installationId);

      // Clean up sandbox environment
      await this.cleanupSandboxEnvironment(installationId);

      // Remove installation record
      await this.supabase
        .from('plugin_installations')
        .delete()
        .eq('id', installationId);

      // Update installation count
      await this.updatePluginInstallationCount(installation.plugin_id, -1);

    } catch (error) {
      console.error('Plugin uninstallation failed:', error);
      throw error;
    }
  }

  /**
   * Execute a plugin
   */
  async executePlugin(request: ExecutionRequest): Promise<ExecutionResponse> {
    try {
      const installation = await this.getInstallationById(request.installation_id);
      if (!installation) {
        throw new Error(`Installation not found: ${request.installation_id}`);
      }

      if (installation.status !== 'active') {
        throw new Error(`Plugin is not active: ${installation.status}`);
      }

      // Create execution record
      const execution = await this.createExecutionRecord(installation, request);

      try {
        // Execute in sandbox
        const result = await this.executeInSandbox(installation, request);
        
        // Update execution record with success
        await this.updateExecutionRecord(execution.id, {
          status: 'success',
          output_data: result.output_data,
          execution_time_ms: result.execution_time_ms,
          memory_usage_mb: result.memory_usage_mb,
          healthcare_data_accessed: result.healthcare_data_accessed,
          compliance_validation: result.compliance_validation
        });

        return {
          execution_id: execution.id,
          status: 'success',
          output_data: result.output_data,
          execution_time_ms: result.execution_time_ms,
          memory_usage_mb: result.memory_usage_mb,
          healthcare_data_accessed: result.healthcare_data_accessed,
          compliance_validation: result.compliance_validation,
          retry_count: 0,
          logs: result.logs || [],
          metrics: result.metrics || {}
        };

      } catch (error) {
        // Update execution record with error
        await this.updateExecutionRecord(execution.id, {
          status: 'error',
          error_message: error.message
        });

        return {
          execution_id: execution.id,
          status: 'error',
          error_message: error.message,
          execution_time_ms: 0,
          memory_usage_mb: 0,
          healthcare_data_accessed: false,
          retry_count: 0,
          logs: [],
          metrics: {}
        };
      }

    } catch (error) {
      console.error('Plugin execution failed:', error);
      throw error;
    }
  }

  /**
   * Get plugin definition by ID
   */
  async getPluginDefinition(pluginId: string): Promise<PluginDefinition | null> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_definitions')
        .select('*')
        .eq('id', pluginId)
        .single();

      if (error) {
        console.error('Error fetching plugin definition:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching plugin definition:', error);
      return null;
    }
  }

  /**
   * Get plugin installation by plugin ID and organization ID
   */
  async getPluginInstallation(pluginId: string, organizationId: string): Promise<PluginInstallation | null> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_installations')
        .select('*')
        .eq('plugin_id', pluginId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching plugin installation:', error);
      return null;
    }
  }

  /**
   * Get installation by ID
   */
  async getInstallationById(installationId: string): Promise<PluginInstallation | null> {
    try {
      const { data, error } = await this.supabase
        .from('plugin_installations')
        .select('*')
        .eq('id', installationId)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching installation:', error);
      return null;
    }
  }

  /**
   * Validate installation request
   */
  private async validateInstallation(request: InstallationRequest): Promise<InstallationValidation> {
    const errors: any[] = [];
    const warnings: any[] = [];
    const requirements: any[] = [];

    // Check if plugin exists
    const plugin = await this.getPluginDefinition(request.plugin_id);
    if (!plugin) {
      errors.push({
        code: 'PLUGIN_NOT_FOUND',
        message: 'Plugin not found',
        severity: 'error'
      });
    } else {
      // Check plugin status
      if (plugin.marketplace_status !== 'approved') {
        errors.push({
          code: 'PLUGIN_NOT_APPROVED',
          message: 'Plugin is not approved for installation',
          severity: 'error'
        });
      }

      // Check version compatibility
      if (request.version && request.version !== plugin.version) {
        warnings.push({
          code: 'VERSION_MISMATCH',
          message: `Requested version ${request.version} differs from latest ${plugin.version}`,
          recommendation: 'Consider using the latest version'
        });
      }

      // Check dependencies
      const dependencyCheck = await this.checkDependencies(plugin.id);
      requirements.push(...dependencyCheck);
    }

    // Check organization permissions
    const orgPermissions = await this.checkOrganizationPermissions(request.organization_id);
    requirements.push(...orgPermissions);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requirements
    };
  }

  /**
   * Create installation record
   */
  private async createInstallationRecord(plugin: PluginDefinition, request: InstallationRequest): Promise<PluginInstallation> {
    const installationData = {
      plugin_id: plugin.id,
      organization_id: request.organization_id,
      version: request.version || plugin.version,
      configuration: request.configuration || {},
      permissions: request.permissions || {},
      resource_limits: request.resource_limits || {},
      sandbox_environment: request.sandbox_environment !== false,
      status: 'active' as InstallationStatus,
      installed_by: request.organization_id, // TODO: Get from auth context
      installed_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('plugin_installations')
      .insert(installationData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create installation record: ${error.message}`);
    }

    return data;
  }

  /**
   * Create execution record
   */
  private async createExecutionRecord(installation: PluginInstallation, request: ExecutionRequest): Promise<PluginExecution> {
    const executionData = {
      plugin_installation_id: installation.id,
      execution_context: request.execution_context || {},
      input_data: request.input_data || {},
      status: 'running' as ExecutionStatus,
      executed_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('plugin_executions')
      .insert(executionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create execution record: ${error.message}`);
    }

    return data;
  }

  /**
   * Update execution record
   */
  private async updateExecutionRecord(executionId: string, updates: Partial<PluginExecution>): Promise<void> {
    const { error } = await this.supabase
      .from('plugin_executions')
      .update(updates)
      .eq('id', executionId);

    if (error) {
      throw new Error(`Failed to update execution record: ${error.message}`);
    }
  }

  /**
   * Update plugin installation count
   */
  private async updatePluginInstallationCount(pluginId: string, delta: number): Promise<void> {
    const { error } = await this.supabase
      .rpc('update_plugin_installation_count', {
        plugin_id: pluginId,
        delta: delta
      });

    if (error) {
      console.error('Failed to update installation count:', error);
    }
  }

  /**
   * Check plugin dependencies
   */
  private async checkDependencies(pluginId: string): Promise<any[]> {
    // TODO: Implement dependency checking
    return [];
  }

  /**
   * Check organization permissions
   */
  private async checkOrganizationPermissions(organizationId: string): Promise<any[]> {
    // TODO: Implement organization permission checking
    return [];
  }

  /**
   * Initialize plugin in sandbox
   */
  private async initializePluginInSandbox(installation: PluginInstallation): Promise<void> {
    // TODO: Implement sandbox initialization
    console.log('Initializing plugin in sandbox:', installation.id);
  }

  /**
   * Execute plugin in sandbox
   */
  private async executeInSandbox(installation: PluginInstallation, request: ExecutionRequest): Promise<any> {
    // TODO: Implement sandbox execution
    console.log('Executing plugin in sandbox:', installation.id);
    
    // Mock implementation
    return {
      output_data: { result: 'success' },
      execution_time_ms: 100,
      memory_usage_mb: 10,
      healthcare_data_accessed: false,
      compliance_validation: null,
      logs: [],
      metrics: {}
    };
  }

  /**
   * Stop all executions for an installation
   */
  private async stopAllExecutions(installationId: string): Promise<void> {
    // TODO: Implement execution stopping
    console.log('Stopping all executions for installation:', installationId);
  }

  /**
   * Cleanup sandbox environment
   */
  private async cleanupSandboxEnvironment(installationId: string): Promise<void> {
    // TODO: Implement sandbox cleanup
    console.log('Cleaning up sandbox environment:', installationId);
  }

  /**
   * Get plugin health status
   */
  async getPluginHealth(installationId: string): Promise<any> {
    // TODO: Implement health checking
    return {
      status: 'healthy',
      last_check: new Date().toISOString(),
      issues: [],
      recommendations: []
    };
  }

  /**
   * Get plugin usage statistics
   */
  async getPluginUsageStats(installationId: string, period: string): Promise<any> {
    // TODO: Implement usage statistics
    return {
      executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      average_execution_time: 0
    };
  }
}
