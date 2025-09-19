/**
 * Validation Schemas for AI Agent API Endpoints
 * 
 * This module provides standardized validation schemas for all AI agent
 * API endpoints to ensure consistent input validation and error handling.
 */

import { ValidationRule } from '@/lib/middleware/validation'

// Common validation patterns
export const commonPatterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+$/
}

// Agent job status enum
export const AGENT_JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed'] as const
export type AgentJobStatus = typeof AGENT_JOB_STATUSES[number]

// Workflow type enum
export const WORKFLOW_TYPES = ['daily', 'content_audit', 'seo_analysis', 'social_media'] as const
export type WorkflowType = typeof WORKFLOW_TYPES[number]

// Test type enum
export const TEST_TYPES = ['comprehensive', 'category', 'individual', 'quick'] as const
export type TestType = typeof TEST_TYPES[number]

// Test category enum
export const TEST_CATEGORIES = ['mcp_tools', 'orchestrator', 'integrations'] as const
export type TestCategory = typeof TEST_CATEGORIES[number]

// Approval status enum
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ApprovalStatus = typeof APPROVAL_STATUSES[number]

// Priority levels
export const PRIORITY_LEVELS = ['low', 'normal', 'high'] as const
export type PriorityLevel = typeof PRIORITY_LEVELS[number]

// Approval actions
export const APPROVAL_ACTIONS = ['approve', 'reject'] as const
export type ApprovalAction = typeof APPROVAL_ACTIONS[number]

// Job actions
export const JOB_ACTIONS = ['retry', 'cancel', 'restart'] as const
export type JobAction = typeof JOB_ACTIONS[number]

/**
 * Agent Jobs API Schemas
 */
export const agentJobsSchemas = {
  // GET /api/admin/agents/jobs - Query parameters
  listJobs: [
    { field: 'page', type: 'number', min: 1 },
    { field: 'limit', type: 'number', min: 1, max: 100 },
    { field: 'status', type: 'string', enum: AGENT_JOB_STATUSES },
    { field: 'search', type: 'string', maxLength: 200 }
  ] as ValidationRule[],

  // POST /api/admin/agents/jobs - Request body
  createJob: [
    { field: 'goal', required: true, type: 'string', minLength: 1, maxLength: 500 },
    { field: 'notes', type: 'string', maxLength: 2000 },
    { field: 'workflow_type', type: 'string', enum: WORKFLOW_TYPES },
    { field: 'parameters', type: 'object' },
    { field: 'auto_execute', type: 'boolean' },
    { field: 'priority', type: 'string', enum: PRIORITY_LEVELS }
  ] as ValidationRule[],

  // PUT /api/admin/agents/jobs/[id] - Request body
  updateJob: [
    { field: 'status', type: 'string', enum: AGENT_JOB_STATUSES },
    { field: 'notes', type: 'string', maxLength: 2000 },
    { field: 'action', type: 'string', enum: JOB_ACTIONS },
    { field: 'parameters', type: 'object' }
  ] as ValidationRule[]
}

/**
 * Workflows API Schemas
 */
export const workflowsSchemas = {
  // POST /api/admin/agents/workflows - Request body
  executeWorkflow: [
    { 
      field: 'workflow_type', 
      required: true, 
      type: 'string', 
      enum: WORKFLOW_TYPES
    },
    { field: 'goal', type: 'string', minLength: 1, maxLength: 500 },
    { field: 'parameters', type: 'object' },
    { field: 'notes', type: 'string', maxLength: 2000 },
    { field: 'auto_approve', type: 'boolean' },
    { field: 'priority', type: 'string', enum: PRIORITY_LEVELS }
  ] as ValidationRule[]
}

/**
 * Testing API Schemas
 */
export const testingSchemas = {
  // POST /api/admin/agents/test - Request body
  executeTest: [
    { 
      field: 'test_type', 
      required: true, 
      type: 'string', 
      enum: TEST_TYPES
    },
    { field: 'category', type: 'string', enum: TEST_CATEGORIES },
    { field: 'tools', type: 'array' },
    { field: 'timeout', type: 'number', min: 5000, max: 300000 },
    { field: 'create_job', type: 'boolean' }
  ] as ValidationRule[]
}

/**
 * Approvals API Schemas
 */
export const approvalsSchemas = {
  // GET /api/admin/agents/approvals - Query parameters
  listApprovals: [
    { field: 'page', type: 'number', min: 1 },
    { field: 'limit', type: 'number', min: 1, max: 100 },
    { field: 'status', type: 'string', enum: APPROVAL_STATUSES },
    { field: 'job_id', type: 'uuid' },
    { field: 'artifact_type', type: 'string' },
    { field: 'policy', type: 'string', enum: ['requires_approval', 'auto'] }
  ] as ValidationRule[],

  // POST /api/admin/agents/approvals - Request body
  processApproval: [
    { field: 'approval_id', required: true, type: 'uuid' },
    { field: 'action', required: true, type: 'string', enum: APPROVAL_ACTIONS },
    { field: 'reason', type: 'string', maxLength: 1000 },
    { field: 'bulk_action', type: 'boolean' },
    { field: 'approval_ids', type: 'array' }
  ] as ValidationRule[]
}

/**
 * Common validation rules for shared fields
 */
export const commonValidationRules = {
  // UUID validation
  uuid: { type: 'uuid' } as ValidationRule,
  
  // Pagination
  page: { field: 'page', type: 'number', min: 1 } as ValidationRule,
  limit: { field: 'limit', type: 'number', min: 1, max: 100 } as ValidationRule,
  
  // Common text fields
  shortText: { type: 'string', maxLength: 200 } as ValidationRule,
  mediumText: { type: 'string', maxLength: 1000 } as ValidationRule,
  longText: { type: 'string', maxLength: 2000 } as ValidationRule,
  
  // Goal field (used across multiple endpoints)
  goal: { field: 'goal', type: 'string', minLength: 1, maxLength: 500 } as ValidationRule,
  
  // Notes field (used across multiple endpoints)
  notes: { field: 'notes', type: 'string', maxLength: 2000 } as ValidationRule,
  
  // Priority field
  priority: { field: 'priority', type: 'string', enum: PRIORITY_LEVELS } as ValidationRule,
  
  // Boolean flags
  autoExecute: { field: 'auto_execute', type: 'boolean' } as ValidationRule,
  autoApprove: { field: 'auto_approve', type: 'boolean' } as ValidationRule,
  createJob: { field: 'create_job', type: 'boolean' } as ValidationRule,
  bulkAction: { field: 'bulk_action', type: 'boolean' } as ValidationRule
}

/**
 * Workflow-specific parameter validation
 */
export const workflowParameterSchemas = {
  daily: {
    // Daily workflow has minimal parameters - goal and notes are sufficient
    required: [],
    optional: ['goal', 'notes']
  },
  
  content_audit: {
    required: [],
    optional: [
      { field: 'scope', type: 'string', enum: ['full', 'partial', 'targeted'] },
      { field: 'depth', type: 'number', min: 1, max: 5 },
      { field: 'include_images', type: 'boolean' },
      { field: 'check_links', type: 'boolean' }
    ]
  },
  
  seo_analysis: {
    required: [
      { field: 'target_keywords', type: 'array', custom: (value: any) => 
        Array.isArray(value) && value.length > 0 && value.every(k => typeof k === 'string') }
    ],
    optional: [
      { field: 'competitors', type: 'array' },
      { field: 'date_range', type: 'object' },
      { field: 'include_technical_seo', type: 'boolean' },
      { field: 'analyze_content', type: 'boolean' }
    ]
  },
  
  social_media: {
    required: [],
    optional: [
      { field: 'platforms', type: 'array' },
      { field: 'date_range', type: 'object' },
      { field: 'analyze_engagement', type: 'boolean' },
      { field: 'generate_content', type: 'boolean' }
    ]
  }
}

