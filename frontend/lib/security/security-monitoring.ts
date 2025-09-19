/**
 * Security Monitoring and Incident Detection System
 * OWASP Compliant - Real-time threat detection and response
 */

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { logger } from '@/lib/logger'

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  
  // Authorization events
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Attack detection
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  COMMAND_INJECTION_ATTEMPT = 'COMMAND_INJECTION_ATTEMPT',
  XXE_ATTEMPT = 'XXE_ATTEMPT',
  LDAP_INJECTION_ATTEMPT = 'LDAP_INJECTION_ATTEMPT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  DDOS_DETECTED = 'DDOS_DETECTED',
  
  // Data security
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXFILTRATION_ATTEMPT = 'DATA_EXFILTRATION_ATTEMPT',
  
  // System security
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  SECURITY_MISCONFIGURATION = 'SECURITY_MISCONFIGURATION',
  CERTIFICATE_EXPIRY = 'CERTIFICATE_EXPIRY',
  
  // Session security
  SESSION_HIJACK_ATTEMPT = 'SESSION_HIJACK_ATTEMPT',
  SESSION_FIXATION_ATTEMPT = 'SESSION_FIXATION_ATTEMPT',
  CONCURRENT_SESSION_LIMIT = 'CONCURRENT_SESSION_LIMIT'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  timestamp: Date
  ip: string
  userAgent?: string
  userId?: string
  email?: string
  details: Record<string, any>
  fingerprint: string
  risk_score: number
  blocked: boolean
  metadata?: Record<string, any>
}

export interface ThreatIndicator {
  type: string
  value: string
  confidence: number
  source: string
  timestamp: Date
}

export interface SecurityMetrics {
  events24h: number
  criticalEvents24h: number
  blockedAttempts24h: number
  uniqueThreats24h: number
  riskScore: number
  topThreats: Array<{ type: string; count: number }>
  topIPs: Array<{ ip: string; events: number; risk: number }>
}

class SecurityMonitoring {
  private static events: SecurityEvent[] = []
  private static threatIndicators: Map<string, ThreatIndicator> = new Map()
  private static readonly MAX_EVENTS = 10000
  private static readonly ALERT_THRESHOLD = {
    LOW: 10,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 90
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    type: SecurityEventType,
    request: NextRequest,
    details: Record<string, any> = {},
    options: {
      userId?: string
      email?: string
      severity?: SecuritySeverity
      block?: boolean
    } = {}
  ): Promise<SecurityEvent> {
    const ip = this.getClientIP(request)
    const severity = options.severity || this.determineSeverity(type)
    const riskScore = this.calculateRiskScore(type, ip, details)
    
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: new Date(),
      ip,
      userAgent: request.headers.get('user-agent') || undefined,
      userId: options.userId,
      email: options.email,
      details,
      fingerprint: this.generateFingerprint(request),
      risk_score: riskScore,
      blocked: options.block || false,
      metadata: {
        url: request.url,
        method: request.method,
        headers: this.sanitizeHeaders(request.headers)
      }
    }

