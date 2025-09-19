/**
 * AI-Powered Content Assistant
 * Provides intelligent content suggestions, medical terminology validation,
 * and healthcare-specific assistance
 */

import {
  AIContentSuggestion,
  MedicalTermValidation,
  ContentAnalysis,
  Reference,
  StatisticalData
} from './types'

// Medical terminology database (simplified - would connect to real medical APIs)
const MEDICAL_TERMS_DB = {
  icd10: new Map<string, string>(),
  snomed: new Map<string, string>(),
  mesh: new Map<string, string>(),
  drugs: new Map<string, string>(),
  procedures: new Map<string, string>()
}

// Common medical abbreviations
const MEDICAL_ABBREVIATIONS = new Map([
  ['BP', 'Blood Pressure'],
  ['HR', 'Heart Rate'],
  ['RR', 'Respiratory Rate'],
  ['BMI', 'Body Mass Index'],
  ['CBC', 'Complete Blood Count'],
  ['CT', 'Computed Tomography'],
  ['MRI', 'Magnetic Resonance Imaging'],
  ['ECG', 'Electrocardiogram'],
  ['FDA', 'Food and Drug Administration'],
  ['IRB', 'Institutional Review Board'],
  ['GCP', 'Good Clinical Practice'],
  ['AE', 'Adverse Event'],
  ['SAE', 'Serious Adverse Event'],
  ['PI', 'Principal Investigator'],
  ['ICF', 'Informed Consent Form']
])

// Clinical trial phases
const CLINICAL_PHASES = [
  'Preclinical',
  'Phase 0',
  'Phase I',
  'Phase II',
  'Phase III',
  'Phase IV',
  'Post-market surveillance'
]

// Statistical terms for clinical research
const STATISTICAL_TERMS = [
  'p-value',
  'confidence interval',
  'hazard ratio',
  'odds ratio',
  'relative risk',
  'number needed to treat',
  'intention-to-treat',
  'per-protocol analysis',
  'power analysis',
  'effect size'
]

export class AIContentAssistant {
  private apiKey: string | null = null
  private modelEndpoint: string = ''
  private medicalKnowledgeBase: Map<string, any> = new Map()

  constructor(apiKey?: string, endpoint?: string) {
    this.apiKey = apiKey || null
    this.modelEndpoint = endpoint || ''
    this.initializeMedicalKnowledgeBase()
  }

  /**
   * Initialize medical knowledge base
   */
  private initializeMedicalKnowledgeBase(): void {
    // Load common medical terms, procedures, drugs, etc.
    // In production, this would connect to medical databases
    this.medicalKnowledgeBase.set('diseases', new Set([
      'hypertension', 'diabetes', 'cancer', 'cardiovascular disease',
      'chronic kidney disease', 'COPD', 'asthma', 'arthritis'
    ]))

    this.medicalKnowledgeBase.set('medications', new Set([
      'aspirin', 'metformin', 'lisinopril', 'atorvastatin',
      'levothyroxine', 'metoprolol', 'amlodipine', 'omeprazole'
    ]))

    this.medicalKnowledgeBase.set('procedures', new Set([
      'angioplasty', 'colonoscopy', 'biopsy', 'catheterization',
      'endoscopy', 'dialysis', 'chemotherapy', 'radiation therapy'
    ]))
  }

  /**
   * Generate content suggestions based on context
   */
  async generateSuggestions(
    text: string,
    position: number,
    documentType: string
  ): Promise<AIContentSuggestion[]> {
    const suggestions: AIContentSuggestion[] = []

    // Extract context around cursor position
    const contextStart = Math.max(0, position - 200)
    const contextEnd = Math.min(text.length, position + 200)
    const context = text.substring(contextStart, contextEnd)

    // Detect what type of content is being written
    const contentType = this.detectContentType(context)

    // Generate suggestions based on content type
    if (contentType === 'clinical_trial') {
      suggestions.push(...await this.generateClinicalTrialSuggestions(context, position))
    } else if (contentType === 'medical_report') {
      suggestions.push(...await this.generateMedicalReportSuggestions(context, position))
    } else if (contentType === 'research_paper') {
      suggestions.push(...await this.generateResearchPaperSuggestions(context, position))
    }

    // Add terminology suggestions
    suggestions.push(...await this.generateTerminologySuggestions(context, position))

    // Add citation suggestions
    suggestions.push(...await this.generateCitationSuggestions(context, position))

    return suggestions
  }

