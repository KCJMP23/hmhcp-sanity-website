/**
 * Client-side CSRF utilities
 * This module contains only client-safe code
 */

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_FORM_FIELD = 'csrf_token'

/**
 * Hook to use CSRF token in client components
 */
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    throw new Error('useCSRFToken can only be used in client components')
  }
  
  const getToken = () => {
    // Try multiple sources for the token
    const tokenFromWindow = (window as any).__CSRF_TOKEN__
    const tokenFromMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    const tokenFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${CSRF_TOKEN_NAME}=`))
      ?.split('=')[1]
    
    return tokenFromWindow || tokenFromMeta || tokenFromCookie || null
  }
  
  const addToHeaders = (headers: HeadersInit = {}): HeadersInit => {
    const token = getToken()
    if (!token) return headers
    
    if (headers instanceof Headers) {
      headers.set(CSRF_HEADER_NAME, token)
      return headers
    }
    
    return {
      ...headers,
      [CSRF_HEADER_NAME]: token
    }
  }
  
  const addToFormData = (formData: FormData): FormData => {
    const token = getToken()
    if (token) {
      formData.set(CSRF_FORM_FIELD, token)
    }
    return formData
  }
  
  const addToBody = <T extends Record<string, any>>(body: T): T & { csrf_token: string } => {
    const token = getToken()
    return {
      ...body,
      [CSRF_FORM_FIELD]: token || ''
    }
  }
  
  return {
    token: getToken(),
    addToHeaders,
    addToFormData,
    addToBody,
    headerName: CSRF_HEADER_NAME,
    fieldName: CSRF_FORM_FIELD
  }
}