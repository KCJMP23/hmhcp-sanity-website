// Enterprise Organization Manager
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import { createClient } from '@supabase/supabase-js';
import { PluginDefinition, PluginInstallation } from '@/types/plugins/marketplace';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Organization {
  id: string;
  name: string;
  description: string;
  domain: string;
  settings: OrganizationSettings;
  subscription: OrganizationSubscription;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface OrganizationSettings {
  max_plugins: number;
  max_users: number;
  allowed_plugin_categories: string[];
  security_policies: string[];
  compliance_requirements: string[];
  data_retention_days: number;
  audit_logging: boolean;
  encryption_required: boolean;
  multi_tenant: boolean;
  custom_branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

export interface OrganizationSubscription {
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  start_date: string;
  end_date: string;
  features: string[];
  limits: {
    plugins: number;
    users: number;
    storage: number;
    api_calls: number;
  };
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'developer' | 'viewer';
  permissions: string[];
  invited_by: string;
  joined_at: string;
  last_active: string;
}

export interface OrganizationPlugin {
  id: string;
  organization_id: string;
  plugin_id: string;
  status: 'approved' | 'pending' | 'rejected' | 'deprecated';
  approved_by?: string;
  approved_at?: string;
  installed_at?: string;
  configuration: any;
  usage_stats: {
    installations: number;
    active_users: number;
    last_used: string;
  };
}

export interface OrganizationMetrics {
  total_plugins: number;
  active_plugins: number;
  total_users: number;
  active_users: number;
  total_installations: number;
  storage_used: number;
  api_calls_this_month: number;
  compliance_score: number;
}

export class EnterpriseOrganizationManager {
  /**
   * Create organization
   */
  async createOrganization(
    organizationData: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Organization> {
    try {
      const organization: Organization = {
        id: this.generateOrganizationId(),
        ...organizationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('enterprise_organizations')
        .insert({
          id: organization.id,
          name: organization.name,
          description: organization.description,
          domain: organization.domain,
          settings: organization.settings,
          subscription: organization.subscription,
          created_at: organization.created_at,
          updated_at: organization.updated_at,
          created_by: organization.created_by
        });

      if (error) {
        throw new Error(error.message);
      }

      return organization;

    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }

  /**
   * Get organization
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to get organization:', error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    updates: Partial<Omit<Organization, 'id' | 'created_at' | 'created_by'>>
  ): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to update organization:', error);
      throw error;
    }
  }

  /**
   * Add user to organization
   */
  async addUserToOrganization(
    organizationId: string,
    userId: string,
    role: OrganizationUser['role'],
    permissions: string[],
    invitedBy: string
  ): Promise<OrganizationUser> {
    try {
      const organizationUser: OrganizationUser = {
        id: this.generateUserOrganizationId(),
        organization_id: organizationId,
        user_id: userId,
        role,
        permissions,
        invited_by: invitedBy,
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };

      const { error } = await supabase
        .from('enterprise_organization_users')
        .insert({
          id: organizationUser.id,
          organization_id: organizationId,
          user_id: userId,
          role,
          permissions,
          invited_by: invitedBy,
          joined_at: organizationUser.joined_at,
          last_active: organizationUser.last_active
        });

      if (error) {
        throw new Error(error.message);
      }

      return organizationUser;

    } catch (error) {
      console.error('Failed to add user to organization:', error);
      throw error;
    }
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('enterprise_organization_users')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Failed to remove user from organization:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(
    organizationId: string,
    userId: string,
    role: OrganizationUser['role'],
    permissions: string[]
  ): Promise<OrganizationUser> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organization_users')
        .update({
          role,
          permissions,
          last_active: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(organizationId: string): Promise<OrganizationUser[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organization_users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get organization users:', error);
      throw error;
    }
  }

  /**
   * Approve plugin for organization
   */
  async approvePluginForOrganization(
    organizationId: string,
    pluginId: string,
    approvedBy: string,
    configuration: any = {}
  ): Promise<OrganizationPlugin> {
    try {
      const organizationPlugin: OrganizationPlugin = {
        id: this.generateOrganizationPluginId(),
        organization_id: organizationId,
        plugin_id: pluginId,
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        configuration,
        usage_stats: {
          installations: 0,
          active_users: 0,
          last_used: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('enterprise_organization_plugins')
        .insert({
          id: organizationPlugin.id,
          organization_id: organizationId,
          plugin_id: pluginId,
          status: 'approved',
          approved_by: approvedBy,
          approved_at: organizationPlugin.approved_at,
          configuration,
          usage_stats: organizationPlugin.usage_stats
        });

      if (error) {
        throw new Error(error.message);
      }

      return organizationPlugin;

    } catch (error) {
      console.error('Failed to approve plugin for organization:', error);
      throw error;
    }
  }

  /**
   * Reject plugin for organization
   */
  async rejectPluginForOrganization(
    organizationId: string,
    pluginId: string,
    rejectedBy: string,
    reason?: string
  ): Promise<OrganizationPlugin> {
    try {
      const organizationPlugin: OrganizationPlugin = {
        id: this.generateOrganizationPluginId(),
        organization_id: organizationId,
        plugin_id: pluginId,
        status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
        configuration: {},
        usage_stats: {
          installations: 0,
          active_users: 0,
          last_used: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('enterprise_organization_plugins')
        .insert({
          id: organizationPlugin.id,
          organization_id: organizationId,
          plugin_id: pluginId,
          status: 'rejected',
          approved_by: rejectedBy,
          approved_at: organizationPlugin.approved_at,
          configuration: {},
          usage_stats: organizationPlugin.usage_stats
        });

      if (error) {
        throw new Error(error.message);
      }

      return organizationPlugin;

    } catch (error) {
      console.error('Failed to reject plugin for organization:', error);
      throw error;
    }
  }

  /**
   * Get organization plugins
   */
  async getOrganizationPlugins(
    organizationId: string,
    status?: OrganizationPlugin['status']
  ): Promise<OrganizationPlugin[]> {
    try {
      let query = supabase
        .from('enterprise_organization_plugins')
        .select('*')
        .eq('organization_id', organizationId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('approved_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get organization plugins:', error);
      throw error;
    }
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfiguration(
    organizationId: string,
    pluginId: string,
    configuration: any
  ): Promise<OrganizationPlugin> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organization_plugins')
        .update({
          configuration,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('plugin_id', pluginId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to update plugin configuration:', error);
      throw error;
    }
  }

  /**
   * Get organization metrics
   */
  async getOrganizationMetrics(organizationId: string): Promise<OrganizationMetrics> {
    try {
      // Get plugin metrics
      const { data: plugins } = await supabase
        .from('enterprise_organization_plugins')
        .select('status, usage_stats')
        .eq('organization_id', organizationId);

      const totalPlugins = plugins?.length || 0;
      const activePlugins = plugins?.filter(p => p.status === 'approved').length || 0;

      // Get user metrics
      const { data: users } = await supabase
        .from('enterprise_organization_users')
        .select('last_active')
        .eq('organization_id', organizationId);

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => {
        const lastActive = new Date(u.last_active);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastActive > thirtyDaysAgo;
      }).length || 0;

      // Get installation metrics
      const { data: installations } = await supabase
        .from('plugin_installations')
        .select('id')
        .eq('organization_id', organizationId);

      const totalInstallations = installations?.length || 0;

      // Calculate storage used (simplified)
      const storageUsed = totalPlugins * 10; // 10MB per plugin estimate

      // Calculate API calls this month (simplified)
      const apiCallsThisMonth = totalInstallations * 100; // 100 calls per installation estimate

      // Calculate compliance score (simplified)
      const complianceScore = activePlugins > 0 ? (activePlugins / totalPlugins) * 100 : 0;

      return {
        total_plugins: totalPlugins,
        active_plugins: activePlugins,
        total_users: totalUsers,
        active_users: activeUsers,
        total_installations: totalInstallations,
        storage_used: storageUsed,
        api_calls_this_month: apiCallsThisMonth,
        compliance_score: complianceScore
      };

    } catch (error) {
      console.error('Failed to get organization metrics:', error);
      throw error;
    }
  }

  /**
   * Check user permissions
   */
  async checkUserPermissions(
    organizationId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organization_users')
        .select('permissions')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw new Error(error.message);
      }

      return data.permissions.includes(permission);

    } catch (error) {
      console.error('Failed to check user permissions:', error);
      return false;
    }
  }

  /**
   * Get user role
   */
  async getUserRole(
    organizationId: string,
    userId: string
  ): Promise<OrganizationUser['role'] | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organization_users')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return data.role;

    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  }

  /**
   * Update organization subscription
   */
  async updateOrganizationSubscription(
    organizationId: string,
    subscription: Partial<OrganizationSubscription>
  ): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('enterprise_organizations')
        .update({
          subscription: subscription,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Failed to update organization subscription:', error);
      throw error;
    }
  }

  /**
   * Generate organization ID
   */
  private generateOrganizationId(): string {
    return `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate user organization ID
   */
  private generateUserOrganizationId(): string {
    return `user_org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate organization plugin ID
   */
  private generateOrganizationPluginId(): string {
    return `org_plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
