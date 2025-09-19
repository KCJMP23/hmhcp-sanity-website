/**
 * Input Sanitization Module
 * 
 * Provides comprehensive input sanitization and normalization
 * 
 * @module lib/validation/middleware/input-sanitizer
 */

import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'
import { ValidationConfig } from './api-validator'

/**
 * Sanitization options
 */
export interface SanitizationOptions {
  trimWhitespace?: boolean
  normalizeEmail?: boolean
  normalizeUrl?: boolean
  removeHtml?: boolean
  escapeHtml?: boolean
  normalizeWhitespace?: boolean
  toLowerCase?: boolean
  toUpperCase?: boolean
  removeNonAlphanumeric?: boolean
  removeNonPrintable?: boolean
  maxLength?: number
  allowedTags?: string[]
  allowedAttributes?: string[]
  stripScripts?: boolean
  stripStyles?: boolean
  stripComments?: boolean
  normalizeUnicode?: boolean
  removeEmoji?: boolean
  normalizeLineBreaks?: boolean
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: SanitizationOptions = {
  trimWhitespace: true,
  normalizeEmail: true,
  normalizeUrl: true,
  removeHtml: false,
  escapeHtml: true,
  normalizeWhitespace: true,
  stripScripts: true,
  stripStyles: true,
  stripComments: true,
  normalizeUnicode: true,
  removeEmoji: false,
  normalizeLineBreaks: true
}

/**
 * Input sanitizer class
 */
export class InputSanitizer {
  private config: ValidationConfig
  private options: SanitizationOptions

