/**
 * Advanced SEO Service with Healthcare-Specific Features
 * Provides comprehensive SEO analysis, optimization, and monitoring
 */

import { cache } from 'react'

// Core Web Vitals Types
export interface CoreWebVitals {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  inp: number // Interaction to Next Paint
}

// SEO Score Components
export interface SEOScore {
  overall: number
  technical: number
  content: number
  performance: number
  accessibility: number
  healthcare: number // Healthcare-specific scoring
}

// Healthcare-Specific SEO
export interface HealthcareSEO {
  medicalAuthority: number // E-A-T score
  clinicalAccuracy: number
  patientReadability: number
  medicalTerminology: boolean
  hipaaCompliant: boolean
  localHealthcare: boolean
}

// Content Analysis
export interface ContentAnalysis {
  readabilityScore: number
  fleschKincaidGrade: number
  keywordDensity: Map<string, number>
  semanticKeywords: string[]
  contentLength: number
  headingStructure: HeadingStructure[]
  internalLinks: number
  externalLinks: number
  images: ImageAnalysis[]
  medicalTerms: MedicalTerm[]
}

export interface HeadingStructure {
  level: number
  text: string
  keywords: string[]
  length: number
}

export interface ImageAnalysis {
  src: string
  alt: string
  title?: string
  width?: number
  height?: number
  format?: string
  size?: number
  hasAlt: boolean
  altQuality: number
}

export interface MedicalTerm {
  term: string
  frequency: number
  definition?: string
  icd10Code?: string
  snomedCode?: string
}

// Schema Markup
export interface SchemaMarkup {
  type: string
  properties: Record<string, any>
  valid: boolean
  warnings: string[]
  recommendations: string[]
}

// Technical SEO Audit
export interface TechnicalSEOAudit {
  crawlability: CrawlabilityCheck
  indexability: IndexabilityCheck
  siteSpeed: SiteSpeedMetrics
  mobileUsability: MobileUsabilityCheck
  securityIssues: SecurityCheck[]
  structuredData: SchemaMarkup[]
  sitemapStatus: SitemapStatus
  robotsTxtStatus: RobotsTxtStatus
}

export interface CrawlabilityCheck {
  accessible: boolean
  blockedResources: string[]
  orphanPages: string[]
  redirectChains: RedirectChain[]
  brokenLinks: string[]
}

export interface IndexabilityCheck {
  indexablePages: number
  noindexPages: string[]
  canonicalIssues: string[]
  duplicateContent: string[]
  thinContent: string[]
}

export interface SiteSpeedMetrics {
  pageLoadTime: number
  serverResponseTime: number
  totalPageSize: number
  httpRequests: number
  optimizedImages: boolean
  minifiedResources: boolean
  gzipEnabled: boolean
  cacheHeaders: boolean
}

export interface MobileUsabilityCheck {
  mobileResponsive: boolean
  viewportConfigured: boolean
  touchTargetSize: boolean
  fontSizeReadable: boolean
  contentWidth: boolean
}

export interface SecurityCheck {
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
}

export interface SitemapStatus {
  exists: boolean
  valid: boolean
  lastModified: Date
  urlCount: number
  errors: string[]
}

export interface RobotsTxtStatus {
  exists: boolean
  valid: boolean
  disallowedPaths: string[]
  crawlDelay?: number
  sitemapReference: boolean
}

export interface RedirectChain {
  originalUrl: string
  chain: string[]
  finalUrl: string
  statusCodes: number[]
}

// Keyword Research
export interface KeywordData {
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: number
  trend: 'rising' | 'stable' | 'declining'
  relatedKeywords: string[]
  questions: string[]
  medicalRelevance: number
}

// Competitor Analysis
export interface CompetitorAnalysis {
  domain: string
  domainAuthority: number
  organicTraffic: number
  keywords: number
  backlinks: number
  topPages: CompetitorPage[]
  contentGaps: string[]
  technicalScore: number
}

export interface CompetitorPage {
  url: string
  title: string
  traffic: number
  keywords: string[]
  backlinks: number
}

// Performance Monitoring
export interface PerformanceMetrics {
  timestamp: Date
  url: string
  coreWebVitals: CoreWebVitals
  lighthouse: LighthouseScore
  userExperience: UserExperienceMetrics
  resourceMetrics: ResourceMetrics
}

export interface LighthouseScore {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  pwa: number
}

export interface UserExperienceMetrics {
  bounceRate: number
  avgTimeOnPage: number
  exitRate: number
  scrollDepth: number
  clickThroughRate: number
}

export interface ResourceMetrics {
  images: ResourceDetail[]
  scripts: ResourceDetail[]
  stylesheets: ResourceDetail[]
  fonts: ResourceDetail[]
  totalSize: number
  totalRequests: number
}

