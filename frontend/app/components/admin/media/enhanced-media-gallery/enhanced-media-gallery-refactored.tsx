'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Grid, List, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MediaItem } from './types'
import { getCSRFToken } from './types'
import { UploadProgress } from './upload-progress'
import { MediaFilters } from './media-filters'
import { BulkActions } from './bulk-actions'
import { MediaGridView } from './media-grid-view'
import { MediaListView } from './media-list-view'
import { Pagination } from './pagination'
import { UploadDialog } from './upload-dialog'
import { EditDialog } from './edit-dialog'
import { logger } from '@/lib/logging/client-safe-logger'

const EnhancedMediaGalleryComponent = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [currentFolder, setCurrentFolder] = useState('/')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState({
    search: '',
    mime_type: '',
    tags: '',
    folder_path: '/'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Load media items
  const loadMedia = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
        folder_path: currentFolder
      })

      const response = await fetch(`/api/admin/media/enhanced?${params}`)
      if (!response.ok) throw new Error('Failed to load media')

      const data = await response.json()
      setMediaItems(data.data || [])
      setFolders(data.folders || [])
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch (error) {
      logger.error('Error loading media items', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'EnhancedMediaGallery',
        action: 'loadMedia'
      })
      toast.error('Failed to load media items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [pagination.page, currentFolder, filters])

  // File upload handler
  const handleFileUpload = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder_path', currentFolder)
        formData.append('uploaded_by', 'current-user-id')
        formData.append('is_public', 'true')

        const response = await fetch('/api/admin/media/enhanced', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': await getCSRFToken()
          },
          body: formData
        })

        if (!response.ok) throw new Error(`Failed to upload ${file.name}`)

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        
        toast.success(`Upload Successful: ${file.name} uploaded successfully`)

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev }
            delete updated[file.name]
            return updated
          })
        }, 2000)

      } catch (error) {
        logger.error('Error uploading file', {
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'EnhancedMediaGallery',
          action: 'handleFileUpload',
          fileName: file.name
        })
        toast.error(`Upload Failed: Failed to upload ${file.name}`)
        
        setUploadProgress(prev => {
          const updated = { ...prev }
          delete updated[file.name]
          return updated
        })
      }
    }

    loadMedia()
    setUploadDialogOpen(false)
  }, [currentFolder])

  // Handle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    try {
      for (const itemId of selectedItems) {
        const response = await fetch(`/api/admin/media/enhanced?id=${itemId}&user_id=current-user-id`, {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': await getCSRFToken()
          }
        })

        if (!response.ok) throw new Error('Failed to delete item')
      }

      toast.success(`${selectedItems.length} items deleted successfully`)

      setSelectedItems([])
      loadMedia()
    } catch (error) {
      logger.error('Error deleting media items', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'EnhancedMediaGallery',
        action: 'handleBulkDelete',
        itemCount: selectedItems.length
      })
      toast.error('Failed to delete some items')
    }
  }

  // Update media item
  const handleUpdateItem = async (itemId: string, updates: Partial<MediaItem>) => {
    try {
      const response = await fetch('/api/admin/media/enhanced', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({
          id: itemId,
          user_id: 'current-user-id',
          ...updates
        })
      })

      if (!response.ok) throw new Error('Failed to update item')

      toast.success('Media item updated successfully')

      setEditingItem(null)
      loadMedia()
    } catch (error) {
      logger.error('Error updating media item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'EnhancedMediaGallery',
        action: 'handleUpdateItem',
        itemId: itemId
      })
      toast.error('Failed to update media item')
    }
  }

  // Event handlers for pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display text-gray-900 dark:text-white tracking-tight">
            Media Gallery
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize and manage all media files with advanced organization tools
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="rounded-md"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="rounded-md"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      <UploadProgress uploadProgress={uploadProgress} />

      {/* Filters */}
      <MediaFilters
        filters={filters}
        currentFolder={currentFolder}
        folders={folders}
        onFiltersChange={setFilters}
        onFolderChange={setCurrentFolder}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItemsCount={selectedItems.length}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedItems([])}
      />

      {/* Media Grid/List */}
      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <MediaGridView
                  mediaItems={mediaItems}
                  selectedItems={selectedItems}
                  onToggleSelection={toggleItemSelection}
                  onEditItem={setEditingItem}
                />
              ) : (
                <MediaListView
                  mediaItems={mediaItems}
                  selectedItems={selectedItems}
                  onToggleSelection={toggleItemSelection}
                  onEditItem={setEditingItem}
                />
              )}

              {/* Pagination */}
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={uploadDialogOpen}
        currentFolder={currentFolder}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
      />

      {/* Edit Dialog */}
      <EditDialog
        editingItem={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdateItem}
      />
    </div>
  )
}

// Export with React.memo for performance optimization
export const EnhancedMediaGallery = memo(EnhancedMediaGalleryComponent)