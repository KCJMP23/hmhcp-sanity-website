/**
 * Production Environment Validator
 * Validates all required environment variables and configurations for production deployment
 */

interface EnvironmentVariable {
  name: string;
  required: boolean;
  sensitive: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  description: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  securityIssues: string[];
}

export class ProductionEnvironmentValidator {
  private readonly requiredVariables: EnvironmentVariable[] = [
    // Core application
    {
      name: 'NODE_ENV',
      required: true,
      sensitive: false,
      defaultValue: 'production',
      validator: (value) => value === 'production',
      description: 'Node.js environment setting'
    },
    {
      name: 'NEXT_PUBLIC_SITE_URL',
      required: true,
      sensitive: false,
      validator: (value) => value.startsWith('https://'),
      description: 'Public site URL with HTTPS'
    },
    
    // Database configuration
    {
      name: 'SUPABASE_URL',
      required: true,
      sensitive: false,
      validator: (value) => value.startsWith('https://') && value.includes('supabase'),
      description: 'Supabase project URL'
    },
    {
      name: 'SUPABASE_ANON_KEY',
      required: true,
      sensitive: true,
      validator: (value) => value.length > 100,
      description: 'Supabase anonymous key'
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      required: true,
      sensitive: true,
      validator: (value) => value.length > 100,
      description: 'Supabase service role key'
    },
    
    // Redis configuration
    {
      name: 'REDIS_URL',
      required: true,
      sensitive: true,
      validator: (value) => value.includes('redis') || value.includes('rediss'),
      description: 'Redis connection URL'
    },
    
    // Security configuration
    {
      name: 'ENCRYPTION_KEY_COMPONENT_1',
      required: true,
      sensitive: true,
      validator: (value) => value.length >= 32,
      description: 'Primary encryption key component'
    },
    {
      name: 'ENCRYPTION_KEY_COMPONENT_2',
      required: true,
      sensitive: true,
      validator: (value) => value.length >= 32,
      description: 'Secondary encryption key component'
    },
    {
      name: 'ENCRYPTION_KEY_SALT',
      required: true,
      sensitive: true,
      validator: (value) => value.length >= 16,
      description: 'Encryption salt'
    },
    {
      name: 'JWT_SECRET',
      required: true,
      sensitive: true,
      validator: (value) => value.length >= 32,
      description: 'JWT signing secret'
    },
    
    // External services
    {
      name: 'SENDGRID_API_KEY',
      required: true,
      sensitive: true,
      validator: (value) => value.startsWith('SG.'),
      description: 'SendGrid API key for email services'
    },
    {
      name: 'SENTRY_DSN',
      required: true,
      sensitive: true,
      validator: (value) => value.startsWith('https://') && value.includes('sentry.io'),
      description: 'Sentry DSN for error tracking'
    },
    
    // Monitoring and analytics
    {
      name: 'DATADOG_API_KEY',
      required: false,
      sensitive: true,
      description: 'Datadog API key for monitoring'
    },
    {
      name: 'GOOGLE_ANALYTICS_ID',
      required: false,
      sensitive: false,
      validator: (value) => value.startsWith('G-') || value.startsWith('UA-'),
      description: 'Google Analytics tracking ID'
    },
    
    // Rate limiting
    {
      name: 'RATE_LIMIT_MAX_REQUESTS',
      required: false,
      sensitive: false,
      defaultValue: '100',
      validator: (value) => !isNaN(Number(value)) && Number(value) > 0,
      description: 'Maximum requests per window'
    },
    {
      name: 'RATE_LIMIT_WINDOW_MS',
      required: false,
      sensitive: false,
      defaultValue: '900000',
      validator: (value) => !isNaN(Number(value)) && Number(value) > 0,
      description: 'Rate limiting window in milliseconds'
    },
    
    // Cache configuration
    {
      name: 'CACHE_TTL',
      required: false,
      sensitive: false,
      defaultValue: '3600',
      validator: (value) => !isNaN(Number(value)) && Number(value) > 0,
      description: 'Default cache TTL in seconds'
    },
    
    // Healthcare compliance
    {
      name: 'HIPAA_ENCRYPTION_ENABLED',
      required: true,
      sensitive: false,
      defaultValue: 'true',
      validator: (value) => value === 'true',
      description: 'HIPAA encryption requirement flag'
    },
    {
      name: 'AUDIT_LOGGING_ENABLED',
      required: true,
      sensitive: false,
      defaultValue: 'true',
      validator: (value) => value === 'true',
      description: 'Audit logging requirement flag'
    }
  ];

  public validateEnvironment(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingRequired: [],
      securityIssues: []
    };

    // Check each required variable
    for (const variable of this.requiredVariables) {
      const value = process.env[variable.name];

      if (variable.required && !value) {
        result.missingRequired.push(variable.name);
        result.errors.push(`Missing required environment variable: ${variable.name} - ${variable.description}`);
        result.isValid = false;
        continue;
      }

      if (value) {
        // Validate the value if validator is provided
        if (variable.validator && !variable.validator(value)) {
          result.errors.push(`Invalid value for ${variable.name}: ${variable.description}`);
          result.isValid = false;
        }

        // Security checks for sensitive variables
        if (variable.sensitive) {
          this.performSecurityChecks(variable.name, value, result);
        }
      } else if (variable.defaultValue) {
        result.warnings.push(`Using default value for ${variable.name}: ${variable.defaultValue}`);
      }
    }

