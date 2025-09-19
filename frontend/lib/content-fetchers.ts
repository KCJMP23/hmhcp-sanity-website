/**
 * Content Fetchers
 * Dynamic content fetching functions for components to replace hardcoded content
 * Uses Supabase as headless CMS for comprehensive content management
 */

import { createClient } from '@supabase/supabase-js'
import { fetchPageContent } from '@/lib/dal/unified-content'

// Initialize Supabase client for content fetching
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type definitions for content
export interface HeroSection {
  title: string
  subtitle?: string
  primaryCTA?: { text: string; href: string }
  secondaryCTA?: { text: string; href: string }
  backgroundImage?: any
  page: string
  order: number
}

export interface TeamMember {
  name: string
  title: string
  bio?: string
  image?: any
  role: 'leadership' | 'team' | 'advisor'
  order: number
  expertise?: string[]
  email?: string
  socialLinks?: Array<{ platform: string; url: string }>
  published: boolean
}

export interface FeatureGrid {
  title?: string
  description?: string
  features: Array<{
    title: string
    description: string
    icon: string
    image?: any
    linkUrl?: string
    linkText?: string
  }>
  gridType: string
  layout: string
  page: string
  order: number
}

export interface Service {
  title: string
  slug: { current: string }
  shortDescription: string
  description?: any
  features?: Array<{ title: string; description: string }>
  icon: string
  order: number
}

export interface SiteSettings {
  title: string
  description: string
  logo?: any
  favicon?: any
  socialLinks: {
    twitter?: string
    facebook?: string
    linkedin?: string
    instagram?: string
    youtube?: string
  }
  contactInfo: {
    email: string
    phone?: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  footerText: string
}

/**
 * Fetch hero section for a specific page
 */
export async function getHeroSection(page: string): Promise<HeroSection | null> {
  try {
    const { data, error } = await supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'heroSection')
      .eq('status', 'published')
      .filter('content->>page', 'eq', page)
      .order('content->>order')
      .limit(1)
      .single()
    
    if (error || !data) return fallbackContent.heroSection as HeroSection
    
    return data.content as HeroSection
  } catch (error) {
    console.error('Failed to fetch hero section:', error)
    return fallbackContent.heroSection as HeroSection
  }
}

/**
 * Fetch all hero sections for a page (in case there are multiple)
 */
export async function getHeroSections(page: string): Promise<HeroSection[]> {
  try {
    const { data, error } = await supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'heroSection')
      .eq('status', 'published')
      .filter('content->>page', 'eq', page)
      .order('content->>order')
    
    if (error || !data) return []
    
    return data.map(item => item.content as HeroSection)
  } catch (error) {
    console.error('Failed to fetch hero sections:', error)
    return []
  }
}

/**
 * Fetch team members by role
 */
export async function getTeamMembers(role?: string): Promise<TeamMember[]> {
  try {
    let query = supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'teamMember')
      .eq('status', 'published')
      .filter('content->>published', 'eq', 'true')
    
    if (role) {
      query = query.filter('content->>role', 'eq', role)
    }
    
    const { data, error } = await query.order('content->>order')
    
    if (error || !data) return fallbackContent.teamMembers
    
    return data.map(item => item.content as TeamMember)
  } catch (error) {
    console.error('Failed to fetch team members:', error)
    return fallbackContent.teamMembers
  }
}

/**
 * Fetch leadership team specifically
 */
export async function getLeadershipTeam(): Promise<TeamMember[]> {
  return getTeamMembers('leadership')
}

/**
 * Fetch feature grids for a specific page and type
 */
export async function getFeatureGrid(page: string, gridType?: string): Promise<FeatureGrid[]> {
  try {
    let query = supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'featureGrid')
      .eq('status', 'published')
      .filter('content->>page', 'eq', page)
      .filter('content->>published', 'eq', 'true')
    
    if (gridType) {
      query = query.filter('content->>gridType', 'eq', gridType)
    }
    
    const { data, error } = await query.order('content->>order')
    
    if (error || !data) return []
    
    return data.map(item => item.content as FeatureGrid)
  } catch (error) {
    console.error('Failed to fetch feature grids:', error)
    return []
  }
}

