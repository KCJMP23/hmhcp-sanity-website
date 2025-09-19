/**
 * CrossRef DOI Resolver Client
 * Healthcare-grade DOI resolution using CrossRef API
 * 
 * Features:
 * - DOI validation with proper regex pattern
 * - Rate limiting for polite pool access (50 req/sec)
 * - Exponential backoff retry logic
 * - Multiple DOI format handling (doi:, https://, bare)
 * - Mock mode for development
 * - HIPAA-compliant error handling
 * - Healthcare-specific type safety
 * - Polite headers with User-Agent and mailto
 */

import PQueue from 'p-queue';
import { apiRateLimiter } from '@/lib/security/rate-limiting';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * DOI validation regex pattern as specified
 * Matches: 10.1234/example-doi_123.45(test):ok
 */
export const DOI_REGEX = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/;

/**
 * Various DOI format patterns for normalization
 */
export const DOI_PATTERNS = {
  /** Standard DOI format: 10.1234/example */
  STANDARD: /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/,
  /** DOI with doi: prefix: doi:10.1234/example */
  WITH_PREFIX: /^doi:(10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+)$/i,
  /** DOI with HTTP URL: https://doi.org/10.1234/example */
  HTTP_URL: /^https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+)$/i,
  /** DOI with dx.doi.org: https://dx.doi.org/10.1234/example */
  DX_DOI_URL: /^https?:\/\/dx\.doi\.org\/(10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+)$/i
};

/**
 * CrossRef work metadata structure
 */
export interface CrossRefWork {
  /** DOI identifier */
  DOI: string;
  /** Work type (e.g., journal-article, book-chapter) */
  type: string;
  /** Publication title */
  title: string[];
  /** Container title (journal, book) */
  'container-title'?: string[];
  /** Author information */
  author?: Array<{
    given?: string;
    family?: string;
    ORCID?: string;
    affiliation?: Array<{
      name: string;
    }>;
  }>;
  /** Publication date parts [year, month, day] */
  'published-print'?: {
    'date-parts': number[][];
  };
  /** Online publication date */
  'published-online'?: {
    'date-parts': number[][];
  };
  /** Volume number */
  volume?: string;
  /** Issue number */
  issue?: string;
  /** Page range */
  page?: string;
  /** Publisher name */
  publisher?: string;
  /** ISSN numbers */
  ISSN?: string[];
  /** ISBN numbers */
  ISBN?: string[];
  /** Subject classification */
  subject?: string[];
  /** Abstract */
  abstract?: string;
  /** License information */
  license?: Array<{
    URL: string;
    'content-version': string;
  }>;
  /** Reference count */
  'reference-count': number;
  /** Citation count */
  'is-referenced-by-count': number;
  /** URL to the work */
  URL?: string;
  /** Funder information */
  funder?: Array<{
    name: string;
    DOI?: string;
  }>;
  /** Clinical trial numbers */
  'clinical-trial-number'?: Array<{
    'clinical-trial-number': string;
    registry: string;
  }>;
}

/**
 * Normalized research article metadata
 */
export interface ResearchArticle {
  /** Digital Object Identifier */
  doi: string;
  /** Article title */
  title: string;
  /** Abstract text */
  abstract?: string;
  /** Publication date (ISO format) */
  publishedDate?: string;
  /** Journal or publication container */
  journal?: {
    name: string;
    volume?: string;
    issue?: string;
    pages?: string;
    issn?: string[];
  };
  /** Book information (for book chapters) */
  book?: {
    title: string;
    isbn?: string[];
  };
  /** Author list */
  authors: Array<{
    givenName?: string;
    familyName?: string;
    fullName: string;
    orcid?: string;
    affiliations: string[];
  }>;
  /** Publisher information */
  publisher?: string;
  /** Publication type */
  type: string;
  /** Subject categories */
  subjects: string[];
  /** Citation metrics */
  metrics: {
    referenceCount: number;
    citationCount: number;
  };
  /** Original CrossRef URL */
  url: string;
  /** License information */
  licenses: Array<{
    url: string;
    type: string;
  }>;
  /** Funding information */
  funding: Array<{
    funderName: string;
    funderDOI?: string;
  }>;
  /** Clinical trial associations */
  clinicalTrials: Array<{
    number: string;
    registry: string;
  }>;
}

