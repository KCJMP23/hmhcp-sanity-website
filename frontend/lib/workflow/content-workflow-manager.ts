/**
 * Content Workflow Management System
 * 
 * This module provides comprehensive workflow management for content
 * including approval processes, publishing pipelines, and editorial workflows.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface WorkflowStage {
  id: string
  name: string
  description: string
  order: number
  required: boolean
  autoApprove: boolean
  approvers: string[] // User IDs who can approve this stage
  estimatedDuration: number // in hours
  actions: WorkflowAction[]
}

export interface WorkflowAction {
  id: string
  name: string
  type: 'approve' | 'reject' | 'request_changes' | 'assign' | 'comment'
  description: string
  required: boolean
  allowedRoles: string[]
}

export interface WorkflowInstance {
  id: string
  contentId: string
  workflowId: string
  currentStage: string
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  startedAt: Date
  completedAt?: Date
  currentAssignee?: string
  stageHistory: StageTransition[]
  comments: WorkflowComment[]
  metadata: Record<string, any>
}

export interface StageTransition {
  fromStage: string
  toStage: string
  action: string
  actor: string
  timestamp: Date
  comment?: string
  metadata?: Record<string, any>
}

export interface WorkflowComment {
  id: string
  author: string
  content: string
  timestamp: Date
  stage: string
  isInternal: boolean
  attachments?: string[]
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  stages: WorkflowStage[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Database interfaces for proper typing
interface DatabaseWorkflowTemplate {
  id: string
  name: string
  description: string
  stages: WorkflowStage[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DatabaseWorkflowInstance {
  id: string
  content_id: string
  workflow_template_id: string
  current_stage: string
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  started_at: string
  completed_at?: string
  current_assignee?: string
  metadata: Record<string, any>
  workflow_templates?: {
    name: string
    description: string
    stages: WorkflowStage[]
  }
}

interface DatabaseWorkflowComment {
  id: string
  workflow_instance_id: string
  author: string
  content: string
  timestamp: string
  stage: string
  is_internal: boolean
  attachments?: string[]
}


interface DatabaseDurationData {
  started_at: string
  completed_at: string
}

/**
 * Content Workflow Manager Class
 */
export class ContentWorkflowManager {
  private supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase(): Promise<void> {
    this.supabase = await createServerSupabaseClient()
  }

  private async ensureSupabase(): Promise<NonNullable<typeof this.supabase>> {
    if (!this.supabase) {
      await this.initializeSupabase()
    }
    if (!this.supabase) {
      throw new Error('Failed to initialize Supabase client')
    }
    return this.supabase
  }

