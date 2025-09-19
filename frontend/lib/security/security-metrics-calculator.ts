import { supabase } from '@/lib/supabase/client'
import { redis } from '@/lib/cache/redis-client'
import type { 
  SecurityMetrics, 
  ThreatLevel, 
  SecurityIncident, 
  HealthcareActivityEvent,
  AuditLogEntry 
} from '@/lib/types/security'

export interface SecurityScore {
  overall: number
  authentication: number
  access: number
  dataProtection: number
  compliance: number
  threatLevel: ThreatLevel
}

export interface SecurityMetricsData {
  score: SecurityScore
  recentIncidents: SecurityIncident[]
  threatIndicators: ThreatIndicator[]
  activitySummary: ActivitySummary
  complianceStatus: ComplianceStatus
}

export interface ThreatIndicator {
  id: string
  type: 'failed_login' | 'suspicious_access' | 'data_breach_attempt' | 'compliance_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
  trend: 'increasing' | 'decreasing' | 'stable'
  lastOccurrence: Date
  description: string
}

export interface ActivitySummary {
  totalSessions: number
  failedLogins: number
  successfulLogins: number
  dataAccess: number
  adminActions: number
  complianceEvents: number
}

export interface ComplianceStatus {
  hipaaCompliant: boolean
  lastAudit: Date
  violations: number
  riskLevel: 'low' | 'medium' | 'high'
}

class SecurityMetricsCalculator {
  private readonly CACHE_TTL = 300 // 5 minutes
  private readonly CACHE_KEY_PREFIX = 'security:metrics:'

