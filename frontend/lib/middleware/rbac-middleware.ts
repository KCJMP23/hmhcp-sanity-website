/**
 * RBAC Middleware for API Route Protection
 * Story 3.4: User Management & Role-Based Access Control
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedRBAC, EnhancedPermission } from '@/lib/auth/rbac-enhanced';
import { Permission } from '@/lib/auth/rbac-system';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import logger from '@/lib/logging/winston-logger';

export interface MiddlewareContext {
  userId: string;
  email: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Middleware to require specific permission for API route access
 */
export function requirePermission(permission: Permission | EnhancedPermission | string) {
  return async function middleware(
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse | Response> {
    try {
      // Get session from Supabase
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        logger.warn('Unauthorized access attempt', {
          path: request.nextUrl?.pathname || 'unknown',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        });

        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Build context for permission evaluation
      const evalContext: Record<string, any> = {
        userId: session.user.id,
        email: session.user.email,
        ...context?.params
      };

      // Check permission
      const hasPermission = await enhancedRBAC.checkPermission(
        session.user.id,
        permission,
        evalContext
      );

      if (!hasPermission) {
        // Log permission denial
        await logPermissionDenial(session.user.id, permission, request);

        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user context to request headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', session.user.id);
      requestHeaders.set('x-user-email', session.user.email || '');
      requestHeaders.set('x-session-id', session.access_token);

      // Continue with the request
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      logger.error('RBAC middleware error', { error, path: request.nextUrl?.pathname || 'unknown' });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Permission check failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to require one of multiple permissions
 */
export function requireAnyPermission(...permissions: (Permission | EnhancedPermission | string)[]) {
  return async function middleware(
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse | Response> {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const evalContext: Record<string, any> = {
        userId: session.user.id,
        email: session.user.email,
        ...context?.params
      };

      // Check if user has any of the required permissions
      for (const permission of permissions) {
        const hasPermission = await enhancedRBAC.checkPermission(
          session.user.id,
          permission,
          evalContext
        );

        if (hasPermission) {
          // User has at least one required permission
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set('x-user-id', session.user.id);
          requestHeaders.set('x-user-email', session.user.email || '');
          requestHeaders.set('x-session-id', session.access_token);

          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
        }
      }

      // User doesn't have any of the required permissions
      await logPermissionDenial(session.user.id, permissions[0], request);

      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    } catch (error) {
      logger.error('RBAC middleware error', { error, path: request.nextUrl?.pathname || 'unknown' });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Permission check failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to require all of multiple permissions
 */
export function requireAllPermissions(...permissions: (Permission | EnhancedPermission | string)[]) {
  return async function middleware(
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse | Response> {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const evalContext: Record<string, any> = {
        userId: session.user.id,
        email: session.user.email,
        ...context?.params
      };

      // Check if user has all required permissions
      for (const permission of permissions) {
        const hasPermission = await enhancedRBAC.checkPermission(
          session.user.id,
          permission,
          evalContext
        );

        if (!hasPermission) {
          await logPermissionDenial(session.user.id, permission, request);

          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // User has all required permissions
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', session.user.id);
      requestHeaders.set('x-user-email', session.user.email || '');
      requestHeaders.set('x-session-id', session.access_token);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      logger.error('RBAC middleware error', { error, path: request.nextUrl?.pathname || 'unknown' });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Permission check failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to require a specific role
 */
export function requireRole(roleName: string) {
  return async function middleware(
    request: NextRequest
  ): Promise<NextResponse | Response> {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user has the required role
      const hasRole = await enhancedRBAC.hasRole(session.user.id, roleName);

      if (!hasRole) {
        logger.warn('Role access denied', {
          userId: session.user.id,
          requiredRole: roleName,
          path: request.nextUrl?.pathname || 'unknown'
        });

        return NextResponse.json(
          { error: 'Forbidden', message: `Role '${roleName}' required` },
          { status: 403 }
        );
      }

      // User has the required role
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', session.user.id);
      requestHeaders.set('x-user-email', session.user.email || '');
      requestHeaders.set('x-user-role', roleName);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      logger.error('Role middleware error', { error, path: request.nextUrl?.pathname || 'unknown' });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Role check failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper function to log permission denials
 */
async function logPermissionDenial(
  userId: string,
  permission: Permission | EnhancedPermission | string,
  request: NextRequest
): Promise<void> {
  const permissionStr = typeof permission === 'string' 
    ? permission 
    : 'resource' in permission 
      ? `${permission.resource}:${permission.action}`
      : permission.toString();

  logger.warn('Permission denied', {
    userId,
    permission: permissionStr,
    path: request.nextUrl?.pathname || 'unknown',
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent')
  });

  // Log to database audit trail
  try {
    const { createServerClient } = await import('@supabase/ssr');
    const cookieStore = cookies();
    // Use anon key for audit logging - sufficient for insert operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    await supabase.from('user_activity_logs').insert({
      user_id: userId,
      action: 'PERMISSION_DENIED',
      resource_type: 'api_endpoint',
      details: {
        permission: permissionStr,
        path: request.nextUrl?.pathname || 'unknown',
        method: request.method
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    });
  } catch (error) {
    logger.error('Failed to log permission denial to database', { error });
  }
}

/**
 * Extract user context from request headers
 */
export function getUserContext(request: NextRequest): MiddlewareContext | null {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const sessionId = request.headers.get('x-session-id');

  if (!userId || !email || !sessionId) {
    return null;
  }

  return {
    userId,
    email,
    sessionId,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
    userAgent: request.headers.get('user-agent') || ''
  };
}