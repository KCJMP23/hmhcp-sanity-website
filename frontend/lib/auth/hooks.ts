import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    role?: string
    [key: string]: any
  }
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In a real implementation, this would check for authenticated user
    // For testing purposes, we'll simulate loading
    const checkAuth = async () => {
      try {
        // Simulate auth check
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Mock authenticated user
        setUser({
          id: 'mock-user-id',
          email: 'user@test.com',
          user_metadata: { role: 'admin' }
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth error')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return {
    user,
    loading,
    error
  }
}

export function useAuthUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

export function useSession() {
  const { user, loading, error } = useAuth()
  
  return {
    session: user ? { user } : null,
    loading,
    error
  }
}