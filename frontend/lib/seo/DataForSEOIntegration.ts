// DataForSEO API Integration
// Created: 2025-01-27
// Purpose: DataForSEO API integration for healthcare keyword research

export interface DataForSEOKeywordData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: 'low' | 'medium' | 'high';
  difficulty: number;
  trends: Array<{
    date: string;
    value: number;
  }>;
  relatedKeywords: string[];
  healthcareRelevance: number;
  medicalSpecialty?: string[];
  targetAudience: 'patients' | 'providers' | 'researchers' | 'general';
}

export interface DataForSEOSERPData {
  keyword: string;
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  serpFeatures: string[];
  healthcareCompliance: {
    hasMedicalDisclaimer: boolean;
    hasHIPAACompliance: boolean;
    hasFDAApproval: boolean;
    medicalAccuracy: number;
  };
}

export interface DataForSEORankingsData {
  keyword: string;
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  serpFeatures: string[];
  healthcareCompliance: {
    hasMedicalDisclaimer: boolean;
    hasHIPAACompliance: boolean;
    hasFDAApproval: boolean;
    medicalAccuracy: number;
  };
}

export interface DataForSEOCompetitorAnalysis {
  competitor: string;
  domain: string;
  totalKeywords: number;
  topKeywords: Array<{
    keyword: string;
    position: number;
    searchVolume: number;
  }>;
  healthcareKeywords: Array<{
    keyword: string;
    position: number;
    searchVolume: number;
    medicalSpecialty: string;
  }>;
  contentGaps: Array<{
    keyword: string;
    searchVolume: number;
    opportunity: 'high' | 'medium' | 'low';
    medicalSpecialty: string;
  }>;
  backlinkProfile: {
    totalBacklinks: number;
    referringDomains: number;
    domainRating: number;
    healthcareBacklinks: number;
  };
}

