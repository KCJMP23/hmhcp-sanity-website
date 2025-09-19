/**
 * PubMed E-utilities API Client
 * Healthcare-grade API wrapper for PubMed research data integration
 * 
 * Features:
 * - Rate limiting with p-queue (3 req/sec without key, 10 with key)
 * - Exponential backoff retry logic
 * - Query builder for complex searches
 * - Mock mode for development
 * - HIPAA-compliant error handling
 * - Healthcare-specific type safety
 */

import PQueue from 'p-queue';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * PubMed article metadata structure
 */
export interface PubMedArticle {
  /** PubMed ID */
  pmid: string;
  /** Digital Object Identifier */
  doi?: string;
  /** Article title */
  title: string;
  /** Abstract text */
  abstract?: string;
  /** Publication date */
  pubDate: string;
  /** Journal information */
  journal: {
    title: string;
    volume?: string;
    issue?: string;
    pages?: string;
    issn?: string;
  };
  /** Author list */
  authors: Array<{
    lastName: string;
    foreName: string;
    initials: string;
    affiliation?: string;
  }>;
  /** MeSH keywords */
  meshTerms: string[];
  /** Publication type */
  publicationType: string[];
  /** Article URL */
  url: string;
}

/**
 * Search query parameters for PubMed API
 */
export interface PubMedSearchParams {
  /** Search terms */
  term: string;
  /** Maximum results to return (default: 20, max: 100000) */
  retmax?: number;
  /** Starting position for results (default: 0) */
  retstart?: number;
  /** Sort order */
  sort?: 'relevance' | 'pub_date' | 'author' | 'journal';
  /** Minimum date filter (YYYY/MM/DD) */
  mindate?: string;
  /** Maximum date filter (YYYY/MM/DD) */
  maxdate?: string;
  /** Database to search (default: pubmed) */
  db?: string;
}

/**
 * Search results from PubMed API
 */
export interface PubMedSearchResult {
  /** Total count of matching articles */
  count: number;
  /** Starting position */
  retstart: number;
  /** Maximum results requested */
  retmax: number;
  /** Array of PubMed IDs */
  idList: string[];
  /** Query translation used by PubMed */
  queryTranslation?: string;
}

/**
 * Client configuration options
 */
export interface PubMedClientConfig {
  /** API key for higher rate limits */
  apiKey?: string;
  /** Enable mock mode for development */
  mockMode?: boolean;
  /** Base URL for API (default: NCBI E-utilities) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Tool name for API identification */
  tool?: string;
  /** Contact email for API identification */
  email?: string;
}

/**
 * API error response structure
 */
export interface PubMedApiError {
  error: string;
  code: number;
  details?: string;
}

/**
 * Query builder for complex PubMed searches
 */
export class PubMedQueryBuilder {
  private terms: string[] = [];

  /**
   * Add search term
   */
  addTerm(term: string): this {
    this.terms.push(term);
    return this;
  }

  /**
   * Add author search
   */
  addAuthor(author: string): this {
    this.terms.push(`${author}[Author]`);
    return this;
  }

  /**
   * Add journal search
   */
  addJournal(journal: string): this {
    this.terms.push(`${journal}[Journal]`);
    return this;
  }

  /**
   * Add MeSH term
   */
  addMeshTerm(meshTerm: string): this {
    this.terms.push(`${meshTerm}[MeSH]`);
    return this;
  }

  /**
   * Add publication type filter
   */
  addPublicationType(type: string): this {
    this.terms.push(`${type}[Publication Type]`);
    return this;
  }

  /**
   * Add date range filter
   */
  addDateRange(startDate: string, endDate: string): this {
    this.terms.push(`${startDate}:${endDate}[Date - Publication]`);
    return this;
  }

  /**
   * Combine terms with AND operator
   */
  and(term: string): this {
    this.terms.push(`AND ${term}`);
    return this;
  }

  /**
   * Combine terms with OR operator
   */
  or(term: string): this {
    this.terms.push(`OR ${term}`);
    return this;
  }

  /**
   * Exclude terms with NOT operator
   */
  not(term: string): this {
    this.terms.push(`NOT ${term}`);
    return this;
  }

  /**
   * Build final query string
   */
  build(): string {
    return this.terms.join(' ');
  }

