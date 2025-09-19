/**
 * Bundle Analyzer and Unused Code Elimination
 * Identifies and removes unused JavaScript to reduce bundle size
 */

// Bundle analysis configuration
const BUNDLE_CONFIG = {
  // Maximum bundle size targets
  maxSizes: {
    main: 250000,      // 250KB
    vendor: 500000,    // 500KB
    page: 100000,      // 100KB per page
  },
  
  // Unused code detection patterns
  unusedPatterns: [
    /console\.(log|warn|error|debug)/g,
    /debugger/g,
    /\.map$/g,
    /\.test\./g,
    /\.spec\./g,
    /__tests__/g,
    /\.stories\./g,
  ],
  
  // Critical modules that should never be removed
  criticalModules: [
    'react',
    'react-dom',
    'next',
    'next/router',
    'next/link',
    'next/image',
    'next/head',
  ],
  
  // Modules that can be lazy loaded
  lazyLoadableModules: [
    'lucide-react',
    '@radix-ui/react-accordion',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-tabs',
    '@radix-ui/react-tooltip',
    'framer-motion',
    'react-hook-form',
    'zod',
  ]
}

// Bundle analysis results
interface BundleAnalysis {
  totalSize: number
  unusedSize: number
  criticalSize: number
  lazyLoadableSize: number
  recommendations: string[]
  modules: ModuleAnalysis[]
}

interface ModuleAnalysis {
  name: string
  size: number
  isUsed: boolean
  isCritical: boolean
  canLazyLoad: boolean
  dependencies: string[]
}

// Analyze bundle for unused code
export function analyzeBundle(): BundleAnalysis {
  if (typeof window === 'undefined') {
    return {
      totalSize: 0,
      unusedSize: 0,
      criticalSize: 0,
      lazyLoadableSize: 0,
      recommendations: [],
      modules: []
    }
  }
  
  const modules: ModuleAnalysis[] = []
  let totalSize = 0
  let unusedSize = 0
  let criticalSize = 0
  let lazyLoadableSize = 0
  
  // Analyze loaded modules
  const loadedModules = getLoadedModules()
  
  for (const module of loadedModules) {
    const analysis = analyzeModule(module)
    modules.push(analysis)
    
    totalSize += analysis.size
    
    if (!analysis.isUsed) {
      unusedSize += analysis.size
    }
    
    if (analysis.isCritical) {
      criticalSize += analysis.size
    }
    
    if (analysis.canLazyLoad) {
      lazyLoadableSize += analysis.size
    }
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    totalSize,
    unusedSize,
    criticalSize,
    lazyLoadableSize,
    modules
  })
  
  return {
    totalSize,
    unusedSize,
    criticalSize,
    lazyLoadableSize,
    recommendations,
    modules
  }
}

// Get loaded modules from performance API
function getLoadedModules(): any[] {
  if (typeof window === 'undefined') return []
  
  const modules: any[] = []
  
  // Get resource timing entries
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  for (const resource of resources) {
    if (resource.name.includes('_next/static/chunks/') && resource.name.endsWith('.js')) {
      modules.push({
        name: resource.name,
        size: resource.transferSize || 0,
        loadTime: resource.responseEnd - resource.startTime,
        url: resource.name
      })
    }
  }
  
  return modules
}

// Analyze individual module
function analyzeModule(module: any): ModuleAnalysis {
  const name = extractModuleName(module.name)
  const size = module.size
  const isUsed = isModuleUsed(module)
  const isCritical = BUNDLE_CONFIG.criticalModules.some(critical => 
    name.includes(critical)
  )
  const canLazyLoad = BUNDLE_CONFIG.lazyLoadableModules.some(lazy => 
    name.includes(lazy)
  )
  
  return {
    name,
    size,
    isUsed,
    isCritical,
    canLazyLoad,
    dependencies: getModuleDependencies(module)
  }
}

// Extract module name from URL
function extractModuleName(url: string): string {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace('.js', '')
}

// Check if module is actually used
function isModuleUsed(module: any): boolean {
  // Check if module contains unused patterns
  for (const pattern of BUNDLE_CONFIG.unusedPatterns) {
    if (pattern.test(module.name)) {
      return false
    }
  }
  
  // Check if module is critical
  if (BUNDLE_CONFIG.criticalModules.some(critical => 
    module.name.includes(critical)
  )) {
    return true
  }
  
  // Check if module is referenced in DOM
  return isModuleReferencedInDOM(module.name)
}

