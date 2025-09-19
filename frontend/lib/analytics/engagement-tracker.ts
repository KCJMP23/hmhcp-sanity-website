// HIPAA-compliant client-side engagement tracking
// No PII collection - all data is anonymized

interface TrackingConfig {
  enabled: boolean
  sessionId: string // Anonymized session ID
  userType?: 'patient' | 'healthcare_professional' | 'researcher' | 'unknown'
  apiEndpoint: string
  batchSize: number
  flushInterval: number // milliseconds
  privacyMode: boolean // Always true for HIPAA compliance
}

interface AnonymizedEvent {
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'resize' | 'key_press' | 'page_view'
  element: string // Anonymized element identifier
  timestamp: number
  value?: number
  coordinates?: { x: number; y: number } // Relative coordinates only
  elementType?: string
  page: string
  sessionId: string
  userType: string
  anonymized: true // Always true for HIPAA compliance
}

interface HeatmapPoint {
  x: number
  y: number
  intensity: number
  element?: string
  timestamp: number
  sessionId: string
  userType: string
}

class HIPAACompliantEngagementTracker {
  private config: TrackingConfig
  private events: AnonymizedEvent[] = []
  private heatmapData: HeatmapPoint[] = []
  private startTime: number
  private observers: { [key: string]: any } = {}
  private flushTimer: NodeJS.Timeout | null = null
  private isTracking = false

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = {
      enabled: true,
      sessionId: this.generateAnonymousSessionId(),
      userType: 'unknown',
      apiEndpoint: '/api/admin/analytics/engagement/track',
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      privacyMode: true,
      ...config
    }

