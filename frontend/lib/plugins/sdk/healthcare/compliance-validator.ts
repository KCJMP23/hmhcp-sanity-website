/**
 * Healthcare Compliance Validator
 * 
 * Validates plugin compliance with healthcare regulations including HIPAA, FDA, FHIR,
 * and other healthcare-specific requirements.
 */

import { 
  ComplianceFramework, 
  ComplianceRequirement
} from '../types/healthcare-types';
import { PluginDefinition } from '../types/plugin-types';

export interface ComplianceValidationResult {
  valid: boolean;
  compliance_score: number;
  framework_results: FrameworkValidationResult[];
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
}

export interface FrameworkValidationResult {
  framework: ComplianceFramework;
  compliant: boolean;
  score: number;
  requirements_met: number;
  total_requirements: number;
  issues: ComplianceIssue[];
}

export interface ComplianceViolation {
  framework: string;
  requirement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
}

export interface ComplianceIssue {
  type: 'missing_requirement' | 'insufficient_implementation' | 'configuration_error';
  description: string;
  affected_framework: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'privacy' | 'data_protection' | 'audit' | 'documentation';
  title: string;
  description: string;
  implementation_steps: string[];
}

export class HealthcareComplianceValidator {
  private frameworks: Map<string, ComplianceFramework> = new Map();
  private requirements: Map<string, ComplianceRequirement[]> = new Map();

  constructor() {
    this.initializeFrameworks();
    this.initializeRequirements();
  }

  /**
   * Validate plugin against healthcare compliance requirements
   */
  async validatePluginCompliance(
    plugin: PluginDefinition,
    targetFrameworks: ComplianceFramework[] = []
  ): Promise<ComplianceValidationResult> {
    const frameworks = targetFrameworks.length > 0 ? targetFrameworks : this.getDefaultFrameworks();
    const frameworkResults: FrameworkValidationResult[] = [];
    const allViolations: ComplianceViolation[] = [];
    const allRecommendations: ComplianceRecommendation[] = [];

    let totalScore = 0;
    let validFrameworks = 0;

    for (const framework of frameworks) {
      const result = await this.validateFramework(plugin, framework);
      frameworkResults.push(result);
      
      if (result.compliant) {
        validFrameworks++;
      }
      
      totalScore += result.score;
      allViolations.push(...this.convertIssuesToViolations(result.issues, framework));
    }

    const overallScore = totalScore / frameworks.length;
    const isCompliant = validFrameworks === frameworks.length;
    
    // Generate recommendations based on validation results
    allRecommendations.push(...this.generateRecommendations(frameworkResults, plugin));

    return {
      valid: isCompliant,
      compliance_score: overallScore,
      framework_results: frameworkResults,
      violations: allViolations,
      recommendations: allRecommendations
    };
  }

  /**
   * Validate specific compliance framework
   */
  private async validateFramework(
    plugin: PluginDefinition,
    framework: ComplianceFramework
  ): Promise<FrameworkValidationResult> {
    const requirements = this.requirements.get(framework.name) || [];
    const issues: ComplianceIssue[] = [];
    let requirementsMet = 0;

    for (const requirement of requirements) {
      const isMet = await this.validateRequirement(plugin, requirement, framework);
      if (isMet) {
        requirementsMet++;
      } else {
        issues.push({
          type: 'missing_requirement',
          description: `Requirement ${requirement.requirement_id} not met: ${requirement.description}`,
          affected_framework: framework.name,
          severity: requirement.mandatory ? 'high' : 'medium'
        });
      }
    }

    const score = (requirementsMet / requirements.length) * 100;
    const compliant = score >= 80; // 80% threshold for compliance

    return {
      framework,
      compliant,
      score,
      requirements_met: requirementsMet,
      total_requirements: requirements.length,
      issues
    };
  }

  /**
   * Validate individual compliance requirement
   */
  private async validateRequirement(
    plugin: PluginDefinition,
    requirement: ComplianceRequirement,
    framework: ComplianceFramework
  ): Promise<boolean> {
    switch (framework.name) {
      case 'HIPAA':
        return this.validateHIPAARequirement(plugin, requirement);
      case 'FDA':
        return this.validateFDARequirement(plugin, requirement);
      case 'FHIR':
        return this.validateFHIRRequirement(plugin, requirement);
      case 'HITRUST':
        return this.validateHITRUSTRequirement(plugin, requirement);
      case 'SOC2':
        return this.validateSOC2Requirement(plugin, requirement);
      case 'ISO27001':
        return this.validateISO27001Requirement(plugin, requirement);
      default:
        return false;
    }
  }

