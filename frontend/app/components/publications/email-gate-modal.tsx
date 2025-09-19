"use client"

import { useState, useEffect } from 'react'
import { X, Download, Mail, User, Building, Phone, Briefcase, Check } from 'lucide-react'
import { Typography } from '@/components/ui/apple-typography'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'

interface EmailGateModalProps {
  isOpen: boolean
  onClose: () => void
  publication: {
    _key: string
    title: string
    type: string
    downloadUrl?: string
  }
  sessionId?: string
  onSuccess?: () => void
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  company: string
  job_title: string
  phone: string
  marketing_consent: boolean
}

interface FormErrors {
  first_name?: string
  last_name?: string
  email?: string
  company?: string
  job_title?: string
  phone?: string
}

export function EmailGateModal({ 
  isOpen, 
  onClose, 
  publication, 
  sessionId,
  onSuccess 
}: EmailGateModalProps) {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    job_title: '',
    phone: '',
    marketing_consent: false
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        company: '',
        job_title: '',
        phone: '',
        marketing_consent: false
      })
      setErrors({})
      setIsSuccess(false)
      setSubmitError(null)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isSubmitting, onClose])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '')
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Clear general submit error
    if (submitError) {
      setSubmitError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/publications/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publication_id: publication._key,
          publication_title: publication.title,
          publication_type: publication.type,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim().toLowerCase(),
          company: formData.company.trim(),
          job_title: formData.job_title.trim(),
          phone: formData.phone.trim(),
          marketing_consent: formData.marketing_consent,
          session_id: sessionId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form')
      }

      setIsSuccess(true)
      
      // Start download after a short delay to show success message
      setTimeout(() => {
        if (publication.downloadUrl) {
          // Create a temporary link to trigger download
          const link = document.createElement('a')
          link.href = publication.downloadUrl
          link.download = `${publication.title}.pdf`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // Mark download as completed if we have a lead_id
          if (data.lead_id) {
            fetch('/api/publications/download', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                lead_id: data.lead_id
              }),
            }).catch(console.error) // Don't fail if completion tracking fails
          }
        }
        
        // Close modal after download starts
        setTimeout(() => {
          onClose()
          onSuccess?.()
        }, 1500)
      }, 1000)

    } catch (error) {
      console.error('Error submitting email gate form:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Typography variant="heading4" className="font-semibold">
                  Download White Paper
                </Typography>
                <Typography variant="small" className="text-gray-600 dark:text-gray-400">
                  Please provide your information to access this resource
                </Typography>
              </div>
            </div>
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSuccess ? (
            <>
              {/* Publication Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <Typography variant="body" className="font-medium mb-2">
                  {publication.title}
                </Typography>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs font-semibold">
                    White Paper
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4" />
                      <span>First Name *</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        errors.first_name 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="John"
                      disabled={isSubmitting}
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4" />
                      <span>Last Name *</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        errors.last_name 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Doe"
                      disabled={isSubmitting}
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      errors.email 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="john.doe@example.com"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building className="w-4 h-4" />
                    <span>Company</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="ACME Healthcare"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Job Title</span>
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Healthcare Director"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      errors.phone 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="+1 (555) 123-4567"
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Marketing Consent */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="marketing-consent"
                    checked={formData.marketing_consent}
                    onChange={(e) => handleInputChange('marketing_consent', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="marketing-consent" className="text-xs text-gray-600 dark:text-gray-400">
                    I would like to receive updates about new research publications and healthcare insights. 
                    You can unsubscribe at any time.
                  </label>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {submitError}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <LiquidGlassButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Download White Paper</span>
                      </div>
                    )}
                  </LiquidGlassButton>
                </div>
              </form>

              {/* Privacy Notice */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Typography variant="small" className="text-blue-700 dark:text-blue-300">
                  Your information is secure and will only be used to provide you with the requested resource 
                  and occasional updates about our research. We respect your privacy and never sell your data.
                </Typography>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <Typography variant="heading4" className="mb-2">
                Thank You!
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-400 mb-4">
                Your download is starting automatically. If it doesn't start, please check your downloads folder.
              </Typography>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Processing download...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}