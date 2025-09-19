/**
 * Optimized initialization module
 * Replaces heavy initialization code with lightweight alternatives
 */

// Lazy Redis connection
let redisClient: any = null;
export async function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    const { Redis } = await import('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      enableOfflineQueue: false,
    });
  }
  return redisClient;
}

// Lazy Sentry initialization
let sentryInitialized = false;
export async function initSentry() {
  if (!sentryInitialized && process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      enabled: true,
      beforeSend(event) {
        // Filter out non-critical errors
        if (event.level === 'info' || event.level === 'debug') {
          return null;
        }
        return event;
      },
    });
    sentryInitialized = true;
  }
}

// Lazy Supabase client
let supabaseClient: any = null;
export async function getSupabaseClient() {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false, // Disable session persistence for server
          autoRefreshToken: false,
        },
        global: {
          fetch: fetch.bind(globalThis), // Use native fetch
        },
      }
    );
  }
  return supabaseClient;
}

// Optimized module preloading
export function preloadCriticalModules() {
  if (typeof window === 'undefined') {
    // Server-side preloading
    const modules = [
      'react',
      'react-dom',
      'next/navigation',
      'clsx',
      'tailwind-merge',
    ];
    
    modules.forEach(module => {
      try {
        require(module);
      } catch (e) {
        // Ignore errors
      }
    });
  }
}