  /**
   * Create a new workflow template
   */
  async createWorkflowTemplate(template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const supabase = await this.ensureSupabase()
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert({
          name: template.name,
          description: template.description,
          stages: template.stages,
          is_active: template.isActive
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error creating workflow template:', error)
      throw new Error('Failed to create workflow template')
    }
  }

  /**
   * Start a workflow for content
   */
  async startWorkflow(
    contentId: string,
    workflowTemplateId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const supabase = await this.ensureSupabase()
      // Get workflow template
      const { data: template, error: templateError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', workflowTemplateId)
        .eq('is_active', true)
        .single()

      if (templateError || !template) {
        throw new Error('Workflow template not found or inactive')
      }

      // Create workflow instance
      const { data: instance, error: instanceError } = await supabase
        .from('workflow_instances')
        .insert({
          content_id: contentId,
          workflow_template_id: workflowTemplateId,
          current_stage: template.stages[0]?.id || 'draft',
          status: 'active',
          started_at: new Date().toISOString(),
          metadata: metadata || {}
        })
        .select('id')
        .single()

      if (instanceError) throw instanceError

      // Update content status
      await supabase
        .from('managed_content')
        .update({ 
          workflow_status: 'in_review',
          workflow_instance_id: instance.id
        })
        .eq('id', contentId)

      return instance.id
    } catch (error) {
      console.error('Error starting workflow:', error)
      throw new Error('Failed to start workflow')
    }
  }

  /**
   * Get current workflow for content
   */
  async getContentWorkflow(contentId: string): Promise<WorkflowInstance | null> {
    try {
      const supabase = await this.ensureSupabase()
      const { data, error } = await supabase
        .from('workflow_instances')
        .select(`
          *,
          workflow_templates (
            name,
            description,
            stages
          )
        `)
        .eq('content_id', contentId)
        .eq('status', 'active')
        .single()

      if (error || !data) return null

      return this.transformWorkflowInstance(data)
    } catch (error) {
      console.error('Error getting content workflow:', error)
      return null
    }
  }

  /**
   * Transition workflow to next stage
   */
  async transitionWorkflow(
    workflowInstanceId: string,
    action: string,
    actor: string,
    comment?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const supabase = await this.ensureSupabase()
      // Get current workflow instance
      const { data: instance, error: instanceError } = await supabase
        .from('workflow_instances')
        .select(`
          *,
          workflow_templates (
            stages
          )
        `)
        .eq('id', workflowInstanceId)
        .single()

      if (instanceError || !instance) {
        throw new Error('Workflow instance not found')
      }

      const template = instance.workflow_templates
      const currentStageIndex = template.stages.findIndex((s: WorkflowStage) => s.id === instance.current_stage)
      
      if (currentStageIndex === -1) {
        throw new Error('Current stage not found in template')
      }

      // Determine next stage based on action
      let nextStage = instance.current_stage
      let isCompleted = false

      if (action === 'approve') {
        if (currentStageIndex < template.stages.length - 1) {
          nextStage = template.stages[currentStageIndex + 1].id
        } else {
          isCompleted = true
        }
      } else if (action === 'reject') {
        // Move back to previous stage or to draft
        nextStage = currentStageIndex > 0 ? template.stages[currentStageIndex - 1].id : 'draft'
      }

      // Record stage transition
      const transition: StageTransition = {
        fromStage: instance.current_stage,
        toStage: nextStage,
        action,
        actor,
        timestamp: new Date(),
        comment,
        metadata
      }

      // Update workflow instance
      const updateData: any = {
        current_stage: nextStage,
        updated_at: new Date().toISOString()
      }

      if (isCompleted) {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('workflow_instances')
        .update(updateData)
        .eq('id', workflowInstanceId)

      if (updateError) throw updateError

      // Add stage transition to history
      await supabase
        .from('workflow_stage_transitions')
        .insert({
          workflow_instance_id: workflowInstanceId,
          from_stage: transition.fromStage,
          to_stage: transition.toStage,
          action: transition.action,
          actor: transition.actor,
          comment: transition.comment,
          metadata: transition.metadata
        })

      // Update content status
      let contentStatus = 'in_review'
      if (isCompleted) {
        contentStatus = 'approved'
      } else if (action === 'reject') {
        contentStatus = 'rejected'
      }

      await supabase
        .from('managed_content')
        .update({ 
          workflow_status: contentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.content_id)

      return true
    } catch (error) {
      console.error('Error transitioning workflow:', error)
      return false
    }
  }

  /**
   * Add comment to workflow
   */
  async addWorkflowComment(
    workflowInstanceId: string,
    author: string,
    content: string,
    stage: string,
    isInternal: boolean = false,
    attachments?: string[]
  ): Promise<string> {
    try {
      const supabase = await this.ensureSupabase()
      const { data, error } = await supabase
        .from('workflow_comments')
        .insert({
          workflow_instance_id: workflowInstanceId,
          author,
          content,
          stage,
          is_internal: isInternal,
          attachments: attachments || []
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error adding workflow comment:', error)
      throw new Error('Failed to add comment')
    }
  }

  /**
   * Get workflow comments
   */
  async getWorkflowComments(
    workflowInstanceId: string,
    includeInternal: boolean = false
  ): Promise<WorkflowComment[]> {
    try {
      const supabase = await this.ensureSupabase()
      let query = supabase
        .from('workflow_comments')
        .select('*')
        .eq('workflow_instance_id', workflowInstanceId)
        .order('timestamp', { ascending: true })

      if (!includeInternal) {
        query = query.eq('is_internal', false)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((comment: DatabaseWorkflowComment) => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        timestamp: new Date(comment.timestamp),
        stage: comment.stage,
        isInternal: comment.is_internal,
        attachments: comment.attachments || []
      }))
    } catch (error) {
      console.error('Error getting workflow comments:', error)
      return []
    }
  }

  /**
   * Assign workflow to user
   */
  async assignWorkflow(
    workflowInstanceId: string,
    assigneeId: string,
    actor: string
  ): Promise<boolean> {
    try {
      const supabase = await this.ensureSupabase()
      const { error } = await supabase
        .from('workflow_instances')
        .update({
          current_assignee: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowInstanceId)

      if (error) throw error

      // Record assignment action
      await this.addWorkflowComment(
        workflowInstanceId,
        actor,
        `Workflow assigned to user ${assigneeId}`,
        'system',
        true
      )

      return true
    } catch (error) {
      console.error('Error assigning workflow:', error)
      return false
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(): Promise<{
    active: number
    completed: number
    averageDuration: number
    stageDistribution: Record<string, number>
  }> {
    try {
      const supabase = await this.ensureSupabase()
      // Get active workflows count
      const { count: active } = await supabase
        .from('workflow_instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get completed workflows count
      const { count: completed } = await supabase
        .from('workflow_instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get stage distribution
      const { data: stageData } = await supabase
        .from('workflow_instances')
        .select('current_stage')
        .eq('status', 'active')

      const stageDistribution: Record<string, number> = {}
      stageData?.forEach((instance: { current_stage: string }) => {
        stageDistribution[instance.current_stage] = (stageDistribution[instance.current_stage] || 0) + 1
      })

      // Calculate average duration for completed workflows
      const { data: durationData } = await supabase
        .from('workflow_instances')
        .select('started_at, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)

      let totalDuration = 0
      let validDurations = 0

      durationData?.forEach((workflow: DatabaseDurationData) => {
        const start = new Date(workflow.started_at)
        const end = new Date(workflow.completed_at)
        const duration = end.getTime() - start.getTime()
        if (duration > 0) {
          totalDuration += duration
          validDurations++
        }
      })

      const averageDuration = validDurations > 0 ? totalDuration / validDurations : 0

      return {
        active: active || 0,
        completed: completed || 0,
        averageDuration: Math.round(averageDuration / (1000 * 60 * 60)), // Convert to hours
        stageDistribution
      }
    } catch (error) {
      console.error('Error getting workflow stats:', error)
      return {
        active: 0,
        completed: 0,
        averageDuration: 0,
        stageDistribution: {}
      }
    }
  }

  /**
   * Transform database result to WorkflowInstance
   */
  private transformWorkflowInstance(data: DatabaseWorkflowInstance): WorkflowInstance {
    return {
      id: data.id,
      contentId: data.content_id,
      workflowId: data.workflow_template_id,
      currentStage: data.current_stage,
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      currentAssignee: data.current_assignee,
      stageHistory: [], // Would need separate query to populate
      comments: [], // Would need separate query to populate
      metadata: data.metadata || {}
    }
  }
}

/**
 * Predefined workflow templates
 */
export const DEFAULT_WORKFLOW_TEMPLATES = {
  SIMPLE_APPROVAL: {
    name: 'Simple Approval',
    description: 'Basic two-stage approval workflow',
    stages: [
      {
        id: 'draft',
        name: 'Draft',
        description: 'Content in draft stage',
        order: 1,
        required: true,
        autoApprove: false,
        approvers: [],
        estimatedDuration: 24,
        actions: [
          {
            id: 'submit',
            name: 'Submit for Review',
            type: 'approve',
            description: 'Submit content for editorial review',
            required: true,
            allowedRoles: ['author', 'editor']
          }
        ]
      },
      {
        id: 'review',
        name: 'Editorial Review',
        description: 'Content under editorial review',
        order: 2,
        required: true,
        autoApprove: false,
        approvers: ['editor', 'admin'],
        estimatedDuration: 48,
        actions: [
          {
            id: 'approve',
            name: 'Approve',
            type: 'approve',
            description: 'Approve content for publishing',
            required: true,
            allowedRoles: ['editor', 'admin']
          },
          {
            id: 'request_changes',
            name: 'Request Changes',
            type: 'request_changes',
            description: 'Request changes from author',
            required: false,
            allowedRoles: ['editor', 'admin']
          }
        ]
      }
    ],
    isActive: true
  },

  COMPREHENSIVE_REVIEW: {
    name: 'Comprehensive Review',
    description: 'Multi-stage review with multiple approvers',
    stages: [
      {
        id: 'draft',
        name: 'Draft',
        description: 'Initial draft stage',
        order: 1,
        required: true,
        autoApprove: false,
        approvers: [],
        estimatedDuration: 24,
        actions: [
          {
            id: 'submit',
            name: 'Submit for Review',
            type: 'approve',
            description: 'Submit for initial review',
            required: true,
            allowedRoles: ['author']
          }
        ]
      },
      {
        id: 'peer_review',
        name: 'Peer Review',
        description: 'Peer review by team members',
        order: 2,
        required: true,
        autoApprove: false,
        approvers: ['author', 'contributor'],
        estimatedDuration: 72,
        actions: [
          {
            id: 'approve',
            name: 'Approve',
            type: 'approve',
            description: 'Approve peer review',
            required: true,
            allowedRoles: ['author', 'contributor']
          },
          {
            id: 'request_changes',
            name: 'Request Changes',
            type: 'request_changes',
            description: 'Request changes from author',
            required: false,
            allowedRoles: ['author', 'contributor']
          }
        ]
      },
      {
        id: 'editorial_review',
        name: 'Editorial Review',
        description: 'Editorial review and fact-checking',
        order: 3,
        required: true,
        autoApprove: false,
        approvers: ['editor'],
        estimatedDuration: 48,
        actions: [
          {
            id: 'approve',
            name: 'Approve',
            type: 'approve',
            description: 'Approve editorial review',
            required: true,
            allowedRoles: ['editor']
          },
          {
            id: 'request_changes',
            name: 'Request Changes',
            type: 'request_changes',
            description: 'Request editorial changes',
            required: false,
            allowedRoles: ['editor']
          }
        ]
      },
      {
        id: 'final_approval',
        name: 'Final Approval',
        description: 'Final approval by senior editor or admin',
        order: 4,
        required: true,
        autoApprove: false,
        approvers: ['senior_editor', 'admin'],
        estimatedDuration: 24,
        actions: [
          {
            id: 'approve',
            name: 'Approve for Publishing',
            type: 'approve',
            description: 'Final approval for publishing',
            required: true,
            allowedRoles: ['senior_editor', 'admin']
          },
          {
            id: 'reject',
            name: 'Reject',
            type: 'reject',
            description: 'Reject content',
            required: false,
            allowedRoles: ['senior_editor', 'admin']
          }
        ]
      }
    ],
    isActive: true
  }
}

// Export singleton instance
export const contentWorkflowManager = new ContentWorkflowManager()
