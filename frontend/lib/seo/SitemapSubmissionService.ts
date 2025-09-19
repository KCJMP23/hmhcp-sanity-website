// Sitemap Submission Service
// Created: 2025-01-27
// Purpose: Handle sitemap submission to search engines

export interface SearchEngineConfig {
  name: string;
  apiEndpoint: string;
  apiKey?: string;
  requiresAuth: boolean;
  maxSitemaps: number;
  supportedFormats: string[];
  submissionMethod: 'api' | 'ping' | 'webmaster-tools';
}

export interface SubmissionResult {
  success: boolean;
  searchEngine: string;
  sitemapUrl: string;
  submittedAt: Date;
  responseCode: number;
  responseMessage: string;
  indexedUrls?: number;
  totalUrls?: number;
  errors?: string[];
}

export interface SubmissionStatus {
  sitemapUrl: string;
  searchEngine: string;
  status: 'pending' | 'submitted' | 'indexed' | 'error' | 'rejected';
  lastChecked: Date;
  indexedUrls: number;
  totalUrls: number;
  crawlErrors: number;
  lastCrawled?: Date;
  nextCrawl?: Date;
}

export interface SearchEnginePing {
  searchEngine: string;
  sitemapUrl: string;
  pingUrl: string;
  lastPinged: Date;
  success: boolean;
  response?: string;
}

