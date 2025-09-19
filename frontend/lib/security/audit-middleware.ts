/**
 * HIPAA-Compliant Audit Logging Middleware
 * 
 * Middleware to automatically log all admin actions for healthcare compliance
 * - Integrates with enhanced authentication middleware
 * - Captures all admin API operations
 * - Provides healthcare-specific audit context
 * 
 * Story 1.6 Task 3: Healthcare Compliance Audit Logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { auditLogger, AuditEventType, AuditSeverity, ComplianceFramework, AuditUtils } from './audit-logging'
import { HealthcareRole, Permission } from './healthcare-role-manager'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export interface AuditContext {
  user_id: string | null
  session_id: string | null
  role: HealthcareRole | null
  permissions: Permission[]
  healthcare_context?: {
    department?: string
    clearance_level?: string
    license_number?: string
  }
  request_id: string
  client_ip: string
  user_agent: string
}

export interface AdminActionMetadata {
  resource_type: string
  resource_id?: string | null
  action_performed: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  affected_fields?: string[]
  healthcare_data_involved?: boolean
  patient_identifier?: string
  sensitive_data_classification?: 'PHI' | 'clinical' | 'administrative' | 'public'
}

/**
 * Enhanced audit middleware that automatically logs all admin actions
 */
export function withAuditLogging<T extends any[]>(
  handler: (request: NextRequest, context: AuditContext, ...args: T) => Promise<NextResponse>,
  options: {
    resource_type: string
    action_performed: string
    requires_healthcare_context?: boolean
    sensitive_data_involved?: boolean
    compliance_frameworks?: ComplianceFramework[]
    custom_risk_assessment?: (context: AuditContext, metadata: AdminActionMetadata) => number
  } = {
    resource_type: 'admin_api',
    action_performed: 'api_call'
  }
) {
  return async (request: NextRequest, context: AuditContext, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    let response: NextResponse
    let auditMetadata: AdminActionMetadata | null = null
    let error: Error | null = null
    
    try {
      // Pre-execution audit logging
      const preExecutionAudit = await logPreExecution(request, context, options)
      
      // Execute the wrapped handler
      response = await handler(request, context, ...args)
      
      // Extract audit metadata from response or context
      auditMetadata = await extractAuditMetadata(request, response, options)
      
      // Post-execution audit logging
      await logPostExecution(
        request, 
        context, 
        response, 
        auditMetadata, 
        options, 
        startTime,
        preExecutionAudit.audit_id
      )
      
      return response
      
    } catch (err) {
      error = err as Error
      
      // Error audit logging
      await logExecutionError(
        request,
        context,
        error,
        auditMetadata,
        options,
        startTime
      )
      
      throw error
    }
  }
}

/**
 * Log pre-execution audit event
 */
async function logPreExecution(
  request: NextRequest,
  context: AuditContext,
  options: any
): Promise<{ audit_id: string | null }> {
  try {
    const eventType = mapActionToEventType(options.action_performed, 'pre')
    const riskScore = options.custom_risk_assessment ? 
      options.custom_risk_assessment(context, { 
        resource_type: options.resource_type,
        action_performed: options.action_performed
      }) : 
      AuditUtils.calculateRiskScore({
        event_type: eventType,
        sensitive_data_involved: options.sensitive_data_involved || false
      })
    
    const auditEntry = {
      event_type: eventType,
      severity: determineSeverity(options.action_performed, riskScore),
      user_id: context.user_id,
      session_id: context.session_id,
      compliance_frameworks: options.compliance_frameworks || [ComplianceFramework.HIPAA],
      resource_type: options.resource_type,
      resource_id: null, // Will be updated in post-execution
      action_performed: `${options.action_performed}_initiated`,
      client_ip: context.client_ip,
      user_agent: context.user_agent,
      request_id: context.request_id,
      api_endpoint: request.url,
      http_method: request.method,
      healthcare_context: context.healthcare_context,
      risk_score: riskScore,
      sensitive_data_involved: options.sensitive_data_involved || false,
      status: 'partial' as const
    }
    
    const result = await auditLogger.logEvent(auditEntry)
    
    if (!result.success) {
      logger.error('Failed to log pre-execution audit', { 
        error: result.error,
        context: context.user_id,
        action: options.action_performed 
      })
    }
    
    return { audit_id: result.audit_id || null }
    
  } catch (error) {
    logger.error('Pre-execution audit logging failed', { error })
    return { audit_id: null }
  }
}

