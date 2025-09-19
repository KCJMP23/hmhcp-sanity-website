/**
 * Security middleware for blog automation API routes
 * Implements authentication, authorization, rate limiting, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logging/winston-logger'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  permissions?: string[]
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export interface SecurityContext {
  user: AuthenticatedUser | null
  requestId: string
  clientIp: string
  userAgent: string
}

/**
 * Extract client IP from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIp || 'unknown'
}

/**
 * Rate limiting implementation
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const clientIp = getClientIp(request)
  const now = Date.now()
  
  const limiter = rateLimitStore.get(clientIp)
  
  if (!limiter || limiter.resetTime < now) {
    // Create new window
    const resetTime = now + config.windowMs
    rateLimitStore.set(clientIp, { count: 1, resetTime })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime }
  }
  
  if (limiter.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: limiter.resetTime }
  }
  
  limiter.count++
  return { 
    allowed: true, 
    remaining: config.maxRequests - limiter.count, 
    resetTime: limiter.resetTime 
  }
}

/**
 * Authenticate request and extract user
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthenticatedUser | null
  error: string | null
}> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization token provided' }
    }
    
    const token = authHeader.substring(7)
    
    // Verify token with Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }
    
    // Get user role and permissions from database
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single()
    
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      role: profile?.role || 'user',
      permissions: profile?.permissions || []
    }
    
    return { user: authenticatedUser, error: null }
    
  } catch (error) {
    logger.error('Authentication error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return { user: null, error: 'Authentication failed' }
  }
}

/**
 * Check if user has required permission
 */
export async function checkPermission(
  user: AuthenticatedUser,
  requiredPermission: string
): Promise<boolean> {
  // Admin has all permissions
  if (user.role === 'admin') {
    return true
  }
  
  // Check specific permissions
  if (user.permissions && user.permissions.includes(requiredPermission)) {
    return true
  }
  
  // Check role-based permissions
  const rolePermissions: Record<string, string[]> = {
    'editor': ['blog:read', 'blog:create', 'blog:update'],
    'viewer': ['blog:read'],
    'user': ['blog:read']
  }
  
  const allowedPermissions = rolePermissions[user.role] || []
  return allowedPermissions.includes(requiredPermission)
}

/**
 * Create security context for request
 */
export function createSecurityContext(
  request: NextRequest,
  user: AuthenticatedUser | null
): SecurityContext {
  return {
    user,
    requestId: crypto.randomUUID(),
    clientIp: getClientIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown'
  }
}

/**
 * Audit log helper
 */
export async function auditLog(
  context: SecurityContext,
  action: string,
  result: 'success' | 'failure' | 'unauthorized' | 'forbidden',
  details?: Record<string, any>
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
    userId: context.user?.id || 'anonymous',
    userEmail: context.user?.email,
    action,
    result,
    clientIp: context.clientIp,
    userAgent: context.userAgent,
    details
  }
  
  // Log to winston
  if (result === 'success') {
    logger.info('Audit log', logEntry)
  } else {
    logger.warn('Audit log', logEntry)
  }
  
  // In production, also log to database or SIEM
  try {
    const supabase = await createServerClient()
    await supabase.from('audit_logs').insert(logEntry)
  } catch (error) {
    logger.error('Failed to write audit log to database', { error, logEntry })
  }
}

/**
 * Security middleware wrapper for API routes
 */
export function withSecurity(
  handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>,
  options: {
    requiredPermission?: string
    rateLimit?: RateLimitConfig
    requireAuth?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    
    // Apply rate limiting
    if (options.rateLimit) {
      const rateLimitResult = await checkRateLimit(request, options.rateLimit)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': options.rateLimit.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
            }
          }
        )
      }
    }
    
    // Authenticate if required
    let user: AuthenticatedUser | null = null
    if (options.requireAuth !== false) {
      const { user: authenticatedUser, error } = await authenticateRequest(request)
      if (error || !authenticatedUser) {
        const context = createSecurityContext(request, null)
        await auditLog(context, request.method, 'unauthorized')
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      user = authenticatedUser
    }
    
    // Create security context
    const context = createSecurityContext(request, user)
    
    // Check permissions if specified
    if (options.requiredPermission && user) {
      const hasPermission = await checkPermission(user, options.requiredPermission)
      if (!hasPermission) {
        await auditLog(context, request.method, 'forbidden', {
          requiredPermission: options.requiredPermission
        })
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }
    
    try {
      // Execute the handler
      const response = await handler(request, context)
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('X-Request-ID', context.requestId)
      
      // Log successful request
      await auditLog(context, request.method, 'success', {
        duration: Date.now() - startTime,
        status: response.status
      })
      
      return response
      
    } catch (error) {
      // Log error
      await auditLog(context, request.method, 'failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      
      // Return generic error to prevent information disclosure
      return NextResponse.json(
        { 
          error: 'An error occurred processing your request',
          requestId: context.requestId
        },
        { status: 500 }
      )
    }
  }
}

/**
 * HIPAA compliance check for content
 */
export async function checkHIPAACompliance(content: string): Promise<{
  compliant: boolean
  violations: string[]
}> {
  const violations: string[] = []
  
  // Check for common PHI patterns
  const phiPatterns = [
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, name: 'SSN' },
    { pattern: /\b\d{10,12}\b/g, name: 'MRN' },
    { pattern: /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g, name: 'Phone' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, name: 'Email' },
    { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, name: 'Date of Birth' }
  ]
  
  for (const { pattern, name } of phiPatterns) {
    if (pattern.test(content)) {
      violations.push(`Potential ${name} detected`)
    }
  }
  
  // Check for patient names (simplified check)
  const namePatterns = [
    /\bpatient\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    /\bMr\.\s+[A-Z][a-z]+\b/g,
    /\bMs\.\s+[A-Z][a-z]+\b/g,
    /\bMrs\.\s+[A-Z][a-z]+\b/g
  ]
  
  for (const pattern of namePatterns) {
    if (pattern.test(content)) {
      violations.push('Potential patient name detected')
    }
  }
  
  return {
    compliant: violations.length === 0,
    violations
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  // Remove control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')
  
  // Truncate to maximum length
  sanitized = sanitized.substring(0, maxLength)
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return sanitized
}

export default {
  authenticateRequest,
  checkPermission,
  checkRateLimit,
  createSecurityContext,
  auditLog,
  withSecurity,
  checkHIPAACompliance,
  sanitizeInput
}