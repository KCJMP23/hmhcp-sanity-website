/**
 * AI Services Configuration
 * Healthcare-compliant AI orchestration system configuration
 */

import { z } from 'zod';
import type { 
  OrchestratorConfig, 
  RedisConfiguration, 
  SecurityConfiguration,
  MonitoringConfiguration,
  GlobalComplianceConfig,
  PerformanceConfiguration,
  AgentConfiguration,
  AlertThreshold
} from '../../types/ai/orchestrator';

// Environment variable schema validation
const envSchema = z.object({
  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // AI Service Configuration
  AI_ORCHESTRATOR_ENABLED: z.string().transform(Boolean).default('true'),
  AI_MAX_CONCURRENT_TASKS: z.string().transform(Number).default('10'),
  AI_TASK_TIMEOUT: z.string().transform(Number).default('300000'), // 5 minutes
  AI_SESSION_TIMEOUT: z.string().transform(Number).default('1800000'), // 30 minutes
  
  // Healthcare Compliance
  HIPAA_COMPLIANCE_ENABLED: z.string().transform(Boolean).default('true'),
  GDPR_COMPLIANCE_ENABLED: z.string().transform(Boolean).default('false'),
  HEALTHCARE_DATA_RETENTION_DAYS: z.string().transform(Number).default('2555'), // 7 years
  AUDIT_LOG_RETENTION_DAYS: z.string().transform(Number).default('2555'), // 7 years
  
  // Security Configuration
  AI_ENCRYPTION_ENABLED: z.string().transform(Boolean).default('true'),
  AI_ENCRYPTION_ALGORITHM: z.string().default('AES-256-GCM'),
  AI_AUDIT_LOGGING: z.string().transform(Boolean).default('true'),
  AI_MAX_CONCURRENT_SESSIONS: z.string().transform(Number).default('100'),
  AI_IP_WHITELIST: z.string().optional().transform(val => val?.split(',').map(ip => ip.trim())),
  
  // Monitoring Configuration
  AI_METRICS_ENABLED: z.string().transform(Boolean).default('true'),
  AI_METRICS_INTERVAL: z.string().transform(Number).default('30000'), // 30 seconds
  AI_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Performance Configuration
  AI_MEMORY_LIMIT: z.string().transform(Number).default('1073741824'), // 1GB
  AI_CACHE_SIZE: z.string().transform(Number).default('10000'),
  AI_CONNECTION_POOL_SIZE: z.string().transform(Number).default('20'),
  
  // External AI Services
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development')
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Redis Configuration
export const redisConfig: RedisConfiguration = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  queue: {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  },
  cache: {
    ttl: 300, // 5 minutes
    max: 1000,
    updateAgeOnGet: true
  }
};

// Security Configuration
export const securityConfig: SecurityConfiguration = {
  encryptionEnabled: env.AI_ENCRYPTION_ENABLED,
  auditLogging: env.AI_AUDIT_LOGGING,
  sessionTimeout: env.AI_SESSION_TIMEOUT,
  maxConcurrentSessions: env.AI_MAX_CONCURRENT_SESSIONS,
  ipWhitelist: env.AI_IP_WHITELIST
};

// Monitoring Configuration
export const monitoringConfig: MonitoringConfiguration = {
  metricsEnabled: env.AI_METRICS_ENABLED,
  metricsInterval: env.AI_METRICS_INTERVAL,
  logLevel: env.AI_LOG_LEVEL,
  alertThresholds: [
    {
      metric: 'error_rate',
      operator: 'gt',
      value: 0.05, // 5% error rate
      severity: 'warning'
    },
    {
      metric: 'response_time',
      operator: 'gt',
      value: 5000, // 5 seconds
      severity: 'warning'
    },
    {
      metric: 'memory_usage',
      operator: 'gt',
      value: 0.85, // 85% memory usage
      severity: 'critical'
    },
    {
      metric: 'cpu_usage',
      operator: 'gt',
      value: 0.80, // 80% CPU usage
      severity: 'error'
    },
    {
      metric: 'active_connections',
      operator: 'gt',
      value: env.AI_MAX_CONCURRENT_SESSIONS * 0.9, // 90% of max connections
      severity: 'warning'
    },
    {
      metric: 'compliance_violations',
      operator: 'gt',
      value: 0, // Any compliance violation is critical
      severity: 'critical'
    }
  ] as AlertThreshold[]
};

// Global Compliance Configuration
export const complianceConfig: GlobalComplianceConfig = {
  hipaaEnabled: env.HIPAA_COMPLIANCE_ENABLED,
  gdprEnabled: env.GDPR_COMPLIANCE_ENABLED,
  dataRetentionDays: env.HEALTHCARE_DATA_RETENTION_DAYS,
  encryptionAlgorithm: env.AI_ENCRYPTION_ALGORITHM,
  auditRetentionDays: env.AUDIT_LOG_RETENTION_DAYS
};

// Performance Configuration
export const performanceConfig: PerformanceConfiguration = {
  maxConcurrentTasks: env.AI_MAX_CONCURRENT_TASKS,
  taskTimeout: env.AI_TASK_TIMEOUT,
  memoryLimit: env.AI_MEMORY_LIMIT,
  cacheSize: env.AI_CACHE_SIZE,
  connectionPoolSize: env.AI_CONNECTION_POOL_SIZE
};

// Default Agent Configurations
export const defaultAgentConfigs: AgentConfiguration[] = [
  {
    id: 'medical-content-creator',
    name: 'Healthcare Content Creator',
    type: 'content-creator',
    capabilities: [
      {
        name: 'medical-content-generation',
        description: 'Generate HIPAA-compliant healthcare content',
        inputTypes: ['text', 'structured-data'],
        outputTypes: ['markdown', 'html', 'json'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'clinical-documentation',
        description: 'Create clinical documentation and reports',
        inputTypes: ['patient-data', 'clinical-notes'],
        outputTypes: ['clinical-report', 'documentation'],
        hipaaCompliant: true,
        requiresAuthentication: true
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555, // 7 years
      allowedDataTypes: ['public', 'internal', 'phi']
    },
    priority: 8,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 3,
    timeout: 300000, // 5 minutes
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  },
  {
    id: 'medical-writer-specialist',
    name: 'Medical Writing Specialist',
    type: 'medical-writer',
    capabilities: [
      {
        name: 'regulatory-writing',
        description: 'Create FDA-compliant regulatory documentation',
        inputTypes: ['clinical-data', 'study-protocols'],
        outputTypes: ['regulatory-document', 'submission-package'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'patient-education',
        description: 'Generate patient education materials',
        inputTypes: ['medical-information', 'patient-profile'],
        outputTypes: ['education-material', 'patient-guide'],
        hipaaCompliant: true,
        requiresAuthentication: false
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555,
      allowedDataTypes: ['public', 'internal', 'phi']
    },
    priority: 9,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 2,
    timeout: 600000, // 10 minutes
    retryPolicy: {
      maxAttempts: 2,
      backoffMultiplier: 2,
      initialDelay: 2000,
      maxDelay: 60000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT']
    }
  },
  {
    id: 'content-generation-agent',
    name: 'Healthcare Content Generation Agent',
    type: 'content-generator',
    capabilities: [
      {
        name: 'medical-content-generation',
        description: 'Generate high-quality healthcare content using Claude AI',
        inputTypes: ['content-request', 'research-context', 'template-spec'],
        outputTypes: ['blog-post', 'case-study', 'white-paper', 'patient-education'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'audience-adaptation',
        description: 'Adapt content for different healthcare audiences',
        inputTypes: ['content', 'audience-spec', 'complexity-level'],
        outputTypes: ['adapted-content', 'readability-scores'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'medical-accuracy-validation',
        description: 'Validate medical accuracy and compliance of generated content',
        inputTypes: ['content', 'medical-context', 'validation-rules'],
        outputTypes: ['accuracy-report', 'compliance-status', 'validation-scores'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'content-versioning',
        description: 'Manage content versions and track changes',
        inputTypes: ['content', 'version-metadata', 'change-description'],
        outputTypes: ['versioned-content', 'version-history', 'change-log'],
        hipaaCompliant: true,
        requiresAuthentication: true
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555,
      allowedDataTypes: ['public', 'internal', 'phi']
    },
    priority: 8,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 3,
    timeout: 300000, // 5 minutes
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  },
  {
    id: 'compliance-auditor',
    name: 'Healthcare Compliance Auditor',
    type: 'compliance-auditor',
    capabilities: [
      {
        name: 'hipaa-compliance-check',
        description: 'Validate HIPAA compliance of content and processes',
        inputTypes: ['content', 'workflow', 'data-access-logs'],
        outputTypes: ['compliance-report', 'violation-alerts'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'gdpr-compliance-check',
        description: 'Validate GDPR compliance where applicable',
        inputTypes: ['content', 'data-processing-logs'],
        outputTypes: ['compliance-report', 'privacy-assessment'],
        hipaaCompliant: true,
        requiresAuthentication: true
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555,
      allowedDataTypes: ['public', 'internal', 'confidential', 'phi', 'pii']
    },
    priority: 10, // Highest priority
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 5,
    timeout: 120000, // 2 minutes
    retryPolicy: {
      maxAttempts: 1, // Critical compliance checks shouldn't retry
      backoffMultiplier: 1,
      initialDelay: 0,
      maxDelay: 0,
      retryableErrors: []
    }
  },
  {
    id: 'healthcare-data-analyst',
    name: 'Healthcare Data Analyst',
    type: 'data-analyst',
    capabilities: [
      {
        name: 'clinical-data-analysis',
        description: 'Analyze clinical datasets and generate insights',
        inputTypes: ['clinical-data', 'research-data', 'population-health-data'],
        outputTypes: ['analysis-report', 'visualization', 'insights'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'outcome-prediction',
        description: 'Generate predictive models for patient outcomes',
        inputTypes: ['patient-history', 'treatment-data'],
        outputTypes: ['prediction-model', 'risk-assessment'],
        hipaaCompliant: true,
        requiresAuthentication: true
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555,
      allowedDataTypes: ['internal', 'phi']
    },
    priority: 7,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 2,
    timeout: 900000, // 15 minutes for complex analysis
    retryPolicy: {
      maxAttempts: 2,
      backoffMultiplier: 3,
      initialDelay: 5000,
      maxDelay: 120000,
      retryableErrors: ['TIMEOUT', 'MEMORY_ERROR']
    }
  },
  {
    id: 'workflow-coordinator',
    name: 'Healthcare Workflow Coordinator',
    type: 'workflow-coordinator',
    capabilities: [
      {
        name: 'multi-agent-coordination',
        description: 'Coordinate complex healthcare workflows across multiple agents',
        inputTypes: ['workflow-definition', 'agent-capabilities', 'task-queue'],
        outputTypes: ['execution-plan', 'progress-updates', 'completion-report'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'resource-optimization',
        description: 'Optimize resource allocation for healthcare processes',
        inputTypes: ['resource-constraints', 'demand-patterns'],
        outputTypes: ['optimization-plan', 'resource-allocation'],
        hipaaCompliant: true,
        requiresAuthentication: true
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555,
      allowedDataTypes: ['internal', 'confidential', 'phi']
    },
    priority: 9,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 10,
    timeout: 180000, // 3 minutes
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 1.5,
      initialDelay: 1000,
      maxDelay: 15000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'AGENT_UNAVAILABLE']
    }
  },
  {
    id: 'security-monitor',
    name: 'Healthcare Security Monitor',
    type: 'security-monitor',
    capabilities: [
      {
        name: 'threat-detection',
        description: 'Monitor for security threats and vulnerabilities',
        inputTypes: ['system-logs', 'access-patterns', 'network-traffic'],
        outputTypes: ['threat-alerts', 'security-report', 'recommendations'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'access-pattern-analysis',
        description: 'Analyze access patterns for anomaly detection',
        inputTypes: ['access-logs', 'user-behavior'],
        outputTypes: ['anomaly-alerts', 'behavior-analysis'],
        hipaaCompliant: true,
        requiresAuthentication: true
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555,
      allowedDataTypes: ['internal', 'confidential', 'phi', 'pii']
    },
    priority: 10, // Critical security monitoring
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 8,
    timeout: 60000, // 1 minute for security alerts
    retryPolicy: {
      maxAttempts: 1, // Security alerts shouldn't retry to avoid delays
      backoffMultiplier: 1,
      initialDelay: 0,
      maxDelay: 0,
      retryableErrors: []
    }
  },
  {
    id: 'patient-privacy-guardian',
    name: 'Patient Privacy Guardian',
    type: 'patient-privacy-guardian',
    capabilities: [
      {
        name: 'phi-protection',
        description: 'Protect and anonymize patient health information',
        inputTypes: ['raw-phi', 'clinical-documents', 'research-data'],
        outputTypes: ['anonymized-data', 'privacy-report', 'de-identification-log'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'consent-management',
        description: 'Manage patient consent and privacy preferences',
        inputTypes: ['consent-forms', 'privacy-preferences'],
        outputTypes: ['consent-status', 'privacy-compliance-report'],
        hipaaCompliant: true,
        requiresAuthentication: true
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555,
      allowedDataTypes: ['phi', 'pii']
    },
    priority: 10, // Maximum priority for privacy
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 5,
    timeout: 240000, // 4 minutes
    retryPolicy: {
      maxAttempts: 2,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT']
    }
  },
  {
    id: 'research-agent',
    name: 'Healthcare Research Agent',
    type: 'research-agent',
    capabilities: [
      {
        name: 'medical-research',
        description: 'Conduct medical and healthcare research with citations',
        inputTypes: ['text', 'query', 'medical-context'],
        outputTypes: ['research-report', 'citations', 'fact-checks'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'fact-checking',
        description: 'Verify medical claims and validate sources',
        inputTypes: ['medical-claim', 'content'],
        outputTypes: ['fact-check-report', 'source-validation'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'citation-management',
        description: 'Format and manage medical citations (AMA, APA, Chicago)',
        inputTypes: ['research-sources', 'bibliography'],
        outputTypes: ['formatted-citations', 'bibliography'],
        hipaaCompliant: true,
        requiresAuthentication: false
      }
    ],
    compliance: {
      hipaaCompliant: true,
      encryptionRequired: true,
      auditLogging: true,
      dataRetentionDays: 2555, // 7 years
      allowedDataTypes: ['public', 'internal', 'phi']
    },
    priority: 9, // High priority for research tasks
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 3,
    timeout: 30000, // 30 seconds
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  }
];

// Complete Orchestrator Configuration
export const orchestratorConfig: OrchestratorConfig = {
  redis: redisConfig,
  agents: defaultAgentConfigs,
  security: securityConfig,
  monitoring: monitoringConfig,
  compliance: complianceConfig,
  performance: performanceConfig
};

// Environment-specific overrides
export const getEnvironmentConfig = (environment: string = env.NODE_ENV): Partial<OrchestratorConfig> => {
  switch (environment) {
    case 'development':
      return {
        monitoring: {
          ...monitoringConfig,
          logLevel: 'debug',
          metricsInterval: 10000 // More frequent metrics in dev
        },
        performance: {
          ...performanceConfig,
          maxConcurrentTasks: 3 // Lower limits for dev
        }
      };
    
    case 'staging':
      return {
        monitoring: {
          ...monitoringConfig,
          logLevel: 'info',
          metricsInterval: 20000
        },
        performance: {
          ...performanceConfig,
          maxConcurrentTasks: 7
        }
      };
    
    case 'production':
      return {
        monitoring: {
          ...monitoringConfig,
          logLevel: 'warn', // Less verbose in production
          metricsInterval: 60000 // Less frequent metrics in production
        },
        security: {
          ...securityConfig,
          sessionTimeout: 900000, // 15 minutes in production
          maxConcurrentSessions: 500 // Higher limits for production
        }
      };
    
    default:
      return {};
  }
};

// Configuration validation
export const validateConfig = (config: OrchestratorConfig): boolean => {
  try {
    // Validate that all required agents have healthcare compliance enabled
    const nonCompliantAgents = config.agents.filter(agent => 
      agent.isHealthcareSpecialized && !agent.compliance.hipaaCompliant
    );
    
    if (nonCompliantAgents.length > 0) {
      throw new Error(`Healthcare-specialized agents must be HIPAA compliant: ${nonCompliantAgents.map(a => a.id).join(', ')}`);
    }
    
    // Validate Redis configuration
    if (!config.redis.host || !config.redis.port) {
      throw new Error('Redis configuration is incomplete');
    }
    
    // Validate performance limits
    if (config.performance.maxConcurrentTasks < 1) {
      throw new Error('Maximum concurrent tasks must be at least 1');
    }
    
    // Validate security configuration
    if (config.compliance.hipaaEnabled && !config.security.encryptionEnabled) {
      throw new Error('Encryption must be enabled when HIPAA compliance is required');
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

// Export environment variables for external use
export const environmentVariables = {
  NODE_ENV: env.NODE_ENV,
  REDIS_HOST: env.REDIS_HOST,
  REDIS_PORT: env.REDIS_PORT,
  AI_ORCHESTRATOR_ENABLED: env.AI_ORCHESTRATOR_ENABLED,
  HIPAA_COMPLIANCE_ENABLED: env.HIPAA_COMPLIANCE_ENABLED,
  AI_ENCRYPTION_ENABLED: env.AI_ENCRYPTION_ENABLED,
  AI_METRICS_ENABLED: env.AI_METRICS_ENABLED,
  AI_LOG_LEVEL: env.AI_LOG_LEVEL
} as const;

// Configuration health check
export const performConfigHealthCheck = async (): Promise<{ healthy: boolean; issues: string[] }> => {
  const issues: string[] = [];
  
  // Check if configuration is valid
  if (!validateConfig(orchestratorConfig)) {
    issues.push('Configuration validation failed');
  }
  
  // Check environment variables
  if (!env.AI_ORCHESTRATOR_ENABLED) {
    issues.push('AI Orchestrator is disabled');
  }
  
  // Check compliance requirements
  if (env.HIPAA_COMPLIANCE_ENABLED && !env.AI_ENCRYPTION_ENABLED) {
    issues.push('HIPAA compliance requires encryption to be enabled');
  }
  
  // Check monitoring configuration
  if (!env.AI_METRICS_ENABLED && env.NODE_ENV === 'production') {
    issues.push('Metrics should be enabled in production');
  }
  
  return {
    healthy: issues.length === 0,
    issues
  };
};

export default orchestratorConfig;