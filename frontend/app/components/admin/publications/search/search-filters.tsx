/**
 * Search Filters Component - Story 3.7c Task 4
 * Faceted search filter panel with advanced filtering options
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Filter, 
  X, 
  ChevronDown, 
  Calendar,
  Users,
  BookOpen,
  Hash,
  FileCheck,
  Download,
  Unlock
} from 'lucide-react'
import { SearchFilters, FacetOption } from '@/types/publications'
import { cn } from '@/lib/utils'

interface SearchFiltersProps {
  filters: SearchFilters
  facets?: {
    publicationTypes: FacetOption[]
    years: FacetOption[]
    authors: FacetOption[]
    journals: FacetOption[]
    categories: FacetOption[]
    keywords: FacetOption[]
  }
  onFiltersChange: (filters: SearchFilters) => void
  onClearAll: () => void
  className?: string
}

export function SearchFilters({ 
  filters, 
  facets,
  onFiltersChange, 
  onClearAll,
  className 
}: SearchFiltersProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['type', 'year', 'quality'])
  )
  
  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const updateFilter = <K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = <K extends keyof SearchFilters>(
    key: K,
    value: string,
    currentArray: string[] = []
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray as SearchFilters[K])
  }

  const getActiveFilterCount = () => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (Array.isArray(value)) {
        return count + value.length
      }
      if (value !== undefined && value !== null && value !== '') {
        return count + 1
      }
      return count
    }, 0)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Publication Type */}
        <Collapsible 
          open={openSections.has('type')}
          onOpenChange={() => toggleSection('type')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0 hover:bg-transparent">
            <Label className="text-sm font-medium cursor-pointer">Publication Type</Label>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              openSections.has('type') && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2 mt-2">
            {facets?.publicationTypes?.map(type => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.publicationType?.includes(String(type.value)) || false}
                  onCheckedChange={() => 
                    toggleArrayFilter('publicationType', String(type.value), filters.publicationType)
                  }
                />
                <Label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer flex-1">
                  {String(type.value)}
                </Label>
                <Badge variant="outline" className="text-xs">
                  {type.count}
                </Badge>
              </div>
            )) || (
              ['journal', 'conference', 'book', 'thesis', 'preprint'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.publicationType?.includes(type) || false}
                    onCheckedChange={() => 
                      toggleArrayFilter('publicationType', type, filters.publicationType)
                    }
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Label>
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Publication Year */}
        <Collapsible 
          open={openSections.has('year')}
          onOpenChange={() => toggleSection('year')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0 hover:bg-transparent">
            <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Publication Year
            </Label>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              openSections.has('year') && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="yearFrom" className="text-xs">From</Label>
                <Input
                  id="yearFrom"
                  type="number"
                  placeholder="2020"
                  value={filters.yearFrom || ''}
                  onChange={(e) => updateFilter('yearFrom', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="yearTo" className="text-xs">To</Label>
                <Input
                  id="yearTo"
                  type="number"
                  placeholder="2024"
                  value={filters.yearTo || ''}
                  onChange={(e) => updateFilter('yearTo', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="text-sm"
                />
              </div>
            </div>
            
            {facets?.years && facets.years.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {facets.years.slice(0, 10).map(year => (
                  <Button
                    key={year.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter('yearFrom', Number(year.value))}
                    className="w-full justify-between text-xs h-7"
                  >
                    <span>{year.value}</span>
                    <Badge variant="outline" className="text-xs">
                      {year.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Authors */}
        <Collapsible 
          open={openSections.has('authors')}
          onOpenChange={() => toggleSection('authors')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0 hover:bg-transparent">
            <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Users className="h-4 w-4" />
              Authors
            </Label>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              openSections.has('authors') && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2 mt-2 max-h-48 overflow-y-auto">
            {facets?.authors?.slice(0, 20).map(author => (
              <div key={author.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`author-${author.value}`}
                  checked={filters.authors?.includes(String(author.value)) || false}
                  onCheckedChange={() => 
                    toggleArrayFilter('authors', String(author.value), filters.authors)
                  }
                />
                <Label htmlFor={`author-${author.value}`} className="text-sm cursor-pointer flex-1 truncate">
                  {String(author.value)}
                </Label>
                <Badge variant="outline" className="text-xs">
                  {author.count}
                </Badge>
              </div>
            )) || (
              <div className="text-xs text-muted-foreground p-2">
                No author filters available
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Journals */}
        <Collapsible 
          open={openSections.has('journals')}
          onOpenChange={() => toggleSection('journals')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0 hover:bg-transparent">
            <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Journals
            </Label>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              openSections.has('journals') && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2 mt-2 max-h-48 overflow-y-auto">
            {facets?.journals?.slice(0, 15).map(journal => (
              <div key={journal.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`journal-${journal.value}`}
                  checked={filters.journal?.includes(String(journal.value)) || false}
                  onCheckedChange={() => 
                    toggleArrayFilter('journal', String(journal.value), filters.journal)
                  }
                />
                <Label htmlFor={`journal-${journal.value}`} className="text-sm cursor-pointer flex-1 truncate">
                  {String(journal.value)}
                </Label>
                <Badge variant="outline" className="text-xs">
                  {journal.count}
                </Badge>
              </div>
            )) || (
              <div className="text-xs text-muted-foreground p-2">
                No journal filters available
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Quality & Completeness */}
        <Collapsible 
          open={openSections.has('quality')}
          onOpenChange={() => toggleSection('quality')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-0 hover:bg-transparent">
            <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Quality & Availability
            </Label>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              openSections.has('quality') && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAbstract"
                checked={filters.hasAbstract || false}
                onCheckedChange={(checked) => updateFilter('hasAbstract', checked || undefined)}
              />
              <Label htmlFor="hasAbstract" className="text-sm cursor-pointer">
                Has Abstract
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPdf"
                checked={filters.hasPdf || false}
                onCheckedChange={(checked) => updateFilter('hasPdf', checked || undefined)}
              />
              <Label htmlFor="hasPdf" className="text-sm cursor-pointer flex items-center gap-2">
                <Download className="h-3 w-3" />
                Has PDF
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="openAccess"
                checked={filters.openAccess || false}
                onCheckedChange={(checked) => updateFilter('openAccess', checked || undefined)}
              />
              <Label htmlFor="openAccess" className="text-sm cursor-pointer flex items-center gap-2">
                <Unlock className="h-3 w-3" />
                Open Access
              </Label>
            </div>
            
            {/* Citation Count Range */}
            <div className="space-y-2">
              <Label className="text-sm">Citation Count</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="minCitations" className="text-xs">Min</Label>
                  <Input
                    id="minCitations"
                    type="number"
                    placeholder="0"
                    value={filters.minCitations || ''}
                    onChange={(e) => updateFilter('minCitations', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxCitations" className="text-xs">Max</Label>
                  <Input
                    id="maxCitations"
                    type="number"
                    placeholder="∞"
                    value={filters.maxCitations || ''}
                    onChange={(e) => updateFilter('maxCitations', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Publication Status</Label>
          <Select 
            value={filters.status || 'published'} 
            onValueChange={(value) => updateFilter('status', value as any)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}