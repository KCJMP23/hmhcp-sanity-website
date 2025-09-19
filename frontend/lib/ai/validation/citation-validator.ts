/**
 * Citation Validator
 * HMHCP Healthcare AI Platform
 * 
 * Comprehensive citation accuracy and source reliability validation
 * for medical and scientific references.
 */

import { ValidationResult, ValidationError, ValidationWarning, ValidationSuggestion } from './medical-validator';

export interface Citation {
  id: string;
  type: 'journal' | 'book' | 'website' | 'government' | 'conference' | 'clinical_trial' | 'guideline';
  authors: string[];
  title: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  year: number;
  doi?: string;
  pmid?: string;
  url?: string;
  accessDate?: Date;
  publisher?: string;
  isbn?: string;
  studyType?: string;
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  retracted?: boolean;
  peerReviewed?: boolean;
}

export interface SourceReliability {
  source: string;
  reliabilityScore: number; // 0-1 scale
  factors: ReliabilityFactor[];
  classification: 'highly_reliable' | 'reliable' | 'moderately_reliable' | 'questionable' | 'unreliable';
  lastAssessed: Date;
}

export interface ReliabilityFactor {
  factor: string;
  weight: number;
  score: number;
  reasoning: string;
}

export interface CitationFormat {
  style: 'ama' | 'apa' | 'nlm' | 'vancouver' | 'harvard' | 'mla';
  pattern: RegExp;
  example: string;
  required: string[];
  optional: string[];
}

export interface JournalMetrics {
  name: string;
  impactFactor?: number;
  citationScore?: number;
  hIndex?: number;
  sjrRanking?: number;
  publisher: string;
  category: string[];
  openAccess: boolean;
  peerReviewPolicy: string;
  lastUpdated: Date;
}

export interface RetractionDatabase {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  retractionReason: string;
  retractionDate: Date;
  originalDoi?: string;
  retractionNotice?: string;
}

export interface CitationValidationOptions {
  checkFormat: boolean;
  verifyDOI: boolean;
  checkRetraction: boolean;
  assessReliability: boolean;
  requirePeerReview: boolean;
  minimumYear?: number;
  preferredStyles: string[];
  allowPreprints: boolean;
  requireFullCitation: boolean;
}

/**
 * Citation Validator Class
 * Provides comprehensive citation validation and source assessment
 */
export class CitationValidator {
  private citationFormats: Map<string, CitationFormat>;
  private sourceReliability: Map<string, SourceReliability>;
  private journalMetrics: Map<string, JournalMetrics>;
  private retractionDatabase: Map<string, RetractionDatabase>;
  private highQualityJournals: Set<string>;
  private predatoryJournals: Set<string>;
  private governmentSources: Set<string>;

  constructor() {
    this.citationFormats = new Map();
    this.sourceReliability = new Map();
    this.journalMetrics = new Map();
    this.retractionDatabase = new Map();
    this.highQualityJournals = new Set();
    this.predatoryJournals = new Set();
    this.governmentSources = new Set();
    
    this.initializeCitationDatabase();
  }

