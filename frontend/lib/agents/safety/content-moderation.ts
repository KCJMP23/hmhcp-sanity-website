/**
 * Content Moderation System
 * 
 * Implements basic filtering for inappropriate content to ensure
 * AI-generated content meets safety standards before publication
 */

export interface ContentModerationResult {
  isAppropriate: boolean
  confidence: number
  flaggedIssues: string[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ModerationRule {
  pattern: RegExp
  category: string
  severity: 'low' | 'medium' | 'high'
  description: string
}

export class ContentModerator {
  private rules: ModerationRule[] = []
  private inappropriateWords: Set<string> = new Set()
  private medicalTerms: Set<string> = new Set()

  constructor() {
    this.initializeRules()
    this.initializeWordLists()
  }

  private initializeRules() {
    this.rules = [
      // Profanity and inappropriate language
      {
        pattern: /\b(fuck|shit|bitch|asshole|damn|hell)\b/gi,
        category: 'profanity',
        severity: 'high',
        description: 'Contains inappropriate language'
      },
      
      // Hate speech patterns
      {
        pattern: /\b(kill|murder|suicide|death)\b/gi,
        category: 'violence',
        severity: 'high',
        description: 'Contains violent content'
      },
      
      // Discriminatory language
      {
        pattern: /\b(racist|sexist|homophobic|discriminatory)\b/gi,
        category: 'discrimination',
        severity: 'high',
        description: 'Contains discriminatory content'
      },
      
      // Medical misinformation patterns
      {
        pattern: /\b(cure.*cancer|miracle.*drug|secret.*treatment)\b/gi,
        category: 'medical_misinformation',
        severity: 'high',
        description: 'Contains unverified medical claims'
      },
      
      // Financial scams
      {
        pattern: /\b(get.*rich.*quick|make.*money.*fast|guaranteed.*returns)\b/gi,
        category: 'financial_scam',
        severity: 'high',
        description: 'Contains financial scam language'
      }
    ]
  }

  private initializeWordLists() {
    // Inappropriate words (partial list for demonstration)
    this.inappropriateWords = new Set([
      'profanity', 'inappropriate', 'offensive', 'vulgar'
    ])

    // Medical terms that need careful handling
    this.medicalTerms = new Set([
      'diagnosis', 'treatment', 'medication', 'symptoms',
      'disease', 'condition', 'therapy', 'clinical'
    ])
  }

  /**
   * Moderate content for appropriateness
   */
  async moderateContent(content: string, contentType: 'blog' | 'social' | 'meta' | 'general'): Promise<ContentModerationResult> {
    const flaggedIssues: string[] = []
    const recommendations: string[] = []
    let totalIssues = 0
    let highSeverityIssues = 0

    // Check against rules
    for (const rule of this.rules) {
      const matches = content.match(rule.pattern)
      if (matches) {
        flaggedIssues.push(`${rule.description} (${rule.category})`)
        totalIssues++
        
        if (rule.severity === 'high') {
          highSeverityIssues++
        }
      }
    }

    // Check for inappropriate word density
    const words = content.toLowerCase().split(/\s+/)
    const inappropriateCount = words.filter(word => this.inappropriateWords.has(word)).length
    const inappropriateRatio = inappropriateCount / words.length

    if (inappropriateRatio > 0.01) { // More than 1% inappropriate words
      flaggedIssues.push('High density of inappropriate language')
      totalIssues++
    }

    // Check content length and structure
    if (contentType === 'blog' && content.length < 100) {
      flaggedIssues.push('Content too short for blog post')
      recommendations.push('Expand content to at least 300 words')
    }

    if (contentType === 'meta' && content.length > 160) {
      flaggedIssues.push('Meta description too long')
      recommendations.push('Keep meta descriptions under 160 characters')
    }

    // Check for medical content that needs disclaimers
    const hasMedicalContent = Array.from(this.medicalTerms).some(term => 
      content.toLowerCase().includes(term)
    )

    if (hasMedicalContent && contentType === 'blog') {
      recommendations.push('Add medical disclaimer for healthcare content')
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (highSeverityIssues > 0 || totalIssues > 3) {
      riskLevel = 'high'
    } else if (totalIssues > 1) {
      riskLevel = 'medium'
    }

    // Calculate confidence score
    const confidence = Math.max(0, 100 - (totalIssues * 20) - (highSeverityIssues * 30))

    // Determine if content is appropriate
    const isAppropriate = riskLevel !== 'high' && confidence > 70

    // Add general recommendations
    if (contentType === 'blog') {
      recommendations.push('Ensure content is factually accurate')
      recommendations.push('Include proper citations for claims')
    }

    if (contentType === 'social') {
      recommendations.push('Keep tone professional and engaging')
      recommendations.push('Avoid controversial topics')
    }

    return {
      isAppropriate,
      confidence,
      flaggedIssues,
      recommendations,
      riskLevel
    }
  }

  /**
   * Check if content contains PHI (Protected Health Information)
   */
  async checkForPHI(content: string): Promise<{
    containsPHI: boolean
    phiTypes: string[]
    recommendations: string[]
  }> {
    const phiPatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'SSN' },
      { pattern: /\b\d{10,11}\b/, type: 'Phone Number' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, type: 'Email' },
      { pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, type: 'Date of Birth' },
      { pattern: /\b[A-Z]{2}\d{2}\d{2}\d{4}\b/, type: 'Medical Record Number' }
    ]

    const phiTypes: string[] = []
    
    for (const phi of phiPatterns) {
      if (phi.pattern.test(content)) {
        phiTypes.push(phi.type)
      }
    }

    const containsPHI = phiTypes.length > 0
    const recommendations = containsPHI ? [
      'Remove or anonymize all personal identifiers',
      'Use generic examples instead of specific cases',
      'Ensure HIPAA compliance for healthcare content'
    ] : []

    return {
      containsPHI,
      phiTypes,
      recommendations
    }
  }

  /**
   * Validate content for specific content types
   */
  async validateContent(content: string, contentType: 'blog' | 'social' | 'meta'): Promise<{
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }> {
    const issues: string[] = []
    const suggestions: string[] = []

    switch (contentType) {
      case 'blog':
        if (content.length < 300) {
          issues.push('Blog post too short (minimum 300 words)')
          suggestions.push('Expand content with more details and examples')
        }
        if (!content.includes('#')) {
          suggestions.push('Add headings to improve readability')
        }
        break

      case 'social':
        if (content.length > 280) {
          issues.push('Social media post too long for Twitter')
          suggestions.push('Keep posts under 280 characters')
        }
        if (!content.includes('@') && !content.includes('#')) {
          suggestions.push('Add mentions (@username) and hashtags (#topic)')
        }
        break

      case 'meta':
        if (content.length > 160) {
          issues.push('Meta description too long')
          suggestions.push('Keep under 160 characters for optimal display')
        }
        if (content.length < 50) {
          issues.push('Meta description too short')
          suggestions.push('Provide more descriptive summary')
        }
        break
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }
}

export const contentModerator = new ContentModerator()
















