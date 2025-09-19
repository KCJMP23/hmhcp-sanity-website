// Content Optimization Dashboard Component
// Created: 2025-01-27
// Purpose: Comprehensive content optimization interface for healthcare websites

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ContentOptimizationResult,
  ContentSuggestion,
  KeywordOptimization,
  MedicalContent
} from '@/types/seo';

interface ContentOptimizationDashboardProps {
  organizationId: string;
}

export default function ContentOptimizationDashboard({ organizationId }: ContentOptimizationDashboardProps) {
  const [content, setContent] = useState<MedicalContent>({
    title: '',
    content: '',
    url: '',
    contentType: 'general',
    medicalSpecialty: '',
    targetAudience: 'patients'
  });
  
  const [optimizationResult, setOptimizationResult] = useState<ContentOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'optimize' | 'schema' | 'medical'>('optimize');

  const contentTypes = [
    { value: 'article', label: 'Article' },
    { value: 'service', label: 'Service' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'condition', label: 'Condition' },
    { value: 'provider', label: 'Provider' },
    { value: 'general', label: 'General' }
  ];

  const targetAudiences = [
    { value: 'patients', label: 'Patients' },
    { value: 'professionals', label: 'Healthcare Professionals' },
    { value: 'general', label: 'General Public' },
    { value: 'mixed', label: 'Mixed Audience' }
  ];

  const medicalSpecialties = [
    'cardiology', 'oncology', 'neurology', 'orthopedics', 'dermatology',
    'pediatrics', 'mental-health', 'emergency-medicine', 'internal-medicine', 'general'
  ];

  const handleOptimizeContent = async () => {
    if (!content.title || !content.content) {
      setError('Please provide both title and content');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/seo/content/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimize',
          content,
          organizationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize content');
      }

      const data = await response.json();
      setOptimizationResult(data.optimization);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize content');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateMedicalAccuracy = async () => {
    if (!content.title || !content.content) {
      setError('Please provide both title and content');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/seo/content/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate-medical-accuracy',
          content,
          organizationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to validate medical accuracy');
      }

      const data = await response.json();
      // Handle medical accuracy results
      console.log('Medical accuracy validation:', data.medicalAccuracy);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate medical accuracy');
    } finally {
      setLoading(false);
    }
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

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Content Optimization</h2>
          <p className="text-gray-600">Optimize healthcare content for SEO and medical accuracy</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleValidateMedicalAccuracy}
            disabled={loading}
          >
            Validate Medical Accuracy
          </Button>
          <Button
            onClick={handleOptimizeContent}
            disabled={loading}
          >
            {loading ? 'Optimizing...' : 'Optimize Content'}
          </Button>
        </div>
      </div>

      {/* Content Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Content Input</CardTitle>
          <CardDescription>Enter your healthcare content for optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Content Title</Label>
                <Input
                  id="title"
                  value={content.title}
                  onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title..."
                />
              </div>
              <div>
                <Label htmlFor="url">URL (Optional)</Label>
                <Input
                  id="url"
                  value={content.url}
                  onChange={(e) => setContent(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/page"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contentType">Content Type</Label>
                <select
                  id="contentType"
                  value={content.contentType}
                  onChange={(e) => setContent(prev => ({ ...prev, contentType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {contentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="specialty">Medical Specialty</Label>
                <select
                  id="specialty"
                  value={content.medicalSpecialty || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, medicalSpecialty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select specialty...</option>
                  {medicalSpecialties.map(specialty => (
                    <option key={specialty} value={specialty}>
                      {specialty.charAt(0).toUpperCase() + specialty.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <select
                  id="audience"
                  value={content.targetAudience}
                  onChange={(e) => setContent(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {targetAudiences.map(audience => (
                    <option key={audience.value} value={audience.value}>
                      {audience.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content.content}
                onChange={(e) => setContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your healthcare content here..."
                rows={8}
                className="w-full"
              />
            </div>
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

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Results</CardTitle>
              <CardDescription>Overall content optimization analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(optimizationResult.overallScore)}`}>
                    {optimizationResult.overallScore}
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(optimizationResult.seoScore)}`}>
                    {optimizationResult.seoScore}
                  </div>
                  <div className="text-sm text-gray-600">SEO Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(optimizationResult.readabilityScore)}`}>
                    {optimizationResult.readabilityScore}
                  </div>
                  <div className="text-sm text-gray-600">Readability</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(optimizationResult.medicalAccuracy)}`}>
                    {optimizationResult.medicalAccuracy}
                  </div>
                  <div className="text-sm text-gray-600">Medical Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Actions */}
          {optimizationResult.priorityActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Priority Actions</CardTitle>
                <CardDescription>Most important improvements to make</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {optimizationResult.priorityActions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>
                {optimizationResult.suggestions.length} suggestions found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationResult.suggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        {suggestion.healthcareSpecific && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Healthcare
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Effort: <span className={getEffortColor(suggestion.effort)}>{suggestion.effort}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <div className="text-sm">
                      <strong>Impact:</strong> {suggestion.impact}
                    </div>
                    {suggestion.currentValue && (
                      <div className="text-sm mt-1">
                        <strong>Current:</strong> {suggestion.currentValue}
                      </div>
                    )}
                    {suggestion.suggestedValue && (
                      <div className="text-sm mt-1">
                        <strong>Suggested:</strong> {suggestion.suggestedValue}
                      </div>
                    )}
                    {suggestion.codeExample && (
                      <div className="mt-2">
                        <Label className="text-xs text-gray-500">Code Example:</Label>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {suggestion.codeExample}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyword Optimization */}
          {optimizationResult.keywordOptimization && (
            <Card>
              <CardHeader>
                <CardTitle>Keyword Analysis</CardTitle>
                <CardDescription>Primary and secondary keyword optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Primary Keywords</h4>
                    <div className="space-y-2">
                      {optimizationResult.keywordOptimization.primaryKeywords.map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">{keyword.keyword}</span>
                          <div className="text-sm text-gray-600">
                            Density: {keyword.currentDensity.toFixed(1)}% / {keyword.optimalDensity}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {optimizationResult.keywordOptimization.missingKeywords.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {optimizationResult.keywordOptimization.missingKeywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-yellow-100 text-yellow-800">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
