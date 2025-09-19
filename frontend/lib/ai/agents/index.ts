/**
 * AI Agents Index
 * Central export point for all healthcare AI agents
 */

// Export Research Agent
export { ResearchAgent } from './research-agent';
export type {
  ResearchRequest,
  ResearchResponse,
  ResearchSource,
  Citation,
  FactCheck,
  MedicalAccuracyReport,
  CostEstimate,
  ResearchMetadata,
  ResearchAgentOptions,
  ResearchDepth
} from './research-agent';

// Export Perplexity Client
export { PerplexityClient } from './perplexity-client';
export type {
  PerplexityMessage,
  PerplexityResponse
} from './perplexity-client';

// Export Content Generation Agent
export { ContentGenerationAgent } from './content-generation-agent';
export type {
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentFormat,
  AudienceType,
  MedicalSpecialty,
  ContentTemplate,
  ContentVersion,
  ReadabilityScores,
  SEOMetrics,
  MedicalAccuracyReport,
  ContentQualityMetrics,
  Citation,
  ContentGenerationConfig
} from './content-generation-agent';

// Export Medical Accuracy Agent
export { MedicalAccuracyAgent } from './medical-accuracy-agent';
export type {
  MedicalAccuracyRequest,
  MedicalAccuracyResponse,
  MedicalSource,
  Citation as MedicalCitation,
  MedicalAccuracyConfig
} from './medical-accuracy-agent';

// Export Social Media Agent
export { SocialMediaAgent } from './social-media-agent';
export type {
  SocialMediaRequest,
  SocialMediaResponse,
  SocialPost,
  PublishingPlatform,
  PlatformConfig,
  SocialMediaConfig
} from './social-media-agent';

// Export Compliance Validation Agent
export { ComplianceValidationAgent } from './compliance-validation-agent';
export type {
  ComplianceValidationRequest,
  ComplianceValidationResponse,
  PHIViolation,
  FDAViolation,
  FTCViolation,
  ComplianceValidationConfig
} from './compliance-validation-agent';

// Export Publishing Agent
export { PublishingAgent } from './publishing-agent';
export type {
  PublishingRequest,
  PublishingResponse,
  PublishedContent,
  VersionInfo,
  PublishingAnalytics,
  RollbackInfo,
  PublishingConfig
} from './publishing-agent';

// Export Workflow Coordination Agent
export { WorkflowCoordinationAgent } from './workflow-coordination-agent';
export type {
  WorkflowRequest,
  WorkflowResponse,
  TaskExecution,
  WorkflowMetrics,
  WorkflowCoordinationConfig
} from './workflow-coordination-agent';

// Export Base Agent
export { BaseAgent } from './base-agent';
export type { BaseAgentOptions } from './base-agent';

// Agent Registration Helper
import { ResearchAgent } from './research-agent';
import { ContentGenerationAgent } from './content-generation-agent';
import { MedicalAccuracyAgent } from './medical-accuracy-agent';
import { SocialMediaAgent } from './social-media-agent';
import { ComplianceValidationAgent } from './compliance-validation-agent';
import { PublishingAgent } from './publishing-agent';
import { WorkflowCoordinationAgent } from './workflow-coordination-agent';
import type { AgentConfiguration } from '../../../types/ai/orchestrator';

/**
 * Create and configure ResearchAgent for orchestrator registration
 */
