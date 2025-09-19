/**
 * Pattern Learning System for Healthcare Error Recovery
 * 
 * Implements machine learning algorithms to learn from error patterns
 * and continuously improve recovery strategies with healthcare compliance
 */

import { z } from 'zod';
import { Logger } from '@/lib/monitoring/logger';
import { MetricsCollector } from '@/lib/monitoring/metrics';

// ===============================
// Type Definitions & Schemas
// ===============================

const ErrorPatternSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  errorType: z.string(),
  errorCode: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  context: z.record(z.any()),
  stackTrace: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  patientId: z.string().optional(), // Healthcare-specific
  workflowStage: z.string().optional(),
  complianceRisk: z.boolean().default(false),
  phiInvolved: z.boolean().default(false)
});

const RecoveryStrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['immediate', 'delayed', 'escalation', 'fallback', 'manual']),
  actions: z.array(z.string()),
  priority: z.number().min(0).max(10),
  healthcareCompliant: z.boolean(),
  phiSafe: z.boolean(),
  estimatedCost: z.number(),
  estimatedTime: z.number(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  conditions: z.record(z.any()).optional()
});

const PatternClusterSchema = z.object({
  id: z.string(),
  centroid: z.array(z.number()),
  patterns: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  frequency: z.number(),
  lastSeen: z.number(),
  characteristics: z.record(z.any()),
  healthcareCategory: z.enum([
    'clinical_workflow',
    'phi_security',
    'compliance',
    'patient_safety',
    'resource_exhaustion',
    'system_performance',
    'data_integrity'
  ])
});

const StrategyPerformanceSchema = z.object({
  strategyId: z.string(),
  patternId: z.string(),
  successRate: z.number().min(0).max(1),
  averageRecoveryTime: z.number(),
  costEffectiveness: z.number(),
  patientImpact: z.enum(['none', 'minimal', 'moderate', 'significant']),
  complianceScore: z.number().min(0).max(100),
  usageCount: z.number(),
  lastUsed: z.number(),
  feedback: z.array(z.object({
    timestamp: z.number(),
    outcome: z.enum(['success', 'partial', 'failure']),
    metrics: z.record(z.number())
  }))
});

const LearningConfigSchema = z.object({
  patternRecognition: z.object({
    minSimilarity: z.number().min(0).max(1).default(0.75),
    clusteringThreshold: z.number().min(0).max(1).default(0.8),
    maxClusters: z.number().default(50),
    timeWindow: z.number().default(7 * 24 * 60 * 60 * 1000), // 7 days
    minPatternOccurrences: z.number().default(3)
  }),
  strategyOptimization: z.object({
    learningRate: z.number().min(0).max(1).default(0.1),
    explorationRate: z.number().min(0).max(1).default(0.2),
    confidenceThreshold: z.number().min(0).max(1).default(0.7),
    performanceWeight: z.number().default(0.4),
    costWeight: z.number().default(0.3),
    riskWeight: z.number().default(0.3)
  }),
  healthcare: z.object({
    phiProtection: z.boolean().default(true),
    complianceRequired: z.boolean().default(true),
    patientSafetyFirst: z.boolean().default(true),
    auditTrail: z.boolean().default(true)
  })
});

export type ErrorPattern = z.infer<typeof ErrorPatternSchema>;
export type RecoveryStrategy = z.infer<typeof RecoveryStrategySchema>;
export type PatternCluster = z.infer<typeof PatternClusterSchema>;
export type StrategyPerformance = z.infer<typeof StrategyPerformanceSchema>;
export type LearningConfig = z.infer<typeof LearningConfigSchema>;

// ===============================
// Healthcare-Specific Patterns
// ===============================

export class HealthcarePatternClassifier {
  private static readonly CLINICAL_WORKFLOW_PATTERNS = [
    'patient_registration_failure',
    'appointment_scheduling_conflict',
    'clinical_data_validation_error',
    'lab_result_processing_delay',
    'medication_order_error',
    'clinical_decision_support_failure',
    'care_plan_generation_error'
  ];

  private static readonly PHI_SECURITY_PATTERNS = [
    'unauthorized_data_access',
    'encryption_key_rotation_failure',
    'audit_log_corruption',
    'session_hijacking_attempt',
    'data_breach_detection',
    'access_control_violation',
    'phi_transmission_error'
  ];

  private static readonly COMPLIANCE_PATTERNS = [
    'hipaa_violation_detected',
    'audit_trail_gap',
    'consent_management_failure',
    'data_retention_policy_violation',
    'access_log_missing',
    'patient_rights_violation',
    'regulatory_reporting_failure'
  ];

