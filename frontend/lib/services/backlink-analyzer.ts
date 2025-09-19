// Backlink Profile Analysis Service
// Healthcare domain authority tracking and toxic link detection

import { 
  BacklinkProfile, 
  HealthcareDomainAuthority 
} from '@/types/seo-analytics'
import { cacheManager } from '@/lib/cache/redis-cache-manager'
import { logger } from '@/lib/monitoring/logger'
import { supabase } from '@/lib/utils/supabase/client'

// Healthcare certification authorities
const HEALTHCARE_CERTIFICATIONS = {
  'HONcode': { weight: 1.5, description: 'Health On the Net certification' },
  'URAC': { weight: 1.4, description: 'URAC Health Website Accreditation' },
  'TRUSTe': { weight: 1.2, description: 'TRUSTe Privacy Certification' },
  'HIPAA': { weight: 1.3, description: 'HIPAA Compliant' },
  'FDA': { weight: 1.5, description: 'FDA Registered' },
  'NCQA': { weight: 1.4, description: 'National Committee for Quality Assurance' }
}

// Medical institution domains (high authority)
const MEDICAL_INSTITUTIONS = [
  { pattern: /\.edu$/, type: 'university', authority: 90 },
  { pattern: /\.gov$/, type: 'government', authority: 95 },
  { pattern: /nih\.gov/, type: 'government', authority: 100 },
  { pattern: /cdc\.gov/, type: 'government', authority: 100 },
  { pattern: /who\.int/, type: 'government', authority: 100 },
  { pattern: /mayo\.edu/, type: 'medical_institution', authority: 95 },
  { pattern: /harvard\.edu/, type: 'university', authority: 95 },
  { pattern: /stanford\.edu/, type: 'university', authority: 95 },
  { pattern: /johnshopkins\.edu/, type: 'medical_institution', authority: 95 },
  { pattern: /cleveland clinic/, type: 'medical_institution', authority: 90 },
  { pattern: /pubmed/, type: 'medical_journal', authority: 98 },
  { pattern: /nejm\.org/, type: 'medical_journal', authority: 100 },
  { pattern: /jamanetwork\.com/, type: 'medical_journal', authority: 98 },
  { pattern: /thelancet\.com/, type: 'medical_journal', authority: 98 },
  { pattern: /bmj\.com/, type: 'medical_journal', authority: 97 }
]

// Toxic link patterns for healthcare
const TOXIC_PATTERNS = [
  { pattern: /casino|gambling|poker/, reason: 'Gambling site', toxicity: 90 },
  { pattern: /adult|porn|xxx/, reason: 'Adult content', toxicity: 100 },
  { pattern: /viagra|cialis|pharma/, reason: 'Pharmaceutical spam', toxicity: 85 },
  { pattern: /loan|payday|mortgage/, reason: 'Financial spam', toxicity: 70 },
  { pattern: /essay|homework|writing service/, reason: 'Academic spam', toxicity: 60 },
  { pattern: /replica|fake|counterfeit/, reason: 'Counterfeit products', toxicity: 80 },
  { pattern: /hack|crack|cheat/, reason: 'Malicious content', toxicity: 95 },
  { pattern: /miracle cure|quick fix/, reason: 'Medical misinformation', toxicity: 88 },
  { pattern: /weight loss pill|diet pill/, reason: 'Unregulated supplements', toxicity: 75 }
]

export class BacklinkAnalyzer {
  private cacheKeyPrefix = 'seo:backlinks:'
  private cacheDuration = 48 * 60 * 60 // 48 hours

