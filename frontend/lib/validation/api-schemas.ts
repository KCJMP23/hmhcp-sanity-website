/**
 * Zod Validation Schemas for HMHCP Website API
 * Comprehensive validation for all CRUD operations
 */

import { z } from 'zod'

// =============================================
// BASE SCHEMAS
// =============================================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

export const dateRangeSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
})

// =============================================
// CONTENT MANAGEMENT SCHEMAS
// =============================================

export const contentTypeSchema = z.enum(['page', 'post', 'media', 'navigation', 'setting'])
export const contentStatusSchema = z.enum(['draft', 'published', 'archived', 'scheduled'])
export const contentVisibilitySchema = z.enum(['public', 'private', 'password_protected'])

// Base content schema without refinement
const baseContentSchema = z.object({
  type: contentTypeSchema,
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(500, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  content: z.record(z.any()).default({}),
  excerpt: z.string().max(1000, 'Excerpt too long').optional(),
  status: contentStatusSchema.default('draft'),
  visibility: contentVisibilitySchema.default('public'),
  parent_id: uuidSchema.optional(),
  meta_title: z.string().max(60, 'Meta title too long').optional(),
  meta_description: z.string().max(160, 'Meta description too long').optional(),
  seo_keywords: z.array(z.string()).optional(),
  canonical_url: z.string().url('Invalid URL').optional(),
  metadata: z.record(z.any()).default({}),
  scheduled_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  sort_order: z.number().int().default(0),
  featured: z.boolean().default(false)
});

export const createContentSchema = baseContentSchema.refine((data) => {
  // If status is scheduled, scheduled_at must be provided and in the future
  if (data.status === 'scheduled') {
    if (!data.scheduled_at) {
      return false
    }
    const scheduledDate = new Date(data.scheduled_at)
    const now = new Date()
    return scheduledDate > now
  }
  return true
}, {
  message: 'Scheduled content must have a future scheduled_at date',
  path: ['scheduled_at']
})

export const updateContentSchema = baseContentSchema.partial().extend({
  id: uuidSchema
})

export const contentFiltersSchema = z.object({
  type: contentTypeSchema.optional(),
  status: contentStatusSchema.optional(),
  visibility: contentVisibilitySchema.optional(),
  author_id: uuidSchema.optional(),
  featured: z.boolean().optional(),
  search: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  parent_id: uuidSchema.optional()
}).merge(dateRangeSchema)

export const publishContentSchema = z.object({
  id: uuidSchema,
  publish_immediately: z.boolean().default(true),
  scheduled_at: z.string().datetime().optional()
}).refine((data) => {
  if (!data.publish_immediately && !data.scheduled_at) {
    return false
  }
  return true
}, {
  message: 'Either publish immediately or provide scheduled_at date',
  path: ['scheduled_at']
})

// =============================================
// USER MANAGEMENT SCHEMAS
// =============================================

export const userRoleSchema = z.enum(['super_admin', 'admin', 'editor', 'author'])

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  role: userRoleSchema,
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  metadata: z.record(z.any()).default({})
})

export const updateUserSchema = createUserSchema.partial().extend({
  id: uuidSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character')
    .optional()
})

export const userFiltersSchema = z.object({
  role: userRoleSchema.optional(),
  is_active: z.boolean().optional(),
  search: z.string().max(255).optional()
}).merge(dateRangeSchema)

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
})

// =============================================
// SESSION MANAGEMENT SCHEMAS
// =============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().default(false),
  device_fingerprint: z.string().optional()
})

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required')
})

export const sessionFiltersSchema = z.object({
  user_id: uuidSchema.optional(),
  is_active: z.boolean().optional(),
  ip_address: z.string().ip().optional()
}).merge(dateRangeSchema)

// =============================================
// MEDIA SCHEMAS
// =============================================

export const mediaMetadataSchema = z.object({
  alt_text: z.string().max(255).optional(),
  caption: z.string().max(1000).optional(),
  metadata: z.record(z.any()).default({})
})

export const uploadMediaSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  alt_text: z.string().max(255).optional(),
  caption: z.string().max(1000).optional(),
  metadata: z.record(z.any()).default({})
}).refine((data) => {
  // Validate file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/json'
  ]
  return allowedTypes.includes(data.file.type)
}, {
  message: 'Invalid file type',
  path: ['file']
}).refine((data) => {
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024 // 10MB
  return data.file.size <= maxSize
}, {
  message: 'File size too large (max 10MB)',
  path: ['file']
})

export const mediaFiltersSchema = z.object({
  mime_type: z.string().optional(),
  author_id: uuidSchema.optional(),
  search: z.string().max(255).optional(),
  size_min: z.number().int().positive().optional(),
  size_max: z.number().int().positive().optional()
}).merge(dateRangeSchema)