/**
 * DOI resolution result
 */
export interface DOIResolutionResult {
  /** Whether the DOI was found */
  success: boolean;
  /** Resolved article data */
  article?: ResearchArticle;
  /** Error message if resolution failed */
  error?: string;
  /** Response time in milliseconds */
  responseTime: number;
  /** Whether result came from cache */
  fromCache?: boolean;
}

/**
 * Client configuration options
 */
export interface DOIResolverConfig {
  /** Enable mock mode for development */
  mockMode?: boolean;
  /** Base URL for CrossRef API (default: https://api.crossref.org) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** User-Agent tool name for API identification */
  tool?: string;
  /** Contact email for polite requests */
  email?: string;
  /** Enable response caching */
  enableCache?: boolean;
  /** Cache TTL in milliseconds (default: 1 hour) */
  cacheTtl?: number;
}

/**
 * API error response structure
 */
export interface CrossRefApiError {
  status: string;
  message: Array<{
    type: string;
    message: string;
  }>;
}

/**
 * DOI validation result
 */
export interface DOIValidationResult {
  /** Whether the DOI is valid */
  isValid: boolean;
  /** Normalized DOI (without prefixes/URLs) */
  normalizedDOI?: string;
  /** Original format detected */
  originalFormat: 'standard' | 'prefixed' | 'url' | 'invalid';
  /** Validation error message */
  error?: string;
}

// =============================================================================
// Mock Data for Development
// =============================================================================

const MOCK_CROSSREF_RESPONSE: CrossRefWork = {
  DOI: "10.1001/jama.2023.12345",
  type: "journal-article",
  title: ["Machine Learning Applications in Healthcare: A Systematic Review and Meta-Analysis"],
  "container-title": ["JAMA - Journal of the American Medical Association"],
  author: [
    {
      given: "John",
      family: "Smith",
      ORCID: "http://orcid.org/0000-0000-0000-0001",
      affiliation: [
        { name: "Department of Biomedical Informatics, Harvard Medical School, Boston, MA, USA" }
      ]
    },
    {
      given: "Emily",
      family: "Johnson",
      ORCID: "http://orcid.org/0000-0000-0000-0002",
      affiliation: [
        { name: "AI Research Laboratory, Stanford University, Stanford, CA, USA" }
      ]
    }
  ],
  "published-print": {
    "date-parts": [[2023, 8, 15]]
  },
  "published-online": {
    "date-parts": [[2023, 7, 20]]
  },
  volume: "330",
  issue: "7",
  page: "635-644",
  publisher: "American Medical Association",
  ISSN: ["0098-7484", "1538-3598"],
  subject: ["Medicine", "Artificial Intelligence", "Machine Learning", "Healthcare Technology"],
  abstract: "Background: Machine learning (ML) applications in healthcare have shown significant promise across various clinical domains. Objective: To systematically review and meta-analyze the effectiveness of ML applications in healthcare settings. Methods: We conducted a comprehensive search of PubMed, Embase, and IEEE databases from 2018 to 2023...",
  license: [
    {
      URL: "https://creativecommons.org/licenses/by/4.0/",
      "content-version": "vor"
    }
  ],
  "reference-count": 127,
  "is-referenced-by-count": 45,
  URL: "https://jamanetwork.com/journals/jama/fullarticle/2023/12345",
  funder: [
    {
      name: "National Institutes of Health",
      DOI: "10.13039/100000002"
    },
    {
      name: "National Science Foundation",
      DOI: "10.13039/100000001"
    }
  ],
  "clinical-trial-number": [
    {
      "clinical-trial-number": "NCT04567890",
      registry: "ClinicalTrials.gov"
    }
  ]
};