  /**
   * Validate medical terminology
   */
  async validateMedicalTerm(term: string): Promise<MedicalTermValidation> {
    const normalizedTerm = term.toLowerCase().trim()

    // Check abbreviations
    if (MEDICAL_ABBREVIATIONS.has(term.toUpperCase())) {
      return {
        term,
        isValid: true,
        definition: MEDICAL_ABBREVIATIONS.get(term.toUpperCase()),
        category: 'abbreviation',
        synonyms: []
      }
    }

    // Check medical knowledge base
    for (const [category, terms] of this.medicalKnowledgeBase.entries()) {
      if (terms.has(normalizedTerm)) {
        return {
          term,
          isValid: true,
          category,
          synonyms: this.findSynonyms(normalizedTerm),
          definition: await this.getTermDefinition(normalizedTerm)
        }
      }
    }

    // Check if it's a valid medical code
    const codes = await this.lookupMedicalCodes(term)
    if (codes.icd10Codes?.length || codes.snomedCodes?.length) {
      return {
        term,
        isValid: true,
        category: 'medical_code',
        ...codes
      }
    }

    // Term not found
    return {
      term,
      isValid: false,
      synonyms: [],
      definition: undefined
    }
  }

  /**
   * Analyze content for compliance and quality
   */
  async analyzeContent(
    text: string,
    documentType: string
  ): Promise<ContentAnalysis> {
    const analysis: ContentAnalysis = {
      readabilityScore: this.calculateReadability(text),
      medicalAccuracy: 0,
      complianceIssues: [],
      suggestions: [],
      keyPoints: [],
      summary: '',
      citations: [],
      missingReferences: []
    }

    // Check medical accuracy
    analysis.medicalAccuracy = await this.assessMedicalAccuracy(text)

    // Check compliance based on document type
    if (documentType === 'clinical_trial') {
      analysis.complianceIssues.push(...this.checkClinicalTrialCompliance(text))
    } else if (documentType === 'patient_education') {
      analysis.complianceIssues.push(...this.checkPatientEducationCompliance(text))
    }

    // Extract key points
    analysis.keyPoints = this.extractKeyPoints(text)

    // Generate summary
    analysis.summary = await this.generateSummary(text)

    // Check citations
    const citationCheck = this.checkCitations(text)
    analysis.citations = citationCheck.found
    analysis.missingReferences = citationCheck.missing

    // Generate improvement suggestions
    analysis.suggestions = await this.generateImprovementSuggestions(text, analysis)

    return analysis
  }

  /**
   * Generate auto-completions for medical terms
   */
  async generateAutoComplete(
    partial: string,
    context: string
  ): Promise<string[]> {
    const suggestions: string[] = []
    const normalizedPartial = partial.toLowerCase()

    // Search abbreviations
    for (const [abbr, full] of MEDICAL_ABBREVIATIONS.entries()) {
      if (abbr.toLowerCase().startsWith(normalizedPartial)) {
        suggestions.push(abbr)
      }
      if (full.toLowerCase().startsWith(normalizedPartial)) {
        suggestions.push(full)
      }
    }

    // Search medical terms
    for (const [category, terms] of this.medicalKnowledgeBase.entries()) {
      for (const term of terms) {
        if (term.startsWith(normalizedPartial)) {
          suggestions.push(term)
        }
      }
    }

    // Context-aware suggestions
    if (context.includes('phase') && normalizedPartial.startsWith('phase')) {
      suggestions.push(...CLINICAL_PHASES.filter(p => 
        p.toLowerCase().startsWith(normalizedPartial)
      ))
    }

    if (context.includes('statistic') || context.includes('analysis')) {
      suggestions.push(...STATISTICAL_TERMS.filter(t => 
        t.toLowerCase().startsWith(normalizedPartial)
      ))
    }

    return suggestions.slice(0, 10) // Return top 10 suggestions
  }

