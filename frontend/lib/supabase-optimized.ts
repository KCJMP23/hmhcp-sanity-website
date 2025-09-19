// Optimized Supabase client with lazy loading
import type { Database } from '@/types/database';

let supabaseClient: any = null;
let createClientModule: any = null;

// Lazy load Supabase client
export async function getSupabaseClient() {
  if (!supabaseClient) {
    if (!createClientModule) {
      // Dynamic import only when needed
      createClientModule = await import('@supabase/supabase-js');
    }
    
    const { createClient } = createClientModule;
    
    supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }
  
  return supabaseClient;
}

// Separate auth client for auth-only pages
export async function getSupabaseAuth() {
  const client = await getSupabaseClient();
  return client.auth;
}

// Separate database client for data operations
export async function getSupabaseDb() {
  const client = await getSupabaseClient();
  return client.from;
}

// Server-side client for API routes
export async function createServerSupabaseClient(req: any, res: any) {
  if (!createClientModule) {
    createClientModule = await import('@supabase/ssr');
  }
  
  const { createServerClient } = createClientModule;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies[name],
        set: (name: string, value: string, options: any) => {
          res.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`);
        },
        remove: (name: string) => {
          res.setHeader('Set-Cookie', `${name}=; Max-Age=0`);
        },
      },
    }
  );
}
