/**
 * Security Recommendation Engine
 * Intelligent recommendation generation for vulnerability remediation
 */

import { logger } from '@/lib/logger'
import { 
  Vulnerability, 
  VulnerabilitySeverity, 
  SecurityRecommendation,
  ComplianceResult,
  SecurityScore,
  ScanResults
} from './security-scanner'
import { VulnerabilityAnalysis, HealthcareImpact } from './vulnerability-analyzer'

export interface RecommendationContext {
  vulnerabilities: Vulnerability[]
  analyses: VulnerabilityAnalysis[]
  complianceResults: ComplianceResult[]
  securityScore: SecurityScore
  scanResults: ScanResults
  organizationProfile: OrganizationProfile
}

export interface OrganizationProfile {
  industry: 'healthcare' | 'finance' | 'retail' | 'technology'
  size: 'small' | 'medium' | 'large' | 'enterprise'
  regulatoryRequirements: string[]
  securityMaturity: 'initial' | 'developing' | 'defined' | 'managed' | 'optimized'
  budget: 'limited' | 'moderate' | 'substantial'
  technicalCapabilities: 'basic' | 'intermediate' | 'advanced'
  currentTools: string[]
  priorities: string[]
}

export interface EnhancedRecommendation extends SecurityRecommendation {
  businessJustification: string
  riskReduction: number // Percentage
  complianceAlignment: string[]
  prerequisites: string[]
  alternatives: AlternativeApproach[]
  timeline: Timeline
  costBenefit: CostBenefitAnalysis
  successMetrics: string[]
  implementationSteps: ImplementationStep[]
}

export interface AlternativeApproach {
  title: string
  description: string
  pros: string[]
  cons: string[]
  cost: 'lower' | 'same' | 'higher'
  effectiveness: 'lower' | 'same' | 'higher'
}

export interface Timeline {
  immediate: string[]
  shortTerm: string[] // 1-3 months
  mediumTerm: string[] // 3-6 months
  longTerm: string[] // 6+ months
}

export interface CostBenefitAnalysis {
  estimatedCost: number
  estimatedSavings: number
  breakEvenMonths: number
  roi: number // Return on investment percentage
  intangibleBenefits: string[]
}

export interface ImplementationStep {
  order: number
  title: string
  description: string
  duration: string
  responsible: string
  dependencies: string[]
  validation: string
}

export class RecommendationEngine {
  private recommendationTemplates: Map<string, RecommendationTemplate> = new Map()
  private healthcareGuidelines: HealthcareSecurityGuidelines
  
  constructor() {
    this.initializeTemplates()
    this.healthcareGuidelines = new HealthcareSecurityGuidelines()
  }
  
  /**
   * Generate recommendations based on security assessment
   */
  async generateRecommendations(context: RecommendationContext): Promise<EnhancedRecommendation[]> {
    const recommendations: EnhancedRecommendation[] = []
    
    try {
      // 1. Critical vulnerability recommendations
      const criticalRecs = this.generateCriticalVulnerabilityRecommendations(context)
      recommendations.push(...criticalRecs)
      
      // 2. Compliance gap recommendations
      const complianceRecs = this.generateComplianceRecommendations(context)
      recommendations.push(...complianceRecs)
      
      // 3. Security posture improvements
      const postureRecs = this.generateSecurityPostureRecommendations(context)
      recommendations.push(...postureRecs)
      
      // 4. Healthcare-specific recommendations
      const healthcareRecs = this.generateHealthcareRecommendations(context)
      recommendations.push(...healthcareRecs)
      
      // 5. Quick wins
      const quickWins = this.identifyQuickWins(context)
      recommendations.push(...quickWins)
      
      // 6. Strategic recommendations
      const strategicRecs = this.generateStrategicRecommendations(context)
      recommendations.push(...strategicRecs)
      
      // Prioritize and deduplicate
      const prioritized = this.prioritizeRecommendations(recommendations, context)
      
      // Add implementation details
      const enhanced = this.enhanceRecommendations(prioritized, context)
      
      return enhanced
      
    } catch (error) {
      logger.error('Recommendation generation failed:', { error })
      return this.getFallbackRecommendations(context)
    }
  }
  
  /**
   * Generate recommendations for critical vulnerabilities
   */
  private generateCriticalVulnerabilityRecommendations(
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    const recommendations: EnhancedRecommendation[] = []
    
    // Group vulnerabilities by type
    const vulnGroups = this.groupVulnerabilities(context.vulnerabilities)
    
    for (const [type, vulns] of vulnGroups.entries()) {
      if (vulns.some(v => v.severity === VulnerabilitySeverity.CRITICAL)) {
        const rec = this.createVulnerabilityRecommendation(type, vulns, context)
        recommendations.push(rec)
      }
    }
    
    return recommendations
  }
  