  /**
   * Check grammar and medical writing style
   */
  async checkGrammarAndStyle(text: string): Promise<{
    issues: Array<{
      type: 'grammar' | 'style' | 'terminology'
      message: string
      position: number
      suggestion?: string
    }>
  }> {
    const issues: any[] = []

    // Check for passive voice (common in medical writing but should be minimized)
    const passiveVoiceRegex = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi
    let match
    while ((match = passiveVoiceRegex.exec(text)) !== null) {
      issues.push({
        type: 'style',
        message: 'Consider using active voice for clarity',
        position: match.index,
        suggestion: 'Rewrite in active voice'
      })
    }

    // Check for undefined abbreviations
    const abbreviationRegex = /\b[A-Z]{2,}\b/g
    while ((match = abbreviationRegex.exec(text)) !== null) {
      const abbr = match[0]
      if (!MEDICAL_ABBREVIATIONS.has(abbr) && !text.includes(`${abbr} (`)) {
        issues.push({
          type: 'terminology',
          message: `Abbreviation "${abbr}" should be defined on first use`,
          position: match.index,
          suggestion: `${abbr} (${MEDICAL_ABBREVIATIONS.get(abbr) || 'define here'})`
        })
      }
    }

    // Check for consistency in terminology
    const inconsistencies = this.checkTerminologyConsistency(text)
    issues.push(...inconsistencies)

    return { issues }
  }

  /**
   * Generate references and citations
   */
  async suggestReferences(
    text: string,
    citationStyle: 'apa' | 'mla' | 'chicago' | 'vancouver' = 'vancouver'
  ): Promise<Reference[]> {
    const references: Reference[] = []

    // Extract statements that need citations
    const statementsNeedingCitation = this.extractStatementsNeedingCitation(text)

    for (const statement of statementsNeedingCitation) {
      // In production, this would query medical literature databases
      const suggestedRef: Reference = {
        id: `ref-${Date.now()}-${Math.random()}`,
        type: 'journal',
        title: 'Suggested reference for: ' + statement.substring(0, 50),
        authors: ['Author, A.', 'Author, B.'],
        publication: 'Journal Name',
        year: new Date().getFullYear(),
        citationStyle,
        citationText: this.formatCitation({
          authors: ['Author, A.', 'Author, B.'],
          year: new Date().getFullYear(),
          title: 'Article Title',
          journal: 'Journal Name'
        }, citationStyle)
      }
      references.push(suggestedRef)
    }

    return references
  }

