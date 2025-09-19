/**
 * Environment-Specific Configurations
 * 
 * This module provides environment-specific configurations for different
 * deployment environments (development, staging, production).
 */

import { z } from 'zod';

// Base configuration schema
const baseConfigSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    environment: z.enum(['development', 'staging', 'production']),
    baseUrl: z.string().url(),
    debug: z.boolean().default(false),
  }),
  database: z.object({
    url: z.string().url(),
    anonKey: z.string(),
    serviceRoleKey: z.string(),
    jwtSecret: z.string().optional(),
    poolConfig: z.object({
      min: z.number().default(1),
      max: z.number().default(10),
      connectionTimeout: z.number().default(30000),
      idleTimeout: z.number().default(600000),
    }),
  }),
  cache: z.object({
    enabled: z.boolean().default(true),
    url: z.string().optional(),
    ttl: z.number().default(3600),
    prefix: z.string().default('hmhcp'),
    compression: z.boolean().default(false),
  }),
  security: z.object({
    jwtSecret: z.string(),
    sessionSecret: z.string(),
    csrfSecret: z.string(),
    encryption: z.object({
      enabled: z.boolean().default(true),
      keyComponent1: z.string(),
      keyComponent2: z.string(),
      salt: z.string(),
      version: z.string().default('1'),
    }),
    session: z.object({
      secure: z.boolean().default(true),
      httpOnly: z.boolean().default(true),
      sameSite: z.enum(['strict', 'lax', 'none']).default('strict'),
      maxAge: z.number().default(86400000),
      enforceIP: z.boolean().default(false),
    }),
    headers: z.object({
      enabled: z.boolean().default(true),
      csp: z.boolean().default(true),
      hsts: z.boolean().default(true),
      hstsMaxAge: z.number().default(31536000),
    }),
    rateLimiting: z.object({
      enabled: z.boolean().default(true),
      windowMs: z.number().default(900000),
      maxRequests: z.number().default(100),
    }),
  }),
  monitoring: z.object({
    sentry: z.object({
      enabled: z.boolean().default(false),
      dsn: z.string().optional(),
      environment: z.string().optional(),
      tracesSampleRate: z.number().default(0.1),
    }),
    performance: z.object({
      enabled: z.boolean().default(false),
      lighthouseThreshold: z.number().default(90),
    }),
    healthCheck: z.object({
      enabled: z.boolean().default(true),
      timeout: z.number().default(5000),
    }),
  }),
  features: z.object({
    aiFeatures: z.boolean().default(false),
    blog: z.boolean().default(true),
    cms: z.boolean().default(true),
    analytics: z.boolean().default(true),
    telemedicine: z.boolean().default(false),
  }),
  compliance: z.object({
    hipaa: z.object({
      enabled: z.boolean().default(false),
      baaCompliance: z.boolean().default(false),
      auditLogging: z.boolean().default(false),
      dataEncryption: z.boolean().default(false),
      auditRetentionDays: z.number().default(2555),
    }),
    logging: z.object({
      level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
      structured: z.boolean().default(true),
      retentionDays: z.number().default(30),
    }),
  }),
});

type BaseConfig = z.infer<typeof baseConfigSchema>;

