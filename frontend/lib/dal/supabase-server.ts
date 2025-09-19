/**
 * Server-only Supabase client
 * This file can only be imported in server components
 */

import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { mockSupabaseAdmin, isUsingMockSupabase } from './mock-supabase'
import { logger } from '@/lib/logging/client-safe-logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key'

// Server-side Supabase client
export function createServerSupabaseClient() {
  if (isUsingMockSupabase()) {
    return mockSupabaseAdmin
  }

  try {
    const cookieStore = cookies()
    
    return createSSRClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
  } catch (error) {
    logger.error('Failed to create server Supabase client', { error })
    return mockSupabaseAdmin
  }
}

// Admin client for server-side operations
export function createAdminSupabaseClient() {
  if (isUsingMockSupabase()) {
    return mockSupabaseAdmin
  }

  try {
    const { createClient } = require('@supabase/supabase-js')
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } catch (error) {
    logger.error('Failed to create admin Supabase client', { error })
    return mockSupabaseAdmin
  }
}
