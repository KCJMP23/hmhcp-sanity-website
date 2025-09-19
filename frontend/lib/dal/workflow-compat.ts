import { supabaseAdmin } from './supabase'
import { getCurrentAdmin, logAuditAction } from './admin-auth'
import logger from '@/lib/logging/winston-logger'
import {
  createContentReview,
  getContentReviews,
  updateContentReview,
  getContentComments,
  createContentComment,
} from './workflow'

// Types used by API routes
type DateRange = { from: Date; to: Date }

// Analytics
export async function getWorkflowAnalytics(filters: {
  template_id?: string
  content_type?: string
  date_range: DateRange
}) {
  try {
    let query = supabaseAdmin
      .from('content_workflow_instances')
      .select('id, started_at, completed_at, template_id, metadata')
      .gte('started_at', filters.date_range.from.toISOString())
      .lte('started_at', filters.date_range.to.toISOString())

    if (filters.template_id) query = query.eq('template_id', filters.template_id)
    if (filters.content_type) query = query.eq('metadata->>content_type', filters.content_type)

    const { data, error } = await query
    if (error) throw error

    const total = data?.length || 0
    const completed = (data || []).filter((i: any) => i.completed_at).length
    const rate = total > 0 ? completed / total : 0

    // Avg duration in hours for completed workflows
    let hours = 0
    if (completed > 0) {
      const durations = (data || [])
        .filter((i: any) => i.completed_at)
        .map((i: any) => (new Date(i.completed_at).getTime() - new Date(i.started_at).getTime()) / 36e5)
      hours = durations.reduce((a: number, b: number) => a + b, 0) / durations.length
    }

    // Simple bottleneck heuristic: count unfinished items older than 7 days
    const now = Date.now()
    const critical_bottlenecks = (data || []).filter((i: any) => !i.completed_at && (now - new Date(i.started_at).getTime()) > 7 * 24 * 36e5).length

    return {
      completion_rate: { rate, total },
      avg_duration: { hours: Math.round(hours * 100) / 100 },
      bottlenecks: { critical_bottlenecks },
    }
  } catch (error) {
    logger.error('getWorkflowAnalytics failed', { error })
    return {
      completion_rate: { rate: 0, total: 0 },
      avg_duration: { hours: 0 },
      bottlenecks: { critical_bottlenecks: 0 },
    }
  }
}

export async function getWorkflowPerformanceMetrics(_filters: {
  template_id?: string
  content_type?: string
  date_range: DateRange
}) {
  // Minimal viable metrics; extend as needed
  return {
    review_times: {},
    state_transitions: {},
    user_performance: {},
    content_type_analysis: {},
  }
}

export async function getWorkflowBottlenecks(filters: {
  template_id?: string
  content_type?: string
  date_range: DateRange
}) {
  // Provide basic grouping of old, aging, fresh
  try {
    let query = supabaseAdmin
      .from('content_workflow_instances')
      .select('id, started_at, completed_at')
      .gte('started_at', filters.date_range.from.toISOString())
      .lte('started_at', filters.date_range.to.toISOString())

    if (filters.template_id) query = query.eq('template_id', filters.template_id)
    if (filters.content_type) query = query.eq('metadata->>content_type', filters.content_type)

    const { data } = await query
    const now = Date.now()
    const critical = (data || []).filter((i: any) => !i.completed_at && (now - new Date(i.started_at).getTime()) > 7 * 24 * 36e5).map((i: any) => i.id)
    const moderate = (data || []).filter((i: any) => !i.completed_at && (now - new Date(i.started_at).getTime()) > 3 * 24 * 36e5 && (now - new Date(i.started_at).getTime()) <= 7 * 24 * 36e5).map((i: any) => i.id)
    const low = (data || []).filter((i: any) => !i.completed_at && (now - new Date(i.started_at).getTime()) <= 3 * 24 * 36e5).map((i: any) => i.id)
    return { critical, moderate, low }
  } catch {
    return { critical: [], moderate: [], low: [] }
  }
}

