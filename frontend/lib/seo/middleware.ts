import { NextRequest, NextResponse } from 'next/server';
import { SEOUrlBuilder } from './url-builder';

export function applySEOMiddleware(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  
  // Skip middleware for certain paths
  if (shouldSkipSEOMiddleware(pathname)) {
    return null;
  }

  // Apply URL normalization
  const normalizedUrl = normalizeUrl(request);
  if (normalizedUrl) {
    return normalizedUrl;
  }

  // Handle legacy redirects
  const legacyRedirect = handleLegacyRedirects(pathname);
  if (legacyRedirect) {
    return legacyRedirect;
  }

  // Handle trailing slash normalization
  const trailingSlashRedirect = handleTrailingSlash(request);
  if (trailingSlashRedirect) {
    return trailingSlashRedirect;
  }

  return null;
}

function shouldSkipSEOMiddleware(pathname: string): boolean {
  const skipPaths = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/.well-known/',
    '/admin/',
    '/dashboard/',
  ];

  return skipPaths.some(path => pathname.startsWith(path));
}

function normalizeUrl(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  let hasChanged = false;

  // Enforce lowercase URLs
  if (pathname !== pathname.toLowerCase()) {
    url.pathname = pathname.toLowerCase();
    hasChanged = true;
  }

  // Remove duplicate slashes
  const normalizedPath = pathname.replace(/\/+/g, '/');
  if (pathname !== normalizedPath) {
    url.pathname = normalizedPath;
    hasChanged = true;
  }

  // Remove unnecessary query parameters
  const cleanedSearch = cleanQueryParameters(request.nextUrl.search);
  if (request.nextUrl.search !== cleanedSearch) {
    url.search = cleanedSearch;
    hasChanged = true;
  }

  if (hasChanged) {
    return NextResponse.redirect(url, 301);
  }

  return null;
}

function cleanQueryParameters(search: string): string {
  if (!search) return '';

  const params = new URLSearchParams(search);
  const unwantedParams = [
    'utm_source',
    'utm_medium', 
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
    'msclkid',
    '_ga',
    '_gl',
    'mc_cid',
    'mc_eid',
  ];

  // Keep only meaningful parameters for SEO
  const allowedParams = new URLSearchParams();
  
  for (const [key, value] of params) {
    if (!unwantedParams.includes(key) && value.trim()) {
      allowedParams.set(key, value);
    }
  }

  const result = allowedParams.toString();
  return result ? `?${result}` : '';
}

function handleLegacyRedirects(pathname: string): NextResponse | null {
  const redirects: Record<string, string> = {
    // Old URL structure redirects
    '/service/clinical-research': '/services/clinical-research',
    '/service/regulatory-affairs': '/services/regulatory-affairs',
    '/service/medical-affairs': '/services/medical-affairs',
    '/platform/ctms': '/platforms/clinical-trial-management',
    '/platform/analytics': '/platforms/data-analytics',
    
    // Blog redirects
    '/news': '/blog',
    '/articles': '/blog',
    '/insights': '/blog',
    
    // Page redirects
    '/company': '/about',
    '/team': '/about',
    '/careers': '/about',
    '/contact-us': '/contact',
    '/get-in-touch': '/contact',
    
    // Service category redirects
    '/clinical-services': '/services',
    '/regulatory-services': '/services/regulatory-affairs',
    '/medical-services': '/services/medical-affairs',
    
    // Platform redirects
    '/solutions': '/platforms',
    '/technology': '/platforms',
    '/tools': '/platforms',
    
    // Legacy admin paths
    '/wp-admin': '/admin',
    '/administrator': '/admin',
    '/cms': '/admin',
    
    // Common mistyped URLs
    '/servies': '/services',
    '/platfroms': '/platforms',
    '/contct': '/contact',
    '/abot': '/about',
  };

  const redirect = redirects[pathname];
  if (redirect) {
    const url = new URL(redirect, process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com');
    return NextResponse.redirect(url, 301);
  }

  return null;
}

function handleTrailingSlash(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // Skip root path
  if (pathname === '/') {
    return null;
  }

  // Remove trailing slash for all paths except directories that need them
  if (pathname.endsWith('/') && !isDirectoryPath(pathname)) {
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  return null;
}

function isDirectoryPath(pathname: string): boolean {
  // Paths that should keep trailing slashes
  const directoryPaths = [
    '/admin/',
    '/dashboard/',
    '/blog/',
    '/services/',
    '/platforms/',
  ];

  return directoryPaths.some(path => pathname === path);
}

// Utility to check if URL needs canonicalization
export function needsCanonicalRedirect(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  
  // Check for mixed case
  if (pathname !== pathname.toLowerCase()) {
    return true;
  }

  // Check for duplicate slashes
  if (pathname.includes('//')) {
    return true;
  }

  // Check for trailing slash issues
  if (pathname !== '/' && pathname.endsWith('/') && !isDirectoryPath(pathname)) {
    return true;
  }

  return false;
}

// Generate canonical URL for any path
export function generateCanonicalUrl(pathname: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  const cleanPath = SEOUrlBuilder.removeTrailingSlash(pathname.toLowerCase());
  return `${baseUrl}${cleanPath}`;
}

// URL pattern validation for SEO-friendly URLs
export function isValidSEOUrl(url: string): boolean {
  // Check for SEO-friendly patterns
  const seoPattern = /^\/[a-z0-9\-\/]*$/;
  
  // Must start with /
  if (!url.startsWith('/')) {
    return false;
  }

  // Check against pattern
  if (!seoPattern.test(url)) {
    return false;
  }

  // Check for invalid sequences
  const invalidPatterns = [
    /--+/, // Multiple consecutive hyphens
    /\/\/+/, // Multiple consecutive slashes
    /-\//,  // Hyphen before slash
    /\/-/,  // Slash before hyphen at start
  ];

  return !invalidPatterns.some(pattern => pattern.test(url));
}

// Extract SEO data from URL structure
export function extractSEOData(pathname: string): {
  section?: string;
  category?: string;
  slug?: string;
  type: 'page' | 'blog' | 'service' | 'platform' | 'unknown';
} {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return { type: 'page' };
  }

  const [section, category, slug] = segments;

  switch (section) {
    case 'blog':
      return {
        section,
        category: segments.length > 2 ? category : undefined,
        slug: segments.length > 2 ? slug : category,
        type: 'blog',
      };
    case 'services':
      return {
        section,
        category,
        slug,
        type: 'service',
      };
    case 'platforms':
      return {
        section,
        category,
        slug,
        type: 'platform',
      };
    default:
      return {
        section,
        slug: segments.join('/'),
        type: 'page',
      };
  }
}