/**
 * Enhanced Role-Based Access Control (RBAC) System
 * Story 3.4: User Management & Role-Based Access Control
 */

import { RBACSystem, Role, Permission } from './rbac-system';
import { supabaseAdmin } from '@/lib/dal/supabase';
import { cache } from '@/lib/cache/redis-cache';
import logger from '@/lib/logging/winston-logger';
import { RBAC_CACHE_CONFIG, RBAC_RATE_LIMITS } from './rbac-config';

export interface EnhancedPermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  scope?: 'own' | 'team' | 'all';
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export interface UserGroup {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  parentId?: string;
}

export class EnhancedRBACSystem extends RBACSystem {
  private static instance: EnhancedRBACSystem;
  private permissionCacheTTL = RBAC_CACHE_CONFIG.PERMISSION_CACHE_TTL;

  private constructor() {
    super();
  }

  public static getInstance(): EnhancedRBACSystem {
    if (!EnhancedRBACSystem.instance) {
      EnhancedRBACSystem.instance = new EnhancedRBACSystem();
    }
    return EnhancedRBACSystem.instance;
  }

  /**
   * Dynamic permission checking with conditions
   */
  async checkPermission(
    userId: string,
    permission: EnhancedPermission | Permission | string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Convert string permission to EnhancedPermission
      const enhancedPerm = this.normalizePermission(permission);
      
      // Check cache first
      const cacheKey = `permissions:${userId}`;
      const cachedPermissions = await cache.get(cacheKey);
      
      let userPermissions: string[];
      if (cachedPermissions) {
        userPermissions = JSON.parse(cachedPermissions);
      } else {
        userPermissions = await this.getUserPermissions(userId);
        await cache.set(cacheKey, JSON.stringify(userPermissions), this.permissionCacheTTL);
      }

      // Check if user has wildcard permission
      if (userPermissions.includes('*')) {
        return true;
      }

      // Check specific permission
      const permissionString = `${enhancedPerm.resource}:${enhancedPerm.action}`;
      const hasPermission = userPermissions.some(perm => {
        // Handle wildcard permissions
        if (perm.endsWith(':*')) {
          const resource = perm.split(':')[0];
          return resource === enhancedPerm.resource || resource === '*';
        }
        return perm === permissionString || perm === `${enhancedPerm.resource}:*`;
      });

      // If no basic permission, return false
      if (!hasPermission) {
        return false;
      }

      // Check conditions if provided
      if (enhancedPerm.conditions && context) {
        return this.evaluateConditions(enhancedPerm.conditions, context);
      }

      // Check scope if provided
      if (enhancedPerm.scope && context) {
        return this.evaluateScope(userId, enhancedPerm.scope, context);
      }

      return true;
    } catch (error) {
      logger.error('Permission check failed', { error, userId, permission });
      return false;
    }
  }

  /**
   * Get all permissions for a user (from roles and groups)
   * Uses optimized database view for better performance
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Use optimized function that queries pre-computed view
      const { data, error } = await supabaseAdmin.rpc('get_user_permissions_optimized', {
        p_user_id: userId
      });

      if (error) {
        // Fallback to original function if optimized version doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin.rpc('get_user_permissions', {
          p_user_id: userId
        });

        if (fallbackError) {
          throw fallbackError;
        }

        return fallbackData || [];
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get user permissions', { error, userId });
      return [];
    }
  }

  /**
   * Get effective roles for a user (direct and from groups)
   */
  async getEffectiveRoles(userId: string): Promise<Role[]> {
    try {
      // Get direct roles
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select(`
          id,
          role_id,
          expires_at,
          custom_roles (
            id,
            name,
            display_name,
            permissions
          )
        `)
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (rolesError) {
        throw rolesError;
      }

      // Get group roles
      const { data: groupData, error: groupError } = await supabaseAdmin
        .from('group_members')
        .select(`
          user_groups (
            id,
            name,
            permissions
          )
        `)
        .eq('user_id', userId);

      if (groupError) {
        throw groupError;
      }

      // Map to Role type
      const directRoles = userRoles?.map(ur => ur.custom_roles.name as Role) || [];
      
      // For simplicity, treating groups as pseudo-roles
      const groupRoles = groupData?.map(g => g.user_groups.name as Role) || [];

      return [...new Set([...directRoles, ...groupRoles])];
    } catch (error) {
      logger.error('Failed to get effective roles', { error, userId });
      return [];
    }
  }

  /**
   * Assign a role to a user with optional expiry
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          expires_at: expiresAt
        });

      if (error) {
        throw error;
      }

      // Clear permission cache
      await this.clearUserPermissionCache(userId);

      // Log activity
      await this.logActivity(assignedBy, 'ROLE_ASSIGNED', 'user_roles', userId, {
        roleId,
        expiresAt
      });

      return true;
    } catch (error) {
      logger.error('Failed to assign role', { error, userId, roleId });
      return false;
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: string, roleId: string, removedBy: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) {
        throw error;
      }

      // Clear permission cache
      await this.clearUserPermissionCache(userId);

      // Log activity
      await this.logActivity(removedBy, 'ROLE_REMOVED', 'user_roles', userId, {
        roleId
      });

      return true;
    } catch (error) {
      logger.error('Failed to remove role', { error, userId, roleId });
      return false;
    }
  }

  /**
   * Add user to a group
   */
  async addToGroup(userId: string, groupId: string, addedBy: string): Promise<boolean> {
    try {
      // Check for circular group membership
      if (await this.wouldCreateCircularMembership(userId, groupId)) {
        throw new Error('Cannot add user to group: would create circular membership');
      }

      const { error } = await supabaseAdmin
        .from('group_members')
        .insert({
          user_id: userId,
          group_id: groupId,
          added_by: addedBy
        });

      if (error) {
        throw error;
      }

      // Clear permission cache
      await this.clearUserPermissionCache(userId);

      // Log activity
      await this.logActivity(addedBy, 'GROUP_MEMBER_ADDED', 'group_members', userId, {
        groupId
      });

      return true;
    } catch (error) {
      logger.error('Failed to add user to group', { error, userId, groupId });
      return false;
    }
  }

  /**
   * Remove user from a group
   */
  async removeFromGroup(userId: string, groupId: string, removedBy: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('group_members')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId);

      if (error) {
        throw error;
      }

      // Clear permission cache
      await this.clearUserPermissionCache(userId);

      // Log activity
      await this.logActivity(removedBy, 'GROUP_MEMBER_REMOVED', 'group_members', userId, {
        groupId
      });

      return true;
    } catch (error) {
      logger.error('Failed to remove user from group', { error, userId, groupId });
      return false;
    }
  }

  /**
   * Check if a user has a specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const roles = await this.getEffectiveRoles(userId);
      return roles.includes(roleName as Role);
    } catch (error) {
      logger.error('Failed to check role', { error, userId, roleName });
      return false;
    }
  }

  /**
   * Get all users with a specific role
   */
  async getUsersWithRole(roleName: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('custom_roles.name', roleName)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) {
        throw error;
      }

      return data?.map(ur => ur.user_id) || [];
    } catch (error) {
      logger.error('Failed to get users with role', { error, roleName });
      return [];
    }
  }

  /**
   * Create a custom role
   */
  async createCustomRole(
    name: string,
    displayName: string,
    description: string,
    permissions: string[],
    createdBy: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('custom_roles')
        .insert({
          name,
          display_name: displayName,
          description,
          permissions,
          is_system: false,
          created_by: createdBy
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Log activity
      await this.logActivity(createdBy, 'ROLE_CREATED', 'custom_roles', data.id, {
        name,
        permissions
      });

      return data.id;
    } catch (error) {
      logger.error('Failed to create custom role', { error, name });
      return null;
    }
  }

  /**
   * Update a custom role
   */
  async updateCustomRole(
    roleId: string,
    updates: Partial<{
      displayName: string;
      description: string;
      permissions: string[];
    }>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('custom_roles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .eq('is_system', false); // Prevent updating system roles

      if (error) {
        throw error;
      }

      // Clear permission cache for all users with this role
      const users = await this.getUsersWithRole(roleId);
      await Promise.all(users.map(userId => this.clearUserPermissionCache(userId)));

      // Log activity
      await this.logActivity(updatedBy, 'ROLE_UPDATED', 'custom_roles', roleId, updates);

      return true;
    } catch (error) {
      logger.error('Failed to update custom role', { error, roleId });
      return false;
    }
  }

  /**
   * Delete a custom role
   */
  async deleteCustomRole(roleId: string, deletedBy: string): Promise<boolean> {
    try {
      // Check if it's a system role
      const { data: role, error: checkError } = await supabaseAdmin
        .from('custom_roles')
        .select('is_system, name')
        .eq('id', roleId)
        .single();

      if (checkError || !role) {
        throw new Error('Role not found');
      }

      if (role.is_system) {
        throw new Error('Cannot delete system role');
      }

      // Get affected users before deletion
      const users = await this.getUsersWithRole(role.name);

      // Delete the role (cascades to user_roles)
      const { error } = await supabaseAdmin
        .from('custom_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        throw error;
      }

      // Clear permission cache for affected users
      await Promise.all(users.map(userId => this.clearUserPermissionCache(userId)));

      // Log activity
      await this.logActivity(deletedBy, 'ROLE_DELETED', 'custom_roles', roleId, {
        name: role.name
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete custom role', { error, roleId });
      return false;
    }
  }

  // Private helper methods

  private normalizePermission(permission: EnhancedPermission | Permission | string): EnhancedPermission {
    if (typeof permission === 'string') {
      const parts = permission.split(':');
      return {
        resource: parts[0] || '*',
        action: parts[1] || '*'
      };
    }
    
    if ('resource' in permission && 'action' in permission) {
      return permission as EnhancedPermission;
    }

    // Convert enum Permission to EnhancedPermission
    const permStr = permission as string;
    const parts = permStr.split(':');
    return {
      resource: parts[0] || '*',
      action: parts[1] || '*'
    };
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private evaluateScope(userId: string, scope: 'own' | 'team' | 'all', context: Record<string, any>): boolean {
    switch (scope) {
      case 'own':
        return context.ownerId === userId || context.userId === userId;
      case 'team':
        // Would need to check team membership
        return true; // Simplified for now
      case 'all':
        return true;
      default:
        return false;
    }
  }

  private async wouldCreateCircularMembership(userId: string, groupId: string): Promise<boolean> {
    // Check if adding this user to the group would create a circular reference
    // This is a simplified check - in production, you'd want a more thorough graph traversal
    const { data } = await supabaseAdmin
      .from('user_groups')
      .select('parent_id')
      .eq('id', groupId)
      .single();

    if (data?.parent_id === userId) {
      return true;
    }

    return false;
  }

  private async clearUserPermissionCache(userId: string): Promise<void> {
    const cacheKey = `permissions:${userId}`;
    await cache.del(cacheKey);
  }

  private async logActivity(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details
        });
    } catch (error) {
      logger.error('Failed to log activity', { error, userId, action });
    }
  }
}

// Export singleton instance
export const enhancedRBAC = EnhancedRBACSystem.getInstance();

// Export functions for backward compatibility
export const checkUserPermission = enhancedRBAC.checkPermission.bind(enhancedRBAC);