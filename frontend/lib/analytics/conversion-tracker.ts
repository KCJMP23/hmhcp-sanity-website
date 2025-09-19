'use client';

import { createClient } from '@/lib/supabase-client';
import { trackEvent } from './client';
import { logger } from '@/lib/logger';

interface ConversionGoal {
  id: string;
  name: string;
  type: string;
  value: number;
  target_url?: string;
  target_event?: string;
  target_selector?: string;
}

interface ConversionData {
  goalId: string;
  sessionId: string;
  visitorId: string;
  conversionValue?: number;
  attributionData: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
  conversionPath: string[];
  timeToConvert: number;
  deviceType?: string;
  formData?: any;
}

export class ConversionTracker {
  private static instance: ConversionTracker;
  private goals: ConversionGoal[] = [];
  private sessionStartTime: number;
  private pageHistory: string[] = [];
  private microConversions: Set<string> = new Set();

  private constructor() {
    this.sessionStartTime = Date.now();
    this.loadGoals();
    this.setupEventListeners();
  }

  static getInstance(): ConversionTracker {
    if (!ConversionTracker.instance) {
      ConversionTracker.instance = new ConversionTracker();
    }
    return ConversionTracker.instance;
  }

  private async loadGoals() {
    try {
      const response = await fetch('/api/analytics/goals');
      if (response.ok) {
        const data = await response.json();
        this.goals = data.goals || [];
      }
    } catch (error) {
      logger.error('Error loading conversion goals:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  private setupEventListeners() {
    // Track page history
    if (typeof window !== 'undefined') {
      this.pageHistory.push(window.location.href);
      
      // Listen for route changes (for SPAs)
      const originalPushState = history.pushState;
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        ConversionTracker.getInstance().pageHistory.push(window.location.href);
      };
    }
  }

  async trackGoal(goalName: string, value?: number, formData?: any) {
    const goal = this.goals.find(g => g.name === goalName);
    if (!goal) {
      logger.warn(`Goal "${goalName}" not found`, { action: 'warning_logged' });
      return;
    }

    const sessionId = this.getSessionId();
    const visitorId = this.getVisitorId();
    const timeToConvert = Math.round((Date.now() - this.sessionStartTime) / 1000);

    const conversionData: ConversionData = {
      goalId: goal.id,
      sessionId,
      visitorId,
      conversionValue: value || goal.value,
      attributionData: this.getAttributionData(),
      conversionPath: this.pageHistory.slice(-10), // Last 10 pages
      timeToConvert,
      deviceType: this.getDeviceType(),
      formData,
    };

    try {
      // Track conversion in our system
      const response = await fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionData),
      });

