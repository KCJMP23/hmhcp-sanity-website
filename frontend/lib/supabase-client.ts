// Production Supabase client for CMS functionality
// This supports the full CMS system deployment with proper error handling

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Validate environment variables
function validateClientConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase client environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
    throw new Error('Supabase environment variables contain placeholder values. Please configure with actual Supabase project credentials.')
  }
  
  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey }
}

const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = validateClientConfig()

export const createClient = () => {
  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-application-name': 'hmhcp-production-client',
          'x-client-info': 'supabase-browser-client'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  } catch (error) {
    logger.error('Failed to create Supabase client', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// Export a default client instance
export const supabase = createClient()

// Admin client for server-side operations
export const supabaseAdmin = (() => {
  if (!supabaseServiceKey) {
    logger.warn('SUPABASE_SERVICE_ROLE_KEY not configured - admin operations will be limited')
    return createClient() // Fallback to anon client
  }
  
  if (supabaseServiceKey.includes('your-service-key')) {
    throw new Error('Supabase service key contains placeholder value. Please configure with actual service role key.')
  }
  
  try {
    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-application-name': 'hmhcp-production-admin',
          'x-client-info': 'supabase-admin-client'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  } catch (error) {
    logger.error('Failed to create Supabase admin client', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
})()

// Alternative clients for specific use cases
export const supabaseCacheReset = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'x-schema-version': Date.now().toString(),
      'x-application-name': 'hmhcp-cache-reset',
      'x-client-info': 'supabase-cache-client'
    }
  },
  db: {
    schema: 'public'
  }
})

export const supabaseMinimal = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'x-application-name': 'hmhcp-minimal',
      'x-client-info': 'supabase-minimal-client'
    }
  },
  db: {
    schema: 'public'
  }
})

// Function to test connection and force schema refresh
export async function forceSchemaRefresh() {
  try {
    logger.info('Testing Supabase connection and schema refresh')
    
    const { error } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)
    
    if (error) {
      // Expected if tables don't exist yet
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        logger.info('Schema refresh completed - tables not deployed yet', { error: error.message })
      } else {
        logger.error('Schema refresh failed with unexpected error', { error: error.message })
        throw error
      }
    } else {
      logger.info('Schema refresh successful - connection verified')
    }
  } catch (error) {
    logger.error('Schema refresh exception', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// Connection health check
export async function testConnection(): Promise<{
  success: boolean
  error?: string
  responseTime: number
}> {
  const startTime = Date.now()
  
  try {
    const { error } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    // Consider successful even if table doesn't exist
    const success = !error || 
      error.message?.includes('relation') || 
      error.message?.includes('does not exist')
    
    return {
      success,
      error: success ? undefined : error?.message,
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return {
      success: false,
      error: errorMessage,
      responseTime
    }
  }
}

// Export types for better type safety
export type SupabaseClient = ReturnType<typeof createClient>

// Export configuration validation for external use
export { validateClientConfig }

// Export environment check
export function isProductionConfigured(): boolean {
  try {
    validateClientConfig()
    return true
  } catch {
    return false
  }
}

// Backward compatibility alias
export { createClient as createSupabaseClient }