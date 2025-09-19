import { headers } from 'next/headers';
import crypto from 'crypto';
import { analyticsConfig, EventName, EventParams } from './config';
import { logger } from '@/lib/logger';

// Generate a client ID for server-side tracking
function generateClientId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Get or generate session ID
function getSessionId(headersList: Headers): string {
  const sessionId = headersList.get('x-session-id');
  return sessionId || crypto.randomBytes(8).toString('hex');
}

// Get client IP address
function getClientIp(headersList: Headers): string | null {
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') || null;
}

// Server-side event tracking for GA4
export async function trackServerEvent<T extends EventName>(
  eventName: T,
  parameters: EventParams<T>,
  options?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    const headersList = await headers();
    const clientId = headersList.get('x-client-id') || generateClientId();
    const sessionId = options?.sessionId || getSessionId(headersList);
    const userAgent = options?.userAgent || headersList.get('user-agent') || '';
    
    const payload = {
      client_id: clientId,
      user_id: options?.userId,
      events: [{
        name: eventName,
        params: {
          ...parameters,
          engagement_time_msec: '100',
          session_id: sessionId,
        },
      }],
      user_properties: options?.userId ? {
        user_id: { value: options.userId },
      } : undefined,
    };

    // Send to GA4 Measurement Protocol
    if (analyticsConfig.ga4.measurementId && analyticsConfig.ga4.serverApiSecret) {
      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${analyticsConfig.ga4.measurementId}&api_secret=${analyticsConfig.ga4.serverApiSecret}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
          },
        }
      );

      if (!response.ok) {
        logger.error('GA4 server tracking failed:', { 
          error: new Error(`HTTP ${response.status}: ${response.statusText}`), 
          action: 'error_logged', 
          metadata: { status: response.status, statusText: response.statusText } 
        });
      }
    }
  } catch (error) {
    logger.error('Server-side tracking error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error: error } });
  }
}

// Track page view server-side
export async function trackServerPageView(
  path: string,
  title: string,
  options?: {
    userId?: string;
    referrer?: string;
  }
): Promise<void> {
  try {
    const headersList = await headers();
    const clientId = headersList.get('x-client-id') || generateClientId();
    const sessionId = getSessionId(headersList);
    const userAgent = headersList.get('user-agent') || '';
    const referrer = options?.referrer || headersList.get('referer') || '';
    
    const payload = {
      client_id: clientId,
      user_id: options?.userId,
      events: [{
        name: 'page_view',
        params: {
          page_location: `${process.env.NEXT_PUBLIC_SITE_URL}${path}`,
          page_path: path,
          page_title: title,
          page_referrer: referrer,
          engagement_time_msec: '100',
          session_id: sessionId,
        },
      }],
    };

    if (analyticsConfig.ga4.measurementId && analyticsConfig.ga4.serverApiSecret) {
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${analyticsConfig.ga4.measurementId}&api_secret=${analyticsConfig.ga4.serverApiSecret}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
          },
        }
      );
    }
  } catch (error) {
    logger.error('Server-side page view tracking error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
  }
}

// Track form submission server-side
export async function trackServerFormSubmission(
  formName: string,
  success: boolean,
  metadata?: {
    userId?: string;
    leadSource?: string;
    utmParams?: Record<string, string>;
  }
): Promise<void> {
  await trackServerEvent('form_submit', {
    form_name: formName,
    success,
    time_to_complete: 0, // Not available server-side
  }, {
    userId: metadata?.userId,
  });

  // Track lead source if provided
  if (metadata?.leadSource) {
    await trackServerEvent('form_submit', {
      form_name: formName,
      success,
      time_to_complete: 0,
    }, {
      userId: metadata?.userId,
    });
  }
}

// Track content download server-side
export async function trackServerContentDownload(
  contentType: 'pdf' | 'whitepaper' | 'case_study' | 'other',
  contentName: string,
  fileSize?: number,
  userId?: string
): Promise<void> {
  await trackServerEvent('content_download', {
    content_type: contentType,
    content_name: contentName,
    file_size: fileSize,
  }, {
    userId,
  });
}

// Track API errors for monitoring
export async function trackServerError(
  errorType: string,
  errorMessage: string,
  endpoint: string,
  statusCode?: number
): Promise<void> {
  try {
    const headersList = await headers();
    const clientId = headersList.get('x-client-id') || generateClientId();
    
    const payload = {
      client_id: clientId,
      events: [{
        name: 'exception',
        params: {
          description: `${errorType}: ${errorMessage}`,
          fatal: false,
          error_type: errorType,
          endpoint,
          status_code: statusCode,
          engagement_time_msec: '100',
        },
      }],
    };

    if (analyticsConfig.ga4.measurementId && analyticsConfig.ga4.serverApiSecret) {
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${analyticsConfig.ga4.measurementId}&api_secret=${analyticsConfig.ga4.serverApiSecret}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    logger.error('Failed to track server error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
  }
}

// Enhanced ecommerce tracking for lead value
export async function trackLeadValue(
  leadSource: string,
  leadQuality: 'high' | 'medium' | 'low',
  estimatedValue?: number,
  userId?: string
): Promise<void> {
  try {
    const headersList = await headers();
    const clientId = headersList.get('x-client-id') || generateClientId();
    
    const value = estimatedValue || (
      leadQuality === 'high' ? 1000 :
      leadQuality === 'medium' ? 500 : 100
    );

    const payload = {
      client_id: clientId,
      user_id: userId,
      events: [{
        name: 'generate_lead',
        params: {
          currency: 'USD',
          value,
          lead_source: leadSource,
          lead_quality: leadQuality,
          engagement_time_msec: '100',
        },
      }],
    };

    if (analyticsConfig.ga4.measurementId && analyticsConfig.ga4.serverApiSecret) {
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${analyticsConfig.ga4.measurementId}&api_secret=${analyticsConfig.ga4.serverApiSecret}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    logger.error('Failed to track lead value:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
  }
}

// Batch event tracking for performance
export async function trackServerEventBatch(
  events: Array<{
    name: EventName;
    params: EventParams<EventName>;
  }>,
  options?: {
    userId?: string;
    sessionId?: string;
  }
): Promise<void> {
  try {
    const headersList = await headers();
    const clientId = headersList.get('x-client-id') || generateClientId();
    const sessionId = options?.sessionId || getSessionId(headersList);
    
    const payload = {
      client_id: clientId,
      user_id: options?.userId,
      events: events.map(event => ({
        name: event.name,
        params: {
          ...event.params,
          engagement_time_msec: '100',
          session_id: sessionId,
        },
      })),
    };

    if (analyticsConfig.ga4.measurementId && analyticsConfig.ga4.serverApiSecret) {
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${analyticsConfig.ga4.measurementId}&api_secret=${analyticsConfig.ga4.serverApiSecret}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    logger.error('Batch server tracking error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
  }
}