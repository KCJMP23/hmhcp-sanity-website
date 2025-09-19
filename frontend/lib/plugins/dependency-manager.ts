// Plugin Dependency Manager
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { PluginDefinition, PluginInstallation } from '@/types/plugins/marketplace';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PluginDependency {
  id: string;
  plugin_id: string;
  dependency_plugin_id: string;
  dependency_type: 'required' | 'optional' | 'conflicts';
  min_version?: string;
  max_version?: string;
  created_at: string;
  updated_at: string;
}

export interface DependencyResolution {
  canInstall: boolean;
  canActivate: boolean;
  conflicts: string[];
  missing: string[];
  outdated: string[];
  recommendations: string[];
}

export class PluginDependencyManager {
  /**
   * Check if a plugin can be installed based on dependencies
   */
  async checkInstallationDependencies(
    pluginId: string,
    organizationId: string
  ): Promise<DependencyResolution> {
    try {
      // Get plugin dependencies
      const dependencies = await this.getPluginDependencies(pluginId);
      
      // Get installed plugins for organization
      const installedPlugins = await this.getInstalledPlugins(organizationId);
      
      const resolution: DependencyResolution = {
        canInstall: true,
        canActivate: true,
        conflicts: [],
        missing: [],
        outdated: [],
        recommendations: []
      };

      for (const dependency of dependencies) {
        const installedPlugin = installedPlugins.find(
          p => p.plugin_id === dependency.dependency_plugin_id
        );

        if (dependency.dependency_type === 'required') {
          if (!installedPlugin) {
            resolution.canInstall = false;
            resolution.missing.push(dependency.dependency_plugin_id);
          } else if (!this.isVersionCompatible(installedPlugin.version, dependency)) {
            resolution.canInstall = false;
            resolution.outdated.push(dependency.dependency_plugin_id);
          }
        } else if (dependency.dependency_type === 'conflicts') {
          if (installedPlugin) {
            resolution.canInstall = false;
            resolution.conflicts.push(dependency.dependency_plugin_id);
          }
        } else if (dependency.dependency_type === 'optional') {
          if (!installedPlugin) {
            resolution.recommendations.push(dependency.dependency_plugin_id);
          }
        }
      }

      // Check for activation conflicts
      resolution.canActivate = resolution.canInstall && resolution.conflicts.length === 0;

      return resolution;

    } catch (error) {
      console.error('Failed to check installation dependencies:', error);
      throw error;
    }
  }

  /**
   * Check if a plugin can be activated based on dependencies
   */
  async checkActivationDependencies(
    installationId: string,
    organizationId: string
  ): Promise<DependencyResolution> {
    try {
      // Get installation details
      const { data: installation, error: installationError } = await supabase
        .from('plugin_installations')
        .select('*')
        .eq('id', installationId)
        .single();

      if (installationError || !installation) {
        throw new Error('Installation not found');
      }

      // Get plugin dependencies
      const dependencies = await this.getPluginDependencies(installation.plugin_id);
      
      // Get active plugins for organization
      const activePlugins = await this.getActivePlugins(organizationId);
      
      const resolution: DependencyResolution = {
        canInstall: true,
        canActivate: true,
        conflicts: [],
        missing: [],
        outdated: [],
        recommendations: []
      };

      for (const dependency of dependencies) {
        const activePlugin = activePlugins.find(
          p => p.plugin_id === dependency.dependency_plugin_id
        );

        if (dependency.dependency_type === 'required') {
          if (!activePlugin) {
            resolution.canActivate = false;
            resolution.missing.push(dependency.dependency_plugin_id);
          } else if (!this.isVersionCompatible(activePlugin.version, dependency)) {
            resolution.canActivate = false;
            resolution.outdated.push(dependency.dependency_plugin_id);
          }
        } else if (dependency.dependency_type === 'conflicts') {
          if (activePlugin) {
            resolution.canActivate = false;
            resolution.conflicts.push(dependency.dependency_plugin_id);
          }
        }
      }

      return resolution;

    } catch (error) {
      console.error('Failed to check activation dependencies:', error);
      throw error;
    }
  }

