/**
 * IP-Based Access Controls and Monitoring
 * Advanced IP reputation, geolocation, and access control system
 * 
 * Story 1.6 Task 5: Admin Activity Monitoring & Threat Detection
 */

import { HIPAAAuditLogger, AuditEventType, AuditSeverity } from './audit-logging'
import { createDALClient } from '@/lib/dal/dal-client'

// IP Access Control Configuration
export interface IPAccessConfig {
  // Whitelist/Blacklist
  enable_ip_whitelist: boolean
  enable_ip_blacklist: boolean
  default_policy: 'allow' | 'deny'
  
  // Geographic restrictions
  enable_geo_restrictions: boolean
  allowed_countries: string[]
  blocked_countries: string[]
  allowed_regions: string[]
  blocked_regions: string[]
  
  // Rate limiting
  requests_per_minute: number
  requests_per_hour: number
  burst_limit: number
  
  // Reputation scoring
  enable_reputation_check: boolean
  reputation_threshold: number // 0-100
  block_on_bad_reputation: boolean
  
  // VPN/Proxy detection
  enable_vpn_detection: boolean
  block_vpn_access: boolean
  allow_datacenter_ips: boolean
  
  // Healthcare-specific controls
  healthcare_ip_restrictions: boolean
  require_facility_ip_for_phi: boolean
  facility_ip_ranges: string[]
}

export const DEFAULT_IP_CONFIG: IPAccessConfig = {
  enable_ip_whitelist: false,
  enable_ip_blacklist: true,
  default_policy: 'allow',
  
  enable_geo_restrictions: false,
  allowed_countries: [],
  blocked_countries: ['CN', 'RU', 'KP', 'IR'], // High-risk countries
  allowed_regions: [],
  blocked_regions: [],
  
  requests_per_minute: 100,
  requests_per_hour: 1000,
  burst_limit: 20,
  
  enable_reputation_check: true,
  reputation_threshold: 20,
  block_on_bad_reputation: false,
  
  enable_vpn_detection: true,
  block_vpn_access: false,
  allow_datacenter_ips: false,
  
  healthcare_ip_restrictions: true,
  require_facility_ip_for_phi: false,
  facility_ip_ranges: ['10.0.0.0/8', '192.168.0.0/16', '172.16.0.0/12']
}

// IP Information and Analysis
export interface IPInfo {
  ip_address: string
  country: string
  country_code: string
  region: string
  city: string
  isp: string
  organization: string
  as_number: number
  as_name: string
  is_vpn: boolean
  is_proxy: boolean
  is_tor: boolean
  is_datacenter: boolean
  is_mobile: boolean
  is_satellite: boolean
  threat_types: string[]
  reputation_score: number // 0-100, higher = more suspicious
  last_seen: Date
  first_seen: Date
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface IPAccessResult {
  allowed: boolean
  reason?: string
  risk_score: number
  actions_taken: string[]
  rate_limit_status: {
    remaining_requests: number
    reset_time: Date
    limited: boolean
  }
  geo_info?: IPInfo
  recommendations: string[]
}

// IP-based access violations
export enum IPViolationType {
  BLACKLISTED_IP = 'blacklisted_ip',
  GEO_RESTRICTED = 'geo_restricted',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  BAD_REPUTATION = 'bad_reputation',
  VPN_BLOCKED = 'vpn_blocked',
  DATACENTER_BLOCKED = 'datacenter_blocked',
  PHI_ACCESS_UNAUTHORIZED = 'phi_access_unauthorized',
  SUSPICIOUS_PATTERN = 'suspicious_pattern'
}

/**
 * IP-based access control and monitoring system
 */
export class IPAccessMonitor {
  private config: IPAccessConfig
  private auditLogger: HIPAAAuditLogger
  private supabase: ReturnType<typeof createDALClient>
  private ipInfoCache: Map<string, IPInfo> = new Map()
  private rateLimiters: Map<string, RateLimitCounter> = new Map()
  private whitelistedIPs: Set<string> = new Set()
  private blacklistedIPs: Set<string> = new Set()

  constructor(config: IPAccessConfig = DEFAULT_IP_CONFIG) {
    this.config = config
    this.auditLogger = new HIPAAAuditLogger()
    this.supabase = createDALClient()
    this.initializeIPLists()
  }

