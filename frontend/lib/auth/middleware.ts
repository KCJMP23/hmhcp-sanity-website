/**
 * Authentication Middleware
 * Provides middleware functions for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from './admin-auth';

export async function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getAdminUser(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      return handler(request, user);
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export async function withAdminAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getAdminUser(request);
      
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      return handler(request, user);
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Export functions for backward compatibility
export const authMiddleware = withAuth;
