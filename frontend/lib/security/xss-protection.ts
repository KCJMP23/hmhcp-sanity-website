/**
 * XSS Protection Utilities
 * Provides sanitization and validation for user inputs to prevent XSS attacks
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: Use a more restrictive sanitization
    return html
      .replace(/[<>'"&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        }
        return entities[match] || match
      })
  }
  
  // Client-side: Use DOMPurify
  return DOMPurify.sanitize(html)
}

/**
 * Sanitize plain text to prevent XSS in text contexts
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  return text
    .replace(/[<>'"&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[match] || match
    })
    .slice(0, 1000) // Limit length
}

/**
 * Sanitize URL parameters to prevent injection attacks
 */
export function sanitizeUrlParam(param: string): string {
  if (!param || typeof param !== 'string') {
    return ''
  }
  
  return param
    // Remove any potentially dangerous characters
    .replace(/[<>'"&;(){}[\]\\`]/g, '')
    // Limit length
    .slice(0, 100)
    // Only allow safe characters
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .trim()
}

/**
 * Validate and sanitize search query parameters
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }
  
  return query
    // Remove script tags and other dangerous HTML
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    // Sanitize special characters
    .replace(/[<>'"&;(){}[\]\\`]/g, '')
    .slice(0, 200) // Limit length
    .trim()
}

/**
 * Create safe props object by sanitizing all string values
 */
export function sanitizeProps<T extends Record<string, any>>(props: T): T {
  const sanitized = { ...props }
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value) as T[keyof T]
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeProps(value) as T[keyof T]
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : 
        typeof item === 'object' && item !== null ? sanitizeProps(item) : item
      ) as T[keyof T]
    }
  }
  
  return sanitized
}

/**
 * Safe URL constructor that validates and sanitizes URLs
 */
export function createSafeUrl(urlString: string, baseUrl?: string): URL | null {
  try {
    const url = new URL(urlString, baseUrl)
    
    // Only allow http, https, and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return null
    }
    
    return url
  } catch {
    return null
  }
}

/**
 * Sanitize search params from URL
 */
export function sanitizeSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {}
  
  for (const [key, value] of searchParams.entries()) {
    const sanitizedKey = sanitizeUrlParam(key)
    const sanitizedValue = sanitizeSearchQuery(value)
    
    if (sanitizedKey && sanitizedValue) {
      sanitized[sanitizedKey] = sanitizedValue
    }
  }
  
  return sanitized
}