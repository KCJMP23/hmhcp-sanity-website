'use client';

import { analyticsConfig, EventName, EventParams } from './config';
import { getCookieConsent } from './cookies';
import { logger } from '@/lib/logger';

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    lintrk?: (...args: any[]) => void;
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = [];
}

// Helper to check if analytics is enabled
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return getCookieConsent().analytics;
}

// Helper to check if marketing tracking is enabled
export function isMarketingEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return getCookieConsent().marketing;
}

// Track custom events
export function trackEvent<T extends EventName>(
  eventName: T,
  parameters: EventParams<T>
): void {
  if (!isAnalyticsEnabled()) return;

  // Send to Google Analytics 4
  if (window.gtag && analyticsConfig.ga4.measurementId) {
    window.gtag('event', eventName, {
      ...parameters,
      send_to: analyticsConfig.ga4.measurementId,
    });
  }

  // Send to Google Tag Manager
  if (window.dataLayer && analyticsConfig.gtm.containerId) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    logger.info('[Analytics]', { action: 'info_logged', metadata: { eventName, parameters } });
  }
}

// Track page views
export function trackPageView(url: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;

  if (window.gtag && analyticsConfig.ga4.measurementId) {
    window.gtag('config', analyticsConfig.ga4.measurementId, {
      page_path: url,
      page_title: title,
    });
  }

  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: url,
      page_title: title,
    });
  }
}

// Track LinkedIn conversions
export function trackLinkedInConversion(conversionId: string): void {
  if (!isMarketingEnabled()) return;

  if (window.lintrk && analyticsConfig.linkedin.partnerId) {
    window.lintrk('track', { conversion_id: conversionId });
  }
}

// Track form interactions
let formStartTimes: Record<string, number> = {};
let formFieldsInteracted: Record<string, Set<string>> = {};
let formAbandonTimeouts: Record<string, NodeJS.Timeout> = {};

export function trackFormStart(formName: string, formLocation: string): void {
  formStartTimes[formName] = Date.now();
  formFieldsInteracted[formName] = new Set();
  
  trackEvent('form_start', { form_name: formName, form_location: formLocation });

  // Set abandon timeout
  if (formAbandonTimeouts[formName]) {
    clearTimeout(formAbandonTimeouts[formName]);
  }
  
  formAbandonTimeouts[formName] = setTimeout(() => {
    trackFormAbandon(formName);
  }, analyticsConfig.tracking.forms.abandonTimeout);
}

export function trackFormFieldInteraction(
  formName: string,
  fieldName: string,
  action: 'focus' | 'blur' | 'change'
): void {
  if (!formFieldsInteracted[formName]) {
    formFieldsInteracted[formName] = new Set();
  }
  
  formFieldsInteracted[formName].add(fieldName);
  
  trackEvent('form_field_interaction', {
    form_name: formName,
    field_name: fieldName,
    action,
  });
}

export function trackFormAbandon(formName: string): void {
  if (!formStartTimes[formName]) return;

  const timeSpent = Math.floor((Date.now() - formStartTimes[formName]) / 1000);
  const fieldsCompleted = formFieldsInteracted[formName]?.size || 0;

  trackEvent('form_abandon', {
    form_name: formName,
    fields_completed: fieldsCompleted,
    total_fields: 0, // This should be passed from the form
    time_spent: timeSpent,
  });

  // Clean up
  delete formStartTimes[formName];
  delete formFieldsInteracted[formName];
  if (formAbandonTimeouts[formName]) {
    clearTimeout(formAbandonTimeouts[formName]);
    delete formAbandonTimeouts[formName];
  }
}

export function trackFormSubmit(
  formName: string,
  success: boolean,
  errorMessage?: string
): void {
  if (!formStartTimes[formName]) return;

  const timeToComplete = Math.floor((Date.now() - formStartTimes[formName]) / 1000);

  trackEvent('form_submit', {
    form_name: formName,
    success,
    error_message: errorMessage,
    time_to_complete: timeToComplete,
  });

  // Clean up
  delete formStartTimes[formName];
  delete formFieldsInteracted[formName];
  if (formAbandonTimeouts[formName]) {
    clearTimeout(formAbandonTimeouts[formName]);
    delete formAbandonTimeouts[formName];
  }
}

export function trackFormValidationError(
  formName: string,
  fieldName: string,
  errorType: string
): void {
  if (!analyticsConfig.tracking.forms.validationErrorTracking) return;

  trackEvent('form_validation_error', {
    form_name: formName,
    field_name: fieldName,
    error_type: errorType,
  });
}

// Track content interactions
export function trackContentDownload(
  contentType: 'pdf' | 'whitepaper' | 'case_study' | 'other',
  contentName: string,
  fileSize?: number
): void {
  trackEvent('content_download', {
    content_type: contentType,
    content_name: contentName,
    file_size: fileSize,
  });
}

export function trackVideoEngagement(
  videoTitle: string,
  action: 'play' | 'pause' | 'complete' | 'seek',
  duration: number,
  currentTime: number
): void {
  const percentageWatched = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  trackEvent('video_engagement', {
    video_title: videoTitle,
    action,
    duration,
    current_time: currentTime,
    percentage_watched: percentageWatched,
  });
}

// Track platform interest
export function trackPlatformInterest(
  platformName: string,
  interactionType: 'view' | 'hover' | 'click' | 'demo_request',
  timeSpent?: number
): void {
  trackEvent('platform_interest', {
    platform_name: platformName,
    interaction_type: interactionType,
    time_spent: timeSpent,
  });
}

// Track CTA clicks
export function trackCTAClick(
  ctaText: string,
  ctaLocation: string,
  ctaDestination: string
): void {
  trackEvent('cta_click', {
    cta_text: ctaText,
    cta_location: ctaLocation,
    cta_destination: ctaDestination,
  });
}

// Track navigation patterns
export function trackNavigationPattern(
  fromPage: string,
  toPage: string,
  navigationType: 'menu' | 'cta' | 'link' | 'back'
): void {
  trackEvent('navigation_pattern', {
    from_page: fromPage,
    to_page: toPage,
    navigation_type: navigationType,
  });
}

// Track company identification (B2B)
export function trackCompanyIdentified(
  companyName: string,
  companySize?: string,
  industry?: string,
  source: 'clearbit' | 'ip_lookup' | 'form_submission' = 'form_submission'
): void {
  if (!isMarketingEnabled()) return;

  trackEvent('company_identified', {
    company_name: companyName,
    company_size: companySize,
    industry,
    source,
  });
}

// Initialize analytics scripts
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Initialize gtag
  if (!window.gtag) {
    window.gtag = function() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(arguments);
    };
  }

  // Set default consent state
  window.gtag('consent', 'default', {
    analytics_storage: isAnalyticsEnabled() ? 'granted' : 'denied',
    ad_storage: isMarketingEnabled() ? 'granted' : 'denied',
  });
}

// Update consent state
export function updateAnalyticsConsent(
  analytics: boolean,
  marketing: boolean
): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
  });
}