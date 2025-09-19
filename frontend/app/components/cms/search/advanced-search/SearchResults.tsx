'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search,
  FileText,
  Image,
  User,
  Clock,
  Eye,
  Edit,
  Share2,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'
import { SearchResult } from './types'

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  hasActiveFilters: boolean
  query: string
  onClearFilters: () => void
  onResultSelect?: (result: SearchResult) => void
}

export function SearchResultsComponent({
  results,
  loading,
  hasActiveFilters,
  query,
  onClearFilters,
  onResultSelect
}: SearchResultsProps) {
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'page':
        return <FileText className="w-4 h-4" />
      case 'media':
        return <Image className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'archived':
        return 'bg-red-100 text-red-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 w-5/6"></div>
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 w-24"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    if (query || hasActiveFilters) {
      return (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Results Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search terms or filters.
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </Card>
      )
    }

    return (
      <Card className="p-8 text-center">
        <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Start Searching</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Enter a search term or use filters to find content.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card 
          key={result.id} 
          className="p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onResultSelect?.(result)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-800">
                  {getContentIcon(result.contentType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">
                      {result.title}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(result.status)}
                    >
                      {result.status}
                    </Badge>
                    {result.score > 0.8 && (
                      <Badge variant="outline" className="text-xs">
                        Best Match
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {result.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {result.author.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(result.updatedAt), 'MMM dd, yyyy')}
                    </div>
                    <div>
                      {result.wordCount} words
                    </div>
                    {result.hasMedia && (
                      <div className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {result.mediaCount} media
                      </div>
                    )}
                  </div>
                  
                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {result.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {result.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Relevance Score Indicator */}
          {result.score > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Relevance</span>
                <span className="font-medium">{Math.round(result.score * 100)}%</span>
              </div>
              <Progress value={result.score * 100} className="mt-1 h-1" />
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}