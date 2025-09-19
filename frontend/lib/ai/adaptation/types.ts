/**
 * @fileoverview Type definitions for the Audience Adaptation System
 * Comprehensive type system for healthcare content adaptation
 */

/**
 * Core audience profile definition
 */
export interface AudienceProfile {
  /** Language complexity level */
  languageLevel: 'elementary' | 'intermediate' | 'advanced' | 'expert';
  
  /** Medical knowledge level */
  medicalKnowledge: 'basic' | 'intermediate' | 'advanced' | 'expert';
  
  /** General expertise level */
  expertiseLevel: 'novice' | 'intermediate' | 'professional' | 'expert' | 'academic' | 'business' | 'financial' | 'healthcare_economics';
  
  /** Attention span characteristics */
  attentionSpan: 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
  
  /** Information processing style */
  informationProcessingStyle: 'visual' | 'auditory' | 'sequential' | 'hierarchical' | 'narrative' | 'analytical';
  
  /** Communication preferences */
  communicationPreferences: {
    directness: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    formality: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    empathy: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  };
  
  /** Primary concerns and motivations */
  primaryConcerns: string[];
  
  /** Decision-making factors */
  decisionFactors: string[];
  
  /** Preferred content formats */
  preferredFormats: string[];
  
  /** Optional specialty or focus area */
  specialty?: string;
  
  /** Optional role or position */
  role?: string;
  
  /** Optional organization type */
  organizationType?: 'hospital' | 'clinic' | 'academic' | 'pharma' | 'payer' | 'government' | 'nonprofit';
}

/**
 * Adaptation strategy configuration
 */
export interface AdaptationStrategy {
  /** Medical terminology adaptation level */
  terminologyLevel: 'simplified' | 'moderate' | 'professional' | 'academic' | 'business_focused' | 'financial' | 'health_economics';
  
  /** Technical depth control */
  technicalDepth: 'minimal' | 'moderate' | 'detailed' | 'comprehensive';
  
  /** Tone and style configuration */
  toneStyle: {
    primary: 'professional' | 'empathetic' | 'authoritative' | 'conversational' | 'academic' | 'persuasive' | 'analytical' | 'objective' | 'confident';
    secondary?: string;
  };
  
  /** Narrative structure approach */
  narrativeStyle: 'story_driven' | 'evidence_based' | 'results_oriented' | 'methodical' | 'opportunity_focused' | 'data_driven';
  
  /** Visual emphasis level */
  visualEmphasis: 'low' | 'medium' | 'high' | 'very_high';
  
  /** Interactivity level */
  interactivity: 'low' | 'medium' | 'high' | 'very_high';
  
  /** Personalization level */
  personalization: 'low' | 'medium' | 'high' | 'very_high';
}

/**
 * Personalization settings for individual users
 */
export interface PersonalizationSettings {
  /** Preferred reading level override */
  preferredReadingLevel?: 'elementary' | 'intermediate' | 'advanced' | 'expert';
  
  /** Cultural and regional context */
  culturalContext?: {
    region: string;
    language: string;
    healthcareSystem: string;
    culturalValues: string[];
  };
  
  /** Accessibility requirements */
  accessibility?: {
    visualImpairment: boolean;
    hearingImpairment: boolean;
    cognitiveAccessibility: boolean;
    motorImpairment: boolean;
    colorBlindness: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra_large';
    highContrast: boolean;
  };
  
  /** Language preferences */
  languagePreferences?: {
    primaryLanguage: string;
    secondaryLanguages: string[];
    translationRequired: boolean;
    culturalNuances: boolean;
  };
  
  /** Emotional considerations */
  emotionalContext?: {
    sensitivityLevel: 'low' | 'medium' | 'high' | 'very_high';
    traumaInformed: boolean;
    anxietyLevel: 'low' | 'medium' | 'high';
    hopefulness: 'low' | 'medium' | 'high';
  };
  
  /** Learning preferences */
  learningStyle?: {
    preferredModality: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pacingPreference: 'slow' | 'medium' | 'fast';
    repetitionNeeded: boolean;
    examplesPreferred: boolean;
  };
  
  /** Technology comfort level */
  technologyComfort?: 'low' | 'medium' | 'high' | 'expert';
  
  /** Time constraints */
  timeConstraints?: {
    sessionLength: 'very_short' | 'short' | 'medium' | 'long';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    followUpAvailability: boolean;
  };
}

/**
 * Complete content adaptation result
 */
export interface ContentAdaptation {
  /** Original content */
  originalContent: string;
  
  /** Adapted content */
  adaptedContent: string;
  
  /** Target audience type */
  audienceType: string;
  
  /** Applied audience profile */
  profile: AudienceProfile;
  
  /** Applied adaptation strategy */
  strategy: AdaptationStrategy;
  
  /** Engagement optimization results */
  engagement: EngagementOptimization;
  
  /** Quality score (0-1) */
  adaptationScore: number;
  
  /** Adaptation metadata */
  metadata: {
    timestamp: string;
    readingLevel: string;
    culturalSensitivity: number;
    engagementPotential: number;
    adaptationTime?: number;
    wordCountChange?: number;
    complexityReduction?: number;
  };
  
  /** Suggested improvements */
  suggestions?: string[];
  
  /** A/B testing variants */
  variants?: ContentVariant[];
}

/**
 * Engagement optimization configuration
 */
export interface EngagementOptimization {
  /** Customized call-to-action suggestions */
  callToActions: string[];
  
  /** Optimized content length */
  optimizedLength: number;
  
  /** Interactive element suggestions */
  interactiveElements: string[];
  
  /** Multi-media recommendations */
  multiMediaSuggestions: string[];
  
