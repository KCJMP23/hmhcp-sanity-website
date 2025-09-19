/**
 * Healthcare Role Management System
 * Advanced Role-Based Access Control (RBAC) for healthcare compliance
 * 
 * Story 1.6 Task 2: Advanced Role-Based Access Control
 * Implements granular healthcare role permissions matrix with HIPAA compliance
 */

import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
)

// ================================
// Healthcare Roles and Permissions
// ================================

/**
 * Healthcare-specific role hierarchy
 */
export enum HealthcareRole {
  // System Administrator - Full platform control
  SYSTEM_ADMIN = 'system_admin',
  
  // Healthcare Professional Roles
  CHIEF_MEDICAL_OFFICER = 'chief_medical_officer',
  MEDICAL_DIRECTOR = 'medical_director',
  PHYSICIAN = 'physician',
  NURSE_MANAGER = 'nurse_manager',
  REGISTERED_NURSE = 'registered_nurse',
  HEALTHCARE_ANALYST = 'healthcare_analyst',
  
  // Administrative Roles
  ADMIN = 'admin',
  CONTENT_MANAGER = 'content_manager',
  MARKETING_MANAGER = 'marketing_manager',
  COMPLIANCE_OFFICER = 'compliance_officer',
  
  // Content Roles
  EDITOR = 'editor',
  AUTHOR = 'author',
  REVIEWER = 'reviewer',
  
  // Basic Access
  VIEWER = 'viewer',
  GUEST = 'guest'
}

/**
 * Granular permission categories
 */
export enum PermissionCategory {
  // System Management
  SYSTEM = 'system',
  
  // User and Role Management
  USER_MANAGEMENT = 'user_management',
  
  // Content Management
  CONTENT = 'content',
  
  // Healthcare Data
  HEALTHCARE_DATA = 'healthcare_data',
  
  // Compliance and Audit
  COMPLIANCE = 'compliance',
  
  // Security Operations
  SECURITY = 'security',
  
  // Analytics and Reporting
  ANALYTICS = 'analytics'
}

/**
 * Specific permissions within each category
 */
export enum Permission {
  // System Management Permissions
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_RESTORE = 'system:restore',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  
  // User Management Permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ASSIGN_ROLES = 'user:assign_roles',
  USER_MANAGE_PERMISSIONS = 'user:manage_permissions',
  USER_VIEW_ACTIVITY = 'user:view_activity',
  
  // Content Management Permissions
  CONTENT_CREATE = 'content:create',
  CONTENT_READ = 'content:read',
  CONTENT_UPDATE = 'content:update',
  CONTENT_DELETE = 'content:delete',
  CONTENT_PUBLISH = 'content:publish',
  CONTENT_MODERATE = 'content:moderate',
  CONTENT_VERSION_CONTROL = 'content:version_control',
  
  // Blog-specific Permissions
  BLOG_CREATE = 'blog:create',
  BLOG_READ = 'blog:read',
  BLOG_UPDATE = 'blog:update',
  BLOG_DELETE = 'blog:delete',
  BLOG_PUBLISH = 'blog:publish',
  
  // Platform Management
  PLATFORM_CREATE = 'platform:create',
  PLATFORM_READ = 'platform:read',
  PLATFORM_UPDATE = 'platform:update',
  PLATFORM_DELETE = 'platform:delete',
  
  // Service Management
  SERVICE_CREATE = 'service:create',
  SERVICE_READ = 'service:read',
  SERVICE_UPDATE = 'service:update',
  SERVICE_DELETE = 'service:delete',
  
  // Team Management
  TEAM_CREATE = 'team:create',
  TEAM_READ = 'team:read',
  TEAM_UPDATE = 'team:update',
  TEAM_DELETE = 'team:delete',
  
  // Healthcare Data Permissions
  PHI_READ = 'healthcare:phi_read',
  PHI_WRITE = 'healthcare:phi_write',
  PHI_DELETE = 'healthcare:phi_delete',
  PHI_EXPORT = 'healthcare:phi_export',
  HEALTHCARE_ANALYTICS = 'healthcare:analytics',
  CLINICAL_DATA_ACCESS = 'healthcare:clinical_data',
  
  // Compliance Permissions
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_AUDIT = 'compliance:audit',
  COMPLIANCE_REPORT = 'compliance:report',
  COMPLIANCE_CONFIGURE = 'compliance:configure',
  HIPAA_OFFICER = 'compliance:hipaa_officer',
  
