// Content Optimizer Component
// Created: 2025-01-27
// Purpose: Content optimization suggestions with medical accuracy validation

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  SEORecommendation, 
  HealthcareComplianceData,
  ContentType 
} from '@/types/seo';

interface ContentOptimizerProps {
  organizationId: string;
}

interface OptimizationResult {
  content: string;
  suggestions: SEORecommendation[];
  compliance: HealthcareComplianceData;
  readabilityScore: number;
  keywordDensity: number;
  medicalAccuracyScore: number;
}

export default function ContentOptimizer({ organizationId }: ContentOptimizerProps) {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<ContentType>('page');
  const [healthcareSpecialty, setHealthcareSpecialty] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const healthcareSpecialties = [
    'cardiology',
    'oncology',
    'neurology',
    'orthopedics',
    'dermatology',
    'pediatrics',
    'mental-health',
    'emergency-medicine',
    'internal-medicine',
    'general'
  ];

  const analyzeContent = async () => {
    if (!content.trim()) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/admin/seo/content/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          content: content.trim(),
          contentType,
          healthcareSpecialty: healthcareSpecialty || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      setResult(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Content Optimizer</h2>
          <p className="text-gray-600">Optimize healthcare content for SEO and compliance</p>
        </div>
      </div>

      {/* Content Input */}
      <Card>
        <CardHeader>
          <CardTitle>Content Analysis</CardTitle>
          <CardDescription>Enter your healthcare content for SEO optimization and compliance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="content-type">Content Type</Label>
                <select
                  id="content-type"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="page">Page</option>
                  <option value="blog">Blog Post</option>
                  <option value="service">Service</option>
                  <option value="practitioner">Practitioner</option>
                </select>
              </div>
              <div>
                <Label htmlFor="specialty">Healthcare Specialty (Optional)</Label>
                <select
                  id="specialty"
                  value={healthcareSpecialty}
                  onChange={(e) => setHealthcareSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select specialty...</option>
                  {healthcareSpecialties.map(specialty => (
                    <option key={specialty} value={specialty}>
                      {specialty.charAt(0).toUpperCase() + specialty.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your healthcare content here..."
                rows={8}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                {content.length} characters • {content.split(' ').length} words
              </div>
            </div>

            <Button 
              onClick={analyzeContent} 
              disabled={!content.trim() || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing Content...' : 'Analyze Content'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {result && (
        <div className="space-y-6">
          {/* Scores Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis Scores</CardTitle>
              <CardDescription>Overall content quality and SEO metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(result.readabilityScore)}`}>
                    {result.readabilityScore}/100
                  </div>
                  <div className="text-sm text-gray-600">Readability</div>
                </div>
                <div className="text-center p-4 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(result.keywordDensity * 100)}`}>
                    {(result.keywordDensity * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Keyword Density</div>
                </div>
                <div className="text-center p-4 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(result.medicalAccuracyScore)}`}>
                    {result.medicalAccuracyScore}/100
                  </div>
                  <div className="text-sm text-gray-600">Medical Accuracy</div>
                </div>
                <div className="text-center p-4 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(
                    (result.readabilityScore + result.medicalAccuracyScore) / 2
                  )}`}>
                    {Math.round((result.readabilityScore + result.medicalAccuracyScore) / 2)}/100
                  </div>
                  <div className="text-sm text-gray-600">Overall Quality</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Healthcare Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Compliance</CardTitle>
              <CardDescription>Medical content compliance and accuracy validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg">
                  <div className={`text-lg font-bold ${result.compliance.fda_compliant ? 'text-green-600' : 'text-red-600'}`}>
                    {result.compliance.fda_compliant ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">FDA Compliant</div>
                </div>
                <div className="text-center p-3 rounded-lg">
                  <div className={`text-lg font-bold ${result.compliance.hipaa_compliant ? 'text-green-600' : 'text-red-600'}`}>
                    {result.compliance.hipaa_compliant ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">HIPAA Compliant</div>
                </div>
                <div className="text-center p-3 rounded-lg">
                  <div className={`text-lg font-bold ${result.compliance.advertising_compliance ? 'text-green-600' : 'text-red-600'}`}>
                    {result.compliance.advertising_compliance ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">Advertising</div>
                </div>
                <div className="text-center p-3 rounded-lg">
                  <div className={`text-lg font-bold ${result.compliance.disclaimers_present ? 'text-green-600' : 'text-red-600'}`}>
                    {result.compliance.disclaimers_present ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">Disclaimers</div>
                </div>
              </div>

              {result.compliance.compliance_notes.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Compliance Notes</h4>
                  <ul className="space-y-1">
                    {result.compliance.compliance_notes.map((note, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.compliance.citations_required.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Required Citations</h4>
                  <ul className="space-y-1">
                    {result.compliance.citations_required.map((citation, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-blue-500 mr-2">📚</span>
                        {citation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optimization Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>Actionable recommendations to improve your content</CardDescription>
            </CardHeader>
            <CardContent>
              {result.suggestions.length > 0 ? (
                <div className="space-y-4">
                  {result.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          <span className="font-medium">{suggestion.category}</span>
                          {suggestion.healthcare_specific && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Healthcare
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h4 className="font-medium mb-2">{suggestion.title}</h4>
                      <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">Action Required:</span>
                          <span className="ml-2">{suggestion.action_required}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-green-600">Expected Impact:</span>
                          <span className="ml-2">{suggestion.estimated_impact}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Great Content!</h3>
                  <p className="text-gray-600">No optimization suggestions found. Your content is well-optimized.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Optimized Content Preview</CardTitle>
              <CardDescription>Your content with suggested improvements highlighted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700">
                  {result.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Content State */}
      {!result && !isAnalyzing && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze</h3>
              <p className="text-gray-600">Enter your healthcare content above to get optimization suggestions</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
