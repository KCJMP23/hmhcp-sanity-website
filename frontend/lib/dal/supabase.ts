/**
 * Client-side Supabase client
 * This file can be imported in both client and server components
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { mockSupabaseAdmin, isUsingMockSupabase } from './mock-supabase'
import { logger } from '@/lib/logging/client-safe-logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key'

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL not found, using mock Supabase')
}

// Client for public operations
export const supabase = isUsingMockSupabase() 
  ? mockSupabaseAdmin as any
  : (() => {
      // Ensure we have valid credentials before creating client
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Missing Supabase credentials, falling back to mock')
        return mockSupabaseAdmin as any
      }
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        // Optimize for serverless environments
        global: {
          fetch: (...args) => fetch(...args),
          headers: {
            'User-Agent': 'hmhcp-website/1.0'
          }
        },
        // Connection optimization for Vercel
        db: {
          schema: 'public'
        }
      })
    })()

// Admin client for server-side operations
export function createAdminClient() {
  if (isUsingMockSupabase()) {
    return mockSupabaseAdmin as any
  }

  // Ensure we have valid credentials before creating client
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing Supabase admin credentials, falling back to mock')
    return mockSupabaseAdmin as any
  }

  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } catch (error) {
    logger.error('Failed to create admin Supabase client', { error })
    return mockSupabaseAdmin as any
  }
}

// Export the main client as default
export default supabase

// Re-export createClient for backward compatibility
export { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Wrapper function that uses our configured client
export function createClient() {
  if (isUsingMockSupabase()) {
    return mockSupabaseAdmin as any
  }

  // Ensure we have valid credentials before creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials, falling back to mock')
    return mockSupabaseAdmin as any
  }
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    // Optimize for serverless environments
    global: {
      fetch: (...args) => fetch(...args),
      headers: {
        'User-Agent': 'hmhcp-website/1.0'
      }
    },
    // Connection optimization for Vercel
    db: {
      schema: 'public'
    }
  })
}

// Server client functions are available in supabase-server.ts for server-side use only

// Export admin client as a function to avoid hoisting issues
export function getSupabaseAdmin() {
  if (isUsingMockSupabase()) {
    return mockSupabaseAdmin as any
  }
  
  // Ensure we have valid credentials before creating client
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing Supabase admin credentials, falling back to mock')
    return mockSupabaseAdmin as any
  }
  
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'User-Agent': 'hmhcp-website-admin/1.0'
      }
    }
  })
}

// For backward compatibility, export as function to avoid hoisting issues
export function supabaseAdmin() {
  return getSupabaseAdmin()
}