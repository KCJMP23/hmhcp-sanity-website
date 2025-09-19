/**
 * Data Transformation Layer
 * 
 * This module provides unified data access and transformation functions
 * to ensure consistent data structure across frontend and backend.
 */

import { createServerSupabaseClient } from './supabase/server'

// Unified interfaces that frontend components expect
export interface UnifiedBlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  date: string
  readTime: string
  category: string
  image: string | null
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  sections?: Array<{
    sectionTitle: string
    sectionId: string
    content: string
    media?: string
    mediaAlt?: string
    mediaCaption?: string
  }>
}

export interface UnifiedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  isActive: boolean
  avatarUrl?: string
  bio?: string
  department?: string
}

export interface UnifiedMedia {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  altText?: string
  caption?: string
  tags: string[]
  uploadedBy?: string
  createdAt: string
}

export interface UnifiedContent {
  id: string
  type: 'page' | 'post' | 'blog_post' | 'service' | 'platform'
  title: string
  slug: string
  content: any
  excerpt?: string
  status: 'draft' | 'published' | 'archived'
  authorId?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  metaTitle?: string
  metaDescription?: string
  tags: string[]
  featuredImage?: string
}

/**
 * Transform blog post from database format to unified frontend format
 */
export function transformBlogPost(dbPost: any): UnifiedBlogPost {
  return {
    id: dbPost.id,
    title: dbPost.title,
    slug: dbPost.slug,
    content: dbPost.content || '',
    excerpt: dbPost.excerpt || '',
    author: dbPost.author || 'HMHCP Team',
    date: dbPost.published_at || dbPost.created_at,
    readTime: '5 min read', // Default value
    category: 'Healthcare', // Default value
    image: dbPost.featured_image || null,
    tags: dbPost.tags || [],
    status: dbPost.status || 'draft',
    publishedAt: dbPost.published_at,
    createdAt: dbPost.created_at,
    updatedAt: dbPost.updated_at,
    sections: [] // Default empty sections
  }
}

/**
 * Transform user profile from database format to unified frontend format
 */
export function transformUser(dbUser: any): UnifiedUser {
  return {
    id: dbUser.id,
    email: dbUser.email || '',
    firstName: dbUser.first_name || '',
    lastName: dbUser.last_name || '',
    fullName: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || 'Unknown User',
    role: dbUser.role || 'viewer',
    isActive: dbUser.is_active !== false,
    avatarUrl: dbUser.avatar_url,
    bio: dbUser.bio,
    department: dbUser.department
  }
}

/**
 * Transform media from database format to unified frontend format
 */
export function transformMedia(dbMedia: any): UnifiedMedia {
  return {
    id: dbMedia.id,
    filename: dbMedia.filename,
    url: dbMedia.url,
    mimeType: dbMedia.mime_type,
    size: dbMedia.size,
    altText: dbMedia.alt_text,
    caption: dbMedia.caption,
    tags: dbMedia.tags || [],
    uploadedBy: dbMedia.uploaded_by,
    createdAt: dbMedia.created_at
  }
}

/**
 * Transform content from database format to unified frontend format
 */
export function transformContent(dbContent: any): UnifiedContent {
  return {
    id: dbContent.id,
    type: dbContent.type,
    title: dbContent.title,
    slug: dbContent.slug,
    content: dbContent.content,
    excerpt: dbContent.excerpt,
    status: dbContent.status,
    authorId: dbContent.author_id,
    publishedAt: dbContent.published_at,
    createdAt: dbContent.created_at,
    updatedAt: dbContent.updated_at,
    metaTitle: dbContent.meta_title,
    metaDescription: dbContent.meta_description,
    tags: dbContent.tags || [],
    featuredImage: dbContent.featured_image_url
  }
}

/**
 * Transform mock blog post to unified format
 */
function transformMockBlogPost(mockPost: any): UnifiedBlogPost {
  return {
    id: mockPost.id,
    title: mockPost.title,
    slug: mockPost.slug,
    content: mockPost.content || '',
    excerpt: mockPost.excerpt || '',
    author: mockPost.author || 'HMHCP Team',
    date: mockPost.publishedAt || mockPost.updatedAt,
    readTime: mockPost.readTime ? `${mockPost.readTime} min read` : '5 min read',
    category: 'Healthcare', // Default category
    image: mockPost.featuredImage || null,
    tags: mockPost.tags || [],
    status: mockPost.status || 'published',
    publishedAt: mockPost.publishedAt,
    createdAt: mockPost.publishedAt,
    updatedAt: mockPost.updatedAt,
    sections: [] // Default empty sections
  }
}

/**
 * Get unified blog posts from both blog_posts and managed_content tables
 * Includes mock data fallback for comprehensive content
 */
