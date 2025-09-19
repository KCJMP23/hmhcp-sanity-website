// Keyword Gap Analyzer
// Created: 2025-01-27
// Purpose: Analyze keyword gaps between our site and competitors

export interface KeywordGapAnalysis {
  organizationId: string;
  competitorId: string;
  analysisDate: Date;
  totalKeywords: number;
  ourKeywords: number;
  competitorKeywords: number;
  sharedKeywords: number;
  ourUniqueKeywords: number;
  competitorUniqueKeywords: number;
  opportunityKeywords: KeywordOpportunity[];
  gapScore: number;
  recommendations: KeywordRecommendation[];
}

export interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  ourRank: number | null;
  competitorRank: number;
  opportunityScore: number;
  healthcareRelevance: number;
  localIntent: number;
  keywordIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  suggestedStrategy: string;
  estimatedTraffic: number;
  competitionLevel: 'low' | 'medium' | 'high';
  relatedKeywords: string[];
  contentGaps: string[];
}

export interface KeywordRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'content' | 'technical' | 'local' | 'branded';
  title: string;
  description: string;
  keywords: string[];
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  healthcareSpecific: boolean;
}

export interface KeywordCluster {
  clusterName: string;
  keywords: string[];
  searchVolume: number;
  difficulty: number;
  ourCoverage: number;
  competitorCoverage: number;
  opportunity: number;
  suggestedContent: {
    title: string;
    type: 'article' | 'guide' | 'faq' | 'service-page';
    wordCount: number;
    keywords: string[];
  };
}

export interface CompetitorKeywordData {
  competitorId: string;
  competitorName: string;
  keywords: {
    keyword: string;
    rank: number;
    searchVolume: number;
    difficulty: number;
    url: string;
    title: string;
    description: string;
  }[];
  totalKeywords: number;
  topKeywords: string[];
  contentThemes: string[];
  lastUpdated: Date;
}

export class KeywordGapAnalyzer {
  private dataForSeoApiKey?: string;
  private baseUrl: string;

  constructor(baseUrl: string = '', dataForSeoApiKey?: string) {
    this.baseUrl = baseUrl;
    this.dataForSeoApiKey = dataForSeoApiKey;
  }

