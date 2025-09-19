'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterCriteria {
  search?: string
  fileType?: string
  dateRange?: {
    from?: Date
    to?: Date
  }
  sizeRange?: {
    min?: number
    max?: number
  }
  usage?: 'used' | 'unused' | 'all'
  tags?: string[]
  uploadedBy?: string
  medicalAccuracy?: boolean
  hipaaCompliant?: boolean
  aiGenerated?: boolean
}

interface MediaFiltersAdvancedProps {
  onFilterChange: (filters: FilterCriteria) => void
  onClearFilters?: () => void
  userOptions?: Array<{ id: string; name: string }>
}

export function MediaFiltersAdvanced({ 
  onFilterChange, 
  onClearFilters,
  userOptions = []
}: MediaFiltersAdvancedProps) {
  const [filters, setFilters] = useState<FilterCriteria>({})
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [tagInput, setTagInput] = useState('')
  const [sizeRange, setSizeRange] = useState([0, 100])

  const applyFilters = () => {
    const appliedFilters: FilterCriteria = {
      ...filters,
      dateRange: (dateFrom || dateTo) ? {
        from: dateFrom,
        to: dateTo
      } : undefined,
      sizeRange: {
        min: sizeRange[0],
        max: sizeRange[1]
      }
    }
    onFilterChange(appliedFilters)
  }

  const clearFilters = () => {
    setFilters({})
    setDateFrom(undefined)
    setDateTo(undefined)
    setTagInput('')
    setSizeRange([0, 100])
    if (onClearFilters) {
      onClearFilters()
    } else {
      onFilterChange({})
    }
  }

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = filters.tags || []
      if (!currentTags.includes(tagInput.trim())) {
        const newFilters = {
          ...filters,
          tags: [...currentTags, tagInput.trim()]
        }
        setFilters(newFilters)
        setTagInput('')
      }
    }
  }

  const removeTag = (tag: string) => {
    const newFilters = {
      ...filters,
      tags: filters.tags?.filter(t => t !== tag)
    }
    setFilters(newFilters)
  }

  const activeFilterCount = [
    filters.search,
    filters.fileType,
    filters.dateRange,
    filters.sizeRange,
    filters.usage !== 'all' && filters.usage,
    filters.tags?.length,
    filters.uploadedBy,
    filters.medicalAccuracy,
    filters.hipaaCompliant,
    filters.aiGenerated
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="Search by filename, alt text, or caption..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* File Type */}
        <div>
          <Label htmlFor="fileType">File Type</Label>
          <Select
            value={filters.fileType || 'all'}
            onValueChange={(value) => setFilters({ ...filters, fileType: value === 'all' ? undefined : value })}
          >
            <SelectTrigger id="fileType">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Upload Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* File Size Range */}
        <div>
          <Label>File Size (MB)</Label>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{sizeRange[0]} MB</span>
              <span>{sizeRange[1]} MB</span>
            </div>
            <Slider
              value={sizeRange}
              onValueChange={setSizeRange}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        {/* Usage Status */}
        <div>
          <Label htmlFor="usage">Usage Status</Label>
          <Select
            value={filters.usage || 'all'}
            onValueChange={(value) => setFilters({ ...filters, usage: value as FilterCriteria['usage'] })}
          >
            <SelectTrigger id="usage">
              <SelectValue placeholder="All media" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All media</SelectItem>
              <SelectItem value="used">Used in content</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <Label htmlFor="tags">Tags</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
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
          </div>
        </div>

        {/* Uploaded By */}
        {userOptions.length > 0 && (
          <div>
            <Label htmlFor="uploadedBy">Uploaded By</Label>
            <Select
              value={filters.uploadedBy || 'all'}
              onValueChange={(value) => setFilters({ ...filters, uploadedBy: value === 'all' ? undefined : value })}
            >
              <SelectTrigger id="uploadedBy">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {userOptions.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Healthcare Specific Filters */}
        <div className="space-y-2">
          <Label>Healthcare Compliance</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.medicalAccuracy || false}
                onChange={(e) => setFilters({ ...filters, medicalAccuracy: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Medical Accuracy Verified</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hipaaCompliant || false}
                onChange={(e) => setFilters({ ...filters, hipaaCompliant: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">HIPAA Compliant</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.aiGenerated || false}
                onChange={(e) => setFilters({ ...filters, aiGenerated: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">AI Generated</span>
            </label>
          </div>
        </div>

        {/* Apply Button */}
        <Button onClick={applyFilters} className="w-full">
          <Search className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}