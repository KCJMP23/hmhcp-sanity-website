'use client';

import { MetaTags } from './MetaTags';
import { OrganizationSchema, ServiceSchema, ArticleSchema, FAQSchema, LocalBusinessSchema } from './StructuredData';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'service' | 'faq';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;

  // Article specific
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];

  // Service specific
  service?: {
    name: string;
    description: string;
    category?: string;
    url?: string;
  };

  // FAQ specific
  faqs?: Array<{
    question: string;
    answer: string;
  }>;

  // Schema options
  includeOrganization?: boolean;
  includeLocalBusiness?: boolean;
  customSchema?: object;
}

export function SEOHead({
  title,
  description,
  image,
  type = 'website',
  canonical,
  noindex,
  nofollow,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  service,
  faqs,
  includeOrganization = true,
  includeLocalBusiness = false,
  customSchema,
}: SEOHeadProps) {
  return (
    <>
      {/* Meta tags */}
      <MetaTags
        title={title}
        description={description}
        image={image}
        type={type === 'article' ? 'article' : 'website'}
        canonical={canonical}
        noindex={noindex}
        nofollow={nofollow}
        publishedTime={publishedTime}
        modifiedTime={modifiedTime}
        author={author}
        section={section}
        tags={tags}
      />

      {/* Organization schema */}
      {includeOrganization && <OrganizationSchema />}

      {/* Local business schema */}
      {includeLocalBusiness && <LocalBusinessSchema />}

      {/* Service schema */}
      {type === 'service' && service && (
        <ServiceSchema service={service} />
      )}

      {/* Article schema */}
      {type === 'article' && publishedTime && (
        <ArticleSchema
          article={{
            title,
            description,
            image,
            datePublished: publishedTime,
            dateModified: modifiedTime,
            author,
          }}
        />
      )}

      {/* FAQ schema */}
      {type === 'faq' && faqs && faqs.length > 0 && (
        <FAQSchema faqs={faqs} />
      )}

      {/* Custom schema */}
      {customSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(customSchema) }}
        />
      )}
    </>
  );
}

// Preset configurations for common page types
interface HomePageSEOProps {
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
}

export function HomePageSEO({
  customTitle,
  customDescription,
  customImage,
}: HomePageSEOProps = {}) {
  return (
    <SEOHead
      title={customTitle || 'Premier Digital Health Contract Research Organization'}
      description={
        customDescription ||
        'HM Healthcare Partners is a boutique digital-health focused CRO specializing in clinical trials, regulatory affairs, and healthcare technology solutions. Expert clinical research services.'
      }
      image={customImage}
      type="website"
      includeOrganization={true}
      includeLocalBusiness={true}
    />
  );
}

interface ServicePageSEOProps {
  service: {
    name: string;
    description: string;
    category?: string;
    features?: string[];
    benefits?: string[];
  };
  image?: string;
}

export function ServicePageSEO({ service, image }: ServicePageSEOProps) {
  const title = `${service.name} Services - Healthcare Technology Solutions`;
  const description = service.description.length > 160 
    ? service.description.substring(0, 157) + '...'
    : service.description;

  return (
    <SEOHead
      title={title}
      description={description}
      image={image}
      type="service"
      service={service}
      includeOrganization={true}
    />
  );
}

interface BlogPostSEOProps {
  post: {
    title: string;
    excerpt: string;
    featuredImage?: string;
    publishedAt: string;
    updatedAt?: string;
    author?: string;
    category?: string;
    tags?: string[];
  };
}

export function BlogPostSEO({ post }: BlogPostSEOProps) {
  return (
    <SEOHead
      title={post.title}
      description={post.excerpt}
      image={post.featuredImage}
      type="article"
      publishedTime={post.publishedAt}
      modifiedTime={post.updatedAt}
      author={post.author}
      section={post.category}
      tags={post.tags}
      includeOrganization={true}
    />
  );
}

interface AboutPageSEOProps {
  customTitle?: string;
  customDescription?: string;
  image?: string;
}

export function AboutPageSEO({
  customTitle,
  customDescription,
  image,
}: AboutPageSEOProps = {}) {
  return (
    <SEOHead
      title={customTitle || 'About HM Healthcare Partners - Digital Health CRO Leaders'}
      description={
        customDescription ||
        'Learn about HM Healthcare Partners, a leading digital-health focused Contract Research Organization. Our expert team delivers innovative clinical research and healthcare technology solutions.'
      }
      image={image}
      type="website"
      includeOrganization={true}
      includeLocalBusiness={true}
    />
  );
}

interface ContactPageSEOProps {
  customTitle?: string;
  customDescription?: string;
}

export function ContactPageSEO({
  customTitle,
  customDescription,
}: ContactPageSEOProps = {}) {
  return (
    <SEOHead
      title={customTitle || 'Contact HM Healthcare Partners - Get Started Today'}
      description={
        customDescription ||
        'Contact HM Healthcare Partners for expert clinical research and healthcare technology services. Get in touch with our team to discuss your digital health project needs.'
      }
      type="website"
      includeOrganization={true}
      includeLocalBusiness={true}
    />
  );
}

interface PlatformPageSEOProps {
  platform: {
    name: string;
    description: string;
    features?: string[];
  };
  image?: string;
}

export function PlatformPageSEO({ platform, image }: PlatformPageSEOProps) {
  const title = `${platform.name} - Healthcare Technology Platform`;
  
  return (
    <SEOHead
      title={title}
      description={platform.description}
      image={image}
      type="website"
      includeOrganization={true}
    />
  );
}

interface FAQPageSEOProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  title?: string;
  description?: string;
}

export function FAQPageSEO({ 
  faqs, 
  title = 'Frequently Asked Questions - HM Healthcare Partners',
  description = 'Find answers to common questions about HM Healthcare Partners services, clinical research processes, and healthcare technology solutions.'
}: FAQPageSEOProps) {
  return (
    <SEOHead
      title={title}
      description={description}
      type="faq"
      faqs={faqs}
      includeOrganization={true}
    />
  );
}