export interface ResourceDetail {
  url: string
  size: number
  loadTime: number
  cached: boolean
  compressed: boolean
}

export class AdvancedSEOService {
  private static readonly MEDICAL_KEYWORDS = [
    'clinical trial', 'healthcare', 'medical', 'patient', 'treatment',
    'diagnosis', 'therapy', 'research', 'study', 'health'
  ]

  /**
   * Perform comprehensive SEO audit
   */
  static async performComprehensiveAudit(url: string): Promise<{
    score: SEOScore
    technical: TechnicalSEOAudit
    content: ContentAnalysis
    performance: PerformanceMetrics
    healthcare: HealthcareSEO
    recommendations: string[]
  }> {
    // Simulate comprehensive audit (in production, integrate with real tools)
    const [technical, content, performance, healthcare] = await Promise.all([
      this.auditTechnicalSEO(url),
      this.analyzeContent(url),
      this.measurePerformance(url),
      this.analyzeHealthcareSEO(url)
    ])

    const score = this.calculateSEOScore(technical, content, performance, healthcare)
    const recommendations = this.generateRecommendations(score, technical, content, performance)

    return {
      score,
      technical,
      content,
      performance,
      healthcare,
      recommendations
    }
  }

  /**
   * Audit technical SEO aspects
   */
  private static async auditTechnicalSEO(url: string): Promise<TechnicalSEOAudit> {
    // Simulate technical audit
    return {
      crawlability: {
        accessible: true,
        blockedResources: [],
        orphanPages: [],
        redirectChains: [],
        brokenLinks: []
      },
      indexability: {
        indexablePages: 100,
        noindexPages: [],
        canonicalIssues: [],
        duplicateContent: [],
        thinContent: []
      },
      siteSpeed: {
        pageLoadTime: 2.5,
        serverResponseTime: 0.3,
        totalPageSize: 2048000,
        httpRequests: 45,
        optimizedImages: true,
        minifiedResources: true,
        gzipEnabled: true,
        cacheHeaders: true
      },
      mobileUsability: {
        mobileResponsive: true,
        viewportConfigured: true,
        touchTargetSize: true,
        fontSizeReadable: true,
        contentWidth: true
      },
      securityIssues: [],
      structuredData: [],
      sitemapStatus: {
        exists: true,
        valid: true,
        lastModified: new Date(),
        urlCount: 150,
        errors: []
      },
      robotsTxtStatus: {
        exists: true,
        valid: true,
        disallowedPaths: ['/admin', '/api'],
        crawlDelay: undefined,
        sitemapReference: true
      }
    }
  }

  /**
   * Analyze content for SEO
   */
  private static async analyzeContent(url: string): Promise<ContentAnalysis> {
    // Simulate content analysis
    return {
      readabilityScore: 75,
      fleschKincaidGrade: 8.5,
      keywordDensity: new Map([
        ['healthcare', 2.5],
        ['clinical trial', 1.8],
        ['patient', 2.1]
      ]),
      semanticKeywords: ['medical research', 'healthcare technology', 'clinical studies'],
      contentLength: 1500,
      headingStructure: [
        { level: 1, text: 'Healthcare Technology Solutions', keywords: ['healthcare', 'technology'], length: 30 },
        { level: 2, text: 'Clinical Research Excellence', keywords: ['clinical', 'research'], length: 28 }
      ],
      internalLinks: 15,
      externalLinks: 5,
      images: [],
      medicalTerms: [
        { term: 'clinical trial', frequency: 8 },
        { term: 'patient outcomes', frequency: 5 }
      ]
    }
  }

  /**
   * Measure performance metrics
   */
  private static async measurePerformance(url: string): Promise<PerformanceMetrics> {
    // Simulate performance measurement
    return {
      timestamp: new Date(),
      url,
      coreWebVitals: {
        lcp: 2.5,
        fid: 100,
        cls: 0.1,
        fcp: 1.8,
        ttfb: 0.8,
        inp: 200
      },
      lighthouse: {
        performance: 85,
        accessibility: 92,
        bestPractices: 88,
        seo: 90,
        pwa: 65
      },
      userExperience: {
        bounceRate: 35,
        avgTimeOnPage: 180,
        exitRate: 40,
        scrollDepth: 65,
        clickThroughRate: 3.5
      },
      resourceMetrics: {
        images: [],
        scripts: [],
        stylesheets: [],
        fonts: [],
        totalSize: 2048000,
        totalRequests: 45
      }
    }
  }

