/**
 * Build/Runtime Environment Separator
 * 
 * This module provides utilities to detect build-time vs runtime environments
 * and prevent services from initializing during static generation.
 */

/**
 * Check if we're currently in a build environment
 */
export function isBuildTime(): boolean {
  // Check for Next.js build phase (most reliable)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true
  }
  
  // Check for Vercel build environment
  // During Vercel builds, VERCEL_ENV is set but we're still in build phase
  if (process.env.VERCEL === '1' && !global.__NEXT_RUNTIME_STARTED) {
    return true
  }
  
  // Check for CI/build environments
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
    return true
  }
  
  // Check if running next build command
  if (process.argv.some(arg => arg.includes('next') && arg.includes('build'))) {
    return true
  }
  
  // For static generation, check if we're in getStaticProps/getStaticPaths context
  // This is indicated by the absence of req/res in the global scope
  if (typeof window === 'undefined' && 
      process.env.NODE_ENV === 'production' &&
      !global.__NEXT_RUNTIME_STARTED) {
    return true
  }
  
  return false
}

/**
 * Check if we're currently in a runtime environment
 */
export function isRuntime(): boolean {
  return !isBuildTime() && typeof window === 'undefined'
}

/**
 * Check if we're in a client-side environment
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if external services should be initialized
 */
export function shouldInitializeServices(): boolean {
  // Never initialize services during build
  if (isBuildTime()) {
    return false
  }
  
  // Don't initialize in test environment
  if (process.env.NODE_ENV === 'test') {
    return false
  }
  
  // Only initialize in runtime server environment
  return isRuntime()
}

/**
 * Get environment context for logging
 */
export function getEnvironmentContext() {
  return {
    isBuildTime: isBuildTime(),
    isRuntime: isRuntime(),
    isClientSide: isClientSide(),
    shouldInitializeServices: shouldInitializeServices(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    nextPhase: process.env.NEXT_PHASE,
    ci: process.env.CI,
    timestamp: new Date().toISOString()
  }
}

/**
 * Safe service initializer wrapper
 */
export function safeServiceInit<T>(
  serviceName: string, 
  initFn: () => Promise<T>
): Promise<T | null> {
  if (!shouldInitializeServices()) {
    console.log(`Skipping ${serviceName} initialization during build phase`)
    return Promise.resolve(null)
  }
  
  return initFn().catch(error => {
    console.error(`Failed to initialize ${serviceName}:`, error)
    return null
  })
}