    // Additional security validations
    this.validateSecurityConfiguration(result);

    return result;
  }

  private performSecurityChecks(variableName: string, value: string, result: ValidationResult): void {
    // Check for common security issues
    const commonWeakValues = ['password', '123456', 'secret', 'default', 'test'];
    
    if (commonWeakValues.some(weak => value.toLowerCase().includes(weak))) {
      result.securityIssues.push(`${variableName} appears to contain weak or default values`);
      result.isValid = false;
    }

    // Check for proper key lengths
    if (variableName.includes('KEY') || variableName.includes('SECRET')) {
      if (value.length < 32) {
        result.securityIssues.push(`${variableName} is too short for secure encryption (minimum 32 characters)`);
        result.isValid = false;
      }
    }

    // Check for proper URL formats
    if (variableName.includes('URL') && !value.startsWith('https://')) {
      result.securityIssues.push(`${variableName} should use HTTPS in production`);
      result.isValid = false;
    }
  }

  private validateSecurityConfiguration(result: ValidationResult): void {
    // Ensure NODE_ENV is production
    if (process.env.NODE_ENV !== 'production') {
      result.securityIssues.push('NODE_ENV must be set to "production" for production deployment');
      result.isValid = false;
    }

    // Validate encryption setup
    const hasEncryption = process.env.ENCRYPTION_KEY_COMPONENT_1 && 
                         process.env.ENCRYPTION_KEY_COMPONENT_2 && 
                         process.env.ENCRYPTION_KEY_SALT;
    
    if (!hasEncryption) {
      result.securityIssues.push('Incomplete encryption configuration - all encryption components required');
      result.isValid = false;
    }

    // Validate HTTPS enforcement
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl && !siteUrl.startsWith('https://')) {
      result.securityIssues.push('Site URL must use HTTPS in production');
      result.isValid = false;
    }

    // Check for development/testing remnants
    const developmentVariables = [
      'DEBUG',
      'DEVELOPMENT_MODE',
      'TEST_MODE',
      'SKIP_SECURITY'
    ];

    for (const devVar of developmentVariables) {
      if (process.env[devVar] === 'true') {
        result.securityIssues.push(`Development variable ${devVar} should not be enabled in production`);
        result.isValid = false;
      }
    }
  }

  public generateReport(): string {
    const validation = this.validateEnvironment();
    
    let report = '# Production Environment Validation Report\\n\\n';
    
    if (validation.isValid) {
      report += '✅ **Status: PASSED** - Environment is ready for production deployment\\n\\n';
    } else {
      report += '❌ **Status: FAILED** - Environment validation failed\\n\\n';
    }

    if (validation.errors.length > 0) {
      report += '## ❌ Errors\\n\\n';
      validation.errors.forEach(error => {
        report += `- ${error}\\n`;
      });
      report += '\\n';
    }

    if (validation.securityIssues.length > 0) {
      report += '## 🔒 Security Issues\\n\\n';
      validation.securityIssues.forEach(issue => {
        report += `- ${issue}\\n`;
      });
      report += '\\n';
    }

    if (validation.warnings.length > 0) {
      report += '## ⚠️ Warnings\\n\\n';
      validation.warnings.forEach(warning => {
        report += `- ${warning}\\n`;
      });
      report += '\\n';
    }

    if (validation.missingRequired.length > 0) {
      report += '## 📋 Missing Required Variables\\n\\n';
      validation.missingRequired.forEach(variable => {
        const config = this.requiredVariables.find(v => v.name === variable);
        report += `- **${variable}**: ${config?.description || 'No description available'}\\n`;
      });
      report += '\\n';
    }

    report += '## 📊 Configuration Summary\\n\\n';
    report += `- **Total Variables Checked**: ${this.requiredVariables.length}\\n`;
    report += `- **Required Variables**: ${this.requiredVariables.filter(v => v.required).length}\\n`;
    report += `- **Sensitive Variables**: ${this.requiredVariables.filter(v => v.sensitive).length}\\n`;
    report += `- **Validation Errors**: ${validation.errors.length}\\n`;
    report += `- **Security Issues**: ${validation.securityIssues.length}\\n`;
    report += `- **Warnings**: ${validation.warnings.length}\\n`;

    return report;
  }

  public validateForDeployment(): boolean {
    const validation = this.validateEnvironment();
    
    if (!validation.isValid) {
      console.error('❌ Environment validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      validation.securityIssues.forEach(issue => console.error(`  - SECURITY: ${issue}`));
      return false;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ Environment validation warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    console.log('✅ Environment validation passed - ready for production deployment');
    return true;
  }
}

// Export singleton instance
export const environmentValidator = new ProductionEnvironmentValidator();

// CLI usage
if (require.main === module) {
  const validator = new ProductionEnvironmentValidator();
  
  if (process.argv.includes('--report')) {
    console.log(validator.generateReport());
  } else {
    const isValid = validator.validateForDeployment();
    process.exit(isValid ? 0 : 1);
  }
}