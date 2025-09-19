import { createServerClient } from '@/lib/supabase-server'
import { getBlogPostsDirect, getBlogPostDirect } from '@/lib/db-direct'
import { BlogPost } from '@/types/blog'
import { getDynamicBlogPosts, getDynamicBlogPost } from '@/lib/content-sync'

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    console.log('🔍 Fetching blog posts...')
    
    // Use direct connection as primary method
    let posts: BlogPost[] = []
    try {
      posts = await getBlogPostsDirect()
      if (posts.length > 0) {
        console.log(`✅ Direct connection successful, found ${posts.length} posts`)
        return posts
      }
    } catch (directError) {
      console.log('Direct connection failed:', directError)
    }
    
    // If direct connection fails or returns empty, try server client as fallback
    try {
      const supabase = await createServerClient()
      const result = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      posts = result.data || []
      console.log(`✅ Server client successful, found ${posts.length} posts`)
      if (posts.length > 0) {
        return posts
      }
    } catch (e) {
      console.error('Server client query failed:', e)
    }
    
    // If both return empty arrays, use dynamic content store as fallback
    console.log('⚠️ Both connection methods returned empty arrays, using dynamic content store fallback')
    return getDynamicBlogPosts()
  } catch (error) {
    console.error('Error in getBlogPosts:', error)
    console.log('⚠️ Returning dynamic content due to error')
    return getDynamicBlogPosts()
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    console.log(`🔍 Fetching blog post: ${slug}`)
    
    // Use direct connection as primary method
    let post: BlogPost | null = null
    try {
      post = await getBlogPostDirect(slug)
      if (post) {
        console.log(`✅ Direct connection successful for post: ${post.title}`)
        return post
      }
    } catch (directError) {
      console.log('Direct connection failed:', directError)
    }
    
    // If direct connection fails or returns null, try server client as fallback
    try {
      const supabase = await createServerClient()
      const result = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (result.error) {
        console.log('Server client query error (expected if no post found):', result.error.message)
      } else if (result.data) {
        post = result.data
        console.log(`✅ Server client successful for post: ${post.title}`)
        return post
      }
    } catch (e) {
      console.log('Server client query failed:', e)
    }
    
    // If both fail or return null, use dynamic content store as fallback
    console.log('⚠️ Both connection methods failed or returned null, using dynamic content store fallback')
    const dynamicPost = getDynamicBlogPost(slug)
    if (dynamicPost) {
      console.log(`✅ Found dynamic post: ${dynamicPost.title}`)
      return dynamicPost
    }
    
    console.log(`❌ No dynamic post found for slug: ${slug}`)
    return null
  } catch (error) {
    console.error('Error in getBlogPost:', error)
    console.log('⚠️ Returning dynamic content due to error')
    return getDynamicBlogPost(slug)
  }
}

export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts()
    return posts.filter(post => post.tags?.includes(tag))
  } catch (error) {
    console.error('Error in getBlogPostsByTag:', error)
    return []
  }
}

export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts()
    // For now, we'll use tags as categories since we don't have a separate category field
    return posts.filter(post => post.tags?.some(tag => tag.toLowerCase().includes(category.toLowerCase())))
  } catch (error) {
    console.error('Error in getBlogPostsByCategory:', error)
    return []
  }
}

export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts()
    const searchTerm = query.toLowerCase()
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt?.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  } catch (error) {
    console.error('Error in searchBlogPosts:', error)
    return []
  }
}

export async function getRelatedPosts(currentSlug: string, limit: number = 3): Promise<BlogPost[]> {
  try {
    const currentPost = await getBlogPost(currentSlug)
    if (!currentPost) return []
    
    const posts = await getBlogPosts()
         const related = posts
       .filter(post => post.slug !== currentSlug)
       .filter(post => 
         post.tags?.some(tag => currentPost.tags?.includes(tag)) ||
         post.author === currentPost.author
       )
       .slice(0, limit)
    
    return related
  } catch (error) {
    console.error('Error in getRelatedPosts:', error)
    return []
  }
}
