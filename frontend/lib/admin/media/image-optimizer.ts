import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

export interface ImageOptimizationSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  formats: string[];
  compressionLevel: number;
  generateThumbnails: boolean;
  thumbnailSizes: number[];
}

export interface OptimizedImageResult {
  original: {
    url: string;
    size: number;
    width: number;
    height: number;
  };
  optimized: {
    url: string;
    size: number;
    width: number;
    height: number;
    format: string;
    compressionRatio: number;
  };
  thumbnails: Array<{
    url: string;
    size: number;
    width: number;
    height: number;
    format: string;
  }>;
  metadata: {
    processingTime: number;
    optimizationLevel: string;
    healthcareCompliant: boolean;
  };
}

export class ImageOptimizer {
  private logger: HealthcareAILogger;
  private defaultSettings: ImageOptimizationSettings = {
    quality: 85,
    maxWidth: 2048,
    maxHeight: 2048,
    formats: ['webp', 'avif', 'jpeg'],
    compressionLevel: 6,
    generateThumbnails: true,
    thumbnailSizes: [150, 300, 600, 1200]
  };

  constructor() {
    this.logger = new HealthcareAILogger('ImageOptimizer');
  }

  /**
   * Optimize a single image with healthcare compliance validation
   */
  async optimizeImage(
    imageFile: File,
    settings: Partial<ImageOptimizationSettings> = {}
  ): Promise<OptimizedImageResult> {
    const startTime = Date.now();
    const finalSettings = { ...this.defaultSettings, ...settings };

    this.logger.log('Starting image optimization', {
      filename: imageFile.name,
      originalSize: imageFile.size,
      settings: finalSettings,
      context: 'image_optimization'
    });

    try {
      // Validate healthcare compliance
      const isCompliant = await this.validateHealthcareCompliance(imageFile);
      if (!isCompliant) {
        throw new Error('Image does not meet healthcare compliance standards');
      }

      // Get image dimensions
      const dimensions = await this.getImageDimensions(imageFile);
      
      // Calculate optimal dimensions
      const optimalDimensions = this.calculateOptimalDimensions(
        dimensions.width,
        dimensions.height,
        finalSettings.maxWidth,
        finalSettings.maxHeight
      );

      // Generate optimized versions
      const optimizedVersions = await this.generateOptimizedVersions(
        imageFile,
        optimalDimensions,
        finalSettings
      );

      // Generate thumbnails
      const thumbnails = finalSettings.generateThumbnails
        ? await this.generateThumbnails(imageFile, finalSettings.thumbnailSizes, finalSettings)
        : [];

      const processingTime = Date.now() - startTime;
      const compressionRatio = this.calculateCompressionRatio(
        imageFile.size,
        optimizedVersions[0].size
      );

      const result: OptimizedImageResult = {
        original: {
          url: URL.createObjectURL(imageFile),
          size: imageFile.size,
          width: dimensions.width,
          height: dimensions.height
        },
        optimized: {
          url: optimizedVersions[0].url,
          size: optimizedVersions[0].size,
          width: optimalDimensions.width,
          height: optimalDimensions.height,
          format: optimizedVersions[0].format,
          compressionRatio
        },
        thumbnails,
        metadata: {
          processingTime,
          optimizationLevel: this.getOptimizationLevel(compressionRatio),
          healthcareCompliant: isCompliant
        }
      };

      this.logger.log('Image optimization completed', {
        filename: imageFile.name,
        originalSize: imageFile.size,
        optimizedSize: result.optimized.size,
        compressionRatio,
        processingTime,
        context: 'image_optimization'
      });

      return result;
    } catch (error) {
      this.logger.error('Image optimization failed', error, {
        filename: imageFile.name,
        context: 'image_optimization'
      });
      throw error;
    }
  }

