/**
 * Comprehensive Input Validation and Sanitization
 * Protects against XSS, SQL injection, and other injection attacks
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'
import { logger } from '@/lib/logger'

// Common validation patterns
export const ValidationPatterns = {
  // Healthcare-specific patterns
  mrn: /^[A-Z0-9]{6,12}$/i, // Medical Record Number
  npi: /^\d{10}$/, // National Provider Identifier
  icd10: /^[A-Z]\d{2}(\.\d{1,4})?$/, // ICD-10 codes
  cpt: /^\d{5}$/, // CPT codes
  
  // General patterns
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,15}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
  
  // Security patterns
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Content patterns
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
}

// Dangerous patterns to detect potential attacks
export const DangerousPatterns = {
  // XSS patterns
  xss: [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*>/gi,
    /<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi
  ],
  
  // SQL injection patterns
  sqlInjection: [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?)\b)/gi,
    /(\b(AND|OR)\b.{1,6}?(=|>|<|\!=|<>|<>)\s*\d+)/gi,
    /(\b(AND|OR)\b\s*\d+\s*(=|>|<|\!=|<>)\s*\d+)/gi,
    /(HAVING|WHERE)\s+\d+\s*=\s*\d+/gi,
    /;\s*(DROP|DELETE|UPDATE|INSERT)/gi
  ],
  
  // Command injection patterns
  commandInjection: [
    /[;&|`${}][\s\S]*[;&|`${}]/,  // Multiple command chars
    /;\s*(cat|ls|ps|whoami|id|uname|pwd|wget|curl|nc|telnet|ssh)\b/gi,
    /\|\s*(cat|ls|ps|whoami|id|uname|pwd|wget|curl|nc|telnet|ssh)\b/gi,
    /`[^`]*`/,  // Command substitution
    /\$\([^)]*\)/,  // Command substitution
    /&&\s*(cat|ls|ps|whoami|id|uname|pwd|wget|curl|nc|telnet|ssh)\b/gi
  ],
  
  // Path traversal patterns
  pathTraversal: [
    /\.\.[\/\\]/g,
    /[\/\\]\.\.[\/\\]/g,
    /%2e%2e[\/\\]/gi,
    /\.\.[%2f%5c]/gi
  ],
  
  // LDAP injection patterns
  ldapInjection: [
    /\(\s*\|\s*\(/,  // (|(
    /\(\s*&\s*\(/,   // (&(
    /\*\*/,          // **
    /\(\*[^)]*\)/,   // (*...)
    /objectClass\s*=/i,
    /cn\s*=/i,
    /uid\s*=/i
  ]
}

export interface ValidationOptions {
  allowHtml?: boolean
  maxLength?: number
  minLength?: number
  required?: boolean
  pattern?: RegExp
  customSanitizer?: (input: string) => string
  skipDangerousPatternCheck?: boolean
}

export interface ValidationResult {
  isValid: boolean
  sanitizedValue?: any
  errors: string[]
  warnings: string[]
  securityFlags: string[]
}

class InputValidator {
  /**
   * Comprehensive input validation and sanitization
   */
  static validate(input: any, options: ValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityFlags: []
    }

    try {
      // Handle null/undefined
      if (input === null || input === undefined) {
        if (options.required) {
          result.isValid = false
          result.errors.push('Value is required')
        }
        return result
      }

      // Convert to string for processing
      const stringValue = String(input)

      // Check for dangerous patterns first
      if (!options.skipDangerousPatternCheck) {
        const securityCheck = this.checkDangerousPatterns(stringValue)
        if (securityCheck.flags.length > 0) {
          result.securityFlags = securityCheck.flags
          result.warnings.push('Potentially dangerous patterns detected')
          
          // Log security event
          logger.warn('Dangerous pattern detected in input', {
            input: stringValue.substring(0, 100),
            flags: securityCheck.flags,
            timestamp: new Date().toISOString()
          })
        }
      }

      // Length validation
      if (options.maxLength && stringValue.length > options.maxLength) {
        result.isValid = false
        result.errors.push(`Value exceeds maximum length of ${options.maxLength}`)
      }

      if (options.minLength && stringValue.length < options.minLength) {
        result.isValid = false
        result.errors.push(`Value must be at least ${options.minLength} characters`)
      }

      // Pattern validation
      if (options.pattern && !options.pattern.test(stringValue)) {
        result.isValid = false
        result.errors.push('Value does not match required pattern')
      }

      // Sanitization
      let sanitizedValue = stringValue

      if (options.allowHtml) {
        // Sanitize HTML while preserving safe elements
        sanitizedValue = DOMPurify.sanitize(sanitizedValue, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          ALLOWED_ATTR: ['class', 'id'],
          FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
          FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style']
        })
      } else {
        // Strip all HTML and encode special characters
        sanitizedValue = this.sanitizeText(sanitizedValue)
      }

