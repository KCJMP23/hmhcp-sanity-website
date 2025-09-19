/**
 * API Gateway Pattern Implementation
 * Centralized request/response handling with standardized patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal/supabase-auth';
import { authRateLimiter, apiRateLimiter } from '@/lib/security/rate-limiting';
import { OWASPSecurity } from '@/lib/security/rate-limiting';
import logger from '@/lib/logging/winston-logger';

// Standardized API Response Interface
export interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters?: Record<string, any>;
    requestId: string;
    version: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  timestamp: string;
}

// Authentication Levels
export enum AuthLevel {
  NONE = 'none',
  USER = 'user', 
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Route Configuration
export interface RouteConfig {
  authLevel: AuthLevel;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  validation?: {
    body?: any; // Zod schema
    query?: any; // Zod schema
  };
  permissions?: string[];
}

export class APIGateway {
  private static requestId = 0;
  
  /**
   * Create a standardized API handler with middleware
   */
  static createHandler<T>(
    config: RouteConfig,
    handler: (req: NextRequest, context: any) => Promise<T>
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      const startTime = Date.now();
      const requestId = `req_${Date.now()}_${++this.requestId}`;
      
      try {
        // 1. Security Validation
        await this.validateSecurity(request, requestId);
        
        // 2. Rate Limiting
        await this.applyRateLimit(request, config, requestId);
        
        // 3. Authentication
        const user = await this.authenticate(request, config, requestId);
        
        // 4. Input Validation
        const validatedInput = await this.validateInput(request, config, requestId);
        
        // 5. Execute Handler
        const result = await handler(request, { 
          ...context, 
          user, 
          input: validatedInput,
          requestId 
        });
        
        // 6. Standardized Response
        return this.createSuccessResponse(result, {
          requestId,
          responseTime: Date.now() - startTime
        });
        
      } catch (error) {
        return this.createErrorResponse(error, {
          requestId,
          responseTime: Date.now() - startTime
        });
      }
    };
  }
  
  private static async validateSecurity(
    request: NextRequest, 
    requestId: string
  ): Promise<void> {
    const url = new URL(request.url);
    const body = request.method !== 'GET' ? await request.text() : '';
    
    // Check for common vulnerabilities
    const securityCheck = OWASPSecurity.scanForVulnerabilities(
      `${url.pathname}${url.search}${body}`
    );
    
    if (securityCheck.risk === 'high') {
      logger.warn('High risk security scan detected', {
        requestId,
        vulnerabilities: securityCheck.vulnerabilities,
        ip: request.ip
      });
      
      throw new APIError('SECURITY_VIOLATION', 'Request blocked for security reasons', 403);
    }
  }
  
  private static async applyRateLimit(
    request: NextRequest,
    config: RouteConfig,
    requestId: string
  ): Promise<void> {
    const identifier = this.getClientIdentifier(request);
    
    // Use auth rate limiter for authentication endpoints
    const limiter = request.url.includes('/auth/') ? authRateLimiter : apiRateLimiter;
    
    const result = limiter.checkLimit(identifier);
    
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        requestId,
        identifier,
        remaining: result.remaining,
        resetTime: result.resetTime
      });
      
      throw new APIError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, {
        retryAfter: result.retryAfter
      });
    }
  }
  
  private static async authenticate(
    request: NextRequest,
    config: RouteConfig,
    requestId: string
  ) {
    if (config.authLevel === AuthLevel.NONE) {
      return null;
    }
    
    const session = await verifySession();
    
    if (!session?.user) {
      logger.warn('Authentication required but no session found', { requestId });
      throw new APIError('AUTHENTICATION_REQUIRED', 'Authentication required', 401);
    }
    
    const userRole = session.user.user_metadata?.role || 'user';
    
    // Check authorization level
    switch (config.authLevel) {
      case AuthLevel.ADMIN:
        if (!['admin', 'super_admin', 'editor'].includes(userRole)) {
          throw new APIError('INSUFFICIENT_PERMISSIONS', 'Admin access required', 403);
        }
        break;
      case AuthLevel.SUPER_ADMIN:
        if (userRole !== 'super_admin') {
          throw new APIError('INSUFFICIENT_PERMISSIONS', 'Super admin access required', 403);
        }
        break;
    }
    
    return session.user;
  }
  
  private static async validateInput(
    request: NextRequest,
    config: RouteConfig,
    requestId: string
  ) {
    const result: any = {};
    
    if (config.validation?.query) {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      result.query = config.validation.query.parse(queryParams);
    }
    
    if (config.validation?.body && request.method !== 'GET') {
      const body = await request.json();
      result.body = config.validation.body.parse(body);
    }
    
    return result;
  }
  
  private static createSuccessResponse<T>(
    data: T,
    meta: { requestId: string; responseTime: number }
  ): NextResponse {
    const response: APIResponse<T> = {
      success: true,
      data,
      meta: {
        requestId: meta.requestId,
        version: 'v1',
        ...((data as any)?.meta || {})
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': meta.requestId,
        'X-Response-Time': `${meta.responseTime}ms`,
        ...OWASPSecurity.generateSecureHeaders()
      }
    });
  }
  
  private static createErrorResponse(
    error: any,
    meta: { requestId: string; responseTime: number }
  ): NextResponse {
    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details = undefined;
    
    if (error instanceof APIError) {
      status = error.status;
      code = error.code;
      message = error.message;
      details = error.details;
    } else if (error.name === 'ZodError') {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = 'Invalid input data';
      details = error.errors;
    }
    
    // Log error
    logger.error('API Error', {
      requestId: meta.requestId,
      code,
      message,
      details,
      stack: error.stack
    });
    
    const response: APIResponse = {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, {
      status,
      headers: {
        'X-Request-ID': meta.requestId,
        'X-Response-Time': `${meta.responseTime}ms`
      }
    });
  }
  
  private static getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    return forwarded || realIp || request.ip || 'unknown';
  }
}

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Usage Example for Posts Endpoint
export const postsAPIConfig: RouteConfig = {
  authLevel: AuthLevel.ADMIN,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  validation: {
    body: undefined // Would include Zod schema
  }
};