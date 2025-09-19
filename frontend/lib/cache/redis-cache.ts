/**
 * Redis Cache Implementation
 * Provides caching functionality for AI agents and healthcare data
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class RedisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private namespace: string;

  constructor(namespace: string = 'default') {
    this.namespace = namespace;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.getFullKey(key);
    const ttl = options.ttl || 3600; // Default 1 hour
    const expiresAt = Date.now() + (ttl * 1000);

    this.cache.set(fullKey, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return this.cache.delete(fullKey);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; namespace: string } {
    return {
      size: this.cache.size,
      namespace: this.namespace
    };
  }

  private getFullKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}

// Export default instance
export const redisCache = new RedisCache('ai-agents');

// Export cache for backward compatibility
export const cache = redisCache;
