'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Image as ImageIcon,
  FileText,
  File,
  Video,
  Music,
  Trash2,
  Edit,
  Copy,
  Eye,
  Download,
  MoreVertical,
  Calendar,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  RefreshCw,
  FolderOpen,
  Tag,
  Info,
  X,
  CheckSquare,
  Square,
  Settings,
  SortAsc,
  SortDesc,
  Folder,
  Hash,
  Clock,
  HardDrive,
  Zap,
  Filter as FilterIcon,
  Heart,
  Star,
  BookOpen,
  ImagePlus
} from 'lucide-react'

interface MediaItem {
  id: string
  filename: string
  original_filename: string
  file_path: string
  mime_type: string
  file_size: number
  alt_text?: string
  caption?: string
  uploaded_by: string
  created_at: string
  updated_at: string
  width?: number
  height?: number
  duration?: number
  folder?: string
  tags?: string[]
  favorites?: boolean
  downloads?: number
  views?: number
  exif_data?: any
}

interface MediaFilters {
  search: string
  type: 'all' | 'image' | 'video' | 'audio' | 'document'
  folder: string
  tags: string[]
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
  customStartDate?: string
  customEndDate?: string
  sizeRange: 'all' | 'small' | 'medium' | 'large' | 'custom'
  customMinSize?: number
  customMaxSize?: number
  sortBy: 'date' | 'name' | 'size' | 'type' | 'views' | 'downloads'
  sortOrder: 'asc' | 'desc'
  favorites: boolean
  resolution?: 'all' | 'low' | 'medium' | 'high' | 'ultra'
}

interface AdvancedMediaGalleryProps {
  items: MediaItem[]
  loading?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
  onItemClick?: (item: MediaItem) => void
  onItemDoubleClick?: (item: MediaItem) => void
  onRefresh?: () => void
  onDelete?: (ids: string[]) => void
  onDownload?: (ids: string[]) => void
  onEdit?: (item: MediaItem) => void
  onFavorite?: (ids: string[], favorite: boolean) => void
  className?: string
  enableBulkActions?: boolean
  enableFilters?: boolean
  enableFolderView?: boolean
  enableAnalytics?: boolean
}

// Utility moved above usage to avoid TDZ errors in hooks and renamed to avoid collisions
function inferMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

const defaultFilters: MediaFilters = {
  search: '',
  type: 'all',
  folder: '',
  tags: [],
  dateRange: 'all',
  sizeRange: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
  favorites: false
}

