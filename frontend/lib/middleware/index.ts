/**
 * Middleware Index
 * 
 * This file exports all middleware functions for easy importing
 * across the application.
 */

// Authentication middleware
export {
  authenticateUser,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  withAuth,
  withAdminAuth,
  withSuperAdminAuth,
  type AuthenticatedUser,
  type AuthResult
} from './auth'

// Error handling middleware
export {
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleAuthorizationError,
  handleNotFoundError,
  handleRateLimitError,
  withErrorHandling,
  validateRequiredFields,
  sanitizeInput,
  type ApiError,
  type ApiResponse
} from './error-handling'

// Input validation middleware
export {
  validateRequestBody,
  validateQueryParams,
  withValidation,
  withQueryValidation,
  blogPostValidationRules,
  userProfileValidationRules,
  mediaValidationRules,
  type ValidationRule,
  type ValidationResult
} from './validation'

// Rate limiting middleware
export {
  withRateLimit,
  withCustomRateLimit,
  withUserRateLimit,
  withEndpointRateLimit,
  checkRateLimit,
  getRateLimitStats,
  resetRateLimit,
  resetAllRateLimits,
  defaultRateLimit,
  authRateLimit,
  adminRateLimit,
  type RateLimitConfig,
  type RateLimitInfo
} from './rate-limiting'

// Logging middleware
export {
  withLogging,
  withPerformanceLogging,
  withRequestBodyLogging,
  withResponseLogging,
  withComprehensiveLogging,
  getLoggingStats,
  defaultLoggingConfig,
  type LogEntry,
  type LoggingConfig
} from './logging'

// Combined middleware helpers
export {
  withStandardMiddleware,
  withAdminMiddleware,
  withPublicMiddleware
} from './combined'

// Utility functions
export {
  createMiddlewareChain,
  applyMiddleware
} from './utils'
