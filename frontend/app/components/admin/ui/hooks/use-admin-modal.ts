/**
 * Admin Modal Hook
 * Manages modal state and lifecycle for admin components
 */

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseAdminModalOptions {
  defaultOpen?: boolean
  onOpen?: () => void
  onClose?: () => void
  closeOnEsc?: boolean
  closeOnOverlay?: boolean
  preventScroll?: boolean
}

interface UseAdminModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (open: boolean) => void
}

/**
 * Hook for managing admin modal state
 */
export function useAdminModal({
  defaultOpen = false,
  onOpen,
  onClose,
  closeOnEsc = true,
  closeOnOverlay = true,
  preventScroll = true,
}: UseAdminModalOptions = {}): UseAdminModalReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  
  // Open modal
  const open = useCallback(() => {
    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement
    
    setIsOpen(true)
    onOpen?.()
  }, [onOpen])
  
  // Close modal
  const close = useCallback(() => {
    setIsOpen(false)
    onClose?.()
    
    // Restore focus to previous element
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [onClose])
  
  // Toggle modal
  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])
  
  // Set open state directly
  const setOpen = useCallback((newOpen: boolean) => {
    if (newOpen) {
      open()
    } else {
      close()
    }
  }, [open, close])
  
  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }
    
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, closeOnEsc, close])
  
  // Prevent scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return
    
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.setAttribute('data-scroll-locked', 'true')
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.removeAttribute('data-scroll-locked')
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.removeAttribute('data-scroll-locked')
    }
  }, [isOpen, preventScroll])
  
  // Manage ARIA attributes
  useEffect(() => {
    if (isOpen) {
      // Hide other content from screen readers
      const mainContent = document.getElementById('__next') || document.querySelector('main')
      if (mainContent) {
        mainContent.setAttribute('aria-hidden', 'true')
      }
    } else {
      // Restore ARIA attributes
      const mainContent = document.getElementById('__next') || document.querySelector('main')
      if (mainContent) {
        mainContent.removeAttribute('aria-hidden')
      }
    }
    
    return () => {
      const mainContent = document.getElementById('__next') || document.querySelector('main')
      if (mainContent) {
        mainContent.removeAttribute('aria-hidden')
      }
    }
  }, [isOpen])
  
  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
  }
}