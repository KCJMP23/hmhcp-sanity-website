'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { signIn, resetPassword, getSessionClient } from '@/lib/auth/supabase-client'
import { cn } from '@/lib/utils'

interface AdminLoginFormProps {
  className?: string
  redirectTo?: string
}

interface BotProtectionData {
  formStartTime: number
  mouseMovements: number
  keystrokes: number
  focusEvents: number
  honeypotValue: string
}

export function AdminLoginFormEnhanced({ className, redirectTo = '/dashboard' }: AdminLoginFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const honeypotFieldName = useRef(`email_verification_${Math.random().toString(36).substring(7)}`)
  
  const [botProtection, setBotProtection] = useState<BotProtectionData>({
    formStartTime: Date.now(),
    mouseMovements: 0,
    keystrokes: 0,
    focusEvents: 0,
    honeypotValue: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info' | 'warning'; text: string } | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string>('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [resetEmail, setResetEmail] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSessionClient()
        if (session?.user) {
          router.push(redirectTo)
        }
      } catch (error) {
        // User not authenticated, continue to login form
      }
    }
    
    checkAuth()
  }, [router, redirectTo])

  useEffect(() => {
    const handleMouseMove = () => {
      setBotProtection(prev => ({ ...prev, mouseMovements: prev.mouseMovements + 1 }))
    }

    const handleKeyDown = () => {
      setBotProtection(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }))
    }

    const handleFocus = () => {
      setBotProtection(prev => ({ ...prev, focusEvents: prev.focusEvents + 1 }))
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocus)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocus)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === honeypotFieldName.current) {
      setBotProtection(prev => ({ ...prev, honeypotValue: value }))
      return
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
    if (message) setMessage(null)
  }

  const validateBotProtection = (): { isValid: boolean; reason?: string } => {
    const formTime = Date.now() - botProtection.formStartTime
    const totalInteractions = botProtection.mouseMovements + botProtection.keystrokes + botProtection.focusEvents

    if (botProtection.honeypotValue.trim() !== '') {
      return { isValid: false, reason: 'Security violation detected. Please contact support if you believe this is an error.' }
    }

    if (formTime < 2000) {
      return { isValid: false, reason: 'Please take your time to fill out the form properly.' }
    }

    if (totalInteractions < 3) {
      return { isValid: false, reason: 'Please interact with the form before submitting.' }
    }

    if (formTime > 1800000) {
      return { isValid: false, reason: 'Session expired. Please refresh the page and try again.' }
    }

    return { isValid: true }
  }

  const generateFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Bot protection', 2, 2)
      }
      
      return btoa(JSON.stringify({
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        canvas: canvas.toDataURL()
      }))
    } catch {
      return 'fallback-fingerprint'
    }
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

      const botCheck = validateBotProtection()
      if (!botCheck.isValid) {
        setIsBlocked(true)
        setBlockReason(botCheck.reason || 'Security check failed')
        setMessage({ type: 'warning', text: botCheck.reason || 'Security check failed' })
        return
      }

      // Use Supabase client-side authentication directly
      const { user, session, error } = await signIn(formData.email, formData.password)
      
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          setMessage({ type: 'error', text: 'Invalid email or password. Please check your credentials and try again.' })
        } else if (error.message?.includes('Too many requests')) {
          setMessage({ type: 'error', text: 'Too many login attempts. Please wait before trying again.' })
        } else {
          setMessage({ type: 'error', text: error.message || 'Login failed. Please try again.' })
        }
        return
      }

      if (user && session) {
        // Check if user has admin role
        const userRole = user.user_metadata?.role
        if (!userRole || !['admin', 'super_admin', 'editor'].includes(userRole)) {
          setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' })
          return
        }

        setMessage({ type: 'success', text: 'Login successful! Redirecting to dashboard...' })
        
        // Small delay to show success message, then redirect
        setTimeout(() => {
          router.push(redirectTo)
        }, 1000)
      } else {
        setMessage({ type: 'error', text: 'Authentication failed. Please try again.' })
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetting(true)
    setMessage(null)

    try {
      if (!resetEmail) {
        setMessage({ type: 'error', text: 'Please enter your email address' })
        return
      }

      const { error } = await resetPassword(resetEmail)

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to send reset email' })
        return
      }

      setMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Check your inbox for instructions.' 
      })
      
      setTimeout(() => {
        setShowForgotPassword(false)
        setResetEmail('')
      }, 3000)

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send reset email'
      })
    } finally {
      setIsResetting(false)
    }
  }

  // Render blocked state
  if (isBlocked) {
    return React.createElement('div', {
      className: cn("w-full max-w-md mx-auto", className)
    }, React.createElement('div', {
      className: "bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-red-200 dark:border-red-800"
    }, React.createElement('div', {
      className: "text-center mb-8"
    }, React.createElement(Shield, {
      className: "w-16 h-16 text-red-500 mx-auto mb-4"
    }), React.createElement('h1', {
      className: "text-2xl font-bold text-red-700 dark:text-red-400 mb-2"
    }, "Access Blocked"), React.createElement('p', {
      className: "text-red-600 dark:text-red-400"
    }, blockReason)), React.createElement('div', {
      className: "text-center space-y-4"
    }, React.createElement('p', {
      className: "text-sm text-gray-600 dark:text-gray-400"
    }, "If you believe this is an error, please contact your administrator."), React.createElement('button', {
      onClick: () => window.location.reload(),
      className: "text-blue-600 dark:text-blue-400 hover:underline text-sm"
    }, "Reload page"))))
  }

  // Render forgot password state
  if (showForgotPassword) {
    return React.createElement('div', {
      className: cn("w-full max-w-md mx-auto", className)
    }, React.createElement('div', {
      className: "bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
    }, React.createElement('div', {
      className: "text-center mb-8"
    }, React.createElement('h1', {
      className: "text-2xl font-bold text-gray-900 dark:text-white mb-2"
    }, "Reset Password"), React.createElement('p', {
      className: "text-gray-600 dark:text-gray-400"
    }, "Enter your email address and we'll send you a link to reset your password")), 
    message && React.createElement('div', {
      className: cn(
        "mb-6 p-4 rounded-lg flex items-start gap-3",
        message.type === 'error' && "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
        message.type === 'success' && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
        message.type === 'info' && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
      )
    }, 
    message.type === 'error' && React.createElement(AlertCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" }),
    message.type === 'success' && React.createElement(CheckCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" }),
    React.createElement('span', { className: "text-sm" }, message.text)),
    React.createElement('form', {
      onSubmit: handlePasswordReset,
      className: "space-y-6"
    }, React.createElement('div', null,
      React.createElement('label', {
        htmlFor: "reset-email",
        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      }, "Email Address"),
      React.createElement('div', { className: "relative" },
        React.createElement(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }),
        React.createElement('input', {
          id: "reset-email",
          type: "email",
          value: resetEmail,
          onChange: (e) => setResetEmail(e.target.value),
          className: "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
          placeholder: "Enter your email address",
          required: true
        }))),
      React.createElement('button', {
        type: "submit",
        disabled: isResetting,
        className: "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
      }, isResetting ? React.createElement(React.Fragment, null,
        React.createElement('div', { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
        "Sending Reset Email..."
      ) : React.createElement(React.Fragment, null,
        "Send Reset Email",
        React.createElement(ArrowRight, { className: "w-4 h-4" })
      )),
      React.createElement('div', { className: "text-center" },
        React.createElement('button', {
          type: "button",
          onClick: () => {
            setShowForgotPassword(false)
            setMessage(null)
            setResetEmail('')
          },
          className: "text-sm text-blue-600 dark:text-blue-400 hover:underline"
        }, "Back to Sign In")))))
  }

  // Main login form
  return React.createElement('div', {
    className: cn("w-full max-w-md mx-auto", className)
  }, React.createElement('div', {
    className: "bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
  }, React.createElement('div', {
    className: "text-center mb-8"
  }, React.createElement('div', {
    className: "flex items-center justify-center mb-4"
  }, React.createElement(Shield, { className: "w-8 h-8 text-blue-600 mr-2" }), 
  React.createElement('h1', {
    className: "text-2xl font-bold text-gray-900 dark:text-white"
  }, "Secure Admin Login")), React.createElement('p', {
    className: "text-gray-600 dark:text-gray-400"
  }, "Protected access to HMHCP admin dashboard")),
  
  message && React.createElement('div', {
    className: cn(
      "mb-6 p-4 rounded-lg flex items-start gap-3",
      message.type === 'error' && "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
      message.type === 'success' && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
      message.type === 'info' && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
      message.type === 'warning' && "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
    )
  }, 
  message.type === 'error' && React.createElement(AlertCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" }),
  message.type === 'success' && React.createElement(CheckCircle, { className: "w-5 h-5 mt-0.5 flex-shrink-0" }),
  message.type === 'warning' && React.createElement(Shield, { className: "w-5 h-5 mt-0.5 flex-shrink-0" }),
  React.createElement('span', { className: "text-sm" }, message.text)),

  React.createElement('form', {
    ref: formRef,
    onSubmit: handleSignIn,
    className: "space-y-6"
  }, React.createElement('div', {
    style: { 
      position: 'absolute', 
      left: '-9999px', 
      top: '-9999px', 
      opacity: 0, 
      visibility: 'hidden', 
      height: 0, 
      width: 0, 
      overflow: 'hidden' 
    },
    'aria-hidden': true
  }, React.createElement('label', {
    htmlFor: honeypotFieldName.current
  }, "Leave this field empty"), React.createElement('input', {
    type: "text",
    name: honeypotFieldName.current,
    id: honeypotFieldName.current,
    value: botProtection.honeypotValue,
    onChange: handleInputChange,
    tabIndex: -1,
    autoComplete: "off",
    style: { 
      position: 'absolute', 
      left: '-9999px', 
      top: '-9999px', 
      opacity: 0, 
      visibility: 'hidden', 
      height: 0, 
      width: 0 
    }
  })),
  
  React.createElement('div', null,
    React.createElement('label', {
      htmlFor: "email",
      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    }, "Email Address"),
    React.createElement('div', { className: "relative" },
      React.createElement(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }),
      React.createElement('input', {
        id: "email",
        name: "email",
        type: "email",
        value: formData.email,
        onChange: handleInputChange,
        className: "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
        placeholder: "admin@hm-hcp.com",
        required: true
      }))),

  React.createElement('div', null,
    React.createElement('label', {
      htmlFor: "password",
      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    }, "Password"),
    React.createElement('div', { className: "relative" },
      React.createElement(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }),
      React.createElement('input', {
        id: "password",
        name: "password",
        type: showPassword ? 'text' : 'password',
        value: formData.password,
        onChange: handleInputChange,
        className: "w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
        placeholder: "Enter your password",
        required: true
      }),
      React.createElement('button', {
        type: "button",
        onClick: () => setShowPassword(!showPassword),
        className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      }, showPassword ? React.createElement(EyeOff, { className: "w-5 h-5" }) : React.createElement(Eye, { className: "w-5 h-5" })))),

  React.createElement('div', { className: "flex items-center justify-between" },
    React.createElement('div', { className: "flex items-center" },
      React.createElement('input', {
        id: "remember",
        name: "remember",
        type: "checkbox",
        className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      }),
      React.createElement('label', {
        htmlFor: "remember",
        className: "ml-2 block text-sm text-gray-700 dark:text-gray-300"
      }, "Remember me")),
    React.createElement('button', {
      type: "button",
      onClick: () => setShowForgotPassword(true),
      className: "text-sm text-blue-600 dark:text-blue-400 hover:underline"
    }, "Forgot password?")),

  React.createElement('button', {
    type: "submit",
    disabled: isLoading,
    className: "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
  }, isLoading ? React.createElement(React.Fragment, null,
    React.createElement('div', { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
    "Signing In..."
  ) : React.createElement(React.Fragment, null,
    React.createElement(Shield, { className: "w-4 h-4" }),
    "Secure Sign In",
    React.createElement(ArrowRight, { className: "w-4 h-4" })
  ))),

  React.createElement('div', { className: "mt-6 text-center text-sm text-gray-600 dark:text-gray-400" },
    React.createElement('div', { className: "flex items-center justify-center gap-2 mb-2" },
      React.createElement(Shield, { className: "w-4 h-4 text-green-500" }),
      React.createElement('span', { className: "text-green-600 dark:text-green-400 font-medium" }, "Protected by advanced bot detection")),
    React.createElement('p', null,
      "Need access? Contact your administrator or ",
      React.createElement(Link, {
        href: "/contact",
        className: "text-blue-600 dark:text-blue-400 hover:underline"
      }, "request access")))))
}