      // Apply custom sanitizer if provided
      if (options.customSanitizer) {
        sanitizedValue = options.customSanitizer(sanitizedValue)
      }

      result.sanitizedValue = sanitizedValue

      return result

    } catch (error) {
      logger.error('Input validation error:', { error: error instanceof Error ? error.message : 'Unknown error' })
      result.isValid = false
      result.errors.push('Validation error occurred')
      return result
    }
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const result = this.validate(email, {
      required: true,
      maxLength: 254,
      pattern: ValidationPatterns.email
    })

    if (result.sanitizedValue && !validator.isEmail(result.sanitizedValue)) {
      result.isValid = false
      result.errors.push('Invalid email format')
    }

    return result
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone: string): ValidationResult {
    const result = this.validate(phone, {
      required: true,
      maxLength: 20,
      pattern: ValidationPatterns.phone
    })

    // Additional phone validation
    if (result.sanitizedValue) {
      const cleanPhone = result.sanitizedValue.replace(/[\s\-\(\)]/g, '')
      if (!validator.isMobilePhone(cleanPhone, 'any', { strictMode: false })) {
        result.warnings.push('Phone number format may be invalid')
      }
    }

    return result
  }

  /**
   * Validate URL
   */
  static validateURL(url: string, options: { allowedProtocols?: string[] } = {}): ValidationResult {
    const result = this.validate(url, {
      required: true,
      maxLength: 2048,
      pattern: ValidationPatterns.url
    })

    if (result.sanitizedValue) {
      const allowedProtocols = options.allowedProtocols || ['http', 'https']
      
      if (!validator.isURL(result.sanitizedValue, {
        protocols: allowedProtocols,
        require_protocol: true,
        require_valid_protocol: true,
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false
      })) {
        result.isValid = false
        result.errors.push('Invalid URL format')
      }
    }

    return result
  }

  /**
   * Validate healthcare-specific Medical Record Number
   */
  static validateMRN(mrn: string): ValidationResult {
    return this.validate(mrn, {
      required: true,
      pattern: ValidationPatterns.mrn,
      maxLength: 12,
      minLength: 6
    })
  }

  /**
   * Validate National Provider Identifier
   */
  static validateNPI(npi: string): ValidationResult {
    const result = this.validate(npi, {
      required: true,
      pattern: ValidationPatterns.npi,
      maxLength: 10,
      minLength: 10
    })

    // Additional NPI checksum validation could be added here
    return result
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const result = this.validate(password, {
      required: true,
      minLength: 8,
      maxLength: 128,
      skipDangerousPatternCheck: true // Passwords might contain special chars
    })

    if (result.sanitizedValue) {
      const pwd = result.sanitizedValue
      const checks = {
        hasLower: /[a-z]/.test(pwd),
        hasUpper: /[A-Z]/.test(pwd),
        hasNumber: /\d/.test(pwd),
        hasSpecial: /[@$!%*?&]/.test(pwd),
        minLength: pwd.length >= 8
      }

      const score = Object.values(checks).filter(Boolean).length
      
      if (score < 4) {
        result.isValid = false
        result.errors.push('Password must contain lowercase, uppercase, number, and special character')
      }

      // Check against common passwords
      const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
      ]
      
      if (commonPasswords.includes(pwd.toLowerCase())) {
        result.isValid = false
        result.errors.push('Password is too common')
      }
    }

    return result
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File, options: {
    allowedTypes?: string[]
    maxSize?: number
    allowedExtensions?: string[]
  } = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityFlags: []
    }

    const allowedTypes = options.allowedTypes || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/json'
    ]
    
    const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
    
    const allowedExtensions = options.allowedExtensions || [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.json'
    ]

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      result.isValid = false
      result.errors.push(`File type ${file.type} is not allowed`)
    }

    // Check file size
    if (file.size > maxSize) {
      result.isValid = false
      result.errors.push(`File size ${file.size} exceeds maximum of ${maxSize} bytes`)
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (extension && !allowedExtensions.includes(extension)) {
      result.isValid = false
      result.errors.push(`File extension ${extension} is not allowed`)
    }

    // Check for dangerous file names
    if (this.isDangerousFileName(file.name)) {
      result.isValid = false
      result.securityFlags.push('dangerous_filename')
      result.errors.push('File name contains dangerous characters')
    }

    return result
  }

  /**
   * Sanitize text input by removing HTML and encoding special characters
   */
  private static sanitizeText(input: string): string {
    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '')
    
    // Encode special characters
    sanitized = validator.escape(sanitized)
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
    
    return sanitized.trim()
  }

  /**
   * Check input for dangerous patterns
   */
  static checkDangerousPatterns(input: string): { flags: string[]; details: Record<string, boolean> } {
    const flags: string[] = []
    const details: Record<string, boolean> = {}

    // Check XSS patterns
    const hasXSS = DangerousPatterns.xss.some(pattern => pattern.test(input))
    if (hasXSS) {
      flags.push('xss_attempt')
      details.xss = true
    }

    // Check SQL injection patterns
    const hasSQLi = DangerousPatterns.sqlInjection.some(pattern => pattern.test(input))
    if (hasSQLi) {
      flags.push('sql_injection_attempt')
      details.sqlInjection = true
    }

    // Check command injection patterns
    const hasCmdInjection = DangerousPatterns.commandInjection.some(pattern => pattern.test(input))
    if (hasCmdInjection) {
      flags.push('command_injection_attempt')
      details.commandInjection = true
    }

    // Check path traversal patterns
    const hasPathTraversal = DangerousPatterns.pathTraversal.some(pattern => pattern.test(input))
    if (hasPathTraversal) {
      flags.push('path_traversal_attempt')
      details.pathTraversal = true
    }

    // Check LDAP injection patterns
    const hasLDAPi = DangerousPatterns.ldapInjection.some(pattern => pattern.test(input))
    if (hasLDAPi) {
      flags.push('ldap_injection_attempt')
      details.ldapInjection = true
    }

    return { flags, details }
  }

  /**
   * Check if filename is potentially dangerous
   */
  private static isDangerousFileName(filename: string): boolean {
    const dangerousPatterns = [
      /\.\./,           // Path traversal
      /[<>:"|?*]/,      // Invalid filename chars
      /\0/,             // Null bytes
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /\.exe$|\.bat$|\.cmd$|\.scr$|\.pif$/i      // Executable extensions
    ]

    return dangerousPatterns.some(pattern => pattern.test(filename))
  }
}

