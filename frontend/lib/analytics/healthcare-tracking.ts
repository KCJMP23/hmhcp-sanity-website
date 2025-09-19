// Healthcare-compliant analytics tracking system (no PII)

import { AnalyticsTrackingPayload, HealthcareTrafficSegmentation } from '@/types/blog-analytics'

interface TrackingConfig {
  enabled: boolean
  sessionDuration: number // milliseconds
  scrollThresholds: number[] // percentages
  timeThresholds: number[] // seconds
  medicalTermsDict: Record<string, string[]> // category -> terms mapping
}

class HealthcareAnalyticsTracker {
  private config: TrackingConfig
  private sessionHash: string
  private startTime: number
  private lastScrollDepth: number = 0
  private visitorClassification: HealthcareTrafficSegmentation | null = null
  private contentId: string | null = null
  private contentSlug: string | null = null
  private isTracking: boolean = false
  private scrollDepthReported: Set<number> = new Set()
  private terminologyClicks: Set<string> = new Set()
  private medicalTermsDict: Record<string, string[]> = {}

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = {
      enabled: true,
      sessionDuration: 30 * 60 * 1000, // 30 minutes
      scrollThresholds: [25, 50, 75, 90, 100],
      timeThresholds: [30, 60, 120, 300, 600], // 30s, 1m, 2m, 5m, 10m
      medicalTermsDict: {},
      ...config,
    }

    this.sessionHash = this.generateSessionHash()
    this.startTime = Date.now()
    
    // Load medical terms dictionary
    this.loadMedicalTermsDictionary()
    
