/**
 * Search Query Processor for Healthcare Publications
 * Handles query parsing, normalization, and enhancement for medical terminology
 * Story 3.7c Task 3: Full-Text Search Implementation
 */

import logger from '@/lib/logging/winston-logger'

export interface ProcessedQuery {
  originalQuery: string
  query: string
  normalizedQuery: string
  hasTextQuery: boolean
  isPhrase: boolean
  isMedicalQuery: boolean
  terms: QueryTerm[]
  operators: QueryOperator[]
  synonyms: string[]
  suggestions: string[]
  queryType: QueryType
  confidence: number
  processingTime: number
}

export interface QueryTerm {
  term: string
  originalTerm: string
  type: TermType
  weight: number
  isMedical: boolean
  isAbbreviation: boolean
  expandedTerms: string[]
  position: number
}

export interface QueryOperator {
  operator: 'AND' | 'OR' | 'NOT'
  position: number
}

export type TermType = 'word' | 'phrase' | 'wildcard' | 'medical' | 'author' | 'journal' | 'year'
export type QueryType = 'simple' | 'advanced' | 'medical' | 'academic' | 'phrase' | 'boolean'

export interface MedicalTerms {
  diseases: Set<string>
  drugs: Set<string>
  procedures: Set<string>
  anatomy: Set<string>
  symptoms: Set<string>
  abbreviations: Map<string, string>
  synonyms: Map<string, string[]>
}

export class QueryProcessor {
  private medicalTerms: MedicalTerms | null = null
  private stopWords: Set<string>
  private medicalAbbreviations: Map<string, string>
  private synonymDatabase: Map<string, string[]>