// Comments (proper workflow comment functions with filtering support)
export async function getWorkflowComments(filters: {
  instance_id: string
  parent_id?: string
  comment_type?: string
  resolved?: boolean
}, page: number = 1, limit: number = 50) {
  try {
    let query = supabaseAdmin
      .from('content_comments')
      .select('*, author:admin_users!author_id(*)')
      .eq('content_id', filters.instance_id)
      .order('created_at')

    if (filters.parent_id) query = query.eq('parent_id', filters.parent_id)
    if (filters.comment_type) query = query.eq('comment_type', filters.comment_type)
    if (filters.resolved !== undefined) query = query.eq('is_resolved', filters.resolved)

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        logger.info('Content comments table not found, returning empty result')
        return { items: [], total: 0, page, limit }
      }
      throw error
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('content_comments')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', filters.instance_id)

    const comments = data || []
    
    // Organize comments into threads
    const threaded = comments.filter((c: any) => !c.parent_id)
    for (const comment of threaded) {
      comment.replies = comments.filter((c: any) => c.parent_id === comment.id)
    }

    return {
      items: threaded,
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    logger.error('Error fetching workflow comments', { error })
    return { items: [], total: 0, page, limit }
  }
}

export async function createWorkflowComment(commentData: {
  instance_id: string
  parent_id?: string
  comment_type: string
  content: string
  position?: any
  mentioned_users?: string[]
  metadata?: any
  created_by: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_comments')
      .insert({
        content_id: commentData.instance_id,
        parent_id: commentData.parent_id,
        comment_type: commentData.comment_type,
        comment_text: commentData.content,
        author_id: commentData.created_by,
        position: commentData.position,
        mentions: commentData.mentioned_users || [],
        metadata: commentData.metadata || {},
        is_resolved: false,
        created_at: new Date().toISOString()
      })
      .select('*, author:admin_users!author_id(*)')
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Error creating workflow comment', { error })
    throw error
  }
}

export async function updateWorkflowComment(id: string, updates: any) {
  const { data, error } = await supabaseAdmin
    .from('content_comments')
    .update({
      comment_text: updates.content ?? updates.comment_text,
      comment_type: updates.comment_type,
      position: updates.position,
      is_resolved: updates.resolved,
      updated_at: new Date().toISOString(),
      metadata: updates.metadata,
    })
    .eq('id', id)
    .select('*, author:admin_users!author_id(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkflowComment(id: string, _userId?: string) {
  const { error } = await supabaseAdmin
    .from('content_comments')
    .delete()
    .eq('id', id)
  if (error) throw error
  return { success: true }
}

// Instances
export async function getWorkflowInstanceById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('content_workflow_instances')
    .select(`*, current_state:content_workflow_states(*), assigned_user:admin_users!assigned_to(*)`)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateWorkflowInstance(id: string, updates: any) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')
  const { data, error } = await supabaseAdmin
    .from('content_workflow_instances')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`*, current_state:content_workflow_states(*), assigned_user:admin_users!assigned_to(*)`)
    .single()
  if (error) throw error
  await logAuditAction(admin.id, 'update', 'workflow_instance', id, updates)
  return data
}

export async function deleteWorkflowInstance(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')
  const { error } = await supabaseAdmin.from('content_workflow_instances').delete().eq('id', id)
  if (error) throw error
  await logAuditAction(admin.id, 'delete', 'workflow_instance', id, {})
  return { success: true }
}

// Transition wrapper maps to existing function name
export { transitionWorkflow as transitionWorkflowState } from './workflow'

// Reviews (proper workflow review functions with filtering support)
export async function getWorkflowReviews(filters: {
  instance_id: string
  reviewer_id?: string
  review_type?: string
  decision?: string
  status?: string
}, page: number = 1, limit: number = 50) {
  try {
    let query = supabaseAdmin
      .from('content_reviews')
      .select('*, reviewer:admin_users!reviewer_id(*)')
      .eq('content_id', filters.instance_id)
      .order('created_at', { ascending: false })

    if (filters.reviewer_id) query = query.eq('reviewer_id', filters.reviewer_id)
    if (filters.review_type) query = query.eq('review_type', filters.review_type)
    if (filters.decision) query = query.eq('decision', filters.decision)
    if (filters.status) query = query.eq('status', filters.status)

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        logger.info('Content reviews table not found, returning empty result')
        return { items: [], total: 0, page, limit }
      }
      throw error
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('content_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', filters.instance_id)

    return {
      items: data || [],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    logger.error('Error fetching workflow reviews', { error })
    return { items: [], total: 0, page, limit }
  }
}