const MOCK_ARTICLES: Record<string, CrossRefWork> = {
  "10.1001/jama.2023.12345": MOCK_CROSSREF_RESPONSE,
  "10.1056/nejm.2023.54321": {
    DOI: "10.1056/nejm.2023.54321",
    type: "journal-article",
    title: ["AI-Powered Diagnostic Tools in Radiology: Current Applications and Future Prospects"],
    "container-title": ["New England Journal of Medicine"],
    author: [
      {
        given: "Sarah",
        family: "Davis",
        affiliation: [
          { name: "Department of Radiology, Mayo Clinic, Rochester, MN, USA" }
        ]
      }
    ],
    "published-print": {
      "date-parts": [[2023, 9, 10]]
    },
    volume: "389",
    issue: "11",
    page: "1023-1032",
    publisher: "Massachusetts Medical Society",
    ISSN: ["0028-4793"],
    subject: ["Radiology", "Artificial Intelligence", "Medical Imaging"],
    "reference-count": 89,
    "is-referenced-by-count": 23,
    URL: "https://www.nejm.org/doi/10.1056/NEJMra2023054321"
  }
};

// =============================================================================
// DOI Validation and Normalization
// =============================================================================

/**
 * Validate and normalize DOI format
 */
export function validateAndNormalizeDOI(input: string): DOIValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      originalFormat: 'invalid',
      error: 'DOI input is required and must be a string'
    };
  }

  const trimmedInput = input.trim();
  
  // Check standard format first
  if (DOI_PATTERNS.STANDARD.test(trimmedInput)) {
    return {
      isValid: true,
      normalizedDOI: trimmedInput,
      originalFormat: 'standard'
    };
  }

  // Check prefixed format (doi:10.1234/example)
  const prefixMatch = trimmedInput.match(DOI_PATTERNS.WITH_PREFIX);
  if (prefixMatch) {
    return {
      isValid: true,
      normalizedDOI: prefixMatch[1],
      originalFormat: 'prefixed'
    };
  }

  // Check URL formats
  const urlMatch = trimmedInput.match(DOI_PATTERNS.HTTP_URL) || 
                  trimmedInput.match(DOI_PATTERNS.DX_DOI_URL);
  if (urlMatch) {
    return {
      isValid: true,
      normalizedDOI: urlMatch[1],
      originalFormat: 'url'
    };
  }

  // If no format matches, it's invalid
  return {
    isValid: false,
    originalFormat: 'invalid',
    error: `Invalid DOI format. Expected format: 10.XXXX/XXXXXXX, got: ${trimmedInput}`
  };
}

/**
 * Simple DOI validation (boolean result)
 */
export function isValidDOI(doi: string): boolean {
  return validateAndNormalizeDOI(doi).isValid;
}

// =============================================================================
// Metadata Transformation
// =============================================================================

/**
 * Transform CrossRef response to normalized ResearchArticle
 */
export function transformCrossRefToArticle(crossRefWork: CrossRefWork): ResearchArticle {
  // Extract publication date
  const publishedDate = crossRefWork['published-print'] || crossRefWork['published-online'];
  const dateString = publishedDate?.['date-parts']?.[0] ? 
    formatDateParts(publishedDate['date-parts'][0]) : undefined;

  // Transform authors
  const authors = (crossRefWork.author || []).map(author => ({
    givenName: author.given,
    familyName: author.family,
    fullName: [author.given, author.family].filter(Boolean).join(' ') || 'Unknown Author',
    orcid: author.ORCID,
    affiliations: (author.affiliation || []).map(aff => aff.name)
  }));

  // Extract journal information
  const journal = crossRefWork['container-title']?.[0] ? {
    name: crossRefWork['container-title'][0],
    volume: crossRefWork.volume,
    issue: crossRefWork.issue,
    pages: crossRefWork.page,
    issn: crossRefWork.ISSN
  } : undefined;

  // Extract book information for book chapters
  const book = crossRefWork.type === 'book-chapter' && crossRefWork['container-title']?.[0] ? {
    title: crossRefWork['container-title'][0],
    isbn: crossRefWork.ISBN
  } : undefined;

  return {
    doi: crossRefWork.DOI,
    title: crossRefWork.title[0] || 'Untitled',
    abstract: crossRefWork.abstract,
    publishedDate: dateString,
    journal,
    book,
    authors,
    publisher: crossRefWork.publisher,
    type: crossRefWork.type,
    subjects: crossRefWork.subject || [],
    metrics: {
      referenceCount: crossRefWork['reference-count'] || 0,
      citationCount: crossRefWork['is-referenced-by-count'] || 0
    },
    url: crossRefWork.URL || `https://doi.org/${crossRefWork.DOI}`,
    licenses: (crossRefWork.license || []).map(license => ({
      url: license.URL,
      type: license['content-version']
    })),
    funding: (crossRefWork.funder || []).map(funder => ({
      funderName: funder.name,
      funderDOI: funder.DOI
    })),
    clinicalTrials: (crossRefWork['clinical-trial-number'] || []).map(trial => ({
      number: trial['clinical-trial-number'],
      registry: trial.registry
    }))
  };
}

