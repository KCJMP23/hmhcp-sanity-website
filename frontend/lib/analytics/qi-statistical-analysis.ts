// QI Statistical Analysis Utilities
// Story 4.4: Quality Improvement Studies Tracking

import { 
  OutcomeMeasurement, 
  PatientOutcomeMetric, 
  StatisticalAnalysisResult,
  InterventionEffectivenessComparison 
} from '@/types/qi-studies';

/**
 * Calculate descriptive statistics for outcome measurements
 * Enhanced with better error handling and mathematical precision
 */
export function calculateDescriptiveStatistics(measurements: OutcomeMeasurement[]): {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  count: number;
} {
  if (!measurements || measurements.length === 0) {
    return { mean: 0, median: 0, standardDeviation: 0, min: 0, max: 0, count: 0 };
  }

  const values = measurements
    .map(m => m.actual_value)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  if (values.length === 0) {
    return { mean: 0, median: 0, standardDeviation: 0, min: 0, max: 0, count: 0 };
  }

  // Sort once for both median and min/max calculations
  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;
  
  // Calculate median
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)];

  // Calculate sample standard deviation (Bessel's correction for n-1)
  const variance = count > 1 
    ? values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1)
    : 0;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    standardDeviation: Number(standardDeviation.toFixed(4)),
    min: sorted[0],
    max: sorted[count - 1],
    count,
  };
}

/**
 * Calculate confidence interval for a measurement
 * Enhanced with proper t-distribution for small samples
 */
export function calculateConfidenceInterval(
  measurements: OutcomeMeasurement[],
  confidenceLevel: number = 0.95
): { lower: number; upper: number; level: number } {
  const stats = calculateDescriptiveStatistics(measurements);
  const n = stats.count;
  
  if (n < 2) {
    return { lower: 0, upper: 0, level: confidenceLevel };
  }

  // Use t-distribution for small samples (n < 30), z-distribution for large samples
  const isSmallSample = n < 30;
  
  if (isSmallSample) {
    // Approximate t-values for common confidence levels and sample sizes
    const tValues: { [key: number]: { [key: number]: number } } = {
      0.90: { 2: 2.920, 5: 2.132, 10: 1.812, 15: 1.753, 20: 1.725, 25: 1.708, 30: 1.697 },
      0.95: { 2: 4.303, 5: 2.776, 10: 2.228, 15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042 },
      0.99: { 2: 9.925, 5: 4.604, 10: 3.169, 15: 2.947, 20: 2.845, 25: 2.787, 30: 2.750 },
    };
    
    const df = n - 1; // degrees of freedom
    const tValue = tValues[confidenceLevel]?.[Math.min(df, 30)] || 2.0;
    const marginOfError = tValue * (stats.standardDeviation / Math.sqrt(n));
    
    return {
      lower: Number((stats.mean - marginOfError).toFixed(4)),
      upper: Number((stats.mean + marginOfError).toFixed(4)),
      level: confidenceLevel,
    };
  } else {
    // Z-score for large samples
    const zScores: { [key: number]: number } = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    
    const z = zScores[confidenceLevel] || 1.96;
    const marginOfError = z * (stats.standardDeviation / Math.sqrt(n));
    
    return {
      lower: Number((stats.mean - marginOfError).toFixed(4)),
      upper: Number((stats.mean + marginOfError).toFixed(4)),
      level: confidenceLevel,
    };
  }
}

/**
 * Calculate effect size (Cohen's d) for before/after comparison
 */
export function calculateEffectSize(
  baselineMeasurements: OutcomeMeasurement[],
  actualMeasurements: OutcomeMeasurement[]
): number {
  const baselineStats = calculateDescriptiveStatistics(baselineMeasurements);
  const actualStats = calculateDescriptiveStatistics(actualMeasurements);
  
  if (baselineStats.count === 0 || actualStats.count === 0) {
    return 0;
  }

  // Pooled standard deviation
  const pooledStd = Math.sqrt(
    ((baselineStats.count - 1) * Math.pow(baselineStats.standardDeviation, 2) +
     (actualStats.count - 1) * Math.pow(actualStats.standardDeviation, 2)) /
    (baselineStats.count + actualStats.count - 2)
  );

  if (pooledStd === 0) {
    return 0;
  }

  const effectSize = (actualStats.mean - baselineStats.mean) / pooledStd;
  return Number(effectSize.toFixed(4));
}

