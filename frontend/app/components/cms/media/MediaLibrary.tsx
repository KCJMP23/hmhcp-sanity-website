'use client'

import { useState, useEffect, useCallback } from 'react'
import { MediaGrid } from './MediaGrid'
import { MediaFilters } from './MediaFilters'
import { MediaDetailModal } from './MediaDetailModal'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'
// Simple interfaces for now - replace with proper types when available
interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  title?: string
  alt_text?: string
  description?: string
  url?: string
  publicUrl?: string
  created_at?: string
}

interface MediaListOptions {
  search?: string
  mimeType?: string
  sortBy?: 'created_at' | 'filename' | 'size_bytes'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

interface MediaLibraryProps {
  onMediaSelect?: (media: MediaFile) => void
  canDelete?: boolean
  canEdit?: boolean
  selectionMode?: 'single' | 'multiple' | 'none'
  selectedMedia?: MediaFile[]
  onSelectionChange?: (media: MediaFile[]) => void
}

export function MediaLibrary({
  onMediaSelect,
  canDelete = false,
  canEdit = false,
  selectionMode = 'none',
  selectedMedia = [],
  onSelectionChange
}: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [filters, setFilters] = useState<MediaListOptions>({
    limit: 24,
    offset: 0,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const { toast } = useToast()

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 24)) + 1
  const totalPages = Math.ceil(totalCount / (filters.limit || 24))

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cms/media?${new URLSearchParams({
        limit: filters.limit?.toString() || '24',
        offset: filters.offset?.toString() || '0',
        sortBy: filters.sortBy || 'created_at',
        sortOrder: filters.sortOrder || 'desc',
        ...(filters.search && { search: filters.search }),
        ...(filters.mimeType && { mimeType: filters.mimeType })
      })}`)

      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const data = await response.json()
      setMedia(data.files)
      setTotalCount(data.total)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load media files',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const handleFilterChange = (newFilters: Partial<MediaListOptions>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * (prev.limit || 24)
    }))
  }

  const handleMediaClick = (file: MediaFile) => {
    if (selectionMode === 'single') {
      onSelectionChange?.([file])
      onMediaSelect?.(file)
    } else if (selectionMode === 'multiple') {
      const isSelected = selectedMedia.some(m => m.id === file.id)
      if (isSelected) {
        onSelectionChange?.(selectedMedia.filter(m => m.id !== file.id))
      } else {
        onSelectionChange?.([...selectedMedia, file])
      }
    } else {
      setSelectedFile(file)
    }
  }

  const handleMediaUpdate = async (updatedFile: MediaFile) => {
    setMedia(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f))
    toast({
      title: 'Success',
      description: 'Media file updated successfully'
    })
  }

  const handleMediaDelete = async (deletedId: string) => {
    setMedia(prev => prev.filter(f => f.id !== deletedId))
    setTotalCount(prev => prev - 1)
    setSelectedFile(null)
    toast({
      title: 'Success',
      description: 'Media file deleted successfully'
    })
  }

  if (loading && media.length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <MediaFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          totalCount={totalCount}
        />
      </Card>

      {/* Media Grid */}
      <MediaGrid
        media={media}
        loading={loading}
        onMediaClick={handleMediaClick}
        selectionMode={selectionMode}
        selectedMedia={selectedMedia}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFile && (
        <MediaDetailModal
          media={selectedFile}
          onClose={() => setSelectedFile(null)}
          onUpdate={handleMediaUpdate}
          onDelete={handleMediaDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  )
}