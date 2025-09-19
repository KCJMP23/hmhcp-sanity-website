/**
 * Standardized Input Validation Middleware
 * 
 * This module provides consistent input validation and sanitization
 * for all API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from './error-handling'

export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData: any
}

/**
 * Validate request body against validation rules
 */
export function validateRequestBody(
  request: NextRequest,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = []
  let body: any = {}

  try {
    // Try to parse JSON body
    const text = request.body ? request.body.toString() : '{}'
    if (text && text !== '{}') {
      body = JSON.parse(text)
    }
  } catch (error) {
    errors.push('Invalid JSON in request body')
    return { isValid: false, errors, sanitizedData: {} }
  }

  const sanitizedData: any = {}

  for (const rule of rules) {
    const { field, required, type, minLength, maxLength, min, max, pattern, enum: enumValues, custom } = rule
    const value = body[field]

    // Check if required
    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`)
      continue
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      continue
    }

    // Type validation
    if (type) {
      const typeError = validateType(field, value, type)
      if (typeError) {
        errors.push(typeError)
        continue
      }
    }

    // Length validation for strings
    if (type === 'string' || typeof value === 'string') {
      if (minLength !== undefined && value.length < minLength) {
        errors.push(`Field '${field}' must be at least ${minLength} characters long`)
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`Field '${field}' must be no more than ${maxLength} characters long`)
      }
    }

    // Numeric validation
    if (type === 'number' || typeof value === 'number') {
      if (min !== undefined && value < min) {
        errors.push(`Field '${field}' must be at least ${min}`)
      }
      if (max !== undefined && value > max) {
        errors.push(`Field '${field}' must be no more than ${max}`)
      }
    }

    // Pattern validation
    if (pattern && typeof value === 'string') {
      if (!pattern.test(value)) {
        errors.push(`Field '${field}' format is invalid`)
      }
    }

    // Enum validation
    if (enumValues && !enumValues.includes(value)) {
      errors.push(`Field '${field}' must be one of: ${enumValues.join(', ')}`)
    }

    // Custom validation
    if (custom) {
      const customResult = custom(value)
      if (customResult !== true) {
        errors.push(`Field '${field}': ${customResult}`)
      }
    }

    // Sanitize and store valid value
    sanitizedData[field] = sanitizeValue(value)
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  request: NextRequest,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = []
  const searchParams = request.nextUrl.searchParams
  const sanitizedData: any = {}

  for (const rule of rules) {
    const { field, required, type, min, max, enum: enumValues, custom } = rule
    const value = searchParams.get(field)

    // Check if required
    if (required && !value) {
      errors.push(`Query parameter '${field}' is required`)
      continue
    }

    // Skip validation if value is not provided and not required
    if (!value) {
      continue
    }

    // Type validation
    if (type) {
      const typeError = validateType(field, value, type)
      if (typeError) {
        errors.push(typeError)
        continue
      }
    }

    // Numeric validation
    if (type === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value)
      if (min !== undefined && numValue < min) {
        errors.push(`Query parameter '${field}' must be at least ${min}`)
      }
      if (max !== undefined && numValue > max) {
        errors.push(`Query parameter '${field}' must be no more than ${max}`)
      }
    }

    // Enum validation
    if (enumValues && !enumValues.includes(value)) {
      errors.push(`Query parameter '${field}' must be one of: ${enumValues.join(', ')}`)
    }

    // Custom validation
    if (custom) {
      const customResult = custom(value)
      if (customResult !== true) {
        errors.push(`Query parameter '${field}': ${customResult}`)
      }
    }

    // Sanitize and store valid value
    sanitizedData[field] = sanitizeValue(value)
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  }
}

/**
 * Validate type of value
 */
function validateType(field: string, value: any, expectedType: string): string | null {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string' ? null : `Field '${field}' must be a string`
    
    case 'number':
      return typeof value === 'number' && !isNaN(value) ? null : `Field '${field}' must be a valid number`
    
    case 'boolean':
      return typeof value === 'boolean' ? null : `Field '${field}' must be a boolean`
    
    case 'array':
      return Array.isArray(value) ? null : `Field '${field}' must be an array`
    
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value) 
        ? null : `Field '${field}' must be an object`
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? null : `Field '${field}' must be a valid email address`
    
    case 'url':
      try {
        new URL(value)
        return null
      } catch {
        return `Field '${field}' must be a valid URL`
      }
    
    case 'uuid':
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(value) ? null : `Field '${field}' must be a valid UUID`
    
    default:
      return null
  }
}

/**
 * Sanitize a single value
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value.trim()
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  
  if (typeof value === 'object' && value !== null) {
    const sanitized: any = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val)
    }
    return sanitized
  }
  
  return value
}

/**
 * Common validation rules for blog posts
 */
export const blogPostValidationRules: ValidationRule[] = [
  { field: 'title', required: true, type: 'string', minLength: 1, maxLength: 200 },
  { field: 'content', required: true, type: 'string', minLength: 10 },
  { field: 'excerpt', type: 'string', maxLength: 500 },
  { field: 'status', type: 'string', enum: ['draft', 'published', 'archived'] },
  { field: 'tags', type: 'array' },
  { field: 'featured_image', type: 'url' }
]

/**
 * Common validation rules for user profiles
 */
export const userProfileValidationRules: ValidationRule[] = [
  { field: 'email', required: true, type: 'email' },
  { field: 'first_name', type: 'string', minLength: 1, maxLength: 100 },
  { field: 'last_name', type: 'string', minLength: 1, maxLength: 100 },
  { field: 'role', type: 'string', enum: ['super_admin', 'admin', 'editor', 'author', 'contributor', 'viewer'] },
  { field: 'is_active', type: 'boolean' }
]

/**
 * Common validation rules for media uploads
 */
export const mediaValidationRules: ValidationRule[] = [
  { field: 'filename', required: true, type: 'string', minLength: 1, maxLength: 255 },
  { field: 'url', required: true, type: 'url' },
  { field: 'mime_type', required: true, type: 'string' },
  { field: 'size', required: true, type: 'number', min: 1 },
  { field: 'alt_text', type: 'string', maxLength: 500 }
]

/**
 * Validation middleware wrapper
 */
export function withValidation(
  rules: ValidationRule[],
  handler: (request: NextRequest, validatedData: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = validateRequestBody(request, rules)
    
    if (!validation.isValid) {
      return createErrorResponse(
        request,
        'Validation failed',
        400,
        { validationErrors: validation.errors },
        'VALIDATION_ERROR'
      )
    }

    return await handler(request, validation.sanitizedData)
  }
}

/**
 * Query parameter validation middleware wrapper
 */
export function withQueryValidation(
  rules: ValidationRule[],
  handler: (request: NextRequest, validatedData: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = validateQueryParams(request, rules)
    
    if (!validation.isValid) {
      return createErrorResponse(
        request,
        'Invalid query parameters',
        400,
        { validationErrors: validation.errors },
        'VALIDATION_ERROR'
      )
    }

    return await handler(request, validation.sanitizedData)
  }
}
