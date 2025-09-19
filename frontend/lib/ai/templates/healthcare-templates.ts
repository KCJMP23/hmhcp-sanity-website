/**
 * Healthcare Content Templates Module
 * Comprehensive templates for medical and healthcare content generation
 * Compliant with AMA, APA medical citation styles and healthcare content standards
 */

import { z } from 'zod';

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Base content interface with common healthcare requirements
 */
interface BaseContentTemplate {
  id: string;
  type: ContentType;
  title: string;
  wordCount: {
    min: number;
    max: number;
    target: number;
  };
  sections: ContentSection[];
  metadata: ContentMetadata;
  medicalTerminology: MedicalTerminology[];
  citations: CitationStyle;
  disclaimers: string[];
  callToAction: CallToActionPattern;
  seoStructure: SEOMetadata;
}

/**
 * Blog Post Content Template
 */
interface BlogPostTemplate extends BaseContentTemplate {
  type: 'blog-post';
  introduction: {
    hook: string;
    problemStatement: string;
    preview: string;
  };
  body: {
    mainPoints: string[];
    evidenceSupport: string[];
    practicalApplications: string[];
  };
  conclusion: {
    keySummary: string;
    actionableAdvice: string;
    futureConsiderations: string;
  };
}

/**
 * Case Study Content Template
 */
interface CaseStudyTemplate extends BaseContentTemplate {
  type: 'case-study';
  soapStructure: SOAPFormat;
  patientPresentation: {
    demographics: string;
    chiefComplaint: string;
    historyOfPresentIllness: string;
    pastMedicalHistory: string;
  };
  clinicalFindings: {
    physicalExamination: string;
    diagnosticTests: string;
    differentialDiagnosis: string[];
  };
  intervention: {
    treatmentPlan: string;
    procedures: string[];
    medications: MedicationFormat[];
  };
  outcomes: {
    shortTerm: string;
    longTerm: string;
    patientSatisfaction: string;
  };
}

/**
 * White Paper Content Template
 */
interface WhitePaperTemplate extends BaseContentTemplate {
  type: 'white-paper';
  executiveSummary: string;
  problemAnalysis: {
    currentState: string;
    challenges: string[];
    marketGaps: string[];
  };
  solutionFramework: {
    methodology: string;
    implementation: string[];
    expectedOutcomes: string[];
  };
  evidenceBase: {
    clinicalTrials: ClinicalTrialReference[];
    peerReviewedStudies: string[];
    realWorldEvidence: string[];
  };
  economicAnalysis: {
    costBenefitAnalysis: string;
    roi: string;
    budgetImpact: string;
  };
}

/**
 * Research Summary Content Template
 */
interface ResearchSummaryTemplate extends BaseContentTemplate {
  type: 'research-summary';
  picoFramework: PICOFramework;
  studyDesign: {
    methodology: string;
    sampleSize: number;
    duration: string;
    endpoints: string[];
  };
  keyFindings: {
    primaryOutcomes: string[];
    secondaryOutcomes: string[];
    statisticalSignificance: string;
    clinicalRelevance: string;
  };
  evidencePyramid: EvidencePyramidLevel;
  limitations: string[];
  clinicalImplications: string[];
}

/**
 * Patient Education Content Template
 */
interface PatientEducationTemplate extends BaseContentTemplate {
  type: 'patient-education';
  readingLevel: 'elementary' | 'middle-school' | 'high-school' | 'college';
  languageAccessibility: {
    plainLanguage: boolean;
    medicalTermsExplained: boolean;
    visualAids: boolean;
  };
  contentStructure: {
    whatIsIt: string;
    whyImportant: string;
    howToPrevent: string;
    treatmentOptions: string[];
    whenToSeekHelp: string;
  };
  actionableSteps: string[];
  resources: {
    additionalReading: string[];
    supportGroups: string[];
    healthcareProviders: string[];
  };
}

// ============================================================================
// SUPPORTING TYPES AND INTERFACES
// ============================================================================

type ContentType = 
  | 'blog-post' 
  | 'case-study' 
  | 'white-paper' 
  | 'research-summary' 
  | 'patient-education'
  | 'clinical-trial'
  | 'treatment-comparison'
  | 'technology-explainer';

interface ContentSection {
  heading: string;
  subheadings: string[];
  wordCount: number;
  requiredElements: string[];
  medicalCodes?: MedicalCode[];
}

interface ContentMetadata {
  audience: 'healthcare-professionals' | 'patients' | 'administrators' | 'researchers' | 'general-public';
  medicalSpecialty: string[];
  complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  reviewRequired: boolean;
  complianceRequirements: string[];
}

interface MedicalTerminology {
  term: string;
  definition: string;
  context: string;
  relatedCodes?: MedicalCode[];
  alternativeTerms?: string[];
}

interface MedicalCode {
  system: 'ICD-10' | 'CPT' | 'HCPCS' | 'SNOMED-CT' | 'LOINC';
  code: string;
  description: string;
  category: string;
}

interface MedicationFormat {
  genericName: string;
  brandName?: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  contraindications?: string[];
  sideEffects?: string[];
}

interface SOAPFormat {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface PICOFramework {
  population: string;
  intervention: string;
  comparison: string;
  outcome: string;
  timeframe?: string;
}

interface ClinicalTrialReference {
  trialId: string;
  title: string;
  phase: 'I' | 'II' | 'III' | 'IV';
  status: 'recruiting' | 'completed' | 'terminated' | 'suspended';
  population: string;
  intervention: string;
  primaryEndpoint: string;
  estimatedCompletion: string;
}

type EvidencePyramidLevel = 
  | 'systematic-reviews-meta-analyses'
  | 'randomized-controlled-trials'
  | 'cohort-studies'
  | 'case-control-studies'
  | 'case-series'
  | 'expert-opinion';

type CitationStyle = 'AMA' | 'APA-medical' | 'Vancouver' | 'Harvard-medical';

interface CallToActionPattern {
  primary: string;
  secondary?: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  targetAction: 'consultation' | 'education' | 'prevention' | 'treatment' | 'research-participation';
}

interface SEOMetadata {
  title: string;
  metaDescription: string;
  keywords: string[];
  medicalTopics: string[];
  structuredData: {
    type: 'MedicalArticle' | 'MedicalCondition' | 'MedicalProcedure' | 'Drug';
    properties: Record<string, unknown>;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ContentValidationSchema = z.object({
  title: z.string().min(10).max(150),
  wordCount: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    target: z.number().positive(),
  }),
  medicalTerminology: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    context: z.string(),
  })),
  disclaimers: z.array(z.string()).min(1),
});

// ============================================================================
// HEALTHCARE CONTENT TEMPLATE CLASS
// ============================================================================

export class HealthcareContentTemplate {
  private templates: Map<ContentType, BaseContentTemplate>;
  private medicalTerminologyDatabase: Map<string, MedicalTerminology>;
  private citationFormats: Map<CitationStyle, CitationFormat>;

  constructor() {
    this.templates = new Map();
    this.medicalTerminologyDatabase = new Map();
    this.citationFormats = new Map();
    this.initializeTemplates();
    this.initializeMedicalTerminology();
    this.initializeCitationFormats();
  }

  // ========================================================================
  // TEMPLATE CREATION METHODS
  // ========================================================================

