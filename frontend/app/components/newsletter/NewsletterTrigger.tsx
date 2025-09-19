'use client';

import { Mail, Plus, ArrowRight, Bell, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NewsletterModal, CtaNewsletterModal, BlogNewsletterModal, useNewsletterModal } from './NewsletterModal';

interface NewsletterTriggerProps {
  variant?: 'default' | 'cta' | 'blog' | 'floating' | 'badge' | 'minimal';
  size?: 'sm' | 'default' | 'lg';
  text?: string;
  className?: string;
  source?: string;
  children?: React.ReactNode;
}

export function NewsletterTrigger({ 
  variant = 'default',
  size = 'default', 
  text,
  className,
  source,
  children 
}: NewsletterTriggerProps) {
  const modal = useNewsletterModal();

  const getButtonContent = () => {
    switch (variant) {
      case 'cta':
        return (
          <>
            <Mail className="mr-2 h-4 w-4" />
            {text || 'Get Healthcare Insights'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        );
      case 'blog':
        return (
          <>
            <Bell className="mr-2 h-4 w-4" />
            {text || 'Subscribe for More'}
          </>
        );
      case 'floating':
        return (
          <>
            <Gift className="mr-2 h-4 w-4" />
            {text || 'Free Newsletter'}
          </>
        );
      case 'minimal':
        return text || 'Newsletter';
      default:
        return (
          <>
            <Mail className="mr-2 h-4 w-4" />
            {text || 'Subscribe'}
          </>
        );
    }
  };

  const getButtonProps = () => {
    const baseProps = {
      onClick: modal.open,
      size,
      className: cn(className),
    };

    switch (variant) {
      case 'cta':
        return {
          ...baseProps,
          className: cn(
            'bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700',
            'text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300',
            'transform hover:scale-105',
            className
          ),
        };
      case 'blog':
        return {
          ...baseProps,
          variant: 'outline' as const,
          className: cn(
            'border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20',
            className
          ),
        };
      case 'floating':
        return {
          ...baseProps,
          className: cn(
            'fixed bottom-6 right-6 z-50 shadow-2xl bg-gradient-to-r from-blue-600 to-blue-600',
            'hover:from-blue-700 hover:to-blue-700 text-white border-0',
            ' px-6 py-3 animate-pulse hover:animate-none',
            'transform hover:scale-105 transition-all duration-300',
            className
          ),
        };
      case 'minimal':
        return {
          ...baseProps,
          variant: 'ghost' as const,
          size: 'sm' as const,
          className: cn('text-blue-600 hover:text-blue-700 dark:text-blue-400', className),
        };
      default:
        return baseProps;
    }
  };

  if (variant === 'badge') {
    return (
      <>
        <Badge 
          variant="secondary" 
          className={cn(
            'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors',
            'border border-blue-200 dark:border-blue-800',
            className
          )}
          onClick={modal.open}
        >
          <Mail className="mr-1 h-3 w-3" />
          {text || 'Newsletter'}
        </Badge>
        <NewsletterModal 
          isOpen={modal.isOpen} 
          onClose={modal.close}
          source={source}
        />
      </>
    );
  }

  if (children) {
    return (
      <>
        <div onClick={modal.open} className="cursor-pointer">
          {children}
        </div>
        <NewsletterModal 
          isOpen={modal.isOpen} 
          onClose={modal.close}
          source={source}
        />
      </>
    );
  }

  const ModalComponent = variant === 'cta' ? CtaNewsletterModal : 
                         variant === 'blog' ? BlogNewsletterModal : 
                         NewsletterModal;

  return (
    <>
      <Button {...getButtonProps()}>
        {getButtonContent()}
      </Button>
      <ModalComponent 
        isOpen={modal.isOpen} 
        onClose={modal.close}
        source={source}
      />
    </>
  );
}

// Specific trigger components for common use cases
export function HeroNewsletterTrigger({ className, ...props }: Omit<NewsletterTriggerProps, 'variant'>) {
  return (
    <NewsletterTrigger
      variant="cta"
      size="lg"
      text="Get Free Healthcare Insights"
      source="hero"
      className={cn('px-8 py-4 text-lg font-semibold', className)}
      {...props}
    />
  );
}

export function HeaderNewsletterTrigger({ className, ...props }: Omit<NewsletterTriggerProps, 'variant'>) {
  return (
    <NewsletterTrigger
      variant="default"
      size="sm"
      text="Newsletter"
      source="header"
      className={cn('', className)}
      {...props}
    />
  );
}

export function FooterNewsletterTrigger({ className, ...props }: Omit<NewsletterTriggerProps, 'variant'>) {
  return (
    <NewsletterTrigger
      variant="minimal"
      text="Subscribe to our newsletter"
      source="footer"
      className={cn('justify-start p-0 h-auto', className)}
      {...props}
    />
  );
}

export function FloatingNewsletterTrigger({ className, ...props }: Omit<NewsletterTriggerProps, 'variant'>) {
  return (
    <NewsletterTrigger
      variant="floating"
      text="📧 Free Updates"
      source="floating"
      className={className}
      {...props}
    />
  );
}

export function BlogPostTrigger({ className, ...props }: Omit<NewsletterTriggerProps, 'variant'>) {
  return (
    <NewsletterTrigger
      variant="blog"
      text="📧 Get More Insights Like This"
      source="blog_post"
      className={cn('w-full mt-6', className)}
      {...props}
    />
  );
}

export function SidebarNewsletterTrigger({ className, ...props }: Omit<NewsletterTriggerProps, 'variant'>) {
  return (
    <NewsletterTrigger
      variant="cta"
      size="sm"
      text="Stay Updated"
      source="sidebar"
      className={cn('w-full text-sm', className)}
      {...props}
    />
  );
}