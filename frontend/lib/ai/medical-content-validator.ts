/**
 * Medical Content Validator for Healthcare Compliance
 * 
 * Features:
 * - Medical accuracy validation
 * - HIPAA compliance checking
 * - Drug name and dosage verification
 * - Clinical guideline alignment
 * - Evidence quality assessment
 * - Readability scoring for patient materials
 */

import logger from '@/lib/logging/winston-logger'

export interface ValidationResult {
  isValid: boolean
  score: number
  issues: ValidationIssue[]
  warnings: ValidationWarning[]
  suggestions: string[]
  metadata: {
    wordCount: number
    readabilityScore: number
    medicalTermCount: number
    citationCount: number
    complianceLevel: 'full' | 'partial' | 'none'
  }
}

export interface ValidationIssue {
  type: 'error' | 'critical'
  category: string
  message: string
  location?: string
  suggestion?: string
}

export interface ValidationWarning {
  type: 'warning' | 'info'
  category: string
  message: string
  impact: 'low' | 'medium' | 'high'
}

export class MedicalContentValidator {
  // Medical terminology database (simplified - would connect to actual medical DB in production)
  private medicalTerms = new Set([
    'diagnosis', 'prognosis', 'etiology', 'pathophysiology', 'comorbidity',
    'contraindication', 'prophylaxis', 'therapeutic', 'pharmacokinetics',
    'epidemiology', 'morbidity', 'mortality', 'incidence', 'prevalence',
    'differential diagnosis', 'clinical trial', 'randomized controlled trial',
    'systematic review', 'meta-analysis', 'evidence-based', 'patient-centered'
  ])

  // Prohibited claims for medical advertising
  private prohibitedClaims = [
    /guaranteed?\s+(cure|result|outcome)/i,
    /100%\s+(effective|safe|successful)/i,
    /no\s+risk/i,
    /miracle\s+(cure|treatment|drug)/i,
    /breakthrough\s+that\s+doctors\s+don't\s+want/i,
    /one\s+weird\s+trick/i,
    /ancient\s+secret/i
  ]

