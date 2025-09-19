'use client';

import { analyticsConfig, CookieConsent, ConsentCategory } from './config';
import { logger } from '@/lib/logger';

// Get cookie consent state
export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  const consentCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${analyticsConfig.cookieConsent.cookieName}=`));

  if (!consentCookie) {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  try {
    const consentData = JSON.parse(
      decodeURIComponent(consentCookie.split('=')[1])
    );
    return consentData;
  } catch (error) {
    logger.error('Failed to parse consent cookie:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

// Set cookie consent
export function setCookieConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;

  const expiryDate = new Date();
  expiryDate.setDate(
    expiryDate.getDate() + analyticsConfig.cookieConsent.cookieExpiry
  );

  const consentData = {
    ...consent,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  document.cookie = `${analyticsConfig.cookieConsent.cookieName}=${encodeURIComponent(
    JSON.stringify(consentData)
  )}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;

  // Dispatch custom event for consent change
  window.dispatchEvent(
    new CustomEvent('cookieConsentChanged', { detail: consentData })
  );
}

// Check if a specific category is consented
export function hasConsent(category: ConsentCategory): boolean {
  const consent = getCookieConsent();
  return consent[category] || false;
}

// Accept all cookies
export function acceptAllCookies(): void {
  setCookieConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

// Reject all non-necessary cookies
export function rejectAllCookies(): void {
  setCookieConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

// Update specific category consent
export function updateCategoryConsent(
  category: ConsentCategory,
  value: boolean
): void {
  const currentConsent = getCookieConsent();
  setCookieConsent({
    ...currentConsent,
    [category]: category === 'necessary' ? true : value, // Necessary cookies cannot be disabled
  });
}

// Get cookie policy URL
export function getCookiePolicyUrl(): string {
  return '/legal/cookie-policy';
}

// Get privacy policy URL
export function getPrivacyPolicyUrl(): string {
  return '/legal/privacy-policy';
}

// Check if consent banner should be shown
export function shouldShowConsentBanner(): boolean {
  if (typeof window === 'undefined') return false;

  const consent = getCookieConsent();
  const hasValidConsent = consent.timestamp && consent.version;
  
  // Show banner if no valid consent exists
  return !hasValidConsent;
}

// Clear all tracking cookies (except consent cookie)
export function clearTrackingCookies(): void {
  if (typeof window === 'undefined') return;

  // Get all cookies
  const cookies = document.cookie.split('; ');
  
  // List of known tracking cookie patterns
  const trackingPatterns = [
    '_ga',
    '_gid',
    '_gat',
    '_gcl',
    '_fbp',
    '_li',
    'li_',
    'lidc',
    'bcookie',
    'bscookie',
    'AnalyticsSyncHistory',
    'li_gc',
  ];

  cookies.forEach(cookie => {
    const [name] = cookie.split('=');
    
    // Check if cookie matches any tracking pattern
    const isTrackingCookie = trackingPatterns.some(pattern => 
      name.startsWith(pattern)
    );

    if (isTrackingCookie && name !== analyticsConfig.cookieConsent.cookieName) {
      // Delete cookie for current domain and all parent domains
      const domains = ['', '.hmhealthcare.com', 'hmhealthcare.com'];
      const paths = ['/', '/*'];
      
      domains.forEach(domain => {
        paths.forEach(path => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
        });
      });
    }
  });
}

// Listen for consent changes
export function onConsentChange(
  callback: (consent: CookieConsent) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CookieConsent>;
    callback(customEvent.detail);
  };

  window.addEventListener('cookieConsentChanged', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('cookieConsentChanged', handler);
  };
}

// Storage key for consent preferences
const CONSENT_PREFERENCES_KEY = 'hm_consent_preferences';

// Save consent preferences to localStorage (for UI state)
export function saveConsentPreferences(preferences: Partial<CookieConsent>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CONSENT_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    logger.error('Failed to save consent preferences:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
  }
}

// Load consent preferences from localStorage
export function loadConsentPreferences(): Partial<CookieConsent> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(CONSENT_PREFERENCES_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    logger.error('Failed to load consent preferences:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    return null;
  }
}

// Update analytics consent
export function updateAnalyticsConsent(consent: Partial<CookieConsent>): void {
  const currentConsent = getCookieConsent();
  setCookieConsent({
    ...currentConsent,
    ...consent,
    necessary: true, // Necessary cookies are always enabled
    timestamp: new Date().toISOString(),
  });
}