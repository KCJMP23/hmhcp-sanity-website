/**
 * Dashboard Builder - Drag-and-drop dashboard customization system
 * Healthcare-focused dashboard builder with compliance validation
 */

import { 
  DashboardBuilder,
  Dashboard,
  DashboardConfig,
  DashboardLayout,
  DashboardWidget,
  WidgetPosition,
  WidgetSize,
  SharePermissions,
  ShareResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DashboardPermissions
} from '@/types/dashboard/dashboard-types';

export class DashboardBuilderService implements DashboardBuilder {
  private dashboards: Map<string, Dashboard> = new Map();
  private widgetLibrary: Map<string, any> = new Map();

  /**
   * Create a new dashboard
   */
  async createDashboard(organizationId: string, config: DashboardConfig): Promise<Dashboard> {
    try {
      // Validate dashboard configuration
      const validation = await this.validateDashboard(config);
      if (!validation.valid) {
        throw new Error(`Dashboard validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Generate unique dashboard ID
      const dashboardId = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create dashboard layout
      const layout: DashboardLayout = {
        layout_type: config.layout_type,
        columns: config.columns,
        rows: config.rows,
        regions: this.createDefaultRegions(config),
        widgets: [],
        customizable: true
      };

      // Create dashboard
      const dashboard: Dashboard = {
        id: dashboardId,
        name: config.name,
        description: config.description,
        organization_id: organizationId,
        config,
        widgets: [],
        layout,
        permissions: this.createDefaultPermissions(organizationId),
        healthcare_optimized: config.healthcare_optimized,
        accessibility_compliant: config.accessibility_enhanced,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system' // TODO: Get actual user ID
      };

      // Store dashboard
      this.dashboards.set(dashboardId, dashboard);

      // Log dashboard creation
      await this.logDashboardEvent('dashboard_created', dashboardId, organizationId, {
        config,
        healthcare_optimized: config.healthcare_optimized
      });

      return dashboard;
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      throw new Error(`Failed to create dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing dashboard
   */
  async updateDashboard(dashboardId: string, config: Partial<DashboardConfig>): Promise<Dashboard> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      // Validate updated configuration
      const updatedConfig = { ...dashboard.config, ...config };
      const validation = await this.validateDashboard(updatedConfig);
      if (!validation.valid) {
        throw new Error(`Dashboard validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Update dashboard
      const updatedDashboard: Dashboard = {
        ...dashboard,
        name: updatedConfig.name,
        description: updatedConfig.description,
        config: updatedConfig,
        updated_at: new Date().toISOString()
      };

      this.dashboards.set(dashboardId, updatedDashboard);

      // Log dashboard update
      await this.logDashboardEvent('dashboard_updated', dashboardId, dashboard.organization_id, {
        changes: config,
        healthcare_optimized: updatedConfig.healthcare_optimized
      });

      return updatedDashboard;
    } catch (error) {
      console.error('Failed to update dashboard:', error);
      throw new Error(`Failed to update dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Check permissions
      if (!this.hasPermission(dashboard, 'admin')) {
        throw new Error('Insufficient permissions to delete dashboard');
      }

      // Delete dashboard
      this.dashboards.delete(dashboardId);

      // Log dashboard deletion
      await this.logDashboardEvent('dashboard_deleted', dashboardId, dashboard.organization_id, {
        healthcare_optimized: dashboard.healthcare_optimized
      });
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get a dashboard by ID
   */
  async getDashboard(dashboardId: string): Promise<Dashboard> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      return dashboard;
    } catch (error) {
      console.error('Failed to get dashboard:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get dashboards by organization
   */
  async getDashboardsByOrganization(organizationId: string): Promise<Dashboard[]> {
    try {
      const organizationDashboards = Array.from(this.dashboards.values())
        .filter(dashboard => dashboard.organization_id === organizationId);

      return organizationDashboards;
    } catch (error) {
      console.error('Failed to get organization dashboards:', error);
      throw new Error(`Failed to get organization dashboards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clone a dashboard
   */
  async cloneDashboard(dashboardId: string, newName: string): Promise<Dashboard> {
    try {
      const originalDashboard = await this.getDashboard(dashboardId);
      
      // Create new dashboard configuration
      const clonedConfig: DashboardConfig = {
        ...originalDashboard.config,
        name: newName,
        description: `Cloned from ${originalDashboard.name}`
      };

      // Create cloned dashboard
      const clonedDashboard = await this.createDashboard(
        originalDashboard.organization_id,
        clonedConfig
      );

      // Copy widgets
      for (const widget of originalDashboard.widgets) {
        await this.addWidgetToDashboard(clonedDashboard.id, {
          ...widget,
          id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      }

      // Log dashboard cloning
      await this.logDashboardEvent('dashboard_cloned', clonedDashboard.id, originalDashboard.organization_id, {
        original_dashboard_id: dashboardId,
        healthcare_optimized: originalDashboard.healthcare_optimized
      });

      return clonedDashboard;
    } catch (error) {
      console.error('Failed to clone dashboard:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Share a dashboard
   */
  async shareDashboard(dashboardId: string, permissions: SharePermissions): Promise<ShareResult> {
    try {
      const dashboard = await this.getDashboard(dashboardId);

      // Validate permissions
      if (!this.hasPermission(dashboard, 'admin')) {
        throw new Error('Insufficient permissions to share dashboard');
      }

      // Generate share URL and code
      const shareCode = this.generateShareCode();
      const shareUrl = `${window.location.origin}/dashboard/shared/${shareCode}`;

      // Update dashboard permissions
      dashboard.permissions = {
        ...dashboard.permissions,
        view: permissions.public ? ['*'] : permissions.specific_users,
        healthcare_data_access: permissions.healthcare_data_access ? 
          permissions.specific_users : dashboard.permissions.healthcare_data_access
      };

      this.dashboards.set(dashboardId, dashboard);

      // Log dashboard sharing
      await this.logDashboardEvent('dashboard_shared', dashboardId, dashboard.organization_id, {
        permissions,
        share_code: shareCode,
        healthcare_data_access: permissions.healthcare_data_access
      });

      return {
        success: true,
        share_url: shareUrl,
        share_code: shareCode,
        permissions,
        healthcare_compliant: dashboard.healthcare_optimized
      };
    } catch (error) {
      console.error('Failed to share dashboard:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Validate dashboard configuration
   */
  async validateDashboard(config: DashboardConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let healthcareCompliant = true;
    let accessibilityCompliant = true;

    // Validate required fields
    if (!config.name) {
      errors.push({
        field: 'name',
        message: 'Dashboard name is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide a dashboard name'
      });
    }

    if (!config.description) {
      warnings.push({
        field: 'description',
        message: 'Dashboard description is recommended',
        recommendation: 'Add a description to help users understand the dashboard purpose',
        healthcare_impact: false
      });
    }

    // Validate layout configuration
    if (config.columns < 1 || config.columns > 24) {
      errors.push({
        field: 'columns',
        message: 'Columns must be between 1 and 24',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Set columns between 1 and 24'
      });
    }

    if (config.rows < 1 || config.rows > 50) {
      errors.push({
        field: 'rows',
        message: 'Rows must be between 1 and 50',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Set rows between 1 and 50'
      });
    }

    // Validate healthcare optimization
    if (!config.healthcare_optimized) {
      warnings.push({
        field: 'healthcare_optimized',
        message: 'Dashboard not optimized for healthcare use',
        recommendation: 'Enable healthcare optimization for better compliance and user experience',
        healthcare_impact: true
      });
    }

    // Validate accessibility
    if (!config.accessibility_enhanced) {
      warnings.push({
        field: 'accessibility_enhanced',
        message: 'Dashboard not enhanced for accessibility',
        recommendation: 'Enable accessibility enhancements for better user experience',
        healthcare_impact: true
      });
    }

    // Validate custom CSS for security
    if (config.custom_css) {
      const cssValidation = this.validateCustomCSS(config.custom_css);
      if (!cssValidation.valid) {
        errors.push({
          field: 'custom_css',
          message: 'Custom CSS contains potentially dangerous content',
          severity: 'error',
          healthcare_impact: true,
          resolution: 'Remove dangerous CSS patterns'
        });
      }
    }

    // Validate custom JavaScript for security
    if (config.custom_js) {
      const jsValidation = this.validateCustomJS(config.custom_js);
      if (!jsValidation.valid) {
        errors.push({
          field: 'custom_js',
          message: 'Custom JavaScript contains potentially dangerous patterns',
          severity: 'error',
          healthcare_impact: true,
          resolution: 'Remove dangerous JavaScript patterns'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      healthcare_compliant: healthcareCompliant,
      accessibility_compliant: accessibilityCompliant
    };
  }

  // Private helper methods

  private createDefaultRegions(config: DashboardConfig) {
    const regions = [];
    
    // Header region
    regions.push({
      id: 'header',
      name: 'Header',
      type: 'header' as const,
      position: { x: 0, y: 0, width: config.columns, height: 1 },
      constraints: { min_width: config.columns, max_width: config.columns },
      widgets: [],
      customizable: true,
      required: false
    });

    // Main content region
    regions.push({
      id: 'main',
      name: 'Main Content',
      type: 'main' as const,
      position: { x: 0, y: 1, width: config.columns, height: config.rows - 2 },
      constraints: { min_width: 8, max_width: config.columns },
      widgets: [],
      customizable: true,
      required: true
    });

    // Footer region
    regions.push({
      id: 'footer',
      name: 'Footer',
      type: 'footer' as const,
      position: { x: 0, y: config.rows - 1, width: config.columns, height: 1 },
      constraints: { min_width: config.columns, max_width: config.columns },
      widgets: [],
      customizable: true,
      required: false
    });

    return regions;
  }

  private createDefaultPermissions(organizationId: string): DashboardPermissions {
    return {
      view: [organizationId],
      edit: [organizationId],
      admin: [organizationId],
      healthcare_data_access: [organizationId],
      compliance_required: true
    };
  }

  private hasPermission(dashboard: Dashboard, permission: 'view' | 'edit' | 'admin'): boolean {
    // Simplified permission check - in real implementation, check user context
    return dashboard.permissions[permission].length > 0;
  }

  private generateShareCode(): string {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  }

  private async addWidgetToDashboard(dashboardId: string, widget: DashboardWidget): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    dashboard.widgets.push(widget);
    dashboard.layout.widgets.push(widget);
    this.dashboards.set(dashboardId, dashboard);
  }

  private validateCustomCSS(css: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for potentially dangerous CSS
    const dangerousPatterns = [
      /javascript:/i,
      /expression\s*\(/i,
      /url\s*\(\s*javascript:/i,
      /@import/i,
      /behavior\s*:/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(css)) {
        errors.push(`Dangerous CSS pattern detected: ${pattern.source}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateCustomJS(js: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for potentially dangerous JavaScript
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /document\.write/i,
      /innerHTML\s*=/i,
      /outerHTML\s*=/i,
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(js)) {
        errors.push(`Dangerous JavaScript pattern detected: ${pattern.source}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async logDashboardEvent(
    eventType: string,
    dashboardId: string,
    organizationId: string,
    data: Record<string, any>
  ): Promise<void> {
    // Implementation for logging dashboard events
    console.log('Dashboard Event:', {
      type: eventType,
      dashboard_id: dashboardId,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      data
    });
  }
}
