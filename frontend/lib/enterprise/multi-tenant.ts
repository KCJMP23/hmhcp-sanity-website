/**
 * Multi-Tenant Architecture Service
 * Healthcare-compliant multi-tenant support for enterprise organizations
 */

import { Tenant, TenantMetrics } from '@/types/enterprise/multi-tenant';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export class MultiTenantService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'lastActivity'>): Promise<Tenant> {
    try {
      const id = crypto.randomUUID();
      const subdomain = await this.generateUniqueSubdomain(tenantData.name);

      const tenant: Tenant = {
        ...tenantData,
        id,
        subdomain,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('tenants')
        .insert([tenant])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create tenant:', error);
      throw new Error('Tenant creation failed');
    }
  }

  async getTenant(identifier: string): Promise<Tenant | null> {
    try {
      const { data, error } = await this.supabase
        .from('tenants')
        .select('*')
        .or(`id.eq.${identifier},subdomain.eq.${identifier}`)
        .eq('status', 'active')
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Failed to get tenant:', error);
      return null;
    }
  }

  async getTenantMetrics(tenantId: string): Promise<TenantMetrics> {
    try {
      const { data: userMetrics } = await this.supabase
        .from('tenant_user_metrics')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      const { data: storageMetrics } = await this.supabase
        .from('tenant_storage_metrics')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      const complianceScore = await this.calculateComplianceScore(tenantId);

      return {
        totalUsers: userMetrics?.total_users || 0,
        activeUsers: userMetrics?.active_users || 0,
        totalStorage: storageMetrics?.total_storage || 0,
        usedStorage: storageMetrics?.used_storage || 0,
        apiRequests: 0,
        integrations: 0,
        complianceScore,
        healthcareMetrics: {
          clinicalUsers: 0,
          administrativeUsers: 0,
          patientRecords: 0,
          clinicalData: 0,
          complianceViolations: 0,
          auditEvents: 0
        }
      };
    } catch (error) {
      console.error('Failed to get tenant metrics:', error);
      throw new Error('Failed to retrieve tenant metrics');
    }
  }

  private async generateUniqueSubdomain(name: string): Promise<string> {
    const baseSubdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let subdomain = baseSubdomain;
    let counter = 1;

    while (true) {
      const { data } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .single();

      if (!data) break;
      subdomain = `${baseSubdomain}-${counter}`;
      counter++;
    }

    return subdomain;
  }

  private async calculateComplianceScore(tenantId: string): Promise<number> {
    // Simplified compliance score calculation
    return 85; // Placeholder
  }
}

export default MultiTenantService;