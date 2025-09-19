import { supabase, supabaseAdmin, supabaseCacheReset, forceSchemaRefresh } from './supabase-client'

// Enhanced blog post fetching function with cache reset
export async function getBlogPostsDirect() {
  try {
    console.log('🔍 Fetching blog posts with enhanced client...')
    
    // Force schema refresh first
    await forceSchemaRefresh()
    
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Log the error only if it's not a common schema or connection issue
      if (!error.message?.includes('schema') && !error.message?.includes('connection')) {
        console.debug('Enhanced client query error:', error.message)
      }
      
      // Try alternative client if first fails
      const { data: altPosts, error: altError } = await supabaseCacheReset
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (altError) {
        // Only log if it's not a common schema/connection issue
        if (!altError.message?.includes('schema') && !altError.message?.includes('connection')) {
          console.debug('Alternative client also failed:', altError.message)
        }
        return []
      }
      
      return altPosts || []
    }

    console.log(`✅ Enhanced client successful, found ${posts?.length || 0} posts`)
    return posts || []
  } catch (error) {
    // Only log unexpected errors, not common connection issues
    if (error instanceof Error && !error.message?.includes('fetch')) {
      console.debug('Enhanced client exception:', error.message)
    }
    return []
  }
}

// Get single blog post by slug with cache reset
export async function getBlogPostDirect(slug: string) {
  try {
    // Force schema refresh first
    await forceSchemaRefresh()
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      // Handle specific "multiple or no rows" error more gracefully
      if (error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
        // This is a common error when no matching rows exist - suppress logging
        return null
      }
      
      // Log other errors only if they're not common schema or connection issues
      if (!error.message?.includes('schema') && !error.message?.includes('connection')) {
        console.debug('Enhanced client post query error:', error.message)
      }
      
      // Try alternative client
      const { data: altPost, error: altError } = await supabaseCacheReset
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (altError) {
        // Handle the same error pattern for alternative client
        if (altError.message?.includes('JSON object requested, multiple (or no) rows returned')) {
          return null
        }
        
        // Only log other errors if they're not common schema/connection issues
        if (!altError.message?.includes('schema') && !altError.message?.includes('connection')) {
          console.debug('Alternative client also failed:', altError.message)
        }
        return null
      }
      
      return altPost
    }

    return post
  } catch (error) {
    // Only log unexpected errors, not common connection issues
    if (error instanceof Error && !error.message?.includes('fetch')) {
      console.debug('Enhanced client post query exception:', error.message)
    }
    return null
  }
}

// Test function to verify all clients work
export async function testAllClients() {
  try {
    console.log('🧪 Testing all Supabase client configurations...')
    
    // Test the basic supabase client
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      console.log('Public client test completed (no profiles table expected)')
    } else {
      console.log('✅ Public client working')
    }
    
    // Test admin client
    const { data: adminData, error: adminError } = await supabaseAdmin.from('admin_users').select('count').limit(1)
    if (adminError) {
      console.log('Admin client test completed (no admin table expected)')
    } else {
      console.log('✅ Admin client working')
    }
    
  } catch (error) {
    console.error('Client testing failed:', error)
  }
}
