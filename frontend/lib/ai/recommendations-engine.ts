// AI-Powered Content Recommendations Engine
// Healthcare-specific content optimization and personalization

import { createClient } from '@supabase/supabase-js';
import {
  ContentRecommendation,
  RecommendationType,
  OptimizationSuggestion,
  ABTestVariant,
  PatientSegment,
  ComplianceCategory,
  PerformanceMetric
} from '@/types/ai/alerts';

// AI Model interfaces for content analysis
interface ContentAnalysis {
  content_id: string;
  content_type: string;
  title: string;
  current_performance: {
    engagement_rate: number;
    conversion_rate: number;
    bounce_rate: number;
    avg_time_on_page: number;
    patient_satisfaction: number;
  };
  content_quality: {
    readability_score: number;
    medical_accuracy: number;
    compliance_score: number;
    accessibility_score: number;
    seo_score: number;
  };
  audience_insights: {
    primary_segment: PatientSegment;
    secondary_segments: PatientSegment[];
    engagement_by_segment: Record<PatientSegment, number>;
  };
}

interface OptimizationOpportunity {
  type: RecommendationType;
  impact_score: number; // 0-100
  effort_score: number; // 0-100
  roi_estimate: number; // Return on investment
  priority: number; // Calculated from impact/effort
}

// Healthcare Content Optimizer
class HealthcareContentOptimizer {
  // Analyze content for healthcare-specific improvements
  static analyzeHealthcareContent(content: ContentAnalysis): {
    medical_improvements: OptimizationSuggestion[];
    compliance_gaps: ComplianceGap[];
    patient_journey_optimizations: PatientJourneyOptimization[];
  } {
    const medical_improvements: OptimizationSuggestion[] = [];
    const compliance_gaps: ComplianceGap[] = [];
    const patient_journey_optimizations: PatientJourneyOptimization[] = [];

    // Medical accuracy improvements
    if (content.content_quality.medical_accuracy < 0.9) {
      medical_improvements.push({
        type: 'medical_accuracy',
        description: 'Update medical information to align with latest clinical guidelines',
        specific_changes: [
          'Review and update treatment protocols',
          'Verify drug interactions and dosage information',
          'Add recent research citations',
          'Include FDA warnings or updates'
        ],
        priority: 'high',
        estimated_impact: 85,
        implementation_complexity: 'moderate'
      });
    }

    // HIPAA compliance checks
    if (content.content_quality.compliance_score < 0.95) {
      compliance_gaps.push({
        category: 'hipaa_privacy',
        gap_description: 'Content may contain identifiable patient information',
        severity: 'high',
        remediation_steps: [
          'Review content for PHI exposure',
          'Implement de-identification procedures',
          'Add privacy disclaimers where needed'
        ],
        estimated_resolution_time: '2-4 hours'
      });
    }

    // Patient journey optimization
    const journeyStages = this.identifyJourneyStage(content);
    for (const stage of journeyStages) {
      const optimization = this.optimizeForJourneyStage(stage, content);
      if (optimization) {
        patient_journey_optimizations.push(optimization);
      }
    }

    return {
      medical_improvements,
      compliance_gaps,
      patient_journey_optimizations
    };
  }

  // Identify patient journey stages
  private static identifyJourneyStage(content: ContentAnalysis): PatientJourneyStage[] {
    const stages: PatientJourneyStage[] = [];
    const keywords = this.extractKeywords(content.title);

    // Awareness stage indicators
    if (keywords.some(k => ['symptoms', 'what is', 'causes', 'signs'].includes(k.toLowerCase()))) {
      stages.push('awareness');
    }

    // Consideration stage indicators
    if (keywords.some(k => ['treatment', 'options', 'compare', 'versus'].includes(k.toLowerCase()))) {
      stages.push('consideration');
    }

    // Decision stage indicators
    if (keywords.some(k => ['appointment', 'consultation', 'provider', 'schedule'].includes(k.toLowerCase()))) {
      stages.push('decision');
    }

    // Treatment stage indicators
    if (keywords.some(k => ['recovery', 'medication', 'therapy', 'procedure'].includes(k.toLowerCase()))) {
      stages.push('treatment');
    }

    // Retention stage indicators
    if (keywords.some(k => ['follow-up', 'maintenance', 'prevention', 'lifestyle'].includes(k.toLowerCase()))) {
      stages.push('retention');
    }

    return stages.length > 0 ? stages : ['awareness']; // Default to awareness
  }

