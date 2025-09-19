'use client';

import { usePathname } from 'next/navigation';
import { SEOUrlBuilder } from '@/lib/seo/url-builder';

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
}

export function MetaTags({
  title,
  description,
  image = '/og-default.png',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  canonical,
  noindex = false,
  nofollow = false,
  siteName = 'HM Healthcare Partners',
  locale = 'en_US',
  alternateLocales = [],
}: MetaTagsProps) {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  const currentUrl = canonical || `${baseUrl}${pathname}`;
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
  
  // Generate structured title
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  
  // Truncate description to recommended length
  const truncatedDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-snippet:-1',
    'max-image-preview:large',
    'max-video-preview:-1',
  ].join(', ');

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      
      {/* Alternate locales */}
      {alternateLocales.map(altLocale => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      
      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {author && (
            <meta property="article:author" content={author} />
          )}
          {section && (
            <meta property="article:section" content={section} />
          )}
          {tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@hmhealthcare" />
      <meta name="twitter:creator" content="@hmhealthcare" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#ffffff" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="application-name" content={siteName} />
      
      {/* Apple specific */}
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
    </>
  );
}

interface PageMetaProps {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
}

export function PageMeta({ title, description, image, noindex }: PageMetaProps) {
  return (
    <MetaTags
      title={title}
      description={description}
      image={image}
      type="website"
      noindex={noindex}
    />
  );
}

interface ArticleMetaProps {
  title: string;
  description: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export function ArticleMeta({
  title,
  description,
  image,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}: ArticleMetaProps) {
  return (
    <MetaTags
      title={title}
      description={description}
      image={image}
      type="article"
      publishedTime={publishedTime}
      modifiedTime={modifiedTime}
      author={author}
      section={section}
      tags={tags}
    />
  );
}

interface ServiceMetaProps {
  service: {
    name: string;
    description: string;
    image?: string;
  };
}

export function ServiceMeta({ service }: ServiceMetaProps) {
  return (
    <MetaTags
      title={`${service.name} - Healthcare Technology Services`}
      description={service.description}
      image={service.image}
      type="website"
    />
  );
}