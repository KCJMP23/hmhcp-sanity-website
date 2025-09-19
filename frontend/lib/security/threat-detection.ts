/**
 * Advanced Threat Detection and Prevention System
 * Real-time security monitoring and automated response
 */

import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditOutcome } from './audit-logging'

export interface ThreatEvent {
  id: string
  timestamp: Date
  threatType: ThreatType
  severity: ThreatSeverity
  source: {
    ip: string
    userAgent?: string
    userId?: string
    sessionId?: string
    country?: string
    region?: string
  }
  target: {
    resource: string
    endpoint?: string
    method?: string
    parameters?: Record<string, any>
  }
  indicators: ThreatIndicator[]
  score: number // 0-100 threat score
  status: ThreatStatus
  mitigationActions: string[]
  details: Record<string, any>
}

export enum ThreatType {
  // Injection attacks
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTACK = 'XSS_ATTACK',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  LDAP_INJECTION = 'LDAP_INJECTION',
  
  // Authentication threats
  BRUTE_FORCE = 'BRUTE_FORCE',
  CREDENTIAL_STUFFING = 'CREDENTIAL_STUFFING',
  SESSION_HIJACKING = 'SESSION_HIJACKING',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  
  // Data threats
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PHI_BREACH_ATTEMPT = 'PHI_BREACH_ATTEMPT',
  MASS_DATA_ACCESS = 'MASS_DATA_ACCESS',
  
  // Network threats
  DDoS_ATTACK = 'DDOS_ATTACK',
  PORT_SCANNING = 'PORT_SCANNING',
  BOTNET_ACTIVITY = 'BOTNET_ACTIVITY',
  
  // Application threats
  RATE_LIMIT_ABUSE = 'RATE_LIMIT_ABUSE',
  API_ABUSE = 'API_ABUSE',
  DIRECTORY_TRAVERSAL = 'DIRECTORY_TRAVERSAL',
  MALICIOUS_FILE_UPLOAD = 'MALICIOUS_FILE_UPLOAD',
  
  // Social engineering
  PHISHING_ATTEMPT = 'PHISHING_ATTEMPT',
  SOCIAL_ENGINEERING = 'SOCIAL_ENGINEERING',
  
  // Insider threats
  ABNORMAL_ACCESS_PATTERN = 'ABNORMAL_ACCESS_PATTERN',
  OFF_HOURS_ACCESS = 'OFF_HOURS_ACCESS',
  BULK_DOWNLOAD = 'BULK_DOWNLOAD',
  
  // Unknown/suspicious activity
  ANOMALOUS_BEHAVIOR = 'ANOMALOUS_BEHAVIOR',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN'
}

export enum ThreatSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ThreatStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  CONFIRMED = 'CONFIRMED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  MITIGATED = 'MITIGATED',
  RESOLVED = 'RESOLVED'
}

export interface ThreatIndicator {
  type: 'behavioral' | 'signature' | 'anomaly' | 'statistical'
  name: string
  value: any
  weight: number // 0-1 contribution to threat score
  confidence: number // 0-1 confidence level
}

export interface ThreatRule {
  id: string
  name: string
  description: string
  threatType: ThreatType
  enabled: boolean
  conditions: ThreatCondition[]
  actions: ThreatAction[]
  severity: ThreatSeverity
  threshold: number // Score threshold to trigger
}

export interface ThreatCondition {
  field: string
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in'
  value: any
  weight: number
}

export interface ThreatAction {
  type: 'block' | 'rate_limit' | 'alert' | 'log' | 'quarantine' | 'notify'
  parameters: Record<string, any>
}

export interface ThreatAnalysisRequest {
  ip: string
  userAgent?: string
  userId?: string
  sessionId?: string
  endpoint: string
  method: string
  headers: Record<string, string>
  body?: any
  parameters?: Record<string, any>
  timestamp: Date
}

class ThreatDetectionEngine {
  private threats: Map<string, ThreatEvent> = new Map()
  private threatRules: Map<string, ThreatRule> = new Map()
  private ipReputationCache: Map<string, { score: number; lastCheck: Date }> = new Map()
  private userBehaviorProfiles: Map<string, UserBehaviorProfile> = new Map()
  private rateLimitCounters: Map<string, RateLimitCounter> = new Map()

