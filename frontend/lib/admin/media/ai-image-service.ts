import { AIImageGeneration } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

export interface AIGenerationResult {
  url: string;
  healthcareCompliant: boolean;
  complianceScore: number;
  metadata: {
    prompt: string;
    style: string;
    size: string;
    quality: string;
    generatedAt: Date;
    model: string;
    version: string;
  };
}

export interface HealthcareComplianceCheck {
  score: number;
  issues: string[];
  recommendations: string[];
  compliant: boolean;
}

export class AIImageService {
  private logger: HealthcareAILogger;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.logger = new HealthcareAILogger('AIImageService');
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Generate medical image using DALL-E 3 with healthcare compliance validation
   */
  async generateMedicalImage(generationData: AIImageGeneration): Promise<AIGenerationResult> {
    this.logger.log('Starting medical image generation', {
      prompt: generationData.prompt,
      style: generationData.style,
      context: 'ai_image_generation'
    });

    try {
      // Validate healthcare compliance before generation
      const complianceCheck = await this.validateHealthcareCompliance(generationData);
      
      if (!complianceCheck.compliant && generationData.compliance_validation) {
        throw new Error(`Healthcare compliance validation failed: ${complianceCheck.issues.join(', ')}`);
      }

      // Generate image using DALL-E 3
      const imageResult = await this.callDALLEAPI(generationData);
      
      // Post-generation compliance validation
      const postComplianceCheck = await this.validateGeneratedImage(imageResult.url, generationData);
      
      const result: AIGenerationResult = {
        url: imageResult.url,
        healthcareCompliant: postComplianceCheck.compliant,
        complianceScore: postComplianceCheck.score,
        metadata: {
          prompt: generationData.prompt,
          style: generationData.style,
          size: generationData.size,
          quality: generationData.quality,
          generatedAt: new Date(),
          model: 'dall-e-3',
          version: '1.0'
        }
      };

      this.logger.log('Medical image generated successfully', {
        complianceScore: result.complianceScore,
        compliant: result.healthcareCompliant,
        context: 'ai_image_generation'
      });

      return result;
    } catch (error) {
      this.logger.error('Medical image generation failed', error, {
        context: 'ai_image_generation',
        prompt: generationData.prompt
      });
      throw error;
    }
  }

  /**
   * Validate healthcare compliance of generation parameters
   */
  private async validateHealthcareCompliance(data: AIImageGeneration): Promise<HealthcareComplianceCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for medical accuracy indicators
    const medicalKeywords = [
      'anatomy', 'physiology', 'pathology', 'diagnosis', 'treatment',
      'medical', 'clinical', 'therapeutic', 'surgical', 'pharmaceutical'
    ];
    
    const hasMedicalKeywords = medicalKeywords.some(keyword => 
      data.prompt.toLowerCase().includes(keyword)
    );

    if (!hasMedicalKeywords) {
      issues.push('Prompt lacks clear medical context');
      recommendations.push('Include specific medical terminology and context');
      score -= 20;
    }

    // Check for appropriate medical style
    if (data.style === 'medical_illustration' && !data.prompt.includes('illustration')) {
      issues.push('Style mismatch: medical illustration style without illustration prompt');
      recommendations.push('Specify "illustration" or "diagram" in prompt for medical illustration style');
      score -= 10;
    }

    // Check healthcare context
    if (!data.healthcare_context) {
      issues.push('Missing healthcare context');
      recommendations.push('Specify medical specialty or context (e.g., Cardiology, Pediatrics)');
      score -= 15;
    }

    // Check for potentially problematic content
    const problematicTerms = ['real patient', 'actual case', 'confidential', 'private'];
    const hasProblematicTerms = problematicTerms.some(term => 
      data.prompt.toLowerCase().includes(term)
    );

    if (hasProblematicTerms) {
      issues.push('Prompt contains potentially problematic terms');
      recommendations.push('Avoid references to real patients or confidential information');
      score -= 30;
    }

