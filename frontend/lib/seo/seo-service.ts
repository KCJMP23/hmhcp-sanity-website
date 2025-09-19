import { SEOUrlBuilder } from './url-builder';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  type?: 'website' | 'article' | 'service' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export class SEOService {
  private static readonly SITE_NAME = 'HM Healthcare Partners';
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  private static readonly DEFAULT_DESCRIPTION = 'Premier boutique digital-health focused Contract Research Organization specializing in clinical trials and healthcare technology solutions.';
  private static readonly DEFAULT_IMAGE = '/og-default.png';

  // Generate SEO data for different page types
  static generatePageSEO(options: {
    title: string;
    description?: string;
    image?: string;
    path?: string;
    noindex?: boolean;
  }): SEOData {
    const { title, description, image, path, noindex } = options;
    
    return {
      title: this.formatTitle(title),
      description: description || this.DEFAULT_DESCRIPTION,
      image: image || this.DEFAULT_IMAGE,
      canonical: path ? this.buildCanonicalUrl(path) : undefined,
      noindex: noindex || false,
      type: 'website',
    };
  }

  static generateServiceSEO(service: {
    name: string;
    description: string;
    category?: string;
    slug?: string;
    image?: string;
  }): SEOData {
    const title = `${service.name} - Healthcare Technology Services`;
    const description = this.truncateDescription(service.description, 160);
    const url = service.slug ? SEOUrlBuilder.buildServiceUrl({
      category: service.category || 'services',
      name: service.name,
      slug: service.slug,
    }) : undefined;

    return {
      title: this.formatTitle(title),
      description,
      image: service.image || this.DEFAULT_IMAGE,
      canonical: url ? this.buildCanonicalUrl(url) : undefined,
      type: 'service',
      section: service.category,
    };
  }

  static generateBlogPostSEO(post: {
    title: string;
    excerpt: string;
    slug: string;
    publishedAt: string;
    updatedAt?: string;
    author?: string;
    category?: string;
    tags?: string[];
    featuredImage?: string;
  }): SEOData {
    const url = SEOUrlBuilder.buildBlogUrl({
      publishedAt: post.publishedAt,
      slug: post.slug,
    });

    return {
      title: this.formatTitle(post.title),
      description: this.truncateDescription(post.excerpt, 160),
      image: post.featuredImage || this.DEFAULT_IMAGE,
      canonical: this.buildCanonicalUrl(url),
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      author: post.author,
      section: post.category,
      tags: post.tags,
    };
  }

  static generatePlatformSEO(platform: {
    name: string;
    description: string;
    slug: string;
    image?: string;
    features?: string[];
  }): SEOData {
    const title = `${platform.name} - Healthcare Technology Platform`;
    const description = this.truncateDescription(platform.description, 160);
    const url = SEOUrlBuilder.buildPlatformUrl({ slug: platform.slug });

    return {
      title: this.formatTitle(title),
      description,
      image: platform.image || this.DEFAULT_IMAGE,
      canonical: this.buildCanonicalUrl(url),
      type: 'website',
      keywords: platform.features,
    };
  }

  // Generate breadcrumbs for different page types
  static generateBreadcrumbs(type: 'service' | 'blog' | 'platform' | 'page', data: any): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];

    switch (type) {
      case 'service':
        breadcrumbs.push(
          { name: 'Services', url: '/services' }
        );
        if (data.category) {
          breadcrumbs.push({
            name: this.formatCategoryName(data.category),
            url: `/services/${SEOUrlBuilder.slugify(data.category)}`,
          });
        }
        breadcrumbs.push({
          name: data.name,
          url: '',
        });
        break;

      case 'blog':
        breadcrumbs.push(
          { name: 'Blog', url: '/blog' }
        );
        if (data.category) {
          breadcrumbs.push({
            name: this.formatCategoryName(data.category),
            url: `/blog/category/${SEOUrlBuilder.slugify(data.category)}`,
          });
        }
        breadcrumbs.push({
          name: data.title,
          url: '',
        });
        break;

      case 'platform':
        breadcrumbs.push(
          { name: 'Platforms', url: '/platforms' }
        );
        breadcrumbs.push({
          name: data.name,
          url: '',
        });
        break;

      case 'page':
        const segments = data.path?.split('/').filter(Boolean) || [];
        segments.forEach((segment: string, index: number) => {
          const path = '/' + segments.slice(0, index + 1).join('/');
          breadcrumbs.push({
            name: this.formatCategoryName(segment),
            url: index === segments.length - 1 ? '' : path,
          });
        });
        break;
    }

    return breadcrumbs;
  }

  // SEO analysis and recommendations
  static analyzeSEO(data: SEOData): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Title analysis
    if (!data.title || data.title.length === 0) {
      issues.push('Missing page title');
      score -= 20;
    } else if (data.title.length < 30) {
      recommendations.push('Title is short - consider expanding to 50-60 characters');
      score -= 5;
    } else if (data.title.length > 60) {
      issues.push('Title is too long - may be truncated in search results');
      score -= 10;
    }

    // Description analysis
    if (!data.description || data.description.length === 0) {
      issues.push('Missing meta description');
      score -= 15;
    } else if (data.description.length < 120) {
      recommendations.push('Description is short - consider expanding to 150-160 characters');
      score -= 5;
    } else if (data.description.length > 160) {
      issues.push('Description is too long - may be truncated in search results');
      score -= 8;
    }

    // Image analysis
    if (!data.image) {
      recommendations.push('Consider adding an Open Graph image for better social sharing');
      score -= 3;
    }

    // Keywords analysis
    if (!data.keywords || data.keywords.length === 0) {
      recommendations.push('Consider adding relevant keywords for better targeting');
      score -= 2;
    }

    // Content type analysis
    if (data.type === 'article') {
      if (!data.publishedTime) {
        issues.push('Missing published date for article');
        score -= 5;
      }
      if (!data.author) {
        recommendations.push('Consider adding author information for articles');
        score -= 2;
      }
    }

    return { score: Math.max(0, score), issues, recommendations };
  }

  // Generate meta keywords from content
  static extractKeywords(content: string, maxKeywords: number = 10): string[] {
    // Simple keyword extraction (in production, use more sophisticated NLP)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Helper methods
  private static formatTitle(title: string): string {
    if (title.includes(this.SITE_NAME)) {
      return title;
    }
    return `${title} | ${this.SITE_NAME}`;
  }

  private static truncateDescription(description: string, maxLength: number): string {
    if (description.length <= maxLength) {
      return description;
    }
    
    const truncated = description.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  private static buildCanonicalUrl(path: string): string {
    return `${this.BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  }

  private static formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Generate sitemap entries
  static generateSitemapEntry(
    url: string,
    options: {
      lastmod?: string;
      changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
      priority?: number;
    } = {}
  ): {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  } {
    return {
      loc: this.buildCanonicalUrl(url),
      lastmod: options.lastmod || new Date().toISOString(),
      changefreq: options.changefreq || 'monthly',
      priority: options.priority || 0.5,
    };
  }

  // Validate SEO URLs
  static validateSEOUrl(url: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check length
    if (url.length > 100) {
      issues.push('URL is too long (over 100 characters)');
    }

    // Check for spaces
    if (url.includes(' ')) {
      issues.push('URL contains spaces');
      suggestions.push('Replace spaces with hyphens');
    }

    // Check for special characters
    if (!/^[a-zA-Z0-9\-\/._~]+$/.test(url)) {
      issues.push('URL contains special characters');
      suggestions.push('Use only letters, numbers, hyphens, and slashes');
    }

    // Check for consecutive hyphens
    if (url.includes('--')) {
      issues.push('URL contains consecutive hyphens');
      suggestions.push('Use single hyphens to separate words');
    }

    // Check case
    if (url !== url.toLowerCase()) {
      issues.push('URL contains uppercase letters');
      suggestions.push('Use lowercase letters only');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}