/**
 * Enhanced User Security Module
 * HIPAA-compliant security implementation for healthcare technology platform
 */

import { supabaseAdmin } from '@/lib/dal/supabase'
import * as crypto from 'crypto'
import * as bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import { z } from 'zod'

// ==================== TYPES ====================

export interface SecurityContext {
  userId: string
  sessionId: string
  ipAddress: string
  userAgent: string
  deviceId?: string
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  specialCharsSet: string
  maxAgeDays: number
  passwordHistoryCount: number
  minPasswordAgeHours: number
  dictionaryCheck: boolean
  commonPasswordCheck: boolean
}

export interface MFASettings {
  enabled: boolean
  type: 'totp' | 'sms' | 'email' | 'backup_codes'
  secretKey?: string
  phoneNumber?: string
  backupCodes?: string[]
  lastVerifiedAt?: Date
}

export interface SecuritySettings {
  passwordExpiresAt?: Date
  requirePasswordChange: boolean
  maxSessionDuration: number
  allowedIpRanges?: string[]
  blockedIpRanges?: string[]
  geoRestrictions?: string[]
  loginHours?: { start: string; end: string }[]
  maxConcurrentSessions: number
  accountLockoutThreshold: number
  accountLockoutDuration: number
}

export interface ThreatIndicator {
  type: 'brute_force' | 'credential_stuffing' | 'anomalous_location' | 'suspicious_pattern' | 'bot_behavior'
  confidence: number
  details: Record<string, any>
}

// ==================== PASSWORD SECURITY ====================

/**
 * Validate password against policy
 * OWASP compliant password validation
 */
