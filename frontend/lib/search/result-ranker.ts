/**
 * Search Result Ranker for Healthcare Publications
 * Implements sophisticated ranking algorithms with healthcare-specific scoring
 * Story 3.7c Task 3: Full-Text Search Implementation
 */

import logger from '@/lib/logging/winston-logger'
import type { SearchResult } from './search-engine'
import type { ProcessedQuery } from './query-processor'

export interface RankingOptions {
  algorithm?: RankingAlgorithm
  weights?: RankingWeights
  boosts?: RankingBoosts
  penalties?: RankingPenalties
  normalizeScores?: boolean
  diversityFactor?: number
}

export interface RankingWeights {
  textRelevance: number      // Base text matching score
  titleMatch: number         // Title contains query terms
  abstractMatch: number      // Abstract contains query terms
  authorMatch: number        // Author matches query
  keywordMatch: number       // Keywords match query
  citationCount: number      // Number of citations
  viewCount: number          // Number of views
  downloadCount: number      // Number of downloads
  recency: number            // How recent the publication is
  journalImpact: number      // Journal impact factor
  openAccess: number         // Open access availability
  completeness: number       // How complete the publication data is
}

export interface RankingBoosts {
  medicalTermMatch: number   // Medical terminology matches
  recentPublication: number  // Published in last 2 years
  highImpactJournal: number  // High impact factor journal
  peerReviewed: number       // Peer-reviewed publication
  hasAbstract: number        // Has abstract available
  hasPdf: number            // Has PDF available
  multipleAuthors: number    // Multiple authors (collaboration)
  frequentKeywords: number   // Contains frequently searched keywords
}

export interface RankingPenalties {
  incompleteData: number     // Missing important fields
  oldPublication: number     // Very old publications
  lowCitations: number       // Few or no citations
  shortAbstract: number      // Very short abstract
  singleAuthor: number       // Single author (less collaboration)
}

export type RankingAlgorithm = 'bm25' | 'tf-idf' | 'hybrid' | 'healthcare-optimized'

export interface RankedResult extends SearchResult {
  rankingScore: number
  rankingBreakdown: RankingBreakdown
  rankPosition: number
}

export interface RankingBreakdown {
  baseScore: number
  textRelevanceScore: number
  titleBoost: number
  abstractBoost: number
  authorBoost: number
  keywordBoost: number
  citationBoost: number
  recencyBoost: number
  impactBoost: number
  qualityBoost: number
  penaltyTotal: number
  finalScore: number
}

export class ResultRanker {
  private defaultWeights: RankingWeights = {
    textRelevance: 0.35,    // 35% - Primary text matching
    titleMatch: 0.15,       // 15% - Title relevance
    abstractMatch: 0.10,    // 10% - Abstract relevance
    authorMatch: 0.05,      // 5%  - Author relevance
    keywordMatch: 0.10,     // 10% - Keyword relevance
    citationCount: 0.10,    // 10% - Citation impact
    viewCount: 0.03,        // 3%  - View popularity
    downloadCount: 0.02,    // 2%  - Download popularity
    recency: 0.05,          // 5%  - Publication recency
    journalImpact: 0.03,    // 3%  - Journal quality
    openAccess: 0.01,       // 1%  - Access availability
    completeness: 0.01      // 1%  - Data completeness
  }

  private defaultBoosts: RankingBoosts = {
    medicalTermMatch: 1.5,    // 50% boost for medical terms
    recentPublication: 1.3,   // 30% boost for recent papers
    highImpactJournal: 1.4,   // 40% boost for high-impact journals
    peerReviewed: 1.2,        // 20% boost for peer-reviewed
    hasAbstract: 1.1,         // 10% boost for having abstract
    hasPdf: 1.1,              // 10% boost for PDF availability
    multipleAuthors: 1.05,    // 5% boost for collaboration
    frequentKeywords: 1.15    // 15% boost for trending keywords
  }

  private defaultPenalties: RankingPenalties = {
    incompleteData: 0.8,      // 20% penalty for missing data
    oldPublication: 0.9,      // 10% penalty for old publications
    lowCitations: 0.95,       // 5% penalty for low citations
    shortAbstract: 0.9,       // 10% penalty for short abstract
    singleAuthor: 0.98        // 2% penalty for single author
  }

