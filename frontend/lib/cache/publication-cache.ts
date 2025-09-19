// Publication Caching Service
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

import { Publication, Author, ResearchTopic, PublicationAnalytics } from '@/types/publications';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items in cache
  enableCompression: boolean;
}

export class PublicationCacheService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig = {
    ttl: 3600, // 1 hour default
    maxSize: 1000,
    enableCompression: true
  }) {
    this.config = config;
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    });
  }

  /**
   * Delete cached data
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would be calculated in a real implementation
      missRate: 0, // Would be calculated in a real implementation
      evictionCount: 0 // Would be tracked in a real implementation
    };
  }

  /**
   * Cache publication list
   */
  cachePublicationList(
    organizationId: string,
    filters: any,
    publications: Publication[],
    total: number,
    ttl?: number
  ): void {
    const key = this.generatePublicationListKey(organizationId, filters);
    this.set(key, { publications, total }, ttl);
  }

  /**
   * Get cached publication list
   */
  getCachedPublicationList(organizationId: string, filters: any): {
    publications: Publication[];
    total: number;
  } | null {
    const key = this.generatePublicationListKey(organizationId, filters);
    return this.get(key);
  }

  /**
   * Cache single publication
   */
  cachePublication(publicationId: string, publication: Publication, ttl?: number): void {
    const key = this.generatePublicationKey(publicationId);
    this.set(key, publication, ttl);
  }

  /**
   * Get cached publication
   */
  getCachedPublication(publicationId: string): Publication | null {
    const key = this.generatePublicationKey(publicationId);
    return this.get(key);
  }

  /**
   * Cache author list
   */
  cacheAuthorList(
    organizationId: string,
    filters: any,
    authors: Author[],
    total: number,
    ttl?: number
  ): void {
    const key = this.generateAuthorListKey(organizationId, filters);
    this.set(key, { authors, total }, ttl);
  }

  /**
   * Get cached author list
   */
  getCachedAuthorList(organizationId: string, filters: any): {
    authors: Author[];
    total: number;
  } | null {
    const key = this.generateAuthorListKey(organizationId, filters);
    return this.get(key);
  }

  /**
   * Cache single author
   */
  cacheAuthor(authorId: string, author: Author, ttl?: number): void {
    const key = this.generateAuthorKey(authorId);
    this.set(key, author, ttl);
  }

  /**
   * Get cached author
   */
  getCachedAuthor(authorId: string): Author | null {
    const key = this.generateAuthorKey(authorId);
    return this.get(key);
  }

  /**
   * Cache research topic list
   */
  cacheResearchTopicList(
    organizationId: string,
    filters: any,
    topics: ResearchTopic[],
    total: number,
    ttl?: number
  ): void {
    const key = this.generateResearchTopicListKey(organizationId, filters);
    this.set(key, { topics, total }, ttl);
  }

  /**
   * Get cached research topic list
   */
  getCachedResearchTopicList(organizationId: string, filters: any): {
    topics: ResearchTopic[];
    total: number;
  } | null {
    const key = this.generateResearchTopicListKey(organizationId, filters);
    return this.get(key);
  }

  /**
   * Cache single research topic
   */
  cacheResearchTopic(topicId: string, topic: ResearchTopic, ttl?: number): void {
    const key = this.generateResearchTopicKey(topicId);
    this.set(key, topic, ttl);
  }

  /**
   * Get cached research topic
   */
  getCachedResearchTopic(topicId: string): ResearchTopic | null {
    const key = this.generateResearchTopicKey(topicId);
    return this.get(key);
  }

  /**
   * Cache publication analytics
   */
  cachePublicationAnalytics(
    publicationId: string,
    analytics: PublicationAnalytics[],
    ttl?: number
  ): void {
    const key = this.generateAnalyticsKey(publicationId);
    this.set(key, analytics, ttl);
  }

  /**
   * Get cached publication analytics
   */
  getCachedPublicationAnalytics(publicationId: string): PublicationAnalytics[] | null {
    const key = this.generateAnalyticsKey(publicationId);
    return this.get(key);
  }

  /**
   * Cache trending topics
   */
  cacheTrendingTopics(
    specialty: string,
    timeframe: string,
    topics: string[],
    ttl?: number
  ): void {
    const key = this.generateTrendingTopicsKey(specialty, timeframe);
    this.set(key, topics, ttl);
  }

  /**
   * Get cached trending topics
   */
  getCachedTrendingTopics(specialty: string, timeframe: string): string[] | null {
    const key = this.generateTrendingTopicsKey(specialty, timeframe);
    return this.get(key);
  }

  /**
   * Cache research search results
   */
  cacheResearchSearchResults(
    query: string,
    results: any[],
    ttl?: number
  ): void {
    const key = this.generateResearchSearchKey(query);
    this.set(key, results, ttl);
  }

  /**
   * Get cached research search results
   */
  getCachedResearchSearchResults(query: string): any[] | null {
    const key = this.generateResearchSearchKey(query);
    return this.get(key);
  }

  /**
   * Invalidate cache for a publication
   */
  invalidatePublication(publicationId: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(`publication:${publicationId}`) || 
          key.includes(`publications:list`) ||
          key.includes(`analytics:${publicationId}`)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Invalidate cache for an author
   */
  invalidateAuthor(authorId: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(`author:${authorId}`) || 
          key.includes(`authors:list`)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Invalidate cache for a research topic
   */
  invalidateResearchTopic(topicId: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(`topic:${topicId}`) || 
          key.includes(`topics:list`)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Invalidate all cache for an organization
   */
  invalidateOrganization(organizationId: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(`org:${organizationId}`)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Generate cache key for publication list
   */
  private generatePublicationListKey(organizationId: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `publications:list:org:${organizationId}:${this.hashString(filterString)}`;
  }

  /**
   * Generate cache key for single publication
   */
  private generatePublicationKey(publicationId: string): string {
    return `publication:${publicationId}`;
  }

  /**
   * Generate cache key for author list
   */
  private generateAuthorListKey(organizationId: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `authors:list:org:${organizationId}:${this.hashString(filterString)}`;
  }

  /**
   * Generate cache key for single author
   */
  private generateAuthorKey(authorId: string): string {
    return `author:${authorId}`;
  }

  /**
   * Generate cache key for research topic list
   */
  private generateResearchTopicListKey(organizationId: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `topics:list:org:${organizationId}:${this.hashString(filterString)}`;
  }

  /**
   * Generate cache key for single research topic
   */
  private generateResearchTopicKey(topicId: string): string {
    return `topic:${topicId}`;
  }

  /**
   * Generate cache key for analytics
   */
  private generateAnalyticsKey(publicationId: string): string {
    return `analytics:${publicationId}`;
  }

  /**
   * Generate cache key for trending topics
   */
  private generateTrendingTopicsKey(specialty: string, timeframe: string): string {
    return `trending:${specialty}:${timeframe}`;
  }

  /**
   * Generate cache key for research search
   */
  private generateResearchSearchKey(query: string): string {
    return `research:search:${this.hashString(query)}`;
  }

  /**
   * Hash string for cache key
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Evict oldest items from cache
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      const item = this.cache.get(key);
      if (item && now - item.timestamp > item.ttl * 1000) {
        this.cache.delete(key);
      }
    });
  }
}

// Export singleton instance
export const publicationCache = new PublicationCacheService();
