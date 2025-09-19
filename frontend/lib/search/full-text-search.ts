/**
 * Full-Text Search Implementation with Advanced Relevance Scoring
 * Sophisticated search algorithms with healthcare-specific terminology and highlighting
 */

import type {
  SearchableContentType,
  SearchableContent,
  SearchContentMetadata,
  SearchQuery,
  SearchResult,
  SearchHighlight,
  SearchExplanation,
  RelevanceScore,
  SearchRank,
  SearchId,
  HealthcareContentType,
} from './types'

// ============================================================================
// RELEVANCE SCORING ALGORITHMS
// ============================================================================

/**
 * Advanced relevance scoring configuration with multiple algorithms
 */
export interface RelevanceConfig<T extends SearchableContentType> {
  readonly algorithm: 'bm25' | 'tfidf' | 'dfs' | 'healthcare_weighted'
  readonly fieldWeights: Record<keyof SearchableContent<T>, number>
  readonly boosts: {
    readonly recency?: {
      readonly field: 'createdAt' | 'updatedAt' | 'publishedAt'
      readonly scale: number
      readonly decay: number
    }
    readonly popularity?: {
      readonly field: string
      readonly weight: number
    }
    readonly contentType?: Record<T, number>
    readonly healthcare?: T extends HealthcareContentType ? {
      readonly evidenceLevel?: Record<string, number>
      readonly impactFactor?: { weight: number; threshold: number }
      readonly citationCount?: { weight: number; logarithmic: boolean }
    } : never
  }
  readonly penalties: {
    readonly duplicateContent?: number
    readonly lowQuality?: number
    readonly outdated?: { threshold: string; penalty: number }
  }
}

/**
 * BM25 relevance scoring implementation
 */
export class BM25Scorer<T extends SearchableContentType> {
  private readonly k1: number = 1.2 // Term frequency saturation parameter
  private readonly b: number = 0.75 // Length normalization parameter
  private readonly config: RelevanceConfig<T>

  constructor(config: RelevanceConfig<T>) {
    this.config = config
  }

  /**
   * Calculate BM25 score for a document
   */
  calculateScore(
    query: string,
    document: SearchableContent<T>,
    corpus: SearchableContent<T>[],
    fieldMatches: Map<string, TermMatch[]>
  ): RelevanceScoreResult {
    const queryTerms = this.tokenizeQuery(query)
    const avgDocLength = this.calculateAverageDocumentLength(corpus)
    const docLength = this.calculateDocumentLength(document)
    
    let totalScore = 0
    const termScores: TermScore[] = []
    
    for (const term of queryTerms) {
      const termScore = this.calculateTermScore(
        term,
        document,
        corpus,
        docLength,
        avgDocLength,
        fieldMatches
      )
      totalScore += termScore.score
      termScores.push(termScore)
    }

    // Apply field weights and boosts
    const weightedScore = this.applyFieldWeights(totalScore, fieldMatches)
    const boostedScore = this.applyBoosts(weightedScore, document, corpus)
    const finalScore = this.applyPenalties(boostedScore, document)

    return {
      score: finalScore as RelevanceScore,
      explanation: {
        algorithm: 'bm25',
        baseScore: totalScore,
        weightedScore,
        boostedScore,
        finalScore,
        termScores,
        fieldWeights: this.config.fieldWeights,
        boosts: this.calculateAppliedBoosts(document),
        penalties: this.calculateAppliedPenalties(document)
      }
    }
  }

  private calculateTermScore(
    term: string,
    document: SearchableContent<T>,
    corpus: SearchableContent<T>[],
    docLength: number,
    avgDocLength: number,
    fieldMatches: Map<string, TermMatch[]>
  ): TermScore {
    const tf = this.calculateTermFrequency(term, document, fieldMatches)
    const idf = this.calculateInverseDocumentFrequency(term, corpus)
    const lengthNorm = this.calculateLengthNormalization(docLength, avgDocLength)
    
    // BM25 formula: IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (|d| / avgdl)))
    const numerator = tf * (this.k1 + 1)
    const denominator = tf + this.k1 * lengthNorm
    const score = idf * (numerator / denominator)

    return {
      term,
      score,
      termFrequency: tf,
      inverseDocumentFrequency: idf,
      lengthNormalization: lengthNorm
    }
  }

