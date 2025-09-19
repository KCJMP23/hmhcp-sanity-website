'use client';

import { logger } from '@/lib/logger';

// Enhanced rate limiting and API security
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
  onLimitReached?: (identifier: string) => void;
  whitelist?: string[];
  blacklist?: string[];
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface SecurityEvent {
  type: 'rate_limit' | 'brute_force' | 'suspicious_activity' | 'blocked_ip';
  identifier: string;
  timestamp: number;
  details: Record<string, any>;
}

class AdvancedRateLimiter {
  private static instance: AdvancedRateLimiter;
  private requests = new Map<string, { count: number; resetTime: number; attempts: number[] }>();
  private blockedIPs = new Set<string>();
  private suspiciousActivity = new Map<string, SecurityEvent[]>();
  private config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id) => id,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      whitelist: [],
      blacklist: [],
      ...config,
    };
  }
  
  static getInstance(config?: RateLimitConfig): AdvancedRateLimiter {
    if (!AdvancedRateLimiter.instance && config) {
      AdvancedRateLimiter.instance = new AdvancedRateLimiter(config);
    }
    return AdvancedRateLimiter.instance;
  }

  // Check if request is allowed
  checkLimit(identifier: string, isSuccess: boolean = true): RateLimitResult {
    // Check blacklist
    if (this.config.blacklist?.includes(identifier) || this.blockedIPs.has(identifier)) {
      this.logSecurityEvent('blocked_ip', identifier, { reason: 'blacklisted' });
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + this.config.windowMs,
        retryAfter: this.config.windowMs,
      };
    }

    // Check whitelist
    if (this.config.whitelist?.includes(identifier)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get or create request data
    let requestData = this.requests.get(key);
    if (!requestData || requestData.resetTime <= now) {
      requestData = {
        count: 0,
        resetTime: now + this.config.windowMs,
        attempts: [],
      };
    }

    // Clean old attempts
    requestData.attempts = requestData.attempts.filter(time => time > windowStart);

    // Skip counting based on configuration
    const shouldCount = !(this.config.skipSuccessfulRequests && isSuccess) &&
                       !(this.config.skipFailedRequests && !isSuccess);

    if (shouldCount) {
      requestData.count++;
      requestData.attempts.push(now);
    }

    // Update the map
    this.requests.set(key, requestData);

    const remaining = Math.max(0, this.config.maxRequests - requestData.count);
    const allowed = requestData.count <= this.config.maxRequests;

    if (!allowed) {
      this.handleRateLimitExceeded(identifier, requestData);
      return {
        allowed: false,
        remaining: 0,
        resetTime: requestData.resetTime,
        retryAfter: requestData.resetTime - now,
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime: requestData.resetTime,
    };
  }

  private handleRateLimitExceeded(identifier: string, requestData: any): void {
    this.logSecurityEvent('rate_limit', identifier, {
      count: requestData.count,
      limit: this.config.maxRequests,
      window: this.config.windowMs,
    });

    // Check for brute force patterns
    if (this.detectBruteForce(identifier, requestData)) {
      this.blockIP(identifier, 'brute_force_detected');
    }

    this.config.onLimitReached?.(identifier);
  }

  // Detect brute force attacks
  private detectBruteForce(identifier: string, requestData: any): boolean {
    const recentAttempts = requestData.attempts.filter(
      (time: number) => Date.now() - time < 60000 // Last minute
    );

    // If more than 20 requests in the last minute, consider it brute force
    if (recentAttempts.length > 20) {
      this.logSecurityEvent('brute_force', identifier, {
        attemptsInLastMinute: recentAttempts.length,
      });
      return true;
    }

    return false;
  }

  // Block IP address
  blockIP(identifier: string, reason: string, duration: number = 3600000): void {
    this.blockedIPs.add(identifier);
    
    this.logSecurityEvent('blocked_ip', identifier, {
      reason,
      duration,
      blockedAt: Date.now(),
    });

    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(identifier);
    }, duration);
  }

  // Log security events
  private logSecurityEvent(type: SecurityEvent['type'], identifier: string, details: Record<string, any>): void {
    const event: SecurityEvent = {
      type,
      identifier,
      timestamp: Date.now(),
      details,
    };

    // Store in suspicious activity log
    const events = this.suspiciousActivity.get(identifier) || [];
    events.push(event);
    
    // Keep only last 100 events per identifier
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    this.suspiciousActivity.set(identifier, events);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`Security Event [${type}]:`, { action: 'warning_logged', metadata: { identifier, details } });
    }

    // In production, you might want to send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service (Sentry, DataDog, etc.)
      this.sendToMonitoring(event);
    }
  }

  private async sendToMonitoring(event: SecurityEvent): Promise<void> {
    try {
      // Example: Send to your monitoring endpoint
      await fetch('/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      logger.error('Failed to send security event to monitoring:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    }
  }

  // Get statistics
  getStats(): {
    totalRequests: number;
    blockedIPs: number;
    suspiciousActivities: number;
    topOffenders: Array<{ identifier: string; events: number }>;
  } {
    const totalRequests = Array.from(this.requests.values())
      .reduce((sum, data) => sum + data.count, 0);

    const topOffenders = Array.from(this.suspiciousActivity.entries())
      .map(([identifier, events]) => ({ identifier, events: events.length }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);

    return {
      totalRequests,
      blockedIPs: this.blockedIPs.size,
      suspiciousActivities: this.suspiciousActivity.size,
      topOffenders,
    };
  }

  // Clean up old data
  cleanup(): void {
    const now = Date.now();
    
    // Clean expired request data
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime <= now) {
        this.requests.delete(key);
      }
    }

    // Clean old suspicious activity (older than 24 hours)
    const dayAgo = now - 24 * 60 * 60 * 1000;
    for (const [identifier, events] of this.suspiciousActivity.entries()) {
      const recentEvents = events.filter(event => event.timestamp > dayAgo);
      if (recentEvents.length === 0) {
        this.suspiciousActivity.delete(identifier);
      } else {
        this.suspiciousActivity.set(identifier, recentEvents);
      }
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Check if IP is blocked
  isBlocked(identifier: string): boolean {
    return this.blockedIPs.has(identifier) || this.config.blacklist?.includes(identifier) || false;
  }

  // Get suspicious activity for an identifier
  getSuspiciousActivity(identifier: string): SecurityEvent[] {
    return this.suspiciousActivity.get(identifier) || [];
  }
}

// Specialized rate limiters
export class APIRateLimiter extends AdvancedRateLimiter {
  constructor() {
    super({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // 1000 requests per 15 minutes
      keyGenerator: (ip) => `api:${ip}`,
    });
  }
}

export class AuthRateLimiter extends AdvancedRateLimiter {
  constructor() {
    super({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 login attempts per 15 minutes
      skipSuccessfulRequests: true, // Only count failed attempts
      keyGenerator: (identifier) => `auth:${identifier}`,
      onLimitReached: (identifier) => {
        logger.warn(`Authentication rate limit exceeded for: ${identifier}`, { action: 'warning_logged' });
      },
    });
  }
}

export class ContactFormRateLimiter extends AdvancedRateLimiter {
  constructor() {
    super({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 contact form submissions per hour
      keyGenerator: (ip) => `contact:${ip}`,
    });
  }
}

// OWASP Security utilities
export class OWASPSecurity {
  // Check for common vulnerabilities
  static scanForVulnerabilities(input: string): {
    vulnerabilities: string[];
    risk: 'low' | 'medium' | 'high';
  } {
    const vulnerabilities: string[] = [];
    let risk: 'low' | 'medium' | 'high' = 'low';

    // SQL Injection patterns
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/, // Basic SQL injection
      /(exec(\s|\+)+(s|x)p\w+)/i, // SQL Server stored procedures
      /union.*select/i, // UNION based injection
    ];

    if (sqlPatterns.some(pattern => pattern.test(input))) {
      vulnerabilities.push('Potential SQL Injection');
      risk = 'high';
    }

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /<iframe[^>]*>/gi, // Iframe tags
    ];

    if (xssPatterns.some(pattern => pattern.test(input))) {
      vulnerabilities.push('Potential XSS Attack');
      risk = risk === 'high' ? 'high' : 'medium';
    }

    // Path traversal
    if (input.includes('../') || input.includes('..\\')) {
      vulnerabilities.push('Path Traversal Attempt');
      risk = risk === 'high' ? 'high' : 'medium';
    }

    // Command injection
    const commandPatterns = [
      /(&|\||;|`|\$\(|\$\{)/,
      /(\|\||&&)/,
      /(nc|netcat|wget|curl)\s/i,
    ];

    if (commandPatterns.some(pattern => pattern.test(input))) {
      vulnerabilities.push('Potential Command Injection');
      risk = 'high';
    }

    return { vulnerabilities, risk };
  }

  // Generate secure headers for responses
  static generateSecureHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }

  // Validate Content Security Policy
  static validateCSP(csp: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!csp.includes("default-src")) {
      issues.push('Missing default-src directive');
    }
    
    if (csp.includes("'unsafe-eval'")) {
      issues.push('unsafe-eval allows code execution');
    }
    
    if (csp.includes("'unsafe-inline'") && !csp.includes('nonce-')) {
      issues.push('unsafe-inline without nonce is risky');
    }
    
    if (csp.includes('*') && !csp.includes('data:')) {
      issues.push('Wildcard (*) directive is too permissive');
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// Rate limiting middleware factory
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new AdvancedRateLimiter(config);
  
  return async (identifier: string, isSuccess: boolean = true): Promise<RateLimitResult> => {
    return limiter.checkLimit(identifier, isSuccess);
  };
}

// Default rate limiters
export const apiRateLimiter = new APIRateLimiter();
export const authRateLimiter = new AuthRateLimiter();
export const contactRateLimiter = new ContactFormRateLimiter();

// Cleanup interval (run every 5 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    apiRateLimiter.cleanup();
    authRateLimiter.cleanup();
    contactRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}