  static classifyHealthcarePattern(pattern: ErrorPattern): PatternCluster['healthcareCategory'] {
    const errorType = pattern.errorType.toLowerCase();
    const context = JSON.stringify(pattern.context).toLowerCase();

    if (this.CLINICAL_WORKFLOW_PATTERNS.some(p => errorType.includes(p) || context.includes(p))) {
      return 'clinical_workflow';
    }

    if (this.PHI_SECURITY_PATTERNS.some(p => errorType.includes(p) || context.includes(p))) {
      return 'phi_security';
    }

    if (this.COMPLIANCE_PATTERNS.some(p => errorType.includes(p) || context.includes(p))) {
      return 'compliance';
    }

    if (pattern.patientId || pattern.phiInvolved) {
      return 'patient_safety';
    }

    if (context.includes('resource') || context.includes('memory') || context.includes('cpu')) {
      return 'resource_exhaustion';
    }

    if (context.includes('performance') || context.includes('latency') || context.includes('timeout')) {
      return 'system_performance';
    }

    return 'data_integrity';
  }
}

// ===============================
// Pattern Analysis Algorithms
// ===============================

export class PatternAnalyzer {
  private static calculateSimilarity(pattern1: ErrorPattern, pattern2: ErrorPattern): number {
    let similarity = 0;
    let factors = 0;

    // Error type similarity
    if (pattern1.errorType === pattern2.errorType) {
      similarity += 0.3;
    }
    factors += 0.3;

    // Severity similarity
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const severityDiff = Math.abs(
      severityWeights[pattern1.severity] - severityWeights[pattern2.severity]
    );
    similarity += (1 - severityDiff / 3) * 0.2;
    factors += 0.2;

    // Context similarity
    const context1Keys = Object.keys(pattern1.context);
    const context2Keys = Object.keys(pattern2.context);
    const commonKeys = context1Keys.filter(k => context2Keys.includes(k));
    const contextSimilarity = commonKeys.length / Math.max(context1Keys.length, context2Keys.length, 1);
    similarity += contextSimilarity * 0.3;
    factors += 0.3;

    // Healthcare-specific similarity
    if (pattern1.phiInvolved === pattern2.phiInvolved) {
      similarity += 0.1;
    }
    factors += 0.1;

    if (pattern1.workflowStage === pattern2.workflowStage) {
      similarity += 0.1;
    }
    factors += 0.1;

    return similarity / factors;
  }

  static analyzeTemporalPatterns(patterns: ErrorPattern[]): {
    trends: Array<{ period: string; frequency: number; patterns: string[] }>;
    cyclical: Array<{ cycle: string; peaks: number[]; confidence: number }>;
    anomalies: Array<{ timestamp: number; anomalyScore: number; pattern: ErrorPattern }>;
  } {
    const sortedPatterns = patterns.sort((a, b) => a.timestamp - b.timestamp);
    
    // Analyze trends
    const hourlyTrends = new Map<number, ErrorPattern[]>();
    const dailyTrends = new Map<number, ErrorPattern[]>();
    const weeklyTrends = new Map<number, ErrorPattern[]>();

    sortedPatterns.forEach(pattern => {
      const date = new Date(pattern.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));

      if (!hourlyTrends.has(hour)) hourlyTrends.set(hour, []);
      if (!dailyTrends.has(day)) dailyTrends.set(day, []);
      if (!weeklyTrends.has(week)) weeklyTrends.set(week, []);

      hourlyTrends.get(hour)!.push(pattern);
      dailyTrends.get(day)!.push(pattern);
      weeklyTrends.get(week)!.push(pattern);
    });

    const trends = [
      ...Array.from(hourlyTrends.entries()).map(([period, patterns]) => ({
        period: `hour-${period}`,
        frequency: patterns.length,
        patterns: [...new Set(patterns.map(p => p.errorType))]
      })),
      ...Array.from(dailyTrends.entries()).map(([period, patterns]) => ({
        period: `day-${period}`,
        frequency: patterns.length,
        patterns: [...new Set(patterns.map(p => p.errorType))]
      }))
    ];

    // Detect cyclical patterns
    const cyclical = this.detectCyclicalPatterns(sortedPatterns);

    // Identify anomalies
    const anomalies = this.detectAnomalies(sortedPatterns);