  private calculateTermFrequency(
    term: string,
    document: SearchableContent<T>,
    fieldMatches: Map<string, TermMatch[]>
  ): number {
    let totalFrequency = 0
    
    for (const [fieldName, matches] of fieldMatches) {
      const fieldWeight = this.config.fieldWeights[fieldName as keyof SearchableContent<T>] || 1
      const termMatches = matches.filter(match => 
        match.term.toLowerCase() === term.toLowerCase()
      )
      totalFrequency += termMatches.length * fieldWeight
    }
    
    return totalFrequency
  }

  private calculateInverseDocumentFrequency(
    term: string,
    corpus: SearchableContent<T>[]
  ): number {
    const documentsContainingTerm = corpus.filter(doc => 
      this.documentContainsTerm(doc, term)
    ).length
    
    // IDF = log((N - df + 0.5) / (df + 0.5))
    const N = corpus.length
    const df = documentsContainingTerm
    return Math.log((N - df + 0.5) / (df + 0.5))
  }

  private calculateLengthNormalization(docLength: number, avgDocLength: number): number {
    return 1 - this.b + this.b * (docLength / avgDocLength)
  }

  private applyFieldWeights(
    baseScore: number,
    fieldMatches: Map<string, TermMatch[]>
  ): number {
    let weightedScore = baseScore
    
    // Additional field-specific weighting beyond basic term frequency
    for (const [fieldName, matches] of fieldMatches) {
      const fieldWeight = this.config.fieldWeights[fieldName as keyof SearchableContent<T>]
      if (fieldWeight && fieldWeight !== 1) {
        const fieldBoost = (fieldWeight - 1) * matches.length
        weightedScore += fieldBoost
      }
    }
    
    return weightedScore
  }

  private applyBoosts(
    score: number,
    document: SearchableContent<T>,
    corpus: SearchableContent<T>[]
  ): number {
    let boostedScore = score
    
    // Recency boost
    if (this.config.boosts.recency) {
      boostedScore += this.calculateRecencyBoost(document, this.config.boosts.recency)
    }
    
    // Popularity boost
    if (this.config.boosts.popularity) {
      boostedScore += this.calculatePopularityBoost(document, this.config.boosts.popularity)
    }
    
    // Content type boost
    if (this.config.boosts.contentType) {
      const typeBoost = this.config.boosts.contentType[document.type] || 1
      boostedScore *= typeBoost
    }
    
    // Healthcare-specific boosts
    if (this.isHealthcareContent(document) && this.config.boosts.healthcare) {
      boostedScore += this.calculateHealthcareBoosts(document)
    }
    
    return boostedScore
  }

  private applyPenalties(score: number, document: SearchableContent<T>): number {
    let penalizedScore = score
    
    // Apply various penalties
    if (this.config.penalties.duplicateContent) {
      // Logic to detect duplicate content would go here
      // penalizedScore -= this.config.penalties.duplicateContent
    }
    
    if (this.config.penalties.lowQuality) {
      // Logic to detect low quality content would go here
      // penalizedScore -= this.config.penalties.lowQuality
    }
    
    if (this.config.penalties.outdated) {
      const penalty = this.calculateOutdatedPenalty(document, this.config.penalties.outdated)
      penalizedScore -= penalty
    }
    
    return Math.max(0, penalizedScore) // Ensure score doesn't go negative
  }

  private calculateRecencyBoost(
    document: SearchableContent<T>,
    recencyConfig: { field: string; scale: number; decay: number }
  ): number {
    const dateField = document[recencyConfig.field as keyof SearchableContent<T>] as string
    if (!dateField) return 0
    
    const docDate = new Date(dateField)
    const now = new Date()
    const daysDiff = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Exponential decay: boost = scale * e^(-decay * days)
    return recencyConfig.scale * Math.exp(-recencyConfig.decay * daysDiff)
  }

