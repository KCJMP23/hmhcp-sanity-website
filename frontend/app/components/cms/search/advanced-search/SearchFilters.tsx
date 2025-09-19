'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  SlidersHorizontal,
  Calendar as CalendarIcon,
  ChevronDown,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { SearchFilters, CONTENT_TYPES, STATUS_OPTIONS, SORT_OPTIONS } from './types'

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClearFilters: () => void
  showFilters: boolean
  onToggleFilters: () => void
  activeFilterCount: number
  authors: Array<{ id: string; name: string }>
  tags: string[]
  categories: string[]
}

export function SearchFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  showFilters,
  onToggleFilters,
  activeFilterCount,
  authors,
  tags,
  categories
}: SearchFiltersProps) {
  const [dateRangeOpen, setDateRangeOpen] = useState(false)

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const removeTag = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag))
  }

  return (
    <>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={onToggleFilters}
        className="gap-2"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFilterCount}
          </Badge>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          showFilters && "rotate-180"
        )} />
      </Button>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Advanced Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Content Type */}
            <div>
              <Label className="mb-2">Content Type</Label>
              <div className="space-y-2">
                {CONTENT_TYPES.map(type => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.contentType.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('contentType', [...filters.contentType, type.value])
                        } else {
                          updateFilter('contentType', filters.contentType.filter(t => t !== type.value))
                        }
                      }}
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label className="mb-2">Status</Label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map(status => (
                  <label
                    key={status.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.status.includes(status.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('status', [...filters.status, status.value])
                        } else {
                          updateFilter('status', filters.status.filter(s => s !== status.value))
                        }
                      }}
                    />
                    <span className="text-sm">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="mb-2">Date Range</Label>
              <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "PP")} -{" "}
                          {format(filters.dateRange.to, "PP")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "PP")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange.from ?? undefined}
                    selected={{
                      from: filters.dateRange.from ?? undefined,
                      to: filters.dateRange.to ?? undefined
                    }}
                    onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                      updateFilter('dateRange', {
                        from: range?.from ?? null,
                        to: range?.to ?? null
                      })
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Author */}
            <div>
              <Label htmlFor="author" className="mb-2">Author</Label>
              <Select
                value={filters.author[0] || ''}
                onValueChange={(value) => updateFilter('author', value ? [value] : [])}
              >
                <SelectTrigger id="author">
                  <SelectValue placeholder="All authors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All authors</SelectItem>
                  {authors.map(author => (
                    <SelectItem key={author.id} value={author.id}>
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="mb-2">Category</Label>
              <Select
                value={filters.category[0] || ''}
                onValueChange={(value) => updateFilter('category', value ? [value] : [])}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Media Filter */}
            <div>
              <Label htmlFor="media" className="mb-2">Media</Label>
              <Select
                value={filters.hasMedia === null ? 'all' : filters.hasMedia ? 'with' : 'without'}
                onValueChange={(value) => {
                  updateFilter('hasMedia', 
                    value === 'all' ? null : value === 'with'
                  )
                }}
              >
                <SelectTrigger id="media">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All content</SelectItem>
                  <SelectItem value="with">With media</SelectItem>
                  <SelectItem value="without">Without media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Word Count Range */}
            <div className="lg:col-span-2">
              <Label className="mb-2">Word Count</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.wordCount.min || ''}
                  onChange={(e) => updateFilter('wordCount', {
                    ...filters.wordCount,
                    min: e.target.value ? parseInt(e.target.value) : null
                  })}
                />
                <span>to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.wordCount.max || ''}
                  onChange={(e) => updateFilter('wordCount', {
                    ...filters.wordCount,
                    max: e.target.value ? parseInt(e.target.value) : null
                  })}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <Label className="mb-2">Sort By</Label>
              <div className="flex gap-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>

          {/* Tags Input */}
          <div className="mt-4">
            <Label className="mb-2">Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {filters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !filters.tags.includes(value)) {
                  updateFilter('tags', [...filters.tags, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add tag..." />
              </SelectTrigger>
              <SelectContent>
                {tags.filter(tag => !filters.tags.includes(tag)).map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}
    </>
  )
}