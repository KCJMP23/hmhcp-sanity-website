/**
 * Admin Authentication Utilities
 * Provides authentication helpers for admin routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/client-safe-logger';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export async function getAdminUser(request: NextRequest): Promise<AdminUser | null> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the session from the request
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      logger.warn('No valid session found for admin request', { error: error?.message });
      return null;
    }

    // Get user details from the session
    const user = session.user;
    
    if (!user) {
      logger.warn('No user found in session');
      return null;
    }

    // For demo purposes, return a mock admin user
    // In production, you would fetch this from your database
    return {
      id: user.id,
      email: user.email || 'admin@hmhcp.com',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin']
    };
  } catch (error) {
    logger.error('Error getting admin user', { error });
    return null;
  }
}

export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | AdminUser> {
  const adminUser = await getAdminUser(request);
  
  if (!adminUser) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return adminUser;
}

export function hasPermission(user: AdminUser, permission: string): boolean {
  return user.permissions.includes(permission) || user.permissions.includes('admin');
}

export function isAdmin(user: AdminUser): boolean {
  return user.role === 'admin' || user.permissions.includes('admin');
}

export const validateAdminRequest = async (request: any) => {
  // Placeholder for admin request validation
  return { success: true, user: null };
};

export const validateAdminAuth = async (request: any) => {
  // Placeholder for admin auth validation
  return { success: true, user: null };
};