  /**
   * Reset query builder
   */
  reset(): this {
    this.terms = [];
    return this;
  }
}

// =============================================================================
// Mock Data for Development
// =============================================================================

const MOCK_SEARCH_RESULT: PubMedSearchResult = {
  count: 2,
  retstart: 0,
  retmax: 20,
  idList: ['12345678', '87654321'],
  queryTranslation: 'healthcare[Title/Abstract] AND machine learning[Title/Abstract]'
};

const MOCK_ARTICLES: Record<string, PubMedArticle> = {
  '12345678': {
    pmid: '12345678',
    doi: '10.1001/jama.2023.12345',
    title: 'Machine Learning Applications in Healthcare: A Comprehensive Review',
    abstract: 'This review examines the current state of machine learning applications in healthcare, focusing on clinical decision support systems, diagnostic imaging, and predictive analytics.',
    pubDate: '2023-08-15',
    journal: {
      title: 'Journal of the American Medical Association',
      volume: '330',
      issue: '7',
      pages: '635-644',
      issn: '0098-7484'
    },
    authors: [
      {
        lastName: 'Smith',
        foreName: 'John',
        initials: 'J',
        affiliation: 'Department of Biomedical Informatics, Harvard Medical School'
      },
      {
        lastName: 'Johnson',
        foreName: 'Emily',
        initials: 'E',
        affiliation: 'AI Research Laboratory, Stanford University'
      }
    ],
    meshTerms: ['Machine Learning', 'Healthcare', 'Artificial Intelligence', 'Clinical Decision Support'],
    publicationType: ['Journal Article', 'Review'],
    url: 'https://pubmed.ncbi.nlm.nih.gov/12345678/'
  },
  '87654321': {
    pmid: '87654321',
    doi: '10.1056/nejm.2023.54321',
    title: 'AI-Powered Diagnostic Tools in Radiology: Current Applications and Future Prospects',
    abstract: 'An analysis of artificial intelligence applications in radiological diagnosis, including deep learning models for medical image analysis.',
    pubDate: '2023-09-10',
    journal: {
      title: 'New England Journal of Medicine',
      volume: '389',
      issue: '11',
      pages: '1023-1032',
      issn: '0028-4793'
    },
    authors: [
      {
        lastName: 'Davis',
        foreName: 'Sarah',
        initials: 'S',
        affiliation: 'Department of Radiology, Mayo Clinic'
      }
    ],
    meshTerms: ['Radiology', 'Artificial Intelligence', 'Diagnostic Imaging', 'Deep Learning'],
    publicationType: ['Journal Article'],
    url: 'https://pubmed.ncbi.nlm.nih.gov/87654321/'
  }
};

// =============================================================================
// PubMed Client Implementation
// =============================================================================