/**
 * Log post-execution audit event
 */
async function logPostExecution(
  request: NextRequest,
  context: AuditContext,
  response: NextResponse,
  metadata: AdminActionMetadata | null,
  options: any,
  startTime: number,
  preExecutionAuditId: string | null
): Promise<void> {
  try {
    const executionTime = Date.now() - startTime
    const eventType = mapActionToEventType(options.action_performed, 'post')
    const isSuccess = response.status >= 200 && response.status < 300
    const riskScore = options.custom_risk_assessment ?
      options.custom_risk_assessment(context, metadata || {
        resource_type: options.resource_type,
        action_performed: options.action_performed
      }) :
      AuditUtils.calculateRiskScore({
        event_type: eventType,
        sensitive_data_involved: metadata?.healthcare_data_involved || options.sensitive_data_involved || false,
        status: isSuccess ? 'success' : 'failure'
      })
    
    // Determine if PHI was accessed
    const phiAccessed = metadata?.sensitive_data_classification === 'PHI' || 
                       metadata?.healthcare_data_involved === true ||
                       eventType === AuditEventType.PHI_READ ||
                       eventType === AuditEventType.CLINICAL_DATA_ACCESS
    
    const auditEntry = {
      event_type: phiAccessed ? AuditEventType.PHI_READ : eventType,
      severity: determineSeverity(options.action_performed, riskScore, !isSuccess),
      user_id: context.user_id,
      session_id: context.session_id,
      patient_identifier: metadata?.patient_identifier,
      healthcare_data_type: metadata?.sensitive_data_classification,
      compliance_frameworks: options.compliance_frameworks || [ComplianceFramework.HIPAA],
      resource_type: metadata?.resource_type || options.resource_type,
      resource_id: metadata?.resource_id,
      action_performed: options.action_performed,
      client_ip: context.client_ip,
      user_agent: context.user_agent,
      request_id: context.request_id,
      api_endpoint: request.url,
      http_method: request.method,
      healthcare_context: {
        ...context.healthcare_context,
        minimum_necessary_met: true, // Assume compliance unless specified
        authorized_representative: context.role ? isAuthorizedRole(context.role) : false
      },
      old_values: metadata?.old_values,
      new_values: metadata?.new_values,
      affected_fields: metadata?.affected_fields,
      risk_score: riskScore,
      threat_indicators: detectThreatIndicators(context, metadata, executionTime),
      security_clearance_required: getRequiredClearance(options.action_performed),
      sensitive_data_involved: metadata?.healthcare_data_involved || options.sensitive_data_involved || false,
      status: isSuccess ? 'success' as const : 'failure' as const,
      error_code: !isSuccess ? response.status.toString() : undefined,
      error_message: !isSuccess ? response.statusText : undefined
    }
    
    const result = await auditLogger.logEvent(auditEntry)
    
    if (!result.success) {
      logger.error('Failed to log post-execution audit', { 
        error: result.error,
        context: context.user_id,
        action: options.action_performed 
      })
    } else {
      logger.info('Admin action audited', {
        audit_id: result.audit_id,
        user_id: context.user_id,
        action: options.action_performed,
        resource: options.resource_type,
        execution_time_ms: executionTime,
        risk_score: riskScore,
        phi_accessed: phiAccessed
      })
    }
    
  } catch (error) {
    logger.error('Post-execution audit logging failed', { error })
  }
}

/**
 * Log execution error audit event
 */