/**
 * Calculate improvement percentage
 */
export function calculateImprovementPercentage(
  baselineValue: number,
  actualValue: number
): number {
  if (baselineValue === 0) {
    return actualValue > 0 ? 100 : 0;
  }
  
  const improvement = ((actualValue - baselineValue) / Math.abs(baselineValue)) * 100;
  return Number(improvement.toFixed(2));
}

/**
 * Analyze patient outcome metrics for safety indicators
 */
export function analyzePatientOutcomeMetrics(metrics: PatientOutcomeMetric[]): {
  safetyImprovements: number;
  qualityImprovements: number;
  averageImprovement: number;
  regulatoryComplianceRate: number;
} {
  const safetyMetrics = metrics.filter(m => m.safety_indicator);
  const qualityMetrics = metrics.filter(m => m.metric_type === 'quality');
  const regulatoryMetrics = metrics.filter(m => m.regulatory_requirement);

  const safetyImprovements = safetyMetrics.filter(m => 
    m.improvement_percentage && m.improvement_percentage > 0
  ).length;

  const qualityImprovements = qualityMetrics.filter(m => 
    m.improvement_percentage && m.improvement_percentage > 0
  ).length;

  const allImprovements = metrics
    .map(m => m.improvement_percentage)
    .filter(p => p !== null && p !== undefined) as number[];
  
  const averageImprovement = allImprovements.length > 0
    ? allImprovements.reduce((sum, p) => sum + p, 0) / allImprovements.length
    : 0;

  const regulatoryComplianceRate = regulatoryMetrics.length > 0
    ? (regulatoryMetrics.filter(m => 
        m.actual_rate && m.target_rate && m.actual_rate <= m.target_rate
      ).length / regulatoryMetrics.length) * 100
    : 100;

  return {
    safetyImprovements,
    qualityImprovements,
    averageImprovement: Number(averageImprovement.toFixed(2)),
    regulatoryComplianceRate: Number(regulatoryComplianceRate.toFixed(2)),
  };
}

/**
 * Compare intervention effectiveness
 */
export function compareInterventionEffectiveness(
  interventions: Array<{
    id: string;
    name: string;
    effectiveness_score: number;
    implementation_cost: number;
    time_to_impact: number;
    sustainability_score: number;
    evidence_quality: 'strong' | 'moderate' | 'weak';
  }>
): InterventionEffectivenessComparison[] {
  return interventions.map(intervention => {
    const roi = intervention.implementation_cost > 0 
      ? ((intervention.effectiveness_score * 100) - intervention.implementation_cost) / intervention.implementation_cost * 100
      : 0;

    return {
      intervention_id: intervention.id,
      intervention_name: intervention.name,
      effectiveness_score: intervention.effectiveness_score,
      implementation_cost: intervention.implementation_cost,
      roi: Number(roi.toFixed(2)),
      time_to_impact: intervention.time_to_impact,
      sustainability_score: intervention.sustainability_score,
      evidence_quality: intervention.evidence_quality,
    };
  }).sort((a, b) => b.effectiveness_score - a.effectiveness_score);
}

/**
 * Generate statistical analysis result
 */
