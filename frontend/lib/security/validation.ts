'use client';

// Input validation and sanitization utilities
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'phone' | 'date' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
}

class InputValidator {
  private static instance: InputValidator;
  
  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
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

  // File upload validation
  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): ValidationResult {
    const errors: Record<string, string[]> = {};
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

    // Size validation
    if (file.size > maxSize) {
      errors.size = [`File size must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`];
    }

    // Type validation
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.type = [`File type ${file.type} is not allowed`];
    }

    // Extension validation
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.extension = [`File extension is not allowed`];
      }
    }

    // Filename validation
    const sanitizedName = this.sanitizePath(file.name);
    if (sanitizedName !== file.name) {
      errors.filename = ['Filename contains invalid characters'];
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: {
        name: sanitizedName,
        size: file.size,
        type: file.type,
      },
    };
  }
}

// Common validation schemas
export const VALIDATION_SCHEMAS = {
  // Contact form validation
  contactForm: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
      sanitize: true,
    },
    email: {
      required: true,
      type: 'email',
      maxLength: 254,
    },
    phone: {
      required: false,
      type: 'phone',
    },
    message: {
      required: true,
      type: 'string',
      minLength: 10,
      maxLength: 1000,
      sanitize: true,
    },
    company: {
      required: false,
      type: 'string',
      maxLength: 100,
      sanitize: true,
    },
  } as ValidationSchema,

  // User registration validation
  userRegistration: {
    email: {
      required: true,
      type: 'email',
      maxLength: 254,
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain number';
        if (!/(?=.*[@$!%*?&])/.test(value)) return 'Password must contain special character';
        return true;
      },
    },
    firstName: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 50,
      sanitize: true,
    },
    lastName: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 50,
      sanitize: true,
    },
  } as ValidationSchema,

  // Blog post validation
  blogPost: {
    title: {
      required: true,
      type: 'string',
      minLength: 5,
      maxLength: 200,
      sanitize: true,
    },
    content: {
      required: true,
      type: 'string',
      minLength: 100,
      maxLength: 50000,
    },
    excerpt: {
      required: false,
      type: 'string',
      maxLength: 500,
      sanitize: true,
    },
    tags: {
      required: false,
      type: 'array',
      custom: (value: string[]) => {
        return Array.isArray(value) && value.every(tag => typeof tag === 'string' && tag.length <= 50);
      },
    },
    published: {
      required: false,
      type: 'boolean',
    },
  } as ValidationSchema,
};

// Singleton instance
export const inputValidator = InputValidator.getInstance();

// React hook for validation
export function useValidation() {
  return {
    validate: inputValidator.validate.bind(inputValidator),
    sanitizeString: inputValidator.sanitizeString.bind(inputValidator),
    sanitizeHTML: inputValidator.sanitizeHTML.bind(inputValidator),
    sanitizeSQL: inputValidator.sanitizeSQL.bind(inputValidator),
    sanitizePath: inputValidator.sanitizePath.bind(inputValidator),
    validateFile: inputValidator.validateFile.bind(inputValidator),
  };
}

// Middleware validation helper
export function validateRequestBody(schema: ValidationSchema) {
  return (data: Record<string, any>): ValidationResult => {
    return inputValidator.validate(data, schema);
  };
}

// File upload validation helper
export function createFileValidator(options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}) {
  return (file: File): ValidationResult => {
    return inputValidator.validateFile(file, options);
  };
}