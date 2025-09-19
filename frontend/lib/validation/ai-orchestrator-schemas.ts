/**
 * AI Orchestrator Validation Schemas - Comprehensive Zod schemas for healthcare AI orchestrator
 * Provides strict validation for all API endpoints with healthcare compliance features
 */

import { z } from 'zod'
import type {
  TaskStatus,
  WorkflowStatus,
  AgentType,
  Priority
} from '@/lib/types/ai-orchestrator'

// ===============================
// Base Schemas
// ===============================

export const TaskStatusSchema = z.enum([
  'pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'timeout'
]) as z.ZodSchema<TaskStatus>

export const WorkflowStatusSchema = z.enum([
  'draft', 'active', 'paused', 'completed', 'failed', 'cancelled'
]) as z.ZodSchema<WorkflowStatus>

export const AgentTypeSchema = z.enum([
  'web-growth-pack',
  'creative-writing-studio',
  'infrastructure-devops',
  'data-science-pack',
  'clinical-decision-support',
  'phi-detection',
  'compliance-validator',
  'patient-analyzer'
]) as z.ZodSchema<AgentType>

export const PrioritySchema = z.enum([
  'low', 'medium', 'high', 'critical', 'emergency'
]) as z.ZodSchema<Priority>

export const ComplianceLevelSchema = z.enum(['standard', 'hipaa', 'strict'])

export const UuidSchema = z.string().uuid({ message: 'Must be a valid UUID' })

export const TimestampSchema = z.string().datetime({ message: 'Must be a valid ISO timestamp' })

export const PositiveNumberSchema = z.number().positive({ message: 'Must be a positive number' })

export const NonNegativeNumberSchema = z.number().min(0, { message: 'Must be non-negative' })

// ===============================
// Task Management Schemas
// ===============================

const TaskSubmissionSchema = z.object({
  type: z.string().min(1, { message: 'Task type is required' }).max(100),
  agent_type: AgentTypeSchema,
  priority: PrioritySchema.default('medium'),
  title: z.string().min(1, { message: 'Title is required' }).max(255),
  description: z.string().max(2000).optional(),
  input_data: z.record(z.any()).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Input data cannot be empty' }
  ),
  metadata: z.object({
    workflow_id: UuidSchema.optional(),
    parent_task_id: UuidSchema.optional(),
    timeout_ms: z.number().min(1000).max(3600000).default(300000), // 5 minutes default, max 1 hour
    requires_phi_handling: z.boolean().default(false),
    requires_consent: z.boolean().default(false),
    compliance_level: ComplianceLevelSchema.default('standard')
  }).optional()
}).strict()

const TaskStatusQuerySchema = z.object({
  task_id: UuidSchema,
  include_logs: z.boolean().default(false),
  include_metrics: z.boolean().default(false)
}).strict()

const TaskCancellationSchema = z.object({
  task_id: UuidSchema,
  reason: z.string().min(1, { message: 'Cancellation reason is required' }).max(500),
  force: z.boolean().default(false)
}).strict()

const TaskListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: TaskStatusSchema.optional(),
  agent_type: AgentTypeSchema.optional(),
  priority: PrioritySchema.optional(),
  workflow_id: UuidSchema.optional(),
  created_since: TimestampSchema.optional(),
  search: z.string().max(255).optional()
}).strict()

// ===============================
// Workflow Schemas
// ===============================

export const WorkflowConditionSchema = z.object({
  field: z.string().min(1).max(100),
  operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains', 'regex']),
  value: z.any(),
  logic: z.enum(['and', 'or']).optional()
}).strict()

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(['task', 'decision', 'parallel', 'merge', 'delay', 'condition']),
  name: z.string().min(1).max(255),
  agent_type: AgentTypeSchema.optional(),
  configuration: z.record(z.any()),
  input_mapping: z.record(z.string()),
  output_mapping: z.record(z.string()),
  conditions: z.array(WorkflowConditionSchema).optional(),
  phi_handling: z.object({
    requires_consent: z.boolean().default(false),
    anonymization_level: z.enum(['none', 'basic', 'full']).default('none'),
    retention_policy: z.string().max(255).default('standard')
  }).optional()
}).strict()

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1).max(100),
  source_node: z.string().min(1).max(100),
  target_node: z.string().min(1).max(100),
  condition: z.string().max(500).optional(),
  label: z.string().max(255).optional()
}).strict()

const WorkflowDefinitionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/, { message: 'Version must be in format X.Y' }),
  nodes: z.array(WorkflowNodeSchema).min(1, { message: 'At least one node is required' }),
  edges: z.array(WorkflowEdgeSchema),
  start_node: z.string().min(1).max(100),
  end_nodes: z.array(z.string().min(1).max(100)).min(1),
  variables: z.record(z.any()),
  constants: z.record(z.any())
}).strict().refine(
  (data) => {
    // Validate that start_node exists in nodes
    const nodeIds = data.nodes.map(n => n.id)
    return nodeIds.includes(data.start_node)
  },
  { message: 'start_node must exist in nodes array', path: ['start_node'] }
).refine(
  (data) => {
    // Validate that all end_nodes exist in nodes
    const nodeIds = data.nodes.map(n => n.id)
    return data.end_nodes.every(endNode => nodeIds.includes(endNode))
  },
  { message: 'All end_nodes must exist in nodes array', path: ['end_nodes'] }
)

const WorkflowExecutionSchema = z.object({
  workflow_id: UuidSchema,
  input_data: z.record(z.any()).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Input data cannot be empty' }
  ),
  execution_options: z.object({
    priority: PrioritySchema.default('medium'),
    timeout_ms: z.number().min(1000).max(7200000).default(3600000), // 1 hour default, max 2 hours
    max_parallel_tasks: z.number().int().min(1).max(50).default(5),
    dry_run: z.boolean().default(false)
  }).optional(),
  consent_verification: z.object({
    patient_consent_id: UuidSchema,
    verified_by: UuidSchema,
    verification_timestamp: TimestampSchema
  }).optional()
}).strict()

// ===============================
// Healthcare-Specific Schemas
// ===============================

const ClinicalDecisionRequestSchema = z.object({
  patient_context: z.object({
    age: z.number().int().min(0).max(150),
    gender: z.enum(['male', 'female', 'other', 'unknown']),
    medical_history: z.array(z.string().max(255)).max(50),
    current_medications: z.array(z.string().max(255)).max(100),
    allergies: z.array(z.string().max(255)).max(50),
    vital_signs: z.record(z.number()).optional()
  }).strict(),
  clinical_question: z.string().min(10, { message: 'Clinical question must be detailed' }).max(2000),
  evidence_sources: z.array(z.string().url()).max(20),
  urgency_level: PrioritySchema,
  requesting_physician: z.object({
    id: UuidSchema,
    name: z.string().min(1).max(255),
    license_number: z.string().min(1).max(50),
    specialty: z.string().min(1).max(100)
  }).strict(),
  consent_verification: z.object({
    patient_consent_id: UuidSchema,
    consent_type: z.enum(['general', 'specific', 'emergency']),
    verified_at: TimestampSchema,
    verified_by: UuidSchema
  }).strict()
}).strict()