/**
 * Format date parts array to ISO date string
 */
function formatDateParts(dateParts: number[]): string {
  const [year, month, day] = dateParts;
  if (!year) return '';
  
  const dateStr = [
    year.toString(),
    month ? month.toString().padStart(2, '0') : '01',
    day ? day.toString().padStart(2, '0') : '01'
  ].join('-');
  
  return dateStr;
}

// =============================================================================
// DOI Resolver Client Implementation
// =============================================================================

export class DOIResolver {
  private readonly baseUrl: string;
  private readonly mockMode: boolean;
  private readonly timeout: number;
  private readonly tool: string;
  private readonly email?: string;
  private readonly queue: PQueue;
  private readonly cache = new Map<string, { data: ResearchArticle; timestamp: number }>();
  private readonly enableCache: boolean;
  private readonly cacheTtl: number;

  constructor(config: DOIResolverConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api.crossref.org';
    this.mockMode = config.mockMode || process.env.NODE_ENV === 'development';
    this.timeout = config.timeout || 30000;
    this.tool = config.tool || 'hmhcp-doi-resolver';
    this.email = config.email || process.env.CROSSREF_CONTACT_EMAIL;
    this.enableCache = config.enableCache ?? true;
    this.cacheTtl = config.cacheTtl || 60 * 60 * 1000; // 1 hour

    // Configure polite rate limiting (50 req/sec as per CrossRef guidelines)
    this.queue = new PQueue({
      interval: 1000, // 1 second
      intervalCap: 50, // 50 requests per second (polite pool)
      timeout: this.timeout,
      throwOnTimeout: true
    });
  }

  /**
   * Resolve DOI to research article metadata
   */
  async resolveDOI(doi: string): Promise<DOIResolutionResult> {
    const startTime = Date.now();

    try {
      // Validate and normalize DOI
      const validation = validateAndNormalizeDOI(doi);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          responseTime: Date.now() - startTime
        };
      }

      const normalizedDOI = validation.normalizedDOI!;

      // Check cache first
      if (this.enableCache && this.cache.has(normalizedDOI)) {
        const cached = this.cache.get(normalizedDOI)!;
        if (Date.now() - cached.timestamp < this.cacheTtl) {
          return {
            success: true,
            article: cached.data,
            responseTime: Date.now() - startTime,
            fromCache: true
          };
        } else {
          // Remove expired cache entry
          this.cache.delete(normalizedDOI);
        }
      }

