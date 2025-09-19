import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface SEOSettings {
  id?: string
  site_title: string
  site_description: string
  meta_keywords: string[]
  robots_txt: string
  google_analytics_id?: string
  google_site_verification?: string
  bing_site_verification?: string
  twitter_handle?: string
  facebook_app_id?: string
  default_og_image?: string
  created_at?: string
  updated_at?: string
}

export interface PageSEO {
  id?: string
  page_path: string
  meta_title: string
  meta_description: string
  meta_keywords?: string[]
  canonical_url?: string
  og_title?: string
  og_description?: string
  og_image?: string
  twitter_card?: 'summary' | 'summary_large_image'
  no_index?: boolean
  no_follow?: boolean
  schema_markup?: any
  created_at?: string
  updated_at?: string
}

export interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export const getSEOSettings = cache(async (): Promise<SEOSettings | null> => {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('seo_settings')
    .select('*')
    .single()
  
  if (error && error.code !== 'PGRST116') { // Not found is ok
    console.error('Error fetching SEO settings:', error)
    return null
  }
  
  return data
})

export const updateSEOSettings = async (settings: Partial<SEOSettings>): Promise<{ success: boolean; error?: string }> => {
  const supabase = await createServerSupabaseClient()
  
  // Check if settings exist
  const { data: existing } = await supabase
    .from('seo_settings')
    .select('id')
    .single()
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('seo_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('seo_settings')
      .insert({
        ...settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { success: true }
}

export const getPageSEO = cache(async (path: string): Promise<PageSEO | null> => {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('page_seo')
    .select('*')
    .eq('page_path', path)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching page SEO:', error)
    return null
  }
  
  return data
})

export const updatePageSEO = async (pageSEO: PageSEO): Promise<{ success: boolean; error?: string }> => {
  const supabase = await createServerSupabaseClient()
  
  // Check if page SEO exists
  const { data: existing } = await supabase
    .from('page_seo')
    .select('id')
    .eq('page_path', pageSEO.page_path)
    .single()
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('page_seo')
      .update({
        ...pageSEO,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('page_seo')
      .insert({
        ...pageSEO,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { success: true }
}

export const getAllPageSEO = cache(async (): Promise<PageSEO[]> => {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('page_seo')
    .select('*')
    .order('page_path')
  
  if (error) {
    console.error('Error fetching all page SEO:', error)
    return []
  }
  
  return data || []
})

export const generateSitemap = async (): Promise<SitemapEntry[]> => {
  const supabase = await createServerSupabaseClient()
  
  const entries: SitemapEntry[] = []
  
  // Add static pages
  const staticPages = [
    { url: '/', changefreq: 'daily' as const, priority: 1.0 },
    { url: '/about', changefreq: 'weekly' as const, priority: 0.8 },
    { url: '/services', changefreq: 'weekly' as const, priority: 0.8 },
    { url: '/platforms', changefreq: 'weekly' as const, priority: 0.8 },
    { url: '/research', changefreq: 'weekly' as const, priority: 0.7 },
    { url: '/education', changefreq: 'weekly' as const, priority: 0.7 },
    { url: '/blog', changefreq: 'daily' as const, priority: 0.9 },
    { url: '/contact', changefreq: 'monthly' as const, priority: 0.6 }
  ]
  
  entries.push(...staticPages.map(page => ({
    ...page,
    lastmod: new Date().toISOString()
  })))
  
  // Add blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
  
  if (posts) {
    entries.push(...posts.map(post => ({
      url: `/blog/${post.slug}`,
      lastmod: post.updated_at,
      changefreq: 'monthly' as const,
      priority: 0.6
    })))
  }
  
  // Add dynamic pages
  const { data: pages } = await supabase
    .from('content_pages')
    .select('slug, updated_at')
    .eq('status', 'published')
  
  if (pages) {
    entries.push(...pages.map(page => ({
      url: `/${page.slug}`,
      lastmod: page.updated_at,
      changefreq: 'weekly' as const,
      priority: 0.5
    })))
  }
  
  return entries
}

export const analyzePageSEO = (content: string, pageSEO: PageSEO) => {
  const analysis = {
    score: 0,
    issues: [] as string[],
    warnings: [] as string[],
    successes: [] as string[]
  }
  
  // Title length check
  if (pageSEO.meta_title) {
    if (pageSEO.meta_title.length < 30) {
      analysis.issues.push('Title is too short (< 30 characters)')
    } else if (pageSEO.meta_title.length > 60) {
      analysis.warnings.push('Title is too long (> 60 characters)')
    } else {
      analysis.successes.push('Title length is optimal')
      analysis.score += 10
    }
  } else {
    analysis.issues.push('No meta title set')
  }
  
  // Description length check
  if (pageSEO.meta_description) {
    if (pageSEO.meta_description.length < 120) {
      analysis.issues.push('Description is too short (< 120 characters)')
    } else if (pageSEO.meta_description.length > 160) {
      analysis.warnings.push('Description is too long (> 160 characters)')
    } else {
      analysis.successes.push('Description length is optimal')
      analysis.score += 10
    }
  } else {
    analysis.issues.push('No meta description set')
  }
  
  // Keywords check
  if (pageSEO.meta_keywords && pageSEO.meta_keywords.length > 0) {
    if (pageSEO.meta_keywords.length > 10) {
      analysis.warnings.push('Too many keywords (> 10)')
    } else {
      analysis.successes.push('Keywords are set')
      analysis.score += 5
    }
    
    // Check if keywords appear in content
    const lowerContent = content.toLowerCase()
    const keywordsInContent = pageSEO.meta_keywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    )
    
    if (keywordsInContent.length > 0) {
      analysis.successes.push(`${keywordsInContent.length} keywords found in content`)
      analysis.score += 10
    } else {
      analysis.warnings.push('Keywords not found in content')
    }
  }
  
  // Open Graph check
  if (pageSEO.og_title && pageSEO.og_description) {
    analysis.successes.push('Open Graph tags are set')
    analysis.score += 10
  } else {
    analysis.warnings.push('Open Graph tags are missing')
  }
  
  // Schema markup check
  if (pageSEO.schema_markup) {
    analysis.successes.push('Schema markup is present')
    analysis.score += 15
  } else {
    analysis.warnings.push('No schema markup found')
  }
  
  // Calculate final score
  analysis.score = Math.min(100, analysis.score + 50) // Base score of 50
  
  return analysis
}