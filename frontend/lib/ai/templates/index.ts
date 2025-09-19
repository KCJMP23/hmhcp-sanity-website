/**
 * Healthcare Content Templates Module
 * Export interface for all healthcare content template functionality
 */

export { default as HealthcareContentTemplate } from './healthcare-templates';

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
} from './healthcare-templates';

// Template factory for quick instantiation
export function createHealthcareTemplateEngine(): HealthcareContentTemplate {
  return new HealthcareContentTemplate();
}

// Utility functions for common template operations
export const templateUtils = {
  /**
   * Get all available content types
   */
  getContentTypes(): ContentType[] {
    return [
      'blog-post',
      'case-study', 
      'white-paper',
      'research-summary',
      'patient-education',
      'clinical-trial',
      'treatment-comparison',
      'technology-explainer'
    ];
  },

  /**
   * Get recommended word count for content type
   */
  getRecommendedWordCount(contentType: ContentType): { min: number; max: number; target: number } {
    const wordCounts = {
      'blog-post': { min: 500, max: 1500, target: 1000 },
      'case-study': { min: 2000, max: 3000, target: 2500 },
      'white-paper': { min: 3000, max: 5000, target: 4000 },
      'research-summary': { min: 1000, max: 2000, target: 1500 },
      'patient-education': { min: 500, max: 1000, target: 750 },
      'clinical-trial': { min: 1000, max: 2000, target: 1500 },
      'treatment-comparison': { min: 1500, max: 2500, target: 2000 },
      'technology-explainer': { min: 1000, max: 2000, target: 1500 }
    };

    return wordCounts[contentType];
  },

  /**
   * Get appropriate citation style for content type
   */
  getRecommendedCitationStyle(contentType: ContentType): CitationStyle {
    const citationStyles = {
      'blog-post': 'AMA' as const,
      'case-study': 'AMA' as const,
      'white-paper': 'APA-medical' as const,
      'research-summary': 'Vancouver' as const,
      'patient-education': 'Harvard-medical' as const,
      'clinical-trial': 'AMA' as const,
      'treatment-comparison': 'AMA' as const,
      'technology-explainer': 'APA-medical' as const
    };

    return citationStyles[contentType] || 'AMA';
  },

  /**
   * Get compliance requirements for content type
   */
  getComplianceRequirements(contentType: ContentType): string[] {
    const compliance = {
      'blog-post': ['HIPAA', 'FDA-guidelines'],
      'case-study': ['HIPAA', 'IRB-approval', 'patient-consent'],
      'white-paper': ['regulatory-compliance', 'evidence-standards'],
      'research-summary': ['research-ethics', 'IRB-standards'],
      'patient-education': ['patient-safety', 'health-literacy'],
      'clinical-trial': ['ICH-GCP', 'FDA-regulations', 'IRB-approval'],
      'treatment-comparison': ['evidence-based-medicine', 'clinical-guidelines'],
      'technology-explainer': ['technology-assessment', 'regulatory-compliance']
    };

    return compliance[contentType] || ['HIPAA'];
  }
};

import type { ContentType, CitationStyle } from './healthcare-templates';