export default function AdvancedMediaGallery({
  items = [],
  loading = false,
  onSelectionChange,
  onItemClick,
  onItemDoubleClick,
  onRefresh,
  onDelete,
  onDownload,
  onEdit,
  onFavorite,
  className = '',
  enableBulkActions = true,
  enableFilters = true,
  enableFolderView = true,
  enableAnalytics = true
}: AdvancedMediaGalleryProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('grid')
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [filters, setFilters] = useState<MediaFilters>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [folders, setFolders] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [showAnalytics, setShowAnalytics] = useState(false)
  
  const { toast } = useToast()

  // Extract unique folders and tags from items
  useEffect(() => {
    const uniqueFolders = [...new Set(items.filter(item => item.folder).map(item => item.folder!))]
    const uniqueTags = [...new Set(items.flatMap(item => item.tags || []))]
    
    setFolders(uniqueFolders)
    setAllTags(uniqueTags)
  }, [items])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item =>
        item.original_filename.toLowerCase().includes(searchLower) ||
        item.alt_text?.toLowerCase().includes(searchLower) ||
        item.caption?.toLowerCase().includes(searchLower) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      const typeMap = {
        image: 'image/',
        video: 'video/',
        audio: 'audio/',
        document: 'application/'
      }
      filtered = filtered.filter(item => item.mime_type.startsWith(typeMap[filters.type as keyof typeof typeMap]))
    }

    // Folder filter
    if (filters.folder) {
      filtered = filtered.filter(item => item.folder === filters.folder)
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags?.some(tag => filters.tags.includes(tag))
      )
    }

    // Favorites filter
    if (filters.favorites) {
      filtered = filtered.filter(item => item.favorites)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0)
          break
        case 'week':
          cutoff.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoff.setMonth(now.getMonth() - 1)
          break
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1)
          break
        case 'custom':
          if (filters.customStartDate) {
            const startDate = new Date(filters.customStartDate)
            const endDate = filters.customEndDate ? new Date(filters.customEndDate) : now
            filtered = filtered.filter(item => {
              const itemDate = new Date(item.created_at)
              return itemDate >= startDate && itemDate <= endDate
            })
          }
          break
      }
      
      if (filters.dateRange !== 'custom') {
        filtered = filtered.filter(item => new Date(item.created_at) >= cutoff)
      }
    }

    // Size filter
    if (filters.sizeRange !== 'all') {
      const sizeRanges = {
        small: [0, 1024 * 1024], // < 1MB
        medium: [1024 * 1024, 10 * 1024 * 1024], // 1-10MB
        large: [10 * 1024 * 1024, Infinity] // > 10MB
      }
      
      if (filters.sizeRange === 'custom' && filters.customMinSize !== undefined && filters.customMaxSize !== undefined) {
        filtered = filtered.filter(item =>
          item.file_size >= filters.customMinSize! && item.file_size <= filters.customMaxSize!
        )
      } else if (filters.sizeRange in sizeRanges) {
        const [min, max] = sizeRanges[filters.sizeRange as keyof typeof sizeRanges]
        filtered = filtered.filter(item => item.file_size >= min && item.file_size < max)
      }
    }

    // Resolution filter for images
    if (filters.resolution && filters.resolution !== 'all') {
      const resolutionRanges = {
        low: [0, 0.5 * 1000000], // < 0.5MP
        medium: [0.5 * 1000000, 2 * 1000000], // 0.5-2MP
        high: [2 * 1000000, 8 * 1000000], // 2-8MP
        ultra: [8 * 1000000, Infinity] // > 8MP
      }
      
      const [min, max] = resolutionRanges[filters.resolution as keyof typeof resolutionRanges]
      filtered = filtered.filter(item => {
        if (!item.width || !item.height) return true // Allow non-images
        const pixels = item.width * item.height
        return pixels >= min && pixels < max
      })
    }

    // Sort items
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.original_filename.localeCompare(b.original_filename)
          break
        case 'size':
          comparison = a.file_size - b.file_size
          break
        case 'type':
          comparison = a.mime_type.localeCompare(b.mime_type)
          break
        case 'views':
          comparison = (a.views || 0) - (b.views || 0)
          break
        case 'downloads':
          comparison = (a.downloads || 0) - (b.downloads || 0)
          break
        case 'date':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [items, filters])

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  // Analytics data
  const analytics = useMemo(() => {
    if (!enableAnalytics) return null
    
    const totalSize = items.reduce((acc, item) => acc + item.file_size, 0)
    const typeStats = items.reduce((acc, item) => {
      const type = inferMediaType(item.mime_type)
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const folderStats = items.reduce((acc, item) => {
      const folder = item.folder || 'Uncategorized'
      acc[folder] = (acc[folder] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const recentlyAdded = items.filter(item => {
      const itemDate = new Date(item.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return itemDate > weekAgo
    }).length
    
    return {
      totalFiles: items.length,
      totalSize,
      typeStats,
      folderStats,
      recentlyAdded,
      favoriteCount: items.filter(item => item.favorites).length
    }
  }, [items, enableAnalytics])

  // Selection handlers
  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSelection = selected
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
      
      onSelectionChange?.(newSelection)
      return newSelection
    })
  }, [onSelectionChange])

  const handleSelectAll = useCallback(() => {
    const allIds = paginatedItems.map(item => item.id)
    setSelectedItems(prev => {
      const newSelection = prev.length === allIds.length ? [] : allIds
      onSelectionChange?.(newSelection)
      return newSelection
    })
  }, [paginatedItems, onSelectionChange])

  const handleBulkAction = useCallback((action: string) => {
    if (selectedItems.length === 0) return

    switch (action) {
      case 'delete':
        onDelete?.(selectedItems)
        break
      case 'download':
        onDownload?.(selectedItems)
        break
      case 'favorite':
        onFavorite?.(selectedItems, true)
        break
      case 'unfavorite':
        onFavorite?.(selectedItems, false)
        break
    }
    
    setSelectedItems([])
  }, [selectedItems, onDelete, onDownload, onFavorite])

  // Utility functions
  const getFileIcon = (type: string, className = "h-5 w-5") => {
    switch (type) {
      case 'image': return <ImageIcon className={className} />
      case 'video': return <Video className={className} />
      case 'audio': return <Music className={className} />
      case 'document': return <FileText className={className} />
      default: return <File className={className} />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPublicUrl = (item: MediaItem) => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const path = item.file_path || item.filename
    // All uploads use media bucket with full path including media/... so don't double-strip
    return `${base}/storage/v1/object/public/media/${path.replace(/^media\//, '')}`
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  const gridSizeClasses = {
    small: 'grid-cols-6 md:grid-cols-8 lg:grid-cols-12',
    medium: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    large: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Dashboard */}
      {enableAnalytics && analytics && (
        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-gray-900 dark:to-gray-900 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Archive className="h-5 w-5 text-blue-600" />
                    Media Library Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 font-display">
                        {analytics.totalFiles}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-text">Total Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 font-display">
                        {formatFileSize(analytics.totalSize)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-text">Total Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 font-display">
                        {analytics.recentlyAdded}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-text">Recent (7 days)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 font-display">
                        {analytics.favoriteCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-text">Favorites</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 font-display">
                        {Object.keys(analytics.folderStats).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-text">Folders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600 font-display">
                        {analytics.typeStats.image || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-text">Images</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between flex-wrap">
        {/* Left side - Search and quick filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files, alt text, captions, tags..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 font-text"
            />
          </div>
          
          <Tabs 
            value={filters.type} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
          >
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="document">Docs</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            Filters
            {Object.values(filters).some(v => 
              (Array.isArray(v) && v.length > 0) || 
              (typeof v === 'string' && v && v !== 'all' && v !== 'desc' && v !== 'date') ||
              (typeof v === 'boolean' && v)
            ) && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
        </div>

        {/* Right side - View controls and analytics toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {enableAnalytics && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <Archive className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          )}
          
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-2"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {viewMode === 'grid' && (
            <Select value={gridSize} onValueChange={(value: any) => setGridSize(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gray-50 dark:bg-gray-900 dark:border dark:border-gray-800">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Folder Filter */}
                  {enableFolderView && folders.length > 0 && (
                    <div className="space-y-2">
                      <Label className="font-text">Folder</Label>
                      <Select
                        value={filters.folder}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, folder: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All folders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All folders</SelectItem>
                          {folders.map(folder => (
                            <SelectItem key={folder} value={folder}>
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4" />
                                {folder}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Tags Filter */}
                  {allTags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="font-text">Tags</Label>
                      <div className="max-h-20 overflow-y-auto">
                        <div className="space-y-1">
                          {allTags.slice(0, 5).map(tag => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={filters.tags.includes(tag)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    tags: checked
                                      ? [...prev.tags, tag]
                                      : prev.tags.filter(t => t !== tag)
                                  }))
                                }}
                              />
                              <Label htmlFor={`tag-${tag}`} className="text-sm font-text">
                                {tag}
                              </Label>
                            </div>
                          ))}
                          {allTags.length > 5 && (
                            <div className="text-xs text-gray-500 font-text">
                              +{allTags.length - 5} more tags
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <Label className="font-text">Date Range</Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size Filter */}
                  <div className="space-y-2">
                    <Label className="font-text">File Size</Label>
                    <Select
                      value={filters.sizeRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sizeRange: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sizes</SelectItem>
                        <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
                        <SelectItem value="medium">Medium (1-10MB)</SelectItem>
                        <SelectItem value="large">Large (&gt; 10MB)</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <Label className="font-text">Sort by</Label>
                    <div className="flex gap-2">
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="size">Size</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                          <SelectItem value="views">Views</SelectItem>
                          <SelectItem value="downloads">Downloads</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                        }))}
                      >
                        {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-2">
                    <Label className="font-text">Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="favorites"
                          checked={filters.favorites}
                          onCheckedChange={(checked) => setFilters(prev => ({ ...prev, favorites: !!checked }))}
                        />
                        <Label htmlFor="favorites" className="text-sm font-text">
                          Favorites only
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      {enableBulkActions && selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium font-text">
                    {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('download')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('favorite')}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorite
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 font-text">
        <div>
          Showing {paginatedItems.length} of {filteredItems.length} files
          {filteredItems.length !== items.length && ` (filtered from ${items.length} total)`}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.length === paginatedItems.length && paginatedItems.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span>Select All</span>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500 font-text">Loading media files...</p>
            </div>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <ImagePlus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-display">
              No files found
            </h3>
            <p className="text-gray-500 mb-6 font-text">
              {Object.values(filters).some(v => 
                (Array.isArray(v) && v.length > 0) || 
                (typeof v === 'string' && v && v !== 'all' && v !== 'desc' && v !== 'date') ||
                (typeof v === 'boolean' && v)
              )
                ? 'Try adjusting your filters to see more results'
                : 'Upload your first files to get started'
              }
            </p>
            {Object.values(filters).some(v => 
              (Array.isArray(v) && v.length > 0) || 
              (typeof v === 'string' && v && v !== 'all' && v !== 'desc' && v !== 'date') ||
              (typeof v === 'boolean' && v)
            ) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            layout
            className={`grid gap-4 ${gridSizeClasses[gridSize]}`}
          >
            {paginatedItems.map((item) => {
              const itemType = inferMediaType(item.mime_type)
              const isSelected = selectedItems.includes(item.id)
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`relative group border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected
                      ? 'ring-2 ring-blue-500 border-blue-300 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onItemClick?.(item)}
                  onDoubleClick={() => onItemDoubleClick?.(item)}
                >
                  {/* Thumbnail/Preview */}
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center relative">
                    {itemType === 'image' ? (
                      <img
                        src={getPublicUrl(item)}
                        alt={item.alt_text || item.original_filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement
                           if (!img.dataset.fallback) {
                             img.dataset.fallback = 'true'
                             const base = process.env.NEXT_PUBLIC_SUPABASE_URL
                             img.src = `${base}/storage/v1/object/public/media/${(item.file_path || item.filename).replace(/^media\//,'')}`
                           }
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-4">
                        {getFileIcon(itemType, gridSize === 'large' ? 'h-8 w-8' : 'h-6 w-6')}
                        <span className={`${gridSize === 'small' ? 'text-xs' : 'text-sm'} mt-2 text-center font-text`}>
                          {item.mime_type.split('/')[1]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Selection checkbox */}
                    {enableBulkActions && (
                      <div className={`absolute top-2 left-2 transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <div 
                          className={`p-1 rounded-full ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-white/80 backdrop-blur-sm border border-gray-300'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleItemSelect(item.id, !isSelected)
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Favorite indicator */}
                    {item.favorites && (
                      <div className="absolute top-2 right-2">
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                      </div>
                    )}

                    {/* Quick action buttons */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          onItemClick?.(item)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit?.(item)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* File info */}
                  {gridSize !== 'small' && (
                    <div className="p-3">
                      <p className={`${gridSize === 'medium' ? 'text-xs' : 'text-sm'} font-medium text-gray-900 dark:text-gray-100 truncate font-text`}>
                        {item.original_filename}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`${gridSize === 'medium' ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 font-text`}>
                          {formatFileSize(item.file_size)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {itemType}
                        </Badge>
                      </div>
                      {item.folder && (
                        <div className="flex items-center gap-1 mt-1">
                          <Folder className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-text">{item.folder}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          // List View
          <motion.div layout className="space-y-2">
            {/* List Header */}
            <div className="grid grid-cols-12 gap-4 p-3 text-xs font-medium text-gray-500 uppercase tracking-wide border-b font-text">
              <div className="col-span-1">
                <Checkbox
                  checked={selectedItems.length === paginatedItems.length && paginatedItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </div>
              <div className="col-span-4">File</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Actions</div>
            </div>

            {paginatedItems.map((item) => {
              const itemType = inferMediaType(item.mime_type)
              const isSelected = selectedItems.includes(item.id)
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                  }`}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="col-span-1 flex items-center">
                    {enableBulkActions && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemSelect(item.id, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                  
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                       {itemType === 'image' ? (
                         <img
                          src={getPublicUrl(item)}
                          alt={item.alt_text || item.original_filename}
                          className="w-10 h-10 object-cover rounded-lg border"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement
                            if (!img.dataset.fallback) {
                              img.dataset.fallback = 'true'
                              const base = process.env.NEXT_PUBLIC_SUPABASE_URL
                                img.src = `${base}/storage/v1/object/public/media/${(item.file_path || item.filename).replace(/^media\//,'')}`
                            }
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border">
                          {getFileIcon(itemType)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate font-text">
                        {item.original_filename}
                      </p>
                      {item.alt_text && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-text">
                          Alt: {item.alt_text}
                        </p>
                      )}
                      {item.folder && (
                        <div className="flex items-center gap-1 mt-1">
                          <Folder className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 font-text">{item.folder}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <Badge variant="outline" className="text-xs">
                      {itemType}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-text">
                      {formatFileSize(item.file_size)}
                    </span>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-text">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(getPublicUrl(item), '_blank')
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit?.(item)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {filteredItems.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-text">
              Page {currentPage} of {Math.ceil(filteredItems.length / itemsPerPage)}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredItems.length / itemsPerPage), prev + 1))}
            disabled={currentPage >= Math.ceil(filteredItems.length / itemsPerPage)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}