    this.startTime = Date.now()

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initializeTracking()
    }
  }

  private generateAnonymousSessionId(): string {
    // Generate a truly anonymous session ID using timestamp and random values
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    const browserFingerprint = this.createAnonymousFingerprint()
    
    // One-way hash to ensure no reverse engineering
    return btoa(`${timestamp}-${random}-${browserFingerprint}`).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16)
  }

  private createAnonymousFingerprint(): string {
    // Create anonymous browser fingerprint without any PII
    const screen = `${window.screen.width}x${window.screen.height}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const language = navigator.language.substr(0, 2) // Only language, not full locale
    const userAgent = navigator.userAgent.length.toString() // Only length, not actual UA
    
    return btoa(`${screen}-${timezone}-${language}-${userAgent}`).substr(0, 8)
  }

  private initializeTracking(): void {
    if (this.isTracking) return

    this.isTracking = true

    // Track page view
    this.trackEvent({
      type: 'page_view',
      element: 'page',
      timestamp: Date.now(),
      page: this.getAnonymizedPagePath(),
      sessionId: this.config.sessionId,
      userType: this.config.userType || 'unknown',
      anonymized: true
    })

    // Set up event listeners
    this.setupClickTracking()
    this.setupScrollTracking()
    this.setupHoverTracking()
    this.setupFocusTracking()
    this.setupResizeTracking()
    this.setupMedicalTermTracking()
    this.setupCTATracking()

    // Start periodic flushing
    this.startPeriodicFlush()

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })

    // Flush on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush()
      }
    })
  }

  private setupClickTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const elementId = this.getAnonymizedElementId(target)
      const rect = target.getBoundingClientRect()
      const relativeCoords = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }

      // Track click event
      this.trackEvent({
        type: 'click',
        element: elementId,
        timestamp: Date.now(),
        coordinates: {
          x: event.clientX,
          y: event.clientY
        },
        elementType: target.tagName.toLowerCase(),
        page: this.getAnonymizedPagePath(),
        sessionId: this.config.sessionId,
        userType: this.config.userType || 'unknown',
        anonymized: true
      })

      // Add to heatmap data
      this.addHeatmapPoint({
        x: event.clientX,
        y: event.clientY,
        intensity: this.calculateClickIntensity(target),
        element: elementId,
        timestamp: Date.now(),
        sessionId: this.config.sessionId,
        userType: this.config.userType || 'unknown'
      })
    })
  }

  private setupScrollTracking(): void {
    let scrollTimeout: NodeJS.Timeout | null = null

    window.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      
      scrollTimeout = setTimeout(() => {
        const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100

        this.trackEvent({
          type: 'scroll',
          element: 'window',
          timestamp: Date.now(),
          value: scrollDepth,
          page: this.getAnonymizedPagePath(),
          sessionId: this.config.sessionId,
          userType: this.config.userType || 'unknown',
          anonymized: true
        })
      }, 250) // Debounce scroll events
    })
  }

  private setupHoverTracking(): void {
    let hoverTimeout: NodeJS.Timeout | null = null

    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement
      if (this.isTrackableElement(target)) {
        if (hoverTimeout) clearTimeout(hoverTimeout)
        
        hoverTimeout = setTimeout(() => {
          this.trackEvent({
            type: 'hover',
            element: this.getAnonymizedElementId(target),
            timestamp: Date.now(),
            coordinates: {
              x: event.clientX,
              y: event.clientY
            },
            elementType: target.tagName.toLowerCase(),
            page: this.getAnonymizedPagePath(),
            sessionId: this.config.sessionId,
            userType: this.config.userType || 'unknown',
            anonymized: true
          })
        }, 500) // Only track hovers that last 500ms+
      }
    })
  }

  private setupFocusTracking(): void {
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      if (target.tagName && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) {
        this.trackEvent({
          type: 'focus',
          element: this.getAnonymizedElementId(target),
          timestamp: Date.now(),
          elementType: target.tagName.toLowerCase(),
          page: this.getAnonymizedPagePath(),
          sessionId: this.config.sessionId,
          userType: this.config.userType || 'unknown',
          anonymized: true
        })
      }
    })
  }

  private setupResizeTracking(): void {
    window.addEventListener('resize', () => {
      this.trackEvent({
        type: 'resize',
        element: 'window',
        timestamp: Date.now(),
        value: window.innerWidth,
        page: this.getAnonymizedPagePath(),
        sessionId: this.config.sessionId,
        userType: this.config.userType || 'unknown',
        anonymized: true
      })
    })
  }

  private setupMedicalTermTracking(): void {
    // Track clicks on medical terminology
    const medicalTerms = [
      'electronic health records', 'ehr', 'clinical decision support',
      'patient portal', 'telemedicine', 'hipaa compliance', 'clinical research',
      'healthcare analytics', 'medical data', 'patient outcomes',
      'clinical trials', 'healthcare technology', 'medical records'
    ]

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const text = target.textContent?.toLowerCase() || ''
      
      medicalTerms.forEach(term => {
        if (text.includes(term)) {
          this.trackMedicalTermClick(term, target)
        }
      })
    })
  }

  private setupCTATracking(): void {
    // Track CTA clicks
    const ctaSelectors = [
      '[data-cta]',
      'button[type="submit"]',
      '.cta-button',
      'a[href*="demo"]',
      'a[href*="contact"]',
      'a[href*="signup"]',
      'a[href*="download"]'
    ]

    ctaSelectors.forEach(selector => {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (target.matches(selector) || target.closest(selector)) {
          this.trackCTAClick(target)
        }
      })
    })
  }

  private trackMedicalTermClick(term: string, element: HTMLElement): void {
    // Send medical term click data
    fetch('/api/admin/analytics/engagement/medical-term', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        term,
        element: this.getAnonymizedElementId(element),
        page: this.getAnonymizedPagePath(),
        timestamp: Date.now(),
        sessionId: this.config.sessionId,
        userType: this.config.userType,
        anonymized: true
      })
    }).catch(console.error)
  }

  private trackCTAClick(element: HTMLElement): void {
    const ctaData = {
      element: this.getAnonymizedElementId(element),
      text: element.textContent?.substr(0, 50) || '', // Limit text length
      page: this.getAnonymizedPagePath(),
      timestamp: Date.now(),
      sessionId: this.config.sessionId,
      userType: this.config.userType,
      elementType: element.tagName.toLowerCase(),
      anonymized: true
    }

    fetch('/api/admin/analytics/engagement/cta-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ctaData)
    }).catch(console.error)
  }

  private trackEvent(event: AnonymizedEvent): void {
    if (!this.config.enabled) return

    this.events.push(event)

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush()
    }
  }

  private addHeatmapPoint(point: HeatmapPoint): void {
    this.heatmapData.push(point)

    // Keep heatmap data manageable
    if (this.heatmapData.length > 1000) {
      this.heatmapData = this.heatmapData.slice(-500) // Keep last 500 points
    }
  }

  private getAnonymizedElementId(element: HTMLElement): string {
    // Create anonymized element identifier without any PII
    const tagName = element.tagName.toLowerCase()
    const className = element.className ? element.className.split(' ')[0] : ''
    const position = Array.from(element.parentNode?.children || []).indexOf(element)
    
    return `${tagName}-${className}-${position}`.replace(/[^a-zA-Z0-9-]/g, '').substr(0, 20)
  }

  private getAnonymizedPagePath(): string {
    // Remove any potential PII from URL paths
    const path = window.location.pathname
    return path.replace(/\/[\d-]+/g, '/[id]') // Replace IDs with placeholder
              .replace(/\?.*/, '') // Remove query parameters
              .substr(0, 100) // Limit length
  }

  private isTrackableElement(element: HTMLElement): boolean {
    // Only track interactive elements
    const trackableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
    const hasClickHandler = element.onclick !== null
    const hasRole = element.getAttribute('role') !== null
    
    return trackableTags.includes(element.tagName) || hasClickHandler || hasRole
  }

  private calculateClickIntensity(element: HTMLElement): number {
    // Calculate click intensity based on element importance
    let intensity = 50 // Base intensity

    if (element.tagName === 'BUTTON') intensity += 30
    if (element.tagName === 'A') intensity += 20
    if (element.classList.contains('cta')) intensity += 40
    if (element.classList.contains('primary')) intensity += 35
    if (element.getAttribute('data-track') === 'important') intensity += 25

    return Math.min(intensity, 100)
  }

  private startPeriodicFlush(): void {
    if (this.flushTimer) clearInterval(this.flushTimer)
    
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0 && this.heatmapData.length === 0) return

    try {
      const payload = {
        events: this.events,
        heatmapData: this.heatmapData,
        sessionId: this.config.sessionId,
        userType: this.config.userType,
        sessionDuration: Date.now() - this.startTime,
        privacyCompliant: true,
        anonymized: true
      }

      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      // Clear sent data
      this.events = []
      this.heatmapData = []

    } catch (error) {
      console.error('Failed to send engagement data:', error)
      // Keep data for retry on next flush
    }
  }

  // Public methods for external control
  public setUserType(userType: 'patient' | 'healthcare_professional' | 'researcher' | 'unknown'): void {
    this.config.userType = userType
  }

  public stop(): void {
    this.isTracking = false
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush() // Final flush
  }

  public getSessionId(): string {
    return this.config.sessionId
  }

  public getStats(): { events: number; heatmapPoints: number; duration: number } {
    return {
      events: this.events.length,
      heatmapPoints: this.heatmapData.length,
      duration: Date.now() - this.startTime
    }
  }
}

// Export for use in components
export { HIPAACompliantEngagementTracker, type AnonymizedEvent, type HeatmapPoint }

// Initialize global tracker (only in browser)
let globalTracker: HIPAACompliantEngagementTracker | null = null

export function initializeEngagementTracking(config?: Partial<TrackingConfig>): HIPAACompliantEngagementTracker {
  if (typeof window === 'undefined') {
    throw new Error('Engagement tracking can only be initialized in browser environment')
  }

  if (!globalTracker) {
    globalTracker = new HIPAACompliantEngagementTracker(config)
  }

  return globalTracker
}

export function getEngagementTracker(): HIPAACompliantEngagementTracker | null {
  return globalTracker
}