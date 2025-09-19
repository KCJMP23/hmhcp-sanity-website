// Competitor Analyzer Component
// Created: 2025-01-27
// Purpose: Healthcare competitor analysis and benchmarking

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CompetitorAnalysis, 
  CompetitorData,
  KeywordGap,
  MarketInsights 
} from '@/types/seo';

interface CompetitorAnalyzerProps {
  organizationId: string;
}

export default function CompetitorAnalyzer({ organizationId }: CompetitorAnalyzerProps) {
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorAnalysis | null>(null);

  // Analysis form state
  const [analysisForm, setAnalysisForm] = useState({
    competitorDomains: [] as string[],
    newDomain: '',
    healthcareSpecialty: '',
    analysisDepth: 'basic' as 'basic' | 'comprehensive'
  });

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

  useEffect(() => {
    loadCompetitors();
  }, [organizationId]);

  const loadCompetitors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/seo/competitors?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load competitors');
      }

      const data = await response.json();
      setCompetitors(data.competitors || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competitors');
    } finally {
      setLoading(false);
    }
  };

  const addDomain = () => {
    if (analysisForm.newDomain.trim() && !analysisForm.competitorDomains.includes(analysisForm.newDomain.trim())) {
      setAnalysisForm(prev => ({
        ...prev,
        competitorDomains: [...prev.competitorDomains, prev.newDomain.trim()],
        newDomain: ''
      }));
    }
  };

  const removeDomain = (domain: string) => {
    setAnalysisForm(prev => ({
      ...prev,
      competitorDomains: prev.competitorDomains.filter(d => d !== domain)
    }));
  };

  const startAnalysis = async () => {
    if (analysisForm.competitorDomains.length === 0) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/admin/seo/competitors/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          competitorDomains: analysisForm.competitorDomains,
          healthcareSpecialty: analysisForm.healthcareSpecialty || undefined,
          analysisDepth: analysisForm.analysisDepth
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start competitor analysis');
      }

      const data = await response.json();
      
      // Reset form
      setAnalysisForm(prev => ({
        ...prev,
        competitorDomains: [],
        newDomain: ''
      }));

      loadCompetitors(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteCompetitor = async (competitorId: string) => {
    if (!confirm('Are you sure you want to delete this competitor analysis?')) return;

    try {
      const response = await fetch(`/api/admin/seo/competitors?id=${competitorId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete competitor');
      }

      loadCompetitors(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete competitor');
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading competitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Competitor Analyzer</h2>
          <p className="text-gray-600">Analyze healthcare competitors and identify opportunities</p>
        </div>
        <div className="text-sm text-gray-500">
          {competitors.length} competitors analyzed
        </div>
      </div>

      {/* New Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start Competitor Analysis</CardTitle>
          <CardDescription>Analyze healthcare competitors to identify SEO opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialty">Healthcare Specialty (Optional)</Label>
                <select
                  id="specialty"
                  value={analysisForm.healthcareSpecialty}
                  onChange={(e) => setAnalysisForm(prev => ({ ...prev, healthcareSpecialty: e.target.value }))}
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
              <div>
                <Label htmlFor="depth">Analysis Depth</Label>
                <select
                  id="depth"
                  value={analysisForm.analysisDepth}
                  onChange={(e) => setAnalysisForm(prev => ({ 
                    ...prev, 
                    analysisDepth: e.target.value as 'basic' | 'comprehensive' 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basic">Basic Analysis</option>
                  <option value="comprehensive">Comprehensive Analysis</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Competitor Domains</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={analysisForm.newDomain}
                  onChange={(e) => setAnalysisForm(prev => ({ ...prev, newDomain: e.target.value }))}
                  placeholder="example.com"
                  onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                />
                <Button onClick={addDomain} variant="outline">
                  Add
                </Button>
              </div>
              {analysisForm.competitorDomains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysisForm.competitorDomains.map((domain, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {domain}
                      <button
                        onClick={() => removeDomain(domain)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={startAnalysis} 
              disabled={analysisForm.competitorDomains.length === 0 || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing Competitors...' : 'Start Analysis'}
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

      {/* Competitors List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitors Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Competitors Analyzed</CardTitle>
            <CardDescription>Healthcare competitors and their performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {competitors.length > 0 ? (
              <div className="space-y-3">
                {competitors.slice(0, 5).map((competitor) => (
                  <div 
                    key={competitor.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCompetitor(competitor)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{competitor.competitor_name}</span>
                        <Badge variant="outline">{competitor.healthcare_specialty}</Badge>
                        {competitor.market_share && (
                          <Badge className="bg-blue-100 text-blue-800">
                            {competitor.market_share}% market share
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {competitor.competitor_domain}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(competitor.analysis_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Competitors Analyzed</h3>
                <p className="text-gray-600">Start by analyzing your healthcare competitors</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitor Details */}
        {selectedCompetitor ? (
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>{selectedCompetitor.competitor_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Organic Traffic:</span>
                      <span className="font-medium">
                        {selectedCompetitor.performance_metrics.organic_traffic?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keyword Rankings:</span>
                      <span className="font-medium">
                        {selectedCompetitor.performance_metrics.keyword_rankings || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Backlinks:</span>
                      <span className="font-medium">
                        {selectedCompetitor.performance_metrics.backlink_count?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Domain Authority:</span>
                      <span className="font-medium">
                        {selectedCompetitor.performance_metrics.domain_authority || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Page Speed:</span>
                      <span className={`font-medium ${getPerformanceColor(selectedCompetitor.performance_metrics.page_speed_score || 0)}`}>
                        {selectedCompetitor.performance_metrics.page_speed_score || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mobile Friendly:</span>
                      <span className={`font-medium ${getPerformanceColor(selectedCompetitor.performance_metrics.mobile_friendliness || 0)}`}>
                        {selectedCompetitor.performance_metrics.mobile_friendliness || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Analysis */}
                <div>
                  <h4 className="font-medium mb-2">Content Analysis</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Pages:</span>
                      <span className="font-medium">
                        {selectedCompetitor.content_analysis.total_pages || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Healthcare Content Ratio:</span>
                      <span className="font-medium">
                        {selectedCompetitor.content_analysis.healthcare_content_ratio ? 
                          `${selectedCompetitor.content_analysis.healthcare_content_ratio}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical Accuracy Score:</span>
                      <span className={`font-medium ${getPerformanceColor(selectedCompetitor.content_analysis.medical_accuracy_score || 0)}`}>
                        {selectedCompetitor.content_analysis.medical_accuracy_score || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content Freshness:</span>
                      <span className={`font-medium ${getPerformanceColor(selectedCompetitor.content_analysis.content_freshness || 0)}`}>
                        {selectedCompetitor.content_analysis.content_freshness || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Keywords */}
                {selectedCompetitor.performance_metrics.top_keywords && selectedCompetitor.performance_metrics.top_keywords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Top Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompetitor.performance_metrics.top_keywords.slice(0, 10).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Select a competitor to view detailed analysis</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Keyword Gaps and Opportunities */}
      {selectedCompetitor && selectedCompetitor.keyword_gaps && selectedCompetitor.keyword_gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Opportunities</CardTitle>
            <CardDescription>Keywords where competitors rank but you don't</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedCompetitor.keyword_gaps.slice(0, 10).map((gap, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{gap.keyword}</span>
                      <Badge variant="outline">{gap.search_volume.toLocaleString()} searches</Badge>
                      <Badge className={gap.opportunity_score >= 70 ? 'bg-green-100 text-green-800' : 
                                       gap.opportunity_score >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-red-100 text-red-800'}>
                        {gap.opportunity_score}/100 opportunity
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Competitor rank: {gap.competitor_rank || 'Not ranked'} | 
                      Your rank: {gap.our_rank || 'Not ranked'} | 
                      Healthcare relevance: {gap.healthcare_relevance}/10
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Insights */}
      {selectedCompetitor && selectedCompetitor.performance_metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
            <CardDescription>Healthcare market analysis and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Content Strengths</h4>
                <ul className="text-sm space-y-1">
                  {selectedCompetitor.content_analysis.content_strengths?.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {strength}
                    </li>
                  )) || <li className="text-gray-500">No data available</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Content Weaknesses</h4>
                <ul className="text-sm space-y-1">
                  {selectedCompetitor.content_analysis.content_weaknesses?.map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      {weakness}
                    </li>
                  )) || <li className="text-gray-500">No data available</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
