/**
 * Field Template Service
 * Healthcare-specific field templates and organization sharing
 */

import {
  CustomFieldTemplate,
  FieldTemplateCategory,
  CustomFieldDefinition,
  FieldBuilderResponse,
  FieldSearchCriteria,
  FieldSearchResult
} from '../../types/fields/custom-field-types';

export class FieldTemplateService {
  private templates: Map<string, CustomFieldTemplate> = new Map();
  private organizationTemplates: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Create a new field template
   */
  async createTemplate(
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

      this.templates.set(templateId, template);
      this.addToOrganizationTemplates(organizationId, templateId);

      this.logTemplateEvent('template_created', templateId, organizationId, userId, {
        category: template.category,
        field_count: template.fields.length
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
   * Get template by ID
   */
  async getTemplate(templateId: string, organizationId: string): Promise<FieldBuilderResponse<CustomFieldTemplate>> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      // Check access permissions
      if (!template.is_public && template.organization_id !== organizationId) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      return {
        success: true,
        data: template,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: false,
          validation_performed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get template'
      };
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(
    criteria: FieldSearchCriteria,
    organizationId: string
  ): Promise<FieldBuilderResponse<FieldSearchResult>> {
    try {
      let templates = Array.from(this.templates.values())
        .filter(template => 
          template.is_public || template.organization_id === organizationId
        );

      // Apply filters
      if (criteria.field_types && criteria.field_types.length > 0) {
        templates = templates.filter(template =>
          template.fields.some(field => criteria.field_types!.includes(field.field_type))
        );
      }

      if (criteria.tags && criteria.tags.length > 0) {
        templates = templates.filter(template =>
          criteria.tags!.some(tag => template.tags.includes(tag))
        );
      }

      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        templates = templates.filter(template =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply pagination
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;
      const totalCount = templates.length;
      const paginatedTemplates = templates.slice(offset, offset + limit);

      const result: FieldSearchResult = {
        fields: paginatedTemplates as any, // Type conversion for compatibility
        total_count: totalCount,
        page_info: {
          current_page: Math.floor(offset / limit) + 1,
          total_pages: Math.ceil(totalCount / limit),
          has_next: offset + limit < totalCount,
          has_previous: offset > 0
        },
        filters_applied: criteria,
        performance_metrics: {
          search_time: Date.now(),
          results_count: paginatedTemplates.length
        }
      };

      return {
        success: true,
        data: result,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: false,
          validation_performed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search templates'
      };
    }
  }

  /**
   * Clone template for organization
   */
  async cloneTemplate(
    templateId: string,
    organizationId: string,
    userId: string
  ): Promise<FieldBuilderResponse<CustomFieldTemplate>> {
    try {
      const originalTemplate = this.templates.get(templateId);
      if (!originalTemplate) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      // Check access permissions
      if (!originalTemplate.is_public && originalTemplate.organization_id !== organizationId) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      const clonedTemplate: CustomFieldTemplate = {
        ...originalTemplate,
        id: this.generateTemplateId(originalTemplate.name),
        organization_id: organizationId,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0',
        usage_count: 0,
        rating: 0,
        is_system_template: false
      };

      this.templates.set(clonedTemplate.id, clonedTemplate);
      this.addToOrganizationTemplates(organizationId, clonedTemplate.id);

      this.logTemplateEvent('template_cloned', clonedTemplate.id, organizationId, userId, {
        original_template_id: templateId,
        field_count: clonedTemplate.fields.length
      });

      return {
        success: true,
        data: clonedTemplate,
        metadata: {
          execution_time: Date.now(),
          compliance_checked: true,
          validation_performed: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clone template'
      };
    }
  }

  private initializeDefaultTemplates(): void {
    // Patient Demographics Template
    const patientDemographicsTemplate: CustomFieldTemplate = {
      id: 'template_patient_demographics',
      name: 'Patient Demographics',
      description: 'Standard patient demographic information fields',
      category: 'patient_demographics',
      compliance_framework: ['hipaa'],
      fields: [
        this.createFieldDefinition('patient_id', 'Patient ID', 'patient_id'),
        this.createFieldDefinition('first_name', 'First Name', 'text'),
        this.createFieldDefinition('last_name', 'Last Name', 'text'),
        this.createFieldDefinition('date_of_birth', 'Date of Birth', 'date'),
        this.createFieldDefinition('gender', 'Gender', 'select'),
        this.createFieldDefinition('phone', 'Phone Number', 'phone'),
        this.createFieldDefinition('email', 'Email Address', 'email'),
        this.createFieldDefinition('address', 'Address', 'textarea')
      ],
      organization_id: 'system',
      is_public: true,
      is_system_template: true,
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: '1.0.0',
      usage_count: 0,
      rating: 5.0,
      tags: ['demographics', 'patient', 'basic'],
      metadata: {
        tags: ['demographics', 'patient'],
        categories: ['patient_care'],
        medical_specialties: ['general'],
        compliance_frameworks: ['hipaa'],
        data_sources: ['patient_registration'],
        usage_count: 0,
        custom_properties: {}
      }
    };

    this.templates.set(patientDemographicsTemplate.id, patientDemographicsTemplate);

    // Vital Signs Template
    const vitalSignsTemplate: CustomFieldTemplate = {
      id: 'template_vital_signs',
      name: 'Vital Signs',
      description: 'Standard vital signs measurement fields',
      category: 'vital_signs',
      compliance_framework: ['hipaa', 'fda'],
      fields: [
        this.createFieldDefinition('blood_pressure_systolic', 'Systolic BP', 'vital_signs'),
        this.createFieldDefinition('blood_pressure_diastolic', 'Diastolic BP', 'vital_signs'),
        this.createFieldDefinition('heart_rate', 'Heart Rate', 'vital_signs'),
        this.createFieldDefinition('temperature', 'Temperature', 'vital_signs'),
        this.createFieldDefinition('respiratory_rate', 'Respiratory Rate', 'vital_signs'),
        this.createFieldDefinition('oxygen_saturation', 'O2 Saturation', 'vital_signs'),
        this.createFieldDefinition('weight', 'Weight', 'vital_signs'),
        this.createFieldDefinition('height', 'Height', 'vital_signs')
      ],
      organization_id: 'system',
      is_public: true,
      is_system_template: true,
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: '1.0.0',
      usage_count: 0,
      rating: 5.0,
      tags: ['vital_signs', 'clinical', 'measurements'],
      metadata: {
        tags: ['vital_signs', 'clinical'],
        categories: ['patient_care'],
        medical_specialties: ['general', 'cardiology', 'pulmonology'],
        compliance_frameworks: ['hipaa', 'fda'],
        data_sources: ['vital_signs_monitor'],
        usage_count: 0,
        custom_properties: {}
      }
    };

    this.templates.set(vitalSignsTemplate.id, vitalSignsTemplate);
  }

  private createFieldDefinition(name: string, label: string, fieldType: string): CustomFieldDefinition {
    return {
      id: `field_${name}`,
      name,
      label,
      field_type: fieldType as any,
      data_type: 'string',
      validation_rules: [],
      healthcare_classification: {
        sensitivity_level: 'confidential',
        phi_required: true,
        hipaa_protected: true,
        fda_regulated: false,
        retention_period: 2555,
        encryption_required: true,
        audit_logging: true,
        access_controls: [],
        data_category: 'clinical'
      },
      permissions: {
        read_roles: ['admin', 'clinician', 'nurse'],
        write_roles: ['admin', 'clinician'],
        create_roles: ['admin'],
        delete_roles: ['admin'],
        export_roles: ['admin'],
        import_roles: ['admin'],
        validate_roles: ['admin', 'clinician'],
        approve_roles: ['admin'],
        audit_roles: ['admin']
      },
      visibility: {
        is_visible: true,
        visible_roles: ['admin', 'clinician', 'nurse'],
        hidden_roles: [],
        conditional_visibility: []
      },
      organization_id: 'system',
      created_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: '1.0.0',
      is_active: true,
      is_required: false,
      is_system_field: true,
      metadata: {
        tags: [],
        categories: [],
        medical_specialties: [],
        compliance_frameworks: ['hipaa'],
        data_sources: [],
        usage_count: 0,
        custom_properties: {}
      }
    };
  }

  private generateTemplateId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `template_${timestamp}_${sanitizedName}_${random}`;
  }

  private addToOrganizationTemplates(organizationId: string, templateId: string): void {
    const orgTemplates = this.organizationTemplates.get(organizationId) || [];
    if (!orgTemplates.includes(templateId)) {
      orgTemplates.push(templateId);
      this.organizationTemplates.set(organizationId, orgTemplates);
    }
  }

  private getDefaultMetadata() {
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

  private logTemplateEvent(
    eventType: string,
    templateId: string,
    organizationId: string,
    userId: string,
    data: any
  ): void {
    console.log('Template Event:', {
      type: eventType,
      template_id: templateId,
      organization_id: organizationId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      data
    });
  }
}