  /**
   * Check IP access permissions and restrictions
   */
  async checkIPAccess(
    ipAddress: string, 
    userId?: string, 
    healthcareContext: boolean = false
  ): Promise<IPAccessResult> {
    try {
      const result: IPAccessResult = {
        allowed: true,
        risk_score: 0,
        actions_taken: [],
        rate_limit_status: {
          remaining_requests: this.config.requests_per_minute,
          reset_time: new Date(Date.now() + 60000),
          limited: false
        },
        recommendations: []
      }

      // 1. Check whitelist/blacklist
      const listCheckResult = await this.checkIPLists(ipAddress)
      if (!listCheckResult.allowed) {
        result.allowed = false
        result.reason = listCheckResult.reason
        result.risk_score += 50
        result.actions_taken.push('ip_blocked_by_list')
        return result
      }

      // 2. Get IP information and reputation
      const ipInfo = await this.getIPInfo(ipAddress)
      result.geo_info = ipInfo
      result.risk_score += this.calculateRiskScore(ipInfo)

      // 3. Check geographic restrictions
      if (this.config.enable_geo_restrictions) {
        const geoResult = this.checkGeographicRestrictions(ipInfo)
        if (!geoResult.allowed) {
          result.allowed = false
          result.reason = geoResult.reason
          result.risk_score += 30
          result.actions_taken.push('geo_blocked')
          await this.logIPViolation(ipAddress, IPViolationType.GEO_RESTRICTED, userId, ipInfo)
          return result
        }
      }

      // 4. Check reputation score
      if (this.config.enable_reputation_check && ipInfo.reputation_score >= this.config.reputation_threshold) {
        result.risk_score += 25
        result.recommendations.push('Monitor for suspicious activity')
        
        if (this.config.block_on_bad_reputation) {
          result.allowed = false
          result.reason = `Bad IP reputation score: ${ipInfo.reputation_score}`
          result.actions_taken.push('reputation_blocked')
          await this.logIPViolation(ipAddress, IPViolationType.BAD_REPUTATION, userId, ipInfo)
          return result
        }
      }

      // 5. Check VPN/Proxy detection
      if (this.config.enable_vpn_detection) {
        if (ipInfo.is_vpn || ipInfo.is_proxy || ipInfo.is_tor) {
          result.risk_score += 20
          result.recommendations.push('VPN/Proxy detected - enhanced monitoring recommended')
          
          if (this.config.block_vpn_access) {
            result.allowed = false
            result.reason = 'VPN/Proxy access blocked'
            result.actions_taken.push('vpn_blocked')
            await this.logIPViolation(ipAddress, IPViolationType.VPN_BLOCKED, userId, ipInfo)
            return result
          }
        }

        if (ipInfo.is_datacenter && !this.config.allow_datacenter_ips) {
          result.risk_score += 15
          result.recommendations.push('Datacenter IP detected')
        }
      }

      // 6. Check healthcare-specific restrictions
      if (healthcareContext && this.config.healthcare_ip_restrictions) {
        const healthcareResult = this.checkHealthcareRestrictions(ipAddress, ipInfo)
        if (!healthcareResult.allowed) {
          result.allowed = false
          result.reason = healthcareResult.reason
          result.risk_score += 40
          result.actions_taken.push('healthcare_policy_blocked')
          await this.logIPViolation(ipAddress, IPViolationType.PHI_ACCESS_UNAUTHORIZED, userId, ipInfo)
          return result
        }
      }

      // 7. Check rate limiting
      const rateLimitResult = await this.checkRateLimit(ipAddress)
      result.rate_limit_status = rateLimitResult
      
      if (rateLimitResult.limited) {
        result.allowed = false
        result.reason = 'Rate limit exceeded'
        result.actions_taken.push('rate_limited')
        await this.logIPViolation(ipAddress, IPViolationType.RATE_LIMIT_EXCEEDED, userId, ipInfo)
        return result
      }

      // 8. Check for suspicious patterns
      const patternResult = await this.checkSuspiciousPatterns(ipAddress, userId)
      if (patternResult.suspicious) {
        result.risk_score += patternResult.score
        result.recommendations.push(...patternResult.recommendations)
        
        if (patternResult.score >= 50) {
          result.allowed = false
          result.reason = 'Suspicious activity pattern detected'
          result.actions_taken.push('pattern_blocked')
          await this.logIPViolation(ipAddress, IPViolationType.SUSPICIOUS_PATTERN, userId, ipInfo)
        }
      }

      // Log successful access
      if (result.allowed && (result.risk_score > 20 || healthcareContext)) {
        await this.auditLogger.logEvent({
          event_type: AuditEventType.DATA_ACCESS,
          user_id: userId || 'anonymous',
          severity: result.risk_score > 50 ? AuditSeverity.WARNING : AuditSeverity.INFO,
          resource_type: 'ip_access_control',
          action_performed: 'ip_access_granted',
          metadata: {
            ip_address: ipAddress,
            risk_score: result.risk_score,
            healthcare_context: healthcareContext,
            geo_info: {
              country: ipInfo.country_code,
              region: ipInfo.region,
              is_vpn: ipInfo.is_vpn,
              reputation_score: ipInfo.reputation_score
            },
            recommendations: result.recommendations
          },
          ip_address: ipAddress
        })
      }

      return result

    } catch (error) {
      console.error('IP access check error:', error)
      
      // Log error
      await this.auditLogger.logEvent({
        event_type: AuditEventType.SYSTEM_ERROR,
        user_id: userId || 'system',
        severity: AuditSeverity.ERROR,
        resource_type: 'ip_access_control',
        action_performed: 'ip_access_check_failed',
        metadata: {
          ip_address: ipAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        ip_address: ipAddress
      })

      // Fail open with high risk score
      return {
        allowed: this.config.default_policy === 'allow',
        reason: 'Error during IP check - defaulting to configured policy',
        risk_score: 75,
        actions_taken: ['error_fallback'],
        rate_limit_status: {
          remaining_requests: 0,
          reset_time: new Date(),
          limited: false
        },
        recommendations: ['System error occurred - manual review recommended']
      }
    }
  }

  /**
   * Get comprehensive IP information
   */
  private async getIPInfo(ipAddress: string): Promise<IPInfo> {
    try {
      // Check cache first
      const cached = this.ipInfoCache.get(ipAddress)
      if (cached && (Date.now() - cached.last_seen.getTime()) < 24 * 60 * 60 * 1000) { // 24 hour cache
        return cached
      }

      // Check database cache
      const { data: dbInfo } = await this.supabase
        .from('ip_information_cache')
        .select('*')
        .eq('ip_address', ipAddress)
        .single()

      if (dbInfo && (Date.now() - new Date(dbInfo.last_updated).getTime()) < 24 * 60 * 60 * 1000) {
        const ipInfo: IPInfo = {
          ip_address: ipAddress,
          country: dbInfo.country,
          country_code: dbInfo.country_code,
          region: dbInfo.region,
          city: dbInfo.city,
          isp: dbInfo.isp,
          organization: dbInfo.organization,
          as_number: dbInfo.as_number,
          as_name: dbInfo.as_name,
          is_vpn: dbInfo.is_vpn,
          is_proxy: dbInfo.is_proxy,
          is_tor: dbInfo.is_tor,
          is_datacenter: dbInfo.is_datacenter,
          is_mobile: dbInfo.is_mobile,
          is_satellite: dbInfo.is_satellite,
          threat_types: dbInfo.threat_types || [],
          reputation_score: dbInfo.reputation_score,
          last_seen: new Date(),
          first_seen: new Date(dbInfo.first_seen),
          coordinates: dbInfo.coordinates
        }

        this.ipInfoCache.set(ipAddress, ipInfo)
        return ipInfo
      }

      // Fetch new IP information
      const ipInfo = await this.fetchIPInformation(ipAddress)
      
      // Cache in memory and database
      this.ipInfoCache.set(ipAddress, ipInfo)
      await this.storeIPInfo(ipInfo)

      return ipInfo

    } catch (error) {
      console.error('IP info fetch error:', error)
      
      // Return minimal info for private/local IPs
      return {
        ip_address: ipAddress,
        country: this.isPrivateIP(ipAddress) ? 'Private' : 'Unknown',
        country_code: this.isPrivateIP(ipAddress) ? 'XX' : 'UN',
        region: 'Unknown',
        city: 'Unknown',
        isp: 'Unknown',
        organization: 'Unknown',
        as_number: 0,
        as_name: 'Unknown',
        is_vpn: false,
        is_proxy: false,
        is_tor: false,
        is_datacenter: this.isPrivateIP(ipAddress),
        is_mobile: false,
        is_satellite: false,
        threat_types: [],
        reputation_score: this.isPrivateIP(ipAddress) ? 0 : 10,
        last_seen: new Date(),
        first_seen: new Date()
      }
    }
  }

  /**
   * Fetch IP information from external services
   */
  private async fetchIPInformation(ipAddress: string): Promise<IPInfo> {
    // In production, this would integrate with services like:
    // - MaxMind GeoIP
    // - IPinfo.io
    // - AbuseIPDB
    // - VirusTotal
    // - Shodan

    // Mock implementation for demonstration
    const isPrivate = this.isPrivateIP(ipAddress)
    
    return {
      ip_address: ipAddress,
      country: isPrivate ? 'Private Network' : 'United States',
      country_code: isPrivate ? 'XX' : 'US',
      region: isPrivate ? 'Private' : 'California',
      city: isPrivate ? 'Private' : 'San Francisco',
      isp: isPrivate ? 'Private Network' : 'Example ISP',
      organization: isPrivate ? 'Private Organization' : 'Example Org',
      as_number: isPrivate ? 0 : 12345,
      as_name: isPrivate ? 'Private AS' : 'EXAMPLE-AS',
      is_vpn: false,
      is_proxy: false,
      is_tor: false,
      is_datacenter: isPrivate,
      is_mobile: false,
      is_satellite: false,
      threat_types: [],
      reputation_score: isPrivate ? 0 : Math.random() * 30, // Most IPs have low scores
      last_seen: new Date(),
      first_seen: new Date(),
      coordinates: isPrivate ? undefined : {
        latitude: 37.7749,
        longitude: -122.4194
      }
    }
  }

  /**
   * Store IP information in database cache
   */
  private async storeIPInfo(ipInfo: IPInfo): Promise<void> {
    try {
      await this.supabase
        .from('ip_information_cache')
        .upsert([{
          ip_address: ipInfo.ip_address,
          country: ipInfo.country,
          country_code: ipInfo.country_code,
          region: ipInfo.region,
          city: ipInfo.city,
          isp: ipInfo.isp,
          organization: ipInfo.organization,
          as_number: ipInfo.as_number,
          as_name: ipInfo.as_name,
          is_vpn: ipInfo.is_vpn,
          is_proxy: ipInfo.is_proxy,
          is_tor: ipInfo.is_tor,
          is_datacenter: ipInfo.is_datacenter,
          is_mobile: ipInfo.is_mobile,
          is_satellite: ipInfo.is_satellite,
          threat_types: ipInfo.threat_types,
          reputation_score: ipInfo.reputation_score,
          coordinates: ipInfo.coordinates,
          first_seen: ipInfo.first_seen.toISOString(),
          last_updated: new Date().toISOString()
        }])
    } catch (error) {
      console.error('Error storing IP info:', error)
    }
  }

  /**
   * Check IP whitelist and blacklist
   */
  private async checkIPLists(ipAddress: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check whitelist first (if enabled)
    if (this.config.enable_ip_whitelist && this.whitelistedIPs.size > 0) {
      if (!this.whitelistedIPs.has(ipAddress) && !this.isInSubnet(ipAddress, Array.from(this.whitelistedIPs))) {
        return { 
          allowed: false, 
          reason: 'IP not in whitelist' 
        }
      }
    }

    // Check blacklist
    if (this.config.enable_ip_blacklist) {
      if (this.blacklistedIPs.has(ipAddress) || this.isInSubnet(ipAddress, Array.from(this.blacklistedIPs))) {
        return { 
          allowed: false, 
          reason: 'IP is blacklisted' 
        }
      }

      // Check dynamic blacklist from recent violations
      const { data: violations } = await this.supabase
        .from('ip_access_violations')
        .select('ip_address')
        .eq('ip_address', ipAddress)
        .eq('auto_blocked', true)
        .gt('blocked_until', new Date().toISOString())

      if (violations && violations.length > 0) {
        return { 
          allowed: false, 
          reason: 'IP is temporarily blocked due to violations' 
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Check geographic restrictions
   */
  private checkGeographicRestrictions(ipInfo: IPInfo): { allowed: boolean; reason?: string } {
    // Check blocked countries
    if (this.config.blocked_countries.includes(ipInfo.country_code)) {
      return { 
        allowed: false, 
        reason: `Access blocked from country: ${ipInfo.country}` 
      }
    }

    // Check allowed countries (if specified)
    if (this.config.allowed_countries.length > 0 && !this.config.allowed_countries.includes(ipInfo.country_code)) {
      return { 
        allowed: false, 
        reason: `Access only allowed from specified countries` 
      }
    }

    // Check blocked regions
    if (this.config.blocked_regions.includes(ipInfo.region)) {
      return { 
        allowed: false, 
        reason: `Access blocked from region: ${ipInfo.region}` 
      }
    }

    // Check allowed regions (if specified)
    if (this.config.allowed_regions.length > 0 && !this.config.allowed_regions.includes(ipInfo.region)) {
      return { 
        allowed: false, 
        reason: `Access only allowed from specified regions` 
      }
    }

    return { allowed: true }
  }

  /**
   * Check healthcare-specific IP restrictions
   */
  private checkHealthcareRestrictions(ipAddress: string, ipInfo: IPInfo): { allowed: boolean; reason?: string } {
    if (!this.config.healthcare_ip_restrictions) {
      return { allowed: true }
    }

    // Check if PHI access requires facility IP
    if (this.config.require_facility_ip_for_phi) {
      const isFromFacility = this.config.facility_ip_ranges.some(range => 
        this.isInSubnet(ipAddress, [range])
      )

      if (!isFromFacility) {
        return { 
          allowed: false, 
          reason: 'PHI access requires connection from authorized healthcare facility' 
        }
      }
    }

    // Additional healthcare checks (e.g., known healthcare networks)
    // This would integrate with healthcare network databases in production

    return { allowed: true }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(ipAddress: string): Promise<{
    remaining_requests: number
    reset_time: Date
    limited: boolean
  }> {
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute window

    let counter = this.rateLimiters.get(ipAddress)
    if (!counter) {
      counter = {
        requests: 0,
        windowStart: now,
        burst: 0,
        burstStart: now
      }
      this.rateLimiters.set(ipAddress, counter)
    }

    // Reset window if expired
    if (now - counter.windowStart > windowMs) {
      counter.requests = 0
      counter.windowStart = now
    }

    // Reset burst if expired
    if (now - counter.burstStart > 10000) { // 10 second burst window
      counter.burst = 0
      counter.burstStart = now
    }

    counter.requests++
    counter.burst++

    const remaining = Math.max(0, this.config.requests_per_minute - counter.requests)
    const resetTime = new Date(counter.windowStart + windowMs)
    const limited = counter.requests > this.config.requests_per_minute || 
                    counter.burst > this.config.burst_limit

    return {
      remaining_requests: remaining,
      reset_time: resetTime,
      limited
    }
  }

  /**
   * Check for suspicious patterns
   */
  private async checkSuspiciousPatterns(ipAddress: string, userId?: string): Promise<{
    suspicious: boolean
    score: number
    recommendations: string[]
  }> {
    let score = 0
    const recommendations: string[] = []

    try {
      // Check recent activity from this IP
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      const { data: recentActivity } = await this.supabase
        .from('session_activities')
        .select('*')
        .eq('ip_address', ipAddress)
        .gte('timestamp', oneHourAgo.toISOString())

      if (recentActivity && recentActivity.length > 0) {
        // Check for multiple user access from same IP
        const uniqueUsers = new Set(recentActivity.map(a => a.user_id))
        if (uniqueUsers.size > 3) {
          score += 20
          recommendations.push('Multiple users from same IP detected')
        }

        // Check for rapid session creation
        if (recentActivity.length > 50) {
          score += 25
          recommendations.push('High activity volume detected')
        }

        // Check for healthcare data access patterns
        const healthcareAccess = recentActivity.filter(a => a.healthcare_context)
        if (healthcareAccess.length > 20) {
          score += 30
          recommendations.push('Excessive healthcare data access detected')
        }
      }

      // Check violation history
      const { data: violations } = await this.supabase
        .from('ip_access_violations')
        .select('*')
        .eq('ip_address', ipAddress)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

      if (violations && violations.length > 0) {
        score += violations.length * 10
        recommendations.push(`${violations.length} recent violations detected`)
      }

    } catch (error) {
      console.error('Error checking suspicious patterns:', error)
    }

    return {
      suspicious: score >= 30,
      score,
      recommendations
    }
  }

  /**
   * Calculate risk score based on IP information
   */
  private calculateRiskScore(ipInfo: IPInfo): number {
    let score = 0

    // Base reputation score
    score += ipInfo.reputation_score * 0.5

    // VPN/Proxy/Tor detection
    if (ipInfo.is_tor) score += 30
    if (ipInfo.is_proxy) score += 15
    if (ipInfo.is_vpn) score += 10

    // Datacenter IPs are slightly more suspicious
    if (ipInfo.is_datacenter) score += 5

    // Threat types
    score += ipInfo.threat_types.length * 10

    // Geographic factors (simplified)
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY']
    if (highRiskCountries.includes(ipInfo.country_code)) {
      score += 20
    }

    return Math.min(100, score) // Cap at 100
  }

  /**
   * Log IP access violation
   */
  private async logIPViolation(
    ipAddress: string,
    violationType: IPViolationType,
    userId?: string,
    ipInfo?: IPInfo
  ): Promise<void> {
    try {
      await this.supabase
        .from('ip_access_violations')
        .insert([{
          ip_address: ipAddress,
          user_id: userId,
          violation_type: violationType,
          ip_info: ipInfo,
          auto_blocked: ['blacklisted_ip', 'geo_restricted', 'vpn_blocked'].includes(violationType),
          blocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          created_at: new Date().toISOString()
        }])

      await this.auditLogger.logEvent({
        event_type: AuditEventType.SECURITY_VIOLATION,
        user_id: userId || 'anonymous',
        severity: AuditSeverity.WARNING,
        resource_type: 'ip_access_control',
        action_performed: 'ip_access_violation',
        metadata: {
          violation_type: violationType,
          ip_address: ipAddress,
          geo_info: ipInfo ? {
            country: ipInfo.country_code,
            region: ipInfo.region,
            is_vpn: ipInfo.is_vpn,
            reputation_score: ipInfo.reputation_score
          } : undefined
        },
        ip_address: ipAddress
      })

    } catch (error) {
      console.error('Error logging IP violation:', error)
    }
  }

  /**
   * Initialize IP lists from database
   */
  private async initializeIPLists(): Promise<void> {
    try {
      // Load whitelist
      const { data: whitelistData } = await this.supabase
        .from('ip_access_lists')
        .select('*')
        .eq('list_type', 'whitelist')
        .eq('is_active', true)

      if (whitelistData) {
        whitelistData.forEach(item => {
          this.whitelistedIPs.add(item.ip_address)
        })
      }

      // Load blacklist
      const { data: blacklistData } = await this.supabase
        .from('ip_access_lists')
        .select('*')
        .eq('list_type', 'blacklist')
        .eq('is_active', true)

      if (blacklistData) {
        blacklistData.forEach(item => {
          this.blacklistedIPs.add(item.ip_address)
        })
      }

    } catch (error) {
      console.error('Error initializing IP lists:', error)
    }
  }

  /**
   * Utility methods
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^127\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
      /^fd00:/
    ]

    return privateRanges.some(pattern => pattern.test(ip))
  }

  private isInSubnet(ip: string, subnets: string[]): boolean {
    // Simplified subnet checking - in production would use proper CIDR matching
    return subnets.some(subnet => {
      if (subnet.includes('/')) {
        // CIDR notation - simplified check
        const [network] = subnet.split('/')
        return ip.startsWith(network.split('.').slice(0, -1).join('.'))
      }
      return ip === subnet
    })
  }

  /**
   * Get IP monitoring statistics
   */
  async getIPStatistics(): Promise<any> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const { data: violations } = await this.supabase
        .from('ip_access_violations')
        .select('*')
        .gte('created_at', twentyFourHoursAgo.toISOString())

      const { data: uniqueIPs } = await this.supabase
        .from('session_activities')
        .select('ip_address')
        .gte('timestamp', twentyFourHoursAgo.toISOString())

      const stats = {
        total_violations_24h: violations?.length || 0,
        violations_by_type: {},
        unique_ips_24h: uniqueIPs ? new Set(uniqueIPs.map(i => i.ip_address)).size : 0,
        blocked_ips: violations?.filter(v => v.auto_blocked).length || 0,
        whitelist_size: this.whitelistedIPs.size,
        blacklist_size: this.blacklistedIPs.size,
        cache_size: this.ipInfoCache.size,
        rate_limiters_active: this.rateLimiters.size
      }

      // Group violations by type
      violations?.forEach(violation => {
        stats.violations_by_type[violation.violation_type] = 
          (stats.violations_by_type[violation.violation_type] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error getting IP statistics:', error)
      return {
        total_violations_24h: 0,
        violations_by_type: {},
        unique_ips_24h: 0,
        blocked_ips: 0,
        whitelist_size: 0,
        blacklist_size: 0,
        cache_size: 0,
        rate_limiters_active: 0
      }
    }
  }
}

// Rate limit counter interface
interface RateLimitCounter {
  requests: number
  windowStart: number
  burst: number
  burstStart: number
}

// Export the IP access monitor
export default IPAccessMonitor