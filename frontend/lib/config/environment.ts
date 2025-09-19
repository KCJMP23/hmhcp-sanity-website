/**
 * Environment Configuration for HMHCP Healthcare Website
 * 
 * This module provides type-safe environment configuration
 * with validation and healthcare compliance checks.
 */

import { z } from 'zod';

// Environment schema with validation
const environmentSchema = z.object({
  // Core Application
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),

  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Security (required for healthcare compliance)
  JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters for healthcare compliance'),
  CSRF_TOKEN_SECRET: z.string().min(64, 'CSRF_TOKEN_SECRET must be at least 64 characters'),
  SESSION_SECRET: z.string().min(64, 'SESSION_SECRET must be at least 64 characters'),
  
  // Encryption (HIPAA required)
  ENCRYPTION_KEY_COMPONENT_1: z.string().min(32, 'Encryption key component must be at least 32 characters'),
  ENCRYPTION_KEY_COMPONENT_2: z.string().min(32, 'Encryption key component must be at least 32 characters'),
  ENCRYPTION_KEY_SALT: z.string().min(32, 'Encryption salt must be at least 32 characters'),
  ENCRYPTION_KEY_VERSION: z.string().default('1'),

  // Redis/KV Storage
  REDIS_URL: z.string().optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  // Healthcare Compliance
  AUDIT_LOGGING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  DATA_ENCRYPTION_ENABLED: z.string().transform(val => val === 'true').default('true'),
  BAA_COMPLIANCE_MODE: z.string().transform(val => val === 'true').default('false'),
  AUDIT_LOG_RETENTION_DAYS: z.string().transform(val => parseInt(val)).default('2555'),

  // Session Security
  SESSION_SECURE: z.string().transform(val => val === 'true').default('true'),
  SESSION_HTTP_ONLY: z.string().transform(val => val === 'true').default('true'),
  SESSION_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  ENFORCE_SESSION_IP: z.string().transform(val => val === 'true').default('false'),

  // Security Headers
  SECURE_HEADERS_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CSP_ENABLED: z.string().transform(val => val === 'true').default('true'),
  HSTS_MAX_AGE: z.string().transform(val => parseInt(val)).default('31536000'),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val)).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val)).default('100'),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  HEALTH_CHECK_ENABLED: z.string().transform(val => val === 'true').default('true'),
  PERFORMANCE_MONITORING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  ERROR_TRACKING_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Analytics
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: z.string().optional(),
  ANALYTICS_ANONYMIZE_IP: z.string().transform(val => val === 'true').default('true'),

  // Integrations
  OPENAI_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),

  // Feature Flags
  ENABLE_AI_FEATURES: z.string().transform(val => val === 'true').default('false'),
  ENABLE_BLOG: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CMS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),

  // Development/Testing
  DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  MOCK_EXTERNAL_SERVICES: z.string().transform(val => val === 'true').default('false'),
});

// Type for validated environment
export type Environment = z.infer<typeof environmentSchema>;

// Current environment instance
let cachedEnvironment: Environment | null = null;

/**
 * Get validated environment configuration
 */
export function getEnvironment(): Environment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  try {
    cachedEnvironment = environmentSchema.parse(process.env);
    return cachedEnvironment;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('\\n');
      
      throw new Error(`Environment validation failed:\\n${issues}`);
    }
    throw error;
  }
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return getEnvironment().NODE_ENV === 'production';
}

/**
 * Check if current environment is staging
 */
export function isStaging(): boolean {
  return getEnvironment().NODE_ENV === 'staging';
}

/**
 * Check if current environment is development
 */
export function isDevelopment(): boolean {
  return getEnvironment().NODE_ENV === 'development';
}

/**
 * Check if healthcare compliance mode is enabled
 */
