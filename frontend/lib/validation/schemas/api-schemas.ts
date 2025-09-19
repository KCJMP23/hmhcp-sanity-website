/**
 * Comprehensive Zod Schemas for API Validation
 * 
 * Provides type-safe validation schemas for all API endpoints
 * 
 * @module lib/validation/schemas/api-schemas
 */

import { z } from 'zod'

/**
 * Common validation patterns
 */
const patterns = {
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  url: z.string().url('Invalid URL format'),
  uuid: z.string().uuid('Invalid UUID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM:SS)'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters allowed'),
  base64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, 'Invalid base64 format'),
  jwt: z.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, 'Invalid JWT format'),
  ipAddress: z.string().ip('Invalid IP address'),
  hexColor: z.string().regex(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i, 'Invalid hex color'),
  percentage: z.number().min(0).max(100),
  positiveInt: z.number().int().positive(),
  safeString: z.string().regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Contains invalid characters')
}

/**
 * Healthcare-specific patterns
 */
const healthcarePatterns = {
  mrn: z.string().regex(/^MRN\d{6,10}$/, 'Invalid medical record number'),
  npi: z.string().regex(/^\d{10}$/, 'Invalid NPI number'),
  dea: z.string().regex(/^[A-Z]{2}\d{7}$/, 'Invalid DEA number'),
  icd10: z.string().regex(/^[A-Z]\d{2}(\.\d{1,4})?$/, 'Invalid ICD-10 code'),
  cpt: z.string().regex(/^\d{5}$/, 'Invalid CPT code'),
  medicare: z.string().regex(/^[A-Z]\d{9}$/, 'Invalid Medicare number'),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'])
}

/**
 * Common request/response schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc')
  }),

  // ID parameters
  idParam: z.object({
    id: patterns.uuid
  }),

  // Slug parameters
  slugParam: z.object({
    slug: patterns.slug
  }),

  // Date range
  dateRange: z.object({
    startDate: patterns.date,
    endDate: patterns.date
  }).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date'
  }),

  // File upload
  fileUpload: z.object({
    filename: z.string().max(255),
    mimetype: z.string(),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
    content: z.string().optional() // Base64 encoded
  }),

  // Success response
  successResponse: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional()
  }),

  // Error response
  errorResponse: z.object({
    error: z.string(),
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional()
  })
}

/**
 * Authentication schemas
 */