  // Optimize content for specific journey stage
  private static optimizeForJourneyStage(
    stage: PatientJourneyStage,
    content: ContentAnalysis
  ): PatientJourneyOptimization | null {
    const optimizations: Record<PatientJourneyStage, PatientJourneyOptimization> = {
      awareness: {
        stage: 'awareness',
        current_effectiveness: content.current_performance.engagement_rate,
        recommendations: [
          'Add symptom checker tool',
          'Include educational infographics',
          'Provide clear condition overview',
          'Link to related conditions'
        ],
        content_additions: [
          'FAQ section for common questions',
          'Video explanation of condition',
          'Patient testimonials'
        ],
        cta_suggestions: [
          'Learn more about treatment options',
          'Download our condition guide',
          'Subscribe to health updates'
        ]
      },
      consideration: {
        stage: 'consideration',
        current_effectiveness: content.current_performance.conversion_rate,
        recommendations: [
          'Add treatment comparison table',
          'Include cost information',
          'Provide success rate statistics',
          'List provider credentials'
        ],
        content_additions: [
          'Interactive treatment selector',
          'Insurance coverage information',
          'Clinical trial opportunities'
        ],
        cta_suggestions: [
          'Schedule a consultation',
          'Speak with a specialist',
          'Get a second opinion'
        ]
      },
      decision: {
        stage: 'decision',
        current_effectiveness: content.current_performance.conversion_rate,
        recommendations: [
          'Simplify appointment booking',
          'Add provider availability',
          'Include preparation instructions',
          'Offer virtual consultation option'
        ],
        content_additions: [
          'Pre-appointment checklist',
          'What to expect guide',
          'Financial assistance information'
        ],
        cta_suggestions: [
          'Book your appointment now',
          'Call our patient coordinator',
          'Start your patient portal'
        ]
      },
      treatment: {
        stage: 'treatment',
        current_effectiveness: content.current_performance.patient_satisfaction,
        recommendations: [
          'Provide recovery timeline',
          'Add medication reminders',
          'Include side effect management',
          'Offer support resources'
        ],
        content_additions: [
          'Treatment progress tracker',
          'Symptom diary tool',
          'Care team contact information'
        ],
        cta_suggestions: [
          'Access your care plan',
          'Message your provider',
          'Join support group'
        ]
      },
      retention: {
        stage: 'retention',
        current_effectiveness: content.current_performance.engagement_rate,
        recommendations: [
          'Add preventive care reminders',
          'Include wellness tips',
          'Provide lifestyle resources',
          'Offer loyalty programs'
        ],
        content_additions: [
          'Health tracking tools',
          'Personalized health insights',
          'Community forum access'
        ],
        cta_suggestions: [
          'Schedule follow-up',
          'Update health profile',
          'Refer a friend'
        ]
      }
    };

    return optimizations[stage] || null;
  }

  // Extract keywords from content
  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use NLP library
    return text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  }
}