export class PubMedClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly mockMode: boolean;
  private readonly timeout: number;
  private readonly tool: string;
  private readonly email?: string;
  private readonly queue: PQueue;

  constructor(config: PubMedClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    this.apiKey = config.apiKey;
    this.mockMode = config.mockMode || process.env.NODE_ENV === 'development';
    this.timeout = config.timeout || 30000;
    this.tool = config.tool || 'hmhcp-research-client';
    this.email = config.email;

    // Configure rate limiting based on API key availability
    const rateLimit = this.apiKey ? 10 : 3; // 10 req/sec with key, 3 without
    this.queue = new PQueue({
      interval: 1000, // 1 second
      intervalCap: rateLimit,
      timeout: this.timeout,
      throwOnTimeout: true
    });
  }

  /**
   * Search PubMed articles with query parameters
   */
  async search(params: PubMedSearchParams): Promise<PubMedSearchResult> {
    if (this.mockMode) {
      console.log('[PubMed Mock] Simulating search:', params);
      await this.simulateDelay(500, 1000);
      return MOCK_SEARCH_RESULT;
    }

    return this.queue.add(() => this.performSearch(params));
  }

  /**
   * Fetch articles by PubMed IDs
   */
  async fetchByIds(pmids: string[]): Promise<PubMedArticle[]> {
    if (this.mockMode) {
      console.log('[PubMed Mock] Simulating fetch by IDs:', pmids);
      await this.simulateDelay(800, 1500);
      return pmids
        .filter(id => MOCK_ARTICLES[id])
        .map(id => MOCK_ARTICLES[id]);
    }

    return this.queue.add(() => this.performFetchByIds(pmids));
  }

  /**
   * Fetch single article by PubMed ID
   */
  async fetchById(pmid: string): Promise<PubMedArticle | null> {
    const articles = await this.fetchByIds([pmid]);
    return articles.length > 0 ? articles[0] : null;
  }

  /**
   * Search and fetch articles in one call
   */
  async searchAndFetch(params: PubMedSearchParams): Promise<PubMedArticle[]> {
    const searchResult = await this.search(params);
    
    if (searchResult.idList.length === 0) {
      return [];
    }

    return this.fetchByIds(searchResult.idList);
  }

  /**
   * Get article count for a search query
   */
  async getCount(term: string): Promise<number> {
    const result = await this.search({ term, retmax: 0 });
    return result.count;
  }

  /**
   * Create a new query builder instance
   */
  createQueryBuilder(): PubMedQueryBuilder {
    return new PubMedQueryBuilder();
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Perform actual search request with retry logic
   */
  private async performSearch(params: PubMedSearchParams): Promise<PubMedSearchResult> {
    const searchParams = new URLSearchParams({
      db: params.db || 'pubmed',
      term: params.term,
      retmax: String(params.retmax || 20),
      retstart: String(params.retstart || 0),
      retmode: 'json',
      tool: this.tool,
      ...(this.apiKey && { api_key: this.apiKey }),
      ...(this.email && { email: this.email }),
      ...(params.sort && { sort: params.sort }),
      ...(params.mindate && { mindate: params.mindate }),
      ...(params.maxdate && { maxdate: params.maxdate })
    });

    const url = `${this.baseUrl}esearch.fcgi?${searchParams}`;
    
    return this.retryRequest(async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': `${this.tool} (healthcare research client)`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`PubMed API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.esearchresult.errorlist) {
        throw new Error(`PubMed search error: ${data.esearchresult.errorlist.join(', ')}`);
      }

      return {
        count: parseInt(data.esearchresult.count),
        retstart: parseInt(data.esearchresult.retstart),
        retmax: parseInt(data.esearchresult.retmax),
        idList: data.esearchresult.idlist || [],
        queryTranslation: data.esearchresult.querytranslation
      };
    });
  }

  /**
   * Perform actual fetch by IDs request with retry logic
   */
  private async performFetchByIds(pmids: string[]): Promise<PubMedArticle[]> {
    if (pmids.length === 0) return [];

    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'xml',
      tool: this.tool,
      ...(this.apiKey && { api_key: this.apiKey }),
      ...(this.email && { email: this.email })
    });

    const url = `${this.baseUrl}efetch.fcgi?${fetchParams}`;

    return this.retryRequest(async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': `${this.tool} (healthcare research client)`,
          'Accept': 'application/xml'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`PubMed API error: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      return this.parseXmlToArticles(xmlText);
    });
  }

  /**
   * Parse XML response to PubMedArticle objects
   */
  private parseXmlToArticles(xmlText: string): PubMedArticle[] {
    try {
      // Simple XML parsing for healthcare research data
      // In production, consider using a proper XML parser like fast-xml-parser
      const articles: PubMedArticle[] = [];
      
      // Extract article blocks
      const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
      let match;

      while ((match = articleRegex.exec(xmlText)) !== null) {
        const articleXml = match[1];
        
        try {
          const article = this.parseArticleXml(articleXml);
          if (article) {
            articles.push(article);
          }
        } catch (parseError) {
          console.warn('[PubMed] Failed to parse individual article:', parseError);
          // Continue parsing other articles even if one fails
        }
      }

      return articles;
    } catch (error) {
      console.error('[PubMed] XML parsing error:', error);
      throw new Error('Failed to parse PubMed XML response');
    }
  }

  /**
   * Parse individual article XML to PubMedArticle object
   */
  private parseArticleXml(articleXml: string): PubMedArticle | null {
    // Helper function to extract text content
    const extractText = (xml: string, tag: string): string => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1].trim() : '';
    };

    // Helper function to extract all matches
    const extractAll = (xml: string, tag: string): string[] => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
      const matches = [];
      let match;
      while ((match = regex.exec(xml)) !== null) {
        matches.push(match[1].trim());
      }
      return matches;
    };

    try {
      const pmid = extractText(articleXml, 'PMID');
      if (!pmid) return null;

      const title = extractText(articleXml, 'ArticleTitle');
      if (!title) return null;

      // Extract DOI
      const doi = extractText(articleXml, 'ELocationID');

      // Extract abstract
      const abstractText = extractText(articleXml, 'AbstractText');

      // Extract publication date
      const pubDateMatch = articleXml.match(/<PubDate>([\s\S]*?)<\/PubDate>/);
      let pubDate = '';
      if (pubDateMatch) {
        const year = extractText(pubDateMatch[1], 'Year');
        const month = extractText(pubDateMatch[1], 'Month');
        const day = extractText(pubDateMatch[1], 'Day');
        pubDate = `${year}${month ? '-' + month.padStart(2, '0') : ''}${day ? '-' + day.padStart(2, '0') : ''}`;
      }

      // Extract journal information
      const journalTitle = extractText(articleXml, 'Title');
      const volume = extractText(articleXml, 'Volume');
      const issue = extractText(articleXml, 'Issue');
      const pages = extractText(articleXml, 'MedlinePgn');
      const issn = extractText(articleXml, 'ISSN');

      // Extract authors
      const authors = [];
      const authorMatches = articleXml.match(/<Author[^>]*>([\s\S]*?)<\/Author>/g) || [];
      
      for (const authorXml of authorMatches) {
        const lastName = extractText(authorXml, 'LastName');
        const foreName = extractText(authorXml, 'ForeName');
        const initials = extractText(authorXml, 'Initials');
        const affiliation = extractText(authorXml, 'Affiliation');

        if (lastName) {
          authors.push({
            lastName,
            foreName,
            initials,
            ...(affiliation && { affiliation })
          });
        }
      }

      // Extract MeSH terms
      const meshTerms = extractAll(articleXml, 'DescriptorName');

      // Extract publication types
      const publicationType = extractAll(articleXml, 'PublicationType');

      return {
        pmid,
        ...(doi && { doi }),
        title,
        ...(abstractText && { abstract: abstractText }),
        pubDate,
        journal: {
          title: journalTitle,
          ...(volume && { volume }),
          ...(issue && { issue }),
          ...(pages && { pages }),
          ...(issn && { issn })
        },
        authors,
        meshTerms,
        publicationType,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      };
    } catch (error) {
      console.error('[PubMed] Article parsing error:', error);
      return null;
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Check if error is retryable
        if (this.isRetryableError(error)) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.warn(`[PubMed] Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
          await this.delay(delay);
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network error
    }
    
    if (error.message.includes('timeout')) {
      return true; // Timeout error
    }

    if (error.message.includes('PubMed API error: 5')) {
      return true; // 5xx server error
    }

    if (error.message.includes('PubMed API error: 429')) {
      return true; // Rate limit error
    }

    return false;
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simulate delay for mock mode
   */
  private async simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.delay(delay);
  }

  /**
   * Get queue statistics for monitoring
   */
  getQueueStats(): { size: number; pending: number; running: number } {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      running: this.queue.size - this.queue.pending
    };
  }

  /**
   * Clear the request queue
   */
  clearQueue(): void {
    this.queue.clear();
  }

  /**
   * Check if client is in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode;
  }
}

// =============================================================================
// Default Export and Factory Functions
// =============================================================================

/**
 * Create PubMed client with environment-based configuration
 */
export function createPubMedClient(overrides: PubMedClientConfig = {}): PubMedClient {
  const config: PubMedClientConfig = {
    apiKey: process.env.PUBMED_API_KEY,
    mockMode: process.env.NODE_ENV === 'development' || process.env.PUBMED_MOCK_MODE === 'true',
    tool: process.env.PUBMED_TOOL_NAME || 'hmhcp-research-client',
    email: process.env.PUBMED_CONTACT_EMAIL,
    timeout: parseInt(process.env.PUBMED_TIMEOUT || '30000'),
    ...overrides
  };

  return new PubMedClient(config);
}

/**
 * Default client instance
 */
export const pubmedClient = createPubMedClient();

/**
 * Export query builder for convenience
 */
// PubMedQueryBuilder is exported as a class above