export async function createWorkflowReview(reviewData: {
  instance_id: string
  reviewer_id: string
  review_type: string
  decision: string
  comment: string
  metadata?: any
  created_by: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_reviews')
      .insert({
        content_id: reviewData.instance_id,
        reviewer_id: reviewData.reviewer_id,
        review_type: reviewData.review_type,
        decision: reviewData.decision,
        comment: reviewData.comment,
        priority: 'medium',
        status: 'pending',
        changes_requested: reviewData.decision === 'changes_requested',
        metadata: reviewData.metadata || {},
        created_at: new Date().toISOString()
      })
      .select('*, reviewer:admin_users!reviewer_id(*)')
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Error creating workflow review', { error })
    throw error
  }
}

export { updateContentReview as updateWorkflowReview } from './workflow'

// Scheduled publications
export async function updateScheduledPublication(id: string, updates: any) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')
  const { data, error } = await supabaseAdmin
    .from('scheduled_publications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  await logAuditAction(admin.id, 'update', 'scheduled_publication', id, updates)
  return data
}

export async function deleteScheduledPublication(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')
  const { error } = await supabaseAdmin.from('scheduled_publications').delete().eq('id', id)
  if (error) throw error
  await logAuditAction(admin.id, 'delete', 'scheduled_publication', id, {})
  return { success: true }
}

// Templates
export async function updateWorkflowTemplate(id: string, updates: any) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')
  const { data, error } = await supabaseAdmin
    .from('content_workflow_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  await logAuditAction(admin.id, 'update', 'workflow_template', id, updates)
  return data
}

export async function deleteWorkflowTemplate(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) throw new Error('Authentication required')
  const { error } = await supabaseAdmin.from('content_workflow_templates').delete().eq('id', id)
  if (error) throw error
  await logAuditAction(admin.id, 'delete', 'workflow_template', id, {})
  return { success: true }
}

// Missing functions that API routes need
export async function getScheduledPublications(filters?: any, page: number = 1, limit: number = 50) {
  try {
    let query = supabaseAdmin
      .from('scheduled_publications')
      .select('*')
      .order('scheduled_at', { ascending: true })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.content_type) query = query.eq('content_type', filters.content_type)

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw error

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('scheduled_publications')
      .select('*', { count: 'exact', head: true })

    return {
      items: data || [],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    logger.error('getScheduledPublications failed', { error })
    return { items: [], total: 0, page, limit }
  }
}

export async function createScheduledPublication(publication: any) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) throw new Error('Authentication required')
    
    const { data, error } = await supabaseAdmin
      .from('scheduled_publications')
      .insert({
        ...publication,
        created_by: admin.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    await logAuditAction(admin.id, 'create', 'scheduled_publication', data.id, publication)
    return data
  } catch (error) {
    logger.error('createScheduledPublication failed', { error })
    throw error
  }
}

export async function getWorkflowTemplates(filters?: any, page: number = 1, limit: number = 50) {
  try {
    let query = supabaseAdmin
      .from('content_workflow_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.content_type) query = query.eq('content_type', filters.content_type)
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active)

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw error

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('content_workflow_templates')
      .select('*', { count: 'exact', head: true })

    return {
      items: data || [],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    logger.error('getWorkflowTemplates failed', { error })
    return { items: [], total: 0, page, limit }
  }
}

export async function createWorkflowTemplate(template: any) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) throw new Error('Authentication required')
    
    const { data, error } = await supabaseAdmin
      .from('content_workflow_templates')
      .insert({
        ...template,
        created_by: admin.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    await logAuditAction(admin.id, 'create', 'workflow_template', data.id, template)
    return data
  } catch (error) {
    logger.error('createWorkflowTemplate failed', { error })
    throw error
  }
}


