/**
 * AI Orchestrator Types - Comprehensive type definitions for healthcare AI orchestrator
 * Supports task management, workflow execution, clinical decision support, and HIPAA compliance
 */

import { z } from 'zod'

// ===============================
// Core Orchestrator Types
// ===============================

export type TaskStatus = 
  | 'pending' 
  | 'queued' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'timeout'

export type WorkflowStatus = 
  | 'draft' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'

export type AgentType = 
  | 'web-growth-pack'
  | 'creative-writing-studio' 
  | 'infrastructure-devops'
  | 'data-science-pack'
  | 'clinical-decision-support'
  | 'phi-detection'
  | 'compliance-validator'
  | 'patient-analyzer'

export type Priority = 'low' | 'medium' | 'high' | 'critical' | 'emergency'

// ===============================
// Task Management Types
// ===============================

export interface AITask {
  id: string
  type: string
  agent_type: AgentType
  priority: Priority
  status: TaskStatus
  title: string
  description?: string
  input_data: Record<string, any>
  output_data?: Record<string, any>
  metadata: {
    created_by: string
    organization_id: string
    session_id?: string
    workflow_id?: string
    parent_task_id?: string
    execution_time_ms?: number
    retry_count: number
    max_retries: number
    timeout_ms: number
    requires_phi_handling: boolean
    requires_consent: boolean
    compliance_level: 'standard' | 'hipaa' | 'strict'
  }
  error_details?: {
    error_code: string
    error_message: string
    error_stack?: string
    retry_recommended: boolean
    user_friendly_message: string
  }
  progress?: {
    current_step: number
    total_steps: number
    step_name: string
    percentage_complete: number
    estimated_completion: string
  }
  resources?: {
    memory_usage_mb: number
    cpu_usage_percent: number
    estimated_cost_usd: number
  }
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
}

export interface AITaskExecution {
  id: string
  task_id: string
  execution_number: number
  status: TaskStatus
  agent_instance_id: string
  start_time: string
  end_time?: string
  duration_ms?: number
  memory_peak_mb?: number
  cpu_average_percent?: number
  logs: ExecutionLog[]
  metrics: ExecutionMetrics
  error_details?: {
    error_type: string
    error_message: string
    stack_trace?: string
    resolution_suggestions: string[]
  }
}

export interface ExecutionLog {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, any>
  phi_detected?: boolean
  compliance_flag?: boolean
}

export interface ExecutionMetrics {
  tokens_consumed: number
  api_calls_made: number
  data_processed_bytes: number
  cache_hits: number
  cache_misses: number
  phi_checks_performed: number
  compliance_validations: number
}

// ===============================
// Workflow Types
// ===============================

export interface AIWorkflow {
  id: string
  name: string
  description?: string
  status: WorkflowStatus
  version: string
  definition: WorkflowDefinition
  metadata: {
    created_by: string
    organization_id: string
    is_template: boolean
    category: string
    tags: string[]
    healthcare_specific: boolean
    requires_phi_handling: boolean
    compliance_level: 'standard' | 'hipaa' | 'strict'
  }
  configuration: {
    max_parallel_tasks: number
    timeout_ms: number
    retry_policy: {
      max_retries: number
      backoff_strategy: 'linear' | 'exponential'
      retry_delays_ms: number[]
    }
    resource_limits: {
      max_memory_mb: number
      max_cpu_percent: number
      max_execution_time_ms: number
    }
  }
  executions: WorkflowExecution[]
  created_at: string
  updated_at: string
  published_at?: string
}

export interface WorkflowDefinition {
  version: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  start_node: string
  end_nodes: string[]
  variables: Record<string, any>
  constants: Record<string, any>
}

export interface WorkflowNode {
  id: string
  type: 'task' | 'decision' | 'parallel' | 'merge' | 'delay' | 'condition'
  name: string
  agent_type?: AgentType
  configuration: Record<string, any>
  input_mapping: Record<string, string>
  output_mapping: Record<string, string>
  conditions?: WorkflowCondition[]
  phi_handling?: {
    requires_consent: boolean
    anonymization_level: 'none' | 'basic' | 'full'
    retention_policy: string
  }
}

