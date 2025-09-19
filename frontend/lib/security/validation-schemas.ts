import { z } from 'zod'

/**
 * Common validation schemas
 */

// Email validation with additional security checks
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(3, 'Email too short')
  .max(254, 'Email too long') // RFC 5321
  .toLowerCase()
  .trim()
  .refine(
    (email) => !email.includes('..'),
    'Invalid email format'
  )
  .refine(
    (email) => !email.startsWith('.') && !email.endsWith('.'),
    'Invalid email format'
  )

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    'Password must contain at least one special character'
  )

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )

// Phone number validation
export const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    'Invalid phone number format'
  )
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long')

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine(
    (url) => {
      try {
        const u = new URL(url)
        return ['http:', 'https:'].includes(u.protocol)
      } catch {
        return false
      }
    },
    'URL must use HTTP or HTTPS protocol'
  )

// UUID validation
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')

// Safe text input (prevents XSS)
export const safeTextSchema = z
  .string()
  .trim()
  .min(1, 'Text cannot be empty')
  .max(10000, 'Text too long')
  .transform((text) => {
    // Basic HTML entity encoding
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  })

// File upload validation
export const fileUploadSchema = z.object({
  name: z.string().max(255),
  type: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
}).refine(
  (file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    return allowedTypes.includes(file.type)
  },
  'File type not allowed'
)

/**
 * API Endpoint Schemas
 */

// Login request validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().optional()
})

// Registration request validation
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
  captchaToken: z.string().optional()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
)

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
  captchaToken: z.string().optional()
})

// Password reset confirmation
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
)

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(1).max(200),
  message: z.string().trim().min(10).max(5000).transform((text) => {
    // Basic HTML entity encoding
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }),
  captchaToken: z.string().optional()
})

// Blog post creation/update
export const blogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1).max(100000),
  excerpt: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10).optional(),
  categoryId: uuidSchema.optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  featuredImage: urlSchema.optional()
})

// User profile update
export const userProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: urlSchema.optional(),
  phone: phoneSchema.optional(),
  timezone: z.string().optional(),
  language: z.enum(['en', 'es', 'fr', 'de']).optional()
})

// API key creation
export const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1).max(20),
  expiresAt: z.string().datetime().optional()
})

// Search query validation
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'date', 'title']).default('relevance'),
  order: z.enum(['asc', 'desc']).default('desc'),
  filters: z.record(z.string()).optional()
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
})

// ID parameter validation
export const idParamSchema = z.object({
  id: uuidSchema
})

// Slug parameter validation
export const slugParamSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/)
})

/**
 * Validation middleware helper
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}

/**
 * Sanitization helpers
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .substring(0, 255)
}

export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(u.protocol)) {
      throw new Error('Invalid protocol')
    }
    return u.toString()
  } catch {
    return ''
  }
}