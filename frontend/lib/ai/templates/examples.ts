/**
 * Healthcare Content Templates - Usage Examples
 * Demonstrates how to use the HealthcareContentTemplate class for various content types
 */

import HealthcareContentTemplate from './healthcare-templates';
import type {
  BlogPostConfig,
  CaseStudyConfig,
  WhitePaperConfig,
  ResearchSummaryConfig,
  PatientEducationConfig,
  ClinicalTrialConfig,
  TreatmentComparisonConfig,
  TechnologyExplainerConfig
} from './healthcare-templates';

// ============================================================================
// EXAMPLE USAGE DEMONSTRATIONS
// ============================================================================

/**
 * Example: Creating a comprehensive healthcare blog post
 */
export function createDiabetesBlogPostExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const blogConfig: BlogPostConfig = {
    topic: 'Type 2 Diabetes Management',
    specialty: 'endocrinology',
    audience: 'healthcare-professionals',
    complexityLevel: 'intermediate',
    citationStyle: 'AMA'
  };

  const blogTemplate = templateEngine.createBlogPostTemplate(blogConfig);
  
  console.log('Blog Post Template Created:');
  console.log(`Title: ${blogTemplate.title}`);
  console.log(`Word Count Target: ${blogTemplate.wordCount.target}`);
  console.log(`Sections: ${blogTemplate.sections.map(s => s.heading).join(', ')}`);
  console.log(`Medical Terminology: ${blogTemplate.medicalTerminology.length} terms`);
  console.log(`Disclaimers: ${blogTemplate.disclaimers.length} items`);
  
  // Validate the template
  const validation = templateEngine.validateTemplate(blogTemplate);
  console.log(`Template Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log(`Errors: ${validation.errors.join(', ')}`);
  }
}

/**
 * Example: Creating a clinical case study for cardiology
 */
export function createCardiologyCaseStudyExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const caseConfig: CaseStudyConfig = {
    condition: 'Acute Myocardial Infarction',
    specialty: 'cardiology',
    patientAge: 65,
    complexity: 'complex'
  };

  const caseTemplate = templateEngine.createCaseStudyTemplate(caseConfig);
  
  console.log('Case Study Template Created:');
  console.log(`Title: ${caseTemplate.title}`);
  console.log(`SOAP Structure:`);
  console.log(`- Subjective: ${caseTemplate.soapStructure.subjective}`);
  console.log(`- Objective: ${caseTemplate.soapStructure.objective}`);
  console.log(`- Assessment: ${caseTemplate.soapStructure.assessment}`);
  console.log(`- Plan: ${caseTemplate.soapStructure.plan}`);
  console.log(`Patient Demographics: ${caseTemplate.patientPresentation.demographics}`);
  console.log(`Compliance Requirements: ${caseTemplate.metadata.complianceRequirements.join(', ')}`);
}

/**
 * Example: Creating a white paper on healthcare AI
 */
export function createHealthcareAIWhitePaperExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const whitePaperConfig: WhitePaperConfig = {
    topic: 'Artificial Intelligence in Clinical Decision Support',
    audience: 'administrators',
    specialties: ['health-informatics', 'general-practice'],
    focusArea: 'technology'
  };

  const whitePaperTemplate = templateEngine.createWhitePaperTemplate(whitePaperConfig);
  
  console.log('White Paper Template Created:');
  console.log(`Title: ${whitePaperTemplate.title}`);
  console.log(`Executive Summary: ${whitePaperTemplate.executiveSummary}`);
  console.log(`Problem Analysis Challenges: ${whitePaperTemplate.problemAnalysis.challenges.length} items`);
  console.log(`Implementation Steps: ${whitePaperTemplate.solutionFramework.implementation.length} phases`);
  console.log(`Economic Analysis Focus: Cost-Benefit, ROI, Budget Impact`);
}

/**
 * Example: Creating a research summary with PICO framework
 */
export function createCOVIDResearchSummaryExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const researchConfig: ResearchSummaryConfig = {
    studyTopic: 'Long COVID Syndrome',
    specialty: 'infectious-disease',
    methodology: 'Prospective cohort study',
    population: 'Adults with confirmed COVID-19 infection',
    intervention: 'Multidisciplinary rehabilitation program',
    comparison: 'Standard care',
    outcome: 'Functional capacity improvement',
    timeframe: '6 months',
    sampleSize: 500,
    duration: '12 months',
    evidenceLevel: 'cohort-studies'
  };

  const researchTemplate = templateEngine.createResearchSummaryTemplate(researchConfig);
  
  console.log('Research Summary Template Created:');
  console.log(`Title: ${researchTemplate.title}`);
  console.log(`PICO Framework:`);
  console.log(`- Population: ${researchTemplate.picoFramework.population}`);
  console.log(`- Intervention: ${researchTemplate.picoFramework.intervention}`);
  console.log(`- Comparison: ${researchTemplate.picoFramework.comparison}`);
  console.log(`- Outcome: ${researchTemplate.picoFramework.outcome}`);
  console.log(`- Timeframe: ${researchTemplate.picoFramework.timeframe}`);
  console.log(`Evidence Level: ${researchTemplate.evidencePyramid}`);
  console.log(`Study Design: ${researchTemplate.studyDesign.methodology}`);
}

/**
 * Example: Creating patient education material for hypertension
 */
export function createHypertensionPatientEducationExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const patientEdConfig: PatientEducationConfig = {
    condition: 'High Blood Pressure (Hypertension)',
    specialty: 'cardiology',
    readingLevel: 'middle-school',
    includeVisuals: true,
    culturalConsiderations: ['dietary-preferences', 'family-involvement']
  };

  const patientTemplate = templateEngine.createPatientEducationTemplate(patientEdConfig);
  
  console.log('Patient Education Template Created:');
  console.log(`Title: ${patientTemplate.title}`);
  console.log(`Reading Level: ${patientTemplate.readingLevel}`);
  console.log(`Language Accessibility Features:`);
  console.log(`- Plain Language: ${patientTemplate.languageAccessibility.plainLanguage}`);
  console.log(`- Medical Terms Explained: ${patientTemplate.languageAccessibility.medicalTermsExplained}`);
  console.log(`- Visual Aids: ${patientTemplate.languageAccessibility.visualAids}`);
  console.log(`Content Structure:`);
  console.log(`- What It Is: ${patientTemplate.contentStructure.whatIsIt}`);
  console.log(`- Why Important: ${patientTemplate.contentStructure.whyImportant}`);
  console.log(`Actionable Steps: ${patientTemplate.actionableSteps.length} items`);
}

/**
 * Example: Creating a clinical trial description
 */
export function createClinicalTrialExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const trialConfig: ClinicalTrialConfig = {
    intervention: 'Novel Alzheimer\'s Drug (Investigational)',
    condition: 'Early-Stage Alzheimer\'s Disease',
    specialty: 'neurology',
    phase: 'III',
    population: 'Adults aged 65-85 with mild cognitive impairment'
  };

  const trialTemplate = templateEngine.createClinicalTrialTemplate(trialConfig);
  
  console.log('Clinical Trial Template Created:');
  console.log(`Title: ${trialTemplate.title}`);
  console.log(`Compliance Requirements: ${trialTemplate.metadata.complianceRequirements.join(', ')}`);
  console.log(`Call to Action: ${trialTemplate.callToAction.primary}`);
  console.log(`Urgency Level: ${trialTemplate.callToAction.urgency}`);
  console.log(`Target Action: ${trialTemplate.callToAction.targetAction}`);
}

/**
 * Example: Creating a treatment comparison guide
 */
export function createTreatmentComparisonExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const comparisonConfig: TreatmentComparisonConfig = {
    condition: 'Rheumatoid Arthritis',
    specialty: 'rheumatology',
    treatments: ['Methotrexate', 'Biologics', 'JAK Inhibitors'],
    comparisonCriteria: ['efficacy', 'safety', 'cost', 'convenience']
  };

  const comparisonTemplate = templateEngine.createTreatmentComparisonTemplate(comparisonConfig);
  
  console.log('Treatment Comparison Template Created:');
  console.log(`Title: ${comparisonTemplate.title}`);
  console.log(`Audience: ${comparisonTemplate.metadata.audience}`);
  console.log(`Complexity Level: ${comparisonTemplate.metadata.complexityLevel}`);
  console.log(`Sections: ${comparisonTemplate.sections.map(s => s.heading).join(', ')}`);
}

/**
 * Example: Creating a healthcare technology explainer
 */
export function createTechnologyExplainerExample(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const techConfig: TechnologyExplainerConfig = {
    technology: 'Electronic Health Records (EHR) Systems',
    audience: 'healthcare-professionals',
    implementationFocus: true
  };

  const techTemplate = templateEngine.createTechnologyExplainerTemplate(techConfig);
  
  console.log('Technology Explainer Template Created:');
  console.log(`Title: ${techTemplate.title}`);
  console.log(`Target Audience: ${techTemplate.metadata.audience}`);
  console.log(`Medical Specialty: ${techTemplate.metadata.medicalSpecialty.join(', ')}`);
  console.log(`Word Count Range: ${techTemplate.wordCount.min}-${techTemplate.wordCount.max} words`);
}

/**
 * Example: Template customization and validation
 */
export function demonstrateTemplateCustomization(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  // Create base template
  const baseConfig: BlogPostConfig = {
    topic: 'Telemedicine Implementation',
    specialty: 'health-informatics',
    audience: 'healthcare-professionals'
  };
  
  const baseTemplate = templateEngine.createBlogPostTemplate(baseConfig);
  
  // Customize for different audience
  const customization = {
    audience: 'patients',
    wordCountAdjustment: {
      min: -200,
      max: -500,
      target: -300
    },
    additionalCompliance: ['patient-safety', 'privacy-protection'],
    languageLevel: 'basic' as const
  };
  
  const customizedTemplate = templateEngine.customizeTemplate(baseTemplate, customization);
  
  console.log('Template Customization Example:');
  console.log(`Original Audience: ${baseTemplate.metadata.audience}`);
  console.log(`Customized Audience: ${customizedTemplate.metadata.audience}`);
  console.log(`Original Word Count: ${baseTemplate.wordCount.target}`);
  console.log(`Customized Word Count: ${customizedTemplate.wordCount.target}`);
  console.log(`Added Compliance: ${customizedTemplate.metadata.complianceRequirements.slice(-2).join(', ')}`);
  
  // Validate both templates
  const baseValidation = templateEngine.validateTemplate(baseTemplate);
  const customValidation = templateEngine.validateTemplate(customizedTemplate);
  
  console.log(`Base Template Valid: ${baseValidation.isValid}`);
  console.log(`Customized Template Valid: ${customValidation.isValid}`);
}

/**
 * Example: Medical citation formatting
 */
export function demonstrateCitationFormatting(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const sampleReference = {
    authors: ['Smith, John A.', 'Johnson, Mary B.', 'Williams, Robert C.'],
    title: 'Effectiveness of telehealth interventions for chronic disease management: a systematic review',
    journal: 'Journal of Medical Internet Research',
    year: 2023,
    volume: '25',
    issue: '4',
    pages: 'e12345',
    doi: '10.2196/12345',
    type: 'journal-article' as const
  };
  
  console.log('Citation Formatting Examples:');
  console.log('AMA Style:');
  console.log(templateEngine.formatMedicalCitation(sampleReference, 'AMA'));
  console.log('\nAPA Medical Style:');
  console.log(templateEngine.formatMedicalCitation(sampleReference, 'APA-medical'));
  console.log('\nVancouver Style:');
  console.log(templateEngine.formatMedicalCitation(sampleReference, 'Vancouver'));
  console.log('\nHarvard Medical Style:');
  console.log(templateEngine.formatMedicalCitation(sampleReference, 'Harvard-medical'));
}

/**
 * Example: Comprehensive workflow demonstration
 */
export function runCompleteWorkflowExample(): void {
  console.log('='.repeat(80));
  console.log('HEALTHCARE CONTENT TEMPLATES - COMPREHENSIVE EXAMPLES');
  console.log('='.repeat(80));
  
  console.log('\n1. BLOG POST EXAMPLE:');
  console.log('-'.repeat(40));
  createDiabetesBlogPostExample();
  
  console.log('\n2. CASE STUDY EXAMPLE:');
  console.log('-'.repeat(40));
  createCardiologyCaseStudyExample();
  
  console.log('\n3. WHITE PAPER EXAMPLE:');
  console.log('-'.repeat(40));
  createHealthcareAIWhitePaperExample();
  
  console.log('\n4. RESEARCH SUMMARY EXAMPLE:');
  console.log('-'.repeat(40));
  createCOVIDResearchSummaryExample();
  
  console.log('\n5. PATIENT EDUCATION EXAMPLE:');
  console.log('-'.repeat(40));
  createHypertensionPatientEducationExample();
  
  console.log('\n6. CLINICAL TRIAL EXAMPLE:');
  console.log('-'.repeat(40));
  createClinicalTrialExample();
  
  console.log('\n7. TREATMENT COMPARISON EXAMPLE:');
  console.log('-'.repeat(40));
  createTreatmentComparisonExample();
  
  console.log('\n8. TECHNOLOGY EXPLAINER EXAMPLE:');
  console.log('-'.repeat(40));
  createTechnologyExplainerExample();
  
  console.log('\n9. TEMPLATE CUSTOMIZATION EXAMPLE:');
  console.log('-'.repeat(40));
  demonstrateTemplateCustomization();
  
  console.log('\n10. CITATION FORMATTING EXAMPLE:');
  console.log('-'.repeat(40));
  demonstrateCitationFormatting();
  
  console.log('\n' + '='.repeat(80));
  console.log('WORKFLOW COMPLETE - All template types demonstrated successfully');
  console.log('='.repeat(80));
}

// ============================================================================
// INTEGRATION EXAMPLES WITH EXISTING HMHCP SYSTEMS
// ============================================================================

/**
 * Example: Integration with HMHCP AI agents for content generation
 */
export function integrateWithHMHCPAIAgents(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  // Example: Generate content for HMHCP platform features
  const platformContent = {
    'ai-diagnostics': {
      config: {
        topic: 'AI-Powered Diagnostic Imaging',
        specialty: 'radiology',
        audience: 'healthcare-professionals' as const
      },
      type: 'technology-explainer' as const
    },
    'predictive-analytics': {
      config: {
        topic: 'Predictive Analytics for Patient Outcomes',
        specialty: 'data-science',
        audience: 'administrators' as const
      },
      type: 'white-paper' as const
    },
    'patient-engagement': {
      config: {
        condition: 'Chronic Disease Management',
        specialty: 'general-practice',
        readingLevel: 'middle-school' as const
      },
      type: 'patient-education' as const
    }
  };
  
  console.log('HMHCP Platform Content Generation:');
  
  Object.entries(platformContent).forEach(([platform, content]) => {
    console.log(`\nGenerating ${content.type} for ${platform}:`);
    
    switch (content.type) {
      case 'technology-explainer':
        const techTemplate = templateEngine.createTechnologyExplainerTemplate(content.config as TechnologyExplainerConfig);
        console.log(`- Title: ${techTemplate.title}`);
        console.log(`- Target: ${techTemplate.wordCount.target} words`);
        break;
      case 'white-paper':
        const wpTemplate = templateEngine.createWhitePaperTemplate(content.config as WhitePaperConfig);
        console.log(`- Title: ${wpTemplate.title}`);
        console.log(`- Focus: ${wpTemplate.executiveSummary}`);
        break;
      case 'patient-education':
        const peTemplate = templateEngine.createPatientEducationTemplate(content.config as PatientEducationConfig);
        console.log(`- Title: ${peTemplate.title}`);
        console.log(`- Reading Level: ${peTemplate.readingLevel}`);
        break;
    }
  });
}

/**
 * Example: Batch template generation for HMHCP content strategy
 */
export function generateHMHCPContentStrategy(): void {
  const templateEngine = new HealthcareContentTemplate();
  
  const contentStrategy = [
    // Healthcare Platforms Content
    { type: 'blog-post', topic: 'Remote Patient Monitoring Systems', specialty: 'cardiology' },
    { type: 'case-study', condition: 'Digital Health Intervention Success', specialty: 'health-informatics' },
    { type: 'white-paper', topic: 'Healthcare Data Interoperability', audience: 'administrators' },
    
    // Research & Publications
    { type: 'research-summary', studyTopic: 'Clinical Decision Support Effectiveness', specialty: 'general-practice' },
    { type: 'research-summary', studyTopic: 'AI Diagnostic Accuracy', specialty: 'radiology' },
    
    // Patient Education Series
    { type: 'patient-education', condition: 'Understanding Your Health Data', specialty: 'health-informatics' },
    { type: 'patient-education', condition: 'Preparing for Telemedicine Visits', specialty: 'general-practice' },
    
    // Clinical Trials & Technology
    { type: 'clinical-trial', intervention: 'Digital Therapeutics Platform', condition: 'Diabetes Management', specialty: 'endocrinology' },
    { type: 'technology-explainer', technology: 'BMAD Method AI Integration', audience: 'healthcare-professionals' }
  ];
  
  console.log('HMHCP Content Strategy - Batch Generation:');
  console.log(`Total Content Pieces: ${contentStrategy.length}`);
  
  contentStrategy.forEach((content, index) => {
    console.log(`\n${index + 1}. ${content.type.toUpperCase()}:`);
    console.log(`   Topic/Condition: ${content.topic || content.condition || content.studyTopic || content.intervention}`);
    console.log(`   Specialty: ${content.specialty}`);
    console.log(`   Audience: ${content.audience || 'healthcare-professionals'}`);
  });
  
  console.log('\nContent Strategy optimized for HMHCP platform features and BMAD Method integration');
}

// Export all examples for external usage
export {
  runCompleteWorkflowExample,
  integrateWithHMHCPAIAgents,
  generateHMHCPContentStrategy
};