// Publications Cache Management
// Story 3.7a: Basic Publications CRUD - QA Improvements
// Created: 2025-01-06

import { createClient } from '@/lib/supabase/server';

// In-memory cache for publications data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL configurations
const CACHE_TTL = {
  PUBLISHED: 5 * 60 * 1000, // 5 minutes for published publications
  DRAFT: 1 * 60 * 1000,     // 1 minute for draft publications
  LIST: 2 * 60 * 1000,      // 2 minutes for publication lists
  DEFAULT: 3 * 60 * 1000    // 3 minutes default
};

// Cache key generators
export function getCacheKey(type: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${type}:${sortedParams}`;
}

// Cache operations
export function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCache(key: string, data: any, ttl: number = CACHE_TTL.DEFAULT): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Publication-specific cache operations
export async function getCachedPublications(filters: any): Promise<any | null> {
  const key = getCacheKey('publications_list', filters);
  return getFromCache(key);
}

export function setCachedPublications(filters: any, data: any): void {
  const key = getCacheKey('publications_list', filters);
  setCache(key, data, CACHE_TTL.LIST);
}

export async function getCachedPublication(id: string): Promise<any | null> {
  const key = getCacheKey('publication', { id });
  return getFromCache(key);
}

export function setCachedPublication(id: string, data: any, status: string): void {
  const key = getCacheKey('publication', { id });
  const ttl = status === 'published' ? CACHE_TTL.PUBLISHED : CACHE_TTL.DRAFT;
  setCache(key, data, ttl);
}

// Cache warming for published publications
export async function warmPublishedPublicationsCache(): Promise<void> {
  try {
    const supabase = await createClient();
    
    const { data: publications } = await supabase
      .from('publications')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);

    if (publications) {
      const key = getCacheKey('published_publications');
      setCache(key, publications, CACHE_TTL.PUBLISHED);
    }
  } catch (error) {
    console.error('Error warming published publications cache:', error);
  }
}

// Cache statistics
export function getCacheStats(): {
  size: number;
  keys: string[];
  hitRate: number;
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    hitRate: 0 // Would need to track hits/misses for accurate calculation
  };
}

// Cache cleanup (run periodically)
export function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupExpiredCache, 5 * 60 * 1000);
