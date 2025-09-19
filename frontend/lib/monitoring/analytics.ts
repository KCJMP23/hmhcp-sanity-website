/**
 * Analytics and User Behavior Tracking
 * Privacy-compliant analytics with consent management
 */

// Simple cookie utilities
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return undefined
}

const setCookie = (name: string, value: string, options: { expires?: Date } = {}) => {
  if (typeof document === 'undefined') return
  let cookieString = `${name}=${value}; path=/`
  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`
  }
  document.cookie = cookieString
}

// Analytics configuration
const ANALYTICS_CONFIG = {
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
  consentCookieName: 'analytics-consent',
  consentDuration: 365, // days
}

// Analytics events enum
export enum AnalyticsEvents {
  // Existing Events
  PAGE_VIEW = 'page_view',
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  FORM_SUBMIT = 'form_submit',
  BUTTON_CLICK = 'button_click',
  FILE_DOWNLOAD = 'file_download',
  SEARCH = 'search',
  ERROR_OCCURRED = 'error_occurred',
  PERFORMANCE_METRIC = 'performance_metric',
  CONVERSION = 'conversion',

  // Healthcare-Specific Events
  CONSULTATION_REQUEST = 'consultation_request',
  CLINICAL_RESOURCE_DOWNLOAD = 'clinical_resource_download',
  CLINICAL_TRIAL_INQUIRY = 'clinical_trial_inquiry',
  HEALTHCARE_CONTENT_ENGAGEMENT = 'healthcare_content_engagement',
  MEDICAL_PROFESSIONAL_INTERACTION = 'medical_professional_interaction',
}

// User properties interface
interface UserProperties {
  user_id?: string
  user_type?: 'patient' | 'provider' | 'admin' | 'visitor'
  subscription_status?: 'free' | 'premium' | 'enterprise'
  location?: string
  device_type?: 'mobile' | 'tablet' | 'desktop'
}

// Event properties interface
interface EventProperties {
  event_category?: string
  event_label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

class AnalyticsManager {
  private consentGranted: boolean = false
  private initialized: boolean = false
  private queue: Array<{ event: string; properties: any }> = []

  constructor() {
    this.checkConsent()
    this.initializeAnalytics()
  }

  /**
   * Check if user has granted analytics consent
   */
  private checkConsent(): void {
    const consent = getCookie(ANALYTICS_CONFIG.consentCookieName)
    this.consentGranted = consent === 'granted'
  }

  /**
   * Grant analytics consent
   */
  grantConsent(): void {
    this.consentGranted = true
    const expiresDate = new Date()
    expiresDate.setDate(expiresDate.getDate() + ANALYTICS_CONFIG.consentDuration)
    setCookie(ANALYTICS_CONFIG.consentCookieName, 'granted', {
      expires: expiresDate,
    })
    
    // Process queued events
    this.processQueue()
    
    // Initialize analytics if not already done
    if (!this.initialized) {
      this.initializeAnalytics()
    }
  }

  /**
   * Revoke analytics consent
   */
  revokeConsent(): void {
    this.consentGranted = false
    const expiresDate = new Date()
    expiresDate.setDate(expiresDate.getDate() + ANALYTICS_CONFIG.consentDuration)
    setCookie(ANALYTICS_CONFIG.consentCookieName, 'denied', {
      expires: expiresDate,
    })
    
    // Clear any stored analytics data
    this.clearAnalyticsData()
  }

  /**
   * Initialize analytics services
   */
  private initializeAnalytics(): void {
    if (!this.consentGranted || this.initialized) return

    // Initialize Google Analytics
    if (ANALYTICS_CONFIG.googleAnalyticsId && typeof window !== 'undefined') {
      this.initializeGoogleAnalytics()
    }

    this.initialized = true
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGoogleAnalytics(): void {
    // Load GA script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.googleAnalyticsId}`
    script.async = true
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer?.push(arguments)
    }

    window.gtag('js', new Date())
    window.gtag('config', ANALYTICS_CONFIG.googleAnalyticsId, {
      send_page_view: false, // We'll handle page views manually
      anonymize_ip: true,
      allow_google_signals: false, // Disable advertising features
      cookie_flags: 'SameSite=None;Secure',
    })
  }

  /**
   * Track an analytics event
   */
  track(event: AnalyticsEvents, properties?: EventProperties): void {
    const eventData = {
      event,
      properties: {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ...properties,
      }
    }

    if (!this.consentGranted) {
      // Queue event for later processing if consent is granted
      this.queue.push(eventData)
      return
    }

    this.sendEvent(eventData)
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    this.track(AnalyticsEvents.PAGE_VIEW, {
      event_category: 'navigation',
      event_label: path,
      custom_parameters: {
        page_title: title || document.title,
        page_location: typeof window !== 'undefined' ? window.location.href : '',
      }
    })
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, category: string, label?: string, value?: number): void {
    this.track(AnalyticsEvents.BUTTON_CLICK, {
      event_category: category,
      event_label: label || action,
      value,
      custom_parameters: {
        action,
      }
    })
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, success: boolean = true): void {
    const isHealthcareForm = formName.toLowerCase().includes('consultation') || 
                              formName.toLowerCase().includes('clinical') ||
                              formName.toLowerCase().includes('medical')

    const trackEvent = isHealthcareForm 
      ? AnalyticsEvents.CONSULTATION_REQUEST 
      : AnalyticsEvents.FORM_SUBMIT

    this.track(trackEvent, {
      event_category: isHealthcareForm ? 'healthcare_engagement' : 'engagement',
      event_label: formName,
      custom_parameters: {
        form_name: formName,
        success,
        is_healthcare_form: isHealthcareForm
      }
    })
  }

  /**
   * Track search
   */
  trackSearch(query: string, results: number): void {
    this.track(AnalyticsEvents.SEARCH, {
      event_category: 'engagement',
      event_label: query,
      value: results,
      custom_parameters: {
        search_term: query,
        result_count: results,
      }
    })
  }

  /**
   * Track conversion
   */
  trackConversion(type: string, value?: number, currency: string = 'USD'): void {
    this.track(AnalyticsEvents.CONVERSION, {
      event_category: 'conversion',
      event_label: type,
      value,
      custom_parameters: {
        conversion_type: type,
        currency,
      }
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.track(AnalyticsEvents.PERFORMANCE_METRIC, {
      event_category: 'performance',
      event_label: metric,
      value,
      custom_parameters: {
        metric_name: metric,
        metric_value: value,
        unit,
      }
    })
  }

  /**
   * Track error
   */
  trackError(error: string, category: string = 'javascript'): void {
    this.track(AnalyticsEvents.ERROR_OCCURRED, {
      event_category: 'error',
      event_label: error,
      custom_parameters: {
        error_message: error,
        error_category: category,
      }
    })
  }

  /**
   * Set user properties
   */
  setUser(properties: UserProperties): void {
    if (!this.consentGranted) return

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', ANALYTICS_CONFIG.googleAnalyticsId, {
        custom_map: {
          user_type: properties.user_type,
          subscription_status: properties.subscription_status,
        }
      })

      if (properties.user_id) {
        window.gtag('config', ANALYTICS_CONFIG.googleAnalyticsId, {
          user_id: properties.user_id,
        })
      }
    }
  }

  /**
   * Send event to analytics services
   */
  private sendEvent(eventData: { event: string; properties: any }): void {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventData.event, {
        event_category: eventData.properties.event_category,
        event_label: eventData.properties.event_label,
        value: eventData.properties.value,
        ...eventData.properties.custom_parameters,
      })
    }

    // Send to custom analytics endpoint (if needed)
    if (process.env.NEXT_PUBLIC_CUSTOM_ANALYTICS_ENDPOINT) {
      this.sendToCustomEndpoint(eventData)
    }
  }

  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomEndpoint(eventData: any): Promise<void> {
    try {
      // Check for multiple analytics endpoints
      const customEndpoints = [
        process.env.NEXT_PUBLIC_CUSTOM_ANALYTICS_ENDPOINT,
        process.env.NEXT_PUBLIC_HEALTHCARE_ANALYTICS_ENDPOINT
      ].filter(Boolean)

      for (const endpoint of customEndpoints) {
        await fetch(endpoint!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HEALTHCARE_ANALYTICS_TOKEN}`
          },
          body: JSON.stringify({
            ...eventData,
            domain: 'healthcare-marketing'
          }),
        })
      }
    } catch (error) {
      console.error('Failed to send analytics to custom endpoints:', error)
    }
  }

  /**
   * Process queued events
   */
  private processQueue(): void {
    while (this.queue.length > 0) {
      const eventData = this.queue.shift()
      if (eventData) {
        this.sendEvent(eventData)
      }
    }
  }

  /**
   * Clear analytics data
   */
  private clearAnalyticsData(): void {
    // Clear any stored analytics cookies/data
    if (typeof window !== 'undefined') {
      // Clear GA cookies
      const gaCookies = document.cookie.split(';').filter(cookie => 
        cookie.trim().startsWith('_ga') || cookie.trim().startsWith('_gid')
      )
      
      gaCookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim()
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
    }
  }

  /**
   * Get consent status
   */
  hasConsent(): boolean {
    return this.consentGranted
  }
}

// Create singleton instance
const analytics = new AnalyticsManager()

// Export convenience functions
export const trackPageView = (path: string, title?: string) => analytics.trackPageView(path, title)
export const trackUserAction = (action: string, category: string, label?: string, value?: number) => 
  analytics.trackUserAction(action, category, label, value)
export const trackFormSubmit = (formName: string, success?: boolean) => analytics.trackFormSubmit(formName, success)
export const trackSearch = (query: string, results: number) => analytics.trackSearch(query, results)
export const trackConversion = (type: string, value?: number, currency?: string) => 
  analytics.trackConversion(type, value, currency)
export const trackPerformance = (metric: string, value: number, unit?: string) => 
  analytics.trackPerformance(metric, value, unit)
export const trackError = (error: string, category?: string) => analytics.trackError(error, category)
export const setUser = (properties: UserProperties) => analytics.setUser(properties)
export const grantAnalyticsConsent = () => analytics.grantConsent()
export const revokeAnalyticsConsent = () => analytics.revokeConsent()
export const hasAnalyticsConsent = () => analytics.hasConsent()

export default analytics

// Extend window interface for TypeScript
declare global {
  interface Window {
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
  }
}