export interface DataForSEOHealthCheck {
  apiStatus: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
  quotaUsed: number;
  quotaLimit: number;
  responseTime: number;
  errors: Array<{
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

export class DataForSEOIntegration {
  private apiKey: string;
  private baseUrl: string = 'https://api.dataforseo.com/v3';
  private healthcareKeywords: string[] = [
    'healthcare', 'medical', 'doctor', 'hospital', 'clinic', 'treatment',
    'diagnosis', 'surgery', 'therapy', 'medicine', 'patient', 'health'
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getKeywordData(keywords: string[]): Promise<DataForSEOKeywordData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/keywords_data/google_ads/search_volume/live`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: keywords,
          location_code: 2840, // United States
          language_code: 'en'
        })
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatKeywordData(data.tasks?.[0]?.result || []);

    } catch (error) {
      throw new Error(`Failed to fetch keyword data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSERPData(keywords: string[]): Promise<DataForSEOSERPData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/serp/google/organic/live/advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: keywords,
          location_code: 2840,
          language_code: 'en',
          depth: 10
        })
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatSERPData(data.tasks?.[0]?.result || []);

    } catch (error) {
      throw new Error(`Failed to fetch SERP data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRankingsData(domain: string, keywords: string[]): Promise<DataForSEORankingsData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/serp/google/organic/live/advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: keywords,
          location_code: 2840,
          language_code: 'en',
          depth: 100
        })
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.filterRankingsForDomain(data.tasks?.[0]?.result || [], domain);

    } catch (error) {
      throw new Error(`Failed to fetch rankings data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompetitorAnalysis(competitors: string[]): Promise<DataForSEOCompetitorAnalysis[]> {
    try {
      const analyses: DataForSEOCompetitorAnalysis[] = [];

      for (const competitor of competitors) {
        // Get competitor's top keywords
        const keywordData = await this.getCompetitorKeywords(competitor);
        
        // Get healthcare-specific keywords
        const healthcareKeywords = keywordData.filter(k => 
          this.isHealthcareKeyword(k.keyword)
        );

        // Get content gaps
        const contentGaps = await this.identifyContentGaps(competitor, healthcareKeywords);

        // Get backlink profile
        const backlinkProfile = await this.getBacklinkProfile(competitor);

        analyses.push({
          competitor,
          domain: competitor,
          totalKeywords: keywordData.length,
          topKeywords: keywordData.slice(0, 10),
          healthcareKeywords: healthcareKeywords.slice(0, 10),
          contentGaps,
          backlinkProfile
        });
      }

      return analyses;

    } catch (error) {
      throw new Error(`Failed to get competitor analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHealthcareKeywordSuggestions(seedKeywords: string[]): Promise<DataForSEOKeywordData[]> {
    try {
      // Get related keywords for each seed keyword
      const allKeywords: DataForSEOKeywordData[] = [];

      for (const seedKeyword of seedKeywords) {
        const relatedKeywords = await this.getRelatedKeywords(seedKeyword);
        allKeywords.push(...relatedKeywords);
      }

      // Filter for healthcare relevance
      const healthcareKeywords = allKeywords.filter(keyword => 
        keyword.healthcareRelevance > 0.5
      );

      // Remove duplicates and sort by search volume
      const uniqueKeywords = this.removeDuplicateKeywords(healthcareKeywords);
      return uniqueKeywords.sort((a, b) => b.searchVolume - a.searchVolume);

    } catch (error) {
      throw new Error(`Failed to get healthcare keyword suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performHealthCheck(): Promise<DataForSEOHealthCheck> {
    try {
      const startTime = Date.now();
      
      // Test API with a simple request
      const response = await fetch(`${this.baseUrl}/keywords_data/google_ads/search_volume/live`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: ['test'],
          location_code: 2840,
          language_code: 'en'
        })
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      return {
        apiStatus: isHealthy ? 'healthy' : 'critical',
        lastChecked: new Date(),
        quotaUsed: 0, // Would need to track from API response
        quotaLimit: 10000, // Would need to get from API response
        responseTime,
        errors: isHealthy ? [] : [{
          type: 'api_error',
          message: `API returned status ${response.status}`,
          timestamp: new Date()
        }]
      };

    } catch (error) {
      return {
        apiStatus: 'critical',
        lastChecked: new Date(),
        quotaUsed: 0,
        quotaLimit: 10000,
        responseTime: 0,
        errors: [{
          type: 'connection_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }]
      };
    }
  }

  // Private helper methods
  private formatKeywordData(data: any[]): DataForSEOKeywordData[] {
    return data.map(item => ({
      keyword: item.keyword || '',
      searchVolume: item.search_volume || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      competitionLevel: this.getCompetitionLevel(item.competition || 0),
      difficulty: item.difficulty || 0,
      trends: item.trends || [],
      relatedKeywords: item.related_keywords || [],
      healthcareRelevance: this.calculateHealthcareRelevance(item.keyword || ''),
      medicalSpecialty: this.identifyMedicalSpecialty(item.keyword || ''),
      targetAudience: this.identifyTargetAudience(item.keyword || '')
    }));
  }

  private formatSERPData(data: any[]): DataForSEOSERPData[] {
    return data.map(item => ({
      keyword: item.keyword || '',
      position: item.position || 0,
      url: item.url || '',
      title: item.title || '',
      description: item.description || '',
      domain: item.domain || '',
      serpFeatures: item.serp_features || [],
      healthcareCompliance: this.analyzeHealthcareCompliance(item)
    }));
  }

  private filterRankingsForDomain(data: any[], domain: string): DataForSEORankingsData[] {
    return data
      .filter(item => item.domain === domain)
      .map(item => ({
        keyword: item.keyword || '',
        position: item.position || 0,
        url: item.url || '',
        title: item.title || '',
        description: item.description || '',
        domain: item.domain || '',
        serpFeatures: item.serp_features || [],
        healthcareCompliance: this.analyzeHealthcareCompliance(item)
      }));
  }

  private async getCompetitorKeywords(competitor: string): Promise<Array<{
    keyword: string;
    position: number;
    searchVolume: number;
  }>> {
    // Simulate competitor keyword data
    return [
      { keyword: 'healthcare services', position: 5, searchVolume: 1000 },
      { keyword: 'medical treatment', position: 8, searchVolume: 800 },
      { keyword: 'doctor consultation', position: 12, searchVolume: 600 }
    ];
  }

  private async identifyContentGaps(competitor: string, keywords: any[]): Promise<Array<{
    keyword: string;
    searchVolume: number;
    opportunity: 'high' | 'medium' | 'low';
    medicalSpecialty: string;
  }>> {
    // Simulate content gap analysis
    return [
      { keyword: 'cardiology treatment', searchVolume: 500, opportunity: 'high', medicalSpecialty: 'cardiology' },
      { keyword: 'oncology care', searchVolume: 300, opportunity: 'medium', medicalSpecialty: 'oncology' }
    ];
  }

  private async getBacklinkProfile(competitor: string): Promise<{
    totalBacklinks: number;
    referringDomains: number;
    domainRating: number;
    healthcareBacklinks: number;
  }> {
    // Simulate backlink profile data
    return {
      totalBacklinks: 1000,
      referringDomains: 100,
      domainRating: 75,
      healthcareBacklinks: 200
    };
  }

  private async getRelatedKeywords(seedKeyword: string): Promise<DataForSEOKeywordData[]> {
    // Simulate related keyword data
    return [
      {
        keyword: `${seedKeyword} near me`,
        searchVolume: 500,
        cpc: 2.5,
        competition: 0.6,
        competitionLevel: 'medium',
        difficulty: 65,
        trends: [],
        relatedKeywords: [],
        healthcareRelevance: 0.8,
        medicalSpecialty: ['general'],
        targetAudience: 'patients'
      }
    ];
  }

  private getCompetitionLevel(competition: number): 'low' | 'medium' | 'high' {
    if (competition < 0.3) return 'low';
    if (competition < 0.7) return 'medium';
    return 'high';
  }

  private calculateHealthcareRelevance(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let relevance = 0;

    this.healthcareKeywords.forEach(healthcareKeyword => {
      if (lowerKeyword.includes(healthcareKeyword)) {
        relevance += 0.2;
      }
    });

    return Math.min(relevance, 1);
  }

  private identifyMedicalSpecialty(keyword: string): string[] {
    const specialties: string[] = [];
    const lowerKeyword = keyword.toLowerCase();

    const specialtyKeywords = {
      'cardiology': ['heart', 'cardiac', 'cardiovascular'],
      'oncology': ['cancer', 'tumor', 'oncology'],
      'neurology': ['brain', 'neurological', 'neurology'],
      'dermatology': ['skin', 'dermatology', 'dermatological']
    };

    Object.entries(specialtyKeywords).forEach(([specialty, keywords]) => {
      if (keywords.some(k => lowerKeyword.includes(k))) {
        specialties.push(specialty);
      }
    });

    return specialties;
  }

  private identifyTargetAudience(keyword: string): 'patients' | 'providers' | 'researchers' | 'general' {
    const lowerKeyword = keyword.toLowerCase();

    if (lowerKeyword.includes('patient') || lowerKeyword.includes('treatment')) {
      return 'patients';
    }
    if (lowerKeyword.includes('doctor') || lowerKeyword.includes('physician')) {
      return 'providers';
    }
    if (lowerKeyword.includes('research') || lowerKeyword.includes('study')) {
      return 'researchers';
    }

    return 'general';
  }

  private analyzeHealthcareCompliance(item: any): {
    hasMedicalDisclaimer: boolean;
    hasHIPAACompliance: boolean;
    hasFDAApproval: boolean;
    medicalAccuracy: number;
  } {
    const title = item.title || '';
    const description = item.description || '';

    return {
      hasMedicalDisclaimer: title.includes('disclaimer') || description.includes('disclaimer'),
      hasHIPAACompliance: title.includes('hipaa') || description.includes('hipaa'),
      hasFDAApproval: title.includes('fda') || description.includes('fda'),
      medicalAccuracy: this.calculateMedicalAccuracy(title, description)
    };
  }

  private calculateMedicalAccuracy(title: string, description: string): number {
    // Simple medical accuracy scoring based on content analysis
    let score = 0.5; // Base score

    const medicalTerms = ['treatment', 'diagnosis', 'therapy', 'medicine', 'medical'];
    const medicalTermsFound = medicalTerms.filter(term => 
      title.toLowerCase().includes(term) || description.toLowerCase().includes(term)
    );

    score += medicalTermsFound.length * 0.1;

    return Math.min(score, 1);
  }

  private isHealthcareKeyword(keyword: string): boolean {
    return this.calculateHealthcareRelevance(keyword) > 0.3;
  }

  private removeDuplicateKeywords(keywords: DataForSEOKeywordData[]): DataForSEOKeywordData[] {
    const seen = new Set<string>();
    return keywords.filter(keyword => {
      if (seen.has(keyword.keyword)) {
        return false;
      }
      seen.add(keyword.keyword);
      return true;
    });
  }
}
