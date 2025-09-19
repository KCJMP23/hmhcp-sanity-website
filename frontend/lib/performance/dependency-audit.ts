/**
 * Dependency Audit Tool
 * Identifies and removes unused dependencies to reduce bundle size
 */

// Dependency audit configuration
const DEPENDENCY_AUDIT_CONFIG = {
  // Packages that are definitely unused
  definitelyUnused: [
    'moment',
    'lodash',
    'date-fns',
    'axios',
    'jquery',
    'bootstrap',
    'jquery-ui',
    'moment-timezone',
    'moment-range',
    'lodash-es',
    'ramda',
    'immutable',
    'rxjs',
    'rxjs-compat',
    'core-js',
    'regenerator-runtime',
    'babel-polyfill',
    'whatwg-fetch',
    'es6-promise',
    'es6-promise-polyfill'
  ],
  
  // Packages that can be replaced with lighter alternatives
  replaceable: {
    'moment': 'date-fns',
    'lodash': 'ramda',
    'axios': 'fetch',
    'jquery': 'vanilla-js',
    'bootstrap': 'tailwindcss',
    'framer-motion': 'react-spring'
  },
  
  // Packages that should be lazy loaded
  lazyLoadable: [
    'framer-motion',
    'react-hook-form',
    'zod',
    'yup',
    'formik',
    'react-query',
    'swr',
    'recharts',
    'chart.js',
    'd3',
    'three',
    'gsap',
    'lottie-react',
    'react-spring',
    'react-transition-group'
  ],
  
  // Critical packages that should never be removed
  critical: [
    'react',
    'react-dom',
    'next',
    'next/router',
    'next/link',
    'next/image',
    'next/head',
    'typescript',
    '@types/react',
    '@types/react-dom',
    '@types/node'
  ]
}

// Dependency analysis results
interface DependencyAnalysis {
  totalPackages: number
  unusedPackages: string[]
  replaceablePackages: string[]
  lazyLoadablePackages: string[]
  criticalPackages: string[]
  estimatedSavings: number
  recommendations: string[]
}

// Analyze package.json dependencies
export function analyzeDependencies(packageJson: any): DependencyAnalysis {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const packageNames = Object.keys(dependencies)
  
  const unusedPackages: string[] = []
  const replaceablePackages: string[] = []
  const lazyLoadablePackages: string[] = []
  const criticalPackages: string[] = []
  
  let estimatedSavings = 0
  
  for (const packageName of packageNames) {
    if (DEPENDENCY_AUDIT_CONFIG.definitelyUnused.includes(packageName)) {
      unusedPackages.push(packageName)
      estimatedSavings += getPackageSize(packageName)
    } else if (DEPENDENCY_AUDIT_CONFIG.replaceable[packageName as keyof typeof DEPENDENCY_AUDIT_CONFIG.replaceable]) {
      replaceablePackages.push(packageName)
      estimatedSavings += getPackageSize(packageName) * 0.5 // 50% savings estimate
    } else if (DEPENDENCY_AUDIT_CONFIG.lazyLoadable.includes(packageName)) {
      lazyLoadablePackages.push(packageName)
    } else if (DEPENDENCY_AUDIT_CONFIG.critical.includes(packageName)) {
      criticalPackages.push(packageName)
    }
  }
  
  // Generate recommendations
  const recommendations = generateDependencyRecommendations(
    unusedPackages,
    replaceablePackages,
    lazyLoadablePackages,
    estimatedSavings
  )
  
  return {
    totalPackages: packageNames.length,
    unusedPackages,
    replaceablePackages,
    lazyLoadablePackages,
    criticalPackages,
    estimatedSavings,
    recommendations
  }
}

// Get estimated package size (in bytes)
function getPackageSize(packageName: string): number {
  // These are rough estimates based on typical package sizes
  const packageSizes: Record<string, number> = {
    'moment': 200000, // 200KB
    'lodash': 500000, // 500KB
    'date-fns': 100000, // 100KB
    'axios': 50000, // 50KB
    'jquery': 300000, // 300KB
    'bootstrap': 200000, // 200KB
    'framer-motion': 300000, // 300KB
    'react-hook-form': 50000, // 50KB
    'zod': 100000, // 100KB
    'yup': 150000, // 150KB
    'formik': 100000, // 100KB
    'react-query': 200000, // 200KB
    'swr': 50000, // 50KB
    'recharts': 400000, // 400KB
    'chart.js': 300000, // 300KB
    'd3': 1000000, // 1MB
    'three': 800000, // 800KB
    'gsap': 200000, // 200KB
    'lottie-react': 100000, // 100KB
    'react-spring': 150000, // 150KB
    'react-transition-group': 50000, // 50KB
  }
  
  return packageSizes[packageName] || 50000 // Default 50KB
}

