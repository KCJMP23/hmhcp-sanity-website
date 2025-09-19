/**
 * Content Humanizer
 * AI detection bypass features for humanized content generation
 */

import { z } from 'zod';

// Humanization technique schemas
const HumanizationRequestSchema = z.object({
  content: z.string(),
  techniques: z.array(z.enum([
    'sentenceVariation',
    'naturalErrors',
    'personalAnecdotes',
    'colloquialisms',
    'emotionalTone',
    'paragraphRestructuring',
    'wordSubstitution',
    'punctuationVariation'
  ])).default(['sentenceVariation', 'naturalErrors', 'colloquialisms']),
  intensity: z.enum(['light', 'medium', 'heavy']).default('medium'),
  preserveMeaning: z.boolean().default(true),
  targetAudience: z.enum(['general', 'professional', 'casual', 'academic']).default('general'),
  context: z.record(z.unknown()).optional()
});

const HumanizationResponseSchema = z.object({
  originalContent: z.string(),
  humanizedContent: z.string(),
  techniquesApplied: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
  readabilityScore: z.number().min(0).max(100),
  humanizationMetrics: z.object({
    sentenceVariations: z.number(),
    naturalErrors: z.number(),
    colloquialisms: z.number(),
    personalElements: z.number(),
    emotionalAdjustments: z.number()
  }),
  processingTime: z.number(),
  recommendations: z.array(z.string())
});

export interface HumanizationRequest {
  content: string;
  techniques: HumanizationTechnique[];
  intensity: 'light' | 'medium' | 'heavy';
  preserveMeaning: boolean;
  targetAudience: 'general' | 'professional' | 'casual' | 'academic';
  context?: Record<string, unknown>;
}

export interface HumanizationResponse {
  originalContent: string;
  humanizedContent: string;
  techniquesApplied: string[];
  confidenceScore: number;
  readabilityScore: number;
  humanizationMetrics: HumanizationMetrics;
  processingTime: number;
  recommendations: string[];
}

export interface HumanizationMetrics {
  sentenceVariations: number;
  naturalErrors: number;
  colloquialisms: number;
  personalElements: number;
  emotionalAdjustments: number;
}

export type HumanizationTechnique = 
  | 'sentenceVariation'
  | 'naturalErrors'
  | 'personalAnecdotes'
  | 'colloquialisms'
  | 'emotionalTone'
  | 'paragraphRestructuring'
  | 'wordSubstitution'
  | 'punctuationVariation';

export interface ContentHumanizerConfig {
  techniques: {
    sentenceVariation: {
      enabled: boolean;
      maxVariations: number;
      preserveStructure: boolean;
    };
    naturalErrors: {
      enabled: boolean;
      errorRate: number;
      errorTypes: string[];
    };
    personalAnecdotes: {
      enabled: boolean;
      maxAnecdotes: number;
      personalTone: 'professional' | 'casual' | 'intimate';
    };
    colloquialisms: {
      enabled: boolean;
      intensity: number;
      regionalVariations: string[];
    };
    emotionalTone: {
      enabled: boolean;
      targetEmotion: 'neutral' | 'positive' | 'negative' | 'mixed';
      intensity: number;
    };
  };
  quality: {
    minReadabilityScore: number;
    maxReadabilityScore: number;
    preserveMedicalAccuracy: boolean;
    preserveCompliance: boolean;
  };
  performance: {
    maxProcessingTime: number;
    enableCaching: boolean;
    cacheTtl: number;
  };
}

export class ContentHumanizer {
  private config: ContentHumanizerConfig;
  private cache = new Map<string, HumanizationResponse>();
  private personalAnecdotes = new Map<string, string[]>();
  private colloquialisms = new Map<string, string[]>();

  constructor(config: ContentHumanizerConfig) {
    this.config = config;
    this.initializePersonalAnecdotes();
    this.initializeColloquialisms();
  }

  async humanizeContent(request: HumanizationRequest): Promise<HumanizationResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    if (this.config.performance.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.logActivity('info', 'Using cached humanization result');
      return cached;
    }

    let humanizedContent = request.content;
    const techniquesApplied: string[] = [];
    const metrics: HumanizationMetrics = {
      sentenceVariations: 0,
      naturalErrors: 0,
      colloquialisms: 0,
      personalElements: 0,
      emotionalAdjustments: 0
    };

