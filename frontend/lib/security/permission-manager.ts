/**
 * Enhanced Permission Management System
 * Advanced permission validation and enforcement for healthcare platform
 * 
 * Story 1.6 Task 2: Permission Management System
 * Integrates with healthcare role manager for comprehensive access control
 */

import { 
  HealthcareRole, 
  Permission, 
  PermissionCategory,
  HealthcareRoleManager,
  RoleAssignmentService,
  HEALTHCARE_ROLE_PERMISSIONS 
} from './healthcare-role-manager'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/dal/supabase'

// ================================
// Permission Context and Validation
// ================================

export interface PermissionContext {
  userId: string
  role: HealthcareRole
  permissions: Permission[]
  healthcare_context?: {
    department?: string
    license_number?: string
    specialization?: string[]
    clearance_level?: string
  }
  session_id?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
}

export interface AccessRequest {
  resource: string
  action: string
  context?: Record<string, any>
  urgent?: boolean
  healthcare_data?: boolean
}

export interface PermissionCheck {
  granted: boolean
  reason?: string
  required_permissions: Permission[]
  missing_permissions: Permission[]
  elevated_access_required?: boolean
  audit_required: boolean
}

// ================================
// Advanced Permission Rules
// ================================

/**
 * Healthcare-specific permission rules and validation
 */
export class PermissionRuleEngine {
  /**
   * Check if user can access specific resource with given action
   */
  static checkResourceAccess(
    context: PermissionContext,
    request: AccessRequest
  ): PermissionCheck {
    const { resource, action } = request
    const requiredPermissions = this.getRequiredPermissions(resource, action)
    const userPermissions = context.permissions
    
    // Check basic permissions
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
    
    const missingPermissions = requiredPermissions.filter(permission => 
      !userPermissions.includes(permission)
    )
    
    // Special healthcare data rules
    if (request.healthcare_data) {
      const healthcareCheck = this.checkHealthcareDataAccess(context, request)
      if (!healthcareCheck.granted) {
        return healthcareCheck
      }
    }
    
    // Elevated access rules
    const elevatedAccessRequired = this.requiresElevatedAccess(resource, action, request.context)
    if (elevatedAccessRequired && !this.hasElevatedAccess(context)) {
      return {
        granted: false,
        reason: 'Elevated access required for this operation',
        required_permissions: requiredPermissions,
        missing_permissions: [],
        elevated_access_required: true,
        audit_required: true
      }
    }
    
    // Time-based restrictions
    if (!this.checkTimeRestrictions(context, request)) {
      return {
        granted: false,
        reason: 'Access denied due to time restrictions',
        required_permissions: requiredPermissions,
        missing_permissions: [],
        audit_required: true
      }
    }
    
    return {
      granted: hasRequiredPermissions,
      reason: hasRequiredPermissions ? undefined : 'Insufficient permissions',
      required_permissions: requiredPermissions,
      missing_permissions: missingPermissions,
      audit_required: this.requiresAuditLogging(resource, action, context)
    }
  }
  