// Development configuration
export const developmentConfig: BaseConfig = {
  app: {
    name: 'HMHCP Website (Development)',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0-dev',
    environment: 'development',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
    debug: true,
  },
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    poolConfig: {
      min: 1,
      max: 5,
      connectionTimeout: 30000,
      idleTimeout: 300000,
    },
  },
  cache: {
    enabled: !!process.env.REDIS_URL,
    url: process.env.REDIS_URL,
    ttl: 1800, // 30 minutes for dev
    prefix: 'hmhcp_dev',
    compression: false,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    csrfSecret: process.env.CSRF_TOKEN_SECRET || 'dev-csrf-secret-change-in-production',
    encryption: {
      enabled: false, // Relaxed for development
      keyComponent1: process.env.ENCRYPTION_KEY_COMPONENT_1 || 'dev-key-component-1',
      keyComponent2: process.env.ENCRYPTION_KEY_COMPONENT_2 || 'dev-key-component-2',
      salt: process.env.ENCRYPTION_KEY_SALT || 'dev-salt',
      version: '1',
    },
    session: {
      secure: false, // Allow HTTP in development
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 86400000,
      enforceIP: false,
    },
    headers: {
      enabled: true,
      csp: false, // Relaxed for development
      hsts: false, // No HTTPS enforcement in dev
      hstsMaxAge: 0,
    },
    rateLimiting: {
      enabled: false, // Disabled for development
      windowMs: 900000,
      maxRequests: 1000,
    },
  },
  monitoring: {
    sentry: {
      enabled: false,
      dsn: process.env.SENTRY_DSN,
      environment: 'development',
      tracesSampleRate: 1.0, // Full tracing in dev
    },
    performance: {
      enabled: false,
      lighthouseThreshold: 70, // Relaxed for dev
    },
    healthCheck: {
      enabled: true,
      timeout: 10000,
    },
  },
  features: {
    aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
    blog: true,
    cms: true,
    analytics: false, // Disabled in dev
    telemedicine: false,
  },
  compliance: {
    hipaa: {
      enabled: false,
      baaCompliance: false,
      auditLogging: false,
      dataEncryption: false,
      auditRetentionDays: 365,
    },
    logging: {
      level: 'debug',
      structured: false,
      retentionDays: 7,
    },
  },
};

// Staging configuration
export const stagingConfig: BaseConfig = {
  app: {
    name: 'HMHCP Website (Staging)',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0-staging',
    environment: 'staging',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://staging.hmhealthcarepartners.com',
    debug: false,
  },
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    poolConfig: {
      min: 2,
      max: 8,
      connectionTimeout: 30000,
      idleTimeout: 600000,
    },
  },
  cache: {
    enabled: true,
    url: process.env.REDIS_URL || '',
    ttl: 3600,
    prefix: 'hmhcp_staging',
    compression: true,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    csrfSecret: process.env.CSRF_TOKEN_SECRET || '',
    encryption: {
      enabled: true,
      keyComponent1: process.env.ENCRYPTION_KEY_COMPONENT_1 || '',
      keyComponent2: process.env.ENCRYPTION_KEY_COMPONENT_2 || '',
      salt: process.env.ENCRYPTION_KEY_SALT || '',
      version: '1',
    },
    session: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 86400000,
      enforceIP: false,
    },
    headers: {
      enabled: true,
      csp: true,
      hsts: true,
      hstsMaxAge: 31536000,
    },
    rateLimiting: {
      enabled: true,
      windowMs: 900000,
      maxRequests: 200,
    },
  },
  monitoring: {
    sentry: {
      enabled: true,
      dsn: process.env.SENTRY_DSN,
      environment: 'staging',
      tracesSampleRate: 0.5,
    },
    performance: {
      enabled: true,
      lighthouseThreshold: 85,
    },
    healthCheck: {
      enabled: true,
      timeout: 5000,
    },
  },
  features: {
    aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
    blog: true,
    cms: true,
    analytics: true,
    telemedicine: process.env.TELEMEDICINE_ENABLED === 'true',
  },
  compliance: {
    hipaa: {
      enabled: true,
      baaCompliance: process.env.BAA_COMPLIANCE_MODE === 'true',
      auditLogging: true,
      dataEncryption: true,
      auditRetentionDays: 2555,
    },
    logging: {
      level: 'info',
      structured: true,
      retentionDays: 90,
    },
  },
};

