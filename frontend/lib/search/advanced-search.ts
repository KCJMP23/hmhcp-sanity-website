/**
 * Advanced Search and Filtering System
 * 
 * This module provides comprehensive search capabilities for the CMS,
 * including full-text search, faceted filtering, and complex queries.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface SearchFilters {
  type?: string[]
  status?: string[]
  author?: string[]
  category?: string[]
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  publishedAfter?: Date
  publishedBefore?: Date
  hasImage?: boolean
  hasContent?: boolean
  searchTerm?: string
}

export interface SearchOptions {
  page: number
  limit: number
  sortBy: 'relevance' | 'date' | 'title' | 'author' | 'popularity'
  sortOrder: 'asc' | 'desc'
  includeDrafts?: boolean
  includeArchived?: boolean
}

export interface SearchResult<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  facets: {
    types: { value: string; count: number }[]
    statuses: { value: string; count: number }[]
    authors: { value: string; count: number }[]
    categories: { value: string; count: number }[]
    tags: { value: string; count: number }[]
  }
  suggestions: string[]
  searchTime: number
}

export interface SearchSuggestion {
  text: string
  type: 'did_you_mean' | 'popular' | 'related'
  score: number
}

/**
 * Advanced search across all content types
 */
export async function advancedSearch(
  filters: SearchFilters,
  options: SearchOptions
): Promise<SearchResult> {
  const startTime = Date.now()
  const supabase = await createServerSupabaseClient()
  
  try {
    // Build base query
    let query = supabase
      .from('managed_content')
      .select('*')
    
    // Apply filters
    query = applySearchFilters(query, filters)
    
    // Apply search term if provided
    if (filters.searchTerm) {
      query = applySearchTerm(query, filters.searchTerm)
    }
    
    // Apply status filters
    if (!options.includeDrafts) {
      query = query.neq('status', 'draft')
    }
    if (!options.includeArchived) {
      query = query.neq('status', 'archived')
    }
    
    // Get total count for pagination
    const { count: total } = await supabase
      .from('managed_content')
      .select('*', { count: 'exact', head: true })
    
    // Apply sorting
    query = applySorting(query, options.sortBy, options.sortOrder)
    
    // Apply pagination
    const offset = (options.page - 1) * options.limit
    query = query.range(offset, offset + options.limit - 1)
    
    // Execute query
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    // Get facets for filtering
    const facets = await getSearchFacets(supabase, filters)
    
    // Get search suggestions
    const suggestions = await getSearchSuggestions(supabase, filters.searchTerm)
    
    const searchTime = Date.now() - startTime
    
    return {
      data: data || [],
      total: total || 0,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil((total || 0) / options.limit),
      facets,
      suggestions,
      searchTime
    }
    
  } catch (error) {
    console.error('Advanced search error:', error)
    throw new Error('Search failed')
  }
}

/**
 * Apply search filters to query
 */
function applySearchFilters(query: any, filters: SearchFilters) {
  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type)
  }
  
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  
  if (filters.author && filters.author.length > 0) {
    query = query.in('author_profile_id', filters.author)
  }
  
  if (filters.category && filters.category.length > 0) {
    query = query.in('category_id', filters.category)
  }
  
  if (filters.dateRange) {
    query = query
      .gte('published_at', filters.dateRange.start.toISOString())
      .lte('published_at', filters.dateRange.end.toISOString())
  }
  
  if (filters.publishedAfter) {
    query = query.gte('published_at', filters.publishedAfter.toISOString())
  }
  
  if (filters.publishedBefore) {
    query = query.lte('published_at', filters.publishedBefore.toISOString())
  }
  
  if (filters.hasImage) {
    query = query.not('featured_image_url', 'is', null)
  }
  
  if (filters.hasContent) {
    query = query.not('content', 'is', null)
  }
  
  return query
}

/**
 * Apply search term with full-text search
 */
function applySearchTerm(query: any, searchTerm: string) {
  // Split search term into words
  const words = searchTerm.split(/\s+/).filter(word => word.length > 2)
  
  if (words.length === 0) {
    return query
  }
  
  // Build OR conditions for each word
  const conditions = words.map(word => 
    `title.ilike.%${word}%,content->>'text'.ilike.%${word}%,excerpt.ilike.%${word}%`
  ).join(',')
  
  return query.or(conditions)
}

/**
 * Apply sorting to query
 */
