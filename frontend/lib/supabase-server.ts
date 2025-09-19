// Comprehensive Supabase server utilities for CMS functionality
// This supports the full CMS system deployment

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

export interface ServerSupabaseClient {
  auth: {
    getUser: (token?: string) => Promise<any>
    getSession: () => Promise<any>
    admin: {
      listUsers: () => Promise<any>
      getUserById: (id: string) => Promise<any>
      createUser: (userData: any) => Promise<any>
      updateUserById: (id: string, userData: any) => Promise<any>
      deleteUser: (id: string) => Promise<any>
      inviteUserByEmail: (email: string, options?: any) => Promise<any>
    }
    resend: (token: string) => Promise<any>
    resetPasswordForEmail: (email: string, options?: any) => Promise<any>
  }
  from: (table: string) => any
  storage: {
    from: (bucket: string) => any
  }
  rpc: (functionName: string, params?: any) => any
  functions: {
    invoke: (functionName: string, params?: any) => Promise<any>
  }
}

export async function createServerClient(cookieStore?: Awaited<ReturnType<typeof cookies>>): Promise<ServerSupabaseClient> {
  // Don't auto-fetch cookies - require them to be passed explicitly
  if (!cookieStore) {
    // Return a client without cookie context for server-side operations
    console.warn('Creating Supabase client without cookie context - some functionality may be limited')
  }
  
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  })

  return {
    auth: {
      async getUser(token?: string) {
        try {
          // Extract token from cookies if not provided
          if (!token) {
            const sessionCookie = cookieStore.get('sb-access-token')
            const authHeader = cookieStore.get('authorization')
            
            if (sessionCookie?.value) {
              token = sessionCookie.value
            } else if (authHeader?.value?.startsWith('Bearer ')) {
              token = authHeader.value.substring(7)
            }
          }

          // No token means no authentication
          if (!token) {
            logger.warn('No authentication token found in request')
            return { data: { user: null }, error: 'No authentication token provided' }
          }

          // Validate token with Supabase
          const { data: { user }, error } = await client.auth.getUser(token)
          
          if (error) {
            logger.error('Token validation failed', { 
              error: error.message,
              tokenPrefix: token.substring(0, 8) + '...'
            })
            throw error
          }

          if (!user) {
            logger.warn('Token valid but no user found')
            return { data: { user: null }, error: 'User not found' }
          }

          // Verify user is active and not suspended
          const { data: profile } = await client
            .from('profiles')
            .select('status, role, suspended_at')
            .eq('id', user.id)
            .single()

          if (profile?.suspended_at) {
            logger.warn('Suspended user attempted access', { userId: user.id })
            return { data: { user: null }, error: 'Account suspended' }
          }

          // Add role to user object from profile
          const userWithRole = {
            ...user,
            role: profile?.role || 'viewer',
            status: profile?.status || 'active'
          }

          return { data: { user: userWithRole }, error: null }
        } catch (error) {
          logger.error('Failed to get user from token', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            hasToken: !!token
          })
          return { data: { user: null }, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      },
      async getSession() {
        try {
          const { data: { session }, error } = await client.auth.getSession()
          if (error) throw error
          return session
        } catch (error) {
          logger.error('Failed to get session', { error: error instanceof Error ? error.message : 'Unknown error' })
          return null
        }
      },
      admin: client.auth.admin as any,
      resend: (params: any) => client.auth.resend(params),
      resetPasswordForEmail: (email: string, options?: any) => client.auth.resetPasswordForEmail(email, options)
    },
    from: (table: string) => client.from(table),
    storage: {
      from: (bucket: string) => client.storage.from(bucket)
    },
    rpc: (functionName: string, params?: any) => client.rpc(functionName, params),
    functions: {
      invoke: (functionName: string, params?: any) => client.functions.invoke(functionName, params)
    }
  }
}

export async function createServerSupabaseClient(cookieStore?: Awaited<ReturnType<typeof cookies>>): Promise<ServerSupabaseClient> {
  return await createServerClient(cookieStore)
}

