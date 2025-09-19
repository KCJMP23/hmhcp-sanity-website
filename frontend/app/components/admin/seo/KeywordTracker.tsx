// Keyword Tracker Component
// Created: 2025-01-27
// Purpose: Healthcare keyword tracking and visualization interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  SEOKeywordTracking, 
  SEOKeywordSearchRequest, 
  SEOKeywordSearchResponse 
} from '@/types/seo';

interface KeywordTrackerProps {
  organizationId: string;
}

export default function KeywordTracker({ organizationId }: KeywordTrackerProps) {
  const [keywords, setKeywords] = useState<SEOKeywordTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<SEOKeywordSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const healthcareCategories = [
    'all',
    'cardiology',
    'oncology',
    'neurology',
    'orthopedics',
    'dermatology',
    'general',
    'emergency',
    'pediatrics',
    'mental-health'
  ];

  useEffect(() => {
    loadKeywords();
  }, [organizationId, selectedCategory, complianceFilter]);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        organizationId,
        limit: '50'
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (complianceFilter !== 'all') {
        params.append('compliance', complianceFilter);
      }

      const response = await fetch(`/api/admin/seo/keywords?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load keywords');
      }

      const data = await response.json();
      setKeywords(data.keywords || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load keywords');
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;

    try {
      const response = await fetch('/api/admin/seo/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          keywords: [newKeyword.trim()],
          healthcareCategory: selectedCategory !== 'all' ? selectedCategory : 'general'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add keyword');
      }

      setNewKeyword('');
      loadKeywords(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add keyword');
    }
  };

  const searchKeywords = async () => {
    if (!newKeyword.trim()) return;

    try {
      setIsSearching(true);
      setError(null);

      const response = await fetch('/api/admin/seo/keywords/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: [newKeyword.trim()],
          healthcare_category: selectedCategory !== 'all' ? selectedCategory : undefined,
          organizationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search keywords');
      }

      const data = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search keywords');
    } finally {
      setIsSearching(false);
    }
  };

  const updateKeyword = async (keywordId: string, updates: Partial<SEOKeywordTracking>) => {
    try {
      const response = await fetch('/api/admin/seo/keywords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywordId,
          updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update keyword');
      }

      loadKeywords(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update keyword');
    }
  };

  const deleteKeyword = async (keywordId: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return;

    try {
      const response = await fetch(`/api/admin/seo/keywords?id=${keywordId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete keyword');
      }

      loadKeywords(); // Refresh the list

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete keyword');
    }
  };

  const getRankingColor = (position: number | null) => {
    if (!position) return 'text-gray-500';
    if (position <= 3) return 'text-green-600';
    if (position <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading keywords...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Keyword Tracker</h2>
          <p className="text-gray-600">Monitor healthcare keywords and their performance</p>
        </div>
        <div className="text-sm text-gray-500">
          {keywords.length} keywords tracked
        </div>
      </div>

      {/* Add New Keyword */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Keyword</CardTitle>
          <CardDescription>Track a new healthcare keyword for SEO monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter healthcare keyword..."
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {healthcareCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
              Add Keyword
            </Button>
            <Button onClick={searchKeywords} variant="outline" disabled={!newKeyword.trim() || isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Keyword research data from DataForSEO</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.keywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{keyword.keyword}</span>
                      <Badge variant="outline">{keyword.healthcare_relevance}/10</Badge>
                      {keyword.compliance_approved && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Compliant
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Volume: {keyword.search_volume.toLocaleString()} | 
                      Difficulty: {keyword.difficulty_score}/100 | 
                      CPC: ${keyword.cpc}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewKeyword(keyword.keyword);
                      addKeyword();
                    }}
                  >
                    Add to Tracking
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <Label htmlFor="category-filter">Category Filter</Label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {healthcareCategories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="compliance-filter">Compliance Filter</Label>
          <select
            id="compliance-filter"
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Keywords</option>
            <option value="true">Compliant Only</option>
            <option value="false">Non-Compliant Only</option>
          </select>
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

      {/* Keywords List */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Keywords</CardTitle>
          <CardDescription>Monitor keyword performance and compliance status</CardDescription>
        </CardHeader>
        <CardContent>
          {keywords.length > 0 ? (
            <div className="space-y-3">
              {keywords.map((keyword) => (
                <div key={keyword.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-lg">{keyword.keyword}</span>
                      <Badge variant="outline">{keyword.healthcare_category}</Badge>
                      {keyword.compliance_approved ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Compliant
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          Non-Compliant
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Position:</span>
                        <span className={`ml-1 font-medium ${getRankingColor(keyword.ranking_position)}`}>
                          {keyword.ranking_position || 'Not ranked'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Volume:</span>
                        <span className="ml-1 font-medium">
                          {keyword.search_volume ? keyword.search_volume.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Difficulty:</span>
                        <span className={`ml-1 font-medium ${getDifficultyColor(keyword.difficulty_score)}`}>
                          {keyword.difficulty_score || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <span className="ml-1 font-medium">
                          {new Date(keyword.tracking_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateKeyword(keyword.id, { 
                        compliance_approved: !keyword.compliance_approved 
                      })}
                    >
                      {keyword.compliance_approved ? 'Mark Non-Compliant' : 'Mark Compliant'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteKeyword(keyword.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Keywords Tracked</h3>
              <p className="text-gray-600 mb-4">Start by adding healthcare keywords to track their SEO performance</p>
              <Button onClick={() => setNewKeyword('')}>
                Add Your First Keyword
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
