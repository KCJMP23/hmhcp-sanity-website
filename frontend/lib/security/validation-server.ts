// Server-side input validation and sanitization utilities
import { logger } from '@/lib/logging/client-safe-logger'

export interface ValidationRule {
  required?: boolean;
  optional?: boolean; // Inverse of required for compatibility
  type?: 'string' | 'number' | 'email' | 'url' | 'phone' | 'date' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
  allowedValues?: any[]; // For enum validation
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
}

class ServerInputValidator {
  private static instance: ServerInputValidator;
  
  static getInstance(): ServerInputValidator {
    if (!ServerInputValidator.instance) {
      ServerInputValidator.instance = new ServerInputValidator();
    }
    return ServerInputValidator.instance;
  }

  // Main validation method
  validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, any> = {};

    Object.entries(schema).forEach(([field, rule]) => {
      const value = data[field];
      const fieldErrors: string[] = [];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field} is required`);
      }

      // Skip further validation if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        sanitizedData[field] = value;
        return;
      }

      // Type validation
      if (rule.type) {
        const typeError = this.validateType(value, rule.type, field);
        if (typeError) fieldErrors.push(typeError);
      }

      // Length validation
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(`${field} must not exceed ${rule.maxLength} characters`);
        }
      }

      // Numeric range validation
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          fieldErrors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          fieldErrors.push(`${field} must not exceed ${rule.max}`);
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          fieldErrors.push(`${field} format is invalid`);
        }
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (typeof customResult === 'string') {
          fieldErrors.push(customResult);
        } else if (!customResult) {
          fieldErrors.push(`${field} is invalid`);
        }
      }

      // Sanitization
      let sanitizedValue = value;
      if (rule.sanitize && typeof value === 'string') {
        sanitizedValue = this.sanitizeString(value);
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }

      sanitizedData[field] = sanitizedValue;
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitizedData,
    };
  }

  private validateType(value: any, type: string, field: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} must be a string`;
        }
        break;
      
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} must be a valid number`;
        }
        break;
      
      case 'email':
        if (!this.isValidEmail(value)) {
          return `${field} must be a valid email address`;
        }
        break;
      
      case 'url':
        if (!this.isValidURL(value)) {
          return `${field} must be a valid URL`;
        }
        break;
      
      case 'phone':
        if (!this.isValidPhone(value)) {
          return `${field} must be a valid phone number`;
        }
        break;
      
      case 'date':
        if (!this.isValidDate(value)) {
          return `${field} must be a valid date`;
        }
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field} must be a boolean`;
        }
        break;
      
      case 'array':
        if (!Array.isArray(value)) {
          return `${field} must be an array`;
        }
        break;
      
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return `${field} must be an object`;
        }
        break;
    }
    
    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }

  private isValidDate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  // String sanitization
  sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[char] || char;
      });
  }

  // HTML sanitization
  sanitizeHTML(html: string): string {
    // Remove script tags and their content
    html = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    
    // Remove dangerous event handlers
    html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: protocol
    html = html.replace(/javascript:/gi, '');
    
    // Remove data: URLs (except images)
    html = html.replace(/data:(?!image\/)(.*?)["'\s>]/gi, '');
    
    // Remove dangerous tags
    const dangerousTags = ['iframe', 'object', 'embed', 'link', 'meta', 'style'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<\/?${tag}[^>]*>`, 'gi');
      html = html.replace(regex, '');
    });
    
    return html;
  }

  // SQL injection prevention
  sanitizeSQL(input: string): string {
    // Remove SQL keywords and dangerous characters
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'EXEC', 'EXECUTE', 'UNION', 'JOIN', 'WHERE', 'OR', 'AND', '--', ';'
    ];
    
    let sanitized = input;
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[';"\-\-\/\*\*\/]/g, '');
    
    return sanitized.trim();
  }

  // Path traversal prevention
  sanitizePath(path: string): string {
    return path
      .replace(/\.\./g, '') // Remove ../ patterns
      .replace(/[^a-zA-Z0-9\-_\/\.]/g, '') // Allow only safe characters
      .replace(/\/+/g, '/') // Normalize multiple slashes
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+$/, ''); // Remove trailing slashes
  }
}

// Common validation schemas
export const API_VALIDATION_SCHEMAS = {
  // Newsletter subscription
  newsletterSubscribe: {
    email: {
      required: true,
      type: 'email' as const,
      maxLength: 254,
    },
    name: {
      required: false,
      type: 'string' as const,
      maxLength: 100,
      sanitize: true,
    },
    interests: {
      required: false,
      type: 'array' as const,
      custom: (value: any) => {
        if (!Array.isArray(value)) return 'Interests must be an array';
        if (value.length > 10) return 'Maximum 10 interests allowed';
        return value.every((item: any) => typeof item === 'string' && item.length <= 50) || 'Invalid interest format';
      },
    },
  } as ValidationSchema,

  // Contact form validation
  contactForm: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 100,
      sanitize: true,
    },
    email: {
      required: true,
      type: 'email' as const,
      maxLength: 254,
    },
    phone: {
      required: false,
      type: 'phone' as const,
    },
    organization: {
      required: false,
      type: 'string' as const,
      maxLength: 100,
      sanitize: true,
    },
    subject: {
      required: true,
      type: 'string' as const,
      minLength: 5,
      maxLength: 200,
      sanitize: true,
    },
    message: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 5000,
      sanitize: true,
    },
    source_page: {
      required: false,
      type: 'string' as const,
      maxLength: 200,
      sanitize: true,
    },
  } as ValidationSchema,

  // User update validation
  userUpdate: {
    email: {
      required: false,
      type: 'email' as const,
      maxLength: 254,
    },
    firstName: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true,
    },
    lastName: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true,
    },
    role: {
      required: false,
      type: 'string' as const,
      custom: (value: any) => {
        const validRoles = ['super_admin', 'admin', 'editor', 'author', 'contributor', 'viewer'];
        return validRoles.includes(value) || 'Invalid role';
      },
    },
    isActive: {
      required: false,
      type: 'boolean' as const,
    },
  } as ValidationSchema,

  // User creation validation
  userCreate: {
    email: {
      required: true,
      type: 'email' as const,
      maxLength: 254,
    },
    firstName: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true,
    },
    lastName: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true,
    },
    role: {
      required: false,
      type: 'string' as const,
      default: 'viewer',
      custom: (value: any) => {
        const validRoles = ['super_admin', 'admin', 'editor', 'author', 'contributor', 'viewer'];
        return validRoles.includes(value) || 'Invalid role';
      },
    },
    password: {
      required: true,
      type: 'string' as const,
      minLength: 6,
      maxLength: 128,
    },
  } as ValidationSchema,

  // Content creation/update
  contentManagement: {
    title: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 200,
      sanitize: true,
    },
    slug: {
      required: false,
      type: 'string' as const,
      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      maxLength: 200,
    },
    content: {
      required: false,
      type: 'object' as const,
    },
    status: {
      required: false,
      type: 'string' as const,
      custom: (value: any) => {
        const validStatuses = ['draft', 'published', 'archived'];
        return validStatuses.includes(value) || 'Invalid status';
      },
    },
    type: {
      required: true,
      type: 'string' as const,
      maxLength: 50,
    },
  } as ValidationSchema,

  // SEO analysis
  seoAnalysis: {
    content_id: {
      required: true,
      type: 'string' as const,
      maxLength: 100,
    },
  } as ValidationSchema,

  // Research data (trials, publications, qa-qi)
  researchData: {
    title: {
      required: true,
      type: 'string' as const,
      minLength: 5,
      maxLength: 500,
      sanitize: true,
    },
    description: {
      required: false,
      type: 'string' as const,
      maxLength: 5000,
      sanitize: true,
    },
    status: {
      required: false,
      type: 'string' as const,
      maxLength: 50,
    },
    start_date: {
      required: false,
      type: 'date' as const,
    },
    end_date: {
      required: false,
      type: 'date' as const,
    },
  } as ValidationSchema,

  // Webhook configuration
  webhookConfig: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 3,
      maxLength: 100,
      sanitize: true,
    },
    url: {
      required: true,
      type: 'url' as const,
    },
    events: {
      required: true,
      type: 'array' as const,
      custom: (value: any) => {
        if (!Array.isArray(value) || value.length === 0) return 'At least one event is required';
        return true;
      },
    },
    headers: {
      required: false,
      type: 'object' as const,
    },
    active: {
      required: false,
      type: 'boolean' as const,
    },
  } as ValidationSchema,
};

// Singleton instance
export const serverValidator = ServerInputValidator.getInstance();

// Middleware validation helper
export function validateRequestBody(schema: ValidationSchema) {
  return async (body: Record<string, any>): Promise<ValidationResult> => {
    try {
      const result = serverValidator.validate(body, schema);
      
      if (!result.valid) {
        logger.warn('Request validation failed', {
          errors: result.errors,
          endpoint: 'unknown', // This should be passed in context
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return {
        valid: false,
        errors: { general: ['Validation error occurred'] },
        sanitizedData: {},
      };
    }
  };
}

// Helper to create custom validators
export function createValidator(schema: ValidationSchema) {
  return (data: Record<string, any>): ValidationResult => {
    return serverValidator.validate(data, schema);
  };
}

// Enhanced validation function that handles type conversion
export function validateInput(
  data: Record<string, any>,
  schema: ValidationSchema | Record<string, any>
): { isValid: boolean; errors: Record<string, string[]>; sanitized: Record<string, any> } {
  // Normalize schema to handle both formats
  const normalizedSchema: ValidationSchema = {};
  
  Object.entries(schema).forEach(([key, rule]) => {
    normalizedSchema[key] = {
      ...rule,
      // Convert 'optional' to 'required' for consistency
      required: rule.required !== undefined ? rule.required : !rule.optional
    };
  });
  
  // Convert string values to appropriate types based on schema
  const convertedData: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const rule = normalizedSchema[key];
    if (!rule) {
      convertedData[key] = value;
      return;
    }
    
    // Handle type conversion for string inputs
    if (rule.type === 'number' && typeof value === 'string') {
      // Convert string to number for number fields
      const num = Number(value);
      convertedData[key] = isNaN(num) ? value : num;
    } else if (rule.type === 'boolean' && typeof value === 'string') {
      // Convert string to boolean
      convertedData[key] = value === 'true' || value === '1';
    } else {
      convertedData[key] = value;
    }
  });
  
  // Add custom validation for allowedValues
  Object.entries(normalizedSchema).forEach(([key, rule]) => {
    if (rule.allowedValues && !rule.custom) {
      rule.custom = (value: any) => {
        if (rule.allowedValues!.includes(value)) {
          return true;
        }
        return `${key} must be one of: ${rule.allowedValues!.join(', ')}`;
      };
    }
  });
  
  // Now validate with converted data
  const result = serverValidator.validate(convertedData, normalizedSchema);
  
  // Return in the expected format
  return {
    isValid: result.valid,
    errors: result.errors,
    sanitized: result.sanitizedData
  };
}

// Legacy alias for backward compatibility  
export const validateInputLegacy = serverValidator.validate.bind(serverValidator);