  private calculatePopularityBoost(
    document: SearchableContent<T>,
    popularityConfig: { field: string; weight: number }
  ): number {
    const metadata = document.metadata as any
    const popularityValue = metadata?.[popularityConfig.field] || 0
    return popularityConfig.weight * Math.log(1 + popularityValue)
  }

  private calculateHealthcareBoosts(document: SearchableContent<T>): number {
    const healthcareConfig = this.config.boosts.healthcare as any
    if (!healthcareConfig) return 0
    
    let boost = 0
    const metadata = document.metadata as any
    
    // Evidence level boost
    if (healthcareConfig.evidenceLevel && metadata.evidenceLevel) {
      boost += healthcareConfig.evidenceLevel[metadata.evidenceLevel] || 0
    }
    
    // Impact factor boost
    if (healthcareConfig.impactFactor && metadata.impactFactor) {
      if (metadata.impactFactor > healthcareConfig.impactFactor.threshold) {
        boost += healthcareConfig.impactFactor.weight * metadata.impactFactor
      }
    }
    
    // Citation count boost
    if (healthcareConfig.citationCount && metadata.citationCount) {
      const citationBoost = healthcareConfig.citationCount.logarithmic
        ? Math.log(1 + metadata.citationCount)
        : metadata.citationCount
      boost += healthcareConfig.citationCount.weight * citationBoost
    }
    
    return boost
  }

  private calculateOutdatedPenalty(
    document: SearchableContent<T>,
    outdatedConfig: { threshold: string; penalty: number }
  ): number {
    const lastUpdated = new Date(document.updatedAt)
    const thresholdDate = new Date(outdatedConfig.threshold)
    
    return lastUpdated < thresholdDate ? outdatedConfig.penalty : 0
  }

  // Helper methods
  private tokenizeQuery(query: string): string[] {
    return query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0)
  }

  private calculateAverageDocumentLength(corpus: SearchableContent<T>[]): number {
    const totalLength = corpus.reduce((sum, doc) => sum + this.calculateDocumentLength(doc), 0)
    return totalLength / corpus.length
  }

  private calculateDocumentLength(document: SearchableContent<T>): number {
    const content = [
      document.title,
      document.content,
      document.excerpt,
      ...(document.tags || []),
      ...(document.categories || [])
    ].filter(Boolean).join(' ')
    
    return content.split(/\s+/).length
  }

  private documentContainsTerm(document: SearchableContent<T>, term: string): boolean {
    const content = [
      document.title,
      document.content,
      document.excerpt,
      ...(document.tags || []),
      ...(document.categories || [])
    ].filter(Boolean).join(' ').toLowerCase()
    
    return content.includes(term.toLowerCase())
  }

  private isHealthcareContent(document: SearchableContent<T>): boolean {
    const healthcareTypes: HealthcareContentType[] = [
      'clinical_trials', 'publications', 'quality_studies',
      'patient_education', 'healthcare_reports', 'research_data'
    ]
    return healthcareTypes.includes(document.type as HealthcareContentType)
  }

  private calculateAppliedBoosts(document: SearchableContent<T>): Record<string, number> {
    const boosts: Record<string, number> = {}
    
    if (this.config.boosts.recency) {
      boosts.recency = this.calculateRecencyBoost(document, this.config.boosts.recency)
    }
    
    if (this.config.boosts.popularity) {
      boosts.popularity = this.calculatePopularityBoost(document, this.config.boosts.popularity)
    }
    
    return boosts
  }

  private calculateAppliedPenalties(document: SearchableContent<T>): Record<string, number> {
    const penalties: Record<string, number> = {}
    
    if (this.config.penalties.outdated) {
      penalties.outdated = this.calculateOutdatedPenalty(document, this.config.penalties.outdated)
    }
    
    return penalties
  }
}

// ============================================================================
// TEXT HIGHLIGHTING AND SNIPPETS
// ============================================================================