      if (response.ok) {
        // Track in Google Analytics
        trackEvent('conversion', {
          goal_name: goalName,
          goal_value: conversionData.conversionValue || 0,
          goal_id: goal.id,
        });

        // Fire custom event for other integrations
        window.dispatchEvent(new CustomEvent('conversion', {
          detail: { goal: goal.name, value: conversionData.conversionValue }
        }));
      }
    } catch (error) {
      logger.error('Error tracking conversion:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  trackMicroConversion(type: string, data: any) {
    const key = `${type}_${JSON.stringify(data)}`;
    
    // Avoid duplicate tracking
    if (this.microConversions.has(key)) return;
    this.microConversions.add(key);

    const microConversionHandlers: Record<string, (data: any) => void> = {
      video_progress: (progress: number) => {
        if ([25, 50, 75, 100].includes(progress)) {
          this.sendMicroConversion('video_progress', { progress });
          trackEvent('video_milestone', { progress });
        }
      },
      scroll_depth: (depth: number) => {
        if (depth >= 75 && !this.microConversions.has('engaged_scroll')) {
          this.microConversions.add('engaged_scroll');
          this.sendMicroConversion('scroll_depth', { depth });
          trackEvent('engaged_scroll', { depth });
        }
      },
      time_on_page: (seconds: number) => {
        if (seconds >= 60 && !this.microConversions.has('engaged_time_60')) {
          this.microConversions.add('engaged_time_60');
          this.sendMicroConversion('time_on_page', { seconds });
          trackEvent('engaged_time', { seconds });
        }
      },
      content_engagement: (content: { type: string; id: string }) => {
        this.sendMicroConversion('content_engagement', content);
        trackEvent('content_interaction', content);
      },
      resource_download: (resource: { name: string; type: string }) => {
        this.sendMicroConversion('resource_download', resource);
        trackEvent('download', resource);
      },
      faq_interaction: (faq: { question: string; expanded: boolean }) => {
        this.sendMicroConversion('faq_interaction', faq);
        trackEvent('faq_interaction', faq);
      },
      click_to_call: (phoneNumber: string) => {
        this.sendMicroConversion('click_to_call', { phoneNumber });
        trackEvent('phone_click', { phoneNumber });
        // Also track as a goal
        this.trackGoal('Phone Call Click');
      },
    };

    const handler = microConversionHandlers[type];
    if (handler) {
      handler(data);
    }
  }

  private async sendMicroConversion(type: string, metadata: any) {
    try {
      await fetch('/api/analytics/micro-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.getSessionId(),
          visitorId: this.getVisitorId(),
          type,
          targetIdentifier: window.location.href,
          value: metadata.progress || metadata.depth || metadata.seconds || 1,
          metadata,
        }),
      });
    } catch (error) {
      logger.error('Error tracking micro conversion:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  trackFormInteraction(formId: string, fieldName: string, event: 'focus' | 'blur' | 'change') {
    const key = `form_${formId}`;
    if (!this.microConversions.has(key)) {
      this.microConversions.add(key);
      this.trackFormAnalytics(formId, 'start');
    }

    // Track field interaction
    this.trackFormAnalytics(formId, 'field_interaction', {
      fieldName,
      event,
      timestamp: Date.now(),
    });
  }

  async trackFormSubmission(formId: string, success: boolean, formData?: any, errors?: any) {
    await this.trackFormAnalytics(formId, 'submission', {
      success,
      formData,
      errors,
    });

    if (success) {
      // Check if this form matches any conversion goals
      const formGoals = this.goals.filter(g => 
        g.type === 'form_submission' && 
        (g.target_selector === formId || window.location.pathname.includes(g.target_url || ''))
      );

      for (const goal of formGoals) {
        await this.trackGoal(goal.name, undefined, formData);
      }
    }
  }

  private async trackFormAnalytics(formId: string, action: string, data?: any) {
    try {
      await fetch('/api/analytics/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.getSessionId(),
          visitorId: this.getVisitorId(),
          formId,
          action,
          data,
        }),
      });
    } catch (error) {
      logger.error('Error tracking form analytics:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  private getAttributionData() {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    
    // Check session storage for original attribution
    const stored = sessionStorage.getItem('attribution_data');
    if (stored) {
      return JSON.parse(stored);
    }

    const attribution = {
      source: params.get('utm_source') || this.getReferrerSource(referrer),
      medium: params.get('utm_medium') || this.getReferrerMedium(referrer),
      campaign: params.get('utm_campaign'),
      term: params.get('utm_term'),
      content: params.get('utm_content'),
    };

    // Store for session
    sessionStorage.setItem('attribution_data', JSON.stringify(attribution));
    
    return attribution;
  }

  private getReferrerSource(referrer: string): string | null {
    if (!referrer) return 'direct';
    
    try {
      const url = new URL(referrer);
      const domain = url.hostname.replace('www.', '');
      
      // Check common sources
      if (domain.includes('google')) return 'google';
      if (domain.includes('bing')) return 'bing';
      if (domain.includes('facebook')) return 'facebook';
      if (domain.includes('linkedin')) return 'linkedin';
      if (domain.includes('twitter') || domain === 'x.com') return 'twitter';
      
      return domain;
    } catch {
      return null;
    }
  }

  private getReferrerMedium(referrer: string): string | null {
    if (!referrer) return null;
    
    const source = this.getReferrerSource(referrer);
    
    // Map sources to mediums
    const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo'];
    const socialNetworks = ['facebook', 'linkedin', 'twitter', 'instagram'];
    
    if (searchEngines.includes(source || '')) return 'organic';
    if (socialNetworks.includes(source || '')) return 'social';
    
    return 'referral';
  }

  private getSessionId(): string {
    return sessionStorage.getItem('hm_session_id') || 'unknown';
  }

  private getVisitorId(): string {
    return localStorage.getItem('hm_visitor_id') || 'unknown';
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  // Public method to track custom goals
  trackCustomGoal(eventName: string, eventData: any) {
    const customGoal = this.goals.find(g => 
      g.type === 'custom' && g.target_event === eventName
    );

    if (customGoal) {
      this.trackGoal(customGoal.name, eventData.value);
    }

    // Always track as event
    trackEvent('custom_goal', {
      event_name: eventName,
      ...eventData,
    });
  }

  // Get current conversion path
  getConversionPath(): string[] {
    return this.pageHistory;
  }

  // Check if visitor is likely to convert
  getConversionProbability(): number {
    // Simple heuristic based on engagement
    let score = 0;
    
    // Page views
    score += Math.min(this.pageHistory.length * 10, 30);
    
    // Time on site
    const timeOnSite = (Date.now() - this.sessionStartTime) / 1000;
    score += Math.min(timeOnSite / 60 * 10, 30); // Up to 30 points for 3+ minutes
    
    // Micro conversions
    score += this.microConversions.size * 5;
    
    // Viewed high-value pages
    const highValuePages = ['/platforms', '/services', '/contact', '/demo'];
    const viewedHighValue = this.pageHistory.some(url => 
      highValuePages.some(page => url.includes(page))
    );
    if (viewedHighValue) score += 20;
    
    return Math.min(score, 100);
  }
}