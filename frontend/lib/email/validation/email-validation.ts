// Email Input Validation Utilities
// Created: 2025-01-27
// Purpose: Strengthen input validation on email API endpoints

import { z } from 'zod'

// Email validation schemas
export const EmailTemplateValidationSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(255, 'Template name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Template name contains invalid characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.enum(['newsletter', 'appointment', 'reminder', 'followup', 'marketing'], {
    errorMap: () => ({ message: 'Invalid template category' })
  }),
  
  template_definition: z.object({
    html: z.string().min(1, 'HTML content is required'),
    text: z.string().optional(),
    subject: z.string().min(1, 'Subject line is required').max(255, 'Subject too long')
  }),
  
  healthcare_compliance: z.object({
    hipaa_compliant: z.boolean(),
    can_spam_compliant: z.boolean(),
    gdpr_compliant: z.boolean(),
    fda_compliant: z.boolean()
  }).optional()
})

export const EmailCampaignValidationSchema = z.object({
  name: z.string()
    .min(1, 'Campaign name is required')
    .max(255, 'Campaign name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Campaign name contains invalid characters'),
  
  subject: z.string()
    .min(1, 'Subject line is required')
    .max(255, 'Subject line must be less than 255 characters'),
  
  from_name: z.string()
    .min(1, 'From name is required')
    .max(100, 'From name must be less than 100 characters'),
  
  from_email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  
  template_id: z.string().uuid('Invalid template ID'),
  segment_id: z.string().uuid('Invalid segment ID'),
  
  content: z.string().min(1, 'Email content is required'),
  
  schedule: z.enum(['immediate', 'scheduled']),
  scheduled_at: z.string().datetime().optional(),
  
  ab_testing: z.object({
    enabled: z.boolean(),
    test_name: z.string().optional(),
    test_percentage: z.number().min(1).max(100).optional(),
    variant_subject: z.string().optional()
  }).optional()
})

export const EmailContactValidationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
  
  profession: z.enum(['doctor', 'nurse', 'therapist', 'administrator', 'patient', 'other']),
  
  specialty: z.string()
    .max(100, 'Specialty must be less than 100 characters')
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  
  healthcare_facility: z.string()
    .max(255, 'Healthcare facility name must be less than 255 characters')
    .optional(),
  
  consent_status: z.enum(['granted', 'denied', 'pending', 'expired']),
  consent_date: z.string().datetime().optional(),
  consent_expiry: z.string().datetime().optional()
})

export const EmailSegmentValidationSchema = z.object({
  name: z.string()
    .min(1, 'Segment name is required')
    .max(255, 'Segment name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Segment name contains invalid characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  criteria: z.object({
    profession: z.string().optional(),
    specialty: z.string().optional(),
    healthcare_facility: z.string().optional(),
    engagement_level: z.enum(['high', 'medium', 'low']).optional(),
    last_contact_date: z.object({
      operator: z.enum(['before', 'after', 'between']),
      value: z.string().datetime()
    }).optional(),
    custom_fields: z.record(z.any()).optional()
  }),
  
  healthcare_type: z.enum(['professional', 'patient', 'mixed']).optional()
})

// Validation helper functions
export function validateEmailTemplate(data: unknown) {
  return EmailTemplateValidationSchema.parse(data)
}

export function validateEmailCampaign(data: unknown) {
  return EmailCampaignValidationSchema.parse(data)
}

export function validateEmailContact(data: unknown) {
  return EmailContactValidationSchema.parse(data)
}

export function validateEmailSegment(data: unknown) {
  return EmailSegmentValidationSchema.parse(data)
}

// Sanitization functions
export function sanitizeEmailContent(content: string): string {
  // Remove potentially dangerous HTML tags
  const dangerousTags = ['script', 'object', 'embed', 'iframe', 'form', 'input']
  let sanitized = content
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi')
    sanitized = sanitized.replace(regex, '')
  })
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  return sanitized
}

export function sanitizeEmailSubject(subject: string): string {
  // Remove potentially dangerous characters
  return subject
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, 255)
}

// Healthcare-specific validation
export function validateHealthcareCompliance(content: string): {
  isCompliant: boolean
  violations: string[]
  warnings: string[]
} {
  const violations: string[] = []
  const warnings: string[] = []
  
  // Check for required CAN-SPAM elements
  if (!content.includes('unsubscribe')) {
    violations.push('Missing unsubscribe link')
  }
  
  if (!content.match(/\b\d{5}(-\d{4})?\b/)) {
    violations.push('Missing physical address')
  }
  
  // Check for PHI patterns
  const phiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b[A-Z]\d{7}\b/g, // Medical record number
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email
  ]
  
  phiPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      warnings.push(`Potential PHI detected (pattern ${index + 1})`)
    }
  })
  
  return {
    isCompliant: violations.length === 0,
    violations,
    warnings
  }
}

// Rate limiting validation
export function validateRateLimit(
  userId: string,
  action: string,
  limits: Record<string, { count: number; window: number }>
): { allowed: boolean; resetTime?: number } {
  // This would integrate with your rate limiting system
  // For now, return a simple implementation
  return { allowed: true }
}

// Input sanitization for API endpoints
export function sanitizeApiInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeEmailContent(input)
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeApiInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeApiInput(value)
    }
    return sanitized
  }
  
  return input
}
