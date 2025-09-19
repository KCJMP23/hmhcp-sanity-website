/**
 * Healthcare System Integration Templates
 * Pre-built templates for popular healthcare systems
 */

import { createClient } from '@supabase/supabase-js';

export interface IntegrationTemplate {
  id: string;
  name: string;
  systemType: 'epic' | 'cerner' | 'allscripts' | 'custom';
  version: string;
  description: string;
  features: string[];
  requirements: IntegrationRequirement[];
  configuration: IntegrationConfiguration;
  setupSteps: SetupStep[];
  testing: TestingGuide;
  compliance: ComplianceInfo;
  support: SupportInfo;
}

export interface IntegrationRequirement {
  id: string;
  name: string;
  description: string;
  type: 'hardware' | 'software' | 'network' | 'security' | 'compliance';
  required: boolean;
  healthcareSpecific: boolean;
  estimatedCost?: number;
  estimatedTime?: string;
}

export interface IntegrationConfiguration {
  id: string;
  name: string;
  description: string;
  fields: ConfigurationField[];
  validationRules: ValidationRule[];
  healthcareMappings: HealthcareMapping[];
}

export interface ConfigurationField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'password';
  label: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: string;
  healthcareContext?: string;
}

export interface ValidationRule {
  id: string;
  fieldId: string;
  type: 'required' | 'format' | 'range' | 'custom';
  rule: string;
  message: string;
  healthcareImpact: boolean;
}

export interface HealthcareMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformation?: string;
  validation?: string;
  healthcareContext: string;
}

export interface SetupStep {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedTime: string;
  prerequisites: string[];
  instructions: string[];
  validation: string[];
  healthcareConsiderations: string[];
  troubleshooting?: TroubleshootingInfo;
}

export interface TroubleshootingInfo {
  commonIssues: CommonIssue[];
  diagnosticSteps: string[];
  escalationPath: string;
}

export interface CommonIssue {
  issue: string;
  cause: string;
  solution: string;
  healthcareImpact: boolean;
}

