// Plugin Installation Service
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { PluginDefinition, PluginInstallation, PluginConfiguration } from '@/types/plugins/marketplace';
import { PluginManager } from './plugin-manager';
import { SandboxManager } from './sandbox-manager';
import { SecurityScanner } from './security-scanner';
import { ResourceMonitor } from './resource-monitor';
import { HealthMonitor } from './health-monitor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class PluginInstallationService {
  private pluginManager: PluginManager;
  private sandboxManager: SandboxManager;
  private securityScanner: SecurityScanner;
  private resourceMonitor: ResourceMonitor;
  private healthMonitor: HealthMonitor;

  constructor() {
    this.pluginManager = new PluginManager(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.sandboxManager = new SandboxManager();
    this.securityScanner = new SecurityScanner();
    this.resourceMonitor = new ResourceMonitor();
    this.healthMonitor = new HealthMonitor();
  }

  /**
   * Install a plugin for an organization
   */
  async installPlugin(
    pluginId: string,
    organizationId: string,
    configuration?: Partial<PluginConfiguration>
  ): Promise<PluginInstallation> {
    try {
      // Get plugin definition
      const plugin = await this.pluginManager.getPluginById(pluginId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      // Check if plugin is already installed
      const existingInstallation = await this.getInstallationByPlugin(pluginId, organizationId);
      if (existingInstallation) {
        throw new Error('Plugin is already installed');
      }

      // Validate plugin compatibility
      await this.validatePluginCompatibility(plugin, organizationId);

      // Perform security scan
      const securityScan = await this.securityScanner.scanPlugin(plugin);
      if (!securityScan.safe) {
        throw new Error(`Plugin failed security scan: ${securityScan.issues.join(', ')}`);
      }

      // Create installation record
      const installation = await this.createInstallationRecord(plugin, organizationId, configuration);

      // Initialize plugin in sandbox
      await this.sandboxManager.initializePlugin(installation);

      // Set up monitoring
      this.resourceMonitor.monitorExecution(installation.id, installation, {
        execution_id: 'init',
        status: 'success',
        output_data: {},
        execution_time_ms: 0,
        memory_usage_mb: 0,
        healthcare_data_accessed: false,
        compliance_validation: null,
        retry_count: 0,
        logs: [],
        metrics: {}
      });

      this.healthMonitor.monitorExecution(installation.id, installation, {
        execution_id: 'init',
        status: 'success',
        output_data: {},
        execution_time_ms: 0,
        memory_usage_mb: 0,
        healthcare_data_accessed: false,
        compliance_validation: null,
        retry_count: 0,
        logs: [],
        metrics: {}
      });

      // Update plugin installation count
      await this.updatePluginInstallationCount(pluginId);

      return installation;

    } catch (error) {
      console.error('Plugin installation failed:', error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(installationId: string): Promise<void> {
    try {
      // Get installation details
      const installation = await this.getInstallationById(installationId);
      if (!installation) {
        throw new Error('Installation not found');
      }

      // Check if plugin is active
      if (installation.status === 'active') {
        throw new Error('Plugin must be deactivated before uninstalling');
      }

      // Clean up sandbox environment
      await this.sandboxManager.cleanupPlugin(installationId);

      // Remove monitoring
      this.resourceMonitor.resetResourceUsage(installationId);
      this.healthMonitor.resetHealthStatus(installationId);

      // Delete installation record
      const { error } = await supabase
        .from('plugin_installations')
        .delete()
        .eq('id', installationId);

      if (error) {
        throw new Error(error.message);
      }

      // Update plugin installation count
      await this.updatePluginInstallationCount(installation.plugin_id, -1);

    } catch (error) {
      console.error('Plugin uninstallation failed:', error);
      throw error;
    }
  }

  /**
   * Update plugin installation
   */
  async updatePlugin(installationId: string, version: string): Promise<PluginInstallation> {
    try {
      // Get current installation
      const installation = await this.getInstallationById(installationId);
      if (!installation) {
        throw new Error('Installation not found');
      }

      // Get new plugin version
      const plugin = await this.pluginManager.getPluginById(installation.plugin_id);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      // Check if version exists
      if (plugin.version !== version) {
        throw new Error('Plugin version not found');
      }

      // Deactivate current installation
      await this.deactivatePlugin(installationId);

      // Update installation record
      const { data: updatedInstallation, error } = await supabase
        .from('plugin_installations')
        .update({
          version,
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', installationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return updatedInstallation;

    } catch (error) {
      console.error('Plugin update failed:', error);
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(installationId: string): Promise<PluginInstallation> {
    try {
      // Get installation details
      const installation = await this.getInstallationById(installationId);
      if (!installation) {
        throw new Error('Installation not found');
      }

      if (installation.status === 'active') {
        throw new Error('Plugin is already active');
      }

      // Validate plugin health
      const healthStatus = this.healthMonitor.getHealthStatus(installationId);
      if (healthStatus && healthStatus.status === 'unhealthy') {
        throw new Error('Plugin is unhealthy and cannot be activated');
      }

      // Update installation status
      const { data: updatedInstallation, error } = await supabase
        .from('plugin_installations')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', installationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Initialize in sandbox if not already done
      if (!this.sandboxManager.activeContainers.has(installationId)) {
        await this.sandboxManager.initializePlugin(updatedInstallation);
      }

      return updatedInstallation;

    } catch (error) {
      console.error('Plugin activation failed:', error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(installationId: string): Promise<PluginInstallation> {
    try {
      // Get installation details
      const installation = await this.getInstallationById(installationId);
      if (!installation) {
        throw new Error('Installation not found');
      }

      if (installation.status === 'inactive') {
        throw new Error('Plugin is already inactive');
      }

      // Update installation status
      const { data: updatedInstallation, error } = await supabase
        .from('plugin_installations')
        .update({
          status: 'inactive',
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', installationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Clean up sandbox environment
      await this.sandboxManager.cleanupPlugin(installationId);

      return updatedInstallation;

    } catch (error) {
      console.error('Plugin deactivation failed:', error);
      throw error;
    }
  }

  /**
   * Configure a plugin
   */
  async configurePlugin(
    installationId: string,
    configuration: Partial<PluginConfiguration>
  ): Promise<PluginInstallation> {
    try {
      // Get installation details
      const installation = await this.getInstallationById(installationId);
      if (!installation) {
        throw new Error('Installation not found');
      }

      // Validate configuration
      await this.validateConfiguration(installation, configuration);

      // Update installation configuration
      const { data: updatedInstallation, error } = await supabase
        .from('plugin_installations')
        .update({
          configuration: {
            ...installation.configuration,
            ...configuration.settings
          },
          permissions: {
            ...installation.permissions,
            ...configuration.permissions
          },
          resource_limits: {
            ...installation.resource_limits,
            ...configuration.resources
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', installationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Restart plugin in sandbox with new configuration
      if (installation.status === 'active') {
        await this.sandboxManager.cleanupPlugin(installationId);
        await this.sandboxManager.initializePlugin(updatedInstallation);
      }

      return updatedInstallation;

    } catch (error) {
      console.error('Plugin configuration failed:', error);
      throw error;
    }
  }

  /**
   * Get installation by ID
   */
  async getInstallationById(installationId: string): Promise<PluginInstallation | null> {
    try {
      const { data, error } = await supabase
        .from('plugin_installations')
        .select(`
          *,
          plugin_definitions:plugin_id (
            *
          )
        `)
        .eq('id', installationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get installation:', error);
      throw error;
    }
  }

  /**
   * Get installation by plugin and organization
   */
  async getInstallationByPlugin(
    pluginId: string,
    organizationId: string
  ): Promise<PluginInstallation | null> {
    try {
      const { data, error } = await supabase
        .from('plugin_installations')
        .select(`
          *,
          plugin_definitions:plugin_id (
            *
          )
        `)
        .eq('plugin_id', pluginId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get installation by plugin:', error);
      throw error;
    }
  }

  /**
   * Get all installations for an organization
   */
  async getInstallationsByOrganization(organizationId: string): Promise<PluginInstallation[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_installations')
        .select(`
          *,
          plugin_definitions:plugin_id (
            *
          )
        `)
        .eq('organization_id', organizationId)
        .order('installed_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get installations by organization:', error);
      throw error;
    }
  }

  /**
   * Create installation record
   */
  private async createInstallationRecord(
    plugin: PluginDefinition,
    organizationId: string,
    configuration?: Partial<PluginConfiguration>
  ): Promise<PluginInstallation> {
    const installationData = {
      plugin_id: plugin.id,
      organization_id: organizationId,
      version: plugin.version,
      status: 'inactive' as const,
      configuration: configuration?.settings || {},
      permissions: configuration?.permissions || {
        read: [],
        write: [],
        execute: false,
        network: false,
        file_system: false,
        database: false,
        healthcare_data: false,
        admin_functions: false,
        user_management: false,
        content_management: false,
        analytics_access: false
      },
      resource_limits: configuration?.resources || {
        memory: 128,
        cpu: 0.5,
        storage: 100,
        networkBandwidth: 10,
        executionTime: 30,
        concurrentExecutions: 1
      },
      installed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('plugin_installations')
      .insert(installationData)
      .select(`
        *,
        plugin_definitions:plugin_id (
          *
        )
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Validate plugin compatibility
   */
  private async validatePluginCompatibility(
    plugin: PluginDefinition,
    organizationId: string
  ): Promise<void> {
    // Check if plugin is compatible with organization's requirements
    // This could include checking:
    // - Organization's subscription level
    // - Required permissions
    // - Healthcare compliance requirements
    // - Resource availability

    // For now, we'll do basic validation
    if (plugin.status !== 'published') {
      throw new Error('Plugin is not available for installation');
    }

    if (plugin.healthcare_compliance?.hipaa && !plugin.healthcare_compliance.hipaa) {
      throw new Error('Plugin does not meet HIPAA compliance requirements');
    }
  }

  /**
   * Validate configuration
   */
  private async validateConfiguration(
    installation: PluginInstallation,
    configuration: Partial<PluginConfiguration>
  ): Promise<void> {
    // Validate resource limits
    if (configuration.resources) {
      const { memory, cpu, storage } = configuration.resources;
      
      if (memory && memory < 64) {
        throw new Error('Memory limit must be at least 64MB');
      }
      
      if (cpu && cpu < 0.1) {
        throw new Error('CPU limit must be at least 0.1 cores');
      }
      
      if (storage && storage < 10) {
        throw new Error('Storage limit must be at least 10MB');
      }
    }

    // Validate permissions
    if (configuration.permissions) {
      const { healthcare_data, admin_functions } = configuration.permissions;
      
      if (healthcare_data && !installation.plugin_definitions?.healthcare_compliance?.hipaa) {
        throw new Error('Plugin must be HIPAA compliant to access healthcare data');
      }
      
      if (admin_functions && !installation.plugin_definitions?.permissions?.admin_functions) {
        throw new Error('Plugin does not support admin functions');
      }
    }
  }

  /**
   * Update plugin installation count
   */
  private async updatePluginInstallationCount(pluginId: string, delta: number = 1): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_plugin_installation_count', {
        plugin_id: pluginId,
        delta: delta
      });

      if (error) {
        console.error('Failed to update plugin installation count:', error);
      }
    } catch (error) {
      console.error('Failed to update plugin installation count:', error);
    }
  }
}
