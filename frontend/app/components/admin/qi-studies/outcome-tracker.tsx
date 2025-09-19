'use client';

// QI Study Outcome Tracker Component
// Story 4.4: Quality Improvement Studies Tracking

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  OutcomeMeasurement, 
  PatientOutcomeMetric 
} from '@/types/qi-studies';

interface OutcomeTrackerProps {
  studyId: string;
  className?: string;
}

export function OutcomeTracker({ studyId, className }: OutcomeTrackerProps) {
  const [outcomeMeasurements, setOutcomeMeasurements] = useState<OutcomeMeasurement[]>([]);
  const [patientOutcomeMetrics, setPatientOutcomeMetrics] = useState<PatientOutcomeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'measurements' | 'patient_metrics'>('measurements');

  useEffect(() => {
    fetchOutcomeData();
  }, [studyId]);

  const fetchOutcomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch outcome measurements
      const measurementsResponse = await fetch(`/api/admin/qi-studies/${studyId}/outcome-measurements`);
      if (measurementsResponse.ok) {
        const measurements = await measurementsResponse.json();
        setOutcomeMeasurements(measurements);
      }

      // Fetch patient outcome metrics
      const metricsResponse = await fetch(`/api/admin/qi-studies/${studyId}/patient-outcome-metrics`);
      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        setPatientOutcomeMetrics(metrics);
      }

    } catch (err) {
      console.error('Error fetching outcome data:', err);
      setError('Failed to load outcome data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number | undefined, decimals: number = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const getImprovementColor = (baseline: number | undefined, actual: number | undefined) => {
    if (!baseline || !actual) return 'text-gray-500';
    const improvement = ((actual - baseline) / baseline) * 100;
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getStatisticalSignificance = (pValue: number | undefined) => {
    if (!pValue) return 'N/A';
    if (pValue < 0.001) return 'Highly Significant (p < 0.001)';
    if (pValue < 0.01) return 'Very Significant (p < 0.01)';
    if (pValue < 0.05) return 'Significant (p < 0.05)';
    if (pValue < 0.1) return 'Marginally Significant (p < 0.1)';
    return 'Not Significant (p ≥ 0.1)';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchOutcomeData} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'measurements' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('measurements')}
          className="flex-1"
        >
          Outcome Measurements
        </Button>
        <Button
          variant={activeTab === 'patient_metrics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('patient_metrics')}
          className="flex-1"
        >
          Patient Outcome Metrics
        </Button>
      </div>

      {/* Outcome Measurements Tab */}
      {activeTab === 'measurements' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outcome Measurements</CardTitle>
              <CardDescription>Quantitative and qualitative measurements for QI study outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {outcomeMeasurements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No outcome measurements recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outcomeMeasurements.map((measurement) => (
                    <div key={measurement.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{measurement.measurement_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {measurement.measurement_type.replace('_', ' ')} • {measurement.unit_of_measure}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {measurement.measurement_type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Baseline Value</Label>
                          <p className="font-medium">{formatNumber(measurement.baseline_value)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Target Value</Label>
                          <p className="font-medium">{formatNumber(measurement.target_value)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Actual Value</Label>
                          <p className={`font-medium ${getImprovementColor(measurement.baseline_value, measurement.actual_value)}`}>
                            {formatNumber(measurement.actual_value)}
                          </p>
                        </div>
                      </div>

                      {measurement.statistical_significance && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">Statistical Significance</Label>
                              <p className="font-medium">{getStatisticalSignificance(measurement.p_value)}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Effect Size</Label>
                              <p className="font-medium">{formatNumber(measurement.effect_size)}</p>
                            </div>
                            {measurement.confidence_interval_lower && measurement.confidence_interval_upper && (
                              <div className="md:col-span-2">
                                <Label className="text-xs text-muted-foreground">95% Confidence Interval</Label>
                                <p className="font-medium">
                                  [{formatNumber(measurement.confidence_interval_lower)}, {formatNumber(measurement.confidence_interval_upper)}]
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {measurement.measurement_notes && (
                        <div className="mt-3">
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <p className="text-sm">{measurement.measurement_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Outcome Metrics Tab */}
      {activeTab === 'patient_metrics' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Outcome Metrics</CardTitle>
              <CardDescription>Patient safety indicators and outcome measurements</CardDescription>
            </CardHeader>
            <CardContent>
              {patientOutcomeMetrics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No patient outcome metrics recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientOutcomeMetrics.map((metric) => (
                    <div key={metric.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{metric.metric_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {metric.metric_type.replace('_', ' ')} • {metric.patient_count} patients
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">
                            {metric.metric_type}
                          </Badge>
                          {metric.safety_indicator && (
                            <Badge className="bg-red-100 text-red-800">
                              Safety Indicator
                            </Badge>
                          )}
                          {metric.regulatory_requirement && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Regulatory
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Baseline Rate</Label>
                          <p className="font-medium">{formatPercentage(metric.baseline_rate)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Target Rate</Label>
                          <p className="font-medium">{formatPercentage(metric.target_rate)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Actual Rate</Label>
                          <p className={`font-medium ${getImprovementColor(metric.baseline_rate, metric.actual_rate)}`}>
                            {formatPercentage(metric.actual_rate)}
                          </p>
                        </div>
                      </div>

                      {metric.improvement_percentage && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Improvement</Label>
                            <p className={`font-medium ${metric.improvement_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {metric.improvement_percentage > 0 ? '+' : ''}{formatPercentage(metric.improvement_percentage / 100)}
                            </p>
                          </div>
                        </div>
                      )}

                      {metric.measurement_period_start && metric.measurement_period_end && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          <Label className="text-xs text-muted-foreground">Measurement Period</Label>
                          <p>
                            {formatDate(metric.measurement_period_start)} - {formatDate(metric.measurement_period_end)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};