  /**
   * Create vulnerability-specific recommendation
   */
  private createVulnerabilityRecommendation(
    type: string,
    vulnerabilities: Vulnerability[],
    context: RecommendationContext
  ): EnhancedRecommendation {
    const critical = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL)
    const high = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH)
    
    const template = this.recommendationTemplates.get(type) || this.getDefaultTemplate()
    
    return {
      id: `rec_vuln_${type}_${Date.now()}`,
      priority: critical.length > 0 ? 'critical' : 'high',
      category: 'vulnerability',
      title: template.title.replace('{count}', vulnerabilities.length.toString()),
      description: template.description,
      impact: `Addresses ${critical.length} critical and ${high.length} high severity vulnerabilities`,
      effort: this.estimateEffort(vulnerabilities),
      implementation: template.implementation,
      resources: template.resources,
      businessJustification: this.generateBusinessJustification(vulnerabilities, context),
      riskReduction: this.calculateRiskReduction(vulnerabilities, context),
      complianceAlignment: this.identifyComplianceAlignment(type),
      prerequisites: template.prerequisites || [],
      alternatives: this.generateAlternatives(type, context),
      timeline: this.generateTimeline(vulnerabilities),
      costBenefit: this.calculateCostBenefit(vulnerabilities, context),
      successMetrics: template.successMetrics || [],
      implementationSteps: this.generateImplementationSteps(type, vulnerabilities)
    }
  }
  
  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    const recommendations: EnhancedRecommendation[] = []
    
    // Group failed compliance requirements by framework
    const failedByFramework = new Map<string, ComplianceResult[]>()
    
    for (const result of context.complianceResults) {
      if (result.status === 'FAIL' || result.status === 'PARTIAL') {
        const existing = failedByFramework.get(result.framework) || []
        existing.push(result)
        failedByFramework.set(result.framework, existing)
      }
    }
    
    // Generate recommendations for each framework
    for (const [framework, failures] of failedByFramework.entries()) {
      if (framework === 'HIPAA') {
        recommendations.push(this.generateHIPAARecommendation(failures, context))
      } else if (framework === 'HITRUST') {
        recommendations.push(this.generateHITRUSTRecommendation(failures, context))
      }
    }
    
    return recommendations
  }
  
  /**
   * Generate HIPAA-specific recommendation
   */
  private generateHIPAARecommendation(
    failures: ComplianceResult[],
    context: RecommendationContext
  ): EnhancedRecommendation {
    const criticalFailures = failures.filter(f => 
      f.requirement.includes('164.312') // Technical safeguards
    )
    
    return {
      id: `rec_hipaa_${Date.now()}`,
      priority: criticalFailures.length > 0 ? 'critical' : 'high',
      category: 'compliance',
      title: `Address ${failures.length} HIPAA Compliance Gaps`,
      description: `Implement required HIPAA security controls to achieve compliance and avoid penalties`,
      impact: `Ensures HIPAA compliance and protects against fines up to $2M per violation`,
      effort: 'high',
      implementation: this.generateHIPAAImplementation(failures),
      resources: [
        'https://www.hhs.gov/hipaa/for-professionals/security/index.html',
        'HIPAA Security Rule Implementation Guide'
      ],
      businessJustification: 'HIPAA compliance is legally required for healthcare organizations handling PHI',
      riskReduction: 85,
      complianceAlignment: ['HIPAA', 'HITECH'],
      prerequisites: ['Security risk assessment', 'PHI data inventory'],
      alternatives: this.generateHIPAAAlternatives(failures),
      timeline: {
        immediate: ['Conduct risk assessment', 'Document current controls'],
        shortTerm: ['Implement access controls', 'Deploy encryption'],
        mediumTerm: ['Complete audit logging', 'Staff training'],
        longTerm: ['Continuous monitoring', 'Annual assessments']
      },
      costBenefit: {
        estimatedCost: 250000,
        estimatedSavings: 2000000, // Avoided fines
        breakEvenMonths: 3,
        roi: 700,
        intangibleBenefits: [
          'Patient trust',
          'Regulatory compliance',
          'Reduced breach risk'
        ]
      },
      successMetrics: [
        'All HIPAA technical safeguards implemented',
        'Zero compliance violations',
        'Successful security audit'
      ],
      implementationSteps: this.generateHIPAASteps(failures)
    }
  }
  
  /**
   * Generate HITRUST recommendation
   */
  private generateHITRUSTRecommendation(
    failures: ComplianceResult[],
    context: RecommendationContext
  ): EnhancedRecommendation {
    return {
      id: `rec_hitrust_${Date.now()}`,
      priority: 'high',
      category: 'compliance',
      title: 'Achieve HITRUST CSF Certification',
      description: 'Implement HITRUST Common Security Framework controls',
      impact: 'Demonstrates comprehensive security and compliance posture',
      effort: 'high',
      implementation: 'Follow HITRUST CSF implementation guide',
      resources: ['https://hitrustalliance.net/'],
      businessJustification: 'HITRUST certification provides competitive advantage and customer confidence',
      riskReduction: 75,
      complianceAlignment: ['HITRUST', 'HIPAA', 'NIST'],
      prerequisites: ['HIPAA compliance', 'Mature security program'],
      alternatives: [],
      timeline: {
        immediate: ['Gap assessment'],
        shortTerm: ['Control implementation'],
        mediumTerm: ['Internal audit'],
        longTerm: ['Certification audit']
      },
      costBenefit: {
        estimatedCost: 500000,
        estimatedSavings: 1000000,
        breakEvenMonths: 12,
        roi: 100,
        intangibleBenefits: ['Market differentiation', 'Partner requirements']
      },
      successMetrics: ['HITRUST certification achieved'],
      implementationSteps: []
    }
  }
  
  /**
   * Generate security posture recommendations
   */
  private generateSecurityPostureRecommendations(
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    const recommendations: EnhancedRecommendation[] = []
    
    // Analyze security score categories
    const weakCategories = Object.entries(context.securityScore.categories)
      .filter(([_, score]) => score < 70)
      .sort(([, a], [, b]) => a - b)
    
    for (const [category, score] of weakCategories.slice(0, 3)) {
      recommendations.push(this.createCategoryRecommendation(category, score, context))
    }
    
    return recommendations
  }
  
  /**
   * Create category-specific recommendation
   */
  private createCategoryRecommendation(
    category: string,
    score: number,
    context: RecommendationContext
  ): EnhancedRecommendation {
    const improvements = this.getCategoryImprovements(category)
    
    return {
      id: `rec_posture_${category}_${Date.now()}`,
      priority: score < 50 ? 'high' : 'medium',
      category: 'security_posture',
      title: `Improve ${this.formatCategoryName(category)} Security`,
      description: `Current score: ${score}/100. Implement controls to strengthen ${category}.`,
      impact: `Improve ${category} score by ${100 - score} points`,
      effort: score < 50 ? 'high' : 'medium',
      implementation: improvements.implementation,
      resources: improvements.resources,
      businessJustification: `Low ${category} score represents significant security risk`,
      riskReduction: (100 - score) * 0.5,
      complianceAlignment: improvements.compliance,
      prerequisites: improvements.prerequisites,
      alternatives: [],
      timeline: this.generateCategoryTimeline(category, score),
      costBenefit: this.calculateCategoryCostBenefit(category, score),
      successMetrics: [`${category} score above 80`, ...improvements.metrics],
      implementationSteps: improvements.steps
    }
  }
  
  /**
   * Generate healthcare-specific recommendations
   */
  private generateHealthcareRecommendations(
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    const recommendations: EnhancedRecommendation[] = []
    
    // PHI protection enhancements
    if (this.needsPHIProtection(context)) {
      recommendations.push(this.createPHIProtectionRecommendation(context))
    }
    
    // Medical device security
    if (this.needsMedicalDeviceSecurity(context)) {
      recommendations.push(this.createMedicalDeviceRecommendation(context))
    }
    
    // Clinical system resilience
    if (this.needsClinicalResilience(context)) {
      recommendations.push(this.createClinicalResilienceRecommendation(context))
    }
    
    return recommendations
  }
  
  /**
   * Create PHI protection recommendation
   */
  private createPHIProtectionRecommendation(context: RecommendationContext): EnhancedRecommendation {
    return {
      id: `rec_phi_${Date.now()}`,
      priority: 'critical',
      category: 'healthcare',
      title: 'Enhance PHI Data Protection',
      description: 'Implement comprehensive PHI protection controls including encryption, access controls, and monitoring',
      impact: 'Protects patient data and ensures HIPAA compliance',
      effort: 'high',
      implementation: `
        1. Deploy AES-256 encryption for data at rest
        2. Implement TLS 1.3 for data in transit
        3. Enable field-level encryption for sensitive PHI fields
        4. Deploy Data Loss Prevention (DLP) solution
        5. Implement PHI access monitoring and alerting
      `,
      resources: [
        'NIST SP 800-66 HIPAA Security Rule Guide',
        'HHS PHI Protection Guidelines'
      ],
      businessJustification: 'PHI breaches result in average costs of $10.93M and severe reputational damage',
      riskReduction: 90,
      complianceAlignment: ['HIPAA', 'HITECH', 'GDPR'],
      prerequisites: ['PHI data classification', 'Access control system'],
      alternatives: [
        {
          title: 'Managed Security Service',
          description: 'Outsource PHI protection to specialized healthcare security provider',
          pros: ['Expert management', 'Faster deployment'],
          cons: ['Higher ongoing costs', 'Less control'],
          cost: 'higher',
          effectiveness: 'same'
        }
      ],
      timeline: {
        immediate: ['Encrypt databases', 'Review access controls'],
        shortTerm: ['Deploy DLP', 'Implement monitoring'],
        mediumTerm: ['Field-level encryption', 'Advanced analytics'],
        longTerm: ['Continuous improvement', 'AI-based protection']
      },
      costBenefit: {
        estimatedCost: 500000,
        estimatedSavings: 10000000,
        breakEvenMonths: 6,
        roi: 1900,
        intangibleBenefits: ['Patient trust', 'Competitive advantage']
      },
      successMetrics: [
        'Zero PHI breaches',
        '100% PHI encryption coverage',
        'Real-time PHI access monitoring'
      ],
      implementationSteps: [
        {
          order: 1,
          title: 'PHI Discovery and Classification',
          description: 'Identify and classify all PHI data across systems',
          duration: '2 weeks',
          responsible: 'Data Governance Team',
          dependencies: [],
          validation: 'Complete PHI inventory'
        },
        {
          order: 2,
          title: 'Encryption Deployment',
          description: 'Implement encryption for identified PHI repositories',
          duration: '4 weeks',
          responsible: 'Security Team',
          dependencies: ['PHI inventory'],
          validation: 'Encryption verification tests'
        }
      ]
    }
  }
  
  /**
   * Identify quick wins
   */
  private identifyQuickWins(context: RecommendationContext): EnhancedRecommendation[] {
    const quickWins: EnhancedRecommendation[] = []
    
    // Security headers
    if (context.securityScore.categories.configuration < 80) {
      quickWins.push({
        id: `rec_quick_headers_${Date.now()}`,
        priority: 'medium',
        category: 'quick_win',
        title: 'Implement Security Headers',
        description: 'Add security headers to all HTTP responses',
        impact: 'Immediate protection against common attacks',
        effort: 'low',
        implementation: 'Configure web server or application to add security headers',
        resources: ['https://securityheaders.com/'],
        businessJustification: 'Low effort, high impact security improvement',
        riskReduction: 30,
        complianceAlignment: ['OWASP'],
        prerequisites: [],
        alternatives: [],
        timeline: {
          immediate: ['Add headers'],
          shortTerm: [],
          mediumTerm: [],
          longTerm: []
        },
        costBenefit: {
          estimatedCost: 5000,
          estimatedSavings: 50000,
          breakEvenMonths: 1,
          roi: 900,
          intangibleBenefits: []
        },
        successMetrics: ['A+ security headers score'],
        implementationSteps: []
      })
    }
    
    // Enable MFA
    if (!this.hasMFA(context)) {
      quickWins.push({
        id: `rec_quick_mfa_${Date.now()}`,
        priority: 'high',
        category: 'quick_win',
        title: 'Enable Multi-Factor Authentication',
        description: 'Implement MFA for all administrative accounts',
        impact: 'Prevents 99.9% of account compromise attacks',
        effort: 'low',
        implementation: 'Deploy MFA solution for all privileged users',
        resources: ['NIST SP 800-63B'],
        businessJustification: 'MFA prevents majority of account takeover attacks',
        riskReduction: 80,
        complianceAlignment: ['HIPAA', 'NIST'],
        prerequisites: ['User directory'],
        alternatives: [],
        timeline: {
          immediate: ['Deploy MFA'],
          shortTerm: ['User training'],
          mediumTerm: [],
          longTerm: []
        },
        costBenefit: {
          estimatedCost: 10000,
          estimatedSavings: 500000,
          breakEvenMonths: 1,
          roi: 4900,
          intangibleBenefits: []
        },
        successMetrics: ['100% MFA adoption for admins'],
        implementationSteps: []
      })
    }
    
    return quickWins
  }
  
  /**
   * Generate strategic recommendations
   */
  private generateStrategicRecommendations(
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    const recommendations: EnhancedRecommendation[] = []
    
    // Zero Trust Architecture
    if (context.organizationProfile.securityMaturity !== 'optimized') {
      recommendations.push(this.createZeroTrustRecommendation(context))
    }
    
    // Security Operations Center
    if (context.organizationProfile.size === 'large' || context.organizationProfile.size === 'enterprise') {
      recommendations.push(this.createSOCRecommendation(context))
    }
    
    return recommendations
  }
  
  /**
   * Create Zero Trust recommendation
   */
  private createZeroTrustRecommendation(context: RecommendationContext): EnhancedRecommendation {
    return {
      id: `rec_zerotrust_${Date.now()}`,
      priority: 'medium',
      category: 'strategic',
      title: 'Implement Zero Trust Architecture',
      description: 'Transition to Zero Trust security model for enhanced protection',
      impact: 'Fundamentally improves security posture and reduces attack surface',
      effort: 'high',
      implementation: 'Phased Zero Trust implementation following NIST guidelines',
      resources: ['NIST SP 800-207 Zero Trust Architecture'],
      businessJustification: 'Zero Trust reduces breach risk by 50% and limits breach impact',
      riskReduction: 70,
      complianceAlignment: ['NIST', 'HIPAA'],
      prerequisites: ['Identity management', 'Network segmentation'],
      alternatives: [],
      timeline: {
        immediate: ['Assessment and planning'],
        shortTerm: ['Identity and device trust'],
        mediumTerm: ['Network segmentation'],
        longTerm: ['Full Zero Trust implementation']
      },
      costBenefit: {
        estimatedCost: 1000000,
        estimatedSavings: 3000000,
        breakEvenMonths: 24,
        roi: 200,
        intangibleBenefits: ['Future-proof architecture', 'Improved agility']
      },
      successMetrics: ['Zero Trust maturity level 3+'],
      implementationSteps: []
    }
  }
  
  /**
   * Create SOC recommendation
   */
  private createSOCRecommendation(context: RecommendationContext): EnhancedRecommendation {
    return {
      id: `rec_soc_${Date.now()}`,
      priority: 'medium',
      category: 'strategic',
      title: 'Establish Security Operations Center',
      description: '24/7 security monitoring and incident response capability',
      impact: 'Reduces mean time to detect and respond to security incidents',
      effort: 'high',
      implementation: 'Build or outsource SOC capabilities',
      resources: ['MITRE SOC Strategies'],
      businessJustification: 'SOC reduces breach costs by 45% through faster detection and response',
      riskReduction: 60,
      complianceAlignment: ['HIPAA', 'NIST'],
      prerequisites: ['SIEM platform', 'Incident response plan'],
      alternatives: [
        {
          title: 'Managed SOC Service',
          description: 'Outsource SOC to MSSP',
          pros: ['Faster deployment', 'Expert staff'],
          cons: ['Less control', 'Ongoing costs'],
          cost: 'lower',
          effectiveness: 'same'
        }
      ],
      timeline: {
        immediate: ['Requirements gathering'],
        shortTerm: ['Tool deployment', 'Staff hiring'],
        mediumTerm: ['Process development', 'Training'],
        longTerm: ['Full operational capability']
      },
      costBenefit: {
        estimatedCost: 2000000,
        estimatedSavings: 4000000,
        breakEvenMonths: 18,
        roi: 100,
        intangibleBenefits: ['Continuous monitoring', 'Threat intelligence']
      },
      successMetrics: ['MTTD < 1 hour', 'MTTR < 4 hours'],
      implementationSteps: []
    }
  }
  
  /**
   * Prioritize recommendations
   */
  private prioritizeRecommendations(
    recommendations: EnhancedRecommendation[],
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    return recommendations.sort((a, b) => {
      // Priority order
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Risk reduction
      const riskDiff = b.riskReduction - a.riskReduction
      if (riskDiff !== 0) return riskDiff
      
      // ROI
      return b.costBenefit.roi - a.costBenefit.roi
    })
  }
  
  /**
   * Enhance recommendations with additional details
   */
  private enhanceRecommendations(
    recommendations: EnhancedRecommendation[],
    context: RecommendationContext
  ): EnhancedRecommendation[] {
    return recommendations.map(rec => {
      // Add organization-specific details
      if (context.organizationProfile.budget === 'limited') {
        rec.alternatives = this.addBudgetAlternatives(rec.alternatives)
      }
      
      // Add maturity-appropriate steps
      if (context.organizationProfile.securityMaturity === 'initial') {
        rec.implementationSteps = this.simplifySteps(rec.implementationSteps)
      }
      
      return rec
    })
  }
  
  /**
   * Initialize recommendation templates
   */
  private initializeTemplates(): void {
    this.recommendationTemplates.set('SQL_INJECTION', {
      title: 'Fix {count} SQL Injection Vulnerabilities',
      description: 'Implement parameterized queries and input validation',
      implementation: 'Use prepared statements, stored procedures, and input validation',
      resources: ['OWASP SQL Injection Prevention Cheat Sheet'],
      prerequisites: ['Code access', 'Testing environment'],
      successMetrics: ['Zero SQL injection vulnerabilities']
    })
    
    this.recommendationTemplates.set('XSS', {
      title: 'Remediate {count} Cross-Site Scripting Vulnerabilities',
      description: 'Implement output encoding and Content Security Policy',
      implementation: 'Apply context-aware output encoding and CSP headers',
      resources: ['OWASP XSS Prevention Cheat Sheet'],
      prerequisites: ['Frontend code access'],
      successMetrics: ['Zero XSS vulnerabilities', 'CSP implemented']
    })
  }
  
  // Helper methods
  private groupVulnerabilities(vulnerabilities: Vulnerability[]): Map<string, Vulnerability[]> {
    const groups = new Map<string, Vulnerability[]>()
    
    for (const vuln of vulnerabilities) {
      const type = vuln.cwe || vuln.title.split(' ')[0]
      const existing = groups.get(type) || []
      existing.push(vuln)
      groups.set(type, existing)
    }
    
    return groups
  }
  
  private estimateEffort(vulnerabilities: Vulnerability[]): 'low' | 'medium' | 'high' {
    const totalCount = vulnerabilities.length
    const criticalCount = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length
    
    if (criticalCount > 5 || totalCount > 20) return 'high'
    if (criticalCount > 2 || totalCount > 10) return 'medium'
    return 'low'
  }
  
  private generateBusinessJustification(
    vulnerabilities: Vulnerability[],
    context: RecommendationContext
  ): string {
    const critical = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length
    const exploitable = vulnerabilities.filter(v => v.exploitAvailable).length
    
    return `Addressing these vulnerabilities will prevent potential breaches that could result in 
            ${context.organizationProfile.industry === 'healthcare' ? 'HIPAA violations and patient data exposure' : 'data breaches'}.
            ${critical} critical vulnerabilities pose immediate risk.
            ${exploitable} vulnerabilities have known exploits in the wild.`
  }
  
  private calculateRiskReduction(
    vulnerabilities: Vulnerability[],
    context: RecommendationContext
  ): number {
    const criticalCount = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length
    const highCount = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH).length
    
    const baseReduction = (criticalCount * 20) + (highCount * 10)
    return Math.min(95, baseReduction)
  }
  
  private identifyComplianceAlignment(type: string): string[] {
    const alignments: Record<string, string[]> = {
      'SQL_INJECTION': ['HIPAA 164.312(a)(1)', 'PCI DSS 6.5.1', 'OWASP A03'],
      'XSS': ['HIPAA 164.312(a)(1)', 'PCI DSS 6.5.7', 'OWASP A03'],
      'AUTHENTICATION': ['HIPAA 164.312(a)(2)', 'PCI DSS 8.2', 'NIST 800-63']
    }
    
    return alignments[type] || ['OWASP Top 10']
  }
  
  private generateAlternatives(type: string, context: RecommendationContext): AlternativeApproach[] {
    const alternatives: AlternativeApproach[] = []
    
    if (context.organizationProfile.budget === 'limited') {
      alternatives.push({
        title: 'Open Source Solution',
        description: 'Use open source security tools',
        pros: ['No licensing costs', 'Community support'],
        cons: ['Requires expertise', 'No vendor support'],
        cost: 'lower',
        effectiveness: 'lower'
      })
    }
    
    alternatives.push({
      title: 'Managed Service',
      description: 'Outsource to security service provider',
      pros: ['Expert management', 'Faster implementation'],
      cons: ['Ongoing costs', 'Less control'],
      cost: 'higher',
      effectiveness: 'same'
    })
    
    return alternatives
  }
  
  private generateTimeline(vulnerabilities: Vulnerability[]): Timeline {
    const critical = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL)
    const high = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH)
    
    return {
      immediate: critical.map(v => `Fix ${v.title}`),
      shortTerm: high.map(v => `Remediate ${v.title}`),
      mediumTerm: ['Implement preventive controls'],
      longTerm: ['Continuous monitoring and improvement']
    }
  }
  
  private calculateCostBenefit(
    vulnerabilities: Vulnerability[],
    context: RecommendationContext
  ): CostBenefitAnalysis {
    const avgBreachCost = context.organizationProfile.industry === 'healthcare' ? 10930000 : 4450000
    const breachProbability = vulnerabilities.some(v => v.exploitAvailable) ? 0.3 : 0.1
    
    const estimatedCost = vulnerabilities.length * 10000 // Rough estimate
    const estimatedSavings = avgBreachCost * breachProbability
    
    return {
      estimatedCost,
      estimatedSavings,
      breakEvenMonths: Math.ceil(estimatedCost / (estimatedSavings / 12)),
      roi: Math.round(((estimatedSavings - estimatedCost) / estimatedCost) * 100),
      intangibleBenefits: ['Improved security posture', 'Regulatory compliance']
    }
  }
  
  private generateImplementationSteps(type: string, vulnerabilities: Vulnerability[]): ImplementationStep[] {
    const steps: ImplementationStep[] = [
      {
        order: 1,
        title: 'Assessment',
        description: 'Identify all instances of vulnerability',
        duration: '1 week',
        responsible: 'Security Team',
        dependencies: [],
        validation: 'Vulnerability scan'
      },
      {
        order: 2,
        title: 'Planning',
        description: 'Create remediation plan',
        duration: '3 days',
        responsible: 'Development Team',
        dependencies: ['Assessment'],
        validation: 'Plan review'
      },
      {
        order: 3,
        title: 'Implementation',
        description: 'Apply fixes',
        duration: '2 weeks',
        responsible: 'Development Team',
        dependencies: ['Planning'],
        validation: 'Code review'
      },
      {
        order: 4,
        title: 'Testing',
        description: 'Verify fixes',
        duration: '1 week',
        responsible: 'QA Team',
        dependencies: ['Implementation'],
        validation: 'Security testing'
      },
      {
        order: 5,
        title: 'Deployment',
        description: 'Deploy to production',
        duration: '1 day',
        responsible: 'DevOps Team',
        dependencies: ['Testing'],
        validation: 'Post-deployment scan'
      }
    ]
    
    return steps
  }
  
  private generateHIPAAImplementation(failures: ComplianceResult[]): string {
    const steps = failures.map(f => 
      `- ${f.requirement}: ${f.recommendations?.join(', ') || 'Implement required control'}`
    )
    
    return steps.join('\n')
  }
  
  private generateHIPAAAlternatives(failures: ComplianceResult[]): AlternativeApproach[] {
    return [
      {
        title: 'HIPAA Compliance Service',
        description: 'Use managed HIPAA compliance platform',
        pros: ['Faster compliance', 'Expert guidance'],
        cons: ['Ongoing subscription costs'],
        cost: 'higher',
        effectiveness: 'higher'
      }
    ]
  }
  
  private generateHIPAASteps(failures: ComplianceResult[]): ImplementationStep[] {
    return [
      {
        order: 1,
        title: 'Risk Assessment',
        description: 'Conduct HIPAA risk assessment',
        duration: '2 weeks',
        responsible: 'Compliance Team',
        dependencies: [],
        validation: 'Risk assessment report'
      },
      {
        order: 2,
        title: 'Gap Analysis',
        description: 'Identify compliance gaps',
        duration: '1 week',
        responsible: 'Compliance Team',
        dependencies: ['Risk Assessment'],
        validation: 'Gap analysis report'
      }
    ]
  }
  
  private getCategoryImprovements(category: string): any {
    const improvements: Record<string, any> = {
      authentication: {
        implementation: 'Implement MFA, strong password policies, and session management',
        resources: ['NIST 800-63B'],
        compliance: ['HIPAA 164.312(a)(2)'],
        prerequisites: ['Identity management system'],
        metrics: ['MFA adoption rate > 95%'],
        steps: []
      },
      encryption: {
        implementation: 'Deploy AES-256 encryption for data at rest and TLS 1.3 for transit',
        resources: ['NIST 800-111'],
        compliance: ['HIPAA 164.312(a)(2)(iv)'],
        prerequisites: ['Key management system'],
        metrics: ['100% encryption coverage'],
        steps: []
      }
    }
    
    return improvements[category] || {
      implementation: `Improve ${category} controls`,
      resources: [],
      compliance: [],
      prerequisites: [],
      metrics: [],
      steps: []
    }
  }
  
  private formatCategoryName(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')
  }
  
  private generateCategoryTimeline(category: string, score: number): Timeline {
    if (score < 30) {
      return {
        immediate: ['Emergency controls implementation'],
        shortTerm: ['Full controls deployment'],
        mediumTerm: ['Optimization'],
        longTerm: ['Continuous improvement']
      }
    }
    
    return {
      immediate: ['Quick wins'],
      shortTerm: ['Primary controls'],
      mediumTerm: ['Advanced controls'],
      longTerm: ['Maturity optimization']
    }
  }
  
  private calculateCategoryCostBenefit(category: string, score: number): CostBenefitAnalysis {
    const improvement = 100 - score
    const cost = improvement * 5000
    const savings = improvement * 20000
    
    return {
      estimatedCost: cost,
      estimatedSavings: savings,
      breakEvenMonths: Math.ceil(cost / (savings / 12)),
      roi: Math.round(((savings - cost) / cost) * 100),
      intangibleBenefits: [`Improved ${category} security`]
    }
  }
  
  private needsPHIProtection(context: RecommendationContext): boolean {
    return context.organizationProfile.industry === 'healthcare' &&
           context.securityScore.categories.dataProtection < 80
  }
  
  private needsMedicalDeviceSecurity(context: RecommendationContext): boolean {
    return context.organizationProfile.industry === 'healthcare' &&
           context.vulnerabilities.some(v => v.affectedComponent.includes('device'))
  }
  
  private needsClinicalResilience(context: RecommendationContext): boolean {
    return context.organizationProfile.industry === 'healthcare' &&
           context.securityScore.categories.availabilityImpact < 70
  }
  
  private createMedicalDeviceRecommendation(context: RecommendationContext): EnhancedRecommendation {
    return {
      id: `rec_medical_device_${Date.now()}`,
      priority: 'high',
      category: 'healthcare',
      title: 'Secure Medical Device Infrastructure',
      description: 'Implement medical device security controls',
      impact: 'Protects patient safety and device integrity',
      effort: 'high',
      implementation: 'Deploy medical device security framework',
      resources: ['FDA Medical Device Cybersecurity Guidance'],
      businessJustification: 'Medical device compromises can impact patient safety',
      riskReduction: 70,
      complianceAlignment: ['FDA', 'HIPAA'],
      prerequisites: ['Device inventory'],
      alternatives: [],
      timeline: {
        immediate: ['Device inventory'],
        shortTerm: ['Network segmentation'],
        mediumTerm: ['Monitoring deployment'],
        longTerm: ['Continuous updates']
      },
      costBenefit: {
        estimatedCost: 300000,
        estimatedSavings: 2000000,
        breakEvenMonths: 9,
        roi: 566,
        intangibleBenefits: ['Patient safety']
      },
      successMetrics: ['All devices secured'],
      implementationSteps: []
    }
  }
  
  private createClinicalResilienceRecommendation(context: RecommendationContext): EnhancedRecommendation {
    return {
      id: `rec_clinical_resilience_${Date.now()}`,
      priority: 'high',
      category: 'healthcare',
      title: 'Enhance Clinical System Resilience',
      description: 'Improve availability and disaster recovery for clinical systems',
      impact: 'Ensures continuous patient care during incidents',
      effort: 'high',
      implementation: 'Implement HA and DR for critical clinical systems',
      resources: ['NIST SP 800-34'],
      businessJustification: 'Clinical system downtime directly impacts patient care',
      riskReduction: 65,
      complianceAlignment: ['HIPAA', 'Joint Commission'],
      prerequisites: ['System criticality assessment'],
      alternatives: [],
      timeline: {
        immediate: ['Criticality assessment'],
        shortTerm: ['Backup implementation'],
        mediumTerm: ['HA deployment'],
        longTerm: ['DR site establishment']
      },
      costBenefit: {
        estimatedCost: 750000,
        estimatedSavings: 3000000,
        breakEvenMonths: 12,
        roi: 300,
        intangibleBenefits: ['Patient care continuity']
      },
      successMetrics: ['RTO < 1 hour', 'RPO < 15 minutes'],
      implementationSteps: []
    }
  }
  
  private hasMFA(context: RecommendationContext): boolean {
    return context.complianceResults.some(r => 
      r.requirement.includes('authentication') && r.status === 'PASS'
    )
  }
  
  private addBudgetAlternatives(alternatives: AlternativeApproach[]): AlternativeApproach[] {
    return [
      ...alternatives,
      {
        title: 'Phased Implementation',
        description: 'Implement in phases to spread costs',
        pros: ['Lower initial investment', 'Learn as you go'],
        cons: ['Longer timeline', 'Extended risk exposure'],
        cost: 'lower',
        effectiveness: 'lower'
      }
    ]
  }
  
  private simplifySteps(steps: ImplementationStep[]): ImplementationStep[] {
    // Simplify steps for organizations with lower maturity
    return steps.map(step => ({
      ...step,
      description: `${step.description} (with vendor support recommended)`
    }))
  }
  
  private getDefaultTemplate(): RecommendationTemplate {
    return {
      title: 'Address Security Vulnerabilities',
      description: 'Implement security controls to remediate vulnerabilities',
      implementation: 'Follow security best practices',
      resources: ['OWASP Guidelines'],
      prerequisites: [],
      successMetrics: ['Vulnerabilities remediated']
    }
  }
  
  private getFallbackRecommendations(context: RecommendationContext): EnhancedRecommendation[] {
    return [{
      id: `rec_fallback_${Date.now()}`,
      priority: 'high',
      category: 'general',
      title: 'Conduct Comprehensive Security Assessment',
      description: 'Perform detailed security assessment to identify improvements',
      impact: 'Identifies security gaps and priorities',
      effort: 'medium',
      implementation: 'Engage security team for assessment',
      resources: [],
      businessJustification: 'Security assessment provides roadmap for improvements',
      riskReduction: 50,
      complianceAlignment: [],
      prerequisites: [],
      alternatives: [],
      timeline: {
        immediate: ['Start assessment'],
        shortTerm: ['Complete assessment'],
        mediumTerm: ['Implement findings'],
        longTerm: ['Continuous improvement']
      },
      costBenefit: {
        estimatedCost: 50000,
        estimatedSavings: 500000,
        breakEvenMonths: 3,
        roi: 900,
        intangibleBenefits: []
      },
      successMetrics: ['Assessment completed'],
      implementationSteps: []
    }]
  }
}

interface RecommendationTemplate {
  title: string
  description: string
  implementation: string
  resources: string[]
  prerequisites?: string[]
  successMetrics?: string[]
}

class HealthcareSecurityGuidelines {
  getGuideline(type: string): any {
    // Healthcare-specific security guidelines
    return {}
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine()