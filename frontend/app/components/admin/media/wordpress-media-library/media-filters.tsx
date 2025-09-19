'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Grid3X3, List } from 'lucide-react'
import type { MediaFiltersProps } from './types'
import { MEDIA_TYPES, FOLDERS } from './types'

export function MediaFilters({
  filterType,
  selectedFolder,
  searchQuery,
  viewMode,
  onFilterTypeChange,
  onFolderChange,
  onSearchChange,
  onViewModeChange
}: MediaFiltersProps) {
  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex items-center gap-4">
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All media" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MEDIA_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedFolder} onValueChange={onFolderChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All folders" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FOLDERS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}