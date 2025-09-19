'use client'

export interface MediaItem {
  id: string
  filename: string
  url: string
  mime_type: string
  size: number
  dimensions?: { width: number; height: number }
  metadata?: {
    altText?: string
    caption?: string
    tags?: string[]
    folder?: string
    [key: string]: any
  }
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

// Component props interfaces
export interface MediaGridItemProps {
  item: MediaItem
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onEdit: () => void
}

export interface MediaListViewProps {
  items: MediaItem[]
  selectedItems: string[]
  onSelect: (ids: string[]) => void
  onEdit: (item: MediaItem) => void
}

export interface MediaEditDialogProps {
  item: MediaItem
  onClose: () => void
  onSave: (item: MediaItem) => void
}

export interface UploadProgressProps {
  uploadQueue: UploadProgress[]
}

export interface MediaFiltersProps {
  filterType: string
  selectedFolder: string
  searchQuery: string
  viewMode: 'grid' | 'list'
  onFilterTypeChange: (type: string) => void
  onFolderChange: (folder: string) => void
  onSearchChange: (query: string) => void
  onViewModeChange: (mode: 'grid' | 'list') => void
}

// Constants
export const MEDIA_TYPES = {
  all: 'All media',
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
  document: 'Documents',
  unattached: 'Unattached'
} as const

export const FOLDERS = {
  all: 'All folders',
  uploads: 'Uploads',
  library: 'Library',
  blog: 'Blog',
  pages: 'Pages'
} as const

// Utility function types
export type MediaType = 'image' | 'video' | 'audio' | 'document'
export type ViewMode = 'grid' | 'list'
export type FilterType = keyof typeof MEDIA_TYPES
export type FolderType = keyof typeof FOLDERS

// Utility functions
export const getItemType = (mimeType: string): MediaType => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}