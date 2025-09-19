/**
 * CSRF Protection Hook
 * Client-side hook for managing CSRF tokens in React components
 * Implements OWASP best practices for CSRF prevention
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { addCSRFToHeaders, getCSRFTokenFromMeta, addCSRFToBody } from '@/lib/security/csrf-client'
import { logger } from '@/lib/logging/client-safe-logger'

interface CSRFConfig {
  autoRefresh: boolean
  refreshInterval: number // milliseconds
  onError?: (error: Error) => void
}

interface CSRFHookReturn {
  token: string | null
  isLoading: boolean
  error: string | null
  refreshToken: () => Promise<void>
  addToHeaders: (headers?: HeadersInit) => HeadersInit
  addToBody: (body: any) => any
  makeSecureRequest: (url: string, options?: RequestInit) => Promise<Response>
}

/**
 * Default configuration for CSRF protection
 */
const DEFAULT_CONFIG: CSRFConfig = {
  autoRefresh: true,
  refreshInterval: 30 * 60 * 1000, // 30 minutes
}

/**
 * React hook for CSRF token management and secure API requests
 * 
 * @param config - Configuration options for CSRF behavior
 * @returns Object containing CSRF token and utility functions
 * 
 * @example
 * ```typescript
 * const { token, makeSecureRequest, addToHeaders } = useCsrf()
 * 
 * // Option 1: Use makeSecureRequest for automatic CSRF protection
 * const response = await makeSecureRequest('/api/admin/bulk', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * })
 * 
 * // Option 2: Manually add CSRF to headers
 * const response = await fetch('/api/admin/bulk', {
 *   method: 'POST',
 *   headers: addToHeaders({ 'Content-Type': 'application/json' }),
 *   body: JSON.stringify(data)
 * })
 * ```
 */
export function useCsrf(config: Partial<CSRFConfig> = {}): CSRFHookReturn {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  /**
   * Load CSRF token from meta tag or request new one
   */
  const loadToken = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // First try to get token from meta tag
      let csrfToken = getCSRFTokenFromMeta()

      // If no token in meta tag, request one from server
      if (!csrfToken) {
        const response = await fetch('/api/csrf-token', {
          method: 'GET',
          credentials: 'same-origin',
        })

        if (!response.ok) {
          throw new Error(`Failed to get CSRF token: ${response.status}`)
        }

        const data = await response.json()
        csrfToken = data.token

        // Update meta tag for future requests
        if (typeof window !== 'undefined') {
          let metaTag = document.querySelector('meta[name="csrf-token"]')
          if (!metaTag) {
            metaTag = document.createElement('meta')
            metaTag.setAttribute('name', 'csrf-token')
            document.head.appendChild(metaTag)
          }
          metaTag.setAttribute('content', csrfToken)
        }
      }

      if (!csrfToken) {
        throw new Error('No CSRF token received from server')
      }

      setToken(csrfToken)
      logger.debug('CSRF token loaded successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load CSRF token'
      setError(errorMessage)
      logger.error('Failed to load CSRF token', { error: err })
      
      if (finalConfig.onError) {
        finalConfig.onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsLoading(false)
    }
  }, [finalConfig.onError])

  /**
   * Refresh CSRF token
   */
  const refreshToken = useCallback(async () => {
    await loadToken()
  }, [loadToken])

  /**
   * Add CSRF token to request headers
   */
  const addToHeaders = useCallback((headers: HeadersInit = {}): HeadersInit => {
    if (!token) {
      logger.warn('Attempting to add CSRF token to headers but no token available')
      return headers
    }

    return addCSRFToHeaders(headers)
  }, [token])

  /**
   * Add CSRF token to request body (for form submissions)
   */
  const addToBody = useCallback((body: any): any => {
    if (!token) {
      logger.warn('Attempting to add CSRF token to body but no token available')
      return body
    }

    return addCSRFToBody(body, token)
  }, [token])

  /**
   * Make a secure HTTP request with automatic CSRF protection
   * Handles token injection, retries on CSRF failures, and error handling
   */
  const makeSecureRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!token) {
      throw new Error('CSRF token not available')
    }

    // Prepare secure headers
    const secureHeaders = addToHeaders(options.headers)

    // Prepare request options
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...secureHeaders
      },
      credentials: 'same-origin'
    }

    // Add CSRF token to JSON body if needed
    if (requestOptions.body && typeof requestOptions.body === 'string') {
      try {
        const bodyObj = JSON.parse(requestOptions.body)
        const secureBody = addToBody(bodyObj)
        requestOptions.body = JSON.stringify(secureBody)
      } catch {
        // Body is not JSON, keep as is
      }
    }

    try {
      const response = await fetch(url, requestOptions)

      // Handle CSRF validation failure
      if (response.status === 403) {
        const responseText = await response.text()
        if (responseText.includes('CSRF') || responseText.includes('csrf')) {
          logger.warn('CSRF validation failed, attempting to refresh token')
          
          // Refresh token and retry once
          await refreshToken()
          
          if (token) {
            const retryHeaders = addToHeaders(options.headers)
            const retryOptions: RequestInit = {
              ...requestOptions,
              headers: {
                'Content-Type': 'application/json',
                ...retryHeaders
              }
            }

            logger.info('Retrying request with new CSRF token')
            return fetch(url, retryOptions)
          }
        }
      }

      return response
    } catch (err) {
      logger.error('Secure request failed', { url, error: err })
      throw err
    }
  }, [token, addToHeaders, addToBody, refreshToken])

  // Initialize token on mount
  useEffect(() => {
    loadToken()
  }, [loadToken])

  // Auto-refresh token periodically
  useEffect(() => {
    if (!finalConfig.autoRefresh) return

    const interval = setInterval(() => {
      if (!isLoading) {
        refreshToken()
      }
    }, finalConfig.refreshInterval)

    return () => clearInterval(interval)
  }, [finalConfig.autoRefresh, finalConfig.refreshInterval, isLoading, refreshToken])

  // Refresh token when page becomes visible (handles tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isLoading) {
        refreshToken()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isLoading, refreshToken])

  return {
    token,
    isLoading,
    error,
    refreshToken,
    addToHeaders,
    addToBody,
    makeSecureRequest
  }
}

/**
 * Higher-order function to create a fetch wrapper with CSRF protection
 * Useful for API service classes or utility functions
 */
export function createSecureFetch() {
  let token: string | null = null

  // Get initial token
  const initToken = async () => {
    if (typeof window === 'undefined') return

    token = getCSRFTokenFromMeta()
    
    if (!token) {
      try {
        const response = await fetch('/api/csrf-token')
        const data = await response.json()
        token = data.token
      } catch (error) {
        logger.error('Failed to initialize CSRF token for secureFetch', { error })
      }
    }
  }

  // Initialize token
  initToken()

  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!token) {
      await initToken()
    }

    if (!token) {
      throw new Error('CSRF token not available for secure fetch')
    }

    const secureHeaders = addCSRFToHeaders(options.headers)
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...secureHeaders
      },
      credentials: 'same-origin'
    })
  }
}

/**
 * Utility type for components that need CSRF protection
 */
export type CSRFProtectedProps = {
  csrfToken?: string
}

export default useCsrf