  constructor(config: ValidationConfig, options: SanitizationOptions = {}) {
    this.config = config
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Main sanitization method
   */
  async sanitize(input: any): Promise<any> {
    if (input === null || input === undefined) {
      return input
    }

    if (typeof input === 'string') {
      return this.sanitizeString(input)
    }

    if (Array.isArray(input)) {
      return Promise.all(input.map(item => this.sanitize(item)))
    }

    if (typeof input === 'object') {
      return this.sanitizeObject(input)
    }

    if (typeof input === 'number') {
      return this.sanitizeNumber(input)
    }

    if (typeof input === 'boolean') {
      return input
    }

    // For other types, convert to string and sanitize
    return this.sanitizeString(String(input))
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(input: string): string {
    let sanitized = input

    // Trim whitespace
    if (this.options.trimWhitespace) {
      sanitized = sanitized.trim()
    }

    // Normalize whitespace
    if (this.options.normalizeWhitespace) {
      sanitized = sanitized.replace(/\s+/g, ' ')
    }

    // Normalize line breaks
    if (this.options.normalizeLineBreaks) {
      sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    }

    // Remove non-printable characters
    if (this.options.removeNonPrintable) {
      sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    }

    // Remove emoji
    if (this.options.removeEmoji) {
      sanitized = this.removeEmoji(sanitized)
    }

    // Normalize Unicode
    if (this.options.normalizeUnicode) {
      sanitized = sanitized.normalize('NFC')
    }

    // Handle HTML
    if (this.options.removeHtml) {
      sanitized = this.stripHtml(sanitized)
    } else if (this.options.escapeHtml) {
      sanitized = this.escapeHtml(sanitized)
    } else if (this.config.preventXSS) {
      sanitized = this.sanitizeHtml(sanitized)
    }

    // Email normalization
    if (this.options.normalizeEmail && this.isEmail(sanitized)) {
      sanitized = validator.normalizeEmail(sanitized) || sanitized
    }

    // URL normalization
    if (this.options.normalizeUrl && this.isUrl(sanitized)) {
      sanitized = this.normalizeUrl(sanitized)
    }

    // Case conversion
    if (this.options.toLowerCase) {
      sanitized = sanitized.toLowerCase()
    } else if (this.options.toUpperCase) {
      sanitized = sanitized.toUpperCase()
    }

    // Remove non-alphanumeric
    if (this.options.removeNonAlphanumeric) {
      sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '')
    }

    // Max length enforcement
    if (this.options.maxLength && sanitized.length > this.options.maxLength) {
      sanitized = sanitized.substring(0, this.options.maxLength)
    }

    // SQL injection prevention
    if (this.config.preventSQLInjection) {
      sanitized = this.escapeSql(sanitized)
    }

    // NoSQL injection prevention
    if (this.config.preventNoSQLInjection) {
      sanitized = this.escapeNoSql(sanitized)
    }

    // Command injection prevention
    sanitized = this.escapeShell(sanitized)

    // Path traversal prevention
    sanitized = this.preventPathTraversal(sanitized)

    return sanitized
  }

  /**
   * Sanitize object input
   */
  private async sanitizeObject(input: any): Promise<any> {
    const sanitized: any = {}

    for (const [key, value] of Object.entries(input)) {
      // Sanitize the key
      const sanitizedKey = this.sanitizeObjectKey(key)

      // Skip dangerous keys
      if (this.isDangerousKey(sanitizedKey)) {
        continue
      }

      // Recursively sanitize the value
      sanitized[sanitizedKey] = await this.sanitize(value)
    }

    return sanitized
  }

  /**
   * Sanitize object key
   */
  private sanitizeObjectKey(key: string): string {
    // Remove any characters that could be used for injection
    let sanitized = key.replace(/[^\w\-_.]/g, '')

    // Prevent prototype pollution
    if (sanitized === '__proto__' || 
        sanitized === 'constructor' || 
        sanitized === 'prototype') {
      sanitized = '_' + sanitized
    }

    return sanitized
  }

  /**
   * Check if key is dangerous
   */
  private isDangerousKey(key: string): boolean {
    const dangerousKeys = [
      '$where',
      '$regex',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
      '$type',
      '$mod',
      '$text',
      '$elemMatch',
      'mapReduce',
      'group',
      'aggregate',
      '__proto__',
      'constructor',
      'prototype'
    ]

    return dangerousKeys.includes(key)
  }

  /**
   * Sanitize number input
   */
  private sanitizeNumber(input: number): number {
    // Check for Infinity and NaN
    if (!isFinite(input) || isNaN(input)) {
      return 0
    }

    // Check for extremely large numbers
    const MAX_SAFE_NUMBER = Number.MAX_SAFE_INTEGER
    const MIN_SAFE_NUMBER = Number.MIN_SAFE_INTEGER

    if (input > MAX_SAFE_NUMBER) {
      return MAX_SAFE_NUMBER
    }

    if (input < MIN_SAFE_NUMBER) {
      return MIN_SAFE_NUMBER
    }

    return input
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '')
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(input: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }

    return input.replace(/[&<>"'/]/g, char => htmlEscapes[char] || char)
  }

  /**
   * Sanitize HTML with DOMPurify
   */
  private sanitizeHtml(input: string): string {
    const config: any = {
      ALLOWED_TAGS: this.options.allowedTags || [
        'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'span', 
        'div', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 
        'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
      ],
      ALLOWED_ATTR: this.options.allowedAttributes || [
        'href', 'title', 'alt', 'class', 'id', 'target', 
        'rel', 'style'
      ],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    }

    if (this.options.stripScripts) {
      config.FORBID_TAGS.push('script')
    }

    if (this.options.stripStyles) {
      config.FORBID_TAGS.push('style')
      config.FORBID_ATTR.push('style')
    }

    if (this.options.stripComments) {
      config.ALLOWED_TAGS = config.ALLOWED_TAGS.filter((tag: string) => tag !== '#comment')
    }

    return DOMPurify.sanitize(input, config)
  }

  /**
   * Escape SQL special characters
   */
  private escapeSql(input: string): string {
    // Basic SQL escaping
    return input
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z')
  }

  /**
   * Escape NoSQL special characters
   */
  private escapeNoSql(input: string): string {
    // Remove MongoDB operators
    return input
      .replace(/\$/g, '\\$')
      .replace(/\./g, '\\.')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
  }

  /**
   * Escape shell special characters
   */
  private escapeShell(input: string): string {
    // Escape shell metacharacters
    const shellMetaChars = /[`~!@#$%^&*()+=\[\]{};':"\\|<>?]/g
    return input.replace(shellMetaChars, '\\$&')
  }

  /**
   * Prevent path traversal
   */
  private preventPathTraversal(input: string): string {
    // Remove path traversal sequences
    return input
      .replace(/\.\./g, '')
      .replace(/\.\.%2f/gi, '')
      .replace(/\.\.%5c/gi, '')
      .replace(/%2e%2e/gi, '')
      .replace(/%252e%252e/gi, '')
      .replace(/\x00/g, '')
  }

  /**
   * Check if string is email
   */
  private isEmail(input: string): boolean {
    return validator.isEmail(input)
  }

  /**
   * Check if string is URL
   */
  private isUrl(input: string): boolean {
    return validator.isURL(input)
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(input: string): string {
    try {
      const url = new URL(input)
      
      // Remove tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 
        'utm_term', 'utm_content', 'fbclid', 'gclid'
      ]
      
      trackingParams.forEach(param => {
        url.searchParams.delete(param)
      })
      
      // Normalize protocol
      if (url.protocol === 'http:' && this.config.hipaaCompliant) {
        url.protocol = 'https:'
      }
      
      return url.toString()
    } catch {
      return input
    }
  }

  /**
   * Remove emoji from string
   */
  private removeEmoji(input: string): string {
    // Remove emoji and other Unicode symbols
    return input.replace(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ''
    )
  }

  /**
   * Sanitize file upload
   */
  async sanitizeFileUpload(file: {
    name: string
    type: string
    size: number
    content?: Buffer | ArrayBuffer
  }): Promise<{
    valid: boolean
    sanitized?: {
      name: string
      type: string
      size: number
      content?: Buffer | ArrayBuffer
    }
    error?: string
  }> {
    // Sanitize filename
    const sanitizedName = this.sanitizeFileName(file.name)
    
    // Check file type
    if (!this.isAllowedFileType(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      }
    }
    
    // Check file size
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File size ${file.size} exceeds maximum allowed size`
      }
    }
    
    // Check for malicious content in filename
    if (this.containsMaliciousFilePattern(sanitizedName)) {
      return {
        valid: false,
        error: 'Filename contains potentially malicious pattern'
      }
    }
    
    return {
      valid: true,
      sanitized: {
        name: sanitizedName,
        type: file.type,
        size: file.size,
        content: file.content
      }
    }
  }

  /**
   * Sanitize filename
   */
  private sanitizeFileName(filename: string): string {
    // Remove path components
    const basename = filename.split(/[/\\]/).pop() || ''
    
    // Remove dangerous characters
    let sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_')
    
    // Prevent double extensions
    sanitized = sanitized.replace(/\.{2,}/g, '.')
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop() || ''
      const name = sanitized.substring(0, 250 - ext.length - 1)
      sanitized = `${name}.${ext}`
    }
    
    return sanitized
  }

  /**
   * Check if file type is allowed
   */
  private isAllowedFileType(mimeType: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/xml',
      'application/zip',
      'application/x-zip-compressed'
    ]
    
    return allowedTypes.includes(mimeType)
  }

  /**
   * Check for malicious file patterns
   */
  private containsMaliciousFilePattern(filename: string): boolean {
    const maliciousPatterns = [
      /\.exe$/i,
      /\.dll$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.zip\.exe$/i,
      /\.pdf\.exe$/i
    ]
    
    return maliciousPatterns.some(pattern => pattern.test(filename))
  }
}

export default InputSanitizer