async function logExecutionError(
  request: NextRequest,
  context: AuditContext,
  error: Error,
  metadata: AdminActionMetadata | null,
  options: any,
  startTime: number
): Promise<void> {
  try {
    const executionTime = Date.now() - startTime
    const eventType = AuditEventType.ACCESS_VIOLATION // Errors often indicate access issues
    const riskScore = Math.min(10, (options.custom_risk_assessment ?
      options.custom_risk_assessment(context, metadata || {
        resource_type: options.resource_type,
        action_performed: options.action_performed
      }) :
      AuditUtils.calculateRiskScore({
        event_type: eventType,
        sensitive_data_involved: options.sensitive_data_involved || false,
        status: 'failure'
      })) + 2) // Add 2 points for error condition
    
    const auditEntry = {
      event_type: eventType,
      severity: AuditSeverity.ERROR,
      user_id: context.user_id,
      session_id: context.session_id,
      compliance_frameworks: options.compliance_frameworks || [ComplianceFramework.HIPAA],
      resource_type: metadata?.resource_type || options.resource_type,
      resource_id: metadata?.resource_id,
      action_performed: options.action_performed,
      client_ip: context.client_ip,
      user_agent: context.user_agent,
      request_id: context.request_id,
      api_endpoint: request.url,
      http_method: request.method,
      healthcare_context: context.healthcare_context,
      risk_score: riskScore,
      threat_indicators: ['execution_error', ...detectThreatIndicators(context, metadata, executionTime)],
      sensitive_data_involved: options.sensitive_data_involved || false,
      status: 'failure' as const,
      error_code: 'EXECUTION_ERROR',
      error_message: error.message
    }
    
    const result = await auditLogger.logEvent(auditEntry)
    
    if (!result.success) {
      logger.error('Failed to log error audit', { 
        error: result.error,
        original_error: error.message,
        context: context.user_id,
        action: options.action_performed 
      })
    }
    
  } catch (auditError) {
    logger.error('Error audit logging failed', { auditError, originalError: error })
  }
}

/**
 * Extract audit metadata from request/response
 */
async function extractAuditMetadata(
  request: NextRequest,
  response: NextResponse,
  options: any
): Promise<AdminActionMetadata> {
  const metadata: AdminActionMetadata = {
    resource_type: options.resource_type,
    action_performed: options.action_performed,
    healthcare_data_involved: options.sensitive_data_involved
  }
  
  try {
    // Try to extract resource ID from URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const potentialId = pathParts[pathParts.length - 1]
    
    // Check if last part looks like an ID (UUID, number, etc.)
    if (potentialId && (
      potentialId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
      potentialId.match(/^\d+$/) ||
      potentialId.length > 3
    )) {
      metadata.resource_id = potentialId
    }
    
    // Try to extract data from request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const requestBody = await request.clone().json()
        if (requestBody) {
          metadata.new_values = requestBody
          
          // Check for healthcare data indicators
          const healthcareFields = ['patient_id', 'mrn', 'phi', 'medical_record', 'diagnosis', 'treatment']
          const hasHealthcareData = Object.keys(requestBody).some(key => 
            healthcareFields.some(field => key.toLowerCase().includes(field))
          )
          
          if (hasHealthcareData) {
            metadata.healthcare_data_involved = true
            metadata.sensitive_data_classification = 'PHI'
          }
        }
      } catch {
        // Ignore JSON parsing errors
      }
    }
    
    // Try to extract data from response for successful operations
    if (response.status >= 200 && response.status < 300) {
      try {
        const responseText = await response.clone().text()
        if (responseText) {
          const responseData = JSON.parse(responseText)
          
          // For GET operations, this might contain sensitive data
          if (request.method === 'GET' && responseData) {
            const healthcareFields = ['patient_id', 'mrn', 'phi', 'medical_record', 'diagnosis', 'treatment']
            const hasHealthcareData = JSON.stringify(responseData).toLowerCase()
              .includes(healthcareFields.join('|'))
            
            if (hasHealthcareData) {
              metadata.healthcare_data_involved = true
              metadata.sensitive_data_classification = 'PHI'
            }
          }
        }
      } catch {
        // Ignore JSON parsing errors
      }
    }
    
  } catch (error) {
    logger.warn('Failed to extract audit metadata', { error })
  }
  
  return metadata
}