  /**
   * Validate HIPAA requirements
   */
  private async validateHIPAARequirement(
    plugin: PluginDefinition,
    requirement: ComplianceRequirement
  ): Promise<boolean> {
    switch (requirement.requirement_id) {
      case 'HIPAA-164.312(a)(1)': // Access Control
        return this.validateAccessControl(plugin);
      case 'HIPAA-164.312(b)': // Audit Controls
        return this.validateAuditControls(plugin);
      case 'HIPAA-164.312(c)(1)': // Integrity
        return this.validateDataIntegrity(plugin);
      case 'HIPAA-164.312(d)': // Person or Entity Authentication
        return this.validateAuthentication(plugin);
      case 'HIPAA-164.312(e)(1)': // Transmission Security
        return this.validateTransmissionSecurity(plugin);
      default:
        return false;
    }
  }

  /**
   * Validate FDA requirements
   */
  private async validateFDARequirement(
    plugin: PluginDefinition,
    requirement: ComplianceRequirement
  ): Promise<boolean> {
    switch (requirement.requirement_id) {
      case 'FDA-21CFR820.30': // Design Controls
        return this.validateDesignControls(plugin);
      case 'FDA-21CFR820.70': // Production and Process Controls
        return this.validateProductionControls(plugin);
      case 'FDA-21CFR820.100': // Corrective and Preventive Action
        return this.validateCAPA(plugin);
      default:
        return false;
    }
  }

  /**
   * Validate FHIR requirements
   */
  private async validateFHIRRequirement(
    plugin: PluginDefinition,
    requirement: ComplianceRequirement
  ): Promise<boolean> {
    switch (requirement.requirement_id) {
      case 'FHIR-R4-Resource': // FHIR Resource Compliance
        return this.validateFHIRResourceCompliance(plugin);
      case 'FHIR-R4-Security': // FHIR Security
        return this.validateFHIRSecurity(plugin);
      case 'FHIR-R4-Privacy': // FHIR Privacy
        return this.validateFHIRPrivacy(plugin);
      default:
        return false;
    }
  }

  /**
   * Validate HITRUST requirements
   */
  private async validateHITRUSTRequirement(
    plugin: PluginDefinition,
    _requirement: ComplianceRequirement
  ): Promise<boolean> {
    // HITRUST validation logic
    return plugin.healthcare_compliance?.compliance_level === 'enterprise';
  }

  /**
   * Validate SOC2 requirements
   */
  private async validateSOC2Requirement(
    plugin: PluginDefinition,
    _requirement: ComplianceRequirement
  ): Promise<boolean> {
    // SOC2 validation logic
    return plugin.healthcare_compliance?.compliance_level !== 'standard';
  }

  /**
   * Validate ISO27001 requirements
   */
  private async validateISO27001Requirement(
    plugin: PluginDefinition,
    _requirement: ComplianceRequirement
  ): Promise<boolean> {
    // ISO27001 validation logic
    return plugin.healthcare_compliance?.compliance_level === 'enterprise';
  }

