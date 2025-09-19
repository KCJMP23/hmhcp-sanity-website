/**
 * Enterprise User Management Utilities
 * Healthcare-compliant user management with Supabase integration
 */

import { createClient } from '@supabase/supabase-js';
import { 
  EnterpriseUser, 
  HealthcareOrganization, 
  AuditLog, 
  SecurityIncident,
  HealthcareCredential,
  CreateUserRequest,
  UpdateUserRequest,
  BulkUserOperationRequest,
  UserListResponse,
  AuditLogResponse,
  UserSearchFilters,
  UserSortOptions
} from '@/types/enterprise/users';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Enterprise User Management Service
 */
export class EnterpriseUserService {
  /**
   * Get current user's organization ID
   */
  static async getCurrentUserOrganization(): Promise<string | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return null;
      }
      if (!user) return null;

      const { data, error } = await supabase
        .from('enterprise_users')
        .select('organization_id')
        .eq('supabase_user_id', user.id)
        .single();

      if (error) {
        console.error('Database error:', error);
        return null;
      }

      return data?.organization_id || null;
    } catch (error) {
      console.error('Unexpected error in getCurrentUserOrganization:', error);
      return null;
    }
  }

  /**
   * Get current user's roles
   */
  static async getCurrentUserRoles(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('enterprise_users')
      .select('healthcare_roles')
      .eq('supabase_user_id', user.id)
      .single();

    return data?.healthcare_roles || [];
  }

  /**
   * Check if current user has specific role
   */
  static async hasRole(role: string): Promise<boolean> {
    const roles = await this.getCurrentUserRoles();
    return roles.includes(role);
  }

  /**
   * Check if current user is admin
   */
  static async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  /**
   * Get users with filtering and pagination
   */
  static async getUsers(
    filters: UserSearchFilters = {},
    sort: UserSortOptions = { field: 'name', direction: 'asc' },
    page: number = 1,
    limit: number = 20
  ): Promise<UserListResponse> {
    const organizationId = await this.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('enterprise_users')
      .select(`
        *,
        healthcare_organizations!inner(name, organization_type)
      `)
      .eq('organization_id', organizationId);

    // Apply filters
    if (filters.search) {
      // Sanitize search term to prevent SQL injection
      const sanitizedSearch = filters.search.replace(/[%_\\]/g, '\\$&');
      query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
    }

    if (filters.role) {
      query = query.contains('healthcare_roles', [filters.role]);
    }

    if (filters.status === 'active') {
      query = query.not('last_login', 'is', null);
    } else if (filters.status === 'inactive') {
      query = query.is('last_login', null);
    }

    if (filters.mfa_enabled !== undefined) {
      query = query.eq('mfa_enabled', filters.mfa_enabled);
    }

    if (filters.last_login_from) {
      query = query.gte('last_login', filters.last_login_from.toISOString());
    }

    if (filters.last_login_to) {
      query = query.lte('last_login', filters.last_login_to.toISOString());
    }

    if (filters.created_from) {
      query = query.gte('created_at', filters.created_from.toISOString());
    }

    if (filters.created_to) {
      query = query.lte('created_at', filters.created_to.toISOString());
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return {
      users: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      },
      filters
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<EnterpriseUser | null> {
    const organizationId = await this.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('enterprise_users')
      .select(`
        *,
        healthcare_organizations!inner(name, organization_type)
      `)
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  /**
   * Create new user
   */
  static async createUser(userData: CreateUserRequest): Promise<EnterpriseUser> {
    const organizationId = await this.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    // Check if user already exists in organization
    const { data: existingUser } = await supabase
      .from('enterprise_users')
      .select('id')
      .eq('email', userData.email)
      .eq('organization_id', organizationId)
      .single();

    if (existingUser) {
      throw new Error('User already exists in this organization');
    }

    const { data, error } = await supabase
      .from('enterprise_users')
      .insert({
        ...userData,
        organization_id: organizationId,
        permissions: userData.permissions || this.getDefaultPermissions(userData.healthcare_roles)
      })
      .select(`
        *,
        healthcare_organizations!inner(name, organization_type)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, userData: UpdateUserRequest): Promise<EnterpriseUser> {
    const organizationId = await this.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('enterprise_users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .select(`
        *,
        healthcare_organizations!inner(name, organization_type)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    const organizationId = await this.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { error } = await supabase
      .from('enterprise_users')
      .delete()
      .eq('id', userId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Bulk user operations
   */
  static async bulkUserOperation(operation: BulkUserOperationRequest): Promise<void> {
    const organizationId = await this.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { user_ids, operation: op, role, permissions } = operation;

    let updateData: any = {};

    switch (op) {
      case 'activate':
        // Reactivate users by updating last_login
        updateData = { last_login: new Date().toISOString() };
        break;
      case 'deactivate':
        // Deactivate users by setting last_login to null
        updateData = { last_login: null };
        break;
      case 'role_change':
        if (!role) throw new Error('Role is required for role change operation');
        updateData = { healthcare_roles: [role] };
        break;
      case 'delete':
        // Delete users
        const { error: deleteError } = await supabase
          .from('enterprise_users')
          .delete()
          .in('id', user_ids)
          .eq('organization_id', organizationId);
        
        if (deleteError) {
          throw new Error(`Failed to delete users: ${deleteError.message}`);
        }
        return;
    }

    if (permissions) {
      updateData.permissions = permissions;
    }

    const { error } = await supabase
      .from('enterprise_users')
      .update(updateData)
      .in('id', user_ids)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to perform bulk operation: ${error.message}`);
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(
    filters: {
      user_id?: string;
      action?: string;
      date_from?: Date;
      date_to?: Date;
      healthcare_sensitive?: boolean;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<AuditLogResponse> {
    const organizationId = await this.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        enterprise_users!inner(organization_id)
      `)
      .eq('enterprise_users.organization_id', organizationId);

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from.toISOString());
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to.toISOString());
    }

    if (filters.healthcare_sensitive !== undefined) {
      query = query.eq('healthcare_sensitive', filters.healthcare_sensitive);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return {
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      },
      filters
    };
  }

  /**
   * Get default permissions based on roles
   */
  private static getDefaultPermissions(roles: string[]) {
    const permissions = {
      content: { read: false, write: false, delete: false, publish: false, moderate: false, medical_review: false },
      admin: { user_management: false, role_management: false, system_settings: false, security_monitoring: false, compliance_reporting: false, audit_logs: false },
      analytics: { view_analytics: false, export_data: false, create_reports: false, predictive_analytics: false, custom_dashboards: false },
      plugins: { install_plugins: false, configure_plugins: false, develop_plugins: false, marketplace_access: false },
      workflows: { create_workflows: false, execute_workflows: false, monitor_workflows: false, approve_workflows: false },
      enterprise: { sso_management: false, organization_settings: false, multi_tenant_access: false, fhir_integration: false, microsoft_graph: false }
    };

    // Set permissions based on roles
    if (roles.includes('admin')) {
      // Admin gets all permissions
      Object.keys(permissions).forEach(category => {
        Object.keys(permissions[category as keyof typeof permissions]).forEach(permission => {
          (permissions[category as keyof typeof permissions] as any)[permission] = true;
        });
      });
    } else {
      // Set role-specific permissions
      if (roles.includes('editor')) {
        permissions.content = { read: true, write: true, delete: true, publish: true, moderate: false, medical_review: false };
        permissions.analytics = { view_analytics: true, export_data: false, create_reports: true, predictive_analytics: false, custom_dashboards: true };
      }

      if (roles.includes('viewer')) {
        permissions.content = { read: true, write: false, delete: false, publish: false, moderate: false, medical_review: false };
        permissions.analytics = { view_analytics: true, export_data: false, create_reports: false, predictive_analytics: false, custom_dashboards: false };
      }

      if (roles.includes('healthcare_professional')) {
        permissions.content = { read: true, write: true, delete: false, publish: false, moderate: false, medical_review: true };
        permissions.analytics = { view_analytics: true, export_data: false, create_reports: true, predictive_analytics: false, custom_dashboards: true };
      }
    }

    return permissions;
  }
}

/**
 * Healthcare Credential Service
 */
export class HealthcareCredentialService {
  /**
   * Get user credentials
   */
  static async getUserCredentials(userId: string): Promise<HealthcareCredential[]> {
    const organizationId = await EnterpriseUserService.getCurrentUserOrganization();
    if (!organizationId) {
      throw new Error('User not associated with any organization');
    }

    const { data, error } = await supabase
      .from('healthcare_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add credential
   */
  static async addCredential(credential: Omit<HealthcareCredential, 'id' | 'created_at' | 'updated_at'>): Promise<HealthcareCredential> {
    const { data, error } = await supabase
      .from('healthcare_credentials')
      .insert(credential)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add credential: ${error.message}`);
    }

    return data;
  }

  /**
   * Update credential verification status
   */
  static async updateCredentialStatus(
    credentialId: string, 
    status: 'verified' | 'expired' | 'revoked' | 'invalid',
    verifiedBy?: string
  ): Promise<HealthcareCredential> {
    const updateData: any = {
      verification_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = verifiedBy;
    }

    const { data, error } = await supabase
      .from('healthcare_credentials')
      .update(updateData)
      .eq('id', credentialId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update credential status: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user analytics and metrics
   */
  static async getUserAnalytics(
    organizationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      metrics: string[];
    }
  ): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check admin permissions
      const isAdmin = await this.isAdmin();
      if (!isAdmin) throw new Error('Admin access required');

      const analytics: any = {};

      // User counts
      if (options.metrics.includes('user_counts')) {
        const { data: users, error } = await supabase
          .from('enterprise_users')
          .select('id, last_login, created_at, mfa_enabled')
          .eq('organization_id', organizationId);

        if (error) throw error;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        analytics.metrics = {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.last_login).length,
          inactiveUsers: users.filter(u => !u.last_login).length,
          newUsersToday: users.filter(u => new Date(u.created_at) >= today).length,
          newUsersThisWeek: users.filter(u => new Date(u.created_at) >= weekAgo).length,
          newUsersThisMonth: users.filter(u => new Date(u.created_at) >= monthAgo).length
        };
      }

      // Login activity
      if (options.metrics.includes('login_activity')) {
        const { data: auditLogs, error } = await supabase
          .from('audit_logs')
          .select('created_at')
          .eq('organization_id', organizationId)
          .eq('action', 'login')
          .gte('created_at', options.startDate?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        analytics.metrics = {
          ...analytics.metrics,
          loginActivity: {
            today: auditLogs.filter(log => new Date(log.created_at) >= today).length,
            thisWeek: auditLogs.filter(log => new Date(log.created_at) >= weekAgo).length,
            thisMonth: auditLogs.filter(log => new Date(log.created_at) >= monthAgo).length
          }
        };
      }

      // Role distribution
      if (options.metrics.includes('role_distribution')) {
        const { data: users, error } = await supabase
          .from('enterprise_users')
          .select('healthcare_roles')
          .eq('organization_id', organizationId);

        if (error) throw error;

        const roleCounts = {
          admin: 0,
          editor: 0,
          viewer: 0,
          healthcare_professional: 0,
          content_manager: 0,
          compliance_officer: 0,
          system_administrator: 0
        };

        users.forEach(user => {
          if (user.healthcare_roles) {
            user.healthcare_roles.forEach((role: string) => {
              if (role in roleCounts) {
                roleCounts[role as keyof typeof roleCounts]++;
              }
            });
          }
        });

        analytics.metrics = {
          ...analytics.metrics,
          roleDistribution: roleCounts
        };
      }

      // MFA adoption
      if (options.metrics.includes('mfa_adoption')) {
        const { data: users, error } = await supabase
          .from('enterprise_users')
          .select('mfa_enabled')
          .eq('organization_id', organizationId);

        if (error) throw error;

        const mfaEnabled = users.filter(u => u.mfa_enabled).length;
        const mfaDisabled = users.length - mfaEnabled;
        const percentage = users.length > 0 ? Math.round((mfaEnabled / users.length) * 100) : 0;

        analytics.metrics = {
          ...analytics.metrics,
          mfaAdoption: {
            enabled: mfaEnabled,
            disabled: mfaDisabled,
            percentage
          }
        };
      }

      // Security incidents
      if (options.metrics.includes('security_incidents')) {
        const { data: incidents, error } = await supabase
          .from('security_incidents')
          .select('severity')
          .eq('organization_id', organizationId)
          .gte('created_at', options.startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;

        const incidentCounts = {
          total: incidents.length,
          critical: incidents.filter(i => i.severity === 'critical').length,
          warning: incidents.filter(i => i.severity === 'warning').length,
          info: incidents.filter(i => i.severity === 'info').length
        };

        analytics.metrics = {
          ...analytics.metrics,
          securityIncidents: incidentCounts
        };
      }

      // Compliance status
      if (options.metrics.includes('compliance_status')) {
        const { data: users, error } = await supabase
          .from('enterprise_users')
          .select('compliance_training_status')
          .eq('organization_id', organizationId);

        if (error) throw error;

        let compliant = 0;
        let nonCompliant = 0;
        let pending = 0;

        users.forEach(user => {
          const status = user.compliance_training_status;
          if (status?.status === 'completed' && status?.expires_at > new Date().toISOString()) {
            compliant++;
          } else if (status?.status === 'expired' || status?.status === 'failed') {
            nonCompliant++;
          } else {
            pending++;
          }
        });

        analytics.metrics = {
          ...analytics.metrics,
          complianceStatus: {
            compliant,
            nonCompliant,
            pending
          }
        };
      }

      // Activity timeline
      if (options.metrics.includes('activity_timeline')) {
        const { data: activities, error } = await supabase
          .from('audit_logs')
          .select(`
            id,
            action,
            created_at,
            healthcare_sensitive,
            enterprise_users!inner(name, organization_id)
          `)
          .eq('organization_id', organizationId)
          .gte('created_at', options.startDate?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        analytics.activityTimeline = activities.map(activity => ({
          id: activity.id,
          user: activity.enterprise_users?.name || 'Unknown',
          action: activity.action,
          timestamp: activity.created_at,
          severity: activity.healthcare_sensitive ? 'high' : 'medium',
          healthcare_sensitive: activity.healthcare_sensitive,
          organization: organizationId
        }));
      }

      return analytics;

    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw new Error(`Failed to fetch user analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export user analytics data
   */
  static async exportUserAnalytics(
    organizationId: string,
    options: {
      format: 'csv' | 'json';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<string> {
    try {
      const analytics = await this.getUserAnalytics(organizationId, {
        startDate: options.startDate,
        endDate: options.endDate,
        metrics: [
          'user_counts',
          'login_activity',
          'role_distribution',
          'mfa_adoption',
          'security_incidents',
          'compliance_status',
          'activity_timeline'
        ]
      });

      if (options.format === 'csv') {
        // Convert to CSV format
        const csvRows = [];
        
        // Add metrics
        if (analytics.metrics) {
          csvRows.push('Metric,Value');
          Object.entries(analytics.metrics).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              Object.entries(value).forEach(([subKey, subValue]) => {
                csvRows.push(`${key}.${subKey},${subValue}`);
              });
            } else {
              csvRows.push(`${key},${value}`);
            }
          });
        }

        // Add activity timeline
        if (analytics.activityTimeline) {
          csvRows.push('');
          csvRows.push('Activity Timeline');
          csvRows.push('User,Action,Timestamp,Severity,Healthcare Sensitive');
          analytics.activityTimeline.forEach(activity => {
            csvRows.push([
              activity.user,
              activity.action,
              activity.timestamp,
              activity.severity,
              activity.healthcare_sensitive ? 'Yes' : 'No'
            ].join(','));
          });
        }

        return csvRows.join('\n');
      } else {
        return JSON.stringify(analytics, null, 2);
      }

    } catch (error) {
      console.error('Error exporting user analytics:', error);
      throw new Error(`Failed to export user analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
