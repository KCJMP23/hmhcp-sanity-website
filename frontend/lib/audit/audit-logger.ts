// Audit Logging Service
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  organization_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance_required: boolean;
}

export class AuditLogger {
  private supabase = createClient();

  /**
   * Log a publication access event
   */
  async logPublicationAccess(
    userId: string,
    organizationId: string,
    publicationId: string,
    action: 'view' | 'edit' | 'delete' | 'create' | 'export',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action,
      resource_type: 'publication',
      resource_id: publicationId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: this.getSeverityForAction(action),
      compliance_required: true
    };

    await this.logEntry(entry);
  }

  /**
   * Log an author access event
   */
  async logAuthorAccess(
    userId: string,
    organizationId: string,
    authorId: string,
    action: 'view' | 'edit' | 'delete' | 'create',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action,
      resource_type: 'author',
      resource_id: authorId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: this.getSeverityForAction(action),
      compliance_required: true
    };

    await this.logEntry(entry);
  }

  /**
   * Log a research topic access event
   */
  async logResearchTopicAccess(
    userId: string,
    organizationId: string,
    topicId: string,
    action: 'view' | 'edit' | 'delete' | 'create',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action,
      resource_type: 'research_topic',
      resource_id: topicId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: this.getSeverityForAction(action),
      compliance_required: true
    };

    await this.logEntry(entry);
  }

  /**
   * Log an analytics access event
   */
  async logAnalyticsAccess(
    userId: string,
    organizationId: string,
    resourceId: string,
    action: 'view' | 'export' | 'generate_report',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action,
      resource_type: 'analytics',
      resource_id: resourceId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: this.getSeverityForAction(action),
      compliance_required: true
    };

    await this.logEntry(entry);
  }

  /**
   * Log a bulk import event
   */
  async logBulkImport(
    userId: string,
    organizationId: string,
    importType: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action: 'bulk_import',
      resource_type: 'publication',
      resource_id: `bulk_import_${Date.now()}`,
      details: {
        import_type: importType,
        ...details
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: 'high',
      compliance_required: true
    };

    await this.logEntry(entry);
  }

  /**
   * Log a research integration event
   */
  async logResearchIntegration(
    userId: string,
    organizationId: string,
    integrationType: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action: 'research_integration',
      resource_type: 'external_api',
      resource_id: integrationType,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: 'medium',
      compliance_required: false
    };

    await this.logEntry(entry);
  }

  /**
   * Log a compliance check event
   */
  async logComplianceCheck(
    userId: string,
    organizationId: string,
    checkType: 'hipaa' | 'fda',
    resourceId: string,
    result: 'pass' | 'fail' | 'warning',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action: 'compliance_check',
      resource_type: checkType,
      resource_id: resourceId,
      details: {
        result,
        ...details
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: result === 'fail' ? 'high' : 'medium',
      compliance_required: true
    };

    await this.logEntry(entry);
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    userId: string,
    organizationId: string,
    eventType: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      user_id: userId,
      organization_id: organizationId,
      action: 'security_event',
      resource_type: 'security',
      resource_id: eventType,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      compliance_required: true
    };

    await this.logEntry(entry);
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('organization_id', organizationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch user audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get compliance audit logs
   */
  async getComplianceAuditLogs(
    organizationId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    let query = this.supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('compliance_required', true)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch compliance audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get audit logs by severity
   */
  async getAuditLogsBySeverity(
    organizationId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('severity', severity)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit logs by severity: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    complianceEvents: number;
    securityEvents: number;
    topUsers: Array<{ user_id: string; event_count: number }>;
    topResources: Array<{ resource_type: string; resource_id: string; event_count: number }>;
  }> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate);

    if (error) {
      throw new Error(`Failed to generate audit report: ${error.message}`);
    }

    const logs = data || [];
    const totalEvents = logs.length;

    // Count events by type
    const eventsByType: Record<string, number> = {};
    logs.forEach(log => {
      eventsByType[log.action] = (eventsByType[log.action] || 0) + 1;
    });

    // Count events by severity
    const eventsBySeverity: Record<string, number> = {};
    logs.forEach(log => {
      eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
    });

    // Count compliance events
    const complianceEvents = logs.filter(log => log.compliance_required).length;

    // Count security events
    const securityEvents = logs.filter(log => log.action === 'security_event').length;

    // Top users
    const userCounts: Record<string, number> = {};
    logs.forEach(log => {
      userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
    });
    const topUsers = Object.entries(userCounts)
      .map(([user_id, event_count]) => ({ user_id, event_count }))
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, 10);

    // Top resources
    const resourceCounts: Record<string, number> = {};
    logs.forEach(log => {
      const key = `${log.resource_type}:${log.resource_id}`;
      resourceCounts[key] = (resourceCounts[key] || 0) + 1;
    });
    const topResources = Object.entries(resourceCounts)
      .map(([key, event_count]) => {
        const [resource_type, resource_id] = key.split(':');
        return { resource_type, resource_id, event_count };
      })
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, 10);

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      complianceEvents,
      securityEvents,
      topUsers,
      topResources
    };
  }

  /**
   * Log an audit entry to the database
   */
  private async logEntry(entry: AuditLogEntry): Promise<void> {
    const { error } = await this.supabase
      .from('audit_logs')
      .insert(entry);

    if (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }

  /**
   * Get severity level for an action
   */
  private getSeverityForAction(action: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (action) {
      case 'view':
        return 'low';
      case 'edit':
      case 'create':
        return 'medium';
      case 'delete':
      case 'export':
        return 'high';
      case 'security_event':
        return 'critical';
      default:
        return 'medium';
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();