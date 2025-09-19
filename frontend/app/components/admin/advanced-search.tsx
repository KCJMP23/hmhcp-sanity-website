'use client'

/**
 * Advanced Admin Search Component
 * Comprehensive search interface with faceted filtering, real-time suggestions, and healthcare-specific features
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
// import { debounce } from '@/lib/utils'

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Filter,
  X,
  ChevronDown,
  Clock,
  Bookmark,
  Settings,
  TrendingUp,
  FileText,
  Users,
  Image,
  Calendar,
  Tag,
  Star,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getSupabaseImageUrl } from '@/lib/supabase-content'
import { TooltipProvider } from '@/components/ui/tooltip'

// Advanced TypeScript Types
import type {
  SearchableContentType,
  SearchableContent,
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchSuggestion,
  SearchFacetResults,
  SearchOptions,
  SavedSearch,
  SearchPreset,
  HealthcareContentType
} from '@/lib/search/types'

// ============================================================================
// COMPONENT PROPS AND STATE INTERFACES
// ============================================================================

interface AdvancedSearchProps {
  onSearch: (query: SearchQuery<SearchableContentType>) => Promise<SearchResponse<SearchableContentType>>
  onSuggestions?: (query: string) => Promise<SearchSuggestion[]>
  savedSearches?: SavedSearch[]
  searchPresets?: SearchPreset[]
  className?: string
  initialQuery?: Partial<SearchQuery<SearchableContentType>>
  healthcareMode?: boolean
}

interface SearchState {
  query: string
  contentTypes: SearchableContentType[]
  filters: SearchFilters
  options: SearchOptions
  facets: SearchFacetResults<SearchableContentType>
  suggestions: SearchSuggestion[]
  results: SearchResult<SearchableContentType>[]
  isLoading: boolean
  showAdvanced: boolean
  selectedSavedSearch?: string
  recentSearches: string[]
}

interface SearchFilters {
  status: string[]
  dateRange: {
    field: 'createdAt' | 'updatedAt' | 'publishedAt'
    from: string
    to: string
  } | null
  authors: string[]
  tags: string[]
  categories: string[]
  customFilters: Record<string, any>
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onSuggestions,
  savedSearches = [],
  searchPresets = [],
  className = '',
  initialQuery = {},
  healthcareMode = false
}) => {
  // State Management with Advanced TypeScript
  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery.query || '',
    contentTypes: [...(initialQuery.contentTypes || [])],
    filters: {
      status: [],
      dateRange: null,
      authors: [],
      tags: [],
      categories: [],
      customFilters: {}
    },
    options: {
      fuzzy: false,
      typoTolerance: 0,
      highlight: true,
      includeMetadata: true,
      caseSensitive: false,
      wholeWord: false,
      regex: false,
      synonyms: true,
      stemming: true,
      stopWords: true,
      cache: true,
      explain: false
    },
    facets: {},
    suggestions: [],
    results: [],
    isLoading: false,
    showAdvanced: false,
    recentSearches: []
  })

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search for real-time suggestions
  const debouncedQuery = useDebounce(searchState.query, 300)

  // Content type icons mapping
  const contentTypeIcons = useMemo<Record<SearchableContentType, React.ComponentType<{ className?: string }>>>(() => ({
    posts: FileText,
    pages: FileText,
    users: Users,
    media: Image,
    categories: Tag,
    tags: Tag,
    comments: FileText,
    clinical_trials: Star,
    publications: FileText,
    quality_studies: TrendingUp,
    platforms: Zap,
    patient_education: FileText,
    healthcare_reports: FileText,
    research_data: TrendingUp,
    settings: Settings
  }), [])

  // Healthcare-specific content types
  const healthcareContentTypes: HealthcareContentType[] = [
    'clinical_trials',
    'publications',
    'quality_studies',
    'patient_education',
    'healthcare_reports',
    'research_data'
  ]

  // Available content types based on mode
  const availableContentTypes = useMemo(() => {
    const allTypes: SearchableContentType[] = [
      'posts', 'pages', 'users', 'media', 'categories', 'tags', 'comments',
      'clinical_trials', 'publications', 'quality_studies', 'platforms',
      'patient_education', 'healthcare_reports', 'research_data', 'settings'
    ]
    
    return healthcareMode 
      ? allTypes.filter(type => healthcareContentTypes.includes(type as HealthcareContentType) || ['posts', 'pages', 'users', 'media'].includes(type))
      : allTypes
  }, [healthcareMode, healthcareContentTypes])

  // Real-time suggestions effect
  useEffect(() => {
    if (debouncedQuery.length >= 2 && onSuggestions) {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
      
      suggestionTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await onSuggestions(debouncedQuery)
          setSearchState(prev => ({ ...prev, suggestions }))
        } catch (error) {
          console.error('Failed to fetch suggestions:', error)
        }
      }, 100)
    } else {
      setSearchState(prev => ({ ...prev, suggestions: [] }))
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
        suggestionTimeoutRef.current = null
      }
    }
  }, [debouncedQuery, onSuggestions])

  // Search execution
  const executeSearch = useCallback(async (customQuery?: Partial<SearchQuery<SearchableContentType>>) => {
    if (!searchState.query.trim()) return

    setSearchState(prev => ({ ...prev, isLoading: true }))

    try {
      const query: SearchQuery<SearchableContentType> = {
        query: searchState.query,
        contentTypes: searchState.contentTypes.length > 0 ? searchState.contentTypes : availableContentTypes,
        filters: {
          status: searchState.filters.status.length > 0 ? searchState.filters.status as any : undefined,
          dateRange: searchState.filters.dateRange || undefined,
          author: searchState.filters.authors.length > 0 ? searchState.filters.authors : undefined,
          tags: searchState.filters.tags.length > 0 ? searchState.filters.tags : undefined,
          categories: searchState.filters.categories.length > 0 ? searchState.filters.categories : undefined,
          ...searchState.filters.customFilters
        } as any,
        sort: {
          field: 'relevance',
          direction: 'desc'
        },
        pagination: {
          page: 1,
          limit: 20
        },
        options: searchState.options,
        ...customQuery
      }

      const response = await onSearch(query)
      
      setSearchState(prev => ({
        ...prev,
        results: [...response.results],
        facets: response.facets ? { ...response.facets } as any : {},
        isLoading: false,
        recentSearches: [searchState.query, ...prev.recentSearches.filter(q => q !== searchState.query)].slice(0, 10)
      }))
    } catch (error) {
      console.error('Search failed:', error)
      setSearchState(prev => ({ ...prev, isLoading: false }))
    }
  }, [searchState, onSearch, availableContentTypes])

  // Event handlers with TypeScript constraints
  const handleQueryChange = useCallback((value: string) => {
    setSearchState(prev => ({ ...prev, query: value }))
  }, [])

  const handleContentTypeToggle = useCallback((contentType: SearchableContentType, checked: boolean) => {
    setSearchState(prev => ({
      ...prev,
      contentTypes: checked 
        ? [...prev.contentTypes, contentType]
        : prev.contentTypes.filter(type => type !== contentType)
    }))
  }, [])

  const handleFilterChange = useCallback(<K extends keyof SearchFilters>(
    filterKey: K,
    value: SearchFilters[K]
  ) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterKey]: value }
    }))
  }, [])

  const handleOptionChange = useCallback(<K extends keyof SearchOptions>(
    optionKey: K,
    value: SearchOptions[K]
  ) => {
    setSearchState(prev => ({
      ...prev,
      options: { ...prev.options, [optionKey]: value }
    }))
  }, [])

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearchState(prev => ({
      ...prev,
      query: suggestion.text,
      suggestions: []
    }))
    searchInputRef.current?.focus()
  }, [])

  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      suggestions: [],
      results: []
    }))
  }, [])

  const toggleAdvanced = useCallback(() => {
    setSearchState(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))
  }, [])

  // Render search results with type safety
  const renderSearchResults = useMemo(() => {
    if (searchState.isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Searching...</span>
        </div>
      )
    }

    if (searchState.results.length === 0 && searchState.query) {
      return (
        <div className="text-center p-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No results found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or filters
          </p>
        </div>
      )
    }

    return searchState.results.map((result) => {
      const IconComponent = contentTypeIcons[result.item.type]
      const isMedia = result.item.type === 'media'
      const rawMediaPath = isMedia ? (result.item as any).url || (result.item as any).file_path || (result.item as any).image || (result.item as any).imageUrl : undefined
      const mediaThumb = isMedia && rawMediaPath ? getSupabaseImageUrl(rawMediaPath) : undefined
      
      return (
        <motion.div
          key={result.item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {mediaThumb ? (
                <img src={mediaThumb} alt={(result.item as any).alt_text || result.item.title} className="h-9 w-9 rounded object-cover border" />
              ) : (
                <IconComponent className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {result.highlights?.find(h => h.field === 'title') ? (
                    <span dangerouslySetInnerHTML={{ 
                      __html: result.highlights.find(h => h.field === 'title')?.fragments
                        .map(f => f.isHighlighted ? `<mark>${f.text}</mark>` : f.text)
                        .join('') || result.item.title 
                    }} />
                  ) : (
                    result.item.title
                  )}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {result.item.type.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-gray-500">
                  Score: {(result.score as number).toFixed(2)}
                </span>
              </div>
              
              {result.snippet && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2" 
                   dangerouslySetInnerHTML={{ __html: result.snippet }} />
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>By {result.item.authorName || 'Unknown'}</span>
                <span>{new Date(result.item.createdAt).toLocaleDateString()}</span>
                {result.item.status && (
                  <Badge variant={result.item.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                    {result.item.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )
    })
  }, [searchState.isLoading, searchState.results, searchState.query, contentTypeIcons])

  return (
    <TooltipProvider>
      <div className={`advanced-search ${className}`}>
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5" />
                {healthcareMode ? 'Healthcare Search' : 'Advanced Search'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAdvanced}
                  className="text-xs"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  {searchState.showAdvanced ? 'Simple' : 'Advanced'}
                </Button>
                {savedSearches.length > 0 && (
                  <Button variant="outline" size="sm" className="text-xs">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Saved
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Main Search Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={healthcareMode ? "Search clinical trials, publications, studies..." : "Search all content..."}
                  value={searchState.query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                  className="pl-10 pr-10 h-12 text-base"
                />
                {searchState.query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1 h-10 w-10 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {searchState.suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                  >
                    <ScrollArea className="max-h-64">
                      {searchState.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <Search className="h-4 w-4 text-gray-400" />
                          <span>{suggestion.text}</span>
                          {suggestion.category && (
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {suggestion.category}
                            </Badge>
                          )}
                          {suggestion.count && (
                            <span className="text-xs text-gray-500">
                              ({suggestion.count})
                            </span>
                          )}
                        </button>
                      ))}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => executeSearch()} disabled={!searchState.query.trim()}>
                Search
              </Button>
              
              {/* Content Type Quick Filters */}
              {healthcareMode && healthcareContentTypes.slice(0, 4).map(type => {
                const IconComponent = contentTypeIcons[type]
                return (
                  <Button
                    key={type}
                    variant={searchState.contentTypes.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleContentTypeToggle(type, !searchState.contentTypes.includes(type))}
                    className="text-xs"
                  >
                    <IconComponent className="h-3 w-3 mr-1" />
                    {type.replace('_', ' ')}
                  </Button>
                )
              })}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {searchState.showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4"
                >
                  <Tabs defaultValue="content-types" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="content-types">Content</TabsTrigger>
                      <TabsTrigger value="filters">Filters</TabsTrigger>
                      <TabsTrigger value="options">Options</TabsTrigger>
                      <TabsTrigger value="presets">Presets</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content-types" className="space-y-3">
                      <h4 className="text-sm font-medium">Content Types</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {availableContentTypes.map(type => {
                          const IconComponent = contentTypeIcons[type]
                          const isSelected = searchState.contentTypes.includes(type)
                          
                          return (
                            <label key={type} className="flex items-center space-x-2 cursor-pointer">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => 
                                  handleContentTypeToggle(type, checked as boolean)
                                }
                              />
                              <IconComponent className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{type.replace('_', ' ')}</span>
                            </label>
                          )
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="filters" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select onValueChange={(value) => 
                            handleFilterChange('status', value === 'all' ? [] : [value])
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date Range</label>
                          <Select onValueChange={(value) => {
                            const now = new Date()
                            let from = ''
                            
                            switch (value) {
                              case 'today':
                                from = new Date(now.setHours(0, 0, 0, 0)).toISOString()
                                break
                              case 'week':
                                from = new Date(now.setDate(now.getDate() - 7)).toISOString()
                                break
                              case 'month':
                                from = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
                                break
                              case 'year':
                                from = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString()
                                break
                            }
                            
                            if (from) {
                              handleFilterChange('dateRange', {
                                field: 'createdAt',
                                from,
                                to: new Date().toISOString()
                              })
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Any time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="week">Past week</SelectItem>
                              <SelectItem value="month">Past month</SelectItem>
                              <SelectItem value="year">Past year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="options" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="flex items-center space-x-2">
                            <Checkbox
                              checked={searchState.options.fuzzy}
                              onCheckedChange={(checked) => handleOptionChange('fuzzy', checked as boolean)}
                            />
                            <span className="text-sm">Fuzzy search</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <Checkbox
                              checked={searchState.options.synonyms}
                              onCheckedChange={(checked) => handleOptionChange('synonyms', checked as boolean)}
                            />
                            <span className="text-sm">Include synonyms</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <Checkbox
                              checked={searchState.options.stemming}
                              onCheckedChange={(checked) => handleOptionChange('stemming', checked as boolean)}
                            />
                            <span className="text-sm">Word stemming</span>
                          </label>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium block mb-2">
                              Typo tolerance: {searchState.options.typoTolerance}
                            </label>
                            <Slider
                              value={[searchState.options.typoTolerance]}
                              onValueChange={([value]) => handleOptionChange('typoTolerance', value as 0 | 1 | 2)}
                              max={2}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="presets" className="space-y-3">
                      {searchPresets.length > 0 ? (
                        <div className="grid gap-2">
                          {searchPresets.map((preset) => (
                            <Button
                              key={preset.id}
                              variant="outline"
                              className="justify-start h-auto p-3"
                              onClick={() => {
                                // Apply preset logic would go here
                              }}
                            >
                              <div className="text-left">
                                <div className="font-medium">{preset.name}</div>
                                <div className="text-xs text-gray-500">{preset.description}</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No search presets available
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Results */}
            {(searchState.results.length > 0 || searchState.isLoading) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Search Results {searchState.results.length > 0 && `(${searchState.results.length})`}
                  </h3>
                  {searchState.results.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select defaultValue="relevance">
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <Card>
                  <ScrollArea className="max-h-96">
                    {renderSearchResults}
                  </ScrollArea>
                </Card>
              </div>
            )}

            {/* Recent Searches */}
            {searchState.recentSearches.length > 0 && !searchState.query && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {searchState.recentSearches.slice(0, 5).map((recent, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQueryChange(recent)}
                      className="text-xs"
                    >
                      {recent}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

export default AdvancedSearch