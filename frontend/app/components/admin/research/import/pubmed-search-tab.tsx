'use client'

import { useState } from 'react'
import { Search, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Publication } from '@/types/publications'

interface PubMedResult {
  pmid: string
  title: string
  authors: string[]
  journal: string
  year: number
  abstract: string
  doi?: string
  selected: boolean
}

interface PubMedSearchTabProps {
  onImportSuccess: (publications: Publication[]) => void
  onImportError: (error: string) => void
  onImportProgress: (successful: number, failed: number, total: number) => void
  disabled?: boolean
}

export default function PubMedSearchTab({
  onImportSuccess,
  onImportError,
  onImportProgress,
  disabled = false
}: PubMedSearchTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [searchResults, setSearchResults] = useState<PubMedResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  // Handle PubMed search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])

    try {
      const response = await fetch('/api/admin/publications/import/pubmed/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: maxResults
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search PubMed')
      }

      const data = await response.json()
      const resultsWithSelection = data.results.map((result: PubMedResult) => ({
        ...result,
        selected: true // Select all by default
      }))
      
      setSearchResults(resultsWithSelection)
    } catch (error) {
      console.error('PubMed search error:', error)
      setSearchError(error instanceof Error ? error.message : 'An error occurred while searching')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle individual result selection
  const handleResultToggle = (pmid: string) => {
    setSearchResults(prev => 
      prev.map(result => 
        result.pmid === pmid 
          ? { ...result, selected: !result.selected }
          : result
      )
    )
  }

  // Handle select all/none
  const handleSelectAll = (selectAll: boolean) => {
    setSearchResults(prev => 
      prev.map(result => ({ ...result, selected: selectAll }))
    )
  }

  // Handle import selected publications
  const handleImport = async () => {
    const selectedResults = searchResults.filter(result => result.selected)
    
    if (selectedResults.length === 0) {
      setSearchError('Please select at least one publication to import')
      return
    }

    setIsImporting(true)
    setSearchError(null)

    try {
      let successful = 0
      let failed = 0
      const total = selectedResults.length
      const importedPublications: Publication[] = []

      // Update progress
      onImportProgress(0, 0, total)

      for (const result of selectedResults) {
        try {
          const response = await fetch('/api/admin/publications/import/pubmed/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pmid: result.pmid,
              title: result.title,
              authors: result.authors,
              journal: result.journal,
              year: result.year,
              abstract: result.abstract,
              doi: result.doi
            })
          })

          if (response.ok) {
            const importedPub = await response.json()
            importedPublications.push(importedPub.publication)
            successful++
          } else {
            failed++
          }
        } catch (error) {
          console.error(`Failed to import PMID ${result.pmid}:`, error)
          failed++
        }

        // Update progress
        onImportProgress(successful, failed, total)
      }

      if (successful > 0) {
        onImportSuccess(importedPublications)
      } else {
        onImportError(`Failed to import all ${total} publications`)
      }
    } catch (error) {
      console.error('Import error:', error)
      onImportError(error instanceof Error ? error.message : 'An error occurred during import')
    } finally {
      setIsImporting(false)
    }
  }

  const selectedCount = searchResults.filter(r => r.selected).length

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            PubMed Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="search-query">Search Query</Label>
              <Input
                id="search-query"
                placeholder="e.g., diabetes AND treatment, author name, or specific terms"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={disabled || isSearching}
                onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
              />
              <p className="text-xs text-muted-foreground">
                Use PubMed search syntax: AND, OR, NOT, quotes for phrases, [author] for specific fields
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-results">Max Results</Label>
              <Input
                id="max-results"
                type="number"
                min="1"
                max="100"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 20)}
                disabled={disabled || isSearching}
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={disabled || isSearching || !searchQuery.trim()}
            className="w-full sm:w-auto"
          >
            {isSearching ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Searching PubMed...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search PubMed
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Error */}
      {searchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                Search Results ({searchResults.length} found)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                  disabled={disabled || isImporting}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(false)}
                  disabled={disabled || isImporting}
                >
                  Select None
                </Button>
              </div>
            </div>
            {selectedCount > 0 && (
              <div className="flex justify-between items-center">
                <Badge variant="secondary">
                  {selectedCount} selected for import
                </Badge>
                <Button
                  onClick={handleImport}
                  disabled={disabled || isImporting || selectedCount === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Import Selected ({selectedCount})
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((result) => (
                <div key={result.pmid} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={result.selected}
                      onCheckedChange={() => handleResultToggle(result.pmid)}
                      disabled={disabled || isImporting}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-sm leading-relaxed">
                        {result.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">PMID: {result.pmid}</Badge>
                        <Badge variant="outline">{result.journal}</Badge>
                        <Badge variant="outline">{result.year}</Badge>
                        {result.doi && (
                          <Badge variant="outline">DOI: {result.doi}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Authors:</strong> {result.authors.slice(0, 3).join(', ')}
                        {result.authors.length > 3 && `, et al. (${result.authors.length} total)`}
                      </p>
                      {result.abstract && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <strong>Abstract:</strong> {result.abstract.slice(0, 200)}
                          {result.abstract.length > 200 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">Search Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-800 space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <strong>Basic search:</strong>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>diabetes treatment</li>
                <li>COVID-19 vaccine</li>
                <li>"machine learning"</li>
              </ul>
            </div>
            <div>
              <strong>Advanced search:</strong>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Smith J[author]</li>
                <li>Nature[journal]</li>
                <li>2020:2024[pdat]</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}