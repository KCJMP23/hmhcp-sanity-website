/**
 * Bundle Analyzer V2 - Comprehensive Bundle Analysis
 * Identifies and optimizes the largest JavaScript chunks causing TBT/TTI issues
 */

// Bundle analysis configuration
const BUNDLE_ANALYSIS_CONFIG = {
  // Maximum recommended chunk sizes
  maxChunkSizes: {
    critical: 50000,    // 50KB for critical chunks
    normal: 25000,      // 25KB for normal chunks
    lazy: 10000,        // 10KB for lazy-loaded chunks
  },
  
  // Chunk categories
  categories: {
    critical: ['react', 'react-dom', 'next', 'next/router'],
    ui: ['@radix-ui', 'lucide-react', 'framer-motion'],
    admin: ['admin', 'dashboard', 'management'],
    blog: ['blog', 'posts', 'content'],
    analytics: ['analytics', 'tracking', 'gtag', 'ga'],
    vendor: ['lodash', 'moment', 'date-fns', 'axios']
  },
  
  // Unused code patterns
  unusedPatterns: [
    /console\.(log|warn|error|debug)/g,
    /debugger/g,
    /\.map$/g,
    /\.test\./g,
    /\.spec\./g,
    /__tests__/g,
    /\.stories\./g,
    /\.d\.ts$/g
  ]
}

// Bundle analysis results
interface BundleAnalysisResult {
  totalSize: number
  chunkCount: number
  largestChunks: ChunkInfo[]
  unusedCode: number
  recommendations: string[]
  criticalChunks: ChunkInfo[]
  lazyLoadableChunks: ChunkInfo[]
  vendorChunks: ChunkInfo[]
}

interface ChunkInfo {
  name: string
  size: number
  url: string
  category: string
  isUsed: boolean
  canLazyLoad: boolean
  loadTime: number
}

// Analyze bundle from performance API
export function analyzeBundleFromPerformance(): BundleAnalysisResult {
  if (typeof window === 'undefined') {
    return {
      totalSize: 0,
      chunkCount: 0,
      largestChunks: [],
      unusedCode: 0,
      recommendations: [],
      criticalChunks: [],
      lazyLoadableChunks: [],
      vendorChunks: []
    }
  }

  const chunks: ChunkInfo[] = []
  let totalSize = 0
  let unusedCode = 0

  // Get all resource entries
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  for (const resource of resources) {
    if (resource.name.includes('_next/static/chunks/') && resource.name.endsWith('.js')) {
      const chunkInfo = analyzeChunk(resource)
      chunks.push(chunkInfo)
      totalSize += chunkInfo.size
      
      if (!chunkInfo.isUsed) {
        unusedCode += chunkInfo.size
      }
    }
  }

  // Sort chunks by size
  chunks.sort((a, b) => b.size - a.size)

  // Categorize chunks
  const criticalChunks = chunks.filter(chunk => 
    BUNDLE_ANALYSIS_CONFIG.categories.critical.some(cat => 
      chunk.name.includes(cat)
    )
  )

  const lazyLoadableChunks = chunks.filter(chunk => 
    BUNDLE_ANALYSIS_CONFIG.categories.admin.some(cat => 
      chunk.name.includes(cat)
    ) || BUNDLE_ANALYSIS_CONFIG.categories.blog.some(cat => 
      chunk.name.includes(cat)
    )
  )

  const vendorChunks = chunks.filter(chunk => 
    BUNDLE_ANALYSIS_CONFIG.categories.vendor.some(cat => 
      chunk.name.includes(cat)
    )
  )

  // Generate recommendations
  const recommendations = generateRecommendations(chunks, totalSize, unusedCode)

  return {
    totalSize,
    chunkCount: chunks.length,
    largestChunks: chunks.slice(0, 10), // Top 10 largest chunks
    unusedCode,
    recommendations,
    criticalChunks,
    lazyLoadableChunks,
    vendorChunks
  }
}

// Analyze individual chunk
function analyzeChunk(resource: PerformanceResourceTiming): ChunkInfo {
  const name = extractChunkName(resource.name)
  const size = resource.transferSize || 0
  const loadTime = resource.responseEnd - resource.startTime
  
  // Determine category
  let category = 'unknown'
  for (const [catName, patterns] of Object.entries(BUNDLE_ANALYSIS_CONFIG.categories)) {
    if (patterns.some(pattern => name.includes(pattern))) {
      category = catName
      break
    }
  }
  
  // Check if chunk is used
  const isUsed = isChunkUsed(resource.name)
  
  // Check if chunk can be lazy loaded
  const canLazyLoad = BUNDLE_ANALYSIS_CONFIG.categories.admin.some(cat => 
    name.includes(cat)
  ) || BUNDLE_ANALYSIS_CONFIG.categories.blog.some(cat => 
    name.includes(cat)
  ) || BUNDLE_ANALYSIS_CONFIG.categories.analytics.some(cat => 
    name.includes(cat)
  )

  return {
    name,
    size,
    url: resource.name,
    category,
    isUsed,
    canLazyLoad,
    loadTime
  }
}

