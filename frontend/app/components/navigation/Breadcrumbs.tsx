'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { SEOUrlBuilder } from '@/lib/seo/url-builder';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  name: string;
  path: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeLabel?: string;
  separator?: React.ReactNode;
  maxItems?: number;
}

export function Breadcrumbs({
  items,
  className,
  showHome = true,
  homeLabel = 'Home',
  separator,
  maxItems = 5,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Generate breadcrumbs from URL if not provided
  const generatedBreadcrumbs = items || SEOUrlBuilder.generateBreadcrumbs(pathname);
  
  // Filter out empty or invalid breadcrumbs
  const validBreadcrumbs = generatedBreadcrumbs.filter(
    crumb => crumb.name && crumb.path && crumb.path !== '/'
  );

  // Truncate breadcrumbs if they exceed maxItems
  const displayBreadcrumbs = validBreadcrumbs.length > maxItems
    ? [
        ...validBreadcrumbs.slice(0, 1),
        { name: '...', path: '', ellipsis: true },
        ...validBreadcrumbs.slice(-maxItems + 2),
      ]
    : validBreadcrumbs;

  // Don't show breadcrumbs on home page or if no valid breadcrumbs
  if (pathname === '/' || displayBreadcrumbs.length === 0) {
    return null;
  }

  const SeparatorIcon = separator || <ChevronRight className="h-4 w-4 text-muted-foreground" />;

  return (
    <>
      <nav 
        aria-label="Breadcrumb" 
        className={cn('flex items-center space-x-1 text-sm', className)}
      >
        <ol className="flex items-center space-x-1">
          {showHome && (
            <li className="flex items-center">
              <Link
                href="/"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go to home page"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only md:not-sr-only md:ml-1">{homeLabel}</span>
              </Link>
              {displayBreadcrumbs.length > 0 && (
                <span className="mx-2" aria-hidden="true">
                  {SeparatorIcon}
                </span>
              )}
            </li>
          )}
          
          {displayBreadcrumbs.map((crumb, index) => {
            const isLast = index === displayBreadcrumbs.length - 1;
            const isEllipsis = 'ellipsis' in crumb && crumb.ellipsis;
            
            return (
              <li key={`${crumb.path}-${index}`} className="flex items-center">
                {isEllipsis ? (
                  <span className="text-muted-foreground px-1">...</span>
                ) : isLast ? (
                  <span 
                    className="font-medium text-foreground truncate max-w-[200px]"
                    aria-current="page"
                    title={crumb.name}
                  >
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                    title={crumb.name}
                  >
                    {crumb.name}
                  </Link>
                )}
                
                {!isLast && (
                  <span className="mx-2" aria-hidden="true">
                    {SeparatorIcon}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      
      {/* Structured data for breadcrumbs */}
      <BreadcrumbSchema breadcrumbs={validBreadcrumbs} />
    </>
  );
}

interface CustomBreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  className?: string;
}

export function CustomBreadcrumbs({ items, className }: CustomBreadcrumbsProps) {
  const breadcrumbItems = items.map(item => ({
    name: item.label,
    path: item.href || '',
    current: item.current,
  }));

  return (
    <Breadcrumbs
      items={breadcrumbItems}
      className={className}
    />
  );
}

interface PageBreadcrumbsProps {
  title: string;
  parent?: {
    title: string;
    href: string;
  };
  className?: string;
}

export function PageBreadcrumbs({ title, parent, className }: PageBreadcrumbsProps) {
  const items = [];
  
  if (parent) {
    items.push({
      name: parent.title,
      path: parent.href,
    });
  }
  
  items.push({
    name: title,
    path: '',
    current: true,
  });

  return (
    <Breadcrumbs
      items={items}
      className={className}
    />
  );
}

export function ServiceBreadcrumbs({ 
  category, 
  serviceName 
}: { 
  category: string; 
  serviceName: string; 
}) {
  const items = [
    {
      name: 'Services',
      path: '/services',
    },
    {
      name: category,
      path: `/services/${SEOUrlBuilder.slugify(category)}`,
    },
    {
      name: serviceName,
      path: '',
      current: true,
    },
  ];

  return <Breadcrumbs items={items} />;
}

export function BlogBreadcrumbs({ 
  category, 
  postTitle 
}: { 
  category?: string; 
  postTitle: string; 
}) {
  const items: BreadcrumbItem[] = [
    {
      name: 'Blog',
      path: '/blog',
    },
  ];

  if (category) {
    items.push({
      name: category,
      path: `/blog/category/${SEOUrlBuilder.slugify(category)}`,
    });
  }

  items.push({
    name: postTitle,
    path: '',
    current: true,
  });

  return <Breadcrumbs items={items} />;
}