  /**
   * Validate citations in content
   */
  async validateCitations(
    citations: string[],
    options: Partial<CitationValidationOptions> = {}
  ): Promise<ValidationResult> {
    const defaultOptions: CitationValidationOptions = {
      checkFormat: true,
      verifyDOI: true,
      checkRetraction: true,
      assessReliability: true,
      requirePeerReview: false,
      preferredStyles: ['ama', 'nlm'],
      allowPreprints: true,
      requireFullCitation: false
    };

    const validationOptions = { ...defaultOptions, ...options };
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      for (let i = 0; i < citations.length; i++) {
        const citation = citations[i];
        const citationIndex = i + 1;

        // Parse citation
        const parsedCitation = this.parseCitation(citation);
        
        // Format validation
        if (validationOptions.checkFormat) {
          const formatResult = this.validateCitationFormat(citation, validationOptions.preferredStyles);
          if (!formatResult.isValid) {
            warnings.push({
              code: 'CITATION_FORMAT',
              message: `Citation ${citationIndex}: ${formatResult.issue}`,
              field: 'citations',
              recommendation: formatResult.suggestion
            });
          }
        }

        // DOI validation
        if (validationOptions.verifyDOI && parsedCitation?.doi) {
          const doiResult = await this.validateDOI(parsedCitation.doi);
          if (!doiResult.isValid) {
            errors.push({
              code: 'INVALID_DOI',
              message: `Citation ${citationIndex}: Invalid or inaccessible DOI`,
              field: 'citations',
              severity: 'minor',
              confidence: 0.9
            });
          }
        }

        // Retraction check
        if (validationOptions.checkRetraction) {
          const retractionResult = this.checkRetraction(parsedCitation);
          if (retractionResult.isRetracted) {
            errors.push({
              code: 'RETRACTED_CITATION',
              message: `Citation ${citationIndex}: References retracted publication`,
              field: 'citations',
              severity: 'major',
              correction: 'Remove retracted citation or find alternative source',
              sourceReference: retractionResult.retractionNotice,
              confidence: 0.95
            });
          }
        }

        // Source reliability assessment
        if (validationOptions.assessReliability) {
          const reliabilityResult = this.assessSourceReliability(parsedCitation);
          if (reliabilityResult.classification === 'questionable' || 
              reliabilityResult.classification === 'unreliable') {
            warnings.push({
              code: 'QUESTIONABLE_SOURCE',
              message: `Citation ${citationIndex}: Source has questionable reliability (${reliabilityResult.reliabilityScore.toFixed(2)})`,
              field: 'citations',
              recommendation: 'Consider finding more reliable sources'
            });
          }

          // Suggest improvements based on reliability factors
          const improvementSuggestion = this.getSuggestionForImprovement(reliabilityResult);
          if (improvementSuggestion) {
            suggestions.push({
              type: 'citation',
              original: citation,
              suggested: improvementSuggestion.suggested,
              reason: improvementSuggestion.reason,
              confidence: 0.7
            });
          }
        }

        // Peer review requirement
        if (validationOptions.requirePeerReview && parsedCitation) {
          const isPeerReviewed = this.isPeerReviewed(parsedCitation);
          if (!isPeerReviewed) {
            warnings.push({
              code: 'NOT_PEER_REVIEWED',
              message: `Citation ${citationIndex}: Source may not be peer-reviewed`,
              field: 'citations',
              recommendation: 'Prefer peer-reviewed sources for medical claims'
            });
          }
        }

        // Minimum year check
        if (validationOptions.minimumYear && parsedCitation?.year && 
            parsedCitation.year < validationOptions.minimumYear) {
          warnings.push({
            code: 'OUTDATED_CITATION',
            message: `Citation ${citationIndex}: Source is older than minimum year (${parsedCitation.year} < ${validationOptions.minimumYear})`,
            field: 'citations',
            recommendation: 'Consider finding more recent sources'
          });
        }

        // Complete citation check
        if (validationOptions.requireFullCitation) {
          const completenessResult = this.checkCitationCompleteness(parsedCitation);
          if (!completenessResult.isComplete) {
            warnings.push({
              code: 'INCOMPLETE_CITATION',
              message: `Citation ${citationIndex}: Missing required elements: ${completenessResult.missingElements.join(', ')}`,
              field: 'citations',
              recommendation: 'Include all required citation elements'
            });
          }
        }

        // Preprint check
        if (!validationOptions.allowPreprints && this.isPreprint(parsedCitation)) {
          warnings.push({
            code: 'PREPRINT_CITATION',
            message: `Citation ${citationIndex}: References preprint (not peer-reviewed)`,
            field: 'citations',
            recommendation: 'Consider waiting for peer-reviewed publication'
          });
        }
      }

      // Overall citation quality assessment
      const qualityAssessment = this.assessOverallCitationQuality(citations);
      if (qualityAssessment.score < 0.7) {
        suggestions.push({
          type: 'citation',
          original: 'Current citation set',
          suggested: 'Improved citation quality',
          reason: qualityAssessment.recommendations.join('; '),
          confidence: 0.8
        });
      }

      const confidence = this.calculateCitationConfidence(errors, warnings, citations.length);

      return {
        isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'major').length === 0,
        severity: this.getHighestSeverity(errors),
        confidence,
        errors,
        warnings,
        suggestions,
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'citation_validation',
          result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
          details: `Validated ${citations.length} citations with quality score: ${qualityAssessment.score.toFixed(2)}`
        }]
      };

    } catch (error) {
      return {
        isValid: false,
        severity: 'critical',
        confidence: 0,
        errors: [{
          code: 'CITATION_VALIDATION_ERROR',
          message: 'Failed to validate citations',
          field: 'citations',
          severity: 'critical',
          confidence: 1
        }],
        warnings: [],
        suggestions: [],
        auditTrail: [{
          timestamp: new Date(),
          validationType: 'citation_validation',
          result: 'fail',
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * Validate single citation
   */
  async validateSingleCitation(citation: string): Promise<{
    isValid: boolean;
    parsedCitation: Citation | null;
    format: { style: string; isValid: boolean };
    reliability: SourceReliability | null;
    issues: string[];
    suggestions: string[];
  }> {
    const parsedCitation = this.parseCitation(citation);
    const formatResult = this.validateCitationFormat(citation, ['ama', 'nlm', 'apa']);
    const reliability = parsedCitation ? this.assessSourceReliability(parsedCitation) : null;
    
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!formatResult.isValid) {
      issues.push(formatResult.issue || 'Invalid citation format');
      if (formatResult.suggestion) {
        suggestions.push(formatResult.suggestion);
      }
    }

    if (parsedCitation) {
      const retractionResult = this.checkRetraction(parsedCitation);
      if (retractionResult.isRetracted) {
        issues.push('Citation references retracted publication');
      }

      if (reliability && reliability.classification === 'questionable') {
        issues.push('Source has questionable reliability');
        suggestions.push('Consider finding more reliable alternative sources');
      }
    }

    return {
      isValid: issues.length === 0,
      parsedCitation,
      format: { style: formatResult.detectedStyle || 'unknown', isValid: formatResult.isValid },
      reliability,
      issues,
      suggestions
    };
  }

  /**
   * Get citation suggestions for improvement
   */
  async getCitationSuggestions(topic: string, evidenceLevel?: string): Promise<{
    suggestedSources: Array<{
      type: string;
      description: string;
      reliability: number;
      searchStrategy: string;
    }>;
    searchDatabases: string[];
    keywords: string[];
  }> {
    const suggestedSources = this.getSuggestedSourceTypes(topic, evidenceLevel);
    const searchDatabases = this.getRecommendedDatabases(topic);
    const keywords = this.generateSearchKeywords(topic);

    return {
      suggestedSources,
      searchDatabases,
      keywords
    };
  }

  /**
   * Format citation in specified style
   */
  formatCitation(citation: Citation, style: string): string {
    switch (style.toLowerCase()) {
      case 'ama':
        return this.formatAMA(citation);
      case 'apa':
        return this.formatAPA(citation);
      case 'nlm':
        return this.formatNLM(citation);
      case 'vancouver':
        return this.formatVancouver(citation);
      default:
        return this.formatAMA(citation); // Default to AMA
    }
  }

  // Private helper methods

  private initializeCitationDatabase(): void {
    this.initializeCitationFormats();
    this.initializeJournalDatabase();
    this.initializeReliabilityDatabase();
    this.initializeRetractionDatabase();
  }

  private initializeCitationFormats(): void {
    const formats: CitationFormat[] = [
      {
        style: 'ama',
        pattern: /^.*\.\s+.*\.\s+\d{4}(;\d+(\(\d+\))?:\d+(-\d+)?)?\.?/,
        example: 'Author A. Title of article. Journal Name. 2024;15(2):123-130.',
        required: ['authors', 'title', 'journal', 'year'],
        optional: ['volume', 'issue', 'pages', 'doi']
      },
      {
        style: 'apa',
        pattern: /^.*\(\d{4}\)\.\s+.*\.\s+.*,\s*\d+(\(\d+\))?,?\s*\d+(-\d+)?\.?/,
        example: 'Author, A. (2024). Title of article. Journal Name, 15(2), 123-130.',
        required: ['authors', 'year', 'title', 'journal'],
        optional: ['volume', 'issue', 'pages', 'doi']
      },
      {
        style: 'nlm',
        pattern: /^.*\.\s+.*\.\s+.*\s+\d{4}.*;\d+(\(\d+\))?:\d+(-\d+)?\.?/,
        example: 'Author A. Title of article. Journal Name 2024;15(2):123-130.',
        required: ['authors', 'title', 'journal', 'year'],
        optional: ['volume', 'issue', 'pages', 'pmid']
      },
      {
        style: 'vancouver',
        pattern: /^.*\.\s+.*\.\s+.*\.\s+\d{4};\d+(\(\d+\))?:\d+(-\d+)?\.?/,
        example: 'Author A. Title of article. Journal Name. 2024;15(2):123-130.',
        required: ['authors', 'title', 'journal', 'year'],
        optional: ['volume', 'issue', 'pages']
      }
    ];

    formats.forEach(format => {
      this.citationFormats.set(format.style, format);
    });
  }

  private initializeJournalDatabase(): void {
    const journals: JournalMetrics[] = [
      {
        name: 'New England Journal of Medicine',
        impactFactor: 176.079,
        citationScore: 31.4,
        hIndex: 587,
        publisher: 'Massachusetts Medical Society',
        category: ['medicine', 'general'],
        openAccess: false,
        peerReviewPolicy: 'double-blind',
        lastUpdated: new Date('2024-01-01')
      },
      {
        name: 'The Lancet',
        impactFactor: 168.9,
        citationScore: 29.8,
        hIndex: 518,
        publisher: 'Elsevier',
        category: ['medicine', 'general'],
        openAccess: false,
        peerReviewPolicy: 'single-blind',
        lastUpdated: new Date('2024-01-01')
      },
      {
        name: 'JAMA',
        impactFactor: 157.335,
        citationScore: 25.5,
        hIndex: 485,
        publisher: 'American Medical Association',
        category: ['medicine', 'general'],
        openAccess: false,
        peerReviewPolicy: 'double-blind',
        lastUpdated: new Date('2024-01-01')
      },
      {
        name: 'Nature Medicine',
        impactFactor: 87.241,
        citationScore: 22.1,
        hIndex: 398,
        publisher: 'Nature Publishing Group',
        category: ['medicine', 'research'],
        openAccess: false,
        peerReviewPolicy: 'single-blind',
        lastUpdated: new Date('2024-01-01')
      },
      {
        name: 'PLoS One',
        impactFactor: 3.752,
        citationScore: 4.2,
        hIndex: 332,
        publisher: 'Public Library of Science',
        category: ['multidisciplinary'],
        openAccess: true,
        peerReviewPolicy: 'single-blind',
        lastUpdated: new Date('2024-01-01')
      }
    ];

    journals.forEach(journal => {
      this.journalMetrics.set(journal.name.toLowerCase(), journal);
    });

    // High-quality journals
    this.highQualityJournals.add('new england journal of medicine');
    this.highQualityJournals.add('the lancet');
    this.highQualityJournals.add('jama');
    this.highQualityJournals.add('nature');
    this.highQualityJournals.add('science');
    this.highQualityJournals.add('cell');
    this.highQualityJournals.add('nature medicine');
    this.highQualityJournals.add('bmj');
    this.highQualityJournals.add('annals of internal medicine');

    // Government and institutional sources
    this.governmentSources.add('cdc.gov');
    this.governmentSources.add('nih.gov');
    this.governmentSources.add('fda.gov');
    this.governmentSources.add('who.int');
    this.governmentSources.add('cochrane.org');
    this.governmentSources.add('pubmed.ncbi.nlm.nih.gov');

    // Example predatory journals (simplified list)
    this.predatoryJournals.add('international journal of medicine');
    this.predatoryJournals.add('global journal of health science');
  }

  private initializeReliabilityDatabase(): void {
    // Initialize source reliability assessments
    const sources: SourceReliability[] = [
      {
        source: 'pubmed.ncbi.nlm.nih.gov',
        reliabilityScore: 0.95,
        factors: [
          { factor: 'Government database', weight: 0.3, score: 1.0, reasoning: 'NIH/NLM maintained database' },
          { factor: 'Peer review filtering', weight: 0.3, score: 0.9, reasoning: 'Indexes peer-reviewed journals' },
          { factor: 'Citation tracking', weight: 0.2, score: 1.0, reasoning: 'Comprehensive citation data' },
          { factor: 'Editorial oversight', weight: 0.2, score: 0.95, reasoning: 'Rigorous inclusion criteria' }
        ],
        classification: 'highly_reliable',
        lastAssessed: new Date('2024-01-01')
      },
      {
        source: 'cochrane.org',
        reliabilityScore: 0.98,
        factors: [
          { factor: 'Systematic reviews', weight: 0.4, score: 1.0, reasoning: 'Gold standard for systematic reviews' },
          { factor: 'Evidence synthesis', weight: 0.3, score: 0.95, reasoning: 'Rigorous methodology' },
          { factor: 'Independence', weight: 0.3, score: 1.0, reasoning: 'Non-profit, independent organization' }
        ],
        classification: 'highly_reliable',
        lastAssessed: new Date('2024-01-01')
      }
    ];

    sources.forEach(source => {
      this.sourceReliability.set(source.source, source);
    });
  }

  private initializeRetractionDatabase(): void {
    // Initialize retraction database (simplified examples)
    const retractions: RetractionDatabase[] = [
      {
        title: 'Ileal-lymphoid-nodular hyperplasia, non-specific colitis, and pervasive developmental disorder in children',
        authors: ['AJ Wakefield', 'SH Murch', 'A Anthony'],
        journal: 'The Lancet',
        year: 1998,
        retractionReason: 'Fraudulent data, ethical violations',
        retractionDate: new Date('2010-02-02'),
        originalDoi: '10.1016/S0140-6736(97)11096-0',
        retractionNotice: 'Retracted due to fraudulent claims about MMR vaccine safety'
      }
    ];

    retractions.forEach(retraction => {
      const key = `${retraction.title.toLowerCase()}_${retraction.year}`;
      this.retractionDatabase.set(key, retraction);
    });
  }

  private parseCitation(citationText: string): Citation | null {
    try {
      // Simplified citation parsing - in production, would use more sophisticated NLP
      const citation: Partial<Citation> = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'journal' // Default assumption
      };

      // Extract year
      const yearMatch = citationText.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        citation.year = parseInt(yearMatch[0]);
      }

      // Extract DOI
      const doiMatch = citationText.match(/doi:\s*10\.\d+\/\S+/i);
      if (doiMatch) {
        citation.doi = doiMatch[0].replace(/^doi:\s*/i, '');
      }

      // Extract PMID
      const pmidMatch = citationText.match(/pmid:\s*\d+/i);
      if (pmidMatch) {
        citation.pmid = pmidMatch[0].replace(/^pmid:\s*/i, '');
      }

      // Extract title (simplified)
      const titleMatch = citationText.match(/\.\s+([^.]+)\.\s+/);
      if (titleMatch) {
        citation.title = titleMatch[1].trim();
      }

      // Extract journal name (simplified)
      const journalMatch = citationText.match(/\.\s+([A-Z][^.]+)\.\s+\d{4}/);
      if (journalMatch) {
        citation.journal = journalMatch[1].trim();
      }

      // Extract authors (simplified)
      const authorMatch = citationText.match(/^([^.]+)\./);
      if (authorMatch) {
        citation.authors = [authorMatch[1].trim()];
      }

      // Determine if peer-reviewed based on journal
      if (citation.journal) {
        const journalMetrics = this.journalMetrics.get(citation.journal.toLowerCase());
        citation.peerReviewed = journalMetrics?.peerReviewPolicy !== undefined;
      }

      return citation as Citation;
    } catch (error) {
      return null;
    }
  }

  private validateCitationFormat(
    citation: string, 
    preferredStyles: string[]
  ): { isValid: boolean; detectedStyle?: string; issue?: string; suggestion?: string } {
    for (const style of preferredStyles) {
      const format = this.citationFormats.get(style);
      if (format && format.pattern.test(citation)) {
        return { isValid: true, detectedStyle: style };
      }
    }

    // Check all formats to provide better feedback
    for (const [styleName, format] of this.citationFormats) {
      if (format.pattern.test(citation)) {
        return { 
          isValid: true, 
          detectedStyle: styleName,
          suggestion: preferredStyles.includes(styleName) ? 
            undefined : `Consider using ${preferredStyles[0]} format instead`
        };
      }
    }

    return {
      isValid: false,
      issue: 'Citation format not recognized',
      suggestion: `Use one of these formats: ${preferredStyles.join(', ')}`
    };
  }

  private async validateDOI(doi: string): Promise<{ isValid: boolean; accessible: boolean }> {
    // Simplified DOI validation - in production, would make actual HTTP requests
    const doiPattern = /^10\.\d+\/\S+$/;
    const isValid = doiPattern.test(doi);
    
    // Mock accessibility check
    const accessible = isValid && !doi.includes('retracted');
    
    return { isValid, accessible };
  }

  private checkRetraction(citation: Citation | null): { 
    isRetracted: boolean; 
    retractionNotice?: string; 
    retractionDate?: Date 
  } {
    if (!citation || !citation.title) {
      return { isRetracted: false };
    }

    const key = `${citation.title.toLowerCase()}_${citation.year}`;
    const retraction = this.retractionDatabase.get(key);
    
    if (retraction) {
      return {
        isRetracted: true,
        retractionNotice: retraction.retractionNotice,
        retractionDate: retraction.retractionDate
      };
    }

    // Check for retraction indicators in title or journal
    const retractionIndicators = ['retracted', 'withdrawn', 'erratum'];
    const hasIndicator = retractionIndicators.some(indicator => 
      citation.title?.toLowerCase().includes(indicator) ||
      citation.journal?.toLowerCase().includes(indicator)
    );

    return { isRetracted: hasIndicator };
  }

  private assessSourceReliability(citation: Citation | null): SourceReliability {
    if (!citation) {
      return {
        source: 'unknown',
        reliabilityScore: 0.1,
        factors: [],
        classification: 'unreliable',
        lastAssessed: new Date()
      };
    }

    const factors: ReliabilityFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Journal quality assessment
    if (citation.journal) {
      const journalMetrics = this.journalMetrics.get(citation.journal.toLowerCase());
      let journalScore = 0.5; // Default moderate score
      
      if (this.highQualityJournals.has(citation.journal.toLowerCase())) {
        journalScore = 0.9;
      } else if (this.predatoryJournals.has(citation.journal.toLowerCase())) {
        journalScore = 0.1;
      } else if (journalMetrics) {
        // Score based on impact factor
        if (journalMetrics.impactFactor && journalMetrics.impactFactor > 10) {
          journalScore = 0.8;
        } else if (journalMetrics.impactFactor && journalMetrics.impactFactor > 5) {
          journalScore = 0.7;
        } else if (journalMetrics.impactFactor && journalMetrics.impactFactor > 2) {
          journalScore = 0.6;
        }
      }

      factors.push({
        factor: 'Journal quality',
        weight: 0.4,
        score: journalScore,
        reasoning: `Journal assessment based on reputation and metrics`
      });
      totalScore += journalScore * 0.4;
      totalWeight += 0.4;
    }

    // Peer review status
    if (citation.peerReviewed !== undefined) {
      const peerReviewScore = citation.peerReviewed ? 0.9 : 0.3;
      factors.push({
        factor: 'Peer review',
        weight: 0.3,
        score: peerReviewScore,
        reasoning: citation.peerReviewed ? 'Peer-reviewed publication' : 'Not peer-reviewed'
      });
      totalScore += peerReviewScore * 0.3;
      totalWeight += 0.3;
    }

    // Publication date recency
    if (citation.year) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - citation.year;
      let recencyScore = 0.5;
      
      if (age <= 5) recencyScore = 0.9;
      else if (age <= 10) recencyScore = 0.7;
      else if (age <= 20) recencyScore = 0.5;
      else recencyScore = 0.3;

      factors.push({
        factor: 'Publication recency',
        weight: 0.2,
        score: recencyScore,
        reasoning: `Published ${age} years ago`
      });
      totalScore += recencyScore * 0.2;
      totalWeight += 0.2;
    }

    // DOI/PMID presence
    if (citation.doi || citation.pmid) {
      factors.push({
        factor: 'Digital identifier',
        weight: 0.1,
        score: 0.8,
        reasoning: 'Has DOI or PMID for verification'
      });
      totalScore += 0.8 * 0.1;
      totalWeight += 0.1;
    }

    const reliabilityScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;
    
    let classification: SourceReliability['classification'];
    if (reliabilityScore >= 0.8) classification = 'highly_reliable';
    else if (reliabilityScore >= 0.7) classification = 'reliable';
    else if (reliabilityScore >= 0.5) classification = 'moderately_reliable';
    else if (reliabilityScore >= 0.3) classification = 'questionable';
    else classification = 'unreliable';

    return {
      source: citation.journal || citation.url || 'unknown',
      reliabilityScore,
      factors,
      classification,
      lastAssessed: new Date()
    };
  }

  private isPeerReviewed(citation: Citation): boolean {
    if (citation.peerReviewed !== undefined) {
      return citation.peerReviewed;
    }

    // Check if journal is known to be peer-reviewed
    if (citation.journal) {
      const journalMetrics = this.journalMetrics.get(citation.journal.toLowerCase());
      return journalMetrics?.peerReviewPolicy !== undefined;
    }

    // Check for preprint indicators
    if (citation.url) {
      const preprintIndicators = ['arxiv', 'biorxiv', 'medrxiv', 'preprint'];
      const isPreprint = preprintIndicators.some(indicator => 
        citation.url!.toLowerCase().includes(indicator)
      );
      return !isPreprint;
    }

    return false; // Conservative assumption
  }

  private isPreprint(citation: Citation | null): boolean {
    if (!citation) return false;

    const preprintIndicators = ['arxiv', 'biorxiv', 'medrxiv', 'preprint', 'prepublication'];
    
    return preprintIndicators.some(indicator => 
      citation.journal?.toLowerCase().includes(indicator) ||
      citation.url?.toLowerCase().includes(indicator) ||
      citation.title?.toLowerCase().includes(indicator)
    );
  }

  private checkCitationCompleteness(citation: Citation | null): { 
    isComplete: boolean; 
    missingElements: string[] 
  } {
    if (!citation) {
      return { isComplete: false, missingElements: ['entire citation'] };
    }

    const requiredElements = ['authors', 'title', 'year'];
    const missingElements: string[] = [];

    if (!citation.authors || citation.authors.length === 0) {
      missingElements.push('authors');
    }
    if (!citation.title) {
      missingElements.push('title');
    }
    if (!citation.year) {
      missingElements.push('year');
    }

    // Journal-specific requirements
    if (citation.type === 'journal') {
      if (!citation.journal) {
        missingElements.push('journal name');
      }
    }

    return {
      isComplete: missingElements.length === 0,
      missingElements
    };
  }

  private assessOverallCitationQuality(citations: string[]): { 
    score: number; 
    recommendations: string[] 
  } {
    if (citations.length === 0) {
      return { score: 0, recommendations: ['Add citations to support claims'] };
    }

    let totalScore = 0;
    let highQualityCount = 0;
    let recentCount = 0;
    let peerReviewedCount = 0;
    const recommendations: string[] = [];

    for (const citation of citations) {
      const parsed = this.parseCitation(citation);
      if (parsed) {
        const reliability = this.assessSourceReliability(parsed);
        totalScore += reliability.reliabilityScore;
        
        if (reliability.classification === 'highly_reliable' || reliability.classification === 'reliable') {
          highQualityCount++;
        }
        
        if (parsed.year && (new Date().getFullYear() - parsed.year) <= 5) {
          recentCount++;
        }
        
        if (this.isPeerReviewed(parsed)) {
          peerReviewedCount++;
        }
      }
    }

    const averageScore = totalScore / citations.length;
    const highQualityRatio = highQualityCount / citations.length;
    const recentRatio = recentCount / citations.length;
    const peerReviewedRatio = peerReviewedCount / citations.length;

    // Generate recommendations
    if (highQualityRatio < 0.5) {
      recommendations.push('Include more high-quality journal sources');
    }
    if (recentRatio < 0.3) {
      recommendations.push('Add more recent publications (within 5 years)');
    }
    if (peerReviewedRatio < 0.7) {
      recommendations.push('Prefer peer-reviewed sources');
    }
    if (citations.length < 3) {
      recommendations.push('Consider adding more supporting citations');
    }

    const finalScore = (averageScore + highQualityRatio + recentRatio + peerReviewedRatio) / 4;

    return { score: finalScore, recommendations };
  }

  private getSuggestionForImprovement(reliability: SourceReliability): {
    suggested: string;
    reason: string;
  } | null {
    const lowScoreFactors = reliability.factors.filter(f => f.score < 0.5);
    
    if (lowScoreFactors.length === 0) return null;

    const primaryIssue = lowScoreFactors[0];
    
    switch (primaryIssue.factor) {
      case 'Journal quality':
        return {
          suggested: 'Find citation from higher-impact journal',
          reason: 'Current source has low journal quality rating'
        };
      case 'Peer review':
        return {
          suggested: 'Replace with peer-reviewed source',
          reason: 'Current source is not peer-reviewed'
        };
      case 'Publication recency':
        return {
          suggested: 'Find more recent publication on same topic',
          reason: 'Current source is outdated'
        };
      default:
        return {
          suggested: 'Find higher-quality alternative source',
          reason: 'Current source has reliability concerns'
        };
    }
  }

  private getSuggestedSourceTypes(topic: string, evidenceLevel?: string): Array<{
    type: string;
    description: string;
    reliability: number;
    searchStrategy: string;
  }> {
    const sources = [
      {
        type: 'Systematic Review',
        description: 'Comprehensive review of all available evidence',
        reliability: 0.95,
        searchStrategy: 'Search Cochrane Library and PubMed for systematic reviews'
      },
      {
        type: 'Randomized Controlled Trial',
        description: 'High-quality experimental study',
        reliability: 0.9,
        searchStrategy: 'Filter PubMed for RCTs using study type filters'
      },
      {
        type: 'Clinical Practice Guideline',
        description: 'Evidence-based recommendations for practice',
        reliability: 0.85,
        searchStrategy: 'Check professional medical organizations'
      },
      {
        type: 'Cohort Study',
        description: 'Observational study following groups over time',
        reliability: 0.75,
        searchStrategy: 'Search medical databases for longitudinal studies'
      }
    ];

    // Filter based on evidence level if specified
    if (evidenceLevel === 'A') {
      return sources.filter(s => s.reliability >= 0.9);
    } else if (evidenceLevel === 'B') {
      return sources.filter(s => s.reliability >= 0.8);
    }

    return sources;
  }

  private getRecommendedDatabases(topic: string): string[] {
    const baseDatabases = [
      'PubMed/MEDLINE',
      'Cochrane Library',
      'Embase',
      'Web of Science'
    ];

    // Add specialty databases based on topic
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('psychology') || topicLower.includes('mental health')) {
      baseDatabases.push('PsycINFO');
    }
    
    if (topicLower.includes('nursing')) {
      baseDatabases.push('CINAHL');
    }
    
    if (topicLower.includes('cancer') || topicLower.includes('oncology')) {
      baseDatabases.push('CANCER.gov PDQ Database');
    }

    return baseDatabases;
  }

  private generateSearchKeywords(topic: string): string[] {
    // Simplified keyword generation - in production would use NLP
    const words = topic.toLowerCase().split(/\s+/);
    const keywords = [...words];
    
    // Add common medical search terms
    keywords.push('clinical trial', 'systematic review', 'meta-analysis', 'evidence-based');
    
    return keywords.slice(0, 10); // Limit to 10 keywords
  }

  private formatAMA(citation: Citation): string {
    let formatted = '';
    
    if (citation.authors && citation.authors.length > 0) {
      const authors = citation.authors.slice(0, 6); // AMA limits to 6 authors
      formatted += authors.join(', ');
      if (citation.authors.length > 6) {
        formatted += ', et al';
      }
      formatted += '. ';
    }
    
    if (citation.title) {
      formatted += citation.title;
      if (!citation.title.endsWith('.')) formatted += '.';
      formatted += ' ';
    }
    
    if (citation.journal) {
      formatted += citation.journal + '. ';
    }
    
    if (citation.year) {
      formatted += citation.year;
    }
    
    if (citation.volume) {
      formatted += ';' + citation.volume;
      if (citation.issue) {
        formatted += '(' + citation.issue + ')';
      }
      if (citation.pages) {
        formatted += ':' + citation.pages;
      }
    }
    
    formatted += '.';
    
    if (citation.doi) {
      formatted += ' doi:' + citation.doi;
    }
    
    return formatted;
  }

  private formatAPA(citation: Citation): string {
    let formatted = '';
    
    if (citation.authors && citation.authors.length > 0) {
      formatted += citation.authors[0];
      formatted += ' ';
    }
    
    if (citation.year) {
      formatted += '(' + citation.year + '). ';
    }
    
    if (citation.title) {
      formatted += citation.title + '. ';
    }
    
    if (citation.journal) {
      formatted += citation.journal;
      if (citation.volume) {
        formatted += ', ' + citation.volume;
        if (citation.issue) {
          formatted += '(' + citation.issue + ')';
        }
        if (citation.pages) {
          formatted += ', ' + citation.pages;
        }
      }
    }
    
    formatted += '.';
    
    if (citation.doi) {
      formatted += ' https://doi.org/' + citation.doi;
    }
    
    return formatted;
  }

  private formatNLM(citation: Citation): string {
    let formatted = '';
    
    if (citation.authors && citation.authors.length > 0) {
      formatted += citation.authors.join(', ') + '. ';
    }
    
    if (citation.title) {
      formatted += citation.title + '. ';
    }
    
    if (citation.journal) {
      formatted += citation.journal + ' ';
    }
    
    if (citation.year) {
      formatted += citation.year;
    }
    
    if (citation.volume) {
      formatted += ';' + citation.volume;
      if (citation.issue) {
        formatted += '(' + citation.issue + ')';
      }
      if (citation.pages) {
        formatted += ':' + citation.pages;
      }
    }
    
    formatted += '.';
    
    if (citation.pmid) {
      formatted += ' PMID: ' + citation.pmid + '.';
    }
    
    return formatted;
  }

  private formatVancouver(citation: Citation): string {
    return this.formatNLM(citation); // Vancouver is similar to NLM
  }

  private calculateCitationConfidence(
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    citationCount: number
  ): number {
    if (citationCount === 0) return 0;
    
    const errorWeight = errors.reduce((sum, error) => {
      switch (error.severity) {
        case 'critical': return sum + 0.4;
        case 'major': return sum + 0.2;
        case 'minor': return sum + 0.1;
        default: return sum;
      }
    }, 0);
    
    const warningWeight = warnings.length * 0.05;
    const totalWeight = errorWeight + warningWeight;
    
    return Math.max(0, 1 - (totalWeight / citationCount));
  }

  private getHighestSeverity(errors: ValidationError[]): 'critical' | 'major' | 'minor' | 'info' {
    if (errors.some(e => e.severity === 'critical')) return 'critical';
    if (errors.some(e => e.severity === 'major')) return 'major';
    if (errors.some(e => e.severity === 'minor')) return 'minor';
    return 'info';
  }

  // Public utility methods

  /**
   * Get journal metrics
   */
  getJournalMetrics(journalName: string): JournalMetrics | null {
    return this.journalMetrics.get(journalName.toLowerCase()) || null;
  }

  /**
   * Check if journal is high quality
   */
  isHighQualityJournal(journalName: string): boolean {
    return this.highQualityJournals.has(journalName.toLowerCase());
  }

  /**
   * Add custom journal metrics
   */
  addJournalMetrics(journal: JournalMetrics): void {
    this.journalMetrics.set(journal.name.toLowerCase(), journal);
  }

  /**
   * Add retraction entry
   */
  addRetraction(retraction: RetractionDatabase): void {
    const key = `${retraction.title.toLowerCase()}_${retraction.year}`;
    this.retractionDatabase.set(key, retraction);
  }
}

// Export singleton instance
export const citationValidator = new CitationValidator();