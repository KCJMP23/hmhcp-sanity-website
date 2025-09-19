// This file contains both server actions and utility functions

import { createClient } from '@/lib/supabase/server'
import { createStaticSupabaseClient } from '@/lib/supabase/static-client'
import { mockPosts } from '@/lib/mock-data/blog-posts'

// Export mock blog posts for use in components
export const mockBlogPosts = mockPosts.map(post => ({
  ...post,
  published: post.status === 'published',
  published_at: post.publishedAt,
  created_at: post.publishedAt,
  updated_at: post.updatedAt,
  featured_image: post.featuredImage
}))

export interface ContentPage {
  id: string
  title: string
  slug: string
  content: any
  published: boolean
  created_at: string
  updated_at: string
  seo_title?: string
  seo_description?: string
  featured_image?: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: any
  excerpt?: string
  published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  author_id?: string
  category_id?: string
  featured_image?: string
  seo_title?: string
  seo_description?: string
  tags?: string[]
}

export interface TeamMember {
  id: string
  name: string
  position: string
  bio?: string
  image?: string
  email?: string
  linkedin?: string
  created_at: string
  updated_at: string
}

export interface Platform {
  id: string
  name: string
  description: string
  slug: string
  features?: string[]
  image?: string
  status: 'active' | 'development' | 'archived'
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description: string
  slug: string
  content?: any
  image?: string
  category?: string
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  name: string
  company?: string
  position?: string
  content: string
  rating?: number
  image?: string
  created_at: string
  updated_at: string
}

// Content fetching functions
export async function getPageBySlug(slug: string): Promise<ContentPage | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
    
  if (error || !data) return null
  return data
}

export async function getAllPages(): Promise<ContentPage[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    
  if (error) return []
  return data || []
}

export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  // If Supabase fails, return mock data
  if (error || !data || data.length === 0) {
    const convertedMockPosts = mockPosts.map(post => ({
      ...post,
      published: post.status === 'published',
      published_at: post.publishedAt,
      created_at: post.publishedAt,
      updated_at: post.updatedAt,
      featured_image: post.featuredImage
    }))
    
    const filteredPosts = convertedMockPosts.filter(post => post.published)
    return limit ? filteredPosts.slice(0, limit) : filteredPosts
  }
  
  return data || []
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  
  // If Supabase fails or no data found, check mock data
  if (error || !data) {
    if (error) {
      console.log('Supabase query error (expected if no post found):', error.message)
    }
    const mockPost = mockPosts.find(post => post.slug === slug && post.status === 'published')
    if (mockPost) {
      return {
        ...mockPost,
        published: mockPost.status === 'published',
        published_at: mockPost.publishedAt,
        created_at: mockPost.publishedAt,
        updated_at: mockPost.updatedAt,
        featured_image: mockPost.featuredImage
      }
    }
    return null
  }
  
  return data
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) return []
  return data || []
}

export async function getPlatforms(): Promise<Platform[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    
  if (error) return []
  return data || []
}

export async function getPlatformBySlug(slug: string): Promise<Platform | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
    
  if (error || !data) return null
  return data
}

export async function getServices(): Promise<Service[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) return []
  return data || []
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
    
  if (error || !data) return null
  return data
}

export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  if (error) return []
  return data || []
}

// Image URL helper (replaces urlFor from Sanity)
export function getSupabaseImageUrl(path: string | null | undefined): string {
  if (!path) return '/images/placeholder.jpg'
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path
  
  // Construct Supabase Storage URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/images/${path}`
}

// Safe image URL helper
export function safeImageUrl(path: string | null | undefined, fallback: string = '/images/placeholder.jpg'): string {
  try {
    return getSupabaseImageUrl(path) || fallback
  } catch {
    return fallback
  }
}

// Hero slides interface
export interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  primaryCTA: {
    text: string
    href: string
  }
  secondaryCTA: {
    text: string
    href: string
  }
  backgroundGradient: string
  badge?: string
  order: number
  isActive: boolean
}

// Fetch hero slides from CMS
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = createStaticSupabaseClient()
    
    // Add timeout to prevent hanging
    const dataPromise = supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'homepage-hero')
      .eq('slug', 'homepage-hero-slides')
      .eq('status', 'published')
      .maybeSingle()
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 3000)
    })
    
    const { data, error } = await Promise.race([dataPromise, timeoutPromise])
      
    if (error || !data) {
      console.log('No hero slides found in database, using fallback')
      return getFallbackHeroSlides()
    }
    
    const content = data.content as { slides?: HeroSlide[] }
    const slides = content?.slides || []
    
    // Filter active slides and sort by order
    return slides
      .filter(slide => slide.isActive)
      .sort((a, b) => a.order - b.order)
    
  } catch (error) {
    console.error('Error in getHeroSlides:', error)
    return getFallbackHeroSlides()
  }
}