export class SitemapSubmissionService {
  private searchEngines: Map<string, SearchEngineConfig> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.initializeSearchEngines();
  }

  async submitSitemap(sitemapUrl: string, searchEngines: string[]): Promise<SubmissionResult[]> {
    const results: SubmissionResult[] = [];

    for (const searchEngine of searchEngines) {
      try {
        const result = await this.submitToSearchEngine(sitemapUrl, searchEngine);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          searchEngine,
          sitemapUrl,
          submittedAt: new Date(),
          responseCode: 500,
          responseMessage: error instanceof Error ? error.message : 'Unknown error',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  async pingSearchEngines(sitemapUrl: string): Promise<SearchEnginePing[]> {
    const pings: SearchEnginePing[] = [];

    for (const [name, config] of this.searchEngines) {
      if (config.submissionMethod === 'ping') {
        try {
          const ping = await this.pingSearchEngine(sitemapUrl, name, config);
          pings.push(ping);
        } catch (error) {
          pings.push({
            searchEngine: name,
            sitemapUrl,
            pingUrl: config.apiEndpoint,
            lastPinged: new Date(),
            success: false,
            response: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return pings;
  }

  async checkSubmissionStatus(sitemapUrl: string, searchEngine: string): Promise<SubmissionStatus> {
    const config = this.searchEngines.get(searchEngine);
    if (!config) {
      throw new Error(`Search engine ${searchEngine} not configured`);
    }

    try {
      const status = await this.getSubmissionStatusFromSearchEngine(sitemapUrl, searchEngine, config);
      return status;
    } catch (error) {
      throw new Error(`Failed to check submission status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSubmissionHistory(organizationId: string): Promise<SubmissionResult[]> {
    try {
      // In a real implementation, this would fetch from database
      const history: SubmissionResult[] = [];
      
      return history;
    } catch (error) {
      throw new Error(`Failed to get submission history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resubmitSitemap(sitemapUrl: string, searchEngines: string[]): Promise<SubmissionResult[]> {
    // First, check if sitemap has been updated
    const sitemapLastModified = await this.getSitemapLastModified(sitemapUrl);
    const lastSubmission = await this.getLastSubmissionTime(sitemapUrl);
    
    if (sitemapLastModified <= lastSubmission) {
      throw new Error('Sitemap has not been updated since last submission');
    }

    // Resubmit to search engines
    return await this.submitSitemap(sitemapUrl, searchEngines);
  }

  async validateSitemapForSubmission(sitemapUrl: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    try {
      // Check sitemap accessibility
      const isAccessible = await this.checkSitemapAccessibility(sitemapUrl);
      if (!isAccessible) {
        return {
          isValid: false,
          errors: ['Sitemap is not accessible'],
          warnings: [],
          recommendations: ['Ensure sitemap is publicly accessible']
        };
      }

      // Check sitemap format
      const formatValidation = await this.validateSitemapFormat(sitemapUrl);
      
      // Check sitemap size
      const sizeValidation = await this.validateSitemapSize(sitemapUrl);
      
      // Check URL count
      const urlCountValidation = await this.validateUrlCount(sitemapUrl);

      const errors: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (!formatValidation.isValid) {
        errors.push(...formatValidation.errors);
      }

      if (!sizeValidation.isValid) {
        errors.push(...sizeValidation.errors);
      }

      if (!urlCountValidation.isValid) {
        warnings.push(...urlCountValidation.warnings);
      }

      // Add recommendations
      if (formatValidation.recommendations) {
        recommendations.push(...formatValidation.recommendations);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        recommendations
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        recommendations: []
      };
    }
  }

  // Private helper methods
  private initializeSearchEngines(): void {
    this.searchEngines.set('google', {
      name: 'Google',
      apiEndpoint: 'https://www.google.com/ping?sitemap=',
      requiresAuth: false,
      maxSitemaps: 500,
      supportedFormats: ['xml', 'txt', 'gz'],
      submissionMethod: 'ping'
    });

    this.searchEngines.set('bing', {
      name: 'Bing',
      apiEndpoint: 'https://www.bing.com/ping?sitemap=',
      requiresAuth: false,
      maxSitemaps: 500,
      supportedFormats: ['xml', 'txt', 'gz'],
      submissionMethod: 'ping'
    });

    this.searchEngines.set('yandex', {
      name: 'Yandex',
      apiEndpoint: 'https://webmaster.yandex.com/ping?sitemap=',
      requiresAuth: false,
      maxSitemaps: 1000,
      supportedFormats: ['xml', 'txt', 'gz'],
      submissionMethod: 'ping'
    });

    this.searchEngines.set('baidu', {
      name: 'Baidu',
      apiEndpoint: 'https://www.baidu.com/ping?sitemap=',
      requiresAuth: false,
      maxSitemaps: 500,
      supportedFormats: ['xml', 'txt'],
      submissionMethod: 'ping'
    });
  }

  private async submitToSearchEngine(sitemapUrl: string, searchEngine: string): Promise<SubmissionResult> {
    const config = this.searchEngines.get(searchEngine);
    if (!config) {
      throw new Error(`Search engine ${searchEngine} not configured`);
    }

    try {
      let response: Response;
      
      switch (config.submissionMethod) {
        case 'ping':
          response = await this.pingSitemap(sitemapUrl, config);
          break;
        case 'api':
          response = await this.submitViaApi(sitemapUrl, config);
          break;
        case 'webmaster-tools':
          response = await this.submitViaWebmasterTools(sitemapUrl, config);
          break;
        default:
          throw new Error(`Unsupported submission method: ${config.submissionMethod}`);
      }

      const responseText = await response.text();
      
      return {
        success: response.ok,
        searchEngine,
        sitemapUrl,
        submittedAt: new Date(),
        responseCode: response.status,
        responseMessage: responseText,
        indexedUrls: this.extractIndexedUrls(responseText),
        totalUrls: this.extractTotalUrls(responseText)
      };

    } catch (error) {
      throw new Error(`Submission to ${searchEngine} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async pingSitemap(sitemapUrl: string, config: SearchEngineConfig): Promise<Response> {
    const pingUrl = `${config.apiEndpoint}${encodeURIComponent(sitemapUrl)}`;
    
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Healthcare-SEO-Manager/1.0'
      }
    });

    return response;
  }

  private async submitViaApi(sitemapUrl: string, config: SearchEngineConfig): Promise<Response> {
    if (!config.apiKey) {
      throw new Error(`API key required for ${config.name}`);
    }

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sitemapUrl,
        submittedAt: new Date().toISOString()
      })
    });

    return response;
  }

  private async submitViaWebmasterTools(sitemapUrl: string, config: SearchEngineConfig): Promise<Response> {
    // Simulate webmaster tools submission
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        sitemap: sitemapUrl
      })
    });

    return response;
  }

  private async pingSearchEngine(sitemapUrl: string, searchEngine: string, config: SearchEngineConfig): Promise<SearchEnginePing> {
    const pingUrl = `${config.apiEndpoint}${encodeURIComponent(sitemapUrl)}`;
    
    try {
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Healthcare-SEO-Manager/1.0'
        }
      });

      const responseText = await response.text();

      return {
        searchEngine,
        sitemapUrl,
        pingUrl,
        lastPinged: new Date(),
        success: response.ok,
        response: responseText
      };

    } catch (error) {
      return {
        searchEngine,
        sitemapUrl,
        pingUrl,
        lastPinged: new Date(),
        success: false,
        response: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getSubmissionStatusFromSearchEngine(sitemapUrl: string, searchEngine: string, config: SearchEngineConfig): Promise<SubmissionStatus> {
    // Simulate status check
    return {
      sitemapUrl,
      searchEngine,
      status: 'indexed',
      lastChecked: new Date(),
      indexedUrls: Math.floor(Math.random() * 100),
      totalUrls: 100,
      crawlErrors: Math.floor(Math.random() * 10),
      lastCrawled: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      nextCrawl: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
    };
  }

  private async getSitemapLastModified(sitemapUrl: string): Promise<Date> {
    // Simulate last modified check
    return new Date();
  }

  private async getLastSubmissionTime(sitemapUrl: string): Promise<Date> {
    // Simulate last submission time check
    return new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
  }

  private async checkSitemapAccessibility(sitemapUrl: string): Promise<boolean> {
    try {
      const response = await fetch(sitemapUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Healthcare-SEO-Manager/1.0'
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async validateSitemapFormat(sitemapUrl: string): Promise<{
    isValid: boolean;
    errors: string[];
    recommendations?: string[];
  }> {
    try {
      const response = await fetch(sitemapUrl);
      const content = await response.text();
      
      // Basic XML validation
      if (!content.includes('<?xml')) {
        return {
          isValid: false,
          errors: ['Sitemap is not valid XML'],
          recommendations: ['Ensure sitemap starts with XML declaration']
        };
      }

      if (!content.includes('<urlset') && !content.includes('<sitemapindex')) {
        return {
          isValid: false,
          errors: ['Sitemap does not contain valid urlset or sitemapindex'],
          recommendations: ['Use proper sitemap XML structure']
        };
      }

      return {
        isValid: true,
        errors: []
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate sitemap format: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private async validateSitemapSize(sitemapUrl: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    try {
      const response = await fetch(sitemapUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      
      if (contentLength) {
        const sizeInMB = parseInt(contentLength) / (1024 * 1024);
        
        if (sizeInMB > 50) {
          return {
            isValid: false,
            errors: [`Sitemap size (${sizeInMB.toFixed(2)}MB) exceeds 50MB limit`]
          };
        }
      }

      return {
        isValid: true,
        errors: []
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate sitemap size: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private async validateUrlCount(sitemapUrl: string): Promise<{
    isValid: boolean;
    warnings: string[];
  }> {
    try {
      const response = await fetch(sitemapUrl);
      const content = await response.text();
      
      // Count URLs in sitemap
      const urlMatches = content.match(/<url>/g);
      const urlCount = urlMatches ? urlMatches.length : 0;
      
      const warnings: string[] = [];
      
      if (urlCount > 50000) {
        warnings.push(`Sitemap contains ${urlCount} URLs, consider splitting into multiple sitemaps`);
      }

      return {
        isValid: true,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        warnings: [`Failed to validate URL count: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private extractIndexedUrls(responseText: string): number | undefined {
    // Extract indexed URL count from response
    const match = responseText.match(/indexed[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractTotalUrls(responseText: string): number | undefined {
    // Extract total URL count from response
    const match = responseText.match(/total[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : undefined;
  }
}
