/**
 * Server-side CSRF utilities
 * This module exports functions that can only be used in server components
 */

// Re-export server-side functions from the CSRF module
export { 
  generateCSRFToken, 
  verifyCSRFTokenWithSecret, 
  getCSRFTokenFromCookies,
  getCSRFSecretFromCookies,
  verifyCSRFToken,
  requireCSRFToken,
  type CSRFConfig 
} from './csrf/index'