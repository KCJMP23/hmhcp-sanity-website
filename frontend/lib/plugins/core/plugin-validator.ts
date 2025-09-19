/**
 * Plugin Validator - Plugin Manifest and Code Validation
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

import { PluginManifest, HealthcareComplianceConfig } from '@/types/plugins/marketplace';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (manifest: PluginManifest) => boolean | string;
}

export class PluginValidator {
  private readonly rules: ValidationRule[];

  constructor() {
    this.rules = this.initializeValidationRules();
  }

  /**
   * Validate plugin manifest
   */
  async validateManifest(manifest: PluginManifest): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const result = rule.validate(manifest);
        
        if (result === false) {
          const message = `${rule.name}: ${rule.description}`;
          if (rule.severity === 'error') {
            errors.push(message);
            score -= 20;
          } else if (rule.severity === 'warning') {
            warnings.push(message);
            score -= 5;
          }
        } else if (typeof result === 'string') {
          const message = `${rule.name}: ${result}`;
          if (rule.severity === 'error') {
            errors.push(message);
            score -= 20;
          } else if (rule.severity === 'warning') {
            warnings.push(message);
            score -= 5;
          }
        }
      } catch (error) {
        const message = `${rule.name}: Validation error - ${error.message}`;
        errors.push(message);
        score -= 10;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate healthcare compliance
   */
  async validateHealthcareCompliance(compliance: HealthcareComplianceConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // HIPAA compliance validation
    if (!compliance.hipaa) {
      errors.push('HIPAA compliance is required for healthcare plugins');
      score -= 30;
    }

    // Data classification validation
    if (!compliance.dataClassification) {
      errors.push('Data classification is required');
      score -= 20;
    } else if (compliance.dataClassification === 'restricted' && !compliance.encryptionRequired) {
      warnings.push('Restricted data classification should require encryption');
      score -= 10;
    }

    // Audit logging validation
    if (!compliance.auditLogging) {
      warnings.push('Audit logging is recommended for healthcare plugins');
      score -= 5;
    }

    // FDA compliance validation
    if (compliance.fda && !compliance.auditLogging) {
      errors.push('FDA compliance requires audit logging');
      score -= 20;
    }

    // CMS compliance validation
    if (compliance.cms && !compliance.hipaa) {
      errors.push('CMS compliance requires HIPAA compliance');
      score -= 25;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate plugin permissions
   */
  async validatePermissions(permissions: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check for excessive permissions
    if (permissions.network && permissions.fileSystem && permissions.database) {
      warnings.push('Plugin requests extensive permissions - review carefully');
      score -= 10;
    }

    // Check for healthcare data access
    if (permissions.healthcareData && !permissions.auditLogging) {
      errors.push('Healthcare data access requires audit logging');
      score -= 20;
    }

    // Check for required permissions
    if (permissions.healthcareData && !permissions.encryption) {
      errors.push('Healthcare data access requires encryption permission');
      score -= 20;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): ValidationRule[] {
    return [
      // Required fields
      {
        name: 'required_name',
        description: 'Plugin name is required',
        severity: 'error',
        validate: (manifest) => !!manifest.name && manifest.name.trim().length > 0
      },
      {
        name: 'required_version',
        description: 'Plugin version is required',
        severity: 'error',
        validate: (manifest) => !!manifest.version && this.isValidVersion(manifest.version)
      },
      {
        name: 'required_main',
        description: 'Plugin main entry point is required',
        severity: 'error',
        validate: (manifest) => !!manifest.main && manifest.main.trim().length > 0
      },

      // Version format validation
      {
        name: 'version_format',
        description: 'Version must follow semantic versioning (e.g., 1.0.0)',
        severity: 'error',
        validate: (manifest) => this.isValidVersion(manifest.version)
      },

      // Name format validation
      {
        name: 'name_format',
        description: 'Plugin name should be descriptive and professional',
        severity: 'warning',
        validate: (manifest) => {
          if (!manifest.name) return false;
          const name = manifest.name.trim();
          return name.length >= 3 && name.length <= 50 && /^[a-zA-Z0-9\s\-_]+$/.test(name);
        }
      },

      // Description validation
      {
        name: 'description_quality',
        description: 'Plugin should have a meaningful description',
        severity: 'warning',
        validate: (manifest) => {
          if (!manifest.description) return 'Description is missing';
          return manifest.description.length >= 20 && manifest.description.length <= 500;
        }
      },

      // Author validation
      {
        name: 'author_presence',
        description: 'Plugin should have an author',
        severity: 'warning',
        validate: (manifest) => !!manifest.author && manifest.author.trim().length > 0
      },

      // License validation
      {
        name: 'license_presence',
        description: 'Plugin should specify a license',
        severity: 'warning',
        validate: (manifest) => !!manifest.license && manifest.license.trim().length > 0
      },

      // Keywords validation
      {
        name: 'keywords_presence',
        description: 'Plugin should have relevant keywords',
        severity: 'info',
        validate: (manifest) => {
          if (!manifest.keywords) return 'Keywords are missing';
          return manifest.keywords.length >= 3 && manifest.keywords.length <= 10;
        }
      },

      // Dependencies validation
      {
        name: 'dependencies_format',
        description: 'Dependencies should be properly formatted',
        severity: 'warning',
        validate: (manifest) => {
          if (!manifest.dependencies) return true;
          return typeof manifest.dependencies === 'object' && !Array.isArray(manifest.dependencies);
        }
      },

      // Healthcare compliance validation
      {
        name: 'healthcare_compliance',
        description: 'Healthcare plugins must have compliance configuration',
        severity: 'error',
        validate: (manifest) => {
          if (!manifest.healthcareCompliance) {
            return 'Healthcare compliance configuration is required';
          }
          return !!manifest.healthcareCompliance.hipaa;
        }
      },

      // Permissions validation
      {
        name: 'permissions_structure',
        description: 'Permissions should be properly structured',
        severity: 'error',
        validate: (manifest) => {
          if (!manifest.permissions) return 'Permissions configuration is required';
          const perms = manifest.permissions;
          return Array.isArray(perms.read) && Array.isArray(perms.write) && Array.isArray(perms.execute);
        }
      },

      // API endpoints validation
      {
        name: 'api_endpoints_structure',
        description: 'API endpoints should be properly structured',
        severity: 'warning',
        validate: (manifest) => {
          if (!manifest.apiEndpoints) return true;
          const api = manifest.apiEndpoints;
          return !api.webhooks || Array.isArray(api.webhooks);
        }
      },

      // Scripts validation
      {
        name: 'scripts_structure',
        description: 'Scripts should be properly structured',
        severity: 'warning',
        validate: (manifest) => {
          if (!manifest.scripts) return true;
          return typeof manifest.scripts === 'object' && !Array.isArray(manifest.scripts);
        }
      },

      // Config validation
      {
        name: 'config_structure',
        description: 'Config should be properly structured',
        severity: 'warning',
        validate: (manifest) => {
          if (!manifest.config) return true;
          return typeof manifest.config === 'object' && !Array.isArray(manifest.config);
        }
      }
    ];
  }

  /**
   * Check if version string is valid semantic version
   */
  private isValidVersion(version: string): boolean {
    if (!version) return false;
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Get validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(ruleName: string): boolean {
    const index = this.rules.findIndex(rule => rule.name === ruleName);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }
}

export default PluginValidator;
