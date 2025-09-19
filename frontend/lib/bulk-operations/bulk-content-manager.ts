/**
 * Bulk Content Management System
 * 
 * This module provides bulk operations for managing multiple content items
 * simultaneously, including updates, deletions, and status changes.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface BulkOperation {
  id: string
  type: 'update' | 'delete' | 'status_change' | 'category_change' | 'author_change'
  targetIds: string[]
  data?: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  totalItems: number
  processedItems: number
  errors: string[]
  createdAt: Date
  completedAt?: Date
  userId: string
}

export interface BulkUpdateData {
  status?: string
  category_id?: string
  author_profile_id?: string
  published_at?: string
  tags?: string[]
  meta_title?: string
  meta_description?: string
}

export interface BulkOperationResult {
  success: boolean
  operationId: string
  totalProcessed: number
  successfulUpdates: number
  failedUpdates: number
  errors: string[]
  details: {
    updated: string[]
    failed: string[]
    skipped: string[]
  }
}

/**
 * Execute bulk status change operation
 */
export async function bulkStatusChange(
  contentIds: string[],
  newStatus: string,
  userId: string
): Promise<BulkOperationResult> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Validate status
    const validStatuses = ['draft', 'published', 'archived']
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`)
    }
    
    // Update all content items
    const { data, error } = await supabase
      .from('managed_content')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .in('id', contentIds)
      .select('id')
    
    if (error) {
      throw error
    }
    
    const updatedIds = data?.map(item => item.id) || []
    const failedIds = contentIds.filter(id => !updatedIds.includes(id))
    
    return {
      success: true,
      operationId: `bulk_status_${Date.now()}`,
      totalProcessed: contentIds.length,
      successfulUpdates: updatedIds.length,
      failedUpdates: failedIds.length,
      errors: [],
      details: {
        updated: updatedIds,
        failed: failedIds,
        skipped: []
      }
    }
    
  } catch (error) {
    console.error('Bulk status change error:', error)
    return {
      success: false,
      operationId: `bulk_status_${Date.now()}`,
      totalProcessed: 0,
      successfulUpdates: 0,
      failedUpdates: contentIds.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      details: {
        updated: [],
        failed: contentIds,
        skipped: []
      }
    }
  }
}

/**
 * Execute bulk category change operation
 */
export async function bulkCategoryChange(
  contentIds: string[],
  newCategoryId: string,
  userId: string
): Promise<BulkOperationResult> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Validate category exists
    const { data: category, error: categoryError } = await supabase
      .from('cms_categories')
      .select('id')
      .eq('id', newCategoryId)
      .single()
    
    if (categoryError || !category) {
      throw new Error(`Category not found: ${newCategoryId}`)
    }
    
    // Update all content items
    const { data, error } = await supabase
      .from('managed_content')
      .update({ 
        category_id: newCategoryId,
        updated_at: new Date().toISOString()
      })
      .in('id', contentIds)
      .select('id')
    
    if (error) {
      throw error
    }
    
    const updatedIds = data?.map(item => item.id) || []
    const failedIds = contentIds.filter(id => !updatedIds.includes(id))
    
    return {
      success: true,
      operationId: `bulk_category_${Date.now()}`,
      totalProcessed: contentIds.length,
      successfulUpdates: updatedIds.length,
      failedUpdates: failedIds.length,
      errors: [],
      details: {
        updated: updatedIds,
        failed: failedIds,
        skipped: []
      }
    }
    
  } catch (error) {
    console.error('Bulk category change error:', error)
    return {
      success: false,
      operationId: `bulk_category_${Date.now()}`,
      totalProcessed: 0,
      successfulUpdates: 0,
      failedUpdates: contentIds.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      details: {
        updated: [],
        failed: contentIds,
        skipped: []
      }
    }
  }
}

/**
 * Execute bulk author change operation
 */
export async function bulkAuthorChange(
  contentIds: string[],
  newAuthorId: string,
  userId: string
): Promise<BulkOperationResult> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Validate author exists
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', newAuthorId)
      .single()
    
    if (authorError || !author) {
      throw new Error(`Author not found: ${newAuthorId}`)
    }
    
    // Update all content items
    const { data, error } = await supabase
      .from('managed_content')
      .update({ 
        author_profile_id: newAuthorId,
        updated_at: new Date().toISOString()
      })
      .in('id', contentIds)
      .select('id')
    
    if (error) {
      throw error
    }
    
    const updatedIds = data?.map(item => item.id) || []
    const failedIds = contentIds.filter(id => !updatedIds.includes(id))
    
    return {
      success: true,
      operationId: `bulk_author_${Date.now()}`,
      totalProcessed: contentIds.length,
      successfulUpdates: updatedIds.length,
      failedUpdates: failedIds.length,
      errors: [],
      details: {
        updated: updatedIds,
        failed: failedIds,
        skipped: []
      }
    }
    
  } catch (error) {
    console.error('Bulk author change error:', error)
    return {
      success: false,
      operationId: `bulk_author_${Date.now()}`,
      totalProcessed: 0,
      successfulUpdates: 0,
      failedUpdates: contentIds.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      details: {
        updated: [],
        failed: contentIds,
        skipped: []
      }
    }
  }
}

/**
 * Execute bulk delete operation
 */
export async function bulkDelete(
  contentIds: string[],
  userId: string,
  permanent: boolean = false
): Promise<BulkOperationResult> {
  const supabase = await createServerSupabaseClient()
  
  try {
    if (permanent) {
      // Permanent deletion
      const { data, error } = await supabase
        .from('managed_content')
        .delete()
        .in('id', contentIds)
        .select('id')
      
      if (error) {
        throw error
      }
      
      const deletedIds = data?.map(item => item.id) || []
      const failedIds = contentIds.filter(id => !deletedIds.includes(id))
      
      return {
        success: true,
        operationId: `bulk_delete_${Date.now()}`,
        totalProcessed: contentIds.length,
        successfulUpdates: deletedIds.length,
        failedUpdates: failedIds.length,
        errors: [],
        details: {
          updated: [],
          failed: failedIds,
          skipped: []
        }
      }
    } else {
      // Soft delete (change status to archived)
      return await bulkStatusChange(contentIds, 'archived', userId)
    }
    
  } catch (error) {
    console.error('Bulk delete error:', error)
    return {
      success: false,
      operationId: `bulk_delete_${Date.now()}`,
      totalProcessed: 0,
      successfulUpdates: 0,
      failedUpdates: contentIds.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      details: {
        updated: [],
        failed: contentIds,
        skipped: []
      }
    }
  }
}

/**
 * Execute bulk update operation with custom data
 */
export async function bulkUpdate(
  contentIds: string[],
  updateData: BulkUpdateData,
  userId: string
): Promise<BulkOperationResult> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Prepare update data
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }
    
    // Add provided fields
    if (updateData.status) updatePayload.status = updateData.status
    if (updateData.category_id) updatePayload.category_id = updateData.category_id
    if (updateData.author_profile_id) updatePayload.author_profile_id = updateData.author_profile_id
    if (updateData.published_at) updatePayload.published_at = updateData.published_at
    if (updateData.tags) updatePayload.tags = updateData.tags
    if (updateData.meta_title) updatePayload.meta_title = updateData.meta_title
    if (updateData.meta_description) updatePayload.meta_description = updateData.meta_description
    
    // Update all content items
    const { data, error } = await supabase
      .from('managed_content')
      .update(updatePayload)
      .in('id', contentIds)
      .select('id')
    
    if (error) {
      throw error
    }
    
    const updatedIds = data?.map(item => item.id) || []
    const failedIds = contentIds.filter(id => !updatedIds.includes(id))
    
    return {
      success: true,
      operationId: `bulk_update_${Date.now()}`,
      totalProcessed: contentIds.length,
      successfulUpdates: updatedIds.length,
      failedUpdates: failedIds.length,
      errors: [],
      details: {
        updated: updatedIds,
        failed: failedIds,
        skipped: []
      }
    }
    
  } catch (error) {
    console.error('Bulk update error:', error)
    return {
      success: false,
      operationId: `bulk_update_${Date.now()}`,
      totalProcessed: 0,
      successfulUpdates: 0,
      failedUpdates: contentIds.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      details: {
        updated: [],
        failed: contentIds,
        skipped: []
      }
    }
  }
}

/**
 * Get bulk operation history
 */
export async function getBulkOperationHistory(
  userId?: string,
  limit: number = 50
): Promise<BulkOperation[]> {
  const supabase = await createServerSupabaseClient()
  
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'bulk_operation')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    // Transform audit logs to bulk operations
    return (data || []).map(log => ({
      id: log.id,
      type: log.metadata?.operation_type || 'unknown',
      targetIds: log.metadata?.target_ids || [],
      data: log.metadata?.operation_data || {},
      status: log.metadata?.status || 'completed',
      progress: log.metadata?.progress || 100,
      totalItems: log.metadata?.total_items || 0,
      processedItems: log.metadata?.processed_items || 0,
      errors: log.metadata?.errors || [],
      createdAt: new Date(log.created_at),
      completedAt: log.metadata?.completed_at ? new Date(log.metadata.completed_at) : undefined,
      userId: log.user_id
    }))
    
  } catch (error) {
    console.error('Error getting bulk operation history:', error)
    return []
  }
}

/**
 * Validate bulk operation permissions
 */
export async function validateBulkOperationPermissions(
  userId: string,
  operationType: string,
  targetIds: string[]
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Check user role
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      return { allowed: false, reason: 'User not found' }
    }
    
    // Only admins and super admins can perform bulk operations
    if (!['admin', 'super_admin'].includes(user.role)) {
      return { allowed: false, reason: 'Insufficient permissions' }
    }
    
    // Check if user owns any of the target content
    if (['admin'].includes(user.role)) {
      const { data: ownedContent, error: ownedError } = await supabase
        .from('managed_content')
        .select('id')
        .in('id', targetIds)
        .eq('author_profile_id', userId)
      
      if (ownedError) {
        return { allowed: false, reason: 'Error checking content ownership' }
      }
      
      // Admins can only bulk operate on their own content
      if (ownedContent && ownedContent.length < targetIds.length) {
        return { allowed: false, reason: 'Cannot operate on content you do not own' }
      }
    }
    
    return { allowed: true }
    
  } catch (error) {
    console.error('Error validating bulk operation permissions:', error)
    return { allowed: false, reason: 'Error validating permissions' }
  }
}
