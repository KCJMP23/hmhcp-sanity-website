/**
 * Search Bar Component - Story 3.7c Task 4
 * Advanced search input with auto-complete, suggestions, and keyboard navigation
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  Users, 
  BookOpen,
  Hash,
  FileText,
  Microscope,
  Pill,
  Heart,
  Activity,
  ChevronRight
} from 'lucide-react'
import { 
  Suggestion, 
  TrendingSuggestion, 
  MedicalSuggestion,
  CategorySuggestion,
  SuggestionType 
} from '@/types/publications'
import { useSearchApi } from '@/hooks/use-search-api'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  initialQuery?: string
  showTrending?: boolean
  showMedicalTerms?: boolean
  className?: string
}

const SUGGESTION_ICONS: Record<SuggestionType, any> = {
  query: Search,
  medical_term: Microscope,
  author: Users,
  journal: BookOpen,
  keyword: Hash,
  filter: FileText,
  trending: TrendingUp
}

const MEDICAL_TERM_ICONS: Record<string, any> = {
  disease: Activity,
  drug: Pill,
  procedure: Heart,
  anatomy: Activity,
  symptom: Activity
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Search publications...",
  initialQuery = "",
  showTrending = true,
  showMedicalTerms = true,
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])
  
  const {
    search,
    suggestions,
    isLoadingSuggestions,
    rawSuggestionsData
  } = useSearchApi({
    enableSuggestions: true
  })

  // Get trending and medical suggestions from API response
  const trendingSuggestions = rawSuggestionsData?.data?.trending || []
  const medicalSuggestions = rawSuggestionsData?.data?.medical || []
  const categorySuggestions = rawSuggestionsData?.data?.categories || []

  /**
   * Load recent searches from localStorage
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('publication-recent-searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  /**
   * Save search to recent searches
   */
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    try {
      const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10)
      setRecentSearches(newRecent)
      localStorage.setItem('publication-recent-searches', JSON.stringify(newRecent))
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }

  /**
   * Handle search execution
   */
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return
    
    saveRecentSearch(searchQuery)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSearch?.(searchQuery)
    search(searchQuery)
  }

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (suggestion: Suggestion | string) => {
    const selectedText = typeof suggestion === 'string' ? suggestion : suggestion.text
    setQuery(selectedText)
    handleSearch(selectedText)
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return
    
    const allSuggestions = [
      ...recentSearches.map(s => ({ text: s, type: 'query' as SuggestionType })),
      ...suggestions,
      ...trendingSuggestions.map(s => ({ text: s.text, type: 'trending' as SuggestionType })),
      ...medicalSuggestions.map(s => ({ text: s.text, type: 'medical_term' as SuggestionType }))
    ]

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        )
        break
        
      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSuggestionSelect(allSuggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
        
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
        
      case 'Tab':
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          event.preventDefault()
          setQuery(allSuggestions[selectedIndex].text)
        }
        break
    }
  }

  /**
   * Handle input change
   */
  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(value.length > 0)
    setSelectedIndex(-1)
  }

  /**
   * Clear search
   */
  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  /**
   * Clear recent searches
   */
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('publication-recent-searches')
  }

  /**
   * Get suggestion icon
   */
  const getSuggestionIcon = (suggestion: Suggestion | TrendingSuggestion | MedicalSuggestion) => {
    if ('type' in suggestion && suggestion.type) {
      // Medical suggestion with specific type
      if (suggestion.type in MEDICAL_TERM_ICONS) {
        return MEDICAL_TERM_ICONS[suggestion.type as string]
      }
      // Regular suggestion type
      return SUGGESTION_ICONS[suggestion.type as SuggestionType] || Search
    }
    return Search
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(query.length > 0 || recentSearches.length > 0)}
              className="pl-10 pr-20"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isLoadingSuggestions && (
                <LoadingSpinner className="h-4 w-4" />
              )}
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearch()}
                className="h-8 px-3"
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-full p-0" 
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          align="start"
        >
          <Command className="w-full">
            <CommandList>
              <ScrollArea className="max-h-96 w-full">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <CommandGroup heading="Recent Searches">
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={`recent-${index}`}
                        value={search}
                        onSelect={() => handleSuggestionSelect(search)}
                        className={cn(
                          'flex items-center gap-3',
                          selectedIndex === index && 'bg-accent'
                        )}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{search}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </CommandItem>
                    ))}
                    <div className="px-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="h-6 text-xs text-muted-foreground"
                      >
                        Clear recent
                      </Button>
                    </div>
                  </CommandGroup>
                )}

                {/* Main Suggestions */}
                {suggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion, index) => {
                      const Icon = getSuggestionIcon(suggestion)
                      const actualIndex = recentSearches.length + index
                      
                      return (
                        <CommandItem
                          key={`suggestion-${index}`}
                          value={suggestion.text}
                          onSelect={() => handleSuggestionSelect(suggestion)}
                          className={cn(
                            'flex items-center gap-3',
                            selectedIndex === actualIndex && 'bg-accent'
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <span>{suggestion.text}</span>
                            {suggestion.description && (
                              <div className="text-xs text-muted-foreground">
                                {suggestion.description}
                              </div>
                            )}
                          </div>
                          {suggestion.frequency && (
                            <Badge variant="outline" className="text-xs">
                              {suggestion.frequency}
                            </Badge>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}

                {/* Trending Suggestions */}
                {showTrending && trendingSuggestions.length > 0 && (
                  <CommandGroup heading="Trending">
                    {trendingSuggestions.map((trending, index) => {
                      const actualIndex = recentSearches.length + suggestions.length + index
                      
                      return (
                        <CommandItem
                          key={`trending-${index}`}
                          value={trending.text}
                          onSelect={() => handleSuggestionSelect(trending.text)}
                          className={cn(
                            'flex items-center gap-3',
                            selectedIndex === actualIndex && 'bg-accent'
                          )}
                        >
                          <TrendingUp className={cn(
                            'h-4 w-4',
                            trending.trend === 'rising' ? 'text-green-500' :
                            trending.trend === 'falling' ? 'text-red-500' :
                            'text-blue-500'
                          )} />
                          <div className="flex-1">
                            <span>{trending.text}</span>
                            {trending.changePercent && (
                              <div className="text-xs text-muted-foreground">
                                {trending.changePercent > 0 ? '+' : ''}{trending.changePercent}% 
                                {' '}({trending.frequency} searches)
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              trending.trend === 'rising' ? 'border-green-200 text-green-700' :
                              trending.trend === 'falling' ? 'border-red-200 text-red-700' :
                              'border-blue-200 text-blue-700'
                            )}
                          >
                            {trending.trend}
                          </Badge>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}

                {/* Medical Suggestions */}
                {showMedicalTerms && medicalSuggestions.length > 0 && (
                  <CommandGroup heading="Medical Terms">
                    {medicalSuggestions.map((medical, index) => {
                      const Icon = MEDICAL_TERM_ICONS[medical.type] || Microscope
                      const actualIndex = recentSearches.length + suggestions.length + 
                        trendingSuggestions.length + index
                      
                      return (
                        <CommandItem
                          key={`medical-${index}`}
                          value={medical.text}
                          onSelect={() => handleSuggestionSelect(medical.text)}
                          className={cn(
                            'flex items-center gap-3',
                            selectedIndex === actualIndex && 'bg-accent'
                          )}
                        >
                          <Icon className="h-4 w-4 text-emerald-500" />
                          <div className="flex-1">
                            <span>{medical.text}</span>
                            <div className="text-xs text-muted-foreground">
                              {medical.type.charAt(0).toUpperCase() + medical.type.slice(1)}
                              {medical.synonyms.length > 0 && (
                                <span> • Synonyms: {medical.synonyms.slice(0, 2).join(', ')}</span>
                              )}
                              {medical.abbreviation && (
                                <span> • {medical.abbreviation}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                            Medical
                          </Badge>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}

                {/* Category Suggestions */}
                {categorySuggestions.length > 0 && (
                  <CommandGroup heading="Categories">
                    {categorySuggestions.map((category, index) => (
                      <CommandItem
                        key={`category-${index}`}
                        value={category.category}
                        onSelect={() => handleSuggestionSelect(category.category)}
                        className="flex items-center gap-3"
                      >
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span>{category.category}</span>
                          <div className="text-xs text-muted-foreground">
                            {category.count} publication{category.count !== 1 ? 's' : ''}
                            {category.examples.length > 0 && (
                              <span> • e.g., {category.examples[0]}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {category.count}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Empty State */}
                {!isLoadingSuggestions && 
                 suggestions.length === 0 && 
                 trendingSuggestions.length === 0 && 
                 medicalSuggestions.length === 0 && 
                 recentSearches.length === 0 && query.length > 0 && (
                  <CommandEmpty>
                    <div className="text-center py-4">
                      <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No suggestions found for "{query}"
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSearch()}
                        className="mt-2"
                      >
                        Search anyway
                      </Button>
                    </div>
                  </CommandEmpty>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}