  /**
   * Batch optimize multiple images
   */
  async batchOptimizeImages(
    imageFiles: File[],
    settings: Partial<ImageOptimizationSettings> = {}
  ): Promise<OptimizedImageResult[]> {
    this.logger.log('Starting batch image optimization', {
      fileCount: imageFiles.length,
      context: 'image_optimization'
    });

    const results: OptimizedImageResult[] = [];
    const batchSize = 3; // Process 3 images at a time

    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const batchPromises = batch.map(file => this.optimizeImage(file, settings));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            this.logger.error('Batch optimization failed for file', result.reason, {
              filename: batch[index].name,
              context: 'image_optimization'
            });
          }
        });

        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < imageFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        this.logger.error('Batch processing error', error, {
          batchIndex: i,
          context: 'image_optimization'
        });
      }
    }

    this.logger.log('Batch image optimization completed', {
      totalFiles: imageFiles.length,
      successfulOptimizations: results.length,
      context: 'image_optimization'
    });

    return results;
  }

  /**
   * Validate healthcare compliance for medical images
   */
  private async validateHealthcareCompliance(imageFile: File): Promise<boolean> {
    // Simulate healthcare compliance validation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if it's a medical image format
        const medicalFormats = ['image/jpeg', 'image/png', 'image/webp'];
        const isValidFormat = medicalFormats.includes(imageFile.type);
        
        // Check file size (medical images should be reasonable size)
        const isValidSize = imageFile.size > 1024 && imageFile.size < 50 * 1024 * 1024; // 1KB to 50MB
        
        // Simulate medical accuracy check
        const isMedicallyAccurate = Math.random() > 0.05; // 95% pass rate
        
        const isCompliant = isValidFormat && isValidSize && isMedicallyAccurate;
        resolve(isCompliant);
      }, 1000);
    });
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageFile: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Generate optimized versions in different formats
   */
  private async generateOptimizedVersions(
    imageFile: File,
    dimensions: { width: number; height: number },
    settings: ImageOptimizationSettings
  ): Promise<Array<{ url: string; size: number; format: string }>> {
    const versions: Array<{ url: string; size: number; format: string }> = [];

    for (const format of settings.formats) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // Load and draw image
        const img = await this.loadImage(imageFile);
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        // Convert to desired format
        const mimeType = this.getMimeType(format);
        const quality = format === 'jpeg' ? settings.quality / 100 : undefined;
        
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const blob = await this.dataUrlToBlob(dataUrl);

        versions.push({
          url: URL.createObjectURL(blob),
          size: blob.size,
          format
        });
      } catch (error) {
        this.logger.warn(`Failed to generate ${format} version`, {
          format,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'image_optimization'
        });
      }
    }

    return versions;
  }

  /**
   * Generate thumbnails in multiple sizes
   */
  private async generateThumbnails(
    imageFile: File,
    sizes: number[],
    settings: ImageOptimizationSettings
  ): Promise<Array<{ url: string; size: number; width: number; height: number; format: string }>> {
    const thumbnails: Array<{ url: string; size: number; width: number; height: number; format: string }> = [];
    const img = await this.loadImage(imageFile);
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    for (const size of sizes) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;

        const width = size;
        const height = Math.round(size / aspectRatio);
        
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        const blob = await this.dataUrlToBlob(dataUrl);

        thumbnails.push({
          url: URL.createObjectURL(blob),
          size: blob.size,
          width,
          height,
          format: 'webp'
        });
      } catch (error) {
        this.logger.warn(`Failed to generate thumbnail for size ${size}`, {
          size,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'image_optimization'
        });
      }
    }

    return thumbnails;
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert data URL to blob
   */
  private dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert to blob'));
          }
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif'
    };
    return mimeTypes[format] || 'image/jpeg';
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(originalSize: number, optimizedSize: number): number {
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  }

  /**
   * Get optimization level based on compression ratio
   */
  private getOptimizationLevel(compressionRatio: number): string {
    if (compressionRatio >= 70) return 'Excellent';
    if (compressionRatio >= 50) return 'Good';
    if (compressionRatio >= 30) return 'Fair';
    return 'Poor';
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(originalSize: number, optimizedSize: number): string[] {
    const recommendations: string[] = [];
    const compressionRatio = this.calculateCompressionRatio(originalSize, optimizedSize);

    if (compressionRatio < 30) {
      recommendations.push('Consider reducing image quality or dimensions for better compression');
    }

    if (originalSize > 5 * 1024 * 1024) { // 5MB
      recommendations.push('Original image is very large, consider using a smaller source image');
    }

    if (compressionRatio > 80) {
      recommendations.push('Excellent compression achieved! Consider this as a template for other images');
    }

    return recommendations;
  }
}
