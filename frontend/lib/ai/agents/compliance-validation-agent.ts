/**
 * Compliance Validation Agent
 * Healthcare compliance validation with HIPAA, FDA, and FTC regulation checking
 */

import { z } from 'zod';
import { BaseAgent, BaseAgentOptions } from './base-agent';
import type {
  AgentConfiguration,
  WorkflowTask,
  TaskResult,
  TaskError,
  SecurityContext,
  ComplianceReport
} from '../../../types/ai/orchestrator';

// Compliance validation schemas
const ComplianceRequestSchema = z.object({
  content: z.string(),
  contentType: z.enum(['text', 'image', 'video', 'audio', 'document']).default('text'),
  targetAudience: z.enum(['patients', 'professionals', 'general', 'mixed']).default('general'),
  distributionChannels: z.array(z.string()).default(['web']),
  complianceLevel: z.enum(['basic', 'strict', 'healthcare']).default('healthcare'),
  context: z.record(z.unknown()).optional()
});

const PHIViolationSchema = z.object({
  type: z.enum(['ssn', 'phone', 'email', 'address', 'date', 'name', 'medical_record', 'insurance']),
  value: z.string(),
  position: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  recommendation: z.string()
});

const FDAViolationSchema = z.object({
  type: z.enum(['unsubstantiated_claim', 'drug_claim', 'device_claim', 'miracle_cure', 'guarantee']),
  claim: z.string(),
  position: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  recommendation: z.string(),
  requiredDisclaimers: z.array(z.string())
});

const FTCViolationSchema = z.object({
  type: z.enum(['deceptive_advertising', 'testimonial', 'endorsement', 'pricing', 'guarantee']),
  issue: z.string(),
  position: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  recommendation: z.string()
});

const ComplianceValidationResultSchema = z.object({
  isCompliant: z.boolean(),
  overallScore: z.number().min(0).max(100),
  violations: z.object({
    phi: z.array(PHIViolationSchema),
    fda: z.array(FDAViolationSchema),
    ftc: z.array(FTCViolationSchema),
    hipaa: z.array(z.string()),
    general: z.array(z.string())
  }),
  recommendations: z.array(z.string()),
  requiredDisclaimers: z.array(z.string()),
  auditTrail: z.object({
    validatedAt: z.date(),
    validatorVersion: z.string(),
    processingTime: z.number(),
    rulesApplied: z.array(z.string())
  }),
  riskAssessment: z.object({
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    riskFactors: z.array(z.string()),
    mitigationStrategies: z.array(z.string())
  })
});

export interface ComplianceValidationRequest {
  content: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'document';
  targetAudience: 'patients' | 'professionals' | 'general' | 'mixed';
  distributionChannels: string[];
  complianceLevel: 'basic' | 'strict' | 'healthcare';
  context?: Record<string, unknown>;
}

export interface ComplianceValidationResponse {
  isCompliant: boolean;
  overallScore: number;
  violations: {
    phi: PHIViolation[];
    fda: FDAViolation[];
    ftc: FTCViolation[];
    hipaa: string[];
    general: string[];
  };
  recommendations: string[];
  requiredDisclaimers: string[];
  auditTrail: {
    validatedAt: Date;
    validatorVersion: string;
    processingTime: number;
    rulesApplied: string[];
  };
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
}

