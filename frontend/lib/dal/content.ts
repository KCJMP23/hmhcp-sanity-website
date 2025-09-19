import { supabaseAdmin, type ManagedContent } from './supabase'
import { getCurrentAdmin, logAuditAction } from './admin-auth'
import { revalidatePath } from 'next/cache'
import logger from '@/lib/logging/winston-logger'

export async function createContent(
  type: string,
  title: string,
  slug: string,
  content: any,
  status: ManagedContent['status'] = 'draft'
) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  const { data, error } = await supabaseAdmin
    .from('managed_content')
    .insert({
      type,
      title,
      slug,
      content,
      status,
      author_id: admin.id,
      published_at: status === 'published' ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (error) throw error

  await logAuditAction(admin.id, 'create', 'content', data.id, { type, title })
  
  // Revalidate the relevant paths
  revalidatePath(`/${type}`)
  if (slug) revalidatePath(`/${type}/${slug}`)
  
  return data as ManagedContent
}

export async function updateContent(
  id: string,
  updates: Partial<ManagedContent>
) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  // Check permissions
  const { data: existing } = await supabaseAdmin
    .from('managed_content')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) throw new Error('Content not found')

  const canEdit = admin.role === 'super_admin' || 
                  admin.role === 'admin' ||
                  admin.role === 'editor' ||
                  existing.author_id === admin.id

  if (!canEdit) throw new Error('Insufficient permissions')

  // Handle status changes
  const updateData: any = { ...updates }
  if (updates.status === 'published' && existing.status !== 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('managed_content')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logAuditAction(admin.id, 'update', 'content', id, { updates })
  
  // Revalidate paths
  revalidatePath(`/${existing.type}`)
  if (existing.slug) revalidatePath(`/${existing.type}/${existing.slug}`)
  if (updates.slug && updates.slug !== existing.slug) {
    revalidatePath(`/${existing.type}/${updates.slug}`)
  }
  
  return data as ManagedContent
}

export async function deleteContent(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  // Only admins can delete
  if (!['super_admin', 'admin'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  const { data: existing } = await supabaseAdmin
    .from('managed_content')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) throw new Error('Content not found')

  const { error } = await supabaseAdmin
    .from('managed_content')
    .delete()
    .eq('id', id)

  if (error) throw error

  await logAuditAction(admin.id, 'delete', 'content', id, { 
    type: existing.type, 
    title: existing.title 
  })
  
  // Revalidate paths
  revalidatePath(`/${existing.type}`)
  if (existing.slug) revalidatePath(`/${existing.type}/${existing.slug}`)
}

export async function getContent(filters: {
  type?: string
  status?: ManagedContent['status']
  author_id?: string
  search?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = supabaseAdmin
      .from('managed_content')
      .select('*, admin_users!author_id(email, role)', { count: 'exact' })

    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content->>'text'.ilike.%${filters.search}%`)
    }

    query = query.order('created_at', { ascending: false })

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      // If table doesn't exist, return empty result
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        logger.info('Content table not found, returning empty result')
        return { 
          items: [], 
          total: 0 
        }
      }
      throw error
    }

    return { 
      items: data as any[], 
      total: count || 0 
    }
  } catch (error) {
    logger.error('Error fetching content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      filters
    })
    // Return empty result for any database errors
    return { 
      items: [], 
      total: 0 
    }
  }
}

export async function getContentBySlug(type: string, slug: string) {
  const { data, error } = await supabaseAdmin
    .from('managed_content')
    .select('*, admin_users!author_id(email, role)')
    .eq('type', type)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function publishContent(id: string) {
  return updateContent(id, { status: 'published' })
}

export async function unpublishContent(id: string) {
  return updateContent(id, { status: 'draft', published_at: undefined })
}

export async function archiveContent(id: string) {
  return updateContent(id, { status: 'archived' })
}

// Bulk operations
export async function bulkUpdateContentStatus(
  ids: string[], 
  status: ManagedContent['status']
) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  if (!['super_admin', 'admin', 'editor'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  const updateData: any = { status }
  if (status === 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from('managed_content')
    .update(updateData)
    .in('id', ids)

  if (error) throw error

  await logAuditAction(admin.id, 'bulk_update', 'content', undefined, {
    ids,
    status
  })

  // Revalidate all affected content types
  const { data: types } = await supabaseAdmin
    .from('managed_content')
    .select('type')
    .in('id', ids)

  const uniqueTypes = [...new Set(types?.map((t: { type: string }) => t.type) || [])]
  uniqueTypes.forEach(type => revalidatePath(`/${type}`))
}