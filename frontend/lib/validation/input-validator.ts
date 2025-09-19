/**
 * Input Validation Service
 * Healthcare platform input validation and sanitization
 */

import { z } from 'zod'
import { logger } from '@/lib/logging/client-safe-logger'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: any
}

export class InputValidator {
  private static readonly MAX_STRING_LENGTH = 10000
  private static readonly MAX_EMAIL_LENGTH = 254
  private static readonly MAX_PHONE_LENGTH = 20
  private static readonly MAX_URL_LENGTH = 2048

  /**
   * Validate and sanitize string input
   */
  static validateString(
    input: any,
    fieldName: string,
    options: {
      required?: boolean
      maxLength?: number
      minLength?: number
      pattern?: RegExp
      allowHtml?: boolean
    } = {}
  ): ValidationResult {
    const {
      required = false,
      maxLength = this.MAX_STRING_LENGTH,
      minLength = 0,
      pattern,
      allowHtml = false
    } = options

    const errors: string[] = []

    // Check if required field is present
    if (required && (input === undefined || input === null || input === '')) {
      errors.push(`${fieldName} is required`)
      return { isValid: false, errors }
    }

    // Skip validation if not required and empty
    if (!required && (input === undefined || input === null || input === '')) {
      return { isValid: true, errors: [], sanitizedData: '' }
    }

    // Convert to string
    const stringInput = String(input).trim()

    // Check length
    if (stringInput.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`)
    }

    if (stringInput.length > maxLength) {
      errors.push(`${fieldName} must be no more than ${maxLength} characters long`)
    }

    // Check pattern
    if (pattern && !pattern.test(stringInput)) {
      errors.push(`${fieldName} format is invalid`)
    }

    // Sanitize if valid
    let sanitizedData = stringInput
    if (errors.length === 0) {
      sanitizedData = this.sanitizeString(stringInput, allowHtml)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    }
  }

  /**
   * Validate email address
   */
  static validateEmail(email: any, fieldName: string = 'email'): ValidationResult {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    return this.validateString(email, fieldName, {
      required: true,
      maxLength: this.MAX_EMAIL_LENGTH,
      pattern: emailRegex
    })
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone: any, fieldName: string = 'phone'): ValidationResult {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    
    return this.validateString(phone, fieldName, {
      required: false,
      maxLength: this.MAX_PHONE_LENGTH,
      pattern: phoneRegex
    })
  }

  /**
   * Validate URL
   */
  static validateUrl(url: any, fieldName: string = 'url'): ValidationResult {
    try {
      new URL(url)
      return this.validateString(url, fieldName, {
        required: false,
        maxLength: this.MAX_URL_LENGTH
      })
    } catch {
      return {
        isValid: false,
        errors: [`${fieldName} must be a valid URL`]
      }
    }
  }

  /**
   * Validate UUID
   */
  static validateUuid(uuid: any, fieldName: string = 'id'): ValidationResult {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    return this.validateString(uuid, fieldName, {
      required: true,
      pattern: uuidRegex
    })
  }

  /**
   * Validate number
   */
  static validateNumber(
    input: any,
    fieldName: string,
    options: {
      required?: boolean
      min?: number
      max?: number
      integer?: boolean
    } = {}
  ): ValidationResult {
    const { required = false, min, max, integer = false } = options
    const errors: string[] = []

    // Check if required field is present
    if (required && (input === undefined || input === null || input === '')) {
      errors.push(`${fieldName} is required`)
      return { isValid: false, errors }
    }

    // Skip validation if not required and empty
    if (!required && (input === undefined || input === null || input === '')) {
      return { isValid: true, errors: [], sanitizedData: null }
    }

    // Convert to number
    const numberInput = Number(input)

    // Check if valid number
    if (isNaN(numberInput)) {
      errors.push(`${fieldName} must be a valid number`)
      return { isValid: false, errors }
    }

    // Check if integer
    if (integer && !Number.isInteger(numberInput)) {
      errors.push(`${fieldName} must be an integer`)
    }

    // Check range
    if (min !== undefined && numberInput < min) {
      errors.push(`${fieldName} must be at least ${min}`)
    }

    if (max !== undefined && numberInput > max) {
      errors.push(`${fieldName} must be no more than ${max}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: numberInput
    }
  }