// =============================================
// SEARCH SCHEMAS
// =============================================

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(255),
  type: contentTypeSchema.optional(),
  filters: z.record(z.any()).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

// =============================================
// BULK OPERATIONS SCHEMAS
// =============================================

export const bulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'publish', 'unpublish']),
  items: z.array(z.record(z.any())).min(1, 'At least one item is required').max(100, 'Too many items'),
  options: z.record(z.any()).optional()
})

// =============================================
// AUDIT LOG SCHEMAS
// =============================================

export const severitySchema = z.enum(['debug', 'info', 'warning', 'error', 'critical'])

export const auditLogFiltersSchema = z.object({
  user_id: uuidSchema.optional(),
  action: z.string().max(100).optional(),
  resource_type: z.string().max(50).optional(),
  resource_id: uuidSchema.optional(),
  severity: severitySchema.optional(),
  ip_address: z.string().ip().optional()
}).merge(dateRangeSchema)

// =============================================
// ANALYTICS SCHEMAS
// =============================================

export const analyticsEventSchema = z.object({
  event_type: z.string().min(1).max(100),
  resource_type: z.string().min(1).max(50),
  resource_id: uuidSchema.optional(),
  properties: z.record(z.any()).default({})
})

export const analyticsQuerySchema = z.object({
  event_type: z.string().optional(),
  resource_type: z.string().optional(),
  date_from: z.string().datetime(),
  date_to: z.string().datetime(),
  group_by: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional()
})

// =============================================
// WEBHOOK SCHEMAS
// =============================================

export const webhookSubscriptionSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(32, 'Secret must be at least 32 characters').optional(),
  is_active: z.boolean().default(true)
})

// =============================================
// CITATION SCHEMAS
// =============================================

export const citationFormatSchema = z.enum(['apa', 'mla', 'chicago', 'vancouver', 'bibtex', 'ris'])

export const citationOptionsSchema = z.object({
  format: citationFormatSchema,
  includeUrl: z.boolean().optional(),
  includeAccessDate: z.boolean().optional(),
  customStyle: z.object({
    authorFormat: z.enum(['full', 'initials', 'lastname-first']).optional(),
    titleFormat: z.enum(['sentence', 'title', 'quotes']).optional(),
    dateFormat: z.enum(['year', 'full', 'iso']).optional(),
    separator: z.string().max(10).optional(),
    italicize: z.boolean().optional()
  }).optional()
})

export const singleCitationSchema = z.object({
  publicationId: uuidSchema,
  format: citationFormatSchema,
  options: citationOptionsSchema.omit({ format: true }).optional()
})

export const batchCitationSchema = z.object({
  publicationIds: z.array(uuidSchema)
    .min(1, 'At least one publication ID is required')
    .max(100, 'Cannot process more than 100 publications at once'),
  format: citationFormatSchema,
  options: citationOptionsSchema.omit({ format: true }).optional()
})

// =============================================
// VALIDATION HELPERS
// =============================================

export const validateUUID = (id: string): boolean => {
  return uuidSchema.safeParse(id).success
}

export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success
}

export const validateSlug = (slug: string): boolean => {
  return z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(slug).success
}

export const validateJSON = (data: string): boolean => {
  try {
    JSON.parse(data)
    return true
  } catch {
    return false
  }
}

// =============================================
// SCHEMA EXPORTS FOR API ROUTES
// =============================================

export const schemas = {
  // Content
  createContent: createContentSchema,
  updateContent: updateContentSchema,
  contentFilters: contentFiltersSchema,
  publishContent: publishContentSchema,
  
  // Users
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  userFilters: userFiltersSchema,
  changePassword: changePasswordSchema,
  
  // Sessions
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  sessionFilters: sessionFiltersSchema,
  
  // Media
  uploadMedia: uploadMediaSchema,
  mediaFilters: mediaFiltersSchema,
  
  // Search
  search: searchSchema,
  
  // Bulk
  bulkOperation: bulkOperationSchema,
  
  // Audit
  auditLogFilters: auditLogFiltersSchema,
  
  // Analytics
  analyticsEvent: analyticsEventSchema,
  analyticsQuery: analyticsQuerySchema,
  
  // Webhooks
  webhookSubscription: webhookSubscriptionSchema,
  
  // Citations
  citationOptions: citationOptionsSchema,
  singleCitation: singleCitationSchema,
  batchCitation: batchCitationSchema,
  
  // Common
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  uuid: uuidSchema
}

export type SchemaType<T extends keyof typeof schemas> = z.infer<typeof schemas[T]>