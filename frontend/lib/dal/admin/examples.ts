/**
 * Admin DAL Implementation Examples
 * Shows how to extend BaseDAL for specific entities in the healthcare platform
 * 
 * These examples demonstrate the pattern for implementing entity-specific DALs
 * with healthcare compliance, validation, and audit logging
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { BaseDAL } from './base'
import {
  BlogPost,
  BlogPostCreate,
  BlogPostUpdate,
  TeamMember,
  TeamMemberCreate,
  TeamMemberUpdate,
  BlogPostCreateSchema,
  BlogPostUpdateSchema,
  TeamMemberCreateSchema,
  TeamMemberUpdateSchema,
  DataAccessContext,
  DataClassification
} from './types'
import { 
  TABLE_NAMES, 
  generateSlug, 
  ensureUniqueSlug, 
  calculateReadingTime,
  generateExcerpt
} from './utils'

// ================================
// Blog Post DAL Example
// ================================

/**
 * Blog Post Data Access Layer
 * Handles blog post CRUD operations with healthcare content compliance
 */
export class BlogPostDAL extends BaseDAL<BlogPost, BlogPostCreate, BlogPostUpdate> {
  constructor(client: SupabaseClient) {
    super(
      client,
      TABLE_NAMES.BLOG_POSTS,
      ['title', 'excerpt', 'content', 'tags'], // searchable columns
      true, // requires audit
      DataClassification.PUBLIC
    )
  }

