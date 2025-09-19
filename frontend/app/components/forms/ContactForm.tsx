'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'
import { Typography } from '@/components/ui/apple-typography'
import { Loader2, Send, CheckCircle, AlertCircle, Shield, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Healthcare-focused form validation schema
const contactFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long'),
  email: z.string().email('Please enter a valid email address').max(254, 'Email too long'),
  phone: z.string().optional().refine((val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, '')), {
    message: 'Please enter a valid phone number',
  }),
  organization: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name too long'),
  role: z.string().min(1, 'Please select your role'),
  inquiryType: z.string().min(1, 'Please select an inquiry type'),
  department: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message too long'),
  urgency: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select urgency level',
  }),
  newsletter: z.boolean(),
  privacy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy',
  }),
  hipaaDisclaimer: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the HIPAA disclaimer',
  }),
  // Anti-spam honeypot fields (should remain empty)
  website: z.string().optional(),
  company: z.string().optional(),
  // Timestamp for timing validation
  formStartTime: z.string().optional(),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

interface ContactFormProps {
  className?: string
  onSuccess?: () => void
}

// CSRF Token Helper
const getCSRFToken = (): string => {
  if (typeof window === 'undefined') return ''
  
  // Try multiple sources for CSRF token
  const tokenFromWindow = (window as any).__CSRF_TOKEN__
  const tokenFromMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  const tokenFromCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1]
  
  return tokenFromWindow || tokenFromMeta || tokenFromCookie || ''
}