  /**
   * Calculate comprehensive security metrics and health score
   */
  async calculateMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<SecurityMetricsData> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${timeRange}`
    
    try {
      // Check cache first
      const cachedMetrics = await redis.get(cacheKey)
      if (cachedMetrics) {
        return JSON.parse(cachedMetrics)
      }

      const timeWindow = this.getTimeWindow(timeRange)
      
      // Fetch all required data in parallel for performance
      const [
        auditLogs,
        securityIncidents,
        healthcareActivities,
        sessionData,
        complianceEvents
      ] = await Promise.all([
        this.fetchAuditLogs(timeWindow),
        this.fetchSecurityIncidents(timeWindow),
        this.fetchHealthcareActivities(timeWindow),
        this.fetchSessionData(timeWindow),
        this.fetchComplianceEvents(timeWindow)
      ])

      // Calculate metrics
      const score = this.calculateSecurityScore({
        auditLogs,
        securityIncidents,
        healthcareActivities,
        sessionData,
        complianceEvents
      })

      const threatIndicators = this.analyzeThreatIndicators({
        auditLogs,
        securityIncidents,
        healthcareActivities,
        sessionData
      })

      const activitySummary = this.summarizeActivity({
        auditLogs,
        sessionData,
        healthcareActivities,
        complianceEvents
      })

      const complianceStatus = this.assessComplianceStatus({
        complianceEvents,
        securityIncidents,
        auditLogs
      })

      const metrics: SecurityMetricsData = {
        score,
        recentIncidents: securityIncidents.slice(0, 10), // Latest 10 incidents
        threatIndicators,
        activitySummary,
        complianceStatus
      }

      // Cache the results
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics))
      
      return metrics

    } catch (error) {
      console.error('Error calculating security metrics:', error)
      throw new Error('Failed to calculate security metrics')
    }
  }

  /**
   * Calculate overall security health score (0-100)
   */
  private calculateSecurityScore(data: {
    auditLogs: AuditLogEntry[]
    securityIncidents: SecurityIncident[]
    healthcareActivities: HealthcareActivityEvent[]
    sessionData: any[]
    complianceEvents: any[]
  }): SecurityScore {
    const { auditLogs, securityIncidents, sessionData, complianceEvents } = data

    // Authentication score based on login success rate and MFA adoption
    const authScore = this.calculateAuthenticationScore(auditLogs, sessionData)
    
    // Access control score based on unauthorized attempts and privilege escalations
    const accessScore = this.calculateAccessScore(auditLogs, securityIncidents)
    
    // Data protection score based on encryption, backups, and breach attempts
    const dataScore = this.calculateDataProtectionScore(auditLogs, securityIncidents)
    
    // Compliance score based on HIPAA adherence and audit results
    const complianceScore = this.calculateComplianceScore(complianceEvents, auditLogs)

    const overall = Math.round(
      (authScore * 0.25 + accessScore * 0.25 + dataScore * 0.25 + complianceScore * 0.25)
    )

    const threatLevel = this.determineThreatLevel(overall, securityIncidents)

    return {
      overall,
      authentication: authScore,
      access: accessScore,
      dataProtection: dataScore,
      compliance: complianceScore,
      threatLevel
    }
  }

  private calculateAuthenticationScore(auditLogs: AuditLogEntry[], sessionData: any[]): number {
    const authEvents = auditLogs.filter(log => 
      log.action === 'login' || log.action === 'logout' || log.action === 'mfa_verify'
    )

    if (authEvents.length === 0) return 100

    const successfulLogins = authEvents.filter(event => event.outcome === 'success' && event.action === 'login').length
    const totalLoginAttempts = authEvents.filter(event => event.action === 'login').length
    const mfaEvents = authEvents.filter(event => event.action === 'mfa_verify').length
    
    const successRate = totalLoginAttempts > 0 ? (successfulLogins / totalLoginAttempts) * 100 : 100
    const mfaAdoption = successfulLogins > 0 ? (mfaEvents / successfulLogins) * 100 : 0

    // Score based on success rate (70%) and MFA adoption (30%)
    return Math.round(successRate * 0.7 + mfaAdoption * 0.3)
  }

  private calculateAccessScore(auditLogs: AuditLogEntry[], incidents: SecurityIncident[]): number {
    const accessViolations = incidents.filter(incident => 
      incident.type === 'unauthorized_access' || incident.type === 'privilege_escalation'
    ).length

    const totalAccess = auditLogs.filter(log => 
      log.action === 'access_resource' || log.action === 'admin_action'
    ).length

    if (totalAccess === 0) return 100

    const violationRate = (accessViolations / totalAccess) * 100
    return Math.max(0, Math.round(100 - violationRate * 10)) // Each violation reduces score by 10
  }

  private calculateDataProtectionScore(auditLogs: AuditLogEntry[], incidents: SecurityIncident[]): number {
    const dataBreachAttempts = incidents.filter(incident => 
      incident.type === 'data_breach_attempt' || incident.type === 'data_exfiltration'
    ).length

    const encryptionEvents = auditLogs.filter(log => 
      log.details?.encryption === true
    ).length

    const totalDataAccess = auditLogs.filter(log => 
      log.resource_type === 'patient_data' || log.resource_type === 'phi'
    ).length

    let score = 100

    // Reduce score based on breach attempts
    score -= dataBreachAttempts * 15

    // Increase score for encryption adoption
    if (totalDataAccess > 0) {
      const encryptionRate = (encryptionEvents / totalDataAccess) * 100
      score = Math.round(score * 0.7 + encryptionRate * 0.3)
    }

    return Math.max(0, Math.min(100, score))
  }

  private calculateComplianceScore(complianceEvents: any[], auditLogs: AuditLogEntry[]): number {
    const violations = complianceEvents.filter(event => 
      event.type === 'hipaa_violation' || event.type === 'compliance_failure'
    ).length

    const complianceChecks = complianceEvents.filter(event => 
      event.type === 'compliance_check' || event.type === 'audit_trail'
    ).length

    let score = 100

    // Each violation significantly reduces compliance score
    score -= violations * 20

    // Regular compliance checks increase score
    if (complianceChecks > 0) {
      score = Math.min(100, score + Math.min(complianceChecks * 2, 10))
    }

    return Math.max(0, score)
  }

  private determineThreatLevel(overallScore: number, incidents: SecurityIncident[]): ThreatLevel {
    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length
    const highIncidents = incidents.filter(i => i.severity === 'high').length

    if (criticalIncidents > 0 || overallScore < 50) return 'critical'
    if (highIncidents > 2 || overallScore < 70) return 'high'
    if (overallScore < 85) return 'medium'
    return 'low'
  }

  /**
   * Analyze threat patterns and indicators
   */
  private analyzeThreatIndicators(data: {
    auditLogs: AuditLogEntry[]
    securityIncidents: SecurityIncident[]
    healthcareActivities: HealthcareActivityEvent[]
    sessionData: any[]
  }): ThreatIndicator[] {
    const indicators: ThreatIndicator[] = []

    // Failed login attempts
    const failedLogins = data.auditLogs.filter(log => 
      log.action === 'login' && log.outcome === 'failure'
    )
    if (failedLogins.length > 0) {
      indicators.push({
        id: 'failed-logins',
        type: 'failed_login',
        severity: failedLogins.length > 10 ? 'high' : failedLogins.length > 5 ? 'medium' : 'low',
        count: failedLogins.length,
        trend: this.calculateTrend(failedLogins),
        lastOccurrence: new Date(Math.max(...failedLogins.map(f => new Date(f.timestamp).getTime()))),
        description: `${failedLogins.length} failed login attempts detected`
      })
    }

    // Suspicious access patterns
    const suspiciousAccess = data.auditLogs.filter(log => 
      log.details?.suspicious === true || log.risk_level === 'high'
    )
    if (suspiciousAccess.length > 0) {
      indicators.push({
        id: 'suspicious-access',
        type: 'suspicious_access',
        severity: suspiciousAccess.length > 5 ? 'critical' : suspiciousAccess.length > 2 ? 'high' : 'medium',
        count: suspiciousAccess.length,
        trend: this.calculateTrend(suspiciousAccess),
        lastOccurrence: new Date(Math.max(...suspiciousAccess.map(s => new Date(s.timestamp).getTime()))),
        description: `${suspiciousAccess.length} suspicious access attempts identified`
      })
    }

    // Data breach attempts
    const breachAttempts = data.securityIncidents.filter(incident => 
      incident.type === 'data_breach_attempt'
    )
    if (breachAttempts.length > 0) {
      indicators.push({
        id: 'breach-attempts',
        type: 'data_breach_attempt',
        severity: 'critical',
        count: breachAttempts.length,
        trend: this.calculateIncidentTrend(breachAttempts),
        lastOccurrence: new Date(Math.max(...breachAttempts.map(b => new Date(b.created_at).getTime()))),
        description: `${breachAttempts.length} data breach attempts blocked`
      })
    }

    // Compliance violations
    const violations = data.securityIncidents.filter(incident => 
      incident.type === 'compliance_violation'
    )
    if (violations.length > 0) {
      indicators.push({
        id: 'compliance-violations',
        type: 'compliance_violation',
        severity: violations.length > 3 ? 'high' : 'medium',
        count: violations.length,
        trend: this.calculateIncidentTrend(violations),
        lastOccurrence: new Date(Math.max(...violations.map(v => new Date(v.created_at).getTime()))),
        description: `${violations.length} compliance violations detected`
      })
    }

    return indicators.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  private calculateTrend(events: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (events.length < 2) return 'stable'

    const now = new Date()
    const halfPoint = new Date(now.getTime() - (24 * 60 * 60 * 1000) / 2) // 12 hours ago

    const recentEvents = events.filter(e => new Date(e.timestamp) > halfPoint).length
    const olderEvents = events.length - recentEvents

    if (recentEvents > olderEvents * 1.2) return 'increasing'
    if (recentEvents < olderEvents * 0.8) return 'decreasing'
    return 'stable'
  }

  private calculateIncidentTrend(incidents: SecurityIncident[]): 'increasing' | 'decreasing' | 'stable' {
    if (incidents.length < 2) return 'stable'

    const now = new Date()
    const halfPoint = new Date(now.getTime() - (24 * 60 * 60 * 1000) / 2)

    const recentIncidents = incidents.filter(i => new Date(i.created_at) > halfPoint).length
    const olderIncidents = incidents.length - recentIncidents

    if (recentIncidents > olderIncidents * 1.2) return 'increasing'
    if (recentIncidents < olderIncidents * 0.8) return 'decreasing'
    return 'stable'
  }

  private summarizeActivity(data: {
    auditLogs: AuditLogEntry[]
    sessionData: any[]
    healthcareActivities: HealthcareActivityEvent[]
    complianceEvents: any[]
  }): ActivitySummary {
    const { auditLogs, sessionData, healthcareActivities, complianceEvents } = data

    return {
      totalSessions: sessionData.length,
      failedLogins: auditLogs.filter(log => log.action === 'login' && log.outcome === 'failure').length,
      successfulLogins: auditLogs.filter(log => log.action === 'login' && log.outcome === 'success').length,
      dataAccess: auditLogs.filter(log => log.resource_type === 'patient_data' || log.resource_type === 'phi').length,
      adminActions: auditLogs.filter(log => log.action === 'admin_action').length,
      complianceEvents: complianceEvents.length
    }
  }

  private assessComplianceStatus(data: {
    complianceEvents: any[]
    securityIncidents: SecurityIncident[]
    auditLogs: AuditLogEntry[]
  }): ComplianceStatus {
    const { complianceEvents, securityIncidents } = data

    const violations = securityIncidents.filter(incident => 
      incident.type === 'compliance_violation' || incident.type === 'hipaa_violation'
    ).length

    const lastAudit = complianceEvents
      .filter(event => event.type === 'audit_trail')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    const riskLevel = violations > 5 ? 'high' : violations > 2 ? 'medium' : 'low'

    return {
      hipaaCompliant: violations === 0,
      lastAudit: lastAudit ? new Date(lastAudit.timestamp) : new Date(),
      violations,
      riskLevel
    }
  }

  // Helper methods for data fetching
  private async fetchAuditLogs(since: Date): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (error) throw error
    return data || []
  }

  private async fetchSecurityIncidents(since: Date): Promise<SecurityIncident[]> {
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data || []
  }

  private async fetchHealthcareActivities(since: Date): Promise<HealthcareActivityEvent[]> {
    const { data, error } = await supabase
      .from('healthcare_activity_logs')
      .select('*')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(500)

    if (error) throw error
    return data || []
  }

  private async fetchSessionData(since: Date): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) throw error
    return data || []
  }

  private async fetchComplianceEvents(since: Date): Promise<any[]> {
    const { data, error } = await supabase
      .from('compliance_events')
      .select('*')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(200)

    if (error) throw error
    return data || []
  }

  private getTimeWindow(timeRange: string): Date {
    const now = new Date()
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Get real-time security alerts
   */
  async getSecurityAlerts(): Promise<SecurityIncident[]> {
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('status', 'active')
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  }

  /**
   * Mark security incident as resolved
   */
  async resolveSecurityIncident(incidentId: string, resolution: string): Promise<void> {
    const { error } = await supabase
      .from('security_incidents')
      .update({ 
        status: 'resolved', 
        resolution,
        resolved_at: new Date().toISOString()
      })
      .eq('id', incidentId)

    if (error) throw error

    // Clear cache to refresh metrics
    await this.clearMetricsCache()
  }

  private async clearMetricsCache(): Promise<void> {
    const keys = ['1h', '24h', '7d', '30d'].map(range => `${this.CACHE_KEY_PREFIX}${range}`)
    await Promise.all(keys.map(key => redis.del(key)))
  }
}

export const securityMetricsCalculator = new SecurityMetricsCalculator()