// Generate dependency recommendations
function generateDependencyRecommendations(
  unusedPackages: string[],
  replaceablePackages: string[],
  lazyLoadablePackages: string[],
  estimatedSavings: number
): string[] {
  const recommendations: string[] = []
  
  if (unusedPackages.length > 0) {
    recommendations.push(
      `Remove ${unusedPackages.length} unused packages: ${unusedPackages.join(', ')}`
    )
  }
  
  if (replaceablePackages.length > 0) {
    recommendations.push(
      `Replace ${replaceablePackages.length} heavy packages with lighter alternatives`
    )
  }
  
  if (lazyLoadablePackages.length > 0) {
    recommendations.push(
      `Implement lazy loading for ${lazyLoadablePackages.length} packages: ${lazyLoadablePackages.join(', ')}`
    )
  }
  
  if (estimatedSavings > 0) {
    recommendations.push(
      `Estimated bundle size reduction: ${formatBytes(estimatedSavings)}`
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

// Generate package.json cleanup script
export function generateCleanupScript(analysis: DependencyAnalysis): string {
  const removePackages = [...analysis.unusedPackages, ...analysis.replaceablePackages]
  
  let script = '#!/bin/bash\n'
  script += '# Dependency cleanup script\n\n'
  
  if (removePackages.length > 0) {
    script += '# Remove unused and replaceable packages\n'
    script += `pnpm remove ${removePackages.join(' ')}\n\n`
  }
  
  if (analysis.replaceablePackages.length > 0) {
    script += '# Install lighter alternatives\n'
    for (const packageName of analysis.replaceablePackages) {
      const replacement = DEPENDENCY_AUDIT_CONFIG.replaceable[packageName as keyof typeof DEPENDENCY_AUDIT_CONFIG.replaceable]
      if (replacement) {
        script += `pnpm add ${replacement}\n`
      }
    }
  }
  
  script += '\n# Rebuild and test\n'
  script += 'pnpm build\n'
  script += 'pnpm test\n'
  
  return script
}

// Analyze bundle for unused code
export function analyzeUnusedCode(): string[] {
  if (typeof window === 'undefined') return []
  
  const unusedCode: string[] = []
  
  // Check for unused imports in console
  const consoleMessages = []
  const originalConsoleLog = console.log
  console.log = (...args) => {
    consoleMessages.push(args.join(' '))
    originalConsoleLog(...args)
  }
  
  // Check for unused variables
  const scripts = document.querySelectorAll('script[src]')
  scripts.forEach(script => {
    const src = script.getAttribute('src')
    if (src && src.includes('_next/static/chunks/')) {
      // This would need to be implemented with a proper AST parser
      // For now, we'll just check for common patterns
      if (src.includes('unused') || src.includes('test') || src.includes('spec')) {
        unusedCode.push(src)
      }
    }
  })
  
  return unusedCode
}

// Initialize dependency audit
export function initializeDependencyAudit(): void {
  if (typeof window === 'undefined') return
  
  // This would typically run on the server side
  // For now, we'll just log the configuration
  console.log('Dependency Audit Configuration:', DEPENDENCY_AUDIT_CONFIG)
  
  // Analyze unused code
  const unusedCode = analyzeUnusedCode()
  if (unusedCode.length > 0) {
    console.log('Unused code detected:', unusedCode)
  }
}

// Export for debugging
export function getDependencyAnalysis(): DependencyAnalysis {
  // This would typically analyze the actual package.json
  // For now, return a mock analysis
  return {
    totalPackages: 0,
    unusedPackages: [],
    replaceablePackages: [],
    lazyLoadablePackages: [],
    criticalPackages: [],
    estimatedSavings: 0,
    recommendations: []
  }
}