  // Security Permissions
  SECURITY_VIEW = 'security:view',
  SECURITY_CONFIGURE = 'security:configure',
  SECURITY_AUDIT = 'security:audit',
  SECURITY_INCIDENT_RESPONSE = 'security:incident_response',
  SECURITY_THREAT_DETECTION = 'security:threat_detection',
  SECURITY_MFA_ADMIN = 'security:mfa_admin',
  
  // Analytics Permissions
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_CREATE_REPORTS = 'analytics:create_reports',
  ANALYTICS_EXPORT = 'analytics:export',
  ANALYTICS_MANAGE_DASHBOARDS = 'analytics:manage_dashboards'
}

/**
 * Healthcare Role Permission Matrix
 * Defines which permissions each healthcare role has
 */
export const HEALTHCARE_ROLE_PERMISSIONS: Record<HealthcareRole, Permission[]> = {
  // System Administrator - Full access
  [HealthcareRole.SYSTEM_ADMIN]: Object.values(Permission),
  
  // Chief Medical Officer - Strategic healthcare oversight
  [HealthcareRole.CHIEF_MEDICAL_OFFICER]: [
    Permission.USER_READ,
    Permission.USER_VIEW_ACTIVITY,
    Permission.CONTENT_READ,
    Permission.CONTENT_MODERATE,
    Permission.CONTENT_PUBLISH,
    Permission.BLOG_READ,
    Permission.PLATFORM_READ,
    Permission.SERVICE_READ,
    Permission.TEAM_READ,
    Permission.PHI_READ,
    Permission.HEALTHCARE_ANALYTICS,
    Permission.CLINICAL_DATA_ACCESS,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_AUDIT,
    Permission.COMPLIANCE_REPORT,
    Permission.SECURITY_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_CREATE_REPORTS,
    Permission.ANALYTICS_EXPORT
  ],
  
  // Medical Director - Clinical oversight and content approval
  [HealthcareRole.MEDICAL_DIRECTOR]: [
    Permission.USER_READ,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_MODERATE,
    Permission.CONTENT_PUBLISH,
    Permission.BLOG_READ,
    Permission.BLOG_UPDATE,
    Permission.BLOG_PUBLISH,
    Permission.PLATFORM_READ,
    Permission.PLATFORM_UPDATE,
    Permission.SERVICE_READ,
    Permission.SERVICE_UPDATE,
    Permission.TEAM_READ,
    Permission.PHI_READ,
    Permission.HEALTHCARE_ANALYTICS,
    Permission.CLINICAL_DATA_ACCESS,
    Permission.COMPLIANCE_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_CREATE_REPORTS
  ],
  
  // Physician - Clinical content creation and review
  [HealthcareRole.PHYSICIAN]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.BLOG_READ,
    Permission.BLOG_CREATE,
    Permission.BLOG_UPDATE,
    Permission.PLATFORM_READ,
    Permission.SERVICE_READ,
    Permission.TEAM_READ,
    Permission.PHI_READ,
    Permission.CLINICAL_DATA_ACCESS,
    Permission.ANALYTICS_VIEW
  ],
  
  // Nurse Manager - Care coordination and team management
  [HealthcareRole.NURSE_MANAGER]: [
    Permission.USER_READ,
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.BLOG_READ,
    Permission.BLOG_CREATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.PHI_READ,
    Permission.CLINICAL_DATA_ACCESS,
    Permission.ANALYTICS_VIEW
  ],
  
  // Registered Nurse - Patient care documentation
  [HealthcareRole.REGISTERED_NURSE]: [
    Permission.CONTENT_READ,
    Permission.BLOG_READ,
    Permission.TEAM_READ,
    Permission.PHI_READ,
    Permission.CLINICAL_DATA_ACCESS
  ],
  
  // Healthcare Analyst - Data analysis and reporting
  [HealthcareRole.HEALTHCARE_ANALYST]: [
    Permission.CONTENT_READ,
    Permission.BLOG_READ,
    Permission.PLATFORM_READ,
    Permission.SERVICE_READ,
    Permission.TEAM_READ,
    Permission.HEALTHCARE_ANALYTICS,
    Permission.CLINICAL_DATA_ACCESS,
    Permission.COMPLIANCE_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_CREATE_REPORTS,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_MANAGE_DASHBOARDS
  ],
  
  // Admin - Platform administration
  [HealthcareRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_ASSIGN_ROLES,
    Permission.USER_VIEW_ACTIVITY,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.CONTENT_MODERATE,
    Permission.BLOG_CREATE,
    Permission.BLOG_READ,
    Permission.BLOG_UPDATE,
    Permission.BLOG_DELETE,
    Permission.BLOG_PUBLISH,
    Permission.PLATFORM_CREATE,
    Permission.PLATFORM_READ,
    Permission.PLATFORM_UPDATE,
    Permission.PLATFORM_DELETE,
    Permission.SERVICE_CREATE,
    Permission.SERVICE_READ,
    Permission.SERVICE_UPDATE,
    Permission.SERVICE_DELETE,
    Permission.TEAM_CREATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_DELETE,
    Permission.SECURITY_VIEW,
    Permission.SECURITY_CONFIGURE,
    Permission.SECURITY_MFA_ADMIN,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_CREATE_REPORTS
  ],
  
  // Content Manager - Content lifecycle management
  [HealthcareRole.CONTENT_MANAGER]: [
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.CONTENT_MODERATE,
    Permission.CONTENT_VERSION_CONTROL,
    Permission.BLOG_CREATE,
    Permission.BLOG_READ,
    Permission.BLOG_UPDATE,
    Permission.BLOG_DELETE,
    Permission.BLOG_PUBLISH,
    Permission.PLATFORM_CREATE,
    Permission.PLATFORM_READ,
    Permission.PLATFORM_UPDATE,
    Permission.SERVICE_CREATE,
    Permission.SERVICE_READ,
    Permission.SERVICE_UPDATE,
    Permission.TEAM_CREATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.ANALYTICS_VIEW
  ],
  
  // Marketing Manager - Marketing content and analytics
  [HealthcareRole.MARKETING_MANAGER]: [
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_PUBLISH,
    Permission.BLOG_CREATE,
    Permission.BLOG_READ,
    Permission.BLOG_UPDATE,
    Permission.BLOG_PUBLISH,
    Permission.PLATFORM_READ,
    Permission.PLATFORM_UPDATE,
    Permission.SERVICE_READ,
    Permission.SERVICE_UPDATE,
    Permission.TEAM_READ,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_CREATE_REPORTS,
    Permission.ANALYTICS_MANAGE_DASHBOARDS
  ],
  
  // Compliance Officer - Regulatory compliance oversight
  [HealthcareRole.COMPLIANCE_OFFICER]: [
    Permission.USER_READ,
    Permission.USER_VIEW_ACTIVITY,
    Permission.CONTENT_READ,
    Permission.BLOG_READ,
    Permission.PLATFORM_READ,
    Permission.SERVICE_READ,
    Permission.TEAM_READ,
    Permission.PHI_READ,
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_AUDIT,
    Permission.COMPLIANCE_REPORT,
    Permission.COMPLIANCE_CONFIGURE,
    Permission.HIPAA_OFFICER,
    Permission.SECURITY_VIEW,
    Permission.SECURITY_AUDIT,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_CREATE_REPORTS,
    Permission.ANALYTICS_EXPORT
  ],
  
  // Editor - Content editing and review
  [HealthcareRole.EDITOR]: [
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_MODERATE,
    Permission.BLOG_CREATE,
    Permission.BLOG_READ,
    Permission.BLOG_UPDATE,
    Permission.PLATFORM_READ,
    Permission.PLATFORM_UPDATE,
    Permission.SERVICE_READ,
    Permission.SERVICE_UPDATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE
  ],
  
  // Author - Content creation
  [HealthcareRole.AUTHOR]: [
    Permission.CONTENT_CREATE,
    Permission.CONTENT_READ,
    Permission.CONTENT_UPDATE,
    Permission.BLOG_CREATE,
    Permission.BLOG_READ,
    Permission.BLOG_UPDATE,
    Permission.PLATFORM_READ,
    Permission.SERVICE_READ,
    Permission.TEAM_READ
  ],
  
  // Reviewer - Content review and feedback
  [HealthcareRole.REVIEWER]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_MODERATE,
    Permission.BLOG_READ,
    Permission.PLATFORM_READ,
    Permission.SERVICE_READ,
    Permission.TEAM_READ
  ],
  
  // Viewer - Read-only access
  [HealthcareRole.VIEWER]: [
    Permission.CONTENT_READ,
    Permission.BLOG_READ,
    Permission.PLATFORM_READ,
    Permission.SERVICE_READ,
    Permission.TEAM_READ
  ],
  
  // Guest - Minimal access
  [HealthcareRole.GUEST]: [
    Permission.CONTENT_READ,
    Permission.BLOG_READ
  ]
}

