'use client'

/**
 * Offline Queue Management System
 * Handles queuing, persistence, and sync of offline changes using IndexedDB and localStorage fallback
 */

// IndexedDB Configuration
const DB_NAME = 'AutoSaveOfflineDB'
const DB_VERSION = 1
const QUEUE_STORE = 'offline_queue'
const HISTORY_STORE = 'version_history'

export interface OfflineQueueItem {
  id: string
  contentType: 'post' | 'page' | 'media'
  contentId?: string
  data: any
  operation: 'create' | 'update' | 'delete'
  timestamp: Date
  retryCount: number
  maxRetries: number
  userId?: string
  priority: 'low' | 'normal' | 'high'
  metadata?: Record<string, any>
}

export interface VersionHistoryItem {
  id: string
  contentType: 'post' | 'page' | 'media'
  contentId: string
  data: any
  version: number
  timestamp: Date
  userId?: string
  operation: 'save' | 'auto-save' | 'recovery'
  metadata?: Record<string, any>
}

class OfflineQueueManager {
  private db: IDBDatabase | null = null
  private isInitialized = false
  private initPromise: Promise<void> | null = null

  /**
   * Initialize IndexedDB or fallback to localStorage
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._init()
    return this.initPromise
  }

  private async _init(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Try IndexedDB first
      if ('indexedDB' in window) {
        await this.initIndexedDB()
      } else {
        console.warn('IndexedDB not supported, using localStorage fallback')
      }
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      console.log('Falling back to localStorage')
    }

    this.isInitialized = true
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create offline queue store
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
          queueStore.createIndex('contentType', 'contentType', { unique: false })
          queueStore.createIndex('priority', 'priority', { unique: false })
          queueStore.createIndex('retryCount', 'retryCount', { unique: false })
        }

        // Create version history store
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' })
          historyStore.createIndex('contentId', 'contentId', { unique: false })
          historyStore.createIndex('timestamp', 'timestamp', { unique: false })
          historyStore.createIndex('version', 'version', { unique: false })
        }
      }
    })
  }

  /**
   * Add item to offline queue
   */
  async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.init()

