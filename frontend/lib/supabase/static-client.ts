import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/env-validation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Static client for API routes and server actions that don't need auth
// This client doesn't use next/headers and is safe for build-time imports
export function createStaticSupabaseClient() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, operations will fail gracefully')
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl!, supabaseAnonKey!)
}

// Export default
export default createStaticSupabaseClient