// Production configuration
export const productionConfig: BaseConfig = {
  app: {
    name: 'HMHCP Website',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: 'production',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://hmhealthcarepartners.com',
    debug: false,
  },
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    poolConfig: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '600000'),
    },
  },
  cache: {
    enabled: true,
    url: process.env.REDIS_URL || '',
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    prefix: process.env.CACHE_PREFIX || 'hmhcp_prod',
    compression: process.env.CACHE_COMPRESSION_ENABLED === 'true',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    csrfSecret: process.env.CSRF_TOKEN_SECRET || '',
    encryption: {
      enabled: true,
      keyComponent1: process.env.ENCRYPTION_KEY_COMPONENT_1 || '',
      keyComponent2: process.env.ENCRYPTION_KEY_COMPONENT_2 || '',
      salt: process.env.ENCRYPTION_KEY_SALT || '',
      version: process.env.ENCRYPTION_KEY_VERSION || '1',
    },
    session: {
      secure: process.env.SESSION_SECURE !== 'false',
      httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
      sameSite: (process.env.SESSION_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
      enforceIP: process.env.ENFORCE_SESSION_IP === 'true',
    },
    headers: {
      enabled: process.env.SECURE_HEADERS_ENABLED !== 'false',
      csp: process.env.CSP_ENABLED !== 'false',
      hsts: true,
      hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
    },
    rateLimiting: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
  },
  monitoring: {
    sentry: {
      enabled: !!process.env.SENTRY_DSN,
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    },
    performance: {
      enabled: process.env.PERFORMANCE_MONITORING_ENABLED === 'true',
      lighthouseThreshold: parseInt(process.env.LIGHTHOUSE_SCORE_THRESHOLD || '90'),
    },
    healthCheck: {
      enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
    },
  },
  features: {
    aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
    blog: process.env.ENABLE_BLOG !== 'false',
    cms: process.env.ENABLE_CMS !== 'false',
    analytics: process.env.ENABLE_ANALYTICS !== 'false',
    telemedicine: process.env.TELEMEDICINE_ENABLED === 'true',
  },
  compliance: {
    hipaa: {
      enabled: true,
      baaCompliance: process.env.BAA_COMPLIANCE_MODE === 'true',
      auditLogging: process.env.AUDIT_LOGGING_ENABLED === 'true',
      dataEncryption: process.env.DATA_ENCRYPTION_ENABLED === 'true',
      auditRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555'),
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      structured: process.env.LOG_STRUCTURED !== 'false',
      retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
    },
  },
};

// Configuration getter function
export function getEnvironmentConfig(): BaseConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return baseConfigSchema.parse(productionConfig);
    case 'staging':
      return baseConfigSchema.parse(stagingConfig);
    case 'development':
    default:
      return baseConfigSchema.parse(developmentConfig);
  }
}

// Runtime configuration validation
export function validateRuntimeConfig(): { valid: boolean; errors: string[] } {
  try {
    const config = getEnvironmentConfig();
    
    const errors: string[] = [];

    // Production-specific validations
    if (config.app.environment === 'production') {
      if (!config.app.baseUrl.startsWith('https://')) {
        errors.push('Production base URL must use HTTPS');
      }
      
      if (!config.cache.enabled) {
        errors.push('Cache should be enabled in production');
      }
      
      if (!config.security.encryption.enabled) {
        errors.push('Encryption must be enabled in production');
      }
      
      if (!config.compliance.hipaa.auditLogging) {
        errors.push('Audit logging must be enabled for HIPAA compliance');
      }
    }

    // Security validations
    if (config.security.jwtSecret.length < 64) {
      errors.push('JWT secret must be at least 64 characters');
    }

    if (config.security.sessionSecret.length < 64) {
      errors.push('Session secret must be at least 64 characters');
    }

    // Database validation
    if (!config.database.url || !config.database.anonKey || !config.database.serviceRoleKey) {
      errors.push('Database configuration is incomplete');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Configuration validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

// Export current configuration
export const currentConfig = getEnvironmentConfig();

// Configuration summary for logging
export function getConfigSummary() {
  const config = getEnvironmentConfig();
  
  return {
    environment: config.app.environment,
    version: config.app.version,
    baseUrl: config.app.baseUrl,
    features: {
      aiFeatures: config.features.aiFeatures,
      blog: config.features.blog,
      cms: config.features.cms,
      analytics: config.features.analytics,
      telemedicine: config.features.telemedicine,
    },
    security: {
      encryptionEnabled: config.security.encryption.enabled,
      rateLimitingEnabled: config.security.rateLimiting.enabled,
      secureHeaders: config.security.headers.enabled,
    },
    compliance: {
      hipaaEnabled: config.compliance.hipaa.enabled,
      baaCompliance: config.compliance.hipaa.baaCompliance,
      auditLogging: config.compliance.hipaa.auditLogging,
    },
    monitoring: {
      sentryEnabled: config.monitoring.sentry.enabled,
      performanceEnabled: config.monitoring.performance.enabled,
      healthCheckEnabled: config.monitoring.healthCheck.enabled,
    },
  };
}

export type { BaseConfig };
export default currentConfig;