    return { trends, cyclical, anomalies };
  }

  private static detectCyclicalPatterns(patterns: ErrorPattern[]): Array<{
    cycle: string;
    peaks: number[];
    confidence: number;
  }> {
    // Simple implementation - detect daily and weekly cycles
    const cycles = [];
    
    // Daily cycle detection
    const hourlyDistribution = new Array(24).fill(0);
    patterns.forEach(pattern => {
      const hour = new Date(pattern.timestamp).getHours();
      hourlyDistribution[hour]++;
    });

    const dailyPeaks = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ hour }) => hour);

    if (dailyPeaks.length > 0) {
      cycles.push({
        cycle: 'daily',
        peaks: dailyPeaks,
        confidence: Math.min(dailyPeaks.length / 3, 1)
      });
    }

    return cycles;
  }

  private static detectAnomalies(patterns: ErrorPattern[]): Array<{
    timestamp: number;
    anomalyScore: number;
    pattern: ErrorPattern;
  }> {
    if (patterns.length < 10) return [];

    const anomalies = [];
    const timeWindow = 60 * 60 * 1000; // 1 hour
    
    for (let i = 0; i < patterns.length; i++) {
      const currentPattern = patterns[i];
      const windowStart = currentPattern.timestamp - timeWindow;
      const windowEnd = currentPattern.timestamp + timeWindow;
      
      const windowPatterns = patterns.filter(p => 
        p.timestamp >= windowStart && 
        p.timestamp <= windowEnd &&
        p.id !== currentPattern.id
      );

      // Calculate anomaly score based on similarity to surrounding patterns
      let similaritySum = 0;
      windowPatterns.forEach(p => {
        similaritySum += this.calculateSimilarity(currentPattern, p);
      });

      const avgSimilarity = windowPatterns.length > 0 ? similaritySum / windowPatterns.length : 0;
      const anomalyScore = 1 - avgSimilarity;

      if (anomalyScore > 0.7) { // High anomaly threshold
        anomalies.push({
          timestamp: currentPattern.timestamp,
          anomalyScore,
          pattern: currentPattern
        });
      }
    }

    return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
  }

  static correlateErrorPatterns(patterns: ErrorPattern[]): Array<{
    pattern1: string;
    pattern2: string;
    correlation: number;
    causality: 'none' | 'weak' | 'moderate' | 'strong';
    timelag: number;
  }> {
    const correlations = [];
    const errorTypes = [...new Set(patterns.map(p => p.errorType))];

    for (let i = 0; i < errorTypes.length; i++) {
      for (let j = i + 1; j < errorTypes.length; j++) {
        const type1 = errorTypes[i];
        const type2 = errorTypes[j];
        
        const patterns1 = patterns.filter(p => p.errorType === type1);
        const patterns2 = patterns.filter(p => p.errorType === type2);

        const correlation = this.calculateCorrelation(patterns1, patterns2);
        const causality = this.determineCausality(correlation);
        const timelag = this.calculateTimelag(patterns1, patterns2);

        correlations.push({
          pattern1: type1,
          pattern2: type2,
          correlation,
          causality,
          timelag
        });
      }
    }

    return correlations.filter(c => c.correlation > 0.3);
  }

  private static calculateCorrelation(patterns1: ErrorPattern[], patterns2: ErrorPattern[]): number {
    if (patterns1.length === 0 || patterns2.length === 0) return 0;

    const timeWindow = 5 * 60 * 1000; // 5 minutes
    let correlatedPairs = 0;
    let totalPairs = 0;

    patterns1.forEach(p1 => {
      patterns2.forEach(p2 => {
        totalPairs++;
        if (Math.abs(p1.timestamp - p2.timestamp) <= timeWindow) {
          correlatedPairs++;
        }
      });
    });

    return totalPairs > 0 ? correlatedPairs / totalPairs : 0;
  }

  private static determineCausality(correlation: number): 'none' | 'weak' | 'moderate' | 'strong' {
    if (correlation < 0.3) return 'none';
    if (correlation < 0.5) return 'weak';
    if (correlation < 0.7) return 'moderate';
    return 'strong';
  }

  private static calculateTimelag(patterns1: ErrorPattern[], patterns2: ErrorPattern[]): number {
    const timeDiffs = [];
    const maxTimeWindow = 10 * 60 * 1000; // 10 minutes

    patterns1.forEach(p1 => {
      patterns2.forEach(p2 => {
        const timeDiff = p2.timestamp - p1.timestamp;
        if (Math.abs(timeDiff) <= maxTimeWindow) {
          timeDiffs.push(timeDiff);
        }
      });
    });

    if (timeDiffs.length === 0) return 0;

    // Return median time difference
    timeDiffs.sort((a, b) => a - b);
    const mid = Math.floor(timeDiffs.length / 2);
    return timeDiffs.length % 2 === 0
      ? (timeDiffs[mid - 1] + timeDiffs[mid]) / 2
      : timeDiffs[mid];
  }
}

// ===============================
// Main Pattern Learning System
// ===============================

