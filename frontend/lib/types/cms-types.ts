// Comprehensive Content Management System Types
// This defines all editable content types for the HMHCP website

export interface BaseContentItem {
  id: string
  type: string
  slug: string
  title: string
  status: 'draft' | 'published' | 'archived'
  author_id: string
  created_at: string
  updated_at: string
  published_at?: string
  meta?: ContentMetadata
}

export interface ContentMetadata {
  seo_title?: string
  seo_description?: string
  og_image?: string
  canonical_url?: string
  no_index?: boolean
  schema_markup?: any
  custom_css?: string
  custom_js?: string
}

// Homepage Content Types
export interface HeroSection {
  headline: string
  subheadline: string
  description: string
  primary_cta: {
    text: string
    href: string
    variant?: 'primary' | 'secondary'
  }
  secondary_cta?: {
    text: string
    href: string
    variant?: 'primary' | 'secondary'
  }
  background_image?: string
  background_video?: string
  overlay_opacity?: number
}

export interface AppleStyleCROCard {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string // Lucide icon name
  background_image?: string
  theme: 'light' | 'dark'
  sort_order: number
  primary_button: {
    text: string
    href: string
  }
  secondary_button: {
    text: string
    href: string
  }
}

export interface PhoneScreen {
  id: string
  title: string
  subtitle: string
  sort_order: number
  content_type: 'dashboard' | 'intelliscore' | 'appointments' | 'team' | 'analytics' | 'insights'
  content_data: any // JSON content for the specific screen type
  features: ScreenFeature[]
}

export interface ScreenFeature {
  icon: string // Lucide icon name
  color: string
  title: string
  description: string
}

// Navigation Types
export interface NavigationMenu {
  id: string
  name: string
  location: 'primary' | 'footer' | 'mobile'
  items: NavigationItem[]
  sort_order: number
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  target?: '_blank' | '_self'
  icon?: string
  children?: NavigationItem[]
  sort_order: number
  description?: string
  mega_menu?: boolean
  featured?: boolean
}

// Platform Content Types
export interface PlatformPage {
  id: string
  platform_key: 'mybc-health' | 'intellic-edc' | 'regulatory-ai'
  title: string
  subtitle?: string
  description: string
  hero_section: HeroSection
  features: PlatformFeature[]
  screenshots: PlatformScreenshot[]
  integrations: PlatformIntegration[]
  pricing?: PricingTier[]
  testimonials?: Testimonial[]
  cta_sections: CTASection[]
}

export interface PlatformFeature {
  id: string
  title: string
  description: string
  icon: string
  category: string
  sort_order: number
  highlighted?: boolean
}

export interface PlatformScreenshot {
  id: string
  title: string
  description?: string
  image_url: string
  alt_text: string
  sort_order: number
  device_type: 'desktop' | 'mobile' | 'tablet'
}

export interface PlatformIntegration {
  id: string
  name: string
  description?: string
  logo_url: string
  category: string
  sort_order: number
}

// Service Content Types
export interface ServicePage {
  id: string
  service_key: string
  title: string
  subtitle?: string
  description: string
  hero_section: HeroSection
  service_categories: ServiceCategory[]
  process_steps: ProcessStep[]
  case_studies?: CaseStudy[]
  team_members?: TeamMember[]
  cta_sections: CTASection[]
}

export interface ServiceCategory {
  id: string
  title: string
  description: string
  icon: string
  services: ServiceItem[]
  sort_order: number
}

export interface ServiceItem {
  id: string
  title: string
  description: string
  features: string[]
  pricing?: string
  duration?: string
  sort_order: number
}

export interface ProcessStep {
  id: string
  step_number: number
  title: string
  description: string
  icon: string
  details?: string[]
}

// Research Content Types
export interface ResearchPage {
  id: string
  research_type: 'clinical-studies' | 'publications' | 'qa-qi'
  title: string
  subtitle?: string
  description: string
  hero_section: HeroSection
  research_items: ResearchItem[]
  statistics?: ResearchStatistic[]
  methodologies?: ResearchMethodology[]
}

export interface ResearchItem {
  id: string
  title: string
  description: string
  category: string
  status: string
  publication_date?: string
  authors: string[]
  journal?: string
  doi?: string
  pdf_url?: string
  abstract?: string
  tags: string[]
  sort_order: number
}

export interface ResearchStatistic {
  id: string
  label: string
  value: string
  description?: string
  icon?: string
  sort_order: number
}

export interface ResearchMethodology {
  id: string
  title: string
  description: string
  steps: string[]
  sort_order: number
}

// Common Content Types
export interface CTASection {
  id: string
  title: string
  description?: string
  primary_cta: {
    text: string
    href: string
    variant?: 'primary' | 'secondary'
  }
  secondary_cta?: {
    text: string
    href: string
    variant?: 'primary' | 'secondary'
  }
  background_color?: string
  background_image?: string
  sort_order: number
}

