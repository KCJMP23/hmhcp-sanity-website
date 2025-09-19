import { createServerClient as createSSRClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { AuthError, User, Session } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Server-side authentication utilities

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key'

// Admin client with service role key for server operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create server client with cookie access
export async function createServerClient(cookieStore?: Awaited<ReturnType<typeof cookies>>) {
  // Get cookies on-demand if not provided
  if (!cookieStore) {
    const { cookies: getCookies } = await import('next/headers')
    cookieStore = await getCookies()
  }
  
  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

// Authentication types
export interface AdminUser extends User {
  user_metadata: {
    role?: string
    first_name?: string
    last_name?: string
  }
}

export interface AuthResponse {
  user: AdminUser | null
  session: Session | null
  error: AuthError | null
}

// Server-side authentication functions
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    const session = await getCurrentSession()
    if (!session) return null
    
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('User error:', error)
      return null
    }
    
    return user as AdminUser
  } catch (error) {
    console.error('Failed to get user:', error)
    return null
  }
}

export async function requireAuth(redirectTo: string = '/admin/login') {
  const session = await getCurrentSession()
  if (!session) {
    redirect(redirectTo)
  }
  return session
}

export async function requireRole(roles: string[], redirectTo: string = '/admin') {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }
  
  const userRole = user?.user_metadata?.role
  if (!userRole || !roles.includes(userRole)) {
    redirect(redirectTo)
  }
  
  return user
}

// Sign out function for server actions
export async function signOutServer() {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error) {
    console.error('Failed to sign out:', error)
    return { error: 'Failed to sign out' }
  }
}