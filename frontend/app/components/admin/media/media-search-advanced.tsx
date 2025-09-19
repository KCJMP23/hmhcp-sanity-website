'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Search, X, Tag, Clock, TrendingUp } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchSuggestion {
  type: 'tag' | 'recent' | 'popular'
  value: string
  count?: number
}

interface MediaSearchAdvancedProps {
  onSearch: (query: string, tags?: string[]) => void
  suggestions?: SearchSuggestion[]
  recentSearches?: string[]
  popularTags?: Array<{ tag: string; count: number }>
}

export function MediaSearchAdvanced({
  onSearch,
  suggestions = [],
  recentSearches = [],
  popularTags = []
}: MediaSearchAdvancedProps) {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestions, setActiveSuggestions] = useState<SearchSuggestion[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const debouncedQuery = useDebounce(query, 300)

  // Generate suggestions based on input
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      const filtered: SearchSuggestion[] = []
      
      // Add matching tags
      popularTags
        .filter(t => t.tag.toLowerCase().includes(debouncedQuery.toLowerCase()))
        .slice(0, 5)
        .forEach(t => {
          filtered.push({
            type: 'tag',
            value: t.tag,
            count: t.count
          })
        })
      
      // Add recent searches
      recentSearches
        .filter(s => s.toLowerCase().includes(debouncedQuery.toLowerCase()))
        .slice(0, 3)
        .forEach(s => {
          filtered.push({
            type: 'recent',
            value: s
          })
        })
      
      setActiveSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else if (debouncedQuery.length === 0 && (recentSearches.length > 0 || popularTags.length > 0)) {
      // Show default suggestions when input is empty
      const defaults: SearchSuggestion[] = []
      
      // Add recent searches
      recentSearches.slice(0, 3).forEach(s => {
        defaults.push({
          type: 'recent',
          value: s
        })
      })
      
      // Add popular tags
      popularTags.slice(0, 5).forEach(t => {
        defaults.push({
          type: 'popular',
          value: t.tag,
          count: t.count
        })
      })
      
      setActiveSuggestions(defaults)
    } else {
      setActiveSuggestions([])
      setShowSuggestions(false)
    }
  }, [debouncedQuery, recentSearches, popularTags])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearch = useCallback(() => {
    if (query.trim() || selectedTags.length > 0) {
      onSearch(query.trim(), selectedTags)
      setShowSuggestions(false)
    }
  }, [query, selectedTags, onSearch])

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'tag' || suggestion.type === 'popular') {
      // Add to selected tags
      if (!selectedTags.includes(suggestion.value)) {
        setSelectedTags([...selectedTags, suggestion.value])
      }
    } else {
      // Set as search query
      setQuery(suggestion.value)
    }
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < activeSuggestions.length) {
        handleSuggestionClick(activeSuggestions[highlightedIndex])
      } else {
        handleSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => 
        prev < activeSuggestions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => 
        prev > 0 ? prev - 1 : activeSuggestions.length - 1
      )
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const clearSearch = () => {
    setQuery('')
    setSelectedTags([])
    setShowSuggestions(false)
    onSearch('', [])
  }

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'tag':
        return <Tag className="h-4 w-4" />
      case 'recent':
        return <Clock className="h-4 w-4" />
      case 'popular':
        return <TrendingUp className="h-4 w-4" />
    }
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search media by filename, alt text, caption, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(activeSuggestions.length > 0)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-24"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {(query || selectedTags.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
                <button
                  className="ml-2 hover:text-destructive"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && activeSuggestions.length > 0 && (
          <Card className="absolute top-full mt-1 w-full z-50 p-2">
            <div className="space-y-1">
              {activeSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.value}`}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-muted transition-colors ${
                    index === highlightedIndex ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {getSuggestionIcon(suggestion.type)}
                    </span>
                    <span className="text-sm">{suggestion.value}</span>
                  </div>
                  {suggestion.count !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}