export interface WorkflowEdge {
  id: string
  source_node: string
  target_node: string
  condition?: string
  label?: string
}

export interface WorkflowCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'regex'
  value: any
  logic?: 'and' | 'or'
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: WorkflowStatus
  input_data: Record<string, any>
  output_data?: Record<string, any>
  current_node?: string
  executed_nodes: string[]
  failed_nodes: string[]
  task_executions: Record<string, AITaskExecution>
  metrics: WorkflowMetrics
  created_at: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
}

export interface WorkflowMetrics {
  total_tasks: number
  completed_tasks: number
  failed_tasks: number
  total_execution_time_ms: number
  total_cost_usd: number
  phi_detections: number
  compliance_checks: number
  resource_usage: {
    peak_memory_mb: number
    average_cpu_percent: number
    total_tokens_consumed: number
  }
}

// ===============================
// Healthcare-Specific Types
// ===============================

export interface ClinicalDecisionRequest {
  patient_context: {
    age: number
    gender: string
    medical_history: string[]
    current_medications: string[]
    allergies: string[]
    vital_signs?: Record<string, number>
  }
  clinical_question: string
  evidence_sources: string[]
  urgency_level: Priority
  requesting_physician: {
    id: string
    name: string
    license_number: string
    specialty: string
  }
  consent_verification: {
    patient_consent_id: string
    consent_type: 'general' | 'specific' | 'emergency'
    verified_at: string
    verified_by: string
  }
}

export interface ClinicalDecisionResponse {
  recommendation: {
    primary_recommendation: string
    alternative_options: string[]
    confidence_level: number
    evidence_strength: 'weak' | 'moderate' | 'strong'
    clinical_reasoning: string
  }
  risk_assessment: {
    risk_factors: string[]
    contraindications: string[]
    drug_interactions: string[]
    monitoring_requirements: string[]
  }
  follow_up: {
    recommended_timeline: string
    monitoring_parameters: string[]
    referral_recommendations: string[]
  }
  evidence_references: {
    source: string
    citation: string
    quality_level: string
    relevance_score: number
  }[]
  compliance_info: {
    phi_handled: boolean
    audit_trail_id: string
    regulatory_notes: string[]
  }
}

export interface PatientAnalysisRequest {
  patient_id: string
  analysis_type: 'risk_assessment' | 'outcome_prediction' | 'treatment_response' | 'readmission_risk'
  data_sources: ('ehr' | 'labs' | 'imaging' | 'devices' | 'social_determinants')[]
  time_range: {
    start_date: string
    end_date: string
  }
  consent_verification: {
    patient_consent_id: string
    scope: string[]
    expires_at: string
  }
  requesting_provider: {
    id: string
    role: string
    department: string
  }
}

export interface PatientAnalysisResponse {
  analysis_results: {
    primary_findings: string[]
    risk_scores: Record<string, number>
    predictive_indicators: {
      indicator: string
      probability: number
      time_horizon: string
      confidence_interval: [number, number]
    }[]
    recommendations: string[]
  }
  data_quality: {
    completeness_score: number
    reliability_score: number
    data_gaps: string[]
    quality_issues: string[]
  }
  model_info: {
    model_version: string
    training_data_date: string
    performance_metrics: Record<string, number>
    limitations: string[]
  }
  compliance_info: {
    phi_anonymization: boolean
    audit_trail_id: string
    retention_policy: string
    access_log_id: string
  }
}

export interface PHIDetectionRequest {
  content: string
  content_type: 'text' | 'json' | 'xml' | 'pdf' | 'image'
  detection_level: 'basic' | 'comprehensive' | 'strict'
  action_on_detection: 'flag' | 'anonymize' | 'block'
  context_info?: {
    document_type: string
    source_system: string
    patient_id?: string
  }
}

