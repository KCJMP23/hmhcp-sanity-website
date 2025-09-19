import { supabaseAdmin } from './supabase'
import { getCurrentAdmin, logAuditAction } from './admin-auth'
import type { CMSCategory, CreateCategoryInput, UpdateCategoryInput } from '@/types/cms-content'

export async function getCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from('cms_categories')
      .select('*')
      .order('sortOrder', { ascending: true })

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('Categories table not found, returning empty result')
        return []
      }
      throw error
    }

    return data as CMSCategory[]
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getCategoryById(id: string): Promise<CMSCategory | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cms_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data as CMSCategory
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

export async function createCategory(input: CreateCategoryInput): Promise<CMSCategory> {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  if (!['super_admin', 'admin', 'editor'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  const { data, error } = await supabaseAdmin
    .from('cms_categories')
    .insert({
      ...input,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') {
      throw new Error('Categories table does not exist. Please run database migrations.')
    }
    throw error
  }

  await logAuditAction(admin.id, 'create', 'category', data.id, { name: input.name })

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    parent_id: data.parent_id,
    order: data.order,
    created_at: data.created_at,
    updated_at: data.updated_at
  } as CMSCategory
}

export async function updateCategory(id: string, updates: UpdateCategoryInput): Promise<CMSCategory> {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  if (!['super_admin', 'admin', 'editor'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.slug !== undefined) updateData.slug = updates.slug
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.parent_id !== undefined) updateData.parent_id = updates.parent_id
  if (updates.order !== undefined) updateData.order = updates.order

  const { data, error } = await supabaseAdmin
    .from('cms_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Category not found')
    }
    throw error
  }

  await logAuditAction(admin.id, 'update', 'category', id, { updates })

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    parent_id: data.parent_id,
    order: data.order,
    created_at: data.created_at,
    updated_at: data.updated_at
  } as CMSCategory
}

export async function deleteCategory(id: string): Promise<void> {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')

  if (!['super_admin', 'admin'].includes(admin.role)) {
    throw new Error('Insufficient permissions')
  }

  // Check if category has children
  const { data: children } = await supabaseAdmin
    .from('cms_categories')
    .select('id')
    .eq('parent_id', id)
    .limit(1)

  if (children && children.length > 0) {
    throw new Error('Cannot delete category with children')
  }

  // Check if category is used by any content
  const { data: content } = await supabaseAdmin
    .from('cms_content')
    .select('id')
    .eq('category_id', id)
    .limit(1)

  if (content && content.length > 0) {
    throw new Error('Cannot delete category that is in use')
  }

  const { error } = await supabaseAdmin
    .from('cms_categories')
    .delete()
    .eq('id', id)

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Category not found')
    }
    throw error
  }

  await logAuditAction(admin.id, 'delete', 'category', id)
}