export async function getUnifiedBlogPosts(): Promise<UnifiedBlogPost[]> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get blog posts from blog_posts table
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (blogError) {
      console.error('Error fetching blog posts:', blogError)
    }

    // Get blog posts from managed_content table
    const { data: managedPosts, error: managedError } = await supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'blog_post')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (managedError) {
      console.error('Error fetching managed content posts:', managedError)
    }

    // Transform and combine both sources
    const transformedBlogPosts = (blogPosts || []).map(transformBlogPost)
    const transformedManagedPosts = (managedPosts || []).map(transformBlogPost)

    // Combine database posts
    const allPosts = [...transformedBlogPosts, ...transformedManagedPosts]
    
    // If we have fewer than 10 posts, supplement with mock data
    if (allPosts.length < 10) {
      try {
        // Import mock posts dynamically to avoid build issues
        const { mockPosts } = await import('../lib/mock-data/blog-posts')
        
        // Get mock posts that aren't already in database (by slug)
        // Prioritize newer comprehensive posts (IDs 9 and above)
        const existingSlugs = new Set(allPosts.map(post => post.slug))
        const availableMockPosts = mockPosts
          .filter(mockPost => mockPost.status === 'published' && !existingSlugs.has(mockPost.slug))
          .sort((a, b) => parseInt(b.id) - parseInt(a.id)) // Sort by ID descending to prioritize newer posts
        
        const additionalMockPosts = availableMockPosts
          .map(transformMockBlogPost)
          .slice(0, 10 - allPosts.length) // Only take what we need to reach 10

        allPosts.push(...additionalMockPosts)
        console.log(`Added ${additionalMockPosts.length} mock posts to supplement database content`)
      } catch (mockError) {
        console.error('Error loading mock posts:', mockError)
      }
    }

    return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  } catch (error) {
    console.error('Error in getUnifiedBlogPosts:', error)
    
    // Fallback to mock data if database fails completely
    try {
      const { mockPosts } = await import('../lib/mock-data/blog-posts')
      return mockPosts
        .filter(mockPost => mockPost.status === 'published')
        .map(transformMockBlogPost)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (fallbackError) {
      console.error('Error loading fallback mock posts:', fallbackError)
      return []
    }
  }
}

/**
 * Get unified users from profiles table
 */
export async function getUnifiedUsers(): Promise<UnifiedUser[]> {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return (users || []).map(transformUser)
  } catch (error) {
    console.error('Error in getUnifiedUsers:', error)
    return []
  }
}

/**
 * Get unified media from media_library table
 */
export async function getUnifiedMedia(): Promise<UnifiedMedia[]> {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: media, error } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching media:', error)
      return []
    }

    return (media || []).map(transformMedia)
  } catch (error) {
    console.error('Error in getUnifiedMedia:', error)
    return []
  }
}

/**
 * Get unified content from managed_content table
 */
export async function getUnifiedContent(type?: string): Promise<UnifiedContent[]> {
  const supabase = await createServerSupabaseClient()
  
  try {
    let query = supabase
      .from('managed_content')
      .select('*')
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data: content, error } = await query

    if (error) {
      console.error('Error fetching content:', error)
      return []
    }

    return (content || []).map(transformContent)
  } catch (error) {
    console.error('Error in getUnifiedContent:', error)
    return []
  }
}

/**
 * Get dashboard statistics in unified format
 */
export async function getUnifiedDashboardStats() {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get counts from all relevant tables
    const [
      { count: pagesCount },
      { count: postsCount },
      { count: blogPostsCount },
      { count: usersCount },
      { count: mediaCount }
    ] = await Promise.all([
      supabase.from('managed_content').select('*', { count: 'exact', head: true }).eq('type', 'page'),
      supabase.from('managed_content').select('*', { count: 'exact', head: true }).eq('type', 'post'),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('media_library').select('*', { count: 'exact', head: true })
    ])

    // Get recent items
    const [
      { data: recentPages },
      { data: recentPosts },
      { data: recentBlogPosts },
      { data: recentMedia }
    ] = await Promise.all([
      supabase.from('managed_content').select('id,title,slug,updated_at,status').eq('type', 'page').order('updated_at', { ascending: false }).limit(5),
      supabase.from('managed_content').select('id,title,slug,updated_at,status').eq('type', 'post').order('updated_at', { ascending: false }).limit(5),
      supabase.from('blog_posts').select('id,title,slug,created_at,status').eq('status', 'published').order('created_at', { ascending: false }).limit(5),
      supabase.from('media_library').select('id,filename as name,url,created_at').order('created_at', { ascending: false }).limit(5)
    ])

    return {
      totalPages: pagesCount || 0,
      totalPosts: (postsCount || 0) + (blogPostsCount || 0),
      totalUsers: usersCount || 0,
      totalMedia: mediaCount || 0,
      recentPages: recentPages || [],
      recentPosts: recentPosts || [],
      recentBlogPosts: recentBlogPosts || [],
      recentMedia: recentMedia || [],
      breakdown: {
        managedContentPages: pagesCount || 0,
        managedContentPosts: postsCount || 0,
        blogPosts: blogPostsCount || 0,
        profiles: usersCount || 0,
        mediaLibrary: mediaCount || 0
      }
    }
  } catch (error) {
    console.error('Error in getUnifiedDashboardStats:', error)
    return {
      totalPages: 0,
      totalPosts: 0,
      totalUsers: 0,
      totalMedia: 0,
      recentPages: [],
      recentPosts: [],
      recentBlogPosts: [],
      recentMedia: [],
      breakdown: {
        managedContentPages: 0,
        managedContentPosts: 0,
        blogPosts: 0,
        profiles: 0,
        mediaLibrary: 0
      }
    }
  }
}