  constructor() {
    this.initializeDefaultRules()
    this.startBackgroundTasks()
  }

  /**
   * Analyze incoming request for threats
   */
  async analyzeRequest(request: ThreatAnalysisRequest): Promise<ThreatEvent | null> {
    try {
      const indicators: ThreatIndicator[] = []
      let totalScore = 0

      // 1. Signature-based detection
      const signatureIndicators = await this.checkSignatures(request)
      indicators.push(...signatureIndicators)

      // 2. Behavioral analysis
      const behavioralIndicators = await this.analyzeBehavior(request)
      indicators.push(...behavioralIndicators)

      // 3. Statistical anomaly detection
      const anomalyIndicators = await this.detectAnomalies(request)
      indicators.push(...anomalyIndicators)

      // 4. IP reputation check
      const reputationIndicators = await this.checkIPReputation(request.ip)
      indicators.push(...reputationIndicators)

      // 5. Rate limiting analysis
      const rateLimitIndicators = await this.checkRateLimits(request)
      indicators.push(...rateLimitIndicators)

      // Calculate total threat score
      totalScore = indicators.reduce((sum, indicator) => 
        sum + (indicator.weight * indicator.confidence * 100), 0
      )

      // Check if score exceeds any rule thresholds
      const triggeredRules = Array.from(this.threatRules.values())
        .filter(rule => rule.enabled && this.evaluateRule(rule, request, indicators))

      // Create threat event if significant threat detected
      if (totalScore > 30 || triggeredRules.length > 0) {
        const threatType = this.determineThreatType(indicators, triggeredRules)
        const severity = this.determineSeverity(totalScore, triggeredRules)

        const threatEvent: ThreatEvent = {
          id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: request.timestamp,
          threatType,
          severity,
          source: {
            ip: request.ip,
            userAgent: request.userAgent,
            userId: request.userId,
            sessionId: request.sessionId
          },
          target: {
            resource: request.endpoint,
            endpoint: request.endpoint,
            method: request.method,
            parameters: request.parameters
          },
          indicators,
          score: Math.min(100, Math.round(totalScore)),
          status: ThreatStatus.DETECTED,
          mitigationActions: [],
          details: {
            triggeredRules: triggeredRules.map(r => r.id),
            requestDetails: this.sanitizeRequestDetails(request)
          }
        }

        // Store threat event
        this.threats.set(threatEvent.id, threatEvent)

        // Execute mitigation actions
        await this.executeMitigationActions(threatEvent, triggeredRules)

        // Log threat detection
        auditLogger.logSecurityEvent({
          eventType: AuditEventType.SECURITY_VIOLATION,
          resource: request.endpoint,
          outcome: AuditOutcome.WARNING,
          userId: request.userId,
          ipAddress: request.ip,
          userAgent: request.userAgent,
          details: {
            threatType,
            severity,
            score: threatEvent.score,
            indicators: indicators.length
          }
        })

        logger.warn('Threat detected', {
          threatId: threatEvent.id,
          type: threatType,
          severity,
          score: threatEvent.score,
          ip: request.ip,
          endpoint: request.endpoint
        })

        return threatEvent
      }

      return null

    } catch (error) {
      logger.error('Threat analysis failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
      return null
    }
  }

  /**
   * Check request against signature-based rules
   */
  private async checkSignatures(request: ThreatAnalysisRequest): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    // SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/gi,
      /(OR|AND)\s+\d+\s*=\s*\d+/gi,
      /['"]\s*(OR|AND)\s+['"]/gi,
      /;\s*(DROP|DELETE)/gi
    ]

    const requestString = JSON.stringify(request.parameters || {}) + (request.body || '')
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(requestString)) {
        indicators.push({
          type: 'signature',
          name: 'sql_injection_pattern',
          value: pattern.source,
          weight: 0.8,
          confidence: 0.9
        })
        break
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi
    ]

    for (const pattern of xssPatterns) {
      if (pattern.test(requestString)) {
        indicators.push({
          type: 'signature',
          name: 'xss_pattern',
          value: pattern.source,
          weight: 0.7,
          confidence: 0.85
        })
        break
      }
    }