export const authSchemas = {
  // Login
  login: z.object({
    body: z.object({
      email: patterns.email,
      password: z.string().min(8).max(128),
      rememberMe: z.boolean().optional(),
      mfaCode: z.string().length(6).optional()
    })
  }),

  // Registration
  register: z.object({
    body: z.object({
      email: patterns.email,
      password: z.string()
        .min(8)
        .max(128)
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[a-z]/, 'Must contain lowercase letter')
        .regex(/[0-9]/, 'Must contain number')
        .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
      confirmPassword: z.string(),
      firstName: patterns.safeString.min(1).max(50),
      lastName: patterns.safeString.min(1).max(50),
      phone: patterns.phone.optional(),
      acceptTerms: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions'
      })
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
  }),

  // Password reset
  passwordReset: z.object({
    body: z.object({
      email: patterns.email
    })
  }),

  // Password update
  passwordUpdate: z.object({
    body: z.object({
      token: patterns.jwt,
      password: z.string().min(8).max(128),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
  }),

  // Logout
  logout: z.object({
    body: z.object({
      refreshToken: patterns.jwt.optional(),
      everywhere: z.boolean().optional()
    })
  }),

  // Refresh token
  refreshToken: z.object({
    body: z.object({
      refreshToken: patterns.jwt
    })
  }),

  // Session check
  sessionCheck: z.object({
    headers: z.object({
      authorization: z.string().regex(/^Bearer .+$/, 'Invalid authorization header')
    })
  })
}

/**
 * CMS content schemas
 */
export const cmsSchemas = {
  // Get content
  getContent: z.object({
    query: z.object({
      type: z.enum(['page', 'post', 'component']).optional(),
      slug: patterns.slug.optional(),
      status: z.enum(['published', 'draft', 'archived']).optional(),
      ...commonSchemas.pagination
    })
  }),

  // Create content
  createContent: z.object({
    body: z.object({
      type: z.enum(['page', 'post', 'component']),
      slug: patterns.slug,
      title: z.string().min(1).max(200),
      content: z.string(),
      excerpt: z.string().max(500).optional(),
      status: z.enum(['published', 'draft']),
      metadata: z.object({
        author: z.string().optional(),
        tags: z.array(z.string()).optional(),
        seo: z.object({
          title: z.string().max(60).optional(),
          description: z.string().max(160).optional(),
          keywords: z.array(z.string()).optional()
        }).optional()
      }).optional()
    })
  }),

  // Update content
  updateContent: z.object({
    params: commonSchemas.idParam,
    body: z.object({
      title: z.string().min(1).max(200).optional(),
      content: z.string().optional(),
      excerpt: z.string().max(500).optional(),
      status: z.enum(['published', 'draft', 'archived']).optional(),
      metadata: z.any().optional()
    })
  }),

  // Delete content
  deleteContent: z.object({
    params: commonSchemas.idParam
  })
}

/**
 * Blog schemas
 */
export const blogSchemas = {
  // Get posts
  getPosts: z.object({
    query: z.object({
      category: patterns.slug.optional(),
      tag: z.string().optional(),
      author: z.string().optional(),
      search: z.string().optional(),
      featured: z.boolean().optional(),
      ...commonSchemas.pagination
    })
  }),

  // Get single post
  getPost: z.object({
    params: z.union([
      commonSchemas.idParam,
      commonSchemas.slugParam
    ])
  }),

  // Create post
  createPost: z.object({
    body: z.object({
      title: z.string().min(1).max(200),
      slug: patterns.slug,
      content: z.string().min(100),
      excerpt: z.string().max(500),
      category: patterns.slug,
      tags: z.array(z.string()).max(10),
      featured: z.boolean().optional(),
      publishedAt: z.string().datetime().optional(),
      author: z.object({
        id: patterns.uuid,
        name: z.string(),
        avatar: patterns.url.optional()
      })
    })
  }),

  // Update post
  updatePost: z.object({
    params: commonSchemas.idParam,
    body: z.object({
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(100).optional(),
      excerpt: z.string().max(500).optional(),
      category: patterns.slug.optional(),
      tags: z.array(z.string()).max(10).optional(),
      featured: z.boolean().optional(),
      status: z.enum(['published', 'draft', 'archived']).optional()
    })
  })
}

/**
 * Contact form schemas
 */
export const contactSchemas = {
  // Basic contact
  basicContact: z.object({
    body: z.object({
      name: patterns.safeString.min(2).max(100),
      email: patterns.email,
      subject: patterns.safeString.min(5).max(200),
      message: z.string().min(10).max(5000),
      phone: patterns.phone.optional(),
      company: patterns.safeString.max(100).optional(),
      captcha: z.string().optional()
    })
  }),

  // Enhanced contact (with file attachment)
  enhancedContact: z.object({
    body: z.object({
      name: patterns.safeString.min(2).max(100),
      email: patterns.email,
      subject: patterns.safeString.min(5).max(200),
      message: z.string().min(10).max(5000),
      phone: patterns.phone.optional(),
      company: patterns.safeString.max(100).optional(),
      department: z.enum(['sales', 'support', 'billing', 'general']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      attachment: commonSchemas.fileUpload.optional(),
      captcha: z.string().optional()
    })
  })
}

/**
 * Healthcare platform schemas
 */
export const platformSchemas = {
  // MyBC Health signup
  mybcSignup: z.object({
    body: z.object({
      email: patterns.email,
      firstName: patterns.safeString.min(1).max(50),
      lastName: patterns.safeString.min(1).max(50),
      dateOfBirth: patterns.date,
      gender: healthcarePatterns.gender,
      phone: patterns.phone,
      address: z.object({
        street: z.string().min(1).max(200),
        city: z.string().min(1).max(100),
        state: z.string().length(2),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
        country: z.string().length(2).default('US')
      }),
      insurance: z.object({
        provider: z.string().min(1).max(100),
        policyNumber: z.string().min(1).max(50),
        groupNumber: z.string().max(50).optional()
      }).optional(),
      emergencyContact: z.object({
        name: patterns.safeString.min(1).max(100),
        relationship: z.string().min(1).max(50),
        phone: patterns.phone
      }),
      consent: z.object({
        termsAccepted: z.boolean().refine(val => val === true),
        privacyAccepted: z.boolean().refine(val => val === true),
        dataSharing: z.boolean().optional()
      })
    })
  }),

  // Early access request
  earlyAccess: z.object({
    body: z.object({
      email: patterns.email,
      name: patterns.safeString.min(2).max(100),
      organization: patterns.safeString.max(200).optional(),
      role: z.string().max(100).optional(),
      useCase: z.string().max(1000).optional(),
      referralSource: z.enum(['search', 'social', 'referral', 'other']).optional()
    })
  })
}

/**
 * Admin API schemas
 */
export const adminSchemas = {
  // User management
  getUsers: z.object({
    query: z.object({
      role: z.enum(['admin', 'editor', 'viewer']).optional(),
      status: z.enum(['active', 'inactive', 'suspended']).optional(),
      search: z.string().optional(),
      ...commonSchemas.pagination
    })
  }),

  createUser: z.object({
    body: z.object({
      email: patterns.email,
      password: z.string().min(8).max(128),
      firstName: patterns.safeString.min(1).max(50),
      lastName: patterns.safeString.min(1).max(50),
      role: z.enum(['admin', 'editor', 'viewer']),
      permissions: z.array(z.string()).optional()
    })
  }),

  updateUser: z.object({
    params: commonSchemas.idParam,
    body: z.object({
      email: patterns.email.optional(),
      firstName: patterns.safeString.min(1).max(50).optional(),
      lastName: patterns.safeString.min(1).max(50).optional(),
      role: z.enum(['admin', 'editor', 'viewer']).optional(),
      status: z.enum(['active', 'inactive', 'suspended']).optional(),
      permissions: z.array(z.string()).optional()
    })
  }),

  // Settings
  updateSettings: z.object({
    body: z.object({
      category: z.enum(['general', 'security', 'email', 'api']),
      settings: z.record(z.any())
    })
  }),

  // Analytics
  getAnalytics: z.object({
    query: z.object({
      metric: z.enum(['pageviews', 'users', 'sessions', 'conversions']),
      ...commonSchemas.dateRange,
      granularity: z.enum(['hour', 'day', 'week', 'month']).optional()
    })
  })
}

/**
 * Newsletter schemas
 */
export const newsletterSchemas = {
  subscribe: z.object({
    body: z.object({
      email: patterns.email,
      name: patterns.safeString.max(100).optional(),
      preferences: z.array(z.string()).optional(),
      source: z.string().optional()
    })
  }),

  unsubscribe: z.object({
    body: z.object({
      email: patterns.email,
      token: z.string().optional(),
      reason: z.string().max(500).optional()
    })
  }),

  updatePreferences: z.object({
    body: z.object({
      email: patterns.email,
      token: z.string(),
      preferences: z.array(z.string())
    })
  })
}

/**
 * File upload schemas
 */
export const uploadSchemas = {
  singleFile: z.object({
    body: z.object({
      file: commonSchemas.fileUpload,
      category: z.enum(['image', 'document', 'video', 'other']).optional(),
      tags: z.array(z.string()).optional()
    })
  }),

  multipleFiles: z.object({
    body: z.object({
      files: z.array(commonSchemas.fileUpload).max(10),
      category: z.enum(['image', 'document', 'video', 'other']).optional(),
      tags: z.array(z.string()).optional()
    })
  })
}

/**
 * Search schemas
 */
export const searchSchemas = {
  globalSearch: z.object({
    query: z.object({
      q: z.string().min(2).max(200),
      type: z.array(z.enum(['page', 'post', 'product', 'user'])).optional(),
      filters: z.record(z.any()).optional(),
      ...commonSchemas.pagination
    })
  })
}

/**
 * Webhook schemas
 */
export const webhookSchemas = {
  stripeWebhook: z.object({
    headers: z.object({
      'stripe-signature': z.string()
    }),
    body: z.any() // Raw body for signature verification
  }),

  githubWebhook: z.object({
    headers: z.object({
      'x-hub-signature-256': z.string()
    }),
    body: z.object({
      action: z.string(),
      repository: z.object({
        name: z.string(),
        full_name: z.string()
      }),
      sender: z.object({
        login: z.string(),
        type: z.string()
      })
    })
  })
}

/**
 * Export all schemas
 */
export const apiSchemas = {
  common: commonSchemas,
  auth: authSchemas,
  cms: cmsSchemas,
  blog: blogSchemas,
  contact: contactSchemas,
  platform: platformSchemas,
  admin: adminSchemas,
  newsletter: newsletterSchemas,
  upload: uploadSchemas,
  search: searchSchemas,
  webhook: webhookSchemas,
  healthcare: healthcarePatterns,
  patterns
}

export default apiSchemas