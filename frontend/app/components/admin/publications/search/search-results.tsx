/**
 * Search Results Component - Story 3.7c Task 4
 * Display search results with highlighting, pagination, and sorting
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Search, 
  Users, 
  Calendar, 
  BookOpen, 
  ExternalLink,
  Download,
  Quote,
  Star,
  TrendingUp,
  Eye,
  Info
} from 'lucide-react'
import { SearchResult, SearchSortOption, SearchPagination } from '@/types/publications'
import { cn } from '@/lib/utils'

interface SearchResultsProps {
  results: SearchResult[]
  pagination?: SearchPagination
  query?: string
  isLoading?: boolean
  sortBy?: SearchSortOption
  onSortChange?: (sort: SearchSortOption) => void
  onPageChange?: (page: number) => void
  onResultClick?: (result: SearchResult) => void
  className?: string
}

export function SearchResults({ 
  results, 
  pagination,
  query = '',
  isLoading = false,
  sortBy = 'relevance',
  onSortChange,
  onPageChange,
  onResultClick,
  className 
}: SearchResultsProps) {
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())

  /**
   * Highlight search terms in text
   */
  const highlightText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text

    let highlightedText = text
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
    })
    
    return highlightedText
  }

  /**
   * Format author list
   */
  const formatAuthors = (authors: any[]) => {
    if (!authors || authors.length === 0) return 'Unknown Authors'
    
    const authorNames = authors.map(author => 
      typeof author === 'string' ? author : author.name || 'Unknown'
    )
    
    if (authorNames.length <= 3) {
      return authorNames.join(', ')
    }
    
    return `${authorNames.slice(0, 3).join(', ')}, et al.`
  }

  /**
   * Get relevance score color
   */
  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  /**
   * Handle result selection
   */
  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resultId)) {
        newSet.delete(resultId)
      } else {
        newSet.add(resultId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2">Searching publications...</span>
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <Alert className={className}>
        <Search className="h-4 w-4" />
        <AlertDescription>
          No publications found for "{query}". Try adjusting your search terms or filters.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {pagination?.total || 0} result{(pagination?.total || 0) !== 1 ? 's' : ''}
            {query && <span> for "{query}"</span>}
          </div>
          
          {selectedResults.size > 0 && (
            <Badge variant="secondary">
              {selectedResults.size} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="citations">Citations</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="author">Author</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((result) => (
          <Card 
            key={result.id} 
            className={cn(
              'transition-all cursor-pointer hover:shadow-md',
              selectedResults.has(result.id) && 'border-blue-200 bg-blue-50'
            )}
            onClick={() => {
              toggleResultSelection(result.id)
              onResultClick?.(result)
            }}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title and Relevance Score */}
                <div className="flex items-start justify-between gap-3">
                  <h3 
                    className="text-lg font-semibold leading-tight hover:text-blue-600 transition-colors flex-1"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(result.title, result.highlights?.title)
                    }}
                  />
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sortBy === 'relevance' && (
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getRelevanceColor(result.relevanceScore))}
                      >
                        {Math.round(result.relevanceScore)}%
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="text-xs">
                      {result.publicationType}
                    </Badge>
                  </div>
                </div>

                {/* Authors and Metadata */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span 
                      dangerouslySetInnerHTML={{
                        __html: highlightText(formatAuthors(result.authors), result.highlights?.authors)
                      }}
                    />
                  </div>
                  
                  {result.year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{result.year}</span>
                    </div>
                  )}
                  
                  {result.journal && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span className="truncate max-w-xs">{result.journal}</span>
                    </div>
                  )}
                </div>

                {/* Abstract */}
                {result.abstract && (
                  <p 
                    className="text-sm leading-relaxed line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(result.abstract, result.highlights?.abstract)
                    }}
                  />
                )}

                {/* Keywords */}
                {result.keywords && result.keywords.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Keywords:</span>
                    <div className="flex flex-wrap gap-1">
                      {result.keywords.slice(0, 5).map(keyword => (
                        <Badge 
                          key={keyword} 
                          variant="secondary" 
                          className="text-xs"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(keyword, result.highlights?.keywords)
                          }}
                        />
                      ))}
                      {result.keywords.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{result.keywords.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {result.citationCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Quote className="h-3 w-3" />
                        <span>{result.citationCount} citations</span>
                      </div>
                    )}
                    
                    {result.viewCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{result.viewCount} views</span>
                      </div>
                    )}
                    
                    {result.downloadCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{result.downloadCount} downloads</span>
                      </div>
                    )}
                    
                    {result.isOpenAccess && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                        Open Access
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {result.doi && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://doi.org/${result.doi}`, '_blank')
                        }}
                        className="text-xs h-7"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        DOI
                      </Button>
                    )}
                    
                    {result.pdfUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(result.pdfUrl, '_blank')
                        }}
                        className="text-xs h-7"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center mt-6">
          <Pagination>
            <PaginationContent>
              {pagination.hasPrev && (
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => onPageChange?.(pagination.page - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 7) {
                  pageNum = i + 1
                } else if (pagination.page <= 4) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 3) {
                  pageNum = pagination.totalPages - 6 + i
                } else {
                  pageNum = pagination.page - 3 + i
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange?.(pageNum)}
                      isActive={pageNum === pagination.page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              
              {pagination.hasNext && (
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => onPageChange?.(pagination.page + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results Summary */}
      {pagination && (
        <div className="text-center text-xs text-muted-foreground mt-4">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} results
        </div>
      )}
    </div>
  )
}