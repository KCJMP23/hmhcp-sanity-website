/**
 * Session-based authentication for admin APIs
 * Handles both cookie-based sessions and Supabase auth tokens
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logging/winston-logger'

export interface AdminUser {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Authenticate admin request with multiple fallback methods
 */
export async function authenticateAdminRequest(request: NextRequest): Promise<{
  user: AdminUser | null
  error: string | null
}> {
  try {
    logger.info('Starting admin authentication', {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    })

    // Method 1: Try cookie-based Supabase session
    logger.info('Method 1: Trying cookie-based Supabase session')
    
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()

      logger.info('Cookie-based session result', {
        hasUser: !!sessionUser,
        userId: sessionUser?.id?.substring(0, 8) + '...' || 'none',
        userEmail: sessionUser?.email || 'none',
        sessionError: sessionError?.message || 'none'
      })

      if (sessionUser && !sessionError) {
        logger.info('Verifying admin role for cookie-based session')
        const adminUser = await verifyAdminRole(sessionUser.email!, sessionUser.id)
        if (adminUser) {
          logger.info('Cookie-based authentication successful', { email: adminUser.email, role: adminUser.role })
          return { user: adminUser, error: null }
        } else {
          logger.warn('Cookie-based session user exists but admin role verification failed', { email: sessionUser.email })
        }
      }
    } catch (error) {
      logger.error('Method 1 (cookie-based) failed', { error: error instanceof Error ? error.message : 'Unknown' })
    }

    // Method 2: Try Authorization header token
    logger.info('Method 2: Trying Authorization header token')
    const authHeader = request.headers.get('authorization')
    logger.info('Authorization header', { 
      hasAuthHeader: !!authHeader,
      headerStart: authHeader?.substring(0, 20) || 'none'
    })

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)
        
        const { data: { user: tokenUser }, error: tokenError } = await adminClient.auth.getUser(token)
        
        logger.info('Token verification result', {
          hasUser: !!tokenUser,
          userId: tokenUser?.id?.substring(0, 8) + '...' || 'none',
          userEmail: tokenUser?.email || 'none',
          tokenError: tokenError?.message || 'none'
        })

        if (tokenUser && !tokenError) {
          const adminUser = await verifyAdminRole(tokenUser.email!, tokenUser.id)
          if (adminUser) {
            logger.info('Token-based authentication successful', { email: adminUser.email, role: adminUser.role })
            return { user: adminUser, error: null }
          } else {
            logger.warn('Token user exists but admin role verification failed', { email: tokenUser.email })
          }
        }
      } catch (error) {
        logger.error('Method 2 (token-based) failed', { error: error instanceof Error ? error.message : 'Unknown' })
      }
    }

    // Method 3: Try session cookie directly
    logger.info('Method 3: Trying direct session cookie parsing')
    const cookies = request.headers.get('cookie')
    logger.info('Cookie header analysis', {
      hasCookies: !!cookies,
      cookieLength: cookies?.length || 0,
      cookiePreview: cookies?.substring(0, 100) || 'none'
    })

    if (cookies) {
      // Try multiple cookie name patterns used by Supabase
      const cookiePatterns = [
        /supabase-auth-token=([^;]+)/,
        /sb-[^=]+-auth-token=([^;]+)/,
        /supabase\.auth\.token=([^;]+)/
      ]

      for (const pattern of cookiePatterns) {
        const sessionMatch = cookies.match(pattern)
        if (sessionMatch) {
          try {
            const sessionToken = sessionMatch[1]
            logger.info('Found session cookie match', { 
              pattern: pattern.toString(),
              tokenStart: sessionToken.substring(0, 20) + '...'
            })

            const adminClient = createClient(supabaseUrl, supabaseServiceKey)
            
            const { data: { user: cookieUser }, error: cookieError } = await adminClient.auth.getUser(sessionToken)
            
            logger.info('Cookie token verification result', {
              hasUser: !!cookieUser,
              userId: cookieUser?.id?.substring(0, 8) + '...' || 'none',
              userEmail: cookieUser?.email || 'none',
              cookieError: cookieError?.message || 'none'
            })

            if (cookieUser && !cookieError) {
              const adminUser = await verifyAdminRole(cookieUser.email!, cookieUser.id)
              if (adminUser) {
                logger.info('Cookie-based authentication successful', { email: adminUser.email, role: adminUser.role })
                return { user: adminUser, error: null }
              } else {
                logger.warn('Cookie user exists but admin role verification failed', { email: cookieUser.email })
              }
            }
          } catch (error) {
            logger.error('Cookie pattern processing failed', { 
              pattern: pattern.toString(),
              error: error instanceof Error ? error.message : 'Unknown'
            })
          }
        }
      }
    }

    logger.warn('All authentication methods failed')
    return { user: null, error: 'Authentication required' }
    
  } catch (error) {
    logger.error('Admin authentication critical error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return { user: null, error: 'Authentication failed' }
  }
}

/**
 * Verify user has admin role
 */
async function verifyAdminRole(email: string, userId: string): Promise<AdminUser | null> {
  try {
    logger.info('Verifying admin role', { email, userId: userId.substring(0, 8) + '...' })
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check admin_users table
    logger.info('Querying admin_users table')
    const { data: adminUser, error: adminError } = await adminClient
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    logger.info('Admin users table query result', {
      hasAdminUser: !!adminUser,
      adminError: adminError?.message || 'none',
      adminRole: adminUser?.role || 'none'
    })

    if (adminError || !adminUser) {
      logger.warn('Admin user not found or inactive', { email, adminError: adminError?.message })
      return null
    }

    // Also get user metadata
    logger.info('Getting user metadata from auth')
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId)
    
    logger.info('User metadata query result', {
      hasUser: !!user,
      userError: userError?.message || 'none',
      userMetadata: user?.user_metadata ? Object.keys(user.user_metadata) : []
    })

    if (userError || !user) {
      logger.warn('User metadata not found', { userId, userError: userError?.message })
      return null
    }

    const result = {
      id: userId,
      email: email,
      role: adminUser.role || user.user_metadata?.role || 'admin',
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name
    }

    logger.info('Admin role verification successful', { 
      email: result.email, 
      role: result.role,
      hasFirstName: !!result.first_name,
      hasLastName: !!result.last_name
    })

    return result
    
  } catch (error) {
    logger.error('Admin role verification critical error', { 
      email, 
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AdminUser, permission: string): boolean {
  // Super admin has all permissions
  if (user.role === 'super_admin') {
    return true
  }
  
  // Admin has most permissions
  if (user.role === 'admin') {
    const adminPermissions = [
      'analytics:read',
      'blog:read',
      'blog:write',
      'content:read',
      'content:write',
      'users:read',
      'agents:read',
      'agents:write'
    ]
    return adminPermissions.includes(permission)
  }
  
  // Editor has content permissions
  if (user.role === 'editor') {
    const editorPermissions = [
      'blog:read',
      'blog:write',
      'content:read',
      'content:write'
    ]
    return editorPermissions.includes(permission)
  }
  
  return false
}

/**
 * Admin authentication middleware
 */
export function requireAdmin(permission?: string) {
  return async (request: NextRequest): Promise<{ user: AdminUser | null; error?: string }> => {
    const { user, error } = await authenticateAdminRequest(request)
    
    if (error || !user) {
      return { user: null, error: error || 'Authentication required' }
    }
    
    if (permission && !hasPermission(user, permission)) {
      return { user: null, error: 'Insufficient permissions' }
    }
    
    return { user }
  }
}