  /**
   * Analyze healthcare-specific SEO factors
   */
  private static async analyzeHealthcareSEO(url: string): Promise<HealthcareSEO> {
    return {
      medicalAuthority: 85,
      clinicalAccuracy: 90,
      patientReadability: 75,
      medicalTerminology: true,
      hipaaCompliant: true,
      localHealthcare: true
    }
  }

  /**
   * Calculate comprehensive SEO score
   */
  private static calculateSEOScore(
    technical: TechnicalSEOAudit,
    content: ContentAnalysis,
    performance: PerformanceMetrics,
    healthcare: HealthcareSEO
  ): SEOScore {
    // Calculate individual scores
    const technicalScore = this.calculateTechnicalScore(technical)
    const contentScore = this.calculateContentScore(content)
    const performanceScore = this.calculatePerformanceScore(performance)
    const accessibilityScore = performance.lighthouse.accessibility
    const healthcareScore = this.calculateHealthcareScore(healthcare)

    // Weight the scores for overall calculation
    const overall = (
      technicalScore * 0.25 +
      contentScore * 0.25 +
      performanceScore * 0.20 +
      accessibilityScore * 0.15 +
      healthcareScore * 0.15
    )

    return {
      overall: Math.round(overall),
      technical: Math.round(technicalScore),
      content: Math.round(contentScore),
      performance: Math.round(performanceScore),
      accessibility: Math.round(accessibilityScore),
      healthcare: Math.round(healthcareScore)
    }
  }

  private static calculateTechnicalScore(technical: TechnicalSEOAudit): number {
    let score = 100

    // Deduct for issues
    if (technical.crawlability.brokenLinks.length > 0) score -= 10
    if (technical.crawlability.redirectChains.length > 0) score -= 5
    if (technical.indexability.duplicateContent.length > 0) score -= 15
    if (technical.indexability.thinContent.length > 0) score -= 10
    if (!technical.siteSpeed.optimizedImages) score -= 10
    if (!technical.mobileUsability.mobileResponsive) score -= 20
    if (technical.securityIssues.length > 0) score -= 15
    if (!technical.sitemapStatus.exists) score -= 10
    if (!technical.robotsTxtStatus.exists) score -= 5

    return Math.max(0, score)
  }

  private static calculateContentScore(content: ContentAnalysis): number {
    let score = 100

    // Readability
    if (content.readabilityScore < 60) score -= 15
    else if (content.readabilityScore < 70) score -= 10
    else if (content.readabilityScore < 80) score -= 5

    // Content length
    if (content.contentLength < 300) score -= 20
    else if (content.contentLength < 600) score -= 10
    else if (content.contentLength < 1000) score -= 5

    // Structure
    if (content.headingStructure.length === 0) score -= 15
    if (content.internalLinks < 3) score -= 10
    if (content.images.filter(img => !img.hasAlt).length > 0) score -= 10

    return Math.max(0, score)
  }

  private static calculatePerformanceScore(performance: PerformanceMetrics): number {
    let score = 100

    // Core Web Vitals
    if (performance.coreWebVitals.lcp > 4) score -= 20
    else if (performance.coreWebVitals.lcp > 2.5) score -= 10
    
    if (performance.coreWebVitals.fid > 300) score -= 15
    else if (performance.coreWebVitals.fid > 100) score -= 8
    
    if (performance.coreWebVitals.cls > 0.25) score -= 15
    else if (performance.coreWebVitals.cls > 0.1) score -= 8

    // Page metrics
    if (performance.userExperience.bounceRate > 70) score -= 10
    else if (performance.userExperience.bounceRate > 50) score -= 5

    return Math.max(0, score)
  }

  private static calculateHealthcareScore(healthcare: HealthcareSEO): number {
    let score = 0

    score += (healthcare.medicalAuthority / 100) * 25
    score += (healthcare.clinicalAccuracy / 100) * 25
    score += (healthcare.patientReadability / 100) * 20
    score += healthcare.medicalTerminology ? 10 : 0
    score += healthcare.hipaaCompliant ? 10 : 0
    score += healthcare.localHealthcare ? 10 : 0

    return Math.min(100, score)
  }