/**
 * Advanced text highlighting with context-aware snippets
 */
export class SearchHighlighter<T extends SearchableContentType> {
  private readonly maxSnippetLength: number
  private readonly contextWindow: number
  private readonly highlightTag: string
  private readonly healthcareTerminology: Map<string, string[]>

  constructor(options?: {
    maxSnippetLength?: number
    contextWindow?: number
    highlightTag?: string
  }) {
    this.maxSnippetLength = options?.maxSnippetLength || 150
    this.contextWindow = options?.contextWindow || 50
    this.highlightTag = options?.highlightTag || 'mark'
    this.healthcareTerminology = this.initializeHealthcareTerminology()
  }

  /**
   * Generate highlighted text and snippets for search results
   */
  generateHighlights(
    query: string,
    document: SearchableContent<T>,
    fieldMatches: Map<string, TermMatch[]>
  ): {
    highlights: SearchHighlight[]
    snippet: string
  } {
    const queryTerms = this.extractQueryTerms(query)
    const highlights: SearchHighlight[] = []
    
    // Generate highlights for each field with matches
    for (const [fieldName, matches] of fieldMatches) {
      if (matches.length === 0) continue
      
      const fieldContent = this.getFieldContent(document, fieldName)
      if (!fieldContent) continue
      
      const highlight = this.createFieldHighlight(fieldName, fieldContent, matches, queryTerms)
      if (highlight) {
        highlights.push(highlight)
      }
    }
    
    // Generate the best snippet from the highest scoring field
    const snippet = this.generateBestSnippet(document, queryTerms, fieldMatches)
    
    return { highlights, snippet }
  }

  /**
   * Create highlighted fragments for a specific field
   */
  private createFieldHighlight(
    fieldName: string,
    content: string,
    matches: TermMatch[],
    queryTerms: string[]
  ): SearchHighlight | null {
    const fragments: { text: string; isHighlighted: boolean }[] = []
    const sortedMatches = matches.sort((a, b) => a.position - b.position)
    
    let lastEnd = 0
    let matchCount = 0
    
    for (const match of sortedMatches) {
      // Add non-highlighted text before this match
      if (match.position > lastEnd) {
        const beforeText = content.substring(lastEnd, match.position)
        if (beforeText.trim()) {
          fragments.push({ text: beforeText, isHighlighted: false })
        }
      }
      
      // Add highlighted match
      const matchText = content.substring(match.position, match.position + match.length)
      fragments.push({ text: matchText, isHighlighted: true })
      matchCount++
      
      lastEnd = match.position + match.length
    }
    
    // Add remaining non-highlighted text
    if (lastEnd < content.length) {
      const remainingText = content.substring(lastEnd)
      if (remainingText.trim()) {
        fragments.push({ text: remainingText, isHighlighted: false })
      }
    }
    
    // If no matches were found, return null
    if (matchCount === 0) return null
    
    return {
      field: fieldName,
      fragments,
      matchCount
    }
  }

  /**
   * Generate the best snippet with context around matches
   */
  private generateBestSnippet(
    document: SearchableContent<T>,
    queryTerms: string[],
    fieldMatches: Map<string, TermMatch[]>
  ): string {
    // Priority order for snippet source
    const fieldPriority = ['title', 'excerpt', 'content', 'categories', 'tags']
    
    for (const fieldName of fieldPriority) {
      const matches = fieldMatches.get(fieldName)
      if (!matches || matches.length === 0) continue
      
      const content = this.getFieldContent(document, fieldName)
      if (!content) continue
      
      const snippet = this.createSnippetFromField(content, matches, queryTerms)
      if (snippet) return snippet
    }
    
    // Fallback to content preview if no matches
    return this.createFallbackSnippet(document)
  }

