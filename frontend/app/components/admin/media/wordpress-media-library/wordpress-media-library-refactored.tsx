'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, CloudUpload, Trash2 } from 'lucide-react'
import type { MediaItem, UploadProgress } from './types'
import { MediaFilters } from './media-filters'
import { UploadProgress as UploadProgressComponent } from './upload-progress'
import { MediaGridItem } from './media-grid-item'
import { MediaListView } from './media-list-view'
import { MediaEditDialog } from './media-edit-dialog'

export function WordPressMediaLibrary() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }, [])

  // File upload with progress tracking
  const handleFileUpload = async (files: File[]) => {
    const newUploads: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }))

    setUploadQueue(prev => [...prev, ...newUploads])

    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadIndex = uploadQueue.length + i

      try {
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === uploadIndex ? { ...item, status: 'uploading' } : item
        ))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', selectedFolder !== 'all' ? selectedFolder : '')

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map((item, idx) => {
            if (idx === uploadIndex && item.progress < 90) {
              return { ...item, progress: item.progress + 10 }
            }
            return item
          }))
        }, 200)

        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData
        })

        clearInterval(progressInterval)

        if (!response.ok) throw new Error('Upload failed')

        const uploadedFile = await response.json()
        
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === uploadIndex ? { ...item, progress: 100, status: 'complete' } : item
        ))

        setMediaItems(prev => [uploadedFile, ...prev])
      } catch (error) {
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === uploadIndex ? { 
            ...item, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : item
        ))
      }
    }
  }

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return

    try {
      await Promise.all(selectedItems.map(id => 
        fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
      ))
      
      setMediaItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      setShowBulkActions(false)
    } catch (error) {
      console.error('Bulk delete failed:', error)
    }
  }

  // Select all/none
  const handleSelectAll = () => {
    if (selectedItems.length === mediaItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(mediaItems.map(item => item.id))
    }
  }

  // Effect to show/hide bulk actions
  useEffect(() => {
    setShowBulkActions(selectedItems.length > 0)
  }, [selectedItems])

  // Event handlers for sub-components
  const handleItemSelect = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    )
  }

  const handleEditSave = (updatedItem: MediaItem) => {
    setMediaItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
    setEditingItem(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-dashed border-blue-500">
            <CloudUpload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* Header with bulk actions */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBulkActions ? (
              <>
                <Checkbox 
                  checked={selectedItems.length === mediaItems.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedItems.length} selected
                </span>
                <Button size="sm" variant="outline" onClick={() => setSelectedItems([])}>
                  Clear
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Media Library</h2>
                <Badge variant="secondary">{mediaItems.length} items</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add New
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <MediaFilters
        filterType={filterType}
        selectedFolder={selectedFolder}
        searchQuery={searchQuery}
        viewMode={viewMode}
        onFilterTypeChange={setFilterType}
        onFolderChange={setSelectedFolder}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
      />

      {/* Upload Progress */}
      <UploadProgressComponent uploadQueue={uploadQueue} />

      {/* Media Grid/List */}
      <div 
        ref={dropZoneRef}
        className="flex-1 overflow-auto p-4"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
            {mediaItems.map((item) => (
              <MediaGridItem
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                onSelect={(selected) => handleItemSelect(item.id, selected)}
                onEdit={() => setEditingItem(item)}
              />
            ))}
          </div>
        ) : (
          <MediaListView
            items={mediaItems}
            selectedItems={selectedItems}
            onSelect={setSelectedItems}
            onEdit={setEditingItem}
          />
        )}
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <MediaEditDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}