'use client'

import React, { useState, useEffect } from 'react'
import { BaseContentItem } from '@/lib/types/cms-types'

interface UseCMSContentOptions {
  type?: string
  slug?: string
  status?: 'draft' | 'published' | 'archived'
  fallback?: any
}

export function useCMSContent(options: UseCMSContentOptions = {}) {
  const [content, setContent] = useState<BaseContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const fetchContent = async () => {
      if (!options.type && !options.slug) {
        setLoading(false)
        return
      }

      try {
        const params = new URLSearchParams()
        if (options.type) params.append('type', options.type)
        if (options.status) params.append('status', options.status)
        
        const response = await fetch(`/api/cms/content?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch content')
        }
        
        const result = await response.json()
        
        if (isMounted) {
          let foundContent = null
          
          if (result.data && Array.isArray(result.data)) {
            if (options.slug) {
              foundContent = result.data.find((item: BaseContentItem) => item.slug === options.slug)
            } else {
              foundContent = result.data[0] // Take first item if no slug specified
            }
          }
          
          setContent(foundContent)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          // Use fallback data if available
          if (options.fallback) {
            setContent({
              id: 'fallback',
              type: options.type || 'unknown',
              slug: options.slug || 'fallback',
              title: 'Fallback Content',
              status: 'published',
              author_id: 'system',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              content: options.fallback
            } as BaseContentItem)
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchContent()

    return () => {
      isMounted = false
    }
  }, [options.type, options.slug, options.status])

  return {
    content,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      setError(null)
      // Re-run the effect by changing a dependency
    }
  }
}

// Hook for fetching multiple content items
export function useCMSContentList(options: UseCMSContentOptions & { limit?: number } = {}) {
  const [content, setContent] = useState<BaseContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let isMounted = true
    
    const fetchContent = async () => {
      try {
        const params = new URLSearchParams()
        if (options.type) params.append('type', options.type)
        if (options.status) params.append('status', options.status)
        if (options.limit) params.append('limit', options.limit.toString())
        
        const response = await fetch(`/api/cms/content?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch content list')
        }
        
        const result = await response.json()
        
        if (isMounted) {
          setContent(result.data || [])
          setTotal(result.pagination?.total || result.data?.length || 0)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          // Use fallback data if available
          if (options.fallback) {
            setContent(Array.isArray(options.fallback) ? options.fallback : [options.fallback])
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchContent()

    return () => {
      isMounted = false
    }
  }, [options.type, options.status, options.limit])

  return {
    content,
    loading,
    error,
    total,
    refetch: () => {
      setLoading(true)
      setError(null)
    }
  }
}

// Specialized hooks for common content types
export function useHomepageHero(fallback?: any) {
  console.log('DEBUG: useHomepageHero called with fallback:', fallback)
  
  const options = React.useMemo(() => ({
    type: 'page',
    slug: 'homepage',
    status: 'published' as const,
    fallback
  }), [fallback])
  
  console.log('DEBUG: useHomepageHero options:', options)
  
  const result = useCMSContent(options)
  
  // DEBUG: Log homepage hero data
  console.log('DEBUG: useHomepageHero result', {
    content: result.content,
    loading: result.loading,
    error: result.error,
    hasContent: !!result.content,
    contentKeys: result.content ? Object.keys(result.content) : null
  })
  
  return result
}

export function useCROShowcaseCards(fallback?: any) {
  const options = React.useMemo(() => ({
    type: 'cro-showcase',
    status: 'published' as const,
    limit: 10,
    fallback
  }), [fallback])
  
  return useCMSContentList(options)
}

export function usePhoneScreens(fallback?: any) {
  const options = React.useMemo(() => ({
    type: 'phone-showcase',
    status: 'published' as const,
    limit: 10,
    fallback
  }), [fallback])
  
  return useCMSContentList(options)
}

export function useNavigationMenu(location: string, fallback?: any) {
  const options = React.useMemo(() => ({
    type: 'navigation',
    slug: location,
    status: 'published' as const,
    fallback
  }), [location, fallback])
  
  return useCMSContent(options)
}

export function usePlatformPage(platformKey: string, fallback?: any) {
  const options = React.useMemo(() => ({
    type: 'platform-page',
    slug: platformKey,
    status: 'published' as const,
    fallback
  }), [platformKey, fallback])
  
  return useCMSContent(options)
}

export function useServicePage(serviceKey: string, fallback?: any) {
  const options = React.useMemo(() => ({
    type: 'service-page',
    slug: serviceKey,
    status: 'published' as const,
    fallback
  }), [serviceKey, fallback])
  
  return useCMSContent(options)
}

export function useResearchPage(researchType: string, fallback?: any) {
  const options = React.useMemo(() => ({
    type: 'research-page',
    slug: researchType,
    status: 'published' as const,
    fallback
  }), [researchType, fallback])
  
  return useCMSContent(options)
}

export function useFooterContent(fallback?: any) {
  const options = React.useMemo(() => ({
    type: 'footer',
    slug: 'main-footer',
    status: 'published' as const,
    fallback
  }), [fallback])
  
  return useCMSContent(options)
}

// Utility function to get content data safely
export function getContentData<T = any>(content: BaseContentItem | null, fallback?: T): T | null {
  if (!content) return fallback || null
  return content.content as T
}