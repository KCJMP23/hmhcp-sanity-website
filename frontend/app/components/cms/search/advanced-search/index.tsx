'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { 
  SearchFilters, 
  SearchResult, 
  AdvancedSearchProps,
  defaultFilters 
} from './types'
import { SearchFiltersComponent } from './SearchFilters'
import { SearchResultsComponent } from './SearchResults'
import { SearchPagination } from './SearchPagination'
import { logger } from '@/lib/logger';

// Mock data - replace with actual API calls
const mockAuthors = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Bob Johnson' }
]

const mockTags = ['healthcare', 'technology', 'news', 'update', 'announcement', 'feature']
const mockCategories = ['Company News', 'Product Updates', 'Healthcare', 'Technology']

export function AdvancedSearch({ className, onResultSelect }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [savedSearches, setSavedSearches] = useState<SearchFilters[]>([])
  
  const debouncedQuery = useDebounce(filters.query, 500)
  const resultsPerPage = 20

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.contentType.length > 0) count++
    if (filters.status.length > 0) count++
    if (filters.author.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.tags.length > 0) count++
    if (filters.category.length > 0) count++
    if (filters.hasMedia !== null) count++
    if (filters.wordCount.min || filters.wordCount.max) count++
    return count
  }

  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0
  }

  // Search function
  const performSearch = useCallback(async () => {
    if (!debouncedQuery && !hasActiveFilters()) {
      setResults([])
      setTotalResults(0)
      return
    }

    setLoading(true)
    
    try {
      // Production API call to search endpoint
      const response = await fetch('/api/cms/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: debouncedQuery,
          filters: {
            contentType: filters.contentType.length > 0 ? filters.contentType : undefined,
            status: filters.status.length > 0 ? filters.status : undefined,
            author: filters.author.length > 0 ? filters.author : undefined,
            dateRange: filters.dateRange
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      setResults(data.results || [])
      setTotalResults(data.totalCount || 0)
    } catch (error) {
      logger.error('Search error:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      setResults([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, filters, currentPage])

  // Perform search when filters or page changes
  useEffect(() => {
    performSearch()
  }, [performSearch])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const clearFilters = () => {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  const saveSearch = () => {
    setSavedSearches([...savedSearches, filters])
  }

  const exportResults = () => {
    // Production implementation: Export search results as CSV
    const csvContent = results.map(result => ({
      title: result.title,
      contentType: result.contentType,
      status: result.status,
      author: result.author,
      createdAt: result.createdAt,
      url: result.url
    }))
    
    const csvString = [
      'Title,Content Type,Status,Author,Created At,URL',
      ...csvContent.map(row => 
        `"${row.title}","${row.contentType}","${row.status}","${row.author}","${row.createdAt}","${row.url}"`
      )
    ].join('\n')
    
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Header */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search content..."
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              className="pl-10 pr-4"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <SearchFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              activeFilterCount={getActiveFilterCount()}
              authors={mockAuthors}
              tags={mockTags}
              categories={mockCategories}
            />
            
            <Button variant="outline" onClick={saveSearch}>
              <Bookmark className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" onClick={exportResults}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        {(debouncedQuery || hasActiveFilters()) && !loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found <strong>{totalResults}</strong> results
              {debouncedQuery && (
                <> for "<strong>{debouncedQuery}</strong>"</>
              )}
            </p>
            
            {/* Active Filters */}
            {hasActiveFilters() && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                <Badge variant="secondary">
                  {getActiveFilterCount()} filters
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      <SearchResultsComponent
        results={results}
        loading={loading}
        hasActiveFilters={hasActiveFilters()}
        query={debouncedQuery}
        onClearFilters={clearFilters}
        onResultSelect={onResultSelect}
      />

      {/* Pagination */}
      {results.length > 0 && (
        <SearchPagination
          currentPage={currentPage}
          totalResults={totalResults}
          resultsPerPage={resultsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}