    // Store event
    this.events.unshift(event)
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS)
    }

    // Log to monitoring service
    logger.warn('Security event', {
      type: event.type,
      severity: event.severity,
      ip: event.ip,
      userId: event.userId,
      details: event.details,
      riskScore: event.risk_score
    })

    // Check if alert needed
    if (riskScore >= this.ALERT_THRESHOLD[severity]) {
      await this.sendSecurityAlert(event)
    }

    // Update threat indicators
    if (this.isThreatIndicator(type)) {
      this.updateThreatIndicators(ip, type, riskScore)
    }

    return event
  }

  /**
   * Detect anomalies in request patterns
   */
  static detectAnomalies(request: NextRequest): {
    anomalies: string[]
    riskScore: number
    shouldBlock: boolean
  } {
    const anomalies: string[] = []
    let riskScore = 0

    // Check request headers
    const headers = request.headers
    
    // Unusual User-Agent
    const userAgent = headers.get('user-agent') || ''
    if (this.isSuspiciousUserAgent(userAgent)) {
      anomalies.push('suspicious_user_agent')
      riskScore += 20
    }

    // Missing expected headers
    if (!headers.get('accept')) {
      anomalies.push('missing_accept_header')
      riskScore += 10
    }

    if (!headers.get('accept-language')) {
      anomalies.push('missing_language_header')
      riskScore += 5
    }

    // Check for automated tools
    if (this.isAutomatedTool(userAgent)) {
      anomalies.push('automated_tool_detected')
      riskScore += 30
    }

    // Check for known attack patterns in URL
    const url = request.url
    if (this.containsAttackPattern(url)) {
      anomalies.push('attack_pattern_in_url')
      riskScore += 50
    }

    // Check for suspicious referers
    const referer = headers.get('referer')
    if (referer && this.isSuspiciousReferer(referer)) {
      anomalies.push('suspicious_referer')
      riskScore += 15
    }

    // Check for proxy indicators
    if (this.isProxyDetected(headers)) {
      anomalies.push('proxy_detected')
      riskScore += 25
    }

    return {
      anomalies,
      riskScore,
      shouldBlock: riskScore >= 70
    }
  }

  /**
   * Analyze authentication patterns
   */
  static analyzeAuthPattern(email: string, ip: string): {
    isAnomalous: boolean
    reasons: string[]
    riskScore: number
  } {
    const reasons: string[] = []
    let riskScore = 0

    // Get recent events for this email/IP
    const recentEvents = this.events.filter(e => 
      (e.email === email || e.ip === ip) &&
      e.timestamp.getTime() > Date.now() - 3600000 // Last hour
    )

    // Check for multiple failed logins
    const failedLogins = recentEvents.filter(e => 
      e.type === SecurityEventType.LOGIN_FAILURE
    ).length

    if (failedLogins > 3) {
      reasons.push('multiple_failed_logins')
      riskScore += failedLogins * 10
    }

    // Check for rapid succession attempts
    const timestamps = recentEvents.map(e => e.timestamp.getTime())
    const rapidAttempts = this.detectRapidAttempts(timestamps)
    if (rapidAttempts) {
      reasons.push('rapid_login_attempts')
      riskScore += 30
    }

    // Check for IP reputation
    const ipRisk = this.getIPRiskScore(ip)
    if (ipRisk > 50) {
      reasons.push('high_risk_ip')
      riskScore += ipRisk / 2
    }

    // Check for geographic anomalies
    const geoAnomaly = this.detectGeographicAnomaly(email, ip)
    if (geoAnomaly) {
      reasons.push('geographic_anomaly')
      riskScore += 40
    }

    return {
      isAnomalous: riskScore > 50,
      reasons,
      riskScore
    }
  }

  /**
   * Get security metrics
   */
  static getMetrics(): SecurityMetrics {
    const now = Date.now()
    const last24h = now - 86400000

    const events24h = this.events.filter(e => 
      e.timestamp.getTime() > last24h
    )

    const criticalEvents = events24h.filter(e => 
      e.severity === SecuritySeverity.CRITICAL
    )

    const blockedAttempts = events24h.filter(e => e.blocked)

    // Calculate top threats
    const threatCounts = new Map<string, number>()
    events24h.forEach(e => {
      threatCounts.set(e.type, (threatCounts.get(e.type) || 0) + 1)
    })

    const topThreats = Array.from(threatCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    // Calculate top IPs
    const ipStats = new Map<string, { events: number; risk: number }>()
    events24h.forEach(e => {
      const stats = ipStats.get(e.ip) || { events: 0, risk: 0 }
      stats.events++
      stats.risk = Math.max(stats.risk, e.risk_score)
      ipStats.set(e.ip, stats)
    })

    const topIPs = Array.from(ipStats.entries())
      .sort((a, b) => b[1].risk - a[1].risk)
      .slice(0, 10)
      .map(([ip, stats]) => ({ ip, ...stats }))

    // Calculate overall risk score
    const overallRisk = this.calculateOverallRisk(events24h)

    return {
      events24h: events24h.length,
      criticalEvents24h: criticalEvents.length,
      blockedAttempts24h: blockedAttempts.length,
      uniqueThreats24h: threatCounts.size,
      riskScore: overallRisk,
      topThreats,
      topIPs
    }
  }

  /**
   * Check if request contains attack patterns
   */
  private static containsAttackPattern(url: string): boolean {
    const patterns = [
      // SQL Injection
      /(\b(SELECT|UNION|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
      /('|(--|\/\*|\*\/|@@|@))/,
      
      // XSS
      /(<script|<iframe|javascript:|onerror=|onload=)/i,
      
      // Path Traversal
      /(\.\.\/|\.\.\\|%2e%2e)/i,
      
      // Command Injection
      /(;|\||`|\$\(|\${)/,
      
      // XXE
      /(!DOCTYPE|<!ENTITY|SYSTEM)/i
    ]

    return patterns.some(pattern => pattern.test(url))
  }

  /**
   * Check if user agent is suspicious
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspicious = [
      'sqlmap',
      'nikto',
      'nmap',
      'metasploit',
      'burp',
      'owasp',
      'acunetix',
      'nessus',
      'openvas',
      'python-requests',
      'curl',
      'wget'
    ]

    const lowerUA = userAgent.toLowerCase()
    return suspicious.some(tool => lowerUA.includes(tool))
  }

  /**
   * Check if request is from automated tool
   */
  private static isAutomatedTool(userAgent: string): boolean {
    const patterns = [
      /bot|crawler|spider|scraper/i,
      /python|perl|ruby|java(?!script)/i,
      /wget|curl|libwww|httplib/i,
      /scanner|vulnerability|security/i
    ]

    return patterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Check for suspicious referer
   */
  private static isSuspiciousReferer(referer: string): boolean {
    // Check for data URIs, file:// protocols, etc.
    return /^(data:|file:|javascript:)/i.test(referer)
  }

  /**
   * Detect proxy usage
   */
  private static isProxyDetected(headers: Headers): boolean {
    const proxyHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-forwarded',
      'forwarded-for',
      'client-ip',
      'via',
      'x-proxy-connection'
    ]

    let proxyCount = 0
    for (const header of proxyHeaders) {
      if (headers.get(header)) {
        proxyCount++
      }
    }

    // Multiple proxy headers indicate proxy usage
    return proxyCount > 2
  }

  /**
   * Detect rapid attempts
   */
  private static detectRapidAttempts(timestamps: number[]): boolean {
    if (timestamps.length < 3) return false

    const intervals = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i - 1] - timestamps[i])
    }

    // Check if intervals are suspiciously consistent (bot-like)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    return avgInterval < 2000 // Less than 2 seconds between attempts
  }

  /**
   * Get IP risk score
   */
  private static getIPRiskScore(ip: string): number {
    const indicator = this.threatIndicators.get(ip)
    if (indicator) {
      return indicator.confidence
    }

    // Check recent events from this IP
    const ipEvents = this.events.filter(e => e.ip === ip)
    const badEvents = ipEvents.filter(e => 
      e.severity === SecuritySeverity.HIGH || 
      e.severity === SecuritySeverity.CRITICAL
    )

    return Math.min(100, badEvents.length * 20)
  }

  /**
   * Detect geographic anomaly (simplified)
   */
  private static detectGeographicAnomaly(email: string, ip: string): boolean {
    // In production, this would use GeoIP lookup
    // For now, check if IP pattern changes significantly
    const userEvents = this.events.filter(e => e.email === email)
    const ips = new Set(userEvents.map(e => e.ip))
    
    // If user has logged in from many different IPs, flag as anomaly
    return ips.size > 5
  }

  /**
   * Calculate overall risk score
   */
  private static calculateOverallRisk(events: SecurityEvent[]): number {
    if (events.length === 0) return 0

    const weights = {
      [SecuritySeverity.LOW]: 1,
      [SecuritySeverity.MEDIUM]: 3,
      [SecuritySeverity.HIGH]: 7,
      [SecuritySeverity.CRITICAL]: 10
    }

    const totalScore = events.reduce((score, event) => {
      return score + (weights[event.severity] * (event.blocked ? 0.5 : 1))
    }, 0)

    const maxScore = events.length * 10
    return Math.min(100, Math.round((totalScore / maxScore) * 100))
  }

  /**
   * Determine severity based on event type
   */
  private static determineSeverity(type: SecurityEventType): SecuritySeverity {
    const severityMap: Record<SecurityEventType, SecuritySeverity> = {
      [SecurityEventType.LOGIN_SUCCESS]: SecuritySeverity.LOW,
      [SecurityEventType.LOGIN_FAILURE]: SecuritySeverity.LOW,
      [SecurityEventType.LOGOUT]: SecuritySeverity.LOW,
      [SecurityEventType.PASSWORD_RESET]: SecuritySeverity.MEDIUM,
      [SecurityEventType.ACCOUNT_LOCKED]: SecuritySeverity.MEDIUM,
      [SecurityEventType.SUSPICIOUS_LOGIN]: SecuritySeverity.HIGH,
      [SecurityEventType.UNAUTHORIZED_ACCESS]: SecuritySeverity.HIGH,
      [SecurityEventType.PRIVILEGE_ESCALATION]: SecuritySeverity.CRITICAL,
      [SecurityEventType.PERMISSION_DENIED]: SecuritySeverity.MEDIUM,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.XSS_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.CSRF_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.COMMAND_INJECTION_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.XXE_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.LDAP_INJECTION_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecuritySeverity.MEDIUM,
      [SecurityEventType.BRUTE_FORCE_DETECTED]: SecuritySeverity.HIGH,
      [SecurityEventType.DDOS_DETECTED]: SecuritySeverity.CRITICAL,
      [SecurityEventType.DATA_BREACH_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.SENSITIVE_DATA_ACCESS]: SecuritySeverity.HIGH,
      [SecurityEventType.DATA_EXFILTRATION_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.CONFIGURATION_CHANGE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.CRITICAL_ERROR]: SecuritySeverity.HIGH,
      [SecurityEventType.SECURITY_MISCONFIGURATION]: SecuritySeverity.HIGH,
      [SecurityEventType.CERTIFICATE_EXPIRY]: SecuritySeverity.MEDIUM,
      [SecurityEventType.SESSION_HIJACK_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.SESSION_FIXATION_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.CONCURRENT_SESSION_LIMIT]: SecuritySeverity.MEDIUM
    }

    return severityMap[type] || SecuritySeverity.MEDIUM
  }

  /**
   * Calculate risk score for event
   */
  private static calculateRiskScore(
    type: SecurityEventType,
    ip: string,
    details: Record<string, any>
  ): number {
    let score = 0

    // Base score from severity
    const severity = this.determineSeverity(type)
    const baseScores = {
      [SecuritySeverity.LOW]: 10,
      [SecuritySeverity.MEDIUM]: 30,
      [SecuritySeverity.HIGH]: 60,
      [SecuritySeverity.CRITICAL]: 90
    }
    score = baseScores[severity]

    // Adjust based on IP reputation
    const ipRisk = this.getIPRiskScore(ip)
    score = Math.min(100, score + ipRisk / 5)

    // Adjust based on frequency
    const recentEvents = this.events.filter(e => 
      e.ip === ip && 
      e.timestamp.getTime() > Date.now() - 3600000
    )
    if (recentEvents.length > 10) {
      score = Math.min(100, score + 20)
    }

    return Math.round(score)
  }

  /**
   * Check if event type is a threat indicator
   */
  private static isThreatIndicator(type: SecurityEventType): boolean {
    const threatTypes = [
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.CSRF_ATTEMPT,
      SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
      SecurityEventType.COMMAND_INJECTION_ATTEMPT,
      SecurityEventType.XXE_ATTEMPT,
      SecurityEventType.LDAP_INJECTION_ATTEMPT,
      SecurityEventType.BRUTE_FORCE_DETECTED,
      SecurityEventType.SESSION_HIJACK_ATTEMPT,
      SecurityEventType.DATA_BREACH_ATTEMPT,
      SecurityEventType.PRIVILEGE_ESCALATION
    ]

    return threatTypes.includes(type)
  }

  /**
   * Update threat indicators
   */
  private static updateThreatIndicators(
    ip: string,
    type: SecurityEventType,
    confidence: number
  ): void {
    const existing = this.threatIndicators.get(ip)
    
    if (!existing || existing.confidence < confidence) {
      this.threatIndicators.set(ip, {
        type: type.toString(),
        value: ip,
        confidence,
        source: 'internal_detection',
        timestamp: new Date()
      })
    }

    // Cleanup old indicators
    const cutoff = Date.now() - 86400000 // 24 hours
    for (const [key, indicator] of this.threatIndicators.entries()) {
      if (indicator.timestamp.getTime() < cutoff) {
        this.threatIndicators.delete(key)
      }
    }
  }

  /**
   * Send security alert
   */
  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, this would send to monitoring service
    logger.error('SECURITY ALERT', {
      type: event.type,
      severity: event.severity,
      ip: event.ip,
      userId: event.userId,
      riskScore: event.risk_score,
      details: event.details
    })

    // Could also send email, Slack notification, etc.
  }

  /**
   * Generate event ID
   */
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate fingerprint
   */
  private static generateFingerprint(request: NextRequest): string {
    const components = [
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || '',
      request.headers.get('accept-encoding') || ''
    ]

    return createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Get client IP
   */
  private static getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwardedFor) return forwardedFor.split(',')[0].trim()
    
    return request.ip || '127.0.0.1'
  }

  /**
   * Sanitize headers for logging
   */
  private static sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {}
    const sensitiveHeaders = ['cookie', 'authorization', 'x-api-key']
    
    headers.forEach((value, key) => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value.substring(0, 100)
      }
    })
    
    return sanitized
  }

  /**
   * Export security events
   */
  static exportEvents(
    filter?: {
      startDate?: Date
      endDate?: Date
      severity?: SecuritySeverity
      type?: SecurityEventType
    }
  ): SecurityEvent[] {
    let filtered = [...this.events]

    if (filter) {
      if (filter.startDate) {
        filtered = filtered.filter(e => e.timestamp >= filter.startDate!)
      }
      if (filter.endDate) {
        filtered = filtered.filter(e => e.timestamp <= filter.endDate!)
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity)
      }
      if (filter.type) {
        filtered = filtered.filter(e => e.type === filter.type)
      }
    }

    return filtered
  }
}

export { SecurityMonitoring }
export default SecurityMonitoring