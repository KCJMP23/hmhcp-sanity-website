'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, HardDrive, Image, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger';

interface MediaFilter {
  search?: string
  folderIds?: string[]
  tagIds?: string[]
  dateFrom?: string
  dateTo?: string
  sizeMin?: number
  sizeMax?: number
  widthMin?: number
  widthMax?: number
  heightMin?: number
  heightMax?: number
  mimeTypes?: string[]
  hasUsage?: boolean
}

interface MediaFolder {
  id: string
  name: string
}

interface MediaTag {
  id: string
  name: string
  color: string
}

interface SavedFilter {
  id: string
  name: string
  filterConfig: MediaFilter
  isPublic: boolean
}

interface MediaFilterPanelProps {
  folders: MediaFolder[]
  tags: MediaTag[]
  onFilterChange: (filters: MediaFilter) => void
  className?: string
}

const MIME_TYPES = [
  { value: 'image/jpeg', label: 'JPEG Images' },
  { value: 'image/png', label: 'PNG Images' },
  { value: 'image/gif', label: 'GIF Images' },
  { value: 'image/webp', label: 'WebP Images' },
  { value: 'image/svg+xml', label: 'SVG Images' },
  { value: 'application/pdf', label: 'PDF Documents' },
  { value: 'video/mp4', label: 'MP4 Videos' },
  { value: 'audio/mpeg', label: 'MP3 Audio' }
]

const SIZE_PRESETS = [
  { label: 'Small (< 1MB)', max: 1024 * 1024 },
  { label: 'Medium (1MB - 10MB)', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { label: 'Large (> 10MB)', min: 10 * 1024 * 1024 }
]

export function MediaFilterPanel({ folders, tags, onFilterChange, className }: MediaFilterPanelProps) {
  const [filters, setFilters] = useState<MediaFilter>({})
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [isPublicFilter, setIsPublicFilter] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSavedFilters()
  }, [])

  const loadSavedFilters = async () => {
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/filters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setSavedFilters(result.data || [])
      }
    } catch (error) {
      logger.error('Failed to load saved filters:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const updateFilter = (key: keyof MediaFilter, value: any) => {
    const newFilters = { ...filters, [key]: value }
    
    if (value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key]
    }
    
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const saveCurrentFilter = async () => {
    if (!saveFilterName.trim()) return

    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: saveFilterName.trim(),
          filterConfig: filters,
          isPublic: isPublicFilter
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save filter')
      }

      await loadSavedFilters()
      setSaveFilterName('')
      setIsPublicFilter(false)
      setShowSaveDialog(false)

      toast({
        title: 'Success',
        description: 'Filter saved successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const applyFilter = (filter: SavedFilter) => {
    setFilters(filter.filterConfig)
    onFilterChange(filter.filterConfig)

    toast({
      title: 'Filter Applied',
      description: `Applied filter: ${filter.name}`
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getActiveFilterCount = () => {
    return Object.keys(filters).length
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            )}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              disabled={getActiveFilterCount() === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearFilters}
              disabled={getActiveFilterCount() === 0}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search filenames, descriptions..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Folders */}
        <div>
          <label className="text-sm font-medium mb-2 block">Folders</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {folders.map(folder => (
              <label key={folder.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.folderIds?.includes(folder.id) || false}
                  onCheckedChange={(checked) => {
                    const currentFolders = filters.folderIds || []
                    if (checked) {
                      updateFilter('folderIds', [...currentFolders, folder.id])
                    } else {
                      updateFilter('folderIds', currentFolders.filter(id => id !== folder.id))
                    }
                  }}
                />
                <span className="text-sm">{folder.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tags</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {tags.map(tag => (
              <label key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.tagIds?.includes(tag.id) || false}
                  onCheckedChange={(checked) => {
                    const currentTags = filters.tagIds || []
                    if (checked) {
                      updateFilter('tagIds', [...currentTags, tag.id])
                    } else {
                      updateFilter('tagIds', currentTags.filter(id => id !== tag.id))
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">Upload Date</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="From"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
            <Input
              type="date"
              placeholder="To"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>
        </div>

        {/* File Size */}
        <div>
          <label className="text-sm font-medium mb-2 block">File Size</label>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min MB"
                value={filters.sizeMin ? Math.round(filters.sizeMin / (1024 * 1024)) : ''}
                onChange={(e) => updateFilter('sizeMin', e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined)}
              />
              <Input
                type="number"
                placeholder="Max MB"
                value={filters.sizeMax ? Math.round(filters.sizeMax / (1024 * 1024)) : ''}
                onChange={(e) => updateFilter('sizeMax', e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined)}
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {SIZE_PRESETS.map((preset, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateFilter('sizeMin', preset.min)
                    updateFilter('sizeMax', preset.max)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Image Dimensions */}
        <div>
          <label className="text-sm font-medium mb-2 block">Image Dimensions</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min Width"
              value={filters.widthMin || ''}
              onChange={(e) => updateFilter('widthMin', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              type="number"
              placeholder="Max Width"
              value={filters.widthMax || ''}
              onChange={(e) => updateFilter('widthMax', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              type="number"
              placeholder="Min Height"
              value={filters.heightMin || ''}
              onChange={(e) => updateFilter('heightMin', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              type="number"
              placeholder="Max Height"
              value={filters.heightMax || ''}
              onChange={(e) => updateFilter('heightMax', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* File Types */}
        <div>
          <label className="text-sm font-medium mb-2 block">File Types</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {MIME_TYPES.map(type => (
              <label key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.mimeTypes?.includes(type.value) || false}
                  onCheckedChange={(checked) => {
                    const currentTypes = filters.mimeTypes || []
                    if (checked) {
                      updateFilter('mimeTypes', [...currentTypes, type.value])
                    } else {
                      updateFilter('mimeTypes', currentTypes.filter(t => t !== type.value))
                    }
                  }}
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Usage Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Usage Status</label>
          <Select
            value={filters.hasUsage === undefined ? 'all' : filters.hasUsage ? 'used' : 'unused'}
            onValueChange={(value) => {
              if (value === 'all') {
                updateFilter('hasUsage', undefined)
              } else {
                updateFilter('hasUsage', value === 'used')
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="used">Used in Content</SelectItem>
              <SelectItem value="unused">Unused Files</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">Saved Filters</label>
            <div className="space-y-2">
              {savedFilters.map(filter => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => applyFilter(filter)}
                >
                  {filter.name}
                  {filter.isPublic && <Badge variant="secondary" className="ml-2">Public</Badge>}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Save Filter</h3>
            <div className="space-y-4">
              <Input
                placeholder="Filter name"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
              />
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={isPublicFilter}
                  onCheckedChange={(checked) => setIsPublicFilter(checked as boolean)}
                />
                <span className="text-sm">Make public (visible to all users)</span>
              </label>
              <div className="flex gap-2">
                <Button onClick={saveCurrentFilter} disabled={!saveFilterName.trim()}>
                  Save Filter
                </Button>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}