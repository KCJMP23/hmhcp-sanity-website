import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function verifyAuth(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { authenticated: false, user: null };
  }
  
  return { authenticated: true, user };
}

export async function requireAuth(request: NextRequest) {
  const { authenticated, user } = await verifyAuth(request);
  
  if (!authenticated) {
    throw new Error('Unauthorized');
  }
  
  return user;
}