function applySorting(query: any, sortBy: string, sortOrder: 'asc' | 'desc') {
  switch (sortBy) {
    case 'relevance':
      // For relevance, we'll sort by search score if available
      return query.order('updated_at', { ascending: sortOrder === 'asc' })
    
    case 'date':
      return query.order('published_at', { ascending: sortOrder === 'asc' })
    
    case 'title':
      return query.order('title', { ascending: sortOrder === 'asc' })
    
    case 'author':
      return query.order('author_profile_id', { ascending: sortOrder === 'asc' })
    
    case 'popularity':
      // Assuming we have a views or popularity field
      return query.order('created_at', { ascending: sortOrder === 'asc' })
    
    default:
      return query.order('created_at', { ascending: false })
  }
}

/**
 * Get search facets for filtering
 */
async function getSearchFacets(supabase: any, filters: SearchFilters) {
  try {
    // Get type facets
    const { data: types } = await supabase
      .from('managed_content')
      .select('type, count')
      .group('type')
      .order('count', { ascending: false })
    
    // Get status facets
    const { data: statuses } = await supabase
      .from('managed_content')
      .select('status, count')
      .group('status')
      .order('count', { ascending: false })
    
    // Get author facets
    const { data: authors } = await supabase
      .from('managed_content')
      .select('author_profile_id, count')
      .not('author_profile_id', 'is', null)
      .group('author_profile_id')
      .order('count', { ascending: false })
      .limit(10)
    
    // Get category facets
    const { data: categories } = await supabase
      .from('cms_categories')
      .select('id, name, count')
      .order('count', { ascending: false })
    
    return {
      types: types?.map((t: any) => ({ value: t.type, count: parseInt(t.count) })) || [],
      statuses: statuses?.map((s: any) => ({ value: s.status, count: parseInt(s.count) })) || [],
      authors: authors?.map((a: any) => ({ value: a.author_profile_id, count: parseInt(a.count) })) || [],
      categories: categories?.map((c: any) => ({ value: c.name, count: parseInt(c.count) })) || [],
      tags: [] // Tags not available in current schema
    }
  } catch (error) {
    console.error('Error getting facets:', error)
    return {
      types: [],
      statuses: [],
      authors: [],
      categories: [],
      tags: []
    }
  }
}

/**
 * Get search suggestions
 */
async function getSearchSuggestions(supabase: any, searchTerm?: string): Promise<string[]> {
  if (!searchTerm || searchTerm.length < 3) {
    return []
  }
  
  try {
    // Get popular search terms
    const { data: popular } = await supabase
      .from('managed_content')
      .select('title')
      .ilike('title', `%${searchTerm}%`)
      .limit(5)
    
    // Get related content titles
    const { data: related } = await supabase
      .from('managed_content')
      .select('title')
      .neq('title', searchTerm)
      .ilike('title', `%${searchTerm}%`)
      .limit(5)
    
    const suggestions = [
      ...(popular || []).map((item: any) => item.title),
      ...(related || []).map((item: any) => item.title)
    ]
    
    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, 10)
    
  } catch (error) {
    console.error('Error getting suggestions:', error)
    return []
  }
}

/**
 * Search blog posts specifically
 */
export async function searchBlogPosts(
  searchTerm: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult> {
  const defaultOptions: SearchOptions = {
    page: 1,
    limit: 10,
    sortBy: 'relevance',
    sortOrder: 'desc',
    includeDrafts: false,
    includeArchived: false,
    ...options
  }
  
  return advancedSearch(
    { 
      searchTerm,
      type: ['blog_post', 'post'],
      status: ['published']
    },
    defaultOptions
  )
}

/**
 * Search pages specifically
 */
export async function searchPages(
  searchTerm: string,
  options: Partial<SearchOptions> = {}
): Promise<SearchResult> {
  const defaultOptions: SearchOptions = {
    page: 1,
    limit: 10,
    sortBy: 'relevance',
    sortOrder: 'desc',
    includeDrafts: false,
    includeArchived: false,
    ...options
  }
  
  return advancedSearch(
    { 
      searchTerm,
      type: ['page'],
      status: ['published']
    },
    defaultOptions
  )
}

/**
 * Get search analytics
 */
export async function getSearchAnalytics() {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get search volume over time
    const { data: searchVolume } = await supabase
      .from('audit_logs')
      .select('created_at, action')
      .eq('action', 'search')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
    
    // Get popular search terms (simplified query)
    const { data: popularTerms } = await supabase
      .from('audit_logs')
      .select('metadata')
      .eq('action', 'search')
      .not('metadata', 'is', null)
      .limit(50) // Get more entries to analyze
    
    return {
      searchVolume: searchVolume || [],
      popularTerms: popularTerms || []
    }
    
  } catch (error) {
    console.error('Error getting search analytics:', error)
    return {
      searchVolume: [],
      popularTerms: []
    }
  }
}
