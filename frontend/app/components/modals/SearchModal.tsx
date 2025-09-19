'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  FileText,
  Package,
  Users,
  Settings,
  Home,
  Info,
  Phone,
  ArrowRight,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  relevance?: number
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

// Mock search data - in production, this would come from an API
const searchableItems: SearchResult[] = [
  // Pages
  { id: '1', title: 'Home', description: 'Main landing page', category: 'Pages', icon: Home, href: '/' },
  { id: '2', title: 'About Us', description: 'Learn about our mission and team', category: 'Pages', icon: Info, href: '/about' },
  { id: '3', title: 'Services', description: 'Healthcare consulting and technology services', category: 'Pages', icon: Package, href: '/services' },
  { id: '4', title: 'Contact', description: 'Get in touch with our team', category: 'Pages', icon: Phone, href: '/contact' },
  
  // Services
  { id: '5', title: 'Clinical Research', description: 'Clinical trial management and research services', category: 'Services', icon: FileText, href: '/services/clinical-research' },
  { id: '6', title: 'Healthcare Technology Consulting', description: 'Digital transformation and IT consulting', category: 'Services', icon: Settings, href: '/services/healthcare-technology-consulting' },
  { id: '7', title: 'Workforce Development', description: 'Training and education programs', category: 'Services', icon: Users, href: '/services/workforce-development' },
  
  // Platforms
  { id: '8', title: 'INTELLIC EDC', description: 'Electronic Data Capture platform', category: 'Platforms', icon: Package, href: '/platforms/intellic-edc' },
  { id: '9', title: 'MyBC Health', description: 'Patient engagement platform', category: 'Platforms', icon: Package, href: '/platforms/mybc-health' },
  
  // Resources
  { id: '10', title: 'Blog', description: 'Healthcare insights and articles', category: 'Resources', icon: FileText, href: '/blog' },
  { id: '11', title: 'Case Studies', description: 'Success stories and implementations', category: 'Resources', icon: TrendingUp, href: '/research/case-studies' },
  { id: '12', title: 'White Papers', description: 'Research papers and reports', category: 'Resources', icon: FileText, href: '/research/white-papers' },
]

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Perform search
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    // Simulate search delay
    setTimeout(() => {
      const results = searchableItems.filter(item => {
        const searchLower = query.toLowerCase()
        return (
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower)
        )
      })

      // Sort by relevance (simple implementation)
      results.sort((a, b) => {
        const aExact = a.title.toLowerCase() === query.toLowerCase() ? 1 : 0
        const bExact = b.title.toLowerCase() === query.toLowerCase() ? 1 : 0
        return bExact - aExact
      })

      setSearchResults(results)
      setIsSearching(false)
      setSelectedIndex(0)
    }, 300)
  }, [])

  // Handle search input change
  useEffect(() => {
    performSearch(searchQuery)
  }, [searchQuery, performSearch])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
          break
        case 'Enter':
          e.preventDefault()
          if (searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, searchResults, selectedIndex, onClose])

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const query = searchQuery.trim()
    if (query) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    // Navigate and close
    router.push(result.href)
    onClose()
    setSearchQuery('')
  }

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
  }

  // Group results by category
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search pages, services, platforms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 pb-6">
          {/* Recent searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                Recent Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleRecentSearchClick(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mt-4 space-y-4">
              {Object.entries(groupedResults).map(([category, results]) => (
                <div key={category}>
                  <div className="text-sm font-semibold text-muted-foreground mb-2">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {results.map((result, index) => {
                      const Icon = result.icon
                      const globalIndex = searchResults.indexOf(result)
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2  text-left transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.description}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-50" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                No results found for "{searchQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching for pages, services, or platforms
              </p>
            </div>
          )}

          {/* Quick links */}
          {!searchQuery && recentSearches.length === 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-muted-foreground mb-2">
                Quick Links
              </div>
              <div className="grid grid-cols-2 gap-2">
                {searchableItems.slice(0, 6).map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(item)}
                      className="flex items-center gap-2 p-3 border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="px-6 py-3 text-xs text-muted-foreground">
          <kbd className="px-2 py-1 bg-muted text-xs">↑↓</kbd> to navigate •{' '}
          <kbd className="px-2 py-1 bg-muted text-xs">Enter</kbd> to select •{' '}
          <kbd className="px-2 py-1 bg-muted text-xs">Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  )
}