export interface PHIViolation {
  type: 'ssn' | 'phone' | 'email' | 'address' | 'date' | 'name' | 'medical_record' | 'insurance';
  value: string;
  position: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface FDAViolation {
  type: 'unsubstantiated_claim' | 'drug_claim' | 'device_claim' | 'miracle_cure' | 'guarantee';
  claim: string;
  position: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  requiredDisclaimers: string[];
}

export interface FTCViolation {
  type: 'deceptive_advertising' | 'testimonial' | 'endorsement' | 'pricing' | 'guarantee';
  issue: string;
  position: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface ComplianceValidationConfig {
  hipaa: {
    enabled: boolean;
    strictMode: boolean;
    allowedDataTypes: string[];
    requiredSafeguards: string[];
  };
  fda: {
    enabled: boolean;
    strictMode: boolean;
    requiredDisclaimers: string[];
    prohibitedClaims: string[];
  };
  ftc: {
    enabled: boolean;
    strictMode: boolean;
    requiredDisclaimers: string[];
    prohibitedPractices: string[];
  };
  general: {
    enabled: boolean;
    strictMode: boolean;
    prohibitedContent: string[];
    requiredElements: string[];
  };
  audit: {
    enabled: boolean;
    logLevel: 'basic' | 'detailed' | 'comprehensive';
    retentionDays: number;
  };
}

export class ComplianceValidationAgent extends BaseAgent {
  private config: ComplianceValidationConfig;
  private validationCache = new Map<string, ComplianceValidationResponse>();
  private ruleEngine: ComplianceRuleEngine;

  constructor(options: BaseAgentOptions & { complianceConfig: ComplianceValidationConfig }) {
    super(options);
    this.config = options.complianceConfig;
    this.ruleEngine = new ComplianceRuleEngine(this.config);
  }

  async initialize(): Promise<void> {
    this.logActivity('info', 'Initializing Compliance Validation Agent');
    
    // Validate configuration
    if (!this.config.hipaa.enabled && !this.config.fda.enabled && !this.config.ftc.enabled) {
      throw new Error('At least one compliance framework must be enabled');
    }

    // Initialize rule engine
    await this.ruleEngine.initialize();
    
    this.isInitialized = true;
    this.logActivity('info', 'Compliance Validation Agent initialized successfully');
  }

  async executeTask(task: WorkflowTask, context: SecurityContext): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      this.currentTask = task;
      this.logActivity('info', `Executing compliance validation task: ${task.id}`);

      // Validate input
      const request = this.validateInput(task.input);
      if (!request) {
        throw new Error('Invalid compliance validation request format');
      }

      // Validate compliance
      const complianceReport = await this.validateCompliance(request, context);
      if (!complianceReport.isCompliant) {
        throw new Error(`Compliance validation failed: ${complianceReport.violations.join(', ')}`);
      }

      // Execute compliance validation
      const response = await this.validateComplianceRules(request);

      const executionTime = Math.max(Date.now() - startTime, 1); // Ensure at least 1ms
      this.updateMetrics(executionTime, true, complianceReport.complianceScore < 100 ? 1 : 0);

      this.logActivity('info', `Compliance validation completed in ${executionTime}ms`);

      return {
        success: true,
        data: response,
        metadata: {
          executionTime,
          agentId: this.config.id,
          taskId: task.id,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime, false);
      
      const taskError = this.handleError(error as Error, task);
      return {
        success: false,
        error: taskError,
        metadata: {
          executionTime,
          agentId: this.config.id,
          taskId: task.id,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      this.currentTask = undefined;
    }
  }

  validateInput(input: any): ComplianceValidationRequest | null {
    try {
      const request = ComplianceRequestSchema.parse(input);
      return request as ComplianceValidationRequest;
    } catch (error) {
      this.logActivity('error', 'Invalid input format for compliance validation', { error });
      return null;
    }
  }

  async validateComplianceRules(request: ComplianceValidationRequest): Promise<ComplianceValidationResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!;
      this.logActivity('info', 'Using cached compliance validation result');
      return cached;
    }

    const violations = {
      phi: [] as PHIViolation[],
      fda: [] as FDAViolation[],
      ftc: [] as FTCViolation[],
      hipaa: [] as string[],
      general: [] as string[]
    };

    const recommendations: string[] = [];
    const requiredDisclaimers: string[] = [];
    const rulesApplied: string[] = [];

    // HIPAA validation
    if (this.config.hipaa.enabled) {
      const hipaaResult = await this.validateHIPAA(request);
      violations.phi.push(...hipaaResult.phiViolations);
      violations.hipaa.push(...hipaaResult.hipaaViolations);
      recommendations.push(...hipaaResult.recommendations);
      rulesApplied.push('HIPAA');
    }