  /**
   * Get required permissions for resource and action
   */
  static getRequiredPermissions(resource: string, action: string): Permission[] {
    const permissionMap: Record<string, Record<string, Permission[]>> = {
      // Content Management
      'blog': {
        'read': [Permission.BLOG_READ],
        'create': [Permission.BLOG_CREATE],
        'update': [Permission.BLOG_UPDATE],
        'delete': [Permission.BLOG_DELETE],
        'publish': [Permission.BLOG_PUBLISH]
      },
      'content': {
        'read': [Permission.CONTENT_READ],
        'create': [Permission.CONTENT_CREATE],
        'update': [Permission.CONTENT_UPDATE],
        'delete': [Permission.CONTENT_DELETE],
        'publish': [Permission.CONTENT_PUBLISH],
        'moderate': [Permission.CONTENT_MODERATE]
      },
      'platform': {
        'read': [Permission.PLATFORM_READ],
        'create': [Permission.PLATFORM_CREATE],
        'update': [Permission.PLATFORM_UPDATE],
        'delete': [Permission.PLATFORM_DELETE]
      },
      'service': {
        'read': [Permission.SERVICE_READ],
        'create': [Permission.SERVICE_CREATE],
        'update': [Permission.SERVICE_UPDATE],
        'delete': [Permission.SERVICE_DELETE]
      },
      'team': {
        'read': [Permission.TEAM_READ],
        'create': [Permission.TEAM_CREATE],
        'update': [Permission.TEAM_UPDATE],
        'delete': [Permission.TEAM_DELETE]
      },
      
      // User Management
      'user': {
        'read': [Permission.USER_READ],
        'create': [Permission.USER_CREATE],
        'update': [Permission.USER_UPDATE],
        'delete': [Permission.USER_DELETE],
        'assign_roles': [Permission.USER_ASSIGN_ROLES],
        'manage_permissions': [Permission.USER_MANAGE_PERMISSIONS],
        'view_activity': [Permission.USER_VIEW_ACTIVITY]
      },
      
      // Healthcare Data
      'healthcare_data': {
        'read': [Permission.PHI_READ],
        'write': [Permission.PHI_WRITE],
        'delete': [Permission.PHI_DELETE],
        'export': [Permission.PHI_EXPORT],
        'analytics': [Permission.HEALTHCARE_ANALYTICS]
      },
      'clinical_data': {
        'access': [Permission.CLINICAL_DATA_ACCESS],
        'analytics': [Permission.HEALTHCARE_ANALYTICS]
      },
      
      // Security Operations
      'security': {
        'view': [Permission.SECURITY_VIEW],
        'configure': [Permission.SECURITY_CONFIGURE],
        'audit': [Permission.SECURITY_AUDIT],
        'incident_response': [Permission.SECURITY_INCIDENT_RESPONSE],
        'threat_detection': [Permission.SECURITY_THREAT_DETECTION],
        'mfa_admin': [Permission.SECURITY_MFA_ADMIN]
      },
      
      // Compliance
      'compliance': {
        'view': [Permission.COMPLIANCE_VIEW],
        'audit': [Permission.COMPLIANCE_AUDIT],
        'report': [Permission.COMPLIANCE_REPORT],
        'configure': [Permission.COMPLIANCE_CONFIGURE],
        'hipaa_officer': [Permission.HIPAA_OFFICER]
      },
      
      // Analytics
      'analytics': {
        'view': [Permission.ANALYTICS_VIEW],
        'create_reports': [Permission.ANALYTICS_CREATE_REPORTS],
        'export': [Permission.ANALYTICS_EXPORT],
        'manage_dashboards': [Permission.ANALYTICS_MANAGE_DASHBOARDS]
      },
      
      // System Management
      'system': {
        'config': [Permission.SYSTEM_CONFIG],
        'backup': [Permission.SYSTEM_BACKUP],
        'restore': [Permission.SYSTEM_RESTORE],
        'maintenance': [Permission.SYSTEM_MAINTENANCE]
      }
    }
    
    const resourcePermissions = permissionMap[resource]
    if (!resourcePermissions) {
      logger.warn(`No permission mapping found for resource: ${resource}`)
      return []
    }
    
    const actionPermissions = resourcePermissions[action]
    if (!actionPermissions) {
      logger.warn(`No permission mapping found for action: ${action} on resource: ${resource}`)
      return []
    }
    
    return actionPermissions
  }
  
