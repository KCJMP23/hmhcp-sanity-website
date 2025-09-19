interface TrafficSource {
  referrerUrl?: string;
  referrerType: 'organic' | 'paid' | 'social' | 'direct' | 'email' | 'referral';
  referrerDomain?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}

interface UTMParams {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

const SEARCH_ENGINES = [
  'google.com',
  'bing.com',
  'yahoo.com',
  'duckduckgo.com',
  'baidu.com',
  'yandex.ru',
  'ask.com',
  'aol.com',
  'ecosia.org',
  'startpage.com',
  'qwant.com',
  'swisscows.com',
];

const SOCIAL_DOMAINS = [
  'facebook.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'instagram.com',
  'youtube.com',
  'pinterest.com',
  'reddit.com',
  'tumblr.com',
  'tiktok.com',
  'snapchat.com',
  'whatsapp.com',
  't.co', // Twitter short links
  'fb.me', // Facebook short links
  'lnkd.in', // LinkedIn short links
];

const EMAIL_DOMAINS = [
  'mail.google.com',
  'outlook.live.com',
  'mail.yahoo.com',
  'mail.aol.com',
  'mail.com',
  'protonmail.com',
  'tutanota.com',
  'zoho.com',
];

export function parseTrafficSource(
  referrer: string,
  utmParams: UTMParams
): TrafficSource {
  const source: TrafficSource = {
    referrerType: 'direct',
  };

  // UTM parameters take precedence
  if (utmParams.utm_source) {
    source.utmSource = utmParams.utm_source;
    source.utmMedium = utmParams.utm_medium;
    source.utmCampaign = utmParams.utm_campaign;
    source.utmTerm = utmParams.utm_term;
    source.utmContent = utmParams.utm_content;

    // Determine type from UTM medium
    if (utmParams.utm_medium) {
      const medium = utmParams.utm_medium.toLowerCase();
      if (medium === 'cpc' || medium === 'ppc' || medium === 'paid') {
        source.referrerType = 'paid';
      } else if (medium === 'email') {
        source.referrerType = 'email';
      } else if (medium === 'social') {
        source.referrerType = 'social';
      } else if (medium === 'organic') {
        source.referrerType = 'organic';
      } else {
        source.referrerType = 'referral';
      }
    } else {
      // Default to referral if UTM source exists but no medium
      source.referrerType = 'referral';
    }
  }

  // Parse referrer URL
  if (referrer) {
    try {
      const url = new URL(referrer);
      const domain = url.hostname.replace('www.', '');
      
      source.referrerUrl = referrer;
      source.referrerDomain = domain;

      // Only classify referrer type if not already set by UTM
      if (!utmParams.utm_source) {
        if (isSearchEngine(domain)) {
          source.referrerType = 'organic';
        } else if (isSocialDomain(domain)) {
          source.referrerType = 'social';
        } else if (isEmailDomain(domain)) {
          source.referrerType = 'email';
        } else {
          source.referrerType = 'referral';
        }
      }
    } catch (error) {
      // Invalid referrer URL
      source.referrerUrl = referrer;
    }
  }

  return source;
}

function isSearchEngine(domain: string): boolean {
  return SEARCH_ENGINES.some(se => 
    domain === se || domain.endsWith(`.${se}`)
  );
}

function isSocialDomain(domain: string): boolean {
  return SOCIAL_DOMAINS.some(sd => 
    domain === sd || domain.endsWith(`.${sd}`)
  );
}

function isEmailDomain(domain: string): boolean {
  return EMAIL_DOMAINS.some(ed => 
    domain === ed || domain.endsWith(`.${ed}`)
  );
}

export function extractSearchQuery(referrer: string): string | null {
  try {
    const url = new URL(referrer);
    const params = new URLSearchParams(url.search);
    
    // Common search query parameters
    const queryParams = ['q', 'query', 'search', 'searchTerm', 'wd', 'text'];
    
    for (const param of queryParams) {
      const value = params.get(param);
      if (value) return value;
    }
    
    return null;
  } catch {
    return null;
  }
}