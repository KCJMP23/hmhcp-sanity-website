/**
 * Publication Interface - Story 3.7c Task 4
 * Main interface component that combines all publication features
 */

'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Quote, 
  Search, 
  GitBranch, 
  Download,
  BookOpen
} from 'lucide-react'

import { 
  CitationGenerator,
  CitationPreview,
  SearchBar,
  SearchFilters,
  SearchResults,
  VersionHistory,
  BulkExportConfig,
  PublicationErrorBoundary
} from './index'

import { useSearchApi } from '@/hooks/use-search-api'
import { Publication, SearchResult, ComparisonResult } from '@/types/publications'

interface PublicationInterfaceProps {
  publications: Publication[]
  className?: string
}

export function PublicationInterface({ 
  publications, 
  className 
}: PublicationInterfaceProps) {
  const [activeTab, setActiveTab] = useState('search')
  const [selectedPublications, setSelectedPublications] = useState<string[]>([])
  const [currentPublication, setCurrentPublication] = useState<Publication | null>(null)
  
  const {
    search,
    results,
    filters,
    updateFilters,
    clearFilters,
    metadata,
    hasResults,
    isSearching
  } = useSearchApi()

  /**
   * Handle search execution
   */
  const handleSearch = useCallback((query: string) => {
    search(query)
  }, [search])

  /**
   * Handle result selection
   */
  const handleResultClick = useCallback((result: SearchResult) => {
    const publication = publications.find(p => p.id === result.id)
    if (publication) {
      setCurrentPublication(publication)
      setActiveTab('versions')
    }
  }, [publications])

  /**
   * Handle publication selection for citation/export
   */
  const handlePublicationSelect = useCallback((publicationIds: string[]) => {
    setSelectedPublications(publicationIds)
  }, [])

  /**
   * Handle version comparison
   */
  const handleVersionComparison = useCallback((versionFrom: string, versionTo: string) => {
    // This would trigger version comparison interface
    console.log('Compare versions:', versionFrom, 'to', versionTo)
  }, [])

  return (
    <PublicationErrorBoundary>
      <div className={className}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            
            <TabsTrigger value="citations" className="flex items-center gap-2">
              <Quote className="h-4 w-4" />
              Citations
              {selectedPublications.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedPublications.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="versions" 
              className="flex items-center gap-2"
              disabled={!currentPublication}
            >
              <GitBranch className="h-4 w-4" />
              Versions
            </TabsTrigger>
            
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
              {selectedPublications.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedPublications.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Search Interface */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publication Search</CardTitle>
              </CardHeader>
              <CardContent>
                <SearchBar 
                  onSearch={handleSearch}
                  showTrending={true}
                  showMedicalTerms={true}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <SearchFilters
                  filters={filters}
                  facets={metadata.facets}
                  onFiltersChange={updateFilters}
                  onClearAll={clearFilters}
                />
              </div>
              
              <div className="lg:col-span-3">
                <SearchResults
                  results={results}
                  pagination={metadata}
                  isLoading={isSearching}
                  onResultClick={handleResultClick}
                />
              </div>
            </div>
          </TabsContent>

          {/* Citation Generator */}
          <TabsContent value="citations" className="space-y-6">
            <CitationGenerator
              publications={publications}
              selectedPublications={selectedPublications}
              onSelectionChange={handlePublicationSelect}
            />
          </TabsContent>

          {/* Version History */}
          <TabsContent value="versions" className="space-y-6">
            {currentPublication ? (
              <VersionHistory
                publicationId={currentPublication.id}
                onCompareVersions={handleVersionComparison}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a publication to view its version history</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bulk Export */}
          <TabsContent value="export" className="space-y-6">
            <BulkExportConfig
              selectedPublications={selectedPublications}
              onExportComplete={(progress) => {
                console.log('Export completed:', progress)
              }}
            />
          </TabsContent>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-center">
                    {publications.length}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    Total Publications
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-center">
                    {selectedPublications.length}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    Selected for Operations
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-center">
                    {results.length}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    Search Results
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-center">
                    {publications.filter(p => p.status === 'published').length}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    Published Publications
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Feature Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Citation Management</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Multiple citation formats (APA, MLA, Chicago, etc.)</li>
                      <li>Bulk citation generation</li>
                      <li>Citation validation and quality checks</li>
                      <li>Export to BibTeX, RIS, and other formats</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Advanced Search</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Full-text search with highlighting</li>
                      <li>Auto-complete suggestions</li>
                      <li>Faceted filtering</li>
                      <li>Medical term recognition</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Version Management</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Complete version history</li>
                      <li>Side-by-side version comparison</li>
                      <li>Version rollback functionality</li>
                      <li>Approval workflow</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Bulk Operations</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Multi-format export</li>
                      <li>Progress tracking</li>
                      <li>Download management</li>
                      <li>Export history</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PublicationErrorBoundary>
  )
}