/**
 * Permission hierarchy levels for escalation
 */
export enum PermissionLevel {
  GUEST = 0,
  VIEWER = 1,
  AUTHOR = 2,
  EDITOR = 3,
  REVIEWER = 3,
  MARKETING_MANAGER = 4,
  CONTENT_MANAGER = 4,
  REGISTERED_NURSE = 4,
  NURSE_MANAGER = 5,
  PHYSICIAN = 5,
  HEALTHCARE_ANALYST = 5,
  ADMIN = 6,
  COMPLIANCE_OFFICER = 7,
  MEDICAL_DIRECTOR = 8,
  CHIEF_MEDICAL_OFFICER = 9,
  SYSTEM_ADMIN = 10
}

/**
 * Role hierarchy for permission inheritance and escalation
 */
export const ROLE_HIERARCHY: Record<HealthcareRole, PermissionLevel> = {
  [HealthcareRole.GUEST]: PermissionLevel.GUEST,
  [HealthcareRole.VIEWER]: PermissionLevel.VIEWER,
  [HealthcareRole.AUTHOR]: PermissionLevel.AUTHOR,
  [HealthcareRole.EDITOR]: PermissionLevel.EDITOR,
  [HealthcareRole.REVIEWER]: PermissionLevel.REVIEWER,
  [HealthcareRole.MARKETING_MANAGER]: PermissionLevel.MARKETING_MANAGER,
  [HealthcareRole.CONTENT_MANAGER]: PermissionLevel.CONTENT_MANAGER,
  [HealthcareRole.REGISTERED_NURSE]: PermissionLevel.REGISTERED_NURSE,
  [HealthcareRole.NURSE_MANAGER]: PermissionLevel.NURSE_MANAGER,
  [HealthcareRole.PHYSICIAN]: PermissionLevel.PHYSICIAN,
  [HealthcareRole.HEALTHCARE_ANALYST]: PermissionLevel.HEALTHCARE_ANALYST,
  [HealthcareRole.ADMIN]: PermissionLevel.ADMIN,
  [HealthcareRole.COMPLIANCE_OFFICER]: PermissionLevel.COMPLIANCE_OFFICER,
  [HealthcareRole.MEDICAL_DIRECTOR]: PermissionLevel.MEDICAL_DIRECTOR,
  [HealthcareRole.CHIEF_MEDICAL_OFFICER]: PermissionLevel.CHIEF_MEDICAL_OFFICER,
  [HealthcareRole.SYSTEM_ADMIN]: PermissionLevel.SYSTEM_ADMIN
}

