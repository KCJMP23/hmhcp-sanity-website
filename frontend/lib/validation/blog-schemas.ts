/**
 * Validation schemas for blog automation system
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod'

// Constants for validation
const MAX_TITLE_LENGTH = 200
const MAX_INSTRUCTIONS_LENGTH = 1000
const MAX_KEYWORD_LENGTH = 50
const MAX_KEYWORDS = 10
const MAX_CONTENT_LENGTH = 50000
const ALLOWED_TONES = ['professional', 'engaging', 'analytical', 'authoritative', 'empathetic'] as const
const ALLOWED_CATEGORIES = [
  'digital-health',
  'patient-engagement', 
  'quality-improvement',
  'compliance',
  'workforce',
  'leadership',
  'innovation',
  'operations'
] as const

/**
 * Blog topic validation schema
 */
export const BlogTopicSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(MAX_TITLE_LENGTH, `Title must be less than ${MAX_TITLE_LENGTH} characters`)
    .trim()
    .refine(
      (val) => !/<[^>]*>/g.test(val),
      'Title cannot contain HTML tags'
    ),
  
  instructions: z
    .string()
    .max(MAX_INSTRUCTIONS_LENGTH, `Instructions must be less than ${MAX_INSTRUCTIONS_LENGTH} characters`)
    .optional()
    .transform((val) => val?.trim()),
  
  tone: z
    .enum(ALLOWED_TONES)
    .default('professional'),
  
  priority: z
    .number()
    .int('Priority must be an integer')
    .min(1, 'Priority must be at least 1')
    .max(5, 'Priority must be at most 5')
    .default(3),
  
  category: z
    .enum(ALLOWED_CATEGORIES),
  
  targetKeywords: z
    .array(
      z
        .string()
        .max(MAX_KEYWORD_LENGTH, `Each keyword must be less than ${MAX_KEYWORD_LENGTH} characters`)
        .trim()
        .refine(
          (val) => /^[a-zA-Z0-9\s-]+$/.test(val),
          'Keywords can only contain alphanumeric characters, spaces, and hyphens'
        )
    )
    .max(MAX_KEYWORDS, `Maximum ${MAX_KEYWORDS} keywords allowed`)
    .default([])
})

/**
 * Blog content validation schema
 */
export const BlogContentSchema = z.object({
  content: z
    .string()
    .min(500, 'Content must be at least 500 characters')
    .max(MAX_CONTENT_LENGTH, `Content must be less than ${MAX_CONTENT_LENGTH} characters`)
    .refine(
      (val) => !/<script[^>]*>.*?<\/script>/gi.test(val),
      'Content cannot contain script tags'
    ),
  
  excerpt: z
    .string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional(),
  
  seoTitle: z
    .string()
    .max(60, 'SEO title must be less than 60 characters')
    .optional(),
  
  seoDescription: z
    .string()
    .max(160, 'SEO description must be less than 160 characters')
    .optional(),
  
  keywords: z
    .array(z.string().max(MAX_KEYWORD_LENGTH))
    .max(20)
    .optional(),
  
  tags: z
    .array(z.string().max(30))
    .max(15)
    .optional()
})

/**
 * Schedule configuration schema
 */
export const ScheduleConfigSchema = z.object({
  enabled: z.boolean(),
  
  frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  
  timezone: z
    .string()
    .default('UTC'),
  
  maxPostsPerRun: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(1)
})

/**
 * API action validation schemas
 */
export const SchedulerActionSchema = z.enum(['start', 'stop', 'run_now', 'status'])

export const GenerationRequestSchema = z.object({
  topicId: z
    .string()
    .uuid('Invalid topic ID format'),
  
  options: z
    .object({
      skipImages: z.boolean().optional(),
      skipReferences: z.boolean().optional(),
      customPrompt: z.string().max(500).optional()
    })
    .optional()
})

/**
 * Prompt injection detection
 */
export function detectPromptInjection(text: string): {
  safe: boolean
  risks: string[]
} {
  const risks: string[] = []
  
  // Common injection patterns
  const injectionPatterns = [
    { pattern: /ignore\s+(previous|all|above)/i, risk: 'Instruction override attempt' },
    { pattern: /forget\s+(everything|instructions)/i, risk: 'Memory reset attempt' },
    { pattern: /\bsystem\s*:\s*/i, risk: 'System prompt injection' },
    { pattern: /\bdo\s+not\s+follow/i, risk: 'Instruction negation' },
    { pattern: /\binstead\s+(do|write|say)/i, risk: 'Task redirection' },
    { pattern: /\bpretend\s+(you|to\s+be)/i, risk: 'Role manipulation' },
    { pattern: /\b(reveal|show|display)\s+(prompt|instructions|system)/i, risk: 'Information disclosure attempt' },
    { pattern: /\b(execute|run|eval)\s*\(/i, risk: 'Code execution attempt' },
    { pattern: /<script|<iframe|javascript:/i, risk: 'XSS attempt' },
    { pattern: /\b(drop|delete|truncate)\s+(table|database)/i, risk: 'SQL injection attempt' }
  ]
  
  for (const { pattern, risk } of injectionPatterns) {
    if (pattern.test(text)) {
      risks.push(risk)
    }
  }
  
  return {
    safe: risks.length === 0,
    risks
  }
}

/**
 * Validate and sanitize blog topic
 */
export function validateBlogTopic(data: unknown): {
  valid: boolean
  data?: z.infer<typeof BlogTopicSchema>
  errors?: z.ZodError
  securityRisks?: string[]
} {
  try {
    // Validate schema
    const validated = BlogTopicSchema.parse(data)
    
    // Check for prompt injection in title and instructions
    const titleCheck = detectPromptInjection(validated.title)
    const instructionsCheck = validated.instructions 
      ? detectPromptInjection(validated.instructions)
      : { safe: true, risks: [] }
    
    const allRisks = [...titleCheck.risks, ...instructionsCheck.risks]
    
    if (allRisks.length > 0) {
      return {
        valid: false,
        securityRisks: allRisks
      }
    }
    
    return {
      valid: true,
      data: validated
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error
      }
    }
    throw error
  }
}

