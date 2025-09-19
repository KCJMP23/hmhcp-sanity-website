// Cloudflare CDN configuration for global content delivery
export const cloudflareConfig = {
  // Zone configuration
  zone: {
    id: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  },

  // Cache rules for different content types
  cacheRules: {
    // Static assets - cache for 1 year
    static: {
      pattern: /\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|eot)$/i,
      cacheControl: 'public, max-age=31536000, immutable',
      edgeTTL: 31536000, // 1 year
      browserTTL: 31536000, // 1 year
    },

    // JavaScript and CSS - cache with revalidation
    scripts: {
      pattern: /\.(js|css)$/i,
      cacheControl: 'public, max-age=2592000, must-revalidate',
      edgeTTL: 2592000, // 30 days
      browserTTL: 86400, // 1 day
    },

    // HTML pages - short cache with revalidation
    html: {
      pattern: /\.html$/i,
      cacheControl: 'public, max-age=300, must-revalidate',
      edgeTTL: 300, // 5 minutes
      browserTTL: 0, // Always revalidate
    },

    // API responses - no cache by default
    api: {
      pattern: /^\/api\//,
      cacheControl: 'no-store, no-cache, must-revalidate',
      edgeTTL: 0,
      browserTTL: 0,
    },

    // Dynamic pages with ISR
    isr: {
      pattern: /^\/blog\/|^\/platforms\//,
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
      edgeTTL: 60,
      browserTTL: 0,
    },
  },

  // Purge strategies
  purgeStrategies: {
    // Purge by URL
    byUrl: async (urls: string[]) => {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: urls }),
        }
      );
      return response.json();
    },

    // Purge by tag
    byTag: async (tags: string[]) => {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags }),
        }
      );
      return response.json();
    },

    // Purge everything (use sparingly)
    all: async () => {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        }
      );
      return response.json();
    },
  },

  // Geo-routing configuration
  geoRouting: {
    enabled: true,
    regions: {
      'US': { origin: 'us-east-1.hmhealthcare.com' },
      'EU': { origin: 'eu-west-1.hmhealthcare.com' },
      'ASIA': { origin: 'ap-southeast-1.hmhealthcare.com' },
    },
    defaultOrigin: 'us-east-1.hmhealthcare.com',
  },

  // Performance optimizations
  optimizations: {
    // Polish - automatic image optimization
    polish: {
      enabled: true,
      webp: true,
      avif: true,
      quality: 85,
    },

    // Mirage - responsive image delivery
    mirage: {
      enabled: true,
    },

    // Rocket Loader - optimize JavaScript loading
    rocketLoader: {
      enabled: true,
    },

    // Auto Minify
    minify: {
      html: true,
      css: true,
      javascript: true,
    },

    // Brotli compression
    brotli: {
      enabled: true,
    },
  },

  // Security settings
  security: {
    // WAF rules
    waf: {
      enabled: true,
      sensitivityLevel: 'high',
    },

    // DDoS protection
    ddos: {
      enabled: true,
      threshold: 10000, // requests per minute
    },

    // Bot management
    botManagement: {
      enabled: true,
      challengeSuspiciousBots: true,
    },
  },

  // Analytics and monitoring
  analytics: {
    enabled: true,
    webAnalytics: true,
    rumAnalytics: true,
  },
};

// Helper function to get cache headers based on content type
export function getCacheHeaders(pathname: string): Record<string, string> {
  const { cacheRules } = cloudflareConfig;

  // Check each cache rule
  for (const [key, rule] of Object.entries(cacheRules)) {
    if (rule.pattern.test(pathname)) {
      return {
        'Cache-Control': rule.cacheControl,
        'CDN-Cache-Control': `max-age=${rule.edgeTTL}`,
      };
    }
  }

  // Default cache headers
  return {
    'Cache-Control': 'public, max-age=0, must-revalidate',
  };
}

// Function to add Cloudflare cache tags
export function addCacheTags(headers: Headers, tags: string[]): void {
  headers.set('Cache-Tag', tags.join(','));
}

// Function to check cache hit rate
export async function getCacheAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/analytics/dashboard?since=-${timeRange}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  const data = await response.json();
  
  if (data.success) {
    const totals = data.result.totals;
    const cacheHitRate = (totals.cachedRequests / totals.requests) * 100;
    
    return {
      requests: totals.requests,
      cachedRequests: totals.cachedRequests,
      uncachedRequests: totals.uncachedRequests,
      cacheHitRate: cacheHitRate.toFixed(2) + '%',
      bandwidth: {
        total: totals.bytes,
        cached: totals.cachedBytes,
        saved: totals.bytes - totals.cachedBytes,
      },
    };
  }

  return null;
}