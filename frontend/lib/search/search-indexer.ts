/**
 * Search Indexer for Healthcare Publications
 * Handles content indexing and search vector updates
 * Story 3.7c Task 3: Full-Text Search Implementation
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import logger from '@/lib/logging/winston-logger'
import { clearCachedResults } from '@/lib/cache/redis-cache'

export interface IndexingOptions {
  batchSize?: number
  skipExisting?: boolean
  updateVectors?: boolean
  calculateRanks?: boolean
  onProgress?: (progress: IndexingProgress) => void
}

export interface IndexingProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  currentOperation: string
  startTime: Date
  estimatedTimeRemaining?: number
}

export interface IndexingResult {
  success: boolean
  processed: number
  succeeded: number
  failed: number
  duration: number
  errors: string[]
}

export interface HealthcareTerms {
  medicalTerms: string[]
  drugNames: string[]
  diseases: string[]
  procedures: string[]
  abbreviations: Map<string, string>
}

export class SearchIndexer {
  private supabase: any
  private healthcareTerms: HealthcareTerms | null = null

  constructor() {
    this.supabase = null
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient()
    }
    return this.supabase
  }

  /**
   * Index all publications in the database
   */
  async indexAllPublications(options: IndexingOptions = {}): Promise<IndexingResult> {
    const startTime = Date.now()
    const batchSize = options.batchSize || 100
    let processed = 0
    let succeeded = 0
    let failed = 0
    const errors: string[] = []

    try {
      const supabase = await this.getSupabase()

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('publications')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw new Error(`Failed to get publication count: ${countError.message}`)
      }

      const total = totalCount || 0
      logger.info('Starting publication indexing', { total, batchSize })

      // Initialize healthcare terms if needed
      if (!this.healthcareTerms) {
        await this.loadHealthcareTerms()
      }

      // Process in batches
      let offset = 0
      while (offset < total) {
        try {
          const batchResult = await this.indexBatch(offset, batchSize, options)
          processed += batchResult.processed
          succeeded += batchResult.succeeded
          failed += batchResult.failed
          errors.push(...batchResult.errors)

          // Report progress
          if (options.onProgress) {
            const progress: IndexingProgress = {
              total,
              processed,
              succeeded,
              failed,
              currentOperation: `Processing batch ${Math.floor(offset / batchSize) + 1}`,
              startTime: new Date(startTime),
              estimatedTimeRemaining: this.estimateTimeRemaining(startTime, processed, total)
            }
            options.onProgress(progress)
          }

          offset += batchSize
        } catch (batchError) {
          logger.error('Batch indexing failed', { 
            offset, 
            batchSize, 
            error: batchError instanceof Error ? batchError.message : 'Unknown error' 
          })
          failed += batchSize
          errors.push(`Batch ${offset}-${offset + batchSize}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
          offset += batchSize
        }
      }

      const duration = Date.now() - startTime
      logger.info('Publication indexing completed', {
        processed,
        succeeded,
        failed,
        duration,
        errorsCount: errors.length
      })

      // Clear search cache after indexing
      await this.clearSearchCache()

      return {
        success: failed === 0,
        processed,
        succeeded,
        failed,
        duration,
        errors
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Publication indexing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processed,
        succeeded,
        failed,
        duration
      })

      return {
        success: false,
        processed,
        succeeded,
        failed,
        duration,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Index a specific publication by ID
   */
  async indexPublication(publicationId: string): Promise<IndexingResult> {
    const startTime = Date.now()
    
    try {
      const supabase = await this.getSupabase()
      
      // Get the publication
      const { data: publication, error } = await supabase
        .from('publications')
        .select('*')
        .eq('id', publicationId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch publication: ${error.message}`)
      }

      if (!publication) {
        throw new Error('Publication not found')
      }

      // Initialize healthcare terms if needed
      if (!this.healthcareTerms) {
        await this.loadHealthcareTerms()
      }

      // Process the publication
      const processedPublication = await this.processPublication(publication)
      
      // Update the publication with search vectors
      const { error: updateError } = await supabase
        .from('publications')
        .update({
          search_vector: null, // This will trigger the database function to recalculate
          indexed_at: new Date().toISOString()
        })
        .eq('id', publicationId)

      if (updateError) {
        throw new Error(`Failed to update search vectors: ${updateError.message}`)
      }

      const duration = Date.now() - startTime
      logger.info('Publication indexed successfully', { publicationId, duration })

      // Clear related cache entries
      await this.clearPublicationCache(publicationId)

      return {
        success: true,
        processed: 1,
        succeeded: 1,
        failed: 0,
        duration,
        errors: []
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Publication indexing failed', {
        publicationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })

      return {
        success: false,
        processed: 1,
        succeeded: 0,
        failed: 1,
        duration,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Index a batch of publications
   */
  private async indexBatch(offset: number, batchSize: number, options: IndexingOptions): Promise<IndexingResult> {
    const supabase = await this.getSupabase()
    let processed = 0
    let succeeded = 0
    let failed = 0
    const errors: string[] = []

    // Fetch batch
    let query = supabase
      .from('publications')
      .select('*')
      .range(offset, offset + batchSize - 1)

    if (options.skipExisting) {
      query = query.or('search_vector.is.null,indexed_at.is.null')
    }

    const { data: publications, error } = await query

    if (error) {
      throw new Error(`Failed to fetch batch: ${error.message}`)
    }

    if (!publications || publications.length === 0) {
      return { success: true, processed: 0, succeeded: 0, failed: 0, duration: 0, errors: [] }
    }

    // Process each publication
    for (const publication of publications) {
      try {
        await this.processAndUpdatePublication(publication)
        succeeded++
      } catch (error) {
        failed++
        errors.push(`Publication ${publication.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        logger.warn('Failed to index publication', {
          publicationId: publication.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      processed++
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      duration: 0,
      errors
    }
  }

  /**
   * Process and update a single publication with enhanced search data
   */
  private async processAndUpdatePublication(publication: any): Promise<void> {
    const supabase = await this.getSupabase()
    
    // Process the publication
    const processed = await this.processPublication(publication)
    
    // Extract additional searchable content
    const enhancedData = await this.enhancePublicationData(processed)
    
    // Update publication with enhanced data
    const { error } = await supabase
      .from('publications')
      .update({
        ...enhancedData,
        search_vector: null, // Trigger recalculation
        indexed_at: new Date().toISOString()
      })
      .eq('id', publication.id)

    if (error) {
      throw new Error(`Failed to update publication: ${error.message}`)
    }
  }

  /**
   * Process a publication and extract searchable content
   */
  private async processPublication(publication: any): Promise<any> {
    // Normalize and clean text fields
    const processedPublication = {
      ...publication,
      title: this.cleanText(publication.title),
      abstract: this.cleanText(publication.abstract),
      journal: this.cleanText(publication.journal)
    }

    // Process authors
    if (publication.authors) {
      processedPublication.authors = this.processAuthors(publication.authors)
    }

    // Extract and enhance keywords
    processedPublication.keywords = await this.extractKeywords(publication)

    // Categorize content
    processedPublication.categories = await this.categorizeContent(publication)

    // Calculate publication metrics
    processedPublication.search_rank = this.calculateSearchRank(processedPublication)

    return processedPublication
  }

  /**
   * Enhance publication data with additional searchable content
   */
  private async enhancePublicationData(publication: any): Promise<any> {
    const enhancements: any = {}

    // Extract year if not present
    if (!publication.year && publication.publication_date) {
      enhancements.year = new Date(publication.publication_date).getFullYear()
    }

    // Determine publication type if not set
    if (!publication.publication_type && publication.journal) {
      enhancements.publication_type = this.determinePublicationType(publication)
    }

    // Set default values for metrics if not present
    enhancements.citation_count = publication.citation_count || 0
    enhancements.view_count = publication.view_count || 0
    enhancements.download_count = publication.download_count || 0

    return enhancements
  }

  /**
   * Clean and normalize text for better searchability
   */
  private cleanText(text: string): string {
    if (!text) return ''
    
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-_.]/g, ' ') // Remove special characters but keep hyphens, underscores, periods
      .trim()
  }

  /**
   * Process authors data for consistent search
   */
  private processAuthors(authors: any[]): any[] {
    if (!Array.isArray(authors)) return []
    
    return authors.map(author => {
      if (typeof author === 'string') {
        return { name: this.cleanText(author) }
      }
      return {
        name: this.cleanText(author.name || ''),
        email: author.email || undefined,
        affiliation: this.cleanText(author.affiliation || '')
      }
    })
  }

  /**
   * Extract and enhance keywords using healthcare terminology
   */
  private async extractKeywords(publication: any): Promise<string[]> {
    const keywords = new Set<string>()
    
    // Add existing keywords
    if (Array.isArray(publication.keywords)) {
      publication.keywords.forEach(keyword => keywords.add(keyword.toLowerCase()))
    }

    // Extract keywords from title and abstract
    const text = `${publication.title || ''} ${publication.abstract || ''}`.toLowerCase()
    
    // Add healthcare terms found in text
    if (this.healthcareTerms) {
      this.healthcareTerms.medicalTerms.forEach(term => {
        if (text.includes(term.toLowerCase())) {
          keywords.add(term)
        }
      })
      
      this.healthcareTerms.drugNames.forEach(drug => {
        if (text.includes(drug.toLowerCase())) {
          keywords.add(drug)
        }
      })
      
      this.healthcareTerms.diseases.forEach(disease => {
        if (text.includes(disease.toLowerCase())) {
          keywords.add(disease)
        }
      })
    }

    return Array.from(keywords).slice(0, 20) // Limit to 20 keywords
  }

  /**
   * Categorize publication content
   */
  private async categorizeContent(publication: any): Promise<string[]> {
    const categories = new Set<string>()
    const text = `${publication.title || ''} ${publication.abstract || ''}`.toLowerCase()
    
    // Basic medical categories based on keywords
    const categoryMap = {
      'Artificial Intelligence': ['ai', 'artificial intelligence', 'machine learning', 'neural network', 'deep learning'],
      'Clinical Trials': ['clinical trial', 'randomized', 'controlled trial', 'rct', 'study protocol'],
      'Telemedicine': ['telemedicine', 'telehealth', 'remote', 'virtual care', 'digital health'],
      'Genomics': ['genomics', 'genetic', 'dna', 'biomarker', 'personalized medicine'],
      'Public Health': ['public health', 'epidemiology', 'population health', 'community health'],
      'Medical Imaging': ['imaging', 'radiology', 'mri', 'ct scan', 'ultrasound', 'x-ray'],
      'Surgery': ['surgery', 'surgical', 'operation', 'procedure', 'operative'],
      'Cardiology': ['cardiac', 'heart', 'cardiovascular', 'cardiology'],
      'Oncology': ['cancer', 'oncology', 'tumor', 'malignant', 'chemotherapy'],
      'Neurology': ['neurology', 'brain', 'neurological', 'cognitive', 'dementia']
    }
    
    Object.entries(categoryMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        categories.add(category)
      }
    })
    
    return Array.from(categories)
  }

  /**
   * Calculate search rank based on various factors
   */
  private calculateSearchRank(publication: any): number {
    let rank = 0.0
    
    // Citation count impact (logarithmic scale)
    if (publication.citation_count > 0) {
      rank += 0.3 * Math.log(publication.citation_count + 1)
    }
    
    // View count impact
    if (publication.view_count > 0) {
      rank += 0.2 * Math.log(publication.view_count + 1)
    }
    
    // Download count impact
    if (publication.download_count > 0) {
      rank += 0.1 * Math.log(publication.download_count + 1)
    }
    
    // Impact factor
    if (publication.impact_factor > 0) {
      rank += 0.2 * publication.impact_factor
    }
    
    // Open access bonus
    if (publication.is_open_access) {
      rank += 0.1
    }
    
    // Recency bonus (publications from last 2 years)
    if (publication.year >= new Date().getFullYear() - 2) {
      rank += 0.1
    }
    
    // Content completeness bonus
    if (publication.abstract && publication.abstract.length > 100) {
      rank += 0.05
    }
    
    if (publication.keywords && publication.keywords.length > 3) {
      rank += 0.05
    }
    
    return Math.round(rank * 1000) / 1000 // Round to 3 decimal places
  }

  /**
   * Determine publication type based on journal and content
   */
  private determinePublicationType(publication: any): string {
    const journal = (publication.journal || '').toLowerCase()
    const title = (publication.title || '').toLowerCase()
    
    if (journal.includes('conference') || title.includes('proceedings')) {
      return 'conference'
    }
    
    if (journal.includes('workshop') || title.includes('workshop')) {
      return 'conference'
    }
    
    if (title.includes('white paper') || journal.includes('technical report')) {
      return 'white-paper'
    }
    
    if (journal.includes('book') || title.includes('chapter')) {
      return 'book-chapter'
    }
    
    return 'peer-reviewed'
  }

  /**
   * Load healthcare terminology for enhanced indexing
   */
  private async loadHealthcareTerms(): Promise<void> {
    // In a production system, this would load from a comprehensive medical dictionary
    // For now, we'll use a basic set of terms
    this.healthcareTerms = {
      medicalTerms: [
        'artificial intelligence', 'machine learning', 'clinical trial', 'patient outcomes',
        'telemedicine', 'health informatics', 'electronic health records', 'biomarkers',
        'genomics', 'personalized medicine', 'population health', 'preventive care',
        'medical imaging', 'diagnostic accuracy', 'therapeutic intervention', 'clinical decision support',
        'quality metrics', 'patient safety', 'healthcare analytics', 'predictive modeling'
      ],
      drugNames: [
        'insulin', 'metformin', 'aspirin', 'acetaminophen', 'ibuprofen', 'antibiotics',
        'statins', 'beta blockers', 'ace inhibitors', 'chemotherapy', 'immunotherapy'
      ],
      diseases: [
        'diabetes', 'hypertension', 'cancer', 'cardiovascular disease', 'alzheimer',
        'covid-19', 'influenza', 'pneumonia', 'asthma', 'depression', 'anxiety',
        'stroke', 'heart attack', 'kidney disease', 'liver disease'
      ],
      procedures: [
        'surgery', 'biopsy', 'endoscopy', 'catheterization', 'transplant', 'dialysis',
        'chemotherapy', 'radiation therapy', 'physical therapy', 'rehabilitation'
      ],
      abbreviations: new Map([
        ['AI', 'Artificial Intelligence'],
        ['ML', 'Machine Learning'],
        ['EHR', 'Electronic Health Record'],
        ['EMR', 'Electronic Medical Record'],
        ['CT', 'Computed Tomography'],
        ['MRI', 'Magnetic Resonance Imaging'],
        ['ICU', 'Intensive Care Unit'],
        ['ER', 'Emergency Room'],
        ['OR', 'Operating Room']
      ])
    }
  }

  /**
   * Estimate time remaining for batch processing
   */
  private estimateTimeRemaining(startTime: number, processed: number, total: number): number {
    if (processed === 0) return 0
    
    const elapsed = Date.now() - startTime
    const rate = processed / elapsed // items per ms
    const remaining = total - processed
    
    return Math.round(remaining / rate)
  }

  /**
   * Clear search-related cache entries
   */
  private async clearSearchCache(): Promise<void> {
    try {
      // Clear Redis cache entries related to search
      await clearCachedResults('search:*')
      logger.info('Search cache cleared after indexing')
    } catch (error) {
      logger.warn('Failed to clear search cache', { error })
    }
  }

  /**
   * Clear cache entries for a specific publication
   */
  private async clearPublicationCache(publicationId: string): Promise<void> {
    try {
      await clearCachedResults(`search:*${publicationId}*`)
      await clearCachedResults(`similar:${publicationId}*`)
      logger.debug('Publication cache cleared', { publicationId })
    } catch (error) {
      logger.warn('Failed to clear publication cache', { publicationId, error })
    }
  }

  /**
   * Get indexing statistics
   */
  async getIndexingStats(): Promise<any> {
    const supabase = await this.getSupabase()
    
    const { data: stats, error } = await supabase
      .from('publications')
      .select(`
        count(),
        indexed_at
      `)
      .not('search_vector', 'is', null)
    
    if (error) {
      throw new Error(`Failed to get indexing stats: ${error.message}`)
    }
    
    return stats
  }
}

// Export singleton instance
export const searchIndexer = new SearchIndexer()

// Export convenience functions
export async function indexAllPublications(options?: IndexingOptions): Promise<IndexingResult> {
  return searchIndexer.indexAllPublications(options)
}

export async function indexPublication(publicationId: string): Promise<IndexingResult> {
  return searchIndexer.indexPublication(publicationId)
}

export async function getIndexingStats(): Promise<any> {
  return searchIndexer.getIndexingStats()
}