    // Initialize visitor classification
    this.classifyVisitor()
  }

  // Generate HIPAA-compliant session identifier (no PII)
  private generateSessionHash(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const userAgent = navigator.userAgent.length.toString()
    const screenRes = `${screen.width}x${screen.height}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Create hash from non-PII browser characteristics
    const hashInput = `${timestamp}-${random}-${userAgent}-${screenRes}-${timezone}`
    return this.simpleHash(hashInput)
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 12)
  }

  // Load medical terminology dictionary from API
  private async loadMedicalTermsDictionary() {
    try {
      // This would typically be loaded from your CMS or API
      const response = await fetch('/api/analytics/medical-terms-dictionary')
      if (response.ok) {
        const data = await response.json()
        this.medicalTermsDict = data.terms || {}
      }
    } catch (error) {
      console.warn('Failed to load medical terms dictionary:', error)
      // Fallback dictionary
      this.medicalTermsDict = {
        cardiology: ['heart', 'cardiac', 'cardiovascular', 'coronary'],
        neurology: ['brain', 'neurological', 'seizure', 'stroke'],
        oncology: ['cancer', 'tumor', 'chemotherapy', 'radiation'],
        general: ['patient', 'diagnosis', 'treatment', 'medication', 'symptoms']
      }
    }
  }

  // Classify visitor based on behavioral patterns (no PII)
  private async classifyVisitor(): Promise<void> {
    const referrer = document.referrer
    const userAgent = navigator.userAgent
    const currentUrl = window.location.href
    
    const professionalIndicators = []
    const patientIndicators = []
    
    // Referrer-based classification
    if (referrer) {
      if (this.isProfessionalReferrer(referrer)) {
        professionalIndicators.push({
          indicator: 'professional_referrer',
          confidence: 0.8,
          source: 'referrer' as const,
        })
      }
      
      if (this.isPatientReferrer(referrer)) {
        patientIndicators.push({
          indicator: 'patient_referrer',
          confidence: 0.7,
          source: 'referrer' as const,
        })
      }
    }
    
    // Time-based patterns (professionals tend to read during business hours)
    const hour = new Date().getHours()
    if (hour >= 9 && hour <= 17) {
      professionalIndicators.push({
        indicator: 'business_hours',
        confidence: 0.3,
        source: 'behavior' as const,
      })
    } else if (hour >= 19 || hour <= 6) {
      patientIndicators.push({
        indicator: 'evening_weekend',
        confidence: 0.4,
        source: 'behavior' as const,
      })
    }

    // Calculate classification confidence
    const professionalScore = professionalIndicators.reduce((sum, ind) => sum + ind.confidence, 0)
    const patientScore = patientIndicators.reduce((sum, ind) => sum + ind.confidence, 0)
    
    const totalScore = professionalScore + patientScore
    const classificationConfidence = totalScore > 0 ? Math.max(professionalScore, patientScore) / totalScore : 0
    
    let visitorType: 'healthcare_professional' | 'patient' | 'unknown' = 'unknown'
    if (classificationConfidence > 0.6) {
      visitorType = professionalScore > patientScore ? 'healthcare_professional' : 'patient'
    }

    this.visitorClassification = {
      visitor_type: visitorType,
      professional_indicators: professionalIndicators,
      patient_indicators: patientIndicators,
      classification_confidence: classificationConfidence,
    }
  }

  private isProfessionalReferrer(referrer: string): boolean {
    const professionalDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'medscape.com',
      'uptodate.com',
      'nejm.org',
      'jamanetwork.com',
      'bmj.com',
      'thelancet.com',
      'nature.com',
      'nih.gov',
      'cdc.gov',
      'who.int',
      'medpagetoday.com',
      'doximity.com',
    ]
    
    return professionalDomains.some(domain => referrer.includes(domain))
  }

  private isPatientReferrer(referrer: string): boolean {
    const patientDomains = [
      'webmd.com',
      'mayoclinic.org',
      'healthline.com',
      'medicalnewstoday.com',
      'everydayhealth.com',
      'health.com',
      'prevention.com',
      'goodrx.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'pinterest.com',
    ]
    
    return patientDomains.some(domain => referrer.includes(domain))
  }

  // Initialize tracking for a specific content piece
  public initializeContentTracking(contentId: string, contentSlug: string): void {
    if (!this.config.enabled || !contentId) return
    
    this.contentId = contentId
    this.contentSlug = contentSlug
    this.isTracking = true
    this.startTime = Date.now()
    
    // Track initial page view
    this.trackEvent('page_view')
    
    // Set up scroll tracking
    this.setupScrollTracking()
    
    // Set up time-based tracking
    this.setupTimeTracking()
    
    // Set up medical terminology tracking
    this.setupMedicalTerminologyTracking()
    
    // Track page unload
    this.setupUnloadTracking()
  }

  private setupScrollTracking(): void {
    let ticking = false
    
    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)
      
      if (scrollPercent > this.lastScrollDepth) {
        this.lastScrollDepth = scrollPercent
        
        // Track scroll depth milestones
        for (const threshold of this.config.scrollThresholds) {
          if (scrollPercent >= threshold && !this.scrollDepthReported.has(threshold)) {
            this.scrollDepthReported.add(threshold)
            this.trackEvent('scroll', { scroll_depth: threshold })
            break
          }
        }
      }
      
      ticking = false
    }
    
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(trackScroll)
        ticking = true
      }
    }
    
    window.addEventListener('scroll', requestTick, { passive: true })
  }

  private setupTimeTracking(): void {
    for (const threshold of this.config.timeThresholds) {
      setTimeout(() => {
        if (this.isTracking) {
          this.trackEvent('time_spent', { time_spent: threshold })
        }
      }, threshold * 1000)
    }
  }

  private setupMedicalTerminologyTracking(): void {
    // Track clicks on medical terminology
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (!target || !this.isTracking) return
      
      const text = target.textContent?.toLowerCase() || ''
      const clickedTerm = this.findMedicalTerm(text)
      
      if (clickedTerm && !this.terminologyClicks.has(clickedTerm)) {
        this.terminologyClicks.add(clickedTerm)
        this.trackEvent('terminology_click', { terminology_term: clickedTerm })
      }
    }, { passive: true })
  }

  private findMedicalTerm(text: string): string | null {
    for (const [category, terms] of Object.entries(this.medicalTermsDict)) {
      for (const term of terms) {
        if (text.includes(term.toLowerCase())) {
          return term
        }
      }
    }
    return null
  }

  private setupUnloadTracking(): void {
    const trackUnload = () => {
      if (this.isTracking) {
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000)
        this.trackEvent('time_spent', { time_spent: timeSpent }, true) // Use sendBeacon
      }
    }
    
    // Track when user leaves the page
    window.addEventListener('beforeunload', trackUnload)
    window.addEventListener('pagehide', trackUnload)
    
    // Track when page becomes hidden (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isTracking) {
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000)
        this.trackEvent('time_spent', { time_spent: timeSpent })
      }
    })
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet'
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile'
    }
    return 'desktop'
  }

  private getReferrerType(): 'direct' | 'search' | 'social' | 'referral' {
    const referrer = document.referrer
    
    if (!referrer) return 'direct'
    
    // Search engines
    if (/google|bing|yahoo|duckduckgo|baidu|yandex/i.test(referrer)) {
      return 'search'
    }
    
    // Social media
    if (/facebook|twitter|instagram|linkedin|pinterest|reddit|tiktok/i.test(referrer)) {
      return 'social'
    }
    
    return 'referral'
  }

  private async getCountryCode(): Promise<string> {
    try {
      // Use timezone to approximate country (privacy-friendly)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const countryMapping: Record<string, string> = {
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Rome': 'IT',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Kolkata': 'IN',
        'Australia/Sydney': 'AU',
        // Add more mappings as needed
      }
      
      return countryMapping[timezone] || 'XX' // XX for unknown
    } catch (error) {
      return 'XX'
    }
  }

  // Track analytics events
  private async trackEvent(
    eventType: 'page_view' | 'scroll' | 'time_spent' | 'terminology_click' | 'engagement',
    metrics: { scroll_depth?: number; time_spent?: number; terminology_term?: string } = {},
    useBeacon: boolean = false
  ): Promise<void> {
    if (!this.config.enabled || !this.contentId || !this.visitorClassification) return
    
    const payload: AnalyticsTrackingPayload = {
      content_id: this.contentId,
      content_slug: this.contentSlug!,
      event_type: eventType,
      session_hash: this.sessionHash,
      visitor_classification: this.visitorClassification,
      metrics,
      context: {
        referrer_type: this.getReferrerType(),
        device_type: this.getDeviceType(),
        country_code: await this.getCountryCode(),
      },
    }

    try {
      if (useBeacon && navigator.sendBeacon) {
        // Use sendBeacon for unload events (more reliable)
        navigator.sendBeacon(
          '/api/admin/analytics/content',
          JSON.stringify(payload)
        )
      } else {
        // Use fetch for regular events
        fetch('/api/admin/analytics/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }).catch(error => {
          console.warn('Failed to send analytics event:', error)
        })
      }
    } catch (error) {
      console.warn('Failed to track analytics event:', error)
    }
  }

  // Stop tracking
  public stopTracking(): void {
    this.isTracking = false
    
    if (this.contentId) {
      const timeSpent = Math.round((Date.now() - this.startTime) / 1000)
      this.trackEvent('time_spent', { time_spent: timeSpent })
    }
  }

  // Get current session info (for debugging)
  public getSessionInfo(): object {
    return {
      sessionHash: this.sessionHash,
      isTracking: this.isTracking,
      contentId: this.contentId,
      visitorType: this.visitorClassification?.visitor_type,
      classificationConfidence: this.visitorClassification?.classification_confidence,
      scrollDepth: this.lastScrollDepth,
      timeSpent: Math.round((Date.now() - this.startTime) / 1000),
    }
  }
}

// Global instance
let globalTracker: HealthcareAnalyticsTracker | null = null

// Initialize global tracker
export function initializeHealthcareTracking(config?: Partial<TrackingConfig>): HealthcareAnalyticsTracker {
  if (!globalTracker) {
    globalTracker = new HealthcareAnalyticsTracker(config)
  }
  return globalTracker
}

// Get global tracker instance
export function getHealthcareTracker(): HealthcareAnalyticsTracker | null {
  return globalTracker
}

// Convenience function to start tracking a content piece
export function trackBlogContent(contentId: string, contentSlug: string): void {
  const tracker = getHealthcareTracker()
  if (tracker) {
    tracker.initializeContentTracking(contentId, contentSlug)
  }
}

// Export the class for custom implementations
export { HealthcareAnalyticsTracker, type TrackingConfig }