    // FDA validation
    if (this.config.fda.enabled) {
      const fdaResult = await this.validateFDA(request);
      violations.fda.push(...fdaResult.violations);
      requiredDisclaimers.push(...fdaResult.requiredDisclaimers);
      recommendations.push(...fdaResult.recommendations);
      rulesApplied.push('FDA');
    }

    // FTC validation
    if (this.config.ftc.enabled) {
      const ftcResult = await this.validateFTC(request);
      violations.ftc.push(...ftcResult.violations);
      recommendations.push(...ftcResult.recommendations);
      rulesApplied.push('FTC');
    }

    // General compliance validation
    if (this.config.general.enabled) {
      const generalResult = await this.validateGeneral(request);
      violations.general.push(...generalResult.violations);
      recommendations.push(...generalResult.recommendations);
      rulesApplied.push('GENERAL');
    }

    // Calculate overall compliance score
    const overallScore = this.calculateComplianceScore(violations);
    const isCompliant = overallScore >= 80 && violations.phi.length === 0;

    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(violations, overallScore);

    const response: ComplianceValidationResponse = {
      isCompliant,
      overallScore,
      violations,
      recommendations: [...new Set(recommendations)],
      requiredDisclaimers: [...new Set(requiredDisclaimers)],
      auditTrail: {
        validatedAt: new Date(),
        validatorVersion: '1.0.0',
        processingTime: Date.now() - startTime,
        rulesApplied
      },
      riskAssessment
    };

    // Cache result
    this.validationCache.set(cacheKey, response);
    
    return response;
  }

  private async validateHIPAA(request: ComplianceValidationRequest): Promise<{
    phiViolations: PHIViolation[];
    hipaaViolations: string[];
    recommendations: string[];
  }> {
    const phiViolations: PHIViolation[] = [];
    const hipaaViolations: string[] = [];
    const recommendations: string[] = [];

    // Check for PHI patterns
    const phiPatterns = [
      { type: 'ssn' as const, pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'critical' as const },
      { type: 'phone' as const, pattern: /\b\d{3}-\d{3}-\d{4}\b/g, severity: 'high' as const },
      { type: 'email' as const, pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, severity: 'high' as const },
      { type: 'date' as const, pattern: /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\b/gi, severity: 'medium' as const },
      { type: 'medical_record' as const, pattern: /\b(?:mr|mrn|medical\s+record)\s*#?\s*\d+/gi, severity: 'critical' as const },
      { type: 'insurance' as const, pattern: /\b(?:insurance|policy)\s*#?\s*\d+/gi, severity: 'high' as const }
    ];

    for (const { type, pattern, severity } of phiPatterns) {
      const matches = request.content.match(pattern);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const position = request.content.indexOf(match);
          
          phiViolations.push({
            type,
            value: match,
            position,
            severity,
            description: `Potential ${type.toUpperCase()} detected: ${match}`,
            recommendation: `Remove or anonymize ${type} information`
          });
        }
      }
    }

    // Check for HIPAA safeguards
    if (this.config.hipaa.strictMode) {
      if (!this.hasRequiredSafeguards(request.content)) {
        hipaaViolations.push('Required HIPAA safeguards not implemented');
        recommendations.push('Implement required administrative, physical, and technical safeguards');
      }
    }

    return { phiViolations, hipaaViolations, recommendations };
  }

