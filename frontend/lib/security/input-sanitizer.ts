import { z } from 'zod';
import validator from 'validator';

export class InputSanitizer {
  // HTML sanitization for rich text content
  // Note: DOMPurify cannot be used in Edge Runtime (middleware)
  // For middleware, use sanitizeText instead
  static sanitizeHTML(html: string, options: {
    allowedTags?: string[];
    allowedAttributes?: string[];
    stripTags?: boolean;
  } = {}): string {
    // In Edge Runtime, fall back to basic sanitization
    if (typeof window === 'undefined') {
      return this.sanitizeText(html);
    }

    // Dynamic import for client/server-side usage
    const DOMPurify = require('isomorphic-dompurify');
    
    const {
      allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'a'],
      allowedAttributes = ['href', 'target', 'rel', 'class'],
      stripTags = false
    } = options;

    if (stripTags) {
      return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
    }

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
    });
  }

  // XSS prevention for user input
  static sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';
    
    return text
      .replace(/[<>"'&]/g, (match) => {
        const map: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return map[match] || match;
      })
      .trim();
  }

  // SQL injection prevention for identifiers
  static escapeSQLIdentifier(identifier: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error('Invalid SQL identifier format');
    }
    return identifier;
  }

  // Email validation and sanitization
  static sanitizeEmail(email: string): string {
    const sanitized = validator.normalizeEmail(email) || '';
    if (!validator.isEmail(sanitized)) {
      throw new Error('Invalid email format');
    }
    return sanitized;
  }

  // URL validation and sanitization
  static sanitizeURL(url: string, allowedProtocols: string[] = ['http', 'https']): string {
    if (!validator.isURL(url, { protocols: allowedProtocols })) {
      throw new Error('Invalid URL format');
    }
    return url;
  }

  // Phone number sanitization
  static sanitizePhone(phone: string): string {
    const cleaned = phone.replace(/[^\d+\-\s()]/g, '');
    if (!validator.isMobilePhone(cleaned, 'any', { strictMode: false })) {
      throw new Error('Invalid phone number format');
    }
    return cleaned;
  }

  // File upload validation
  static validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
    scanForMalware?: boolean;
  } = {}): void {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      scanForMalware = true
    } = options;

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // Check MIME type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension || '')) {
      throw new Error(`File extension .${extension} is not allowed`);
    }

    // Check for double extensions (security risk)
    const nameParts = file.name.split('.');
    if (nameParts.length > 2) {
      throw new Error('Files with multiple extensions are not allowed');
    }

    // Check for executable file types
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'sh'];
    if (dangerousExtensions.includes(extension || '')) {
      throw new Error('Executable files are not allowed');
    }

    // Basic malware scan (check for suspicious patterns)
    if (scanForMalware) {
      this.basicMalwareScan(file);
    }
  }

  // Basic malware detection patterns
  private static basicMalwareScan(file: File): void {
    const suspiciousPatterns = [
      /eval\s*\(/i,
      /document\.write/i,
      /innerHTML\s*=/i,
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
    ];

    // Note: This is a basic check. In production, use proper malware scanning services
    const fileName = file.name.toLowerCase();
    const suspiciousNames = ['autorun.inf', 'desktop.ini', 'thumbs.db'];
    
    if (suspiciousNames.includes(fileName)) {
      throw new Error('Suspicious file detected');
    }
  }

  // JSON payload validation
  static validateJSON(data: unknown, maxDepth: number = 10, maxKeys: number = 100): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const validate = (obj: any, depth: number): any => {
      if (depth > maxDepth) {
        throw new Error('JSON object too deeply nested');
      }

      if (Array.isArray(obj)) {
        if (obj.length > maxKeys) {
          throw new Error('Array too large');
        }
        return obj.map(item => validate(item, depth + 1));
      }

      if (typeof obj === 'object' && obj !== null) {
        const keys = Object.keys(obj);
        if (keys.length > maxKeys) {
          throw new Error('Object has too many keys');
        }

        const result: any = {};
        for (const key of keys) {
          const sanitizedKey = this.sanitizeText(key);
          result[sanitizedKey] = validate(obj[key], depth + 1);
        }
        return result;
      }

      return obj;
    };

    return validate(data, 0);
  }

  // API payload validation with Zod
  static createValidator<T>(schema: z.ZodSchema<T>) {
    return (data: unknown): T => {
      try {
        // Sanitize JSON structure first
        const sanitizedData = this.validateJSON(data);
        
        // Then validate with schema
        return schema.parse(sanitizedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          throw new Error(`Validation failed: ${errorDetails}`);
        }
        throw error;
      }
    };
  }

  // Content Security Policy nonce generation
  static generateCSPNonce(): string {
    // Edge Runtime doesn't support Node.js crypto module
    // Use Web Crypto API instead
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return btoa(String.fromCharCode(...array));
    }
    // Fallback for environments without crypto
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Rate limiting key generation
  static generateRateLimitKey(ip: string, endpoint: string, userId?: string): string {
    const parts = [ip, endpoint];
    if (userId) parts.push(userId);
    return parts.join(':');
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password must be at least 8 characters long');

    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password must contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password must contain uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Password must contain numbers');

    if (/[^\w\s]/.test(password)) score += 1;
    else feedback.push('Password must contain special characters');

    // Common patterns check
    const commonPatterns = ['123456', 'password', 'qwerty', 'admin'];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      score -= 2;
      feedback.push('Password contains common patterns');
    }

    return {
      isValid: score >= 4 && feedback.length === 0,
      score: Math.max(0, Math.min(5, score)),
      feedback
    };
  }

  // Sanitize database query parameters
  static sanitizeQueryParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      const sanitizedKey = this.escapeSQLIdentifier(key);
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeText(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (value === null || value === undefined) {
        sanitized[sanitizedKey] = value;
      } else {
        // For complex types, convert to string and sanitize
        sanitized[sanitizedKey] = this.sanitizeText(String(value));
      }
    }
    
    return sanitized;
  }
}

// Export commonly used validators
export const emailValidator = InputSanitizer.createValidator(z.string().email());
export const urlValidator = InputSanitizer.createValidator(z.string().url());
export const phoneValidator = InputSanitizer.createValidator(z.string().min(10));

// Common schemas
export const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1).max(5000),
  company: z.string().max(100).optional(),
});

export const userRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['viewer', 'contributor', 'author', 'editor', 'super_admin']).optional(),
});
