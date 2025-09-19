/**
 * Healthcare AI Agent Orchestration Type Definitions
 * Comprehensive type system for healthcare content automation
 */

import { EventEmitter } from 'events';

/**
 * Agent capabilities enumeration
 */
export enum AgentCapability {
  // Research capabilities
  RESEARCH = 'research',
  FACT_CHECKING = 'fact_checking',
  DATA_ANALYSIS = 'data_analysis',
  
  // Content capabilities
  CONTENT_GENERATION = 'content_generation',
  HEALTHCARE_WRITING = 'healthcare_writing',
  TECHNICAL_WRITING = 'technical_writing',
  CONTENT_ADAPTATION = 'content_adaptation',
  
  // SEO capabilities
  SEO_ANALYSIS = 'seo_analysis',
  KEYWORD_RESEARCH = 'keyword_research',
  COMPETITOR_ANALYSIS = 'competitor_analysis',
  
  // Visual capabilities
  IMAGE_GENERATION = 'image_generation',
  MEDICAL_VISUALIZATION = 'medical_visualization',
  INFOGRAPHIC_CREATION = 'infographic_creation',
  
  // Social media capabilities
  SOCIAL_MEDIA = 'social_media',
  ENGAGEMENT_OPTIMIZATION = 'engagement_optimization',
  
  // Quality capabilities
  QUALITY_ASSURANCE = 'quality_assurance',
  COMPLIANCE_CHECK = 'compliance_check',
  
  // Publishing capabilities
  PUBLISHING = 'publishing',
  DISTRIBUTION = 'distribution',
  SCHEDULING = 'scheduling'
}

/**
 * Agent status states
 */
export enum AgentStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  READY = 'ready',
  EXECUTING = 'executing',
  PROCESSING = 'processing',
  WAITING = 'waiting',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline'
}

/**
 * Workflow execution modes
 */
export enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  HYBRID = 'hybrid',
  ADAPTIVE = 'adaptive'
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  SKIP = 'skip',
  ALTERNATIVE = 'alternative',
  MANUAL = 'manual',
  ABORT = 'abort'
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  DASHBOARD = 'dashboard'
}

/**
 * Healthcare compliance standards
 */
export enum ComplianceStandard {
  HIPAA = 'HIPAA',
  FDA = 'FDA',
  FTC = 'FTC',
  GDPR = 'GDPR',
  CCPA = 'CCPA',
  HL7 = 'HL7',
  ISO_13485 = 'ISO_13485'
}

/**
 * Content types for healthcare
 */
export enum HealthcareContentType {
  CLINICAL_ARTICLE = 'clinical_article',
  PATIENT_EDUCATION = 'patient_education',
  RESEARCH_PAPER = 'research_paper',
  CASE_STUDY = 'case_study',
  MEDICAL_BLOG = 'medical_blog',
  HEALTH_NEWS = 'health_news',
  PROCEDURE_GUIDE = 'procedure_guide',
  DRUG_INFORMATION = 'drug_information'
}

/**
 * API provider configuration
 */
export interface APIConfig {
  provider: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  endpoints?: Record<string, string>;
  model?: string;
  maxRetries?: number;
  timeout?: number;
  rateLimit?: {
    requests: number;
    period: number;
  };
  fallbackProvider?: string;
  fallbackApiKey?: string;
}

/**
 * Healthcare-specific configuration
 */
export interface HealthcareConfig {
  complianceLevel: string;
  medicalAccuracy: boolean;
  citationRequired: boolean;
  peerReview?: boolean;
  clinicalValidation?: boolean;
  patientPrivacy?: boolean;
  regulatoryApproval?: boolean;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  apiConfig?: APIConfig;
  healthcareConfig?: HealthcareConfig;
  critical?: boolean;
  priority?: number;
  maxConcurrency?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    initialDelay: number;
    maxDelay: number;
  };
}

/**
 * Agent execution input
 */
export interface AgentInput {
  taskId: string;
  type: string;
  data: any;
  context?: Record<string, any>;
  constraints?: Record<string, any>;
  timeout?: number;
  priority?: number;
}

/**
 * Agent execution output
 */
