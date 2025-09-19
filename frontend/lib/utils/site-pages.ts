export interface SitePage {
  id: string
  title: string
  slug: string
  status: 'published' | 'draft' | 'archived'
  updated: string
  category: string
  parent?: string
  description?: string
}

// Complete list of all site pages with proper categorization
export const sitePages: SitePage[] = [
  // Main Pages
  { id: 'home', title: 'Home', slug: '/', status: 'published', updated: '2025-01-16', category: 'main' },
  { id: 'about', title: 'About Us', slug: '/about', status: 'published', updated: '2025-01-16', category: 'main' },
  { id: 'contact', title: 'Contact', slug: '/contact', status: 'published', updated: '2025-01-16', category: 'main' },
  { id: 'search', title: 'Search', slug: '/search', status: 'published', updated: '2025-01-16', category: 'main' },
  { id: 'sitemap', title: 'Sitemap', slug: '/sitemap', status: 'published', updated: '2025-01-16', category: 'main' },
  
  // Services
  { id: 'services', title: 'Services', slug: '/services', status: 'published', updated: '2025-01-16', category: 'services' },
  { id: 'services-clinical', title: 'Clinical Research', slug: '/services/clinical-research', status: 'published', updated: '2025-01-16', category: 'services', parent: 'services' },
  { id: 'services-education', title: 'Education & Training', slug: '/services/education-training', status: 'published', updated: '2025-01-16', category: 'services', parent: 'services' },
  { id: 'services-consulting', title: 'Healthcare Technology Consulting', slug: '/services/healthcare-technology-consulting', status: 'published', updated: '2025-01-16', category: 'services', parent: 'services' },
  { id: 'services-implementation', title: 'Implementation', slug: '/services/implementation', status: 'published', updated: '2025-01-16', category: 'services', parent: 'services' },
  { id: 'services-quality', title: 'Quality Improvement', slug: '/services/quality-improvement', status: 'published', updated: '2025-01-16', category: 'services', parent: 'services' },
  { id: 'services-research', title: 'Research Services', slug: '/services/research', status: 'published', updated: '2025-01-16', category: 'services', parent: 'services' },
  { id: 'services-strategic', title: 'Strategic Consulting', slug: '/services/strategic-consulting', status: 'published', updated: '2025-01-16', category: 'services', parent: 'services' },
  
  // Platforms
  { id: 'platforms', title: 'Platforms', slug: '/platforms', status: 'published', updated: '2025-01-16', category: 'platforms' },
  { id: 'platforms-research', title: 'Research Hub', slug: '/platforms/research-hub', status: 'published', updated: '2025-01-16', category: 'platforms', parent: 'platforms' },
  
  // Research
  { id: 'research', title: 'Research', slug: '/research', status: 'published', updated: '2025-01-16', category: 'research' },
  { id: 'research-case', title: 'Case Studies', slug: '/research/case-studies', status: 'published', updated: '2025-01-16', category: 'research', parent: 'research' },
  { id: 'research-clinical', title: 'Clinical Studies', slug: '/research/clinical-studies', status: 'published', updated: '2025-01-16', category: 'research', parent: 'research' },
  { id: 'research-collab', title: 'Collaborations', slug: '/research/collaborations', status: 'published', updated: '2025-01-16', category: 'research', parent: 'research' },
  { id: 'research-pub', title: 'Publications', slug: '/research/publications', status: 'published', updated: '2025-01-16', category: 'research', parent: 'research' },
  { id: 'research-qa', title: 'QA/QI Studies', slug: '/research/qa-qi', status: 'published', updated: '2025-01-16', category: 'research', parent: 'research' },
  { id: 'research-white', title: 'White Papers', slug: '/research/white-papers', status: 'published', updated: '2025-01-16', category: 'research', parent: 'research' },
  
  // Blog
  { id: 'blog', title: 'Blog', slug: '/blog', status: 'published', updated: '2025-01-16', category: 'blog' },
  { id: 'blog-all', title: 'All Posts', slug: '/blog/all', status: 'published', updated: '2025-01-16', category: 'blog', parent: 'blog' },
  
  // About Section
  { id: 'leadership', title: 'Leadership', slug: '/leadership', status: 'archived', updated: '2025-01-16', category: 'about' },
  { id: 'partners', title: 'Partners', slug: '/partners', status: 'published', updated: '2025-01-16', category: 'about' },
  { id: 'careers', title: 'Careers', slug: '/careers', status: 'published', updated: '2025-01-16', category: 'about' },
  { id: 'careers-culture', title: 'Culture', slug: '/careers/culture', status: 'published', updated: '2025-01-16', category: 'about', parent: 'careers' },
  { id: 'careers-positions', title: 'Open Positions', slug: '/careers/open-positions', status: 'published', updated: '2025-01-16', category: 'about', parent: 'careers' },
  
  // Resources
  { id: 'resources', title: 'Resources', slug: '/resources', status: 'published', updated: '2025-01-16', category: 'resources' },
  { id: 'education', title: 'Education', slug: '/education', status: 'archived', updated: '2025-01-16', category: 'resources' },
  { id: 'publications', title: 'Publications', slug: '/publications', status: 'published', updated: '2025-01-16', category: 'resources' },
  { id: 'case-studies', title: 'Case Studies', slug: '/case-studies', status: 'archived', updated: '2025-01-16', category: 'resources' },
  { id: 'events', title: 'Events', slug: '/events', status: 'published', updated: '2025-01-16', category: 'resources' },
  { id: 'webinars', title: 'Webinars', slug: '/webinars', status: 'archived', updated: '2025-01-16', category: 'resources' },
  { id: 'newsletter', title: 'Newsletter', slug: '/newsletter', status: 'published', updated: '2025-01-16', category: 'resources' },
  { id: 'faq', title: 'FAQ', slug: '/faq', status: 'archived', updated: '2025-01-16', category: 'resources' },
  { id: 'testimonials', title: 'Testimonials', slug: '/testimonials', status: 'published', updated: '2025-01-16', category: 'resources' },
  
  // Legal
  { id: 'privacy', title: 'Privacy Policy', slug: '/privacy', status: 'published', updated: '2025-01-16', category: 'legal' },
  { id: 'privacy-policy', title: 'Privacy Policy (Alt)', slug: '/privacy-policy', status: 'published', updated: '2025-01-16', category: 'legal' },
  { id: 'terms', title: 'Terms of Service', slug: '/terms', status: 'published', updated: '2025-01-16', category: 'legal' },
  { id: 'terms-service', title: 'Terms of Service (Alt)', slug: '/terms-of-service', status: 'published', updated: '2025-01-16', category: 'legal' },
  { id: 'cookie-policy', title: 'Cookie Policy', slug: '/cookie-policy', status: 'published', updated: '2025-01-16', category: 'legal' },
  { id: 'accessibility', title: 'Accessibility', slug: '/accessibility', status: 'published', updated: '2025-01-16', category: 'legal' },
  
  // System
  { id: 'offline', title: 'Offline', slug: '/offline', status: 'published', updated: '2025-01-16', category: 'system' },
  { id: 'diagnostic', title: 'Diagnostic', slug: '/diagnostic', status: 'draft', updated: '2025-01-16', category: 'system' },
  { id: 'test', title: 'Test Page', slug: '/test', status: 'draft', updated: '2025-01-16', category: 'system' },
  { id: 'test-page', title: 'Test Page 2', slug: '/test-page', status: 'draft', updated: '2025-01-16', category: 'system' },
]

// Helper functions
export function getPagesByCategory(category: string): SitePage[] {
  return sitePages.filter(page => page.category === category)
}

export function getChildPages(parentId: string): SitePage[] {
  return sitePages.filter(page => page.parent === parentId)
}

export function getPageBySlug(slug: string): SitePage | undefined {
  return sitePages.find(page => page.slug === slug)
}

export function getPageById(id: string): SitePage | undefined {
  return sitePages.find(page => page.id === id)
}

export function getPublishedPages(): SitePage[] {
  return sitePages.filter(page => page.status === 'published')
}

export function getPageCategories(): string[] {
  return [...new Set(sitePages.map(page => page.category))].sort()
}

export function getPageStats() {
  const total = sitePages.length
  const published = sitePages.filter(p => p.status === 'published').length
  const draft = sitePages.filter(p => p.status === 'draft').length
  const archived = sitePages.filter(p => p.status === 'archived').length
  const categories = getPageCategories().length
  
  return { total, published, draft, archived, categories }
}