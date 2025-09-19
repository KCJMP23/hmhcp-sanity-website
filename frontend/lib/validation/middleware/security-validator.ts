/**
 * Security-Focused Validation Module
 * 
 * Provides protection against injection attacks, XSS, and other security threats
 * 
 * @module lib/validation/middleware/security-validator
 */

import DOMPurify from 'isomorphic-dompurify'
import sqlstring from 'sqlstring'
import { ValidationConfig, ValidationError, ValidationWarning } from './api-validator'

/**
 * Security validation patterns
 */
const SECURITY_PATTERNS = {
  // SQL Injection patterns
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|JOIN|ORDER BY|GROUP BY|HAVING)\b)/gi,
    /('|(--|#|\/\*|\*\/|;))/g,
    /(xp_|sp_|exec|execute|declare|cast|convert)/gi,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
    /(UNION\s+(ALL\s+)?SELECT)/gi,
    /(INTO\s+(OUTFILE|DUMPFILE))/gi
  ],
  
  // NoSQL Injection patterns
  noSqlInjection: [
    /\$where/gi,
    /\$regex/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$gte/gi,
    /\$lt/gi,
    /\$lte/gi,
    /\$in/gi,
    /\$nin/gi,
    /\$exists/gi,
    /\$type/gi,
    /\$mod/gi,
    /\$text/gi,
    /\$elemMatch/gi,
    /\{\s*\$[\w]+\s*:/gi
  ],
  
  // XSS patterns
  xss: [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /<object[^>]*>[\s\S]*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:application\/javascript/gi
  ],
  
  // Command Injection patterns
  commandInjection: [
    /;|\||&|`|\$\(|\)/g,
    /\b(cat|ls|wget|curl|bash|sh|cmd|powershell)\b/gi,
    /\.\.\//g,
    /\/etc\/(passwd|shadow)/gi
  ],
  
  // Path Traversal patterns
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\+/g,
    /%2e%2e%2f/gi,
    /%252e%252e%252f/gi,
    /\.\./g
  ],
  
  // LDAP Injection patterns
  ldapInjection: [
    /[()&|!*]/g,
    /\*/g,
    /\(\|\(/gi,
    /\)\|\(/gi
  ],
  
  // XML Injection patterns
  xmlInjection: [
    /<!DOCTYPE/gi,
    /<!ENTITY/gi,
    /<!\[CDATA\[/gi,
    /SYSTEM/gi,
    /PUBLIC/gi
  ],
  
  // Email Header Injection
  emailHeaderInjection: [
    /(\r|\n|%0a|%0d)/gi,
    /(to:|cc:|bcc:|from:|subject:)/gi
  ]
}

/**
 * PII detection patterns
 */
const PII_PATTERNS = {
  // SSN patterns
  ssn: [
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{9}\b/g
  ],
  
  // Credit card patterns
  creditCard: [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    /\b\d{16}\b/g
  ],
  
  // Email patterns
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  ],
  
  // Phone patterns
  phone: [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\(\d{3}\)\s?\d{3}-\d{4}\b/g,
    /\b\+1\s?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
  ],
  
  // Date of birth patterns
  dateOfBirth: [
    /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,
    /\b(19|20)\d{2}[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])\b/g
  ],
  
  // Medical Record Number patterns
  mrn: [
    /\bMRN[\s:#]?\d{6,10}\b/gi,
    /\bMedical Record[\s:#]?\d{6,10}\b/gi
  ],
  
  // Driver's License patterns (generic)
  driversLicense: [
    /\bDL[\s:#]?[A-Z0-9]{6,12}\b/gi,
    /\bDriver['']?s License[\s:#]?[A-Z0-9]{6,12}\b/gi
  ],
  
  // Passport patterns
  passport: [
    /\b[A-Z]{1,2}\d{6,9}\b/g
  ],
  
  // IP Address patterns
  ipAddress: [
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
  ]
}

/**
 * Healthcare-specific patterns
 */
const HEALTHCARE_PATTERNS = {
  // Patient identifiers
  patientId: [
    /\bPID[\s:#]?\d{6,10}\b/gi,
    /\bPatient[\s:]?ID[\s:#]?\d{6,10}\b/gi
  ],
  
  // Insurance numbers
  insurance: [
    /\b[A-Z]{3}\d{9}\b/g, // Medicare
    /\bPolicy[\s:#]?[A-Z0-9]{8,12}\b/gi
  ],
  
  // DEA numbers
  dea: [
    /\b[A-Z]{2}\d{7}\b/g
  ],
  
  // NPI numbers
  npi: [
    /\b\d{10}\b/g
  ]
}

export class SecurityValidator {
  private config: ValidationConfig

  constructor(config: ValidationConfig) {
    this.config = config
  }

  /**
   * Main validation method
   */
  async validate(data: any): Promise<{
    valid: boolean
    errors?: ValidationError[]
    warnings?: ValidationWarning[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    const dataStr = JSON.stringify(data)
    
    // SQL Injection check
    if (this.config.preventSQLInjection) {
      const sqlInjectionCheck = this.checkSQLInjection(dataStr)
      if (sqlInjectionCheck.found) {
        errors.push({
          field: 'data',
          message: 'Potential SQL injection detected',
          code: 'SQL_INJECTION_DETECTED',
          severity: 'critical',
          suggestion: 'Remove or escape SQL keywords and special characters'
        })
      }
    }
    
    // NoSQL Injection check
    if (this.config.preventNoSQLInjection) {
      const noSqlInjectionCheck = this.checkNoSQLInjection(dataStr)
      if (noSqlInjectionCheck.found) {
        errors.push({
          field: 'data',
          message: 'Potential NoSQL injection detected',
          code: 'NOSQL_INJECTION_DETECTED',
          severity: 'critical',
          suggestion: 'Remove MongoDB operators and special syntax'
        })
      }
    }
    
    // XSS check
    if (this.config.preventXSS) {
      const xssCheck = this.checkXSS(dataStr)
      if (xssCheck.found) {
        errors.push({
          field: 'data',
          message: 'Potential XSS attack detected',
          code: 'XSS_DETECTED',
          severity: 'critical',
          suggestion: 'Remove or encode HTML tags and JavaScript code'
        })
      }
    }
    
    // Command Injection check
    const commandInjectionCheck = this.checkCommandInjection(dataStr)
    if (commandInjectionCheck.found) {
      warnings.push({
        field: 'data',
        message: 'Potential command injection detected',
        code: 'COMMAND_INJECTION_WARNING',
        suggestion: 'Review and sanitize shell command characters'
      })
    }
    
    // Path Traversal check
    const pathTraversalCheck = this.checkPathTraversal(dataStr)
    if (pathTraversalCheck.found) {
      errors.push({
        field: 'data',
        message: 'Path traversal attempt detected',
        code: 'PATH_TRAVERSAL_DETECTED',
        severity: 'critical',
        suggestion: 'Remove directory traversal sequences'
      })
    }
    
    // LDAP Injection check
    const ldapInjectionCheck = this.checkLDAPInjection(dataStr)
    if (ldapInjectionCheck.found) {
      warnings.push({
        field: 'data',
        message: 'Potential LDAP injection detected',
        code: 'LDAP_INJECTION_WARNING',
        suggestion: 'Escape LDAP special characters'
      })
    }
    
    // XML Injection check
    const xmlInjectionCheck = this.checkXMLInjection(dataStr)
    if (xmlInjectionCheck.found) {
      warnings.push({
        field: 'data',
        message: 'Potential XML injection detected',
        code: 'XML_INJECTION_WARNING',
        suggestion: 'Remove XML entity declarations'
      })
    }
    
    // Email Header Injection check
    const emailHeaderCheck = this.checkEmailHeaderInjection(dataStr)
    if (emailHeaderCheck.found) {
      warnings.push({
        field: 'data',
        message: 'Potential email header injection detected',
        code: 'EMAIL_HEADER_INJECTION_WARNING',
        suggestion: 'Remove line breaks and email headers from input'
      })
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * Check for PII in data
   */
  async checkForPII(data: any): Promise<{
    found: boolean
    types: string[]
    locations: string[]
  }> {
    const dataStr = JSON.stringify(data)
    const foundTypes: string[] = []
    const locations: string[] = []
    
    // Check each PII pattern
    for (const [type, patterns] of Object.entries(PII_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(dataStr)) {
          foundTypes.push(type)
          const matches = dataStr.match(pattern)
          if (matches) {
            locations.push(...matches.slice(0, 3)) // Limit to first 3 matches
          }
          break
        }
      }
    }
    
    // Check healthcare-specific patterns
    if (this.config.hipaaCompliant) {
      for (const [type, patterns] of Object.entries(HEALTHCARE_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(dataStr)) {
            foundTypes.push(`healthcare-${type}`)
            break
          }
        }
      }
    }
    
    return {
      found: foundTypes.length > 0,
      types: foundTypes,
      locations: locations.slice(0, 10) // Limit to 10 locations
    }
  }

  /**
   * Check for SQL injection
   */
  private checkSQLInjection(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.sqlInjection) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Check for NoSQL injection
   */
  private checkNoSQLInjection(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.noSqlInjection) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Check for XSS
   */
  private checkXSS(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.xss) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Check for command injection
   */
  private checkCommandInjection(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.commandInjection) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Check for path traversal
   */
  private checkPathTraversal(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.pathTraversal) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Check for LDAP injection
   */
  private checkLDAPInjection(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.ldapInjection) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Check for XML injection
   */
  private checkXMLInjection(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.xmlInjection) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Check for email header injection
   */
  private checkEmailHeaderInjection(data: string): { found: boolean; patterns: string[] } {
    const foundPatterns: string[] = []
    
    for (const pattern of SECURITY_PATTERNS.emailHeaderInjection) {
      if (pattern.test(data)) {
        foundPatterns.push(pattern.source)
      }
    }
    
    return {
      found: foundPatterns.length > 0,
      patterns: foundPatterns
    }
  }

  /**
   * Sanitize SQL input
   */
  sanitizeSQL(input: string): string {
    return sqlstring.escape(input)
  }

  /**
   * Sanitize HTML input
   */
  sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'span'],
      ALLOWED_ATTR: ['class', 'id']
    })
  }

  /**
   * Sanitize file path
   */
  sanitizeFilePath(path: string): string {
    // Remove any path traversal attempts
    return path.replace(/\.\./g, '').replace(/[^a-zA-Z0-9-_./]/g, '')
  }

  /**
   * Sanitize JSON input
   */
  sanitizeJSON(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeHTML(input)
    }
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeJSON(item))
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeHTML(key)] = this.sanitizeJSON(value)
      }
      return sanitized
    }
    return input
  }
}

export default SecurityValidator