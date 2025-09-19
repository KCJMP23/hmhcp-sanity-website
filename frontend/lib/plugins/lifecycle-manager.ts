// Plugin Lifecycle Manager
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { EventEmitter } from 'events';
import { PluginInstallation } from '@/types/plugins/marketplace';
import { PluginInstallationService } from './installation-service';
import { SandboxManager } from './sandbox-manager';
import { ResourceMonitor } from './resource-monitor';
import { HealthMonitor } from './health-monitor';

export class PluginLifecycleManager extends EventEmitter {
  private installationService: PluginInstallationService;
  private sandboxManager: SandboxManager;
  private resourceMonitor: ResourceMonitor;
  private healthMonitor: HealthMonitor;
  private lifecycleInterval: NodeJS.Timeout | null = null;
  private maintenanceInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.installationService = new PluginInstallationService();
    this.sandboxManager = new SandboxManager();
    this.resourceMonitor = new ResourceMonitor();
    this.healthMonitor = new HealthMonitor();
    
    this.startLifecycleMonitoring();
    this.startMaintenanceTasks();
  }

  /**
   * Start lifecycle monitoring
   */
  private startLifecycleMonitoring(): void {
    this.lifecycleInterval = setInterval(() => {
      this.performLifecycleChecks();
    }, 60000); // Check every minute
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    this.maintenanceInterval = setInterval(() => {
      this.performMaintenanceTasks();
    }, 300000); // Every 5 minutes
  }

  /**
   * Perform lifecycle checks
   */
  private async performLifecycleChecks(): Promise<void> {
    try {
      // Check for unhealthy plugins
      const healthStats = this.healthMonitor.getHealthStatistics();
      
      if (healthStats.unhealthyInstallations > 0) {
        this.emit('healthAlert', {
          type: 'unhealthy_plugins',
          count: healthStats.unhealthyInstallations,
          timestamp: new Date().toISOString()
        });
      }

      // Check for resource issues
      const resourceStats = this.resourceMonitor.getResourceStatistics();
      
      if (resourceStats.averageErrorRate > 0.1) { // 10% error rate
        this.emit('resourceAlert', {
          type: 'high_error_rate',
          rate: resourceStats.averageErrorRate,
          timestamp: new Date().toISOString()
        });
      }

      // Check sandbox health
      const sandboxHealthy = await this.sandboxManager.healthCheck();
      if (!sandboxHealthy) {
        this.emit('sandboxAlert', {
          type: 'sandbox_unhealthy',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Lifecycle check failed:', error);
    }
  }

  /**
   * Perform maintenance tasks
   */
  private async performMaintenanceTasks(): Promise<void> {
    try {
      // Clean up old execution logs
      await this.cleanupOldExecutionLogs();
      
      // Update plugin health statuses
      await this.updatePluginHealthStatuses();
      
      // Clean up inactive containers
      await this.cleanupInactiveContainers();
      
      // Update plugin statistics
      await this.updatePluginStatistics();

    } catch (error) {
      console.error('Maintenance task failed:', error);
    }
  }

  /**
   * Install plugin with lifecycle management
   */
  async installPlugin(
    pluginId: string,
    organizationId: string,
    configuration?: any
  ): Promise<PluginInstallation> {
    try {
      this.emit('pluginInstallationStarted', { pluginId, organizationId });
      
      const installation = await this.installationService.installPlugin(
        pluginId,
        organizationId,
        configuration
      );

      this.emit('pluginInstalled', { installation });
      
      return installation;

    } catch (error) {
      this.emit('pluginInstallationFailed', { pluginId, organizationId, error: error.message });
      throw error;
    }
  }

  /**
   * Uninstall plugin with lifecycle management
   */
  async uninstallPlugin(installationId: string): Promise<void> {
    try {
      this.emit('pluginUninstallationStarted', { installationId });
      
      await this.installationService.uninstallPlugin(installationId);

      this.emit('pluginUninstalled', { installationId });

    } catch (error) {
      this.emit('pluginUninstallationFailed', { installationId, error: error.message });
      throw error;
    }
  }

  /**
   * Update plugin with lifecycle management
   */
  async updatePlugin(installationId: string, version: string): Promise<PluginInstallation> {
    try {
      this.emit('pluginUpdateStarted', { installationId, version });
      
      const installation = await this.installationService.updatePlugin(installationId, version);

      this.emit('pluginUpdated', { installation });
      
      return installation;

    } catch (error) {
      this.emit('pluginUpdateFailed', { installationId, version, error: error.message });
      throw error;
    }
  }

  /**
   * Activate plugin with lifecycle management
   */
  async activatePlugin(installationId: string): Promise<PluginInstallation> {
    try {
      this.emit('pluginActivationStarted', { installationId });
      
      const installation = await this.installationService.activatePlugin(installationId);

      this.emit('pluginActivated', { installation });
      
      return installation;

    } catch (error) {
      this.emit('pluginActivationFailed', { installationId, error: error.message });
      throw error;
    }
  }

  /**
   * Deactivate plugin with lifecycle management
   */
  async deactivatePlugin(installationId: string): Promise<PluginInstallation> {
    try {
      this.emit('pluginDeactivationStarted', { installationId });
      
      const installation = await this.installationService.deactivatePlugin(installationId);

      this.emit('pluginDeactivated', { installation });
      
      return installation;

    } catch (error) {
      this.emit('pluginDeactivationFailed', { installationId, error: error.message });
      throw error;
    }
  }

  /**
   * Configure plugin with lifecycle management
   */
  async configurePlugin(
    installationId: string,
    configuration: any
  ): Promise<PluginInstallation> {
    try {
      this.emit('pluginConfigurationStarted', { installationId, configuration });
      
      const installation = await this.installationService.configurePlugin(
        installationId,
        configuration
      );

      this.emit('pluginConfigured', { installation });
      
      return installation;

    } catch (error) {
      this.emit('pluginConfigurationFailed', { installationId, error: error.message });
      throw error;
    }
  }

  /**
   * Get plugin lifecycle status
   */
  async getPluginLifecycleStatus(installationId: string): Promise<{
    status: string;
    health: any;
    resources: any;
    lastExecution: any;
    issues: any[];
  }> {
    try {
      const installation = await this.installationService.getInstallationById(installationId);
      if (!installation) {
        throw new Error('Installation not found');
      }

      const health = this.healthMonitor.getHealthStatus(installationId);
      const resources = this.resourceMonitor.getResourceUsage(installationId);
      
      const issues = [];
      
      if (health && health.status === 'unhealthy') {
        issues.push({
          type: 'health',
          severity: 'critical',
          message: 'Plugin is unhealthy',
          details: health.issues
        });
      }

      if (resources && resources.errorRate > 0.1) {
        issues.push({
          type: 'performance',
          severity: 'warning',
          message: 'High error rate detected',
          details: { errorRate: resources.errorRate }
        });
      }

      return {
        status: installation.status,
        health,
        resources,
        lastExecution: resources?.lastExecution || null,
        issues
      };

    } catch (error) {
      console.error('Failed to get plugin lifecycle status:', error);
      throw error;
    }
  }

  /**
   * Get all plugin lifecycle statuses for an organization
   */
  async getOrganizationPluginStatuses(organizationId: string): Promise<any[]> {
    try {
      const installations = await this.installationService.getInstallationsByOrganization(organizationId);
      
      const statuses = await Promise.all(
        installations.map(async (installation) => {
          const status = await this.getPluginLifecycleStatus(installation.id);
          return {
            installation,
            ...status
          };
        })
      );

      return statuses;

    } catch (error) {
      console.error('Failed to get organization plugin statuses:', error);
      throw error;
    }
  }

  /**
   * Clean up old execution logs
   */
  private async cleanupOldExecutionLogs(): Promise<void> {
    try {
      // This would clean up old execution logs from the database
      // Implementation depends on your data retention policy
      console.log('Cleaning up old execution logs...');
    } catch (error) {
      console.error('Failed to cleanup old execution logs:', error);
    }
  }

  /**
   * Update plugin health statuses
   */
  private async updatePluginHealthStatuses(): Promise<void> {
    try {
      // This would update health statuses in the database
      // based on current monitoring data
      console.log('Updating plugin health statuses...');
    } catch (error) {
      console.error('Failed to update plugin health statuses:', error);
    }
  }

  /**
   * Clean up inactive containers
   */
  private async cleanupInactiveContainers(): Promise<void> {
    try {
      // Clean up containers that have been inactive for too long
      const sandboxStats = await this.sandboxManager.getSandboxStats();
      
      // This would implement logic to clean up inactive containers
      console.log('Cleaning up inactive containers...');
    } catch (error) {
      console.error('Failed to cleanup inactive containers:', error);
    }
  }

  /**
   * Update plugin statistics
   */
  private async updatePluginStatistics(): Promise<void> {
    try {
      // This would update plugin statistics in the database
      // based on current usage data
      console.log('Updating plugin statistics...');
    } catch (error) {
      console.error('Failed to update plugin statistics:', error);
    }
  }

  /**
   * Get lifecycle statistics
   */
  getLifecycleStatistics(): {
    totalPlugins: number;
    activePlugins: number;
    inactivePlugins: number;
    unhealthyPlugins: number;
    averageUptime: number;
    totalExecutions: number;
  } {
    const healthStats = this.healthMonitor.getHealthStatistics();
    const resourceStats = this.resourceMonitor.getResourceStatistics();
    
    return {
      totalPlugins: healthStats.totalInstallations,
      activePlugins: healthStats.healthyInstallations,
      inactivePlugins: healthStats.degradedInstallations,
      unhealthyPlugins: healthStats.unhealthyInstallations,
      averageUptime: healthStats.averageUptime,
      totalExecutions: resourceStats.totalExecutions
    };
  }

  /**
   * Cleanup lifecycle manager
   */
  cleanup(): void {
    if (this.lifecycleInterval) {
      clearInterval(this.lifecycleInterval);
    }
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    
    this.sandboxManager.cleanupAll();
    this.resourceMonitor.cleanup();
    this.healthMonitor.cleanup();
  }
}
