'use client'

// PWA Utilities for HM Healthcare Partners
interface PWAConfig {
  swUrl: string
  scope: string
  updateCheckInterval: number
}

class PWAManager {
  private config: PWAConfig
  private registration: ServiceWorkerRegistration | null = null

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = {
      swUrl: '/sw.js',
      scope: '/',
      updateCheckInterval: 60 * 60 * 1000,
      ...config
    }

    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private async init() {
    try {
      await this.registerServiceWorker()
      console.log('[PWA] Initialized successfully')
    } catch (error) {
      console.error('[PWA] Initialization failed:', error)
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported')
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        this.config.swUrl,
        { scope: this.config.scope }
      )
      console.log('[PWA] Service worker registered')
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error)
      throw error
    }
  }

  async showInstallPrompt(): Promise<boolean> {
    console.log('[PWA] Install prompt requested')
    return false
  }

  getStatus() {
    return {
      isSupported: 'serviceWorker' in navigator,
      isInstalled: false,
      isInstallable: false,
      updateAvailable: false,
      registration: !!this.registration
    }
  }
}

let pwaManager: PWAManager | null = null

export function initializePWA(config?: Partial<PWAConfig>): PWAManager {
  if (typeof window === 'undefined') {
    throw new Error('PWA can only be initialized in browser environment')
  }

  if (!pwaManager) {
    pwaManager = new PWAManager(config)
  }

  return pwaManager
}

export function getPWAManager(): PWAManager | null {
  return pwaManager
}

export const PWAUtils = {
  isStandalone(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches
  },

  supportsPWAInstall(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator
  },

  getDisplayMode(): 'browser' | 'standalone' {
    if (typeof window === 'undefined') return 'browser'
    return window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
  },

  isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}

export type { PWAConfig }