  /**
   * Generate SEO recommendations
   */
  private static generateRecommendations(
    score: SEOScore,
    technical: TechnicalSEOAudit,
    content: ContentAnalysis,
    performance: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = []

    // Technical recommendations
    if (technical.crawlability.brokenLinks.length > 0) {
      recommendations.push(`Fix ${technical.crawlability.brokenLinks.length} broken links to improve crawlability`)
    }
    if (technical.siteSpeed.pageLoadTime > 3) {
      recommendations.push('Optimize page load time to under 3 seconds for better user experience')
    }
    if (!technical.siteSpeed.optimizedImages) {
      recommendations.push('Optimize images with next-gen formats (WebP, AVIF) to reduce page size')
    }

    // Content recommendations
    if (content.readabilityScore < 70) {
      recommendations.push('Improve content readability for better patient comprehension')
    }
    if (content.contentLength < 1000) {
      recommendations.push('Expand content to at least 1000 words for comprehensive coverage')
    }
    if (content.medicalTerms.length > 0 && content.readabilityScore < 80) {
      recommendations.push('Add glossary or simplified explanations for medical terms')
    }

    // Performance recommendations
    if (performance.coreWebVitals.lcp > 2.5) {
      recommendations.push('Optimize Largest Contentful Paint (LCP) to under 2.5 seconds')
    }
    if (performance.coreWebVitals.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift (CLS) to improve visual stability')
    }
    if (performance.userExperience.bounceRate > 50) {
      recommendations.push('Improve content engagement to reduce bounce rate')
    }

    // Healthcare-specific recommendations
    if (score.healthcare < 70) {
      recommendations.push('Enhance medical authority with author credentials and citations')
      recommendations.push('Add clinical evidence and peer-reviewed sources')
    }

    return recommendations
  }

  /**
   * Generate healthcare-specific schema markup
   */
  static generateHealthcareSchema(type: string, data: any): SchemaMarkup {
    const schemas: Record<string, any> = {
      MedicalOrganization: {
        '@context': 'https://schema.org',
        '@type': 'MedicalOrganization',
        name: data.name,
        description: data.description,
        url: data.url,
        logo: data.logo,
        address: data.address,
        telephone: data.phone,
        medicalSpecialty: data.specialties,
        availableService: data.services
      },
      MedicalWebPage: {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        name: data.title,
        description: data.description,
        url: data.url,
        datePublished: data.publishedDate,
        dateModified: data.modifiedDate,
        author: data.author,
        medicalAudience: data.audience,
        keywords: data.keywords
      },
      ClinicalTrial: {
        '@context': 'https://schema.org',
        '@type': 'MedicalStudy',
        studySubject: data.subject,
        sponsor: data.sponsor,
        studyLocation: data.location,
        status: data.status,
        phase: data.phase,
        trialDesign: data.design
      },
      HealthTopicContent: {
        '@context': 'https://schema.org',
        '@type': 'HealthTopicContent',
        name: data.title,
        description: data.description,
        url: data.url,
        hasHealthAspect: data.healthAspects,
        keywords: data.keywords
      }
    }

    const schema = schemas[type] || {}
    
    return {
      type,
      properties: schema,
      valid: true,
      warnings: [],
      recommendations: []
    }
  }

  /**
   * Perform keyword research with healthcare focus
   */
  static async performKeywordResearch(seedKeyword: string): Promise<KeywordData[]> {
    // Simulate keyword research (in production, integrate with real APIs)
    const keywords: KeywordData[] = [
      {
        keyword: seedKeyword,
        searchVolume: 5000,
        difficulty: 65,
        cpc: 3.50,
        trend: 'rising',
        relatedKeywords: [
          `${seedKeyword} services`,
          `${seedKeyword} solutions`,
          `${seedKeyword} platform`
        ],
        questions: [
          `What is ${seedKeyword}?`,
          `How does ${seedKeyword} work?`,
          `Benefits of ${seedKeyword}`
        ],
        medicalRelevance: 85
      }
    ]

    // Add healthcare-specific variations
    if (this.MEDICAL_KEYWORDS.some(kw => seedKeyword.toLowerCase().includes(kw))) {
      keywords.push({
        keyword: `${seedKeyword} for healthcare`,
        searchVolume: 2000,
        difficulty: 55,
        cpc: 4.20,
        trend: 'rising',
        relatedKeywords: [],
        questions: [],
        medicalRelevance: 95
      })
    }

    return keywords
  }

  /**
   * Track Core Web Vitals in real-time
   */
  static trackCoreWebVitals(callback: (vitals: CoreWebVitals) => void): void {
    if (typeof window === 'undefined') return

    // Track LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any
      callback({
        lcp: lastEntry.renderTime || lastEntry.loadTime,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
        inp: 0
      })
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

    // Track FID
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const firstInput = entries[0] as any
      callback({
        lcp: 0,
        fid: firstInput.processingStart - firstInput.startTime,
        cls: 0,
        fcp: 0,
        ttfb: 0,
        inp: 0
      })
    })
    fidObserver.observe({ type: 'first-input', buffered: true })

    // Track CLS
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      callback({
        lcp: 0,
        fid: 0,
        cls: clsValue,
        fcp: 0,
        ttfb: 0,
        inp: 0
      })
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  }
}

// Export cached version for server components
export const getCachedSEOAudit = cache(AdvancedSEOService.performComprehensiveAudit)