  /**
   * Create snippet with context around the best match
   */
  private createSnippetFromField(
    content: string,
    matches: TermMatch[],
    queryTerms: string[]
  ): string {
    if (matches.length === 0) return ''
    
    // Find the best match position (highest density of query terms)
    const bestPosition = this.findBestSnippetPosition(content, matches)
    
    // Extract snippet with context
    const start = Math.max(0, bestPosition - this.contextWindow)
    const end = Math.min(content.length, bestPosition + this.maxSnippetLength)
    
    let snippet = content.substring(start, end)
    
    // Add ellipsis if truncated
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    
    // Apply highlighting
    snippet = this.highlightTermsInSnippet(snippet, queryTerms)
    
    return snippet
  }

  /**
   * Find the position with the highest density of matches
   */
  private findBestSnippetPosition(content: string, matches: TermMatch[]): number {
    const windowSize = this.maxSnippetLength
    let bestPosition = matches[0].position
    let maxDensity = 0
    
    // Slide a window across the content to find the highest match density
    for (let i = 0; i < content.length - windowSize; i += 10) {
      const windowMatches = matches.filter(match => 
        match.position >= i && match.position < i + windowSize
      )
      
      if (windowMatches.length > maxDensity) {
        maxDensity = windowMatches.length
        bestPosition = i
      }
    }
    
    return bestPosition
  }

  /**
   * Apply highlighting to terms in snippet
   */
  private highlightTermsInSnippet(snippet: string, queryTerms: string[]): string {
    let highlightedSnippet = snippet
    
    // Sort terms by length (longest first) to avoid partial replacements
    const sortedTerms = queryTerms.sort((a, b) => b.length - a.length)
    
    for (const term of sortedTerms) {
      // Create case-insensitive regex with word boundaries
      const regex = new RegExp(`\\b(${this.escapeRegExp(term)})\\b`, 'gi')
      highlightedSnippet = highlightedSnippet.replace(
        regex,
        `<${this.highlightTag}>$1</${this.highlightTag}>`
      )
      
      // Also highlight medical synonyms if applicable
      const synonyms = this.healthcareTerminology.get(term.toLowerCase())
      if (synonyms) {
        for (const synonym of synonyms) {
          const synonymRegex = new RegExp(`\\b(${this.escapeRegExp(synonym)})\\b`, 'gi')
          highlightedSnippet = highlightedSnippet.replace(
            synonymRegex,
            `<${this.highlightTag}>$1</${this.highlightTag}>`
          )
        }
      }
    }
    
    return highlightedSnippet
  }

  /**
   * Create fallback snippet when no matches are found
   */
  private createFallbackSnippet(document: SearchableContent<T>): string {
    const content = document.excerpt || document.content || document.title
    if (!content) return ''
    
    if (content.length <= this.maxSnippetLength) {
      return content
    }
    
    // Find a good breaking point (sentence or word boundary)
    let snippet = content.substring(0, this.maxSnippetLength)
    const lastSentence = snippet.lastIndexOf('. ')
    const lastWord = snippet.lastIndexOf(' ')
    
    if (lastSentence > this.maxSnippetLength * 0.7) {
      snippet = snippet.substring(0, lastSentence + 1)
    } else if (lastWord > this.maxSnippetLength * 0.8) {
      snippet = snippet.substring(0, lastWord)
    }
    
    return snippet + '...'
  }