  /**
   * Generate a blog post template for healthcare topics
   */
  createBlogPostTemplate(config: BlogPostConfig): BlogPostTemplate {
    return {
      id: `blog-${Date.now()}`,
      type: 'blog-post',
      title: this.generateTitle('blog-post', config.topic),
      wordCount: { min: 500, max: 1500, target: 1000 },
      sections: this.getBlogPostSections(config.specialty),
      metadata: {
        audience: config.audience || 'healthcare-professionals',
        medicalSpecialty: [config.specialty],
        complexityLevel: config.complexityLevel || 'intermediate',
        reviewRequired: true,
        complianceRequirements: ['HIPAA', 'FDA-guidelines']
      },
      medicalTerminology: this.getRelevantTerminology(config.topic),
      citations: config.citationStyle || 'AMA',
      disclaimers: this.getStandardDisclaimers('blog-post'),
      callToAction: this.getCallToAction('education'),
      seoStructure: this.generateSEOStructure('blog-post', config.topic),
      introduction: {
        hook: `Understanding ${config.topic}: What Healthcare Professionals Need to Know`,
        problemStatement: `Current challenges in ${config.topic} management and care delivery`,
        preview: `This article examines evidence-based approaches to ${config.topic}`
      },
      body: {
        mainPoints: this.generateMainPoints(config.topic, config.specialty),
        evidenceSupport: this.generateEvidenceSupport(config.topic),
        practicalApplications: this.generatePracticalApplications(config.topic)
      },
      conclusion: {
        keySummary: `Key takeaways for ${config.topic} in clinical practice`,
        actionableAdvice: `Implementation strategies for healthcare teams`,
        futureConsiderations: `Emerging trends and future directions in ${config.topic}`
      }
    };
  }

  /**
   * Generate a case study template with SOAP format
   */
  createCaseStudyTemplate(config: CaseStudyConfig): CaseStudyTemplate {
    return {
      id: `case-study-${Date.now()}`,
      type: 'case-study',
      title: this.generateTitle('case-study', config.condition),
      wordCount: { min: 2000, max: 3000, target: 2500 },
      sections: this.getCaseStudySections(),
      metadata: {
        audience: 'healthcare-professionals',
        medicalSpecialty: [config.specialty],
        complexityLevel: 'advanced',
        reviewRequired: true,
        complianceRequirements: ['HIPAA', 'IRB-approval', 'patient-consent']
      },
      medicalTerminology: this.getRelevantTerminology(config.condition),
      citations: 'AMA',
      disclaimers: this.getStandardDisclaimers('case-study'),
      callToAction: this.getCallToAction('consultation'),
      seoStructure: this.generateSEOStructure('case-study', config.condition),
      soapStructure: {
        subjective: `Patient-reported symptoms and history related to ${config.condition}`,
        objective: `Clinical findings, vital signs, and examination results`,
        assessment: `Differential diagnosis and clinical reasoning for ${config.condition}`,
        plan: `Treatment strategy, follow-up, and patient education plan`
      },
      patientPresentation: {
        demographics: `[Age], [Gender], [Relevant demographic factors]`,
        chiefComplaint: `Primary symptom or concern bringing patient to care`,
        historyOfPresentIllness: `Detailed timeline and progression of ${config.condition}`,
        pastMedicalHistory: `Relevant medical history, medications, allergies`
      },
      clinicalFindings: {
        physicalExamination: `Systematic physical examination findings`,
        diagnosticTests: `Laboratory, imaging, and specialized test results`,
        differentialDiagnosis: this.generateDifferentialDiagnosis(config.condition)
      },
      intervention: {
        treatmentPlan: `Evidence-based treatment approach for ${config.condition}`,
        procedures: this.generateProcedures(config.condition),
        medications: this.generateMedicationProtocol(config.condition)
      },
      outcomes: {
        shortTerm: `Immediate treatment response and early outcomes`,
        longTerm: `Follow-up results and sustained improvements`,
        patientSatisfaction: `Patient-reported experience and satisfaction measures`
      }
    };
  }

  /**
   * Generate a white paper template for healthcare policy/technology
   */
  createWhitePaperTemplate(config: WhitePaperConfig): WhitePaperTemplate {
    return {
      id: `whitepaper-${Date.now()}`,
      type: 'white-paper',
      title: this.generateTitle('white-paper', config.topic),
      wordCount: { min: 3000, max: 5000, target: 4000 },
      sections: this.getWhitePaperSections(),
      metadata: {
        audience: config.audience || 'administrators',
        medicalSpecialty: config.specialties || ['health-policy'],
        complexityLevel: 'expert',
        reviewRequired: true,
        complianceRequirements: ['regulatory-compliance', 'evidence-standards']
      },
      medicalTerminology: this.getRelevantTerminology(config.topic),
      citations: 'APA-medical',
      disclaimers: this.getStandardDisclaimers('white-paper'),
      callToAction: this.getCallToAction('research-participation'),
      seoStructure: this.generateSEOStructure('white-paper', config.topic),
      executiveSummary: `Comprehensive analysis of ${config.topic} and its implications for healthcare delivery`,
      problemAnalysis: {
        currentState: `Current landscape and challenges in ${config.topic}`,
        challenges: this.generateChallenges(config.topic),
        marketGaps: this.generateMarketGaps(config.topic)
      },
      solutionFramework: {
        methodology: `Evidence-based approach to addressing ${config.topic}`,
        implementation: this.generateImplementationSteps(config.topic),
        expectedOutcomes: this.generateExpectedOutcomes(config.topic)
      },
      evidenceBase: {
        clinicalTrials: this.generateClinicalTrialReferences(config.topic),
        peerReviewedStudies: this.generateStudyReferences(config.topic),
        realWorldEvidence: this.generateRealWorldEvidence(config.topic)
      },
      economicAnalysis: {
        costBenefitAnalysis: `Financial impact assessment of ${config.topic} implementation`,
        roi: `Return on investment projections and break-even analysis`,
        budgetImpact: `Budget considerations and resource allocation requirements`
      }
    };
  }

  /**
   * Generate a research summary template with PICO framework
   */
  createResearchSummaryTemplate(config: ResearchSummaryConfig): ResearchSummaryTemplate {
    return {
      id: `research-summary-${Date.now()}`,
      type: 'research-summary',
      title: this.generateTitle('research-summary', config.studyTopic),
      wordCount: { min: 1000, max: 2000, target: 1500 },
      sections: this.getResearchSummarySections(),
      metadata: {
        audience: 'researchers',
        medicalSpecialty: [config.specialty],
        complexityLevel: 'advanced',
        reviewRequired: true,
        complianceRequirements: ['research-ethics', 'IRB-standards']
      },
      medicalTerminology: this.getRelevantTerminology(config.studyTopic),
      citations: 'Vancouver',
      disclaimers: this.getStandardDisclaimers('research-summary'),
      callToAction: this.getCallToAction('research-participation'),
      seoStructure: this.generateSEOStructure('research-summary', config.studyTopic),
      picoFramework: {
        population: config.population || `Patients with ${config.studyTopic}`,
        intervention: config.intervention || `[Specific intervention being studied]`,
        comparison: config.comparison || `Standard care or placebo`,
        outcome: config.outcome || `Primary clinical outcomes`,
        timeframe: config.timeframe || `[Study duration]`
      },
      studyDesign: {
        methodology: config.methodology || 'Randomized controlled trial',
        sampleSize: config.sampleSize || 100,
        duration: config.duration || '12 months',
        endpoints: this.generateEndpoints(config.studyTopic)
      },
      keyFindings: {
        primaryOutcomes: this.generatePrimaryOutcomes(config.studyTopic),
        secondaryOutcomes: this.generateSecondaryOutcomes(config.studyTopic),
        statisticalSignificance: `Statistical analysis and significance levels`,
        clinicalRelevance: `Clinical significance and real-world applicability`
      },
      evidencePyramid: config.evidenceLevel || 'randomized-controlled-trials',
      limitations: this.generateStudyLimitations(),
      clinicalImplications: this.generateClinicalImplications(config.studyTopic)
    };
  }