// SEO and Performance Optimizer
class SEOPerformanceOptimizer {
  // Generate SEO recommendations
  static generateSEORecommendations(content: ContentAnalysis): OptimizationSuggestion[] {
    const recommendations: OptimizationSuggestion[] = [];

    // Title optimization
    if (content.content_quality.seo_score < 0.8) {
      recommendations.push({
        type: 'seo_title',
        description: 'Optimize page title for search engines',
        specific_changes: [
          'Include primary keyword in first 60 characters',
          'Add location for local SEO',
          'Include condition or treatment name',
          'Keep under 65 characters total'
        ],
        priority: 'high',
        estimated_impact: 70,
        implementation_complexity: 'simple'
      });
    }

    // Meta description
    recommendations.push({
      type: 'meta_description',
      description: 'Enhance meta description for better CTR',
      specific_changes: [
        'Include call-to-action',
        'Mention key benefits',
        'Add urgency or uniqueness',
        'Keep between 150-160 characters'
      ],
      priority: 'medium',
      estimated_impact: 50,
      implementation_complexity: 'simple'
    });

    // Schema markup for healthcare
    recommendations.push({
      type: 'schema_markup',
      description: 'Add healthcare-specific schema markup',
      specific_changes: [
        'Implement MedicalCondition schema',
        'Add MedicalProcedure markup',
        'Include Physician schema for providers',
        'Add FAQ schema for common questions'
      ],
      priority: 'medium',
      estimated_impact: 60,
      implementation_complexity: 'moderate'
    });

    // Page speed optimization
    if (content.current_performance.bounce_rate > 0.4) {
      recommendations.push({
        type: 'performance',
        description: 'Improve page load speed',
        specific_changes: [
          'Optimize images with next-gen formats',
          'Implement lazy loading',
          'Minimize JavaScript execution',
          'Enable browser caching'
        ],
        priority: 'high',
        estimated_impact: 80,
        implementation_complexity: 'moderate'
      });
    }

    return recommendations;
  }

  // Generate performance optimizations
  static generatePerformanceOptimizations(metrics: PerformanceMetric[]): OptimizationSuggestion[] {
    const optimizations: OptimizationSuggestion[] = [];

    // Find performance bottlenecks
    const slowMetrics = metrics.filter(m => m.trend === 'declining');

    for (const metric of slowMetrics) {
      if (metric.metric_name === 'page_load_time') {
        optimizations.push({
          type: 'performance',
          description: 'Reduce page load time',
          specific_changes: [
            'Implement code splitting',
            'Use CDN for static assets',
            'Optimize database queries',
            'Enable compression'
          ],
          priority: 'high',
          estimated_impact: 75,
          implementation_complexity: 'complex'
        });
      }

      if (metric.metric_name === 'time_to_interactive') {
        optimizations.push({
          type: 'performance',
          description: 'Improve interactivity',
          specific_changes: [
            'Defer non-critical JavaScript',
            'Optimize React component rendering',
            'Implement virtual scrolling',
            'Use web workers for heavy computations'
          ],
          priority: 'medium',
          estimated_impact: 65,
          implementation_complexity: 'moderate'
        });
      }
    }

    return optimizations;
  }
}

// A/B Test Generator
class ABTestGenerator {
  // Generate A/B test recommendations
  static generateABTests(
    content: ContentAnalysis,
    recommendations: OptimizationSuggestion[]
  ): ABTestVariant[] {
    const variants: ABTestVariant[] = [];

    // Create control variant
    variants.push({
      name: 'Control',
      changes: [],
      hypothesis: 'Current version baseline',
      traffic_allocation: 50
    });

    // Generate test variants based on top recommendations
    const topRecommendations = recommendations
      .sort((a, b) => b.estimated_impact - a.estimated_impact)
      .slice(0, 3);

    for (const rec of topRecommendations) {
      variants.push({
        name: `Variant_${rec.type}`,
        changes: rec.specific_changes,
        hypothesis: `${rec.description} will improve engagement by ${rec.estimated_impact}%`,
        traffic_allocation: 50 / topRecommendations.length
      });
    }

    return variants;
  }

  // Generate multivariate test combinations
  static generateMultivariateTests(
    optimizations: OptimizationSuggestion[]
  ): MultivariateTest[] {
    const tests: MultivariateTest[] = [];

    // Select compatible optimizations for multivariate testing
    const compatibleOptimizations = optimizations.filter(o => 
      o.implementation_complexity === 'simple' || o.implementation_complexity === 'moderate'
    );

    // Generate test combinations (limited to prevent explosion)
    const maxCombinations = 8;
    const combinations = this.generateCombinations(compatibleOptimizations, maxCombinations);

    for (const combination of combinations) {
      tests.push({
        name: `MVT_${combination.map(o => o.type).join('_')}`,
        factors: combination.map(o => ({
          name: o.type,
          levels: o.specific_changes
        })),
        expected_improvement: combination.reduce((sum, o) => sum + o.estimated_impact, 0) / combination.length,
        sample_size_required: this.calculateSampleSize(combination)
      });
    }

    return tests;
  }

