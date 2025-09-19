/**
 * Advanced Threat Detection Middleware
 * Integrates ML-based threat detection with real-time intelligence
 * 
 * @security Multi-layered threat analysis
 * @performance Edge Runtime optimized with caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditOutcome } from '@/lib/security/audit-logging'
import { threatDetection, ThreatType, ThreatSeverity } from '@/lib/security/threat-detection'
import { mlThreatDetector } from '@/lib/security/advanced-threat-detection'
import { threatIntelligence, healthcareThreatIntel } from '@/lib/security/threat-intelligence'
import redis from '@/lib/redis'

/**
 * Advanced threat detection middleware
 */
export function withAdvancedThreatDetection<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  config?: ThreatDetectionConfig
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    
    try {
      // Extract request metadata
      const metadata = await extractRequestMetadata(request)
      
      // Perform multi-layered threat analysis
      const threatAnalysis = await performThreatAnalysis(metadata, config)
      
      // Log analysis results
      logThreatAnalysis(requestId, metadata, threatAnalysis)
      
      // Take action based on threat level
      const response = await handleThreatResponse(
        request,
        handler,
        threatAnalysis,
        config
      )
      
      // Add security headers to response
      addSecurityHeaders(response, threatAnalysis)
      
      // Record metrics
      recordMetrics(startTime, threatAnalysis)
      
      return response
      
    } catch (error) {
      logger.error('Advanced threat detection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        path: request.nextUrl.pathname
      })
      
      // Fail open or closed based on configuration
      if (config?.failClosed) {
        return NextResponse.json(
          { error: 'Security check failed' },
          { status: 503 }
        ) as NextResponse<T>
      }
      
      // Fail open - allow request but log security event
      auditLogger.logSecurityEvent({
        eventType: AuditEventType.APPLICATION_ERROR,
        resource: request.nextUrl.pathname,
        outcome: AuditOutcome.WARNING,
        details: {
          error: 'Threat detection failure',
          requestId
        }
      })
      
      return handler(request)
    }
  }
}

/**
 * Extract request metadata for analysis
 */
async function extractRequestMetadata(request: NextRequest): Promise<RequestMetadata> {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  
  // Parse body if present
  let body: any = null
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const clonedRequest = request.clone()
      body = await clonedRequest.json()
    } catch {
      // Body might not be JSON
      try {
        const clonedRequest = request.clone()
        body = await clonedRequest.text()
      } catch {
        body = null
      }
    }
  }
  
  // Extract parameters
  const parameters: Record<string, any> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    parameters[key] = value
  })
  
  return {
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || undefined,
    userId: await getUserId(request),
    sessionId: getSessionId(request),
    endpoint: request.nextUrl.pathname,
    method: request.method,
    headers,
    body,
    parameters,
    timestamp: new Date(),
    url: request.url,
    referrer: request.headers.get('referer') || undefined
  }
}

/**
 * Perform comprehensive threat analysis
 */
