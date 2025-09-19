// Environment validation utilities

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Supabase environment variables not configured')
    return null
  }
  
  return { url, key }
}

export function validateEnvironment() {
  const issues: string[] = []
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
  }
  
  if (issues.length > 0) {
    console.warn('Environment validation issues:', issues)
    return false
  }
  
  return true
}