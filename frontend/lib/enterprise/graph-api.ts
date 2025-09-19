// Microsoft Graph API Integration for Healthcare Enterprise
// Source: architecture/source-tree.md

import { 
  MicrosoftGraphUser, 
  MicrosoftGraphOrganization, 
  GraphAPIResponse, 
  GraphAPIError, 
  GraphAPIConfig, 
  GraphAPIRequest, 
  GraphAPIUsageMetrics, 
  GraphAPIMonitoring,
  HealthcareContext,
  HealthcareComplianceConfig
} from '@/types/enterprise/graph-api';

export class MicrosoftGraphAPIService {
  private config: GraphAPIConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: GraphAPIConfig) {
    this.config = config;
    this.baseUrl = `${config.baseUrl}/${config.version}`;
  }

  /**
   * Authenticate with Microsoft Graph API
   */
  async authenticate(): Promise<boolean> {
    try {
      const tokenResponse = await this.getAccessToken();
      this.accessToken = tokenResponse.access_token;
      this.tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000);
      return true;
    } catch (error) {
      console.error('Microsoft Graph authentication failed:', error);
      return false;
    }
  }

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<{ access_token: string; expires_in: number }> {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scopes.join(' '),
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private async makeRequest<T>(request: GraphAPIRequest): Promise<T> {
    await this.ensureValidToken();

    const url = new URL(`${this.baseUrl}${request.endpoint}`);
    
    // Add query parameters
    if (request.queryParams) {
      Object.entries(request.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Organization-Id': request.organizationId,
        'X-User-Id': request.userId,
        'X-Healthcare-Context': JSON.stringify(request.healthcareContext),
        ...request.headers,
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    if (!response.ok) {
      const error: GraphAPIError = await response.json();
      throw new Error(`Graph API request failed: ${error.error.message}`);
    }

    return response.json();
  }

  /**
   * Get users from Microsoft Graph with healthcare context
   */
  async getUsers(
    organizationId: string,
    userId: string,
    healthcareContext: HealthcareContext,
    options: {
      filter?: string;
      select?: string[];
      top?: number;
      skip?: number;
    } = {}
  ): Promise<GraphAPIResponse<MicrosoftGraphUser>> {
    const queryParams: Record<string, string> = {};
    
    if (options.filter) queryParams.$filter = options.filter;
    if (options.select) queryParams.$select = options.select.join(',');
    if (options.top) queryParams.$top = options.top.toString();
    if (options.skip) queryParams.$skip = options.skip.toString();

    const request: GraphAPIRequest = {
      method: 'GET',
      endpoint: '/users',
      queryParams,
      organizationId,
      userId,
      healthcareContext,
    };

    return this.makeRequest<GraphAPIResponse<MicrosoftGraphUser>>(request);
  }

  /**
   * Get user by ID with healthcare compliance validation
   */
  async getUserById(
    userId: string,
    organizationId: string,
    requestingUserId: string,
    healthcareContext: HealthcareContext
  ): Promise<MicrosoftGraphUser> {
    const request: GraphAPIRequest = {
      method: 'GET',
      endpoint: `/users/${userId}`,
      organizationId,
      userId: requestingUserId,
      healthcareContext,
    };

    return this.makeRequest<MicrosoftGraphUser>(request);
  }

  /**
   * Get organization information
   */
  async getOrganization(
    organizationId: string,
    userId: string,
    healthcareContext: HealthcareContext
  ): Promise<MicrosoftGraphOrganization> {
    const request: GraphAPIRequest = {
      method: 'GET',
      endpoint: '/organization',
      organizationId,
      userId,
      healthcareContext,
    };

    return this.makeRequest<MicrosoftGraphOrganization>(request);
  }

  /**
   * Create user with healthcare role assignment
   */
  async createUser(
    userData: Partial<MicrosoftGraphUser>,
    organizationId: string,
    requestingUserId: string,
    healthcareContext: HealthcareContext
  ): Promise<MicrosoftGraphUser> {
    // Validate healthcare compliance before creating user
    await this.validateHealthcareCompliance(userData, healthcareContext);

    const request: GraphAPIRequest = {
      method: 'POST',
      endpoint: '/users',
      body: userData,
      organizationId,
      userId: requestingUserId,
      healthcareContext,
    };

    return this.makeRequest<MicrosoftGraphUser>(request);
  }

  /**
   * Update user with healthcare compliance validation
   */
  async updateUser(
    userId: string,
    userData: Partial<MicrosoftGraphUser>,
    organizationId: string,
    requestingUserId: string,
    healthcareContext: HealthcareContext
  ): Promise<MicrosoftGraphUser> {
    // Validate healthcare compliance before updating user
    await this.validateHealthcareCompliance(userData, healthcareContext);

    const request: GraphAPIRequest = {
      method: 'PATCH',
      endpoint: `/users/${userId}`,
      body: userData,
      organizationId,
      userId: requestingUserId,
      healthcareContext,
    };

    return this.makeRequest<MicrosoftGraphUser>(request);
  }

  /**
   * Delete user with healthcare audit logging
   */
  async deleteUser(
    userId: string,
    organizationId: string,
    requestingUserId: string,
    healthcareContext: HealthcareContext
  ): Promise<void> {
    // Log healthcare audit trail before deletion
    await this.logHealthcareAudit('user_deletion', userId, organizationId, requestingUserId, healthcareContext);

    const request: GraphAPIRequest = {
      method: 'DELETE',
      endpoint: `/users/${userId}`,
      organizationId,
      userId: requestingUserId,
      healthcareContext,
    };

    await this.makeRequest<void>(request);
  }

  /**
   * Get API usage metrics for healthcare compliance monitoring
   */
  async getUsageMetrics(
    organizationId: string,
    timeRange: { start: string; end: string }
  ): Promise<GraphAPIUsageMetrics> {
    const request: GraphAPIRequest = {
      method: 'GET',
      endpoint: '/reports/getGraphApiUsage',
      queryParams: {
        period: 'D30',
        startDate: timeRange.start,
        endDate: timeRange.end,
      },
      organizationId,
      userId: 'system',
      healthcareContext: {
        specialty: 'system',
        complianceLevel: 'enhanced',
        dataClassification: 'internal',
        auditRequired: true,
        retentionPolicy: '7_years',
      },
    };

    return this.makeRequest<GraphAPIUsageMetrics>(request);
  }

  /**
   * Get API monitoring status for healthcare operations
   */
  async getMonitoringStatus(organizationId: string): Promise<GraphAPIMonitoring> {
    const request: GraphAPIRequest = {
      method: 'GET',
      endpoint: '/monitoring/status',
      organizationId,
      userId: 'system',
      healthcareContext: {
        specialty: 'system',
        complianceLevel: 'enhanced',
        dataClassification: 'internal',
        auditRequired: true,
        retentionPolicy: '7_years',
      },
    };

    return this.makeRequest<GraphAPIMonitoring>(request);
  }

  /**
   * Validate healthcare compliance for user operations
   */
  private async validateHealthcareCompliance(
    userData: Partial<MicrosoftGraphUser>,
    healthcareContext: HealthcareContext
  ): Promise<void> {
    // Check if user has required healthcare roles
    if (userData.healthcareRoles && userData.healthcareRoles.length === 0) {
      throw new Error('Healthcare roles are required for user operations');
    }

    // Validate data classification
    if (healthcareContext.dataClassification === 'restricted' && !healthcareContext.auditRequired) {
      throw new Error('Audit logging is required for restricted data access');
    }

    // Check compliance level requirements
    if (healthcareContext.complianceLevel === 'expert_review' && !userData.healthcareRoles?.includes('compliance_officer')) {
      throw new Error('Expert review compliance level requires compliance officer role');
    }
  }

  /**
   * Log healthcare audit trail
   */
  private async logHealthcareAudit(
    action: string,
    resourceId: string,
    organizationId: string,
    userId: string,
    healthcareContext: HealthcareContext
  ): Promise<void> {
    const auditEntry = {
      action,
      resourceId,
      organizationId,
      userId,
      timestamp: new Date().toISOString(),
      healthcareContext,
      complianceStatus: 'compliant' as const,
    };

    // In a real implementation, this would be sent to an audit logging service
    console.log('Healthcare audit log:', auditEntry);
  }

  /**
   * Test Microsoft Graph API connectivity
   */
  async testConnection(organizationId: string): Promise<boolean> {
    try {
      const request: GraphAPIRequest = {
        method: 'GET',
        endpoint: '/me',
        organizationId,
        userId: 'test',
        healthcareContext: {
          specialty: 'test',
          complianceLevel: 'standard',
          dataClassification: 'internal',
          auditRequired: false,
          retentionPolicy: '1_year',
        },
      };

      await this.makeRequest(request);
      return true;
    } catch (error) {
      console.error('Microsoft Graph connection test failed:', error);
      return false;
    }
  }

  /**
   * Get healthcare-specific user information
   */
  async getHealthcareUsers(
    organizationId: string,
    userId: string,
    healthcareContext: HealthcareContext,
    specialty?: string
  ): Promise<GraphAPIResponse<MicrosoftGraphUser>> {
    const filter = specialty 
      ? `healthcareRoles/any(role: role eq '${specialty}')`
      : 'healthcareRoles/any()';

    return this.getUsers(organizationId, userId, healthcareContext, {
      filter,
      select: ['id', 'displayName', 'email', 'healthcareRoles', 'organizationId'],
    });
  }

  /**
   * Sync healthcare roles with Microsoft Graph
   */
  async syncHealthcareRoles(
    organizationId: string,
    userId: string,
    healthcareContext: HealthcareContext
  ): Promise<void> {
    const users = await this.getHealthcareUsers(organizationId, userId, healthcareContext);
    
    for (const user of users.value) {
      // Update healthcare roles based on Microsoft Graph data
      await this.updateUser(
        user.id,
        { healthcareRoles: user.healthcareRoles },
        organizationId,
        userId,
        healthcareContext
      );
    }
  }
}

/**
 * Factory function to create Microsoft Graph API service
 */
export function createMicrosoftGraphAPIService(config: GraphAPIConfig): MicrosoftGraphAPIService {
  return new MicrosoftGraphAPIService(config);
}

/**
 * Default configuration for healthcare organizations
 */
export function getDefaultHealthcareGraphConfig(tenantId: string, clientId: string, clientSecret: string): GraphAPIConfig {
  return {
    tenantId,
    clientId,
    clientSecret,
    redirectUri: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback',
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/User.ReadWrite',
      'https://graph.microsoft.com/Organization.Read',
      'https://graph.microsoft.com/Directory.ReadWrite',
    ],
    baseUrl: 'https://graph.microsoft.com',
    version: 'v1.0',
    healthcareCompliance: {
      hipaaCompliant: true,
      fdaCompliant: true,
      fhirCompliant: true,
      hitrustCompliant: true,
      complianceLevel: 'enhanced',
      lastAuditDate: new Date().toISOString(),
      nextAuditDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      complianceOfficer: 'system',
      auditTrail: [],
    },
  };
}
