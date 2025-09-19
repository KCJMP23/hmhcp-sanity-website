'use client';

interface OrganizationSchemaProps {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  sameAs?: string[];
}

export function OrganizationSchema({
  name = 'HM Healthcare Partners',
  description = 'Premier boutique digital-health focused Contract Research Organization specializing in clinical trials and healthcare technology solutions',
  url,
  logo,
  contactPoint,
  address,
  sameAs,
}: OrganizationSchemaProps = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description,
    url: url || baseUrl,
    logo: logo || `${baseUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: contactPoint?.telephone || '+1-617-555-0123',
      email: contactPoint?.email || 'info@hmhealthcarepartners.com',
      contactType: contactPoint?.contactType || 'customer service',
      areaServed: 'US',
      availableLanguage: ['English'],
    },
    sameAs: sameAs || [
      'https://www.linkedin.com/company/hm-healthcare-partners/',
      'https://twitter.com/hmhealthcare',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: address?.streetAddress || '100 Cambridge Street',
      addressLocality: address?.addressLocality || 'Boston',
      addressRegion: address?.addressRegion || 'MA',
      postalCode: address?.postalCode || '02114',
      addressCountry: address?.addressCountry || 'US',
    },
    foundingDate: '2018',
    numberOfEmployees: '50-100',
    industry: 'Healthcare Technology',
    knowsAbout: [
      'Clinical Research',
      'Digital Health',
      'Healthcare Technology',
      'Regulatory Affairs',
      'Medical Affairs',
      'Clinical Operations',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ServiceSchemaProps {
  service: {
    name: string;
    description: string;
    category?: string;
    url?: string;
  };
}

export function ServiceSchema({ service }: ServiceSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: service.url || baseUrl,
    provider: {
      '@type': 'Organization',
      name: 'HM Healthcare Partners',
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    serviceType: service.category || 'Healthcare Technology',
    hasOfferCatalog: service.category ? {
      '@type': 'OfferCatalog',
      name: service.category,
    } : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArticleSchemaProps {
  article: {
    title: string;
    description: string;
    image?: string;
    datePublished: string;
    dateModified?: string;
    author?: string;
    url?: string;
  };
}

export function ArticleSchema({ article }: ArticleSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image || `${baseUrl}/og-default.png`,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author || 'HM Healthcare Partners',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HM Healthcare Partners',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    url: article.url || baseUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url || baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  breadcrumbs: Array<{ name: string; path: string }>;
}

export function BreadcrumbSchema({ breadcrumbs }: BreadcrumbSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      ...breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: crumb.name,
        item: `${baseUrl}${crumb.path}`,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface LocalBusinessSchemaProps {
  name?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  email?: string;
  openingHours?: string[];
}

export function LocalBusinessSchema({
  name = 'HM Healthcare Partners',
  address,
  geo,
  telephone,
  email,
  openingHours,
}: LocalBusinessSchemaProps = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}#organization`,
    name,
    image: `${baseUrl}/logo.png`,
    url: baseUrl,
    telephone: telephone || '+1-617-555-0123',
    email: email || 'info@hmhealthcarepartners.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address?.streetAddress || '100 Cambridge Street',
      addressLocality: address?.addressLocality || 'Boston',
      addressRegion: address?.addressRegion || 'MA',
      postalCode: address?.postalCode || '02114',
      addressCountry: address?.addressCountry || 'US',
    },
    geo: geo ? {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    } : {
      '@type': 'GeoCoordinates',
      latitude: 42.3601,
      longitude: -71.0589,
    },
    openingHoursSpecification: openingHours?.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Monday,Tuesday,Wednesday,Thursday,Friday',
      opens: '09:00',
      closes: '17:00',
    })) || [],
    priceRange: '$$$',
    servedCuisine: undefined,
    hasMap: `https://maps.google.com/?q=${encodeURIComponent(
      `${address?.streetAddress || '100 Cambridge Street'}, ${address?.addressLocality || 'Boston'}, ${address?.addressRegion || 'MA'}`
    )}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}