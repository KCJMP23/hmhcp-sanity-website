/**
 * Secure JSON Parser
 * Provides safe JSON parsing with comprehensive error handling and validation
 * Prevents JSON parsing vulnerabilities and injection attacks
 */

import { logger } from '@/lib/logger'
import { z } from 'zod'

export interface ParseOptions {
  maxDepth?: number
  maxLength?: number
  allowedTypes?: Array<'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'>
  schema?: z.ZodSchema
  sanitize?: boolean
  throwOnError?: boolean
}

export interface ParseResult<T = any> {
  success: boolean
  data?: T
  error?: string
  sanitized?: boolean
  warnings?: string[]
}

class SecureJSONParser {
  private static readonly DEFAULT_MAX_DEPTH = 10
  private static readonly DEFAULT_MAX_LENGTH = 1000000 // 1MB
  private static readonly DANGEROUS_KEYS = [
    '__proto__',
    'constructor',
    'prototype',
    '$where',
    '$regex',
    '$options',
    '$code'
  ]

  /**
   * Safely parse JSON with comprehensive validation
   */
  static parse<T = any>(
    input: string | object,
    options: ParseOptions = {}
  ): ParseResult<T> {
    const result: ParseResult<T> = {
      success: false,
      warnings: []
    }

    try {
      // If input is already an object, validate it
      if (typeof input === 'object' && input !== null) {
        const validated = this.validateObject(input, options)
        if (!validated.success) {
          result.error = validated.error
          return result
        }
        result.data = validated.data as T
        result.success = true
        result.sanitized = validated.sanitized
        result.warnings = validated.warnings
        return result
      }

      // Input validation
      if (typeof input !== 'string') {
        result.error = 'Input must be a string or object'
        if (options.throwOnError) {
          throw new Error(result.error)
        }
        return result
      }

      // Check length
      const maxLength = options.maxLength || this.DEFAULT_MAX_LENGTH
      if (input.length > maxLength) {
        result.error = `Input exceeds maximum length of ${maxLength} characters`
        if (options.throwOnError) {
          throw new Error(result.error)
        }
        return result
      }

      // Sanitize input before parsing
      let sanitizedInput = input
      if (options.sanitize) {
        sanitizedInput = this.sanitizeJSONString(input)
        if (sanitizedInput !== input) {
          result.warnings?.push('Input was sanitized before parsing')
          result.sanitized = true
        }
      }

      // Attempt to parse JSON
      let parsed: any
      try {
        parsed = JSON.parse(sanitizedInput)
      } catch (parseError) {
        result.error = `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
        
        // Log the error for monitoring
        logger.warn('JSON parse error', {
          error: result.error,
          inputLength: input.length,
          firstChars: input.substring(0, 100)
        })

        if (options.throwOnError) {
          throw new Error(result.error)
        }
        return result
      }

      // Validate the parsed object
      const validated = this.validateObject(parsed, options)
      if (!validated.success) {
        result.error = validated.error
        if (options.throwOnError) {
          throw new Error(result.error)
        }
        return result
      }

      // Apply schema validation if provided
      if (options.schema) {
        try {
          const schemaResult = options.schema.safeParse(validated.data)
          if (!schemaResult.success) {
            result.error = `Schema validation failed: ${schemaResult.error.message}`
            if (options.throwOnError) {
              throw new Error(result.error)
            }
            return result
          }
          result.data = schemaResult.data as T
        } catch (schemaError) {
          result.error = `Schema validation error: ${schemaError instanceof Error ? schemaError.message : 'Unknown error'}`
          if (options.throwOnError) {
            throw new Error(result.error)
          }
          return result
        }
      } else {
        result.data = validated.data as T
      }

      result.success = true
      result.sanitized = validated.sanitized || result.sanitized
      result.warnings = [...(result.warnings || []), ...(validated.warnings || [])]

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
      logger.error('Secure JSON parse error', { error: errorMessage })
      
      result.error = errorMessage
      if (options.throwOnError) {
        throw error
      }
      return result
    }
  }

  /**
   * Async version of parse for large JSON data
   */
  static async parseAsync<T = any>(
    input: string | object,
    options: ParseOptions = {}
  ): Promise<ParseResult<T>> {
    return new Promise((resolve) => {
      // Use setImmediate to prevent blocking the event loop
      setImmediate(() => {
        resolve(this.parse<T>(input, options))
      })
    })
  }

  /**
   * Safely stringify JSON with circular reference handling
   */
  static stringify(
    data: any,
    options: {
      maxDepth?: number
      pretty?: boolean
      replacer?: (key: string, value: any) => any
    } = {}
  ): string | null {
    try {
      const seen = new WeakSet()
      const maxDepth = options.maxDepth || this.DEFAULT_MAX_DEPTH
      let currentDepth = 0

      const circularReplacer = (key: string, value: any) => {
        currentDepth++
        
        if (currentDepth > maxDepth) {
          return '[Max Depth Exceeded]'
        }

        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]'
          }
          seen.add(value)
        }

        // Apply custom replacer if provided
        if (options.replacer) {
          value = options.replacer(key, value)
        }

        // Filter out dangerous keys
        if (this.DANGEROUS_KEYS.includes(key)) {
          return undefined
        }

        currentDepth--
        return value
      }

      return JSON.stringify(
        data,
        circularReplacer,
        options.pretty ? 2 : undefined
      )
    } catch (error) {
      logger.error('JSON stringify error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return null
    }
  }

  /**
   * Validate parsed object for security issues
   */
  private static validateObject(
    obj: any,
    options: ParseOptions,
    depth: number = 0
  ): ParseResult {
    const result: ParseResult = {
      success: true,
      data: obj,
      sanitized: false,
      warnings: []
    }

    const maxDepth = options.maxDepth || this.DEFAULT_MAX_DEPTH
    
    if (depth > maxDepth) {
      result.success = false
      result.error = `Object depth exceeds maximum of ${maxDepth}`
      return result
    }

    // Check allowed types
    if (options.allowedTypes) {
      const type = Array.isArray(obj) ? 'array' : typeof obj
      if (obj === null && !options.allowedTypes.includes('null')) {
        result.success = false
        result.error = 'Null values are not allowed'
        return result
      }
      if (type !== 'null' && !options.allowedTypes.includes(type as any)) {
        result.success = false
        result.error = `Type '${type}' is not allowed`
        return result
      }
    }

    // Recursively validate objects and arrays
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {}
      let hasDangerousKeys = false

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Check for dangerous keys
          if (this.DANGEROUS_KEYS.includes(key)) {
            hasDangerousKeys = true
            result.warnings?.push(`Dangerous key '${key}' was removed`)
            result.sanitized = true
            continue // Skip dangerous keys
          }

          // Check for prototype pollution attempts
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            logger.warn('Prototype pollution attempt detected', { key })
            result.warnings?.push(`Potential prototype pollution attempt with key '${key}'`)
            result.sanitized = true
            continue
          }

          // Recursively validate nested objects
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nestedResult = this.validateObject(obj[key], options, depth + 1)
            if (!nestedResult.success) {
              result.success = false
              result.error = nestedResult.error
              return result
            }
            sanitized[key] = nestedResult.data
            if (nestedResult.sanitized) {
              result.sanitized = true
            }
            if (nestedResult.warnings) {
              result.warnings = [...(result.warnings || []), ...nestedResult.warnings]
            }
          } else {
            sanitized[key] = obj[key]
          }
        }
      }

      result.data = sanitized
    }

    return result
  }

  /**
   * Sanitize JSON string before parsing
   */
  private static sanitizeJSONString(input: string): string {
    // Remove BOM if present
    let sanitized = input.replace(/^\uFEFF/, '')
    
    // Remove leading/trailing whitespace
    sanitized = sanitized.trim()
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '')
    
    // Remove control characters except for valid JSON whitespace
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    return sanitized
  }

  /**
   * Merge two JSON objects safely
   */
  static merge<T = any>(
    target: any,
    source: any,
    options: {
      maxDepth?: number
      overwrite?: boolean
    } = {}
  ): T {
    const maxDepth = options.maxDepth || this.DEFAULT_MAX_DEPTH
    const overwrite = options.overwrite !== false

    const mergeRecursive = (target: any, source: any, depth: number): any => {
      if (depth > maxDepth) {
        throw new Error(`Merge depth exceeds maximum of ${maxDepth}`)
      }

      if (typeof source !== 'object' || source === null) {
        return source
      }

      if (typeof target !== 'object' || target === null) {
        return source
      }

      const result = Array.isArray(target) ? [...target] : { ...target }

      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          // Skip dangerous keys
          if (this.DANGEROUS_KEYS.includes(key)) {
            continue
          }

          if (key in result) {
            if (overwrite) {
              if (typeof source[key] === 'object' && source[key] !== null) {
                result[key] = mergeRecursive(result[key], source[key], depth + 1)
              } else {
                result[key] = source[key]
              }
            }
          } else {
            result[key] = source[key]
          }
        }
      }

      return result
    }

    return mergeRecursive(target, source, 0)
  }
}

// Export convenience functions
export const parseJSON = <T = any>(
  input: string | object,
  options?: ParseOptions
): ParseResult<T> => SecureJSONParser.parse<T>(input, options)

export const parseJSONAsync = <T = any>(
  input: string | object,
  options?: ParseOptions
): Promise<ParseResult<T>> => SecureJSONParser.parseAsync<T>(input, options)

export const stringifyJSON = (
  data: any,
  options?: {
    maxDepth?: number
    pretty?: boolean
    replacer?: (key: string, value: any) => any
  }
): string | null => SecureJSONParser.stringify(data, options)

export const mergeJSON = <T = any>(
  target: any,
  source: any,
  options?: {
    maxDepth?: number
    overwrite?: boolean
  }
): T => SecureJSONParser.merge<T>(target, source, options)

export { SecureJSONParser }
export default SecureJSONParser