const PatientAnalysisRequestSchema = z.object({
  patient_id: UuidSchema,
  analysis_type: z.enum(['risk_assessment', 'outcome_prediction', 'treatment_response', 'readmission_risk']),
  data_sources: z.array(z.enum(['ehr', 'labs', 'imaging', 'devices', 'social_determinants'])).min(1).max(5),
  time_range: z.object({
    start_date: z.string().date(),
    end_date: z.string().date()
  }).strict().refine(
    (data) => new Date(data.start_date) < new Date(data.end_date),
    { message: 'Start date must be before end date' }
  ),
  consent_verification: z.object({
    patient_consent_id: UuidSchema,
    scope: z.array(z.string().max(100)).min(1).max(20),
    expires_at: TimestampSchema
  }).strict().refine(
    (data) => new Date(data.expires_at) > new Date(),
    { message: 'Consent must not be expired', path: ['expires_at'] }
  ),
  requesting_provider: z.object({
    id: UuidSchema,
    role: z.string().min(1).max(100),
    department: z.string().min(1).max(100)
  }).strict()
}).strict()

const PHIDetectionRequestSchema = z.object({
  content: z.string().min(1, { message: 'Content is required' }).max(1000000), // 1MB text limit
  content_type: z.enum(['text', 'json', 'xml', 'pdf', 'image']),
  detection_level: z.enum(['basic', 'comprehensive', 'strict']).default('comprehensive'),
  action_on_detection: z.enum(['flag', 'anonymize', 'block']).default('flag'),
  context_info: z.object({
    document_type: z.string().max(100),
    source_system: z.string().max(100),
    patient_id: UuidSchema.optional()
  }).optional()
}).strict()

const ComplianceCheckRequestSchema = z.object({
  content_type: z.enum(['workflow', 'task', 'data_access', 'api_call']),
  content_data: z.record(z.any()).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Content data cannot be empty' }
  ),
  compliance_frameworks: z.array(z.enum(['hipaa', 'hitech', 'gdpr', 'sox', 'custom'])).min(1).max(5),
  check_level: z.enum(['basic', 'comprehensive', 'audit_ready']).default('comprehensive'),
  context: z.object({
    user_id: UuidSchema,
    organization_id: UuidSchema,
    system_component: z.string().min(1).max(100),
    operation_type: z.string().min(1).max(100)
  }).strict()
}).strict()

// ===============================
// Management Schemas
// ===============================

const AgentListQuerySchema = z.object({
  type: AgentTypeSchema.optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'deprecated']).optional(),
  healthcare_only: z.boolean().default(false),
  include_metrics: z.boolean().default(false)
}).strict()

const MetricsQuerySchema = z.object({
  time_range: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  include_trends: z.boolean().default(false),
  agent_types: z.array(AgentTypeSchema).optional(),
  detailed: z.boolean().default(false)
}).strict()

const ComplianceReportQuerySchema = z.object({
  start_date: z.string().date(),
  end_date: z.string().date(),
  frameworks: z.array(z.enum(['hipaa', 'hitech', 'gdpr', 'sox', 'custom'])).optional(),
  include_recommendations: z.boolean().default(true),
  format: z.enum(['json', 'pdf', 'csv']).default('json')
}).strict().refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    const maxRange = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds
    return (end.getTime() - start.getTime()) <= maxRange
  },
  { message: 'Date range cannot exceed 90 days' }
)

// ===============================
// Response Validation Schemas
// ===============================

const TaskResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: UuidSchema,
    type: z.string(),
    agent_type: AgentTypeSchema,
    status: TaskStatusSchema,
    title: z.string(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema
  }).passthrough(), // Allow additional fields
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    user_friendly_message: z.string(),
    retry_possible: z.boolean()
  }).optional(),
  metadata: z.object({
    request_id: UuidSchema,
    timestamp: TimestampSchema,
    execution_time_ms: PositiveNumberSchema,
    rate_limit: z.object({
      limit: PositiveNumberSchema,
      remaining: NonNegativeNumberSchema,
      reset_time: PositiveNumberSchema
    }).optional()
  })
}).strict()

const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: TimestampSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  uptime_seconds: NonNegativeNumberSchema,
  checks: z.array(z.object({
    component: z.string(),
    status: z.enum(['pass', 'warn', 'fail']),
    message: z.string(),
    response_time_ms: PositiveNumberSchema.optional(),
    details: z.record(z.any()).optional()
  })),
  dependencies: z.array(z.object({
    service: z.string(),
    status: z.enum(['available', 'degraded', 'unavailable']),
    latency_ms: PositiveNumberSchema.optional(),
    last_check: TimestampSchema
  }))
}).strict()

