/**
 * Plugin Manager - Core plugin lifecycle and management
 * 
 * Handles plugin registration, activation, deactivation, and execution
 * with healthcare compliance and security validation.
 */

import { PluginDefinition, PluginInstallation, PluginExecution } from '../types/plugin-types';
import { HealthcareComplianceLevel } from '../types/healthcare-types';
import { AuditLogger } from '../utils/audit-logger';

export interface PluginManagerConfig {
  sandboxEnabled: boolean;
  complianceLevel: HealthcareComplianceLevel;
  resourceLimits: {
    memoryLimit: string;
    executionTimeout: number;
    apiCallLimit: number;
  };
  securityPolicies: {
    allowHealthcareDataAccess: boolean;
    requireComplianceValidation: boolean;
    enableAuditLogging: boolean;
  };
}

export class PluginManager {
  private plugins: Map<string, PluginDefinition> = new Map();
  private installations: Map<string, PluginInstallation> = new Map();
  private executions: Map<string, PluginExecution> = new Map();
  private auditLogger: AuditLogger;
  private config: PluginManagerConfig;

  constructor(config: PluginManagerConfig) {
    this.config = config;
    this.auditLogger = new AuditLogger({
      enableHealthcareAudit: config.securityPolicies.enableAuditLogging,
      complianceLevel: config.complianceLevel
    });
  }

  /**
   * Register a new plugin with the system
   */
  async registerPlugin(plugin: PluginDefinition): Promise<boolean> {
    try {
      // Validate plugin manifest
      if (!this.validatePluginManifest(plugin)) {
        throw new Error('Invalid plugin manifest');
      }

      // Healthcare compliance validation
      if (this.config.securityPolicies.requireComplianceValidation) {
        const complianceValid = await this.validateHealthcareCompliance(plugin);
        if (!complianceValid) {
          throw new Error('Plugin fails healthcare compliance validation');
        }
      }

      // Register plugin
      this.plugins.set(plugin.id, plugin);
      
      // Audit log
      await this.auditLogger.logPluginAction('register', plugin.id, {
        pluginName: plugin.name,
        version: plugin.version,
        complianceLevel: plugin.healthcare_compliance
      });

      return true;
    } catch (error) {
      console.error('Failed to register plugin:', error);
      return false;
    }
  }