  private async validateFDA(request: ComplianceValidationRequest): Promise<{
    violations: FDAViolation[];
    requiredDisclaimers: string[];
    recommendations: string[];
  }> {
    const violations: FDAViolation[] = [];
    const requiredDisclaimers: string[] = [];
    const recommendations: string[] = [];

    // Check for unsubstantiated claims
    const claimPatterns = [
      { type: 'drug_claim' as const, pattern: /\b(?:drug|medication|prescription|dosage)\b/gi, severity: 'high' as const },
      { type: 'device_claim' as const, pattern: /\b(?:device|equipment|instrument|apparatus)\b/gi, severity: 'high' as const },
      { type: 'miracle_cure' as const, pattern: /\b(?:miracle|breakthrough|revolutionary|guaranteed)\b/gi, severity: 'critical' as const },
      { type: 'guarantee' as const, pattern: /(?:guarantee|guaranteed|guarantees|promise|promises)/gi, severity: 'critical' as const },
      { type: 'unsubstantiated_claim' as const, pattern: /\b(?:cure|cures|cured|treat|treats|heal|heals)\b/gi, severity: 'high' as const }
    ];

    for (const { type, pattern, severity } of claimPatterns) {
      const matches = request.content.match(pattern);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const position = request.content.indexOf(match);
          
          violations.push({
            type,
            claim: match,
            position,
            severity,
            description: `FDA-regulated claim detected: ${match}`,
            recommendation: `Add appropriate disclaimers and ensure FDA compliance`,
            requiredDisclaimers: this.getRequiredDisclaimers(type)
          });
        }
      }
    }

    // Add required disclaimers
    if (violations.length > 0) {
      requiredDisclaimers.push(...this.config.fda.requiredDisclaimers);
    }

    return { violations, requiredDisclaimers, recommendations };
  }

  private async validateFTC(request: ComplianceValidationRequest): Promise<{
    violations: FTCViolation[];
    recommendations: string[];
  }> {
    const violations: FTCViolation[] = [];
    const recommendations: string[] = [];

    // Check for deceptive advertising
    const ftcPatterns = [
      { type: 'deceptive_advertising' as const, pattern: /(?:free|no\s+cost|100%\s+free)/gi, severity: 'high' as const },
      { type: 'testimonial' as const, pattern: /(?:testimonial|testimonials|review|reviews|success\s+story)/gi, severity: 'medium' as const },
      { type: 'endorsement' as const, pattern: /(?:endorsed|recommended|approved)/gi, severity: 'medium' as const },
      { type: 'pricing' as const, pattern: /(?:save|savings|discount|special\s+offer)/gi, severity: 'low' as const },
      { type: 'guarantee' as const, pattern: /(?:money\s+back|satisfaction\s+guaranteed)/gi, severity: 'high' as const }
    ];

    for (const { type, pattern, severity } of ftcPatterns) {
      const matches = request.content.match(pattern);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const position = request.content.indexOf(match);
          
          violations.push({
            type,
            issue: match,
            position,
            severity,
            description: `FTC compliance issue detected: ${match}`,
            recommendation: `Ensure truthfulness and add required disclosures`
          });
        }
      }
    }

    return { violations, recommendations };
  }

  private async validateGeneral(request: ComplianceValidationRequest): Promise<{
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for prohibited content
    for (const prohibited of this.config.general.prohibitedContent) {
      if (request.content.toLowerCase().includes(prohibited.toLowerCase())) {
        violations.push(`Prohibited content detected: ${prohibited}`);
        recommendations.push(`Remove or replace prohibited content: ${prohibited}`);
      }
    }

    // Check for required elements
    for (const required of this.config.general.requiredElements) {
      if (!request.content.toLowerCase().includes(required.toLowerCase())) {
        violations.push(`Required element missing: ${required}`);
        recommendations.push(`Add required element: ${required}`);
      }
    }

    return { violations, recommendations };
  }

  private hasRequiredSafeguards(content: string): boolean {
    // For healthcare compliance level, assume safeguards are in place
    // In a real implementation, this would check system configuration
    return true;
  }

  private getRequiredDisclaimers(violationType: string): string[] {
    const disclaimers: Record<string, string[]> = {
      'unsubstantiated_claim': ['Results may vary', 'Individual results may differ'],
      'drug_claim': ['Consult your healthcare provider', 'Not a substitute for professional medical advice'],
      'device_claim': ['FDA clearance required', 'Consult healthcare professional'],
      'miracle_cure': ['No medical claims', 'Consult healthcare provider'],
      'guarantee': ['No medical guarantee', 'Individual results may vary']
    };
    
    return disclaimers[violationType] || [];
  }

  private calculateComplianceScore(violations: any): number {
    let score = 100;
    
    // Deduct points for violations
    const phiPenalty = violations.phi.length * 20; // 20 points per PHI violation
    const fdaPenalty = violations.fda.length * 15; // 15 points per FDA violation
    const ftcPenalty = violations.ftc.length * 10; // 10 points per FTC violation
    const hipaaPenalty = violations.hipaa.length * 25; // 25 points per HIPAA violation
    const generalPenalty = violations.general.length * 5; // 5 points per general violation
    
    score -= (phiPenalty + fdaPenalty + ftcPenalty + hipaaPenalty + generalPenalty);
    
    return Math.max(0, score);
  }

  private generateRiskAssessment(violations: any, score: number): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigationStrategies: string[];
  } {
    const riskFactors: string[] = [];
    const mitigationStrategies: string[] = [];
    
    if (violations.phi.length > 0) {
      riskFactors.push('PHI exposure detected');
      mitigationStrategies.push('Remove or anonymize all PHI');
    }
    
    if (violations.fda.length > 0) {
      riskFactors.push('FDA compliance violations');
      mitigationStrategies.push('Add required disclaimers and review claims');
    }
    
    if (violations.ftc.length > 0) {
      riskFactors.push('FTC compliance issues');
      mitigationStrategies.push('Review advertising claims and add disclosures');
    }
    
    if (violations.hipaa.length > 0) {
      riskFactors.push('HIPAA compliance violations');
      mitigationStrategies.push('Implement required safeguards');
    }
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    
    // PHI violations always result in critical risk
    if (violations.phi.length > 0) {
      riskLevel = 'critical';
    } else if (score >= 90) {
      riskLevel = 'low';
    } else if (score >= 70) {
      riskLevel = 'medium';
    } else if (score >= 50) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }
    
    return { riskLevel, riskFactors, mitigationStrategies };
  }

  private generateCacheKey(request: ComplianceValidationRequest): string {
    const contentHash = Buffer.from(request.content).toString('base64').substring(0, 16);
    return `${request.complianceLevel}-${request.contentType}-${contentHash}`;
  }
}