// Fallback hero slides when CMS data is unavailable
function getFallbackHeroSlides(): HeroSlide[] {
  return [
    {
      id: "innovation",
      title: "Transforming Healthcare Through Innovation",
      subtitle: "Advanced Technology Solutions",
      description: "Comprehensive healthcare solutions designed to improve patient outcomes and streamline care delivery across all healthcare settings.",
      primaryCTA: {
        text: "Our Platforms",
        href: "/platforms"
      },
      secondaryCTA: {
        text: "Learn More",
        href: "/about"
      },
      backgroundGradient: "from-blue-900 via-blue-800 to-indigo-900",
      backgroundImage: "/hero-healthcare-professional.jpg",
      badge: "Healthcare Technology Leader",
      order: 1,
      isActive: true
    },
    {
      id: "clinical-excellence",
      title: "Clinical Excellence at Scale",
      subtitle: "Evidence-Based Care Solutions",
      description: "AI-powered clinical decision support and predictive analytics that help healthcare professionals deliver exceptional patient care with confidence.",
      primaryCTA: {
        text: "Clinical Solutions",
        href: "/platforms/clinical"
      },
      secondaryCTA: {
        text: "View Research",
        href: "/research"
      },
      backgroundGradient: "from-emerald-900 via-teal-800 to-cyan-900",
      backgroundImage: "/hero-research.jpg",
      badge: "Clinical Innovation",
      order: 2,
      isActive: true
    },
    {
      id: "patient-engagement",
      title: "Empowering Patient Engagement",
      subtitle: "Connected Care Ecosystem",
      description: "Patient-centered tools and telehealth solutions that improve satisfaction, outcomes, and accessibility while reducing healthcare costs.",
      primaryCTA: {
        text: "Patient Solutions",
        href: "/platforms/patient"
      },
      secondaryCTA: {
        text: "Success Stories",
        href: "/case-studies"
      },
      backgroundGradient: "from-purple-900 via-violet-800 to-indigo-900",
      backgroundImage: "/hero-consultation.jpg",
      badge: "Patient-Centered Care",
      order: 3,
      isActive: true
    }
  ]
}

// Platform capabilities interface
export interface PlatformCapability {
  id: string
  title: string
  description: string
  icon?: string
  order: number
  published: boolean
}

// Fetch platform capabilities from CMS
export async function getPlatformCapabilities(): Promise<PlatformCapability[]> {
  try {
    const supabase = createStaticSupabaseClient()
    
    // Add timeout to prevent hanging
    const dataPromise = supabase
      .from('managed_content')
      .select('*')
      .eq('type', 'post')
      .like('slug', 'capability-%')
      .eq('status', 'published')
      .order('created_at', { ascending: true })
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 3000)
    })
    
    const { data, error } = await Promise.race([dataPromise, timeoutPromise])
      
    if (error) {
      console.error('Error fetching platform capabilities:', error)
      return getFallbackCapabilities()
    }
    
    if (!data || data.length === 0) {
      console.log('No platform capabilities found, using fallback')
      return getFallbackCapabilities()
    }
    
    return data.map((item, index) => ({
      id: item.id,
      title: item.title,
      description: item.content?.description || item.content?.excerpt || 'Platform capability description',
      icon: item.content?.icon || '📊',
      order: index + 1,
      published: item.status === 'published'
    }))
    
  } catch (error) {
    console.error('Error in getPlatformCapabilities:', error)
    return getFallbackCapabilities()
  }
}

// Fallback capabilities when CMS data is unavailable
function getFallbackCapabilities(): PlatformCapability[] {
  return [
    {
      id: 'capability-1',
      title: 'Electronic Health Records',
      description: 'Comprehensive EHR management with real-time data synchronization, clinical decision support, and seamless workflow integration.',
      icon: '📋',
      order: 1,
      published: true
    },
    {
      id: 'capability-2', 
      title: 'Clinical Decision Support',
      description: 'AI-powered clinical insights that provide evidence-based recommendations to enhance patient care and reduce medical errors.',
      icon: '🧠',
      order: 2,
      published: true
    },
    {
      id: 'capability-3',
      title: 'Patient Engagement Tools',
      description: 'Interactive patient portals, mobile apps, and communication tools that improve patient satisfaction and health outcomes.',
      icon: '👥',
      order: 3,
      published: true
    },
    {
      id: 'capability-4',
      title: 'Telehealth Integration',
      description: 'Secure video consultations, remote monitoring, and virtual care delivery platforms that expand access to quality healthcare.',
      icon: '💻',
      order: 4,
      published: true
    },
    {
      id: 'capability-5',
      title: 'Analytics & Reporting',
      description: 'Advanced healthcare analytics, population health insights, and customizable reporting dashboards for informed decision-making.',
      icon: '📊',
      order: 5,
      published: true
    },
    {
      id: 'capability-6',
      title: 'Interoperability Standards',
      description: 'FHIR-compliant data exchange, HL7 integration, and seamless connectivity between healthcare systems and devices.',
      icon: '🔗',
      order: 6,
      published: true
    }
  ]
}

// Fallback data for when Supabase is unavailable
export const fallbackData = {
  pages: [
    {
      id: 'home',
      title: 'Healthcare Technology Solutions',
      slug: 'home',
      content: { blocks: [] },
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seo_title: 'HM Healthcare Partners - Technology Solutions',
      seo_description: 'Leading healthcare technology consulting and implementation services.'
    }
  ],
  blogPosts: [],
  teamMembers: [],
  platforms: [],
  services: [],
  testimonials: []
}

// Main content fetcher with fallback
export async function safeFetch<T>(fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await fetcher()
    return result || fallback
  } catch (error) {
    console.error('Content fetch error:', error)
    return fallback
  }
}