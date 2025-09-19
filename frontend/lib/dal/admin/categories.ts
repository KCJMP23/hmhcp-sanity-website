/**
 * Categories Data Access Layer (DAL)
 * Category management with hierarchical relationships
 * Provides type-safe database operations for content categorization
 */

import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { InjectableBaseDAL, DALUtils } from './base-injectable'
import { logger } from '@/lib/logger'
import {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryCreateSchema,
  CategoryUpdateSchema,
  DataClassification,
  CategoryType,
  QueryResult,
  PaginatedResult,
  QueryOptions,
  DataAccessContext
} from './types'
import {
  sanitizeInput,
  validateHexColor,
  sanitizeCategoryDescription,
  TABLE_NAMES
} from './utils'

/**
 * Categories Data Access Layer
 * Manages content categories with hierarchical relationships
 * and type-specific validation
 */
export class CategoriesDAL extends InjectableBaseDAL<Category, CategoryCreate, CategoryUpdate> {
  private dataClassification: DataClassification

  constructor(client: SupabaseClient, utils?: DALUtils) {
    super(
      client,
      TABLE_NAMES.CATEGORIES,
      ['name', 'description', 'slug'], // searchable columns
      true, // requires audit
      utils
    )
    this.dataClassification = DataClassification.INTERNAL
  }

  // ================================
  // Schema Methods
  // ================================

  protected getCreateSchema(): z.ZodSchema<CategoryCreate> {
    return CategoryCreateSchema
  }

  protected getUpdateSchema(): z.ZodSchema<CategoryUpdate> {
    return CategoryUpdateSchema
  }

  // ================================
  // Data Transformation
  // ================================

  protected transformForSave(data: CategoryCreate | CategoryUpdate, context?: DataAccessContext): Record<string, any> {
    const transformed = {
      ...data,
      display_order: data.display_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      description: this.sanitizeDescription(data.description || ''),
      color: data.color ? this.validateColor(data.color) : undefined
    }

    // Validate hierarchical relationships
    if (transformed.parent_id) {
      this.validateParentRelationship(transformed)
    }

    return transformed
  }

  protected transformFromDatabase(data: Record<string, any>): Category {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: data.type as CategoryType,
      parent_id: data.parent_id,
      color: data.color,
      icon: data.icon,
      display_order: data.display_order || 0,
      is_active: data.is_active !== false,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // ================================
  // Category-Specific Methods
  // ================================

  /**
   * Sanitizes category description
   */
  private sanitizeDescription(description: string): string {
    if (!description || typeof description !== 'string') {
      return ''
    }

    // Basic sanitization for category descriptions
    let sanitized = description.trim()

    // Remove any HTML tags that might have been inserted
    sanitized = sanitized.replace(/<[^>]*>/g, '')

    // Limit length for SEO and usability
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 497) + '...'
    }

