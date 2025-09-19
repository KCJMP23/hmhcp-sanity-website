/**
 * DAL Client
 * Data Access Layer client for database operations
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { mockSupabaseAdmin, isUsingMockSupabase } from './mock-supabase'
import { logger } from '@/lib/logging/client-safe-logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key'

// Client for public (unauthenticated) operations
export const createDALClient = () => {
  if (isUsingMockSupabase()) {
    logger.info('Using mock DAL client')
    return mockSupabaseAdmin as any
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'User-Agent': 'hmhcp-website-dal/1.0'
      }
    }
  })
}

// Client for authenticated operations
export const createAuthenticatedDALClient = () => {
  if (isUsingMockSupabase()) {
    logger.info('Using mock authenticated DAL client')
    return mockSupabaseAdmin as any
  }

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookies().set({ name, value, ...options })
        } catch (error) {
          logger.warn('Could not set cookie in DAL client', { name, error: error.message })
        }
      },
      remove(name: string, options: any) {
        try {
          cookies().set({ name, value: '', ...options })
        } catch (error) {
          logger.warn('Could not remove cookie in DAL client', { name, error: error.message })
        }
      },
    },
    global: {
      headers: {
        'User-Agent': 'hmhcp-website-dal-auth/1.0'
      }
    }
  })
}

// Client for admin operations
export const createAdminDALClient = () => {
  if (isUsingMockSupabase()) {
    logger.info('Using mock admin DAL client')
    return mockSupabaseAdmin as any
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        'User-Agent': 'hmhcp-website-dal-admin/1.0'
      }
    }
  })
}

export default createDALClient
