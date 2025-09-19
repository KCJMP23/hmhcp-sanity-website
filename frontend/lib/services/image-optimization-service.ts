import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('ImageOptimizationService');

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  progressive?: boolean;
  stripMetadata?: boolean;
}

export interface OptimizedImage {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
  url: string;
  isOptimized: boolean;
}

export interface HealthcareComplianceCheck {
  isCompliant: boolean;
  issues: string[];
  recommendations: string[];
  altTextScore: number;
  accessibilityScore: number;
  medicalAccuracyScore: number;
}

export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  private readonly HEALTHCARE_COMPLIANCE_KEYWORDS = [
    'patient', 'medical', 'healthcare', 'hospital', 'clinic', 'doctor', 'nurse',
    'treatment', 'therapy', 'surgery', 'diagnosis', 'care', 'health'
  ];

  private constructor() {}

  public static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  /**
   * Optimize an image file
   */
  async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    try {
      logger.info('Starting image optimization', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Validate file
      this.validateImageFile(file);

      // Set default options
      const opts: Required<ImageOptimizationOptions> = {
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1080,
        quality: options.quality || 85,
        format: options.format || 'webp',
        progressive: options.progressive ?? true,
        stripMetadata: options.stripMetadata ?? true
      };

      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Load image
      const image = await this.loadImage(file);
      
      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        image.width,
        image.height,
        opts.maxWidth,
        opts.maxHeight
      );

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and optimize image
      ctx.drawImage(image, 0, 0, width, height);

      // Convert to optimized format
      const optimizedBlob = await this.canvasToBlob(canvas, opts);
      const optimizedUrl = URL.createObjectURL(optimizedBlob);

      const result: OptimizedImage = {
        originalSize: file.size,
        optimizedSize: optimizedBlob.size,
        compressionRatio: Math.round(((file.size - optimizedBlob.size) / file.size) * 100),
        width,
        height,
        format: opts.format,
        url: optimizedUrl,
        isOptimized: optimizedBlob.size < file.size
      };

      logger.info('Image optimization completed', {
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        compressionRatio: result.compressionRatio
      });

      return result;
    } catch (error) {
      logger.error('Image optimization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name
      });
      throw error;
    }
  }

  /**
   * Check healthcare compliance for an image
   */
  async checkHealthcareCompliance(
    image: File,
    altText: string = '',
    caption: string = ''
  ): Promise<HealthcareComplianceCheck> {
    try {
      logger.info('Checking healthcare compliance', {
        fileName: image.name,
        altTextLength: altText.length,
        captionLength: caption.length
      });

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check file format
      if (!this.ALLOWED_FORMATS.includes(image.type)) {
        issues.push(`Unsupported file format: ${image.type}. Use JPEG, PNG, WebP, or AVIF.`);
      }

      // Check file size
      if (image.size > this.MAX_FILE_SIZE) {
        issues.push(`File size too large: ${Math.round(image.size / 1024 / 1024)}MB. Maximum allowed: 10MB.`);
      }

      // Check alt text
      const altTextScore = this.analyzeAltText(altText);
      if (altTextScore < 50) {
        issues.push('Alt text is missing or insufficient for accessibility');
        recommendations.push('Add descriptive alt text that explains the medical content');
      }

      // Check for medical terminology in alt text
      const hasMedicalTerms = this.HEALTHCARE_COMPLIANCE_KEYWORDS.some(keyword =>
        altText.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasMedicalTerms && altText.length > 0) {
        recommendations.push('Consider including medical terminology in alt text for better context');
      }

      // Check image dimensions
      const imageDimensions = await this.getImageDimensions(image);
      if (imageDimensions.width < 400 || imageDimensions.height < 300) {
        issues.push('Image resolution too low for healthcare content');
        recommendations.push('Use images with at least 400x300 pixels for better quality');
      }

      // Check aspect ratio
      const aspectRatio = imageDimensions.width / imageDimensions.height;
      if (aspectRatio < 0.5 || aspectRatio > 3) {
        recommendations.push('Consider using images with more standard aspect ratios (1:1 to 3:1)');
      }

      // Calculate accessibility score
      const accessibilityScore = this.calculateAccessibilityScore(altText, caption, imageDimensions);

      // Calculate medical accuracy score
      const medicalAccuracyScore = this.calculateMedicalAccuracyScore(altText, caption);

      const isCompliant = issues.length === 0 && altTextScore >= 50;

      const result: HealthcareComplianceCheck = {
        isCompliant,
        issues,
        recommendations,
        altTextScore,
        accessibilityScore,
        medicalAccuracyScore
      };

      logger.info('Healthcare compliance check completed', {
        isCompliant: result.isCompliant,
        issuesCount: result.issues.length,
        altTextScore: result.altTextScore
      });

      return result;
    } catch (error) {
      logger.error('Healthcare compliance check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        isCompliant: false,
        issues: ['Unable to perform compliance check'],
        recommendations: ['Please try again or contact support'],
        altTextScore: 0,
        accessibilityScore: 0,
        medicalAccuracyScore: 0
      };
    }
  }

  /**
   * Generate automatic alt text for medical images
   */
  async generateAltText(image: File, context?: string): Promise<string> {
    try {
      logger.info('Generating alt text for medical image', {
        fileName: image.name,
        hasContext: !!context
      });

      // In production, this would use AI/ML services for image analysis
      const mockAltTexts = [
        'Medical professional examining patient in clinical setting',
        'Healthcare team discussing treatment plan in modern hospital',
        'Advanced medical equipment in sterile operating room',
        'Doctor consulting with patient in comfortable examination room',
        'Medical research laboratory with state-of-the-art equipment',
        'Nursing staff providing patient care in hospital ward',
        'Surgical team performing procedure with precision instruments',
        'Medical consultation room with healthcare professionals',
        'Patient receiving treatment in specialized medical facility',
        'Healthcare technology and equipment in clinical environment'
      ];

      // Select appropriate alt text based on context
      let selectedAltText = mockAltTexts[Math.floor(Math.random() * mockAltTexts.length)];
      
      if (context) {
        const contextKeywords = context.toLowerCase().split(' ');
        const medicalKeywords = this.HEALTHCARE_COMPLIANCE_KEYWORDS;
        
        // Find matching keywords and adjust alt text
        const matchingKeywords = contextKeywords.filter(keyword =>
          medicalKeywords.some(medical => medical.includes(keyword))
        );
        
        if (matchingKeywords.length > 0) {
          selectedAltText = `Medical ${matchingKeywords[0]} procedure in healthcare setting`;
        }
      }

      logger.info('Alt text generated', { altText: selectedAltText });
      return selectedAltText;
    } catch (error) {
      logger.error('Alt text generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 'Medical image showing healthcare-related content';
    }
  }

  /**
   * Resize image to specific dimensions
   */
  async resizeImage(
    file: File,
    width: number,
    height: number,
    quality: number = 85
  ): Promise<Blob> {
    try {
      logger.info('Resizing image', {
        fileName: file.name,
        targetWidth: width,
        targetHeight: height
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      canvas.width = width;
      canvas.height = height;

      const image = await this.loadImage(file);
      ctx.drawImage(image, 0, 0, width, height);

      const blob = await this.canvasToBlob(canvas, { quality, format: 'jpeg' });
      
      logger.info('Image resized successfully', {
        originalSize: file.size,
        newSize: blob.size
      });

      return blob;
    } catch (error) {
      logger.error('Image resize failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private validateImageFile(file: File): void {
    if (!this.ALLOWED_FORMATS.includes(file.type)) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large: ${Math.round(file.size / 1024 / 1024)}MB`);
    }
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Calculate scaling factor
    const widthScale = maxWidth / originalWidth;
    const heightScale = maxHeight / originalHeight;
    const scale = Math.min(widthScale, heightScale, 1); // Don't upscale

    width = Math.round(originalWidth * scale);
    height = Math.round(originalHeight * scale);

    return { width, height };
  }

  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    options: { quality: number; format: string }
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        `image/${options.format}`,
        options.quality / 100
      );
    });
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.width, height: image.height });
        URL.revokeObjectURL(image.src);
      };
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = URL.createObjectURL(file);
    });
  }

  private analyzeAltText(altText: string): number {
    if (!altText || altText.trim().length === 0) return 0;
    
    let score = 0;
    const text = altText.toLowerCase();
    
    // Length score (0-30 points)
    if (text.length >= 50) score += 30;
    else if (text.length >= 25) score += 20;
    else if (text.length >= 10) score += 10;
    
    // Medical terminology score (0-40 points)
    const medicalTerms = this.HEALTHCARE_COMPLIANCE_KEYWORDS.filter(term =>
      text.includes(term.toLowerCase())
    );
    score += Math.min(medicalTerms.length * 8, 40);
    
    // Descriptive words score (0-30 points)
    const descriptiveWords = ['showing', 'depicting', 'displaying', 'featuring', 'illustrating'];
    const hasDescriptiveWords = descriptiveWords.some(word => text.includes(word));
    if (hasDescriptiveWords) score += 15;
    
    // Context score (0-30 points)
    const contextWords = ['patient', 'medical', 'healthcare', 'clinical', 'hospital'];
    const hasContext = contextWords.some(word => text.includes(word));
    if (hasContext) score += 15;
    
    return Math.min(score, 100);
  }

  private calculateAccessibilityScore(
    altText: string,
    caption: string,
    dimensions: { width: number; height: number }
  ): number {
    let score = 0;
    
    // Alt text presence (40 points)
    if (altText && altText.trim().length > 0) score += 40;
    
    // Caption presence (20 points)
    if (caption && caption.trim().length > 0) score += 20;
    
    // Image quality (20 points)
    if (dimensions.width >= 400 && dimensions.height >= 300) score += 20;
    
    // Alt text quality (20 points)
    if (altText && altText.length >= 25) score += 20;
    
    return Math.min(score, 100);
  }

  private calculateMedicalAccuracyScore(altText: string, caption: string): number {
    let score = 0;
    const text = `${altText} ${caption}`.toLowerCase();
    
    // Medical terminology (50 points)
    const medicalTerms = this.HEALTHCARE_COMPLIANCE_KEYWORDS.filter(term =>
      text.includes(term.toLowerCase())
    );
    score += Math.min(medicalTerms.length * 10, 50);
    
    // Professional language (30 points)
    const professionalWords = ['professional', 'clinical', 'medical', 'healthcare', 'treatment'];
    const hasProfessionalLanguage = professionalWords.some(word => text.includes(word));
    if (hasProfessionalLanguage) score += 30;
    
    // Context accuracy (20 points)
    const contextWords = ['patient', 'doctor', 'nurse', 'hospital', 'clinic'];
    const hasContext = contextWords.some(word => text.includes(word));
    if (hasContext) score += 20;
    
    return Math.min(score, 100);
  }
}

export const imageOptimizationService = ImageOptimizationService.getInstance();
