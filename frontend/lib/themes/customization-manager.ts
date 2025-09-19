/**
 * Customization Manager - Organization-specific customization persistence and management
 * Healthcare-focused customization system with multi-tenant support
 */

import { 
  OrganizationCustomization, 
  CustomizationUpdate, 
  ValidationResult, 
  CustomizationExport,
  CompatibilityInfo,
  ValidationError,
  ValidationWarning
} from '@/types/customization/customization-types';

export class CustomizationManager {
  private customizations: Map<string, OrganizationCustomization> = new Map();
  private exportHistory: Map<string, any[]> = new Map();

  /**
   * Get organization customization
   */
  async getOrganizationCustomization(organizationId: string): Promise<OrganizationCustomization> {
    try {
      if (this.customizations.has(organizationId)) {
        return this.customizations.get(organizationId)!;
      }

      // Load from database or file system
      const customization = await this.loadCustomizationFromSource(organizationId);
      this.customizations.set(organizationId, customization);
      
      return customization;
    } catch (error) {
      console.error('Failed to get organization customization:', error);
      throw new Error(`Failed to get organization customization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update organization customization
   */
  async updateOrganizationCustomization(organizationId: string, customization: Partial<OrganizationCustomization>): Promise<void> {
    try {
      // Get current customization
      const currentCustomization = await this.getOrganizationCustomization(organizationId);
      
      // Merge updates
      const updatedCustomization: OrganizationCustomization = {
        ...currentCustomization,
        ...customization,
        updated_at: new Date().toISOString()
      };

      // Validate updated customization
      const validation = await this.validateCustomizations(updatedCustomization);
      if (!validation.valid) {
        throw new Error(`Customization validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Apply updates
      await this.applyCustomizationUpdates(organizationId, updatedCustomization);
      
      // Update cache
      this.customizations.set(organizationId, updatedCustomization);
      
      // Log changes for audit trail
      await this.logCustomizationChanges(organizationId, customization);
      
    } catch (error) {
      console.error('Failed to update organization customization:', error);
      throw new Error(`Failed to update organization customization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply customizations to an organization
   */
  async applyCustomizations(organizationId: string, customizations: CustomizationUpdate[]): Promise<void> {
    try {
      // Validate all customizations
      for (const customization of customizations) {
        const validation = await this.validateCustomizationUpdate(customization);
        if (!validation.valid) {
          throw new Error(`Customization validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Get current customization
      const currentCustomization = await this.getOrganizationCustomization(organizationId);
      
      // Apply each customization update
      let updatedCustomization = { ...currentCustomization };
      for (const customization of customizations) {
        updatedCustomization = await this.applyCustomizationUpdate(updatedCustomization, customization);
      }

      // Update organization customization
      await this.updateOrganizationCustomization(organizationId, updatedCustomization);
      
    } catch (error) {
      console.error('Failed to apply customizations:', error);
      throw new Error(`Failed to apply customizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate customizations
   */
  async validateCustomizations(customizations: OrganizationCustomization): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let healthcareCompliant = true;
    let accessibilityCompliant = true;

    // Validate organization ID
    if (!customizations.organization_id) {
      errors.push({
        field: 'organization_id',
        message: 'Organization ID is required',
        severity: 'error',
        healthcare_impact: true,
        resolution: 'Provide valid organization ID'
      });
    }

    // Validate theme ID
    if (!customizations.theme_id) {
      errors.push({
        field: 'theme_id',
        message: 'Theme ID is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Select a valid theme'
      });
    }

    // Validate custom branding
    if (customizations.custom_branding) {
      const brandingValidation = await this.validateCustomBranding(customizations.custom_branding);
      errors.push(...brandingValidation.errors);
      warnings.push(...brandingValidation.warnings);
    }

    // Validate color scheme
    if (customizations.color_scheme) {
      const colorValidation = await this.validateColorScheme(customizations.color_scheme);
      errors.push(...colorValidation.errors);
      warnings.push(...colorValidation.warnings);
    }

    // Validate typography preferences
    if (customizations.typography_preferences) {
      const typographyValidation = await this.validateTypographyPreferences(customizations.typography_preferences);
      errors.push(...typographyValidation.errors);
      warnings.push(...typographyValidation.warnings);
    }

    // Validate layout configuration
    if (customizations.layout_config) {
      const layoutValidation = await this.validateLayoutConfig(customizations.layout_config);
      errors.push(...layoutValidation.errors);
      warnings.push(...layoutValidation.warnings);
    }

    // Validate custom fields
    if (customizations.custom_fields && customizations.custom_fields.length > 0) {
      for (const field of customizations.custom_fields) {
        const fieldValidation = await this.validateCustomField(field);
        errors.push(...fieldValidation.errors);
        warnings.push(...fieldValidation.warnings);
      }
    }

    // Validate white-label settings
    if (customizations.white_label_settings) {
      const whiteLabelValidation = await this.validateWhiteLabelSettings(customizations.white_label_settings);
      errors.push(...whiteLabelValidation.errors);
      warnings.push(...whiteLabelValidation.warnings);
    }

    // Validate localization settings
    if (customizations.localization_settings) {
      const localizationValidation = await this.validateLocalizationSettings(customizations.localization_settings);
      errors.push(...localizationValidation.errors);
      warnings.push(...localizationValidation.warnings);
    }

    // Check healthcare compliance
    if (customizations.white_label_settings && !customizations.white_label_settings.compliance_requirements) {
      warnings.push({
        field: 'white_label_settings.compliance_requirements',
        message: 'White-label settings should include compliance requirements',
        recommendation: 'Add healthcare compliance requirements',
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

  /**
   * Export customizations
   */
  async exportCustomizations(organizationId: string): Promise<CustomizationExport> {
    try {
      const customization = await this.getOrganizationCustomization(organizationId);
      
      const exportData: CustomizationExport = {
        version: '1.0.0',
        organization_id: organizationId,
        customizations: customization,
        dependencies: await this.getCustomizationDependencies(customization),
        compatibility: await this.getCompatibilityInfo(),
        created_at: new Date().toISOString(),
        exported_by: 'system' // TODO: Get actual user ID
      };

      // Store export history
      const history = this.exportHistory.get(organizationId) || [];
      history.push({
        id: `export_${Date.now()}`,
        created_at: exportData.created_at,
        file_size: JSON.stringify(exportData).length,
        status: 'completed'
      });
      this.exportHistory.set(organizationId, history);

      return exportData;
    } catch (error) {
      console.error('Failed to export customizations:', error);
      throw new Error(`Failed to export customizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import customizations
   */
  async importCustomizations(organizationId: string, exportData: CustomizationExport): Promise<void> {
    try {
      // Validate import data
      const validation = await this.validateImportData(exportData);
      if (!validation.valid) {
        throw new Error(`Import validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Check compatibility
      const compatibility = await this.checkImportCompatibility(exportData);
      if (!compatibility.compatible) {
        throw new Error(`Import not compatible: ${compatibility.issues.map(i => i.message).join(', ')}`);
      }

      // Apply imported customizations
      await this.updateOrganizationCustomization(organizationId, exportData.customizations);
      
      // Log import
      await this.logCustomizationImport(organizationId, exportData);
      
    } catch (error) {
      console.error('Failed to import customizations:', error);
      throw new Error(`Failed to import customizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async loadCustomizationFromSource(organizationId: string): Promise<OrganizationCustomization> {
    // This would typically load from database or file system
    // For now, return a default customization
    return {
      organization_id: organizationId,
      theme_id: 'default-healthcare-theme',
      custom_branding: {
        logo: {
          primary: '',
          secondary: '',
          icon: '',
          favicon: ''
        },
        company_name: '',
        tagline: '',
        contact_info: {
          email: '',
          phone: '',
          address: '',
          website: ''
        },
        social_links: {}
      },
      color_scheme: {
        id: 'default',
        name: 'Default Healthcare',
        description: 'Default healthcare color scheme',
        category: 'healthcare',
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#059669',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          text_secondary: '#64748b',
          border: '#e2e8f0',
          error: '#dc2626',
          warning: '#d97706',
          success: '#059669',
          info: '#0284c7'
        },
        contrast_ratio: 4.5,
        accessibility_compliant: true,
        healthcare_appropriate: true,
        preview_image: ''
      },
      typography_preferences: {
        font_family: 'Inter, system-ui, sans-serif',
        font_size_base: 16,
        font_weight_normal: 400,
        font_weight_bold: 600,
        line_height_base: 1.5,
        letter_spacing_base: 0,
        healthcare_terminology: true,
        accessibility_enhanced: true
      },
      layout_config: {
        dashboard_layout: {
          layout_type: 'grid',
          columns: 12,
          rows: 8,
          regions: [],
          widgets: [],
          customizable: true
        },
        navigation_config: {
          navigation_type: 'sidebar',
          menu_items: [],
          healthcare_optimized: true,
          accessibility_enhanced: true
        },
        widget_configurations: [],
        responsive_breakpoints: [],
        accessibility_options: {
          high_contrast: false,
          large_text: false,
          reduced_motion: false,
          screen_reader_optimized: false,
          keyboard_navigation: true,
          focus_indicators: true,
          color_blind_friendly: true
        }
      },
      custom_fields: [],
      workflow_templates: [],
      white_label_settings: {
        organization_id: organizationId,
        client_organization_id: '',
        branding: {
          logo: {
            primary: '',
            secondary: '',
            icon: '',
            favicon: ''
          },
          company_name: '',
          tagline: '',
          contact_info: {
            email: '',
            phone: '',
            address: '',
            website: ''
          },
          social_links: {}
        },
        theme_customizations: [],
        domain_settings: {
          custom_domain: '',
          ssl_enabled: false,
          cdn_enabled: false,
          subdomain: '',
          path_prefix: ''
        },
        feature_restrictions: [],
        compliance_requirements: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      localization_settings: {
        language_code: 'en',
        healthcare_terminology_mapping: {},
        medical_specialty_terms: {
          specialty: 'general',
          terms: {},
          abbreviations: {},
          clinical_notation: {},
          compliance_notation: {}
        },
        compliance_requirements: [],
        cultural_adaptations: [],
        date_formats: [],
        number_formats: [],
        currency_settings: {
          currency_code: 'USD',
          symbol: '$',
          position: 'before',
          decimal_places: 2,
          thousands_separator: ',',
          decimal_separator: '.'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      css_overrides: [],
      js_customizations: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private async validateCustomizationUpdate(customization: CustomizationUpdate): Promise<ValidationResult> {
    // Implementation for validating individual customization updates
    return {
      valid: true,
      errors: [],
      warnings: [],
      healthcare_compliant: true,
      accessibility_compliant: true
    };
  }

  private async applyCustomizationUpdate(currentCustomization: OrganizationCustomization, update: CustomizationUpdate): Promise<OrganizationCustomization> {
    // Implementation for applying individual customization updates
    return currentCustomization;
  }

  private async logCustomizationChanges(organizationId: string, changes: Partial<OrganizationCustomization>): Promise<void> {
    // Implementation for logging customization changes
  }

  private async validateCustomBranding(branding: any): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate company name
    if (!branding.company_name) {
      errors.push({
        field: 'company_name',
        message: 'Company name is required for branding',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide company name'
      });
    }

    // Validate logo
    if (!branding.logo?.primary) {
      warnings.push({
        field: 'logo.primary',
        message: 'Primary logo is recommended',
        recommendation: 'Upload primary logo for better branding',
        healthcare_impact: false
      });
    }

    return { errors, warnings };
  }

  private async validateColorScheme(colorScheme: any): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate contrast ratio for accessibility
    if (colorScheme.contrast_ratio && colorScheme.contrast_ratio < 4.5) {
      warnings.push({
        field: 'contrast_ratio',
        message: 'Color contrast ratio below recommended minimum',
        recommendation: 'Increase contrast ratio to at least 4.5 for better accessibility',
        healthcare_impact: true
      });
    }

    return { errors, warnings };
  }

  private async validateTypographyPreferences(typography: any): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate font family
    if (!typography.font_family) {
      errors.push({
        field: 'font_family',
        message: 'Font family is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Select a font family'
      });
    }

    // Validate font size
    if (typography.font_size_base && typography.font_size_base < 14) {
      warnings.push({
        field: 'font_size_base',
        message: 'Font size below recommended minimum for healthcare applications',
        recommendation: 'Use font size of at least 14px for better readability',
        healthcare_impact: true
      });
    }

    return { errors, warnings };
  }

  private async validateLayoutConfig(layout: any): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate dashboard layout
    if (!layout.dashboard_layout) {
      errors.push({
        field: 'dashboard_layout',
        message: 'Dashboard layout is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Configure dashboard layout'
      });
    }

    return { errors, warnings };
  }

  private async validateCustomField(field: any): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate field name
    if (!field.field_name) {
      errors.push({
        field: 'field_name',
        message: 'Field name is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide field name'
      });
    }

    // Validate healthcare data classification
    if (field.healthcare_data_classification?.phi_required && !field.healthcare_data_classification?.hipaa_compliant) {
      errors.push({
        field: 'healthcare_data_classification.hipaa_compliant',
        message: 'PHI fields must be HIPAA compliant',
        severity: 'error',
        healthcare_impact: true,
        resolution: 'Enable HIPAA compliance for PHI fields'
      });
    }

    return { errors, warnings };
  }

  private async validateWhiteLabelSettings(whiteLabel: any): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate client organization ID
    if (!whiteLabel.client_organization_id) {
      errors.push({
        field: 'client_organization_id',
        message: 'Client organization ID is required for white-label',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide client organization ID'
      });
    }

    return { errors, warnings };
  }

  private async validateLocalizationSettings(localization: any): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate language code
    if (!localization.language_code) {
      errors.push({
        field: 'language_code',
        message: 'Language code is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide language code'
      });
    }

    return { errors, warnings };
  }

  private async getCustomizationDependencies(customization: OrganizationCustomization): Promise<string[]> {
    const dependencies: string[] = [];
    
    if (customization.theme_id) {
      dependencies.push(`theme:${customization.theme_id}`);
    }
    
    if (customization.custom_fields.length > 0) {
      dependencies.push('custom-fields');
    }
    
    if (customization.white_label_settings.client_organization_id) {
      dependencies.push('white-label');
    }
    
    if (customization.localization_settings.language_code !== 'en') {
      dependencies.push('localization');
    }

    return dependencies;
  }

  private async getCompatibilityInfo(): Promise<CompatibilityInfo> {
    return {
      platform_version: '1.0.0',
      theme_version: '1.0.0',
      api_version: '1.0.0',
      healthcare_compliance_version: '1.0.0'
    };
  }

  private async validateImportData(exportData: CustomizationExport): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate export version
    if (!exportData.version) {
      errors.push({
        field: 'version',
        message: 'Export version is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide export version'
      });
    }

    // Validate customizations
    if (!exportData.customizations) {
      errors.push({
        field: 'customizations',
        message: 'Customizations data is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide customizations data'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      healthcare_compliant: true,
      accessibility_compliant: true
    };
  }

  private async checkImportCompatibility(exportData: CustomizationExport): Promise<{ compatible: boolean, issues: any[] }> {
    const issues: any[] = [];
    
    // Check version compatibility
    if (exportData.compatibility) {
      if (exportData.compatibility.platform_version !== '1.0.0') {
        issues.push({
          type: 'version',
          message: `Platform version mismatch: expected 1.0.0, got ${exportData.compatibility.platform_version}`,
          severity: 'warning'
        });
      }
    }

    return {
      compatible: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }

  private async logCustomizationImport(organizationId: string, exportData: CustomizationExport): Promise<void> {
    // Implementation for logging customization import
  }
}