/**
 * Validate generated content for compliance
 */
export function validateGeneratedContent(content: string): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check content length
  if (content.length < 500) {
    issues.push('Content is too short (minimum 500 characters)')
  }
  
  if (content.length > MAX_CONTENT_LENGTH) {
    issues.push(`Content is too long (maximum ${MAX_CONTENT_LENGTH} characters)`)
  }
  
  // Check for prohibited content
  const prohibitedPatterns = [
    { pattern: /<script/i, issue: 'Script tags are not allowed' },
    { pattern: /<iframe/i, issue: 'Iframe tags are not allowed' },
    { pattern: /on\w+\s*=/i, issue: 'Inline event handlers are not allowed' },
    { pattern: /javascript:/i, issue: 'JavaScript protocols are not allowed' }
  ]
  
  for (const { pattern, issue } of prohibitedPatterns) {
    if (pattern.test(content)) {
      issues.push(issue)
    }
  }
  
  // Check for potential PHI (simplified)
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(content)) {
    issues.push('Content may contain SSN')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Sanitize content for safe storage and display
 */
export function sanitizeContent(content: string): string {
  // Remove script tags
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // Remove event handlers
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/\s(style|class)\s*=\s*["'][^"']*["']/gi, '')
  
  return sanitized.trim()
}

/**
 * Webhook payload schemas
 */
export const MakeComWebhookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().optional().default('HMHCP Team'),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  external_id: z.string().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  social: z.object({
    instagram: z.object({
      post: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      image: z.string().optional()
    }).optional(),
    facebook: z.object({
      post: z.string().optional(),
      image: z.string().optional()
    }).optional(),
    twitter: z.object({
      post: z.string().optional(),
      thread: z.array(z.string()).optional(),
      image: z.string().optional()
    }).optional(),
    linkedin: z.object({
      post: z.string().optional(),
      image: z.string().optional()
    }).optional()
  }).optional(),
  aiGenerated: z.boolean().optional().default(true),
  researchData: z.object({
    perplexityAnalysis: z.string().optional(),
    youtubeResearch: z.array(z.any()).optional(),
    seoAnalysis: z.any().optional()
  }).optional()
})

export const ZapierWebhookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  author_name: z.string().optional().default('HMHCP Team'),
  category: z.string().optional(),
  tags: z.string().optional().transform((val) => 
    val ? val.split(',').map((tag) => tag.trim()) : []
  ),
  publish: z.boolean().optional().default(false),
  external_id: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  featured_image: z.string().optional()
})

/**
 * Generic webhook payload schema (flexible)
 */
export const GenericWebhookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform((val) => val.split(',').map((tag) => tag.trim()))
  ]).optional(),
  external_id: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

/**
 * Validate webhook payload based on source
 */
export function validateWebhookPayload(
  payload: unknown,
  source: 'make.com' | 'zapier' | 'generic'
): {
  valid: boolean
  data?: any
  errors?: z.ZodError
  securityRisks?: string[]
} {
  try {
    let schema: z.ZodSchema
    let validated: any
    
    // Select appropriate schema
    switch (source) {
      case 'make.com':
        schema = MakeComWebhookSchema
        break
      case 'zapier':
        schema = ZapierWebhookSchema
        break
      default:
        schema = GenericWebhookSchema
    }
    
    // Validate against schema
    validated = schema.parse(payload)
    
    // Check for security risks in content
    const contentToCheck = validated.content || validated.body || ''
    const titleToCheck = validated.title || ''
    
    const contentCheck = detectPromptInjection(contentToCheck)
    const titleCheck = detectPromptInjection(titleToCheck)
    
    const allRisks = [...contentCheck.risks, ...titleCheck.risks]
    
    if (allRisks.length > 0) {
      return {
        valid: false,
        securityRisks: allRisks
      }
    }
    
    // Transform data for consistent format
    if (source === 'zapier') {
      validated = {
        title: validated.title,
        content: validated.body,
        author: validated.author_name,
        status: validated.publish ? 'published' : 'draft',
        tags: validated.tags,
        external_id: validated.external_id,
        seo_title: validated.meta_title,
        seo_description: validated.meta_description,
        featured_image: validated.featured_image
      }
    }
    
    return {
      valid: true,
      data: validated
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error
      }
    }
    throw error
  }
}

export default {
  BlogTopicSchema,
  BlogContentSchema,
  ScheduleConfigSchema,
  SchedulerActionSchema,
  GenerationRequestSchema,
  MakeComWebhookSchema,
  ZapierWebhookSchema,
  GenericWebhookSchema,
  detectPromptInjection,
  validateBlogTopic,
  validateGeneratedContent,
  validateWebhookPayload,
  sanitizeContent
}