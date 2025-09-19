/**
 * Admin Theme Hook
 * Manages theme state and preferences for admin components
 */

import { useState, useEffect, useCallback } from 'react'
import { defaultAdminTheme, darkAdminTheme, highContrastAdminTheme, generateThemeCSSVariables } from '../themes'
import type { AdminThemeConfig } from '../types'

type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'system'

interface UseAdminThemeReturn {
  theme: AdminThemeConfig
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  applyTheme: () => void
}

/**
 * Hook for managing admin theme
 */
export function useAdminTheme(): UseAdminThemeReturn {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [theme, setTheme] = useState<AdminThemeConfig>(defaultAdminTheme)

  // Get system preference
  const getSystemTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  // Get theme config based on mode
  const getThemeConfig = useCallback((themeMode: ThemeMode): AdminThemeConfig => {
    if (themeMode === 'high-contrast') return highContrastAdminTheme
    if (themeMode === 'dark') return darkAdminTheme
    if (themeMode === 'system') {
      return getSystemTheme() === 'dark' ? darkAdminTheme : defaultAdminTheme
    }
    return defaultAdminTheme
  }, [getSystemTheme])

  // Apply theme to document
  const applyTheme = useCallback(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const cssVars = generateThemeCSSVariables(theme)
    
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Add theme class to body
    document.body.classList.remove('admin-theme-light', 'admin-theme-dark', 'admin-theme-high-contrast')
    if (mode === 'high-contrast') {
      document.body.classList.add('admin-theme-high-contrast')
    } else if (mode === 'dark' || (mode === 'system' && getSystemTheme() === 'dark')) {
      document.body.classList.add('admin-theme-dark')
    } else {
      document.body.classList.add('admin-theme-light')
    }
  }, [theme, mode, getSystemTheme])

  // Set mode and persist preference
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('admin-theme-mode', newMode)
    }
    const newTheme = getThemeConfig(newMode)
    setTheme(newTheme)
  }, [getThemeConfig])

  // Toggle between light and dark modes
  const toggleMode = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'light' : 'light'
    setMode(newMode)
  }, [mode, setMode])

  // Initialize theme on mount
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedMode = localStorage.getItem('admin-theme-mode') as ThemeMode
      if (savedMode) {
        setModeState(savedMode)
        setTheme(getThemeConfig(savedMode))
      }
    }
  }, [getThemeConfig])

  // Apply theme when it changes
  useEffect(() => {
    applyTheme()
  }, [applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setTheme(getThemeConfig('system'))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode, getThemeConfig])

  return {
    theme,
    mode,
    setMode,
    toggleMode,
    applyTheme,
  }
}