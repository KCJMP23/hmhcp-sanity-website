// AI-Powered Anomaly Detection Service
// Healthcare-specific pattern recognition and anomaly detection

import { createClient } from '@supabase/supabase-js';
import { 
  AlertType, 
  AlertSeverity,
  AnomalyDetectionConfig,
  PerformanceMetric,
  TimeSeriesPoint,
  PatientSegment,
  ComplianceCategory,
  HealthcareUrgency
} from '@/types/ai/alerts';

// Statistical helper functions
class StatisticalAnalyzer {
  // Calculate z-score for anomaly detection
  static calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return Math.abs(value - mean) / stdDev;
  }

  // Calculate interquartile range for outlier detection
  static calculateIQR(values: number[]): { q1: number; q3: number; iqr: number; lowerBound: number; upperBound: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    return {
      q1,
      q3,
      iqr,
      lowerBound: q1 - 1.5 * iqr,
      upperBound: q3 + 1.5 * iqr
    };
  }

  // Moving average for trend detection
  static calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const windowValues = values.slice(start, i + 1);
      const avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
      result.push(avg);
    }
    return result;
  }

  // Exponential weighted moving average for recent data emphasis
  static calculateEWMA(values: number[], alpha: number = 0.3): number[] {
    const result: number[] = [];
    let ewma = values[0];
    
    for (const value of values) {
      ewma = alpha * value + (1 - alpha) * ewma;
      result.push(ewma);
    }
    
    return result;
  }

  // Seasonal decomposition for healthcare patterns
  static decomposeTimeSeries(
    values: TimeSeriesPoint[], 
    seasonalPeriod: number = 7 // Weekly pattern for healthcare
  ): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    const data = values.map(v => v.value);
    
    // Calculate trend using moving average
    const trend = this.calculateMovingAverage(data, seasonalPeriod);
    
    // Calculate seasonal component
    const detrended = data.map((v, i) => v - trend[i]);
    const seasonal: number[] = [];
    
    for (let i = 0; i < seasonalPeriod; i++) {
      const seasonalValues = [];
      for (let j = i; j < detrended.length; j += seasonalPeriod) {
        seasonalValues.push(detrended[j]);
      }
      const avgSeasonal = seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
      seasonal.push(avgSeasonal);
    }
    
    // Extend seasonal pattern to match data length
    const fullSeasonal: number[] = [];
    for (let i = 0; i < data.length; i++) {
      fullSeasonal.push(seasonal[i % seasonalPeriod]);
    }
    
    // Calculate residual
    const residual = data.map((v, i) => v - trend[i] - fullSeasonal[i]);
    
    return { trend, seasonal: fullSeasonal, residual };
  }
}

// Healthcare-specific anomaly patterns
class HealthcareAnomalyPatterns {
  // Detect patient safety anomalies
  static detectPatientSafetyAnomalies(
    metrics: PerformanceMetric[],
    patientSegments: PatientSegment[]
  ): {
    hasAnomaly: boolean;
    urgency: HealthcareUrgency;
    affectedSegments: PatientSegment[];
    riskScore: number;
  } {
    // Critical metrics for patient safety
    const criticalMetrics = [
      'error_rate',
      'response_time',
      'medication_accuracy',
      'appointment_compliance',
      'emergency_response'
    ];
    
    let maxRiskScore = 0;
    const affectedSegments = new Set<PatientSegment>();
    
    for (const metric of metrics) {
      if (criticalMetrics.includes(metric.metric_name)) {
        // Check if metric exceeds safety thresholds
        const zScore = StatisticalAnalyzer.calculateZScore(
          metric.current_value,
          metric.mean,
          metric.std_deviation
        );
        
        if (zScore > 3) { // 3 standard deviations
          // Assess impact on patient segments
          for (const segment of patientSegments) {
            if (this.isSegmentAffected(metric, segment)) {
              affectedSegments.add(segment);
            }
          }
          
          // Calculate risk score based on metric importance and deviation
          const metricWeight = this.getMetricWeight(metric.metric_name);
          const riskScore = Math.min(100, zScore * metricWeight * 10);
          maxRiskScore = Math.max(maxRiskScore, riskScore);
        }
      }
    }
    
    // Determine urgency based on risk score
    let urgency: HealthcareUrgency = 'routine';
    if (maxRiskScore > 80) urgency = 'critical';
    else if (maxRiskScore > 60) urgency = 'emergency';
    else if (maxRiskScore > 40) urgency = 'urgent';
    
    return {
      hasAnomaly: maxRiskScore > 30,
      urgency,
      affectedSegments: Array.from(affectedSegments),
      riskScore: maxRiskScore
    };
  }