    // Apply humanization techniques
    for (const technique of request.techniques) {
      try {
        const result = await this.applyTechnique(humanizedContent, technique, request);
        humanizedContent = result.content;
        techniquesApplied.push(technique);
        
        // Update metrics
        this.updateMetrics(metrics, technique, result.metrics);
      } catch (error) {
        console.warn(`Failed to apply technique ${technique}:`, error);
      }
    }

    // Calculate scores
    const confidenceScore = this.calculateConfidenceScore(humanizedContent, request.originalContent);
    const readabilityScore = this.calculateReadabilityScore(humanizedContent);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(humanizedContent, request, metrics);

    const response: HumanizationResponse = {
      originalContent: request.content,
      humanizedContent,
      techniquesApplied,
      confidenceScore,
      readabilityScore,
      humanizationMetrics: metrics,
      processingTime: Date.now() - startTime,
      recommendations
    };

    // Cache result
    if (this.config.performance.enableCaching) {
      this.cache.set(cacheKey, response);
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.config.performance.cacheTtl);
    }

    return response;
  }

  private async applyTechnique(
    content: string, 
    technique: HumanizationTechnique, 
    request: HumanizationRequest
  ): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    switch (technique) {
      case 'sentenceVariation':
        return this.applySentenceVariation(content, request);
      case 'naturalErrors':
        return this.applyNaturalErrors(content, request);
      case 'personalAnecdotes':
        return this.applyPersonalAnecdotes(content, request);
      case 'colloquialisms':
        return this.applyColloquialisms(content, request);
      case 'emotionalTone':
        return this.applyEmotionalTone(content, request);
      case 'paragraphRestructuring':
        return this.applyParagraphRestructuring(content, request);
      case 'wordSubstitution':
        return this.applyWordSubstitution(content, request);
      case 'punctuationVariation':
        return this.applyPunctuationVariation(content, request);
      default:
        return { content, metrics: {} };
    }
  }

  private async applySentenceVariation(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    if (!this.config.techniques.sentenceVariation.enabled) {
      return { content, metrics: {} };
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const variations: string[] = [];
    let variationCount = 0;

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length === 0) continue;

      // Apply sentence variations based on intensity
      const variation = this.generateSentenceVariation(trimmed, request.intensity);
      variations.push(variation);
      
      if (variation !== trimmed) {
        variationCount++;
      }
    }

    return {
      content: variations.join('. ') + '.',
      metrics: { sentenceVariations: variationCount }
    };
  }

  private generateSentenceVariation(sentence: string, intensity: 'light' | 'medium' | 'heavy'): string {
    const intensityMultiplier = { light: 0.3, medium: 0.6, heavy: 1.0 };
    const multiplier = intensityMultiplier[intensity];

    // Simple sentence restructuring
    if (Math.random() < 0.3 * multiplier) {
      // Add introductory phrases
      const introPhrases = [
        'Interestingly, ',
        'It\'s worth noting that ',
        'What\'s particularly important is that ',
        'One thing to consider is that '
      ];
      
      if (sentence.length > 20) {
        const phrase = introPhrases[Math.floor(Math.random() * introPhrases.length)];
        return phrase + sentence.toLowerCase();
      }
    }

    if (Math.random() < 0.2 * multiplier) {
      // Add transitional phrases
      const transitions = [
        'Furthermore, ',
        'Additionally, ',
        'Moreover, ',
        'In addition, '
      ];
      
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      return transition + sentence.toLowerCase();
    }

    return sentence;
  }

  private async applyNaturalErrors(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    if (!this.config.techniques.naturalErrors.enabled) {
      return { content, metrics: {} };
    }

    const errorRate = this.config.techniques.naturalErrors.errorRate;
    const words = content.split(/\s+/);
    let errorCount = 0;

    for (let i = 0; i < words.length; i++) {
      if (Math.random() < errorRate) {
        const word = words[i];
        const errorType = this.config.techniques.naturalErrors.errorTypes[
          Math.floor(Math.random() * this.config.techniques.naturalErrors.errorTypes.length)
        ];
        
        words[i] = this.applyNaturalError(word, errorType);
        errorCount++;
      }
    }

    return {
      content: words.join(' '),
      metrics: { naturalErrors: errorCount }
    };
  }

  private applyNaturalError(word: string, errorType: string): string {
    switch (errorType) {
      case 'typo':
        return this.addTypo(word);
      case 'missing_letter':
        return this.removeLetter(word);
      case 'extra_letter':
        return this.addLetter(word);
      case 'transposition':
        return this.transposeLetters(word);
      default:
        return word;
    }
  }

  private addTypo(word: string): string {
    if (word.length < 3) return word;
    const pos = Math.floor(Math.random() * word.length);
    const char = word[pos];
    const replacement = String.fromCharCode(char.charCodeAt(0) + 1);
    return word.substring(0, pos) + replacement + word.substring(pos + 1);
  }

  private removeLetter(word: string): string {
    if (word.length < 3) return word;
    const pos = Math.floor(Math.random() * word.length);
    return word.substring(0, pos) + word.substring(pos + 1);
  }

  private addLetter(word: string): string {
    if (word.length < 3) return word;
    const pos = Math.floor(Math.random() * word.length);
    const char = word[pos];
    const extra = String.fromCharCode(char.charCodeAt(0) + 1);
    return word.substring(0, pos) + char + extra + word.substring(pos + 1);
  }

  private transposeLetters(word: string): string {
    if (word.length < 3) return word;
    const pos = Math.floor(Math.random() * (word.length - 1));
    const chars = word.split('');
    [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
    return chars.join('');
  }

  private async applyPersonalAnecdotes(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    if (!this.config.techniques.personalAnecdotes.enabled) {
      return { content, metrics: {} };
    }

    const anecdotes = this.personalAnecdotes.get(request.targetAudience) || [];
    if (anecdotes.length === 0) {
      return { content, metrics: {} };
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const maxAnecdotes = Math.min(this.config.techniques.personalAnecdotes.maxAnecdotes, sentences.length);
    let anecdoteCount = 0;

    for (let i = 0; i < maxAnecdotes && i < sentences.length; i++) {
      if (Math.random() < 0.3) {
        const anecdote = anecdotes[Math.floor(Math.random() * anecdotes.length)];
        sentences[i] = sentences[i] + ' ' + anecdote;
        anecdoteCount++;
      }
    }

    return {
      content: sentences.join('. ') + '.',
      metrics: { personalElements: anecdoteCount }
    };
  }

  private async applyColloquialisms(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    if (!this.config.techniques.colloquialisms.enabled) {
      return { content, metrics: {} };
    }

    const colloquialisms = this.colloquialisms.get(request.targetAudience) || [];
    if (colloquialisms.length === 0) {
      return { content, metrics: {} };
    }

    let colloquialismCount = 0;
    let humanizedContent = content;

    for (const [formal, colloquial] of colloquialisms) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi');
      if (regex.test(humanizedContent) && Math.random() < this.config.techniques.colloquialisms.intensity) {
        humanizedContent = humanizedContent.replace(regex, colloquial);
        colloquialismCount++;
      }
    }

    return {
      content: humanizedContent,
      metrics: { colloquialisms: colloquialismCount }
    };
  }

  private async applyEmotionalTone(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    if (!this.config.techniques.emotionalTone.enabled) {
      return { content, metrics: {} };
    }

    const targetEmotion = this.config.techniques.emotionalTone.targetEmotion;
    const intensity = this.config.techniques.emotionalTone.intensity;
    
    let emotionalAdjustments = 0;
    let humanizedContent = content;

    // Add emotional words based on target emotion
    const emotionalWords = this.getEmotionalWords(targetEmotion, intensity);
    
    for (const [neutral, emotional] of emotionalWords) {
      const regex = new RegExp(`\\b${neutral}\\b`, 'gi');
      if (regex.test(humanizedContent) && Math.random() < 0.3) {
        humanizedContent = humanizedContent.replace(regex, emotional);
        emotionalAdjustments++;
      }
    }

    return {
      content: humanizedContent,
      metrics: { emotionalAdjustments }
    };
  }

  private async applyParagraphRestructuring(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    const paragraphs = content.split(/\n\s*\n/);
    const restructuredParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim().length === 0) {
        restructuredParagraphs.push(paragraph);
        continue;
      }

      // Add variety to paragraph structure
      let restructured = paragraph;
      
      if (Math.random() < 0.3) {
        // Add a question to engage the reader
        const questions = [
          'But what does this mean for you?',
          'How does this impact your daily life?',
          'What should you take away from this?',
          'Why is this important to understand?'
        ];
        
        const question = questions[Math.floor(Math.random() * questions.length)];
        restructured = restructured + ' ' + question;
      }

      if (Math.random() < 0.2) {
        // Add a transitional sentence
        const transitions = [
          'Let me explain this further.',
          'Here\'s what you need to know.',
          'This is particularly important because...',
          'To put this in perspective...'
        ];
        
        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        restructured = transition + ' ' + restructured;
      }

      restructuredParagraphs.push(restructured);
    }

    return {
      content: restructuredParagraphs.join('\n\n'),
      metrics: {}
    };
  }

  private async applyWordSubstitution(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    const substitutions = this.getWordSubstitutions(request.targetAudience);
    let humanizedContent = content;

    for (const [formal, casual] of substitutions) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi');
      if (regex.test(humanizedContent) && Math.random() < 0.4) {
        humanizedContent = humanizedContent.replace(regex, casual);
      }
    }

    return {
      content: humanizedContent,
      metrics: {}
    };
  }

  private async applyPunctuationVariation(content: string, request: HumanizationRequest): Promise<{ content: string; metrics: Partial<HumanizationMetrics> }> {
    let humanizedContent = content;

    // Add variety to punctuation
    if (Math.random() < 0.3) {
      // Add ellipses for emphasis
      humanizedContent = humanizedContent.replace(/\./g, (match, offset) => {
        return Math.random() < 0.1 ? '...' : match;
      });
    }

    if (Math.random() < 0.2) {
      // Add exclamation marks for emphasis
      humanizedContent = humanizedContent.replace(/\./g, (match, offset) => {
        return Math.random() < 0.05 ? '!' : match;
      });
    }

    return {
      content: humanizedContent,
      metrics: {}
    };
  }

  private calculateConfidenceScore(humanizedContent: string, originalContent: string): number {
    // Simple confidence calculation based on content similarity
    const similarity = this.calculateSimilarity(humanizedContent, originalContent);
    return Math.max(0, Math.min(1, similarity));
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private calculateReadabilityScore(content: string): number {
    // Simple readability calculation based on sentence length and word complexity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Flesch Reading Ease approximation
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgWordLength / 100);
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(content: string, request: HumanizationRequest, metrics: HumanizationMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.sentenceVariations < 2) {
      recommendations.push('Consider adding more sentence variations for better humanization');
    }

    if (metrics.naturalErrors === 0) {
      recommendations.push('Add some natural errors to make content feel more human');
    }

    if (metrics.colloquialisms < 1) {
      recommendations.push('Include colloquialisms appropriate for your target audience');
    }

    if (metrics.personalElements === 0) {
      recommendations.push('Add personal anecdotes or experiences to connect with readers');
    }

    if (metrics.emotionalAdjustments < 1) {
      recommendations.push('Adjust emotional tone to match your intended message');
    }

    return recommendations;
  }

  private updateMetrics(metrics: HumanizationMetrics, technique: HumanizationTechnique, techniqueMetrics: Partial<HumanizationMetrics>): void {
    if (techniqueMetrics.sentenceVariations !== undefined) {
      metrics.sentenceVariations += techniqueMetrics.sentenceVariations;
    }
    if (techniqueMetrics.naturalErrors !== undefined) {
      metrics.naturalErrors += techniqueMetrics.naturalErrors;
    }
    if (techniqueMetrics.colloquialisms !== undefined) {
      metrics.colloquialisms += techniqueMetrics.colloquialisms;
    }
    if (techniqueMetrics.personalElements !== undefined) {
      metrics.personalElements += techniqueMetrics.personalElements;
    }
    if (techniqueMetrics.emotionalAdjustments !== undefined) {
      metrics.emotionalAdjustments += techniqueMetrics.emotionalAdjustments;
    }
  }

  private generateCacheKey(request: HumanizationRequest): string {
    const contentHash = Buffer.from(request.content).toString('base64').substring(0, 16);
    return `${request.intensity}-${request.targetAudience}-${request.techniques.join(',')}-${contentHash}`;
  }

  private initializePersonalAnecdotes(): void {
    this.personalAnecdotes.set('general', [
      'I remember when I first learned about this...',
      'In my experience, this has always been...',
      'I\'ve seen this work in practice...',
      'From what I\'ve observed...'
    ]);

    this.personalAnecdotes.set('professional', [
      'In my professional practice, I\'ve found that...',
      'Based on my clinical experience...',
      'Throughout my career, I\'ve observed...',
      'In my years of practice...'
    ]);

    this.personalAnecdotes.set('casual', [
      'You know what? I\'ve always thought...',
      'Honestly, I\'ve found that...',
      'I gotta say, this really...',
      'From my perspective...'
    ]);

    this.personalAnecdotes.set('academic', [
      'Based on extensive research...',
      'Empirical evidence suggests...',
      'Studies have consistently shown...',
      'Research findings indicate...'
    ]);
  }

  private initializeColloquialisms(): void {
    this.colloquialisms.set('general', [
      ['utilize', 'use'],
      ['facilitate', 'help'],
      ['implement', 'put in place'],
      ['comprehensive', 'complete'],
      ['subsequent', 'next']
    ]);

    this.colloquialisms.set('professional', [
      ['utilize', 'use'],
      ['facilitate', 'help'],
      ['implement', 'put in place'],
      ['comprehensive', 'complete'],
      ['subsequent', 'next']
    ]);

    this.colloquialisms.set('casual', [
      ['utilize', 'use'],
      ['facilitate', 'help'],
      ['implement', 'put in place'],
      ['comprehensive', 'complete'],
      ['subsequent', 'next'],
      ['however', 'but'],
      ['therefore', 'so'],
      ['furthermore', 'also']
    ]);

    this.colloquialisms.set('academic', [
      ['utilize', 'use'],
      ['facilitate', 'help'],
      ['implement', 'put in place'],
      ['comprehensive', 'complete'],
      ['subsequent', 'next']
    ]);
  }

  private getEmotionalWords(targetEmotion: string, intensity: number): [string, string][] {
    const emotionalWords: Record<string, [string, string][]> = {
      positive: [
        ['good', 'excellent'],
        ['important', 'crucial'],
        ['helpful', 'incredibly helpful'],
        ['useful', 'invaluable'],
        ['effective', 'highly effective']
      ],
      negative: [
        ['problem', 'serious problem'],
        ['issue', 'major issue'],
        ['concern', 'significant concern'],
        ['challenge', 'difficult challenge'],
        ['risk', 'serious risk']
      ],
      neutral: [
        ['good', 'adequate'],
        ['important', 'notable'],
        ['helpful', 'useful'],
        ['useful', 'beneficial'],
        ['effective', 'functional']
      ],
      mixed: [
        ['good', 'interesting'],
        ['important', 'notable'],
        ['helpful', 'useful'],
        ['useful', 'beneficial'],
        ['effective', 'functional']
      ]
    };

    return emotionalWords[targetEmotion] || emotionalWords.neutral;
  }

  private getWordSubstitutions(targetAudience: string): [string, string][] {
    const substitutions: Record<string, [string, string][]> = {
      general: [
        ['utilize', 'use'],
        ['facilitate', 'help'],
        ['implement', 'put in place'],
        ['comprehensive', 'complete'],
        ['subsequent', 'next']
      ],
      professional: [
        ['utilize', 'use'],
        ['facilitate', 'help'],
        ['implement', 'put in place'],
        ['comprehensive', 'complete'],
        ['subsequent', 'next']
      ],
      casual: [
        ['utilize', 'use'],
        ['facilitate', 'help'],
        ['implement', 'put in place'],
        ['comprehensive', 'complete'],
        ['subsequent', 'next'],
        ['however', 'but'],
        ['therefore', 'so'],
        ['furthermore', 'also']
      ],
      academic: [
        ['utilize', 'use'],
        ['facilitate', 'help'],
        ['implement', 'put in place'],
        ['comprehensive', 'complete'],
        ['subsequent', 'next']
      ]
    };

    return substitutions[targetAudience] || substitutions.general;
  }

  private logActivity(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    console[level](`[ContentHumanizer] ${message}`, data);
  }
}