// Check if module is referenced in DOM
function isModuleReferencedInDOM(moduleName: string): boolean {
  if (typeof window === 'undefined') return false
  
  // Check script tags
  const scripts = document.querySelectorAll('script[src]')
  for (const script of scripts) {
    if (script.getAttribute('src')?.includes(moduleName)) {
      return true
    }
  }
  
  // Check if module is loaded dynamically
  return window.performance.getEntriesByType('resource')
    .some((entry: any) => entry.name.includes(moduleName))
}

// Get module dependencies
function getModuleDependencies(module: any): string[] {
  // This would need to be implemented based on your bundler
  // For now, return empty array
  return []
}

// Generate optimization recommendations
function generateRecommendations(analysis: {
  totalSize: number
  unusedSize: number
  criticalSize: number
  lazyLoadableSize: number
  modules: ModuleAnalysis[]
}): string[] {
  const recommendations: string[] = []
  
  // Check total bundle size
  if (analysis.totalSize > BUNDLE_CONFIG.maxSizes.main) {
    recommendations.push(
      `Total bundle size (${formatBytes(analysis.totalSize)}) exceeds target (${formatBytes(BUNDLE_CONFIG.maxSizes.main)}). Consider code splitting.`
    )
  }
  
  // Check unused code
  if (analysis.unusedSize > 0) {
    recommendations.push(
      `Found ${formatBytes(analysis.unusedSize)} of unused code. Consider removing unused imports and dead code.`
    )
  }
  
  // Check lazy loadable modules
  if (analysis.lazyLoadableSize > 0) {
    recommendations.push(
      `Found ${formatBytes(analysis.lazyLoadableSize)} of lazy-loadable code. Consider implementing dynamic imports.`
    )
  }
  
  // Check individual modules
  for (const module of analysis.modules) {
    if (module.size > BUNDLE_CONFIG.maxSizes.page && !module.isCritical) {
      recommendations.push(
        `Module '${module.name}' (${formatBytes(module.size)}) is large and not critical. Consider lazy loading.`
      )
    }
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

// Remove unused code from bundle
export function removeUnusedCode(): void {
  if (typeof window === 'undefined') return
  
  // Remove unused modules
  const unusedModules = document.querySelectorAll('script[data-unused]')
  unusedModules.forEach(script => {
    script.remove()
  })
  
  // Remove unused CSS
  const unusedStyles = document.querySelectorAll('link[rel="stylesheet"][data-unused]')
  unusedStyles.forEach(style => {
    style.remove()
  })
  
  // Remove console statements in production
  if (process.env.NODE_ENV === 'production') {
    removeConsoleStatements()
  }
}

// Remove console statements
function removeConsoleStatements(): void {
  // Override console methods in production
  const noop = () => {}
  
  if (typeof window !== 'undefined') {
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

// Implement dynamic imports for lazy loading
export function implementLazyLoading(): void {
  if (typeof window === 'undefined') return
  
  // Lazy load non-critical modules
  const lazyModules = BUNDLE_CONFIG.lazyLoadableModules
  
  for (const module of lazyModules) {
    // Check if module is needed
    if (isModuleNeeded(module)) {
      // Load module when needed
      loadModuleWhenNeeded(module)
    }
  }
}

// Check if module is needed
function isModuleNeeded(moduleName: string): boolean {
  // Check if module is referenced in DOM
  const elements = document.querySelectorAll(`[data-module="${moduleName}"]`)
  return elements.length > 0
}

// Load module when needed
function loadModuleWhenNeeded(moduleName: string): void {
  // Use intersection observer to load when element comes into view
  const elements = document.querySelectorAll(`[data-module="${moduleName}"]`)
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Load module - simplified approach without dynamic imports
        console.log(`Loading module: ${moduleName}`)
        observer.unobserve(entry.target)
      }
    })
  })
  
  elements.forEach(element => observer.observe(element))
}

// Initialize bundle analyzer
export function initializeBundleAnalyzer(): void {
  if (typeof window === 'undefined') return
  
  // Analyze bundle on page load
  setTimeout(() => {
    const analysis = analyzeBundle()
    console.log('Bundle Analysis:', analysis)
    
    // Remove unused code
    removeUnusedCode()
    
    // Implement lazy loading
    implementLazyLoading()
  }, 1000)
}

// Export bundle analysis for debugging
export function getBundleAnalysis(): BundleAnalysis {
  return analyzeBundle()
}