// ================================
// User Role Assignment Interface
// ================================

export interface UserRoleAssignment {
  id: string
  user_id: string
  role: HealthcareRole
  permissions: Permission[]
  granted_by: string
  granted_at: string
  expires_at?: string
  is_active: boolean
  healthcare_context?: {
    department?: string
    license_number?: string
    specialization?: string[]
    clearance_level?: string
  }
  created_at: string
  updated_at: string
}

export interface RoleChangeRequest {
  user_id: string
  from_role: HealthcareRole
  to_role: HealthcareRole
  reason: string
  requested_by: string
  approved_by?: string
  request_date: string
  approval_date?: string
  status: 'pending' | 'approved' | 'rejected'
}

// ================================
// Role Management Schemas
// ================================

export const UserRoleAssignmentSchema = z.object({
  user_id: z.string().uuid('Valid user ID required'),
  role: z.nativeEnum(HealthcareRole),
  permissions: z.array(z.nativeEnum(Permission)).default([]),
  expires_at: z.string().optional(),
  healthcare_context: z.object({
    department: z.string().optional(),
    license_number: z.string().optional(),
    specialization: z.array(z.string()).optional(),
    clearance_level: z.string().optional()
  }).optional()
})

export const RoleChangeRequestSchema = z.object({
  user_id: z.string().uuid('Valid user ID required'),
  from_role: z.nativeEnum(HealthcareRole),
  to_role: z.nativeEnum(HealthcareRole),
  reason: z.string().min(10, 'Reason must be at least 10 characters')
})

