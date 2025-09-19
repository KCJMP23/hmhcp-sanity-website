export class SEOUrlBuilder {
  static buildServiceUrl(service: { category: string; name: string; slug?: string }): string {
    if (service.slug) {
      return `/services/${this.slugify(service.category)}/${service.slug}`;
    }
    return `/services/${this.slugify(service.category)}/${this.slugify(service.name)}`;
  }

  static buildBlogUrl(post: { publishedAt: string; slug: string }): string {
    const date = new Date(post.publishedAt);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `/blog/${year}/${month}/${post.slug}`;
  }

  static buildPlatformUrl(platform: { slug: string }): string {
    return `/platforms/${platform.slug}`;
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static enforceTrailingSlash(url: string): string {
    return url === '/' ? url : url.replace(/\/$/, '') + '/';
  }

  static removeTrailingSlash(url: string): string {
    return url === '/' ? url : url.replace(/\/$/, '');
  }

  static enforceLowercase(url: string): string {
    return url.toLowerCase();
  }

  static buildCanonicalUrl(pathname: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
    const cleanPath = this.removeTrailingSlash(pathname);
    return `${baseUrl}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
  }

  static generateBreadcrumbs(pathname: string): Array<{ name: string; path: string }> {
    const segments = pathname.split('/').filter(Boolean);
    
    const breadcrumbs = segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const name = this.segmentToTitle(segment);
      return { name, path };
    });

    return breadcrumbs;
  }

  private static segmentToTitle(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static generateSitemapUrl(type: 'page' | 'blog' | 'service' | 'platform', item: any): {
    loc: string;
    lastmod?: string;
    priority: number;
    changefreq?: string;
  } {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
    
    let url: string;
    let priority: number;
    let changefreq: string;

    switch (type) {
      case 'page':
        url = item.path;
        priority = item.priority || 0.8;
        changefreq = 'monthly';
        break;
      case 'blog':
        url = this.buildBlogUrl(item);
        priority = 0.6;
        changefreq = 'weekly';
        break;
      case 'service':
        url = this.buildServiceUrl(item);
        priority = 0.8;
        changefreq = 'monthly';
        break;
      case 'platform':
        url = this.buildPlatformUrl(item);
        priority = 0.8;
        changefreq = 'monthly';
        break;
      default:
        throw new Error(`Unknown sitemap type: ${type}`);
    }

    return {
      loc: `${baseUrl}${url}`,
      lastmod: item.updatedAt || item.lastModified,
      priority,
      changefreq,
    };
  }
}