export class PatternLearningSystem {
  private patterns: Map<string, ErrorPattern> = new Map();
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private clusters: Map<string, PatternCluster> = new Map();
  private performance: Map<string, StrategyPerformance> = new Map();
  private config: LearningConfig;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = LearningConfigSchema.parse(config);
    this.logger = new Logger('PatternLearningSystem');
    this.metrics = new MetricsCollector();
    
    this.initializeHealthcareStrategies();
  }

  private initializeHealthcareStrategies(): void {
    const defaultStrategies: RecoveryStrategy[] = [
      {
        id: 'phi-immediate-isolation',
        name: 'PHI Immediate Isolation',
        type: 'immediate',
        actions: ['isolate_session', 'audit_log', 'notify_security'],
        priority: 10,
        healthcareCompliant: true,
        phiSafe: true,
        estimatedCost: 50,
        estimatedTime: 1000,
        riskLevel: 'low'
      },
      {
        id: 'clinical-workflow-fallback',
        name: 'Clinical Workflow Fallback',
        type: 'fallback',
        actions: ['switch_to_backup', 'preserve_patient_data', 'notify_clinicians'],
        priority: 9,
        healthcareCompliant: true,
        phiSafe: true,
        estimatedCost: 100,
        estimatedTime: 5000,
        riskLevel: 'medium'
      },
      {
        id: 'compliance-escalation',
        name: 'Compliance Escalation',
        type: 'escalation',
        actions: ['create_incident', 'notify_compliance_officer', 'generate_report'],
        priority: 8,
        healthcareCompliant: true,
        phiSafe: true,
        estimatedCost: 200,
        estimatedTime: 10000,
        riskLevel: 'high'
      }
    ];

    defaultStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
      this.performance.set(`${strategy.id}-default`, {
        strategyId: strategy.id,
        patternId: 'default',
        successRate: 0.8,
        averageRecoveryTime: strategy.estimatedTime,
        costEffectiveness: 0.7,
        patientImpact: 'minimal',
        complianceScore: 95,
        usageCount: 0,
        lastUsed: 0,
        feedback: []
      });
    });
  }

  async recordErrorPattern(pattern: Partial<ErrorPattern>): Promise<string> {
    try {
      const validatedPattern = ErrorPatternSchema.parse({
        ...pattern,
        id: pattern.id || `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: pattern.timestamp || Date.now()
      });

      this.patterns.set(validatedPattern.id, validatedPattern);
      
      // Classify healthcare category
      const healthcareCategory = HealthcarePatternClassifier.classifyHealthcarePattern(validatedPattern);
      
      // Update or create pattern cluster
      await this.updatePatternClusters(validatedPattern, healthcareCategory);
      
      // Log for audit trail
      this.logger.info('Error pattern recorded', {
        patternId: validatedPattern.id,
        errorType: validatedPattern.errorType,
        severity: validatedPattern.severity,
        healthcareCategory,
        phiInvolved: validatedPattern.phiInvolved,
        complianceRisk: validatedPattern.complianceRisk
      });

      // Update metrics
      this.metrics.increment('pattern_learning.patterns_recorded');
      this.metrics.gauge('pattern_learning.total_patterns', this.patterns.size);

      return validatedPattern.id;
    } catch (error) {
      this.logger.error('Failed to record error pattern', { error, pattern });
      throw new Error('Failed to record error pattern');
    }
  }

  private async updatePatternClusters(
    pattern: ErrorPattern, 
    healthcareCategory: PatternCluster['healthcareCategory']
  ): Promise<void> {
    const patternVector = this.extractFeatureVector(pattern);
    let bestCluster: PatternCluster | null = null;
    let bestSimilarity = 0;

    // Find best matching cluster
    for (const cluster of this.clusters.values()) {
      if (cluster.healthcareCategory !== healthcareCategory) continue;
      
      const similarity = this.calculateClusterSimilarity(patternVector, cluster.centroid);
      if (similarity > bestSimilarity && similarity > this.config.patternRecognition.clusteringThreshold) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Add pattern to existing cluster
      bestCluster.patterns.push(pattern.id);
      bestCluster.frequency++;
      bestCluster.lastSeen = pattern.timestamp;
      
      // Update centroid
      bestCluster.centroid = this.updateCentroid(bestCluster, patternVector);
      bestCluster.confidence = Math.min(bestCluster.confidence + 0.1, 1.0);
    } else {
      // Create new cluster
      const newCluster: PatternCluster = {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        centroid: patternVector,
        patterns: [pattern.id],
        confidence: 0.5,
        frequency: 1,
        lastSeen: pattern.timestamp,
        characteristics: this.extractPatternCharacteristics(pattern),
        healthcareCategory
      };
      
      this.clusters.set(newCluster.id, newCluster);
    }
  }

  private extractFeatureVector(pattern: ErrorPattern): number[] {
    const vector = [];
    
    // Error type hash
    vector.push(this.hashString(pattern.errorType) % 100);
    
    // Severity numeric value
    const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    vector.push(severityMap[pattern.severity]);
    
    // Context features
    vector.push(Object.keys(pattern.context).length);
    vector.push(pattern.phiInvolved ? 1 : 0);
    vector.push(pattern.complianceRisk ? 1 : 0);
    
    // Time features
    const date = new Date(pattern.timestamp);
    vector.push(date.getHours());
    vector.push(date.getDay());
    
    return vector;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateClusterSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private updateCentroid(cluster: PatternCluster, newVector: number[]): number[] {
    const alpha = this.config.strategyOptimization.learningRate;
    return cluster.centroid.map((val, i) => val * (1 - alpha) + newVector[i] * alpha);
  }

  private extractPatternCharacteristics(pattern: ErrorPattern): Record<string, any> {
    return {
      errorType: pattern.errorType,
      severity: pattern.severity,
      hasStackTrace: !!pattern.stackTrace,
      hasSessionId: !!pattern.sessionId,
      hasPatientId: !!pattern.patientId,
      phiInvolved: pattern.phiInvolved,
      complianceRisk: pattern.complianceRisk,
      contextKeys: Object.keys(pattern.context),
      workflowStage: pattern.workflowStage
    };
  }

  async recommendRecoveryStrategy(patternId: string): Promise<{
    strategy: RecoveryStrategy;
    confidence: number;
    reasoning: string;
    alternatives: Array<{ strategy: RecoveryStrategy; confidence: number }>;
  }> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern ${patternId} not found`);
    }

    // Find matching cluster
    const matchingCluster = this.findMatchingCluster(pattern);
    
    // Get all applicable strategies
    const applicableStrategies = this.getApplicableStrategies(pattern, matchingCluster);
    
    // Rank strategies using reinforcement learning
    const rankedStrategies = await this.rankStrategies(applicableStrategies, pattern, matchingCluster);
    
    if (rankedStrategies.length === 0) {
      throw new Error('No applicable recovery strategies found');
    }

    const bestStrategy = rankedStrategies[0];
    const alternatives = rankedStrategies.slice(1, 4); // Top 3 alternatives

    const reasoning = this.generateReasoning(bestStrategy.strategy, pattern, matchingCluster);

    this.logger.info('Recovery strategy recommended', {
      patternId,
      strategyId: bestStrategy.strategy.id,
      confidence: bestStrategy.confidence,
      alternatives: alternatives.length
    });

    return {
      strategy: bestStrategy.strategy,
      confidence: bestStrategy.confidence,
      reasoning,
      alternatives
    };
  }

  private findMatchingCluster(pattern: ErrorPattern): PatternCluster | null {
    const patternVector = this.extractFeatureVector(pattern);
    let bestCluster: PatternCluster | null = null;
    let bestSimilarity = 0;

    for (const cluster of this.clusters.values()) {
      const similarity = this.calculateClusterSimilarity(patternVector, cluster.centroid);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    return bestSimilarity > this.config.patternRecognition.minSimilarity ? bestCluster : null;
  }

  private getApplicableStrategies(pattern: ErrorPattern, cluster: PatternCluster | null): RecoveryStrategy[] {
    const strategies = Array.from(this.strategies.values());
    
    return strategies.filter(strategy => {
      // Healthcare compliance checks
      if (pattern.phiInvolved && !strategy.phiSafe) return false;
      if (pattern.complianceRisk && !strategy.healthcareCompliant) return false;
      
      // Pattern-specific conditions
      if (strategy.conditions) {
        const conditionsMet = Object.entries(strategy.conditions).every(([key, value]) => {
          return pattern.context[key] === value;
        });
        if (!conditionsMet) return false;
      }
      
      // Cluster compatibility
      if (cluster && strategy.type === 'immediate' && cluster.healthcareCategory === 'patient_safety') {
        return true; // Always allow immediate strategies for patient safety
      }
      
      return true;
    });
  }

  private async rankStrategies(
    strategies: RecoveryStrategy[],
    pattern: ErrorPattern,
    cluster: PatternCluster | null
  ): Promise<Array<{ strategy: RecoveryStrategy; confidence: number }>> {
    const rankings = [];

    for (const strategy of strategies) {
      const performanceKey = cluster 
        ? `${strategy.id}-${cluster.id}` 
        : `${strategy.id}-default`;
      
      const performance = this.performance.get(performanceKey) || 
        this.performance.get(`${strategy.id}-default`);

      if (!performance) continue;

      // Calculate confidence using multiple factors
      let confidence = 0;
      
      // Success rate (40% weight)
      confidence += performance.successRate * this.config.strategyOptimization.performanceWeight;
      
      // Cost effectiveness (30% weight)
      confidence += performance.costEffectiveness * this.config.strategyOptimization.costWeight;
      
      // Risk assessment (30% weight)
      const riskScore = this.calculateRiskScore(strategy, pattern);
      confidence += (1 - riskScore) * this.config.strategyOptimization.riskWeight;
      
      // Healthcare-specific adjustments
      if (pattern.phiInvolved && strategy.phiSafe) {
        confidence += 0.1; // Bonus for PHI-safe strategies
      }
      
      if (pattern.complianceRisk && strategy.healthcareCompliant) {
        confidence += 0.1; // Bonus for compliant strategies
      }
      
      // Patient safety priority
      if (pattern.severity === 'critical' && strategy.type === 'immediate') {
        confidence += 0.2; // High priority for immediate response to critical issues
      }

      rankings.push({ strategy, confidence: Math.min(confidence, 1.0) });
    }

    return rankings
      .filter(r => r.confidence >= this.config.strategyOptimization.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private calculateRiskScore(strategy: RecoveryStrategy, pattern: ErrorPattern): number {
    let risk = 0;
    
    // Base strategy risk
    const riskMap = { low: 0.1, medium: 0.4, high: 0.7 };
    risk += riskMap[strategy.riskLevel];
    
    // Pattern severity impact
    const severityImpact = { low: 0, medium: 0.1, high: 0.2, critical: 0.3 };
    risk += severityImpact[pattern.severity];
    
    // PHI involvement increases risk
    if (pattern.phiInvolved && !strategy.phiSafe) {
      risk += 0.5;
    }
    
    // Compliance risk
    if (pattern.complianceRisk && !strategy.healthcareCompliant) {
      risk += 0.3;
    }
    
    return Math.min(risk, 1.0);
  }

  private generateReasoning(
    strategy: RecoveryStrategy,
    pattern: ErrorPattern,
    cluster: PatternCluster | null
  ): string {
    const reasons = [];
    
    reasons.push(`Selected "${strategy.name}" strategy`);
    
    if (pattern.phiInvolved && strategy.phiSafe) {
      reasons.push('Strategy is PHI-safe for healthcare data protection');
    }
    
    if (pattern.complianceRisk && strategy.healthcareCompliant) {
      reasons.push('Strategy maintains healthcare compliance requirements');
    }
    
    if (cluster) {
      reasons.push(`Based on similar patterns in ${cluster.healthcareCategory} category`);
      reasons.push(`Cluster confidence: ${(cluster.confidence * 100).toFixed(1)}%`);
    }
    
    const performanceKey = cluster ? `${strategy.id}-${cluster.id}` : `${strategy.id}-default`;
    const performance = this.performance.get(performanceKey);
    if (performance) {
      reasons.push(`Historical success rate: ${(performance.successRate * 100).toFixed(1)}%`);
    }
    
    return reasons.join('. ');
  }

  async recordStrategyOutcome(
    strategyId: string,
    patternId: string,
    outcome: 'success' | 'partial' | 'failure',
    metrics: Record<string, number> = {}
  ): Promise<void> {
    const pattern = this.patterns.get(patternId);
    const strategy = this.strategies.get(strategyId);
    
    if (!pattern || !strategy) {
      throw new Error('Pattern or strategy not found');
    }

    const cluster = this.findMatchingCluster(pattern);
    const performanceKey = cluster ? `${strategyId}-${cluster.id}` : `${strategyId}-default`;
    
    let performance = this.performance.get(performanceKey);
    if (!performance) {
      performance = {
        strategyId,
        patternId: cluster?.id || 'default',
        successRate: 0.5,
        averageRecoveryTime: strategy.estimatedTime,
        costEffectiveness: 0.5,
        patientImpact: 'minimal',
        complianceScore: strategy.healthcareCompliant ? 95 : 50,
        usageCount: 0,
        lastUsed: 0,
        feedback: []
      };
    }

    // Update performance metrics using reinforcement learning
    const learningRate = this.config.strategyOptimization.learningRate;
    const reward = this.calculateReward(outcome, metrics);
    
    performance.successRate = performance.successRate * (1 - learningRate) + 
      (outcome === 'success' ? 1 : outcome === 'partial' ? 0.5 : 0) * learningRate;
    
    if (metrics.recoveryTime) {
      performance.averageRecoveryTime = performance.averageRecoveryTime * (1 - learningRate) + 
        metrics.recoveryTime * learningRate;
    }
    
    performance.costEffectiveness = performance.costEffectiveness * (1 - learningRate) + 
      reward * learningRate;
    
    performance.usageCount++;
    performance.lastUsed = Date.now();
    
    // Add feedback
    performance.feedback.push({
      timestamp: Date.now(),
      outcome,
      metrics
    });

    // Limit feedback history
    if (performance.feedback.length > 100) {
      performance.feedback = performance.feedback.slice(-100);
    }

    this.performance.set(performanceKey, performance);

    // Update cluster confidence based on strategy effectiveness
    if (cluster) {
      const confidenceAdjustment = reward * 0.1;
      cluster.confidence = Math.max(0.1, Math.min(1.0, 
        cluster.confidence + confidenceAdjustment
      ));
    }

    this.logger.info('Strategy outcome recorded', {
      strategyId,
      patternId,
      outcome,
      reward,
      newSuccessRate: performance.successRate,
      clusterConfidence: cluster?.confidence
    });

    // Update metrics
    this.metrics.increment(`pattern_learning.strategy_outcomes.${outcome}`);
    this.metrics.gauge('pattern_learning.average_success_rate', 
      Array.from(this.performance.values()).reduce((sum, p) => sum + p.successRate, 0) / 
      this.performance.size
    );
  }

  private calculateReward(outcome: 'success' | 'partial' | 'failure', metrics: Record<string, number>): number {
    let reward = 0;
    
    // Base reward from outcome
    switch (outcome) {
      case 'success': reward = 1.0; break;
      case 'partial': reward = 0.5; break;
      case 'failure': reward = 0.0; break;
    }
    
    // Adjust based on recovery time
    if (metrics.recoveryTime) {
      const timeNormalized = Math.max(0, 1 - (metrics.recoveryTime / 60000)); // Normalize to 1 minute
      reward += timeNormalized * 0.2;
    }
    
    // Adjust based on cost
    if (metrics.cost) {
      const costNormalized = Math.max(0, 1 - (metrics.cost / 1000)); // Normalize to $1000
      reward += costNormalized * 0.2;
    }
    
    // Penalty for patient impact
    if (metrics.patientImpact && metrics.patientImpact > 0) {
      reward -= metrics.patientImpact * 0.3;
    }
    
    return Math.max(0, Math.min(1, reward));
  }

  async analyzePatterns(): Promise<{
    totalPatterns: number;
    clusters: number;
    strategies: number;
    topErrorTypes: Array<{ type: string; count: number; trend: 'increasing' | 'decreasing' | 'stable' }>;
    healthcareInsights: {
      phiIncidents: number;
      complianceRisks: number;
      patientSafetyIssues: number;
      clinicalWorkflowFailures: number;
    };
    temporalAnalysis: ReturnType<typeof PatternAnalyzer.analyzeTemporalPatterns>;
    correlations: ReturnType<typeof PatternAnalyzer.correlateErrorPatterns>;
    recommendations: string[];
  }> {
    const patterns = Array.from(this.patterns.values());
    const temporalAnalysis = PatternAnalyzer.analyzeTemporalPatterns(patterns);
    const correlations = PatternAnalyzer.correlateErrorPatterns(patterns);
    
    // Calculate top error types with trends
    const errorTypeCounts = new Map<string, number>();
    patterns.forEach(p => {
      errorTypeCounts.set(p.errorType, (errorTypeCounts.get(p.errorType) || 0) + 1);
    });
    
    const topErrorTypes = Array.from(errorTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({
        type,
        count,
        trend: this.calculateTrend(type, patterns) as 'increasing' | 'decreasing' | 'stable'
      }));

    // Healthcare-specific insights
    const healthcareInsights = {
      phiIncidents: patterns.filter(p => p.phiInvolved).length,
      complianceRisks: patterns.filter(p => p.complianceRisk).length,
      patientSafetyIssues: patterns.filter(p => 
        p.severity === 'critical' && (p.patientId || p.phiInvolved)
      ).length,
      clinicalWorkflowFailures: patterns.filter(p => 
        p.workflowStage && p.errorType.includes('workflow')
      ).length
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      patterns,
      correlations,
      temporalAnalysis,
      healthcareInsights
    );

    return {
      totalPatterns: patterns.length,
      clusters: this.clusters.size,
      strategies: this.strategies.size,
      topErrorTypes,
      healthcareInsights,
      temporalAnalysis,
      correlations,
      recommendations
    };
  }

  private calculateTrend(errorType: string, patterns: ErrorPattern[]): string {
    const typePatterns = patterns
      .filter(p => p.errorType === errorType)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (typePatterns.length < 4) return 'stable';

    const midpoint = Math.floor(typePatterns.length / 2);
    const firstHalf = typePatterns.slice(0, midpoint);
    const secondHalf = typePatterns.slice(midpoint);

    const firstHalfRate = firstHalf.length / (
      (firstHalf[firstHalf.length - 1]?.timestamp || 0) - 
      (firstHalf[0]?.timestamp || 0) || 1
    );
    const secondHalfRate = secondHalf.length / (
      (secondHalf[secondHalf.length - 1]?.timestamp || 0) - 
      (secondHalf[0]?.timestamp || 0) || 1
    );

    if (secondHalfRate > firstHalfRate * 1.2) return 'increasing';
    if (secondHalfRate < firstHalfRate * 0.8) return 'decreasing';
    return 'stable';
  }

  private generateRecommendations(
    patterns: ErrorPattern[],
    correlations: ReturnType<typeof PatternAnalyzer.correlateErrorPatterns>,
    temporal: ReturnType<typeof PatternAnalyzer.analyzeTemporalPatterns>,
    healthcare: any
  ): string[] {
    const recommendations = [];

    // Healthcare-specific recommendations
    if (healthcare.phiIncidents > 0) {
      recommendations.push(
        `${healthcare.phiIncidents} PHI incidents detected. Implement enhanced access controls and audit trails.`
      );
    }

    if (healthcare.complianceRisks > 5) {
      recommendations.push(
        `High compliance risk detected (${healthcare.complianceRisks} incidents). Review HIPAA procedures.`
      );
    }

    if (healthcare.patientSafetyIssues > 0) {
      recommendations.push(
        `${healthcare.patientSafetyIssues} patient safety issues identified. Implement immediate response protocols.`
      );
    }

    // Pattern-based recommendations
    const strongCorrelations = correlations.filter(c => c.causality === 'strong');
    if (strongCorrelations.length > 0) {
      recommendations.push(
        `Strong error correlations detected. Implement preventive measures for ${strongCorrelations.length} pattern pairs.`
      );
    }

    // Temporal recommendations
    if (temporal.anomalies.length > 0) {
      recommendations.push(
        `${temporal.anomalies.length} anomalous patterns detected. Investigate unusual error patterns.`
      );
    }

    // Strategy optimization recommendations
    const lowPerformingStrategies = Array.from(this.performance.values())
      .filter(p => p.successRate < 0.6);
    if (lowPerformingStrategies.length > 0) {
      recommendations.push(
        `${lowPerformingStrategies.length} strategies have low success rates. Review and optimize recovery procedures.`
      );
    }

    return recommendations.length > 0 ? recommendations : [
      'System is performing well. Continue monitoring for emerging patterns.'
    ];
  }

  // Export/Import for persistence
  exportLearningData(): {
    patterns: ErrorPattern[];
    strategies: RecoveryStrategy[];
    clusters: PatternCluster[];
    performance: StrategyPerformance[];
    config: LearningConfig;
    exportTimestamp: number;
  } {
    return {
      patterns: Array.from(this.patterns.values()),
      strategies: Array.from(this.strategies.values()),
      clusters: Array.from(this.clusters.values()),
      performance: Array.from(this.performance.values()),
      config: this.config,
      exportTimestamp: Date.now()
    };
  }

  importLearningData(data: {
    patterns?: ErrorPattern[];
    strategies?: RecoveryStrategy[];
    clusters?: PatternCluster[];
    performance?: StrategyPerformance[];
  }): void {
    if (data.patterns) {
      this.patterns.clear();
      data.patterns.forEach(p => this.patterns.set(p.id, p));
    }

    if (data.strategies) {
      data.strategies.forEach(s => this.strategies.set(s.id, s));
    }

    if (data.clusters) {
      this.clusters.clear();
      data.clusters.forEach(c => this.clusters.set(c.id, c));
    }

    if (data.performance) {
      this.performance.clear();
      data.performance.forEach(p => {
        const key = `${p.strategyId}-${p.patternId}`;
        this.performance.set(key, p);
      });
    }

    this.logger.info('Learning data imported', {
      patterns: this.patterns.size,
      strategies: this.strategies.size,
      clusters: this.clusters.size,
      performance: this.performance.size
    });
  }

  // Cleanup old data
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    let cleanedPatterns = 0;
    let cleanedClusters = 0;

    // Clean old patterns
    for (const [id, pattern] of this.patterns) {
      if (pattern.timestamp < cutoff) {
        this.patterns.delete(id);
        cleanedPatterns++;
      }
    }

    // Clean old clusters
    for (const [id, cluster] of this.clusters) {
      if (cluster.lastSeen < cutoff) {
        this.clusters.delete(id);
        cleanedClusters++;
      }
    }

    this.logger.info('Cleanup completed', {
      cleanedPatterns,
      cleanedClusters,
      remainingPatterns: this.patterns.size,
      remainingClusters: this.clusters.size
    });
  }
}