  protected getCreateSchema(): z.ZodSchema<BlogPostCreate> {
    return BlogPostCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<BlogPostUpdate> {
    return BlogPostUpdateSchema
  }

  protected transformForSave(
    data: BlogPostCreate | BlogPostUpdate, 
    context?: DataAccessContext
  ): Record<string, any> {
    const transformed: Record<string, any> = { ...data }

    // Auto-generate slug if not provided or updating title
    if ('title' in data && data.title) {
      if (!('slug' in data) || !data.slug) {
        transformed.slug = generateSlug(data.title)
      }
    }

    // Calculate reading time for blog posts
    if ('content' in data && data.content) {
      transformed.read_time_minutes = calculateReadingTime(data.content)
      
      // Generate excerpt if not provided
      if (!('excerpt' in data) || !data.excerpt) {
        transformed.excerpt = generateExcerpt(data.content)
      }
    }

    // Set view count for new posts
    if (!('view_count' in transformed)) {
      transformed.view_count = 0
    }

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): BlogPost {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featured_image: data.featured_image,
      author_id: data.author_id,
      category_ids: data.category_ids || [],
      tags: data.tags || [],
      status: data.status,
      view_count: data.view_count || 0,
      read_time_minutes: data.read_time_minutes,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords,
      seo_config: data.seo_config,
      published_at: data.published_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  /**
   * Custom method: Get blog posts by author
   */
  public async getByAuthor(
    authorId: string,
    options: { status?: string; limit?: number } = {}
  ) {
    const queryOptions = {
      filters: { 
        author_id: authorId,
        ...(options.status && { status: options.status })
      },
      limit: options.limit || 20,
      sortBy: 'published_at',
      sortOrder: 'desc' as const
    }

    return await this.getMany(queryOptions)
  }

  /**
   * Custom method: Get published blog posts
   */
  public async getPublished(options: { 
    categoryIds?: string[]
    tags?: string[]
    limit?: number
    page?: number
  } = {}) {
    const filters: Record<string, any> = { status: 'published' }
    
    if (options.categoryIds?.length) {
      filters.category_ids = `cs.{${options.categoryIds.join(',')}}`
    }

    const queryOptions = {
      filters,
      limit: options.limit || 20,
      page: options.page || 1,
      sortBy: 'published_at',
      sortOrder: 'desc' as const
    }

    return await this.getMany(queryOptions)
  }

  /**
   * Custom method: Increment view count
   */
  public async incrementViewCount(id: string) {
    try {
      const { data, error } = await this.client
        .rpc('increment_blog_view_count', { blog_post_id: id })

      if (error) {
        throw error
      }

      return { success: true, newCount: data }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Override create to ensure unique slug
   */
  public async create(data: BlogPostCreate) {
    // Ensure unique slug
    if (data.slug) {
      const uniqueSlug = await ensureUniqueSlug(
        this.client,
        TABLE_NAMES.BLOG_POSTS,
        data.slug
      )
      data = { ...data, slug: uniqueSlug }
    }

    return await super.create(data)
  }

  /**
   * Override update to ensure unique slug
   */
  public async update(id: string, data: BlogPostUpdate) {
    // Ensure unique slug if updating
    if (data.slug) {
      const uniqueSlug = await ensureUniqueSlug(
        this.client,
        TABLE_NAMES.BLOG_POSTS,
        data.slug,
        id
      )
      data = { ...data, slug: uniqueSlug }
    }

    return await super.update(id, data)
  }
}

// ================================
// Team Member DAL Example
// ================================

/**
 * Team Member Data Access Layer
 * Handles team member CRUD operations with professional profile management
 */
export class TeamMemberDAL extends BaseDAL<TeamMember, TeamMemberCreate, TeamMemberUpdate> {
  constructor(client: SupabaseClient) {
    super(
      client,
      TABLE_NAMES.TEAM_MEMBERS,
      ['name', 'title', 'bio', 'expertise'], // searchable columns
      true, // requires audit
      DataClassification.INTERNAL
    )
  }

  protected getCreateSchema(): z.ZodSchema<TeamMemberCreate> {
    return TeamMemberCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<TeamMemberUpdate> {
    return TeamMemberUpdateSchema
  }

  protected transformForSave(
    data: TeamMemberCreate | TeamMemberUpdate,
    context?: DataAccessContext
  ): Record<string, any> {
    const transformed: Record<string, any> = { ...data }

    // Sanitize social media URLs
    if (transformed.linkedin_url && !transformed.linkedin_url.startsWith('https://')) {
      transformed.linkedin_url = `https://linkedin.com/in/${transformed.linkedin_url}`
    }

    if (transformed.twitter_url && !transformed.twitter_url.startsWith('https://')) {
      transformed.twitter_url = `https://twitter.com/${transformed.twitter_url.replace('@', '')}`
    }

    // Ensure expertise array
    if (!transformed.expertise) {
      transformed.expertise = []
    }

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): TeamMember {
    return {
      id: data.id,
      name: data.name,
      title: data.title,
      bio: data.bio,
      avatar_url: data.avatar_url,
      email: data.email,
      linkedin_url: data.linkedin_url,
      twitter_url: data.twitter_url,
      expertise: data.expertise || [],
      is_featured: data.is_featured || false,
      display_order: data.display_order || 0,
      status: data.status,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  /**
   * Custom method: Get featured team members
   */
  public async getFeatured(limit: number = 10) {
    const queryOptions = {
      filters: { 
        is_featured: true,
        status: 'published'
      },
      limit,
      sortBy: 'display_order',
      sortOrder: 'asc' as const
    }

    return await this.getMany(queryOptions)
  }

  /**
   * Custom method: Get team members by expertise
   */
  public async getByExpertise(expertise: string[]) {
    const queryOptions = {
      filters: { 
        status: 'published',
        expertise: `cs.{${expertise.join(',')}}`
      },
      sortBy: 'display_order',
      sortOrder: 'asc' as const
    }

    return await this.getMany(queryOptions)
  }

  /**
   * Custom method: Update display order for multiple members
   */
  public async updateDisplayOrder(updates: { id: string; display_order: number }[]) {
    return await this.executeInTransaction(async (dal) => {
      const results = []
      for (const update of updates) {
        const result = await dal.update(update.id, { 
          display_order: update.display_order 
        } as TeamMemberUpdate)
        results.push(result)
      }
      return results
    })
  }
}

// ================================
// Factory Functions
// ================================

/**
 * Factory function to create Blog Post DAL instance
 */
export function createBlogPostDAL(client: SupabaseClient): BlogPostDAL {
  return new BlogPostDAL(client)
}

/**
 * Factory function to create Team Member DAL instance
 */
export function createTeamMemberDAL(client: SupabaseClient): TeamMemberDAL {
  return new TeamMemberDAL(client)
}

// ================================
// Usage Examples
// ================================

/**
 * Example usage patterns for the admin DAL system
 */
export class AdminDALUsageExamples {
  private blogPostDAL: BlogPostDAL
  private teamMemberDAL: TeamMemberDAL

  constructor(client: SupabaseClient) {
    this.blogPostDAL = createBlogPostDAL(client)
    this.teamMemberDAL = createTeamMemberDAL(client)
  }

  /**
   * Example: Creating a blog post with proper context
   */
  async createBlogPostExample(context: DataAccessContext) {
    // Set the access context
    this.blogPostDAL.setContext(context)

    // Create a new blog post
    const result = await this.blogPostDAL.create({
      title: "Advanced Healthcare Analytics with AI",
      slug: "healthcare-analytics-ai-2024",
      content: "Healthcare analytics is revolutionizing patient care...",
      author_id: context.userId,
      category_ids: ["health-tech", "ai"],
      tags: ["healthcare", "AI", "analytics", "patient-care"],
      status: "draft" as any,
      meta_description: "Learn how AI-powered healthcare analytics..."
    })

    if (result.error) {
      throw new Error(`Failed to create blog post: ${result.error}`)
    }

    return result.data
  }

  /**
   * Example: Updating team member with validation
   */
  async updateTeamMemberExample(
    memberId: string, 
    context: DataAccessContext
  ) {
    // Set the access context
    this.teamMemberDAL.setContext(context)

    // Update team member
    const result = await this.teamMemberDAL.update(memberId, {
      title: "Senior Healthcare Data Scientist",
      expertise: ["machine-learning", "healthcare-analytics", "HIPAA-compliance"],
      is_featured: true,
      display_order: 1
    })

    if (result.error) {
      throw new Error(`Failed to update team member: ${result.error}`)
    }

    return result.data
  }

  /**
   * Example: Batch operations with transaction
   */
  async batchCreateExample(context: DataAccessContext) {
    this.teamMemberDAL.setContext(context)

    const teamMembers = [
      {
        name: "Dr. Sarah Johnson",
        title: "Chief Medical Officer",
        expertise: ["clinical-research", "telemedicine"],
        is_featured: true,
        display_order: 1,
        status: "published" as any
      },
      {
        name: "Mike Chen",
        title: "Lead Software Engineer",
        expertise: ["full-stack", "healthcare-systems", "security"],
        is_featured: true,
        display_order: 2,
        status: "published" as any
      }
    ]

    const result = await this.teamMemberDAL.createBatch(teamMembers)
    
    if (result.error) {
      throw new Error(`Batch create failed: ${result.error}`)
    }

    return result.data
  }

  /**
   * Example: Health check and monitoring
   */
  async monitoringExample() {
    // Check database health
    const health = await this.blogPostDAL.healthCheck()
    console.log('Database health:', health)

    // Get table statistics
    const stats = await this.blogPostDAL.getStats()
    console.log('Blog post stats:', stats)

    const teamStats = await this.teamMemberDAL.getStats()
    console.log('Team member stats:', teamStats)
  }
}

export default {
  BlogPostDAL,
  TeamMemberDAL,
  createBlogPostDAL,
  createTeamMemberDAL,
  AdminDALUsageExamples
}