export function generateStatisticalAnalysis(
  measurements: OutcomeMeasurement[],
  analysisType: 'descriptive' | 'inferential' | 'correlation' | 'regression'
): StatisticalAnalysisResult {
  const stats = calculateDescriptiveStatistics(measurements);
  const confidenceInterval = calculateConfidenceInterval(measurements);
  
  let interpretation = '';
  let recommendations: string[] = [];

  switch (analysisType) {
    case 'descriptive':
      interpretation = `The data shows a mean of ${stats.mean} with a standard deviation of ${stats.standardDeviation}. `;
      interpretation += `The 95% confidence interval is [${confidenceInterval.lower}, ${confidenceInterval.upper}].`;
      
      recommendations = [
        'Consider collecting more data points for better statistical power',
        'Review data quality and identify any outliers',
        'Compare results with industry benchmarks'
      ];
      break;

    case 'inferential':
      const pValue = measurements.find(m => m.p_value)?.p_value || 0;
      const isSignificant = pValue < 0.05;
      
      interpretation = `Statistical analysis shows ${isSignificant ? 'significant' : 'non-significant'} results `;
      interpretation += `(p = ${pValue.toFixed(4)}). `;
      interpretation += isSignificant 
        ? 'The intervention appears to have a meaningful effect.'
        : 'The intervention may not have a statistically significant effect.';
      
      recommendations = isSignificant 
        ? ['Consider implementing the intervention more broadly', 'Monitor long-term effects']
        : ['Review intervention design', 'Consider increasing sample size', 'Evaluate implementation fidelity'];
      break;

    case 'correlation':
      interpretation = 'Correlation analysis helps identify relationships between variables. ';
      interpretation += 'Consider examining the strength and direction of correlations.';
      
      recommendations = [
        'Look for strong correlations (|r| > 0.7)',
        'Consider causal relationships carefully',
        'Use correlation analysis to guide further investigation'
      ];
      break;

    case 'regression':
      interpretation = 'Regression analysis can help predict outcomes and identify key factors. ';
      interpretation += 'Consider the R-squared value and significance of predictors.';
      
      recommendations = [
        'Validate the regression model with new data',
        'Consider multiple regression for complex relationships',
        'Use regression results to optimize interventions'
      ];
      break;
  }

  return {
    measurement_id: measurements[0]?.id || '',
    analysis_type: analysisType,
    mean: stats.mean,
    median: stats.median,
    standard_deviation: stats.standardDeviation,
    confidence_interval: confidenceInterval,
    p_value: measurements.find(m => m.p_value)?.p_value,
    effect_size: measurements.find(m => m.effect_size)?.effect_size,
    statistical_power: 0.8, // Placeholder - would need actual calculation
    interpretation,
    recommendations,
  };
}

/**
 * Calculate ROI for cost-effectiveness analysis
 */
export function calculateROI(
  totalCost: number,
  quantifiableBenefits: number,
  qualitativeBenefits?: Record<string, any>
): {
  roi_percentage: number;
  payback_period_months: number;
  net_present_value: number;
  cost_benefit_ratio: number;
} {
  const roi_percentage = totalCost > 0 ? ((quantifiableBenefits - totalCost) / totalCost) * 100 : 0;
  const payback_period_months = totalCost > 0 ? (totalCost / (quantifiableBenefits / 12)) : 0;
  const net_present_value = quantifiableBenefits - totalCost;
  const cost_benefit_ratio = totalCost > 0 ? quantifiableBenefits / totalCost : 0;

  return {
    roi_percentage: Number(roi_percentage.toFixed(2)),
    payback_period_months: Number(payback_period_months.toFixed(1)),
    net_present_value: Number(net_present_value.toFixed(2)),
    cost_benefit_ratio: Number(cost_benefit_ratio.toFixed(2)),
  };
}

/**
 * Generate predictive analytics for QI outcomes
 */
export function generatePredictiveAnalytics(
  historicalData: OutcomeMeasurement[],
  forecastPeriod: '7_days' | '30_days' | '90_days'
): {
  predicted_value: number;
  confidence_interval: { lower: number; upper: number };
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
} {
  if (historicalData.length < 3) {
    return {
      predicted_value: 0,
      confidence_interval: { lower: 0, upper: 0 },
      trend: 'stable',
      recommendations: ['Insufficient data for prediction', 'Collect more historical data']
    };
  }

  // Simple linear trend analysis
  const values = historicalData
    .map(m => m.actual_value)
    .filter(v => v !== null && v !== undefined) as number[];
  
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  // Calculate slope and intercept
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict future value
  const daysAhead = forecastPeriod === '7_days' ? 7 : forecastPeriod === '30_days' ? 30 : 90;
  const predicted_value = slope * (n + daysAhead) + intercept;

  // Calculate confidence interval (simplified)
  const residuals = y.map((yi, i) => yi - (slope * x[i] + intercept));
  const mse = residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);
  const se = Math.sqrt(mse * (1 + 1/n + Math.pow(n + daysAhead - sumX/n, 2) / (sumXX - sumX*sumX/n)));
  const margin = 1.96 * se; // 95% confidence

  const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

  const recommendations = [
    trend === 'increasing' ? 'Continue current interventions' : 
    trend === 'decreasing' ? 'Review and adjust interventions' : 
    'Monitor closely for changes',
    'Validate predictions with actual data',
    'Consider external factors that may affect outcomes'
  ];

  return {
    predicted_value: Number(predicted_value.toFixed(4)),
    confidence_interval: {
      lower: Number((predicted_value - margin).toFixed(4)),
      upper: Number((predicted_value + margin).toFixed(4))
    },
    trend,
    recommendations
  };
}
