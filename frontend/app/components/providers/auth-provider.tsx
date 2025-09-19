'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, Session } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string
  role: string
  permissions: string[]
  profile?: {
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

interface AuthSession {
  token: string
  sessionValid: boolean
  expiresAt: Date
}

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  checkPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  signIn: async () => false,
  signOut: async () => {},
  refreshSession: async () => {},
  checkPermission: () => false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const loadUserProfile = useCallback(async (supabaseUser: User, accessToken: string) => {
    try {
      // Get user profile with permissions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          role_permissions (
            permission
          )
        `)
        .eq('id', supabaseUser.id)
        .single()

      if (profileError) {
        console.warn('Failed to load user profile:', profileError)
        // Create basic user from auth data
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: 'user',
          permissions: []
        }
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || profile.email,
        role: profile.role || 'user',
        permissions: profile.role_permissions?.map((p: any) => p.permission) || [],
        profile: {
          firstName: profile.first_name,
          lastName: profile.last_name,
          avatar: profile.avatar_url
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: 'user',
        permissions: []
      }
    }
  }, [supabase])

  const updateSession = useCallback(async (supabaseSession: Session | null) => {
    if (!supabaseSession) {
      setUser(null)
      setSession(null)
      return
    }

    try {
      const authUser = await loadUserProfile(supabaseSession.user, supabaseSession.access_token)
      
      setUser(authUser)
      setSession({
        token: supabaseSession.access_token,
        sessionValid: true,
        expiresAt: new Date(supabaseSession.expires_at! * 1000)
      })
    } catch (error) {
      console.error('Session update error:', error)
      setError('Failed to update session')
    }
  }, [loadUserProfile])

  const refreshSession = useCallback(async () => {
    try {
      setError(null)
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        throw error
      }
      
      await updateSession(newSession)
    } catch (error) {
      console.error('Session refresh error:', error)
      setError('Session refresh failed')
      setUser(null)
      setSession(null)
    }
  }, [supabase.auth, updateSession])

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
        return false
      }

      if (data.session) {
        await updateSession(data.session)
        return true
      }

      return false
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [supabase.auth, updateSession])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
      setError('Sign out failed')
    }
  }, [supabase.auth])

  const checkPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    
    // Admin and super_admin have all permissions
    if (user.role === 'admin' || user.role === 'super_admin') {
      return true
    }
    
    return user.permissions.includes(permission)
  }, [user])

  // Initialize authentication state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (mounted) {
          await updateSession(initialSession)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setError('Authentication initialization failed')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event)
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            await updateSession(session)
            break
          case 'SIGNED_OUT':
            setUser(null)
            setSession(null)
            break
          case 'PASSWORD_RECOVERY':
            // Handle password recovery if needed
            break
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, updateSession])

  // Auto-refresh session before expiry
  useEffect(() => {
    if (!session?.expiresAt) return

    const timeUntilExpiry = session.expiresAt.getTime() - Date.now()
    const refreshTime = Math.max(timeUntilExpiry - 60000, 30000) // 1 minute before expiry, minimum 30 seconds

    const timer = setTimeout(() => {
      refreshSession()
    }, refreshTime)

    return () => clearTimeout(timer)
  }, [session?.expiresAt, refreshSession])

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    error,
    signIn,
    signOut,
    refreshSession,
    checkPermission
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook for checking permissions
export function usePermission(permission: string) {
  const { checkPermission } = useAuth()
  return checkPermission(permission)
}

// Helper hook for admin access
export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === 'admin' || user?.role === 'super_admin'
}