/**
 * Advanced Security Features Service
 * OAuth 2.0 with PKCE for healthcare API security
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  pkceEnabled: boolean;
  healthcareCompliance: boolean;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state: string;
  nonce: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'compliance';
  rules: SecurityRule[];
  healthcareSpecific: boolean;
  enabled: boolean;
  priority: number;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'challenge' | 'audit';
  parameters: { [key: string]: any };
  healthcareContext?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  details: any;
  healthcareImpact: boolean;
  complianceFlags: string[];
  resolved: boolean;
  resolvedAt?: string;
}

export interface SecurityAudit {
  id: string;
  organizationId: string;
  auditType: 'security' | 'compliance' | 'access' | 'data';
  startTime: string;
  endTime: string;
  findings: SecurityFinding[];
  recommendations: string[];
  complianceScore: number;
  healthcareCompliance: boolean;
}

export interface SecurityFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  healthcareImpact: boolean;
  complianceViolation: boolean;
}

export class SecurityService {
  private supabase: any;
  private oauthConfig: OAuth2Config | null = null;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Initialize OAuth 2.0 with PKCE
   */
  async initializeOAuth2(config: OAuth2Config): Promise<void> {
    try {
      this.oauthConfig = config;
      
      // Validate healthcare compliance
      if (config.healthcareCompliance) {
        await this.validateHealthcareCompliance(config);
      }

      console.log('OAuth 2.0 with PKCE initialized successfully');
    } catch (error) {
      console.error('OAuth 2.0 initialization failed:', error);
      throw new Error('OAuth 2.0 initialization failed');
    }
  }

  /**
   * Generate PKCE challenge
   */
  generatePKCEChallenge(): PKCEChallenge {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
      state,
      nonce
    };
  }

  /**
   * Create authorization URL
   */
  createAuthorizationURL(
    challenge: PKCEChallenge,
    additionalParams?: { [key: string]: string }
  ): string {
    if (!this.oauthConfig) {
      throw new Error('OAuth 2.0 not initialized');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      redirect_uri: this.oauthConfig.redirectUri,
      scope: this.oauthConfig.scopes.join(' '),
      code_challenge: challenge.codeChallenge,
      code_challenge_method: challenge.codeChallengeMethod,
      state: challenge.state,
      nonce: challenge.nonce,
      ...additionalParams
    });

    return `${this.oauthConfig.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    state: string
  ): Promise<any> {
    if (!this.oauthConfig) {
      throw new Error('OAuth 2.0 not initialized');
    }

    try {
      const response = await fetch(this.oauthConfig.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.oauthConfig.clientId,
          client_secret: this.oauthConfig.clientSecret,
          code,
          redirect_uri: this.oauthConfig.redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const tokens = await response.json();
      
      // Log security event
      await this.logSecurityEvent({
        eventType: 'oauth_token_exchange',
        severity: 'medium',
        source: 'oauth_client',
        target: 'token_endpoint',
        details: { clientId: this.oauthConfig.clientId },
        healthcareImpact: this.oauthConfig.healthcareCompliance,
        complianceFlags: ['OAUTH_AUDIT_REQUIRED']
      });

      return tokens;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Token exchange failed');
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<boolean> {
    try {
      if (!this.oauthConfig) {
        return false;
      }

      const response = await fetch(this.oauthConfig.userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Create security policy
   */
  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'id'>): Promise<SecurityPolicy> {
    try {
      const id = crypto.randomUUID();
      const securityPolicy: SecurityPolicy = {
        ...policy,
        id
      };

      const { data, error } = await this.supabase
        .from('security_policies')
        .insert([securityPolicy])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create security policy:', error);
      throw new Error('Security policy creation failed');
    }
  }

  /**
   * Evaluate security policy
   */
  async evaluateSecurityPolicy(
    policyId: string,
    context: any
  ): Promise<{ allowed: boolean; reason?: string; action?: string }> {
    try {
      const { data: policy, error } = await this.supabase
        .from('security_policies')
        .select('*')
        .eq('id', policyId)
        .single();

      if (error || !policy) {
        return { allowed: false, reason: 'Policy not found' };
      }

      if (!policy.enabled) {
        return { allowed: true, reason: 'Policy disabled' };
      }

      // Evaluate each rule
      for (const rule of policy.rules) {
        const result = await this.evaluateRule(rule, context);
        if (!result.allowed) {
          return {
            allowed: false,
            reason: result.reason,
            action: rule.action
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Policy evaluation failed:', error);
      return { allowed: false, reason: 'Policy evaluation failed' };
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      await this.supabase
        .from('security_events')
        .insert([securityEvent]);

      // Check for security alerts
      await this.checkSecurityAlerts(securityEvent);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    organizationId: string,
    filters?: {
      severity?: string;
      eventType?: string;
      healthcareImpact?: boolean;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<SecurityEvent[]> {
    try {
      let query = this.supabase
        .from('security_events')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters?.healthcareImpact !== undefined) {
        query = query.eq('healthcare_impact', filters.healthcareImpact);
      }

      if (filters?.startTime) {
        query = query.gte('timestamp', filters.startTime);
      }

      if (filters?.endTime) {
        query = query.lte('timestamp', filters.endTime);
      }

      const { data, error } = await query.order('timestamp', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get security events:', error);
      throw new Error('Failed to retrieve security events');
    }
  }

  /**
   * Run security audit
   */
  async runSecurityAudit(
    organizationId: string,
    auditType: 'security' | 'compliance' | 'access' | 'data'
  ): Promise<SecurityAudit> {
    try {
      const auditId = crypto.randomUUID();
      const startTime = new Date().toISOString();

      // Run audit based on type
      const findings = await this.runAuditChecks(auditType, organizationId);
      const recommendations = this.generateRecommendations(findings);
      const complianceScore = this.calculateComplianceScore(findings);

      const audit: SecurityAudit = {
        id: auditId,
        organizationId,
        auditType,
        startTime,
        endTime: new Date().toISOString(),
        findings,
        recommendations,
        complianceScore,
        healthcareCompliance: complianceScore >= 90
      };

      // Store audit results
      await this.supabase
        .from('security_audits')
        .insert([audit]);

      return audit;
    } catch (error) {
      console.error('Security audit failed:', error);
      throw new Error('Security audit failed');
    }
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(
    organizationId: string,
    timeRange: { start: string; end: string }
  ): Promise<any> {
    try {
      const { data: events, error } = await this.supabase
        .from('security_events')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', timeRange.start)
        .lte('timestamp', timeRange.end);

      if (error) throw error;

      return this.calculateSecurityAnalytics(events || []);
    } catch (error) {
      console.error('Failed to get security analytics:', error);
      throw new Error('Failed to retrieve security analytics');
    }
  }

  // Private helper methods

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(codeVerifier: string): string {
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }

  private async validateHealthcareCompliance(config: OAuth2Config): Promise<void> {
    // Validate healthcare-specific OAuth requirements
    const requiredScopes = ['openid', 'profile', 'email', 'healthcare:read'];
    const missingScopes = requiredScopes.filter(scope => !config.scopes.includes(scope));
    
    if (missingScopes.length > 0) {
      throw new Error(`Missing required healthcare scopes: ${missingScopes.join(', ')}`);
    }

    // Validate PKCE is enabled for healthcare
    if (!config.pkceEnabled) {
      throw new Error('PKCE must be enabled for healthcare compliance');
    }
  }

  private async evaluateRule(rule: SecurityRule, context: any): Promise<{ allowed: boolean; reason?: string }> {
    // This would implement rule evaluation logic
    // For now, return a simple implementation
    try {
      // Simple condition evaluation (in real implementation, use a proper rule engine)
      const condition = rule.condition.replace(/\{(\w+)\}/g, (match, key) => {
        return context[key] || '';
      });

      const result = eval(condition); // In production, use a safe expression evaluator
      
      return {
        allowed: result,
        reason: result ? undefined : `Rule '${rule.name}' failed`
      };
    } catch (error) {
      return {
        allowed: false,
        reason: `Rule evaluation error: ${error.message}`
      };
    }
  }

  private async checkSecurityAlerts(event: SecurityEvent): Promise<void> {
    // Check if event triggers security alerts
    if (event.severity === 'critical' || event.severity === 'high') {
      // Create security alert
      await this.supabase
        .from('security_alerts')
        .insert([{
          id: crypto.randomUUID(),
          event_id: event.id,
          severity: event.severity,
          message: `Security event detected: ${event.eventType}`,
          created_at: new Date().toISOString(),
          resolved: false
        }]);
    }
  }

  private async runAuditChecks(auditType: string, organizationId: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    switch (auditType) {
      case 'security':
        findings.push(...await this.runSecurityChecks(organizationId));
        break;
      case 'compliance':
        findings.push(...await this.runComplianceChecks(organizationId));
        break;
      case 'access':
        findings.push(...await this.runAccessChecks(organizationId));
        break;
      case 'data':
        findings.push(...await this.runDataChecks(organizationId));
        break;
    }

    return findings;
  }

  private async runSecurityChecks(organizationId: string): Promise<SecurityFinding[]> {
    // Implement security checks
    return [
      {
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'Authentication',
        description: 'Weak password policy detected',
        recommendation: 'Implement stronger password requirements',
        healthcareImpact: true,
        complianceViolation: true
      }
    ];
  }

  private async runComplianceChecks(organizationId: string): Promise<SecurityFinding[]> {
    // Implement compliance checks
    return [
      {
        id: crypto.randomUUID(),
        severity: 'high',
        category: 'HIPAA',
        description: 'Missing audit logging for patient data access',
        recommendation: 'Enable comprehensive audit logging',
        healthcareImpact: true,
        complianceViolation: true
      }
    ];
  }

  private async runAccessChecks(organizationId: string): Promise<SecurityFinding[]> {
    // Implement access checks
    return [];
  }

  private async runDataChecks(organizationId: string): Promise<SecurityFinding[]> {
    // Implement data checks
    return [];
  }

  private generateRecommendations(findings: SecurityFinding[]): string[] {
    return findings
      .filter(finding => finding.severity === 'high' || finding.severity === 'critical')
      .map(finding => finding.recommendation);
  }

  private calculateComplianceScore(findings: SecurityFinding[]): number {
    const totalFindings = findings.length;
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    const mediumFindings = findings.filter(f => f.severity === 'medium').length;
    const lowFindings = findings.filter(f => f.severity === 'low').length;

    if (totalFindings === 0) return 100;

    const score = 100 - (criticalFindings * 20) - (highFindings * 10) - (mediumFindings * 5) - (lowFindings * 1);
    return Math.max(0, score);
  }

  private calculateSecurityAnalytics(events: SecurityEvent[]): any {
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const highEvents = events.filter(e => e.severity === 'high').length;
    const healthcareEvents = events.filter(e => e.healthcareImpact).length;

    return {
      totalEvents,
      criticalEvents,
      highEvents,
      healthcareEvents,
      eventTypes: this.groupEventsByType(events),
      trends: this.calculateEventTrends(events)
    };
  }

  private groupEventsByType(events: SecurityEvent[]): { [key: string]: number } {
    return events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private calculateEventTrends(events: SecurityEvent[]): any[] {
    // Calculate hourly trends
    const hourlyTrends = new Map();
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyTrends.set(hour, (hourlyTrends.get(hour) || 0) + 1);
    });

    return Array.from(hourlyTrends.entries()).map(([hour, count]) => ({
      hour,
      count
    }));
  }
}

export default SecurityService;
