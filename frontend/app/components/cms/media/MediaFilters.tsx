'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { debounce } from '@/lib/utils'
// Simple interface for now - replace with proper type when available
interface MediaListOptions {
  search?: string
  mimeType?: string
  sortBy?: 'created_at' | 'filename' | 'size_bytes'
  sortOrder?: 'asc' | 'desc'
}

interface MediaFiltersProps {
  filters: MediaListOptions
  onFilterChange: (filters: Partial<MediaListOptions>) => void
  totalCount: number
}

export function MediaFilters({ filters, onFilterChange, totalCount }: MediaFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onFilterChange({ search: value || undefined })
    }, 300),
    [onFilterChange]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleTypeChange = (value: string) => {
    onFilterChange({ 
      mimeType: value === 'all' ? undefined : value 
    })
  }

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [MediaListOptions['sortBy'], MediaListOptions['sortOrder']]
    onFilterChange({ sortBy, sortOrder })
  }

  const clearFilters = () => {
    setSearchValue('')
    onFilterChange({
      search: undefined,
      mimeType: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = filters.search || filters.mimeType

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by filename, title, or description..."
          value={searchValue}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* File type filter */}
      <Select
        value={filters.mimeType || 'all'}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="images">Images</SelectItem>
          <SelectItem value="documents">Documents</SelectItem>
          <SelectItem value="videos">Videos</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        value={`${filters.sortBy}-${filters.sortOrder}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at-desc">Newest first</SelectItem>
          <SelectItem value="created_at-asc">Oldest first</SelectItem>
          <SelectItem value="filename-asc">Name (A-Z)</SelectItem>
          <SelectItem value="filename-desc">Name (Z-A)</SelectItem>
          <SelectItem value="size_bytes-asc">Size (smallest)</SelectItem>
          <SelectItem value="size_bytes-desc">Size (largest)</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}

      {/* Results count */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Filter className="h-4 w-4 mr-2" />
        {totalCount} {totalCount === 1 ? 'file' : 'files'}
      </div>
    </div>
  )
}