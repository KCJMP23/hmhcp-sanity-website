/**
 * Supabase Client Utilities
 * Client-side Supabase configuration and helpers
 */

import { createClient } from '@supabase/supabase-js'
import { createClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'

// Client for browser usage
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'User-Agent': 'hmhcp-website-browser/1.0'
      }
    }
  })
}

// Client for server-side usage
export const createServerClient = () => {
  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookies().set({ name, value, ...options })
        } catch (error) {
          // Server components cannot set cookies
          console.warn('Could not set cookie in server component', { name, error: error.message })
        }
      },
      remove(name: string, options: any) {
        try {
          cookies().set({ name, value: '', ...options })
        } catch (error) {
          // Server components cannot remove cookies
          console.warn('Could not remove cookie in server component', { name, error: error.message })
        }
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'User-Agent': 'hmhcp-website-server/1.0'
      }
    }
  })
}

// Default client for browser usage
export const supabase = createBrowserClient()

export default supabase

// Re-export createClient for backward compatibility
export { createClient } from '@supabase/supabase-js'