// Create a service client without cookie context for background tasks
export async function createServiceClient(): Promise<ServerSupabaseClient> {
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  })

  return {
    auth: {
      async getUser(token?: string) {
        try {
          if (!token) {
            logger.warn('No authentication token provided to service client')
            return { data: { user: null }, error: 'No authentication token provided' }
          }
          const { data: { user }, error } = await client.auth.getUser(token)
          if (error) throw error
          return { data: { user }, error: null }
        } catch (error) {
          return { data: { user: null }, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      },
      async getSession() {
        try {
          const { data: { session }, error } = await client.auth.getSession()
          if (error) throw error
          return session
        } catch (error) {
          return null
        }
      },
      admin: client.auth.admin as any,
      resend: (params: any) => client.auth.resend(params),
      resetPasswordForEmail: (email: string, options?: any) => client.auth.resetPasswordForEmail(email, options)
    },
    from: (table: string) => client.from(table),
    storage: {
      from: (bucket: string) => client.storage.from(bucket)
    },
    rpc: (functionName: string, params?: any) => client.rpc(functionName, params),
    functions: {
      invoke: (functionName: string, params?: any) => client.functions.invoke(functionName, params)
    }
  }
}

// Backward compatibility alias
export { createServerSupabaseClient as createSupabaseServiceClient }

export async function getServerUser(): Promise<any> {
  try {
    const { cookies: getCookies } = await import('next/headers')
    const cookieStore = await getCookies()
    const client = await createServerClient(cookieStore)
    
    // Try to get token from various sources
    let token: string | undefined
    
    // Check session cookie
    const sessionCookie = cookieStore.get('sb-access-token')
    if (sessionCookie?.value) {
      token = sessionCookie.value
    }
    
    // Check authorization header cookie (for API requests)
    if (!token) {
      const authHeader = cookieStore.get('authorization')
      if (authHeader?.value?.startsWith('Bearer ')) {
        token = authHeader.value.substring(7)
      }
    }
    
    // Check for session
    if (!token) {
      const session = await client.auth.getSession()
      if (session?.access_token) {
        token = session.access_token
      }
    }
    
    if (!token) {
      logger.debug('No authentication token found for server user')
      return null
    }
    
    const result = await client.auth.getUser(token)
    return result.data?.user || null
  } catch (error) {
    logger.error('Failed to get server user', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return null
  }
}

export async function requireServerAuth(): Promise<any> {
  const user = await getServerUser()
  if (!user) {
    logger.warn('Authentication required but no user found')
    throw new Error('Authentication required')
  }
  
  // Additional validation
  if (!user.id || !user.email) {
    logger.error('Invalid user object', { userId: user.id })
    throw new Error('Invalid authentication')
  }
  
  // Log successful authentication for audit
  logger.info('User authenticated', {
    userId: user.id,
    email: user.email,
    role: user.role || 'unknown'
  })
  
  return user
}

export async function getServerSession(cookieStore?: Awaited<ReturnType<typeof cookies>>): Promise<any> {
  try {
    const client = await createServerClient(cookieStore)
    return await client.auth.getSession()
  } catch (error) {
    logger.error('Failed to get server session', { error: error instanceof Error ? error.message : 'Unknown error' })
    return null
  }
}

export async function createServerUser(userData: any): Promise<any> {
  try {
    const client = await createServerClient()
    const { data, error } = await client.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userData.metadata || {}
    })
    
    if (error) throw error
    return data.user
  } catch (error) {
    logger.error('Failed to create server user', { error: error instanceof Error ? error.message : 'Unknown error' })
    throw error
  }
}

export async function updateServerUser(userId: string, updates: any): Promise<any> {
  try {
    const client = await createServerClient()
    const { data, error } = await client.auth.admin.updateUserById(userId, updates)
    
    if (error) throw error
    return data.user
  } catch (error) {
    logger.error('Failed to update server user', { userId, error: error instanceof Error ? error.message : 'Unknown error' })
    throw error
  }
}

export async function deleteServerUser(userId: string): Promise<boolean> {
  try {
    const client = await createServerClient()
    const { error } = await client.auth.admin.deleteUser(userId)
    
    if (error) throw error
    return true
  } catch (error) {
    logger.error('Failed to delete server user', { userId, error: error instanceof Error ? error.message : 'Unknown error' })
    return false
  }
}

export async function listServerUsers(page: number = 1, perPage: number = 20): Promise<any[]> {
  try {
    const client = await createServerClient()
    const { data, error } = await (client.auth.admin as any).listUsers({
      page,
      perPage
    })
    
    if (error) throw error
    return data.users || []
  } catch (error) {
    logger.error('Failed to list server users', { error: error instanceof Error ? error.message : 'Unknown error' })
    return []
  }
}

export async function generateServerLink(type: 'signup' | 'signin' | 'recovery', email: string, redirectTo?: string): Promise<string> {
  try {
    const client = await createServerClient()
    const { data, error } = await (client.auth.admin as any).generateLink({
      type,
      email,
      options: {
        redirectTo
      }
    })
    
    if (error) throw error
    return data.properties.action_link
  } catch (error) {
    logger.error('Failed to generate server link', { type, email, error: error instanceof Error ? error.message : 'Unknown error' })
    throw error
  }
}

export async function inviteServerUser(email: string, options?: any): Promise<any> {
  try {
    const client = await createServerClient()
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, options)
    
    if (error) throw error
    return data
  } catch (error) {
    logger.error('Failed to invite server user', { email, error: error instanceof Error ? error.message : 'Unknown error' })
    throw error
  }
}

export async function resendServerConfirmation(email: string): Promise<boolean> {
  try {
    const client = await createServerClient()
    const { error } = await (client.auth as any).resend({
      type: 'signup',
      email
    })
    
    if (error) throw error
    return true
  } catch (error) {
    logger.error('Failed to resend server confirmation', { email, error: error instanceof Error ? error.message : 'Unknown error' })
    return false
  }
}

export async function resetServerPassword(email: string): Promise<boolean> {
  try {
    const client = await createServerClient()
    const { error } = await client.auth.resetPasswordForEmail(email)
    
    if (error) throw error
    return true
  } catch (error) {
    logger.error('Failed to reset server password', { email, error: error instanceof Error ? error.message : 'Unknown error' })
    return false
  }
}

export default createServerSupabaseClient