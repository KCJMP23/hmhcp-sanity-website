'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, User, Lock } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface AdminLoginFormProps {
  className?: string
  redirectTo?: string
}

export function AdminLoginForm({ className, redirectTo = '/admin' }: AdminLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  // Create Supabase client with proper SSR cookie handling
  // Using environment variables (NEXT_PUBLIC_ prefix makes them available client-side)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oylsllqbqdynzyifrmxj.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bHNsbHFicWR5bnp5aWZybXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MDAyNjcsImV4cCI6MjA2NTE3NjI2N30.tJeYBAwxftxbaNCNJ2gY9hSg4spak8AKKBY79k3191I'
  
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Use Supabase Auth directly
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(authError.message || 'Invalid email or password')
        return
      }

      if (!data.user || !data.session) {
        setError('Authentication failed')
        return
      }

      // Check if user has admin role in metadata
      const isAdmin = data.user.user_metadata?.role === 'admin' || 
                     data.user.app_metadata?.role === 'admin' ||
                     data.user.user_metadata?.is_admin === true

      if (!isAdmin) {
        setError('Access denied. Admin privileges required.')
        await supabase.auth.signOut()
        return
      }

      // Set the session cookie for the middleware to recognize
      // The Supabase client should handle this automatically, but let's ensure it's set
      console.log('Login successful, session established')
      console.log('Redirecting to:', redirectTo)
      
      // Use window.location for a hard redirect to ensure cookies are sent
      window.location.href = redirectTo
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className + ' bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center text-gray-900 dark:text-gray-100">Admin Access</CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-300">
          Enter your credentials to access the admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 dark:text-gray-200">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900 dark:text-gray-200">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}