  /** Follow-up content suggestions */
  followUpContent: string[];
  
  /** Overall engagement score */
  score: number;
  
  /** Specific engagement tactics */
  tactics?: {
    personalNarratives: boolean;
    dataVisualization: boolean;
    interactiveQuizzes: boolean;
    videoContent: boolean;
    socialProof: boolean;
    urgencyCreation: boolean;
    trustSignals: boolean;
  };
  
  /** Conversion optimization */
  conversionOptimization?: {
    primaryCTA: string;
    secondaryCTA?: string;
    conversionPath: string[];
    riskMitigation: string[];
  };
}

/**
 * Content variant for A/B testing
 */
export interface ContentVariant {
  id: string;
  name: string;
  content: string;
  strategy: Partial<AdaptationStrategy>;
  expectedPerformance: number;
  testingNotes: string;
}

/**
 * Language processing options
 */
export interface LanguageProcessingOptions {
  maxSyllablesPerWord?: number;
  maxWordsPerSentence?: number;
  avoidPassiveVoice?: boolean;
  useCommonWords?: boolean;
  allowTechnicalTerms?: boolean;
  allowComplexStructures?: boolean;
  includeTechnicalTerms?: boolean;
  useAcademicTone?: boolean;
  maximizePrecision?: boolean;
  includeSpecializedTerminology?: boolean;
  allowComplexSyntax?: boolean;
}

/**
 * Medical terminology adaptation options
 */
export interface MedicalTerminologyOptions {
  simplificationLevel: 'none' | 'minimal' | 'moderate' | 'extensive';
  includeDefinitions: boolean;
  useAnalogies: boolean;
  contextualExplanations: boolean;
  visualAids: boolean;
  pronunciationGuides: boolean;
}

/**
 * Cultural adaptation options
 */
export interface CulturalAdaptationOptions {
  healthcareSystem: string;
  culturalValues: string[];
  communicationStyle: string;
  familyInvolvement: 'low' | 'medium' | 'high';
  authorityRelationship: 'hierarchical' | 'collaborative' | 'egalitarian';
  decisionMakingStyle: 'individual' | 'family' | 'community';
  timeOrientation: 'past' | 'present' | 'future';
  riskTolerance: 'low' | 'medium' | 'high';
}

/**
 * Tone adjustment parameters
 */
export interface ToneAdjustmentParams {
  warmth: number; // 0-1 scale
  authority: number; // 0-1 scale
  formality: number; // 0-1 scale
  urgency: number; // 0-1 scale
  optimism: number; // 0-1 scale
  empathy: number; // 0-1 scale
  confidence: number; // 0-1 scale
}

/**
 * Reading level assessment result
 */
export interface ReadingLevelAssessment {
  level: string;
  grade: number;
  complexity: number;
  vocabulary: number;
  sentenceStructure: number;
  recommendations: string[];
}

/**
 * Content metrics for adaptation assessment
 */
export interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  medicalTermCount: number;
  technicalTermCount: number;
  readabilityScore: number;
  sentimentScore: number;
  complexityScore: number;
}

/**
 * Adaptation pipeline configuration
 */
export interface AdaptationPipelineConfig {
  stages: AdaptationStage[];
  parallelProcessing: boolean;
  qualityThreshold: number;
  fallbackStrategy: 'original' | 'simplified' | 'generic';
  caching: boolean;
  monitoring: boolean;
}

/**
 * Individual adaptation stage
 */
export interface AdaptationStage {
  name: string;
  processor: string;
  config: Record<string, any>;
  required: boolean;
  timeout: number;
  retries: number;
}

/**
 * Adaptation performance metrics
 */
export interface AdaptationMetrics {
  processingTime: number;
  qualityScore: number;
  engagementImprovement: number;
  readabilityImprovement: number;
  userSatisfaction?: number;
  conversionRate?: number;
  cacheHitRate?: number;
}

/**
 * Batch adaptation request
 */
export interface BatchAdaptationRequest {
  contents: Array<{
    id: string;
    content: string;
    audienceType: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }>;
  personalization?: PersonalizationSettings;
  options?: {
    parallelProcessing?: boolean;
    qualityThreshold?: number;
    timeout?: number;
  };
}

/**
 * Adaptation cache entry
 */
export interface AdaptationCacheEntry {
  key: string;
  originalContent: string;
  adaptedContent: string;
  audienceType: string;
  personalizationHash?: string;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  qualityScore: number;
}

/**
 * A/B testing configuration
 */
export interface ABTestConfig {
  testName: string;
  variants: ContentVariant[];
  trafficSplit: number[];
  successMetrics: string[];
  duration: number;
  significance: number;
  audienceSegments?: string[];
}

/**
 * Adaptation quality assessment
 */
export interface QualityAssessment {
  overallScore: number;
  dimensions: {
    readability: number;
    appropriateness: number;
    engagement: number;
    accuracy: number;
    culturalSensitivity: number;
  };
  issues: QualityIssue[];
  recommendations: string[];
}

/**
 * Quality issue identification
 */
export interface QualityIssue {
  type: 'readability' | 'terminology' | 'tone' | 'length' | 'cultural' | 'accuracy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
}

/**
 * Audience insights and analytics
 */
export interface AudienceInsights {
  audienceType: string;
  contentPreferences: {
    length: number;
    complexity: number;
    visualElements: number;
    interactivity: number;
  };
  engagementPatterns: {
    peakEngagementTime: number;
    dropOffPoints: number[];
    conversionTriggers: string[];
  };
  feedbackScores: {
    clarity: number;
    relevance: number;
    usefulness: number;
    satisfaction: number;
  };
  improvementAreas: string[];
}