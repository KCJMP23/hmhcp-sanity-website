'use client';

// Production environment configuration management
export interface EnvironmentConfig {
  nodeEnv: 'development' | 'staging' | 'production';
  database: {
    url: string;
    ssl: boolean;
    maxConnections: number;
    timeout: number;
  };
  redis: {
    url: string;
    password?: string;
    tls: boolean;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    rateLimitEnabled: boolean;
    csrfEnabled: boolean;
  };
  monitoring: {
    sentryDsn?: string;
    webhookUrl?: string;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  cdn: {
    baseUrl?: string;
    cloudflareZone?: string;
    awsRegion?: string;
  };
  email: {
    provider: 'sendgrid' | 'ses' | 'smtp';
    apiKey?: string;
    fromAddress: string;
  };
  features: {
    analytics: boolean;
    cms: boolean;
    webhooks: boolean;
    subscriptions: boolean;
  };
}

export interface DeploymentConfig {
  environment: string;
  version: string;
  buildId: string;
  deployedAt: string;
  gitCommit?: string;
  gitBranch?: string;
  buildNumber?: string;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  private deployment: DeploymentConfig;
  private validated = false;
  
  constructor() {
    this.config = this.loadConfiguration();
    this.deployment = this.loadDeploymentInfo();
  }
  
  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    return {
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      database: {
        url: process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        ssl: process.env.NODE_ENV === 'production',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        timeout: parseInt(process.env.DB_TIMEOUT || '30000'),
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        tls: process.env.NODE_ENV === 'production',
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key',
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        csrfEnabled: process.env.CSRF_ENABLED !== 'false',
      },
      monitoring: {
        sentryDsn: process.env.SENTRY_DSN,
        webhookUrl: process.env.MONITORING_WEBHOOK_URL,
        logLevel: (process.env.LOG_LEVEL as any) || 'info',
      },
      cdn: {
        baseUrl: process.env.CDN_BASE_URL,
        cloudflareZone: process.env.CLOUDFLARE_ZONE,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
      },
      email: {
        provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
        apiKey: process.env.EMAIL_API_KEY,
        fromAddress: process.env.EMAIL_FROM || 'noreply@hmhealthcare.com',
      },
      features: {
        analytics: process.env.FEATURE_ANALYTICS !== 'false',
        cms: process.env.FEATURE_CMS !== 'false',
        webhooks: process.env.FEATURE_WEBHOOKS !== 'false',
        subscriptions: process.env.FEATURE_SUBSCRIPTIONS === 'true',
      },
    };
  }

  private loadDeploymentInfo(): DeploymentConfig {
    return {
      environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      buildId: process.env.BUILD_ID || 'dev-build',
      deployedAt: process.env.DEPLOYED_AT || new Date().toISOString(),
      gitCommit: process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA,
      gitBranch: process.env.GIT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF,
      buildNumber: process.env.BUILD_NUMBER,
    };
  }

  // Validate environment configuration
  validateEnvironment(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required environment variables
    const required = {
      'Database URL': this.config.database.url,
      'JWT Secret': this.config.security.jwtSecret,
    };

    Object.entries(required).forEach(([name, value]) => {
      if (!value || value === '') {
        errors.push(`${name} is required but not set`);
      }
    });

    // Production-specific validations
    if (this.config.nodeEnv === 'production') {
      const productionRequired = {
        'Sentry DSN': this.config.monitoring.sentryDsn,
        'Encryption Key': this.config.security.encryptionKey,
      };

      Object.entries(productionRequired).forEach(([name, value]) => {
        if (!value) {
          warnings.push(`${name} should be set in production`);
        }
      });

      // Security validations
      if (this.config.security.jwtSecret === 'dev-secret-change-in-production') {
        errors.push('JWT Secret is using default value in production');
      }

      if (this.config.security.encryptionKey === 'dev-encryption-key') {
        errors.push('Encryption Key is using default value in production');
      }

      if (!this.config.database.ssl) {
        warnings.push('Database SSL is disabled in production');
      }
    }

    // Feature flag validations
    if (this.config.features.analytics && !this.config.monitoring.sentryDsn) {
      warnings.push('Analytics enabled but no monitoring configured');
    }

    this.validated = errors.length === 0;
    
    return {
      valid: this.validated,
      errors,
      warnings,
    };
  }

  // Get configuration
  getConfig(): EnvironmentConfig {
    if (!this.validated) {
      this.validateEnvironment();
    }
    return { ...this.config };
  }

  // Get deployment info
  getDeploymentInfo(): DeploymentConfig {
    return { ...this.deployment };
  }