  /**
   * Extract and normalize query terms
   */
  private extractQueryTerms(query: string): string[] {
    // Handle quoted phrases
    const phrases: string[] = []
    const quotedPhrases = query.match(/"([^"]+)"/g)
    if (quotedPhrases) {
      phrases.push(...quotedPhrases.map(phrase => phrase.slice(1, -1)))
      query = query.replace(/"([^"]+)"/g, ' ')
    }
    
    // Extract individual terms
    const terms = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 1) // Filter out very short terms
    
    return [...phrases, ...terms]
  }

  /**
   * Get content from a document field
   */
  private getFieldContent(document: SearchableContent<T>, fieldName: string): string | null {
    switch (fieldName) {
      case 'title':
        return document.title
      case 'content':
        return document.content || null
      case 'excerpt':
        return document.excerpt || null
      case 'tags':
        return document.tags?.join(' ') || null
      case 'categories':
        return document.categories?.join(' ') || null
      case 'authorName':
        return document.authorName || null
      default:
        return null
    }
  }

  /**
   * Escape special characters for regex
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Initialize healthcare terminology mappings
   */
  private initializeHealthcareTerminology(): Map<string, string[]> {
    const terminology = new Map<string, string[]>()
    
    // Medical abbreviations and their expansions
    terminology.set('mi', ['myocardial infarction', 'heart attack'])
    terminology.set('copd', ['chronic obstructive pulmonary disease'])
    terminology.set('dm', ['diabetes mellitus', 'diabetes'])
    terminology.set('htn', ['hypertension', 'high blood pressure'])
    terminology.set('chf', ['congestive heart failure', 'heart failure'])
    terminology.set('af', ['atrial fibrillation'])
    terminology.set('cad', ['coronary artery disease'])
    terminology.set('ckd', ['chronic kidney disease'])
    terminology.set('copd', ['chronic obstructive pulmonary disease'])
    terminology.set('dvt', ['deep vein thrombosis'])
    
    // Medical synonyms
    terminology.set('cancer', ['malignancy', 'neoplasm', 'tumor', 'carcinoma'])
    terminology.set('infection', ['sepsis', 'bacteremia', 'inflammatory response'])
    terminology.set('surgery', ['operation', 'procedure', 'intervention'])
    terminology.set('medication', ['drug', 'pharmaceutical', 'therapeutic agent'])
    
    return terminology
  }
}

// ============================================================================
// SUPPORTING TYPES AND INTERFACES
// ============================================================================

export interface TermMatch {
  readonly term: string
  readonly position: number
  readonly length: number
  readonly field: string
  readonly exact: boolean
  readonly stemmed?: boolean
  readonly synonym?: boolean
}

export interface TermScore {
  readonly term: string
  readonly score: number
  readonly termFrequency: number
  readonly inverseDocumentFrequency: number
  readonly lengthNormalization: number
}

export interface RelevanceScoreResult {
  readonly score: RelevanceScore
  readonly explanation: {
    readonly algorithm: string
    readonly baseScore: number
    readonly weightedScore: number
    readonly boostedScore: number
    readonly finalScore: number
    readonly termScores: TermScore[]
    readonly fieldWeights: Record<string, number>
    readonly boosts: Record<string, number>
    readonly penalties: Record<string, number>
  }
}

/**
 * Full-text search engine with advanced relevance scoring
 */
export class FullTextSearchEngine<T extends SearchableContentType> {
  private readonly scorer: BM25Scorer<T>
  private readonly highlighter: SearchHighlighter<T>

  constructor(
    relevanceConfig: RelevanceConfig<T>,
    highlightOptions?: {
      maxSnippetLength?: number
      contextWindow?: number
      highlightTag?: string
    }
  ) {
    this.scorer = new BM25Scorer(relevanceConfig)
    this.highlighter = new SearchHighlighter(highlightOptions)
  }

  /**
   * Perform full-text search with relevance scoring and highlighting
   */
  async search(
    query: SearchQuery<T>,
    corpus: SearchableContent<T>[]
  ): Promise<SearchResult<T>[]> {
    const queryString = query.query
    let results: SearchResult<T>[] = []
    
    // Find matching documents with term positions
    const candidateDocuments = this.findCandidateDocuments(queryString, corpus, query.contentTypes)
    
    // Score and rank documents
    for (const [document, fieldMatches] of candidateDocuments) {
      const scoreResult = this.scorer.calculateScore(queryString, document, corpus, fieldMatches)
      
      // Generate highlights and snippets
      const { highlights, snippet } = this.highlighter.generateHighlights(
        queryString, 
        document, 
        fieldMatches
      )
      
      // Extract matched fields
      const matchedFields = Array.from(fieldMatches.keys())
      
      results.push({
        item: document,
        score: scoreResult.score,
        rank: 0 as SearchRank, // Will be set after sorting
        highlights,
        snippet,
        explanation: {
          score: scoreResult.score,
          description: `BM25 score: ${scoreResult.score.toFixed(3)}`,
          details: scoreResult.explanation.termScores.map(termScore => ({
            field: 'combined',
            boost: 1.0,
            termFrequency: termScore.termFrequency,
            inverseDocumentFrequency: termScore.inverseDocumentFrequency,
            fieldNorm: termScore.lengthNormalization
          }))
        },
        matchedFields
      })
    }
    
    // Sort by relevance score and assign ranks
    results.sort((a, b) => (b.score as number) - (a.score as number))
    results = results.map((result, index) => ({
      ...result,
      rank: (index + 1) as SearchRank
    }))
    
    // Apply pagination from query
    const startIndex = (query.pagination.page - 1) * query.pagination.limit
    const endIndex = startIndex + query.pagination.limit
    
    return results.slice(startIndex, endIndex)
  }