export interface Testimonial {
  id: string
  quote: string
  author: string
  title: string
  company?: string
  avatar_url?: string
  rating?: number
  sort_order: number
}

export interface TeamMember {
  id: string
  name: string
  title: string
  bio: string
  avatar_url?: string
  linkedin_url?: string
  email?: string
  specialties: string[]
  sort_order: number
}

export interface CaseStudy {
  id: string
  title: string
  description: string
  challenge: string
  solution: string
  results: string[]
  client?: string
  image_url?: string
  tags: string[]
  sort_order: number
}

export interface PricingTier {
  id: string
  name: string
  description?: string
  price: string
  billing_period: string
  features: string[]
  highlighted?: boolean
  cta_text: string
  cta_href: string
  sort_order: number
}

// Footer Content Types
export interface FooterContent {
  id: string
  company_description: string
  contact_info: ContactInfo
  social_links: SocialLink[]
  footer_columns: FooterColumn[]
  copyright_text: string
  privacy_links: PrivacyLink[]
}

export interface ContactInfo {
  address: string
  phone: string
  email: string
  hours?: string
}

export interface SocialLink {
  id: string
  platform: string
  url: string
  icon: string
  sort_order: number
}

export interface FooterColumn {
  id: string
  title: string
  links: FooterLink[]
  sort_order: number
}

export interface FooterLink {
  id: string
  label: string
  href: string
  target?: '_blank' | '_self'
  sort_order: number
}

export interface PrivacyLink {
  id: string
  label: string
  href: string
  sort_order: number
}

// Blog Content Types (extending existing)
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  author_id: string
  category_id?: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  created_at: string
  updated_at: string
  seo_title?: string
  seo_description?: string
  reading_time?: number
  view_count?: number
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  sort_order: number
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  color?: string
  post_count?: number
}

// BMAD Agent Integration Types
export interface AIGenerationRequest {
  content_type: string
  content_id?: string
  agent_type: 'creative-writing-studio' | 'web-growth-pack' | 'healthcare-compliance-auditor' | 'infrastructure-devops'
  prompt: string
  context?: any
  target_length?: number
  tone?: 'professional' | 'friendly' | 'technical' | 'medical'
  audience?: string
}

export interface AIGenerationResponse {
  id: string
  content: string
  suggestions?: string[]
  seo_recommendations?: SEORecommendation[]
  compliance_notes?: ComplianceNote[]
  metadata?: any
}

export interface SEORecommendation {
  type: 'title' | 'description' | 'keywords' | 'structure'
  suggestion: string
  impact: 'high' | 'medium' | 'low'
}

export interface ComplianceNote {
  type: 'hipaa' | 'fda' | 'accessibility' | 'gdpr'
  issue: string
  recommendation: string
  severity: 'critical' | 'warning' | 'info'
}

// Content Workflow Types
export interface ContentWorkflow {
  id: string
  content_id: string
  content_type: string
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'rejected'
  assigned_to?: string
  reviewer_id?: string
  comments: WorkflowComment[]
  due_date?: string
  created_at: string
  updated_at: string
}

export interface WorkflowComment {
  id: string
  author_id: string
  content: string
  type: 'comment' | 'approval' | 'rejection' | 'edit_request'
  created_at: string
}

// Media Library Types
export interface MediaItem {
  id: string
  filename: string
  original_filename: string
  url: string
  thumbnail_url?: string
  mime_type: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
  alt_text?: string
  caption?: string
  description?: string
  tags: string[]
  uploaded_by: string
  created_at: string
  folder_path?: string
  seo_filename?: string
}

export interface MediaFolder {
  id: string
  name: string
  parent_id?: string
  path: string
  description?: string
  created_at: string
  updated_at: string
}

// Analytics and Reporting Types
export interface ContentAnalytics {
  content_id: string
  content_type: string
  page_views: number
  unique_visitors: number
  bounce_rate: number
  average_time_on_page: number
  conversion_rate?: number
  engagement_score: number
  last_updated: string
}

export interface SEOMetrics {
  content_id: string
  google_ranking?: number
  organic_traffic: number
  click_through_rate?: number
  impressions?: number
  keywords: KeywordRanking[]
  last_analyzed: string
}

export interface KeywordRanking {
  keyword: string
  position: number
  search_volume: number
  difficulty: number
}

// Component-specific content types for existing React components
export interface HomepageContent {
  hero: HeroSection
  cro_showcase: {
    title: string
    subtitle: string
    description: string
    cards: AppleStyleCROCard[]
  }
  phone_showcase: {
    title: string
    subtitle: string
    screens: PhoneScreen[]
  }
  partners_section?: {
    title: string
    description?: string
    partners: Partner[]
  }
  capabilities_section?: {
    title: string
    description?: string
    capabilities: Capability[]
  }
}

export interface Partner {
  id: string
  name: string
  logo_url: string
  website_url?: string
  description?: string
  sort_order: number
}

export interface Capability {
  id: string
  title: string
  description: string
  icon: string
  category: string
  sort_order: number
}