  // Helper to generate combinations
  private static generateCombinations<T>(items: T[], maxSize: number): T[][] {
    const result: T[][] = [];
    const combine = (start: number, combo: T[]) => {
      if (combo.length > 0 && result.length < maxSize) {
        result.push([...combo]);
      }
      for (let i = start; i < items.length && result.length < maxSize; i++) {
        combine(i + 1, [...combo, items[i]]);
      }
    };
    combine(0, []);
    return result;
  }

  // Calculate required sample size for test
  private static calculateSampleSize(optimizations: OptimizationSuggestion[]): number {
    const avgImpact = optimizations.reduce((sum, o) => sum + o.estimated_impact, 0) / optimizations.length;
    const baselineConversion = 0.03; // 3% baseline
    const minimumDetectableEffect = avgImpact / 100 * baselineConversion;
    
    // Simplified sample size calculation
    const alpha = 0.05; // Significance level
    const beta = 0.2; // Power (1 - beta = 0.8)
    const zAlpha = 1.96; // Z-score for 95% confidence
    const zBeta = 0.84; // Z-score for 80% power
    
    const n = Math.ceil(
      2 * Math.pow(zAlpha + zBeta, 2) * baselineConversion * (1 - baselineConversion) /
      Math.pow(minimumDetectableEffect, 2)
    );
    
    return n;
  }
}

// Main Recommendations Engine
export class RecommendationsEngine {
  private supabase;
  private contentCache: Map<string, ContentAnalysis> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Generate comprehensive recommendations
  async generateRecommendations(
    content_id: string,
    content_type: string,
    metrics?: PerformanceMetric[],
    options?: {
      focus_areas?: RecommendationType[];
      patient_segments?: PatientSegment[];
      compliance_requirements?: ComplianceCategory[];
      include_ab_tests?: boolean;
    }
  ): Promise<ContentRecommendation[]> {
    // Fetch content analysis
    const contentAnalysis = await this.analyzeContent(content_id, content_type);
    
    // Generate recommendations by category
    const recommendations: ContentRecommendation[] = [];

    // Healthcare-specific recommendations
    const healthcareAnalysis = HealthcareContentOptimizer.analyzeHealthcareContent(contentAnalysis);
    
    // SEO and performance recommendations
    const seoRecommendations = SEOPerformanceOptimizer.generateSEORecommendations(contentAnalysis);
    const performanceOptimizations = metrics 
      ? SEOPerformanceOptimizer.generatePerformanceOptimizations(metrics)
      : [];

    // Combine all optimizations
    const allOptimizations = [
      ...healthcareAnalysis.medical_improvements,
      ...seoRecommendations,
      ...performanceOptimizations
    ];

    // Convert patient journey optimizations to recommendations
    for (const journeyOpt of healthcareAnalysis.patient_journey_optimizations) {
      const recommendation = this.createRecommendation(
        contentAnalysis,
        'patient_journey_optimization',
        journeyOpt.recommendations.map(r => ({
          type: 'patient_journey',
          description: r,
          specific_changes: journeyOpt.content_additions,
          priority: 'high',
          estimated_impact: 70,
          implementation_complexity: 'moderate'
        })),
        journeyOpt.stage as PatientSegment
      );

      recommendations.push(recommendation);
    }

    // Convert optimization suggestions to recommendations
    for (const optimization of allOptimizations) {
      const recType = this.mapOptimizationToRecommendationType(optimization.type);
      const recommendation = this.createRecommendation(
        contentAnalysis,
        recType,
        [optimization]
      );

      // Add A/B test suggestions if requested
      if (options?.include_ab_tests) {
        recommendation.ab_test_recommended = true;
        recommendation.ab_test_variants = ABTestGenerator.generateABTests(
          contentAnalysis,
          [optimization]
        );
      }

      recommendations.push(recommendation);
    }

    // Handle compliance gaps
    for (const gap of healthcareAnalysis.compliance_gaps) {
      const complianceRec = this.createComplianceRecommendation(
        contentAnalysis,
        gap
      );
      recommendations.push(complianceRec);
    }

    // Sort by priority and impact
    const sortedRecommendations = this.prioritizeRecommendations(recommendations);

    // Store recommendations in database
    await this.storeRecommendations(sortedRecommendations);

    return sortedRecommendations;
  }

