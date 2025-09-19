/**
 * Microsoft Graph API Client for Plugin Development
 * 
 * Provides Microsoft Graph-compatible API integration for healthcare plugins
 * with enterprise authentication and data protection.
 */

import { HealthcareComplianceLevel } from '../types/healthcare-types';

export interface GraphClientConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  complianceLevel: HealthcareComplianceLevel;
  auditLogging: boolean;
}

export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  healthcareRoles?: string[];
  complianceStatus?: ComplianceStatus;
}

export interface GraphGroup {
  id: string;
  displayName: string;
  description?: string;
  groupTypes: string[];
  securityEnabled: boolean;
  healthcareSpecializations?: string[];
  complianceLevel?: HealthcareComplianceLevel;
}

export interface ComplianceStatus {
  hipaaCompliant: boolean;
  fdaCompliant: boolean;
  fhirCompliant: boolean;
  lastAuditDate: Date;
  nextAuditDate: Date;
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  discoveredDate: Date;
  resolvedDate?: Date;
}

export interface GraphApiResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
}

export class MicrosoftGraphClient {
  private config: GraphClientConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(config: GraphClientConfig) {
    this.config = config;
  }

  /**
   * Initialize authentication with Microsoft Graph
   */
  async authenticate(): Promise<boolean> {
    try {
      const tokenResponse = await this.getAccessToken();
      this.accessToken = tokenResponse.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokenResponse.expires_in * 1000));
      return true;
    } catch (error) {
      console.error('Graph authentication failed:', error);
      return false;
    }
  }

  /**
   * Get healthcare users from Microsoft Graph
   */
  async getHealthcareUsers(): Promise<GraphUser[]> {
    await this.ensureAuthenticated();
    
    const response = await this.makeRequest<GraphApiResponse<GraphUser>>(
      '/users?$select=id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation&$filter=jobTitle ne null'
    );

    // Enhance users with healthcare-specific data
    const healthcareUsers = await Promise.all(
      response.value.map(async (user) => {
        const healthcareData = await this.getUserHealthcareData(user.id);
        return {
          ...user,
          healthcareRoles: healthcareData.roles,
          complianceStatus: healthcareData.complianceStatus
        };
      })
    );

    return healthcareUsers;
  }

  /**
   * Get healthcare groups from Microsoft Graph
   */
  async getHealthcareGroups(): Promise<GraphGroup[]> {
    await this.ensureAuthenticated();
    
    const response = await this.makeRequest<GraphApiResponse<GraphGroup>>(
      '/groups?$select=id,displayName,description,groupTypes,securityEnabled'
    );

    // Enhance groups with healthcare-specific data
    const healthcareGroups = await Promise.all(
      response.value.map(async (group) => {
        const healthcareData = await this.getGroupHealthcareData(group.id);
        return {
          ...group,
          healthcareSpecializations: healthcareData.specializations,
          complianceLevel: healthcareData.complianceLevel
        };
      })
    );

    return healthcareGroups;
  }

  /**
   * Get user's healthcare-specific data
   */
  async getUserHealthcareData(userId: string): Promise<{
    roles: string[];
    complianceStatus: ComplianceStatus;
  }> {
    try {
      // Get user's group memberships to determine healthcare roles
      const groupsResponse = await this.makeRequest<GraphApiResponse<{ id: string; displayName: string }>>(
        `/users/${userId}/memberOf?$select=id,displayName`
      );

      const roles = this.extractHealthcareRoles(groupsResponse.value);
      const complianceStatus = await this.getUserComplianceStatus(userId);

      return { roles, complianceStatus };
    } catch (error) {
      console.error('Failed to get user healthcare data:', error);
      return {
        roles: [],
        complianceStatus: this.getDefaultComplianceStatus()
      };
    }
  }

  /**
   * Get group's healthcare-specific data
   */
  async getGroupHealthcareData(groupId: string): Promise<{
    specializations: string[];
    complianceLevel: HealthcareComplianceLevel;
  }> {
    try {
      // Get group details and extensions
      const groupResponse = await this.makeRequest<GraphGroup>(
        `/groups/${groupId}?$select=id,displayName,description`
      );

      const specializations = this.extractHealthcareSpecializations(groupResponse);
      const complianceLevel = this.determineComplianceLevel(groupResponse);

      return { specializations, complianceLevel };
    } catch (error) {
      console.error('Failed to get group healthcare data:', error);
      return {
        specializations: [],
        complianceLevel: 'standard'
      };
    }
  }

  /**
   * Create healthcare application in Microsoft Graph
   */
  async createHealthcareApplication(appData: {
    displayName: string;
    description: string;
    healthcareCompliance: HealthcareComplianceLevel;
    requiredPermissions: string[];
  }): Promise<{ appId: string; objectId: string }> {
    await this.ensureAuthenticated();

    const application = {
      displayName: appData.displayName,
      description: appData.description,
      signInAudience: 'AzureADMyOrg',
      requiredResourceAccess: this.buildRequiredResourceAccess(appData.requiredPermissions),
      web: {
        redirectUris: [this.config.redirectUri],
        implicitGrantSettings: {
          enableIdTokenIssuance: false,
          enableAccessTokenIssuance: false
        }
      },
      tags: ['healthcare', 'compliance', appData.healthcareCompliance]
    };

    const response = await this.makeRequest<{ appId: string; id: string }>(
      '/applications',
      'POST',
      application
    );

    return {
      appId: response.appId,
      objectId: response.id
    };
  }

  /**
   * Get security insights for healthcare compliance
   */
  async getSecurityInsights(): Promise<{
    riskUsers: GraphUser[];
    complianceViolations: ComplianceViolation[];
    securityRecommendations: string[];
  }> {
    await this.ensureAuthenticated();

    try {
      // Get risky users
      const riskUsersResponse = await this.makeRequest<GraphApiResponse<GraphUser>>(
        '/identityProtection/riskyUsers'
      );

      // Get compliance violations
      const violations = await this.getComplianceViolations();

      // Get security recommendations
      const recommendations = await this.getSecurityRecommendations();

      return {
        riskUsers: riskUsersResponse.value,
        complianceViolations: violations,
        securityRecommendations: recommendations
      };
    } catch (error) {
      console.error('Failed to get security insights:', error);
      return {
        riskUsers: [],
        complianceViolations: [],
        securityRecommendations: []
      };
    }
  }

  /**
   * Ensure client is authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
  }

  /**
   * Make authenticated request to Microsoft Graph
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'ConsistencyLevel': 'eventual'
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Graph API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<{ access_token: string; expires_in: number }> {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scopes.join(' '),
      grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Extract healthcare roles from group memberships
   */
  private extractHealthcareRoles(groups: { id: string; displayName: string }[]): string[] {
    const healthcareRoles: string[] = [];
    
    groups.forEach(group => {
      const name = group.displayName.toLowerCase();
      if (name.includes('physician') || name.includes('doctor')) {
        healthcareRoles.push('physician');
      } else if (name.includes('nurse')) {
        healthcareRoles.push('nurse');
      } else if (name.includes('administrator') || name.includes('admin')) {
        healthcareRoles.push('administrator');
      } else if (name.includes('researcher')) {
        healthcareRoles.push('researcher');
      } else if (name.includes('compliance')) {
        healthcareRoles.push('compliance_officer');
      }
    });

    return [...new Set(healthcareRoles)];
  }

  /**
   * Extract healthcare specializations from group data
   */
  private extractHealthcareSpecializations(group: GraphGroup): string[] {
    const specializations: string[] = [];
    const description = group.description?.toLowerCase() || '';
    const displayName = group.displayName.toLowerCase();

    const specializationKeywords = [
      'cardiology', 'oncology', 'neurology', 'pediatrics', 'surgery',
      'emergency', 'radiology', 'pathology', 'psychiatry', 'dermatology'
    ];

    specializationKeywords.forEach(specialization => {
      if (description.includes(specialization) || displayName.includes(specialization)) {
        specializations.push(specialization);
      }
    });

    return specializations;
  }

  /**
   * Determine compliance level based on group data
   */
  private determineComplianceLevel(group: GraphGroup): HealthcareComplianceLevel {
    const description = group.description?.toLowerCase() || '';
    const displayName = group.displayName.toLowerCase();

    if (description.includes('enterprise') || displayName.includes('enterprise')) {
      return 'enterprise';
    } else if (description.includes('expert') || displayName.includes('expert')) {
      return 'expert_review';
    } else if (description.includes('enhanced') || displayName.includes('enhanced')) {
      return 'enhanced';
    } else {
      return 'standard';
    }
  }

  /**
   * Get user compliance status
   */
  private async getUserComplianceStatus(userId: string): Promise<ComplianceStatus> {
    // In a real implementation, this would query compliance systems
    return this.getDefaultComplianceStatus();
  }

  /**
   * Get default compliance status
   */
  private getDefaultComplianceStatus(): ComplianceStatus {
    return {
      hipaaCompliant: true,
      fdaCompliant: false,
      fhirCompliant: true,
      lastAuditDate: new Date(),
      nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      violations: []
    };
  }

  /**
   * Build required resource access for application
   */
  private buildRequiredResourceAccess(permissions: string[]): any[] {
    const resourceAccess = permissions.map(permission => ({
      id: this.getPermissionId(permission),
      type: 'Scope'
    }));

    return [{
      resourceAppId: '00000003-0000-0000-c000-000000000000', // Microsoft Graph
      resourceAccess
    }];
  }

  /**
   * Get permission ID for Microsoft Graph
   */
  private getPermissionId(permission: string): string {
    const permissionMap: Record<string, string> = {
      'User.Read': 'e1fe6dd8-ba31-4d61-89e7-88639da4683d',
      'User.Read.All': 'df021288-bdef-4463-88db-98f22de89214',
      'Group.Read.All': '5f8c59db-677d-491c-a38c-5a0b5d8c751b',
      'Application.ReadWrite.All': '1bfefb4e-e0b5-418b-a88f-73c46d2cc8e9'
    };

    return permissionMap[permission] || permission;
  }

  /**
   * Get compliance violations
   */
  private async getComplianceViolations(): Promise<ComplianceViolation[]> {
    // In a real implementation, this would query compliance monitoring systems
    return [];
  }

  /**
   * Get security recommendations
   */
  private async getSecurityRecommendations(): Promise<string[]> {
    // In a real implementation, this would analyze security posture
    return [
      'Enable multi-factor authentication for all healthcare users',
      'Implement data loss prevention policies',
      'Regular security awareness training for staff',
      'Monitor and audit access to PHI data'
    ];
  }
}
