'use client'

import {
  Image,
  FileText,
  File
} from 'lucide-react'

// Media Item Interface
export interface MediaItem {
  id: string
  filename: string
  url: string
  mime_type: string
  size: number
  folder_path: string
  alt_text?: string
  caption?: string
  tags: string[]
  is_public: boolean
  usage_count: number
  optimization_status: string
  created_at: string
  uploader: {
    id: string
    email: string
  }
  metadata?: any
}

// Media Folder Interface
export interface MediaFolder {
  path: string
  name: string
  count: number
}

// Component Props Interfaces
export interface UploadProgressProps {
  uploadProgress: Record<string, number>
}

export interface MediaFiltersProps {
  filters: {
    search: string
    mime_type: string
    tags: string
    folder_path: string
  }
  currentFolder: string
  folders: string[]
  onFiltersChange: (filters: any) => void
  onFolderChange: (folder: string) => void
}

export interface BulkActionsProps {
  selectedItemsCount: number
  onBulkDelete: () => void
  onClearSelection: () => void
}

export interface MediaGridViewProps {
  mediaItems: MediaItem[]
  selectedItems: string[]
  onToggleSelection: (itemId: string) => void
  onEditItem: (item: MediaItem) => void
}

export interface MediaListViewProps {
  mediaItems: MediaItem[]
  selectedItems: string[]
  onToggleSelection: (itemId: string) => void
  onEditItem: (item: MediaItem) => void
}

export interface PaginationProps {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
}

export interface UploadDialogProps {
  isOpen: boolean
  currentFolder: string
  onClose: () => void
  onUpload: (files: File[]) => void
}

export interface EditDialogProps {
  editingItem: MediaItem | null
  onClose: () => void
  onSave: (itemId: string, updates: Partial<MediaItem>) => void
}

// Constants
export const MIME_TYPE_ICONS = {
  'image/': Image,
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument': FileText,
  'text/': FileText,
  'default': File
}

export const OPTIMIZATION_STATUS = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
  optimized: { color: 'bg-green-100 text-green-800', label: 'Optimized' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
}

// Utility Functions
export const getCSRFToken = async (): Promise<string> => {
  return 'csrf-token' // Implementation depends on your CSRF system
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileIcon = (mimeType: string) => {
  for (const [type, Icon] of Object.entries(MIME_TYPE_ICONS)) {
    if (mimeType.startsWith(type)) return Icon
  }
  return MIME_TYPE_ICONS.default
}