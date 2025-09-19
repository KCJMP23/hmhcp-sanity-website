// Plugin Backup and Restore Service
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { PluginInstallation } from '@/types/plugins/marketplace';
import { PluginConfiguration } from '@/types/plugins/installation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PluginBackup {
  id: string;
  installation_id: string;
  organization_id: string;
  plugin_id: string;
  version: string;
  configuration: PluginConfiguration;
  data: any;
  created_at: string;
  description?: string;
}

export interface BackupMetadata {
  totalBackups: number;
  totalSize: number;
  lastBackup: string | null;
  oldestBackup: string | null;
}

export class PluginBackupService {
  /**
   * Create a backup of a plugin installation
   */
  async createBackup(
    installationId: string,
    description?: string
  ): Promise<PluginBackup> {
    try {
      // Get installation details
      const installation = await this.getInstallationById(installationId);
      if (!installation) {
        throw new Error('Installation not found');
      }

      // Get plugin data
      const pluginData = await this.exportPluginData(installation);

      // Create backup record
      const backupData = {
        installation_id: installationId,
        organization_id: installation.organization_id,
        plugin_id: installation.plugin_id,
        version: installation.version,
        configuration: {
          settings: installation.configuration,
          permissions: installation.permissions,
          resources: installation.resource_limits
        },
        data: pluginData,
        description: description || `Backup created on ${new Date().toLocaleDateString()}`,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('plugin_backups')
        .insert(backupData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore a plugin from backup
   */
  async restoreFromBackup(
    backupId: string,
    targetInstallationId?: string
  ): Promise<PluginInstallation> {
    try {
      // Get backup details
      const backup = await this.getBackupById(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Get target installation
      let targetInstallation: PluginInstallation;
      if (targetInstallationId) {
        targetInstallation = await this.getInstallationById(targetInstallationId);
        if (!targetInstallation) {
          throw new Error('Target installation not found');
        }
      } else {
        // Create new installation
        targetInstallation = await this.createInstallationFromBackup(backup);
      }

      // Restore plugin data
      await this.importPluginData(targetInstallation, backup.data);

      // Update installation configuration
      const { data: updatedInstallation, error } = await supabase
        .from('plugin_installations')
        .update({
          configuration: backup.configuration.settings,
          permissions: backup.configuration.permissions,
          resource_limits: backup.configuration.resources,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetInstallation.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return updatedInstallation;

    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * Get all backups for an installation
   */
  async getInstallationBackups(installationId: string): Promise<PluginBackup[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_backups')
        .select('*')
        .eq('installation_id', installationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get installation backups:', error);
      throw error;
    }
  }

  /**
   * Get all backups for an organization
   */
  async getOrganizationBackups(organizationId: string): Promise<PluginBackup[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_backups')
        .select(`
          *,
          plugin_definitions:plugin_id (
            name,
            version
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get organization backups:', error);
      throw error;
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('plugin_backups')
        .delete()
        .eq('id', backupId);

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Get backup metadata
   */
  async getBackupMetadata(organizationId: string): Promise<BackupMetadata> {
    try {
      const { data, error } = await supabase
        .from('plugin_backups')
        .select('created_at, data')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const backups = data || [];
      const totalSize = backups.reduce((sum, backup) => {
        return sum + JSON.stringify(backup.data).length;
      }, 0);

      return {
        totalBackups: backups.length,
        totalSize,
        lastBackup: backups.length > 0 ? backups[0].created_at : null,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].created_at : null
      };

    } catch (error) {
      console.error('Failed to get backup metadata:', error);
      throw error;
    }
  }

  /**
   * Export plugin data
   */
  private async exportPluginData(installation: PluginInstallation): Promise<any> {
    try {
      // This would export plugin-specific data
      // Implementation depends on the plugin type and data structure
      
      const exportData = {
        installation: {
          id: installation.id,
          version: installation.version,
          status: installation.status,
          configuration: installation.configuration,
          permissions: installation.permissions,
          resource_limits: installation.resource_limits
        },
        plugin: {
          id: installation.plugin_id,
          name: installation.plugin_definitions?.name,
          version: installation.plugin_definitions?.version
        },
        metadata: {
          exported_at: new Date().toISOString(),
          exported_by: 'system', // This would be the actual user ID
          export_version: '1.0'
        }
      };

      // Add plugin-specific data based on plugin type
      if (installation.plugin_definitions?.plugin_type === 'data_processor') {
        exportData.data = await this.exportDataProcessorData(installation);
      } else if (installation.plugin_definitions?.plugin_type === 'workflow_automation') {
        exportData.data = await this.exportWorkflowData(installation);
      } else if (installation.plugin_definitions?.plugin_type === 'integration') {
        exportData.data = await this.exportIntegrationData(installation);
      }

      return exportData;

    } catch (error) {
      console.error('Failed to export plugin data:', error);
      throw error;
    }
  }

  /**
   * Import plugin data
   */
  private async importPluginData(installation: PluginInstallation, data: any): Promise<void> {
    try {
      // This would import plugin-specific data
      // Implementation depends on the plugin type and data structure

      if (data.data) {
        if (installation.plugin_definitions?.plugin_type === 'data_processor') {
          await this.importDataProcessorData(installation, data.data);
        } else if (installation.plugin_definitions?.plugin_type === 'workflow_automation') {
          await this.importWorkflowData(installation, data.data);
        } else if (installation.plugin_definitions?.plugin_type === 'integration') {
          await this.importIntegrationData(installation, data.data);
        }
      }

    } catch (error) {
      console.error('Failed to import plugin data:', error);
      throw error;
    }
  }

  /**
   * Export data processor plugin data
   */
  private async exportDataProcessorData(installation: PluginInstallation): Promise<any> {
    // This would export data processor specific data
    // such as processing rules, data mappings, etc.
    return {
      processing_rules: [],
      data_mappings: [],
      output_formats: []
    };
  }

  /**
   * Export workflow automation plugin data
   */
  private async exportWorkflowData(installation: PluginInstallation): Promise<any> {
    // This would export workflow specific data
    // such as workflow definitions, triggers, actions, etc.
    return {
      workflows: [],
      triggers: [],
      actions: []
    };
  }

  /**
   * Export integration plugin data
   */
  private async exportIntegrationData(installation: PluginInstallation): Promise<any> {
    // This would export integration specific data
    // such as API configurations, connection settings, etc.
    return {
      api_configurations: [],
      connection_settings: [],
      sync_rules: []
    };
  }

  /**
   * Import data processor plugin data
   */
  private async importDataProcessorData(installation: PluginInstallation, data: any): Promise<void> {
    // This would import data processor specific data
    console.log('Importing data processor data for installation:', installation.id);
  }

  /**
   * Import workflow automation plugin data
   */
  private async importWorkflowData(installation: PluginInstallation, data: any): Promise<void> {
    // This would import workflow specific data
    console.log('Importing workflow data for installation:', installation.id);
  }

  /**
   * Import integration plugin data
   */
  private async importIntegrationData(installation: PluginInstallation, data: any): Promise<void> {
    // This would import integration specific data
    console.log('Importing integration data for installation:', installation.id);
  }

  /**
   * Create installation from backup
   */
  private async createInstallationFromBackup(backup: PluginBackup): Promise<PluginInstallation> {
    try {
      const installationData = {
        plugin_id: backup.plugin_id,
        organization_id: backup.organization_id,
        version: backup.version,
        status: 'inactive',
        configuration: backup.configuration.settings,
        permissions: backup.configuration.permissions,
        resource_limits: backup.configuration.resources,
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('plugin_installations')
        .insert(installationData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to create installation from backup:', error);
      throw error;
    }
  }

  /**
   * Get installation by ID
   */
  private async getInstallationById(installationId: string): Promise<PluginInstallation | null> {
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
          return null;
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
   * Get backup by ID
   */
  private async getBackupById(backupId: string): Promise<PluginBackup | null> {
    try {
      const { data, error } = await supabase
        .from('plugin_backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get backup:', error);
      throw error;
    }
  }
}
