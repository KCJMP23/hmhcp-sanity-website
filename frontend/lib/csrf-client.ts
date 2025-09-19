/**
 * Client-safe CSRF utilities
 * This module only exports client-side functions that can be used in client components
 */

// Re-export only client-safe functions from the CSRF module
export { useCSRFToken } from './csrf/client'