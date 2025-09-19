/**
 * Safe LocalStorage and SessionStorage utilities
 * Handles cases where storage might not be available or might throw errors
 */

interface StorageItem<T> {
  value: T
  timestamp: number
  expiry?: number
}

class SafeStorage {
  private isAvailable(storage: Storage): boolean {
    try {
      const test = '__storage_test__'
      storage.setItem(test, test)
      storage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  private getStorage(type: 'localStorage' | 'sessionStorage'): Storage | null {
    if (typeof window === 'undefined') return null
    
    try {
      const storage = window[type]
      return this.isAvailable(storage) ? storage : null
    } catch {
      return null
    }
  }

  setItem<T>(
    key: string, 
    value: T, 
    options: { 
      storage?: 'localStorage' | 'sessionStorage'
      expiry?: number // milliseconds from now
    } = {}
  ): boolean {
    const { storage = 'localStorage', expiry } = options
    const storageObj = this.getStorage(storage)
    
    if (!storageObj) return false

    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: expiry ? Date.now() + expiry : undefined
      }
      storageObj.setItem(key, JSON.stringify(item))
      return true
    } catch (error) {
      console.warn(`Failed to set ${storage} item:`, error)
      return false
    }
  }

  getItem<T>(
    key: string, 
    options: { storage?: 'localStorage' | 'sessionStorage' } = {}
  ): T | null {
    const { storage = 'localStorage' } = options
    const storageObj = this.getStorage(storage)
    
    if (!storageObj) return null

    try {
      const itemStr = storageObj.getItem(key)
      if (!itemStr) return null

      const item: StorageItem<T> = JSON.parse(itemStr)
      
      // Check expiry
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key, { storage })
        return null
      }

      return item.value
    } catch (error) {
      console.warn(`Failed to get ${storage} item:`, error)
      // Clean up corrupted data
      this.removeItem(key, { storage })
      return null
    }
  }

  removeItem(
    key: string, 
    options: { storage?: 'localStorage' | 'sessionStorage' } = {}
  ): boolean {
    const { storage = 'localStorage' } = options
    const storageObj = this.getStorage(storage)
    
    if (!storageObj) return false

    try {
      storageObj.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove ${storage} item:`, error)
      return false
    }
  }

  clear(options: { storage?: 'localStorage' | 'sessionStorage' } = {}): boolean {
    const { storage = 'localStorage' } = options
    const storageObj = this.getStorage(storage)
    
    if (!storageObj) return false

    try {
      storageObj.clear()
      return true
    } catch (error) {
      console.warn(`Failed to clear ${storage}:`, error)
      return false
    }
  }

  // Cleanup expired items
  cleanupExpired(options: { storage?: 'localStorage' | 'sessionStorage' } = {}): number {
    const { storage = 'localStorage' } = options
    const storageObj = this.getStorage(storage)
    
    if (!storageObj) return 0

    let cleanedCount = 0
    const now = Date.now()

    try {
      const keys = Object.keys(storageObj)
      
      for (const key of keys) {
        try {
          const itemStr = storageObj.getItem(key)
          if (!itemStr) continue

          const item: StorageItem<any> = JSON.parse(itemStr)
          
          if (item.expiry && now > item.expiry) {
            storageObj.removeItem(key)
            cleanedCount++
          }
        } catch {
          // Remove corrupted items
          storageObj.removeItem(key)
          cleanedCount++
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup ${storage}:`, error)
    }

    return cleanedCount
  }
}

// Export singleton instance
export const safeStorage = new SafeStorage()

// Convenience functions
export const safeLocalStorage = {
  setItem: <T>(key: string, value: T, expiry?: number) =>
    safeStorage.setItem(key, value, { storage: 'localStorage', expiry }),
  getItem: <T>(key: string): T | null =>
    safeStorage.getItem<T>(key, { storage: 'localStorage' }),
  removeItem: (key: string) =>
    safeStorage.removeItem(key, { storage: 'localStorage' }),
  clear: () => safeStorage.clear({ storage: 'localStorage' }),
  cleanupExpired: () => safeStorage.cleanupExpired({ storage: 'localStorage' })
}

export const safeSessionStorage = {
  setItem: <T>(key: string, value: T, expiry?: number) =>
    safeStorage.setItem(key, value, { storage: 'sessionStorage', expiry }),
  getItem: <T>(key: string): T | null =>
    safeStorage.getItem<T>(key, { storage: 'sessionStorage' }),
  removeItem: (key: string) =>
    safeStorage.removeItem(key, { storage: 'sessionStorage' }),
  clear: () => safeStorage.clear({ storage: 'sessionStorage' }),
  cleanupExpired: () => safeStorage.cleanupExpired({ storage: 'sessionStorage' })
}