// ===============================
// Utility Validation Functions
// ===============================

export function validateTaskSubmission(data: unknown) {
  return TaskSubmissionSchema.safeParse(data)
}

export function validateWorkflowExecution(data: unknown) {
  return WorkflowExecutionSchema.safeParse(data)
}

export function validateClinicalDecision(data: unknown) {
  return ClinicalDecisionRequestSchema.safeParse(data)
}

export function validatePatientAnalysis(data: unknown) {
  return PatientAnalysisRequestSchema.safeParse(data)
}

export function validatePHIDetection(data: unknown) {
  return PHIDetectionRequestSchema.safeParse(data)
}

export function validateComplianceCheck(data: unknown) {
  return ComplianceCheckRequestSchema.safeParse(data)
}

// Healthcare-specific validation rules
export function validateHealthcareCompliance(data: any): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check for PHI handling requirements
  if (data.requires_phi_handling && !data.consent_verification) {
    issues.push('PHI handling requires consent verification')
  }

  // Check for HIPAA compliance level
  if (data.compliance_level === 'hipaa' && !data.requires_phi_handling) {
    issues.push('HIPAA compliance level requires PHI handling')
  }

  // Check emergency access
  if (data.priority === 'emergency' && data.consent_verification?.consent_type !== 'emergency') {
    issues.push('Emergency priority requires emergency consent type')
  }

  // Validate clinical context for clinical decisions
  if (data.agent_type === 'clinical-decision-support') {
    if (!data.requesting_physician?.license_number) {
      issues.push('Clinical decisions require physician license verification')
    }
    if (!data.patient_context?.age || !data.patient_context?.gender) {
      issues.push('Clinical decisions require basic patient context')
    }
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

// Rate limiting validation
export function validateRateLimits(userRole: string, endpoint: string): { limit: number; window: number } {
  const limits = {
    admin: {
      'task.create': { limit: 1000, window: 3600 }, // 1000 per hour
      'workflow.execute': { limit: 100, window: 3600 },
      'clinical.decision': { limit: 50, window: 3600 },
      'phi.detection': { limit: 500, window: 3600 },
      default: { limit: 10000, window: 3600 }
    },
    healthcare_provider: {
      'task.create': { limit: 500, window: 3600 },
      'workflow.execute': { limit: 50, window: 3600 },
      'clinical.decision': { limit: 100, window: 3600 }, // Higher for healthcare providers
      'phi.detection': { limit: 200, window: 3600 },
      default: { limit: 2000, window: 3600 }
    },
    standard_user: {
      'task.create': { limit: 100, window: 3600 },
      'workflow.execute': { limit: 10, window: 3600 },
      'clinical.decision': { limit: 0, window: 3600 }, // Not allowed
      'phi.detection': { limit: 50, window: 3600 },
      default: { limit: 500, window: 3600 }
    }
  }

  const userLimits = limits[userRole as keyof typeof limits] || limits.standard_user
  return userLimits[endpoint as keyof typeof userLimits] || userLimits.default
}

// Export all schemas and validation functions
export {
  TaskSubmissionSchema,
  TaskStatusQuerySchema,
  TaskCancellationSchema,
  TaskListQuerySchema,
  WorkflowExecutionSchema,
  WorkflowDefinitionSchema,
  ClinicalDecisionRequestSchema,
  PatientAnalysisRequestSchema,
  PHIDetectionRequestSchema,
  ComplianceCheckRequestSchema,
  AgentListQuerySchema,
  MetricsQuerySchema,
  ComplianceReportQuerySchema,
  TaskResponseSchema,
  HealthCheckResponseSchema
}