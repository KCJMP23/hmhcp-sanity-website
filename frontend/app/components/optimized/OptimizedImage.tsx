'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  className?: string;
  containerClassName?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  lazy?: boolean;
  medical?: boolean; // For medical images requiring higher quality
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality,
  className,
  containerClassName,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  lazy = true,
  medical = false,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, priority]);

  // Preload image on hover for better UX
  const handleMouseEnter = () => {
    if (!isInView && !priority) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageSrc(fallbackSrc);
    setIsLoading(false);
    onError?.();
  };

  // Generate blur data URL if not provided
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    
    // Simple blur placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
  };

  // Calculate quality based on use case
  const getQuality = () => {
    if (quality) return quality;
    if (medical) return 95; // High quality for medical images
    if (priority) return 85; // Higher quality for above-the-fold
    return 75; // Standard quality
  };

  // Generate responsive sizes if not provided
  const getSizes = () => {
    if (sizes) return sizes;
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
      onMouseEnter={handleMouseEnter}
    >
      {isInView ? (
        <>
          {/* Loading skeleton */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          {/* Actual image */}
          <Image
            src={imageSrc}
            alt={alt}
            width={width || 800}
            height={height || 600}
            priority={priority}
            quality={getQuality()}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            placeholder={placeholder}
            blurDataURL={generateBlurDataURL()}
            sizes={getSizes()}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
          />
        </>
      ) : (
        /* Placeholder while not in view */
        <div 
          className={cn(
            'bg-gray-100 animate-pulse',
            className
          )}
          style={{
            width: width || '100%',
            height: height || 'auto',
            aspectRatio: width && height ? `${width}/${height}` : undefined,
          }}
        />
      )}
    </div>
  );
}

// Optimized Image Gallery Component
export function OptimizedImageGallery({
  images,
  columns = 3,
  gap = 4,
  medical = false,
}: {
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  columns?: number;
  gap?: number;
  medical?: boolean;
}) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  return (
    <div
      className={cn(
        'grid',
        `grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`,
        `gap-${gap}`
      )}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          priority={index < columns} // Priority for first row
          medical={medical}
          onLoad={() => handleImageLoad(index)}
          containerClassName="aspect-square"
          className="object-cover w-full h-full"
        />
      ))}
    </div>
  );
}

// Medical Image Viewer with special handling
export function MedicalImageViewer({
  src,
  alt,
  studyInfo,
}: {
  src: string;
  alt: string;
  studyInfo?: {
    patientId?: string;
    studyDate?: string;
    modality?: string;
  };
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-white/90 hover:bg-white text-black px-3 py-1 rounded"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white/90 hover:bg-white text-black px-3 py-1 rounded"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={handleReset}
          className="bg-white/90 hover:bg-white text-black px-3 py-1 rounded"
          aria-label="Reset view"
        >
          Reset
        </button>
      </div>

      {/* Study Info */}
      {studyInfo && (
        <div className="absolute top-4 left-4 z-10 text-white text-sm space-y-1">
          {studyInfo.patientId && <div>Patient: {studyInfo.patientId}</div>}
          {studyInfo.studyDate && <div>Date: {studyInfo.studyDate}</div>}
          {studyInfo.modality && <div>Modality: {studyInfo.modality}</div>}
        </div>
      )}

      {/* Medical Image */}
      <div
        className="relative cursor-move"
        style={{
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          transition: 'transform 0.2s',
        }}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          width={1200}
          height={900}
          medical={true}
          priority={true}
          quality={100} // Maximum quality for medical images
          className="select-none"
        />
      </div>
    </div>
  );
}