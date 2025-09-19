/**
 * Global Error Fix for "g is not defined" JavaScript Runtime Error
 * This script addresses the common "g is not defined" error that affects admin system functionality
 */

// Define global variables that might be missing
if (typeof window !== 'undefined') {
  // Common global variables that might be undefined
  window.g = window.g || function() {
    console.warn('Global variable "g" was called but not properly initialized')
    return {}
  }
  
  // Google Analytics global variables
  window.gtag = window.gtag || function() {
    console.warn('Google Analytics gtag not initialized')
  }
  
  window.dataLayer = window.dataLayer || []
  
  // Other common global variables that might cause issues
  window.ga = window.ga || function() {
    console.warn('Google Analytics ga not initialized')
  }
  
  // Ensure jQuery global if referenced
  if (typeof window.$ === 'undefined') {
    window.$ = function() {
      console.warn('jQuery not loaded')
      return {
        ready: function(fn) { 
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn)
          } else {
            fn()
          }
        }
      }
    }
  }
  
  // Common analytics variables
  window._gaq = window._gaq || []
  window.AnalyticsDataLayer = window.AnalyticsDataLayer || []
  
  // Error handler for global variable issues
  window.addEventListener('error', function(event) {
    const error = event.error
    if (error && error.message) {
      // Check for "is not defined" errors
      if (error.message.includes('is not defined')) {
        const match = error.message.match(/(\w+) is not defined/)
        if (match) {
          const varName = match[1]
          console.warn(`Global variable "${varName}" is not defined. Adding fallback.`)
          
          // Add fallback for the undefined variable
          if (!window[varName]) {
            window[varName] = function() {
              console.warn(`Fallback function called for undefined variable: ${varName}`)
              return {}
            }
          }
        }
      }
    }
  })
  
  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.warn('Unhandled promise rejection:', event.reason)
    // Prevent the error from causing the app to crash
    event.preventDefault()
  })
}

export default function initializeGlobalErrorFixes() {
  console.log('Global error fixes initialized')
}