/**
 * Fetch services
 */
export async function getServices(): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'service')
      .eq('status', 'published')
      .order('content->>order')
    
    if (error || !data) return fallbackContent.services
    
    return data.map(item => item.content as Service)
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return fallbackContent.services
  }
}

/**
 * Fetch a specific service by slug
 */
export async function getService(slug: string): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'service')
      .eq('status', 'published')
      .filter('content->>slug.current', 'eq', slug)
      .single()
    
    if (error || !data) return null
    
    return data.content as Service
  } catch (error) {
    console.error('Failed to fetch service:', error)
    return null
  }
}

/**
 * Fetch site settings
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const { data, error } = await supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'siteSettings')
      .eq('status', 'published')
      .single()
    
    if (error || !data) return fallbackContent.siteSettings
    
    return data.content as SiteSettings
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
    return fallbackContent.siteSettings
  }
}

/**
 * Fetch content sections for a page
 */
export async function getContentSections(page: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'contentSection')
      .eq('status', 'published')
      .filter('content->>page', 'eq', page)
      .filter('content->>published', 'eq', 'true')
      .order('content->>order')
    
    if (error || !data) return []
    
    return data.map(item => item.content)
  } catch (error) {
    console.error('Failed to fetch content sections:', error)
    return []
  }
}

/**
 * Fetch blog posts from Supabase (user-generated content)
 */
export async function getBlogPosts(limit = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        published_at,
        author_id,
        profiles:author_id(name, avatar_url)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Failed to fetch blog posts:', error)
    return []
  }
}

/**
 * Get fallback content for when CMS is not available
 * This ensures the site still works even if Supabase is down
 */
export const fallbackContent = {
  heroSection: {
    title: "Transforming Healthcare Through Innovation",
    subtitle: "Where cutting-edge technology meets compassionate care",
    primaryCTA: { text: "Explore Our Solutions", href: "/services" },
    secondaryCTA: { text: "Learn More", href: "/about" },
    page: "homepage",
    order: 1
  },
  
  teamMembers: [
    {
      name: "Dr. Sarah Chen",
      title: "Chief Executive Officer",
      bio: "Leading healthcare innovation with 15+ years of experience in digital health transformation.",
      role: "leadership" as const,
      order: 1,
      expertise: ["Digital Health", "Healthcare Innovation", "Strategic Leadership"],
      published: true
    }
  ],
  
  features: [
    {
      title: "Patient-First Approach",
      description: "Every solution we develop prioritizes patient outcomes and experience.",
      icon: "heart"
    },
    {
      title: "Innovation at Scale",
      description: "Cutting-edge technology solutions designed to scale across healthcare systems.", 
      icon: "zap"
    },
    {
      title: "Global Impact",
      description: "Working with healthcare organizations worldwide to improve patient care.",
      icon: "globe"
    }
  ],
  
  services: [
    {
      title: "Strategic Healthcare Consulting",
      slug: { current: "strategic-consulting" },
      shortDescription: "Transform your healthcare organization with our strategic consulting services.",
      features: [
        { title: "Digital Transformation Strategy", description: "Plan and execute digital transformation initiatives" },
        { title: "Operational Excellence", description: "Optimize operations for better patient outcomes" }
      ],
      icon: "lightbulb",
      order: 1
    }
  ],
  
  siteSettings: {
    title: "HM Healthcare Partners",
    description: "Leading healthcare technology consulting and implementation services.",
    socialLinks: {},
    contactInfo: {
      email: "contact@hmhealthcarepartners.com",
      phone: "+1 (555) 123-4567",
      address: {
        street: "123 Innovation Way",
        city: "Boston",
        state: "MA",
        zipCode: "02110",
        country: "United States"
      }
    },
    footerText: "© 2025 HM Healthcare Partners. All rights reserved."
  }
}

/**
 * Helper function to get content with fallback
 */
export async function getContentWithFallback<T>(
  fetcher: () => Promise<T | null>,
  fallback: T
): Promise<T> {
  try {
    const content = await fetcher()
    return content || fallback
  } catch (error) {
    console.error('Content fetch failed, using fallback:', error)
    return fallback
  }
}