  /**
   * Validate boolean
   */
  static validateBoolean(input: any, fieldName: string): ValidationResult {
    if (typeof input === 'boolean') {
      return { isValid: true, errors: [], sanitizedData: input }
    }

    if (typeof input === 'string') {
      const lowerInput = input.toLowerCase()
      if (['true', 'false', '1', '0', 'yes', 'no'].includes(lowerInput)) {
        return {
          isValid: true,
          errors: [],
          sanitizedData: ['true', '1', 'yes'].includes(lowerInput)
        }
      }
    }

    return {
      isValid: false,
      errors: [`${fieldName} must be a boolean value`]
    }
  }

  /**
   * Validate date
   */
  static validateDate(input: any, fieldName: string): ValidationResult {
    if (input instanceof Date) {
      return { isValid: true, errors: [], sanitizedData: input }
    }

    if (typeof input === 'string') {
      const date = new Date(input)
      if (!isNaN(date.getTime())) {
        return { isValid: true, errors: [], sanitizedData: date }
      }
    }

    return {
      isValid: false,
      errors: [`${fieldName} must be a valid date`]
    }
  }

  /**
   * Validate array
   */
  static validateArray(
    input: any,
    fieldName: string,
    options: {
      required?: boolean
      minLength?: number
      maxLength?: number
      itemValidator?: (item: any, index: number) => ValidationResult
    } = {}
  ): ValidationResult {
    const { required = false, minLength, maxLength, itemValidator } = options
    const errors: string[] = []

    // Check if required field is present
    if (required && (!Array.isArray(input) || input.length === 0)) {
      errors.push(`${fieldName} is required and must be a non-empty array`)
      return { isValid: false, errors }
    }

    // Skip validation if not required and empty
    if (!required && (!Array.isArray(input) || input.length === 0)) {
      return { isValid: true, errors: [], sanitizedData: [] }
    }

    // Check if array
    if (!Array.isArray(input)) {
      errors.push(`${fieldName} must be an array`)
      return { isValid: false, errors }
    }

    // Check length
    if (minLength !== undefined && input.length < minLength) {
      errors.push(`${fieldName} must have at least ${minLength} items`)
    }

    if (maxLength !== undefined && input.length > maxLength) {
      errors.push(`${fieldName} must have no more than ${maxLength} items`)
    }

    // Validate items
    const sanitizedItems: any[] = []
    if (itemValidator) {
      for (let i = 0; i < input.length; i++) {
        const itemResult = itemValidator(input[i], i)
        if (!itemResult.isValid) {
          errors.push(`${fieldName}[${i}]: ${itemResult.errors.join(', ')}`)
        } else {
          sanitizedItems.push(itemResult.sanitizedData)
        }
      }
    } else {
      sanitizedItems.push(...input)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedItems
    }
  }

  /**
   * Validate object
   */
  static validateObject(
    input: any,
    fieldName: string,
    schema: Record<string, (value: any) => ValidationResult>
  ): ValidationResult {
    const errors: string[] = []
    const sanitizedData: Record<string, any> = {}

    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return {
        isValid: false,
        errors: [`${fieldName} must be an object`]
      }
    }

    // Validate each field
    for (const [key, validator] of Object.entries(schema)) {
      const result = validator(input[key])
      if (!result.isValid) {
        errors.push(`${fieldName}.${key}: ${result.errors.join(', ')}`)
      } else {
        sanitizedData[key] = result.sanitizedData
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    }
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(input: string, allowHtml: boolean = false): string {
    if (allowHtml) {
      // Basic HTML sanitization
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
    } else {
      // Remove all HTML tags
      return input
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
    }
  }

  /**
   * Validate healthcare data
   */
  static validateHealthcareData(data: any): ValidationResult {
    const errors: string[] = []
    const sanitizedData: any = {}

    // Validate required healthcare fields
    const requiredFields = ['patient_id', 'data_type', 'classification']
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Healthcare data missing required field: ${field}`)
      }
    }

    // Validate data classification
    if (data.classification && !['public', 'internal', 'confidential', 'restricted'].includes(data.classification)) {
      errors.push('Invalid data classification')
    }

    // Validate HIPAA compliance
    if (data.hipaa_required && !data.encryption_enabled) {
      errors.push('HIPAA data must be encrypted')
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: data
    }
  }

  /**
   * Log validation errors
   */
  static logValidationErrors(fieldName: string, errors: string[], context?: any): void {
    logger.warn('Input validation failed', {
      fieldName,
      errors,
      context,
      timestamp: new Date().toISOString()
    })
  }
}

export default InputValidator

// Export inputValidator for backward compatibility
export const inputValidator = InputValidator;