  // Specific validation methods
  private async validateAccessControl(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.healthcare_compliance?.compliance_level &&
      plugin.permissions &&
      plugin.permissions.data_access_level
    );
  }

  private async validateAuditControls(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.healthcare_compliance?.audit_requirements &&
      plugin.healthcare_compliance.audit_requirements.length > 0
    );
  }

  private async validateDataIntegrity(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.healthcare_compliance?.validation_checks &&
      plugin.healthcare_compliance.validation_checks.length > 0
    );
  }

  private async validateAuthentication(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.api_endpoints?.rest_endpoints &&
      plugin.api_endpoints.rest_endpoints.some(ep => ep.authentication.type !== 'none')
    );
  }

  private async validateTransmissionSecurity(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.api_endpoints?.webhooks &&
      plugin.api_endpoints.webhooks.some(wh => wh.authentication.type !== 'none')
    );
  }

  private async validateDesignControls(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.manifest?.version &&
      plugin.manifest?.description &&
      plugin.healthcare_compliance?.compliance_level
    );
  }

  private async validateProductionControls(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.sandbox_config &&
      plugin.sandbox_config.security_policies &&
      plugin.sandbox_config.security_policies.length > 0
    );
  }

  private async validateCAPA(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.healthcare_compliance?.validation_checks &&
      plugin.healthcare_compliance.validation_checks.some(vc => vc.required)
    );
  }

  private async validateFHIRResourceCompliance(plugin: PluginDefinition): Promise<boolean> {
    return plugin.healthcare_compliance?.fhir_compliant === true;
  }

  private async validateFHIRSecurity(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.healthcare_compliance?.fhir_compliant &&
      plugin.api_endpoints?.rest_endpoints &&
      plugin.api_endpoints.rest_endpoints.some(ep => ep.authentication.type !== 'none')
    );
  }

  private async validateFHIRPrivacy(plugin: PluginDefinition): Promise<boolean> {
    return !!(
      plugin.healthcare_compliance?.fhir_compliant &&
      plugin.healthcare_compliance?.hipaa_compliant
    );
  }

  /**
   * Convert issues to violations
   */
  private convertIssuesToViolations(
    issues: ComplianceIssue[],
    framework: ComplianceFramework
  ): ComplianceViolation[] {
    return issues.map(issue => ({
      framework: framework.name,
      requirement: issue.affected_framework,
      severity: issue.severity,
      description: issue.description,
      remediation: this.generateRemediation(issue)
    }));
  }

  /**
   * Generate remediation steps
   */
  private generateRemediation(issue: ComplianceIssue): string {
    switch (issue.type) {
      case 'missing_requirement':
        return `Implement the missing requirement: ${issue.description}`;
      case 'insufficient_implementation':
        return `Enhance the current implementation to meet requirements: ${issue.description}`;
      case 'configuration_error':
        return `Fix configuration issues: ${issue.description}`;
      default:
        return `Address the compliance issue: ${issue.description}`;
    }
  }

  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(
    frameworkResults: FrameworkValidationResult[],
    plugin: PluginDefinition
  ): ComplianceRecommendation[] {
    const recommendations: ComplianceRecommendation[] = [];

    // Check for low compliance scores
    frameworkResults.forEach(result => {
      if (result.score < 80) {
        recommendations.push({
          priority: 'high',
          category: 'compliance',
          title: `Improve ${result.framework.name} Compliance`,
          description: `Current compliance score is ${result.score.toFixed(1)}%. Target: 80%+`,
          implementation_steps: [
            'Review framework requirements',
            'Implement missing controls',
            'Update documentation',
            'Conduct compliance testing'
          ]
        });
      }
    });

    // Check for missing security features
    if (!plugin.healthcare_compliance?.hipaa_compliant) {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        title: 'Implement HIPAA Compliance',
        description: 'Plugin does not meet HIPAA requirements for healthcare data protection',
        implementation_steps: [
          'Implement access controls',
          'Add audit logging',
          'Ensure data encryption',
          'Implement authentication mechanisms'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get default compliance frameworks
   */
  private getDefaultFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }

  /**
   * Initialize compliance frameworks
   */
  private initializeFrameworks(): void {
    this.frameworks.set('HIPAA', {
      name: 'HIPAA',
      version: '2023',
      description: 'Health Insurance Portability and Accountability Act',
      applicable_regions: ['US'],
      healthcare_specific: true
    });

    this.frameworks.set('FDA', {
      name: 'FDA',
      version: '21CFR820',
      description: 'FDA Quality System Regulation',
      applicable_regions: ['US'],
      healthcare_specific: true
    });

    this.frameworks.set('FHIR', {
      name: 'FHIR',
      version: 'R4',
      description: 'Fast Healthcare Interoperability Resources',
      applicable_regions: ['Global'],
      healthcare_specific: true
    });

    this.frameworks.set('HITRUST', {
      name: 'HITRUST',
      version: '9.6',
      description: 'HITRUST Common Security Framework',
      applicable_regions: ['US', 'Global'],
      healthcare_specific: true
    });
  }

  /**
   * Initialize compliance requirements
   */
  private initializeRequirements(): void {
    // HIPAA Requirements
    this.requirements.set('HIPAA', [
      {
        framework: this.frameworks.get('HIPAA')!,
        requirement_id: 'HIPAA-164.312(a)(1)',
        description: 'Implement access controls to restrict access to PHI',
        mandatory: true,
        validation_method: {
          type: 'automated',
          tools: ['access_control_validator'],
          frequency: 'continuous',
          documentation: ['access_control_policy']
        },
        documentation_required: true
      },
      {
        framework: this.frameworks.get('HIPAA')!,
        requirement_id: 'HIPAA-164.312(b)',
        description: 'Implement audit controls to record and examine access to PHI',
        mandatory: true,
        validation_method: {
          type: 'automated',
          tools: ['audit_log_validator'],
          frequency: 'continuous',
          documentation: ['audit_policy']
        },
        documentation_required: true
      }
    ]);

    // FDA Requirements
    this.requirements.set('FDA', [
      {
        framework: this.frameworks.get('FDA')!,
        requirement_id: 'FDA-21CFR820.30',
        description: 'Implement design controls for medical device software',
        mandatory: true,
        validation_method: {
          type: 'hybrid',
          tools: ['design_control_validator'],
          frequency: 'quarterly',
          documentation: ['design_control_documentation']
        },
        documentation_required: true
      }
    ]);

    // FHIR Requirements
    this.requirements.set('FHIR', [
      {
        framework: this.frameworks.get('FHIR')!,
        requirement_id: 'FHIR-R4-Resource',
        description: 'Ensure FHIR resource compliance',
        mandatory: true,
        validation_method: {
          type: 'automated',
          tools: ['fhir_validator'],
          frequency: 'continuous',
          documentation: ['fhir_implementation_guide']
        },
        documentation_required: true
      }
    ]);
  }
}