  /**
   * Install plugin for an organization
   */
  async installPlugin(
    pluginId: string, 
    organizationId: string, 
    configuration: Record<string, any> = {}
  ): Promise<PluginInstallation | null> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    try {
      const installation: PluginInstallation = {
        id: this.generateId(),
        plugin_id: pluginId,
        organization_id: organizationId,
        version: plugin.version,
        configuration,
        permissions: this.generateDefaultPermissions(plugin),
        resource_limits: this.config.resourceLimits,
        sandbox_environment: this.config.sandboxEnabled,
        status: 'active',
        installed_by: 'system', // Would be actual user ID in real implementation
        installed_at: new Date(),
        last_updated: new Date()
      };

      this.installations.set(installation.id, installation);

      // Audit log
      await this.auditLogger.logPluginAction('install', pluginId, {
        organizationId,
        installationId: installation.id,
        configuration
      });

      return installation;
    } catch (error) {
      console.error('Failed to install plugin:', error);
      return null;
    }
  }

  /**
   * Execute plugin with healthcare data protection
   */
  async executePlugin(
    installationId: string,
    inputData: Record<string, any>,
    context: Record<string, any> = {}
  ): Promise<PluginExecution | null> {
    const installation = this.installations.get(installationId);
    if (!installation || installation.status !== 'active') {
      throw new Error('Plugin installation not found or inactive');
    }

    const plugin = this.plugins.get(installation.plugin_id);
    if (!plugin) {
      throw new Error('Plugin definition not found');
    }

    const startTime = Date.now();
    const executionId = this.generateId();

    try {
      // Healthcare data validation
      if (this.config.securityPolicies.allowHealthcareDataAccess) {
        const dataValidation = await this.validateHealthcareData(inputData);
        if (!dataValidation.valid) {
          throw new Error(`Healthcare data validation failed: ${dataValidation.errors.join(', ')}`);
        }
      }

      // Execute plugin in sandbox if enabled
      const result = this.config.sandboxEnabled 
        ? await this.executeInSandbox(plugin, inputData, context)
        : await this.executeDirectly(plugin, inputData, context);

      const executionTime = Date.now() - startTime;

      const execution: PluginExecution = {
        id: executionId,
        plugin_installation_id: installationId,
        execution_context: context,
        input_data: inputData,
        output_data: result,
        execution_time_ms: executionTime,
        memory_usage_mb: this.getMemoryUsage(),
        status: 'completed',
        error_message: null,
        healthcare_data_accessed: this.config.securityPolicies.allowHealthcareDataAccess,
        compliance_validation: {
          validated: true,
          compliance_level: plugin.healthcare_compliance?.compliance_level || 'standard',
          validated_at: new Date()
        },
        executed_at: new Date()
      };

      this.executions.set(executionId, execution);

      // Audit log
      await this.auditLogger.logPluginAction('execute', installation.plugin_id, {
        executionId,
        organizationId: installation.organization_id,
        executionTime,
        healthcareDataAccessed: execution.healthcare_data_accessed
      });

      return execution;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const execution: PluginExecution = {
        id: executionId,
        plugin_installation_id: installationId,
        execution_context: context,
        input_data: inputData,
        output_data: null,
        execution_time_ms: executionTime,
        memory_usage_mb: this.getMemoryUsage(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        healthcare_data_accessed: this.config.securityPolicies.allowHealthcareDataAccess,
        compliance_validation: {
          validated: false,
          compliance_level: 'standard',
          validated_at: new Date()
        },
        executed_at: new Date()
      };

      this.executions.set(executionId, execution);

      // Audit log
      await this.auditLogger.logPluginAction('execute_failed', installation.plugin_id, {
        executionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      });

      return execution;
    }
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): PluginDefinition | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin installations for organization
   */
  getOrganizationPlugins(organizationId: string): PluginInstallation[] {
    return Array.from(this.installations.values())
      .filter(installation => installation.organization_id === organizationId);
  }

  /**
   * Validate plugin manifest
   */
  private validatePluginManifest(plugin: PluginDefinition): boolean {
    return !!(
      plugin.id &&
      plugin.name &&
      plugin.version &&
      plugin.manifest &&
      plugin.healthcare_compliance
    );
  }

  /**
   * Validate healthcare compliance
   */
  private async validateHealthcareCompliance(plugin: PluginDefinition): Promise<boolean> {
    // Implementation would validate against healthcare compliance frameworks
    // For now, return true if compliance data exists
    return !!(plugin.healthcare_compliance && plugin.healthcare_compliance.compliance_level);
  }

  /**
   * Validate healthcare data
   */
  private async validateHealthcareData(_data: Record<string, any>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // Basic healthcare data validation
    // In real implementation, this would check for PHI, HIPAA compliance, etc.
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute plugin in sandbox
   */
  private async executeInSandbox(
    _plugin: PluginDefinition, 
    inputData: Record<string, any>, 
    _context: Record<string, any>
  ): Promise<Record<string, any>> {
    // Sandbox execution implementation
    // Would use Docker or similar containerization
    return { result: 'sandbox_execution', data: inputData };
  }

  /**
   * Execute plugin directly
   */
  private async executeDirectly(
    _plugin: PluginDefinition, 
    inputData: Record<string, any>, 
    _context: Record<string, any>
  ): Promise<Record<string, any>> {
    // Direct execution implementation
    return { result: 'direct_execution', data: inputData };
  }

  /**
   * Generate default permissions for plugin
   */
  private generateDefaultPermissions(_plugin: PluginDefinition): Record<string, any> {
    return {
      data_access_level: 'read_only',
      healthcare_data_access: this.config.securityPolicies.allowHealthcareDataAccess,
      ai_agent_interaction: false
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB
    }
    return 0;
  }
}
