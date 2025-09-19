// Local SEO Dashboard Component
// Created: 2025-01-27
// Purpose: Comprehensive local SEO management interface for healthcare facilities

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  HealthcareLocation,
  LocalSEOResult,
  LocalCitation,
  CitationReport,
  CitationPlatform
} from '@/types/seo';

interface LocalSEODashboardProps {
  organizationId: string;
}

export default function LocalSEODashboard({ organizationId }: LocalSEODashboardProps) {
  const [locations, setLocations] = useState<HealthcareLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<HealthcareLocation | null>(null);
  const [analysisResult, setAnalysisResult] = useState<LocalSEOResult | null>(null);
  const [citations, setCitations] = useState<LocalCitation[]>([]);
  const [citationReport, setCitationReport] = useState<CitationReport | null>(null);
  const [platforms, setPlatforms] = useState<CitationPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'citations' | 'gmb' | 'keywords'>('overview');

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load locations
      const locationsResponse = await fetch(`/api/admin/seo/local?organizationId=${organizationId}&type=locations`);
      if (!locationsResponse.ok) throw new Error('Failed to load locations');
      const locationsData = await locationsResponse.json();
      setLocations(locationsData.locations || []);

      // Load platforms
      const platformsResponse = await fetch(`/api/admin/seo/local?organizationId=${organizationId}&type=platforms&healthcareOnly=true`);
      if (!platformsResponse.ok) throw new Error('Failed to load platforms');
      const platformsData = await platformsResponse.json();
      setPlatforms(platformsData.platforms || []);

      // Select first location if available
      if (locationsData.locations && locationsData.locations.length > 0) {
        setSelectedLocation(locationsData.locations[0]);
        await loadLocationAnalysis(locationsData.locations[0].id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadLocationAnalysis = async (locationId: string) => {
    try {
      const response = await fetch(`/api/admin/seo/local?organizationId=${organizationId}&type=analysis&locationId=${locationId}`);
      if (!response.ok) throw new Error('Failed to load analysis');
      const data = await response.json();
      setAnalysisResult(data.analysis);

      // Load citations
      const citationsResponse = await fetch(`/api/admin/seo/local?organizationId=${organizationId}&type=citations&locationId=${locationId}`);
      if (citationsResponse.ok) {
        const citationsData = await citationsResponse.json();
        setCitations(citationsData.citations || []);
      }

      // Load citation report
      const reportResponse = await fetch(`/api/admin/seo/local?organizationId=${organizationId}&type=citation-report&locationId=${locationId}`);
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        setCitationReport(reportData.report);
      }

    } catch (err) {
      console.error('Failed to load location analysis:', err);
    }
  };

  const handleLocationSelect = async (location: HealthcareLocation) => {
    setSelectedLocation(location);
    await loadLocationAnalysis(location.id);
  };

  const handleOptimizeLocation = async () => {
    if (!selectedLocation || !analysisResult) return;

    try {
      const response = await fetch('/api/admin/seo/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimize-location',
          organizationId,
          locationId: selectedLocation.id,
          data: {
            optimizations: analysisResult.recommendations.map(rec => ({
              type: rec.type,
              priority: rec.priority,
              action: rec.action
            }))
          }
        })
      });

      if (!response.ok) throw new Error('Failed to optimize location');

      // Reload analysis
      await loadLocationAnalysis(selectedLocation.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize location');
    }
  };

  const handleSyncGMB = async () => {
    if (!selectedLocation) return;

    try {
      const response = await fetch('/api/admin/seo/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-gmb',
          organizationId,
          locationId: selectedLocation.id
        })
      });

      if (!response.ok) throw new Error('Failed to sync with Google My Business');

      // Reload analysis
      await loadLocationAnalysis(selectedLocation.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync with Google My Business');
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
          <p className="mt-2 text-sm text-gray-600">Loading local SEO data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Local SEO Management</h2>
          <p className="text-gray-600">Manage local SEO for healthcare facilities</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleSyncGMB}
            disabled={!selectedLocation}
          >
            Sync Google My Business
          </Button>
          <Button
            onClick={handleOptimizeLocation}
            disabled={!selectedLocation || !analysisResult}
          >
            Optimize Location
          </Button>
        </div>
      </div>

      {/* Location Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Location</CardTitle>
          <CardDescription>Choose a location to manage its local SEO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLocation?.id === location.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleLocationSelect(location)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{location.name}</h3>
                  {location.isPrimary && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Primary
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {location.address.street}, {location.address.city}, {location.address.state}
                </p>
                <div className="flex flex-wrap gap-1">
                  {location.specialties.slice(0, 2).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
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
      {selectedLocation && analysisResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Local SEO Analysis</CardTitle>
              <CardDescription>{selectedLocation.name} - Local SEO Performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                    {analysisResult.overallScore}
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResult.visibility.score)}`}>
                    {analysisResult.visibility.score}
                  </div>
                  <div className="text-sm text-gray-600">Visibility</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResult.citations.score)}`}>
                    {analysisResult.citations.score}
                  </div>
                  <div className="text-sm text-gray-600">Citations</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResult.reviews.score)}`}>
                    {analysisResult.reviews.score}
                  </div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                {analysisResult.recommendations.length} recommendations found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{recommendation.title}</h4>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        {recommendation.healthcareSpecific && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Healthcare
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                    <div className="text-sm">
                      <strong>Impact:</strong> {recommendation.impact}
                    </div>
                    <div className="text-sm mt-1">
                      <strong>Action:</strong> {recommendation.action}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Citation Report */}
          {citationReport && (
            <Card>
              <CardHeader>
                <CardTitle>Citation Report</CardTitle>
                <CardDescription>Citation management and platform coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {citationReport.submitted}
                    </div>
                    <div className="text-sm text-gray-600">Submitted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {citationReport.verified}
                    </div>
                    <div className="text-sm text-gray-600">Verified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {citationReport.errors}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(citationReport.score)}`}>
                    {citationReport.score}
                  </div>
                  <div className="text-sm text-gray-600">Citation Score</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Platforms */}
          <Card>
            <CardHeader>
              <CardTitle>Citation Platforms</CardTitle>
              <CardDescription>Available platforms for citation submission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{platform.name}</h4>
                      <Badge className={getPriorityColor(platform.priority)}>
                        {platform.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{platform.category}</p>
                    <div className="flex items-center space-x-2">
                      {platform.healthcareSpecific && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Healthcare
                        </Badge>
                      )}
                      {platform.apiSupported && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          API
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
