/**
 * Admin Authentication Middleware
 * Provides middleware functions for admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from './admin-auth';

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

export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | any> {
  const user = await getAdminUser(request);
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return user;
}

// Export functions for backward compatibility
export const adminAuthMiddleware = withAdminAuth;