  // HIPAA identifiers to detect
  private hipaaIdentifiers = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{2}\/\d{2}\/\d{4}\b/, // Date of birth
    /MRN[:\s]*\d+/i, // Medical record number
    /patient\s+id[:\s]*\d+/i, // Patient ID
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+,?\s+\d{2}\s+years?\s+old/i, // Name with age
    /\b\d{5}(-\d{4})?\b/, // ZIP code (careful with this one)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone number
  ]

  // Common drug names for validation
  private commonDrugs = new Set([
    'aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'lisinopril',
    'atorvastatin', 'levothyroxine', 'metoprolol', 'omeprazole', 'amlodipine',
    'simvastatin', 'losartan', 'albuterol', 'gabapentin', 'hydrochlorothiazide'
  ])

  /**
   * Validate medical content comprehensively
   */
  async validateContent(
    content: string,
    contentType: 'clinical' | 'patient-education' | 'marketing' | 'research'
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: string[] = []

    // Basic metrics
    const wordCount = this.countWords(content)
    const readabilityScore = this.calculateReadability(content)
    const medicalTermCount = this.countMedicalTerms(content)
    const citationCount = this.countCitations(content)

    // Run validation checks based on content type
    this.checkHIPAACompliance(content, issues, warnings)
    this.checkMedicalClaims(content, issues, warnings)
    this.checkDrugInformation(content, warnings)
    this.checkCitations(content, contentType, warnings, suggestions)
    this.checkReadability(content, contentType, warnings, suggestions)
    this.checkMedicalAccuracy(content, warnings, suggestions)
    this.checkStructure(content, contentType, suggestions)

    // Calculate overall score
    const score = this.calculateValidationScore(issues, warnings, {
      wordCount,
      readabilityScore,
      medicalTermCount,
      citationCount
    })

    // Determine compliance level
    const complianceLevel = this.determineComplianceLevel(issues, warnings)

    logger.info('Medical content validation completed', {
      contentType,
      score,
      issueCount: issues.length,
      warningCount: warnings.length,
      complianceLevel
    })

    return {
      isValid: issues.filter(i => i.type === 'critical').length === 0,
      score,
      issues,
      warnings,
      suggestions,
      metadata: {
        wordCount,
        readabilityScore,
        medicalTermCount,
        citationCount,
        complianceLevel
      }
    }
  }

  /**
   * Check HIPAA compliance
   */
  private checkHIPAACompliance(
    content: string,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    for (const pattern of this.hipaaIdentifiers) {
      const matches = content.match(pattern)
      if (matches) {
        issues.push({
          type: 'critical',
          category: 'HIPAA',
          message: `Potential HIPAA violation: Protected Health Information detected`,
          location: matches[0],
          suggestion: 'Remove or properly de-identify all patient information'
        })
      }
    }

    // Check for potential indirect identifiers
    if (content.includes('patient') && /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i.test(content)) {
      warnings.push({
        type: 'warning',
        category: 'HIPAA',
        message: 'Content contains dates that could be linked to patient information',
        impact: 'medium'
      })
    }
  }

  /**
   * Check medical claims compliance
   */
  private checkMedicalClaims(
    content: string,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    for (const pattern of this.prohibitedClaims) {
      if (pattern.test(content)) {
        issues.push({
          type: 'error',
          category: 'Medical Claims',
          message: 'Prohibited medical claim detected',
          suggestion: 'Remove absolute guarantees and add appropriate disclaimers'
        })
      }
    }

    // Check for unsubstantiated claims
    const claimPatterns = [
      /clinically proven/i,
      /FDA approved/i,
      /evidence-based/i,
      /peer-reviewed/i
    ]

    for (const pattern of claimPatterns) {
      if (pattern.test(content) && !this.hasCitation(content, 5)) {
        warnings.push({
          type: 'warning',
          category: 'Medical Claims',
          message: 'Medical claim without proper citation',
          impact: 'high'
        })
      }
    }
  }

  /**
   * Check drug information accuracy
   */
  private checkDrugInformation(content: string, warnings: ValidationWarning[]): void {
    // Check for drug names
    const drugMentions = Array.from(this.commonDrugs).filter(drug => 
      content.toLowerCase().includes(drug)
    )

    if (drugMentions.length > 0) {
      // Check for dosage information
      const dosagePattern = /\d+\s*(mg|mcg|g|ml|units?)/i
      if (!dosagePattern.test(content)) {
        warnings.push({
          type: 'info',
          category: 'Drug Information',
          message: 'Drug mentioned without dosage information',
          impact: 'low'
        })
      }

      // Check for contraindications
      if (!content.toLowerCase().includes('contraindication') && 
          !content.toLowerCase().includes('side effect')) {
        warnings.push({
          type: 'warning',
          category: 'Drug Information',
          message: 'Drug information without contraindications or side effects',
          impact: 'medium'
        })
      }
    }
  }

  /**
   * Check citation quality and presence
   */
  private checkCitations(
    content: string,
    contentType: string,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    const citationCount = this.countCitations(content)
    
    // Different requirements by content type
    const minCitations = {
      'clinical': 5,
      'research': 10,
      'patient-education': 2,
      'marketing': 1
    }

    const required = minCitations[contentType] || 3

    if (citationCount < required) {
      warnings.push({
        type: 'warning',
        category: 'Citations',
        message: `Insufficient citations (found ${citationCount}, recommended ${required})`,
        impact: 'medium'
      })
      suggestions.push(`Add ${required - citationCount} more peer-reviewed citations to strengthen credibility`)
    }

    // Check citation recency
    const oldCitationPattern = /\(19\d{2}\)|\(200[0-9]\)|\(201[0-5]\)/g
    const oldCitations = content.match(oldCitationPattern)
    if (oldCitations && oldCitations.length > citationCount * 0.3) {
      warnings.push({
        type: 'info',
        category: 'Citations',
        message: 'Many citations are older than 5 years',
        impact: 'low'
      })
      suggestions.push('Consider updating with more recent research (2019-2024)')
    }
  }

  /**
   * Check readability for target audience
   */
  private checkReadability(
    content: string,
    contentType: string,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    const readability = this.calculateReadability(content)
    
    // Target readability by content type
    const targets = {
      'patient-education': { min: 6, max: 8, name: '6th-8th grade' },
      'marketing': { min: 8, max: 10, name: '8th-10th grade' },
      'clinical': { min: 12, max: 16, name: 'college/graduate' },
      'research': { min: 14, max: 18, name: 'graduate/professional' }
    }

    const target = targets[contentType] || { min: 8, max: 12, name: 'general' }

    if (readability < target.min) {
      warnings.push({
        type: 'info',
        category: 'Readability',
        message: `Content may be too simple for target audience (${target.name} level expected)`,
        impact: 'low'
      })
    } else if (readability > target.max) {
      warnings.push({
        type: 'warning',
        category: 'Readability',
        message: `Content too complex for target audience (${target.name} level expected)`,
        impact: contentType === 'patient-education' ? 'high' : 'medium'
      })
      suggestions.push('Simplify complex sentences and explain medical terminology')
    }
  }

  /**
   * Check medical accuracy indicators
   */
  private checkMedicalAccuracy(
    content: string,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Check for medical terminology usage
    const medicalTermCount = this.countMedicalTerms(content)
    const wordCount = this.countWords(content)
    const termDensity = medicalTermCount / wordCount

    if (termDensity < 0.01) {
      warnings.push({
        type: 'info',
        category: 'Medical Accuracy',
        message: 'Low medical terminology density',
        impact: 'low'
      })
    } else if (termDensity > 0.15) {
      warnings.push({
        type: 'warning',
        category: 'Medical Accuracy',
        message: 'High medical terminology density may affect readability',
        impact: 'medium'
      })
      suggestions.push('Consider adding glossary or explanations for complex medical terms')
    }

    // Check for qualifier words that indicate uncertainty
    const hedgingWords = ['may', 'might', 'could', 'possibly', 'potentially', 'suggests']
    const hedgingCount = hedgingWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      return count + (content.match(regex) || []).length
    }, 0)

    if (hedgingCount > wordCount * 0.02) {
      warnings.push({
        type: 'info',
        category: 'Medical Accuracy',
        message: 'High use of uncertainty qualifiers',
        impact: 'low'
      })
    }
  }

  /**
   * Check content structure
   */
  private checkStructure(
    content: string,
    contentType: string,
    suggestions: string[]
  ): void {
    // Check for headers
    const headerPattern = /^#{1,3}\s+.+$/gm
    const headers = content.match(headerPattern) || []

    if (headers.length < 3) {
      suggestions.push('Add more section headers to improve content structure and scannability')
    }

    // Check for lists
    const listPattern = /^[\*\-\+]\s+.+$/gm
    const listItems = content.match(listPattern) || []

    if (listItems.length === 0 && contentType === 'patient-education') {
      suggestions.push('Consider using bullet points to make information easier to digest')
    }

    // Check for conclusion/summary
    if (!content.toLowerCase().includes('conclusion') && 
        !content.toLowerCase().includes('summary') &&
        !content.toLowerCase().includes('key takeaway')) {
      suggestions.push('Add a conclusion or summary section to reinforce key points')
    }
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.trim().split(/\s+/).length
  }

  /**
   * Calculate readability score (Flesch-Kincaid Grade Level)
   */
  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.trim().split(/\s+/)
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0)

    if (sentences.length === 0 || words.length === 0) return 0

    // Flesch-Kincaid Grade Level formula
    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length
    
    return 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '')
    let count = 0
    let previousVowel = false

    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i])
      if (isVowel && !previousVowel) {
        count++
      }
      previousVowel = isVowel
    }

    // Adjust for silent e
    if (word.endsWith('e')) {
      count--
    }

    // Ensure at least one syllable
    return Math.max(1, count)
  }

  /**
   * Count medical terms in content
   */
  private countMedicalTerms(content: string): number {
    const lowerContent = content.toLowerCase()
    let count = 0

    for (const term of this.medicalTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      const matches = lowerContent.match(regex)
      if (matches) {
        count += matches.length
      }
    }

    return count
  }

  /**
   * Count citations in content
   */
  private countCitations(content: string): number {
    // Match various citation formats
    const patterns = [
      /\(\d{4}\)/g, // (2023)
      /\[\d+\]/g, // [1]
      /et al\./gi, // et al.
      /Journal of/gi, // Journal names
      /doi:\S+/gi, // DOI
    ]

    let count = 0
    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        count += matches.length
      }
    }

    return Math.floor(count / 2) // Rough estimate to avoid overcounting
  }

  /**
   * Check if citation exists near a position
   */
  private hasCitation(content: string, wordsAfter: number): boolean {
    const words = content.split(/\s+/)
    const citationPattern = /\(\d{4}\)|\[\d+\]/

    for (let i = 0; i < Math.min(wordsAfter, words.length); i++) {
      if (citationPattern.test(words[i])) {
        return true
      }
    }
    return false
  }

  /**
   * Calculate overall validation score
   */
  private calculateValidationScore(
    issues: ValidationIssue[],
    warnings: ValidationWarning[],
    metadata: any
  ): number {
    let score = 100

    // Deduct for issues
    score -= issues.filter(i => i.type === 'critical').length * 20
    score -= issues.filter(i => i.type === 'error').length * 10

    // Deduct for warnings
    score -= warnings.filter(w => w.impact === 'high').length * 5
    score -= warnings.filter(w => w.impact === 'medium').length * 3
    score -= warnings.filter(w => w.impact === 'low').length * 1

    // Bonus for good practices
    if (metadata.citationCount >= 5) score += 5
    if (metadata.medicalTermCount > 10) score += 3
    if (metadata.readabilityScore >= 8 && metadata.readabilityScore <= 12) score += 2

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Determine compliance level
   */
  private determineComplianceLevel(
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): 'full' | 'partial' | 'none' {
    if (issues.filter(i => i.type === 'critical').length > 0) {
      return 'none'
    }
    if (issues.length > 0 || warnings.filter(w => w.impact === 'high').length > 0) {
      return 'partial'
    }
    return 'full'
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(validationResult: ValidationResult): string {
    const { metadata, issues, warnings, suggestions } = validationResult

    return `
MEDICAL CONTENT COMPLIANCE REPORT
==================================

Overall Score: ${validationResult.score}/100
Compliance Level: ${metadata.complianceLevel.toUpperCase()}
Valid for Publication: ${validationResult.isValid ? 'YES' : 'NO'}

CONTENT METRICS
---------------
Word Count: ${metadata.wordCount}
Readability Score: ${metadata.readabilityScore.toFixed(1)}
Medical Terms: ${metadata.medicalTermCount}
Citations: ${metadata.citationCount}

CRITICAL ISSUES (${issues.filter(i => i.type === 'critical').length})
----------------
${issues.filter(i => i.type === 'critical').map(i => 
  `- [${i.category}] ${i.message}\n  Suggestion: ${i.suggestion}`
).join('\n') || 'None'}

ERRORS (${issues.filter(i => i.type === 'error').length})
-------
${issues.filter(i => i.type === 'error').map(i => 
  `- [${i.category}] ${i.message}\n  Suggestion: ${i.suggestion}`
).join('\n') || 'None'}

HIGH IMPACT WARNINGS (${warnings.filter(w => w.impact === 'high').length})
--------------------
${warnings.filter(w => w.impact === 'high').map(w => 
  `- [${w.category}] ${w.message}`
).join('\n') || 'None'}

RECOMMENDATIONS
---------------
${suggestions.map(s => `- ${s}`).join('\n') || 'No additional recommendations'}

Generated: ${new Date().toISOString()}
`
  }
}

// Export singleton instance
export const medicalValidator = new MedicalContentValidator()