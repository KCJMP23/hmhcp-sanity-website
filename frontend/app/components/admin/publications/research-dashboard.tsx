// Research Dashboard Component
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

'use client';

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, BookOpen, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useResearchIntegration } from '@/hooks/use-research-integration';
import { ResearchQuery, ResearchResult } from '@/types/publications';

interface ResearchDashboardProps {
  onImportPublication?: (publication: any) => void;
}

export function ResearchDashboard({ onImportPublication }: ResearchDashboardProps) {
  const { searchPublications, getTrendingTopics, getPublicationDetails, loading, error, lastResult } = useResearchIntegration();
  
  const [searchQuery, setSearchQuery] = useState<ResearchQuery>({
    keywords: [],
    specialty: '',
    publicationType: '',
    limit: 10
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('cardiology');

  const medicalSpecialties = [
    'cardiology', 'oncology', 'neurology', 'pediatrics', 'surgery',
    'psychiatry', 'dermatology', 'orthopedics', 'radiology', 'anesthesiology',
    'emergency medicine', 'family medicine', 'internal medicine', 'obstetrics',
    'gynecology', 'ophthalmology', 'otolaryngology', 'urology', 'pathology'
  ];

  const publicationTypes = [
    'peer-reviewed', 'case-study', 'review', 'editorial', 'conference-paper',
    'white-paper', 'meta-analysis', 'clinical-trial', 'systematic-review'
  ];

  // Load trending topics on component mount
  useEffect(() => {
    loadTrendingTopics();
  }, [selectedSpecialty]);

  const loadTrendingTopics = async () => {
    try {
      const result = await getTrendingTopics(selectedSpecialty, 'month');
      if (result.metadata?.trendingTopics) {
        setTrendingTopics(result.metadata.trendingTopics);
      }
    } catch (error) {
      console.error('Failed to load trending topics:', error);
    }
  };

  const handleSearch = async () => {
    try {
      const result = await searchPublications(searchQuery);
      setSearchResults(result.publications || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleImportPublication = (publication: any) => {
    if (onImportPublication) {
      onImportPublication(publication);
    }
  };

  const handleKeywordChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    setSearchQuery(prev => ({ ...prev, keywords }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Powered by Perplexity AI
        </Badge>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">Search Publications</TabsTrigger>
          <TabsTrigger value="trending">Trending Topics</TabsTrigger>
          <TabsTrigger value="details">Publication Details</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Research Publications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="Enter keywords separated by commas"
                    value={searchQuery.keywords?.join(', ') || ''}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="specialty">Medical Specialty</Label>
                  <Select
                    value={searchQuery.specialty || ''}
                    onValueChange={(value) => setSearchQuery(prev => ({ ...prev, specialty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicalSpecialties.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="publicationType">Publication Type</Label>
                  <Select
                    value={searchQuery.publicationType || ''}
                    onValueChange={(value) => setSearchQuery(prev => ({ ...prev, publicationType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {publicationTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('-', ' ').charAt(0).toUpperCase() + type.replace('-', ' ').slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="limit">Results Limit</Label>
                  <Select
                    value={searchQuery.limit?.toString() || '10'}
                    onValueChange={(value) => setSearchQuery(prev => ({ ...prev, limit: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 results</SelectItem>
                      <SelectItem value="10">10 results</SelectItem>
                      <SelectItem value="20">20 results</SelectItem>
                      <SelectItem value="50">50 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Publications
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({searchResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((publication, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{publication.title}</h3>
                          {publication.authors && (
                            <p className="text-sm text-gray-600 mt-1">{publication.authors}</p>
                          )}
                          {publication.journal && (
                            <p className="text-sm text-gray-500 mt-1">{publication.journal}</p>
                          )}
                          {publication.abstract && (
                            <p className="text-sm text-gray-700 mt-2 line-clamp-3">{publication.abstract}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {publication.doi && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://doi.org/${publication.doi}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              DOI
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImportPublication(publication)}
                          >
                            Import
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trending Topics Tab */}
        <TabsContent value="trending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Trending Research Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trendingSpecialty">Medical Specialty</Label>
                <Select
                  value={selectedSpecialty}
                  onValueChange={setSelectedSpecialty}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {medicalSpecialties.map(specialty => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={loadTrendingTopics} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Load Trending Topics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {trendingTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trending Topics in {selectedSpecialty.charAt(0).toUpperCase() + selectedSpecialty.slice(1)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trendingTopics.map((topic, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span className="text-sm text-gray-700">{topic}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Publication Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Publication Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Enter a DOI, PubMed ID, or publication title to get detailed information.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="publicationId">Publication ID</Label>
                  <Input
                    id="publicationId"
                    placeholder="Enter DOI, PMID, or title"
                  />
                </div>
                <div>
                  <Label htmlFor="sourceType">Source Type</Label>
                  <Select defaultValue="title">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doi">DOI</SelectItem>
                      <SelectItem value="pubmed">PubMed ID</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Get Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