  /**
   * Check healthcare data access rules
   */
  static checkHealthcareDataAccess(
    context: PermissionContext,
    request: AccessRequest
  ): PermissionCheck {
    const healthcarePermissions = [
      Permission.PHI_READ,
      Permission.PHI_WRITE,
      Permission.CLINICAL_DATA_ACCESS,
      Permission.HEALTHCARE_ANALYTICS
    ]
    
    const hasHealthcarePermission = healthcarePermissions.some(permission =>
      context.permissions.includes(permission)
    )
    
    if (!hasHealthcarePermission) {
      return {
        granted: false,
        reason: 'No healthcare data access permissions',
        required_permissions: [Permission.PHI_READ],
        missing_permissions: [Permission.PHI_READ],
        audit_required: true
      }
    }
    
    // Check healthcare context requirements
    if (!context.healthcare_context?.clearance_level) {
      return {
        granted: false,
        reason: 'Healthcare clearance level not specified',
        required_permissions: [],
        missing_permissions: [],
        audit_required: true
      }
    }
    
    // Additional rules based on clearance level
    const clearanceLevel = context.healthcare_context.clearance_level
    if (request.urgent && clearanceLevel === 'basic') {
      return {
        granted: false,
        reason: 'Basic clearance insufficient for urgent healthcare data access',
        required_permissions: [],
        missing_permissions: [],
        elevated_access_required: true,
        audit_required: true
      }
    }
    
    return {
      granted: true,
      required_permissions: [Permission.PHI_READ],
      missing_permissions: [],
      audit_required: true
    }
  }
  
  /**
   * Check if operation requires elevated access
   */
  static requiresElevatedAccess(
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    const elevatedOperations = [
      { resource: 'user', action: 'delete' },
      { resource: 'healthcare_data', action: 'delete' },
      { resource: 'system', action: 'restore' },
      { resource: 'security', action: 'configure' },
      { resource: 'compliance', action: 'configure' }
    ]
    
    return elevatedOperations.some(op => 
      op.resource === resource && op.action === action
    )
  }
  
  /**
   * Check if user has elevated access
   */
  static hasElevatedAccess(context: PermissionContext): boolean {
    const elevatedRoles = [
      HealthcareRole.SYSTEM_ADMIN,
      HealthcareRole.CHIEF_MEDICAL_OFFICER,
      HealthcareRole.MEDICAL_DIRECTOR,
      HealthcareRole.ADMIN,
      HealthcareRole.COMPLIANCE_OFFICER
    ]
    
    return elevatedRoles.includes(context.role) ||
           context.healthcare_context?.clearance_level === 'critical'
  }
  
  /**
   * Check time-based access restrictions
   */
  static checkTimeRestrictions(
    context: PermissionContext,
    request: AccessRequest
  ): boolean {
    // Example: Some operations only allowed during business hours
    // This can be configured based on healthcare facility policies
    const now = new Date()
    const hour = now.getHours()
    
    // Critical operations can happen any time
    if (request.urgent || context.healthcare_context?.clearance_level === 'critical') {
      return true
    }
    
    // Non-urgent operations during business hours (7 AM - 7 PM)
    return hour >= 7 && hour <= 19
  }
  
  /**
   * Check if audit logging is required
   */
  static requiresAuditLogging(
    resource: string,
    action: string,
    context: PermissionContext
  ): boolean {
    // Always audit healthcare data access
    if (resource === 'healthcare_data' || resource === 'clinical_data') {
      return true
    }
    
    // Audit all administrative actions
    if (resource === 'user' || resource === 'security' || resource === 'compliance') {
      return true
    }
    
    // Audit privileged operations
    const privilegedActions = ['delete', 'configure', 'assign_roles']
    if (privilegedActions.includes(action)) {
      return true
    }
    
    return false
  }
}

// ================================
// Permission Management Service
// ================================

