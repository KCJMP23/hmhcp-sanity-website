/**
 * Progressive Loading System
 * Implements progressive loading strategies to optimize TTI
 */

// Progressive loading configuration
const PROGRESSIVE_LOADING_CONFIG = {
  // Loading phases
  phases: {
    critical: 0,    // Load immediately
    high: 1,        // Load after critical
    normal: 2,      // Load after high
    low: 3,         // Load after normal
    background: 4   // Load last
  },
  
  // Timing delays
  delays: {
    critical: 0,
    high: 100,
    normal: 500,
    low: 1000,
    background: 2000
  },
  
  // Resource types
  resourceTypes: {
    script: 'script',
    style: 'style',
    image: 'image',
    font: 'font',
    api: 'api',
    component: 'component'
  }
}

// Resource loading interface
interface LoadingResource {
  id: string
  type: keyof typeof PROGRESSIVE_LOADING_CONFIG.resourceTypes
  priority: keyof typeof PROGRESSIVE_LOADING_CONFIG.phases
  url?: string
  content?: string
  element?: HTMLElement
  loaded: boolean
  error?: string
  startTime: number
  endTime?: number
}

class ProgressiveLoadingManager {
  private resources: Map<string, LoadingResource> = new Map()
  private loadingQueue: LoadingResource[] = []
  private isProcessing = false
  private phaseTimers: Map<number, NodeJS.Timeout> = new Map()
  private performanceMetrics = {
    totalResources: 0,
    loadedResources: 0,
    failedResources: 0,
    totalLoadTime: 0,
    averageLoadTime: 0
  }

  // Add resource to loading queue
  addResource(
    id: string,
    type: keyof typeof PROGRESSIVE_LOADING_CONFIG.resourceTypes,
    priority: keyof typeof PROGRESSIVE_LOADING_CONFIG.phases,
    url?: string,
    content?: string,
    element?: HTMLElement
  ): string {
    const resource: LoadingResource = {
      id,
      type,
      priority,
      url,
      content,
      element,
      loaded: false,
      startTime: performance.now()
    }

    this.resources.set(id, resource)
    this.loadingQueue.push(resource)
    this.performanceMetrics.totalResources++

    // Schedule loading based on priority
    this.scheduleResourceLoading(resource)

    return id
  }

  // Schedule resource loading based on priority
  private scheduleResourceLoading(resource: LoadingResource) {
    const delay = PROGRESSIVE_LOADING_CONFIG.delays[resource.priority]
    const phase = PROGRESSIVE_LOADING_CONFIG.phases[resource.priority]

    // Clear existing timer for this phase
    if (this.phaseTimers.has(phase)) {
      clearTimeout(this.phaseTimers.get(phase)!)
    }

    // Schedule loading
    const timer = setTimeout(() => {
      this.loadResource(resource)
      this.phaseTimers.delete(phase)
    }, delay)

    this.phaseTimers.set(phase, timer)
  }

  // Load individual resource
  private async loadResource(resource: LoadingResource): Promise<void> {
    try {
      switch (resource.type) {
        case 'script':
          await this.loadScript(resource)
          break
        case 'style':
          await this.loadStyle(resource)
          break
        case 'image':
          await this.loadImage(resource)
          break
        case 'font':
          await this.loadFont(resource)
          break
        case 'api':
          await this.loadAPI(resource)
          break
        case 'component':
          await this.loadComponent(resource)
          break
        default:
          throw new Error(`Unknown resource type: ${resource.type}`)
      }

      resource.loaded = true
      resource.endTime = performance.now()
      this.performanceMetrics.loadedResources++

      // Update average load time
      const loadTime = resource.endTime - resource.startTime
      this.performanceMetrics.totalLoadTime += loadTime
      this.performanceMetrics.averageLoadTime = 
        this.performanceMetrics.totalLoadTime / this.performanceMetrics.loadedResources

      console.log(`✅ Loaded ${resource.type}: ${resource.id} (${loadTime.toFixed(2)}ms)`)
    } catch (error) {
      resource.error = error instanceof Error ? error.message : 'Unknown error'
      resource.endTime = performance.now()
      this.performanceMetrics.failedResources++
      
      console.error(`❌ Failed to load ${resource.type}: ${resource.id}`, error)
    }
  }