  /**
   * Rank search results using the specified algorithm and options
   */
  async rankResults(
    results: SearchResult[], 
    query: ProcessedQuery, 
    options: RankingOptions = {}
  ): Promise<RankedResult[]> {
    const startTime = Date.now()
    
    if (!results || results.length === 0) {
      return []
    }

    // Use healthcare-optimized algorithm by default
    const algorithm = options.algorithm || 'healthcare-optimized'
    const weights = { ...this.defaultWeights, ...options.weights }
    const boosts = { ...this.defaultBoosts, ...options.boosts }
    const penalties = { ...this.defaultPenalties, ...options.penalties }

    // Calculate scores for each result
    const rankedResults: RankedResult[] = []
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const ranking = await this.calculateRanking(result, query, weights, boosts, penalties, algorithm)
      
      rankedResults.push({
        ...result,
        rankingScore: ranking.finalScore,
        rankingBreakdown: ranking,
        rankPosition: 0 // Will be set after sorting
      })
    }

    // Sort by ranking score (descending)
    rankedResults.sort((a, b) => b.rankingScore - a.rankingScore)

    // Apply diversity factor if specified
    if (options.diversityFactor && options.diversityFactor > 0) {
      this.applyDiversityRanking(rankedResults, options.diversityFactor)
    }

    // Set rank positions
    rankedResults.forEach((result, index) => {
      result.rankPosition = index + 1
    })

    // Normalize scores if requested
    if (options.normalizeScores) {
      this.normalizeScores(rankedResults)
    }

    const processingTime = Date.now() - startTime
    logger.debug('Results ranked', {
      resultCount: rankedResults.length,
      algorithm,
      processingTime,
      topScore: rankedResults[0]?.rankingScore,
      bottomScore: rankedResults[rankedResults.length - 1]?.rankingScore
    })