async function performThreatAnalysis(
  metadata: RequestMetadata,
  config?: ThreatDetectionConfig
): Promise<ThreatAnalysis> {
  const analysis: ThreatAnalysis = {
    overallThreatLevel: 'none',
    threatScore: 0,
    detectedThreats: [],
    mlAnalysis: null,
    threatIntel: null,
    healthcareThreats: null,
    recommendations: [],
    shouldBlock: false,
    shouldRateLimit: false,
    shouldAlert: false
  }
  
  // Skip analysis for whitelisted paths
  if (config?.whitelist && isWhitelisted(metadata.endpoint, config.whitelist)) {
    return analysis
  }
  
  // 1. Traditional threat detection (existing system)
  const traditionalThreat = await threatDetection.analyzeRequest({
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    userId: metadata.userId,
    sessionId: metadata.sessionId,
    endpoint: metadata.endpoint,
    method: metadata.method,
    headers: metadata.headers,
    body: metadata.body,
    parameters: metadata.parameters,
    timestamp: metadata.timestamp
  })
  
  if (traditionalThreat) {
    analysis.detectedThreats.push({
      type: traditionalThreat.threatType,
      severity: traditionalThreat.severity,
      score: traditionalThreat.score,
      source: 'traditional'
    })
    analysis.threatScore = Math.max(analysis.threatScore, traditionalThreat.score / 100)
  }
  
  // 2. ML-based threat detection
  try {
    const mlResult = await mlThreatDetector.analyzeWithML({
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      userId: metadata.userId,
      sessionId: metadata.sessionId,
      endpoint: metadata.endpoint,
      method: metadata.method,
      headers: metadata.headers,
      body: metadata.body,
      parameters: metadata.parameters,
      timestamp: metadata.timestamp
    })
    
    analysis.mlAnalysis = mlResult
    
    if (mlResult.threatScore > 0.5) {
      analysis.detectedThreats.push({
        type: mlResult.classification.primaryThreat,
        severity: scoreToseverity(mlResult.threatScore),
        score: mlResult.threatScore * 100,
        source: 'ml',
        confidence: mlResult.confidence
      })
      analysis.threatScore = Math.max(analysis.threatScore, mlResult.threatScore)
    }
  } catch (error) {
    logger.error('ML threat detection failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // 3. Threat intelligence lookup
  try {
    const threatIntel = await threatIntelligence.getIPThreatIntel(metadata.ip)
    analysis.threatIntel = threatIntel
    
    if (threatIntel.threatLevel !== 'NONE' && threatIntel.threatLevel !== 'UNKNOWN') {
      const intelScore = threatLevelToScore(threatIntel.threatLevel)
      analysis.detectedThreats.push({
        type: ThreatType.SUSPICIOUS_PATTERN,
        severity: threatLevelToSeverity(threatIntel.threatLevel),
        score: intelScore,
        source: 'threat_intel',
        confidence: threatIntel.confidence
      })
      analysis.threatScore = Math.max(analysis.threatScore, intelScore / 100)
    }
  } catch (error) {
    logger.error('Threat intelligence lookup failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // 4. Healthcare-specific threat detection
  try {
    const healthcareAssessment = await healthcareThreatIntel.checkHealthcareThreat({
      endpoint: metadata.endpoint,
      parameters: metadata.parameters,
      body: metadata.body
    })
    
    analysis.healthcareThreats = healthcareAssessment
    
    if (healthcareAssessment.riskLevel !== 'low') {
      const healthScore = healthcareRiskToScore(healthcareAssessment.riskLevel)
      analysis.detectedThreats.push({
        type: ThreatType.PHI_BREACH_ATTEMPT,
        severity: healthcareRiskToSeverity(healthcareAssessment.riskLevel),
        score: healthScore,
        source: 'healthcare'
      })
      analysis.threatScore = Math.max(analysis.threatScore, healthScore / 100)
      analysis.recommendations.push(...healthcareAssessment.recommendations)
    }
  } catch (error) {
    logger.error('Healthcare threat detection failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // 5. Determine overall threat level and actions
  analysis.overallThreatLevel = calculateOverallThreatLevel(analysis.threatScore)
  
  // Determine actions based on threat level and configuration
  if (analysis.threatScore >= (config?.blockThreshold || 0.8)) {
    analysis.shouldBlock = true
    analysis.recommendations.push('Block request immediately')
  } else if (analysis.threatScore >= (config?.rateLimitThreshold || 0.6)) {
    analysis.shouldRateLimit = true
    analysis.recommendations.push('Apply strict rate limiting')
  }
  
  if (analysis.threatScore >= (config?.alertThreshold || 0.7)) {
    analysis.shouldAlert = true
    analysis.recommendations.push('Alert security team')
  }
  
  // Add general recommendations
  if (analysis.detectedThreats.length > 0) {
    analysis.recommendations.push('Monitor user activity closely')
    analysis.recommendations.push('Review security logs for patterns')
  }
  
  return analysis
}

/**
 * Handle response based on threat analysis
 */
async function handleThreatResponse<T>(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  analysis: ThreatAnalysis,
  config?: ThreatDetectionConfig
): Promise<NextResponse<T>> {
  // Block request if threat level is too high
  if (analysis.shouldBlock) {
    // Log security event
    auditLogger.logSecurityEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      resource: request.nextUrl.pathname,
      outcome: AuditOutcome.FAILURE,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: {
        threatScore: analysis.threatScore,
        threats: analysis.detectedThreats,
        action: 'blocked'
      }
    })
    
    // Return security error
    return NextResponse.json(
      { 
        error: 'Security violation detected',
        code: 'SECURITY_VIOLATION'
      },
      { 
        status: 403,
        headers: {
          'X-Security-Block': 'true',
          'X-Block-Reason': 'threat-detected'
        }
      }
    ) as NextResponse<T>
  }
  
  // Apply rate limiting if needed
  if (analysis.shouldRateLimit) {
    const rateLimitKey = `threat_ratelimit:${getClientIP(request)}`
    
    try {
      if (redis) {
        const count = await redis.incr(rateLimitKey)
        if (count !== null && count === 1) {
          await redis.expire(rateLimitKey, 300) // 5 minutes
        }
        
        const limit = config?.rateLimitMax || 10
        if (count !== null && count > limit) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded due to security concerns',
              code: 'RATE_LIMIT_SECURITY'
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(Date.now() + 300000).toISOString()
              }
            }
          ) as NextResponse<T>
        }
      }
    } catch (error) {
      logger.error('Rate limiting failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Send alert if needed
  if (analysis.shouldAlert) {
    sendSecurityAlert(request, analysis)
  }
  
  // Allow request to proceed but add threat info to context
  const response = await handler(request)
  
  // Add threat analysis to response headers (for monitoring)
  if (config?.includeHeaders) {
    response.headers.set('X-Threat-Score', analysis.threatScore.toFixed(2))
    response.headers.set('X-Threat-Level', analysis.overallThreatLevel)
    if (analysis.detectedThreats.length > 0) {
      response.headers.set(
        'X-Threat-Types',
        analysis.detectedThreats.map(t => t.type).join(',')
      )
    }
  }
  
  return response
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, analysis: ThreatAnalysis): void {
  // Add standard security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add stricter headers for high-threat requests
  if (analysis.threatScore > 0.5) {
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  }
}

/**
 * Log threat analysis results
 */
function logThreatAnalysis(
  requestId: string,
  metadata: RequestMetadata,
  analysis: ThreatAnalysis
): void {
  if (analysis.detectedThreats.length > 0) {
    logger.warn('Threats detected', {
      requestId,
      ip: metadata.ip,
      endpoint: metadata.endpoint,
      threatScore: analysis.threatScore,
      threatLevel: analysis.overallThreatLevel,
      threats: analysis.detectedThreats
    })
  }
  
  // Log to audit trail if significant threat
  if (analysis.threatScore > 0.3) {
    auditLogger.logSecurityEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      resource: metadata.endpoint,
      outcome: analysis.shouldBlock ? AuditOutcome.FAILURE : AuditOutcome.WARNING,
      userId: metadata.userId,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      details: {
        requestId,
        threatScore: analysis.threatScore,
        threatLevel: analysis.overallThreatLevel,
        threats: analysis.detectedThreats,
        mlScore: analysis.mlAnalysis?.threatScore,
        recommendations: analysis.recommendations
      }
    })
  }
}

/**
 * Send security alert for high-threat events
 */
async function sendSecurityAlert(request: NextRequest, analysis: ThreatAnalysis): Promise<void> {
  try {
    // In production, integrate with:
    // - Slack/Teams webhooks
    // - PagerDuty
    // - Email alerts
    // - SIEM systems
    
    logger.error('SECURITY ALERT', {
      severity: 'HIGH',
      endpoint: request.nextUrl.pathname,
      threatScore: analysis.threatScore,
      threats: analysis.detectedThreats,
      recommendations: analysis.recommendations
    })
    
  } catch (error) {
    logger.error('Failed to send security alert', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Record threat detection metrics
 */
function recordMetrics(startTime: number, analysis: ThreatAnalysis): void {
  const duration = Date.now() - startTime
  
  // In production, send to metrics system
  if (process.env.NODE_ENV === 'production') {
    // Record to DataDog, New Relic, CloudWatch, etc.
  }
  
  // Log performance metrics
  if (duration > 100) {
    logger.warn('Slow threat detection', {
      duration,
      threatScore: analysis.threatScore
    })
  }
}

/**
 * Helper functions
 */

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         '127.0.0.1'
}

async function getUserId(request: NextRequest): Promise<string | undefined> {
  // Extract from JWT, session, etc.
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // Decode JWT to get user ID (simplified)
      const token = authHeader.substring(7)
      // In production, properly verify and decode JWT
      return undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

function getSessionId(request: NextRequest): string | undefined {
  return request.cookies.get('session_id')?.value
}

function isWhitelisted(path: string, whitelist: string[]): boolean {
  return whitelist.some(pattern => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1))
    }
    return path === pattern
  })
}