  /**
   * Generate a patient education template with accessibility features
   */
  createPatientEducationTemplate(config: PatientEducationConfig): PatientEducationTemplate {
    return {
      id: `patient-ed-${Date.now()}`,
      type: 'patient-education',
      title: this.generateTitle('patient-education', config.condition),
      wordCount: { min: 500, max: 1000, target: 750 },
      sections: this.getPatientEducationSections(),
      metadata: {
        audience: 'patients',
        medicalSpecialty: [config.specialty],
        complexityLevel: 'basic',
        reviewRequired: true,
        complianceRequirements: ['patient-safety', 'health-literacy']
      },
      medicalTerminology: this.getPatientFriendlyTerminology(config.condition),
      citations: 'Harvard-medical',
      disclaimers: this.getStandardDisclaimers('patient-education'),
      callToAction: this.getCallToAction('consultation'),
      seoStructure: this.generateSEOStructure('patient-education', config.condition),
      readingLevel: config.readingLevel || 'middle-school',
      languageAccessibility: {
        plainLanguage: true,
        medicalTermsExplained: true,
        visualAids: config.includeVisuals || false
      },
      contentStructure: {
        whatIsIt: `Simple explanation of ${config.condition} in plain language`,
        whyImportant: `Why understanding ${config.condition} matters for your health`,
        howToPrevent: `Prevention strategies and lifestyle modifications`,
        treatmentOptions: this.generatePatientTreatmentOptions(config.condition),
        whenToSeekHelp: `Warning signs and when to contact your healthcare provider`
      },
      actionableSteps: this.generatePatientActionSteps(config.condition),
      resources: {
        additionalReading: this.generatePatientResources(config.condition),
        supportGroups: this.generateSupportGroups(config.condition),
        healthcareProviders: this.generateProviderTypes(config.condition)
      }
    };
  }

  // ========================================================================
  // SPECIALIZED TEMPLATE METHODS
  // ========================================================================

  /**
   * Generate clinical trial description template
   */
  createClinicalTrialTemplate(config: ClinicalTrialConfig): BaseContentTemplate {
    return {
      id: `clinical-trial-${Date.now()}`,
      type: 'clinical-trial',
      title: `Clinical Trial: ${config.intervention} for ${config.condition}`,
      wordCount: { min: 1000, max: 2000, target: 1500 },
      sections: [
        {
          heading: 'Study Overview',
          subheadings: ['Purpose', 'Design', 'Primary Objectives'],
          wordCount: 300,
          requiredElements: ['NCT number', 'Phase', 'Sponsor']
        },
        {
          heading: 'Eligibility Criteria',
          subheadings: ['Inclusion Criteria', 'Exclusion Criteria'],
          wordCount: 400,
          requiredElements: ['Age requirements', 'Medical conditions', 'Prior treatments']
        },
        {
          heading: 'Study Procedures',
          subheadings: ['Screening', 'Treatment Protocol', 'Follow-up'],
          wordCount: 500,
          requiredElements: ['Visit schedule', 'Assessments', 'Safety monitoring']
        },
        {
          heading: 'Risks and Benefits',
          subheadings: ['Potential Risks', 'Potential Benefits', 'Alternatives'],
          wordCount: 300,
          requiredElements: ['Informed consent', 'Withdrawal rights']
        }
      ],
      metadata: {
        audience: 'patients',
        medicalSpecialty: [config.specialty],
        complexityLevel: 'intermediate',
        reviewRequired: true,
        complianceRequirements: ['ICH-GCP', 'FDA-regulations', 'IRB-approval']
      },
      medicalTerminology: this.getRelevantTerminology(config.condition),
      citations: 'AMA',
      disclaimers: this.getClinicalTrialDisclaimers(),
      callToAction: {
        primary: 'Contact study coordinator for eligibility screening',
        secondary: 'Discuss with your physician',
        urgency: 'medium',
        targetAction: 'research-participation'
      },
      seoStructure: this.generateSEOStructure('clinical-trial', config.condition)
    };
  }

  /**
   * Generate treatment comparison guide template
   */
  createTreatmentComparisonTemplate(config: TreatmentComparisonConfig): BaseContentTemplate {
    return {
      id: `treatment-comparison-${Date.now()}`,
      type: 'treatment-comparison',
      title: `Treatment Options for ${config.condition}: A Comprehensive Comparison`,
      wordCount: { min: 1500, max: 2500, target: 2000 },
      sections: [
        {
          heading: 'Treatment Overview',
          subheadings: ['Available Options', 'Decision Factors'],
          wordCount: 300,
          requiredElements: ['Evidence levels', 'Guidelines referenced']
        },
        {
          heading: 'Treatment Comparison Matrix',
          subheadings: ['Efficacy', 'Safety Profile', 'Cost Analysis'],
          wordCount: 800,
          requiredElements: ['Comparative effectiveness', 'Side effects', 'Contraindications']
        },
        {
          heading: 'Patient Selection Criteria',
          subheadings: ['Optimal Candidates', 'Risk Factors', 'Contraindications'],
          wordCount: 500,
          requiredElements: ['Clinical decision making', 'Shared decision making']
        },
        {
          heading: 'Implementation Guidelines',
          subheadings: ['Treatment Protocols', 'Monitoring', 'Follow-up'],
          wordCount: 400,
          requiredElements: ['Quality metrics', 'Outcome measures']
        }
      ],
      metadata: {
        audience: 'healthcare-professionals',
        medicalSpecialty: [config.specialty],
        complexityLevel: 'advanced',
        reviewRequired: true,
        complianceRequirements: ['evidence-based-medicine', 'clinical-guidelines']
      },
      medicalTerminology: this.getRelevantTerminology(config.condition),
      citations: 'AMA',
      disclaimers: this.getStandardDisclaimers('treatment-comparison'),
      callToAction: {
        primary: 'Consult clinical guidelines for specific patient populations',
        urgency: 'medium',
        targetAction: 'consultation'
      },
      seoStructure: this.generateSEOStructure('treatment-comparison', config.condition)
    };
  }