    const queueItem: OfflineQueueItem = {
      ...item,
      id: `${item.contentType}_${item.contentId || 'new'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    }

    try {
      if (this.db) {
        await this.addToIndexedDB(QUEUE_STORE, queueItem)
      } else {
        await this.addToLocalStorage('queue', queueItem)
      }
    } catch (error) {
      console.error('Failed to add to queue:', error)
      // Fallback to localStorage
      await this.addToLocalStorage('queue', queueItem)
    }

    return queueItem.id
  }

  /**
   * Get all items in queue, optionally filtered
   */
  async getQueueItems(filter?: {
    contentType?: string
    priority?: string
    maxRetries?: number
  }): Promise<OfflineQueueItem[]> {
    await this.init()

    try {
      let items: OfflineQueueItem[]

      if (this.db) {
        items = await this.getFromIndexedDB(QUEUE_STORE)
      } else {
        items = await this.getFromLocalStorage('queue')
      }

      // Apply filters
      if (filter) {
        items = items.filter(item => {
          if (filter.contentType && item.contentType !== filter.contentType) return false
          if (filter.priority && item.priority !== filter.priority) return false
          if (filter.maxRetries && item.retryCount >= filter.maxRetries) return false
          return true
        })
      }

      // Sort by priority and timestamp
      return items.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 }
        const aPriority = priorityOrder[a.priority] || 2
        const bPriority = priorityOrder[b.priority] || 2
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority // Higher priority first
        }
        
        return a.timestamp.getTime() - b.timestamp.getTime() // Older first
      })
    } catch (error) {
      console.error('Failed to get queue items:', error)
      return []
    }
  }

  /**
   * Update queue item (usually to increment retry count)
   */
  async updateQueueItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    await this.init()

    try {
      if (this.db) {
        const existing = await this.getByIdFromIndexedDB(QUEUE_STORE, id)
        if (existing) {
          const updated = { ...existing, ...updates }
          await this.addToIndexedDB(QUEUE_STORE, updated)
        }
      } else {
        const items = await this.getFromLocalStorage('queue')
        const index = items.findIndex(item => item.id === id)
        if (index !== -1) {
          items[index] = { ...items[index], ...updates }
          await this.saveToLocalStorage('queue', items)
        }
      }
    } catch (error) {
      console.error('Failed to update queue item:', error)
    }
  }

  /**
   * Remove item from queue
   */
  async removeFromQueue(id: string): Promise<void> {
    await this.init()

    try {
      if (this.db) {
        await this.removeFromIndexedDB(QUEUE_STORE, id)
      } else {
        const items = await this.getFromLocalStorage('queue')
        const filtered = items.filter(item => item.id !== id)
        await this.saveToLocalStorage('queue', filtered)
      }
    } catch (error) {
      console.error('Failed to remove from queue:', error)
    }
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    await this.init()

    try {
      if (this.db) {
        await this.clearIndexedDBStore(QUEUE_STORE)
      } else {
        localStorage.removeItem('autosave_offline_queue')
      }
    } catch (error) {
      console.error('Failed to clear queue:', error)
    }
  }

  /**
   * Add version to history
   */
  async addToHistory(item: Omit<VersionHistoryItem, 'id' | 'timestamp'>): Promise<string> {
    await this.init()

    const historyItem: VersionHistoryItem = {
      ...item,
      id: `${item.contentType}_${item.contentId}_v${item.version}_${Date.now()}`,
      timestamp: new Date()
    }

    try {
      if (this.db) {
        await this.addToIndexedDB(HISTORY_STORE, historyItem)
      } else {
        await this.addToLocalStorage('history', historyItem)
      }

      // Keep only last 20 versions per content item
      await this.cleanupHistory(item.contentType, item.contentId, 20)
    } catch (error) {
      console.error('Failed to add to history:', error)
    }

    return historyItem.id
  }

  /**
   * Get version history for content
   */
  async getHistory(contentType: string, contentId: string, limit = 10): Promise<VersionHistoryItem[]> {
    await this.init()

    try {
      let items: VersionHistoryItem[]

      if (this.db) {
        items = await this.getFromIndexedDB(HISTORY_STORE)
      } else {
        items = await this.getFromLocalStorage('history')
      }

      return items
        .filter(item => item.contentType === contentType && item.contentId === contentId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get history:', error)
      return []
    }
  }

  /**
   * Get recovery data for unsaved changes
   */
  async getRecoveryData(contentType: string, contentId?: string): Promise<any> {
    const key = `autosave_recovery_${contentType}_${contentId || 'new'}`
    
    try {
      const data = localStorage.getItem(key)
      if (data) {
        const parsed = JSON.parse(data)
        // Check if data is recent (within last 24 hours)
        const timestamp = new Date(parsed.timestamp)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        if (timestamp > dayAgo) {
          return parsed
        } else {
          // Clean up old recovery data
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('Failed to get recovery data:', error)
    }
    
    return null
  }

  /**
   * Save recovery data
   */
  async saveRecoveryData(contentType: string, contentId: string | undefined, data: any): Promise<void> {
    const key = `autosave_recovery_${contentType}_${contentId || 'new'}`
    
    try {
      const recoveryData = {
        data,
        timestamp: new Date().toISOString(),
        contentType,
        contentId
      }
      
      localStorage.setItem(key, JSON.stringify(recoveryData))
    } catch (error) {
      console.error('Failed to save recovery data:', error)
    }
  }

  /**
   * Clear recovery data
   */
  async clearRecoveryData(contentType: string, contentId?: string): Promise<void> {
    const key = `autosave_recovery_${contentType}_${contentId || 'new'}`
    localStorage.removeItem(key)
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number
    byContentType: Record<string, number>
    byPriority: Record<string, number>
    failedItems: number
  }> {
    const items = await this.getQueueItems()
    
    const stats = {
      total: items.length,
      byContentType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      failedItems: 0
    }

    items.forEach(item => {
      // Count by content type
      stats.byContentType[item.contentType] = (stats.byContentType[item.contentType] || 0) + 1
      
      // Count by priority
      stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1
      
      // Count failed items (reached max retries)
      if (item.retryCount >= item.maxRetries) {
        stats.failedItems++
      }
    })

    return stats
  }

  // Private IndexedDB helper methods
  private async addToIndexedDB(storeName: string, item: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async getFromIndexedDB(storeName: string): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  private async getByIdFromIndexedDB(storeName: string, id: string): Promise<any> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async removeFromIndexedDB(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async clearIndexedDBStore(storeName: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Private localStorage helper methods
  private async addToLocalStorage(type: 'queue' | 'history', item: any): Promise<void> {
    const key = `autosave_offline_${type}`
    const existing = this.getFromLocalStorageSync(type)
    existing.push(item)
    localStorage.setItem(key, JSON.stringify(existing))
  }

  private async getFromLocalStorage(type: 'queue' | 'history'): Promise<any[]> {
    return this.getFromLocalStorageSync(type)
  }

  private getFromLocalStorageSync(type: 'queue' | 'history'): any[] {
    const key = `autosave_offline_${type}`
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  private async saveToLocalStorage(type: 'queue' | 'history', items: any[]): Promise<void> {
    const key = `autosave_offline_${type}`
    localStorage.setItem(key, JSON.stringify(items))
  }

  private async cleanupHistory(contentType: string, contentId: string, keepCount: number): Promise<void> {
    const allHistory = await this.getHistory(contentType, contentId, 1000) // Get all
    
    if (allHistory.length > keepCount) {
      const toRemove = allHistory.slice(keepCount)
      
      for (const item of toRemove) {
        try {
          if (this.db) {
            await this.removeFromIndexedDB(HISTORY_STORE, item.id)
          } else {
            const items = await this.getFromLocalStorage('history')
            const filtered = items.filter(h => h.id !== item.id)
            await this.saveToLocalStorage('history', filtered)
          }
        } catch (error) {
          console.error('Failed to cleanup history item:', error)
        }
      }
    }
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager()

// Export utility functions
export const useOfflineQueue = () => {
  return {
    addToQueue: offlineQueue.addToQueue.bind(offlineQueue),
    getQueueItems: offlineQueue.getQueueItems.bind(offlineQueue),
    updateQueueItem: offlineQueue.updateQueueItem.bind(offlineQueue),
    removeFromQueue: offlineQueue.removeFromQueue.bind(offlineQueue),
    clearQueue: offlineQueue.clearQueue.bind(offlineQueue),
    addToHistory: offlineQueue.addToHistory.bind(offlineQueue),
    getHistory: offlineQueue.getHistory.bind(offlineQueue),
    getRecoveryData: offlineQueue.getRecoveryData.bind(offlineQueue),
    saveRecoveryData: offlineQueue.saveRecoveryData.bind(offlineQueue),
    clearRecoveryData: offlineQueue.clearRecoveryData.bind(offlineQueue),
    getQueueStats: offlineQueue.getQueueStats.bind(offlineQueue)
  }
}