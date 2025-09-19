import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function createServerSupabaseClient(cookieStore?: Awaited<ReturnType<typeof import('next/headers').cookies>>) {
  try {
    // Get cookies on-demand if not provided
    if (!cookieStore) {
      // Dynamic import to avoid Next.js build issues
      const { cookies } = await /* @next-codemod-ignore The APIs under 'next/headers' are async now, need to be manually awaited. */
      import('next/headers')
      cookieStore = await cookies()
    }
    
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore cookie setting errors in read-only contexts like generateMetadata
            console.warn('Cookie setting failed (likely in read-only context):', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore cookie removal errors in read-only contexts
            console.warn('Cookie removal failed (likely in read-only context):', error)
          }
        },
      },
    })
  } catch (error) {
    // If cookies() fails (e.g., during build time), return a client without cookie handling
    // This is safe for build-time operations but should not be used in production requests
    if (error instanceof Error && error.message.includes('cookies')) {
      console.warn('Cookies not available, using fallback client')
      return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      })
    }
    throw error
  }
}

// Export as createClient for backward compatibility
export const createClient = createServerSupabaseClient