export function ContactForm({ className, onSuccess }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [csrfToken, setCSRFToken] = useState<string>('')

  // Initialize CSRF token
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const token = getCSRFToken()
        if (token) {
          setCSRFToken(token)
        } else {
          // Fetch from API if not available
          const response = await fetch('/api/auth/csrf-token')
          if (response.ok) {
            const data = await response.json()
            setCSRFToken(data.token)
          }
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error)
      }
    }
    
    fetchCSRFToken()
    
    // Set form start time for timing validation
    form.setValue('formStartTime', Date.now().toString())
  }, [])

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
      role: '',
      inquiryType: '',
      department: '',
      message: '',
      urgency: 'medium' as const,
      newsletter: false,
      privacy: false,
      hipaaDisclaimer: false,
      // Anti-spam honeypot fields (should remain empty)
      website: '',
      company: '',
      formStartTime: '',
    },
  })

  const onSubmit = async (formData: ContactFormValues) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Prepare submission data
      const submissionData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone || '',
        organization: formData.organization,
        department: formData.department || '',
        subject: `${formData.inquiryType} - ${formData.urgency.charAt(0).toUpperCase() + formData.urgency.slice(1)} Priority`,
        message: formData.message,
        recaptchaToken: 'test-token-development', // Development bypass token
        inquiryType: formData.inquiryType,
        urgency: formData.urgency,
        role: formData.role,
        source_page: typeof window !== 'undefined' ? window.location.pathname : '/contact',
        utm_source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null,
        utm_medium: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') : null,
        utm_campaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') : null,
        // Anti-spam honeypot fields
        website: formData.website || '',
        company: formData.company || '',
        formStartTime: formData.formStartTime || '',
        metadata: {
          inquiry_type: formData.inquiryType,
          role: formData.role,
          urgency: formData.urgency,
          newsletter_subscription: formData.newsletter,
          submitted_at: new Date().toISOString()
        }
      }

      // Submit to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to submit form')
      }
      
      setSubmitStatus('success')
      form.reset()
      onSuccess?.()
      
      // Reset success message after 8 seconds
      setTimeout(() => setSubmitStatus('idle'), 8000)
      
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('Too many')) {
          setErrorMessage('Too many requests. Please wait a few minutes before submitting again.')
        } else if (error.message.includes('CSRF') || error.message.includes('security')) {
          setErrorMessage('Security validation failed. Please refresh the page and try again.')
        } else if (error.message.includes('validation') || error.message.includes('Invalid')) {
          setErrorMessage('Please check your information and try again.')
        } else {
          setErrorMessage(error.message)
        }
      } else {
        setErrorMessage('Failed to submit form. Please try again or contact us directly.')
      }
      
      // Reset error message after 10 seconds
      setTimeout(() => {
        if (submitStatus === 'error') {
          setSubmitStatus('idle')
          setErrorMessage('')
        }
      }, 10000)
      
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={cn("w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm", className)}>
      <CardHeader className="text-center pb-8">
        <Typography as="h2" variant="heading1" className="text-gray-900">
          Get in Touch
        </Typography>
        <Typography as="p" variant="body" className="text-gray-600 max-w-2xl mx-auto">
          Connect with our healthcare technology experts. Fill out the form below and we'll respond within 24 hours with personalized insights for your organization.
        </Typography>
      </CardHeader>
      <CardContent>
        {/* HIPAA Compliance Notice */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important:</strong> Please do not include any protected health information (PHI) or sensitive patient data in your message. 
            This form is for general inquiries only and is not HIPAA-secure for transmitting PHI.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Organization fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Healthcare Organization <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Regional Medical Center" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="chief-executive">Chief Executive Officer</SelectItem>
                        <SelectItem value="chief-medical">Chief Medical Officer</SelectItem>
                        <SelectItem value="chief-information">Chief Information Officer</SelectItem>
                        <SelectItem value="chief-quality">Chief Quality Officer</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="physician">Physician</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="researcher">Researcher</SelectItem>
                        <SelectItem value="analyst">Data Analyst</SelectItem>
                        <SelectItem value="it-professional">IT Professional</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Department and Inquiry Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Quality Improvement, IT, Clinical Operations..." {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inquiryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inquiry Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="What can we help you with?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="platform-demo">Platform Demo & Consultation</SelectItem>
                        <SelectItem value="implementation">Implementation Services</SelectItem>
                        <SelectItem value="partnership">Strategic Partnership</SelectItem>
                        <SelectItem value="research-collaboration">Research Collaboration</SelectItem>
                        <SelectItem value="training-support">Training & Support</SelectItem>
                        <SelectItem value="technical-integration">Technical Integration</SelectItem>
                        <SelectItem value="pricing-proposal">Pricing & Proposals</SelectItem>
                        <SelectItem value="compliance-security">Compliance & Security</SelectItem>
                        <SelectItem value="general-inquiry">General Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Urgency Level */}
            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low - General inquiry, no rush</SelectItem>
                      <SelectItem value="medium">Medium - Standard business inquiry</SelectItem>
                      <SelectItem value="high">High - Urgent business need</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Helps us prioritize and route your inquiry appropriately
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message field */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your healthcare organization's needs, challenges, and goals. What specific areas are you looking to improve? Please do not include any patient health information."
                      rows={5}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-sm">
                    Please provide detailed information about your organization's needs and objectives. 
                    <strong className="text-amber-600"> Do not include any protected health information (PHI) or patient data.</strong>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* HIPAA Disclaimer Checkbox */}
            <FormField
              control={form.control}
              name="hipaaDisclaimer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal text-amber-800">
                      <strong>HIPAA Compliance Acknowledgment</strong>{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormDescription className="text-amber-700 text-sm">
                      I understand that this form is not HIPAA-secure and I will not include any protected health 
                      information (PHI), patient data, or other confidential healthcare information in my message.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Newsletter checkbox */}
            <FormField
              control={form.control}
              name="newsletter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Subscribe to healthcare technology insights
                    </FormLabel>
                    <FormDescription>
                      Get the latest research updates, platform features, and industry insights delivered monthly
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Privacy policy checkbox */}
            <FormField
              control={form.control}
              name="privacy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      I agree to the{' '}
                      <a href="/privacy" className="text-blue-600 underline hover:text-blue-800">
                        Privacy Policy
                      </a>{' '}
                      and{' '}
                      <a href="/terms" className="text-blue-600 underline hover:text-blue-800">
                        Terms of Service
                      </a>{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Status messages */}
            {submitStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200 shadow-sm">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Message sent successfully!</strong> Our healthcare technology experts will review your inquiry and respond within 24 hours. 
                  You should receive a confirmation email shortly.
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200 shadow-sm">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Submission failed:</strong> {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Honeypot fields - invisible to users, visible to bots */}
            <div className="absolute left-[-5000px] overflow-hidden w-[1px] h-[1px]" aria-hidden="true">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (leave blank)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        tabIndex={-1}
                        autoComplete="off"
                        placeholder="Your website URL"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (leave blank)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        tabIndex={-1}
                        autoComplete="off"
                        placeholder="Company name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit button using LiquidGlassButton */}
            <div className="flex justify-center pt-4">
              <LiquidGlassButton
                variant="primary"
                size="lg"
                type="submit"
                disabled={isSubmitting || !csrfToken}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </LiquidGlassButton>
            </div>

            {/* Security and required fields note */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Protected by enterprise-grade security</span>
              </div>
              <Typography as="p" variant="caption" className="text-gray-500">
                <span className="text-red-500">*</span> Required fields | All communications are confidential
              </Typography>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}