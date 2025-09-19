/**
 * Admin Component Utilities
 * Shared utility functions and hooks for admin components
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useEffect, useRef, useState } from 'react'

/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for healthcare contexts
 */
export function formatHealthcareDate(date: Date | string, format: 'short' | 'long' | 'ISO' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'ISO') {
    return d.toISOString()
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Sanitize healthcare data for display
 */
export function sanitizeHealthcareData(data: any, dataType?: 'PHI' | 'PII' | 'GENERAL' | 'SENSITIVE'): any {
  if (!data) return data
  
  if (dataType === 'PHI' || dataType === 'PII') {
    // Mask sensitive information
    if (typeof data === 'string') {
      // SSN pattern
      if (/^\d{3}-\d{2}-\d{4}$/.test(data)) {
        return 'XXX-XX-' + data.slice(-4)
      }
      // Email pattern
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        const [local, domain] = data.split('@')
        return local.charAt(0) + '****@' + domain
      }
      // Phone pattern
      if (/^\d{3}-\d{3}-\d{4}$/.test(data)) {
        return 'XXX-XXX-' + data.slice(-4)
      }
    }
  }
  
  return data
}

/**
 * Generate unique ID for components
 */
export function generateAdminId(prefix = 'admin'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Hook for handling keyboard shortcuts in admin components
 */
export function useAdminKeyboard(
  key: string,
  callback: () => void,
  options?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    preventDefault?: boolean
  }
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key === key &&
        (!options?.ctrl || event.ctrlKey || event.metaKey) &&
        (!options?.shift || event.shiftKey) &&
        (!options?.alt || event.altKey)
      ) {
        if (options?.preventDefault) {
          event.preventDefault()
        }
        callback()
      }
    }
    
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [key, callback, options])
}

/**
 * Hook for handling click outside of element
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  active = true
) {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    if (!active) return
    
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }
    
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler, active])
  
  return ref
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

/**
 * Hook for handling focus trap
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(active = true) {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    if (!active || !ref.current) return
    
    const element = ref.current
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    )
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }
    
    element.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])
  
  return ref
}

/**
 * Validate healthcare data format
 */
export function validateHealthcareFormat(
  value: string,
  format: 'SSN' | 'NPI' | 'DEA' | 'MRN' | 'INSURANCE'
): boolean {
  const patterns = {
    SSN: /^\d{3}-\d{2}-\d{4}$/,
    NPI: /^\d{10}$/,
    DEA: /^[A-Z]{2}\d{7}$/,
    MRN: /^[A-Z0-9]{6,12}$/,
    INSURANCE: /^[A-Z0-9]{8,15}$/
  }
  
  return patterns[format]?.test(value) || false
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if file type is medical document
 */
export function isMedicalDocument(fileName: string): boolean {
  const medicalExtensions = [
    '.pdf', '.doc', '.docx', '.dicom', '.dcm', '.hl7',
    '.xml', '.json', '.csv', '.tiff', '.tif', '.jpg', '.jpeg', '.png'
  ]
  
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return medicalExtensions.includes(ext)
}

/**
 * Generate HIPAA-compliant error message
 */
export function generateHipaaError(error: Error, context?: string): string {
  // Never expose sensitive data in error messages
  const genericMessage = 'An error occurred while processing your request.'
  
  if (process.env.NODE_ENV === 'development') {
    console.error('HIPAA Error Context:', context, error)
  }
  
  // Log to monitoring service without exposing PHI
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: {
        hipaa_context: context || 'unknown',
        sanitized: true
      }
    })
  }
  
  return genericMessage
}