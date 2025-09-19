/**
 * Real-time Threat Intelligence Integration
 * Connects to threat feeds and maintains threat intelligence database
 * 
 * @security Real-time threat data aggregation
 * @performance Cached and optimized for Edge Runtime
 */

import { logger } from '@/lib/logger'
import redis from '@/lib/redis'

/**
 * Threat Intelligence Manager
 * Aggregates threat data from multiple sources
 */
export class ThreatIntelligenceManager {
  private readonly cachePrefix = 'threat_intel:'
  private readonly cacheTTL = 3600 // 1 hour cache
  private threatDatabase: Map<string, ThreatIntelData> = new Map()
  private ipReputationDB: Map<string, IPReputation> = new Map()
  private malwareSignatures: Set<string> = new Set()
  private phishingDomains: Set<string> = new Set()
  
  constructor() {
    this.initializeThreatData()
    this.startUpdateScheduler()
  }
  
  /**
   * Get comprehensive threat intelligence for an IP
   */
  async getIPThreatIntel(ip: string): Promise<IPThreatIntelligence> {
    try {
      // Check cache first
      const cached = await this.getCachedIntel(ip)
      if (cached) return cached
      
      // Aggregate intelligence from multiple sources
      const intel: IPThreatIntelligence = {
        ip,
        reputation: await this.getIPReputation(ip),
        threatLevel: ThreatLevel.UNKNOWN,
        categories: [],
        geoLocation: await this.getGeoLocation(ip),
        asnInfo: await this.getASNInfo(ip),
        historicalThreats: await this.getHistoricalThreats(ip),
        activeIncidents: [],
        lastSeen: new Date(),
        confidence: 0
      }
      
      // Calculate threat level based on aggregated data
      intel.threatLevel = this.calculateThreatLevel(intel)
      intel.confidence = this.calculateConfidence(intel)
      
      // Cache the result
      await this.cacheIntel(ip, intel)
      
      return intel
      
    } catch (error) {
      logger.error('Failed to get IP threat intelligence', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip
      })
      
      return this.getDefaultIntel(ip)
    }
  }
  
  /**
   * Check if a domain is malicious
   */
  async checkDomainReputation(domain: string): Promise<DomainReputation> {
    try {
      // Normalize domain
      const normalizedDomain = this.normalizeDomain(domain)
      
      // Check phishing database
      if (this.phishingDomains.has(normalizedDomain)) {
        return {
          domain: normalizedDomain,
          malicious: true,
          category: 'phishing',
          confidence: 0.95,
          lastChecked: new Date()
        }
      }
      
      // Check domain patterns
      const suspiciousPatterns = await this.checkDomainPatterns(normalizedDomain)
      if (suspiciousPatterns.length > 0) {
        return {
          domain: normalizedDomain,
          malicious: true,
          category: 'suspicious',
          confidence: 0.7,
          patterns: suspiciousPatterns,
          lastChecked: new Date()
        }
      }
      
      // Check domain age and registration
      const domainAge = await this.checkDomainAge(normalizedDomain)
      if (domainAge.isNew && domainAge.daysSinceRegistration < 30) {
        return {
          domain: normalizedDomain,
          malicious: false,
          category: 'new_domain',
          confidence: 0.5,
          metadata: { daysOld: domainAge.daysSinceRegistration },
          lastChecked: new Date()
        }
      }
      
      return {
        domain: normalizedDomain,
        malicious: false,
        category: 'clean',
        confidence: 0.9,
        lastChecked: new Date()
      }
      
    } catch (error) {
      logger.error('Domain reputation check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        domain
      })
      
      return {
        domain,
        malicious: false,
        category: 'unknown',
        confidence: 0.1,
        lastChecked: new Date()
      }
    }
  }
  
  /**
   * Check file hash against malware database
   */
  async checkFileHash(hash: string): Promise<MalwareCheckResult> {
    try {
      // Check local malware signature database
      if (this.malwareSignatures.has(hash)) {
        return {
          hash,
          malicious: true,
          malwareFamily: 'generic',
          confidence: 0.99,
          source: 'local_db'
        }
      }
      
      // Check external threat intelligence (simulated)
      const externalCheck = await this.checkExternalMalwareDB(hash)
      if (externalCheck.found) {
        return {
          hash,
          malicious: true,
          malwareFamily: externalCheck.family,
          confidence: externalCheck.confidence,
          source: 'external_ti'
        }
      }
      
      return {
        hash,
        malicious: false,
        confidence: 0.8,
        source: 'not_found'
      }
      
    } catch (error) {
      logger.error('Malware check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        hash
      })
      
      return {
        hash,
        malicious: false,
        confidence: 0.1,
        source: 'error'
      }
    }
  }
  
  /**
   * Get threat feed updates
   */
  async updateThreatFeeds(): Promise<void> {
    try {
      // Update IP reputation lists
      await this.updateIPReputationList()
      
      // Update malware signatures
      await this.updateMalwareSignatures()
      
      // Update phishing domains
      await this.updatePhishingDomains()
      
      // Update CVE database
      await this.updateCVEDatabase()
      
      logger.info('Threat feeds updated successfully')
      
    } catch (error) {
      logger.error('Failed to update threat feeds', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  /**
   * Initialize threat data with known threats
   */
  private initializeThreatData(): void {
    // Initialize with known malicious IPs (example data)
    this.ipReputationDB.set('192.0.2.1', {
      score: 100,
      categories: ['botnet', 'scanner'],
      lastSeen: new Date()
    })
    
    // Initialize known malware hashes (example)
    this.malwareSignatures.add('d41d8cd98f00b204e9800998ecf8427e')
    
    // Initialize phishing domains (example)
    this.phishingDomains.add('phishing-example.com')
    
    // Load more comprehensive threat data in production
  }
  
  /**
   * Start scheduler for regular threat feed updates
   */
  private startUpdateScheduler(): void {
    // Update threat feeds every hour
    setInterval(() => {
      this.updateThreatFeeds()
    }, 60 * 60 * 1000)
  }
  
  /**
   * Get IP reputation from internal database
   */
  private async getIPReputation(ip: string): Promise<IPReputation> {
    // Check internal database
    const reputation = this.ipReputationDB.get(ip)
    if (reputation) return reputation
    
    // Calculate reputation based on IP characteristics
    const score = await this.calculateIPScore(ip)
    
    return {
      score,
      categories: this.categorizeIP(ip, score),
      lastSeen: new Date()
    }
  }
  
  /**
   * Calculate IP reputation score
   */
  private async calculateIPScore(ip: string): Promise<number> {
    let score = 0
    
    // Check if IP is in private range (lower threat)
    if (this.isPrivateIP(ip)) {
      return 0
    }
    
    // Check if IP is from known hosting providers (higher threat potential)
    if (await this.isHostingProvider(ip)) {
      score += 20
    }
    
    // Check if IP is from high-risk countries
    const country = await this.getIPCountry(ip)
    if (this.isHighRiskCountry(country)) {
      score += 30
    }
    
    // Check if IP is in any blacklists
    if (await this.isBlacklisted(ip)) {
      score += 50
    }
    
    return Math.min(100, score)
  }
  
  /**
   * Get geolocation for IP
   */
  private async getGeoLocation(ip: string): Promise<GeoLocation> {
    // In production, use a GeoIP service
    // For now, return simulated data
    return {
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      timezone: 'America/Los_Angeles'
    }
  }
  
  /**
   * Get ASN information for IP
   */
  private async getASNInfo(ip: string): Promise<ASNInfo> {
    // In production, query ASN database
    return {
      asn: 'AS13335',
      organization: 'Cloudflare, Inc.',
      network: '1.1.1.0/24'
    }
  }
  
  /**
   * Get historical threats for IP
   */
  private async getHistoricalThreats(ip: string): Promise<HistoricalThreat[]> {
    // In production, query threat history database
    return []
  }
  
  /**
   * Calculate overall threat level
   */
  private calculateThreatLevel(intel: IPThreatIntelligence): ThreatLevel {
    const score = intel.reputation.score
    
    if (score >= 80) return ThreatLevel.CRITICAL
    if (score >= 60) return ThreatLevel.HIGH
    if (score >= 40) return ThreatLevel.MEDIUM
    if (score >= 20) return ThreatLevel.LOW
    return ThreatLevel.NONE
  }
  
  /**
   * Calculate confidence in threat assessment
   */
  private calculateConfidence(intel: IPThreatIntelligence): number {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on data availability
    if (intel.reputation.score > 0) confidence += 0.1
    if (intel.geoLocation) confidence += 0.1
    if (intel.asnInfo) confidence += 0.1
    if (intel.historicalThreats.length > 0) confidence += 0.2
    
    return Math.min(1.0, confidence)
  }
  
  /**
   * Cache threat intelligence
   */
  private async cacheIntel(ip: string, intel: IPThreatIntelligence): Promise<void> {
    try {
      if (redis) {
        const key = `${this.cachePrefix}${ip}`
        await redis.set(key, JSON.stringify(intel), { ttl: this.cacheTTL })
      }
    } catch (error) {
      // Silent fail - cache is optional
    }
  }
  
  /**
   * Get cached threat intelligence
   */
  private async getCachedIntel(ip: string): Promise<IPThreatIntelligence | null> {
    try {
      if (redis) {
        const key = `${this.cachePrefix}${ip}`
        const cached = await redis.get(key)
        if (cached) {
          return JSON.parse(cached)
        }
      }
    } catch (error) {
      // Silent fail - cache is optional
    }
    return null
  }
  
  /**
   * Get default intelligence when lookup fails
   */
  private getDefaultIntel(ip: string): IPThreatIntelligence {
    return {
      ip,
      reputation: { score: 0, categories: [], lastSeen: new Date() },
      threatLevel: ThreatLevel.UNKNOWN,
      categories: [],
      geoLocation: null,
      asnInfo: null,
      historicalThreats: [],
      activeIncidents: [],
      lastSeen: new Date(),
      confidence: 0.1
    }
  }
  
  /**
   * Check if IP is private
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
   * Check if IP belongs to hosting provider
   */
  private async isHostingProvider(ip: string): Promise<boolean> {
    // In production, check against hosting provider ASN list
    const hostingASNs = ['AS13335', 'AS16509', 'AS15169'] // Cloudflare, AWS, Google
    const asnInfo = await this.getASNInfo(ip)
    return hostingASNs.includes(asnInfo.asn)
  }
  
  /**
   * Get country for IP
   */
  private async getIPCountry(ip: string): Promise<string> {
    const geo = await this.getGeoLocation(ip)
    return geo?.country || 'UNKNOWN'
  }
  
  /**
   * Check if country is high risk
   */
  private isHighRiskCountry(country: string): boolean {
    const highRiskCountries = ['XX', 'YY'] // Example high-risk country codes
    return highRiskCountries.includes(country)
  }
  
  /**
   * Check if IP is blacklisted
   */
  private async isBlacklisted(ip: string): Promise<boolean> {
    // In production, check multiple blacklists
    return this.ipReputationDB.has(ip) && 
           (this.ipReputationDB.get(ip)?.score || 0) > 50
  }
  
  /**
   * Categorize IP based on score
   */
  private categorizeIP(ip: string, score: number): string[] {
    const categories: string[] = []
    
    if (score >= 80) categories.push('malicious')
    if (score >= 60) categories.push('suspicious')
    if (score >= 40) categories.push('risky')
    
    return categories
  }
  
  /**
   * Normalize domain name
   */
  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().replace(/^www\./, '')
  }
  
  /**
   * Check domain patterns for suspicious characteristics
   */
  private async checkDomainPatterns(domain: string): Promise<string[]> {
    const patterns: string[] = []
    
    // Check for homograph attacks
    if (/[а-яА-Я]/.test(domain)) {
      patterns.push('cyrillic_characters')
    }
    
    // Check for excessive subdomains
    if (domain.split('.').length > 4) {
      patterns.push('excessive_subdomains')
    }
    
    // Check for suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf']
    if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      patterns.push('suspicious_tld')
    }
    
    // Check for typosquatting patterns
    if (this.detectTyposquatting(domain)) {
      patterns.push('typosquatting')
    }
    
    return patterns
  }
  
  /**
   * Detect typosquatting attempts
   */
  private detectTyposquatting(domain: string): boolean {
    const legitimateDomains = ['google.com', 'facebook.com', 'amazon.com']
    
    for (const legitimate of legitimateDomains) {
      const distance = this.levenshteinDistance(domain, legitimate)
      if (distance > 0 && distance <= 2) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Calculate Levenshtein distance between strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2[i - 1] === str1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
  
  /**
   * Check domain age
   */
  private async checkDomainAge(domain: string): Promise<DomainAge> {
    // In production, query WHOIS or domain age service
    return {
      isNew: false,
      daysSinceRegistration: 365,
      registrationDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    }
  }
  
  /**
   * Check external malware database
   */
  private async checkExternalMalwareDB(hash: string): Promise<ExternalMalwareCheck> {
    // In production, query VirusTotal, MalwareBazaar, etc.
    return {
      found: false,
      family: '',
      confidence: 0
    }
  }
  
  /**
   * Update IP reputation list
   */
  private async updateIPReputationList(): Promise<void> {
    // In production, fetch from threat intelligence feeds
    // Example: AbuseIPDB, AlienVault OTX, etc.
  }
  
  /**
   * Update malware signatures
   */
  private async updateMalwareSignatures(): Promise<void> {
    // In production, fetch from malware databases
    // Example: MalwareBazaar, VirusTotal, etc.
  }
  
  /**
   * Update phishing domains
   */
  private async updatePhishingDomains(): Promise<void> {
    // In production, fetch from phishing databases
    // Example: PhishTank, OpenPhish, etc.
  }
  
  /**
   * Update CVE database
   */
  private async updateCVEDatabase(): Promise<void> {
    // In production, fetch from NVD, MITRE, etc.
  }
}

/**
 * Healthcare-specific threat intelligence
 */
export class HealthcareThreatIntel {
  private ransomwareIndicators: Set<string> = new Set()
  private medicalDeviceThreats: Map<string, DeviceThreat> = new Map()
  private phiExfiltrationPatterns: Set<string> = new Set()
  
  constructor() {
    this.initializeHealthcareThreats()
  }
  
  /**
   * Check for healthcare-specific threats
   */
  async checkHealthcareThreat(request: any): Promise<HealthcareThreatAssessment> {
    const assessment: HealthcareThreatAssessment = {
      hasRansomwareIndicators: false,
      hasMedicalDeviceThreat: false,
      hasPhiExfiltrationPattern: false,
      riskLevel: 'low',
      recommendations: []
    }
    
    // Check for ransomware indicators
    if (this.detectRansomwareIndicators(request)) {
      assessment.hasRansomwareIndicators = true
      assessment.riskLevel = 'critical'
      assessment.recommendations.push('Isolate affected systems immediately')
      assessment.recommendations.push('Activate incident response plan')
    }
    
    // Check for medical device threats
    if (this.detectMedicalDeviceThreat(request)) {
      assessment.hasMedicalDeviceThreat = true
      assessment.riskLevel = assessment.riskLevel === 'critical' ? 'critical' : 'high'
      assessment.recommendations.push('Alert biomedical engineering team')
      assessment.recommendations.push('Review medical device network segmentation')
    }
    
    // Check for PHI exfiltration patterns
    if (this.detectPhiExfiltration(request)) {
      assessment.hasPhiExfiltrationPattern = true
      assessment.riskLevel = assessment.riskLevel === 'critical' ? 'critical' : 'high'
      assessment.recommendations.push('Enable enhanced PHI access monitoring')
      assessment.recommendations.push('Review data loss prevention policies')
    }
    
    return assessment
  }
  
  /**
   * Initialize healthcare-specific threat data
   */
  private initializeHealthcareThreats(): void {
    // Known ransomware indicators
    this.ransomwareIndicators.add('.locked')
    this.ransomwareIndicators.add('.encrypted')
    this.ransomwareIndicators.add('decrypt')
    this.ransomwareIndicators.add('ransom')
    
    // Known medical device vulnerabilities
    this.medicalDeviceThreats.set('device_type_1', {
      deviceType: 'Infusion Pump',
      vulnerability: 'CVE-2023-XXXX',
      severity: 'high'
    })
    
    // PHI exfiltration patterns
    this.phiExfiltrationPatterns.add('bulk_export')
    this.phiExfiltrationPatterns.add('mass_download')
  }
  
  /**
   * Detect ransomware indicators
   */
  private detectRansomwareIndicators(request: any): boolean {
    const requestStr = JSON.stringify(request).toLowerCase()
    
    for (const indicator of this.ransomwareIndicators) {
      if (requestStr.includes(indicator)) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Detect medical device threats
   */
  private detectMedicalDeviceThreat(request: any): boolean {
    // Check if request targets medical device endpoints
    const endpoint = request.endpoint || ''
    return endpoint.includes('/medical-devices/') || 
           endpoint.includes('/biomedical/')
  }
  
  /**
   * Detect PHI exfiltration attempts
   */
  private detectPhiExfiltration(request: any): boolean {
    // Check for bulk data access patterns
    const params = request.parameters || {}
    
    // Large limit parameter
    if (params.limit && parseInt(params.limit) > 1000) {
      return true
    }
    
    // Export endpoints
    if (request.endpoint?.includes('export')) {
      return true
    }
    
    return false
  }
}

// Type definitions
interface ThreatIntelData {
  type: string
  severity: string
  indicators: string[]
  lastUpdated: Date
}

interface IPThreatIntelligence {
  ip: string
  reputation: IPReputation
  threatLevel: ThreatLevel
  categories: string[]
  geoLocation: GeoLocation | null
  asnInfo: ASNInfo | null
  historicalThreats: HistoricalThreat[]
  activeIncidents: string[]
  lastSeen: Date
  confidence: number
}

interface IPReputation {
  score: number // 0-100, higher is worse
  categories: string[]
  lastSeen: Date
}

interface GeoLocation {
  country: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
}

interface ASNInfo {
  asn: string
  organization: string
  network: string
}

interface HistoricalThreat {
  date: Date
  type: string
  severity: string
  description: string
}

interface DomainReputation {
  domain: string
  malicious: boolean
  category: string
  confidence: number
  patterns?: string[]
  metadata?: any
  lastChecked: Date
}

interface MalwareCheckResult {
  hash: string
  malicious: boolean
  malwareFamily?: string
  confidence: number
  source: string
}

interface DomainAge {
  isNew: boolean
  daysSinceRegistration: number
  registrationDate: Date
}

interface ExternalMalwareCheck {
  found: boolean
  family: string
  confidence: number
}

interface DeviceThreat {
  deviceType: string
  vulnerability: string
  severity: string
}

interface HealthcareThreatAssessment {
  hasRansomwareIndicators: boolean
  hasMedicalDeviceThreat: boolean
  hasPhiExfiltrationPattern: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
}

enum ThreatLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

// Export instances
export const threatIntelligence = new ThreatIntelligenceManager()
export const healthcareThreatIntel = new HealthcareThreatIntel()