// ================================
// Healthcare Role Manager Class
// ================================

export class HealthcareRoleManager {
  /**
   * Check if user has specific permission
   */
  static hasPermission(userRole: HealthcareRole, permission: Permission): boolean {
    const rolePermissions = HEALTHCARE_ROLE_PERMISSIONS[userRole] || []
    return rolePermissions.includes(permission)
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(userRole: HealthcareRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(userRole: HealthcareRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: HealthcareRole): Permission[] {
    return HEALTHCARE_ROLE_PERMISSIONS[role] || []
  }

  /**
   * Check if one role can assign another role
   */
  static canAssignRole(assignerRole: HealthcareRole, targetRole: HealthcareRole): boolean {
    const assignerLevel = ROLE_HIERARCHY[assignerRole]
    const targetLevel = ROLE_HIERARCHY[targetRole]
    
    // Can only assign roles at same level or lower
    return assignerLevel >= targetLevel
  }

  /**
   * Get permissions by category
   */
  static getPermissionsByCategory(category: PermissionCategory): Permission[] {
    return Object.values(Permission).filter(permission => 
      permission.startsWith(category.toLowerCase())
    )
  }

  /**
   * Validate role assignment request
   */
  static validateRoleAssignment(
    assignerRole: HealthcareRole,
    targetRole: HealthcareRole,
    additionalPermissions: Permission[] = []
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check if assigner can assign the target role
    if (!this.canAssignRole(assignerRole, targetRole)) {
      errors.push(`Role ${assignerRole} cannot assign role ${targetRole}`)
    }

    // Check if additional permissions are valid for the target role
    const rolePermissions = this.getRolePermissions(targetRole)
    const invalidPermissions = additionalPermissions.filter(
      permission => !rolePermissions.includes(permission)
    )

    if (invalidPermissions.length > 0) {
      errors.push(`Invalid permissions for role ${targetRole}: ${invalidPermissions.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get effective permissions for user (role + additional permissions)
   */
  static getEffectivePermissions(
    role: HealthcareRole,
    additionalPermissions: Permission[] = []
  ): Permission[] {
    const rolePermissions = this.getRolePermissions(role)
    const combined = new Set([...rolePermissions, ...additionalPermissions])
    return Array.from(combined)
  }

  /**
   * Check if permission requires healthcare context
   */
  static requiresHealthcareContext(permission: Permission): boolean {
    const healthcarePermissions = [
      Permission.PHI_READ,
      Permission.PHI_WRITE,
      Permission.PHI_DELETE,
      Permission.PHI_EXPORT,
      Permission.HEALTHCARE_ANALYTICS,
      Permission.CLINICAL_DATA_ACCESS,
      Permission.HIPAA_OFFICER
    ]
    
    return healthcarePermissions.includes(permission)
  }

  /**
   * Get role description for UI display
   */
  static getRoleDescription(role: HealthcareRole): string {
    const descriptions: Record<HealthcareRole, string> = {
      [HealthcareRole.SYSTEM_ADMIN]: 'Complete system administration with all permissions',
      [HealthcareRole.CHIEF_MEDICAL_OFFICER]: 'Strategic healthcare oversight and clinical leadership',
      [HealthcareRole.MEDICAL_DIRECTOR]: 'Clinical oversight and medical content approval',
      [HealthcareRole.PHYSICIAN]: 'Clinical content creation and patient care documentation',
      [HealthcareRole.NURSE_MANAGER]: 'Nursing team management and care coordination',
      [HealthcareRole.REGISTERED_NURSE]: 'Patient care and clinical documentation',
      [HealthcareRole.HEALTHCARE_ANALYST]: 'Healthcare data analysis and reporting',
      [HealthcareRole.ADMIN]: 'Platform administration and user management',
      [HealthcareRole.CONTENT_MANAGER]: 'Content lifecycle and publication management',
      [HealthcareRole.MARKETING_MANAGER]: 'Marketing content and campaign management',
      [HealthcareRole.COMPLIANCE_OFFICER]: 'Regulatory compliance and audit oversight',
      [HealthcareRole.EDITOR]: 'Content editing and quality review',
      [HealthcareRole.AUTHOR]: 'Content creation and draft management',
      [HealthcareRole.REVIEWER]: 'Content review and approval workflow',
      [HealthcareRole.VIEWER]: 'Read-only access to published content',
      [HealthcareRole.GUEST]: 'Limited public content access'
    }
    
    return descriptions[role] || 'Unknown role'
  }
}

// ================================
// Database Operations
// ================================

export class RoleAssignmentService {
  /**
   * Assign role to user
   */
  static async assignRole(
    userId: string,
    role: HealthcareRole,
    assignedBy: string,
    options: {
      permissions?: Permission[]
      expiresAt?: string
      healthcareContext?: any
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate assignment
      const validation = UserRoleAssignmentSchema.parse({
        user_id: userId,
        role,
        permissions: options.permissions || [],
        expires_at: options.expiresAt,
        healthcare_context: options.healthcareContext
      })

      // Insert role assignment
      const { error } = await supabase
        .from('user_role_assignments')
        .insert({
          ...validation,
          granted_by: assignedBy,
          granted_at: new Date().toISOString(),
          is_active: true
        })

      if (error) {
        logger.error('Failed to assign role', { error, userId, role })
        return { success: false, error: error.message }
      }

      // Log audit trail
      await this.logRoleChange(userId, undefined, role, assignedBy, 'assigned')

      return { success: true }
    } catch (error) {
      logger.error('Role assignment error', { error, userId, role })
      return { success: false, error: 'Failed to assign role' }
    }
  }

  /**
   * Update user role
   */
  static async updateRole(
    userId: string,
    newRole: HealthcareRole,
    updatedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current role
      const { data: currentAssignment } = await supabase
        .from('user_role_assignments')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      // Deactivate current assignment
      await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)

      // Create new assignment
      const { error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role: newRole,
          permissions: HealthcareRoleManager.getRolePermissions(newRole),
          granted_by: updatedBy,
          granted_at: new Date().toISOString(),
          is_active: true
        })

      if (error) {
        logger.error('Failed to update role', { error, userId, newRole })
        return { success: false, error: error.message }
      }

      // Log audit trail
      await this.logRoleChange(
        userId, 
        currentAssignment?.role, 
        newRole, 
        updatedBy, 
        'updated',
        reason
      )

      return { success: true }
    } catch (error) {
      logger.error('Role update error', { error, userId, newRole })
      return { success: false, error: 'Failed to update role' }
    }
  }

  /**
   * Revoke user role
   */
  static async revokeRole(
    userId: string,
    revokedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current role
      const { data: currentAssignment } = await supabase
        .from('user_role_assignments')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      // Deactivate assignment
      const { error } = await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        logger.error('Failed to revoke role', { error, userId })
        return { success: false, error: error.message }
      }

      // Log audit trail
      await this.logRoleChange(
        userId,
        currentAssignment?.role,
        undefined,
        revokedBy,
        'revoked',
        reason
      )

      return { success: true }
    } catch (error) {
      logger.error('Role revocation error', { error, userId })
      return { success: false, error: 'Failed to revoke role' }
    }
  }

  /**
   * Get user's current role and permissions
   */
  static async getUserRole(userId: string): Promise<{
    role?: HealthcareRole
    permissions: Permission[]
    assignment?: UserRoleAssignment
  }> {
    try {
      const { data: assignment } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (!assignment) {
        return { permissions: [] }
      }

      const effectivePermissions = HealthcareRoleManager.getEffectivePermissions(
        assignment.role,
        assignment.permissions || []
      )

      return {
        role: assignment.role,
        permissions: effectivePermissions,
        assignment
      }
    } catch (error) {
      logger.error('Failed to get user role', { error, userId })
      return { permissions: [] }
    }
  }

  /**
   * Log role changes for audit trail
   */
  private static async logRoleChange(
    userId: string,
    fromRole: HealthcareRole | undefined,
    toRole: HealthcareRole | undefined,
    changedBy: string,
    action: string,
    reason?: string
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: changedBy,
          action: `role_${action}`,
          resource_type: 'user_role',
          resource_id: userId,
          details: {
            target_user_id: userId,
            from_role: fromRole,
            to_role: toRole,
            action,
            reason,
            timestamp: new Date().toISOString()
          }
        })
    } catch (error) {
      logger.error('Failed to log role change', { error })
    }
  }
}

export default {
  HealthcareRole,
  Permission,
  PermissionCategory,
  HealthcareRoleManager,
  RoleAssignmentService,
  HEALTHCARE_ROLE_PERMISSIONS,
  ROLE_HIERARCHY
}