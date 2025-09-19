import { supabaseAdmin } from '@/lib/supabase-client'
import { getCurrentAdmin, logAuditAction } from './admin-auth'

export async function uploadMedia(
  file: File,
  metadata?: any
): Promise<any> {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const extension = file.name.split('.').pop()
  const filename = `${timestamp}-${randomString}.${extension}`
  const filePath = `media/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${filename}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabaseAdmin
    .storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin
    .storage
    .from('media')
    .getPublicUrl(filePath)

  // Save to database - using cms_media table
  const { data, error } = await supabaseAdmin
    .from('cms_media')
    .insert({
      filename: filename,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      file_path: filePath,
      alt_text: metadata?.altText || null,
      caption: metadata?.caption || null,
      uploaded_by: admin.id
    })
    .select()
    .single()

  if (error) throw error

  await logAuditAction(admin.id, 'upload', 'media', data.id, {
    filename: file.name,
    size: file.size
  })

  return data
}

export async function getMedia(filters: {
  search?: string
  mime_type?: string
  uploaded_by?: string
  limit?: number
  offset?: number
}) {
  let query = supabaseAdmin
    .from('cms_media')
    .select('*', { count: 'exact' })

  if (filters.search) {
    query = query.or(`original_filename.ilike.%${filters.search}%,filename.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%`)
  }

  if (filters.mime_type) {
    query = query.ilike('mime_type', `${filters.mime_type}%`)
  }

  if (filters.uploaded_by) {
    query = query.eq('uploaded_by', filters.uploaded_by)
  }

  query = query.order('created_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error, count } = await query

  if (error) throw error

  return {
    items: data as any[],
    total: count || 0
  }
}

export async function deleteMedia(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  // Get media info
  const { data: media, error: fetchError } = await supabaseAdmin
    .from('cms_media')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !media) throw new Error('Media not found')

  // Use the file_path directly for storage deletion
  const storagePath = media.file_path

  // Delete from storage
  const { error: storageError } = await supabaseAdmin
    .storage
    .from('media')
    .remove([storagePath])

  if (storageError) console.error('Storage deletion error:', storageError)

  // Delete from database
  const { error } = await supabaseAdmin
    .from('cms_media')
    .delete()
    .eq('id', id)

  if (error) throw error

  await logAuditAction(admin.id, 'delete', 'media', id, {
    filename: media.original_filename
  })
}

export async function updateMediaMetadata(id: string, metadata: any) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  const { data, error } = await supabaseAdmin
    .from('cms_media')
    .update({ 
      alt_text: metadata?.altText || null,
      caption: metadata?.caption || null,
      favorites: typeof metadata?.favorites === 'boolean' ? metadata.favorites : undefined,
      // SEO fields (optional)
      seo_title: metadata?.seo_title ?? null,
      seo_description: metadata?.seo_description ?? null,
      seo_keywords: Array.isArray(metadata?.seo_keywords) ? metadata.seo_keywords : null,
      og_title: metadata?.og_title ?? null,
      og_description: metadata?.og_description ?? null,
      twitter_title: metadata?.twitter_title ?? null,
      twitter_description: metadata?.twitter_description ?? null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logAuditAction(admin.id, 'update', 'media', id, { metadata })

  return data
}

// Bulk upload helper
export async function bulkUploadMedia(files: File[]): Promise<any[]> {
  const results: any[] = []
  const errors: Array<{ file: string; error: string }> = []

  for (const file of files) {
    try {
      const media = await uploadMedia(file)
      results.push(media)
    } catch (error) {
      errors.push({
        file: file.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  if (errors.length > 0) {
    console.error('Bulk upload errors:', errors)
  }

  return results
}