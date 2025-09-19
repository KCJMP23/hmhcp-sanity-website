// Role-Based Access Control Service
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  organization_id: string;
  roles: UserRole[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export class RoleBasedAccessControl {
  private permissions: Map<string, string[]> = new Map();

  constructor() {
    this.initializePermissions();
  }

  /**
   * Check if user has permission to perform action on resource
   */
  hasPermission(
    user: User,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    // Check if user has any roles
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    // Check each role for the required permission
    for (const role of user.roles) {
      if (this.roleHasPermission(role, resource, action, context)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user can view publications
   */
  canViewPublications(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'publications', 'view') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can create publications
   */
  canCreatePublications(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'publications', 'create') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can edit publications
   */
  canEditPublications(user: User, organizationId: string, publicationId?: string): boolean {
    return this.hasPermission(user, 'publications', 'edit') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can delete publications
   */
  canDeletePublications(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'publications', 'delete') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can view authors
   */
  canViewAuthors(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'authors', 'view') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can create authors
   */
  canCreateAuthors(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'authors', 'create') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can edit authors
   */
  canEditAuthors(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'authors', 'edit') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can delete authors
   */
  canDeleteAuthors(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'authors', 'delete') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can view research topics
   */
  canViewResearchTopics(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'research_topics', 'view') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can create research topics
   */
  canCreateResearchTopics(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'research_topics', 'create') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can edit research topics
   */
  canEditResearchTopics(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'research_topics', 'edit') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can delete research topics
   */
  canDeleteResearchTopics(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'research_topics', 'delete') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can view analytics
   */
  canViewAnalytics(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'analytics', 'view') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can export data
   */
  canExportData(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'data', 'export') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can perform bulk operations
   */
  canPerformBulkOperations(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'bulk', 'import') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can access research integration
   */
  canAccessResearchIntegration(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'research_integration', 'access') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can view compliance reports
   */
  canViewComplianceReports(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'compliance', 'view') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can view audit logs
   */
  canViewAuditLogs(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'audit_logs', 'view') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'users', 'manage') && 
           user.organization_id === organizationId;
  }

  /**
   * Check if user can manage roles
   */
  canManageRoles(user: User, organizationId: string): boolean {
    return this.hasPermission(user, 'roles', 'manage') && 
           user.organization_id === organizationId;
  }

  /**
   * Get user's effective permissions
   */
  getEffectivePermissions(user: User): string[] {
    if (!user.roles || user.roles.length === 0) {
      return [];
    }

    const permissions = new Set<string>();
    
    for (const role of user.roles) {
      if (role.permissions) {
        role.permissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Check if role has permission
   */
  private roleHasPermission(
    role: UserRole,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    if (!role.permissions || role.permissions.length === 0) {
      return false;
    }

    // Check for exact permission
    const exactPermission = `${resource}:${action}`;
    if (role.permissions.includes(exactPermission)) {
      return true;
    }

    // Check for wildcard permissions
    if (role.permissions.includes(`${resource}:*`)) {
      return true;
    }

    if (role.permissions.includes('*:*')) {
      return true;
    }

    // Check for resource-specific permissions
    if (role.permissions.includes(`${resource}:all`)) {
      return true;
    }

    return false;
  }

  /**
   * Initialize default permissions
   */
  private initializePermissions(): void {
    // Admin permissions
    this.permissions.set('admin', [
      'publications:*',
      'authors:*',
      'research_topics:*',
      'analytics:*',
      'data:*',
      'bulk:*',
      'research_integration:*',
      'compliance:*',
      'audit_logs:*',
      'users:*',
      'roles:*'
    ]);

    // Editor permissions
    this.permissions.set('editor', [
      'publications:view',
      'publications:create',
      'publications:edit',
      'authors:view',
      'authors:create',
      'authors:edit',
      'research_topics:view',
      'research_topics:create',
      'research_topics:edit',
      'analytics:view',
      'data:export',
      'bulk:import',
      'research_integration:access'
    ]);

    // Reviewer permissions
    this.permissions.set('reviewer', [
      'publications:view',
      'authors:view',
      'research_topics:view',
      'analytics:view',
      'data:export'
    ]);

    // Reader permissions
    this.permissions.set('reader', [
      'publications:view',
      'authors:view',
      'research_topics:view',
      'analytics:view'
    ]);

    // Compliance officer permissions
    this.permissions.set('compliance_officer', [
      'publications:view',
      'authors:view',
      'research_topics:view',
      'analytics:view',
      'compliance:view',
      'audit_logs:view'
    ]);

    // Research coordinator permissions
    this.permissions.set('research_coordinator', [
      'publications:view',
      'publications:create',
      'publications:edit',
      'authors:view',
      'authors:create',
      'authors:edit',
      'research_topics:view',
      'research_topics:create',
      'research_topics:edit',
      'analytics:view',
      'research_integration:access'
    ]);
  }

  /**
   * Get permissions for a role
   */
  getRolePermissions(roleName: string): string[] {
    return this.permissions.get(roleName) || [];
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: User, roleNames: string[]): boolean {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    return user.roles.some(role => roleNames.includes(role.name));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(user: User, roleNames: string[]): boolean {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    const userRoleNames = user.roles.map(role => role.name);
    return roleNames.every(roleName => userRoleNames.includes(roleName));
  }

  /**
   * Get user's role hierarchy level
   */
  getRoleHierarchyLevel(user: User): number {
    if (!user.roles || user.roles.length === 0) {
      return 0;
    }

    const roleHierarchy: Record<string, number> = {
      'admin': 10,
      'compliance_officer': 9,
      'editor': 8,
      'research_coordinator': 7,
      'reviewer': 5,
      'reader': 1
    };

    const maxLevel = Math.max(...user.roles.map(role => roleHierarchy[role.name] || 0));
    return maxLevel;
  }

  /**
   * Check if user can perform action based on hierarchy
   */
  canPerformActionByHierarchy(
    user: User,
    targetUser: User,
    action: string
  ): boolean {
    const userLevel = this.getRoleHierarchyLevel(user);
    const targetLevel = this.getRoleHierarchyLevel(targetUser);

    // Users can only perform actions on users with lower hierarchy levels
    return userLevel > targetLevel;
  }
}

// Export singleton instance
export const rbac = new RoleBasedAccessControl();