  // Analyze content
  private async analyzeContent(content_id: string, content_type: string): Promise<ContentAnalysis> {
    // Check cache
    const cacheKey = `${content_id}_${content_type}`;
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    // Fetch content data from database
    const { data: contentData, error: contentError } = await this.supabase
      .from('managed_content')
      .select('*')
      .eq('id', content_id)
      .single();

    if (contentError) throw contentError;

    // Fetch analytics data
    const { data: analyticsData, error: analyticsError } = await this.supabase
      .from('content_analytics')
      .select('*')
      .eq('content_id', content_id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (analyticsError) throw analyticsError;

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(analyticsData);
    
    // Analyze content quality (simplified - in production, use NLP/AI service)
    const quality = this.assessContentQuality(contentData);
    
    // Determine audience insights
    const audience = this.analyzeAudience(analyticsData);

    const analysis: ContentAnalysis = {
      content_id,
      content_type,
      title: contentData.title || contentData.slug,
      current_performance: performance,
      content_quality: quality,
      audience_insights: audience
    };

    // Cache the analysis
    this.contentCache.set(cacheKey, analysis);

    return analysis;
  }

  // Calculate performance metrics from analytics
  private calculatePerformanceMetrics(analyticsData: any[]): ContentAnalysis['current_performance'] {
    if (!analyticsData || analyticsData.length === 0) {
      return {
        engagement_rate: 0,
        conversion_rate: 0,
        bounce_rate: 1,
        avg_time_on_page: 0,
        patient_satisfaction: 0
      };
    }

    const totalViews = analyticsData.reduce((sum, d) => sum + (d.page_views || 0), 0);
    const totalEngagements = analyticsData.reduce((sum, d) => 
      sum + (d.click_through_rate || 0) * (d.page_views || 0) / 100, 0
    );
    const totalConversions = analyticsData.reduce((sum, d) => 
      sum + (d.form_submissions || 0) + (d.email_signups || 0), 0
    );
    const avgBounceRate = analyticsData.reduce((sum, d) => 
      sum + (d.bounce_rate || 0), 0
    ) / analyticsData.length;
    const avgTimeOnPage = analyticsData.reduce((sum, d) => 
      sum + (d.avg_time_on_page || 0), 0
    ) / analyticsData.length;

    return {
      engagement_rate: totalViews > 0 ? totalEngagements / totalViews : 0,
      conversion_rate: totalViews > 0 ? totalConversions / totalViews : 0,
      bounce_rate: avgBounceRate / 100,
      avg_time_on_page: avgTimeOnPage,
      patient_satisfaction: 0.75 // Placeholder - would come from surveys
    };
  }

  // Assess content quality
  private assessContentQuality(contentData: any): ContentAnalysis['content_quality'] {
    // Simplified quality assessment - in production, use AI/NLP services
    return {
      readability_score: 0.8, // Placeholder
      medical_accuracy: 0.95, // Would require medical validation
      compliance_score: 0.98, // Would require compliance check
      accessibility_score: 0.85, // Would require accessibility audit
      seo_score: 0.75 // Would require SEO analysis
    };
  }

  // Analyze audience segments
  private analyzeAudience(analyticsData: any[]): ContentAnalysis['audience_insights'] {
    // Simplified audience analysis
    return {
      primary_segment: 'returning_patients',
      secondary_segments: ['new_patients', 'at_risk_patients'],
      engagement_by_segment: {
        'new_patients': 0.6,
        'returning_patients': 0.8,
        'at_risk_patients': 0.7,
        'chronic_care_patients': 0.75,
        'preventive_care_patients': 0.65,
        'emergency_patients': 0.4
      }
    };
  }

  // Create recommendation object
  private createRecommendation(
    analysis: ContentAnalysis,
    type: RecommendationType,
    optimizations: OptimizationSuggestion[],
    patientSegment?: PatientSegment
  ): ContentRecommendation {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate expected impact
    const avgImpact = optimizations.reduce((sum, o) => sum + o.estimated_impact, 0) / optimizations.length;
    const currentValue = this.getCurrentMetricValue(type, analysis);
    const projectedValue = currentValue * (1 + avgImpact / 100);

    return {
      id,
      content_id: analysis.content_id,
      content_type: analysis.content_type,
      content_title: analysis.title,
      recommendation_type: type,
      priority: this.calculatePriority(optimizations),
      confidence_score: 0.85, // Simplified - would use ML model confidence
      optimizations,
      expected_impact: [{
        metric: this.getMetricName(type),
        current_value: currentValue,
        projected_value: projectedValue,
        improvement_percentage: avgImpact,
        confidence_interval: [avgImpact * 0.8, avgImpact * 1.2]
      }],
      patient_segment_focus: patientSegment,
      implementation_steps: this.generateImplementationSteps(optimizations),
      estimated_effort: this.estimateEffort(optimizations),
      ab_test_recommended: avgImpact > 20,
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      generated_by: 'ai_model'
    };
  }

  // Create compliance-specific recommendation
  private createComplianceRecommendation(
    analysis: ContentAnalysis,
    gap: ComplianceGap
  ): ContentRecommendation {
    const id = `rec_compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      content_id: analysis.content_id,
      content_type: analysis.content_type,
      content_title: analysis.title,
      recommendation_type: 'compliance_fix',
      priority: gap.severity === 'high' ? 'urgent' : 'high',
      confidence_score: 0.95,
      optimizations: [{
        type: 'compliance',
        description: gap.gap_description,
        specific_changes: gap.remediation_steps,
        priority: 'high',
        estimated_impact: 90,
        implementation_complexity: 'moderate'
      }],
      expected_impact: [{
        metric: 'compliance_score',
        current_value: analysis.content_quality.compliance_score,
        projected_value: 1.0,
        improvement_percentage: (1.0 - analysis.content_quality.compliance_score) * 100,
        confidence_interval: [0.95, 1.0]
      }],
      compliance_improvements: [gap.category],
      medical_accuracy_score: analysis.content_quality.medical_accuracy,
      implementation_steps: gap.remediation_steps,
      estimated_effort: 'moderate',
      ab_test_recommended: false,
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for compliance
      generated_by: 'rule_based'
    };
  }

  // Helper methods
  private mapOptimizationToRecommendationType(optType: string): RecommendationType {
    const typeMap: Record<string, RecommendationType> = {
      'seo_title': 'seo_improvement',
      'meta_description': 'seo_improvement',
      'schema_markup': 'seo_improvement',
      'performance': 'performance_optimization',
      'medical_accuracy': 'medical_content_update',
      'patient_journey': 'patient_journey_optimization',
      'accessibility': 'accessibility_improvement'
    };
    return typeMap[optType] || 'content_optimization';
  }

  private getCurrentMetricValue(type: RecommendationType, analysis: ContentAnalysis): number {
    const metricMap: Record<RecommendationType, number> = {
      'content_optimization': analysis.current_performance.engagement_rate,
      'seo_improvement': analysis.content_quality.seo_score,
      'ux_enhancement': 1 - analysis.current_performance.bounce_rate,
      'performance_optimization': 1 / (analysis.current_performance.avg_time_on_page || 1),
      'engagement_boost': analysis.current_performance.engagement_rate,
      'conversion_optimization': analysis.current_performance.conversion_rate,
      'compliance_fix': analysis.content_quality.compliance_score,
      'accessibility_improvement': analysis.content_quality.accessibility_score,
      'patient_journey_optimization': analysis.current_performance.patient_satisfaction,
      'medical_content_update': analysis.content_quality.medical_accuracy
    };
    return metricMap[type] || 0.5;
  }

  private getMetricName(type: RecommendationType): string {
    const nameMap: Record<RecommendationType, string> = {
      'content_optimization': 'engagement_rate',
      'seo_improvement': 'seo_score',
      'ux_enhancement': 'user_experience_score',
      'performance_optimization': 'page_speed_score',
      'engagement_boost': 'engagement_rate',
      'conversion_optimization': 'conversion_rate',
      'compliance_fix': 'compliance_score',
      'accessibility_improvement': 'accessibility_score',
      'patient_journey_optimization': 'patient_satisfaction',
      'medical_content_update': 'medical_accuracy'
    };
    return nameMap[type] || 'overall_score';
  }

  private calculatePriority(optimizations: OptimizationSuggestion[]): 'low' | 'medium' | 'high' | 'urgent' {
    const avgPriority = optimizations.reduce((sum, o) => {
      const priorityValue = { low: 1, medium: 2, high: 3 }[o.priority] || 2;
      return sum + priorityValue;
    }, 0) / optimizations.length;

    if (avgPriority >= 2.5) return 'urgent';
    if (avgPriority >= 2) return 'high';
    if (avgPriority >= 1.5) return 'medium';
    return 'low';
  }

  private generateImplementationSteps(optimizations: OptimizationSuggestion[]): string[] {
    const steps: string[] = [];
    
    for (const opt of optimizations) {
      steps.push(`Review current ${opt.type} implementation`);
      steps.push(...opt.specific_changes.map(change => `Implement: ${change}`));
      steps.push(`Test and validate ${opt.type} changes`);
    }
    
    steps.push('Monitor performance metrics post-implementation');
    steps.push('Document changes and results');
    
    return steps;
  }

  private estimateEffort(optimizations: OptimizationSuggestion[]): 'minimal' | 'moderate' | 'significant' {
    const complexityScores = optimizations.map(o => {
      const scoreMap = { simple: 1, moderate: 2, complex: 3 };
      return scoreMap[o.implementation_complexity] || 2;
    });
    
    const avgComplexity = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;
    
    if (avgComplexity >= 2.5) return 'significant';
    if (avgComplexity >= 1.5) return 'moderate';
    return 'minimal';
  }

  private prioritizeRecommendations(recommendations: ContentRecommendation[]): ContentRecommendation[] {
    return recommendations.sort((a, b) => {
      // Priority order
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by expected impact
      const aImpact = a.expected_impact[0]?.improvement_percentage || 0;
      const bImpact = b.expected_impact[0]?.improvement_percentage || 0;
      const impactDiff = bImpact - aImpact;
      if (impactDiff !== 0) return impactDiff;
      
      // Then by confidence score
      return b.confidence_score - a.confidence_score;
    });
  }

  // Store recommendations in database
  private async storeRecommendations(recommendations: ContentRecommendation[]): Promise<void> {
    // Store recommendations for tracking and analysis
    for (const rec of recommendations) {
      await this.supabase
        .from('content_recommendations')
        .upsert({
          id: rec.id,
          content_id: rec.content_id,
          recommendation_type: rec.recommendation_type,
          priority: rec.priority,
          confidence_score: rec.confidence_score,
          expected_impact: rec.expected_impact,
          optimizations: rec.optimizations,
          generated_at: rec.generated_at,
          expires_at: rec.expires_at,
          metadata: {
            patient_segment: rec.patient_segment_focus,
            compliance_improvements: rec.compliance_improvements,
            ab_test_recommended: rec.ab_test_recommended
          }
        });
    }
  }
}

// Type definitions
type PatientJourneyStage = 'awareness' | 'consideration' | 'decision' | 'treatment' | 'retention';

interface ComplianceGap {
  category: ComplianceCategory;
  gap_description: string;
  severity: 'low' | 'medium' | 'high';
  remediation_steps: string[];
  estimated_resolution_time: string;
}

interface PatientJourneyOptimization {
  stage: string;
  current_effectiveness: number;
  recommendations: string[];
  content_additions: string[];
  cta_suggestions: string[];
}

interface MultivariateTest {
  name: string;
  factors: {
    name: string;
    levels: string[];
  }[];
  expected_improvement: number;
  sample_size_required: number;
}

// Export singleton instance
export const recommendationsEngine = new RecommendationsEngine();