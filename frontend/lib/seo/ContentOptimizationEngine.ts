// Content Optimization Engine
// Created: 2025-01-27
// Purpose: Advanced content optimization suggestions for healthcare websites

import { MedicalAccuracyValidator, MedicalContent } from './MedicalAccuracyValidator';

export interface ContentOptimizationResult {
  overallScore: number;
  suggestions: ContentSuggestion[];
  keywordOptimization: KeywordOptimization;
  readabilityScore: number;
  medicalAccuracy: number;
  seoScore: number;
  healthcareCompliance: number;
  priorityActions: string[];
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContentSuggestion {
  id: string;
  type: 'keyword' | 'readability' | 'medical' | 'seo' | 'compliance' | 'structure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  location?: {
    line?: number;
    element?: string;
    position?: 'title' | 'meta' | 'heading' | 'content' | 'image';
  };
  codeExample?: string;
  healthcareSpecific: boolean;
}

export interface KeywordOptimization {
  primaryKeywords: KeywordAnalysis[];
  secondaryKeywords: KeywordAnalysis[];
  keywordDensity: Record<string, number>;
  keywordDistribution: Record<string, number>;
  missingKeywords: string[];
  overOptimizedKeywords: string[];
  semanticKeywords: string[];
  longTailKeywords: string[];
}

export interface KeywordAnalysis {
  keyword: string;
  currentDensity: number;
  optimalDensity: number;
  currentPosition: number;
  targetPosition: number;
  searchVolume: number;
  difficulty: number;
  healthcareRelevance: number;
  suggestions: string[];
}

export interface ReadabilityMetrics {
  fleschKincaid: number;
  gunningFog: number;
  smog: number;
  averageGradeLevel: number;
  sentenceCount: number;
  wordCount: number;
  syllableCount: number;
  complexWords: number;
  passiveVoice: number;
}

export class ContentOptimizationEngine {
  private medicalValidator: MedicalAccuracyValidator;
  private healthcareKeywords: Map<string, string[]> = new Map();
  private medicalSpecialties: string[] = [];

  constructor() {
    this.medicalValidator = new MedicalAccuracyValidator();
    this.initializeHealthcareKeywords();
    this.initializeMedicalSpecialties();
  }