  // Detect compliance violations
  static detectComplianceViolations(
    metrics: PerformanceMetric[],
    complianceCategories: ComplianceCategory[]
  ): {
    violations: ComplianceViolation[];
    overallComplianceScore: number;
  } {
    const violations: ComplianceViolation[] = [];
    const scores: number[] = [];
    
    for (const category of complianceCategories) {
      const relevantMetrics = this.getComplianceMetrics(category);
      let categoryScore = 100;
      
      for (const metricName of relevantMetrics) {
        const metric = metrics.find(m => m.metric_name === metricName);
        if (metric && metric.is_anomaly) {
          const violation: ComplianceViolation = {
            category,
            metric: metricName,
            severity: this.assessComplianceSeverity(metric),
            description: this.generateViolationDescription(category, metric),
            remediation: this.suggestRemediation(category, metric)
          };
          violations.push(violation);
          
          // Adjust compliance score
          categoryScore -= this.getViolationImpact(violation.severity);
        }
      }
      
      scores.push(Math.max(0, categoryScore));
    }
    
    const overallComplianceScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 100;
    
    return { violations, overallComplianceScore };
  }

  // Helper methods
  private static isSegmentAffected(metric: PerformanceMetric, segment: PatientSegment): boolean {
    // Logic to determine if a patient segment is affected by the metric anomaly
    const segmentMetricMap: Record<PatientSegment, string[]> = {
      'new_patients': ['onboarding_time', 'first_visit_completion', 'registration_errors'],
      'returning_patients': ['appointment_adherence', 'prescription_refills', 'portal_engagement'],
      'at_risk_patients': ['monitoring_frequency', 'alert_response_time', 'intervention_success'],
      'chronic_care_patients': ['medication_adherence', 'vital_monitoring', 'care_plan_compliance'],
      'preventive_care_patients': ['screening_completion', 'vaccination_rates', 'wellness_visits'],
      'emergency_patients': ['triage_time', 'emergency_response', 'critical_care_metrics']
    };
    
    return segmentMetricMap[segment]?.includes(metric.metric_name) || false;
  }

  private static getMetricWeight(metricName: string): number {
    const weights: Record<string, number> = {
      'error_rate': 10,
      'response_time': 8,
      'medication_accuracy': 10,
      'appointment_compliance': 6,
      'emergency_response': 10,
      'data_breach': 10,
      'patient_identification': 9,
      'consent_tracking': 7
    };
    return weights[metricName] || 5;
  }

  private static getComplianceMetrics(category: ComplianceCategory): string[] {
    const metricsMap: Record<ComplianceCategory, string[]> = {
      'hipaa_privacy': ['access_logs', 'data_encryption', 'user_authentication'],
      'hipaa_security': ['intrusion_attempts', 'audit_trail_completeness', 'backup_integrity'],
      'hitech': ['breach_notifications', 'ehr_adoption', 'meaningful_use'],
      'gdpr': ['consent_tracking', 'data_portability', 'right_to_deletion'],
      'medical_accuracy': ['clinical_guideline_adherence', 'diagnosis_accuracy', 'treatment_outcomes'],
      'patient_consent': ['consent_forms_completed', 'opt_out_requests', 'preference_updates'],
      'data_retention': ['retention_policy_compliance', 'data_purge_schedule', 'archive_integrity']
    };
    return metricsMap[category] || [];
  }

  private static assessComplianceSeverity(metric: PerformanceMetric): AlertSeverity {
    const deviation = Math.abs(metric.percentage_change);
    if (deviation > 50) return 'critical';
    if (deviation > 30) return 'high';
    if (deviation > 15) return 'medium';
    return 'low';
  }

  private static generateViolationDescription(category: ComplianceCategory, metric: PerformanceMetric): string {
    return `${category} violation detected: ${metric.metric_name} shows ${metric.percentage_change.toFixed(2)}% deviation from baseline`;
  }