export function createResearchAgentConfig(): AgentConfiguration {
  return {
    id: 'research-agent',
    name: 'Healthcare Research Agent',
    type: 'research-agent' as any, // Research agent type (extend AgentType if needed)
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
        description: 'Verify medical facts and claims with source validation',
        inputTypes: ['claim', 'medical-statement', 'research-content'],
        outputTypes: ['fact-check-report', 'verification-status', 'sources'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'citation-management',
        description: 'Extract and format medical citations in standard formats',
        inputTypes: ['research-text', 'references', 'bibliography'],
        outputTypes: ['formatted-citations', 'bibliography', 'reference-list'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'medical-validation',
        description: 'Validate medical accuracy and compliance of content',
        inputTypes: ['medical-content', 'clinical-data', 'research-findings'],
        outputTypes: ['validation-report', 'accuracy-score', 'compliance-status'],
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
    priority: 9,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 3,
    timeout: 30000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  };
}

/**
 * Create and configure ContentGenerationAgent for orchestrator registration
 */
export function createContentGenerationAgentConfig(): AgentConfiguration {
  return {
    id: 'content-generation-agent',
    name: 'Healthcare Content Generation Agent',
    type: 'content-generator' as any,
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
  };
}

/**
 * Create and configure MedicalAccuracyAgent for orchestrator registration
 */
export function createMedicalAccuracyAgentConfig(): AgentConfiguration {
  return {
    id: 'medical-accuracy-agent',
    name: 'Medical Accuracy Agent',
    type: 'compliance-auditor' as any,
    capabilities: [
      {
        name: 'medical-validation',
        description: 'Validate medical accuracy and compliance of content',
        inputTypes: ['medical-content', 'clinical-data', 'research-findings'],
        outputTypes: ['validation-report', 'accuracy-score', 'compliance-status'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'fact-checking',
        description: 'Verify medical facts and claims with source validation',
        inputTypes: ['claim', 'medical-statement', 'research-content'],
        outputTypes: ['fact-check-report', 'verification-status', 'sources'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'citation-management',
        description: 'Extract and format medical citations in standard formats',
        inputTypes: ['research-text', 'references', 'bibliography'],
        outputTypes: ['formatted-citations', 'bibliography', 'reference-list'],
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
    priority: 9,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 3,
    timeout: 30000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  };
}

/**
 * Create and configure SocialMediaAgent for orchestrator registration
 */
export function createSocialMediaAgentConfig(): AgentConfiguration {
  return {
    id: 'social-media-agent',
    name: 'Social Media Agent',
    type: 'content-creator' as any,
    capabilities: [
      {
        name: 'social-media-adaptation',
        description: 'Adapt content for different social media platforms',
        inputTypes: ['content', 'platform-spec', 'audience-spec'],
        outputTypes: ['social-post', 'engagement-prediction', 'compliance-report'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'hashtag-generation',
        description: 'Generate relevant hashtags for social media content',
        inputTypes: ['content', 'platform', 'audience'],
        outputTypes: ['hashtags', 'engagement-metrics', 'trending-topics'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'engagement-prediction',
        description: 'Predict engagement metrics for social media posts',
        inputTypes: ['content', 'platform', 'audience'],
        outputTypes: ['engagement-prediction', 'reach-estimate', 'performance-metrics'],
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
    maxConcurrentTasks: 5,
    timeout: 60000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  };
}

/**
 * Create and configure ComplianceValidationAgent for orchestrator registration
 */
export function createComplianceValidationAgentConfig(): AgentConfiguration {
  return {
    id: 'compliance-validation-agent',
    name: 'Compliance Validation Agent',
    type: 'compliance-auditor' as any,
    capabilities: [
      {
        name: 'compliance-validation',
        description: 'Validate healthcare compliance with HIPAA, FDA, and FTC regulations',
        inputTypes: ['content', 'compliance-spec', 'audience-spec'],
        outputTypes: ['compliance-report', 'violation-list', 'recommendations'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'phi-detection',
        description: 'Detect and flag potential PHI in content',
        inputTypes: ['content', 'context'],
        outputTypes: ['phi-report', 'violations', 'recommendations'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'regulatory-compliance',
        description: 'Check content against FDA and FTC regulations',
        inputTypes: ['content', 'regulations'],
        outputTypes: ['compliance-status', 'violations', 'required-disclaimers'],
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
    priority: 10,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 2,
    timeout: 45000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  };
}

/**
 * Create and configure PublishingAgent for orchestrator registration
 */
export function createPublishingAgentConfig(): AgentConfiguration {
  return {
    id: 'publishing-agent',
    name: 'Publishing Agent',
    type: 'content-creator' as any,
    capabilities: [
      {
        name: 'content-publishing',
        description: 'Publish content to multiple platforms with version control',
        inputTypes: ['content', 'publishing-spec', 'platform-spec'],
        outputTypes: ['published-content', 'version-info', 'analytics'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'version-control',
        description: 'Manage content versions and track changes',
        inputTypes: ['content', 'version-metadata'],
        outputTypes: ['version-info', 'change-log', 'rollback-info'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'multi-platform-distribution',
        description: 'Distribute content across multiple platforms',
        inputTypes: ['content', 'platforms', 'distribution-config'],
        outputTypes: ['distribution-report', 'platform-status', 'analytics'],
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
    priority: 7,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 4,
    timeout: 120000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  };
}

/**
 * Create and configure WorkflowCoordinationAgent for orchestrator registration
 */
export function createWorkflowCoordinationAgentConfig(): AgentConfiguration {
  return {
    id: 'workflow-coordination-agent',
    name: 'Workflow Coordination Agent',
    type: 'workflow-coordinator' as any,
    capabilities: [
      {
        name: 'workflow-coordination',
        description: 'Coordinate multi-agent workflows with intelligent task delegation',
        inputTypes: ['workflow-spec', 'task-list', 'coordination-config'],
        outputTypes: ['workflow-result', 'execution-report', 'performance-metrics'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'task-delegation',
        description: 'Delegate tasks to appropriate agents based on capabilities',
        inputTypes: ['task', 'agent-capabilities', 'context'],
        outputTypes: ['delegation-result', 'agent-assignment', 'execution-plan'],
        hipaaCompliant: true,
        requiresAuthentication: true
      },
      {
        name: 'error-recovery',
        description: 'Handle errors and implement recovery strategies',
        inputTypes: ['error-context', 'recovery-strategy', 'fallback-options'],
        outputTypes: ['recovery-result', 'retry-plan', 'fallback-execution'],
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
    priority: 10,
    isHealthcareSpecialized: true,
    maxConcurrentTasks: 1,
    timeout: 300000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    }
  };
}

/**
 * Get all agent configurations for orchestrator registration
 */
export function getAllAgentConfigurations(): AgentConfiguration[] {
  return [
    createResearchAgentConfig(),
    createContentGenerationAgentConfig(),
    createMedicalAccuracyAgentConfig(),
    createSocialMediaAgentConfig(),
    createComplianceValidationAgentConfig(),
    createPublishingAgentConfig(),
    createWorkflowCoordinationAgentConfig()
  ];
}

/**
 * Initialize ResearchAgent with default healthcare configuration
 * Note: This requires full dependency injection including Redis, Logger, and ComplianceValidator
 * For production use, initialize through the Healthcare AI Orchestrator instead
 */
// export function initializeResearchAgent(apiKey?: string): ResearchAgent {
//   Initialization requires:
//   - Redis instance
//   - HealthcareAILogger instance
//   - PerplexityConfig with proper structure
//   - CacheConfig
//   - ComplianceValidator instance
//   Use the orchestrator's agent registry for proper initialization
// }