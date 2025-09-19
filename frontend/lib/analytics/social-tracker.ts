import { createClient } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

interface ShareData {
  platform: string;
  contentId: string;
  contentUrl: string;
  sessionId?: string;
  visitorId?: string;
}

export async function trackSocialShare(data: ShareData) {
  try {
    // Track in our analytics
    const response = await fetch('/api/analytics/social-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error('Failed to track social share', { 
        error: new Error(`HTTP ${response.status}: ${response.statusText}`), 
        action: 'error_logged',
        metadata: { status: response.status, statusText: response.statusText }
      });
    }

    // Also track in Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'share', {
        method: data.platform,
        content_type: 'article',
        content_id: data.contentId,
      });
    }
  } catch (error) {
    logger.error('Error tracking social share:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
  }
}

export function generateShareUrl(platform: string, url: string, title: string, description?: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = description ? encodeURIComponent(description) : '';

  const shareUrls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription || encodedTitle}%0A%0A${encodedUrl}`,
  };

  return shareUrls[platform] || '';
}

export async function trackCopyToClipboard(contentId: string, contentUrl: string) {
  await trackSocialShare({
    platform: 'copy',
    contentId,
    contentUrl,
  });
}

export function initializeSocialTracking() {
  if (typeof window === 'undefined') return;

  // Track native share API usage
  if (navigator.share) {
    const originalShare = navigator.share.bind(navigator);
    navigator.share = async (data: any) => {
      try {
        await originalShare(data);
        // Track successful share
        if (data.url) {
          await trackSocialShare({
            platform: 'native',
            contentId: data.url,
            contentUrl: data.url,
          });
        }
      } catch (error) {
        // User cancelled or error occurred
        logger.error('Share failed:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
      }
    };
  }
}