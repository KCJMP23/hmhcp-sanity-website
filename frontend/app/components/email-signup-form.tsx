'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailSignupFormProps {
  compact?: boolean
  className?: string
}

export function EmailSignupForm({ compact = false, className }: EmailSignupFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')

    try {
      // In a real implementation, this would call your newsletter API
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setStatus('success')
        setMessage('Thank you for subscribing!')
        setEmail('')
      } else {
        throw new Error('Subscription failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {status === 'success' ? (
          <div className="text-center py-2">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-green-600 font-medium">{message}</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-8"
                  disabled={status === 'loading'}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-full font-medium" 
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>

            {status === 'error' && (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{message}</span>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {status === 'success' ? (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Welcome aboard!</h3>
          <p className="text-gray-600">{message}</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={status === 'loading'}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe to Newsletter'}
            </Button>
          </form>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            Get the latest insights in healthcare innovation. Unsubscribe anytime.
          </p>
        </>
      )}
    </div>
  )
}