  /**
   * Generate healthcare technology explainer template
   */
  createTechnologyExplainerTemplate(config: TechnologyExplainerConfig): BaseContentTemplate {
    return {
      id: `tech-explainer-${Date.now()}`,
      type: 'technology-explainer',
      title: `Understanding ${config.technology}: Applications in Healthcare`,
      wordCount: { min: 1000, max: 2000, target: 1500 },
      sections: [
        {
          heading: 'Technology Overview',
          subheadings: ['What It Is', 'How It Works', 'Key Features'],
          wordCount: 400,
          requiredElements: ['Technical specifications', 'Regulatory status']
        },
        {
          heading: 'Healthcare Applications',
          subheadings: ['Clinical Use Cases', 'Workflow Integration', 'Patient Impact'],
          wordCount: 600,
          requiredElements: ['Evidence base', 'Outcomes data']
        },
        {
          heading: 'Implementation Considerations',
          subheadings: ['Infrastructure Requirements', 'Training Needs', 'Cost Analysis'],
          wordCount: 400,
          requiredElements: ['ROI analysis', 'Change management']
        },
        {
          heading: 'Future Directions',
          subheadings: ['Emerging Features', 'Research Pipeline', 'Market Trends'],
          wordCount: 100,
          requiredElements: ['Innovation timeline', 'Competitive landscape']
        }
      ],
      metadata: {
        audience: config.audience || 'healthcare-professionals',
        medicalSpecialty: ['health-informatics'],
        complexityLevel: 'intermediate',
        reviewRequired: true,
        complianceRequirements: ['technology-assessment', 'regulatory-compliance']
      },
      medicalTerminology: this.getTechnologyTerminology(config.technology),
      citations: 'APA-medical',
      disclaimers: this.getTechnologyDisclaimers(),
      callToAction: {
        primary: 'Explore implementation opportunities',
        secondary: 'Request demonstration or trial',
        urgency: 'low',
        targetAction: 'education'
      },
      seoStructure: this.generateSEOStructure('technology-explainer', config.technology)
    };
  }

  // ========================================================================
  // MEDICAL TERMINOLOGY AND CODING INTEGRATION
  // ========================================================================

  /**
   * Get relevant medical terminology for a given topic
   */
  private getRelevantTerminology(topic: string): MedicalTerminology[] {
    // This would integrate with medical terminology databases
    const commonTerms = this.medicalTerminologyDatabase.get(topic.toLowerCase()) || [];
    return [
      ...commonTerms,
      {
        term: 'Evidence-based medicine',
        definition: 'The conscientious use of current best evidence in making decisions about patient care',
        context: 'Clinical decision making and treatment planning',
        relatedCodes: [{
          system: 'SNOMED-CT',
          code: '182836005',
          description: 'Evidence-based medicine',
          category: 'Clinical concept'
        }]
      },
      {
        term: 'Patient-centered care',
        definition: 'Healthcare that is respectful of and responsive to individual patient preferences, needs, and values',
        context: 'Healthcare delivery and quality improvement',
        relatedCodes: [{
          system: 'SNOMED-CT',
          code: '182840002',
          description: 'Patient-centered care',
          category: 'Clinical concept'
        }]
      }
    ];
  }

  /**
   * Get patient-friendly terminology explanations
   */
  private getPatientFriendlyTerminology(condition: string): MedicalTerminology[] {
    return [
      {
        term: 'Acute',
        definition: 'Sudden onset or short-term',
        context: 'When describing how quickly symptoms start or how long they last',
        alternativeTerms: ['sudden', 'short-term', 'recent']
      },
      {
        term: 'Chronic',
        definition: 'Long-lasting or recurring over time',
        context: 'When describing ongoing health conditions',
        alternativeTerms: ['long-term', 'ongoing', 'persistent']
      },
      {
        term: 'Prognosis',
        definition: 'The likely course and outcome of your condition',
        context: 'What to expect with treatment and recovery',
        alternativeTerms: ['outlook', 'expected outcome', 'recovery prediction']
      }
    ];
  }

  /**
   * Generate ICD-10 code references for conditions
   */
  private generateICD10Codes(condition: string): MedicalCode[] {
    // This would integrate with ICD-10 database
    return [
      {
        system: 'ICD-10',
        code: 'Z00.00',
        description: 'Encounter for general adult medical examination without abnormal findings',
        category: 'Health status and contact with health services'
      }
    ];
  }

  /**
   * Generate CPT code references for procedures
   */
  private generateCPTCodes(procedure: string): MedicalCode[] {
    return [
      {
        system: 'CPT',
        code: '99213',
        description: 'Office or other outpatient visit for established patient',
        category: 'Evaluation and Management'
      }
    ];
  }

  // ========================================================================
  // TEMPLATE VALIDATION AND CUSTOMIZATION
  // ========================================================================