/**
 * Response format schemas for API documentation
 */
export const responseSchemas = {
  // Standard success response
  success: {
    success: true,
    data: '{}', // Varies by endpoint
    metadata: '{}'  // Optional metadata
  },
  
  // Standard error response
  error: {
    success: false,
    error: 'string',
    code: 'string', // Error code
    details: '{}' // Optional error details
  },
  
  // Paginated response
  paginated: {
    success: true,
    data: '[]', // Array of items
    metadata: {
      total: 'number',
      page: 'number',
      limit: 'number',
      totalPages: 'number',
      hasNextPage: 'boolean',
      hasPrevPage: 'boolean'
    }
  }
}

/**
 * Custom validation functions
 */
export const customValidators = {
  // Validate workflow parameters based on workflow type
  workflowParameters: (workflowType: WorkflowType, parameters: any): string | true => {
    const schema = workflowParameterSchemas[workflowType]
    if (!schema) {
      return `Unknown workflow type: ${workflowType}`
    }
    
    // Check required parameters
    for (const rule of schema.required) {
      if (!parameters[rule.field]) {
        return `Required parameter '${rule.field}' is missing for ${workflowType} workflow`
      }
    }
    
    return true
  },
  
  // Validate array of UUIDs
  uuidArray: (value: any): string | true => {
    if (!Array.isArray(value)) {
      return 'Must be an array'
    }
    
    for (const uuid of value) {
      if (typeof uuid !== 'string' || !commonPatterns.uuid.test(uuid)) {
        return `Invalid UUID: ${uuid}`
      }
    }
    
    return true
  },
  
  // Validate date range object
  dateRange: (value: any): string | true => {
    if (typeof value !== 'object' || !value) {
      return 'Must be an object'
    }
    
    const { start, end } = value
    
    if (!start || !end) {
      return 'Must have start and end dates'
    }
    
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid date format'
    }
    
    if (startDate >= endDate) {
      return 'Start date must be before end date'
    }
    
    return true
  },
  
  // Validate keyword array for SEO analysis
  keywordArray: (value: any): string | true => {
    if (!Array.isArray(value)) {
      return 'Must be an array of keywords'
    }
    
    if (value.length === 0) {
      return 'At least one keyword is required'
    }
    
    if (value.length > 10) {
      return 'Maximum 10 keywords allowed'
    }
    
    for (const keyword of value) {
      if (typeof keyword !== 'string' || keyword.trim().length === 0) {
        return 'All keywords must be non-empty strings'
      }
      
      if (keyword.length > 100) {
        return 'Keywords must be 100 characters or less'
      }
    }
    
    return true
  }
}

/**
 * Validation helper functions
 */
export const validationHelpers = {
  // Create validation rules with common patterns
  createPaginationRules: () => [
    commonValidationRules.page,
    commonValidationRules.limit
  ],
  
  // Create job creation rules with optional fields
  createJobRules: (includeWorkflow = true) => {
    const rules = [
      commonValidationRules.goal,
      commonValidationRules.notes
    ]
    
    if (includeWorkflow) {
      rules.push(
        { field: 'workflow_type', type: 'string', enum: WORKFLOW_TYPES },
        { field: 'parameters', type: 'object' }
      )
    }
    
    rules.push(
      commonValidationRules.autoExecute,
      commonValidationRules.priority
    )
    
    return rules
  },
  
  // Merge validation rules
  mergeRules: (...ruleArrays: ValidationRule[][]): ValidationRule[] => {
    return ruleArrays.flat()
  }
}

/**
 * Export all schemas for easy import
 */
export const allSchemas = {
  agentJobs: agentJobsSchemas,
  workflows: workflowsSchemas,
  testing: testingSchemas,
  approvals: approvalsSchemas,
  common: commonValidationRules,
  custom: customValidators,
  helpers: validationHelpers
}

export default allSchemas