  /**
   * Validate statistical data
   */
  validateStatistics(stats: StatisticalData): {
    valid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    // Check p-value
    if (stats.pValue !== undefined) {
      if (stats.pValue < 0 || stats.pValue > 1) {
        issues.push('P-value must be between 0 and 1')
      }
      if (stats.pValue < 0.001) {
        suggestions.push('Report as p < 0.001 rather than exact value')
      }
    }

    // Check confidence interval
    if (stats.confidenceInterval) {
      const [lower, upper] = stats.confidenceInterval
      if (lower >= upper) {
        issues.push('Lower bound of CI must be less than upper bound')
      }
    }

    // Check sample size
    if (stats.sampleSize !== undefined && stats.sampleSize < 1) {
      issues.push('Sample size must be at least 1')
    }

    // Check effect size
    if (stats.effectSize !== undefined) {
      if (Math.abs(stats.effectSize) > 10) {
        suggestions.push('Unusually large effect size - please verify')
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions
    }
  }

  // Private helper methods

  private detectContentType(context: string): string {
    const lowerContext = context.toLowerCase()
    
    if (lowerContext.includes('protocol') || lowerContext.includes('clinical trial') ||
        lowerContext.includes('phase') || lowerContext.includes('enrollment')) {
      return 'clinical_trial'
    }
    
    if (lowerContext.includes('patient') || lowerContext.includes('diagnosis') ||
        lowerContext.includes('treatment') || lowerContext.includes('prognosis')) {
      return 'medical_report'
    }
    
    if (lowerContext.includes('abstract') || lowerContext.includes('methodology') ||
        lowerContext.includes('results') || lowerContext.includes('conclusion')) {
      return 'research_paper'
    }
    
    return 'general'
  }

  private async generateClinicalTrialSuggestions(
    context: string,
    position: number
  ): Promise<AIContentSuggestion[]> {
    const suggestions: AIContentSuggestion[] = []

    // Suggest protocol sections
    if (context.includes('protocol')) {
      suggestions.push({
        id: `sug-${Date.now()}-1`,
        type: 'completion',
        suggestion: 'Include: Study objectives, eligibility criteria, treatment plan, ' +
                   'assessment schedule, statistical analysis plan, and safety monitoring',
        confidence: 0.9,
        context,
        position,
        medicalAccuracy: 0.95
      })
    }

    // Suggest inclusion/exclusion criteria format
    if (context.includes('inclusion') || context.includes('exclusion')) {
      suggestions.push({
        id: `sug-${Date.now()}-2`,
        type: 'completion',
        suggestion: 'Inclusion Criteria:\n- Age ≥ 18 years\n- Confirmed diagnosis of [condition]\n' +
                   '- ECOG performance status 0-2\n- Adequate organ function\n\n' +
                   'Exclusion Criteria:\n- Prior treatment with [drug]\n- Active infection\n' +
                   '- Pregnancy or breastfeeding',
        confidence: 0.85,
        context,
        position,
        medicalAccuracy: 0.9
      })
    }

    return suggestions
  }

  private async generateMedicalReportSuggestions(
    context: string,
    position: number
  ): Promise<AIContentSuggestion[]> {
    const suggestions: AIContentSuggestion[] = []

    // Suggest SOAP note format
    if (context.includes('assessment') || context.includes('plan')) {
      suggestions.push({
        id: `sug-${Date.now()}-3`,
        type: 'completion',
        suggestion: 'Subjective:\n[Patient complaints and history]\n\n' +
                   'Objective:\n[Physical exam findings, lab results]\n\n' +
                   'Assessment:\n[Clinical impression and differential diagnosis]\n\n' +
                   'Plan:\n[Treatment recommendations and follow-up]',
        confidence: 0.88,
        context,
        position,
        medicalAccuracy: 0.92
      })
    }

    return suggestions
  }

  private async generateResearchPaperSuggestions(
    context: string,
    position: number
  ): Promise<AIContentSuggestion[]> {
    const suggestions: AIContentSuggestion[] = []

    // Suggest IMRAD structure
    if (context.includes('introduction') || context.includes('methods')) {
      suggestions.push({
        id: `sug-${Date.now()}-4`,
        type: 'completion',
        suggestion: 'Follow IMRAD structure:\n' +
                   '1. Introduction - Background and objectives\n' +
                   '2. Methods - Study design, participants, procedures\n' +
                   '3. Results - Findings with statistical analysis\n' +
                   '4. Discussion - Interpretation, limitations, conclusions',
        confidence: 0.9,
        context,
        position,
        medicalAccuracy: 0.95
      })
    }

    return suggestions
  }

  private async generateTerminologySuggestions(
    context: string,
    position: number
  ): Promise<AIContentSuggestion[]> {
    const suggestions: AIContentSuggestion[] = []
    
    // Find potentially incorrect medical terms
    const words = context.split(/\s+/)
    for (const word of words) {
      const validation = await this.validateMedicalTerm(word)
      if (!validation.isValid && word.length > 3) {
        // Suggest corrections for potentially misspelled medical terms
        const similarTerms = this.findSimilarMedicalTerms(word)
        if (similarTerms.length > 0) {
          suggestions.push({
            id: `sug-${Date.now()}-${Math.random()}`,
            type: 'correction',
            suggestion: similarTerms[0],
            confidence: 0.7,
            context: word,
            position,
            alternatives: similarTerms.slice(1, 3),
            explanation: `Did you mean "${similarTerms[0]}"?`
          })
        }
      }
    }

    return suggestions
  }

  private async generateCitationSuggestions(
    context: string,
    position: number
  ): Promise<AIContentSuggestion[]> {
    const suggestions: AIContentSuggestion[] = []

    // Detect statements that need citations
    const citationPatterns = [
      /studies (have )?shown?/i,
      /research (indicates|suggests)/i,
      /according to/i,
      /\d+%\s+of\s+(patients|subjects)/i,
      /significant(ly)?\s+(increase|decrease|difference)/i
    ]

    for (const pattern of citationPatterns) {
      if (pattern.test(context)) {
        suggestions.push({
          id: `sug-${Date.now()}-cite`,
          type: 'citation',
          suggestion: '[Citation needed]',
          confidence: 0.85,
          context,
          position,
          explanation: 'This statement requires a citation to support the claim'
        })
        break
      }
    }

    return suggestions
  }

  private calculateReadability(text: string): number {
    // Flesch Reading Ease score
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0)

    if (sentences.length === 0 || words.length === 0) return 0

    const score = 206.835 - 
                  1.015 * (words.length / sentences.length) - 
                  84.6 * (syllables / words.length)

    return Math.max(0, Math.min(100, score))
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase()
    let count = 0
    let previousWasVowel = false

    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i])
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }

    // Adjust for silent e
    if (word.endsWith('e')) {
      count--
    }

    // Ensure at least one syllable
    return Math.max(1, count)
  }

  private async assessMedicalAccuracy(text: string): Promise<number> {
    // In production, this would use AI models trained on medical literature
    // For now, return a score based on presence of validated medical terms
    const words = text.split(/\s+/)
    let validTerms = 0
    let totalMedicalTerms = 0

    for (const word of words) {
      if (this.isPotentialMedicalTerm(word)) {
        totalMedicalTerms++
        const validation = await this.validateMedicalTerm(word)
        if (validation.isValid) {
          validTerms++
        }
      }
    }

    if (totalMedicalTerms === 0) return 1.0
    return validTerms / totalMedicalTerms
  }

  private isPotentialMedicalTerm(word: string): boolean {
    // Simple heuristic to identify potential medical terms
    return word.length > 5 && 
           (word.endsWith('itis') || word.endsWith('osis') || 
            word.endsWith('emia') || word.endsWith('pathy') ||
            word.includes('cardio') || word.includes('neuro') ||
            word.includes('hepato') || word.includes('nephro'))
  }

  private checkClinicalTrialCompliance(text: string): string[] {
    const issues: string[] = []

    // Check for required sections
    const requiredSections = [
      'objectives', 'eligibility', 'intervention', 
      'outcomes', 'statistical', 'ethics'
    ]

    for (const section of requiredSections) {
      if (!text.toLowerCase().includes(section)) {
        issues.push(`Missing required section: ${section}`)
      }
    }

    // Check for GCP compliance
    if (!text.includes('informed consent')) {
      issues.push('No mention of informed consent process')
    }

    if (!text.includes('adverse event') && !text.includes('AE')) {
      issues.push('No mention of adverse event reporting')
    }

    return issues
  }

  private checkPatientEducationCompliance(text: string): string[] {
    const issues: string[] = []

    // Check readability for patient materials
    const readabilityScore = this.calculateReadability(text)
    if (readabilityScore < 60) {
      issues.push('Readability score too low for patient education (should be >60)')
    }

    // Check for medical jargon
    const jargonTerms = this.detectMedicalJargon(text)
    if (jargonTerms.length > 0) {
      issues.push(`Contains medical jargon that should be explained: ${jargonTerms.join(', ')}`)
    }

    return issues
  }

  private detectMedicalJargon(text: string): string[] {
    const jargon: string[] = []
    const complexTerms = [
      'etiology', 'pathophysiology', 'contraindication', 
      'idiopathic', 'prophylaxis', 'morbidity'
    ]

    for (const term of complexTerms) {
      if (text.toLowerCase().includes(term)) {
        jargon.push(term)
      }
    }

    return jargon
  }

  private extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = []
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    // Extract sentences with key indicators
    const keyIndicators = [
      'significant', 'primary', 'conclusion', 'finding',
      'result', 'demonstrate', 'indicate', 'suggest'
    ]

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      for (const indicator of keyIndicators) {
        if (lowerSentence.includes(indicator)) {
          keyPoints.push(sentence.trim())
          break
        }
      }
    }

    return keyPoints.slice(0, 5) // Return top 5 key points
  }

  private async generateSummary(text: string): Promise<string> {
    // Extract the most important sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    if (sentences.length === 0) return ''

    // Simple extractive summarization
    const importantSentences = sentences
      .filter(s => {
        const lower = s.toLowerCase()
        return lower.includes('conclusion') ||
               lower.includes('result') ||
               lower.includes('significant') ||
               lower.includes('demonstrate')
      })
      .slice(0, 3)

    if (importantSentences.length > 0) {
      return importantSentences.join('. ') + '.'
    }

    // Fallback to first and last sentences
    return `${sentences[0]}. ${sentences[sentences.length - 1]}.`
  }

  private checkCitations(text: string): {
    found: Reference[]
    missing: string[]
  } {
    const found: Reference[] = []
    const missing: string[] = []

    // Find existing citations (simple pattern matching)
    const citationPattern = /\[(\d+)\]|\(([^)]+,\s*\d{4})\)/g
    const citations = text.match(citationPattern) || []

    for (const citation of citations) {
      found.push({
        id: `ref-${Math.random()}`,
        type: 'journal',
        title: 'Extracted citation',
        authors: [],
        citationStyle: 'vancouver',
        citationText: citation
      })
    }

    // Find statements that need citations
    const needsCitation = [
      /\d+%\s+of\s+(patients|subjects)/g,
      /studies have shown/gi,
      /research indicates/gi
    ]

    for (const pattern of needsCitation) {
      const matches = text.match(pattern) || []
      for (const match of matches) {
        if (!citations.some(c => text.indexOf(c) > text.indexOf(match) - 50)) {
          missing.push(match)
        }
      }
    }

    return { found, missing }
  }

  private async generateImprovementSuggestions(
    text: string,
    analysis: Partial<ContentAnalysis>
  ): Promise<AIContentSuggestion[]> {
    const suggestions: AIContentSuggestion[] = []

    // Suggest improvements based on readability
    if (analysis.readabilityScore && analysis.readabilityScore < 50) {
      suggestions.push({
        id: `improve-${Date.now()}-1`,
        type: 'correction',
        suggestion: 'Consider simplifying complex sentences and using shorter words',
        confidence: 0.8,
        context: '',
        position: 0,
        explanation: 'Text readability is low. Aim for a score above 50.'
      })
    }

    // Suggest adding missing references
    if (analysis.missingReferences && analysis.missingReferences.length > 0) {
      suggestions.push({
        id: `improve-${Date.now()}-2`,
        type: 'citation',
        suggestion: 'Add citations for unsupported claims',
        confidence: 0.9,
        context: analysis.missingReferences.join('; '),
        position: 0,
        explanation: `${analysis.missingReferences.length} statements need citations`
      })
    }

    return suggestions
  }

  private findSynonyms(term: string): string[] {
    // In production, this would use medical thesauri
    const synonymMap = new Map([
      ['hypertension', ['high blood pressure', 'HTN']],
      ['diabetes', ['diabetes mellitus', 'DM']],
      ['myocardial infarction', ['heart attack', 'MI']],
      ['cerebrovascular accident', ['stroke', 'CVA']]
    ])

    return synonymMap.get(term) || []
  }

  private async getTermDefinition(term: string): Promise<string> {
    // In production, this would query medical dictionaries
    const definitions = new Map([
      ['hypertension', 'A condition in which blood pressure is consistently elevated'],
      ['diabetes', 'A group of metabolic disorders characterized by high blood sugar'],
      ['cancer', 'A disease caused by uncontrolled division of abnormal cells']
    ])

    return definitions.get(term) || 'Definition not available'
  }

  private async lookupMedicalCodes(term: string): Promise<{
    icd10Codes?: string[]
    snomedCodes?: string[]
    meshTerms?: string[]
  }> {
    // In production, this would query medical coding databases
    return {
      icd10Codes: [],
      snomedCodes: [],
      meshTerms: []
    }
  }

  private checkTerminologyConsistency(text: string): any[] {
    const issues: any[] = []
    
    // Check for inconsistent use of abbreviations
    const abbreviationUses = new Map<string, string[]>()
    
    // Find all instances of "term (abbreviation)" pattern
    const definePattern = /(\w+[\s\w]*)\s*\(([A-Z]{2,})\)/g
    let match
    
    while ((match = definePattern.exec(text)) !== null) {
      const fullTerm = match[1]
      const abbr = match[2]
      
      if (!abbreviationUses.has(abbr)) {
        abbreviationUses.set(abbr, [])
      }
      abbreviationUses.get(abbr)!.push(fullTerm)
    }
    
    // Check for inconsistent definitions
    for (const [abbr, definitions] of abbreviationUses.entries()) {
      const uniqueDefinitions = [...new Set(definitions)]
      if (uniqueDefinitions.length > 1) {
        issues.push({
          type: 'terminology',
          message: `Inconsistent definitions for abbreviation "${abbr}"`,
          position: 0,
          suggestion: `Use consistent definition: ${uniqueDefinitions[0]}`
        })
      }
    }
    
    return issues
  }

  private extractStatementsNeedingCitation(text: string): string[] {
    const statements: string[] = []
    const sentences = text.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase()
      
      // Check for quantitative claims
      if (/\d+%/.test(sentence)) {
        statements.push(sentence.trim())
        continue
      }
      
      // Check for research claims
      if (lower.includes('study') || lower.includes('research') || 
          lower.includes('trial') || lower.includes('evidence')) {
        statements.push(sentence.trim())
        continue
      }
      
      // Check for comparative claims
      if (lower.includes('more effective') || lower.includes('better than') ||
          lower.includes('superior to') || lower.includes('compared to')) {
        statements.push(sentence.trim())
      }
    }
    
    return statements
  }

  private formatCitation(
    ref: any,
    style: 'apa' | 'mla' | 'chicago' | 'vancouver'
  ): string {
    switch (style) {
      case 'apa':
        return `${ref.authors.join(', ')} (${ref.year}). ${ref.title}. ${ref.journal}.`
      
      case 'vancouver':
        return `${ref.authors.join(', ')}. ${ref.title}. ${ref.journal}. ${ref.year}.`
      
      case 'mla':
        return `${ref.authors[0]}. "${ref.title}." ${ref.journal} (${ref.year}).`
      
      case 'chicago':
        return `${ref.authors.join(', ')}. "${ref.title}." ${ref.journal} (${ref.year}).`
      
      default:
        return `${ref.authors.join(', ')} (${ref.year}). ${ref.title}.`
    }
  }

  private findSimilarMedicalTerms(term: string): string[] {
    const similar: string[] = []
    const normalizedTerm = term.toLowerCase()
    
    // Check all terms in knowledge base
    for (const [category, terms] of this.medicalKnowledgeBase.entries()) {
      for (const knownTerm of terms) {
        const similarity = this.calculateSimilarity(normalizedTerm, knownTerm)
        if (similarity > 0.7) {
          similar.push(knownTerm)
        }
      }
    }
    
    return similar
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance normalized to 0-1
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1.0
    
    const distance = this.levenshteinDistance(str1, str2)
    return 1 - (distance / maxLen)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}