  // Check if feature is enabled
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Get environment-specific settings
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isStaging(): boolean {
    return this.config.nodeEnv === 'staging';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  // Get database configuration
  getDatabaseConfig(): EnvironmentConfig['database'] {
    return { ...this.config.database };
  }

  // Get security configuration
  getSecurityConfig(): EnvironmentConfig['security'] {
    return { ...this.config.security };
  }

  // Get monitoring configuration
  getMonitoringConfig(): EnvironmentConfig['monitoring'] {
    return { ...this.config.monitoring };
  }

  // Generate environment report
  generateReport(): {
    environment: string;
    deployment: DeploymentConfig;
    validation: ReturnType<EnvironmentManager['validateEnvironment']>;
    features: EnvironmentConfig['features'];
    health: {
      database: boolean;
      redis: boolean;
      monitoring: boolean;
    };
  } {
    const validation = this.validateEnvironment();
    
    return {
      environment: this.config.nodeEnv,
      deployment: this.deployment,
      validation,
      features: this.config.features,
      health: {
        database: !!this.config.database.url,
        redis: !!this.config.redis.url,
        monitoring: !!this.config.monitoring.sentryDsn,
      },
    };
  }

  // Export configuration for external tools
  exportConfig(): {
    sanitized: Record<string, any>;
    sensitive: string[];
  } {
    const sensitive = [
      'jwtSecret',
      'encryptionKey',
      'password',
      'apiKey',
      'sentryDsn',
    ];

    const sanitized = JSON.parse(JSON.stringify(this.config, (key, value) => {
      if (sensitive.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        return '[REDACTED]';
      }
      return value;
    }));

    return {
      sanitized,
      sensitive,
    };
  }

  // Update runtime configuration (for dynamic features)
  updateFeatureFlag(feature: keyof EnvironmentConfig['features'], enabled: boolean): void {
    this.config.features[feature] = enabled;
    // Feature ${feature} ${enabled ? 'enabled' : 'disabled'}
  }

  // Get runtime metrics
  getRuntimeMetrics(): {
    uptime: number;
    memory: NodeJS.MemoryUsage | null;
    version: string;
    platform: string;
    nodeVersion: string;
  } {
    const memory = typeof process !== 'undefined' ? process.memoryUsage() : null;
    
    return {
      uptime: typeof process !== 'undefined' ? process.uptime() * 1000 : 0,
      memory,
      version: this.deployment.version,
      platform: typeof process !== 'undefined' ? process.platform : 'unknown',
      nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
    };
  }
}

// Environment-specific configurations
export const ENVIRONMENT_CONFIGS = {
  development: {
    logLevel: 'debug',
    rateLimitEnabled: false,
    ssl: false,
    features: {
      analytics: true,
      cms: true,
      webhooks: false,
      subscriptions: false,
    },
  },
  staging: {
    logLevel: 'info',
    rateLimitEnabled: true,
    ssl: true,
    features: {
      analytics: true,
      cms: true,
      webhooks: true,
      subscriptions: false,
    },
  },
  production: {
    logLevel: 'error',
    rateLimitEnabled: true,
    ssl: true,
    features: {
      analytics: true,
      cms: true,
      webhooks: true,
      subscriptions: true,
    },
  },
};

// Singleton instance
export const environmentManager = EnvironmentManager.getInstance();

// React hook for environment
export function useEnvironment() {
  return {
    config: environmentManager.getConfig(),
    deployment: environmentManager.getDeploymentInfo(),
    isFeatureEnabled: environmentManager.isFeatureEnabled.bind(environmentManager),
    isDevelopment: environmentManager.isDevelopment(),
    isStaging: environmentManager.isStaging(),
    isProduction: environmentManager.isProduction(),
    validate: environmentManager.validateEnvironment.bind(environmentManager),
    generateReport: environmentManager.generateReport.bind(environmentManager),
  };
}

// Initialize environment validation
export function initializeEnvironment(): void {
  const validation = environmentManager.validateEnvironment();
  
  if (!validation.valid) {
    // Environment validation failed: validation.errors
    if (environmentManager.isProduction()) {
      throw new Error('Invalid production environment configuration');
    }
  }
  
  if (validation.warnings.length > 0) {
    // Environment warnings: validation.warnings
  }
  
  // Environment initialized
}

// Environment utilities
export const env = {
  get: (key: string, defaultValue?: string): string => {
    return process.env[key] || defaultValue || '';
  },
  getNumber: (key: string, defaultValue: number = 0): number => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  },
  getBoolean: (key: string, defaultValue: boolean = false): boolean => {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  },
  getArray: (key: string, separator: string = ','): string[] => {
    const value = process.env[key];
    return value ? value.split(separator).map(s => s.trim()) : [];
  },
  require: (key: string): string => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  },
};

// Auto-initialize on import
if (typeof window === 'undefined') {
  try {
    initializeEnvironment();
  } catch (error) {
    // Failed to initialize environment: error
  }
}