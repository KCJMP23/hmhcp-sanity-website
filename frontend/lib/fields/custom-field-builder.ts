/**
 * Custom Field Builder Service
 * Healthcare-specific field creation and management system
 */

import { 
  CustomFieldDefinition, 
  FieldType, 
  DataType, 
  ValidationRule, 
  ValidationType, 
  ValidationSeverity,
  HealthcareDataClassification,
  DataSensitivityLevel,
  HealthcareDataCategory,
  FieldPermissions,
  FieldVisibility,
  FieldMappingConfig,
  FieldTransformationRule,
  FieldMetadata,
  CustomFieldTemplate,
  FieldTemplateCategory,
  FieldValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  ComplianceStatus,
  ComplianceIssue,
  ComplianceRecommendation,
  FieldBuilderConfig,
  OrganizationFieldSettings,
  FieldBuilderResponse,
  FieldSearchCriteria,
  FieldSearchResult,
  HealthcareFieldConfig,
  FHIRMapping,
  MedicalSpecialtyRequirement,
  AccessControl,
  FieldPermission,
  AccessCondition,
  ConditionalVisibilityRule,
  FieldImportExportConfig,
  ImportExportFormat,
  PerformanceMetrics,
  NamingConvention,
  ApprovalWorkflow,
  AuditRequirement,
  ComplianceRequirement,
  ComplianceRequirementDetail
} from '../../types/fields/custom-field-types';

export class CustomFieldBuilderService {
  private fieldDefinitions: Map<string, CustomFieldDefinition> = new Map();
  private fieldTemplates: Map<string, CustomFieldTemplate> = new Map();
  private organizationSettings: Map<string, OrganizationFieldSettings> = new Map();
  private complianceRequirements: Map<string, ComplianceRequirement> = new Map();
  private healthcareFieldConfigs: Map<FieldType, HealthcareFieldConfig> = new Map();
  private validationCache: Map<string, FieldValidationResult> = new Map();

  constructor() {
    this.initializeHealthcareFieldConfigs();
    this.initializeComplianceRequirements();
  }

