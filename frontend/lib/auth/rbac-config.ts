/**
 * RBAC System Configuration
 * Story 3.4: User Management & Role-Based Access Control
 */

/**
 * Cache configuration for RBAC system
 */
export const RBAC_CACHE_CONFIG = {
  /**
   * Permission cache TTL in seconds
   * Short enough to reflect changes quickly, long enough to reduce DB load
   */
  PERMISSION_CACHE_TTL: 300, // 5 minutes

  /**
   * User list cache TTL in seconds
   * Shorter TTL for frequently changing data
   */
  USER_LIST_CACHE_TTL: 30, // 30 seconds

  /**
   * Role list cache TTL in seconds
   * Longer TTL as roles change infrequently
   */
  ROLE_LIST_CACHE_TTL: 300, // 5 minutes

  /**
   * Group list cache TTL in seconds
   */
  GROUP_LIST_CACHE_TTL: 300, // 5 minutes

  /**
   * Individual resource cache TTL in seconds
   */
  RESOURCE_CACHE_TTL: 60, // 1 minute
} as const;

/**
 * API Rate Limiting Configuration
 */
export const RBAC_RATE_LIMITS = {
  /**
   * Maximum permission checks per user per minute
   */
  PERMISSION_CHECKS_PER_MINUTE: 100,

  /**
   * Maximum API key requests per minute (default)
   */
  API_KEY_DEFAULT_RATE_LIMIT: 100,

  /**
   * Maximum failed login attempts before account lock
   */
  MAX_LOGIN_ATTEMPTS: 5,

  /**
   * Account lock duration in minutes
   */
  LOCK_DURATION_MINUTES: 30,
} as const;

/**
 * Pagination Configuration
 */
export const RBAC_PAGINATION = {
  /**
   * Default page size for user lists
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum allowed page size
   */
  MAX_PAGE_SIZE: 100,

  /**
   * Minimum page size
   */
  MIN_PAGE_SIZE: 1,

  /**
   * Default page number
   */
  DEFAULT_PAGE: 1,
} as const;

/**
 * Session Configuration
 */
export const RBAC_SESSION_CONFIG = {
  /**
   * Session timeout in minutes for regular users
   */
  SESSION_TIMEOUT_MINUTES: 60,

  /**
   * Session timeout for admin users (shorter for security)
   */
  ADMIN_SESSION_TIMEOUT_MINUTES: 30,

  /**
   * Maximum concurrent sessions per user
   */
  MAX_CONCURRENT_SESSIONS: 3,

  /**
   * Time-boxed impersonation session duration in minutes
   */
  IMPERSONATION_SESSION_MINUTES: 30,

  /**
   * Temporary elevated permissions maximum duration in hours
   */
  TEMP_PERMISSION_MAX_HOURS: 24,
} as const;

/**
 * Bulk Operations Configuration
 */
export const RBAC_BULK_CONFIG = {
  /**
   * Maximum items per bulk operation
   */
  MAX_BULK_ITEMS: 100,

  /**
   * Chunk size for bulk imports
   */
  IMPORT_CHUNK_SIZE: 100,

  /**
   * Processing rate for bulk imports (users per second)
   */
  IMPORT_RATE_PER_SECOND: 10,
} as const;

/**
 * Database Configuration
 */
export const RBAC_DB_CONFIG = {
  /**
   * Connection pool size for RBAC operations
   */
  CONNECTION_POOL_SIZE: 20,

  /**
   * Query timeout in milliseconds
   */
  QUERY_TIMEOUT_MS: 5000,

  /**
   * Maximum retry attempts for failed queries
   */
  MAX_RETRY_ATTEMPTS: 3,

  /**
   * Retry delay in milliseconds
   */
  RETRY_DELAY_MS: 1000,
} as const;

/**
 * Security Configuration
 */
export const RBAC_SECURITY_CONFIG = {
  /**
   * Password minimum length
   */
  PASSWORD_MIN_LENGTH: 8,

  /**
   * Password salt rounds for bcrypt
   */
  PASSWORD_SALT_ROUNDS: 12,

  /**
   * Invitation expiry in days
   */
  INVITATION_EXPIRY_DAYS: 7,

  /**
   * Password reset token expiry in hours
   */
  PASSWORD_RESET_EXPIRY_HOURS: 1,

  /**
   * Require MFA for admin roles
   */
  ADMIN_MFA_REQUIRED: true,
} as const;

/**
 * Audit Configuration
 */
export const RBAC_AUDIT_CONFIG = {
  /**
   * Audit log retention in days
   */
  AUDIT_LOG_RETENTION_DAYS: 90,

  /**
   * Maximum audit export records
   */
  MAX_EXPORT_RECORDS: 10000,

  /**
   * Audit log batch size for cleanup
   */
  CLEANUP_BATCH_SIZE: 1000,
} as const;

/**
 * Performance Targets (for monitoring)
 */
export const RBAC_PERFORMANCE_TARGETS = {
  /**
   * Target time for permission checks (cached) in milliseconds
   */
  PERMISSION_CHECK_CACHED_MS: 50,

  /**
   * Target time for permission checks (uncached) in milliseconds
   */
  PERMISSION_CHECK_UNCACHED_MS: 200,

  /**
   * Target time for user list load (1000 users) in milliseconds
   */
  USER_LIST_LOAD_MS: 500,

  /**
   * Target time for role assignment in milliseconds
   */
  ROLE_ASSIGNMENT_MS: 300,

  /**
   * Target time for session validation in milliseconds
   */
  SESSION_VALIDATION_MS: 100,
} as const;