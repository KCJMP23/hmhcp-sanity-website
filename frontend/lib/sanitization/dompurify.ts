/**
 * DOMPurify utility for safe HTML rendering
 * This module provides a centralized way to sanitize HTML content
 * to prevent XSS attacks throughout the application
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Default DOMPurify configuration for most use cases
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a', 'em', 'strong', 'del', 'ins',
    'b', 'i', 'u', 'code', 'pre', 'sup', 'sub', 'hr', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target',
    'rel', 'width', 'height', 'colspan', 'rowspan', 'scope'
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
}

/**
 * Strict configuration for user-generated content
 * Removes potentially dangerous elements and attributes
 */
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'em', 'strong', 'del',
    'b', 'i', 'u', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload']
}

/**
 * Configuration for rich text editor content
 * Allows more formatting options while maintaining security
 */
const RICH_TEXT_CONFIG: DOMPurify.Config = {
  ...DEFAULT_CONFIG,
  ALLOWED_TAGS: [
    ...(DEFAULT_CONFIG.ALLOWED_TAGS || []),
    'figure', 'figcaption', 'mark', 'kbd', 'samp', 'var',
    'abbr', 'address', 'cite', 'dfn', 'time'
  ],
  ALLOWED_ATTR: [
    ...(DEFAULT_CONFIG.ALLOWED_ATTR || []),
    'datetime', 'cite', 'dir', 'lang'
  ]
}

/**
 * Sanitize HTML content with default configuration
 * @param dirty - The HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  dirty: string,
  options?: DOMPurify.Config
): string {
  return DOMPurify.sanitize(dirty, options || DEFAULT_CONFIG)
}

/**
 * Sanitize user-generated content with strict configuration
 * @param dirty - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeUserContent(dirty: string): string {
  return DOMPurify.sanitize(dirty, STRICT_CONFIG)
}

/**
 * Sanitize rich text editor content
 * @param dirty - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeRichText(dirty: string): string {
  return DOMPurify.sanitize(dirty, RICH_TEXT_CONFIG)
}

/**
 * Sanitize and return a DocumentFragment for direct DOM manipulation
 * @param dirty - The HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized DocumentFragment
 */
export function sanitizeToFragment(
  dirty: string,
  options?: DOMPurify.Config
): DocumentFragment | HTMLElement {
  const config = {
    ...(options || DEFAULT_CONFIG),
    RETURN_DOM_FRAGMENT: true
  }
  return DOMPurify.sanitize(dirty, config) as unknown as DocumentFragment
}

/**
 * Check if a string contains any potentially dangerous content
 * @param content - The content to check
 * @returns true if content appears safe, false otherwise
 */
export function isContentSafe(content: string): boolean {
  const sanitized = sanitizeHTML(content, STRICT_CONFIG)
  // If content was modified by sanitization, it contained unsafe elements
  return sanitized === content
}

/**
 * React component prop sanitizer
 * Ensures that HTML props are sanitized before rendering
 */
export function sanitizeProps<T extends Record<string, any>>(
  props: T,
  htmlKeys: (keyof T)[] = ['dangerouslySetInnerHTML']
): T {
  const sanitized = { ...props }
  
  htmlKeys.forEach((key: any) => {
    if (key === 'dangerouslySetInnerHTML' && sanitized[key]) {
      const htmlProp = sanitized[key] as { __html: string }
      if (htmlProp.__html) {
        (sanitized as any)[key] = {
          __html: sanitizeHTML(htmlProp.__html)
        }
      }
    } else if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeHTML(sanitized[key] as string)
    }
  })
  
  return sanitized
}

/**
 * Create a custom DOMPurify instance with specific configuration
 * Useful for components that need consistent sanitization rules
 */
export function createSanitizer(config: DOMPurify.Config) {
  return (dirty: string): string => {
    return DOMPurify.sanitize(dirty, config)
  }
}

/**
 * Export DOMPurify for advanced use cases
 */
export { DOMPurify }

/**
 * Export configuration presets
 */
export const configs = {
  default: DEFAULT_CONFIG,
  strict: STRICT_CONFIG,
  richText: RICH_TEXT_CONFIG
}