  // Load script resource
  private async loadScript(resource: LoadingResource): Promise<void> {
    if (!resource.url) throw new Error('Script URL required')

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = resource.url!
      script.async = true
      script.defer = true
      
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${resource.url}`))
      
      document.head.appendChild(script)
    })
  }

  // Load style resource
  private async loadStyle(resource: LoadingResource): Promise<void> {
    if (resource.content) {
      // Inline styles
      const style = document.createElement('style')
      style.textContent = resource.content
      document.head.appendChild(style)
      return Promise.resolve()
    } else if (resource.url) {
      // External stylesheets
      return new Promise((resolve, reject) => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = resource.url!
        
        link.onload = () => resolve()
        link.onerror = () => reject(new Error(`Failed to load stylesheet: ${resource.url}`))
        
        document.head.appendChild(link)
      })
    } else {
      throw new Error('Style content or URL required')
    }
  }

  // Load image resource
  private async loadImage(resource: LoadingResource): Promise<void> {
    if (!resource.url) throw new Error('Image URL required')

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${resource.url}`))
      img.src = resource.url!
    })
  }

  // Load font resource
  private async loadFont(resource: LoadingResource): Promise<void> {
    if (!resource.url) throw new Error('Font URL required')

    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.url!
      link.as = 'font'
      link.crossOrigin = 'anonymous'
      
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load font: ${resource.url}`))
      
      document.head.appendChild(link)
    })
  }

  // Load API resource
  private async loadAPI(resource: LoadingResource): Promise<void> {
    if (!resource.url) throw new Error('API URL required')

    const response = await fetch(resource.url!)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  // Load component resource
  private async loadComponent(resource: LoadingResource): Promise<void> {
    if (!resource.element) throw new Error('Component element required')

    // Mark component as loaded
    resource.element.setAttribute('data-loaded', 'true')
    
    // Trigger any component-specific loading logic
    const event = new CustomEvent('component-loaded', {
      detail: { id: resource.id, element: resource.element }
    })
    resource.element.dispatchEvent(event)
  }

  // Preload critical resources
  preloadCriticalResources(): void {
    const criticalResources = [
      { id: 'critical-css', type: 'style' as const, priority: 'critical' as const, content: 'body { font-family: system-ui, sans-serif; }' },
      { id: 'critical-js', type: 'script' as const, priority: 'critical' as const, url: '/_next/static/chunks/webpack.js' },
      { id: 'hero-image', type: 'image' as const, priority: 'critical' as const, url: '/hero-research.jpg' }
    ]

    criticalResources.forEach(resource => {
      this.addResource(resource.id, resource.type, resource.priority, resource.url, resource.content)
    })
  }

  // Load resources by priority
  loadByPriority(priority: keyof typeof PROGRESSIVE_LOADING_CONFIG.phases): void {
    const resources = Array.from(this.resources.values())
      .filter(r => r.priority === priority && !r.loaded)

    resources.forEach(resource => {
      this.loadResource(resource)
    })
  }

  // Get loading progress
  getProgress(): { loaded: number; total: number; percentage: number } {
    const loaded = this.performanceMetrics.loadedResources
    const total = this.performanceMetrics.totalResources
    const percentage = total > 0 ? (loaded / total) * 100 : 0

    return { loaded, total, percentage }
  }

  // Get performance metrics
  getMetrics() {
    return { ...this.performanceMetrics }
  }

  // Cleanup
  destroy(): void {
    this.phaseTimers.forEach(timer => clearTimeout(timer))
    this.phaseTimers.clear()
    this.resources.clear()
    this.loadingQueue = []
    this.isProcessing = false
  }
}

// Global progressive loading manager
let progressiveLoader: ProgressiveLoadingManager | null = null

// Initialize progressive loading
export function initializeProgressiveLoading(): void {
  if (typeof window === 'undefined') return

  if (!progressiveLoader) {
    progressiveLoader = new ProgressiveLoadingManager()
    console.log('🔧 Progressive loading system initialized')
    
    // Preload critical resources
    progressiveLoader.preloadCriticalResources()
  }
}

// Add resource to progressive loading
export function addProgressiveResource(
  id: string,
  type: keyof typeof PROGRESSIVE_LOADING_CONFIG.resourceTypes,
  priority: keyof typeof PROGRESSIVE_LOADING_CONFIG.phases,
  url?: string,
  content?: string,
  element?: HTMLElement
): string {
  if (!progressiveLoader) {
    initializeProgressiveLoading()
  }
  
  return progressiveLoader!.addResource(id, type, priority, url, content, element)
}

// Load resources by priority
export function loadResourcesByPriority(priority: keyof typeof PROGRESSIVE_LOADING_CONFIG.phases): void {
  if (!progressiveLoader) {
    initializeProgressiveLoading()
  }
  
  progressiveLoader!.loadByPriority(priority)
}

// Get loading progress
export function getLoadingProgress() {
  return progressiveLoader ? progressiveLoader.getProgress() : { loaded: 0, total: 0, percentage: 0 }
}

// Get performance metrics
export function getProgressiveLoadingMetrics() {
  return progressiveLoader ? progressiveLoader.getMetrics() : null
}

// Cleanup progressive loading
export function cleanupProgressiveLoading(): void {
  if (progressiveLoader) {
    progressiveLoader.destroy()
    progressiveLoader = null
    console.log('🧹 Progressive loading system cleaned up')
  }
}