export interface PHIDetectionResponse {
  phi_detected: boolean
  detection_results: {
    phi_type: string
    confidence_score: number
    location: {
      start_pos: number
      end_pos: number
      context: string
    }
    suggested_action: 'anonymize' | 'redact' | 'encrypt'
    replacement_value?: string
  }[]
  processed_content?: string
  compliance_info: {
    hipaa_compliant: boolean
    audit_trail_id: string
    processing_timestamp: string
  }
}

export interface ComplianceCheckRequest {
  content_type: 'workflow' | 'task' | 'data_access' | 'api_call'
  content_data: Record<string, any>
  compliance_frameworks: ('hipaa' | 'hitech' | 'gdpr' | 'sox' | 'custom')[]
  check_level: 'basic' | 'comprehensive' | 'audit_ready'
  context: {
    user_id: string
    organization_id: string
    system_component: string
    operation_type: string
  }
}

export interface ComplianceCheckResponse {
  overall_compliant: boolean
  compliance_score: number
  framework_results: {
    framework: string
    compliant: boolean
    score: number
    violations: {
      rule_id: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      remediation_steps: string[]
    }[]
    recommendations: string[]
  }[]
  audit_info: {
    audit_trail_id: string
    checked_at: string
    checked_by: string
    retention_period: string
  }
}

// ===============================
// Agent Management Types
// ===============================

export interface AIAgent {
  id: string
  type: AgentType
  name: string
  description: string
  version: string
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated'
  capabilities: string[]
  configuration: {
    max_concurrent_tasks: number
    timeout_ms: number
    memory_limit_mb: number
    cost_per_execution_usd: number
  }
  healthcare_features: {
    phi_handling_capable: boolean
    hipaa_compliant: boolean
    clinical_decision_support: boolean
    requires_medical_license: boolean
  }
  performance_metrics: {
    total_executions: number
    success_rate: number
    average_execution_time_ms: number
    average_cost_usd: number
    last_30_days: {
      executions: number
      success_rate: number
      average_time_ms: number
    }
  }
  created_at: string
  updated_at: string
}

// ===============================
// System Metrics Types
// ===============================

export interface OrchestratorMetrics {
  system_health: {
    status: 'healthy' | 'degraded' | 'critical'
    uptime_seconds: number
    active_tasks: number
    queued_tasks: number
    failed_tasks_last_hour: number
    average_response_time_ms: number
  }
  resource_usage: {
    cpu_usage_percent: number
    memory_usage_mb: number
    memory_limit_mb: number
    disk_usage_gb: number
    network_throughput_mbps: number
  }
  task_metrics: {
    completed_last_hour: number
    failed_last_hour: number
    average_execution_time_ms: number
    success_rate_last_24h: number
    total_cost_last_24h_usd: number
  }
  agent_metrics: Record<AgentType, {
    active_instances: number
    queue_length: number
    success_rate: number
    average_execution_time_ms: number
  }>
  compliance_metrics: {
    phi_detections_last_24h: number
    compliance_violations_last_24h: number
    hipaa_audit_entries_last_24h: number
    consent_verifications_last_24h: number
  }
  performance_trends: {
    timestamp: string
    active_tasks: number
    completion_rate: number
    error_rate: number
    response_time_ms: number
  }[]
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime_seconds: number
  checks: {
    component: string
    status: 'pass' | 'warn' | 'fail'
    message: string
    response_time_ms?: number
    details?: Record<string, any>
  }[]
  dependencies: {
    service: string
    status: 'available' | 'degraded' | 'unavailable'
    latency_ms?: number
    last_check: string
  }[]
}

