/**
 * Google Tag Manager Integration for Healthcare Analytics
 * Handles advanced event tracking and integration with healthcare platforms
 */
import { AnalyticsEvents } from './analytics'

export interface GTMEventConfig {
  eventName: string
  eventCategory: string
  eventLabel?: string
  eventValue?: number
  healthcareMetadata?: Record<string, any>
}

export class GTMIntegration {
  private gtmId: string
  private healthcareTrackingEnabled: boolean

  constructor() {
    this.gtmId = process.env.NEXT_PUBLIC_GTM_ID || ''
    this.healthcareTrackingEnabled = !!process.env.NEXT_PUBLIC_HEALTHCARE_TRACKING
  }

  /**
   * Initialize Google Tag Manager
   */
  initializeGTM(): void {
    if (typeof window === 'undefined' || !this.gtmId) return

    // GTM Script Injection
    const gtmScript = document.createElement('script')
    gtmScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${this.gtmId}');
    `
    document.head.appendChild(gtmScript)
  }

  /**
   * Push event to GTM dataLayer
   */
  pushEvent(event: GTMEventConfig): void {
    if (typeof window === 'undefined') return

    const dataLayer = (window as any).dataLayer || []
    const gtmEvent = {
      event: event.eventName,
      eventCategory: event.eventCategory,
      eventLabel: event.eventLabel,
      eventValue: event.eventValue,
      ...event.healthcareMetadata
    }

    dataLayer.push(gtmEvent)

    // Optional Healthcare Platform Integration
    if (this.healthcareTrackingEnabled) {
      this.sendToHealthcarePlatforms(event)
    }
  }

  /**
   * Map standard analytics events to GTM healthcare events
   */
  mapEventToHealthcare(analyticsEvent: AnalyticsEvents, properties: any): GTMEventConfig {
    switch (analyticsEvent) {
      case AnalyticsEvents.CONSULTATION_REQUEST:
        return {
          eventName: 'healthcare_consultation_request',
          eventCategory: 'healthcare_engagement',
          eventLabel: properties.form_name,
          healthcareMetadata: {
            consultation_type: properties.form_name,
            request_success: properties.success
          }
        }
      
      case AnalyticsEvents.CLINICAL_TRIAL_INQUIRY:
        return {
          eventName: 'clinical_trial_inquiry',
          eventCategory: 'research_engagement',
          healthcareMetadata: {
            inquiry_source: properties.source,
            trial_interest: properties.trial_type
          }
        }
      
      default:
        return {
          eventName: analyticsEvent,
          eventCategory: properties.event_category || 'general',
          eventLabel: properties.event_label
        }
    }
  }

  /**
   * Send event to additional healthcare tracking platforms
   */
  private sendToHealthcarePlatforms(event: GTMEventConfig): void {
    const healthcareEndpoint = process.env.NEXT_PUBLIC_HEALTHCARE_TRACKING_ENDPOINT
    if (!healthcareEndpoint) return

    try {
      fetch(healthcareEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HEALTHCARE_TRACKING_TOKEN}`
        },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          source: 'hmhcp_website'
        })
      }).catch(console.error)
    } catch (error) {
      console.error('Healthcare tracking failed:', error)
    }
  }
}

// Singleton Instance
export const gtmIntegration = new GTMIntegration()

// Quick Initialize for Next.js
if (typeof window !== 'undefined') {
  gtmIntegration.initializeGTM()
}