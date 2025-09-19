// Perplexity AI Research Integration Service
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

import { ResearchQuery, ResearchResult, ResearchError } from '@/types/publications';

export class PerplexityResearchService {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai/chat/completions';
  private rateLimitDelay: number = 1000; // 1 second between requests
  private lastRequestTime: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for research publications using Perplexity AI
   */
  async searchPublications(query: ResearchQuery): Promise<ResearchResult> {
    try {
      await this.enforceRateLimit();

      const prompt = this.buildResearchPrompt(query);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a medical research assistant. Provide structured, accurate information about healthcare publications and research findings. Always include proper citations and source URLs when available.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResearchResponse(data, query);

    } catch (error) {
      console.error('Perplexity research search error:', error);
      throw new ResearchError(
        'RESEARCH_API_ERROR',
        `Failed to search research publications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get detailed information about a specific publication
   */
  async getPublicationDetails(publicationId: string, source: 'doi' | 'pubmed' | 'title'): Promise<ResearchResult> {
    try {
      await this.enforceRateLimit();

      const prompt = this.buildDetailsPrompt(publicationId, source);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a medical research assistant. Provide detailed, structured information about specific healthcare publications. Include all available metadata, authors, abstract, and citation information.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseDetailsResponse(data, publicationId);

    } catch (error) {
      console.error('Perplexity publication details error:', error);
      throw new ResearchError(
        'RESEARCH_API_ERROR',
        `Failed to get publication details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get trending research topics in a medical specialty
   */
  async getTrendingTopics(specialty: string, timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<ResearchResult> {
    try {
      await this.enforceRateLimit();

      const prompt = this.buildTrendingPrompt(specialty, timeframe);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a medical research assistant. Identify and analyze trending research topics in healthcare specialties. Provide structured information about emerging areas of research with proper citations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.2,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseTrendingResponse(data, specialty, timeframe);

    } catch (error) {
      console.error('Perplexity trending topics error:', error);
      throw new ResearchError(
        'RESEARCH_API_ERROR',
        `Failed to get trending topics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Enforce rate limiting to avoid API limits
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Build research search prompt
   */
  private buildResearchPrompt(query: ResearchQuery): string {
    let prompt = `Search for healthcare research publications with the following criteria:\n\n`;
    
    if (query.keywords) {
      prompt += `Keywords: ${query.keywords.join(', ')}\n`;
    }
    
    if (query.specialty) {
      prompt += `Medical Specialty: ${query.specialty}\n`;
    }
    
    if (query.publicationType) {
      prompt += `Publication Type: ${query.publicationType}\n`;
    }
    
    if (query.dateRange) {
      prompt += `Date Range: ${query.dateRange.start} to ${query.dateRange.end}\n`;
    }
    
    if (query.limit) {
      prompt += `Limit: ${query.limit} results\n`;
    }
    
    prompt += `\nPlease provide:\n`;
    prompt += `1. Publication titles and authors\n`;
    prompt += `2. Abstracts or summaries\n`;
    prompt += `3. Journal names and publication dates\n`;
    prompt += `4. DOI or PubMed IDs when available\n`;
    prompt += `5. Source URLs for verification\n`;
    prompt += `6. Relevance to the search criteria\n`;
    
    return prompt;
  }

  /**
   * Build publication details prompt
   */
  private buildDetailsPrompt(publicationId: string, source: string): string {
    let prompt = `Get detailed information about this healthcare publication:\n\n`;
    
    switch (source) {
      case 'doi':
        prompt += `DOI: ${publicationId}\n`;
        break;
      case 'pubmed':
        prompt += `PubMed ID: ${publicationId}\n`;
        break;
      case 'title':
        prompt += `Title: ${publicationId}\n`;
        break;
    }
    
    prompt += `\nPlease provide:\n`;
    prompt += `1. Complete publication metadata\n`;
    prompt += `2. Full abstract\n`;
    prompt += `3. All authors with affiliations\n`;
    prompt += `4. Journal information and impact factor\n`;
    prompt += `5. Citation count and metrics\n`;
    prompt += `6. Keywords and MeSH terms\n`;
    prompt += `7. Full text availability\n`;
    prompt += `8. Related publications\n`;
    
    return prompt;
  }

  /**
   * Build trending topics prompt
   */
  private buildTrendingPrompt(specialty: string, timeframe: string): string {
    let prompt = `Identify trending research topics in ${specialty} over the past ${timeframe}.\n\n`;
    
    prompt += `Please provide:\n`;
    prompt += `1. Top 10 trending research areas\n`;
    prompt += `2. Key publications driving each trend\n`;
    prompt += `3. Emerging methodologies or technologies\n`;
    prompt += `4. Clinical implications and applications\n`;
    prompt += `5. Future research directions\n`;
    prompt += `6. Source URLs and citations\n`;
    
    return prompt;
  }

  /**
   * Parse research search response
   */
  private parseResearchResponse(data: any, query: ResearchQuery): ResearchResult {
    try {
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extract publications from the response
      const publications = this.extractPublicationsFromText(content);
      
      return {
        success: true,
        publications,
        total: publications.length,
        query,
        metadata: {
          source: 'perplexity',
          timestamp: new Date().toISOString(),
          model: data.model || 'unknown',
          usage: data.usage || {}
        }
      };
    } catch (error) {
      throw new ResearchError(
        'RESEARCH_PARSE_ERROR',
        `Failed to parse research response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Parse publication details response
   */
  private parseDetailsResponse(data: any, publicationId: string): ResearchResult {
    try {
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extract detailed publication information
      const publication = this.extractDetailedPublication(content, publicationId);
      
      return {
        success: true,
        publications: [publication],
        total: 1,
        query: { keywords: [publicationId] },
        metadata: {
          source: 'perplexity',
          timestamp: new Date().toISOString(),
          model: data.model || 'unknown',
          usage: data.usage || {}
        }
      };
    } catch (error) {
      throw new ResearchError(
        'RESEARCH_PARSE_ERROR',
        `Failed to parse details response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Parse trending topics response
   */
  private parseTrendingResponse(data: any, specialty: string, timeframe: string): ResearchResult {
    try {
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extract trending topics and related publications
      const topics = this.extractTrendingTopics(content);
      const publications = this.extractPublicationsFromText(content);
      
      return {
        success: true,
        publications,
        total: publications.length,
        query: { keywords: [specialty], timeframe },
        metadata: {
          source: 'perplexity',
          timestamp: new Date().toISOString(),
          model: data.model || 'unknown',
          usage: data.usage || {},
          trendingTopics: topics
        }
      };
    } catch (error) {
      throw new ResearchError(
        'RESEARCH_PARSE_ERROR',
        `Failed to parse trending response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Extract publications from text response
   */
  private extractPublicationsFromText(text: string): any[] {
    // This is a simplified extraction - in a real implementation,
    // you'd use more sophisticated parsing or structured output
    const publications: any[] = [];
    
    // Look for publication patterns in the text
    const lines = text.split('\n');
    let currentPublication: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^\d+\./)) {
        // New publication
        if (currentPublication.title) {
          publications.push(currentPublication);
        }
        currentPublication = {
          title: trimmed.replace(/^\d+\.\s*/, ''),
          source: 'perplexity'
        };
      } else if (trimmed.includes('Authors:') || trimmed.includes('Author:')) {
        currentPublication.authors = trimmed.replace(/^(Authors?:\s*)/, '');
      } else if (trimmed.includes('Journal:') || trimmed.includes('Published in:')) {
        currentPublication.journal = trimmed.replace(/^(Journal|Published in):\s*/, '');
      } else if (trimmed.includes('DOI:')) {
        currentPublication.doi = trimmed.replace(/^DOI:\s*/, '');
      } else if (trimmed.includes('PMID:')) {
        currentPublication.pubmed_id = trimmed.replace(/^PMID:\s*/, '');
      } else if (trimmed.includes('Abstract:') || trimmed.includes('Summary:')) {
        currentPublication.abstract = trimmed.replace(/^(Abstract|Summary):\s*/, '');
      }
    }
    
    if (currentPublication.title) {
      publications.push(currentPublication);
    }
    
    return publications;
  }

  /**
   * Extract detailed publication information
   */
  private extractDetailedPublication(text: string, publicationId: string): any {
    // Simplified extraction - would need more sophisticated parsing
    return {
      id: publicationId,
      title: this.extractField(text, 'Title:', 'Journal:'),
      abstract: this.extractField(text, 'Abstract:', 'Keywords:'),
      authors: this.extractField(text, 'Authors:', 'Journal:'),
      journal: this.extractField(text, 'Journal:', 'Published:'),
      doi: this.extractField(text, 'DOI:', 'PMID:'),
      pubmed_id: this.extractField(text, 'PMID:', 'Keywords:'),
      source: 'perplexity'
    };
  }

  /**
   * Extract trending topics from text
   */
  private extractTrendingTopics(text: string): string[] {
    const topics: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\./) && !trimmed.includes('Publication')) {
        topics.push(trimmed.replace(/^\d+\.\s*/, ''));
      }
    }
    
    return topics;
  }

  /**
   * Extract field value from text
   */
  private extractField(text: string, startMarker: string, endMarker?: string): string {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';
    
    const start = startIndex + startMarker.length;
    const end = endMarker ? text.indexOf(endMarker, start) : text.length;
    
    return text.substring(start, end).trim();
  }
}

// Export singleton instance
export const perplexityResearchService = new PerplexityResearchService(
  process.env.PERPLEXITY_API_KEY || ''
);
