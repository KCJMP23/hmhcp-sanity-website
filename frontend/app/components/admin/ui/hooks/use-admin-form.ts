/**
 * Admin Form Hook
 * Form state management and validation for admin components
 */

import { useState, useCallback, useRef } from 'react'
import { z } from 'zod'
import type { AdminFormValidation, HealthcareValidation } from '../types'

interface FormField<T = any> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
}

interface UseAdminFormOptions<T> {
  initialValues: T
  validationSchema?: z.ZodSchema<T>
  validationRules?: Record<keyof T, AdminFormValidation>
  onSubmit?: (values: T) => void | Promise<void>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

interface UseAdminFormReturn<T> {
  values: T
  errors: Record<keyof T, string | undefined>
  touched: Record<keyof T, boolean>
  dirty: boolean
  isValid: boolean
  isSubmitting: boolean
  handleChange: (field: keyof T, value: any) => void
  handleBlur: (field: keyof T) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
  resetForm: () => void
  validateField: (field: keyof T) => string | undefined
  validateForm: () => boolean
}

/**
 * Hook for managing admin form state and validation
 */
export function useAdminForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  validationRules,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseAdminFormOptions<T>): UseAdminFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<keyof T, string | undefined>>({} as any)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as any)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const initialValuesRef = useRef(initialValues)
  
  // Check if form is dirty
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValuesRef.current)
  
  // Check if form is valid
  const isValid = Object.values(errors).every(error => !error)
  
  // Validate single field
  const validateField = useCallback((field: keyof T): string | undefined => {
    const value = values[field]
    
    // Zod schema validation
    if (validationSchema) {
      try {
        const fieldSchema = validationSchema.shape[field as string]
        if (fieldSchema) {
          fieldSchema.parse(value)
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message
        }
      }
    }
    
    // Custom validation rules
    if (validationRules && validationRules[field]) {
      const rules = validationRules[field]
      
      // Required validation
      if (rules.required && !value) {
        return `${String(field)} is required`
      }
      
      // Min length validation
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        return `${String(field)} must be at least ${rules.minLength} characters`
      }
      
      // Max length validation
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        return `${String(field)} must be no more than ${rules.maxLength} characters`
      }
      
      // Pattern validation
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return `${String(field)} format is invalid`
      }
      
      // Custom validation
      if (rules.custom) {
        const error = rules.custom(value)
        if (error) return error
      }
      
      // Healthcare validation
      if (rules.healthcare) {
        const healthcareError = validateHealthcareField(value, rules.healthcare)
        if (healthcareError) return healthcareError
      }
    }
    
    return undefined
  }, [values, validationSchema, validationRules])
  
  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<keyof T, string | undefined> = {} as any
    
    Object.keys(values).forEach(field => {
      const error = validateField(field as keyof T)
      if (error) {
        newErrors[field as keyof T] = error
      }
    })
    
    setErrors(newErrors)
    return Object.values(newErrors).every(error => !error)
  }, [values, validateField])
  
  // Handle field change
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    if (validateOnChange) {
      const error = validateField(field)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [validateField, validateOnChange])
  
  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    if (validateOnBlur) {
      const error = validateField(field)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [validateField, validateOnBlur])
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {} as Record<keyof T, boolean>)
    setTouched(allTouched)
    
    // Validate form
    const isFormValid = validateForm()
    
    if (isFormValid && onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validateForm, onSubmit])
  
  // Set field value programmatically
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    handleChange(field, value)
  }, [handleChange])
  
  // Set field error programmatically
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])
  
  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current)
    setErrors({} as any)
    setTouched({} as any)
  }, [])
  
  return {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validateField,
    validateForm,
  }
}

/**
 * Validate healthcare-specific field
 */
function validateHealthcareField(value: any, validation: HealthcareValidation): string | undefined {
  if (!value) return undefined
  
  if (validation.hipaaCompliant && validation.medicalDataType === 'PHI') {
    // Check for exposed PHI in plain text
    if (typeof value === 'string') {
      // Check for SSN pattern
      if (/\d{3}-\d{2}-\d{4}/.test(value) && !validation.sanitizationRequired) {
        return 'PHI data must be sanitized before display'
      }
    }
  }
  
  if (validation.validationPattern) {
    const pattern = new RegExp(validation.validationPattern)
    if (!pattern.test(String(value))) {
      return 'Invalid healthcare data format'
    }
  }
  
  return undefined
}