    // Command injection patterns
    const cmdPatterns = [
      /[;&|`$()]/,
      /\b(cat|ls|ps|whoami|curl|wget)\b/gi
    ]

    for (const pattern of cmdPatterns) {
      if (pattern.test(requestString)) {
        indicators.push({
          type: 'signature',
          name: 'command_injection_pattern',
          value: pattern.source,
          weight: 0.9,
          confidence: 0.8
        })
        break
      }
    }

    // Directory traversal patterns
    if (/\.\.[\/\\]/.test(requestString)) {
      indicators.push({
        type: 'signature',
        name: 'directory_traversal',
        value: 'path_traversal_pattern',
        weight: 0.6,
        confidence: 0.9
      })
    }

    return indicators
  }

  /**
   * Analyze user behavior patterns
   */
  private async analyzeBehavior(request: ThreatAnalysisRequest): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    if (!request.userId) return indicators

    // Get or create user behavior profile
    let profile = this.userBehaviorProfiles.get(request.userId)
    if (!profile) {
      profile = {
        userId: request.userId,
        firstSeen: request.timestamp,
        lastSeen: request.timestamp,
        totalRequests: 0,
        commonEndpoints: new Map(),
        commonTimes: new Map(),
        commonIPs: new Map(),
        avgRequestsPerHour: 0,
        suspicious: false
      }
      this.userBehaviorProfiles.set(request.userId, profile)
    }

    // Update profile
    profile.lastSeen = request.timestamp
    profile.totalRequests++

    // Check for unusual access patterns
    const hour = request.timestamp.getHours()
    const isOffHours = hour < 6 || hour > 22

    if (isOffHours) {
      const offHoursCount = profile.commonTimes.get('off_hours') || 0
      const totalRequests = profile.totalRequests
      
      if (offHoursCount / totalRequests > 0.1) { // More than 10% off-hours access
        indicators.push({
          type: 'behavioral',
          name: 'unusual_access_time',
          value: hour,
          weight: 0.4,
          confidence: 0.7
        })
      }
      profile.commonTimes.set('off_hours', offHoursCount + 1)
    }

    // Check for unusual IP address
    const ipCount = profile.commonIPs.get(request.ip) || 0
    profile.commonIPs.set(request.ip, ipCount + 1)

    if (profile.commonIPs.size > 10) { // User accessing from many different IPs
      indicators.push({
        type: 'behavioral',
        name: 'multiple_ip_addresses',
        value: profile.commonIPs.size,
        weight: 0.3,
        confidence: 0.6
      })
    }

    // Check for rapid requests (potential automation)
    const now = request.timestamp.getTime()
    const tenMinutesAgo = now - (10 * 60 * 1000)
    
    // Count recent requests (simplified - in production would use sliding window)
    if (profile.totalRequests > 100) {
      const estimatedRecentRequests = Math.min(50, profile.totalRequests * 0.1)
      if (estimatedRecentRequests > 30) { // More than 30 requests in 10 minutes
        indicators.push({
          type: 'behavioral',
          name: 'rapid_requests',
          value: estimatedRecentRequests,
          weight: 0.5,
          confidence: 0.8
        })
      }
    }

    return indicators
  }

  /**
   * Detect statistical anomalies
   */
  private async detectAnomalies(request: ThreatAnalysisRequest): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    // Check for unusually large requests
    const bodySize = request.body ? JSON.stringify(request.body).length : 0
    const paramSize = request.parameters ? JSON.stringify(request.parameters).length : 0
    const totalSize = bodySize + paramSize

    if (totalSize > 50000) { // Large request payload
      indicators.push({
        type: 'anomaly',
        name: 'large_request_payload',
        value: totalSize,
        weight: 0.3,
        confidence: 0.7
      })
    }

    // Check for unusual user agent
    const userAgent = request.userAgent || ''
    const suspiciousUAPatterns = [
      /bot/i,
      /crawler/i,
      /scanner/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i
    ]

    if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
      indicators.push({
        type: 'anomaly',
        name: 'suspicious_user_agent',
        value: userAgent,
        weight: 0.4,
        confidence: 0.6
      })
    }

    // Check for missing common headers
    const commonHeaders = ['accept', 'accept-language', 'accept-encoding']
    const missingHeaders = commonHeaders.filter(header => 
      !Object.keys(request.headers).some(h => h.toLowerCase() === header)
    )

    if (missingHeaders.length > 1) {
      indicators.push({
        type: 'anomaly',
        name: 'missing_common_headers',
        value: missingHeaders,
        weight: 0.2,
        confidence: 0.5
      })
    }

    return indicators
  }

  /**
   * Check IP reputation
   */
  private async checkIPReputation(ip: string): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    try {
      // Check cache first
      const cached = this.ipReputationCache.get(ip)
      const cacheAge = cached ? Date.now() - cached.lastCheck.getTime() : Infinity
      
      let reputationScore = 0
      
      if (cached && cacheAge < 24 * 60 * 60 * 1000) { // 24 hours cache
        reputationScore = cached.score
      } else {
        // In production, this would query external threat intelligence APIs
        // For now, use simple heuristics
        reputationScore = await this.calculateIPReputation(ip)
        
        this.ipReputationCache.set(ip, {
          score: reputationScore,
          lastCheck: new Date()
        })
      }

      if (reputationScore > 50) {
        indicators.push({
          type: 'anomaly',
          name: 'bad_ip_reputation',
          value: reputationScore,
          weight: 0.6,
          confidence: 0.8
        })
      }

    } catch (error) {
      logger.error('IP reputation check failed:', { error: error instanceof Error ? error.message : 'Unknown error' })
    }

    return indicators
  }

  /**
   * Calculate simple IP reputation score
   */
  private async calculateIPReputation(ip: string): Promise<number> {
    let score = 0

    // Check for private/local IPs (lower risk)
    if (this.isPrivateIP(ip)) {
      return 0
    }

    // Check for known bad IP patterns (simplified)
    const suspiciousPatterns = [
      /^10\./, // Should not reach here if private IP check works
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./
    ]

    // In production, you would:
    // 1. Query threat intelligence feeds
    // 2. Check blacklists
    // 3. Analyze geolocation
    // 4. Check for known malicious networks

    // Simulate some reputation scoring
    if (ip.includes('127.0.0.1')) {
      return 0 // Localhost
    }

    // Random scoring for demo (in production, use real threat intelligence)
    score = Math.random() * 20 // Most IPs would have low scores

    return score
  }

  /**
   * Check if IP is private/internal
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^127\./,
      /^::1$/,
      /^fe80:/
    ]

    return privateRanges.some(pattern => pattern.test(ip))
  }

  /**
   * Check rate limiting violations
   */
  private async checkRateLimits(request: ThreatAnalysisRequest): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    const key = `${request.ip}-${request.endpoint}`
    const counter = this.rateLimitCounters.get(key) || {
      count: 0,
      windowStart: request.timestamp.getTime(),
      violations: 0
    }

    const windowDuration = 60 * 1000 // 1 minute
    const maxRequests = 60 // 60 requests per minute per IP per endpoint

    const now = request.timestamp.getTime()
    
    // Reset window if expired
    if (now - counter.windowStart > windowDuration) {
      counter.count = 1
      counter.windowStart = now
    } else {
      counter.count++
    }

    // Check for rate limit violation
    if (counter.count > maxRequests) {
      counter.violations++
      
      indicators.push({
        type: 'statistical',
        name: 'rate_limit_violation',
        value: counter.count,
        weight: 0.7,
        confidence: 0.9
      })
    }

    this.rateLimitCounters.set(key, counter)

    return indicators
  }

  /**
   * Initialize default threat detection rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: ThreatRule[] = [
      {
        id: 'sql_injection_rule',
        name: 'SQL Injection Detection',
        description: 'Detects potential SQL injection attempts',
        threatType: ThreatType.SQL_INJECTION,
        enabled: true,
        conditions: [
          {
            field: 'indicators',
            operator: 'contains',
            value: 'sql_injection_pattern',
            weight: 1.0
          }
        ],
        actions: [
          { type: 'block', parameters: { duration: 300 } },
          { type: 'alert', parameters: { severity: 'high' } }
        ],
        severity: ThreatSeverity.HIGH,
        threshold: 70
      },
      {
        id: 'brute_force_rule',
        name: 'Brute Force Detection',
        description: 'Detects brute force login attempts',
        threatType: ThreatType.BRUTE_FORCE,
        enabled: true,
        conditions: [
          {
            field: 'endpoint',
            operator: 'contains',
            value: '/login',
            weight: 0.5
          },
          {
            field: 'rate_limit_violations',
            operator: 'gt',
            value: 5,
            weight: 0.8
          }
        ],
        actions: [
          { type: 'rate_limit', parameters: { limit: 5, window: 900 } },
          { type: 'alert', parameters: { severity: 'medium' } }
        ],
        severity: ThreatSeverity.MEDIUM,
        threshold: 60
      }
    ]

    defaultRules.forEach(rule => {
      this.threatRules.set(rule.id, rule)
    })
  }

  /**
   * Evaluate threat rule against request
   */
  private evaluateRule(rule: ThreatRule, request: ThreatAnalysisRequest, indicators: ThreatIndicator[]): boolean {
    let score = 0

    for (const condition of rule.conditions) {
      if (this.evaluateCondition(condition, request, indicators)) {
        score += condition.weight
      }
    }

    return score >= 0.7 // Rule triggers if 70% of conditions met
  }

  /**
   * Evaluate individual rule condition
   */
  private evaluateCondition(condition: ThreatCondition, request: ThreatAnalysisRequest, indicators: ThreatIndicator[]): boolean {
    let fieldValue: any

    // Get field value
    switch (condition.field) {
      case 'endpoint':
        fieldValue = request.endpoint
        break
      case 'method':
        fieldValue = request.method
        break
      case 'ip':
        fieldValue = request.ip
        break
      case 'indicators':
        fieldValue = indicators.map(i => i.name)
        break
      default:
        return false
    }

    // Evaluate condition
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'contains':
        return Array.isArray(fieldValue) 
          ? fieldValue.includes(condition.value)
          : String(fieldValue).includes(condition.value)
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue))
      case 'gt':
        return Number(fieldValue) > condition.value
      case 'lt':
        return Number(fieldValue) < condition.value
      case 'gte':
        return Number(fieldValue) >= condition.value
      case 'lte':
        return Number(fieldValue) <= condition.value
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        return false
    }
  }

  /**
   * Determine threat type from indicators and rules
   */
  private determineThreatType(indicators: ThreatIndicator[], rules: ThreatRule[]): ThreatType {
    if (rules.length > 0) {
      return rules[0].threatType
    }

    // Determine from indicators
    const indicatorNames = indicators.map(i => i.name)
    
    if (indicatorNames.includes('sql_injection_pattern')) {
      return ThreatType.SQL_INJECTION
    }
    if (indicatorNames.includes('xss_pattern')) {
      return ThreatType.XSS_ATTACK
    }
    if (indicatorNames.includes('rate_limit_violation')) {
      return ThreatType.RATE_LIMIT_ABUSE
    }
    if (indicatorNames.includes('unusual_access_time')) {
      return ThreatType.ABNORMAL_ACCESS_PATTERN
    }

    return ThreatType.SUSPICIOUS_PATTERN
  }

  /**
   * Determine threat severity
   */
  private determineSeverity(score: number, rules: ThreatRule[]): ThreatSeverity {
    if (rules.length > 0) {
      return rules.reduce((max, rule) => 
        this.severityToNumber(rule.severity) > this.severityToNumber(max) ? rule.severity : max,
        ThreatSeverity.LOW as ThreatSeverity
      )
    }

    if (score >= 80) return ThreatSeverity.CRITICAL
    if (score >= 60) return ThreatSeverity.HIGH
    if (score >= 40) return ThreatSeverity.MEDIUM
    return ThreatSeverity.LOW
  }

  /**
   * Convert severity to number for comparison
   */
  private severityToNumber(severity: ThreatSeverity): number {
    switch (severity) {
      case ThreatSeverity.LOW: return 1
      case ThreatSeverity.MEDIUM: return 2
      case ThreatSeverity.HIGH: return 3
      case ThreatSeverity.CRITICAL: return 4
      default: return 0
    }
  }

  /**
   * Execute mitigation actions for detected threat
   */
  private async executeMitigationActions(threat: ThreatEvent, rules: ThreatRule[]): Promise<void> {
    const actions = rules.flatMap(rule => rule.actions)

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'block':
            // In production, this would update firewall rules or load balancer
            logger.warn(`Blocking IP ${threat.source.ip} for ${action.parameters.duration} seconds`)
            threat.mitigationActions.push(`blocked_ip_${action.parameters.duration}s`)
            break

          case 'rate_limit':
            // In production, this would update rate limiting rules
            logger.warn(`Rate limiting IP ${threat.source.ip}`)
            threat.mitigationActions.push('rate_limited')
            break

          case 'alert':
            // Send alert to security team
            logger.error(`Security alert: ${threat.threatType} from ${threat.source.ip}`, {
              threatId: threat.id,
              severity: action.parameters.severity
            })
            threat.mitigationActions.push('alert_sent')
            break

          case 'quarantine':
            // Quarantine user session
            if (threat.source.userId) {
              logger.warn(`Quarantining user ${threat.source.userId}`)
              threat.mitigationActions.push('user_quarantined')
            }
            break
        }
      } catch (error) {
        logger.error(`Failed to execute mitigation action ${action.type}:`, { error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
  }

  /**
   * Sanitize request details for logging
   */
  private sanitizeRequestDetails(request: ThreatAnalysisRequest): any {
    return {
      endpoint: request.endpoint,
      method: request.method,
      timestamp: request.timestamp,
      headers: Object.keys(request.headers),
      parametersCount: Object.keys(request.parameters || {}).length,
      bodySize: request.body ? JSON.stringify(request.body).length : 0
    }
  }

  /**
   * Start background cleanup and maintenance tasks
   */
  private startBackgroundTasks(): void {
    // Clean up old threat events every hour
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      for (const [id, threat] of this.threats.entries()) {
        if (threat.timestamp < cutoff) {
          this.threats.delete(id)
        }
      }
    }, 60 * 60 * 1000)

    // Clean up old rate limit counters every 10 minutes
    setInterval(() => {
      const cutoff = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      
      for (const [key, counter] of this.rateLimitCounters.entries()) {
        if (counter.windowStart < cutoff) {
          this.rateLimitCounters.delete(key)
        }
      }
    }, 10 * 60 * 1000)

    // Clean up old IP reputation cache daily
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      for (const [ip, data] of this.ipReputationCache.entries()) {
        if (data.lastCheck < cutoff) {
          this.ipReputationCache.delete(ip)
        }
      }
    }, 24 * 60 * 60 * 1000)
  }

  /**
   * Get current threat summary
   */
  getThreatSummary(): {
    activeThreats: number
    criticalThreats: number
    blockedIPs: number
    topThreatTypes: Array<{ type: ThreatType; count: number }>
  } {
    const threats = Array.from(this.threats.values())
    const activeThreats = threats.filter(t => t.status === ThreatStatus.DETECTED || t.status === ThreatStatus.INVESTIGATING)
    const criticalThreats = threats.filter(t => t.severity === ThreatSeverity.CRITICAL)
    
    // Count threat types
    const threatTypeCounts = new Map<ThreatType, number>()
    threats.forEach(threat => {
      threatTypeCounts.set(threat.threatType, (threatTypeCounts.get(threat.threatType) || 0) + 1)
    })

    const topThreatTypes = Array.from(threatTypeCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    return {
      activeThreats: activeThreats.length,
      criticalThreats: criticalThreats.length,
      blockedIPs: 0, // Would track actual blocked IPs
      topThreatTypes
    }
  }

  /**
   * Get threat by ID
   */
  getThreat(id: string): ThreatEvent | undefined {
    return this.threats.get(id)
  }

  /**
   * Update threat status
   */
  updateThreatStatus(id: string, status: ThreatStatus, notes?: string): boolean {
    const threat = this.threats.get(id)
    if (!threat) return false

    threat.status = status
    if (notes) {
      threat.details.statusNotes = notes
    }

    return true
  }
}

interface UserBehaviorProfile {
  userId: string
  firstSeen: Date
  lastSeen: Date
  totalRequests: number
  commonEndpoints: Map<string, number>
  commonTimes: Map<string, number>
  commonIPs: Map<string, number>
  avgRequestsPerHour: number
  suspicious: boolean
}

interface RateLimitCounter {
  count: number
  windowStart: number
  violations: number
}

// Export singleton instance
export const threatDetection = new ThreatDetectionEngine()

// Export types and classes
export { ThreatDetectionEngine }
// Types are already exported as interfaces above