'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export function DiagnosticOverlay() {
  const [mounted, setMounted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    
    // Check for common issues
    const issues = []
    
    // Check if Tailwind is loaded
    const computedStyles = window.getComputedStyle(document.body)
    if (!computedStyles.fontFamily.includes('ui-sans-serif')) {
      issues.push('Tailwind CSS may not be loading properly')
    }
    
    // Check for hidden elements
    const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], [style*="opacity: 0"]')
    if (hiddenElements.length > 0) {
      issues.push(`Found ${hiddenElements.length} hidden elements`)
    }
    
    // Check for React errors
    if (window.console && window.console.error) {
      const originalError = window.console.error
      window.console.error = function(...args) {
        issues.push(`Console error: ${args.join(' ')}`)
        originalError.apply(window.console, args)
      }
    }
    
    setErrors(issues)
  }, [])

  if (!mounted) return null

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        zIndex: 9999,
        fontSize: '14px'
      }}
    >
      <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
        Page Diagnostic
      </h3>
      <div>
        <strong>Status:</strong> {errors.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-green-400">
            <CheckCircle className="w-4 h-4" />
            Page is rendering
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-400">
            <XCircle className="w-4 h-4" />
            Issues detected
          </span>
        )}
      </div>
      {errors.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>Issues:</strong>
          <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
        Press Ctrl+Shift+D to hide this overlay
      </div>
    </div>
  )
}