  async analyzeKeywordGaps(organizationId: string, competitorIds: string[]): Promise<KeywordGapAnalysis[]> {
    try {
      const analyses: KeywordGapAnalysis[] = [];

      for (const competitorId of competitorIds) {
        const analysis = await this.performKeywordGapAnalysis(organizationId, competitorId);
        analyses.push(analysis);
      }

      return analyses;

    } catch (error) {
      throw new Error(`Keyword gap analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompetitorKeywords(competitorId: string): Promise<CompetitorKeywordData> {
    try {
      // Simulate competitor keyword data retrieval
      const keywords = this.generateMockKeywords(100);
      
      return {
        competitorId,
        competitorName: `Competitor ${competitorId}`,
        keywords,
        totalKeywords: keywords.length,
        topKeywords: keywords.slice(0, 10).map(k => k.keyword),
        contentThemes: this.extractContentThemes(keywords),
        lastUpdated: new Date()
      };

    } catch (error) {
      throw new Error(`Failed to get competitor keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async identifyKeywordClusters(keywords: string[]): Promise<KeywordCluster[]> {
    try {
      const clusters: KeywordCluster[] = [];
      
      // Group keywords by theme
      const themes = this.groupKeywordsByTheme(keywords);
      
      for (const [theme, themeKeywords] of Object.entries(themes)) {
        const cluster = await this.createKeywordCluster(theme, themeKeywords);
        clusters.push(cluster);
      }

      return clusters;

    } catch (error) {
      throw new Error(`Failed to identify keyword clusters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findContentOpportunities(organizationId: string, competitorIds: string[]): Promise<{
    missingTopics: string[];
    contentGaps: ContentGap[];
    contentOpportunities: ContentOpportunity[];
  }> {
    try {
      // Get our content themes
      const ourThemes = await this.getOurContentThemes(organizationId);
      
      // Get competitor content themes
      const competitorThemes = await this.getCompetitorContentThemes(competitorIds);
      
      // Find missing topics
      const missingTopics = this.findMissingTopics(ourThemes, competitorThemes);
      
      // Identify content gaps
      const contentGaps = this.identifyContentGaps(ourThemes, competitorThemes);
      
      // Find content opportunities
      const contentOpportunities = this.findContentOpportunities(missingTopics, contentGaps);

      return {
        missingTopics,
        contentGaps,
        contentOpportunities
      };

    } catch (error) {
      throw new Error(`Failed to find content opportunities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateKeywordStrategy(organizationId: string, competitorIds: string[]): Promise<{
    primaryKeywords: string[];
    secondaryKeywords: string[];
    longTailKeywords: string[];
    localKeywords: string[];
    brandedKeywords: string[];
    strategy: KeywordRecommendation[];
  }> {
    try {
      // Analyze keyword gaps
      const gapAnalyses = await this.analyzeKeywordGaps(organizationId, competitorIds);
      
      // Extract all opportunity keywords
      const allOpportunities = gapAnalyses.flatMap(analysis => analysis.opportunityKeywords);
      
      // Categorize keywords
      const primaryKeywords = this.categorizeKeywords(allOpportunities, 'primary');
      const secondaryKeywords = this.categorizeKeywords(allOpportunities, 'secondary');
      const longTailKeywords = this.categorizeKeywords(allOpportunities, 'long-tail');
      const localKeywords = this.categorizeKeywords(allOpportunities, 'local');
      const brandedKeywords = this.categorizeKeywords(allOpportunities, 'branded');
      
      // Generate strategy recommendations
      const strategy = this.generateStrategyRecommendations(allOpportunities);

      return {
        primaryKeywords,
        secondaryKeywords,
        longTailKeywords,
        localKeywords,
        brandedKeywords,
        strategy
      };

    } catch (error) {
      throw new Error(`Failed to generate keyword strategy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private async performKeywordGapAnalysis(organizationId: string, competitorId: string): Promise<KeywordGapAnalysis> {
    // Get our keywords
    const ourKeywords = await this.getOurKeywords(organizationId);
    
    // Get competitor keywords
    const competitorKeywords = await this.getCompetitorKeywords(competitorId);
    
    // Find shared keywords
    const sharedKeywords = this.findSharedKeywords(ourKeywords, competitorKeywords.keywords);
    
    // Find our unique keywords
    const ourUniqueKeywords = this.findUniqueKeywords(ourKeywords, competitorKeywords.keywords);
    
    // Find competitor unique keywords
    const competitorUniqueKeywords = this.findUniqueKeywords(competitorKeywords.keywords, ourKeywords);
    
    // Identify opportunity keywords
    const opportunityKeywords = this.identifyOpportunityKeywords(competitorKeywords.keywords, ourKeywords);
    
    // Generate recommendations
    const recommendations = this.generateKeywordRecommendations(opportunityKeywords);
    
    // Calculate gap score
    const gapScore = this.calculateGapScore(ourKeywords.length, competitorKeywords.keywords.length, sharedKeywords.length);

    return {
      organizationId,
      competitorId,
      analysisDate: new Date(),
      totalKeywords: ourKeywords.length + competitorKeywords.keywords.length,
      ourKeywords: ourKeywords.length,
      competitorKeywords: competitorKeywords.keywords.length,
      sharedKeywords: sharedKeywords.length,
      ourUniqueKeywords: ourUniqueKeywords.length,
      competitorUniqueKeywords: competitorUniqueKeywords.length,
      opportunityKeywords,
      gapScore,
      recommendations
    };
  }

  private async getOurKeywords(organizationId: string): Promise<Array<{ keyword: string; rank: number; searchVolume: number }>> {
    // Simulate our keyword data
    return [
      { keyword: 'cardiology treatment', rank: 5, searchVolume: 5000 },
      { keyword: 'heart surgery', rank: 8, searchVolume: 3000 },
      { keyword: 'medical consultation', rank: 12, searchVolume: 2000 },
      { keyword: 'healthcare services', rank: 15, searchVolume: 1500 }
    ];
  }

  private generateMockKeywords(count: number): Array<{
    keyword: string;
    rank: number;
    searchVolume: number;
    difficulty: number;
    url: string;
    title: string;
    description: string;
  }> {
    const keywords = [
      'cardiology treatment', 'heart surgery', 'cardiac care', 'cardiovascular health',
      'cancer treatment', 'oncology care', 'cancer therapy', 'tumor treatment',
      'neurology services', 'brain health', 'neurological care', 'nerve treatment',
      'medical consultation', 'doctor visit', 'medical appointment', 'health checkup',
      'emergency care', 'urgent care', 'medical emergency', 'hospital services',
      'preventive care', 'health screening', 'wellness check', 'health maintenance'
    ];

    return Array.from({ length: count }, (_, i) => ({
      keyword: keywords[i % keywords.length] + (i > keywords.length ? ` ${Math.floor(i / keywords.length)}` : ''),
      rank: Math.floor(Math.random() * 50) + 1,
      searchVolume: Math.floor(Math.random() * 10000) + 100,
      difficulty: Math.floor(Math.random() * 50) + 30,
      url: `https://competitor.com/page-${i}`,
      title: `Page Title ${i}`,
      description: `Page description for keyword ${i}`
    }));
  }

  private extractContentThemes(keywords: Array<{ keyword: string; title: string; description: string }>): string[] {
    const themes = new Set<string>();
    
    keywords.forEach(k => {
      if (k.keyword.includes('cardio') || k.keyword.includes('heart')) {
        themes.add('Cardiology');
      }
      if (k.keyword.includes('cancer') || k.keyword.includes('oncology')) {
        themes.add('Oncology');
      }
      if (k.keyword.includes('neuro') || k.keyword.includes('brain')) {
        themes.add('Neurology');
      }
      if (k.keyword.includes('emergency') || k.keyword.includes('urgent')) {
        themes.add('Emergency Care');
      }
    });

    return Array.from(themes);
  }

  private groupKeywordsByTheme(keywords: string[]): Record<string, string[]> {
    const themes: Record<string, string[]> = {
      'Cardiology': [],
      'Oncology': [],
      'Neurology': [],
      'Emergency Care': [],
      'General Health': []
    };

    keywords.forEach(keyword => {
      if (keyword.includes('cardio') || keyword.includes('heart')) {
        themes['Cardiology'].push(keyword);
      } else if (keyword.includes('cancer') || keyword.includes('oncology')) {
        themes['Oncology'].push(keyword);
      } else if (keyword.includes('neuro') || keyword.includes('brain')) {
        themes['Neurology'].push(keyword);
      } else if (keyword.includes('emergency') || keyword.includes('urgent')) {
        themes['Emergency Care'].push(keyword);
      } else {
        themes['General Health'].push(keyword);
      }
    });

    return themes;
  }

  private async createKeywordCluster(theme: string, keywords: string[]): Promise<KeywordCluster> {
    const searchVolume = keywords.length * 1000; // Mock calculation
    const difficulty = Math.floor(Math.random() * 30) + 40;
    const ourCoverage = Math.random() * 100;
    const competitorCoverage = Math.random() * 100;
    const opportunity = Math.max(0, competitorCoverage - ourCoverage);

    return {
      clusterName: theme,
      keywords,
      searchVolume,
      difficulty,
      ourCoverage,
      competitorCoverage,
      opportunity,
      suggestedContent: {
        title: `${theme} - Complete Guide`,
        type: 'article',
        wordCount: Math.floor(Math.random() * 2000) + 1000,
        keywords: keywords.slice(0, 5)
      }
    };
  }

  private findSharedKeywords(ourKeywords: Array<{ keyword: string }>, competitorKeywords: Array<{ keyword: string }>): Array<{ keyword: string }> {
    const ourKeywordSet = new Set(ourKeywords.map(k => k.keyword));
    return competitorKeywords.filter(k => ourKeywordSet.has(k.keyword));
  }

  private findUniqueKeywords(keywords1: Array<{ keyword: string }>, keywords2: Array<{ keyword: string }>): Array<{ keyword: string }> {
    const keyword2Set = new Set(keywords2.map(k => k.keyword));
    return keywords1.filter(k => !keyword2Set.has(k.keyword));
  }

  private identifyOpportunityKeywords(competitorKeywords: Array<{ keyword: string; rank: number; searchVolume: number; difficulty: number }>, ourKeywords: Array<{ keyword: string; rank: number }>): KeywordOpportunity[] {
    const ourKeywordMap = new Map(ourKeywords.map(k => [k.keyword, k.rank]));
    
    return competitorKeywords
      .filter(k => k.rank <= 20) // Only consider keywords competitor ranks well for
      .map(k => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
        ourRank: ourKeywordMap.get(k.keyword) || null,
        competitorRank: k.rank,
        opportunityScore: this.calculateOpportunityScore(k.searchVolume, k.difficulty, k.rank, ourKeywordMap.get(k.keyword)),
        healthcareRelevance: this.calculateHealthcareRelevance(k.keyword),
        localIntent: this.calculateLocalIntent(k.keyword),
        keywordIntent: this.determineKeywordIntent(k.keyword),
        suggestedStrategy: this.getSuggestedStrategy(k.keyword, k.rank, ourKeywordMap.get(k.keyword)),
        estimatedTraffic: this.estimateTraffic(k.searchVolume, k.rank),
        competitionLevel: this.determineCompetitionLevel(k.difficulty),
        relatedKeywords: this.getRelatedKeywords(k.keyword),
        contentGaps: this.identifyContentGapsForKeyword(k.keyword)
      }))
      .filter(opp => opp.opportunityScore > 50)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  private calculateOpportunityScore(searchVolume: number, difficulty: number, competitorRank: number, ourRank: number | null): number {
    let score = 0;
    
    // Search volume score (0-40 points)
    score += Math.min(40, (searchVolume / 1000) * 4);
    
    // Difficulty score (0-30 points, inverted)
    score += Math.max(0, 30 - (difficulty / 100) * 30);
    
    // Competitor rank score (0-20 points)
    score += Math.max(0, 20 - competitorRank);
    
    // Our rank bonus (0-10 points)
    if (ourRank === null) {
      score += 10; // We don't rank for this keyword
    } else if (ourRank > competitorRank) {
      score += 5; // We rank worse than competitor
    }
    
    return Math.min(100, score);
  }

  private calculateHealthcareRelevance(keyword: string): number {
    const healthcareTerms = ['medical', 'health', 'doctor', 'hospital', 'clinic', 'treatment', 'care', 'therapy', 'surgery', 'disease', 'condition'];
    const relevance = healthcareTerms.filter(term => keyword.toLowerCase().includes(term)).length;
    return Math.min(100, relevance * 20);
  }

  private calculateLocalIntent(keyword: string): number {
    const localTerms = ['near me', 'local', 'city', 'area', 'location', 'address', 'phone', 'appointment'];
    const intent = localTerms.filter(term => keyword.toLowerCase().includes(term)).length;
    return Math.min(100, intent * 25);
  }

  private determineKeywordIntent(keyword: string): 'informational' | 'navigational' | 'transactional' | 'commercial' {
    if (keyword.includes('what is') || keyword.includes('how to') || keyword.includes('guide')) {
      return 'informational';
    }
    if (keyword.includes('appointment') || keyword.includes('book') || keyword.includes('schedule')) {
      return 'transactional';
    }
    if (keyword.includes('best') || keyword.includes('top') || keyword.includes('compare')) {
      return 'commercial';
    }
    return 'navigational';
  }

  private getSuggestedStrategy(keyword: string, competitorRank: number, ourRank: number | null): string {
    if (ourRank === null) {
      return 'Create new content targeting this keyword';
    }
    if (ourRank > competitorRank) {
      return 'Optimize existing content to improve rankings';
    }
    return 'Maintain current ranking and look for improvement opportunities';
  }

  private estimateTraffic(searchVolume: number, rank: number): number {
    // Simplified traffic estimation based on rank
    const clickThroughRates = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.15, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01];
    const ctr = rank <= 20 ? clickThroughRates[rank - 1] || 0.01 : 0.005;
    return Math.floor(searchVolume * ctr);
  }

  private determineCompetitionLevel(difficulty: number): 'low' | 'medium' | 'high' {
    if (difficulty < 40) return 'low';
    if (difficulty < 70) return 'medium';
    return 'high';
  }

  private getRelatedKeywords(keyword: string): string[] {
    const relatedKeywords: Record<string, string[]> = {
      'cardiology treatment': ['heart disease', 'cardiac care', 'cardiovascular health'],
      'cancer treatment': ['oncology care', 'cancer therapy', 'tumor treatment'],
      'neurology services': ['brain health', 'neurological care', 'nerve treatment']
    };
    
    return relatedKeywords[keyword] || [];
  }

  private identifyContentGapsForKeyword(keyword: string): string[] {
    return [
      'Comprehensive treatment guide',
      'Patient success stories',
      'Expert interviews',
      'FAQ section'
    ];
  }

  private generateKeywordRecommendations(opportunities: KeywordOpportunity[]): KeywordRecommendation[] {
    const recommendations: KeywordRecommendation[] = [];
    
    // High opportunity keywords
    const highOpportunity = opportunities.filter(opp => opp.opportunityScore > 80);
    if (highOpportunity.length > 0) {
      recommendations.push({
        id: 'high-opportunity-keywords',
        priority: 'high',
        category: 'content',
        title: 'Target High-Opportunity Keywords',
        description: `${highOpportunity.length} keywords with high opportunity scores`,
        keywords: highOpportunity.map(opp => opp.keyword),
        action: 'Create comprehensive content targeting these keywords',
        impact: 'High - Significant traffic and ranking improvements',
        effort: 'high',
        timeline: '4-6 weeks',
        healthcareSpecific: true
      });
    }

    // Local keywords
    const localKeywords = opportunities.filter(opp => opp.localIntent > 70);
    if (localKeywords.length > 0) {
      recommendations.push({
        id: 'local-keywords',
        priority: 'medium',
        category: 'local',
        title: 'Optimize for Local Keywords',
        description: `${localKeywords.length} local intent keywords identified`,
        keywords: localKeywords.map(opp => opp.keyword),
        action: 'Optimize local SEO and create location-specific content',
        impact: 'Medium - Better local search visibility',
        effort: 'medium',
        timeline: '2-3 weeks',
        healthcareSpecific: true
      });
    }

    return recommendations;
  }

  private calculateGapScore(ourKeywords: number, competitorKeywords: number, sharedKeywords: number): number {
    if (competitorKeywords === 0) return 100;
    
    const coverage = (sharedKeywords / competitorKeywords) * 100;
    const keywordCount = Math.min(100, (ourKeywords / competitorKeywords) * 100);
    
    return Math.round((coverage + keywordCount) / 2);
  }

  private categorizeKeywords(opportunities: KeywordOpportunity[], category: string): string[] {
    switch (category) {
      case 'primary':
        return opportunities.filter(opp => opp.opportunityScore > 80).map(opp => opp.keyword);
      case 'secondary':
        return opportunities.filter(opp => opp.opportunityScore > 60 && opp.opportunityScore <= 80).map(opp => opp.keyword);
      case 'long-tail':
        return opportunities.filter(opp => opp.keyword.split(' ').length > 2).map(opp => opp.keyword);
      case 'local':
        return opportunities.filter(opp => opp.localIntent > 70).map(opp => opp.keyword);
      case 'branded':
        return opportunities.filter(opp => opp.keyword.includes('brand') || opp.keyword.includes('company')).map(opp => opp.keyword);
      default:
        return [];
    }
  }

  private generateStrategyRecommendations(opportunities: KeywordOpportunity[]): KeywordRecommendation[] {
    return this.generateKeywordRecommendations(opportunities);
  }

  private async getOurContentThemes(organizationId: string): Promise<string[]> {
    // Simulate our content themes
    return ['Cardiology', 'General Health', 'Emergency Care'];
  }

  private async getCompetitorContentThemes(competitorIds: string[]): Promise<string[]> {
    // Simulate competitor content themes
    return ['Cardiology', 'Oncology', 'Neurology', 'Emergency Care', 'Preventive Care'];
  }

  private findMissingTopics(ourThemes: string[], competitorThemes: string[]): string[] {
    const ourThemeSet = new Set(ourThemes);
    return competitorThemes.filter(theme => !ourThemeSet.has(theme));
  }

  private identifyContentGaps(ourThemes: string[], competitorThemes: string[]): ContentGap[] {
    // Simulate content gap identification
    return [];
  }

  private findContentOpportunities(missingTopics: string[], contentGaps: ContentGap[]): ContentOpportunity[] {
    // Simulate content opportunity identification
    return [];
  }
}

interface ContentGap {
  topic: string;
  gapType: string;
  priority: string;
}

interface ContentOpportunity {
  title: string;
  type: string;
  keywords: string[];
  estimatedTraffic: number;
}