  private static suggestRemediation(category: ComplianceCategory, metric: PerformanceMetric): string {
    const remediationMap: Record<ComplianceCategory, string> = {
      'hipaa_privacy': 'Review access controls and audit user permissions',
      'hipaa_security': 'Conduct security assessment and update safeguards',
      'hitech': 'Update breach notification procedures and review EHR configurations',
      'gdpr': 'Verify consent management processes and data subject rights',
      'medical_accuracy': 'Review clinical guidelines and update treatment protocols',
      'patient_consent': 'Audit consent forms and update tracking systems',
      'data_retention': 'Review retention policies and schedule data purge'
    };
    return remediationMap[category] || 'Investigate and address the compliance issue';
  }

  private static getViolationImpact(severity: AlertSeverity): number {
    const impactMap: Record<AlertSeverity, number> = {
      'critical': 40,
      'high': 25,
      'medium': 15,
      'low': 5
    };
    return impactMap[severity];
  }
}

// Compliance violation interface
interface ComplianceViolation {
  category: ComplianceCategory;
  metric: string;
  severity: AlertSeverity;
  description: string;
  remediation: string;
}

// Main Anomaly Detection Service
export class AnomalyDetectionService {
  private supabase;
  private config: AnomalyDetectionConfig;

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Default configuration with healthcare optimizations
    this.config = {
      algorithm: 'ml_based',
      sensitivity: 0.7,
      training_period_days: 30,
      minimum_data_points: 100,
      seasonal_adjustment: true,
      detect_patient_journey_anomalies: true,
      detect_compliance_deviations: true,
      detect_safety_concerns: true,
      confidence_threshold: 0.8,
      ...config
    };
  }

  // Main anomaly detection method
  async detectAnomalies(
    metrics: PerformanceMetric[],
    context?: {
      patientSegments?: PatientSegment[];
      complianceCategories?: ComplianceCategory[];
      historicalData?: TimeSeriesPoint[];
    }
  ): Promise<AnomalyDetectionResult> {
    const anomalies: DetectedAnomaly[] = [];
    
    // Apply different detection algorithms based on configuration
    switch (this.config.algorithm) {
      case 'statistical':
        anomalies.push(...this.statisticalAnomalyDetection(metrics));
        break;
      case 'ml_based':
        anomalies.push(...await this.mlBasedAnomalyDetection(metrics, context?.historicalData));
        break;
      case 'isolation_forest':
        anomalies.push(...this.isolationForestDetection(metrics));
        break;
      default:
        anomalies.push(...this.hybridAnomalyDetection(metrics));
    }

    // Healthcare-specific pattern detection
    let patientSafetyAnalysis;
    let complianceAnalysis;

    if (this.config.detect_patient_journey_anomalies && context?.patientSegments) {
      patientSafetyAnalysis = HealthcareAnomalyPatterns.detectPatientSafetyAnomalies(
        metrics,
        context.patientSegments
      );
    }

    if (this.config.detect_compliance_deviations && context?.complianceCategories) {
      complianceAnalysis = HealthcareAnomalyPatterns.detectComplianceViolations(
        metrics,
        context.complianceCategories
      );
    }

    // Filter anomalies by confidence threshold
    const filteredAnomalies = anomalies.filter(a => a.confidence >= this.config.confidence_threshold);

    // Prioritize and rank anomalies
    const rankedAnomalies = this.rankAnomalies(filteredAnomalies);

    return {
      anomalies: rankedAnomalies,
      patientSafetyAnalysis,
      complianceAnalysis,
      summary: this.generateAnomalySummary(rankedAnomalies),
      recommendations: await this.generateRecommendations(rankedAnomalies)
    };
  }

  // Statistical anomaly detection
  private statisticalAnomalyDetection(metrics: PerformanceMetric[]): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = [];

    for (const metric of metrics) {
      // Z-score based detection
      const zScore = StatisticalAnalyzer.calculateZScore(
        metric.current_value,
        metric.mean,
        metric.std_deviation
      );

      if (zScore > 3 * this.config.sensitivity) {
        // IQR-based confirmation
        const values = metric.historical_values.map(v => v.value);
        const iqr = StatisticalAnalyzer.calculateIQR(values);
        
        if (metric.current_value < iqr.lowerBound || metric.current_value > iqr.upperBound) {
          anomalies.push({
            metric_name: metric.metric_name,
            anomaly_type: metric.current_value > metric.mean ? 'spike' : 'drop',
            severity: this.calculateSeverity(zScore),
            confidence: Math.min(1, zScore / 4),
            detected_at: new Date(),
            value: metric.current_value,
            expected_range: [iqr.lowerBound, iqr.upperBound],
            description: `Detected ${zScore.toFixed(2)} standard deviations from mean`
          });
        }
      }

      // Trend change detection
      if (metric.historical_values.length >= 10) {
        const trendAnomaly = this.detectTrendChange(metric);
        if (trendAnomaly) {
          anomalies.push(trendAnomaly);
        }
      }
    }

    return anomalies;
  }

  // ML-based anomaly detection (simplified for demonstration)
  private async mlBasedAnomalyDetection(
    metrics: PerformanceMetric[],
    historicalData?: TimeSeriesPoint[]
  ): Promise<DetectedAnomaly[]> {
    const anomalies: DetectedAnomaly[] = [];

    // In a production environment, this would call an ML model API
    // For now, we'll use advanced statistical methods
    for (const metric of metrics) {
      if (metric.historical_values.length < this.config.minimum_data_points) {
        continue;
      }

      // Seasonal decomposition
      const decomposition = StatisticalAnalyzer.decomposeTimeSeries(metric.historical_values);
      
      // Check residuals for anomalies
      const residualMean = decomposition.residual.reduce((a, b) => a + b, 0) / decomposition.residual.length;
      const residualStdDev = Math.sqrt(
        decomposition.residual.reduce((sum, val) => sum + Math.pow(val - residualMean, 2), 0) / decomposition.residual.length
      );

      const currentResidual = decomposition.residual[decomposition.residual.length - 1];
      const residualZScore = Math.abs(currentResidual - residualMean) / residualStdDev;

      if (residualZScore > 2.5 * this.config.sensitivity) {
        anomalies.push({
          metric_name: metric.metric_name,
          anomaly_type: 'pattern_change',
          severity: this.calculateSeverity(residualZScore),
          confidence: Math.min(1, residualZScore / 3),
          detected_at: new Date(),
          value: metric.current_value,
          expected_range: [
            metric.mean - 2 * metric.std_deviation,
            metric.mean + 2 * metric.std_deviation
          ],
          description: 'Unusual pattern detected after seasonal adjustment'
        });
      }
    }

    return anomalies;
  }

  // Isolation Forest detection (simplified implementation)
  private isolationForestDetection(metrics: PerformanceMetric[]): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = [];

    // Create feature matrix from metrics
    const features = metrics.map(m => [
      m.current_value,
      m.percentage_change,
      m.std_deviation,
      m.trend === 'declining' ? -1 : m.trend === 'improving' ? 1 : 0
    ]);

    // Calculate isolation scores (simplified)
    for (let i = 0; i < metrics.length; i++) {
      const isolationScore = this.calculateIsolationScore(features[i], features);
      
      if (isolationScore > 0.6 * this.config.sensitivity) {
        anomalies.push({
          metric_name: metrics[i].metric_name,
          anomaly_type: 'pattern_change',
          severity: isolationScore > 0.8 ? 'high' : 'medium',
          confidence: isolationScore,
          detected_at: new Date(),
          value: metrics[i].current_value,
          expected_range: [
            metrics[i].percentiles.p25,
            metrics[i].percentiles.p75
          ],
          description: 'Isolated anomaly detected'
        });
      }
    }

    return anomalies;
  }

  // Hybrid approach combining multiple methods
  private hybridAnomalyDetection(metrics: PerformanceMetric[]): DetectedAnomaly[] {
    const statisticalAnomalies = this.statisticalAnomalyDetection(metrics);
    const isolationAnomalies = this.isolationForestDetection(metrics);

    // Combine and deduplicate anomalies
    const combinedAnomalies = new Map<string, DetectedAnomaly>();

    for (const anomaly of [...statisticalAnomalies, ...isolationAnomalies]) {
      const existing = combinedAnomalies.get(anomaly.metric_name);
      if (!existing || anomaly.confidence > existing.confidence) {
        combinedAnomalies.set(anomaly.metric_name, anomaly);
      }
    }

    return Array.from(combinedAnomalies.values());
  }

  // Helper methods
  private detectTrendChange(metric: PerformanceMetric): DetectedAnomaly | null {
    const values = metric.historical_values.map(v => v.value);
    const recentValues = values.slice(-5);
    const olderValues = values.slice(-10, -5);

    const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderMean = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;

    const changePercentage = Math.abs((recentMean - olderMean) / olderMean) * 100;

    if (changePercentage > 30 * this.config.sensitivity) {
      return {
        metric_name: metric.metric_name,
        anomaly_type: 'pattern_change',
        severity: changePercentage > 50 ? 'high' : 'medium',
        confidence: Math.min(1, changePercentage / 100),
        detected_at: new Date(),
        value: metric.current_value,
        expected_range: [olderMean * 0.8, olderMean * 1.2],
        description: `Trend change detected: ${changePercentage.toFixed(2)}% shift`
      };
    }

    return null;
  }

  private calculateIsolationScore(point: number[], allPoints: number[][]): number {
    // Simplified isolation score calculation
    let isolationPaths = 0;
    const numTrees = 10;

    for (let tree = 0; tree < numTrees; tree++) {
      let depth = 0;
      let subset = [...allPoints];

      while (subset.length > 1 && depth < 10) {
        const featureIndex = Math.floor(Math.random() * point.length);
        const splitValue = point[featureIndex];
        
        subset = subset.filter(p => p[featureIndex] < splitValue);
        depth++;

        if (subset.length === 0) break;
      }

      isolationPaths += depth;
    }

    const avgPath = isolationPaths / numTrees;
    const normalizedScore = 1 - (avgPath / 10);

    return Math.max(0, Math.min(1, normalizedScore));
  }

  private calculateSeverity(score: number): AlertSeverity {
    if (score > 4) return 'critical';
    if (score > 3) return 'high';
    if (score > 2) return 'medium';
    return 'low';
  }

  private rankAnomalies(anomalies: DetectedAnomaly[]): DetectedAnomaly[] {
    return anomalies.sort((a, b) => {
      // Sort by severity first
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by confidence
      return b.confidence - a.confidence;
    });
  }

  private generateAnomalySummary(anomalies: DetectedAnomaly[]): AnomalySummary {
    const bySeverity = anomalies.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const byType = anomalies.reduce((acc, a) => {
      acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_anomalies: anomalies.length,
      by_severity: bySeverity,
      by_type: byType,
      highest_confidence: Math.max(...anomalies.map(a => a.confidence), 0),
      most_critical: anomalies.find(a => a.severity === 'critical')?.metric_name
    };
  }

  private async generateRecommendations(anomalies: DetectedAnomaly[]): Promise<string[]> {
    const recommendations: string[] = [];

    for (const anomaly of anomalies.slice(0, 5)) { // Top 5 anomalies
      switch (anomaly.anomaly_type) {
        case 'spike':
          recommendations.push(`Investigate sudden increase in ${anomaly.metric_name}. Consider scaling resources or reviewing recent changes.`);
          break;
        case 'drop':
          recommendations.push(`Address decline in ${anomaly.metric_name}. Check for system issues or configuration problems.`);
          break;
        case 'pattern_change':
          recommendations.push(`Review changes in ${anomaly.metric_name} patterns. May indicate shifting user behavior or system modifications.`);
          break;
        case 'seasonal_deviation':
          recommendations.push(`Unusual seasonal pattern in ${anomaly.metric_name}. Compare with historical data and external factors.`);
          break;
      }
    }

    return recommendations;
  }
}

// Type definitions for results
interface DetectedAnomaly {
  metric_name: string;
  anomaly_type: 'spike' | 'drop' | 'pattern_change' | 'seasonal_deviation';
  severity: AlertSeverity;
  confidence: number;
  detected_at: Date;
  value: number;
  expected_range: [number, number];
  description: string;
}

interface AnomalyDetectionResult {
  anomalies: DetectedAnomaly[];
  patientSafetyAnalysis?: {
    hasAnomaly: boolean;
    urgency: HealthcareUrgency;
    affectedSegments: PatientSegment[];
    riskScore: number;
  };
  complianceAnalysis?: {
    violations: ComplianceViolation[];
    overallComplianceScore: number;
  };
  summary: AnomalySummary;
  recommendations: string[];
}

interface AnomalySummary {
  total_anomalies: number;
  by_severity: Record<AlertSeverity, number>;
  by_type: Record<string, number>;
  highest_confidence: number;
  most_critical?: string;
}

// Export singleton instance
export const anomalyDetector = new AnomalyDetectionService();