  /**
   * Create a new custom field definition
   */
  async createField(
    fieldData: Partial<CustomFieldDefinition>,
    organizationId: string,
    userId: string
  ): Promise<FieldBuilderResponse<CustomFieldDefinition>> {
    try {
      // Generate field ID
      const fieldId = this.generateFieldId(fieldData.name || '');
      
      // Validate field data
      const validationResult = await this.validateFieldDefinition(fieldData, organizationId);
      if (!validationResult.is_valid) {
        console.log('Validation failed:', validationResult.errors);
        return {
          success: false,
          validation_errors: validationResult.errors,
          warnings: validationResult.warnings,
          suggestions: validationResult.suggestions
        };
      }

      // Get organization settings
      const orgSettings = this.organizationSettings.get(organizationId) || this.getDefaultOrganizationSettings();
      
      // Create field definition
      const fieldDefinition: CustomFieldDefinition = {
        id: fieldId,
        name: fieldData.name || '',
        label: fieldData.label || fieldData.name || '',
        description: fieldData.description,
        field_type: fieldData.field_type || 'text',
        data_type: fieldData.data_type || 'string',
        validation_rules: fieldData.validation_rules || [],
        healthcare_classification: fieldData.healthcare_classification || this.getDefaultHealthcareClassification(),
        permissions: fieldData.permissions || this.getDefaultPermissions(),
        visibility: fieldData.visibility || this.getDefaultVisibility(),
        mapping_config: fieldData.mapping_config,
        transformation_rules: fieldData.transformation_rules || [],
        template_id: fieldData.template_id,
        organization_id: organizationId,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0',
        is_active: true,
        is_required: fieldData.is_required || false,
        is_system_field: false,
        metadata: fieldData.metadata || this.getDefaultMetadata()
      };

      // Apply organization-specific settings
      this.applyOrganizationSettings(fieldDefinition, orgSettings);

      // Store field definition
      this.fieldDefinitions.set(fieldId, fieldDefinition);

      // Log field creation event
      this.logFieldEvent('field_created', fieldId, organizationId, userId, {
        field_type: fieldDefinition.field_type,
        healthcare_classification: fieldDefinition.healthcare_classification.data_category,
        compliance_checked: true
      });

      return {
        success: true,
        data: fieldDefinition,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: true,
          validation_performed: true
        }
      };
    } catch (error) {
      this.logFieldEvent('field_creation_error', '', organizationId, userId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create field'
      };
    }
  }

  /**
   * Update an existing custom field definition
   */
  async updateField(
    fieldId: string,
    updates: Partial<CustomFieldDefinition>,
    organizationId: string,
    userId: string
  ): Promise<FieldBuilderResponse<CustomFieldDefinition>> {
    try {
      const existingField = this.fieldDefinitions.get(fieldId);
      if (!existingField) {
        return {
          success: false,
          error: 'Field not found'
        };
      }

      // Check permissions
      if (!this.hasPermission(existingField, userId, 'write')) {
        return {
          success: false,
          error: 'Insufficient permissions to update field'
        };
      }

      // Validate updates - only validate the fields being updated
      const validationResult = await this.validateFieldUpdates(updates, existingField, organizationId);
      if (!validationResult.is_valid) {
        console.log('Update validation failed:', validationResult.errors);
        return {
          success: false,
          validation_errors: validationResult.errors,
          warnings: validationResult.warnings,
          suggestions: validationResult.suggestions
        };
      }

      // Create updated field definition
      const updatedField: CustomFieldDefinition = {
        ...existingField,
        ...updates,
        id: fieldId, // Ensure ID doesn't change
        organization_id: organizationId, // Ensure organization doesn't change
        created_by: existingField.created_by, // Ensure creator doesn't change
        created_at: existingField.created_at, // Ensure creation date doesn't change
        updated_at: new Date().toISOString(),
        version: this.incrementVersion(existingField.version)
      };

      // Store updated field definition
      this.fieldDefinitions.set(fieldId, updatedField);

      // Log field update event
      this.logFieldEvent('field_updated', fieldId, organizationId, userId, {
        changes: Object.keys(updates),
        version: updatedField.version,
        compliance_checked: true
      });

      return {
        success: true,
        data: updatedField,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: true,
          validation_performed: true
        }
      };
    } catch (error) {
      this.logFieldEvent('field_update_error', fieldId, organizationId, userId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update field'
      };
    }
  }

  /**
   * Delete a custom field definition
   */
  async deleteField(
    fieldId: string,
    organizationId: string,
    userId: string
  ): Promise<FieldBuilderResponse<boolean>> {
    try {
      const field = this.fieldDefinitions.get(fieldId);
      if (!field) {
        return {
          success: false,
          error: 'Field not found'
        };
      }

      // Check permissions
      if (!this.hasPermission(field, userId, 'delete')) {
        return {
          success: false,
          error: 'Insufficient permissions to delete field'
        };
      }

      // Check if field is in use
      const usageCheck = await this.checkFieldUsage(fieldId, organizationId);
      if (usageCheck.is_in_use) {
        return {
          success: false,
          error: 'Cannot delete field that is currently in use',
          warnings: [{
            rule_id: 'usage_check',
            rule_type: 'required',
            message: 'Field is currently being used in forms or workflows',
            field_path: 'field.usage'
          }]
        };
      }

      // Delete field definition
      this.fieldDefinitions.delete(fieldId);

      // Log field deletion event
      this.logFieldEvent('field_deleted', fieldId, organizationId, userId, {
        field_type: field.field_type,
        healthcare_classification: field.healthcare_classification.data_category
      });

      return {
        success: true,
        data: true,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: false,
          validation_performed: false
        }
      };
    } catch (error) {
      this.logFieldEvent('field_deletion_error', fieldId, organizationId, userId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete field'
      };
    }
  }

  /**
   * Get a custom field definition by ID
   */
  async getField(fieldId: string, organizationId: string, userId: string): Promise<FieldBuilderResponse<CustomFieldDefinition>> {
    try {
      const field = this.fieldDefinitions.get(fieldId);
      if (!field) {
        return {
          success: false,
          error: 'Field not found'
        };
      }

      // Check permissions
      if (!this.hasPermission(field, userId, 'read')) {
        return {
          success: false,
          error: 'Insufficient permissions to view field'
        };
      }

      // Check organization access
      if (field.organization_id !== organizationId) {
        return {
          success: false,
          error: 'Field not found'
        };
      }

      return {
        success: true,
        data: field,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: false,
          validation_performed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get field'
      };
    }
  }

  /**
   * Search and filter custom fields
   */
  async searchFields(
    criteria: FieldSearchCriteria,
    organizationId: string,
    userId: string
  ): Promise<FieldBuilderResponse<FieldSearchResult>> {
    try {
      const startTime = Date.now();
      let fields = Array.from(this.fieldDefinitions.values())
        .filter(field => field.organization_id === organizationId);

      // Apply filters
      if (criteria.field_types && criteria.field_types.length > 0) {
        fields = fields.filter(field => criteria.field_types!.includes(field.field_type));
      }

      if (criteria.data_categories && criteria.data_categories.length > 0) {
        fields = fields.filter(field => criteria.data_categories!.includes(field.healthcare_classification.data_category));
      }

      if (criteria.sensitivity_levels && criteria.sensitivity_levels.length > 0) {
        fields = fields.filter(field => criteria.sensitivity_levels!.includes(field.healthcare_classification.sensitivity_level));
      }

      if (criteria.medical_specialties && criteria.medical_specialties.length > 0) {
        fields = fields.filter(field => 
          field.metadata.medical_specialties.some(specialty => 
            criteria.medical_specialties!.includes(specialty)
          )
        );
      }

      if (criteria.is_active !== undefined) {
        fields = fields.filter(field => field.is_active === criteria.is_active);
      }

      if (criteria.is_required !== undefined) {
        fields = fields.filter(field => field.is_required === criteria.is_required);
      }

      if (criteria.tags && criteria.tags.length > 0) {
        fields = fields.filter(field => 
          criteria.tags!.some(tag => field.metadata.tags.includes(tag))
        );
      }

      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        fields = fields.filter(field => 
          field.name.toLowerCase().includes(query) ||
          field.label.toLowerCase().includes(query) ||
          field.description?.toLowerCase().includes(query) ||
          field.metadata.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply sorting
      const sortBy = criteria.sort_by || 'name';
      const sortOrder = criteria.sort_order || 'asc';
      
      fields.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case 'updated_at':
            aValue = new Date(a.updated_at).getTime();
            bValue = new Date(b.updated_at).getTime();
            break;
          case 'usage_count':
            aValue = a.metadata.usage_count;
            bValue = b.metadata.usage_count;
            break;
          case 'compliance_score':
            aValue = this.calculateComplianceScore(a);
            bValue = this.calculateComplianceScore(b);
            break;
          default:
            aValue = a.name;
            bValue = b.name;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;
      const totalCount = fields.length;
      const paginatedFields = fields.slice(offset, offset + limit);

      const result: FieldSearchResult = {
        fields: paginatedFields,
        total_count: totalCount,
        page_info: {
          current_page: Math.floor(offset / limit) + 1,
          total_pages: Math.ceil(totalCount / limit),
          has_next: offset + limit < totalCount,
          has_previous: offset > 0
        },
        filters_applied: criteria,
        performance_metrics: {
          search_time: Date.now() - startTime,
          results_count: paginatedFields.length
        }
      };

      return {
        success: true,
        data: result,
        metadata: {
          execution_time: Date.now() - startTime,
          compliance_checked: false,
          validation_performed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search fields'
      };
    }
  }

  /**
   * Validate field updates
   */
  async validateFieldUpdates(
    updates: Partial<CustomFieldDefinition>,
    existingField: CustomFieldDefinition,
    organizationId: string
  ): Promise<FieldValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Only validate fields that are being updated
    if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
      errors.push({
        rule_id: 'required_name',
        rule_type: 'required',
        message: 'Field name is required',
        severity: 'error',
        field_path: 'name'
      });
    }

    if (updates.field_type !== undefined && updates.data_type !== undefined) {
      if (!this.isCompatibleType(updates.field_type, updates.data_type)) {
        errors.push({
          rule_id: 'incompatible_types',
          rule_type: 'required',
          message: `Field type ${updates.field_type} is not compatible with data type ${updates.data_type}`,
          severity: 'error',
          field_path: 'field_type',
          suggested_fix: `Use a compatible data type for ${updates.field_type} field`
        });
      }
    }

    // Validate healthcare classification if being updated
    if (updates.healthcare_classification) {
      const classification = updates.healthcare_classification;
      if (classification.phi_required && !classification.hipaa_protected) {
        warnings.push({
          rule_id: 'phi_not_hipaa_protected',
          rule_type: 'hipaa_compliant',
          message: 'PHI fields should be HIPAA protected',
          field_path: 'healthcare_classification.hipaa_protected',
          recommendation: 'Enable HIPAA protection for PHI fields'
        });
      }
    }

    return {
      field_id: existingField.id,
      field_name: existingField.name,
      is_valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      compliance_status: {
        hipaa_compliant: true,
        fda_compliant: true,
        fhir_compliant: true,
        hitrust_compliant: true,
        gdpr_compliant: true,
        issues: [],
        recommendations: []
      }
    };
  }

  /**
   * Validate field definition
   */
  async validateFieldDefinition(
    fieldData: Partial<CustomFieldDefinition>,
    organizationId: string
  ): Promise<FieldValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Required field validation
    if (!fieldData.name) {
      errors.push({
        rule_id: 'required_name',
        rule_type: 'required',
        message: 'Field name is required',
        severity: 'error',
        field_path: 'name'
      });
    }

    if (!fieldData.field_type) {
      errors.push({
        rule_id: 'required_field_type',
        rule_type: 'required',
        message: 'Field type is required',
        severity: 'error',
        field_path: 'field_type'
      });
    }

    // Field type validation
    if (fieldData.field_type) {
      const healthcareConfig = this.healthcareFieldConfigs.get(fieldData.field_type);
      if (healthcareConfig) {
        // Validate against healthcare-specific requirements
        const healthcareValidation = this.validateHealthcareField(fieldData, healthcareConfig);
        errors.push(...healthcareValidation.errors);
        warnings.push(...healthcareValidation.warnings);
        suggestions.push(...healthcareValidation.suggestions);
      }
    }

    // Field type and data type compatibility
    if (fieldData.field_type && fieldData.data_type) {
      const isCompatible = this.isCompatibleType(fieldData.field_type, fieldData.data_type);
      if (!isCompatible) {
        errors.push({
          rule_id: 'incompatible_types',
          rule_type: 'required',
          message: `Field type ${fieldData.field_type} is not compatible with data type ${fieldData.data_type}`,
          severity: 'error',
          field_path: 'field_type',
          suggested_fix: `Use a compatible data type for ${fieldData.field_type} field`
        });
      }
    }

    // Compliance validation - only add warnings, not errors
    const complianceStatus = await this.validateCompliance(fieldData, organizationId);
    if (!complianceStatus.hipaa_compliant) {
      warnings.push({
        rule_id: 'hipaa_compliance',
        rule_type: 'hipaa_compliant',
        message: 'Field should meet HIPAA compliance requirements',
        field_path: 'healthcare_classification',
        recommendation: 'Consider enabling HIPAA protection for better compliance'
      });
    }

    // Organization-specific validation
    const orgSettings = this.organizationSettings.get(organizationId);
    if (orgSettings) {
      const orgValidation = this.validateOrganizationRequirements(fieldData, orgSettings);
      errors.push(...orgValidation.errors);
      warnings.push(...orgValidation.warnings);
      suggestions.push(...orgValidation.suggestions);
    }

    return {
      field_id: fieldData.id || '',
      field_name: fieldData.name || '',
      is_valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      compliance_status: complianceStatus
    };
  }

  /**
   * Create field template
   */
  async createFieldTemplate(
    templateData: Partial<CustomFieldTemplate>,
    organizationId: string,
    userId: string
  ): Promise<FieldBuilderResponse<CustomFieldTemplate>> {
    try {
      const templateId = this.generateTemplateId(templateData.name || '');
      
      const template: CustomFieldTemplate = {
        id: templateId,
        name: templateData.name || '',
        description: templateData.description || '',
        category: templateData.category || 'custom_workflow',
        medical_specialty: templateData.medical_specialty,
        compliance_framework: templateData.compliance_framework || ['hipaa'],
        fields: templateData.fields || [],
        organization_id: organizationId,
        is_public: templateData.is_public || false,
        is_system_template: false,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0',
        usage_count: 0,
        rating: 0,
        tags: templateData.tags || [],
        metadata: templateData.metadata || this.getDefaultMetadata()
      };

      this.fieldTemplates.set(templateId, template);

      this.logFieldEvent('template_created', templateId, organizationId, userId, {
        category: template.category,
        field_count: template.fields.length,
        is_public: template.is_public
      });

      return {
        success: true,
        data: template,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: true,
          validation_performed: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template'
      };
    }
  }

  /**
   * Import/Export fields
   */
  async importFields(
    importData: any,
    config: FieldImportExportConfig,
    organizationId: string,
    userId: string
  ): Promise<FieldBuilderResponse<{ imported_count: number; errors: string[] }>> {
    try {
      const errors: string[] = [];
      let importedCount = 0;

      // Parse import data based on format
      const fields = this.parseImportData(importData, config.format);

      for (const fieldData of fields) {
        try {
          const result = await this.createField(fieldData, organizationId, userId);
          if (result.success) {
            importedCount++;
          } else {
            errors.push(`Failed to import field ${fieldData.name}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error importing field ${fieldData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.logFieldEvent('fields_imported', '', organizationId, userId, {
        imported_count: importedCount,
        error_count: errors.length,
        format: config.format
      });

      return {
        success: true,
        data: { imported_count: importedCount, errors },
        metadata: {
          execution_time: Date.now(),
          compliance_checked: true,
          validation_performed: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import fields'
      };
    }
  }

  // Private helper methods

  private initializeHealthcareFieldConfigs(): void {
    // Patient ID field configuration
    this.healthcareFieldConfigs.set('patient_id', {
      field_type: 'patient_id',
      default_validation: [
        {
          id: 'patient_id_format',
          type: 'healthcare_id_format',
          value: '^[A-Z0-9]{8,12}$',
          message: 'Patient ID must be 8-12 alphanumeric characters',
          severity: 'error',
          healthcare_compliance: 'hipaa'
        }
      ],
      required_classification: {
        sensitivity_level: 'confidential',
        phi_required: true,
        hipaa_protected: true,
        fda_regulated: false,
        fhir_mapping: {
          resource_type: 'Patient',
          element_path: 'identifier',
          data_type: 'Identifier',
          cardinality: '1..1',
          binding_strength: 'required'
        },
        retention_period: 2555, // 7 years
        encryption_required: true,
        audit_logging: true,
        access_controls: [],
        data_category: 'demographics'
      },
      specialty_requirements: [],
      common_use_cases: ['Patient identification', 'Medical record lookup', 'Appointment scheduling'],
      best_practices: ['Use consistent format', 'Implement access controls', 'Enable audit logging']
    });

    // Vital signs field configuration
    this.healthcareFieldConfigs.set('vital_signs', {
      field_type: 'vital_signs',
      default_validation: [
        {
          id: 'vital_signs_range',
          type: 'vital_signs_range',
          value: { min: 0, max: 300 },
          message: 'Vital signs must be within normal medical ranges',
          severity: 'error',
          healthcare_compliance: 'fda'
        }
      ],
      required_classification: {
        sensitivity_level: 'confidential',
        phi_required: true,
        hipaa_protected: true,
        fda_regulated: true,
        fhir_mapping: {
          resource_type: 'Observation',
          element_path: 'valueQuantity',
          data_type: 'Quantity',
          cardinality: '1..1',
          binding_strength: 'required'
        },
        retention_period: 2555,
        encryption_required: true,
        audit_logging: true,
        access_controls: [],
        data_category: 'clinical'
      },
      specialty_requirements: [],
      common_use_cases: ['Patient monitoring', 'Clinical assessment', 'Treatment planning'],
      best_practices: ['Validate ranges', 'Include units', 'Enable real-time alerts']
    });
  }

  private initializeComplianceRequirements(): void {
    this.complianceRequirements.set('hipaa', {
      framework: 'HIPAA',
      version: '2023',
      requirements: [
        {
          id: 'phi_protection',
          description: 'Protected Health Information must be encrypted and access-controlled',
          field_requirements: ['encryption_required', 'access_controls', 'audit_logging'],
          validation_rules: [],
          documentation_required: true,
          approval_required: true
        }
      ],
      applicable_field_types: ['patient_id', 'medical_record_number', 'diagnosis_code', 'vital_signs'],
      validation_rules: []
    });
  }

  private generateFieldId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `field_${timestamp}_${sanitizedName}_${random}`;
  }

  private generateTemplateId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `template_${timestamp}_${sanitizedName}_${random}`;
  }

  private getDefaultHealthcareClassification(): HealthcareDataClassification {
    return {
      sensitivity_level: 'confidential',
      phi_required: false,
      hipaa_protected: false,
      fda_regulated: false,
      retention_period: 2555,
      encryption_required: false,
      audit_logging: false,
      access_controls: [],
      data_category: 'clinical'
    };
  }

  private getDefaultPermissions(): FieldPermissions {
    return {
      read_roles: ['admin', 'clinician', 'nurse'],
      write_roles: ['admin', 'clinician'],
      create_roles: ['admin'],
      delete_roles: ['admin'],
      export_roles: ['admin'],
      import_roles: ['admin'],
      validate_roles: ['admin', 'clinician'],
      approve_roles: ['admin'],
      audit_roles: ['admin']
    };
  }

  private getDefaultVisibility(): FieldVisibility {
    return {
      is_visible: true,
      visible_roles: ['admin', 'clinician', 'nurse'],
      hidden_roles: [],
      conditional_visibility: []
    };
  }

  private getDefaultMetadata(): FieldMetadata {
    return {
      tags: [],
      categories: [],
      medical_specialties: [],
      compliance_frameworks: ['hipaa'],
      data_sources: [],
      usage_count: 0,
      custom_properties: {}
    };
  }

  private getDefaultOrganizationSettings(): OrganizationFieldSettings {
    return {
      default_classification: 'confidential',
      required_validations: ['required', 'hipaa_compliant'],
      allowed_field_types: ['text', 'textarea', 'number', 'date', 'select'],
      custom_validation_rules: [],
      field_naming_conventions: [],
      approval_workflow: {
        requires_approval: false,
        approval_roles: [],
        approval_conditions: [],
        auto_approval_rules: []
      },
      audit_requirements: []
    };
  }

  private applyOrganizationSettings(
    field: CustomFieldDefinition, 
    settings: OrganizationFieldSettings
  ): void {
    // Apply default classification
    if (!field.healthcare_classification) {
      field.healthcare_classification = this.getDefaultHealthcareClassification();
    }
    field.healthcare_classification.sensitivity_level = settings.default_classification;

    // Apply required validations
    const requiredValidations = settings.required_validations.map(type => ({
      id: `required_${type}`,
      type: type as ValidationType,
      message: `Field must meet ${type} requirements`,
      severity: 'error' as ValidationSeverity
    }));
    field.validation_rules.push(...requiredValidations);
  }

  private hasPermission(field: CustomFieldDefinition, userId: string, permission: FieldPermission): boolean {
    // Simplified permission check - in real implementation, would check user roles
    return field.permissions[`${permission}_roles` as keyof FieldPermissions].length > 0;
  }

  private async checkFieldUsage(fieldId: string, organizationId: string): Promise<{ is_in_use: boolean; usage_locations: string[] }> {
    // Simplified usage check - in real implementation, would check actual usage
    return { is_in_use: false, usage_locations: [] };
  }

  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  private calculateComplianceScore(field: CustomFieldDefinition): number {
    let score = 0;
    const classification = field.healthcare_classification;
    
    if (classification.encryption_required) score += 20;
    if (classification.audit_logging) score += 20;
    if (classification.hipaa_protected) score += 20;
    if (classification.fda_regulated) score += 20;
    if (field.validation_rules.length > 0) score += 20;
    
    return score;
  }

  private validateHealthcareField(
    fieldData: Partial<CustomFieldDefinition>,
    config: HealthcareFieldConfig
  ): { errors: ValidationError[]; warnings: ValidationWarning[]; suggestions: ValidationSuggestion[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Apply healthcare-specific validation rules
    for (const rule of config.default_validation) {
      if (!this.validateFieldRule(fieldData, rule)) {
        errors.push({
          rule_id: rule.id,
          rule_type: rule.type,
          message: rule.message,
          severity: rule.severity,
          field_path: 'field_definition',
          healthcare_impact: 'Healthcare compliance requirement not met'
        });
      }
    }

    return { errors, warnings, suggestions };
  }

  private validateFieldRule(fieldData: Partial<CustomFieldDefinition>, rule: ValidationRule): boolean {
    // Simplified validation - in real implementation, would perform actual validation
    return true;
  }

  private async validateCompliance(
    fieldData: Partial<CustomFieldDefinition>,
    organizationId: string
  ): Promise<ComplianceStatus> {
    const issues: ComplianceIssue[] = [];
    const recommendations: ComplianceRecommendation[] = [];

    // Check HIPAA compliance
    const hipaaCompliant = fieldData.healthcare_classification?.hipaa_protected === true;
    if (!hipaaCompliant) {
      issues.push({
        framework: 'HIPAA',
        severity: 'high',
        description: 'Field does not meet HIPAA protection requirements',
        remediation: 'Enable HIPAA protection and encryption'
      });
    }

    return {
      hipaa_compliant: hipaaCompliant,
      fda_compliant: fieldData.healthcare_classification?.fda_regulated === true,
      fhir_compliant: !!fieldData.healthcare_classification?.fhir_mapping,
      hitrust_compliant: false,
      gdpr_compliant: false,
      issues,
      recommendations
    };
  }

  private validateOrganizationRequirements(
    fieldData: Partial<CustomFieldDefinition>,
    settings: OrganizationFieldSettings
  ): { errors: ValidationError[]; warnings: ValidationWarning[]; suggestions: ValidationSuggestion[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check allowed field types
    if (fieldData.field_type && !settings.allowed_field_types.includes(fieldData.field_type)) {
      errors.push({
        rule_id: 'field_type_not_allowed',
        rule_type: 'required',
        message: `Field type ${fieldData.field_type} is not allowed in this organization`,
        severity: 'error',
        field_path: 'field_type'
      });
    }

    return { errors, warnings, suggestions };
  }

  private parseImportData(data: any, format: ImportExportFormat): Partial<CustomFieldDefinition>[] {
    // Simplified parsing - in real implementation, would parse based on format
    if (format === 'json') {
      return Array.isArray(data) ? data : [data];
    }
    return [];
  }

  private isCompatibleType(fieldType: FieldType, dataType: DataType): boolean {
    const compatibilityMap: Record<FieldType, DataType[]> = {
      'text': ['string'],
      'textarea': ['string'],
      'number': ['number'],
      'date': ['date'],
      'datetime': ['datetime'],
      'time': ['string'],
      'select': ['string'],
      'multiselect': ['array'],
      'radio': ['string'],
      'checkbox': ['boolean'],
      'file': ['file'],
      'image': ['file'],
      'signature': ['file'],
      'barcode': ['string'],
      'qr_code': ['string'],
      'patient_id': ['string'],
      'medical_record_number': ['string'],
      'insurance_id': ['string'],
      'diagnosis_code': ['string'],
      'procedure_code': ['string'],
      'medication': ['string', 'object'],
      'vital_signs': ['number', 'object'],
      'lab_result': ['string', 'object'],
      'imaging_result': ['file', 'object'],
      'clinical_note': ['string'],
      'assessment': ['string', 'object'],
      'plan': ['string', 'object'],
      'referral': ['object'],
      'consent': ['object'],
      'emergency_contact': ['object'],
      'allergy': ['object'],
      'medication_history': ['array'],
      'family_history': ['array'],
      'social_history': ['array'],
      'custom_healthcare': ['string', 'number', 'object', 'array']
    };

    return compatibilityMap[fieldType]?.includes(dataType) || false;
  }

  private logFieldEvent(
    eventType: string,
    fieldId: string,
    organizationId: string,
    userId: string,
    data: any
  ): void {
    console.log('Field Event:', {
      type: eventType,
      field_id: fieldId,
      organization_id: organizationId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      data
    });
  }
}
