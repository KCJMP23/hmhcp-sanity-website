/**
 * Widget Library - Healthcare-specific dashboard widgets
 * Comprehensive widget system with compliance validation and accessibility
 */

import { 
  WidgetLibrary,
  WidgetDefinition,
  WidgetSettingsSchema,
  WidgetSettingProperty,
  DataRequirements,
  WidgetPermissions,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '@/types/dashboard/dashboard-types';

export class WidgetLibraryService implements WidgetLibrary {
  private widgets: Map<string, WidgetDefinition> = new Map();

  constructor() {
    this.initializeDefaultWidgets();
  }

  /**
   * Get widgets by category
   */
  async getWidgets(category?: string): Promise<WidgetDefinition[]> {
    try {
      let widgets = Array.from(this.widgets.values());

      if (category) {
        widgets = widgets.filter(widget => widget.category === category);
      }

      // Sort by healthcare optimization and compliance
      widgets.sort((a, b) => {
        if (a.healthcare_optimized && !b.healthcare_optimized) return -1;
        if (!a.healthcare_optimized && b.healthcare_optimized) return 1;
        if (a.compliance_required && !b.compliance_required) return -1;
        if (!a.compliance_required && b.compliance_required) return 1;
        return a.name.localeCompare(b.name);
      });

      return widgets;
    } catch (error) {
      console.error('Failed to get widgets:', error);
      throw new Error(`Failed to get widgets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get widget by ID
   */
  async getWidgetById(widgetId: string): Promise<WidgetDefinition> {
    try {
      const widget = this.widgets.get(widgetId);
      if (!widget) {
        throw new Error('Widget not found');
      }

      return widget;
    } catch (error) {
      console.error('Failed to get widget:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Create a new widget
   */
  async createWidget(definition: WidgetDefinition): Promise<WidgetDefinition> {
    try {
      // Generate unique widget ID if not provided
      if (!definition.id) {
        definition.id = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Validate widget definition
      const validation = await this.validateWidget(definition);
      if (!validation.valid) {
        throw new Error(`Widget validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Set timestamps
      definition.created_at = new Date().toISOString();
      definition.updated_at = new Date().toISOString();

      // Store widget
      this.widgets.set(definition.id, definition);

      // Log widget creation
      await this.logWidgetEvent('widget_created', definition.id, definition.created_by, {
        category: definition.category,
        healthcare_optimized: definition.healthcare_optimized
      });

      return definition;
    } catch (error) {
      console.error('Failed to create widget:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Update an existing widget
   */
  async updateWidget(widgetId: string, definition: Partial<WidgetDefinition>): Promise<WidgetDefinition> {
    try {
      const existingWidget = this.widgets.get(widgetId);
      if (!existingWidget) {
        throw new Error('Widget not found');
      }

      // Merge updates
      const updatedWidget: WidgetDefinition = {
        ...existingWidget,
        ...definition,
        id: widgetId, // Ensure ID doesn't change
        updated_at: new Date().toISOString()
      };

      // Validate updated widget
      const validation = await this.validateWidget(updatedWidget);
      if (!validation.valid) {
        throw new Error(`Widget validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Update widget
      this.widgets.set(widgetId, updatedWidget);

      // Log widget update
      await this.logWidgetEvent('widget_updated', widgetId, existingWidget.created_by, {
        changes: definition,
        healthcare_optimized: updatedWidget.healthcare_optimized
      });

      return updatedWidget;
    } catch (error) {
      console.error('Failed to update widget:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Delete a widget
   */
  async deleteWidget(widgetId: string): Promise<void> {
    try {
      const widget = this.widgets.get(widgetId);
      if (!widget) {
        throw new Error('Widget not found');
      }

      // Check if widget is in use
      const isInUse = await this.isWidgetInUse(widgetId);
      if (isInUse) {
        throw new Error(`Widget ${widgetId} is currently in use and cannot be deleted`);
      }

      // Delete widget
      this.widgets.delete(widgetId);

      // Log widget deletion
      await this.logWidgetEvent('widget_deleted', widgetId, widget.created_by, {
        category: widget.category,
        healthcare_optimized: widget.healthcare_optimized
      });
    } catch (error) {
      console.error('Failed to delete widget:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Validate widget definition
   */
  async validateWidget(definition: WidgetDefinition): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let healthcareCompliant = true;
    let accessibilityCompliant = true;

    // Validate required fields
    if (!definition.id) {
      errors.push({
        field: 'id',
        message: 'Widget ID is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide unique widget ID'
      });
    }

    if (!definition.name) {
      errors.push({
        field: 'name',
        message: 'Widget name is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide widget name'
      });
    }

    if (!definition.component) {
      errors.push({
        field: 'component',
        message: 'Widget component is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Specify widget component'
      });
    }

    // Validate healthcare compliance
    if (definition.healthcare_optimized && !definition.compliance_required) {
      warnings.push({
        field: 'compliance_required',
        message: 'Healthcare optimized widgets should require compliance',
        recommendation: 'Enable compliance requirements for healthcare widgets',
        healthcare_impact: true
      });
    }

    // Validate data requirements
    if (definition.data_requirements) {
      const dataValidation = this.validateDataRequirements(definition.data_requirements);
      errors.push(...dataValidation.errors);
      warnings.push(...dataValidation.warnings);
    }

    // Validate settings schema
    if (definition.settings_schema) {
      const schemaValidation = this.validateSettingsSchema(definition.settings_schema);
      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
    }

    // Validate accessibility
    if (!definition.accessibility_compliant) {
      warnings.push({
        field: 'accessibility_compliant',
        message: 'Widget should be accessibility compliant',
        recommendation: 'Ensure widget follows WCAG guidelines',
        healthcare_impact: true
      });
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

  private initializeDefaultWidgets(): void {
    const defaultWidgets: WidgetDefinition[] = [
      // Healthcare Analytics Widgets
      {
        id: 'patient-census',
        name: 'Patient Census',
        description: 'Real-time patient count and status overview',
        category: 'healthcare',
        component: 'PatientCensusWidget',
        icon: 'users',
        preview_image: '/widgets/patient-census-preview.png',
        settings_schema: this.createPatientCensusSchema(),
        default_settings: {
          title: 'Patient Census',
          show_trends: true,
          refresh_interval: 30,
          healthcare_data: true,
          compliance_required: true
        },
        healthcare_optimized: true,
        compliance_required: true,
        accessibility_compliant: true,
        data_requirements: {
          healthcare_data: true,
          phi_required: true,
          hipaa_compliant: true,
          fda_compliant: false,
          fhir_compliant: true,
          audit_required: true,
          encryption_required: true,
          data_types: ['patient_id', 'admission_date', 'discharge_date', 'status'],
          refresh_frequency: 30,
          retention_period: 2555 // 7 years
        },
        permissions: {
          view: ['healthcare_provider', 'nurse', 'admin'],
          edit: ['admin'],
          admin: ['admin'],
          healthcare_data_access: ['healthcare_provider', 'nurse', 'admin'],
          compliance_required: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      },
      {
        id: 'vital-signs-monitor',
        name: 'Vital Signs Monitor',
        description: 'Real-time vital signs monitoring and alerts',
        category: 'healthcare',
        component: 'VitalSignsWidget',
        icon: 'heart',
        preview_image: '/widgets/vital-signs-preview.png',
        settings_schema: this.createVitalSignsSchema(),
        default_settings: {
          title: 'Vital Signs',
          show_alerts: true,
          alert_thresholds: true,
          refresh_interval: 5,
          healthcare_data: true,
          compliance_required: true
        },
        healthcare_optimized: true,
        compliance_required: true,
        accessibility_compliant: true,
        data_requirements: {
          healthcare_data: true,
          phi_required: true,
          hipaa_compliant: true,
          fda_compliant: true,
          fhir_compliant: true,
          audit_required: true,
          encryption_required: true,
          data_types: ['patient_id', 'vital_signs', 'timestamp', 'device_id'],
          refresh_frequency: 5,
          retention_period: 2555
        },
        permissions: {
          view: ['healthcare_provider', 'nurse'],
          edit: ['healthcare_provider'],
          admin: ['admin'],
          healthcare_data_access: ['healthcare_provider', 'nurse'],
          compliance_required: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      },
      {
        id: 'medication-schedule',
        name: 'Medication Schedule',
        description: 'Patient medication schedule and administration tracking',
        category: 'healthcare',
        component: 'MedicationScheduleWidget',
        icon: 'pills',
        preview_image: '/widgets/medication-schedule-preview.png',
        settings_schema: this.createMedicationScheduleSchema(),
        default_settings: {
          title: 'Medication Schedule',
          show_due_medications: true,
          show_overdue: true,
          refresh_interval: 60,
          healthcare_data: true,
          compliance_required: true
        },
        healthcare_optimized: true,
        compliance_required: true,
        accessibility_compliant: true,
        data_requirements: {
          healthcare_data: true,
          phi_required: true,
          hipaa_compliant: true,
          fda_compliant: true,
          fhir_compliant: true,
          audit_required: true,
          encryption_required: true,
          data_types: ['patient_id', 'medication', 'dosage', 'schedule', 'status'],
          refresh_frequency: 60,
          retention_period: 2555
        },
        permissions: {
          view: ['healthcare_provider', 'nurse', 'pharmacist'],
          edit: ['healthcare_provider', 'nurse'],
          admin: ['admin'],
          healthcare_data_access: ['healthcare_provider', 'nurse', 'pharmacist'],
          compliance_required: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      },
      // Compliance Widgets
      {
        id: 'compliance-dashboard',
        name: 'Compliance Dashboard',
        description: 'Healthcare compliance monitoring and reporting',
        category: 'compliance',
        component: 'ComplianceDashboardWidget',
        icon: 'shield-check',
        preview_image: '/widgets/compliance-dashboard-preview.png',
        settings_schema: this.createComplianceDashboardSchema(),
        default_settings: {
          title: 'Compliance Status',
          show_hipaa: true,
          show_fda: true,
          show_fhir: true,
          refresh_interval: 300,
          healthcare_data: true,
          compliance_required: true
        },
        healthcare_optimized: true,
        compliance_required: true,
        accessibility_compliant: true,
        data_requirements: {
          healthcare_data: true,
          phi_required: false,
          hipaa_compliant: true,
          fda_compliant: true,
          fhir_compliant: true,
          audit_required: true,
          encryption_required: true,
          data_types: ['compliance_metrics', 'audit_logs', 'violations'],
          refresh_frequency: 300,
          retention_period: 2555
        },
        permissions: {
          view: ['compliance_officer', 'admin'],
          edit: ['compliance_officer'],
          admin: ['admin'],
          healthcare_data_access: ['compliance_officer', 'admin'],
          compliance_required: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      },
      // Analytics Widgets
      {
        id: 'patient-flow-analytics',
        name: 'Patient Flow Analytics',
        description: 'Patient flow analysis and optimization insights',
        category: 'analytics',
        component: 'PatientFlowAnalyticsWidget',
        icon: 'trending-up',
        preview_image: '/widgets/patient-flow-preview.png',
        settings_schema: this.createPatientFlowAnalyticsSchema(),
        default_settings: {
          title: 'Patient Flow',
          show_trends: true,
          show_predictions: true,
          refresh_interval: 900,
          healthcare_data: true,
          compliance_required: true
        },
        healthcare_optimized: true,
        compliance_required: true,
        accessibility_compliant: true,
        data_requirements: {
          healthcare_data: true,
          phi_required: false,
          hipaa_compliant: true,
          fda_compliant: false,
          fhir_compliant: true,
          audit_required: true,
          encryption_required: true,
          data_types: ['patient_flow', 'wait_times', 'capacity'],
          refresh_frequency: 900,
          retention_period: 1095 // 3 years
        },
        permissions: {
          view: ['healthcare_provider', 'admin', 'analyst'],
          edit: ['admin', 'analyst'],
          admin: ['admin'],
          healthcare_data_access: ['healthcare_provider', 'admin', 'analyst'],
          compliance_required: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      }
    ];

    for (const widget of defaultWidgets) {
      this.widgets.set(widget.id, widget);
    }
  }

  private createPatientCensusSchema(): WidgetSettingsSchema {
    return {
      properties: {
        title: {
          type: 'string',
          title: 'Widget Title',
          description: 'Display title for the widget',
          default: 'Patient Census',
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_trends: {
          type: 'boolean',
          title: 'Show Trends',
          description: 'Display trend indicators',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        refresh_interval: {
          type: 'number',
          title: 'Refresh Interval (seconds)',
          description: 'How often to refresh the data',
          default: 30,
          minimum: 5,
          maximum: 3600,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        }
      },
      required: ['title'],
      healthcare_validation: true,
      accessibility_validation: true
    };
  }

  private createVitalSignsSchema(): WidgetSettingsSchema {
    return {
      properties: {
        title: {
          type: 'string',
          title: 'Widget Title',
          description: 'Display title for the widget',
          default: 'Vital Signs',
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_alerts: {
          type: 'boolean',
          title: 'Show Alerts',
          description: 'Display critical value alerts',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        alert_thresholds: {
          type: 'boolean',
          title: 'Alert Thresholds',
          description: 'Show threshold indicators',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        refresh_interval: {
          type: 'number',
          title: 'Refresh Interval (seconds)',
          description: 'How often to refresh the data',
          default: 5,
          minimum: 1,
          maximum: 300,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        }
      },
      required: ['title'],
      healthcare_validation: true,
      accessibility_validation: true
    };
  }

  private createMedicationScheduleSchema(): WidgetSettingsSchema {
    return {
      properties: {
        title: {
          type: 'string',
          title: 'Widget Title',
          description: 'Display title for the widget',
          default: 'Medication Schedule',
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_due_medications: {
          type: 'boolean',
          title: 'Show Due Medications',
          description: 'Display medications due for administration',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_overdue: {
          type: 'boolean',
          title: 'Show Overdue',
          description: 'Highlight overdue medications',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        refresh_interval: {
          type: 'number',
          title: 'Refresh Interval (seconds)',
          description: 'How often to refresh the data',
          default: 60,
          minimum: 30,
          maximum: 3600,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        }
      },
      required: ['title'],
      healthcare_validation: true,
      accessibility_validation: true
    };
  }

  private createComplianceDashboardSchema(): WidgetSettingsSchema {
    return {
      properties: {
        title: {
          type: 'string',
          title: 'Widget Title',
          description: 'Display title for the widget',
          default: 'Compliance Status',
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_hipaa: {
          type: 'boolean',
          title: 'Show HIPAA Status',
          description: 'Display HIPAA compliance status',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_fda: {
          type: 'boolean',
          title: 'Show FDA Status',
          description: 'Display FDA compliance status',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_fhir: {
          type: 'boolean',
          title: 'Show FHIR Status',
          description: 'Display FHIR compliance status',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        refresh_interval: {
          type: 'number',
          title: 'Refresh Interval (seconds)',
          description: 'How often to refresh the data',
          default: 300,
          minimum: 60,
          maximum: 3600,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        }
      },
      required: ['title'],
      healthcare_validation: true,
      accessibility_validation: true
    };
  }

  private createPatientFlowAnalyticsSchema(): WidgetSettingsSchema {
    return {
      properties: {
        title: {
          type: 'string',
          title: 'Widget Title',
          description: 'Display title for the widget',
          default: 'Patient Flow',
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_trends: {
          type: 'boolean',
          title: 'Show Trends',
          description: 'Display trend analysis',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        show_predictions: {
          type: 'boolean',
          title: 'Show Predictions',
          description: 'Display predictive analytics',
          default: true,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        },
        refresh_interval: {
          type: 'number',
          title: 'Refresh Interval (seconds)',
          description: 'How often to refresh the data',
          default: 900,
          minimum: 300,
          maximum: 3600,
          healthcare_appropriate: true,
          accessibility_enhanced: true
        }
      },
      required: ['title'],
      healthcare_validation: true,
      accessibility_validation: true
    };
  }

  private validateDataRequirements(requirements: DataRequirements): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (requirements.healthcare_data && !requirements.hipaa_compliant) {
      errors.push({
        field: 'data_requirements.hipaa_compliant',
        message: 'Healthcare data must be HIPAA compliant',
        severity: 'error',
        healthcare_impact: true,
        resolution: 'Enable HIPAA compliance for healthcare data'
      });
    }

    if (requirements.phi_required && !requirements.encryption_required) {
      errors.push({
        field: 'data_requirements.encryption_required',
        message: 'PHI data must be encrypted',
        severity: 'error',
        healthcare_impact: true,
        resolution: 'Enable encryption for PHI data'
      });
    }

    if (requirements.refresh_frequency < 1) {
      warnings.push({
        field: 'data_requirements.refresh_frequency',
        message: 'Refresh frequency should be at least 1 second',
        recommendation: 'Set appropriate refresh frequency for data type',
        healthcare_impact: true
      });
    }

    return { errors, warnings };
  }

  private validateSettingsSchema(schema: WidgetSettingsSchema): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      warnings.push({
        field: 'settings_schema.properties',
        message: 'Settings schema should define properties',
        recommendation: 'Add properties to settings schema',
        healthcare_impact: false
      });
    }

    return { errors, warnings };
  }

  private async isWidgetInUse(widgetId: string): Promise<boolean> {
    // Implementation to check if widget is currently in use
    // This would typically query the database for dashboard widgets
    return false;
  }

  private async logWidgetEvent(
    eventType: string,
    widgetId: string,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    // Implementation for logging widget events
    console.log('Widget Event:', {
      type: eventType,
      widget_id: widgetId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      data
    });
  }
}
