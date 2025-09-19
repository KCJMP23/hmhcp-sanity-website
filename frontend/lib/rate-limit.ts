// Re-export from security module
export * from './security/rate-limiting';

// Additional exports for backward compatibility
export { createRateLimitMiddleware as rateLimitMiddleware } from './security/rate-limiting';
export const getRateLimitConfig = (): any => ({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});