// Google Search Console API Integration Service
// Healthcare-focused SEO tracking with medical keyword optimization

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { 
  SearchConsoleData, 
  SEOKeywordData,
  GoogleSearchConsoleConfig,
  MedicalKeywordTaxonomy 
} from '@/types/seo-analytics'
import { cacheManager } from '@/lib/cache/redis-cache-manager'
import { logger } from '@/lib/monitoring/logger'

// Medical keyword categories for healthcare SEO
const MEDICAL_KEYWORD_CATEGORIES: MedicalKeywordTaxonomy[] = [
  {
    specialization: 'Cardiology',
    primaryTerms: ['heart disease', 'cardiovascular', 'cardiac care', 'heart health'],
    secondaryTerms: ['arrhythmia', 'hypertension', 'coronary artery disease'],
    symptomTerms: ['chest pain', 'shortness of breath', 'irregular heartbeat'],
    treatmentTerms: ['angioplasty', 'bypass surgery', 'cardiac catheterization'],
    diagnosticTerms: ['ECG', 'echocardiogram', 'stress test', 'cardiac MRI'],
    preventionTerms: ['heart disease prevention', 'cardiac risk factors'],
    researchTerms: ['cardiovascular research', 'cardiac clinical trials'],
    patientEducationTerms: ['living with heart disease', 'cardiac rehabilitation'],
    insuranceTerms: ['cardiac care coverage', 'heart surgery insurance'],
    complianceTerms: ['cardiac care guidelines', 'ACC/AHA guidelines']
  },
  {
    specialization: 'Oncology',
    primaryTerms: ['cancer treatment', 'oncology', 'cancer care', 'tumor'],
    secondaryTerms: ['chemotherapy', 'radiation therapy', 'immunotherapy'],
    symptomTerms: ['cancer symptoms', 'tumor markers', 'cancer pain'],
    treatmentTerms: ['cancer surgery', 'targeted therapy', 'clinical trials'],
    diagnosticTerms: ['biopsy', 'PET scan', 'cancer screening', 'tumor staging'],
    preventionTerms: ['cancer prevention', 'cancer risk factors', 'screening guidelines'],
    researchTerms: ['cancer research', 'oncology clinical trials', 'precision medicine'],
    patientEducationTerms: ['living with cancer', 'cancer support', 'survivorship'],
    insuranceTerms: ['cancer treatment coverage', 'oncology insurance'],
    complianceTerms: ['NCCN guidelines', 'cancer care standards']
  },
  {
    specialization: 'Neurology',
    primaryTerms: ['neurological disorders', 'brain health', 'neurology', 'nervous system'],
    secondaryTerms: ['stroke', 'epilepsy', 'Parkinson\'s', 'Alzheimer\'s', 'multiple sclerosis'],
    symptomTerms: ['headache', 'seizures', 'memory loss', 'tremors', 'numbness'],
    treatmentTerms: ['neurosurgery', 'deep brain stimulation', 'neurological rehabilitation'],
    diagnosticTerms: ['MRI brain', 'EEG', 'nerve conduction study', 'lumbar puncture'],
    preventionTerms: ['stroke prevention', 'brain health tips', 'neurological wellness'],
    researchTerms: ['neuroscience research', 'neurological clinical trials'],
    patientEducationTerms: ['neurological conditions', 'brain injury recovery'],
    insuranceTerms: ['neurological care coverage', 'neurosurgery insurance'],
    complianceTerms: ['AAN guidelines', 'neurological care standards']
  },
  {
    specialization: 'Orthopedics',
    primaryTerms: ['orthopedic surgery', 'bone health', 'joint replacement', 'orthopedics'],
    secondaryTerms: ['arthritis', 'fractures', 'sports injuries', 'spine surgery'],
    symptomTerms: ['joint pain', 'back pain', 'knee pain', 'hip pain'],
    treatmentTerms: ['joint replacement', 'arthroscopy', 'physical therapy'],
    diagnosticTerms: ['X-ray', 'bone scan', 'MRI joint', 'CT scan'],
    preventionTerms: ['injury prevention', 'bone health', 'fall prevention'],
    researchTerms: ['orthopedic research', 'joint replacement studies'],
    patientEducationTerms: ['recovery after surgery', 'living with arthritis'],
    insuranceTerms: ['orthopedic surgery coverage', 'joint replacement insurance'],
    complianceTerms: ['AAOS guidelines', 'orthopedic care standards']
  }
]