export async function validatePassword(
  password: string,
  policyName: string = 'Default Healthcare Policy'
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  // Fetch password policy
  const { data: policy } = await supabaseAdmin
    .from('password_policies')
    .select('*')
    .eq('policy_name', policyName)
    .eq('is_active', true)
    .single()

  if (!policy) {
    return { valid: false, errors: ['Password policy not found'] }
  }

  // Length check
  if (password.length < policy.min_length) {
    errors.push(`Password must be at least ${policy.min_length} characters`)
  }

  // Uppercase check
  if (policy.require_uppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Lowercase check
  if (policy.require_lowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Number check
  if (policy.require_numbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Special character check
  if (policy.require_special_chars) {
    const specialCharsRegex = new RegExp(`[${policy.special_chars_set.replace(/[\[\]\\]/g, '\\$&')}]`)
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character')
    }
  }

  // Common password check
  if (policy.common_password_check) {
    const isCommon = await checkCommonPassword(password)
    if (isCommon) {
      errors.push('Password is too common. Please choose a more unique password')
    }
  }

  // Dictionary check
  if (policy.dictionary_check) {
    const isDictionaryWord = await checkDictionaryWord(password)
    if (isDictionaryWord) {
      errors.push('Password should not be a dictionary word')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Hash password with bcrypt
 * Uses cost factor 12 for healthcare compliance
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // HIPAA recommended
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password hash
 */
export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Check if password was previously used
 */
export async function checkPasswordHistory(
  userId: string,
  passwordHash: string
): Promise<boolean> {
  const { data: settings } = await supabaseAdmin
    .from('user_security_settings')
    .select('password_history')
    .eq('user_id', userId)
    .single()

  if (!settings?.password_history) return false

  const history = settings.password_history as string[]
  
  for (const oldHash of history) {
    if (await bcrypt.compare(passwordHash, oldHash)) {
      return true
    }
  }

  return false
}

// ==================== MULTI-FACTOR AUTHENTICATION ====================

/**
 * Generate TOTP secret for 2FA
 */
export function generateTOTPSecret(email: string): {
  secret: string
  qrCode: string
  backupCodes: string[]
} {
  const secret = authenticator.generateSecret()
  const appName = 'HMHCP Healthcare Platform'
  const qrCode = authenticator.keyuri(email, appName, secret)
  
  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  )

  return { secret, qrCode, backupCodes }
}

/**
 * Verify TOTP token
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  return authenticator.verify({
    token,
    secret
  })
}

/**
 * Enable MFA for user
 */
export async function enableMFA(
  userId: string,
  type: MFASettings['type'],
  secretData: any
): Promise<void> {
  // Encrypt secret data
  const encryptedSecret = encryptData(JSON.stringify(secretData))

  await supabaseAdmin
    .from('user_mfa_settings')
    .upsert({
      user_id: userId,
      mfa_enabled: true,
      mfa_type: type,
      secret_key: type === 'totp' ? encryptedSecret : null,
      phone_number: type === 'sms' ? secretData.phoneNumber : null,
      backup_codes: secretData.backupCodes ? encryptData(JSON.stringify(secretData.backupCodes)) : null,
      last_verified_at: new Date().toISOString()
    })
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Create secure session with device tracking
 */
export async function createSecureSession(
  userId: string,
  deviceInfo: {
    deviceId?: string
    deviceName?: string
    deviceType?: string
    browser?: string
    os?: string
    ipAddress: string
    userAgent: string
  },
  duration: number = 28800 // 8 hours default
): Promise<{ sessionToken: string; refreshToken: string; expiresAt: Date }> {
  // Generate secure tokens
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const refreshToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + duration * 1000)

  // Get location from IP
  const location = await getLocationFromIP(deviceInfo.ipAddress)

  // Store session
  await supabaseAdmin
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: hashToken(sessionToken),
      refresh_token: hashToken(refreshToken),
      device_id: deviceInfo.deviceId,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip_address: deviceInfo.ipAddress,
      location,
      expires_at: expiresAt.toISOString()
    })

  return { sessionToken, refreshToken, expiresAt }
}

/**
 * Validate session and check for anomalies
 */
export async function validateSession(
  sessionToken: string,
  currentIp: string
): Promise<{ valid: boolean; userId?: string; threats?: ThreatIndicator[] }> {
  const hashedToken = hashToken(sessionToken)
  
  const { data: session } = await supabaseAdmin
    .from('user_sessions')
    .select('*')
    .eq('session_token', hashedToken)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (!session) {
    return { valid: false }
  }

  // Check for IP changes (potential session hijacking)
  const threats: ThreatIndicator[] = []
  if (session.ip_address !== currentIp) {
    const ipThreat = await analyzeIPChange(session.ip_address, currentIp, session.location)
    if (ipThreat) threats.push(ipThreat)
  }

  // Update last activity
  await supabaseAdmin
    .from('user_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', session.id)

  return {
    valid: true,
    userId: session.user_id,
    threats: threats.length > 0 ? threats : undefined
  }
}

// ==================== THREAT DETECTION ====================

/**
 * Detect and analyze login threats
 */
export async function detectLoginThreats(
  email: string,
  ipAddress: string,
  userAgent: string,
  deviceFingerprint?: string
): Promise<{ riskScore: number; threats: ThreatIndicator[]; shouldBlock: boolean }> {
  const threats: ThreatIndicator[] = []
  let riskScore = 0

  // Check recent failed attempts (brute force detection)
  const { data: recentAttempts } = await supabaseAdmin
    .from('security_login_attempts')
    .select('*')
    .eq('email', email)
    .eq('success', false)
    .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
    .order('created_at', { ascending: false })

  if (recentAttempts && recentAttempts.length >= 3) {
    threats.push({
      type: 'brute_force',
      confidence: Math.min(recentAttempts.length * 20, 100),
      details: { attemptCount: recentAttempts.length }
    })
    riskScore += recentAttempts.length * 15
  }

  // Check for credential stuffing patterns
  const { data: ipAttempts } = await supabaseAdmin
    .from('security_login_attempts')
    .select('email')
    .eq('ip_address', ipAddress)
    .eq('success', false)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour

  const uniqueEmails = new Set(ipAttempts?.map((a: any) => a.email) || [])
  if (uniqueEmails.size >= 5) {
    threats.push({
      type: 'credential_stuffing',
      confidence: Math.min(uniqueEmails.size * 15, 100),
      details: { targetCount: uniqueEmails.size }
    })
    riskScore += uniqueEmails.size * 10
  }

  // Check for bot patterns
  if (userAgent && isSuspiciousUserAgent(userAgent)) {
    threats.push({
      type: 'bot_behavior',
      confidence: 75,
      details: { userAgent }
    })
    riskScore += 30
  }

  // Check for anomalous location
  const location = await getLocationFromIP(ipAddress)
  if (location?.riskScore && location.riskScore > 50) {
    threats.push({
      type: 'anomalous_location',
      confidence: location.riskScore,
      details: { location }
    })
    riskScore += location.riskScore / 2
  }

  return {
    riskScore: Math.min(riskScore, 100),
    threats,
    shouldBlock: riskScore >= 80
  }
}

/**
 * Log security incident
 */
export async function logSecurityIncident(
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  userId?: string,
  description?: string,
  affectedResources?: any
): Promise<void> {
  await supabaseAdmin
    .from('security_incidents')
    .insert({
      incident_type: type,
      severity,
      user_id: userId,
      description,
      detection_method: 'automated',
      affected_resources: affectedResources,
      status: 'detected'
    })
}

// ==================== AUDIT LOGGING ====================

/**
 * Comprehensive audit logging for HIPAA compliance
 */
export async function logAuditEvent(
  context: SecurityContext,
  action: {
    type: string
    category: 'auth' | 'data_access' | 'admin_action' | 'security_event'
    resourceType?: string
    resourceId?: string
    details?: any
    riskLevel?: 'low' | 'medium' | 'high' | 'critical'
    patientDataAccessed?: boolean
    phiInvolved?: boolean
  }
): Promise<void> {
  const startTime = Date.now()

  try {
    await supabaseAdmin
      .from('security_audit_logs')
      .insert({
        user_id: context.userId,
        session_id: context.sessionId,
        action_type: action.type,
        action_category: action.category,
        resource_type: action.resourceType,
        resource_id: action.resourceId,
        details: action.details,
        risk_level: action.riskLevel || 'low',
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        patient_data_accessed: action.patientDataAccessed || false,
        phi_involved: action.phiInvolved || false,
        execution_time_ms: Date.now() - startTime
      })

    // Update user activity analytics
    await updateUserActivityAnalytics(context.userId, action.category)
  } catch (error) {
    console.error('Audit logging failed:', error)
    // Critical: audit logging must not fail silently in healthcare
    await logSecurityIncident(
      'audit_log_failure',
      'critical',
      context.userId,
      `Failed to log audit event: ${action.type}`,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

// ==================== ACCESS CONTROL ====================

/**
 * Check granular permissions
 */
export async function checkPermission(
  userId: string,
  permissionCode: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  // Check direct user permissions
  const { data: userPermission } = await supabaseAdmin
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('permission_code', permissionCode)
    .eq('is_active', true)
    .single()

  if (userPermission) {
    // Check if permission is expired
    if (userPermission.expires_at && new Date(userPermission.expires_at) < new Date()) {
      return false
    }

    // Check resource-specific permission
    if (resourceType && userPermission.resource_type !== resourceType) {
      return false
    }

    if (resourceId && userPermission.resource_id !== resourceId) {
      return false
    }

    return true
  }

  // Check role-based permissions
  const { data: user } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!user) return false

  const { data: role } = await supabaseAdmin
    .from('rbac_roles')
    .select('id')
    .eq('role_code', user.role)
    .single()

  if (!role) return false

  const { data: rolePermission } = await supabaseAdmin
    .from('rbac_role_permissions')
    .select('*')
    .eq('role_id', role.id)
    .eq('permission_code', permissionCode)
    .single()

  return !!rolePermission
}

/**
 * Request data access with justification (HIPAA requirement)
 */
export async function requestDataAccess(
  userId: string,
  request: {
    type: string
    resourceType: string
    resourceId?: string
    patientId?: string
    purpose: string
    justification: string
    duration?: number // hours
  }
): Promise<string> {
  const expiresAt = request.duration
    ? new Date(Date.now() + request.duration * 60 * 60 * 1000)
    : undefined

  const { data } = await supabaseAdmin
    .from('data_access_requests')
    .insert({
      user_id: userId,
      request_type: request.type,
      resource_type: request.resourceType,
      resource_id: request.resourceId,
      patient_id: request.patientId,
      purpose: request.purpose,
      justification: request.justification,
      expires_at: expiresAt?.toISOString(),
      approval_status: 'pending'
    })
    .select('id')
    .single()

  return data!.id
}

// ==================== HELPER FUNCTIONS ====================

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function encryptData(data: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

function decryptData(encryptedData: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex')
  
  const parts = encryptedData.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

async function checkCommonPassword(password: string): Promise<boolean> {
  // In production, check against a database of common passwords
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'letmein',
    'qwerty', 'abc123', 'monkey', 'dragon', 'master'
  ]
  return commonPasswords.includes(password.toLowerCase())
}

async function checkDictionaryWord(password: string): Promise<boolean> {
  // In production, check against a dictionary API or database
  // For now, simple check for very common words
  const commonWords = ['password', 'admin', 'user', 'test', 'demo']
  return commonWords.some(word => password.toLowerCase().includes(word))
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ]
  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

async function getLocationFromIP(ipAddress: string): Promise<any> {
  // In production, use a geolocation service
  // For now, return mock data
  return {
    country: 'US',
    city: 'Unknown',
    riskScore: 0
  }
}

async function analyzeIPChange(
  oldIp: string,
  newIp: string,
  oldLocation: any
): Promise<ThreatIndicator | null> {
  const newLocation = await getLocationFromIP(newIp)
  
  // Check if countries are different (potential account takeover)
  if (oldLocation?.country !== newLocation?.country) {
    return {
      type: 'anomalous_location',
      confidence: 80,
      details: {
        oldLocation,
        newLocation,
        message: 'Session accessed from different country'
      }
    }
  }
  
  return null
}

async function updateUserActivityAnalytics(
  userId: string,
  actionCategory: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  const updates: any = {
    user_id: userId,
    activity_date: today
  }
  
  switch (actionCategory) {
    case 'auth':
      updates.login_count = 1
      break
    case 'data_access':
      updates.data_access_count = 1
      break
    case 'security_event':
      updates.security_events_count = 1
      break
    default:
      updates.api_calls_count = 1
  }
  
  await supabaseAdmin
    .from('user_activity_analytics')
    .upsert(updates, {
      onConflict: 'user_id,activity_date',
      count: 'exact'
    })
}

// ==================== COMPLIANCE ====================

/**
 * Generate HIPAA compliance report
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date,
  reportType: 'HIPAA' | 'SOC2' | 'GDPR'
): Promise<any> {
  // Fetch audit logs
  const { data: auditLogs } = await supabaseAdmin
    .from('security_audit_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('phi_involved', true)

  // Fetch security incidents
  const { data: incidents } = await supabaseAdmin
    .from('security_incidents')
    .select('*')
    .gte('detected_at', startDate.toISOString())
    .lte('detected_at', endDate.toISOString())

  // Analyze data access patterns
  const { data: dataAccess } = await supabaseAdmin
    .from('data_access_requests')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const report = {
    period: { start: startDate, end: endDate },
    type: reportType,
    summary: {
      totalAuditEvents: auditLogs?.length || 0,
      phiAccessEvents: auditLogs?.filter((l: any) => l.phi_involved).length || 0,
      securityIncidents: incidents?.length || 0,
      criticalIncidents: incidents?.filter((i: any) => i.severity === 'critical').length || 0,
      dataAccessRequests: dataAccess?.length || 0,
      approvedRequests: dataAccess?.filter((d: any) => d.approval_status === 'approved').length || 0
    },
    findings: [] as any[],
    recommendations: [] as any[],
    timestamp: new Date()
  }

  // Add specific findings based on report type
  if (reportType === 'HIPAA') {
    // Check for unauthorized PHI access
    const unauthorizedAccess = auditLogs?.filter(
      (log: any) => log.phi_involved && !log.patient_data_accessed
    )
    if (unauthorizedAccess?.length) {
      report.findings.push({
        severity: 'high',
        category: 'unauthorized_access',
        count: unauthorizedAccess.length,
        description: 'Potential unauthorized PHI access detected'
      })
    }

    // Check for missing audit logs
    const missingAudits = await checkMissingAuditLogs(startDate, endDate)
    if (missingAudits.length > 0) {
      report.findings.push({
        severity: 'critical',
        category: 'audit_gap',
        count: missingAudits.length,
        description: 'Gaps in audit logging detected'
      })
    }
  }

  return report
}

async function checkMissingAuditLogs(
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  // Check for gaps in audit logging
  // In production, implement sophisticated gap detection
  return []
}

export default {
  validatePassword,
  hashPassword,
  verifyPasswordHash,
  checkPasswordHistory,
  generateTOTPSecret,
  verifyTOTPToken,
  enableMFA,
  createSecureSession,
  validateSession,
  detectLoginThreats,
  logSecurityIncident,
  logAuditEvent,
  checkPermission,
  requestDataAccess,
  generateComplianceReport
}