      // Rate limiting check
      const rateLimitResult = await apiRateLimiter.checkLimit(`doi-resolver:${normalizedDOI}`);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 1000)} seconds.`,
          responseTime: Date.now() - startTime
        };
      }

      // Mock mode
      if (this.mockMode) {
        console.log('[DOI Resolver Mock] Simulating resolution:', normalizedDOI);
        await this.simulateDelay(500, 1500);
        
        const mockWork = MOCK_ARTICLES[normalizedDOI];
        if (mockWork) {
          const article = transformCrossRefToArticle(mockWork);
          
          // Cache the result
          if (this.enableCache) {
            this.cache.set(normalizedDOI, { data: article, timestamp: Date.now() });
          }
          
          return {
            success: true,
            article,
            responseTime: Date.now() - startTime
          };
        } else {
          return {
            success: false,
            error: 'DOI not found in mock data',
            responseTime: Date.now() - startTime
          };
        }
      }

      // Resolve with CrossRef API
      const article = await this.queue.add(() => this.performDOIResolution(normalizedDOI));
      
      // Cache the result
      if (this.enableCache && article) {
        this.cache.set(normalizedDOI, { data: article, timestamp: Date.now() });
      }

      return {
        success: true,
        article,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('[DOI Resolver] Resolution error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Resolve multiple DOIs in batch
   */
  async resolveBatch(dois: string[]): Promise<Array<DOIResolutionResult & { doi: string }>> {
    const results = await Promise.allSettled(
      dois.map(async (doi) => {
        const result = await this.resolveDOI(doi);
        return { doi, ...result };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          doi: dois[index],
          success: false,
          error: result.reason?.message || 'Batch resolution failed',
          responseTime: 0
        };
      }
    });
  }

  /**
   * Get resolver statistics
   */
  getStats(): {
    queueSize: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      queueSize: this.queue.size,
      cacheSize: this.cache.size,
      cacheHitRate: 0 // TODO: Implement proper cache hit rate tracking
    };
  }

  /**
   * Clear resolver cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if resolver is in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Perform actual DOI resolution with CrossRef API
   */
  private async performDOIResolution(doi: string): Promise<ResearchArticle> {
    const url = `${this.baseUrl}/works/${encodeURIComponent(doi)}`;
    
    return this.retryRequest(async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': `${this.tool} (healthcare research client; mailto:${this.email || 'noreply@example.com'})`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`DOI not found: ${doi}`);
        }
        throw new Error(`CrossRef API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`CrossRef API returned status: ${data.status}`);
      }

      if (!data.message) {
        throw new Error('Invalid CrossRef API response: missing message');
      }

      return transformCrossRefToArticle(data.message);
    });
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
          console.warn(`[DOI Resolver] Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
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

    if (error.message.includes('CrossRef API error: 5')) {
      return true; // 5xx server error
    }

    if (error.message.includes('CrossRef API error: 429')) {
      return true; // Rate limit error
    }

    // Don't retry 404 errors (DOI not found)
    if (error.message.includes('DOI not found')) {
      return false;
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
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTtl) {
        this.cache.delete(key);
      }
    }
  }
}

// =============================================================================
// Factory Functions and Default Export
// =============================================================================

/**
 * Create DOI resolver with environment-based configuration
 */
export function createDOIResolver(overrides: DOIResolverConfig = {}): DOIResolver {
  const config: DOIResolverConfig = {
    mockMode: process.env.NODE_ENV === 'development' || process.env.DOI_RESOLVER_MOCK_MODE === 'true',
    tool: process.env.CROSSREF_TOOL_NAME || 'hmhcp-doi-resolver',
    email: process.env.CROSSREF_CONTACT_EMAIL,
    timeout: parseInt(process.env.CROSSREF_TIMEOUT || '30000'),
    enableCache: process.env.DOI_RESOLVER_CACHE !== 'false',
    cacheTtl: parseInt(process.env.DOI_RESOLVER_CACHE_TTL || '3600000'), // 1 hour
    ...overrides
  };

  return new DOIResolver(config);
}

/**
 * Default resolver instance
 */
export const doiResolver = createDOIResolver();

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Quick DOI resolution helper function
 */
export async function resolveDOI(doi: string): Promise<ResearchArticle | null> {
  const result = await doiResolver.resolveDOI(doi);
  return result.success ? result.article! : null;
}

/**
 * DOI format detection helper
 */
export function detectDOIFormat(input: string): 'standard' | 'prefixed' | 'url' | 'invalid' {
  return validateAndNormalizeDOI(input).originalFormat;
}

/**
 * Normalize DOI to standard format
 */
export function normalizeDOI(input: string): string | null {
  const result = validateAndNormalizeDOI(input);
  return result.isValid ? result.normalizedDOI! : null;
}

// Cleanup cache periodically (every 10 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    (doiResolver as any).cleanupCache?.();
  }, 10 * 60 * 1000);
}