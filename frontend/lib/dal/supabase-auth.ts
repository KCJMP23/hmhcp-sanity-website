// Supabase authentication functions for DAL
import { createClient } from '@supabase/supabase-js'
import { isUsingMockSupabase, mockSupabaseAdmin } from './mock-supabase'
import { logger } from '@/lib/logging/client-safe-logger'

// Import types only - functions are implemented locally to avoid circular dependencies
import type { User } from '@supabase/supabase-js'

// Create supabase admin client directly to avoid next/headers import
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key'

const supabaseAdmin = isUsingMockSupabase() 
  ? mockSupabaseAdmin as any
  : createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

export async function verifySession(token?: string) {
  try {
    // Check for basic admin session from cookies (Next.js API routes)
    if (typeof window === 'undefined') {
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const adminSessionCookie = cookieStore.get('admin_session_jwt')
        const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'info@hm-hcp.com'
        
        if (adminSessionCookie?.value && adminSessionCookie.value.startsWith('basic-admin-token-')) {
          // Return basic admin user session
          return {
            user: {
              id: 'admin-001',
              email: defaultAdminEmail,
              role: 'super_admin',
              user_metadata: {
                role: 'super_admin'
              }
            }
          }
        }
      } catch (cookieError) {
        // Cookies not available, continue with other methods
        console.log('Cookies not available for session verification')
      }
    }
    
    // If token provided, use it directly
    if (token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      
      if (error || !user) {
        return null
      }

      return { user }
    }

    // For API routes without token, we need to extract from request headers
    // This is a simplified version - in production you'd extract from request headers
    // For now, return mock session to prevent build errors
    if (isUsingMockSupabase()) {
      return {
        user: {
          id: 'mock-admin',
          email: 'admin@example.com',
          role: 'admin',
          user_metadata: { role: 'admin' }
        }
      }
    }

    return null
  } catch (error) {
    logger.error('Session verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
}

export async function requireRole(roles: string[]) {
  // This function is used in API routes where we need to verify user roles
  // For server components, use the version from /lib/auth/supabase-server.ts
  const session = await verifySession()
  
  if (!session || !session.user) {
    throw new Error('Authentication required')
  }
  
  const user = session.user
  const userRole = user.user_metadata?.role || user.role
  if (!userRole || !roles.includes(userRole)) {
    throw new Error('Insufficient permissions')
  }
  
  return user
}

