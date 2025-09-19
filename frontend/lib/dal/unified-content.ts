'use server'

import { supabaseAdmin } from './supabase'
import { getCurrentAdmin } from './admin-auth'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

interface UnifiedContent {
  id: string
  type: string
  title: string
  slug: string
  content: any
  status: 'draft' | 'published' | 'archived'
  author_id: string
  created_at: string
  updated_at: string
  published_at?: string
  meta_title?: string
  meta_description?: string
  excerpt?: string
  category?: string
  tags?: string[]
}

/**
 * Unified content management with Supabase as primary source
 * Provides comprehensive content management for headless CMS functionality
 */

// Create content in Supabase
export async function createUnifiedContent(
  type: string,
  title: string,
  slug: string,
  content: any,
  status: 'draft' | 'published' = 'draft'
) {
  const user = await getCurrentAdmin()
  if (!user) throw new Error('Authentication required')

  const contentId = uuidv4()
  
  try {
    // Create in Supabase as primary source
    const { data, error } = await supabaseAdmin()
      .from('managed_content')
      .insert({
        id: contentId,
        type,
        title,
        slug,
        content,
        status,
        author_id: (user as any).id,
        published_at: status === 'published' ? new Date().toISOString() : null,
        meta_title: content.meta_title || title,
        meta_description: content.meta_description || content.excerpt,
        excerpt: content.excerpt,
        category: content.category,
        tags: content.tags || []
      })
      .select()
      .single()

    if (error) throw error

    // Revalidate paths
    revalidatePath(`/${type}`)
    if (slug) revalidatePath(`/${type}/${slug}`)

    return data
  } catch (error) {
    console.error('Content creation error:', error)
    throw error
  }
}

// Update content in Supabase
export async function updateUnifiedContent(
  id: string,
  updates: Partial<UnifiedContent>
) {
  const user = await getCurrentAdmin()
  if (!user) throw new Error('Authentication required')

  // Get existing content from Supabase (safe query)
  const { data: existingResults, error: fetchError } = await supabaseAdmin()
    .from('managed_content')
    .select('*')
    .eq('id', id)
    .limit(1)

  const existing = existingResults && existingResults.length > 0 ? existingResults[0] : null

  if (fetchError || !existing) throw new Error('Content not found')

  try {
    const updateData: any = { ...updates }
    
    // Handle status changes
    if (updates.status === 'published' && existing.status !== 'published') {
      updateData.published_at = new Date().toISOString()
    } else if (updates.status === 'draft' && existing.status === 'published') {
      updateData.published_at = null
    }

    const { data, error } = await supabaseAdmin()
      .from('managed_content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Revalidate paths
    revalidatePath(`/${existing.type}`)
    if (existing.slug) revalidatePath(`/${existing.type}/${existing.slug}`)
    if (updates.slug && updates.slug !== existing.slug) {
      revalidatePath(`/${existing.type}/${updates.slug}`)
    }

    return data
  } catch (error) {
    console.error('Update error:', error)
    throw error
  }
}

// Get content from Supabase
export async function getUnifiedContent(filters: {
  type?: string
  status?: 'draft' | 'published' | 'archived' | 'all'
  search?: string
  limit?: number
  offset?: number
}) {
  try {
    const { type, status = 'all', search, limit = 20, offset = 0 } = filters

    // Query Supabase directly
    let query = supabaseAdmin()
      .from('managed_content')
      .select('*, admin_users!author_id(email, role)', { count: 'exact' })

    if (type) query = query.eq('type', type)
    if (status && status !== 'all') query = query.eq('status', status)
    if (search) {
      query = query.or(`title.ilike.%${search}%,content->>'text'.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)
    if (offset) query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      items: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Error fetching unified content:', error)
    return {
      items: [],
      total: 0
    }
  }
}

// Archive content
export async function archiveUnifiedContent(id: string) {
  return updateUnifiedContent(id, { status: 'archived' })
}

// Delete content from Supabase
export async function deleteUnifiedContent(id: string, permanent = false) {
  const user = await getCurrentAdmin()
  if (!user) throw new Error('Authentication required')

  // Get existing content (safe query)
  const { data: existingResults } = await supabaseAdmin()
    .from('managed_content')
    .select('*')
    .eq('id', id)
    .limit(1)

  const existing = existingResults && existingResults.length > 0 ? existingResults[0] : null

  if (!existing) throw new Error('Content not found')

  try {
    if (permanent) {
      // Permanent deletion
      const { error } = await supabaseAdmin()
        .from('managed_content')
        .delete()
        .eq('id', id)

      if (error) throw error
    } else {
      // Soft delete - archive in Supabase
      const { error } = await supabaseAdmin()
        .from('managed_content')
        .update({ status: 'archived' })
        .eq('id', id)

      if (error) throw error
    }

    // Revalidate paths
    revalidatePath(`/${existing.type}`)
    if (existing.slug) revalidatePath(`/${existing.type}/${existing.slug}`)

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

// Convenience function to fetch single content item (safe query)
export async function fetchPageContent(slug: string, type?: string) {
  try {
    let query = supabaseAdmin()
      .from('managed_content')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .limit(1)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching page content:', error)
      return null
    }

    // Return first item if exists, otherwise null
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error fetching page content:', error)
    return null
  }
}