  constructor() {
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 
      'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were'
    ])
    
    this.medicalAbbreviations = new Map([
      ['AI', 'artificial intelligence'],
      ['ML', 'machine learning'],
      ['DL', 'deep learning'],
      ['EHR', 'electronic health record'],
      ['EMR', 'electronic medical record'],
      ['ICU', 'intensive care unit'],
      ['CT', 'computed tomography'],
      ['MRI', 'magnetic resonance imaging'],
      ['PET', 'positron emission tomography'],
      ['FDA', 'food and drug administration'],
      ['WHO', 'world health organization'],
      ['CDC', 'centers for disease control'],
      ['NIH', 'national institutes of health'],
      ['RCT', 'randomized controlled trial'],
      ['BMI', 'body mass index'],
      ['DNA', 'deoxyribonucleic acid'],
      ['RNA', 'ribonucleic acid'],
      ['COVID', 'coronavirus disease'],
      ['HIV', 'human immunodeficiency virus'],
      ['AIDS', 'acquired immunodeficiency syndrome']
    ])
    
    this.synonymDatabase = new Map([
      ['heart attack', ['myocardial infarction', 'MI', 'cardiac arrest']],
      ['diabetes', ['diabetes mellitus', 'diabetic', 'blood sugar disorder']],
      ['high blood pressure', ['hypertension', 'elevated blood pressure']],
      ['cancer', ['malignancy', 'tumor', 'neoplasm', 'carcinoma']],
      ['stroke', ['cerebrovascular accident', 'CVA', 'brain attack']],
      ['artificial intelligence', ['AI', 'machine intelligence', 'automated intelligence']],
      ['machine learning', ['ML', 'automated learning', 'statistical learning']],
      ['telemedicine', ['telehealth', 'remote healthcare', 'digital health']],
      ['electronic health record', ['EHR', 'EMR', 'electronic medical record']],
      ['clinical trial', ['clinical study', 'medical trial', 'research study']]
    ])
  }

  /**
   * Main query processing function
   */
  async processQuery(query: string): Promise<ProcessedQuery> {
    const startTime = Date.now()
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided')
    }

    // Initialize medical terms if needed
    if (!this.medicalTerms) {
      await this.initializeMedicalTerms()
    }

    // Normalize the query
    const normalizedQuery = this.normalizeQuery(query)
    
    // Parse the query structure
    const parseResult = this.parseQuery(normalizedQuery)
    
    // Process terms and identify medical content
    const processedTerms = await this.processTerms(parseResult.terms)
    
    // Generate query variations and synonyms
    const synonyms = this.generateSynonyms(processedTerms)
    
    // Build the final search query
    const searchQuery = this.buildSearchQuery(processedTerms, parseResult.operators)
    
    // Determine query type and confidence
    const queryType = this.determineQueryType(processedTerms, parseResult)
    const confidence = this.calculateConfidence(processedTerms, queryType)
    
    // Generate suggestions for query improvement
    const suggestions = await this.generateSuggestions(query, processedTerms)
    
    const processingTime = Date.now() - startTime
    
    const result: ProcessedQuery = {
      originalQuery: query,
      query: searchQuery,
      normalizedQuery,
      hasTextQuery: searchQuery.length > 0,
      isPhrase: parseResult.isPhrase,
      isMedicalQuery: processedTerms.some(term => term.isMedical),
      terms: processedTerms,
      operators: parseResult.operators,
      synonyms,
      suggestions,
      queryType,
      confidence,
      processingTime
    }
    
    logger.debug('Query processed', {
      originalQuery: query,
      searchQuery,
      queryType,
      termCount: processedTerms.length,
      isMedicalQuery: result.isMedicalQuery,
      confidence,
      processingTime
    })
    
    return result
  }

  /**
   * Normalize query text for consistent processing
   */
  normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[^\w\s"'&|!()-]/g, ' ') // Keep quotes, operators, and parentheses
      .replace(/\s+/g, ' ')           // Final whitespace cleanup
      .trim()
  }

  /**
   * Parse query structure to identify terms, operators, and phrases
   */
  private parseQuery(query: string): {
    terms: string[]
    operators: QueryOperator[]
    isPhrase: boolean
  } {
    const terms: string[] = []
    const operators: QueryOperator[] = []
    let isPhrase = false
    let position = 0

    // Check for phrase queries (quoted text)
    const phraseMatch = query.match(/"([^"]+)"/g)
    if (phraseMatch) {
      isPhrase = true
      phraseMatch.forEach(phrase => {
        terms.push(phrase.replace(/"/g, ''))
      })
      return { terms, operators, isPhrase }
    }

    // Parse boolean operators and terms
    const tokens = query.split(/\s+/)
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].toUpperCase()
      
      if (['AND', '&', '&&'].includes(token)) {
        operators.push({ operator: 'AND', position })
      } else if (['OR', '|', '||'].includes(token)) {
        operators.push({ operator: 'OR', position })
      } else if (['NOT', '-', '!'].includes(token)) {
        operators.push({ operator: 'NOT', position })
      } else if (tokens[i].length > 0) {
        terms.push(tokens[i].toLowerCase())
        position++
      }
    }

    return { terms, operators, isPhrase }
  }

  /**
   * Process individual terms and identify their types
   */
  private async processTerms(terms: string[]): Promise<QueryTerm[]> {
    const processedTerms: QueryTerm[] = []
    
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      const processedTerm = await this.processSingleTerm(term, i)
      processedTerms.push(processedTerm)
    }
    
    return processedTerms
  }

  /**
   * Process a single term and determine its characteristics
   */
  private async processSingleTerm(term: string, position: number): Promise<QueryTerm> {
    const originalTerm = term
    let processedTerm = term.toLowerCase()
    
    // Remove punctuation but preserve wildcards
    if (!processedTerm.includes('*') && !processedTerm.includes('?')) {
      processedTerm = processedTerm.replace(/[^\w\s-]/g, '')
    }
    
    // Determine term type
    const termType = this.determineTermType(processedTerm)
    
    // Check if it's a medical term
    const isMedical = this.isMedicalTerm(processedTerm)
    
    // Check if it's an abbreviation
    const isAbbreviation = this.medicalAbbreviations.has(processedTerm.toUpperCase())
    
    // Expand abbreviations and generate related terms
    const expandedTerms = this.expandTerm(processedTerm)
    
    // Calculate term weight based on type and characteristics
    const weight = this.calculateTermWeight(processedTerm, termType, isMedical)
    
    return {
      term: processedTerm,
      originalTerm,
      type: termType,
      weight,
      isMedical,
      isAbbreviation,
      expandedTerms,
      position
    }
  }

  /**
   * Determine the type of a search term
   */
  private determineTermType(term: string): TermType {
    // Check for wildcards
    if (term.includes('*') || term.includes('?')) {
      return 'wildcard'
    }
    
    // Check for year patterns
    if (/^\d{4}$/.test(term) && parseInt(term) > 1900 && parseInt(term) <= new Date().getFullYear()) {
      return 'year'
    }
    
    // Check if it's a medical term
    if (this.isMedicalTerm(term)) {
      return 'medical'
    }
    
    // Check for author patterns (capitalized words)
    if (/^[A-Z][a-z]+$/.test(term) && term.length > 2) {
      return 'author'
    }
    
    // Check for journal patterns (multiple capitalized words)
    if (term.includes(' ') && /^[A-Z]/.test(term)) {
      return 'journal'
    }
    
    // Multi-word terms are treated as phrases
    if (term.includes(' ')) {
      return 'phrase'
    }
    
    return 'word'
  }

  /**
   * Check if a term is medical-related
   */
  private isMedicalTerm(term: string): boolean {
    if (!this.medicalTerms) return false
    
    const lowerTerm = term.toLowerCase()
    
    return this.medicalTerms.diseases.has(lowerTerm) ||
           this.medicalTerms.drugs.has(lowerTerm) ||
           this.medicalTerms.procedures.has(lowerTerm) ||
           this.medicalTerms.anatomy.has(lowerTerm) ||
           this.medicalTerms.symptoms.has(lowerTerm) ||
           this.medicalAbbreviations.has(term.toUpperCase())
  }

  /**
   * Expand a term with synonyms and related terms
   */
  private expandTerm(term: string): string[] {
    const expanded: string[] = [term]
    
    // Check for abbreviation expansion
    const upperTerm = term.toUpperCase()
    if (this.medicalAbbreviations.has(upperTerm)) {
      expanded.push(this.medicalAbbreviations.get(upperTerm)!)
    }
    
    // Check for synonyms
    const synonyms = this.synonymDatabase.get(term.toLowerCase())
    if (synonyms) {
      expanded.push(...synonyms)
    }
    
    // Add morphological variants for medical terms
    if (this.isMedicalTerm(term)) {
      expanded.push(...this.generateMorphologicalVariants(term))
    }
    
    return [...new Set(expanded)] // Remove duplicates
  }

  /**
   * Generate morphological variants of medical terms
   */
  private generateMorphologicalVariants(term: string): string[] {
    const variants: string[] = []
    
    // Add plural/singular forms
    if (term.endsWith('s')) {
      variants.push(term.slice(0, -1)) // Remove 's'
    } else {
      variants.push(term + 's') // Add 's'
    }
    
    // Add common medical suffix variations
    if (term.endsWith('ic')) {
      variants.push(term.slice(0, -2) + 'ical')
    }
    if (term.endsWith('ical')) {
      variants.push(term.slice(0, -4) + 'ic')
    }
    
    // Add -ology variants
    if (term.endsWith('ology')) {
      variants.push(term.slice(0, -6) + 'ologist')
      variants.push(term.slice(0, -6) + 'ological')
    }
    
    return variants
  }

  /**
   * Calculate weight for a term based on its characteristics
   */
  private calculateTermWeight(term: string, type: TermType, isMedical: boolean): number {
    let weight = 1.0
    
    // Medical terms get higher weight
    if (isMedical) weight += 0.5
    
    // Term type weights
    switch (type) {
      case 'medical': weight += 0.4; break
      case 'phrase': weight += 0.3; break
      case 'author': weight += 0.2; break
      case 'journal': weight += 0.2; break
      case 'year': weight += 0.1; break
      case 'wildcard': weight += 0.1; break
    }
    
    // Longer terms generally more specific
    if (term.length > 6) weight += 0.1
    if (term.length > 10) weight += 0.1
    
    // Stop words get lower weight
    if (this.stopWords.has(term)) weight = 0.1
    
    return Math.round(weight * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Generate synonyms for processed terms
   */
  private generateSynonyms(terms: QueryTerm[]): string[] {
    const synonyms = new Set<string>()
    
    terms.forEach(term => {
      term.expandedTerms.forEach(expanded => {
        if (expanded !== term.term) {
          synonyms.add(expanded)
        }
      })
    })
    
    return Array.from(synonyms)
  }

  /**
   * Build the final search query for PostgreSQL
   */
  private buildSearchQuery(terms: QueryTerm[], operators: QueryOperator[]): string {
    if (terms.length === 0) return ''
    
    const queryParts: string[] = []
    
    // Handle single term
    if (terms.length === 1) {
      const term = terms[0]
      if (term.type === 'phrase') {
        return `"${term.term}"`
      }
      return term.expandedTerms.join(' | ')
    }
    
    // Handle multiple terms with operators
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      let termQuery = term.term
      
      // Add synonyms with OR operator
      if (term.expandedTerms.length > 1) {
        termQuery = `(${term.expandedTerms.join(' | ')})`
      }
      
      // Add weight based on term importance
      if (term.weight > 1.2) {
        termQuery += `:A` // High weight
      } else if (term.weight > 1.0) {
        termQuery += `:B` // Medium weight
      }
      
      queryParts.push(termQuery)
      
      // Add operator if not the last term
      if (i < terms.length - 1) {
        const nextOperator = operators.find(op => op.position === i + 1)
        if (nextOperator) {
          switch (nextOperator.operator) {
            case 'AND': queryParts.push(' & '); break
            case 'OR': queryParts.push(' | '); break
            case 'NOT': queryParts.push(' & !'); break
          }
        } else {
          queryParts.push(' & ') // Default to AND
        }
      }
    }
    
    return queryParts.join('')
  }

  /**
   * Determine the overall query type
   */
  private determineQueryType(terms: QueryTerm[], parseResult: any): QueryType {
    // Check for phrase queries
    if (parseResult.isPhrase) {
      return 'phrase'
    }
    
    // Check for boolean operators
    if (parseResult.operators.length > 0) {
      return 'boolean'
    }
    
    // Check for medical content
    const medicalTermCount = terms.filter(t => t.isMedical).length
    if (medicalTermCount > 0) {
      return 'medical'
    }
    
    // Check for academic patterns
    const academicTermCount = terms.filter(t => 
      t.type === 'author' || t.type === 'journal' || t.type === 'year'
    ).length
    if (academicTermCount > 0) {
      return 'academic'
    }
    
    // Check for advanced patterns
    const advancedFeatures = terms.filter(t => 
      t.type === 'wildcard' || t.expandedTerms.length > 2
    ).length
    if (advancedFeatures > 0) {
      return 'advanced'
    }
    
    return 'simple'
  }

  /**
   * Calculate confidence score for the processed query
   */
  private calculateConfidence(terms: QueryTerm[], queryType: QueryType): number {
    let confidence = 0.5 // Base confidence
    
    // Medical terms increase confidence
    const medicalTerms = terms.filter(t => t.isMedical).length
    confidence += (medicalTerms * 0.1)
    
    // Specific term types increase confidence
    const specificTerms = terms.filter(t => 
      t.type === 'medical' || t.type === 'author' || t.type === 'journal'
    ).length
    confidence += (specificTerms * 0.05)
    
    // Longer queries with multiple terms
    if (terms.length > 2) confidence += 0.1
    if (terms.length > 4) confidence += 0.1
    
    // Query type adjustments
    switch (queryType) {
      case 'medical': confidence += 0.2; break
      case 'academic': confidence += 0.15; break
      case 'phrase': confidence += 0.1; break
      case 'advanced': confidence += 0.05; break
    }
    
    // Ensure confidence is between 0 and 1
    return Math.min(Math.max(confidence, 0), 1)
  }

  /**
   * Generate suggestions for query improvement
   */
  private async generateSuggestions(originalQuery: string, terms: QueryTerm[]): Promise<string[]> {
    const suggestions: string[] = []
    
    // Suggest medical term expansions
    terms.forEach(term => {
      if (term.isAbbreviation && term.expandedTerms.length > 1) {
        suggestions.push(`Try "${term.expandedTerms[1]}" instead of "${term.term}"`)
      }
    })
    
    // Suggest adding filters for broad queries
    if (terms.length === 1 && !terms[0].isMedical) {
      suggestions.push('Consider adding year or publication type filters for more specific results')
    }
    
    // Suggest phrase queries for multi-word terms
    if (terms.length > 2 && !originalQuery.includes('"')) {
      suggestions.push('Use quotes for exact phrase matching: "your exact phrase"')
    }
    
    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  /**
   * Initialize medical terms database
   */
  private async initializeMedicalTerms(): Promise<void> {
    // In production, this would load from a comprehensive medical ontology
    this.medicalTerms = {
      diseases: new Set([
        'diabetes', 'cancer', 'hypertension', 'asthma', 'alzheimer', 'parkinson',
        'cardiovascular disease', 'stroke', 'pneumonia', 'influenza', 'covid-19',
        'depression', 'anxiety', 'schizophrenia', 'bipolar disorder', 'autism',
        'arthritis', 'osteoporosis', 'kidney disease', 'liver disease',
        'myocardial infarction', 'heart attack', 'cardiac arrest'
      ]),
      
      drugs: new Set([
        'insulin', 'metformin', 'aspirin', 'ibuprofen', 'acetaminophen',
        'antibiotics', 'penicillin', 'statins', 'beta blockers', 'ace inhibitors',
        'chemotherapy', 'immunotherapy', 'vaccines', 'analgesics', 'antihistamines'
      ]),
      
      procedures: new Set([
        'surgery', 'biopsy', 'endoscopy', 'catheterization', 'angioplasty',
        'transplant', 'dialysis', 'chemotherapy', 'radiation therapy',
        'physical therapy', 'rehabilitation', 'vaccination', 'immunization'
      ]),
      
      anatomy: new Set([
        'heart', 'brain', 'lung', 'liver', 'kidney', 'stomach', 'intestine',
        'blood', 'bone', 'muscle', 'nerve', 'skin', 'eye', 'ear', 'mouth'
      ]),
      
      symptoms: new Set([
        'pain', 'fever', 'cough', 'fatigue', 'nausea', 'vomiting', 'diarrhea',
        'headache', 'dizziness', 'shortness of breath', 'chest pain',
        'abdominal pain', 'joint pain', 'muscle pain', 'inflammation'
      ]),
      
      abbreviations: this.medicalAbbreviations,
      synonyms: this.synonymDatabase
    }
  }
}

// Export singleton instance and convenience functions
export const queryProcessor = new QueryProcessor()

export async function processQuery(query: string): Promise<ProcessedQuery> {
  return queryProcessor.processQuery(query)
}

export function normalizeQuery(query: string): string {
  return queryProcessor.normalizeQuery(query)
}