export function isHIPAACompliant(): boolean {
  const env = getEnvironment();
  return env.BAA_COMPLIANCE_MODE && 
         env.AUDIT_LOGGING_ENABLED && 
         env.DATA_ENCRYPTION_ENABLED;
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  const env = getEnvironment();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Get Redis/KV configuration
 */
export function getRedisConfig() {
  const env = getEnvironment();
  return {
    url: env.REDIS_URL,
    restApiUrl: env.KV_REST_API_URL,
    restApiToken: env.KV_REST_API_TOKEN,
  };
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  const env = getEnvironment();
  return {
    jwtSecret: env.JWT_SECRET,
    csrfSecret: env.CSRF_TOKEN_SECRET,
    sessionSecret: env.SESSION_SECRET,
    encryptionKey: `${env.ENCRYPTION_KEY_COMPONENT_1}${env.ENCRYPTION_KEY_COMPONENT_2}`,
    encryptionSalt: env.ENCRYPTION_KEY_SALT,
    encryptionVersion: env.ENCRYPTION_KEY_VERSION,
    sessionConfig: {
      secure: env.SESSION_SECURE,
      httpOnly: env.SESSION_HTTP_ONLY,
      sameSite: env.SESSION_SAME_SITE,
      enforceIP: env.ENFORCE_SESSION_IP,
    },
    headers: {
      enabled: env.SECURE_HEADERS_ENABLED,
      cspEnabled: env.CSP_ENABLED,
      hstsMaxAge: env.HSTS_MAX_AGE,
    },
  };
}

/**
 * Get monitoring configuration
 */
export function getMonitoringConfig() {
  const env = getEnvironment();
  return {
    sentry: {
      dsn: env.SENTRY_DSN,
      publicDsn: env.NEXT_PUBLIC_SENTRY_DSN,
      environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    },
    healthCheck: {
      enabled: env.HEALTH_CHECK_ENABLED,
    },
    performance: {
      enabled: env.PERFORMANCE_MONITORING_ENABLED,
    },
    errorTracking: {
      enabled: env.ERROR_TRACKING_ENABLED,
    },
  };
}

/**
 * Get analytics configuration
 */
export function getAnalyticsConfig() {
  const env = getEnvironment();
  return {
    ga4: {
      measurementId: env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
      anonymizeIP: env.ANALYTICS_ANONYMIZE_IP,
    },
  };
}

/**
 * Get feature flags
 */
export function getFeatureFlags() {
  const env = getEnvironment();
  return {
    aiFeatures: env.ENABLE_AI_FEATURES,
    blog: env.ENABLE_BLOG,
    cms: env.ENABLE_CMS,
    analytics: env.ENABLE_ANALYTICS,
    debugMode: env.DEBUG_MODE,
    mockServices: env.MOCK_EXTERNAL_SERVICES,
  };
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig() {
  const env = getEnvironment();
  return {
    enabled: env.RATE_LIMIT_ENABLED,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  };
}

/**
 * Validate environment for healthcare compliance
 */
export function validateHealthcareCompliance(): { valid: boolean; issues: string[] } {
  const env = getEnvironment();
  const issues: string[] = [];

  // Check HTTPS requirement
  if (!env.NEXT_PUBLIC_BASE_URL.startsWith('https://') && isProduction()) {
    issues.push('Production environment must use HTTPS for healthcare compliance');
  }

  // Check encryption requirements
  if (!env.DATA_ENCRYPTION_ENABLED) {
    issues.push('Data encryption must be enabled for HIPAA compliance');
  }

  // Check audit logging
  if (!env.AUDIT_LOGGING_ENABLED) {
    issues.push('Audit logging must be enabled for HIPAA compliance');
  }

  // Check audit retention period
  if (env.AUDIT_LOG_RETENTION_DAYS < 2555) { // 7 years minimum
    issues.push('Audit log retention must be at least 7 years (2555 days) for HIPAA compliance');
  }

  // Check session security
  if (!env.SESSION_SECURE && isProduction()) {
    issues.push('Session cookies must be secure in production');
  }

  if (!env.SESSION_HTTP_ONLY) {
    issues.push('Session cookies must be HTTP-only for security');
  }

  // Check security headers
  if (!env.SECURE_HEADERS_ENABLED) {
    issues.push('Security headers must be enabled for healthcare compliance');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Environment configuration summary for logging
 */
export function getEnvironmentSummary() {
  const env = getEnvironment();
  const compliance = validateHealthcareCompliance();
  
  return {
    environment: env.NODE_ENV,
    version: env.NEXT_PUBLIC_APP_VERSION,
    baseUrl: env.NEXT_PUBLIC_BASE_URL,
    compliance: {
      hipaaCompliant: isHIPAACompliant(),
      auditLoggingEnabled: env.AUDIT_LOGGING_ENABLED,
      dataEncryptionEnabled: env.DATA_ENCRYPTION_ENABLED,
      validationPassed: compliance.valid,
      issues: compliance.issues,
    },
    features: getFeatureFlags(),
    monitoring: {
      sentryEnabled: !!env.SENTRY_DSN,
      healthCheckEnabled: env.HEALTH_CHECK_ENABLED,
      performanceMonitoringEnabled: env.PERFORMANCE_MONITORING_ENABLED,
    },
    security: {
      secureHeadersEnabled: env.SECURE_HEADERS_ENABLED,
      rateLimitingEnabled: env.RATE_LIMIT_ENABLED,
      cspEnabled: env.CSP_ENABLED,
    },
  };
}

// Validate environment on module load
if (typeof window === 'undefined') {
  try {
    getEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}