/**
 * Map admin actions to appropriate audit event types
 */
function mapActionToEventType(action: string, phase: 'pre' | 'post'): AuditEventType {
  const actionLower = action.toLowerCase()
  
  if (actionLower.includes('login') || actionLower.includes('auth')) {
    return actionLower.includes('fail') ? AuditEventType.LOGIN_FAILED : AuditEventType.LOGIN
  }
  
  if (actionLower.includes('mfa')) {
    return AuditEventType.MFA_SETUP
  }
  
  if (actionLower.includes('role') || actionLower.includes('permission')) {
    if (actionLower.includes('assign')) return AuditEventType.ROLE_ASSIGNED
    if (actionLower.includes('revoke')) return AuditEventType.ROLE_REVOKED
    return AuditEventType.PERMISSION_GRANTED
  }
  
  if (actionLower.includes('create') || actionLower.includes('add')) {
    if (actionLower.includes('user')) return AuditEventType.USER_CREATE
    return AuditEventType.DATA_CREATE
  }
  
  if (actionLower.includes('update') || actionLower.includes('modify')) {
    if (actionLower.includes('user')) return AuditEventType.USER_UPDATE
    return AuditEventType.DATA_UPDATE
  }
  
  if (actionLower.includes('delete') || actionLower.includes('remove')) {
    if (actionLower.includes('user')) return AuditEventType.USER_DELETE
    return AuditEventType.DATA_DELETE
  }
  
  if (actionLower.includes('read') || actionLower.includes('get') || actionLower.includes('view')) {
    if (actionLower.includes('phi') || actionLower.includes('patient') || actionLower.includes('medical')) {
      return AuditEventType.PHI_READ
    }
    if (actionLower.includes('clinical') || actionLower.includes('health')) {
      return AuditEventType.CLINICAL_DATA_ACCESS
    }
    return AuditEventType.PERMISSION_GRANTED // Generic read access
  }
  
  if (actionLower.includes('config') || actionLower.includes('setting')) {
    if (actionLower.includes('security')) return AuditEventType.SECURITY_CONFIG
    return AuditEventType.SYSTEM_CONFIG
  }
  
  if (actionLower.includes('export') || actionLower.includes('download')) {
    return AuditEventType.PHI_EXPORT
  }
  
  if (actionLower.includes('report') || actionLower.includes('compliance')) {
    return AuditEventType.COMPLIANCE_REPORT
  }
  
  // Default mapping
  return AuditEventType.DATA_UPDATE
}

/**
 * Determine audit severity based on action and risk score
 */
function determineSeverity(action: string, riskScore: number, hasError: boolean = false): AuditSeverity {
  if (hasError || riskScore >= 8) {
    return AuditSeverity.CRITICAL
  }
  
  if (riskScore >= 6 || action.toLowerCase().includes('delete') || action.toLowerCase().includes('phi')) {
    return AuditSeverity.ERROR
  }
  
  if (riskScore >= 4 || action.toLowerCase().includes('admin') || action.toLowerCase().includes('config')) {
    return AuditSeverity.WARNING
  }
  
  return AuditSeverity.INFO
}

/**
 * Detect potential threat indicators
 */
function detectThreatIndicators(
  context: AuditContext,
  metadata: AdminActionMetadata | null,
  executionTime: number
): string[] {
  const indicators: string[] = []
  
  // Unusually fast execution (potential automated attack)
  if (executionTime < 100) {
    indicators.push('fast_execution')
  }
  
  // Off-hours access (outside 6 AM - 10 PM)
  const hour = new Date().getHours()
  if (hour < 6 || hour > 22) {
    indicators.push('off_hours_access')
  }
  
  // Bulk operations
  if (metadata?.action_performed.toLowerCase().includes('bulk')) {
    indicators.push('bulk_operation')
  }
  
  // PHI export operations
  if (metadata?.action_performed.toLowerCase().includes('export') && metadata?.healthcare_data_involved) {
    indicators.push('phi_export')
  }
  
  // Multiple user operations
  if (metadata?.action_performed.toLowerCase().includes('user') && 
      metadata?.action_performed.toLowerCase().includes('multiple')) {
    indicators.push('multiple_user_ops')
  }
  
  return indicators
}

