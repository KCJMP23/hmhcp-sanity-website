'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import useSWR from 'swr'
import { logger } from '@/lib/logger';

export interface NavigationItem {
  id: string
  title: string
  url?: string
  target?: '_self' | '_blank'
  children?: NavigationItem[]
  icon?: string
  cssClasses?: string
}

interface NavigationContextValue {
  header: NavigationItem[]
  footer: NavigationItem[]
  mobile: NavigationItem[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined)

const staticNavigation = {
  header: [
    { id: 'home', title: 'Home', url: '/' },
    { id: 'about', title: 'About', url: '/about' },
    { id: 'services', title: 'Services', url: '/services' },
    { id: 'contact', title: 'Contact', url: '/contact' }
  ],
  footer: [
    { id: 'privacy', title: 'Privacy Policy', url: '/privacy' },
    { id: 'terms', title: 'Terms of Service', url: '/terms' },
    { id: 'sitemap', title: 'Sitemap', url: '/sitemap' }
  ],
  mobile: [
    { id: 'home', title: 'Home', url: '/' },
    { id: 'about', title: 'About', url: '/about' },
    { id: 'services', title: 'Services', url: '/services' },
    { id: 'contact', title: 'Contact', url: '/contact' }
  ]
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    next: { revalidate: 300 } // 5 minutes
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch navigation')
  }
  
  const data = await res.json()
  return data.items || []
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { data: headerData, error: headerError, mutate: mutateHeader } = useSWR(
    '/api/navigations/header',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5 minutes
      fallbackData: staticNavigation.header,
      onError: (err) => {
        logger.error('Header navigation fetch error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { err } })
      }
    }
  )

  const { data: footerData, error: footerError, mutate: mutateFooter } = useSWR(
    '/api/navigations/footer',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5 minutes
      fallbackData: staticNavigation.footer,
      onError: (err) => {
        logger.error('Footer navigation fetch error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { err } })
      }
    }
  )

  const { data: mobileData, error: mobileError, mutate: mutateMobile } = useSWR(
    '/api/navigations/mobile',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5 minutes
      fallbackData: staticNavigation.mobile,
      onError: (err) => {
        logger.error('Mobile navigation fetch error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { err } })
      }
    }
  )

  const isLoading = !headerData || !footerData || !mobileData
  const error = headerError || footerError || mobileError

  const refresh = async () => {
    await Promise.all([
      mutateHeader(),
      mutateFooter(),
      mutateMobile()
    ])
  }

  const value: NavigationContextValue = {
    header: headerData || staticNavigation.header,
    footer: footerData || staticNavigation.footer,
    mobile: mobileData || staticNavigation.mobile,
    isLoading,
    error,
    refresh
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}

export function useNavigationByLocation(location: 'header' | 'footer' | 'mobile') {
  const context = useNavigation()
  return {
    navigation: context[location],
    isLoading: context.isLoading,
    error: context.error,
    refresh: context.refresh
  }
}