  /**
   * Find documents that contain query terms and their positions
   */
  private findCandidateDocuments(
    query: string,
    corpus: SearchableContent<T>[],
    contentTypes: readonly T[]
  ): Map<SearchableContent<T>, Map<string, TermMatch[]>> {
    const candidates = new Map<SearchableContent<T>, Map<string, TermMatch[]>>()
    const queryTerms = this.tokenizeQuery(query)
    
    for (const document of corpus) {
      // Filter by content type if specified
      if (contentTypes.length > 0 && !contentTypes.includes(document.type)) {
        continue
      }
      
      const documentMatches = new Map<string, TermMatch[]>()
      let hasMatches = false
      
      // Search in different fields with different priorities
      const searchFields = [
        { name: 'title', content: document.title, weight: 3.0 },
        { name: 'excerpt', content: document.excerpt, weight: 2.0 },
        { name: 'content', content: document.content, weight: 1.0 },
        { name: 'tags', content: document.tags?.join(' '), weight: 2.5 },
        { name: 'categories', content: document.categories?.join(' '), weight: 2.0 },
        { name: 'authorName', content: document.authorName, weight: 1.5 }
      ]
      
      for (const field of searchFields) {
        if (!field.content) continue
        
        const fieldMatches = this.findTermMatches(queryTerms, field.content, field.name)
        if (fieldMatches.length > 0) {
          documentMatches.set(field.name, fieldMatches)
          hasMatches = true
        }
      }
      
      if (hasMatches) {
        candidates.set(document, documentMatches)
      }
    }
    
    return candidates
  }

  /**
   * Find term matches within a specific field
   */
  private findTermMatches(queryTerms: string[], content: string, fieldName: string): TermMatch[] {
    const matches: TermMatch[] = []
    const lowerContent = content.toLowerCase()
    
    for (const term of queryTerms) {
      const lowerTerm = term.toLowerCase()
      let position = 0
      
      // Find all occurrences of this term
      while ((position = lowerContent.indexOf(lowerTerm, position)) !== -1) {
        matches.push({
          term,
          position,
          length: term.length,
          field: fieldName,
          exact: content.substring(position, position + term.length) === term,
          stemmed: false, // Would implement stemming logic here
          synonym: false  // Would implement synonym detection here
        })
        position += term.length
      }
    }
    
    return matches
  }

  /**
   * Tokenize query into searchable terms
   */
  private tokenizeQuery(query: string): string[] {
    // Handle quoted phrases first
    const phrases: string[] = []
    let processedQuery = query
    
    const quotedMatches = query.match(/"([^"]+)"/g)
    if (quotedMatches) {
      for (const match of quotedMatches) {
        phrases.push(match.slice(1, -1)) // Remove quotes
        processedQuery = processedQuery.replace(match, ' ')
      }
    }
    
    // Tokenize remaining terms
    const terms = processedQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 1 && !this.isStopWord(term))
    
    return [...phrases, ...terms]
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
      'have', 'had', 'what', 'said', 'each', 'which', 'do', 'how', 'their',
      'if', 'would', 'about', 'get', 'all', 'we', 'when', 'me', 'my'
    ])
    return stopWords.has(word.toLowerCase())
  }
}