  /**
   * Get plugin dependencies
   */
  async getPluginDependencies(pluginId: string): Promise<PluginDependency[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_dependencies')
        .select('*')
        .eq('plugin_id', pluginId);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get plugin dependencies:', error);
      throw error;
    }
  }

  /**
   * Add plugin dependency
   */
  async addPluginDependency(
    pluginId: string,
    dependencyPluginId: string,
    dependencyType: 'required' | 'optional' | 'conflicts',
    minVersion?: string,
    maxVersion?: string
  ): Promise<PluginDependency> {
    try {
      const { data, error } = await supabase
        .from('plugin_dependencies')
        .insert({
          plugin_id: pluginId,
          dependency_plugin_id: dependencyPluginId,
          dependency_type: dependencyType,
          min_version: minVersion,
          max_version: maxVersion,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to add plugin dependency:', error);
      throw error;
    }
  }

  /**
   * Remove plugin dependency
   */
  async removePluginDependency(
    pluginId: string,
    dependencyPluginId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('plugin_dependencies')
        .delete()
        .eq('plugin_id', pluginId)
        .eq('dependency_plugin_id', dependencyPluginId);

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Failed to remove plugin dependency:', error);
      throw error;
    }
  }

  /**
   * Get dependency tree for a plugin
   */
  async getDependencyTree(pluginId: string): Promise<{
    plugin: PluginDefinition;
    dependencies: PluginDependency[];
    dependents: PluginDependency[];
  }> {
    try {
      // Get plugin details
      const { data: plugin, error: pluginError } = await supabase
        .from('plugin_definitions')
        .select('*')
        .eq('id', pluginId)
        .single();

      if (pluginError || !plugin) {
        throw new Error('Plugin not found');
      }

      // Get dependencies (plugins this plugin depends on)
      const dependencies = await this.getPluginDependencies(pluginId);

      // Get dependents (plugins that depend on this plugin)
      const { data: dependents, error: dependentsError } = await supabase
        .from('plugin_dependencies')
        .select('*')
        .eq('dependency_plugin_id', pluginId);

      if (dependentsError) {
        throw new Error(dependentsError.message);
      }

      return {
        plugin,
        dependencies,
        dependents: dependents || []
      };

    } catch (error) {
      console.error('Failed to get dependency tree:', error);
      throw error;
    }
  }

  /**
   * Get all plugins that depend on a specific plugin
   */
  async getDependentPlugins(pluginId: string): Promise<PluginDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_dependencies')
        .select(`
          plugin_definitions:plugin_id (
            *
          )
        `)
        .eq('dependency_plugin_id', pluginId);

      if (error) {
        throw new Error(error.message);
      }

      return data?.map(item => item.plugin_definitions).filter(Boolean) || [];

    } catch (error) {
      console.error('Failed to get dependent plugins:', error);
      throw error;
    }
  }

  /**
   * Check for circular dependencies
   */
  async checkCircularDependencies(pluginId: string): Promise<{
    hasCircularDependency: boolean;
    circularPath: string[];
  }> {
    try {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      const path: string[] = [];

      const hasCircularDependency = await this.detectCircularDependency(
        pluginId,
        visited,
        recursionStack,
        path
      );

      return {
        hasCircularDependency,
        circularPath: hasCircularDependency ? path : []
      };

    } catch (error) {
      console.error('Failed to check circular dependencies:', error);
      throw error;
    }
  }

  /**
   * Detect circular dependency recursively
   */
  private async detectCircularDependency(
    pluginId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): Promise<boolean> {
    if (recursionStack.has(pluginId)) {
      return true; // Circular dependency detected
    }

    if (visited.has(pluginId)) {
      return false; // Already processed
    }

    visited.add(pluginId);
    recursionStack.add(pluginId);
    path.push(pluginId);

    const dependencies = await this.getPluginDependencies(pluginId);
    
    for (const dependency of dependencies) {
      if (dependency.dependency_type === 'required' || dependency.dependency_type === 'optional') {
        const hasCircular = await this.detectCircularDependency(
          dependency.dependency_plugin_id,
          visited,
          recursionStack,
          path
        );
        
        if (hasCircular) {
          return true;
        }
      }
    }

    recursionStack.delete(pluginId);
    path.pop();
    return false;
  }

  /**
   * Get installed plugins for organization
   */
  private async getInstalledPlugins(organizationId: string): Promise<PluginInstallation[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_installations')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get installed plugins:', error);
      throw error;
    }
  }

  /**
   * Get active plugins for organization
   */
  private async getActivePlugins(organizationId: string): Promise<PluginInstallation[]> {
    try {
      const { data, error } = await supabase
        .from('plugin_installations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get active plugins:', error);
      throw error;
    }
  }

  /**
   * Check if version is compatible with dependency
   */
  private isVersionCompatible(version: string, dependency: PluginDependency): boolean {
    if (!dependency.min_version && !dependency.max_version) {
      return true;
    }

    const versionParts = version.split('.').map(Number);
    const minParts = dependency.min_version?.split('.').map(Number) || [0, 0, 0];
    const maxParts = dependency.max_version?.split('.').map(Number) || [999, 999, 999];

    // Compare version with min_version
    for (let i = 0; i < Math.max(versionParts.length, minParts.length); i++) {
      const v = versionParts[i] || 0;
      const min = minParts[i] || 0;
      
      if (v > min) break;
      if (v < min) return false;
    }

    // Compare version with max_version
    for (let i = 0; i < Math.max(versionParts.length, maxParts.length); i++) {
      const v = versionParts[i] || 0;
      const max = maxParts[i] || 999;
      
      if (v < max) break;
      if (v > max) return false;
    }

    return true;
  }
}