export class PermissionManagementService {
  /**
   * Validate user permissions for a specific operation
   */
  static async validatePermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<PermissionCheck> {
    try {
      // Get user's current role and permissions
      const userRole = await RoleAssignmentService.getUserRole(userId)
      
      if (!userRole.role) {
        return {
          granted: false,
          reason: 'User has no assigned role',
          required_permissions: [],
          missing_permissions: [],
          audit_required: true
        }
      }
      
      // Get user's healthcare context
      const supabase = createClient()
      const { data: userAssignment } = await supabase
        .from('user_role_assignments')
        .select('healthcare_context')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()
      
      // Create permission context
      const permissionContext: PermissionContext = {
        userId,
        role: userRole.role,
        permissions: userRole.permissions,
        healthcare_context: userAssignment?.healthcare_context,
        timestamp: new Date().toISOString()
      }
      
      // Create access request
      const accessRequest: AccessRequest = {
        resource,
        action,
        context,
        healthcare_data: this.isHealthcareResource(resource)
      }
      
      // Check permissions
      const permissionCheck = PermissionRuleEngine.checkResourceAccess(
        permissionContext,
        accessRequest
      )
      
      // Log audit trail if required
      if (permissionCheck.audit_required) {
        await this.logPermissionCheck(userId, resource, action, permissionCheck)
      }
      
      return permissionCheck
      
    } catch (error) {
      logger.error('Permission validation error:', { error, userId, resource, action })
      return {
        granted: false,
        reason: 'Permission validation failed',
        required_permissions: [],
        missing_permissions: [],
        audit_required: true
      }
    }
  }
  
  /**
   * Bulk permission validation for multiple operations
   */
  static async validateMultiplePermissions(
    userId: string,
    requests: Array<{ resource: string; action: string; context?: Record<string, any> }>
  ): Promise<Record<string, PermissionCheck>> {
    const results: Record<string, PermissionCheck> = {}
    
    for (const request of requests) {
      const key = `${request.resource}:${request.action}`
      results[key] = await this.validatePermission(
        userId,
        request.resource,
        request.action,
        request.context
      )
    }
    
    return results
  }
  
  /**
   * Check if resource involves healthcare data
   */
  static isHealthcareResource(resource: string): boolean {
    const healthcareResources = [
      'healthcare_data',
      'clinical_data',
      'phi',
      'patient_data'
    ]
    
    return healthcareResources.includes(resource) ||
           resource.includes('health') ||
           resource.includes('medical') ||
           resource.includes('clinical')
  }
  
  /**
   * Log permission check for audit trail
   */
  static async logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    result: PermissionCheck
  ): Promise<void> {
    try {
      const supabase = createClient()
      
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'permission_check',
          resource_type: resource,
          resource_id: null,
          details: {
            action,
            granted: result.granted,
            reason: result.reason,
            required_permissions: result.required_permissions,
            missing_permissions: result.missing_permissions,
            elevated_access_required: result.elevated_access_required
          },
          created_at: new Date().toISOString()
        })
        
    } catch (error) {
      logger.error('Failed to log permission check:', { error, userId, resource, action })
    }
  }
  
  /**
   * Get user's effective permissions with context
   */
  static async getUserPermissionContext(userId: string): Promise<PermissionContext | null> {
    try {
      const userRole = await RoleAssignmentService.getUserRole(userId)
      
      if (!userRole.role) {
        return null
      }
      
      const supabase = createClient()
      const { data: userAssignment } = await supabase
        .from('user_role_assignments')
        .select('healthcare_context')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()
      
      return {
        userId,
        role: userRole.role,
        permissions: userRole.permissions,
        healthcare_context: userAssignment?.healthcare_context,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      logger.error('Failed to get user permission context:', { error, userId })
      return null
    }
  }
}

// ================================
// Permission Middleware Integration
// ================================

/**
 * Enhanced permission checking function for middleware
 */
export async function checkEnhancedPermission(
  userId: string,
  requiredPermission: Permission,
  resource?: string,
  action?: string,
  context?: Record<string, any>
): Promise<boolean> {
  try {
    // If specific resource/action provided, use enhanced validation
    if (resource && action) {
      const result = await PermissionManagementService.validatePermission(
        userId,
        resource,
        action,
        context
      )
      return result.granted
    }
    
    // Fallback to basic permission check
    const userRole = await RoleAssignmentService.getUserRole(userId)
    return userRole.permissions.includes(requiredPermission)
    
  } catch (error) {
    logger.error('Enhanced permission check failed:', { error, userId, requiredPermission })
    return false
  }
}

export default {
  PermissionRuleEngine,
  PermissionManagementService,
  checkEnhancedPermission
}