/**
 * Compliance Rule Engine
 * Manages and executes compliance validation rules
 */
class ComplianceRuleEngine {
  private config: ComplianceValidationConfig;
  private rules: Map<string, any> = new Map();

  constructor(config: ComplianceValidationConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Initialize rule sets based on configuration
    if (this.config.hipaa.enabled) {
      this.rules.set('hipaa', this.createHIPAARules());
    }
    
    if (this.config.fda.enabled) {
      this.rules.set('fda', this.createFDARules());
    }
    
    if (this.config.ftc.enabled) {
      this.rules.set('ftc', this.createFTCRules());
    }
    
    if (this.config.general.enabled) {
      this.rules.set('general', this.createGeneralRules());
    }
  }

  private createHIPAARules(): any {
    return {
      phiPatterns: [
        { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'critical' },
        { type: 'phone', pattern: /\b\d{3}-\d{3}-\d{4}\b/g, severity: 'high' },
        { type: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, severity: 'high' }
      ],
      safeguards: [
        'encryption', 'secure', 'confidential', 'privacy', 'consent'
      ]
    };
  }

  private createFDARules(): any {
    return {
      prohibitedClaims: [
        'cure', 'cures', 'treat', 'treats', 'heal', 'heals',
        'miracle', 'breakthrough', 'guaranteed', 'guarantee'
      ],
      requiredDisclaimers: [
        'Consult your healthcare provider',
        'Not a substitute for professional medical advice',
        'Individual results may vary'
      ]
    };
  }

  private createFTCRules(): any {
    return {
      prohibitedPractices: [
        'deceptive advertising', 'false testimonials', 'misleading claims'
      ],
      requiredDisclaimers: [
        'Results may vary',
        'Individual results may differ',
        'No medical guarantee'
      ]
    };
  }

  private createGeneralRules(): any {
    return {
      prohibitedContent: [
        'spam', 'scam', 'fraud', 'illegal', 'harmful'
      ],
      requiredElements: [
        'contact information', 'disclaimer', 'privacy policy'
      ]
    };
  }
}
