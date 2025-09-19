// Competitor Analysis Dashboard Component
// Created: 2025-01-27
// Purpose: Comprehensive competitor analysis and market intelligence interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CompetitorProfile,
  CompetitorAnalysisResult,
  KeywordGapAnalysis,
  MarketIntelligenceReport
} from '@/types/seo';

interface CompetitorAnalysisDashboardProps {
  organizationId: string;
}

export default function CompetitorAnalysisDashboard({ organizationId }: CompetitorAnalysisDashboardProps) {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<CompetitorAnalysisResult[]>([]);
  const [keywordGaps, setKeywordGaps] = useState<KeywordGapAnalysis[]>([]);
  const [marketReport, setMarketReport] = useState<MarketIntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'gaps' | 'market' | 'trends'>('overview');
  const [newCompetitor, setNewCompetitor] = useState({
    competitorName: '',
    competitorDomain: '',
    competitorType: 'hospital',
    healthcareSpecialty: '',
    location: { city: '', state: '', country: 'US' }
  });

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load competitors
      const competitorsResponse = await fetch(`/api/admin/seo/competitors?organizationId=${organizationId}&type=competitors`);
      if (!competitorsResponse.ok) throw new Error('Failed to load competitors');
      const competitorsData = await competitorsResponse.json();
      setCompetitors(competitorsData.competitors || []);

      // Load market trends
      const trendsResponse = await fetch(`/api/admin/seo/competitors?organizationId=${organizationId}&type=market-trends&specialty=cardiology`);
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        // Handle trends data
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async () => {
    try {
      const response = await fetch('/api/admin/seo/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track-competitor',
          organizationId,
          data: {
            competitorData: {
              ...newCompetitor,
              healthcareSpecialty: newCompetitor.healthcareSpecialty.split(',').map(s => s.trim()),
              marketPosition: 'follower',
              isActive: true
            }
          }
        })
      });

      if (!response.ok) throw new Error('Failed to add competitor');

      const data = await response.json();
      setCompetitors(prev => [...prev, data.competitor]);
      setNewCompetitor({
        competitorName: '',
        competitorDomain: '',
        competitorType: 'hospital',
        healthcareSpecialty: '',
        location: { city: '', state: '', country: 'US' }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitor');
    }
  };

  const handleAnalyzeCompetitor = async (competitorId: string) => {
    try {
      const response = await fetch('/api/admin/seo/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze-competitor',
          organizationId,
          competitorId
        })
      });

      if (!response.ok) throw new Error('Failed to analyze competitor');

      const data = await response.json();
      setAnalysisResults(prev => [...prev.filter(r => r.competitorId !== competitorId), data.analysis]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze competitor');
    }
  };

  const handleAnalyzeKeywordGaps = async () => {
    if (selectedCompetitors.length === 0) {
      setError('Please select at least one competitor');
      return;
    }

    try {
      const response = await fetch('/api/admin/seo/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze-keyword-gaps',
          organizationId,
          competitorIds: selectedCompetitors
        })
      });

      if (!response.ok) throw new Error('Failed to analyze keyword gaps');

      const data = await response.json();
      setKeywordGaps(data.keywordGaps);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze keyword gaps');
    }
  };

  const handleGenerateMarketReport = async () => {
    try {
      const response = await fetch('/api/admin/seo/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-market-report',
          organizationId,
          specialty: 'cardiology',
          region: 'US'
        })
      });

      if (!response.ok) throw new Error('Failed to generate market report');

      const data = await response.json();
      setMarketReport(data.report);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate market report');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading competitor analysis data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Competitor Analysis</h2>
          <p className="text-gray-600">Analyze competitors and market trends</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateMarketReport}
            variant="outline"
          >
            Generate Market Report
          </Button>
          <Button
            onClick={handleAnalyzeKeywordGaps}
            disabled={selectedCompetitors.length === 0}
          >
            Analyze Keyword Gaps
          </Button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'competitors', name: 'Competitors' },
            { id: 'gaps', name: 'Keyword Gaps' },
            { id: 'market', name: 'Market Intelligence' },
            { id: 'trends', name: 'Trends' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tracked Competitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{competitors.length}</div>
                <p className="text-xs text-gray-600">Active competitors</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Analyses Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResults.length}</div>
                <p className="text-xs text-gray-600">Recent analyses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Keyword Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {keywordGaps.reduce((sum, gap) => sum + gap.opportunityKeywords.length, 0)}
                </div>
                <p className="text-xs text-gray-600">Opportunities found</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Market Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {marketReport?.marketTrends.length || 0}
                </div>
                <p className="text-xs text-gray-600">Active trends</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Analyses */}
          {analysisResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>Latest competitor analysis results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.slice(0, 3).map((result) => (
                    <div key={result.competitorId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Competitor Analysis</h4>
                        <div className={`text-lg font-bold ${getScoreColor(result.overallScore)}`}>
                          {result.overallScore}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Strengths:</span> {result.strengths.length}
                        </div>
                        <div>
                          <span className="text-gray-600">Weaknesses:</span> {result.weaknesses.length}
                        </div>
                        <div>
                          <span className="text-gray-600">Opportunities:</span> {result.opportunities.length}
                        </div>
                        <div>
                          <span className="text-gray-600">Recommendations:</span> {result.recommendations.length}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          {/* Add Competitor Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Competitor</CardTitle>
              <CardDescription>Track a new competitor for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="competitorName">Competitor Name</Label>
                  <Input
                    id="competitorName"
                    value={newCompetitor.competitorName}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, competitorName: e.target.value }))}
                    placeholder="Enter competitor name"
                  />
                </div>
                <div>
                  <Label htmlFor="competitorDomain">Domain</Label>
                  <Input
                    id="competitorDomain"
                    value={newCompetitor.competitorDomain}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, competitorDomain: e.target.value }))}
                    placeholder="competitor.com"
                  />
                </div>
                <div>
                  <Label htmlFor="competitorType">Type</Label>
                  <select
                    id="competitorType"
                    value={newCompetitor.competitorType}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, competitorType: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                    <option value="medical-practice">Medical Practice</option>
                    <option value="dental-practice">Dental Practice</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="healthcare-system">Healthcare System</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="healthcareSpecialty">Specialties (comma-separated)</Label>
                  <Input
                    id="healthcareSpecialty"
                    value={newCompetitor.healthcareSpecialty}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, healthcareSpecialty: e.target.value }))}
                    placeholder="cardiology, oncology, neurology"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newCompetitor.location.city}
                    onChange={(e) => setNewCompetitor(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value }
                    }))}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newCompetitor.location.state}
                    onChange={(e) => setNewCompetitor(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, state: e.target.value }
                    }))}
                    placeholder="Enter state"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleAddCompetitor}>
                  Add Competitor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Competitors List */}
          <Card>
            <CardHeader>
              <CardTitle>Tracked Competitors</CardTitle>
              <CardDescription>Manage and analyze your competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{competitor.competitorName}</h4>
                        <p className="text-sm text-gray-600">{competitor.competitorDomain}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{competitor.competitorType}</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleAnalyzeCompetitor(competitor.id)}
                        >
                          Analyze
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {competitor.healthcareSpecialty.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {competitor.location.city}, {competitor.location.state} • 
                      Last updated: {new Date(competitor.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyword Gaps Tab */}
      {activeTab === 'gaps' && (
        <div className="space-y-6">
          {/* Competitor Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Competitors for Gap Analysis</CardTitle>
              <CardDescription>Choose competitors to analyze keyword gaps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {competitors.map((competitor) => (
                  <label key={competitor.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCompetitors.includes(competitor.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCompetitors(prev => [...prev, competitor.id]);
                        } else {
                          setSelectedCompetitors(prev => prev.filter(id => id !== competitor.id));
                        }
                      }}
                    />
                    <span>{competitor.competitorName}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyword Gaps Results */}
          {keywordGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Keyword Gap Analysis</CardTitle>
                <CardDescription>Opportunities to improve keyword rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywordGaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">vs {competitors.find(c => c.id === gap.competitorId)?.competitorName}</h4>
                        <div className={`text-lg font-bold ${getScoreColor(gap.gapScore)}`}>
                          {gap.gapScore}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Our Keywords:</span> {gap.ourKeywords}
                        </div>
                        <div>
                          <span className="text-gray-600">Competitor Keywords:</span> {gap.competitorKeywords}
                        </div>
                        <div>
                          <span className="text-gray-600">Shared Keywords:</span> {gap.sharedKeywords}
                        </div>
                        <div>
                          <span className="text-gray-600">Opportunities:</span> {gap.opportunityKeywords.length}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">Top Opportunities:</h5>
                        {gap.opportunityKeywords.slice(0, 5).map((opp, oppIndex) => (
                          <div key={oppIndex} className="flex items-center justify-between text-sm">
                            <span>{opp.keyword}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">Vol: {opp.searchVolume}</span>
                              <span className="text-gray-600">Diff: {opp.difficulty}</span>
                              <Badge className={getPriorityColor(opp.opportunityScore > 80 ? 'high' : 'medium')}>
                                {opp.opportunityScore}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Market Intelligence Tab */}
      {activeTab === 'market' && marketReport && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Intelligence Report</CardTitle>
              <CardDescription>Healthcare market analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Executive Summary</h4>
                  <p className="text-sm text-gray-600">{marketReport.executiveSummary}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Market Trends</h4>
                  <div className="space-y-2">
                    {marketReport.marketTrends.map((trend, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium">{trend.title}</h5>
                          <Badge className={getPriorityColor(trend.impact)}>
                            {trend.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{trend.description}</p>
                        <div className="text-xs text-gray-500">
                          Confidence: {trend.confidence}% • {trend.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Industry Benchmark</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{marketReport.industryBenchmark.metrics.averageOrganicTraffic.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Avg Traffic</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{marketReport.industryBenchmark.metrics.averageDomainAuthority}</div>
                      <div className="text-xs text-gray-600">Avg DA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{marketReport.industryBenchmark.metrics.averagePageSpeed}</div>
                      <div className="text-xs text-gray-600">Avg Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{marketReport.industryBenchmark.metrics.averageBacklinks.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Avg Backlinks</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
