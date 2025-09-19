import { useState, useEffect, useRef, useCallback } from 'react';

// Image optimization configuration
export const imageConfig = {
  // Quality settings for different image types
  quality: {
    thumbnail: 60,
    standard: 75,
    high: 85,
    medical: 95, // Higher quality for medical images
  },
  
  // Breakpoints for responsive images
  breakpoints: [320, 640, 768, 1024, 1280, 1600, 1920],
  
  // Format preferences
  formats: ['avif', 'webp', 'jpeg'] as const,
  
  // Lazy loading configuration
  lazyLoad: {
    rootMargin: '50px',
    threshold: 0.01,
  },
};

// Generate srcset for responsive images
export function generateSrcSet(
  src: string,
  sizes: number[] = imageConfig.breakpoints
): string {
  return sizes
    .map(size => `${src}?w=${size} ${size}w`)
    .join(', ');
}

// Generate sizes attribute for responsive images
export function generateSizes(
  defaultSize: string = '100vw',
  breakpoints?: { [key: string]: string }
): string {
  if (!breakpoints) {
    return defaultSize;
  }

  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .concat(defaultSize)
    .join(', ');
}

// Progressive image loading hook
export function useProgressiveImage(
  src: string,
  placeholder?: string
): {
  currentSrc: string;
  isLoading: boolean;
  error: Error | null;
} {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`));
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { currentSrc, isLoading, error };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): [React.RefObject<HTMLElement>, boolean] {
  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(element);
        }
      },
      {
        ...imageConfig.lazyLoad,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options]);

  return [elementRef as React.RefObject<HTMLElement>, isIntersecting];
}

// Optimized image component props
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: keyof typeof imageConfig.quality;
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  placeholder?: 'blur' | 'empty' | string;
  blurDataURL?: string;
}

// Image preloader utility
export class ImagePreloader {
  private static cache = new Map<string, Promise<void>>();

  static async preload(src: string): Promise<void> {
    if (this.cache.has(src)) {
      return this.cache.get(src);
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
      img.src = src;
    });

    this.cache.set(src, promise);
    return promise;
  }

  static async preloadMultiple(srcs: string[]): Promise<void[]> {
    return Promise.all(srcs.map(src => this.preload(src)));
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// Video optimization utilities
export const videoConfig = {
  // Preload strategies
  preload: {
    none: 'none',
    metadata: 'metadata',
    auto: 'auto',
  } as const,
  
  // Quality presets
  quality: {
    low: { width: 640, height: 360, bitrate: '500k' },
    medium: { width: 1280, height: 720, bitrate: '1500k' },
    high: { width: 1920, height: 1080, bitrate: '3000k' },
    ultra: { width: 3840, height: 2160, bitrate: '8000k' },
  },
};

// Hook for adaptive video loading based on connection speed
export function useAdaptiveVideo(sources: {
  low: string;
  medium: string;
  high: string;
}): string {
  const [selectedSource, setSelectedSource] = useState(sources.medium);

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection.effectiveType === '4g' && !connection.saveData) {
        setSelectedSource(sources.high);
      } else if (connection.effectiveType === '3g') {
        setSelectedSource(sources.medium);
      } else {
        setSelectedSource(sources.low);
      }

      // Listen for connection changes
      const handleChange = () => {
        if (connection.effectiveType === '4g' && !connection.saveData) {
          setSelectedSource(sources.high);
        } else if (connection.effectiveType === '3g') {
          setSelectedSource(sources.medium);
        } else {
          setSelectedSource(sources.low);
        }
      };

      connection.addEventListener('change', handleChange);
      
      return () => {
        connection.removeEventListener('change', handleChange);
      };
    }
  }, [sources]);

  return selectedSource;
}

// Document/PDF optimization for medical documents
export const documentConfig = {
  // Maximum file sizes (in MB)
  maxSize: {
    pdf: 10,
    docx: 5,
    xlsx: 5,
    image: 2,
  },
  
  // Compression settings
  compression: {
    pdf: {
      quality: 'ebook', // Options: screen, ebook, printer, prepress
      dpi: 150,
    },
    image: {
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
    },
  },
};

// Hook for handling large file uploads with chunking
export function useChunkedUpload(
  file: File,
  chunkSize: number = 1024 * 1024 // 1MB chunks
): {
  upload: (url: string) => Promise<void>;
  progress: number;
  isUploading: boolean;
  error: Error | null;
} {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (url: string) => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    const chunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;

    try {
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', chunks.toString());
        formData.append('filename', file.name);

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        uploadedChunks++;
        setProgress((uploadedChunks / chunks) * 100);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsUploading(false);
    }
  }, [file, chunkSize]);

  return { upload, progress, isUploading, error };
}

// Resource loading priority manager
export class ResourcePriorityManager {
  private static instance: ResourcePriorityManager;
  private loadingQueue: Map<string, number> = new Map();

  static getInstance(): ResourcePriorityManager {
    if (!this.instance) {
      this.instance = new ResourcePriorityManager();
    }
    return this.instance;
  }

  setPriority(resource: string, priority: 'high' | 'medium' | 'low') {
    const numericPriority = priority === 'high' ? 1 : priority === 'medium' ? 2 : 3;
    this.loadingQueue.set(resource, numericPriority);
  }

  getNextResource(): string | undefined {
    if (this.loadingQueue.size === 0) return undefined;

    let minPriority = Infinity;
    let nextResource: string | undefined;

    this.loadingQueue.forEach((priority, resource) => {
      if (priority < minPriority) {
        minPriority = priority;
        nextResource = resource;
      }
    });

    if (nextResource) {
      this.loadingQueue.delete(nextResource);
    }

    return nextResource;
  }

  clearQueue() {
    this.loadingQueue.clear();
  }
}

// Placeholder generation for blur effect
export function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a gradient for placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

// Medical image specific utilities
export const medicalImageUtils = {
  // DICOM image handling placeholder
  isDICOM: (file: File): boolean => {
    return file.type === 'application/dicom' || file.name.endsWith('.dcm');
  },

  // Sanitize medical images to remove metadata
  sanitizeMetadata: async (file: File): Promise<File> => {
    // Implementation would strip EXIF and other metadata
    // This is a placeholder for the actual implementation
    return file;
  },

  // Compress medical images while preserving diagnostic quality
  compressMedicalImage: async (
    file: File,
    options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
  ): Promise<Blob> => {
    const { quality = 95, maxWidth = 3000, maxHeight = 3000 } = options;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        let { width, height } = img;
        
        // Scale down if necessary
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality / 100
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },
};