// Zod schemas for common validations
export const ValidationSchemas = {
  email: z.string().email().max(254),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/\d/, 'Password must contain number')
    .regex(/[@$!%*?&]/, 'Password must contain special character'),
  
  phone: z.string().regex(ValidationPatterns.phone, 'Invalid phone format'),
  
  url: z.string().url().max(2048),
  
  mrn: z.string().regex(ValidationPatterns.mrn, 'Invalid MRN format'),
  
  npi: z.string().regex(ValidationPatterns.npi, 'Invalid NPI format'),
  
  slug: z.string().regex(ValidationPatterns.slug, 'Invalid slug format'),
  
  uuid: z.string().regex(ValidationPatterns.uuid, 'Invalid UUID format'),
  
  // Healthcare-specific schemas
  icd10: z.string().regex(ValidationPatterns.icd10, 'Invalid ICD-10 code'),
  
  cpt: z.string().regex(ValidationPatterns.cpt, 'Invalid CPT code'),
  
  // Content schemas
  title: z.string().min(1).max(200).refine((val) => {
    const check = InputValidator.checkDangerousPatterns(val)
    return check.flags.length === 0
  }, 'Content contains potentially dangerous patterns'),
  
  content: z.string().min(1).max(50000),
  
  // User data schemas
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/, 'Invalid name format'),
  
  username: z.string().regex(ValidationPatterns.username, 'Invalid username format')
}

export { InputValidator }
export default InputValidator