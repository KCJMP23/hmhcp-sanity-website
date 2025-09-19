/**
 * Enhanced Incremental Static Regeneration (ISR) Cache Handler
 * Production-optimized caching for faster page loads and intelligent memory management
 */

const fs = require('fs');
const path = require('path');

// Enhanced configuration
const CACHE_CONFIG = {
  MEMORY_SIZE: 200 * 1024 * 1024, // 200MB in memory cache
  DEFAULT_TTL: 60 * 60 * 1000, // 1 hour
  MAX_CACHE_ENTRIES: 10000,
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  ENABLE_DISK_CACHE: process.env.NODE_ENV === 'production',
  DISK_CACHE_PATH: path.join(process.cwd(), '.next/cache/custom'),
};

// Simple LRU cache implementation
class LRUCache {
  constructor(maxSize, maxEntries) {
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
    this.cache = new Map();
    this.sizes = new Map();
    this.currentSize = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      
      // Check expiration
      if (item.expiry && Date.now() > item.expiry) {
        this.delete(key);
        return null;
      }
      
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
      return item.data;
    }
    return null;
  }

  set(key, data, ttl) {
    const size = this.estimateSize(data);
    const expiry = ttl ? Date.now() + ttl : null;
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key);
    }
    
    // Check if we need to evict entries
    while (
      (this.currentSize + size > this.maxSize) ||
      (this.cache.size >= this.maxEntries)
    ) {
      if (this.cache.size === 0) break;
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }
    
    // Add new entry
    this.cache.set(key, { data, expiry });
    this.sizes.set(key, size);
    this.currentSize += size;
  }

  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      const size = this.sizes.get(key) || 0;
      this.sizes.delete(key);
      this.currentSize -= size;
    }
  }

  clear() {
    this.cache.clear();
    this.sizes.clear();
    this.currentSize = 0;
  }

  has(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      if (item.expiry && Date.now() > item.expiry) {
        this.delete(key);
        return false;
      }
      return true;
    }
    return false;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if can't estimate
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      maxEntries: this.maxEntries,
      memoryUsagePercent: (this.currentSize / this.maxSize) * 100,
    };
  }
}

// File system cache for persistence
class FileSystemCache {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getFilePath(key) {
    const hash = require('crypto').createHash('md5').update(key).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }

  async get(key) {
    try {
      const filePath = this.getFilePath(key);
      if (!fs.existsSync(filePath)) return null;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const item = JSON.parse(content);
      
      // Check expiration
      if (item.expiry && Date.now() > item.expiry) {
        this.delete(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('FileSystem cache get error:', error.message);
      return null;
    }
  }

  async set(key, data, ttl) {
    try {
      const filePath = this.getFilePath(key);
      const expiry = ttl ? Date.now() + ttl : null;
      const item = { data, expiry, timestamp: Date.now() };
      
      fs.writeFileSync(filePath, JSON.stringify(item));
    } catch (error) {
      console.warn('FileSystem cache set error:', error.message);
    }
  }

  async delete(key) {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('FileSystem cache delete error:', error.message);
    }
  }

  async clear() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      }
    } catch (error) {
      console.warn('FileSystem cache clear error:', error.message);
    }
  }

  async cleanup() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const now = Date.now();
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.cacheDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const item = JSON.parse(content);
        
        if (item.expiry && now > item.expiry) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.warn('FileSystem cache cleanup error:', error.message);
    }
  }
}

// Enhanced cache handler
class EnhancedCacheHandler {
  constructor(options = {}) {
    this.memoryCache = new LRUCache(
      CACHE_CONFIG.MEMORY_SIZE,
      CACHE_CONFIG.MAX_CACHE_ENTRIES
    );
    
    this.fileCache = CACHE_CONFIG.ENABLE_DISK_CACHE
      ? new FileSystemCache(CACHE_CONFIG.DISK_CACHE_PATH)
      : null;
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  async get(key) {
    try {
      // Try memory cache first
      const memoryData = this.memoryCache.get(key);
      if (memoryData !== null) {
        this.stats.hits++;
        return memoryData;
      }
      
      // Try file cache if enabled
      if (this.fileCache) {
        const fileData = await this.fileCache.get(key);
        if (fileData !== null) {
          // Promote to memory cache
          this.memoryCache.set(key, fileData, CACHE_CONFIG.DEFAULT_TTL);
          this.stats.hits++;
          return fileData;
        }
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set(key, data, ctx) {
    try {
      const ttl = ctx?.revalidate ? ctx.revalidate * 1000 : CACHE_CONFIG.DEFAULT_TTL;
      
      // Store in memory cache
      this.memoryCache.set(key, data, ttl);
      
      // Store in file cache if enabled
      if (this.fileCache) {
        await this.fileCache.set(key, data, ttl);
      }
      
      this.stats.sets++;
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key) {
    try {
      this.memoryCache.delete(key);
      
      if (this.fileCache) {
        await this.fileCache.delete(key);
      }
      
      this.stats.deletes++;
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async revalidateTag(tag) {
    try {
      const keys = this.memoryCache.keys();
      const keysToDelete = [];
      
      for (const key of keys) {
        const value = this.memoryCache.get(key);
        if (value && value.tags && value.tags.includes(tag)) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        await this.delete(key);
      }
      
      return { revalidated: keysToDelete.length };
    } catch (error) {
      console.error('Cache revalidateTag error:', error);
      return { revalidated: 0 };
    }
  }

  async clear() {
    try {
      this.memoryCache.clear();
      
      if (this.fileCache) {
        await this.fileCache.clear();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  getStats() {
    return {
      ...this.stats,
      memory: this.memoryCache.getStats(),
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  startCleanupInterval() {
    // Store interval reference to prevent memory leaks
    this.cleanupInterval = setInterval(async () => {
      try {
        if (this.fileCache) {
          await this.fileCache.cleanup();
        }
      } catch (error) {
        console.error('Cache cleanup error:', error);
      }
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  // Add cleanup method to prevent memory leaks
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
  }
}

// Export the handler
module.exports = EnhancedCacheHandler;