export class GoogleSearchConsoleService {
  private oauth2Client: OAuth2Client
  private searchConsole: any
  private config: GoogleSearchConsoleConfig
  private rateLimitRemaining: number = 1200 // Daily limit
  private rateLimitReset: Date
  private cacheKeyPrefix = 'seo:gsc:'

  constructor(config: GoogleSearchConsoleConfig) {
    this.config = config
    this.rateLimitReset = new Date()
    this.rateLimitReset.setHours(24, 0, 0, 0) // Reset at midnight

    // Initialize OAuth2 client
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )

    // Set credentials if we have a refresh token
    if (config.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: config.refreshToken,
        access_token: config.accessToken
      })
    }

    // Initialize Search Console API
    this.searchConsole = google.searchconsole({
      version: 'v1',
      auth: this.oauth2Client
    })
  }

  /**
   * Get search analytics data with healthcare keyword focus
   */
  async getSearchAnalytics(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query', 'page'],
    rowLimit: number = 1000
  ): Promise<SearchConsoleData> {
    const cacheKey = `${this.cacheKeyPrefix}analytics:${startDate}:${endDate}:${dimensions.join(',')}`
    
    try {
      // Check cache first
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        logger.info('Returning cached Search Console data')
        return cached as SearchConsoleData
      }

      // Check rate limit
      if (!this.checkRateLimit()) {
        logger.warn('Search Console API rate limit reached, using fallback')
        return await this.getFallbackData(cacheKey)
      }

      // Make API request
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.config.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          startRow: 0,
          aggregationType: 'byProperty',
          dimensionFilterGroups: this.getHealthcareFilters()
        }
      })

      // Process and categorize data
      const processedData = await this.processSearchData(response.data)
      
      // Cache for 24 hours
      await cacheManager.set(cacheKey, processedData, 24 * 60 * 60)
      
      // Update rate limit
      this.rateLimitRemaining--
      
      return processedData
    } catch (error) {
      logger.error('Error fetching Search Console data:', error)
      return await this.getFallbackData(cacheKey)
    }
  }

  /**
   * Get healthcare keyword rankings
   */
  async getHealthcareKeywordRankings(): Promise<SEOKeywordData[]> {
    const cacheKey = `${this.cacheKeyPrefix}keywords:healthcare`
    
    try {
      // Check cache
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        return cached as SEOKeywordData[]
      }

      // Batch queries for efficiency
      const keywordData: SEOKeywordData[] = []
      
      for (const category of MEDICAL_KEYWORD_CATEGORIES) {
        const allTerms = [
          ...category.primaryTerms,
          ...category.secondaryTerms,
          ...category.symptomTerms,
          ...category.treatmentTerms
        ]

        // Batch API calls
        const batchSize = 50
        for (let i = 0; i < allTerms.length; i += batchSize) {
          const batch = allTerms.slice(i, i + batchSize)
          const rankings = await this.getKeywordBatch(batch, category.specialization)
          keywordData.push(...rankings)
        }
      }

      // Sort by position (best rankings first)
      keywordData.sort((a, b) => a.position - b.position)
      
      // Cache for 6 hours
      await cacheManager.set(cacheKey, keywordData, 6 * 60 * 60)
      
      return keywordData
    } catch (error) {
      logger.error('Error fetching healthcare keyword rankings:', error)
      return []
    }
  }

  /**
   * Get keyword batch rankings
   */
  private async getKeywordBatch(
    keywords: string[],
    specialization: string
  ): Promise<SEOKeywordData[]> {
    if (!this.checkRateLimit()) {
      return []
    }

    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 28) // Last 28 days

      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.config.siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          dimensionFilterGroups: [{
            filters: keywords.map(keyword => ({
              dimension: 'query',
              operator: 'contains',
              expression: keyword
            }))
          }],
          rowLimit: 100
        }
      })

      this.rateLimitRemaining--

      return this.processKeywordData(response.data, specialization)
    } catch (error) {
      logger.error('Error in keyword batch query:', error)
      return []
    }
  }

  /**
   * Process raw search data into structured format
   */
  private async processSearchData(data: any): Promise<SearchConsoleData> {
    const processed: SearchConsoleData = {
      queries: [],
      pages: [],
      countries: [],
      devices: [],
      searchAppearance: {
        richResults: 0,
        featuredSnippets: 0,
        videoResults: 0,
        faqResults: 0,
        medicalSchemaResults: 0
      }
    }

    if (!data.rows) return processed

    for (const row of data.rows) {
      const metrics = {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }

      // Process by dimension type
      if (row.keys) {
        const [dimension, value] = row.keys
        
        switch (dimension) {
          case 'query':
            processed.queries.push({
              query: value,
              ...metrics,
              medicalCategory: this.categorizeQuery(value)
            })
            break
          
          case 'page':
            processed.pages.push({
              page: value,
              ...metrics,
              contentType: this.categorizePageType(value)
            })
            break
          
          case 'country':
            processed.countries.push({
              country: value,
              ...metrics
            })
            break
          
          case 'device':
            processed.devices.push({
              device: value as 'DESKTOP' | 'MOBILE' | 'TABLET',
              ...metrics
            })
            break
        }
      }
    }

    // Detect rich results and medical schema
    processed.searchAppearance.medicalSchemaResults = 
      processed.queries.filter(q => q.medicalCategory !== undefined).length

    return processed
  }

  /**
   * Process keyword data into SEO format
   */
  private processKeywordData(data: any, specialization: string): SEOKeywordData[] {
    if (!data.rows) return []

    return data.rows.map((row: any) => {
      const keyword = row.keys[0]
      const currentPosition = row.position || 999
      
      return {
        keyword,
        category: 'medical_specialization',
        position: currentPosition,
        previousPosition: currentPosition, // Would need historical data
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        avgPosition: currentPosition,
        trend: 'stable', // Would need historical comparison
        medicalAccuracy: true,
        specialization
      }
    })
  }

  /**
   * Categorize query as medical category
   */
  private categorizeQuery(query: string): string | undefined {
    const lowerQuery = query.toLowerCase()
    
    for (const category of MEDICAL_KEYWORD_CATEGORIES) {
      const allTerms = [
        ...category.primaryTerms,
        ...category.secondaryTerms,
        ...category.symptomTerms,
        ...category.treatmentTerms,
        ...category.diagnosticTerms
      ]
      
      if (allTerms.some(term => lowerQuery.includes(term.toLowerCase()))) {
        return category.specialization
      }
    }
    
    return undefined
  }

  /**
   * Categorize page type based on URL
   */
  private categorizePageType(url: string): 'blog' | 'service' | 'platform' | 'research' | 'other' {
    if (url.includes('/blog/')) return 'blog'
    if (url.includes('/services/')) return 'service'
    if (url.includes('/platforms/')) return 'platform'
    if (url.includes('/research/')) return 'research'
    return 'other'
  }

  /**
   * Get healthcare-specific filters
   */
  private getHealthcareFilters(): any[] {
    return [{
      filters: [
        {
          dimension: 'query',
          operator: 'contains',
          expression: 'healthcare'
        },
        {
          dimension: 'query',
          operator: 'contains',
          expression: 'medical'
        },
        {
          dimension: 'query',
          operator: 'contains',
          expression: 'clinical'
        },
        {
          dimension: 'query',
          operator: 'contains',
          expression: 'patient'
        },
        {
          dimension: 'query',
          operator: 'contains',
          expression: 'treatment'
        }
      ],
      groupType: 'or'
    }]
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = new Date()
    
    // Reset counter if past reset time
    if (now >= this.rateLimitReset) {
      this.rateLimitRemaining = 1200
      this.rateLimitReset = new Date()
      this.rateLimitReset.setHours(24, 0, 0, 0)
    }
    
    return this.rateLimitRemaining > 0
  }

  /**
   * Get fallback data from cache or static data
   */
  private async getFallbackData(cacheKey: string): Promise<SearchConsoleData> {
    // Try to get stale cache data
    const staleData = await cacheManager.get(cacheKey, { includeStale: true })
    if (staleData) {
      logger.info('Using stale cache data as fallback')
      return staleData as SearchConsoleData
    }

    // Return minimal fallback structure
    return {
      queries: [],
      pages: [],
      countries: [],
      devices: [],
      searchAppearance: {
        richResults: 0,
        featuredSnippets: 0,
        videoResults: 0,
        faqResults: 0,
        medicalSchemaResults: 0
      }
    }
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo() {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset.toISOString(),
      dailyLimit: 1200
    }
  }

  /**
   * Refresh OAuth token if needed
   */
  async refreshAccessToken(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      this.oauth2Client.setCredentials(credentials)
      
      if (credentials.access_token) {
        this.config.accessToken = credentials.access_token
        this.config.tokenExpiry = credentials.expiry_date || Date.now() + 3600000
      }
    } catch (error) {
      logger.error('Error refreshing access token:', error)
      throw error
    }
  }
}

// Export singleton instance
export const searchConsoleService = new GoogleSearchConsoleService({
  clientId: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI || 'https://healthcare.com/api/auth/google/callback',
  refreshToken: process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN,
  siteUrl: 'https://healthcare.com',
  apiVersion: 'v1'
})