  /**
   * Validate template content against healthcare standards
   */
  validateTemplate(template: BaseContentTemplate): ValidationResult {
    try {
      ContentValidationSchema.parse(template);
      
      const validation: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      // Medical terminology validation
      if (template.medicalTerminology.length === 0) {
        validation.warnings.push('No medical terminology defined for healthcare content');
      }

      // Disclaimer validation
      if (template.disclaimers.length === 0) {
        validation.errors.push('Healthcare content must include appropriate disclaimers');
        validation.isValid = false;
      }

      // Word count validation
      if (template.wordCount.target < template.wordCount.min || 
          template.wordCount.target > template.wordCount.max) {
        validation.errors.push('Target word count must be within min/max range');
        validation.isValid = false;
      }

      // Compliance validation
      if (template.metadata.reviewRequired && !template.metadata.complianceRequirements.length) {
        validation.warnings.push('Content requiring review should specify compliance requirements');
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Customize template based on specific requirements
   */
  customizeTemplate(
    template: BaseContentTemplate, 
    customization: TemplateCustomization
  ): BaseContentTemplate {
    const customized = { ...template };

    // Apply audience-specific customizations
    if (customization.audience) {
      customized.metadata.audience = customization.audience;
      customized.medicalTerminology = this.adjustTerminologyForAudience(
        template.medicalTerminology, 
        customization.audience
      );
    }

    // Apply specialty-specific customizations
    if (customization.medicalSpecialty) {
      customized.metadata.medicalSpecialty = [customization.medicalSpecialty];
      customized.sections = this.addSpecialtySpecificSections(
        template.sections, 
        customization.medicalSpecialty
      );
    }

    // Apply word count adjustments
    if (customization.wordCountAdjustment) {
      const adjustment = customization.wordCountAdjustment;
      customized.wordCount = {
        min: Math.max(100, template.wordCount.min + adjustment.min),
        max: template.wordCount.max + adjustment.max,
        target: template.wordCount.target + adjustment.target
      };
    }

    // Apply compliance requirements
    if (customization.additionalCompliance) {
      customized.metadata.complianceRequirements = [
        ...template.metadata.complianceRequirements,
        ...customization.additionalCompliance
      ];
    }

    return customized;
  }

  // ========================================================================
  // STYLE GUIDES AND CITATION FORMATS
  // ========================================================================

  /**
   * Get citation format for specified style
   */
  getCitationFormat(style: CitationStyle): CitationFormat {
    return this.citationFormats.get(style) || this.citationFormats.get('AMA')!;
  }

  /**
   * Generate properly formatted medical citations
   */
  formatMedicalCitation(
    reference: MedicalReference, 
    style: CitationStyle = 'AMA'
  ): string {
    const format = this.getCitationFormat(style);
    
    switch (style) {
      case 'AMA':
        return this.formatAMACitation(reference);
      case 'APA-medical':
        return this.formatAPAMedicalCitation(reference);
      case 'Vancouver':
        return this.formatVancouverCitation(reference);
      case 'Harvard-medical':
        return this.formatHarvardMedicalCitation(reference);
      default:
        return this.formatAMACitation(reference);
    }
  }

  /**
   * Format AMA style citation
   */
  private formatAMACitation(ref: MedicalReference): string {
    const authors = ref.authors.length > 6 
      ? `${ref.authors.slice(0, 6).join(', ')}, et al`
      : ref.authors.join(', ');
    
    return `${authors}. ${ref.title}. ${ref.journal}. ${ref.year};${ref.volume}(${ref.issue}):${ref.pages}. doi:${ref.doi}`;
  }

  /**
   * Format APA Medical style citation
   */
  private formatAPAMedicalCitation(ref: MedicalReference): string {
    const authors = ref.authors.map(author => {
      const parts = author.split(' ');
      const lastName = parts[parts.length - 1];
      const initials = parts.slice(0, -1).map(name => name.charAt(0)).join('. ');
      return `${lastName}, ${initials}.`;
    }).join(', ');

    return `${authors} (${ref.year}). ${ref.title}. ${ref.journal}, ${ref.volume}(${ref.issue}), ${ref.pages}. https://doi.org/${ref.doi}`;
  }

  /**
   * Format Vancouver style citation
   */
  private formatVancouverCitation(ref: MedicalReference): string {
    const authors = ref.authors.map(author => {
      const parts = author.split(' ');
      const lastName = parts[parts.length - 1];
      const initials = parts.slice(0, -1).map(name => name.charAt(0)).join('');
      return `${lastName} ${initials}`;
    }).join(', ');

    return `${authors}. ${ref.title}. ${ref.journal}. ${ref.year};${ref.volume}(${ref.issue}):${ref.pages}.`;
  }

  /**
   * Format Harvard Medical style citation
   */
  private formatHarvardMedicalCitation(ref: MedicalReference): string {
    const authors = ref.authors.length > 1 
      ? `${ref.authors[0]} et al.`
      : ref.authors[0];
    
    return `${authors}, ${ref.year}. ${ref.title}. ${ref.journal}, ${ref.volume}(${ref.issue}), pp. ${ref.pages}.`;
  }

  // ========================================================================
  // HELPER METHODS FOR TEMPLATE GENERATION
  // ========================================================================

  private generateTitle(type: ContentType, topic: string): string {
    const titleFormats = {
      'blog-post': `Understanding ${topic}: Evidence-Based Insights for Healthcare Professionals`,
      'case-study': `Clinical Case Study: Managing ${topic} in Complex Patients`,
      'white-paper': `${topic}: Strategic Analysis and Implementation Framework for Healthcare Organizations`,
      'research-summary': `Research Summary: Latest Evidence on ${topic} Treatment and Outcomes`,
      'patient-education': `${topic}: What Patients Need to Know`,
      'clinical-trial': `Clinical Trial: Investigating ${topic} Treatment Approaches`,
      'treatment-comparison': `Treatment Options for ${topic}: A Comprehensive Comparison`,
      'technology-explainer': `${topic}: Transforming Healthcare Through Technology`
    };

    return titleFormats[type] || `Healthcare Guide: ${topic}`;
  }

  private getBlogPostSections(specialty: string): ContentSection[] {
    return [
      {
        heading: 'Introduction',
        subheadings: ['Current Landscape', 'Key Challenges', 'Article Overview'],
        wordCount: 200,
        requiredElements: ['Problem statement', 'Clinical relevance']
      },
      {
        heading: 'Evidence Review',
        subheadings: ['Recent Research', 'Clinical Guidelines', 'Best Practices'],
        wordCount: 400,
        requiredElements: ['Peer-reviewed sources', 'Evidence levels']
      },
      {
        heading: 'Clinical Applications',
        subheadings: ['Patient Assessment', 'Treatment Protocols', 'Monitoring'],
        wordCount: 300,
        requiredElements: ['Practical guidelines', 'Implementation tips']
      },
      {
        heading: 'Conclusion',
        subheadings: ['Key Takeaways', 'Future Directions', 'Action Items'],
        wordCount: 100,
        requiredElements: ['Summary points', 'Next steps']
      }
    ];
  }

  private getCaseStudySections(): ContentSection[] {
    return [
      {
        heading: 'Patient Presentation',
        subheadings: ['Chief Complaint', 'History', 'Physical Examination'],
        wordCount: 500,
        requiredElements: ['Demographics', 'Timeline', 'Clinical findings']
      },
      {
        heading: 'Diagnostic Workup',
        subheadings: ['Laboratory Studies', 'Imaging', 'Differential Diagnosis'],
        wordCount: 600,
        requiredElements: ['Test results', 'Clinical reasoning']
      },
      {
        heading: 'Management',
        subheadings: ['Treatment Plan', 'Interventions', 'Monitoring'],
        wordCount: 700,
        requiredElements: ['Evidence-based approach', 'Patient involvement']
      },
      {
        heading: 'Outcomes and Discussion',
        subheadings: ['Results', 'Lessons Learned', 'Literature Review'],
        wordCount: 700,
        requiredElements: ['Outcome measures', 'Clinical significance']
      }
    ];
  }

  private getWhitePaperSections(): ContentSection[] {
    return [
      {
        heading: 'Executive Summary',
        subheadings: ['Key Findings', 'Recommendations', 'Impact'],
        wordCount: 300,
        requiredElements: ['Main conclusions', 'Strategic implications']
      },
      {
        heading: 'Problem Analysis',
        subheadings: ['Current State', 'Market Challenges', 'Opportunity Assessment'],
        wordCount: 1000,
        requiredElements: ['Data analysis', 'Stakeholder perspectives']
      },
      {
        heading: 'Solution Framework',
        subheadings: ['Methodology', 'Implementation Strategy', 'Success Metrics'],
        wordCount: 1200,
        requiredElements: ['Evidence base', 'Implementation plan']
      },
      {
        heading: 'Economic Analysis',
        subheadings: ['Cost-Benefit Analysis', 'ROI Projections', 'Budget Impact'],
        wordCount: 800,
        requiredElements: ['Financial modeling', 'Risk assessment']
      },
      {
        heading: 'Recommendations',
        subheadings: ['Strategic Actions', 'Implementation Timeline', 'Success Factors'],
        wordCount: 700,
        requiredElements: ['Action items', 'Milestones']
      }
    ];
  }

  private getResearchSummarySections(): ContentSection[] {
    return [
      {
        heading: 'Study Overview',
        subheadings: ['Objectives', 'Design', 'Population'],
        wordCount: 300,
        requiredElements: ['PICO framework', 'Study registration']
      },
      {
        heading: 'Methodology',
        subheadings: ['Study Design', 'Participants', 'Interventions', 'Outcomes'],
        wordCount: 400,
        requiredElements: ['Statistical plan', 'Ethical approval']
      },
      {
        heading: 'Results',
        subheadings: ['Primary Outcomes', 'Secondary Outcomes', 'Safety Data'],
        wordCount: 500,
        requiredElements: ['Statistical analysis', 'Effect sizes']
      },
      {
        heading: 'Clinical Implications',
        subheadings: ['Practice Impact', 'Guidelines Update', 'Future Research'],
        wordCount: 300,
        requiredElements: ['Clinical significance', 'Implementation considerations']
      }
    ];
  }

  private getPatientEducationSections(): ContentSection[] {
    return [
      {
        heading: 'What You Need to Know',
        subheadings: ['Understanding Your Condition', 'Why It Matters'],
        wordCount: 200,
        requiredElements: ['Plain language', 'Key concepts']
      },
      {
        heading: 'Treatment Options',
        subheadings: ['Available Treatments', 'What to Expect', 'Making Decisions'],
        wordCount: 300,
        requiredElements: ['Patient choice', 'Shared decision making']
      },
      {
        heading: 'Managing Your Health',
        subheadings: ['Daily Care', 'Lifestyle Changes', 'Monitoring'],
        wordCount: 200,
        requiredElements: ['Actionable steps', 'Self-care']
      },
      {
        heading: 'Getting Help',
        subheadings: ['When to Call', 'Resources', 'Support'],
        wordCount: 50,
        requiredElements: ['Emergency signs', 'Contact information']
      }
    ];
  }

  private getStandardDisclaimers(contentType: ContentType): string[] {
    const baseDisclaimers = [
      'This content is for educational purposes only and does not constitute medical advice.',
      'Always consult with qualified healthcare professionals for medical decisions.',
      'Individual results may vary based on personal health factors and circumstances.'
    ];

    const typeSpecificDisclaimers = {
      'blog-post': [
        'The information presented represents current best practices and may evolve with new evidence.',
        'Healthcare professionals should verify all clinical information with current guidelines.'
      ],
      'case-study': [
        'Patient details have been modified to protect privacy while maintaining clinical accuracy.',
        'This case represents one clinical scenario and may not apply to all similar presentations.',
        'All patient information is used with appropriate consent and ethical approval.'
      ],
      'white-paper': [
        'Economic projections are based on available data and may vary with implementation.',
        'Organizations should conduct their own analysis before making strategic decisions.',
        'Regulatory requirements may vary by jurisdiction and should be independently verified.'
      ],
      'research-summary': [
        'This summary does not replace reading the full research publication.',
        'Clinical significance should be evaluated in the context of individual patient care.',
        'Research findings require validation in real-world clinical settings.'
      ],
      'patient-education': [
        'This information supplements but does not replace professional medical advice.',
        'Contact your healthcare provider immediately for urgent medical concerns.',
        'Treatment decisions should always involve healthcare professional consultation.'
      ],
      'clinical-trial': [
        'Participation in clinical trials is voluntary and can be discontinued at any time.',
        'Potential risks and benefits should be carefully considered with your physician.',
        'All research is conducted under strict ethical and regulatory oversight.'
      ],
      'treatment-comparison': [
        'Treatment selection should be individualized based on patient-specific factors.',
        'This comparison is based on available evidence and clinical guidelines.',
        'Healthcare providers should consider all relevant factors in treatment decisions.'
      ],
      'technology-explainer': [
        'Technology capabilities and regulatory status may change over time.',
        'Implementation should follow institutional policies and regulatory requirements.',
        'Clinical outcomes may vary based on implementation and user factors.'
      ]
    };

    return [...baseDisclaimers, ...(typeSpecificDisclaimers[contentType] || [])];
  }

  private getClinicalTrialDisclaimers(): string[] {
    return [
      'Participation in clinical research is voluntary and you may withdraw at any time.',
      'All research is conducted under strict ethical oversight and regulatory compliance.',
      'Potential risks and benefits will be thoroughly explained during informed consent.',
      'Your privacy and confidentiality will be protected according to HIPAA regulations.',
      'No guarantee of therapeutic benefit from participation in research studies.',
      'Standard medical care remains available regardless of research participation.',
      'All questions about the study should be directed to the research team.',
      'Independent ethics review board approval is required for all clinical research.'
    ];
  }

  private getTechnologyDisclaimers(): string[] {
    return [
      'Technology descriptions are based on publicly available information.',
      'Clinical outcomes may vary based on implementation and institutional factors.',
      'Regulatory approval status may differ by geographic region.',
      'Technology capabilities and features may evolve with software updates.',
      'Implementation should follow institutional policies and best practices.',
      'Cost estimates are approximate and may vary based on specific requirements.',
      'Professional training and support are recommended for optimal outcomes.',
      'Technology assessment should include evaluation of local infrastructure needs.'
    ];
  }

  private getCallToAction(actionType: string): CallToActionPattern {
    const callToActions = {
      'education': {
        primary: 'Continue learning about evidence-based healthcare practices',
        secondary: 'Share this information with your healthcare team',
        urgency: 'low' as const,
        targetAction: 'education' as const
      },
      'consultation': {
        primary: 'Schedule a consultation with a qualified healthcare provider',
        secondary: 'Prepare questions to discuss with your medical team',
        urgency: 'medium' as const,
        targetAction: 'consultation' as const
      },
      'prevention': {
        primary: 'Take proactive steps to maintain your health',
        secondary: 'Discuss prevention strategies with your healthcare provider',
        urgency: 'medium' as const,
        targetAction: 'prevention' as const
      },
      'treatment': {
        primary: 'Work with your healthcare team to develop a treatment plan',
        secondary: 'Ask about all available treatment options',
        urgency: 'high' as const,
        targetAction: 'treatment' as const
      },
      'research-participation': {
        primary: 'Consider participating in clinical research to advance medical knowledge',
        secondary: 'Discuss research opportunities with your physician',
        urgency: 'low' as const,
        targetAction: 'research-participation' as const
      }
    };

    return callToActions[actionType] || callToActions['education'];
  }

  private generateSEOStructure(contentType: ContentType, topic: string): SEOMetadata {
    return {
      title: `${topic} | Healthcare Information | HMHCP`,
      metaDescription: `Comprehensive healthcare information about ${topic}. Evidence-based content for healthcare professionals and patients.`,
      keywords: [topic, 'healthcare', 'medical information', 'evidence-based medicine', 'patient care'],
      medicalTopics: [topic],
      structuredData: {
        type: 'MedicalArticle',
        properties: {
          '@context': 'https://schema.org',
          '@type': 'MedicalArticle',
          'headline': `Healthcare Guide: ${topic}`,
          'author': {
            '@type': 'Organization',
            'name': 'HM Healthcare Partners'
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'HM Healthcare Partners'
          },
          'medicalAudience': {
            '@type': 'MedicalAudience',
            'audienceType': 'HealthcareProfessional'
          }
        }
      }
    };
  }

  // Additional helper methods for generating specific content sections
  private generateMainPoints(topic: string, specialty: string): string[] {
    return [
      `Current evidence-based approaches to ${topic} management`,
      `Clinical decision-making frameworks for ${topic}`,
      `Patient safety considerations in ${topic} care`,
      `Quality improvement strategies for ${topic} outcomes`,
      `Interdisciplinary collaboration in ${topic} treatment`
    ];
  }

  private generateEvidenceSupport(topic: string): string[] {
    return [
      `Systematic reviews and meta-analyses on ${topic}`,
      `Randomized controlled trials demonstrating efficacy`,
      `Clinical practice guidelines from professional societies`,
      `Real-world evidence and observational studies`,
      `Expert consensus statements and position papers`
    ];
  }

  private generatePracticalApplications(topic: string): string[] {
    return [
      `Implementation strategies for ${topic} protocols`,
      `Workflow integration and clinical decision support`,
      `Patient education and engagement approaches`,
      `Quality metrics and outcome measurement`,
      `Team-based care coordination for ${topic}`
    ];
  }

  private generateDifferentialDiagnosis(condition: string): string[] {
    return [
      `Primary differential diagnoses for ${condition}`,
      `Secondary conditions to consider`,
      `Rare but serious diagnoses to exclude`,
      `Diagnostic criteria and distinguishing features`
    ];
  }

  private generateProcedures(condition: string): string[] {
    return [
      `Standard diagnostic procedures for ${condition}`,
      `Therapeutic interventions and techniques`,
      `Monitoring and follow-up procedures`,
      `Emergency procedures when indicated`
    ];
  }

  private generateMedicationProtocol(condition: string): MedicationFormat[] {
    return [
      {
        genericName: '[Medication name]',
        brandName: '[Brand name if applicable]',
        dosage: '[Dose and strength]',
        frequency: '[Frequency of administration]',
        route: '[Route of administration]',
        duration: '[Duration of treatment]',
        contraindications: ['[Contraindications]'],
        sideEffects: ['[Common side effects]']
      }
    ];
  }

  private generateChallenges(topic: string): string[] {
    return [
      `Current limitations in ${topic} management`,
      `Healthcare delivery barriers and constraints`,
      `Resource allocation and cost considerations`,
      `Regulatory and compliance challenges`,
      `Technology adoption and implementation hurdles`
    ];
  }

  private generateMarketGaps(topic: string): string[] {
    return [
      `Unmet clinical needs in ${topic}`,
      `Technology and innovation opportunities`,
      `Healthcare access and equity gaps`,
      `Quality and safety improvement areas`,
      `Cost-effectiveness optimization potential`
    ];
  }

  private generateImplementationSteps(topic: string): string[] {
    return [
      `Phase 1: Assessment and planning for ${topic}`,
      `Phase 2: Pilot implementation and testing`,
      `Phase 3: Full-scale deployment and training`,
      `Phase 4: Monitoring and continuous improvement`,
      `Phase 5: Evaluation and sustainability planning`
    ];
  }

  private generateExpectedOutcomes(topic: string): string[] {
    return [
      `Improved patient outcomes and safety`,
      `Enhanced healthcare quality and efficiency`,
      `Reduced costs and resource utilization`,
      `Increased provider satisfaction and engagement`,
      `Better patient experience and satisfaction`
    ];
  }

  private generateClinicalTrialReferences(topic: string): ClinicalTrialReference[] {
    return [
      {
        trialId: 'NCT00000000',
        title: `Clinical Trial of [Intervention] for ${topic}`,
        phase: 'III',
        status: 'recruiting',
        population: `Patients with ${topic}`,
        intervention: '[Investigational intervention]',
        primaryEndpoint: '[Primary efficacy endpoint]',
        estimatedCompletion: '[Estimated completion date]'
      }
    ];
  }

  private generateStudyReferences(topic: string): string[] {
    return [
      `Systematic review of ${topic} interventions (Cochrane Database)`,
      `Multicenter randomized trial of ${topic} treatment approaches`,
      `Observational study of ${topic} outcomes in real-world settings`,
      `Meta-analysis of ${topic} safety and efficacy data`,
      `Prospective cohort study of ${topic} long-term outcomes`
    ];
  }

  private generateRealWorldEvidence(topic: string): string[] {
    return [
      `Registry data on ${topic} patient outcomes`,
      `Electronic health record analyses of ${topic} care`,
      `Health economics outcomes research on ${topic}`,
      `Patient-reported outcome measures for ${topic}`,
      `Quality improvement initiative results for ${topic}`
    ];
  }

  private generateEndpoints(studyTopic: string): string[] {
    return [
      `Primary efficacy endpoint for ${studyTopic}`,
      `Secondary effectiveness measures`,
      `Safety and tolerability assessments`,
      `Quality of life outcomes`,
      `Healthcare utilization metrics`
    ];
  }

  private generatePrimaryOutcomes(studyTopic: string): string[] {
    return [
      `Statistically significant improvement in primary endpoint`,
      `Clinical response rates and duration of effect`,
      `Time to clinical improvement or resolution`,
      `Composite outcome measures achievement`
    ];
  }

  private generateSecondaryOutcomes(studyTopic: string): string[] {
    return [
      `Secondary efficacy measures and biomarkers`,
      `Patient-reported quality of life improvements`,
      `Healthcare resource utilization changes`,
      `Long-term safety and tolerability profile`
    ];
  }

  private generateStudyLimitations(): string[] {
    return [
      'Study duration may limit assessment of long-term outcomes',
      'Single-center design may affect generalizability',
      'Potential selection bias in study population',
      'Limited diversity in study participant demographics',
      'Potential confounding variables not fully controlled'
    ];
  }

  private generateClinicalImplications(studyTopic: string): string[] {
    return [
      `Practice-changing implications for ${studyTopic} management`,
      `Updates to clinical guidelines and recommendations`,
      `Training and education needs for healthcare providers`,
      `Implementation considerations for healthcare systems`,
      `Future research priorities and knowledge gaps`
    ];
  }

  private generatePatientTreatmentOptions(condition: string): string[] {
    return [
      `Non-invasive treatment approaches for ${condition}`,
      `Medication options and how they work`,
      `Surgical or procedural interventions when needed`,
      `Lifestyle modifications and self-care strategies`,
      `Alternative and complementary therapy options`
    ];
  }

  private generatePatientActionSteps(condition: string): string[] {
    return [
      `Schedule regular check-ups with your healthcare provider`,
      `Follow prescribed treatment plans consistently`,
      `Monitor symptoms and report changes promptly`,
      `Maintain healthy lifestyle habits`,
      `Stay informed about your condition and treatment options`,
      `Build a support network of family, friends, and healthcare providers`
    ];
  }

  private generatePatientResources(condition: string): string[] {
    return [
      `National institutes and foundations for ${condition}`,
      `Patient education websites and materials`,
      `Mobile apps for condition management`,
      `Educational videos and webinars`,
      `Printed guides and brochures`
    ];
  }

  private generateSupportGroups(condition: string): string[] {
    return [
      `Local support groups for ${condition}`,
      `Online communities and forums`,
      `Peer mentorship programs`,
      `Family and caregiver support resources`,
      `Professional counseling and mental health support`
    ];
  }

  private generateProviderTypes(condition: string): string[] {
    return [
      `Primary care physicians and family medicine doctors`,
      `Specialists relevant to ${condition}`,
      `Nurse practitioners and physician assistants`,
      `Allied health professionals (physical therapy, nutrition, etc.)`,
      `Care coordinators and patient navigators`
    ];
  }

  private getTechnologyTerminology(technology: string): MedicalTerminology[] {
    return [
      {
        term: 'Interoperability',
        definition: 'The ability of different healthcare systems and software to communicate and exchange data',
        context: 'Healthcare technology integration and data sharing',
        relatedCodes: [{
          system: 'SNOMED-CT',
          code: '182836005',
          description: 'Health information technology',
          category: 'Technology concept'
        }]
      },
      {
        term: 'Clinical Decision Support',
        definition: 'Technology tools that provide healthcare professionals with patient-specific assessments and evidence-based recommendations',
        context: 'Electronic health records and clinical workflow integration',
        alternativeTerms: ['CDS', 'decision support systems', 'clinical alerts']
      }
    ];
  }

  private adjustTerminologyForAudience(
    terminology: MedicalTerminology[], 
    audience: string
  ): MedicalTerminology[] {
    if (audience === 'patients') {
      return terminology.map(term => ({
        ...term,
        definition: this.simplifyDefinition(term.definition),
        alternativeTerms: this.addPlainLanguageTerms(term.alternativeTerms || [])
      }));
    }
    return terminology;
  }

  private simplifyDefinition(definition: string): string {
    // Simplify medical language for patient audiences
    return definition
      .replace(/\b(utilize|utilization)\b/g, 'use')
      .replace(/\b(demonstrate)\b/g, 'show')
      .replace(/\b(administer)\b/g, 'give')
      .replace(/\b(therapeutic)\b/g, 'treatment')
      .replace(/\b(efficacy)\b/g, 'effectiveness');
  }

  private addPlainLanguageTerms(terms: string[]): string[] {
    return [...terms, 'simple terms', 'everyday language', 'plain English'];
  }

  private addSpecialtySpecificSections(
    sections: ContentSection[], 
    specialty: string
  ): ContentSection[] {
    const specialtySections = {
      'cardiology': [
        {
          heading: 'Cardiovascular Risk Assessment',
          subheadings: ['Risk Factors', 'Diagnostic Testing', 'Risk Stratification'],
          wordCount: 300,
          requiredElements: ['ACC/AHA guidelines', 'Risk calculators']
        }
      ],
      'oncology': [
        {
          heading: 'Cancer Staging and Prognosis',
          subheadings: ['TNM Staging', 'Molecular Markers', 'Treatment Planning'],
          wordCount: 400,
          requiredElements: ['NCCN guidelines', 'Multidisciplinary care']
        }
      ],
      'endocrinology': [
        {
          heading: 'Metabolic Assessment',
          subheadings: ['Hormone Testing', 'Metabolic Panels', 'Long-term Monitoring'],
          wordCount: 350,
          requiredElements: ['ADA guidelines', 'Endocrine society recommendations']
        }
      ]
    };

    const additionalSections = specialtySections[specialty as keyof typeof specialtySections] || [];
    return [...sections, ...additionalSections];
  }

  // ========================================================================
  // INITIALIZATION METHODS
  // ========================================================================

  private initializeTemplates(): void {
    // Initialize base templates for each content type
    // This would be expanded with actual template data
  }

  private initializeMedicalTerminology(): void {
    // Initialize medical terminology database
    // This would integrate with actual medical terminology services
    const commonTerminology = [
      {
        term: 'Acute',
        definition: 'Having a sudden onset, sharp rise, and short course',
        context: 'Clinical description of symptom onset and duration',
        alternativeTerms: ['sudden', 'severe', 'short-term']
      },
      {
        term: 'Chronic',
        definition: 'Persisting for a long time or constantly recurring',
        context: 'Clinical description of ongoing or long-term conditions',
        alternativeTerms: ['long-term', 'ongoing', 'persistent']
      },
      {
        term: 'Pathophysiology',
        definition: 'The disordered physiological processes associated with disease or injury',
        context: 'Understanding disease mechanisms and biological processes',
        alternativeTerms: ['disease mechanism', 'biological basis']
      }
    ];

    commonTerminology.forEach(term => {
      this.medicalTerminologyDatabase.set(term.term.toLowerCase(), [term]);
    });
  }

  private initializeCitationFormats(): void {
    this.citationFormats.set('AMA', {
      style: 'AMA',
      description: 'American Medical Association citation style',
      authorFormat: 'LastName First Initial.',
      titleFormat: 'Sentence case',
      dateFormat: 'Year',
      journalFormat: 'Abbreviated journal name'
    });

    this.citationFormats.set('APA-medical', {
      style: 'APA-medical',
      description: 'APA style adapted for medical literature',
      authorFormat: 'LastName, F. I.',
      titleFormat: 'Sentence case',
      dateFormat: '(Year)',
      journalFormat: 'Full journal name in italics'
    });

    this.citationFormats.set('Vancouver', {
      style: 'Vancouver',
      description: 'Vancouver citation style for medical journals',
      authorFormat: 'LastName FI',
      titleFormat: 'Sentence case',
      dateFormat: 'Year',
      journalFormat: 'Abbreviated journal name'
    });

    this.citationFormats.set('Harvard-medical', {
      style: 'Harvard-medical',
      description: 'Harvard citation style for medical literature',
      authorFormat: 'LastName, F.I.',
      titleFormat: 'Sentence case',
      dateFormat: 'Year',
      journalFormat: 'Full journal name'
    });
  }
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

interface BlogPostConfig {
  topic: string;
  specialty: string;
  audience?: 'healthcare-professionals' | 'patients' | 'administrators';
  complexityLevel?: 'basic' | 'intermediate' | 'advanced';
  citationStyle?: CitationStyle;
}

interface CaseStudyConfig {
  condition: string;
  specialty: string;
  patientAge?: number;
  complexity?: 'standard' | 'complex' | 'rare';
}

interface WhitePaperConfig {
  topic: string;
  audience?: 'administrators' | 'policymakers' | 'researchers';
  specialties?: string[];
  focusArea?: 'policy' | 'technology' | 'economics' | 'quality';
}

interface ResearchSummaryConfig {
  studyTopic: string;
  specialty: string;
  methodology?: string;
  population?: string;
  intervention?: string;
  comparison?: string;
  outcome?: string;
  timeframe?: string;
  sampleSize?: number;
  duration?: string;
  evidenceLevel?: EvidencePyramidLevel;
}

interface PatientEducationConfig {
  condition: string;
  specialty: string;
  readingLevel?: 'elementary' | 'middle-school' | 'high-school' | 'college';
  includeVisuals?: boolean;
  culturalConsiderations?: string[];
}

interface ClinicalTrialConfig {
  intervention: string;
  condition: string;
  specialty: string;
  phase: 'I' | 'II' | 'III' | 'IV';
  population: string;
}

interface TreatmentComparisonConfig {
  condition: string;
  specialty: string;
  treatments: string[];
  comparisonCriteria?: string[];
}

interface TechnologyExplainerConfig {
  technology: string;
  audience?: 'healthcare-professionals' | 'administrators' | 'patients';
  implementationFocus?: boolean;
}

interface TemplateCustomization {
  audience?: string;
  medicalSpecialty?: string;
  wordCountAdjustment?: {
    min: number;
    max: number;
    target: number;
  };
  additionalCompliance?: string[];
  culturalAdaptations?: string[];
  languageLevel?: 'basic' | 'intermediate' | 'advanced';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface CitationFormat {
  style: CitationStyle;
  description: string;
  authorFormat: string;
  titleFormat: string;
  dateFormat: string;
  journalFormat: string;
}

interface MedicalReference {
  authors: string[];
  title: string;
  journal: string;
  year: number;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  pmid?: string;
  type: 'journal-article' | 'book' | 'conference' | 'guideline' | 'website';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default HealthcareContentTemplate;

export type {
  BaseContentTemplate,
  BlogPostTemplate,
  CaseStudyTemplate,
  WhitePaperTemplate,
  ResearchSummaryTemplate,
  PatientEducationTemplate,
  ContentType,
  MedicalTerminology,
  MedicalCode,
  SOAPFormat,
  PICOFramework,
  ClinicalTrialReference,
  EvidencePyramidLevel,
  CitationStyle,
  CallToActionPattern,
  SEOMetadata,
  BlogPostConfig,
  CaseStudyConfig,
  WhitePaperConfig,
  ResearchSummaryConfig,
  PatientEducationConfig,
  ClinicalTrialConfig,
  TreatmentComparisonConfig,
  TechnologyExplainerConfig,
  TemplateCustomization,
  ValidationResult,
  MedicalReference
};