export interface AgentOutput {
  success: boolean;
  taskId: string;
  agentId: string;
  type: string;
  content?: any;
  artifacts?: AgentArtifact[];
  metrics?: AgentMetrics;
  errors?: AgentError[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

/**
 * Agent artifact
 */
export interface AgentArtifact {
  id: string;
  type: 'text' | 'json' | 'image' | 'document' | 'data' | 'link';
  name: string;
  content: any;
  mimeType?: string;
  size?: number;
  url?: string;
  metadata?: Record<string, any>;
  created: number;
}

/**
 * Agent execution metrics
 */
export interface AgentMetrics {
  executionTime: number;
  apiCalls: number;
  tokensUsed?: number;
  costs?: number;
  successRate?: number;
  errorCount?: number;
  retryCount?: number;
}

/**
 * Agent error information
 */
export interface AgentError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: number;
  recoverable: boolean;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  id?: string;
  name: string;
  description?: string;
  topic: string;
  executionMode: ExecutionMode;
  defaultRecoveryStrategy?: RecoveryStrategy;
  
  // Content configuration
  contentType?: HealthcareContentType;
  contentStyle?: string;
  contentLength?: number;
  targetAudience?: string;
  
  // Feature toggles
  enableResearch?: boolean;
  enableSEO?: boolean;
  enableImages?: boolean;
  enableSocialMedia?: boolean;
  qualityAssurance?: boolean;
  autoPublish?: boolean;
  
  // Research configuration
  researchDepth?: 'basic' | 'standard' | 'comprehensive';
  researchSources?: string[];
  
  // SEO configuration
  targetKeywords?: string[];
  competitorUrls?: string[];
  
  // Image configuration
  imageCount?: number;
  imageStyle?: string;
  imageSize?: string;
  
  // Social media configuration
  socialPlatforms?: string[];
  hashtagStrategy?: string[];
  
  // Publishing configuration
  publishingPlatforms?: string[];
  publishSchedule?: {
    immediate?: boolean;
    scheduledTime?: Date;
    timezone?: string;
  };
  
  // Compliance configuration
  requiresCompliance?: boolean;
  complianceRegulations?: ComplianceStandard[];
  strictCompliance?: boolean;
  
  // Notification configuration
  notificationChannels?: NotificationChannel[];
  notifyOnSuccess?: boolean;
  notifyOnFailure?: boolean;
  notifyOnWarning?: boolean;
  
  // Advanced configuration
  timeout?: number;
  priority?: number;
  maxRetries?: number;
  customMetadata?: Record<string, any>;
}

/**
 * Workflow execution step
 */
export interface WorkflowStep {
  name: string;
  agentId: string;
  description?: string;
  input: any;
  dependencies?: string[];
  critical?: boolean;
  parallel?: boolean;
  timeout?: number;
  recoveryStrategy?: RecoveryStrategy;
  fallbackAgentId?: string;
  alternativePath?: WorkflowStep[];
  validationRules?: Record<string, any>;
}

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  config: WorkflowConfig;
  status: 'initializing' | 'executing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  currentStep: number;
  steps: WorkflowStep[];
  state: Record<string, any>;
  artifacts: AgentArtifact[];
  logs: WorkflowLog[];
  errors: WorkflowError[];
  metrics: WorkflowMetrics;
}

/**
 * Workflow log entry
 */
export interface WorkflowLog {
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: number;
  source?: string;
}

/**
 * Workflow error
 */
export interface WorkflowError {
  step?: string;
  agentId?: string;
  message: string;
  error?: any;
  stack?: string;
  timestamp: number;
  recovered?: boolean;
}

/**
 * Workflow execution metrics
 */
export interface WorkflowMetrics {
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  agentExecutions: Array<{
    agentId: string;
    step: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success?: boolean;
    error?: string;
  }>;
  apiCalls: number;
  tokensUsed: number;
  costs: number;
  successRate?: number;
  averageStepDuration?: number;
}

/**
 * Workflow result
 */
export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  executionTime: number;
  finalContent?: any;
  artifacts: AgentArtifact[];
  logs: WorkflowLog[];
  errors?: WorkflowError[];
  qualityIssues?: any[];
  metrics?: WorkflowMetrics;
  state?: Record<string, any>;
  error?: string;
}

/**
 * Agent message for inter-agent communication
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'error';
  subject: string;
  body: any;
  priority?: number;
  timestamp: number;
  replyTo?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

/**
 * State management interface
 */
export interface StateManager {
  saveWorkflowState(workflowId: string, state: any): Promise<void>;
  loadWorkflowState(workflowId: string): Promise<any>;
  saveWorkflowResult(workflowId: string, result: WorkflowResult): Promise<void>;
  loadWorkflowResult(workflowId: string): Promise<WorkflowResult | null>;
  deleteWorkflowState(workflowId: string): Promise<void>;
  listWorkflows(filter?: any): Promise<string[]>;
}

/**
 * Notification service interface
 */