  async optimizeContent(content: MedicalContent): Promise<ContentOptimizationResult> {
    const suggestions: ContentSuggestion[] = [];
    
    // Analyze medical accuracy
    const medicalAccuracy = await this.medicalValidator.validateContent(content);
    
    // Generate keyword optimization suggestions
    const keywordOptimization = this.analyzeKeywords(content);
    suggestions.push(...this.generateKeywordSuggestions(keywordOptimization, content));
    
    // Generate readability suggestions
    const readabilityMetrics = this.analyzeReadability(content);
    suggestions.push(...this.generateReadabilitySuggestions(readabilityMetrics, content));
    
    // Generate SEO suggestions
    const seoSuggestions = this.generateSEOSuggestions(content);
    suggestions.push(...seoSuggestions);
    
    // Generate medical accuracy suggestions
    const medicalSuggestions = this.convertMedicalIssuesToSuggestions(medicalAccuracy.issues);
    suggestions.push(...medicalSuggestions);
    
    // Generate compliance suggestions
    const complianceSuggestions = this.generateComplianceSuggestions(content, medicalAccuracy);
    suggestions.push(...complianceSuggestions);
    
    // Generate structure suggestions
    const structureSuggestions = this.generateStructureSuggestions(content);
    suggestions.push(...structureSuggestions);
    
    // Calculate scores
    const seoScore = this.calculateSEOScore(content, suggestions);
    const readabilityScore = this.calculateReadabilityScore(readabilityMetrics);
    const healthcareCompliance = this.calculateHealthcareCompliance(medicalAccuracy);
    
    // Determine priority actions
    const priorityActions = this.determinePriorityActions(suggestions);
    const estimatedImpact = this.estimateImpact(suggestions);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      seoScore,
      readabilityScore,
      medicalAccuracy: medicalAccuracy.score,
      healthcareCompliance
    });
    
    return {
      overallScore,
      suggestions,
      keywordOptimization,
      readabilityScore,
      medicalAccuracy: medicalAccuracy.score,
      seoScore,
      healthcareCompliance,
      priorityActions,
      estimatedImpact
    };
  }

  private analyzeKeywords(content: MedicalContent): KeywordOptimization {
    const text = `${content.title} ${content.content}`.toLowerCase();
    const words = text.split(/\s+/);
    const totalWords = words.length;
    
    // Get relevant healthcare keywords
    const relevantKeywords = this.getRelevantKeywords(content.medicalSpecialty);
    
    // Analyze keyword density
    const keywordDensity: Record<string, number> = {};
    const keywordDistribution: Record<string, number> = {};
    
    relevantKeywords.forEach(keyword => {
      const count = words.filter(word => word.includes(keyword.toLowerCase())).length;
      keywordDensity[keyword] = (count / totalWords) * 100;
      
      // Calculate distribution across content sections
      const titleCount = content.title.toLowerCase().split(/\s+/).filter(word => 
        word.includes(keyword.toLowerCase())
      ).length;
      const contentCount = content.content.toLowerCase().split(/\s+/).filter(word => 
        word.includes(keyword.toLowerCase())
      ).length;
      
      keywordDistribution[keyword] = {
        title: (titleCount / content.title.split(/\s+/).length) * 100,
        content: (contentCount / content.content.split(/\s+/).length) * 100
      };
    });
    
    // Analyze primary and secondary keywords
    const primaryKeywords = this.analyzePrimaryKeywords(relevantKeywords, keywordDensity, content);
    const secondaryKeywords = this.analyzeSecondaryKeywords(relevantKeywords, keywordDensity, content);
    
    // Find missing keywords
    const missingKeywords = this.findMissingKeywords(relevantKeywords, text);
    
    // Find over-optimized keywords
    const overOptimizedKeywords = this.findOverOptimizedKeywords(keywordDensity);
    
    // Generate semantic keywords
    const semanticKeywords = this.generateSemanticKeywords(content);
    
    // Generate long-tail keywords
    const longTailKeywords = this.generateLongTailKeywords(content);
    
    return {
      primaryKeywords,
      secondaryKeywords,
      keywordDensity,
      keywordDistribution,
      missingKeywords,
      overOptimizedKeywords,
      semanticKeywords,
      longTailKeywords
    };
  }

  private generateKeywordSuggestions(
    keywordOptimization: KeywordOptimization,
    content: MedicalContent
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    // Primary keyword suggestions
    keywordOptimization.primaryKeywords.forEach(keyword => {
      if (keyword.currentDensity < keyword.optimalDensity * 0.5) {
        suggestions.push({
          id: `keyword_${keyword.keyword}_increase`,
          type: 'keyword',
          priority: 'high',
          title: 'Increase Primary Keyword Density',
          description: `"${keyword.keyword}" appears too infrequently (${keyword.currentDensity.toFixed(1)}% vs optimal ${keyword.optimalDensity}%)`,
          currentValue: `${keyword.currentDensity.toFixed(1)}%`,
          suggestedValue: `${keyword.optimalDensity}%`,
          impact: 'High - Better search visibility for primary keywords',
          effort: 'medium',
          location: { position: 'content' },
          healthcareSpecific: true
        });
      } else if (keyword.currentDensity > keyword.optimalDensity * 1.5) {
        suggestions.push({
          id: `keyword_${keyword.keyword}_decrease`,
          type: 'keyword',
          priority: 'medium',
          title: 'Reduce Keyword Over-Optimization',
          description: `"${keyword.keyword}" appears too frequently (${keyword.currentDensity.toFixed(1)}% vs optimal ${keyword.optimalDensity}%)`,
          currentValue: `${keyword.currentDensity.toFixed(1)}%`,
          suggestedValue: `${keyword.optimalDensity}%`,
          impact: 'Medium - Avoid keyword stuffing penalties',
          effort: 'low',
          location: { position: 'content' },
          healthcareSpecific: true
        });
      }
    });
    
    // Missing keyword suggestions
    keywordOptimization.missingKeywords.forEach(keyword => {
      suggestions.push({
        id: `keyword_${keyword}_missing`,
        type: 'keyword',
        priority: 'medium',
        title: 'Add Missing Healthcare Keyword',
        description: `Consider adding "${keyword}" to improve healthcare relevance`,
        suggestedValue: keyword,
        impact: 'Medium - Better healthcare content targeting',
        effort: 'low',
        location: { position: 'content' },
        healthcareSpecific: true
      });
    });
    
    // Title optimization
    const titleKeywords = this.extractKeywordsFromTitle(content.title);
    if (titleKeywords.length === 0) {
      suggestions.push({
        id: 'title_keywords_missing',
        type: 'keyword',
        priority: 'high',
        title: 'Add Keywords to Title',
        description: 'Title should include primary healthcare keywords',
        currentValue: content.title,
        impact: 'High - Title is crucial for SEO',
        effort: 'low',
        location: { position: 'title' },
        healthcareSpecific: true
      });
    }
    
    return suggestions;
  }

  private generateReadabilitySuggestions(
    metrics: ReadabilityMetrics,
    content: MedicalContent
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    // Grade level suggestions
    if (metrics.averageGradeLevel > 12) {
      suggestions.push({
        id: 'readability_grade_level',
        type: 'readability',
        priority: 'high',
        title: 'Simplify Content for Better Readability',
        description: `Content is written at grade level ${metrics.averageGradeLevel.toFixed(1)}, consider simplifying to grade 8-10`,
        currentValue: `Grade ${metrics.averageGradeLevel.toFixed(1)}`,
        suggestedValue: 'Grade 8-10',
        impact: 'High - Better accessibility for patients',
        effort: 'high',
        location: { position: 'content' },
        healthcareSpecific: true
      });
    }
    
    // Sentence length suggestions
    const avgSentenceLength = metrics.wordCount / metrics.sentenceCount;
    if (avgSentenceLength > 20) {
      suggestions.push({
        id: 'readability_sentence_length',
        type: 'readability',
        priority: 'medium',
        title: 'Shorten Long Sentences',
        description: `Average sentence length is ${avgSentenceLength.toFixed(1)} words, aim for 15-20 words`,
        currentValue: `${avgSentenceLength.toFixed(1)} words`,
        suggestedValue: '15-20 words',
        impact: 'Medium - Better readability and comprehension',
        effort: 'medium',
        location: { position: 'content' },
        healthcareSpecific: false
      });
    }
    
    // Passive voice suggestions
    if (metrics.passiveVoice > 20) {
      suggestions.push({
        id: 'readability_passive_voice',
        type: 'readability',
        priority: 'low',
        title: 'Reduce Passive Voice',
        description: `${metrics.passiveVoice.toFixed(1)}% of sentences use passive voice, aim for <20%`,
        currentValue: `${metrics.passiveVoice.toFixed(1)}%`,
        suggestedValue: '<20%',
        impact: 'Low - Slightly better readability',
        effort: 'medium',
        location: { position: 'content' },
        healthcareSpecific: false
      });
    }
    
    // Complex words suggestions
    const complexWordRatio = (metrics.complexWords / metrics.wordCount) * 100;
    if (complexWordRatio > 15) {
      suggestions.push({
        id: 'readability_complex_words',
        type: 'readability',
        priority: 'medium',
        title: 'Simplify Complex Medical Terms',
        description: `${complexWordRatio.toFixed(1)}% of words are complex, consider adding simpler explanations`,
        currentValue: `${complexWordRatio.toFixed(1)}%`,
        suggestedValue: '<15%',
        impact: 'Medium - Better patient understanding',
        effort: 'high',
        location: { position: 'content' },
        healthcareSpecific: true
      });
    }
    
    return suggestions;
  }

  private generateSEOSuggestions(content: MedicalContent): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    // Title length suggestion
    if (content.title.length < 30) {
      suggestions.push({
        id: 'seo_title_length_short',
        type: 'seo',
        priority: 'high',
        title: 'Expand Title Length',
        description: 'Title is too short for optimal SEO (under 30 characters)',
        currentValue: `${content.title.length} characters`,
        suggestedValue: '30-60 characters',
        impact: 'High - Better search engine visibility',
        effort: 'low',
        location: { position: 'title' },
        healthcareSpecific: false
      });
    } else if (content.title.length > 60) {
      suggestions.push({
        id: 'seo_title_length_long',
        type: 'seo',
        priority: 'medium',
        title: 'Shorten Title Length',
        description: 'Title is too long and may be truncated in search results',
        currentValue: `${content.title.length} characters`,
        suggestedValue: '30-60 characters',
        impact: 'Medium - Prevent title truncation',
        effort: 'low',
        location: { position: 'title' },
        healthcareSpecific: false
      });
    }
    
    // Meta description suggestion
    if (!content.content.includes('meta description')) {
      suggestions.push({
        id: 'seo_meta_description',
        type: 'seo',
        priority: 'high',
        title: 'Add Meta Description',
        description: 'Meta description is missing, which is crucial for SEO',
        impact: 'High - Better search result snippets',
        effort: 'low',
        location: { position: 'meta' },
        healthcareSpecific: false,
        codeExample: '<meta name="description" content="Your healthcare content description here">'
      });
    }
    
    // Heading structure suggestion
    const headingCount = (content.content.match(/<h[1-6]/gi) || []).length;
    if (headingCount === 0) {
      suggestions.push({
        id: 'seo_heading_structure',
        type: 'seo',
        priority: 'high',
        title: 'Add Heading Structure',
        description: 'Content lacks proper heading structure (H1, H2, H3, etc.)',
        impact: 'High - Better content organization and SEO',
        effort: 'medium',
        location: { position: 'content' },
        healthcareSpecific: false
      });
    }
    
    // Internal linking suggestion
    const internalLinks = (content.content.match(/<a[^>]+href="[^"]*"[^>]*>/gi) || []).length;
    if (internalLinks < 2) {
      suggestions.push({
        id: 'seo_internal_linking',
        type: 'seo',
        priority: 'medium',
        title: 'Add Internal Links',
        description: 'Content has few internal links, add more to improve site structure',
        currentValue: `${internalLinks} links`,
        suggestedValue: '3-5 links',
        impact: 'Medium - Better site structure and user navigation',
        effort: 'medium',
        location: { position: 'content' },
        healthcareSpecific: false
      });
    }
    
    return suggestions;
  }

  private convertMedicalIssuesToSuggestions(issues: any[]): ContentSuggestion[] {
    return issues.map(issue => ({
      id: `medical_${issue.category}_${Date.now()}`,
      type: 'medical',
      priority: issue.severity === 'critical' ? 'critical' : 
                issue.severity === 'high' ? 'high' : 
                issue.severity === 'medium' ? 'medium' : 'low',
      title: issue.title,
      description: issue.description,
      currentValue: issue.element,
      suggestedValue: issue.suggestedText,
      impact: issue.severity === 'critical' ? 'Critical - Medical accuracy and compliance' :
              issue.severity === 'high' ? 'High - Medical accuracy and trust' :
              issue.severity === 'medium' ? 'Medium - Content quality' : 'Low - Minor improvement',
      effort: issue.severity === 'critical' ? 'high' :
              issue.severity === 'high' ? 'high' :
              issue.severity === 'medium' ? 'medium' : 'low',
      location: { element: issue.element },
      healthcareSpecific: true
    }));
  }

  private generateComplianceSuggestions(
    content: MedicalContent,
    medicalAccuracy: any
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    if (!medicalAccuracy.compliance.fda) {
      suggestions.push({
        id: 'compliance_fda',
        type: 'compliance',
        priority: 'critical',
        title: 'Address FDA Compliance',
        description: 'Content does not meet FDA compliance requirements',
        impact: 'Critical - Legal and regulatory compliance',
        effort: 'high',
        location: { position: 'content' },
        healthcareSpecific: true
      });
    }
    
    if (!medicalAccuracy.compliance.hipaa) {
      suggestions.push({
        id: 'compliance_hipaa',
        type: 'compliance',
        priority: 'critical',
        title: 'Address HIPAA Compliance',
        description: 'Content may violate HIPAA requirements',
        impact: 'Critical - Legal and regulatory compliance',
        effort: 'high',
        location: { position: 'content' },
        healthcareSpecific: true
      });
    }
    
    if (!medicalAccuracy.compliance.advertising) {
      suggestions.push({
        id: 'compliance_advertising',
        type: 'compliance',
        priority: 'high',
        title: 'Address Advertising Compliance',
        description: 'Content does not meet healthcare advertising guidelines',
        impact: 'High - Regulatory compliance',
        effort: 'medium',
        location: { position: 'content' },
        healthcareSpecific: true
      });
    }
    
    return suggestions;
  }

  private generateStructureSuggestions(content: MedicalContent): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    // Content length suggestion
    const wordCount = content.content.split(/\s+/).length;
    if (wordCount < 300) {
      suggestions.push({
        id: 'structure_content_length',
        type: 'structure',
        priority: 'medium',
        title: 'Expand Content Length',
        description: 'Content is too short for comprehensive healthcare information',
        currentValue: `${wordCount} words`,
        suggestedValue: '300+ words',
        impact: 'Medium - Better user value and SEO',
        effort: 'high',
        location: { position: 'content' },
        healthcareSpecific: true
      });
    }
    
    // Image alt text suggestion
    const images = (content.content.match(/<img[^>]*>/gi) || []).length;
    const imagesWithoutAlt = (content.content.match(/<img(?!.*alt=)[^>]*>/gi) || []).length;
    
    if (images > 0 && imagesWithoutAlt > 0) {
      suggestions.push({
        id: 'structure_image_alt',
        type: 'structure',
        priority: 'medium',
        title: 'Add Alt Text to Images',
        description: `${imagesWithoutAlt} images are missing alt text`,
        currentValue: `${imagesWithoutAlt} images without alt text`,
        suggestedValue: 'All images have descriptive alt text',
        impact: 'Medium - Better accessibility and SEO',
        effort: 'low',
        location: { position: 'image' },
        healthcareSpecific: false
      });
    }
    
    return suggestions;
  }

  // Helper methods
  private initializeHealthcareKeywords(): void {
    this.healthcareKeywords.set('general', [
      'health', 'medical', 'doctor', 'patient', 'treatment', 'care',
      'healthcare', 'clinic', 'hospital', 'physician', 'nurse'
    ]);
    
    this.healthcareKeywords.set('cardiology', [
      'heart', 'cardiac', 'cardiovascular', 'blood pressure', 'hypertension',
      'cholesterol', 'stroke', 'heart attack', 'arrhythmia'
    ]);
    
    this.healthcareKeywords.set('oncology', [
      'cancer', 'tumor', 'chemotherapy', 'radiation', 'oncology',
      'malignancy', 'carcinoma', 'treatment', 'diagnosis'
    ]);
  }

  private initializeMedicalSpecialties(): void {
    this.medicalSpecialties = [
      'cardiology', 'oncology', 'neurology', 'orthopedics', 'dermatology',
      'pediatrics', 'mental-health', 'emergency-medicine', 'internal-medicine'
    ];
  }

  private getRelevantKeywords(specialty?: string): string[] {
    const generalKeywords = this.healthcareKeywords.get('general') || [];
    const specialtyKeywords = specialty ? this.healthcareKeywords.get(specialty) || [] : [];
    
    return [...generalKeywords, ...specialtyKeywords];
  }

  private analyzePrimaryKeywords(
    keywords: string[],
    density: Record<string, number>,
    content: MedicalContent
  ): KeywordAnalysis[] {
    return keywords.slice(0, 3).map(keyword => ({
      keyword,
      currentDensity: density[keyword] || 0,
      optimalDensity: 2.0,
      currentPosition: this.findKeywordPosition(keyword, content),
      targetPosition: 1,
      searchVolume: Math.floor(Math.random() * 10000) + 1000,
      difficulty: Math.floor(Math.random() * 50) + 30,
      healthcareRelevance: 90,
      suggestions: [`Increase "${keyword}" usage in title and first paragraph`]
    }));
  }

  private analyzeSecondaryKeywords(
    keywords: string[],
    density: Record<string, number>,
    content: MedicalContent
  ): KeywordAnalysis[] {
    return keywords.slice(3, 8).map(keyword => ({
      keyword,
      currentDensity: density[keyword] || 0,
      optimalDensity: 1.0,
      currentPosition: this.findKeywordPosition(keyword, content),
      targetPosition: 5,
      searchVolume: Math.floor(Math.random() * 5000) + 500,
      difficulty: Math.floor(Math.random() * 40) + 20,
      healthcareRelevance: 75,
      suggestions: [`Include "${keyword}" in subheadings and content`]
    }));
  }

  private findMissingKeywords(keywords: string[], text: string): string[] {
    return keywords.filter(keyword => !text.includes(keyword.toLowerCase()));
  }

  private findOverOptimizedKeywords(density: Record<string, number>): string[] {
    return Object.entries(density)
      .filter(([_, density]) => density > 3.0)
      .map(([keyword, _]) => keyword);
  }

  private generateSemanticKeywords(content: MedicalContent): string[] {
    const semanticMap: Record<string, string[]> = {
      'heart': ['cardiac', 'cardiovascular', 'blood pressure', 'circulation'],
      'cancer': ['tumor', 'malignancy', 'oncology', 'treatment'],
      'diabetes': ['blood sugar', 'glucose', 'insulin', 'metabolism']
    };
    
    const text = content.content.toLowerCase();
    const semanticKeywords: string[] = [];
    
    Object.entries(semanticMap).forEach(([primary, related]) => {
      if (text.includes(primary)) {
        semanticKeywords.push(...related);
      }
    });
    
    return semanticKeywords;
  }

  private generateLongTailKeywords(content: MedicalContent): string[] {
    const baseKeywords = this.getRelevantKeywords(content.medicalSpecialty);
    const longTailKeywords: string[] = [];
    
    baseKeywords.forEach(keyword => {
      longTailKeywords.push(`best ${keyword} treatment`);
      longTailKeywords.push(`${keyword} specialist near me`);
      longTailKeywords.push(`how to treat ${keyword}`);
    });
    
    return longTailKeywords.slice(0, 5);
  }

  private extractKeywordsFromTitle(title: string): string[] {
    const keywords = this.healthcareKeywords.get('general') || [];
    return keywords.filter(keyword => title.toLowerCase().includes(keyword));
  }

  private findKeywordPosition(keyword: string, content: MedicalContent): number {
    const text = `${content.title} ${content.content}`.toLowerCase();
    const words = text.split(/\s+/);
    const keywordIndex = words.findIndex(word => word.includes(keyword.toLowerCase()));
    return keywordIndex === -1 ? 0 : keywordIndex;
  }

  private analyzeReadability(content: MedicalContent): ReadabilityMetrics {
    const text = content.content;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);
    const complexWords = words.filter(word => this.countSyllables(word) >= 3).length;
    const passiveVoice = this.countPassiveVoice(sentences);
    
    const fleschKincaid = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
    const gunningFog = 0.4 * ((words.length / sentences.length) + (100 * (complexWords / words.length)));
    const smog = 1.043 * Math.sqrt(complexWords * (30 / sentences.length)) + 3.1291;
    
    return {
      fleschKincaid,
      gunningFog,
      smog,
      averageGradeLevel: (fleschKincaid + gunningFog + smog) / 3,
      sentenceCount: sentences.length,
      wordCount: words.length,
      syllableCount: syllables,
      complexWords,
      passiveVoice
    };
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    words.forEach(word => {
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        totalSyllables += vowels.length;
      }
    });
    
    return totalSyllables;
  }

  private countPassiveVoice(sentences: string[]): number {
    const passivePatterns = [
      /\bis\s+\w+ed\b/gi,
      /\bwas\s+\w+ed\b/gi,
      /\bwere\s+\w+ed\b/gi,
      /\bbeen\s+\w+ed\b/gi
    ];
    
    let passiveCount = 0;
    sentences.forEach(sentence => {
      passivePatterns.forEach(pattern => {
        if (pattern.test(sentence)) {
          passiveCount++;
        }
      });
    });
    
    return (passiveCount / sentences.length) * 100;
  }

  private calculateSEOScore(content: MedicalContent, suggestions: ContentSuggestion[]): number {
    let score = 100;
    
    // Deduct points for SEO issues
    const seoSuggestions = suggestions.filter(s => s.type === 'seo');
    score -= seoSuggestions.length * 10;
    
    // Bonus for good title length
    if (content.title.length >= 30 && content.title.length <= 60) {
      score += 10;
    }
    
    // Bonus for headings
    const headingCount = (content.content.match(/<h[1-6]/gi) || []).length;
    if (headingCount > 0) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateReadabilityScore(metrics: ReadabilityMetrics): number {
    let score = 100;
    
    // Deduct for high grade level
    if (metrics.averageGradeLevel > 12) {
      score -= (metrics.averageGradeLevel - 12) * 5;
    }
    
    // Deduct for long sentences
    const avgSentenceLength = metrics.wordCount / metrics.sentenceCount;
    if (avgSentenceLength > 20) {
      score -= (avgSentenceLength - 20) * 2;
    }
    
    // Deduct for passive voice
    if (metrics.passiveVoice > 20) {
      score -= (metrics.passiveVoice - 20) * 1;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateHealthcareCompliance(medicalAccuracy: any): number {
    const compliance = medicalAccuracy.compliance;
    let score = 0;
    
    if (compliance.fda) score += 25;
    if (compliance.hipaa) score += 25;
    if (compliance.advertising) score += 25;
    if (compliance.medicalClaims) score += 25;
    
    return score;
  }

  private determinePriorityActions(suggestions: ContentSuggestion[]): string[] {
    const criticalActions = suggestions
      .filter(s => s.priority === 'critical')
      .map(s => s.title);
    
    const highActions = suggestions
      .filter(s => s.priority === 'high')
      .slice(0, 3)
      .map(s => s.title);
    
    return [...criticalActions, ...highActions];
  }

  private estimateImpact(suggestions: ContentSuggestion[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = suggestions.filter(s => s.priority === 'critical').length;
    const highCount = suggestions.filter(s => s.priority === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (highCount > 0) return 'medium';
    return 'low';
  }

  private calculateOverallScore(scores: {
    seoScore: number;
    readabilityScore: number;
    medicalAccuracy: number;
    healthcareCompliance: number;
  }): number {
    const weights = {
      seo: 0.25,
      readability: 0.20,
      medicalAccuracy: 0.30,
      healthcareCompliance: 0.25
    };
    
    return Math.round(
      (scores.seoScore * weights.seo) +
      (scores.readabilityScore * weights.readability) +
      (scores.medicalAccuracy * weights.medicalAccuracy) +
      (scores.healthcareCompliance * weights.healthcareCompliance)
    );
  }
}