function scoreToseverity(score: number): ThreatSeverity {
  if (score >= 0.8) return ThreatSeverity.CRITICAL
  if (score >= 0.6) return ThreatSeverity.HIGH
  if (score >= 0.4) return ThreatSeverity.MEDIUM
  return ThreatSeverity.LOW
}

function threatLevelToScore(level: string): number {
  switch (level) {
    case 'CRITICAL': return 90
    case 'HIGH': return 70
    case 'MEDIUM': return 50
    case 'LOW': return 30
    default: return 0
  }
}

function threatLevelToSeverity(level: string): ThreatSeverity {
  switch (level) {
    case 'CRITICAL': return ThreatSeverity.CRITICAL
    case 'HIGH': return ThreatSeverity.HIGH
    case 'MEDIUM': return ThreatSeverity.MEDIUM
    case 'LOW': return ThreatSeverity.LOW
    default: return ThreatSeverity.LOW
  }
}

function healthcareRiskToScore(risk: string): number {
  switch (risk) {
    case 'critical': return 95
    case 'high': return 75
    case 'medium': return 50
    case 'low': return 25
    default: return 0
  }
}

function healthcareRiskToSeverity(risk: string): ThreatSeverity {
  switch (risk) {
    case 'critical': return ThreatSeverity.CRITICAL
    case 'high': return ThreatSeverity.HIGH
    case 'medium': return ThreatSeverity.MEDIUM
    case 'low': return ThreatSeverity.LOW
    default: return ThreatSeverity.LOW
  }
}

