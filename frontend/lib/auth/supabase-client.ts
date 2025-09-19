'use client'

import { createClient } from '@supabase/supabase-js'
import { AuthError, User, Session } from '@supabase/supabase-js'

// Client-side authentication utilities

// Get environment variables from client-side environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'

// Check if we're in mock mode (missing credentials)
const isClientMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client-side Supabase client (will use mock behavior if credentials missing)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Authentication types (duplicated for client-side usage)
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

// Client-side authentication functions
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        user: null,
        session: null,
        error
      }
    }

    return {
      user: data.user as AdminUser,
      session: data.session,
      error: null
    }
  } catch (error) {
    // Authentication error occurred
    return {
      user: null,
      session: null,
      error: error as AuthError
    }
  }
}

export async function signUp(email: string, password: string, metadata?: any): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) {
      return {
        user: null,
        session: null,
        error
      }
    }

    return {
      user: data.user as AdminUser,
      session: data.session,
      error: null
    }
  } catch (error) {
    // Registration error occurred
    return {
      user: null,
      session: null,
      error: error as AuthError
    }
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    // Sign out error occurred
    return { error: error as AuthError }
  }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`
    })
    return { error }
  } catch (error) {
    // Password reset error occurred
    return { error: error as AuthError }
  }
}

export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  } catch (error) {
    // Password update error occurred
    return { error: error as AuthError }
  }
}

export async function getSessionClient(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      // Session retrieval error occurred
      return null
    }
    
    return session
  } catch (error) {
    // Failed to retrieve session
    return null
  }
}

export async function getUserClient(): Promise<AdminUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      // User retrieval error occurred
      return null
    }
    
    return user as AdminUser
  } catch (error) {
    // Failed to retrieve user data
    return null
  }
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  
  return subscription
}

// Alternative function names for consistency
export const signInWithPassword = signIn
export const signUpWithPassword = signUp

// Check if user has admin role
export function isAdmin(user: AdminUser | null): boolean {
  if (!user) return false
  return user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin'
}

// Verify admin access (client-side)
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getUserClient()
  if (!user || !isAdmin(user)) {
    throw new Error('Admin access required')
  }
  return user
}