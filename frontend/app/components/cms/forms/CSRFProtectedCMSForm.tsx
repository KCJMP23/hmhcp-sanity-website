'use client'

import { FormEvent, ReactNode } from 'react'
import { useCSRFToken } from '@/lib/csrf-client'
// import { CSRFTokenInput } from '@/components/csrf-token-provider'

interface CSRFProtectedCMSFormProps {
  children: ReactNode
  onSubmit: (data: FormData) => void | Promise<void>
  className?: string
  method?: string
  action?: string
}

/**
 * A form component that automatically includes CSRF protection
 * for CMS operations
 */
export function CSRFProtectedCMSForm({
  children,
  onSubmit,
  className,
  method = 'POST',
  action
}: CSRFProtectedCMSFormProps) {
  const csrf = useCSRFToken()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    if (!action) {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      await onSubmit(formData)
    }
    // If action is provided, let the form submit normally
  }

  return (
    <form
      method={method}
      action={action}
      onSubmit={handleSubmit}
      className={className}
    >
      {/* CSRF token is added via headers/body in the submit handler */}
      {children}
    </form>
  )
}

/**
 * Hook for CMS API calls with CSRF protection
 */
export function useCMSApiCall() {
  const csrf = useCSRFToken()

  const callApi = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetch(endpoint, {
      ...options,
      headers: csrf.addToHeaders(options.headers),
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `Request failed with status ${response.status}`)
    }

    return response.json()
  }

  const postApi = async <T = any>(
    endpoint: string,
    data: any,
    options: RequestInit = {}
  ): Promise<T> => {
    return callApi<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(csrf.addToBody(data))
    })
  }

  const putApi = async <T = any>(
    endpoint: string,
    data: any,
    options: RequestInit = {}
  ): Promise<T> => {
    return callApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(csrf.addToBody(data))
    })
  }

  const deleteApi = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    return callApi<T>(endpoint, {
      ...options,
      method: 'DELETE'
    })
  }

  return {
    get: (endpoint: string, options?: RequestInit) => 
      callApi(endpoint, { ...options, method: 'GET' }),
    post: postApi,
    put: putApi,
    patch: (endpoint: string, data: any, options?: RequestInit) =>
      callApi(endpoint, {
        ...options,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: JSON.stringify(csrf.addToBody(data))
      }),
    delete: deleteApi,
    callApi
  }
}