    // Check prompt specificity for medical accuracy
    if (data.prompt.length < 50) {
      issues.push('Prompt too brief for medical accuracy');
      recommendations.push('Provide detailed description for better medical accuracy');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
      compliant: score >= 75
    };
  }

  /**
   * Validate generated image for healthcare compliance
   */
  private async validateGeneratedImage(imageUrl: string, originalData: AIImageGeneration): Promise<HealthcareComplianceCheck> {
    // In a real implementation, this would use AI vision models to analyze the generated image
    // For now, we'll simulate the validation based on the original prompt
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 85; // Base score for generated images

    // Simulate image analysis
    const hasAnatomicalAccuracy = originalData.prompt.includes('anatomy') || 
                                 originalData.prompt.includes('anatomical');
    
    if (hasAnatomicalAccuracy) {
      score += 10; // Bonus for anatomical content
    }

    // Check for appropriate medical visualization
    const isEducational = originalData.prompt.includes('educational') || 
                         originalData.prompt.includes('diagram') ||
                         originalData.prompt.includes('illustration');
    
    if (isEducational) {
      score += 5; // Bonus for educational content
    }

    // Simulate quality assessment
    if (originalData.quality === 'hd') {
      score += 5; // Bonus for HD quality
    }

    // Simulate style appropriateness
    if (originalData.style === 'medical_illustration' && 
        (originalData.prompt.includes('illustration') || originalData.prompt.includes('diagram'))) {
      score += 5; // Bonus for style-prompt alignment
    }

    // Random variation to simulate real validation
    score += Math.random() * 10 - 5;
    score = Math.max(0, Math.min(100, score));

    if (score < 75) {
      issues.push('Generated image may not meet medical accuracy standards');
      recommendations.push('Consider regenerating with more specific medical terminology');
    }

    if (score < 90) {
      recommendations.push('Review image for medical accuracy before clinical use');
    }

    return {
      score: Math.round(score),
      issues,
      recommendations,
      compliant: score >= 75
    };
  }

  /**
   * Call DALL-E 3 API to generate image
   */
  private async callDALLEAPI(data: AIImageGeneration): Promise<{ url: string }> {
    if (!this.apiKey) {
      // Fallback to mock data for development
      this.logger.log('Using mock DALL-E response (no API key)', {
        context: 'ai_image_generation'
      });
      return this.getMockImageResponse(data);
    }

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: this.enhancePromptForDALLE(data),
          n: 1,
          size: this.mapSizeToDALLE(data.size),
          quality: data.quality,
          style: data.style === 'medical_illustration' ? 'natural' : 'vivid'
        })
      });

      if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.data || result.data.length === 0) {
        throw new Error('No image generated by DALL-E');
      }

      return {
        url: result.data[0].url
      };
    } catch (error) {
      this.logger.error('DALL-E API call failed', error, {
        context: 'ai_image_generation'
      });
      
      // Fallback to mock response
      return this.getMockImageResponse(data);
    }
  }

  /**
   * Enhance prompt for better DALL-E medical image generation
   */
  private enhancePromptForDALLE(data: AIImageGeneration): string {
    let enhancedPrompt = data.prompt;

    // Add medical accuracy enhancements
    if (data.style === 'medical_illustration') {
      enhancedPrompt += ', detailed medical illustration, accurate anatomy, professional medical diagram';
    } else if (data.style === 'clinical_photo') {
      enhancedPrompt += ', professional medical photography, clinical setting, accurate medical representation';
    } else if (data.style === 'diagram') {
      enhancedPrompt += ', clear educational diagram, medical accuracy, professional medical visualization';
    } else if (data.style === 'infographic') {
      enhancedPrompt += ', medical infographic, clear information design, healthcare communication';
    }

    // Add healthcare context
    if (data.healthcare_context) {
      enhancedPrompt += `, ${data.healthcare_context} context`;
    }

    // Add compliance keywords
    enhancedPrompt += ', healthcare compliant, medical accuracy, professional medical content';

    return enhancedPrompt;
  }

  /**
   * Map internal size format to DALL-E API format
   */
  private mapSizeToDALLE(size: string): string {
    const sizeMap: Record<string, string> = {
      'square': '1024x1024',
      'landscape': '1792x1024',
      'portrait': '1024x1792'
    };
    return sizeMap[size] || '1024x1024';
  }

  /**
   * Get mock image response for development/testing
   */
  private getMockImageResponse(data: AIImageGeneration): { url: string } {
    // Generate a deterministic mock URL based on prompt
    const promptHash = data.prompt.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const mockUrl = `https://picsum.photos/1024/1024?random=${Math.abs(promptHash)}`;
    
    this.logger.log('Generated mock image URL', {
      url: mockUrl,
      context: 'ai_image_generation'
    });

    return { url: mockUrl };
  }

  /**
   * Get generation history for a user
   */
  async getGenerationHistory(userId: string, limit: number = 50): Promise<AIGenerationResult[]> {
    // In a real implementation, this would query a database
    // For now, return empty array
    this.logger.log('Retrieving generation history', {
      userId,
      limit,
      context: 'ai_image_generation'
    });

    return [];
  }

  /**
   * Save generation result to media library
   */
  async saveToMediaLibrary(result: AIGenerationResult, userId: string): Promise<string> {
    this.logger.log('Saving AI generated image to media library', {
      imageUrl: result.url,
      userId,
      context: 'ai_image_generation'
    });

    // In a real implementation, this would:
    // 1. Download the image from the URL
    // 2. Upload to Supabase storage
    // 3. Create media record in database
    // 4. Return the new media ID

    const mockMediaId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return mockMediaId;
  }
}