  /**
   * Analyze complete backlink profile
   */
  async analyzeBacklinkProfile(domain: string = 'healthcare.com'): Promise<BacklinkProfile> {
    const cacheKey = `${this.cacheKeyPrefix}${domain}`
    
    try {
      // Check cache first
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        logger.info('Returning cached backlink profile')
        return cached as BacklinkProfile
      }

      // Fetch backlink data from database
      const backlinkData = await this.fetchBacklinkData(domain)
      
      // Analyze and categorize backlinks
      const profile = await this.processBacklinkData(backlinkData)
      
      // Cache the results
      await cacheManager.set(cacheKey, profile, this.cacheDuration)
      
      return profile
    } catch (error) {
      logger.error('Error analyzing backlink profile:', error)
      return this.getEmptyProfile()
    }
  }

  /**
   * Fetch backlink data from database
   */
  private async fetchBacklinkData(domain: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('seo_backlinks')
        .select('*')
        .eq('target_domain', domain)
        .order('domain_authority', { ascending: false })
        .limit(1000)

      if (error) throw error
      
      // If no data in database, use mock data for demonstration
      if (!data || data.length === 0) {
        return this.getMockBacklinkData()
      }

      return data
    } catch (error) {
      logger.error('Error fetching backlink data:', error)
      return this.getMockBacklinkData()
    }
  }

  /**
   * Process raw backlink data into structured profile
   */
  private async processBacklinkData(backlinkData: any[]): Promise<BacklinkProfile> {
    const profile: BacklinkProfile = {
      totalBacklinks: backlinkData.length,
      uniqueDomains: new Set(backlinkData.map(bl => bl.source_domain)).size,
      healthcareBacklinks: 0,
      medicalJournalLinks: 0,
      universityLinks: 0,
      governmentLinks: 0,
      topReferringDomains: [],
      linkVelocity: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        trend: 'stable'
      },
      toxicLinks: []
    }

    // Group backlinks by domain
    const domainGroups = new Map<string, any[]>()
    
    for (const backlink of backlinkData) {
      const domain = backlink.source_domain
      
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, [])
      }
      domainGroups.get(domain)!.push(backlink)

      // Categorize backlink
      const category = this.categorizeBacklink(domain)
      switch (category.type) {
        case 'medical_journal':
          profile.medicalJournalLinks++
          profile.healthcareBacklinks++
          break
        case 'university':
          profile.universityLinks++
          if (this.isHealthcareRelated(domain)) {
            profile.healthcareBacklinks++
          }
          break
        case 'government':
          profile.governmentLinks++
          if (this.isHealthcareRelated(domain)) {
            profile.healthcareBacklinks++
          }
          break
        case 'medical_institution':
          profile.healthcareBacklinks++
          break
      }

      // Check for toxic links
      const toxicity = this.checkToxicity(domain, backlink.anchor_text)
      if (toxicity.isToxic) {
        profile.toxicLinks.push({
          domain,
          toxicityScore: toxicity.score,
          reason: toxicity.reason
        })
      }
    }

    // Process top referring domains
    const sortedDomains = Array.from(domainGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20)

    for (const [domain, backlinks] of sortedDomains) {
      const healthcareAuth = await this.getHealthcareDomainAuthority(domain)
      
      // Group anchor texts
      const anchorGroups = new Map<string, number>()
      for (const bl of backlinks) {
        const anchor = bl.anchor_text || 'No anchor'
        anchorGroups.set(anchor, (anchorGroups.get(anchor) || 0) + 1)
      }

      profile.topReferringDomains.push({
        domain,
        backlinks: backlinks.length,
        domainAuthority: backlinks[0].domain_authority || 50,
        healthcareAuthority: healthcareAuth,
        anchorTexts: Array.from(anchorGroups.entries()).map(([text, count]) => ({
          text,
          count,
          medicalTerm: this.isMedicalTerm(text)
        }))
      })
    }

    // Calculate link velocity
    profile.linkVelocity = this.calculateLinkVelocity(backlinkData)

    return profile
  }

  /**
   * Get healthcare domain authority
   */
  private async getHealthcareDomainAuthority(domain: string): Promise<HealthcareDomainAuthority> {
    const baseAuthority = this.calculateBaseAuthority(domain)
    const certifications = this.detectCertifications(domain)
    const specializations = this.detectSpecializations(domain)
    
    return {
      domain,
      authorityScore: baseAuthority,
      healthcareRelevance: this.calculateHealthcareRelevance(domain),
      medicalCredibility: baseAuthority > 70 ? 'high' : baseAuthority > 40 ? 'medium' : 'low',
      specializations,
      certifications,
      lastVerified: new Date().toISOString()
    }
  }

  /**
   * Calculate base domain authority
   */
  private calculateBaseAuthority(domain: string): number {
    // Check against known medical institutions
    for (const institution of MEDICAL_INSTITUTIONS) {
      if (institution.pattern.test(domain)) {
        return institution.authority
      }
    }
    
    // Default scoring based on TLD and keywords
    let score = 50
    
    if (domain.endsWith('.edu')) score += 20
    if (domain.endsWith('.gov')) score += 25
    if (domain.endsWith('.org')) score += 10
    
    const healthKeywords = ['health', 'medical', 'clinic', 'hospital', 'doctor', 'physician']
    for (const keyword of healthKeywords) {
      if (domain.includes(keyword)) {
        score += 5
      }
    }
    
    return Math.min(score, 100)
  }

  /**
   * Calculate healthcare relevance score
   */
  private calculateHealthcareRelevance(domain: string): number {
    let relevance = 0
    
    // Check domain name for healthcare keywords
    const healthcareKeywords = [
      'health', 'medical', 'clinic', 'hospital', 'doctor',
      'physician', 'nurse', 'patient', 'care', 'pharma',
      'bio', 'life', 'wellness', 'therapy', 'treatment'
    ]
    
    const domainLower = domain.toLowerCase()
    for (const keyword of healthcareKeywords) {
      if (domainLower.includes(keyword)) {
        relevance += 10
      }
    }
    
    // Check for medical institution patterns
    for (const institution of MEDICAL_INSTITUTIONS) {
      if (institution.pattern.test(domain)) {
        relevance += 30
      }
    }
    
    return Math.min(relevance, 100)
  }

  /**
   * Detect healthcare certifications
   */
  private detectCertifications(domain: string): string[] {
    const certifications: string[] = []
    
    // This would typically involve API calls to certification bodies
    // For now, we'll use pattern matching
    
    if (domain.includes('verified') || domain.includes('certified')) {
      certifications.push('Verified Healthcare Provider')
    }
    
    if (domain.endsWith('.gov')) {
      certifications.push('Government Verified')
    }
    
    if (domain.includes('accredited')) {
      certifications.push('Accredited Institution')
    }
    
    return certifications
  }

  /**
   * Detect medical specializations
   */
  private detectSpecializations(domain: string): string[] {
    const specializations: string[] = []
    const domainLower = domain.toLowerCase()
    
    const specialtyKeywords = {
      'cardio': 'Cardiology',
      'onco': 'Oncology',
      'neuro': 'Neurology',
      'ortho': 'Orthopedics',
      'pediatr': 'Pediatrics',
      'derma': 'Dermatology',
      'psych': 'Psychiatry',
      'radio': 'Radiology',
      'surgery': 'Surgery',
      'emergency': 'Emergency Medicine'
    }
    
    for (const [keyword, specialty] of Object.entries(specialtyKeywords)) {
      if (domainLower.includes(keyword)) {
        specializations.push(specialty)
      }
    }
    
    return specializations
  }

  /**
   * Categorize backlink by domain type
   */
  private categorizeBacklink(domain: string): { type: string; authority: number } {
    for (const institution of MEDICAL_INSTITUTIONS) {
      if (institution.pattern.test(domain)) {
        return {
          type: institution.type,
          authority: institution.authority
        }
      }
    }
    
    return {
      type: 'general',
      authority: 50
    }
  }

  /**
   * Check if domain is healthcare related
   */
  private isHealthcareRelated(domain: string): boolean {
    const healthKeywords = [
      'health', 'medical', 'clinic', 'hospital',
      'doctor', 'physician', 'patient', 'care'
    ]
    
    const domainLower = domain.toLowerCase()
    return healthKeywords.some(keyword => domainLower.includes(keyword))
  }

  /**
   * Check for toxic links
   */
  private checkToxicity(domain: string, anchorText: string): {
    isToxic: boolean
    score: number
    reason: string
  } {
    const combinedText = `${domain} ${anchorText}`.toLowerCase()
    
    for (const pattern of TOXIC_PATTERNS) {
      if (pattern.pattern.test(combinedText)) {
        return {
          isToxic: true,
          score: pattern.toxicity,
          reason: pattern.reason
        }
      }
    }
    
    return {
      isToxic: false,
      score: 0,
      reason: ''
    }
  }

  /**
   * Check if anchor text is medical term
   */
  private isMedicalTerm(text: string): boolean {
    const medicalTerms = [
      'treatment', 'diagnosis', 'symptom', 'therapy',
      'surgery', 'medication', 'clinical', 'patient',
      'disease', 'condition', 'healthcare', 'medical'
    ]
    
    const textLower = text.toLowerCase()
    return medicalTerms.some(term => textLower.includes(term))
  }

  /**
   * Calculate link velocity
   */
  private calculateLinkVelocity(backlinks: any[]): BacklinkProfile['linkVelocity'] {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const daily = backlinks.filter(bl => 
      new Date(bl.discovered_at) > dayAgo
    ).length
    
    const weekly = backlinks.filter(bl => 
      new Date(bl.discovered_at) > weekAgo
    ).length
    
    const monthly = backlinks.filter(bl => 
      new Date(bl.discovered_at) > monthAgo
    ).length
    
    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (daily > weekly / 7) trend = 'increasing'
    else if (daily < weekly / 14) trend = 'decreasing'
    
    return {
      daily,
      weekly,
      monthly,
      trend
    }
  }

  /**
   * Get mock backlink data for demonstration
   */
  private getMockBacklinkData(): any[] {
    return [
      {
        source_domain: 'mayoclinic.org',
        target_domain: 'healthcare.com',
        anchor_text: 'healthcare technology solutions',
        domain_authority: 95,
        discovered_at: new Date().toISOString()
      },
      {
        source_domain: 'nih.gov',
        target_domain: 'healthcare.com',
        anchor_text: 'clinical research platform',
        domain_authority: 100,
        discovered_at: new Date().toISOString()
      },
      {
        source_domain: 'healthit.gov',
        target_domain: 'healthcare.com',
        anchor_text: 'healthcare IT innovation',
        domain_authority: 90,
        discovered_at: new Date().toISOString()
      },
      {
        source_domain: 'nejm.org',
        target_domain: 'healthcare.com',
        anchor_text: 'medical research tools',
        domain_authority: 98,
        discovered_at: new Date().toISOString()
      },
      {
        source_domain: 'harvard.edu',
        target_domain: 'healthcare.com',
        anchor_text: 'healthcare analytics platform',
        domain_authority: 95,
        discovered_at: new Date().toISOString()
      }
    ]
  }

  /**
   * Get empty profile structure
   */
  private getEmptyProfile(): BacklinkProfile {
    return {
      totalBacklinks: 0,
      uniqueDomains: 0,
      healthcareBacklinks: 0,
      medicalJournalLinks: 0,
      universityLinks: 0,
      governmentLinks: 0,
      topReferringDomains: [],
      linkVelocity: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        trend: 'stable'
      },
      toxicLinks: []
    }
  }
}

// Export singleton instance
export const backlinkAnalyzer = new BacklinkAnalyzer()