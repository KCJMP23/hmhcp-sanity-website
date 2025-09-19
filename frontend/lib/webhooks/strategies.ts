import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { slugify as generateSlug } from '@/lib/utils'

// Base webhook strategy interface
export interface WebhookStrategy {
  validate(payload: any): z.SafeParseReturnType<any, any>
  transform(payload: any): BlogPostData
  getHeaders(): Record<string, string>
  identifyFromHeaders(headers: Headers): boolean
  identifyFromPayload(payload: any): boolean
}

export interface BlogPostData {
  title: string
  content: string
  excerpt: string
  author: string
  status: 'draft' | 'published'
  tags: string[]
  slug: string
  external_id?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  social_media_content?: any
  featured_image_url?: string
  scheduled_for?: string
  category?: string
}

// Make.com Strategy Implementation
export class MakeComStrategy implements WebhookStrategy {
  private schema = z.object({
    title: z.string().min(1).max(500),
    content: z.string().min(1),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'published']).optional().default('draft'),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional()
    }).optional(),
    social: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      facebook: z.string().optional()
    }).optional(),
    external_id: z.string().optional(),
    scheduled_for: z.string().optional(),
    featured_image: z.string().optional()
  })

  validate(payload: any): z.SafeParseReturnType<any, any> {
    return this.schema.safeParse(payload)
  }

  transform(payload: any): BlogPostData {
    const sanitizedContent = DOMPurify.sanitize(payload.content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ol', 'ul', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'table',
        'thead', 'tbody', 'tr', 'td', 'th'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
    })

    return {
      title: DOMPurify.sanitize(payload.title, { ALLOWED_TAGS: [] }),
      content: sanitizedContent,
      excerpt: payload.excerpt || sanitizedContent.substring(0, 200) + '...',
      author: payload.author || 'HMHCP Team',
      status: payload.status || 'draft',
      tags: payload.tags || [],
      slug: generateSlug(payload.title),
      external_id: payload.external_id,
      seo_title: payload.seo?.title || payload.title,
      seo_description: payload.seo?.description,
      seo_keywords: payload.seo?.keywords,
      social_media_content: payload.social,
      featured_image_url: payload.featured_image,
      scheduled_for: payload.scheduled_for,
      category: 'Healthcare Technology'
    }
  }

  getHeaders(): Record<string, string> {
    return {
      'X-Make-Webhook': 'true',
      'X-Service-Type': 'make.com'
    }
  }

  identifyFromHeaders(headers: Headers): boolean {
    return headers.get('x-make-request-id') !== null || 
           (headers.get('user-agent')?.toLowerCase().includes('make') ?? false)
  }

  identifyFromPayload(payload: any): boolean {
    return !!(payload.seo || payload.social)
  }
}

// Zapier Strategy Implementation
export class ZapierStrategy implements WebhookStrategy {
  private schema = z.object({
    title: z.string().min(1).max(500),
    body: z.string().min(1),
    author_name: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(), // CSV string
    publish: z.boolean().optional().default(false),
    external_id: z.string().optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    featured_image: z.string().optional()
  })

  validate(payload: any): z.SafeParseReturnType<any, any> {
    return this.schema.safeParse(payload)
  }

  transform(payload: any): BlogPostData {
    const sanitizedContent = DOMPurify.sanitize(payload.body, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ol', 'ul', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'table',
        'thead', 'tbody', 'tr', 'td', 'th'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
    })

    return {
      title: DOMPurify.sanitize(payload.title, { ALLOWED_TAGS: [] }),
      content: sanitizedContent,
      excerpt: sanitizedContent.substring(0, 200) + '...',
      author: payload.author_name || 'HMHCP Team',
      status: payload.publish ? 'published' : 'draft',
      tags: payload.tags ? payload.tags.split(',').map((t: string) => t.trim()) : [],
      slug: generateSlug(payload.title),
      external_id: payload.external_id,
      seo_title: payload.meta_title || payload.title,
      seo_description: payload.meta_description,
      category: payload.category || 'Healthcare Technology',
      featured_image_url: payload.featured_image
    }
  }

  getHeaders(): Record<string, string> {
    return {
      'X-Zapier-Hook': 'true',
      'X-Service-Type': 'zapier'
    }
  }

  identifyFromHeaders(headers: Headers): boolean {
    return headers.get('x-zapier-request-id') !== null || 
           headers.get('x-zapier-hook-id') !== null ||
           (headers.get('user-agent')?.toLowerCase().includes('zapier') ?? false)
  }

  identifyFromPayload(payload: any): boolean {
    return !!(payload.body && payload.author_name !== undefined)
  }
}

// Custom/Generic Strategy Implementation
export class CustomStrategy implements WebhookStrategy {
  private schema = z.object({
    title: z.string().min(1).max(500),
    content: z.string().min(1),
    author: z.string().optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    status: z.string().optional(),
    external_id: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    featured_image: z.string().optional(),
    category: z.string().optional(),
    excerpt: z.string().optional()
  })

  validate(payload: any): z.SafeParseReturnType<any, any> {
    return this.schema.safeParse(payload)
  }

  transform(payload: any): BlogPostData {
    const sanitizedContent = DOMPurify.sanitize(payload.content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ol', 'ul', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'table',
        'thead', 'tbody', 'tr', 'td', 'th'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
    })

    const tags = Array.isArray(payload.tags) 
      ? payload.tags 
      : typeof payload.tags === 'string' 
        ? payload.tags.split(',').map((t: string) => t.trim())
        : []

    return {
      title: DOMPurify.sanitize(payload.title, { ALLOWED_TAGS: [] }),
      content: sanitizedContent,
      excerpt: payload.excerpt || sanitizedContent.substring(0, 200) + '...',
      author: payload.author || 'HMHCP Team',
      status: payload.status === 'published' ? 'published' : 'draft',
      tags,
      slug: generateSlug(payload.title),
      external_id: payload.external_id,
      category: payload.category || 'Healthcare Technology',
      featured_image_url: payload.featured_image
    }
  }

  getHeaders(): Record<string, string> {
    return {
      'X-Service-Type': 'custom'
    }
  }

  identifyFromHeaders(headers: Headers): boolean {
    // Custom strategy is the fallback
    return false
  }

  identifyFromPayload(payload: any): boolean {
    // Custom strategy is the fallback
    return false
  }
}

// Strategy Factory
export class WebhookStrategyFactory {
  private strategies: Map<string, WebhookStrategy>

  constructor() {
    this.strategies = new Map<string, WebhookStrategy>([
      ['make.com', new MakeComStrategy()],
      ['zapier', new ZapierStrategy()],
      ['custom', new CustomStrategy()]
    ])
  }

  getStrategy(headers: Headers, payload: any): WebhookStrategy {
    // Try to identify from headers first
    for (const [name, strategy] of this.strategies) {
      if (strategy.identifyFromHeaders(headers)) {
        return strategy
      }
    }

    // Try to identify from payload structure
    for (const [name, strategy] of this.strategies) {
      if (strategy.identifyFromPayload(payload)) {
        return strategy
      }
    }

    // Default to custom strategy
    return this.strategies.get('custom')!
  }

  getStrategyByName(name: string): WebhookStrategy | undefined {
    return this.strategies.get(name)
  }
}