// Analytics configuration for HM Healthcare Partners
export const analyticsConfig = {
  ga4: {
    measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '',
    serverApiSecret: process.env.GA4_API_SECRET || '',
  },
  gtm: {
    containerId: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || '',
  },
  linkedin: {
    partnerId: process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID || '',
  },
  cookieConsent: {
    cookieName: 'hm-consent',
    cookieExpiry: 365,
    categories: ['necessary', 'analytics', 'marketing'] as const,
  },
  tracking: {
    scrollDepth: {
      thresholds: [25, 50, 75, 100],
      debounceMs: 500,
    },
    timeOnPage: {
      intervals: [30, 60, 120, 300], // seconds
      engagementThreshold: 30, // seconds
    },
    forms: {
      abandonTimeout: 300000, // 5 minutes
      validationErrorTracking: true,
    },
    content: {
      videoEngagementThresholds: [0, 25, 50, 75, 100], // percentage
    },
  },
};

// Custom event types for type safety
export interface CustomEvents {
  // Form events
  form_start: { 
    form_name: string; 
    form_location: string;
    form_id?: string;
  };
  form_field_interaction: {
    form_name: string;
    field_name: string;
    action: 'focus' | 'blur' | 'change';
  };
  form_abandon: { 
    form_name: string; 
    fields_completed: number;
    total_fields: number;
    time_spent: number; // seconds
  };
  form_submit: {
    form_name: string;
    success: boolean;
    error_message?: string;
    time_to_complete: number; // seconds
  };
  form_validation_error: {
    form_name: string;
    field_name: string;
    error_type: string;
  };
  
  // Engagement events
  scroll_depth: { 
    percentage: number; 
    page_path: string;
    page_type: string;
  };
  time_on_page: {
    seconds: number;
    engaged: boolean;
    page_path: string;
    page_type: string;
  };
  
  // Platform interest events
  platform_interest: { 
    platform_name: string; 
    interaction_type: 'view' | 'hover' | 'click' | 'demo_request';
    time_spent?: number; // milliseconds
  };
  cta_click: {
    cta_text: string;
    cta_location: string;
    cta_destination: string;
  };
  
  // Content events
  content_download: { 
    content_type: 'pdf' | 'whitepaper' | 'case_study' | 'other';
    content_name: string;
    file_size?: number; // bytes
  };
  video_engagement: {
    video_title: string;
    action: 'play' | 'pause' | 'complete' | 'seek';
    duration: number; // seconds
    current_time: number; // seconds
    percentage_watched?: number;
  };
  
  // Navigation events
  navigation_pattern: {
    from_page: string;
    to_page: string;
    navigation_type: 'menu' | 'cta' | 'link' | 'back';
  };
  
  // B2B tracking
  company_identified: {
    company_name: string;
    company_size?: string;
    industry?: string;
    source: 'clearbit' | 'ip_lookup' | 'form_submission';
  };

  // Conversion tracking
  conversion: {
    goal_name: string;
    goal_value: number;
    goal_id: string;
  };

  // Micro conversion events
  video_milestone: {
    progress: number;
  };
  engaged_scroll: {
    depth: number;
  };
  engaged_time: {
    seconds: number;
  };
  content_interaction: {
    type: string;
    id: string;
  };
  download: {
    name: string;
    type: string;
  };
  faq_interaction: {
    question: string;
    expanded: boolean;
  };
  phone_click: {
    phoneNumber: string;
  };
  custom_goal: {
    event_name: string;
    [key: string]: any;
  };
}

// Helper type for event names
export type EventName = keyof CustomEvents;

// Helper type for event parameters
export type EventParams<T extends EventName> = CustomEvents[T];

// Cookie consent types
export type ConsentCategory = typeof analyticsConfig.cookieConsent.categories[number];

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

// Analytics provider types
export type AnalyticsProvider = 'ga4' | 'gtm' | 'linkedin' | 'custom';

// Page type classifications
export type PageType = 'home' | 'platform' | 'blog' | 'about' | 'contact' | 'legal' | 'other';

// Visitor segments
export interface VisitorSegment {
  type: 'new' | 'returning';
  source: 'organic' | 'paid' | 'social' | 'direct' | 'referral';
  device: 'mobile' | 'tablet' | 'desktop';
  industry?: string;
  company_size?: string;
}