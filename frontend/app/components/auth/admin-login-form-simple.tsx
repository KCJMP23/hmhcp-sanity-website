'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
// Server-side authentication - no client imports needed

interface AdminLoginFormProps {
  className?: string
  redirectTo?: string
}

export function AdminLoginFormSimple({ className, redirectTo = '/dashboard' }: AdminLoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info' | 'warning'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [resetEmail, setResetEmail] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth/me', {
          credentials: 'include',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        if (response.ok) {
          router.push(redirectTo)
        }
      } catch (error) {
        // User not authenticated, continue to login form
      }
    }
    
    checkAuth()
  }, [router, redirectTo])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (message) setMessage(null)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (!formData.email || !formData.password) {
        setMessage({ type: 'error', text: 'Please fill in all fields' })
        return
      }

      // Use server-side login API endpoint to establish proper session cookies
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Invalid credentials. Please try again.' 
        })
        return
      }

      if (data.success && data.user) {
        setMessage({ type: 'success', text: 'Login successful! Redirecting to dashboard...' })
        
        // Brief delay to show success message
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Redirect to dashboard - server-side cookies are now set
        router.push(redirectTo)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className || ''}`}>
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Login
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Access to HMHCP admin dashboard
          </p>
        </div>
        
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="admin@hmhcp.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <LoadingSpinner variant="white" size="sm" text="Signing In..." />
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400 font-medium">Secure Authentication</span>
          </div>
          <p>Enter your HMHCP admin credentials</p>
        </div>
      </div>
    </div>
  )
}