/**
 * Get required security clearance for action
 */
function getRequiredClearance(action: string): string {
  const actionLower = action.toLowerCase()
  
  if (actionLower.includes('phi') || actionLower.includes('patient') || actionLower.includes('clinical')) {
    return 'elevated'
  }
  
  if (actionLower.includes('admin') || actionLower.includes('config') || actionLower.includes('security')) {
    return 'administrative'
  }
  
  if (actionLower.includes('user') || actionLower.includes('role')) {
    return 'administrative'
  }
  
  return 'standard'
}

/**
 * Check if role is authorized for healthcare data access
 */
function isAuthorizedRole(role: HealthcareRole): boolean {
  const authorizedRoles = [
    HealthcareRole.SYSTEM_ADMIN,
    HealthcareRole.CHIEF_MEDICAL_OFFICER,
    HealthcareRole.MEDICAL_DIRECTOR,
    HealthcareRole.PHYSICIAN,
    HealthcareRole.NURSE_MANAGER,
    HealthcareRole.REGISTERED_NURSE,
    HealthcareRole.HEALTHCARE_ANALYST,
    HealthcareRole.COMPLIANCE_OFFICER
  ]
  
  return authorizedRoles.includes(role)
}

/**
 * Convenience function to create audit context from request
 */
export function createAuditContext(
  request: NextRequest,
  user: any = null,
  session: any = null
): AuditContext {
  const clientIp = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    '127.0.0.1'
  
  return {
    user_id: user?.id || null,
    session_id: session?.id || crypto.randomUUID(),
    role: user?.role || null,
    permissions: user?.permissions || [],
    healthcare_context: user?.healthcare_context,
    request_id: crypto.randomUUID(),
    client_ip: clientIp,
    user_agent: request.headers.get('user-agent') || 'unknown'
  }
}

/**
 * Quick audit logging for simple operations
 */
export async function quickAuditLog(
  eventType: AuditEventType,
  context: AuditContext,
  metadata: {
    resource_type: string
    resource_id?: string
    action_performed: string
    old_values?: Record<string, any>
    new_values?: Record<string, any>
    healthcare_data_involved?: boolean
    status: 'success' | 'failure' | 'partial' | 'blocked'
    error_message?: string
  }
): Promise<void> {
  try {
    const riskScore = AuditUtils.calculateRiskScore({
      event_type: eventType,
      sensitive_data_involved: metadata.healthcare_data_involved || false,
      status: metadata.status
    })
    
    const auditEntry = {
      event_type: eventType,
      severity: determineSeverity(metadata.action_performed, riskScore, metadata.status === 'failure'),
      user_id: context.user_id,
      session_id: context.session_id,
      compliance_frameworks: [ComplianceFramework.HIPAA],
      resource_type: metadata.resource_type,
      resource_id: metadata.resource_id || null,
      action_performed: metadata.action_performed,
      client_ip: context.client_ip,
      user_agent: context.user_agent,
      request_id: context.request_id,
      healthcare_context: context.healthcare_context,
      old_values: metadata.old_values,
      new_values: metadata.new_values,
      risk_score: riskScore,
      sensitive_data_involved: metadata.healthcare_data_involved || false,
      status: metadata.status,
      error_message: metadata.error_message
    }
    
    const result = await auditLogger.logEvent(auditEntry)
    
    if (!result.success) {
      logger.error('Quick audit logging failed', { 
        error: result.error,
        context: context.user_id,
        action: metadata.action_performed 
      })
    }
    
  } catch (error) {
    logger.error('Quick audit logging error', { error })
  }
}

export default withAuditLogging