    return sanitized
  }

  /**
   * Validates hex color format
   */
  private validateColor(color: string): string {
    try {
      if (!validateHexColor(color)) {
        logger.warn('Invalid hex color format', { color })
        return '#666666' // Default gray color
      }
      return color
    } catch (error) {
      logger.error('Color validation error', { color, error })
      return '#666666'
    }
  }

  /**
   * Validates parent-child relationships to prevent circular references
   */
  private validateParentRelationship(data: any): void {
    // This is a basic validation - in a real implementation,
    // you'd want to check for circular references in the database
    if (data.id && data.parent_id === data.id) {
      throw new Error('Category cannot be its own parent')
    }
  }

  // ================================
  // Specialized Query Methods
  // ================================

  /**
   * Gets category by slug
   */
  public async getBySlug(slug: string): Promise<QueryResult<Category>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (result.error) {
        logger.warn('Category not found by slug', { slug, error: result.error.message })
        return { data: null, error: 'Category not found' }
      }

      const category = this.transformFromDatabase(result.data)

      // Log access for audit
      if (this.requiresAudit && this.context) {
        await this.logAuditAction('VIEW' as any, category.id, { slug })
      }

      return { data: category, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get by slug failed', { slug, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets active categories by type
   */
  public async getCategoriesByType(type: CategoryType, includeInactive: boolean = false): Promise<QueryResult<Category[]>> {
    try {
      this.validateAccess('read')

      let query = this.client
        .from(this.tableName)
        .select('*')
        .eq('type', type)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const result = await query

      if (result.error) {
        logger.error('Failed to get categories by type', { type, error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const categories = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: categories, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get categories by type failed', { type, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets top-level categories (no parent)
   */
  public async getTopLevelCategories(type?: CategoryType): Promise<QueryResult<Category[]>> {
    try {
      this.validateAccess('read')

      let query = this.client
        .from(this.tableName)
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (type) {
        query = query.eq('type', type)
      }

      const result = await query

      if (result.error) {
        logger.error('Failed to get top-level categories', { type, error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const categories = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: categories, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get top-level categories failed', { type, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets child categories of a parent category
   */
  public async getChildCategories(parentId: string): Promise<QueryResult<Category[]>> {
    try {
      this.validateAccess('read')

      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (result.error) {
        logger.error('Failed to get child categories', { parentId, error: result.error.message })
        return { data: null, error: result.error.message }
      }

      const categories = (result.data || []).map(item => this.transformFromDatabase(item))
      return { data: categories, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get child categories failed', { parentId, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Gets the category hierarchy as a tree structure
   */
  public async getCategoryTree(type?: CategoryType): Promise<QueryResult<Array<Category & { children?: Category[] }>>> {
    try {
      this.validateAccess('read')

      // Get all categories of the specified type
      const allCategories = await this.getCategoriesByType(
        type || CategoryType.BLOG, // Default to blog if no type specified
        false
      )

      if (!allCategories.data) {
        return { data: null, error: allCategories.error }
      }

      // Build the tree structure
      const categoryMap = new Map<string, Category & { children: Category[] }>()
      const rootCategories: Array<Category & { children: Category[] }> = []

      // Initialize all categories with empty children arrays
      allCategories.data.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] })
      })

      // Build parent-child relationships
      allCategories.data.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id)!
        
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id)
          if (parent) {
            parent.children.push(categoryWithChildren)
          }
        } else {
          rootCategories.push(categoryWithChildren)
        }
      })

      // Sort children by display_order and name
      const sortCategories = (categories: Array<Category & { children: Category[] }>) => {
        categories.sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order
          }
          return a.name.localeCompare(b.name)
        })
        categories.forEach(category => sortCategories(category.children))
      }

      sortCategories(rootCategories)

      return { data: rootCategories, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get category tree failed', { type, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Updates display order for categories (batch operation)
   */
  public async updateDisplayOrder(orderUpdates: { id: string; display_order: number }[]): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('write')

      if (orderUpdates.length === 0) {
        return { data: true, error: null }
      }

      // Validate all IDs exist
      for (const update of orderUpdates) {
        const category = await this.getById(update.id)
        if (!category.data) {
          return { data: null, error: `Category not found: ${update.id}` }
        }
      }

      // Execute updates in transaction-like manner
      const updatePromises = orderUpdates.map(update =>
        this.update(update.id, { display_order: update.display_order })
      )

      const results = await Promise.all(updatePromises)
      
      // Check if any update failed
      const failedUpdate = results.find(result => result.error)
      if (failedUpdate) {
        return { data: null, error: failedUpdate.error }
      }

      logger.info('Category display order updated successfully', {
        updates: orderUpdates.length,
        userId: this.context?.userId
      })

      return { data: true, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Update display order failed', { 
        updates: orderUpdates.length, 
        error: errorMessage 
      })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Toggles active status for a category
   */
  public async toggleActive(id: string): Promise<QueryResult<Category>> {
    try {
      this.validateAccess('write')

      const currentCategory = await this.getById(id)
      if (!currentCategory.data) {
        return { data: null, error: 'Category not found' }
      }

      // If deactivating a category with children, warn user
      if (currentCategory.data.is_active) {
        const children = await this.getChildCategories(id)
        if (children.data && children.data.length > 0) {
          logger.warn('Deactivating category with child categories', {
            categoryId: id,
            childCount: children.data.length
          })
        }
      }

      return await this.update(id, {
        is_active: !currentCategory.data.is_active
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Toggle active failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Validates slug uniqueness within the same type
   */
  public async validateSlugUniqueness(slug: string, type: CategoryType, excludeId?: string): Promise<QueryResult<boolean>> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('id')
        .eq('slug', slug)
        .eq('type', type)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const result = await query.single()

      // If no data found, slug is unique
      const isUnique = !result.data

      return { data: isUnique, error: null }

    } catch (error) {
      logger.error('Slug validation failed', { slug, type, error })
      return { data: null, error: 'Failed to validate slug uniqueness' }
    }
  }

  /**
   * Gets category usage statistics
   */
  public async getCategoryStats(): Promise<QueryResult<{
    totalCategories: number
    activeCategories: number
    categoriesByType: { type: CategoryType; count: number }[]
    topLevelCategories: number
    avgChildrenPerParent: number
  }>> {
    try {
      this.validateAccess('read')

      const allCategories = await this.getMany({ limit: 1000 })
      
      if (!allCategories.data) {
        return { data: null, error: 'Failed to fetch category statistics' }
      }

      const activeCategories = allCategories.data.filter(category => category.is_active)
      const topLevelCategories = allCategories.data.filter(category => !category.parent_id)

      // Count categories by type
      const typeCounts: Record<CategoryType, number> = {
        [CategoryType.BLOG]: 0,
        [CategoryType.SERVICE]: 0,
        [CategoryType.PLATFORM]: 0,
        [CategoryType.RESEARCH]: 0
      }

      allCategories.data.forEach(category => {
        typeCounts[category.type] = (typeCounts[category.type] || 0) + 1
      })

      const categoriesByType = Object.entries(typeCounts)
        .map(([type, count]) => ({ type: type as CategoryType, count }))
        .filter(item => item.count > 0)

      // Calculate average children per parent
      const parentIds = new Set(allCategories.data
        .filter(cat => cat.parent_id)
        .map(cat => cat.parent_id!))
      
      const avgChildrenPerParent = parentIds.size > 0 
        ? allCategories.data.filter(cat => cat.parent_id).length / parentIds.size 
        : 0

      const stats = {
        totalCategories: allCategories.data.length,
        activeCategories: activeCategories.length,
        categoriesByType,
        topLevelCategories: topLevelCategories.length,
        avgChildrenPerParent: Math.round(avgChildrenPerParent * 100) / 100
      }

      return { data: stats, error: null }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Get category stats failed', { error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Search categories by name or description
   */
  public async searchCategories(query: string, type?: CategoryType, options: QueryOptions = {}): Promise<PaginatedResult<Category>> {
    const searchOptions = {
      ...options,
      search: query,
      filters: {
        ...options.filters,
        is_active: true,
        ...(type && { type })
      }
    }

    return await this.getMany(searchOptions)
  }

  /**
   * Moves a category to a new parent (or makes it top-level)
   */
  public async moveCategory(categoryId: string, newParentId?: string): Promise<QueryResult<Category>> {
    try {
      this.validateAccess('write')

      // Validate the category exists
      const category = await this.getById(categoryId)
      if (!category.data) {
        return { data: null, error: 'Category not found' }
      }

      // If setting a new parent, validate it exists and prevent circular references
      if (newParentId) {
        const newParent = await this.getById(newParentId)
        if (!newParent.data) {
          return { data: null, error: 'New parent category not found' }
        }

        // Prevent circular reference (basic check - in production, you'd do a full tree check)
        if (newParentId === categoryId) {
          return { data: null, error: 'Category cannot be its own parent' }
        }

        // Check if the new parent is a descendant of this category
        const descendants = await this.getChildCategories(categoryId)
        if (descendants.data?.some(child => child.id === newParentId)) {
          return { data: null, error: 'Cannot move category to its own descendant' }
        }
      }

      // Update the parent_id
      return await this.update(categoryId, {
        parent_id: newParentId
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Move category failed', { categoryId, newParentId, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Deletes a category and handles child categories
   */
  public async deleteWithChildren(id: string, moveChildrenToParent: boolean = true): Promise<QueryResult<boolean>> {
    try {
      this.validateAccess('delete')

      const category = await this.getById(id)
      if (!category.data) {
        return { data: null, error: 'Category not found' }
      }

      // Get child categories
      const children = await this.getChildCategories(id)
      
      if (children.data && children.data.length > 0) {
        if (moveChildrenToParent) {
          // Move children to this category's parent (or make them top-level)
          const updatePromises = children.data.map(child =>
            this.update(child.id, { parent_id: category.data!.parent_id })
          )
          
          await Promise.all(updatePromises)
          
          logger.info('Moved child categories to parent', {
            deletedCategoryId: id,
            childCount: children.data.length,
            newParentId: category.data.parent_id
          })
        } else {
          // Delete all children first
          const deletePromises = children.data.map(child => this.delete(child.id))
          await Promise.all(deletePromises)
          
          logger.info('Deleted child categories', {
            deletedCategoryId: id,
            childCount: children.data.length
          })
        }
      }

      // Delete the category
      return await this.delete(id)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Delete with children failed', { id, error: errorMessage })
      return { data: null, error: errorMessage }
    }
  }
}

export default CategoriesDAL