    return rankedResults
  }

  /**
   * Calculate ranking score for a single result
   */
  private async calculateRanking(
    result: SearchResult,
    query: ProcessedQuery,
    weights: RankingWeights,
    boosts: RankingBoosts,
    penalties: RankingPenalties,
    algorithm: RankingAlgorithm
  ): Promise<RankingBreakdown> {
    // Calculate base components
    const textRelevanceScore = this.calculateTextRelevance(result, query, algorithm)
    const titleBoost = this.calculateTitleRelevance(result, query) * weights.titleMatch
    const abstractBoost = this.calculateAbstractRelevance(result, query) * weights.abstractMatch
    const authorBoost = this.calculateAuthorRelevance(result, query) * weights.authorMatch
    const keywordBoost = this.calculateKeywordRelevance(result, query) * weights.keywordMatch
    
    // Calculate impact and quality scores
    const citationBoost = this.calculateCitationScore(result) * weights.citationCount
    const recencyBoost = this.calculateRecencyScore(result) * weights.recency
    const impactBoost = this.calculateJournalImpact(result) * weights.journalImpact
    const qualityBoost = this.calculateQualityScore(result, weights)
    
    // Calculate base score before boosts and penalties
    const baseScore = (
      textRelevanceScore * weights.textRelevance +
      titleBoost + abstractBoost + authorBoost + keywordBoost +
      citationBoost + recencyBoost + impactBoost + qualityBoost
    )

    // Apply healthcare-specific boosts
    let boostedScore = baseScore
    boostedScore *= this.calculateMedicalTermBoost(result, query, boosts.medicalTermMatch)
    boostedScore *= this.calculatePublicationTypeBoost(result, boosts)
    boostedScore *= this.calculateCompletenessBoost(result, boosts)
    
    // Apply penalties
    const penaltyMultiplier = this.calculatePenalties(result, penalties)
    const penaltyTotal = (1 - penaltyMultiplier) * boostedScore
    
    const finalScore = boostedScore * penaltyMultiplier

    return {
      baseScore: Math.round(baseScore * 1000) / 1000,
      textRelevanceScore: Math.round(textRelevanceScore * 1000) / 1000,
      titleBoost: Math.round(titleBoost * 1000) / 1000,
      abstractBoost: Math.round(abstractBoost * 1000) / 1000,
      authorBoost: Math.round(authorBoost * 1000) / 1000,
      keywordBoost: Math.round(keywordBoost * 1000) / 1000,
      citationBoost: Math.round(citationBoost * 1000) / 1000,
      recencyBoost: Math.round(recencyBoost * 1000) / 1000,
      impactBoost: Math.round(impactBoost * 1000) / 1000,
      qualityBoost: Math.round(qualityBoost * 1000) / 1000,
      penaltyTotal: Math.round(penaltyTotal * 1000) / 1000,
      finalScore: Math.round(finalScore * 1000) / 1000
    }
  }

  /**
   * Calculate text relevance score using specified algorithm
   */
  private calculateTextRelevance(
    result: SearchResult, 
    query: ProcessedQuery, 
    algorithm: RankingAlgorithm
  ): number {
    // Use the relevance score from PostgreSQL ts_rank_cd if available
    if (result.relevanceScore > 0) {
      return result.relevanceScore
    }

    // Fallback calculation for when PostgreSQL score is not available
    switch (algorithm) {
      case 'bm25':
        return this.calculateBM25Score(result, query)
      case 'tf-idf':
        return this.calculateTFIDFScore(result, query)
      case 'hybrid':
        return (this.calculateBM25Score(result, query) + this.calculateTFIDFScore(result, query)) / 2
      case 'healthcare-optimized':
      default:
        return this.calculateHealthcareOptimizedScore(result, query)
    }
  }

  /**
   * BM25 scoring algorithm implementation
   */
  private calculateBM25Score(result: SearchResult, query: ProcessedQuery): number {
    const k1 = 1.5 // Term frequency saturation parameter
    const b = 0.75 // Length normalization parameter
    
    let score = 0
    const docText = `${result.title} ${result.abstract || ''} ${result.keywords.join(' ')}`.toLowerCase()
    const docLength = docText.split(' ').length
    const avgDocLength = 200 // Estimated average document length
    
    for (const term of query.terms) {
      const termFreq = this.countOccurrences(docText, term.term.toLowerCase())
      if (termFreq > 0) {
        const idf = Math.log((1000 + 1) / (100 + 1)) // Simplified IDF calculation
        const tf = (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (docLength / avgDocLength)))
        score += idf * tf * term.weight
      }
    }
    
    return Math.min(score / 10, 1) // Normalize to 0-1 range
  }

  /**
   * TF-IDF scoring algorithm implementation
   */
  private calculateTFIDFScore(result: SearchResult, query: ProcessedQuery): number {
    let score = 0
    const docText = `${result.title} ${result.abstract || ''} ${result.keywords.join(' ')}`.toLowerCase()
    const totalWords = docText.split(' ').length
    
    for (const term of query.terms) {
      const termFreq = this.countOccurrences(docText, term.term.toLowerCase())
      if (termFreq > 0) {
        const tf = termFreq / totalWords
        const idf = Math.log(1000 / (100 + 1)) // Simplified IDF
        score += tf * idf * term.weight
      }
    }
    
    return Math.min(score * 10, 1) // Normalize to 0-1 range
  }

  /**
   * Healthcare-optimized scoring algorithm
   */
  private calculateHealthcareOptimizedScore(result: SearchResult, query: ProcessedQuery): number {
    let score = 0
    const docText = `${result.title} ${result.abstract || ''} ${result.keywords.join(' ')}`.toLowerCase()
    
    for (const term of query.terms) {
      const termOccurrences = this.countOccurrences(docText, term.term.toLowerCase())
      if (termOccurrences > 0) {
        let termScore = Math.log(termOccurrences + 1) * term.weight
        
        // Healthcare-specific bonuses
        if (term.isMedical) {
          termScore *= 1.5 // 50% boost for medical terms
        }
        
        if (term.type === 'medical') {
          termScore *= 1.3 // Additional 30% for medical term type
        }
        
        // Position-based scoring (title gets higher weight)
        if (result.title.toLowerCase().includes(term.term.toLowerCase())) {
          termScore *= 2.0 // Double score for title matches
        }
        
        score += termScore
      }
    }
    
    return Math.min(score / query.terms.length, 1) // Normalize by query length
  }

  /**
   * Calculate title relevance score
   */
  private calculateTitleRelevance(result: SearchResult, query: ProcessedQuery): number {
    if (!result.title) return 0
    
    const titleText = result.title.toLowerCase()
    let matches = 0
    let totalWeight = 0
    
    for (const term of query.terms) {
      totalWeight += term.weight
      if (titleText.includes(term.term.toLowerCase())) {
        matches += term.weight
      }
    }
    
    return totalWeight > 0 ? matches / totalWeight : 0
  }

  /**
   * Calculate abstract relevance score
   */
  private calculateAbstractRelevance(result: SearchResult, query: ProcessedQuery): number {
    if (!result.abstract) return 0
    
    const abstractText = result.abstract.toLowerCase()
    let matches = 0
    let totalWeight = 0
    
    for (const term of query.terms) {
      totalWeight += term.weight
      const occurrences = this.countOccurrences(abstractText, term.term.toLowerCase())
      if (occurrences > 0) {
        matches += Math.min(occurrences * term.weight, term.weight * 3) // Cap at 3x weight
      }
    }
    
    return totalWeight > 0 ? Math.min(matches / totalWeight, 1) : 0
  }

  /**
   * Calculate author relevance score
   */
  private calculateAuthorRelevance(result: SearchResult, query: ProcessedQuery): number {
    if (!result.authors || result.authors.length === 0) return 0
    
    const authorNames = result.authors
      .map((author: any) => (typeof author === 'string' ? author : author.name || ''))
      .join(' ')
      .toLowerCase()
    
    let matches = 0
    let totalWeight = 0
    
    for (const term of query.terms) {
      totalWeight += term.weight
      if (authorNames.includes(term.term.toLowerCase())) {
        matches += term.weight
      }
    }
    
    return totalWeight > 0 ? matches / totalWeight : 0
  }

  /**
   * Calculate keyword relevance score
   */
  private calculateKeywordRelevance(result: SearchResult, query: ProcessedQuery): number {
    if (!result.keywords || result.keywords.length === 0) return 0
    
    const keywordText = result.keywords.join(' ').toLowerCase()
    let matches = 0
    let totalWeight = 0
    
    for (const term of query.terms) {
      totalWeight += term.weight
      if (keywordText.includes(term.term.toLowerCase())) {
        matches += term.weight
      }
    }
    
    return totalWeight > 0 ? matches / totalWeight : 0
  }

  /**
   * Calculate citation-based score
   */
  private calculateCitationScore(result: SearchResult): number {
    const citations = result.citationCount || 0
    if (citations === 0) return 0
    
    // Logarithmic scale for citations
    return Math.min(Math.log(citations + 1) / Math.log(1000), 1)
  }

  /**
   * Calculate recency score
   */
  private calculateRecencyScore(result: SearchResult): number {
    if (!result.year) return 0.1 // Default low score for unknown year
    
    const currentYear = new Date().getFullYear()
    const age = currentYear - result.year
    
    if (age <= 1) return 1.0      // Very recent
    if (age <= 3) return 0.8      // Recent
    if (age <= 5) return 0.6      // Moderately recent
    if (age <= 10) return 0.4     // Older
    if (age <= 20) return 0.2     // Old
    return 0.1                    // Very old
  }

  /**
   * Calculate journal impact score
   */
  private calculateJournalImpact(result: SearchResult): number {
    // This would typically use real journal impact factors
    // For now, we'll use placeholder logic
    if (!result.journal) return 0.5
    
    const journal = result.journal.toLowerCase()
    
    // High-impact journals (simplified)
    const highImpactJournals = [
      'nature', 'science', 'cell', 'nejm', 'jama', 'bmj', 'lancet'
    ]
    
    if (highImpactJournals.some(hi => journal.includes(hi))) {
      return 1.0
    }
    
    // Medium-impact journals
    if (journal.includes('journal') || journal.includes('international')) {
      return 0.7
    }
    
    return 0.5 // Default impact
  }

  /**
   * Calculate quality score based on completeness and metadata
   */
  private calculateQualityScore(result: SearchResult, weights: RankingWeights): number {
    let score = 0
    let maxScore = 0
    
    // Check for completeness of various fields
    const completenessChecks = [
      { field: result.abstract, weight: 0.3 },
      { field: result.doi, weight: 0.1 },
      { field: result.keywords?.length > 0, weight: 0.2 },
      { field: result.authors?.length > 0, weight: 0.1 },
      { field: result.journal, weight: 0.1 },
      { field: result.year, weight: 0.1 },
      { field: result.pdfUrl, weight: 0.1 }
    ]
    
    completenessChecks.forEach(check => {
      maxScore += check.weight
      if (check.field) {
        score += check.weight
      }
    })
    
    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * Calculate medical term matching boost
   */
  private calculateMedicalTermBoost(
    result: SearchResult, 
    query: ProcessedQuery, 
    medicalBoostFactor: number
  ): number {
    if (!query.isMedicalQuery) return 1.0
    
    const medicalTermCount = query.terms.filter(t => t.isMedical).length
    if (medicalTermCount === 0) return 1.0
    
    // Check how many medical terms are found in the document
    const docText = `${result.title} ${result.abstract || ''} ${result.keywords.join(' ')}`.toLowerCase()
    let matches = 0
    
    query.terms.forEach(term => {
      if (term.isMedical && docText.includes(term.term.toLowerCase())) {
        matches++
      }
    })
    
    const matchRatio = matches / medicalTermCount
    return 1 + (matchRatio * (medicalBoostFactor - 1))
  }

  /**
   * Calculate publication type boost
   */
  private calculatePublicationTypeBoost(result: SearchResult, boosts: RankingBoosts): number {
    let boost = 1.0
    
    if (result.publicationType === 'peer-reviewed') {
      boost *= boosts.peerReviewed
    }
    
    if (result.isOpenAccess) {
      boost *= boosts.hasPdf
    }
    
    if (result.abstract && result.abstract.length > 100) {
      boost *= boosts.hasAbstract
    }
    
    return boost
  }

  /**
   * Calculate completeness boost
   */
  private calculateCompletenessBoost(result: SearchResult, boosts: RankingBoosts): number {
    let boost = 1.0
    
    if (result.authors && result.authors.length > 1) {
      boost *= boosts.multipleAuthors
    }
    
    if (result.pdfUrl) {
      boost *= boosts.hasPdf
    }
    
    if (result.year && result.year >= new Date().getFullYear() - 2) {
      boost *= boosts.recentPublication
    }
    
    return boost
  }

  /**
   * Calculate penalties
   */
  private calculatePenalties(result: SearchResult, penalties: RankingPenalties): number {
    let penalty = 1.0
    
    // Incomplete data penalty
    let missingFields = 0
    if (!result.abstract) missingFields++
    if (!result.doi) missingFields++
    if (!result.keywords || result.keywords.length === 0) missingFields++
    
    if (missingFields > 1) {
      penalty *= penalties.incompleteData
    }
    
    // Old publication penalty
    if (result.year && result.year < new Date().getFullYear() - 20) {
      penalty *= penalties.oldPublication
    }
    
    // Low citations penalty
    if ((result.citationCount || 0) === 0 && result.year && result.year < new Date().getFullYear() - 3) {
      penalty *= penalties.lowCitations
    }
    
    // Short abstract penalty
    if (result.abstract && result.abstract.length < 100) {
      penalty *= penalties.shortAbstract
    }
    
    // Single author penalty
    if (!result.authors || result.authors.length === 1) {
      penalty *= penalties.singleAuthor
    }
    
    return penalty
  }

  /**
   * Apply diversity ranking to reduce over-representation of similar results
   */
  private applyDiversityRanking(results: RankedResult[], diversityFactor: number): void {
    if (diversityFactor <= 0 || results.length <= 1) return
    
    const seen = new Set<string>()
    
    results.forEach((result, index) => {
      // Create a signature for the result based on author and journal
      const signature = `${result.authors?.[0] || 'unknown'}-${result.journal || 'unknown'}`
      
      if (seen.has(signature)) {
        // Apply diversity penalty
        result.rankingScore *= (1 - diversityFactor)
        result.rankingBreakdown.finalScore = result.rankingScore
      } else {
        seen.add(signature)
      }
    })
    
    // Re-sort after applying diversity
    results.sort((a, b) => b.rankingScore - a.rankingScore)
  }

  /**
   * Normalize scores to 0-1 range
   */
  private normalizeScores(results: RankedResult[]): void {
    if (results.length === 0) return
    
    const maxScore = Math.max(...results.map(r => r.rankingScore))
    const minScore = Math.min(...results.map(r => r.rankingScore))
    
    if (maxScore === minScore) return
    
    results.forEach(result => {
      result.rankingScore = (result.rankingScore - minScore) / (maxScore - minScore)
      result.rankingBreakdown.finalScore = result.rankingScore
    })
  }

  /**
   * Count occurrences of a term in text
   */
  private countOccurrences(text: string, term: string): number {
    if (!text || !term) return 0
    
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const matches = text.match(regex)
    return matches ? matches.length : 0
  }
}

// Export singleton instance and convenience functions
export const resultRanker = new ResultRanker()

export async function rankResults(
  results: SearchResult[], 
  query: ProcessedQuery, 
  options?: RankingOptions
): Promise<RankedResult[]> {
  return resultRanker.rankResults(results, query, options)
}

export function calculateRelevanceScore(
  result: SearchResult, 
  query: ProcessedQuery
): number {
  // Quick relevance calculation for simple use cases
  const resultRankerInstance = new ResultRanker()
  return (resultRankerInstance as any).calculateHealthcareOptimizedScore(result, query)
}