export interface TestingGuide {
  id: string;
  testCases: TestCase[];
  healthcareScenarios: HealthcareScenario[];
  performanceTests: PerformanceTest[];
  securityTests: SecurityTest[];
  complianceTests: ComplianceTest[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  healthcareContext: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealthcareScenario {
  id: string;
  name: string;
  description: string;
  patientData: any;
  expectedOutcome: string;
  complianceRequirements: string[];
}

export interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  load: number;
  duration: string;
  healthcarePriority: boolean;
}

export interface SecurityTest {
  id: string;
  name: string;
  description: string;
  testType: 'authentication' | 'authorization' | 'encryption' | 'audit';
  healthcareCompliance: boolean;
}

export interface ComplianceTest {
  id: string;
  name: string;
  description: string;
  standard: 'HIPAA' | 'FHIR' | 'HL7' | 'HITECH';
  testSteps: string[];
  expectedResult: string;
}

export interface ComplianceInfo {
  standards: string[];
  certifications: string[];
  auditRequirements: string[];
  dataProtection: string[];
  accessControls: string[];
  monitoring: string[];
}

export interface SupportInfo {
  documentation: string[];
  tutorials: string[];
  community: string;
  supportChannels: string[];
  escalationPath: string;
  healthcareSupport: boolean;
}

export class IntegrationTemplatesService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get all available integration templates
   */
  async getTemplates(): Promise<IntegrationTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('integration_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map(template => this.formatTemplate(template));
    } catch (error) {
      console.error('Failed to get integration templates:', error);
      return this.getDefaultTemplates();
    }
  }

  /**
   * Get specific integration template
   */
  async getTemplate(templateId: string): Promise<IntegrationTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('integration_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !data) return null;

      return this.formatTemplate(data);
    } catch (error) {
      console.error('Failed to get integration template:', error);
      return null;
    }
  }

  /**
   * Create custom integration template
   */
  async createCustomTemplate(template: Omit<IntegrationTemplate, 'id'>): Promise<IntegrationTemplate> {
    try {
      const id = crypto.randomUUID();
      const customTemplate: IntegrationTemplate = {
        ...template,
        id
      };

      const { data, error } = await this.supabase
        .from('integration_templates')
        .insert([customTemplate])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create custom template:', error);
      throw new Error('Custom template creation failed');
    }
  }

  /**
   * Validate integration configuration
   */
  async validateConfiguration(
    templateId: string,
    configuration: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        return { valid: false, errors: ['Template not found'] };
      }

      const errors: string[] = [];
      
      // Validate required fields
      template.configuration.fields.forEach(field => {
        if (field.required && !configuration[field.name]) {
          errors.push(`${field.label} is required`);
        }
      });

      // Validate field formats
      template.configuration.validationRules.forEach(rule => {
        const value = configuration[rule.fieldId];
        if (value && !this.validateField(value, rule)) {
          errors.push(rule.message);
        }
      });

      return { valid: errors.length === 0, errors };
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Generate setup instructions
   */
  async generateSetupInstructions(templateId: string, configuration: any): Promise<string[]> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) return [];

      const instructions: string[] = [];
      
      template.setupSteps.forEach(step => {
        instructions.push(`Step ${step.order}: ${step.name}`);
        instructions.push(step.description);
        step.instructions.forEach(instruction => {
          instructions.push(`  - ${instruction}`);
        });
        instructions.push('');
      });

      return instructions;
    } catch (error) {
      console.error('Failed to generate setup instructions:', error);
      return [];
    }
  }

  // Private helper methods

  private formatTemplate(data: any): IntegrationTemplate {
    return {
      id: data.id,
      name: data.name,
      systemType: data.system_type,
      version: data.version,
      description: data.description,
      features: data.features || [],
      requirements: data.requirements || [],
      configuration: data.configuration || {},
      setupSteps: data.setup_steps || [],
      testing: data.testing || {},
      compliance: data.compliance || {},
      support: data.support || {}
    };
  }

  private validateField(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';
      case 'format':
        return new RegExp(rule.rule).test(value);
      case 'range':
        const [min, max] = rule.rule.split('-').map(Number);
        return value >= min && value <= max;
      case 'custom':
        // This would implement custom validation logic
        return true;
      default:
        return true;
    }
  }

  private getDefaultTemplates(): IntegrationTemplate[] {
    return [
      this.getEpicTemplate(),
      this.getCernerTemplate(),
      this.getAllscriptsTemplate()
    ];
  }

  private getEpicTemplate(): IntegrationTemplate {
    return {
      id: 'epic-template',
      name: 'Epic MyChart Integration',
      systemType: 'epic',
      version: '1.0.0',
      description: 'Complete integration template for Epic MyChart system with FHIR R4 compliance',
      features: [
        'Patient data synchronization',
        'Appointment scheduling',
        'Clinical notes integration',
        'Medication management',
        'Lab results access',
        'FHIR R4 compliance',
        'HIPAA compliance',
        'Real-time data sync'
      ],
      requirements: [
        {
          id: 'req-1',
          name: 'Epic MyChart API Access',
          description: 'Valid Epic MyChart API credentials and endpoint access',
          type: 'software',
          required: true,
          healthcareSpecific: true,
          estimatedCost: 5000,
          estimatedTime: '2-4 weeks'
        },
        {
          id: 'req-2',
          name: 'FHIR R4 Server',
          description: 'Epic FHIR R4 server endpoint configuration',
          type: 'network',
          required: true,
          healthcareSpecific: true,
          estimatedTime: '1-2 weeks'
        },
        {
          id: 'req-3',
          name: 'HIPAA Compliance Review',
          description: 'Legal review and approval for HIPAA compliance',
          type: 'compliance',
          required: true,
          healthcareSpecific: true,
          estimatedTime: '4-6 weeks'
        }
      ],
      configuration: {
        id: 'epic-config',
        name: 'Epic Configuration',
        description: 'Configuration settings for Epic MyChart integration',
        fields: [
          {
            id: 'epic-endpoint',
            name: 'epicEndpoint',
            type: 'string',
            label: 'Epic FHIR Endpoint',
            description: 'The Epic FHIR R4 server endpoint URL',
            required: true,
            validation: '^https://.*\\.epic\\.com/.*$',
            healthcareContext: 'Primary data source for patient information'
          },
          {
            id: 'client-id',
            name: 'clientId',
            type: 'string',
            label: 'Client ID',
            description: 'Epic OAuth2 client identifier',
            required: true,
            healthcareContext: 'Authentication credential for Epic API access'
          },
          {
            id: 'client-secret',
            name: 'clientSecret',
            type: 'password',
            label: 'Client Secret',
            description: 'Epic OAuth2 client secret',
            required: true,
            healthcareContext: 'Secure authentication credential'
          },
          {
            id: 'scopes',
            name: 'scopes',
            type: 'multiselect',
            label: 'API Scopes',
            description: 'Requested API access scopes',
            required: true,
            options: ['patient/read', 'patient/write', 'appointment/read', 'appointment/write'],
            healthcareContext: 'Defines data access permissions'
          }
        ],
        validationRules: [
          {
            id: 'val-1',
            fieldId: 'epic-endpoint',
            type: 'format',
            rule: '^https://.*\\.epic\\.com/.*$',
            message: 'Epic endpoint must be a valid Epic FHIR server URL',
            healthcareImpact: true
          }
        ],
        healthcareMappings: [
          {
            id: 'map-1',
            sourceField: 'patient.id',
            targetField: 'fhir_patient_id',
            transformation: 'direct',
            healthcareContext: 'Patient identifier mapping'
          }
        ]
      },
      setupSteps: [
        {
          id: 'step-1',
          name: 'Epic API Registration',
          description: 'Register application with Epic and obtain credentials',
          order: 1,
          estimatedTime: '1-2 weeks',
          prerequisites: ['Epic developer account', 'Legal approval'],
          instructions: [
            'Create Epic developer account',
            'Submit application for API access',
            'Complete Epic security review',
            'Obtain OAuth2 credentials'
          ],
          validation: ['Verify API access', 'Test authentication'],
          healthcareConsiderations: [
            'Ensure HIPAA compliance in application',
            'Document data usage policies',
            'Implement audit logging'
          ]
        },
        {
          id: 'step-2',
          name: 'FHIR Server Configuration',
          description: 'Configure FHIR R4 server connection and authentication',
          order: 2,
          estimatedTime: '3-5 days',
          prerequisites: ['Epic API credentials'],
          instructions: [
            'Configure FHIR endpoint URL',
            'Set up OAuth2 authentication',
            'Test FHIR server connectivity',
            'Validate FHIR resource access'
          ],
          validation: ['Test FHIR queries', 'Verify data format'],
          healthcareConsiderations: [
            'Ensure secure data transmission',
            'Implement proper error handling',
            'Set up monitoring and alerting'
          ]
        }
      ],
      testing: {
        id: 'epic-testing',
        testCases: [
          {
            id: 'test-1',
            name: 'Patient Data Retrieval',
            description: 'Test retrieval of patient data from Epic',
            steps: [
              'Authenticate with Epic API',
              'Query patient by ID',
              'Validate FHIR response format',
              'Check data completeness'
            ],
            expectedResult: 'Patient data retrieved successfully in FHIR format',
            healthcareContext: 'Core patient data access functionality',
            priority: 'critical'
          }
        ],
        healthcareScenarios: [
          {
            id: 'scenario-1',
            name: 'Emergency Patient Access',
            description: 'Test accessing patient data during emergency',
            patientData: { id: 'emergency-patient-123', condition: 'critical' },
            expectedOutcome: 'Immediate access to critical patient information',
            complianceRequirements: ['HIPAA emergency access', 'Audit logging']
          }
        ],
        performanceTests: [
          {
            id: 'perf-1',
            name: 'High Volume Patient Queries',
            description: 'Test system performance under high load',
            load: 1000,
            duration: '1 hour',
            healthcarePriority: true
          }
        ],
        securityTests: [
          {
            id: 'sec-1',
            name: 'Authentication Security',
            description: 'Test OAuth2 authentication security',
            testType: 'authentication',
            healthcareCompliance: true
          }
        ],
        complianceTests: [
          {
            id: 'comp-1',
            name: 'HIPAA Compliance Test',
            description: 'Verify HIPAA compliance requirements',
            standard: 'HIPAA',
            testSteps: [
              'Verify data encryption in transit',
              'Check audit logging',
              'Validate access controls',
              'Test data retention policies'
            ],
            expectedResult: 'All HIPAA requirements met'
          }
        ]
      },
      compliance: {
        standards: ['HIPAA', 'FHIR R4', 'HL7'],
        certifications: ['Epic MyChart Certified'],
        auditRequirements: ['Annual HIPAA audit', 'Quarterly security review'],
        dataProtection: ['Encryption at rest', 'Encryption in transit', 'Access logging'],
        accessControls: ['Role-based access', 'Multi-factor authentication', 'Session management'],
        monitoring: ['Real-time monitoring', 'Alert system', 'Compliance reporting']
      },
      support: {
        documentation: [
          'Epic MyChart API Documentation',
          'FHIR R4 Implementation Guide',
          'Integration Setup Guide'
        ],
        tutorials: [
          'Getting Started with Epic Integration',
          'FHIR Data Mapping Guide',
          'Troubleshooting Common Issues'
        ],
        community: 'Epic Developer Community',
        supportChannels: ['Email', 'Phone', 'Epic Support Portal'],
        escalationPath: 'Epic Technical Support → Epic Clinical Support',
        healthcareSupport: true
      }
    };
  }

  private getCernerTemplate(): IntegrationTemplate {
    return {
      id: 'cerner-template',
      name: 'Cerner PowerChart Integration',
      systemType: 'cerner',
      version: '1.0.0',
      description: 'Integration template for Cerner PowerChart with HL7 and FHIR support',
      features: [
        'Patient demographics sync',
        'Clinical documentation',
        'Order management',
        'Results reporting',
        'HL7 message processing',
        'FHIR R4 compliance'
      ],
      requirements: [
        {
          id: 'req-1',
          name: 'Cerner API Access',
          description: 'Cerner Developer Portal access and API credentials',
          type: 'software',
          required: true,
          healthcareSpecific: true,
          estimatedCost: 3000,
          estimatedTime: '2-3 weeks'
        }
      ],
      configuration: {
        id: 'cerner-config',
        name: 'Cerner Configuration',
        description: 'Configuration settings for Cerner PowerChart integration',
        fields: [
          {
            id: 'cerner-endpoint',
            name: 'cernerEndpoint',
            type: 'string',
            label: 'Cerner API Endpoint',
            description: 'Cerner API server endpoint URL',
            required: true,
            healthcareContext: 'Primary data source for Cerner system'
          }
        ],
        validationRules: [],
        healthcareMappings: []
      },
      setupSteps: [],
      testing: {
        id: 'cerner-testing',
        testCases: [],
        healthcareScenarios: [],
        performanceTests: [],
        securityTests: [],
        complianceTests: []
      },
      compliance: {
        standards: ['HL7', 'FHIR R4'],
        certifications: [],
        auditRequirements: [],
        dataProtection: [],
        accessControls: [],
        monitoring: []
      },
      support: {
        documentation: [],
        tutorials: [],
        community: '',
        supportChannels: [],
        escalationPath: '',
        healthcareSupport: false
      }
    };
  }

  private getAllscriptsTemplate(): IntegrationTemplate {
    return {
      id: 'allscripts-template',
      name: 'Allscripts Integration',
      systemType: 'allscripts',
      version: '1.0.0',
      description: 'Integration template for Allscripts EHR system',
      features: [
        'Patient data integration',
        'Clinical workflow support',
        'Medication management'
      ],
      requirements: [
        {
          id: 'req-1',
          name: 'Allscripts API Access',
          description: 'Allscripts API credentials and endpoint access',
          type: 'software',
          required: true,
          healthcareSpecific: true,
          estimatedCost: 2000,
          estimatedTime: '1-2 weeks'
        }
      ],
      configuration: {
        id: 'allscripts-config',
        name: 'Allscripts Configuration',
        description: 'Configuration settings for Allscripts integration',
        fields: [
          {
            id: 'allscripts-endpoint',
            name: 'allscriptsEndpoint',
            type: 'string',
            label: 'Allscripts API Endpoint',
            description: 'Allscripts API server endpoint URL',
            required: true,
            healthcareContext: 'Primary data source for Allscripts system'
          }
        ],
        validationRules: [],
        healthcareMappings: []
      },
      setupSteps: [],
      testing: {
        id: 'allscripts-testing',
        testCases: [],
        healthcareScenarios: [],
        performanceTests: [],
        securityTests: [],
        complianceTests: []
      },
      compliance: {
        standards: ['HL7'],
        certifications: [],
        auditRequirements: [],
        dataProtection: [],
        accessControls: [],
        monitoring: []
      },
      support: {
        documentation: [],
        tutorials: [],
        community: '',
        supportChannels: [],
        escalationPath: '',
        healthcareSupport: false
      }
    };
  }
}

export default IntegrationTemplatesService;
