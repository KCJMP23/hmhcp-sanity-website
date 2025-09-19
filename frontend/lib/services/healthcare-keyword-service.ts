import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('HealthcareKeywordService');

export interface HealthcareKeywordSuggestion {
  keyword: string;
  search_volume: number;
  difficulty: number;
  relevance_score: number;
  category: string;
  related_terms: string[];
  cpc?: number;
  trend?: 'rising' | 'stable' | 'declining';
  seasonal?: boolean;
}

export interface KeywordAnalysis {
  primary_keyword: string;
  secondary_keywords: string[];
  long_tail_keywords: string[];
  competitor_keywords: string[];
  content_gaps: string[];
  optimization_score: number;
  recommendations: string[];
}

export class HealthcareKeywordService {
  private static instance: HealthcareKeywordService;
  private keywordCache: Map<string, HealthcareKeywordSuggestion[]> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  public static getInstance(): HealthcareKeywordService {
    if (!HealthcareKeywordService.instance) {
      HealthcareKeywordService.instance = new HealthcareKeywordService();
    }
    return HealthcareKeywordService.instance;
  }

  /**
   * Get healthcare keyword suggestions based on query
   */
  async getKeywordSuggestions(
    query: string,
    category?: string,
    limit: number = 10
  ): Promise<HealthcareKeywordSuggestion[]> {
    try {
      logger.info('Fetching healthcare keyword suggestions', { query, category, limit });

      // Check cache first
      const cacheKey = `${query}-${category || 'all'}-${limit}`;
      const cached = this.keywordCache.get(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        logger.debug('Returning cached keyword suggestions', { count: cached.length });
        return cached;
      }

      // In production, this would call a real keyword research API
      const suggestions = await this.generateMockSuggestions(query, category, limit);
      
      // Cache the results
      this.keywordCache.set(cacheKey, suggestions);
      
      logger.info('Keyword suggestions generated', { count: suggestions.length });
      return suggestions;
    } catch (error) {
      logger.error('Failed to get keyword suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        category
      });
      return [];
    }
  }

  /**
   * Analyze content for keyword optimization
   */
  async analyzeContentKeywords(
    content: string,
    title: string,
    category: string
  ): Promise<KeywordAnalysis> {
    try {
      logger.info('Analyzing content keywords', { 
        contentLength: content.length, 
        title, 
        category 
      });

      // Extract keywords from content
      const extractedKeywords = this.extractKeywordsFromContent(content);
      const titleKeywords = this.extractKeywordsFromContent(title);
      
      // Find primary keyword (most frequent in title and content)
      const primaryKeyword = this.findPrimaryKeyword(titleKeywords, extractedKeywords);
      
      // Generate secondary keywords
      const secondaryKeywords = this.generateSecondaryKeywords(primaryKeyword, category);
      
      // Find long-tail keywords
      const longTailKeywords = this.findLongTailKeywords(content, primaryKeyword);
      
      // Generate competitor keywords
      const competitorKeywords = await this.getCompetitorKeywords(primaryKeyword, category);
      
      // Find content gaps
      const contentGaps = this.findContentGaps(extractedKeywords, secondaryKeywords);
      
      // Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore(
        primaryKeyword,
        extractedKeywords,
        title,
        content
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        optimizationScore,
        contentGaps,
        primaryKeyword
      );

      const analysis: KeywordAnalysis = {
        primary_keyword: primaryKeyword,
        secondary_keywords: secondaryKeywords,
        long_tail_keywords: longTailKeywords,
        competitor_keywords: competitorKeywords,
        content_gaps: contentGaps,
        optimization_score: optimizationScore,
        recommendations
      };

      logger.info('Content keyword analysis completed', { 
        primaryKeyword,
        optimizationScore 
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze content keywords', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        primary_keyword: '',
        secondary_keywords: [],
        long_tail_keywords: [],
        competitor_keywords: [],
        content_gaps: [],
        optimization_score: 0,
        recommendations: ['Unable to analyze keywords at this time']
      };
    }
  }

  /**
   * Get trending healthcare keywords
   */
  async getTrendingKeywords(category?: string): Promise<HealthcareKeywordSuggestion[]> {
    try {
      logger.info('Fetching trending healthcare keywords', { category });

      const trendingKeywords: HealthcareKeywordSuggestion[] = [
        {
          keyword: 'covid-19 vaccine side effects',
          search_volume: 45000,
          difficulty: 75,
          relevance_score: 95,
          category: 'Infectious Diseases',
          related_terms: ['vaccine safety', 'immunization', 'side effects'],
          cpc: 2.50,
          trend: 'rising',
          seasonal: false
        },
        {
          keyword: 'mental health awareness',
          search_volume: 22000,
          difficulty: 45,
          relevance_score: 90,
          category: 'Psychiatry',
          related_terms: ['depression', 'anxiety', 'therapy'],
          cpc: 1.80,
          trend: 'rising',
          seasonal: false
        },
        {
          keyword: 'diabetes management tips',
          search_volume: 18000,
          difficulty: 60,
          relevance_score: 88,
          category: 'Endocrinology',
          related_terms: ['blood sugar', 'insulin', 'diet'],
          cpc: 2.20,
          trend: 'stable',
          seasonal: false
        },
        {
          keyword: 'heart disease prevention',
          search_volume: 15000,
          difficulty: 70,
          relevance_score: 85,
          category: 'Cardiology',
          related_terms: ['cardiovascular health', 'cholesterol', 'exercise'],
          cpc: 2.80,
          trend: 'stable',
          seasonal: false
        },
        {
          keyword: 'cancer treatment options',
          search_volume: 25000,
          difficulty: 80,
          relevance_score: 92,
          category: 'Oncology',
          related_terms: ['chemotherapy', 'radiation', 'immunotherapy'],
          cpc: 3.50,
          trend: 'rising',
          seasonal: false
        }
      ];

      const filtered = category 
        ? trendingKeywords.filter(k => k.category === category)
        : trendingKeywords;

      logger.info('Trending keywords fetched', { count: filtered.length });
      return filtered;
    } catch (error) {
      logger.error('Failed to get trending keywords', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private async generateMockSuggestions(
    query: string,
    category?: string,
    limit: number = 10
  ): Promise<HealthcareKeywordSuggestion[]> {
    // Mock healthcare keyword database
    const keywordDatabase: HealthcareKeywordSuggestion[] = [
      // Cardiology
      {
        keyword: 'hypertension treatment',
        search_volume: 12000,
        difficulty: 65,
        relevance_score: 95,
        category: 'Cardiology',
        related_terms: ['high blood pressure', 'ACE inhibitors', 'lifestyle changes']
      },
      {
        keyword: 'heart attack symptoms',
        search_volume: 18000,
        difficulty: 55,
        relevance_score: 90,
        category: 'Cardiology',
        related_terms: ['chest pain', 'emergency', 'cardiac arrest']
      },
      {
        keyword: 'cholesterol management',
        search_volume: 15000,
        difficulty: 60,
        relevance_score: 88,
        category: 'Cardiology',
        related_terms: ['LDL', 'HDL', 'statins', 'diet']
      },
      
      // Oncology
      {
        keyword: 'breast cancer screening',
        search_volume: 20000,
        difficulty: 70,
        relevance_score: 92,
        category: 'Oncology',
        related_terms: ['mammography', 'early detection', 'prevention']
      },
      {
        keyword: 'lung cancer treatment',
        search_volume: 16000,
        difficulty: 75,
        relevance_score: 90,
        category: 'Oncology',
        related_terms: ['chemotherapy', 'surgery', 'radiation therapy']
      },
      
      // Neurology
      {
        keyword: 'alzheimer disease care',
        search_volume: 14000,
        difficulty: 70,
        relevance_score: 85,
        category: 'Neurology',
        related_terms: ['dementia', 'memory loss', 'caregiver support']
      },
      {
        keyword: 'migraine treatment',
        search_volume: 11000,
        difficulty: 50,
        relevance_score: 88,
        category: 'Neurology',
        related_terms: ['headache', 'pain management', 'triggers']
      },
      
      // Pediatrics
      {
        keyword: 'child vaccination schedule',
        search_volume: 13000,
        difficulty: 45,
        relevance_score: 90,
        category: 'Pediatrics',
        related_terms: ['immunization', 'vaccines', 'preventive care']
      },
      {
        keyword: 'autism spectrum disorder',
        search_volume: 17000,
        difficulty: 60,
        relevance_score: 85,
        category: 'Pediatrics',
        related_terms: ['developmental delays', 'early intervention', 'therapy']
      },
      
      // Mental Health
      {
        keyword: 'depression treatment options',
        search_volume: 19000,
        difficulty: 55,
        relevance_score: 90,
        category: 'Psychiatry',
        related_terms: ['antidepressants', 'therapy', 'counseling']
      },
      {
        keyword: 'anxiety management techniques',
        search_volume: 16000,
        difficulty: 50,
        relevance_score: 88,
        category: 'Psychiatry',
        related_terms: ['meditation', 'breathing exercises', 'stress relief']
      }
    ];

    // Filter by query and category
    let filtered = keywordDatabase.filter(keyword => 
      keyword.keyword.toLowerCase().includes(query.toLowerCase()) ||
      keyword.related_terms.some(term => term.toLowerCase().includes(query.toLowerCase()))
    );

    if (category) {
      filtered = filtered.filter(keyword => keyword.category === category);
    }

    // Sort by relevance score and search volume
    filtered.sort((a, b) => {
      const scoreA = a.relevance_score + (a.search_volume / 1000);
      const scoreB = b.relevance_score + (b.search_volume / 1000);
      return scoreB - scoreA;
    });

    return filtered.slice(0, limit);
  }

  private extractKeywordsFromContent(content: string): string[] {
    // Simple keyword extraction (in production, use NLP libraries)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private findPrimaryKeyword(titleKeywords: string[], contentKeywords: string[]): string {
    // Find the most frequent keyword that appears in both title and content
    const commonKeywords = titleKeywords.filter(keyword => 
      contentKeywords.includes(keyword)
    );
    
    return commonKeywords[0] || titleKeywords[0] || contentKeywords[0] || '';
  }

  private generateSecondaryKeywords(primaryKeyword: string, category: string): string[] {
    // Generate related keywords based on primary keyword and category
    const relatedTerms: { [key: string]: string[] } = {
      'diabetes': ['blood sugar', 'insulin', 'glucose', 'HbA1c', 'type 2'],
      'heart': ['cardiovascular', 'blood pressure', 'cholesterol', 'cardiac'],
      'cancer': ['oncology', 'tumor', 'chemotherapy', 'radiation', 'metastasis'],
      'mental': ['depression', 'anxiety', 'therapy', 'counseling', 'psychology']
    };

    const categoryTerms = relatedTerms[category.toLowerCase()] || [];
    const keywordTerms = relatedTerms[primaryKeyword.toLowerCase()] || [];
    
    return [...categoryTerms, ...keywordTerms].slice(0, 5);
  }

  private findLongTailKeywords(content: string, primaryKeyword: string): string[] {
    // Extract 3-4 word phrases containing the primary keyword
    const sentences = content.split(/[.!?]+/);
    const longTailKeywords: string[] = [];
    
    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        const words = sentence.trim().split(/\s+/);
        if (words.length >= 3 && words.length <= 5) {
          longTailKeywords.push(words.join(' '));
        }
      }
    });
    
    return longTailKeywords.slice(0, 5);
  }

  private async getCompetitorKeywords(primaryKeyword: string, category: string): Promise<string[]> {
    // Mock competitor keyword analysis
    const competitorKeywords: { [key: string]: string[] } = {
      'diabetes': ['diabetes management', 'blood sugar control', 'insulin therapy'],
      'heart': ['heart health', 'cardiovascular disease', 'heart attack prevention'],
      'cancer': ['cancer treatment', 'oncology care', 'cancer research'],
      'mental': ['mental health', 'depression treatment', 'anxiety therapy']
    };
    
    return competitorKeywords[category.toLowerCase()] || [];
  }

  private findContentGaps(extractedKeywords: string[], secondaryKeywords: string[]): string[] {
    // Find keywords that should be included but aren't
    return secondaryKeywords.filter(keyword => 
      !extractedKeywords.some(extracted => 
        extracted.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  private calculateOptimizationScore(
    primaryKeyword: string,
    extractedKeywords: string[],
    title: string,
    content: string
  ): number {
    let score = 0;
    
    // Title optimization (25 points)
    if (title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      score += 25;
    }
    
    // Keyword density (25 points)
    const keywordCount = (content.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
    const wordCount = content.split(/\s+/).length;
    const density = (keywordCount / wordCount) * 100;
    
    if (density >= 1 && density <= 3) {
      score += 25;
    } else if (density > 0) {
      score += 15;
    }
    
    // Content length (25 points)
    if (content.length >= 300) {
      score += 25;
    } else if (content.length >= 150) {
      score += 15;
    }
    
    // Keyword variations (25 points)
    const variations = extractedKeywords.filter(keyword => 
      keyword.toLowerCase().includes(primaryKeyword.toLowerCase()) ||
      primaryKeyword.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    if (variations >= 3) {
      score += 25;
    } else if (variations >= 1) {
      score += 15;
    }
    
    return Math.min(score, 100);
  }

  private generateRecommendations(
    score: number,
    contentGaps: string[],
    primaryKeyword: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (score < 50) {
      recommendations.push('Improve keyword optimization for better SEO performance');
    }
    
    if (contentGaps.length > 0) {
      recommendations.push(`Consider including these keywords: ${contentGaps.join(', ')}`);
    }
    
    if (!primaryKeyword) {
      recommendations.push('Define a primary keyword for better content focus');
    }
    
    if (score >= 80) {
      recommendations.push('Great job! Your content is well-optimized for SEO');
    }
    
    return recommendations;
  }

  private isCacheValid(cacheKey: string): boolean {
    // Simple cache validation (in production, use proper cache with timestamps)
    return true;
  }
}

export const healthcareKeywordService = HealthcareKeywordService.getInstance();
