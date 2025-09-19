/**
 * Role-Based Access Control (RBAC)
 * Healthcare platform access control system
 */

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export enum Permission {
  // Content permissions
  CONTENT_READ = 'content:read',
  CONTENT_WRITE = 'content:write',
  CONTENT_DELETE = 'content:delete',
  CONTENT_PUBLISH = 'content:publish',
  
  // User management permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Admin permissions
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_DELETE = 'admin:delete',
  
  // System permissions
  SYSTEM_READ = 'system:read',
  SYSTEM_WRITE = 'system:write',
  SYSTEM_DELETE = 'system:delete',
  
  // Analytics permissions
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_WRITE = 'analytics:write',
  
  // Security permissions
  SECURITY_READ = 'security:read',
  SECURITY_WRITE = 'security:write',
  
  // Scheduling permissions
  SCHEDULE_READ = 'schedule:read',
  SCHEDULE_WRITE = 'schedule:write',
  SCHEDULE_DELETE = 'schedule:delete'
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_WRITE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.ADMIN_READ,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_WRITE,
    Permission.SECURITY_READ,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_WRITE,
    Permission.SCHEDULE_DELETE
  ],
  [Role.EDITOR]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_WRITE,
    Permission.CONTENT_PUBLISH,
    Permission.ANALYTICS_READ,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_WRITE
  ],
  [Role.VIEWER]: [
    Permission.CONTENT_READ,
    Permission.ANALYTICS_READ,
    Permission.SCHEDULE_READ
  ],
  [Role.GUEST]: []
}

export interface User {
  id: string
  role: Role
  permissions: Permission[]
  organizationId?: string
}

export class RBACService {
  static hasPermission(user: User, permission: Permission): boolean {
    return user.permissions.includes(permission) || 
           user.role === Role.SUPER_ADMIN ||
           ROLE_PERMISSIONS[user.role].includes(permission)
  }

  static hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission))
  }

  static hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission))
  }

  static canAccessResource(user: User, resource: string, action: string): boolean {
    const permission = `${resource}:${action}` as Permission
    return this.hasPermission(user, permission)
  }

  static getEffectivePermissions(user: User): Permission[] {
    const rolePermissions = ROLE_PERMISSIONS[user.role] || []
    const userPermissions = user.permissions || []
    
    return [...new Set([...rolePermissions, ...userPermissions])]
  }

  static isAdmin(user: User): boolean {
    return user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN
  }

  static isSuperAdmin(user: User): boolean {
    return user.role === Role.SUPER_ADMIN
  }

  static canManageUsers(user: User): boolean {
    return this.hasPermission(user, Permission.USER_WRITE) || 
           this.hasPermission(user, Permission.USER_DELETE)
  }

  static canManageContent(user: User): boolean {
    return this.hasPermission(user, Permission.CONTENT_WRITE) || 
           this.hasPermission(user, Permission.CONTENT_DELETE) ||
           this.hasPermission(user, Permission.CONTENT_PUBLISH)
  }

  static canAccessAnalytics(user: User): boolean {
    return this.hasPermission(user, Permission.ANALYTICS_READ) ||
           this.hasPermission(user, Permission.ANALYTICS_WRITE)
  }

  static canAccessSecurity(user: User): boolean {
    return this.hasPermission(user, Permission.SECURITY_READ) ||
           this.hasPermission(user, Permission.SECURITY_WRITE)
  }
}

export default RBACService

export const validateRole = async (user: any, role: string) => {
  // Placeholder for role validation
  return true;
};
