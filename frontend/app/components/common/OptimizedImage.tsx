'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  aspectRatio?: number;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes = '100vw',
  className,
  aspectRatio = 16 / 9,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setCurrentSrc(fallbackSrc);
    onError?.();
  }, [fallbackSrc, onError]);

  // Generate blur data URL if not provided
  const getBlurDataURL = useCallback((): string => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple base64 blur placeholder
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 10, 10);
        return canvas.toDataURL();
      }
    }
    
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
  }, [blurDataURL]);

  // Determine if we should use fill or explicit dimensions
  const useFill = !width || !height;

  const imageProps = {
    src: currentSrc,
    alt,
    quality,
    priority,
    loading: priority ? 'eager' as const : loading,
    sizes: useFill ? sizes : undefined,
    placeholder: placeholder === 'blur' ? 'blur' as const : 'empty' as const,
    blurDataURL: placeholder === 'blur' ? getBlurDataURL() : undefined,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-all duration-700 ease-in-out',
      isLoading && 'scale-110 blur-2xl grayscale',
      !isLoading && 'scale-100 blur-0 grayscale-0',
      hasError && 'opacity-75',
      className
    ),
  };

  if (useFill) {
    return (
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <Image
          {...imageProps}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
      style={{ 
        width: 'auto', 
        height: 'auto',
        maxWidth: '100%',
      }}
    />
  );
}

interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'sizes'> {
  breakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export function ResponsiveImage({
  breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  ...props
}: ResponsiveImageProps) {
  const sizes = `
    (max-width: ${breakpoints.sm}) 100vw,
    (max-width: ${breakpoints.md}) 50vw,
    (max-width: ${breakpoints.lg}) 33vw,
    25vw
  `.replace(/\s+/g, ' ').trim();

  return <OptimizedImage {...props} sizes={sizes} />;
}

interface HeroImageProps extends Omit<OptimizedImageProps, 'priority' | 'sizes'> {
  mobileAspectRatio?: number;
  desktopAspectRatio?: number;
}

export function HeroImage({
  mobileAspectRatio = 1,
  desktopAspectRatio = 16 / 9,
  ...props
}: HeroImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      sizes="100vw"
      className={cn('w-full h-auto', props.className)}
      aspectRatio={desktopAspectRatio}
    />
  );
}

interface ThumbnailProps extends Omit<OptimizedImageProps, 'sizes' | 'aspectRatio'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Thumbnail({ size = 'md', ...props }: ThumbnailProps) {
  const sizeMap = {
    sm: { width: 64, height: 64, sizes: '64px' },
    md: { width: 128, height: 128, sizes: '128px' },
    lg: { width: 256, height: 256, sizes: '256px' },
    xl: { width: 384, height: 384, sizes: '384px' },
  };

  const { width, height, sizes } = sizeMap[size];

  return (
    <OptimizedImage
      {...props}
      width={width}
      height={height}
      sizes={sizes}
      aspectRatio={1}
      className={cn(' object-cover', props.className)}
    />
  );
}

interface AvatarProps extends Omit<OptimizedImageProps, 'aspectRatio' | 'sizes'> {
  size?: number;
  fallbackInitials?: string;
}

export function Avatar({ 
  size = 40, 
  fallbackInitials = 'U',
  ...props 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center  bg-gray-200 text-gray-600 font-medium',
          props.className
        )}
        style={{ width: size, height: size }}
      >
        {fallbackInitials}
      </div>
    );
  }

  return (
    <OptimizedImage
      {...props}
      width={size}
      height={size}
      sizes={`${size}px`}
      aspectRatio={1}
      onError={() => setImageError(true)}
      className={cn(' object-cover', props.className)}
    />
  );
}

interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
}

export function LazyImage({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}: LazyImageProps) {
  const [inView, setInView] = useState(false);

  // Use Intersection Observer for lazy loading
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  if (!inView) {
    return (
      <div 
        ref={ref}
        className={cn('bg-gray-200 animate-pulse', props.className)}
        style={{ aspectRatio: props.aspectRatio || 16 / 9 }}
      />
    );
  }

  return <OptimizedImage {...props} />;
}