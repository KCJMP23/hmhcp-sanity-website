/**
 * Production Security Hardening
 * Implements comprehensive security measures for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableRateLimiting: boolean;
  enableSecurityHeaders: boolean;
  enableAuditLogging: boolean;
  strictSSL: boolean;
  maxRequestSize: number;
  sessionTimeout: number;
}

interface SecurityHeaders {
  [key: string]: string;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDuration: number;
  skipSuccessfulRequests: boolean;
}

export class ProductionSecurityHardening {
  private readonly config: SecurityConfig;
  private readonly rateLimitStore = new Map<string, { count: number; resetTime: number; blocked?: number }>();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableCSP: true,
      enableHSTS: true,
      enableRateLimiting: true,
      enableSecurityHeaders: true,
      enableAuditLogging: true,
      strictSSL: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...config
    };
  }

  /**
   * Generate comprehensive security headers for production
   */
  public generateSecurityHeaders(): SecurityHeaders {
    const headers: SecurityHeaders = {};

    if (this.config.enableSecurityHeaders) {
      // Prevent clickjacking
      headers['X-Frame-Options'] = 'DENY';
      
      // Prevent MIME type sniffing
      headers['X-Content-Type-Options'] = 'nosniff';
      
      // Enable XSS protection
      headers['X-XSS-Protection'] = '1; mode=block';
      
      // Control referrer information
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
      
      // Disable DNS prefetching
      headers['X-DNS-Prefetch-Control'] = 'off';
      
      // Disable download of potentially harmful content
      headers['X-Download-Options'] = 'noopen';
      
      // Prevent Adobe Flash and PDF from running
      headers['X-Permitted-Cross-Domain-Policies'] = 'none';
      
      // Control browser features
      headers['Permissions-Policy'] = [
        'accelerometer=()',
        'ambient-light-sensor=()',
        'autoplay=()',
        'battery=()',
        'camera=()',
        'cross-origin-isolated=()',
        'display-capture=()',
        'document-domain=()',
        'encrypted-media=()',
        'execution-while-not-rendered=()',
        'execution-while-out-of-viewport=()',
        'fullscreen=()',
        'geolocation=()',
        'gyroscope=()',
        'keyboard-map=()',
        'magnetometer=()',
        'microphone=()',
        'midi=()',
        'navigation-override=()',
        'payment=()',
        'picture-in-picture=()',
        'publickey-credentials-get=()',
        'screen-wake-lock=()',
        'sync-xhr=()',
        'usb=()',
        'web-share=()',
        'xr-spatial-tracking=()'
      ].join(', ');
    }

    if (this.config.enableHSTS) {
      // Force HTTPS for 1 year, include subdomains, allow preload
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = this.generateCSPHeader();
    }

    return headers;
  }

  /**
   * Generate Content Security Policy header
   */
  private generateCSPHeader(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com *.vercel-insights.com *.google-analytics.com *.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: https: *.supabase.co *.googleusercontent.com *.vercel-analytics.com",
      "font-src 'self' data: fonts.gstatic.com",
      "connect-src 'self' *.supabase.co *.vercel-analytics.com *.vercel-insights.com *.google-analytics.com *.sentry.io",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "manifest-src 'self'",
      "worker-src 'self' blob:"
    ];

    return directives.join('; ');
  }

  /**
   * Apply rate limiting
   */
  public applyRateLimit(request: NextRequest, config?: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remaining: Infinity, resetTime: 0 };
    }

    const rateLimitConfig: RateLimitConfig = {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDuration: 60 * 60 * 1000, // 1 hour
      skipSuccessfulRequests: false,
      ...config
    };

    const clientId = this.getClientIdentifier(request);
    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;

    // Clean up old entries
    this.cleanupRateLimit(windowStart);

    const entry = this.rateLimitStore.get(clientId) || { count: 0, resetTime: now + rateLimitConfig.windowMs };

    // Check if client is currently blocked
    if (entry.blocked && entry.blocked > now) {
      return { allowed: false, remaining: 0, resetTime: entry.blocked };
    }

    // Reset window if expired
    if (entry.resetTime <= now) {
      entry.count = 0;
      entry.resetTime = now + rateLimitConfig.windowMs;
      entry.blocked = undefined;
    }

    // Check rate limit
    if (entry.count >= rateLimitConfig.maxRequests) {
      entry.blocked = now + rateLimitConfig.blockDuration;
      this.rateLimitStore.set(clientId, entry);
      return { allowed: false, remaining: 0, resetTime: entry.blocked };
    }

    // Increment counter
    entry.count++;
    this.rateLimitStore.set(clientId, entry);

    return {
      allowed: true,
      remaining: rateLimitConfig.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientIdentifier(request: NextRequest): string {
    // Try to get real IP from headers (for proxy setups)
    const realIP = request.headers.get('x-real-ip') ||
                   request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.ip ||
                   'unknown';

    // Include user agent for additional uniqueness
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Create hash of IP + User Agent for privacy
    return crypto.createHash('sha256').update(`${realIP}:${userAgent}`).digest('hex');
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimit(cutoff: number): void {
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime < cutoff && (!entry.blocked || entry.blocked < Date.now())) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Validate request security
   */
  public validateRequest(request: NextRequest): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check HTTPS in production
    if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
      issues.push('HTTPS required in production');
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-proto',
      'x-original-url',
      'x-rewrite-url'
    ];

    for (const header of suspiciousHeaders) {
      if (request.headers.get(header)) {
        issues.push(`Suspicious header detected: ${header}`);
      }
    }

    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > this.config.maxRequestSize) {
      issues.push(`Request size exceeds limit: ${contentLength} > ${this.config.maxRequestSize}`);
    }

    // Check for common attack patterns in URL
    const url = request.url;
    const attackPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
      /data:.*base64/i  // Data URI attacks
    ];

    for (const pattern of attackPatterns) {
      if (pattern.test(url)) {
        issues.push(`Suspicious URL pattern detected: ${pattern.source}`);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Log security events for audit
   */
  public logSecurityEvent(event: {
    type: string;
    clientId: string;
    request: NextRequest;
    details?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    if (!this.config.enableAuditLogging) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity,
      clientId: event.clientId,
      ip: event.request.ip || 'unknown',
      userAgent: event.request.headers.get('user-agent') || 'unknown',
      url: event.request.url,
      method: event.request.method,
      details: event.details
    };

    // In production, this should be sent to a proper logging service
    console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
  }

  /**
   * Create security middleware
   */
  public createSecurityMiddleware() {
    return (request: NextRequest) => {
      const response = NextResponse.next();

      // Apply security headers
      const securityHeaders = this.generateSecurityHeaders();
      for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value);
      }

      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.valid) {
        this.logSecurityEvent({
          type: 'INVALID_REQUEST',
          clientId: this.getClientIdentifier(request),
          request,
          details: { issues: validation.issues },
          severity: 'medium'
        });

        // Block obviously malicious requests
        if (validation.issues.some(issue => issue.includes('XSS') || issue.includes('injection'))) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      }

      // Apply rate limiting
      const rateLimit = this.applyRateLimit(request);
      if (!rateLimit.allowed) {
        this.logSecurityEvent({
          type: 'RATE_LIMIT_EXCEEDED',
          clientId: this.getClientIdentifier(request),
          request,
          details: { resetTime: rateLimit.resetTime },
          severity: 'medium'
        });

        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString()
          }
        });
      }

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString());

      return response;
    };
  }

  /**
   * Validate environment security
   */
  public validateEnvironmentSecurity(): { secure: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      issues.push('NODE_ENV should be set to production');
    }

    // Check for debug flags
    if (process.env.DEBUG === 'true') {
      issues.push('DEBUG mode should be disabled in production');
    }

    // Check for required security env vars
    const requiredSecurityVars = [
      'ENCRYPTION_KEY_COMPONENT_1',
      'ENCRYPTION_KEY_COMPONENT_2',
      'ENCRYPTION_KEY_SALT',
      'JWT_SECRET'
    ];

    for (const varName of requiredSecurityVars) {
      if (!process.env[varName]) {
        issues.push(`Missing required security variable: ${varName}`);
      } else if (process.env[varName]!.length < 32) {
        issues.push(`Security variable ${varName} is too short`);
      }
    }

    // Check HTTPS configuration
    if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')) {
      issues.push('Site URL should use HTTPS in production');
    }

    return { secure: issues.length === 0, issues };
  }
}

// Export singleton instance
export const securityHardening = new ProductionSecurityHardening();

// CLI usage
if (require.main === module) {
  const hardening = new ProductionSecurityHardening();
  const validation = hardening.validateEnvironmentSecurity();
  
  if (validation.secure) {
    console.log('✅ Security validation passed');
    process.exit(0);
  } else {
    console.error('❌ Security validation failed:');
    validation.issues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  }
}