function calculateOverallThreatLevel(score: number): string {
  if (score >= 0.8) return 'critical'
  if (score >= 0.6) return 'high'
  if (score >= 0.4) return 'medium'
  if (score >= 0.2) return 'low'
  return 'none'
}

// Type definitions
interface ThreatDetectionConfig {
  enabled?: boolean
  blockThreshold?: number // 0-1, default 0.8
  rateLimitThreshold?: number // 0-1, default 0.6
  alertThreshold?: number // 0-1, default 0.7
  rateLimitMax?: number // Max requests in window
  failClosed?: boolean // Block on error vs allow
  whitelist?: string[] // Paths to skip
  includeHeaders?: boolean // Include threat info in response headers
}

interface RequestMetadata {
  ip: string
  userAgent?: string
  userId?: string
  sessionId?: string
  endpoint: string
  method: string
  headers: Record<string, string>
  body: any
  parameters: Record<string, any>
  timestamp: Date
  url: string
  referrer?: string
}

interface ThreatAnalysis {
  overallThreatLevel: string
  threatScore: number // 0-1
  detectedThreats: DetectedThreat[]
  mlAnalysis: any | null
  threatIntel: any | null
  healthcareThreats: any | null
  recommendations: string[]
  shouldBlock: boolean
  shouldRateLimit: boolean
  shouldAlert: boolean
}

interface DetectedThreat {
  type: ThreatType
  severity: ThreatSeverity
  score: number
  source: 'traditional' | 'ml' | 'threat_intel' | 'healthcare'
  confidence?: number
}

// Export middleware and types
export type { ThreatDetectionConfig, RequestMetadata, ThreatAnalysis, DetectedThreat }