// Extract chunk name from URL
function extractChunkName(url: string): string {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace('.js', '')
}

// Check if chunk is actually used
function isChunkUsed(url: string): boolean {
  // Check if chunk is referenced in DOM
  const scripts = document.querySelectorAll('script[src]')
  for (const script of scripts) {
    if (script.getAttribute('src')?.includes(url)) {
      return true
    }
  }
  
  // Check if chunk is loaded dynamically
  return window.performance.getEntriesByType('resource')
    .some((entry: any) => entry.name === url)
}

// Generate optimization recommendations
function generateRecommendations(
  chunks: ChunkInfo[], 
  totalSize: number, 
  unusedCode: number
): string[] {
  const recommendations: string[] = []
  
  // Check total bundle size
  if (totalSize > 1000000) { // 1MB
    recommendations.push(
      `Total bundle size (${formatBytes(totalSize)}) is too large. Target: <500KB`
    )
  }
  
  // Check for large chunks
  const largeChunks = chunks.filter(chunk => chunk.size > BUNDLE_ANALYSIS_CONFIG.maxChunkSizes.normal)
  if (largeChunks.length > 0) {
    recommendations.push(
      `Found ${largeChunks.length} large chunks (>25KB). Consider code splitting.`
    )
  }
  
  // Check for unused code
  if (unusedCode > 0) {
    recommendations.push(
      `Found ${formatBytes(unusedCode)} of unused code. Remove unused imports.`
    )
  }
  
  // Check for lazy loadable chunks that aren't lazy loaded
  const nonLazyChunks = chunks.filter(chunk => 
    chunk.canLazyLoad && !chunk.name.includes('lazy')
  )
  if (nonLazyChunks.length > 0) {
    recommendations.push(
      `Found ${nonLazyChunks.length} chunks that can be lazy loaded. Implement dynamic imports.`
    )
  }
  
  // Check for vendor chunks that can be optimized
  const vendorChunks = chunks.filter(chunk => 
    BUNDLE_ANALYSIS_CONFIG.categories.vendor.some(cat => 
      chunk.name.includes(cat)
    )
  )
  if (vendorChunks.length > 0) {
    recommendations.push(
      `Found ${vendorChunks.length} vendor chunks. Consider tree shaking and code splitting.`
    )
  }
  
  return recommendations
}

// Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Remove unused code
export function removeUnusedCode(): void {
  if (typeof window === 'undefined') return
  
  // Remove unused scripts
  const scripts = document.querySelectorAll('script[data-unused]')
  scripts.forEach(script => {
    script.remove()
  })
  
  // Remove unused stylesheets
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"][data-unused]')
  stylesheets.forEach(stylesheet => {
    stylesheet.remove()
  })
  
  // Remove console statements in production
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {}
    window.console = {
      ...window.console,
      log: noop,
      warn: noop,
      error: noop,
      debug: noop,
      info: noop
    }
  }
}

// Implement aggressive code splitting
export function implementAggressiveCodeSplitting(): void {
  if (typeof window === 'undefined') return
  
  // Lazy load all non-critical components
  const nonCriticalElements = document.querySelectorAll('[data-component]')
  
  nonCriticalElements.forEach(element => {
    const componentName = element.getAttribute('data-component')
    if (componentName) {
      // Mark for lazy loading
      element.setAttribute('data-lazy', 'true')
      
      // Use intersection observer
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadComponent(componentName)
            observer.unobserve(entry.target)
          }
        })
      })
      
      observer.observe(element)
    }
  })
}

// Load component dynamically
function loadComponent(componentName: string): void {
  // This would be implemented based on your component structure
  console.log(`Loading component: ${componentName}`)
  
  // Example implementation:
  // import(`@/components/${componentName}`).then(module => {
  //   // Render component
  // })
}

// Initialize bundle analyzer V2
export function initializeBundleAnalyzerV2(): void {
  if (typeof window === 'undefined') return
  
  // Analyze bundle after page load
  setTimeout(() => {
    const analysis = analyzeBundleFromPerformance()
    console.log('Bundle Analysis V2:', analysis)
    
    // Remove unused code
    removeUnusedCode()
    
    // Implement code splitting
    implementAggressiveCodeSplitting()
  }, 2000)
}

// Export for debugging
export function getBundleAnalysisV2(): BundleAnalysisResult {
  return analyzeBundleFromPerformance()
}