export interface ComplianceReportResponse {
  report_id: string
  generated_at: string
  report_period: {
    start_date: string
    end_date: string
  }
  overall_compliance_score: number
  framework_scores: Record<string, number>
  violations_summary: {
    total_violations: number
    by_severity: Record<string, number>
    by_category: Record<string, number>
    resolved_violations: number
    pending_violations: number
  }
  audit_trail_summary: {
    total_entries: number
    phi_access_events: number
    consent_verifications: number
    data_modifications: number
  }
  recommendations: {
    priority: Priority
    category: string
    description: string
    estimated_impact: string
    implementation_effort: 'low' | 'medium' | 'high'
  }[]
  risk_assessment: {
    overall_risk_level: 'low' | 'medium' | 'high' | 'critical'
    risk_factors: string[]
    mitigation_status: Record<string, 'addressed' | 'in_progress' | 'not_started'>
  }
}

// ===============================
// API Request/Response Types
// ===============================

export interface TaskSubmissionRequest {
  type: string
  agent_type: AgentType
  priority?: Priority
  title: string
  description?: string
  input_data: Record<string, any>
  metadata?: {
    workflow_id?: string
    parent_task_id?: string
    timeout_ms?: number
    requires_phi_handling?: boolean
    requires_consent?: boolean
    compliance_level?: 'standard' | 'hipaa' | 'strict'
  }
}

export interface WorkflowExecutionRequest {
  workflow_id: string
  input_data: Record<string, any>
  execution_options?: {
    priority?: Priority
    timeout_ms?: number
    max_parallel_tasks?: number
    dry_run?: boolean
  }
  consent_verification?: {
    patient_consent_id: string
    verified_by: string
    verification_timestamp: string
  }
}

export interface TaskCancellationRequest {
  task_id: string
  reason: string
  force?: boolean
}

// ===============================
// Error Types
// ===============================

export interface OrchestratorError {
  code: string
  message: string
  details?: Record<string, any>
  user_friendly_message: string
  retry_possible: boolean
  support_contact?: string
}

export interface ValidationError {
  field: string
  message: string
  value?: any
  constraint?: string
}

// ===============================
// Response Wrapper Types
// ===============================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: OrchestratorError
  errors?: ValidationError[]
  metadata?: {
    request_id: string
    timestamp: string
    execution_time_ms: number
    rate_limit?: {
      limit: number
      remaining: number
      reset_time: number
    }
  }
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// ===============================
// Utility Types
// ===============================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OrchestratorEvent = 
  | { type: 'task.created'; payload: AITask }
  | { type: 'task.started'; payload: { task_id: string; started_at: string } }
  | { type: 'task.completed'; payload: { task_id: string; output_data: any } }
  | { type: 'task.failed'; payload: { task_id: string; error: OrchestratorError } }
  | { type: 'workflow.started'; payload: { workflow_id: string; execution_id: string } }
  | { type: 'workflow.completed'; payload: { workflow_id: string; execution_id: string; output_data: any } }
  | { type: 'phi.detected'; payload: { content_id: string; phi_types: string[] } }
  | { type: 'compliance.violation'; payload: { violation_id: string; severity: string } }

// Export all types for easy importing
export type {
  TaskStatus,
  WorkflowStatus,
  AgentType,
  Priority,
  AITask,
  AITaskExecution,
  ExecutionLog,
  ExecutionMetrics,
  AIWorkflow,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowCondition,
  WorkflowExecution,
  WorkflowMetrics,
  ClinicalDecisionRequest,
  ClinicalDecisionResponse,
  PatientAnalysisRequest,
  PatientAnalysisResponse,
  PHIDetectionRequest,
  PHIDetectionResponse,
  ComplianceCheckRequest,
  ComplianceCheckResponse,
  AIAgent,
  OrchestratorMetrics,
  HealthCheckResponse,
  ComplianceReportResponse,
  TaskSubmissionRequest,
  WorkflowExecutionRequest,
  TaskCancellationRequest,
  OrchestratorError,
  ValidationError,
  APIResponse,
  PaginatedResponse,
  DeepPartial,
  RequiredFields,
  OrchestratorEvent
}