export interface NotificationService {
  send(notification: {
    channels: NotificationChannel[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    subject: string;
    message: string;
    details?: any;
    attachments?: any[];
  }): Promise<void>;
  
  configureChannel(channel: NotificationChannel, config: any): void;
  testChannel(channel: NotificationChannel): Promise<boolean>;
}

/**
 * Metrics collector interface
 */
export interface MetricsCollector {
  startWorkflow(workflowId: string): void;
  endWorkflow(workflowId: string): void;
  recordAgentExecution(agentId: string, metrics: AgentMetrics): void;
  recordAgentStatus(agentId: string, status: AgentStatus): void;
  recordFailure(workflowId: string, error: string): void;
  recordWorkflow(context: WorkflowExecutionContext): Promise<void>;
  getSummary(): Promise<any>;
  getAgentMetrics(agentId: string): Promise<AgentMetrics>;
  getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics>;
}

/**
 * Compliance validator interface
 */
export interface ComplianceValidator {
  validate(input: {
    content: any;
    regulations: ComplianceStandard[];
    strictMode: boolean;
  }): Promise<{
    compliant: boolean;
    issues: string[];
    warnings: string[];
    recommendations: string[];
  }>;
  
  checkHIPAA(content: any): Promise<boolean>;
  checkFDA(content: any): Promise<boolean>;
  checkGDPR(content: any): Promise<boolean>;
  sanitizePHI(content: string): string;
  redactSensitiveData(content: any): any;
}

/**
 * Base Healthcare Agent class interface
 */
export abstract class HealthcareAgent extends EventEmitter {
  protected config: AgentConfig;
  protected status: AgentStatus;
  protected currentTask: AgentInput | null;
  protected metrics: AgentMetrics;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.status = AgentStatus.IDLE;
    this.currentTask = null;
    this.metrics = {
      executionTime: 0,
      apiCalls: 0,
      tokensUsed: 0,
      costs: 0
    };
  }

  /**
   * Execute agent task
   */
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  /**
   * Initialize agent
   */
  abstract initialize(): Promise<void>;

  /**
   * Shutdown agent
   */
  abstract shutdown(): Promise<void>;

  /**
   * Cancel current task
   */
  abstract cancel(): Promise<void>;

  /**
   * Validate input
   */
  protected abstract validateInput(input: AgentInput): boolean;

  /**
   * Get agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Set agent status
   */
  protected setStatus(status: AgentStatus): void {
    const oldStatus = this.status;
    this.status = status;
    if (oldStatus !== status) {
      this.emit('status-change', status);
    }
  }

  /**
   * Get agent metrics
   */
  public getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      executionTime: 0,
      apiCalls: 0,
      tokensUsed: 0,
      costs: 0
    };
  }

  /**
   * Handle API call with retry logic
   */
  protected async callAPIWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.metrics.apiCalls++;
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Emit progress update
   */
  protected emitProgress(progress: number): void {
    this.emit('progress', Math.min(100, Math.max(0, progress)));
  }

  /**
   * Log message
   */
  protected log(level: string, message: string, details?: any): void {
    this.emit('log', { level, message, details, timestamp: Date.now() });
  }
}

/**
 * Workflow scheduler interface
 */
export interface WorkflowScheduler {
  schedule(config: WorkflowConfig, cronExpression: string): string;
  unschedule(scheduleId: string): boolean;
  getScheduledWorkflows(): Array<{
    id: string;
    config: WorkflowConfig;
    nextRun: Date;
    lastRun?: Date;
  }>;
  pauseSchedule(scheduleId: string): void;
  resumeSchedule(scheduleId: string): void;
}

/**
 * Cache service interface
 */
export interface CacheService {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * Rate limiter interface
 */
export interface RateLimiter {
  checkLimit(key: string): Promise<boolean>;
  consumeToken(key: string): Promise<void>;
  getRemainingTokens(key: string): Promise<number>;
  resetLimit(key: string): Promise<void>;
}

/**
 * Content validator interface
 */
export interface ContentValidator {
  validateMedicalAccuracy(content: string): Promise<boolean>;
  checkFactualAccuracy(content: string, sources: string[]): Promise<boolean>;
  calculateReadabilityScore(content: string): number;
  detectPlagiarism(content: string): Promise<number>;
  validateCitations(content: string): Promise<boolean>;
  checkGrammar(content: string): Promise<string[]>;
}

/**
 * Analytics tracker interface
 */
export interface AnalyticsTracker {
  trackWorkflowStart(workflowId: string, config: WorkflowConfig): void;
  trackWorkflowComplete(workflowId: string, result: WorkflowResult): void;
  trackAgentExecution(agentId: string, input: AgentInput, output: AgentOutput): void;
  trackError(error: Error, context: any): void;
  getAnalytics(period: 'day' | 'week' | 'month'): Promise<any>;
}