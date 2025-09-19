'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FileText, Image, Film, Music, File, Check } from 'lucide-react'
// Simple interface for now - replace with proper type when available
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

interface MediaCardProps {
  media: MediaFile
  onClick?: () => void
  selected?: boolean
  selectable?: boolean
}

export function MediaCard({ 
  media, 
  onClick, 
  selected = false,
  selectable = false 
}: MediaCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    // Generate thumbnail URL
    if (media.mime_type.startsWith('image/')) {
      // For images, use the actual file URL with size parameters
      setThumbnailUrl(`/api/cms/media/${media.id}/thumbnail`)
    }
  }, [media])

  const getFileIcon = () => {
    if (media.mime_type.startsWith('image/')) return Image
    if (media.mime_type.startsWith('video/')) return Film
    if (media.mime_type.startsWith('audio/')) return Music
    if (media.mime_type === 'application/pdf') return FileText
    return File
  }

  const FileIcon = getFileIcon()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02]',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onClick}
    >
      {/* Selection indicator */}
      {selectable && (
        <div
          className={cn(
            'absolute top-2 right-2 z-10 w-6 h-6  border-2 border-white shadow-md transition-colors',
            selected ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          {selected && (
            <Check className="w-full h-full p-1 text-white" />
          )}
        </div>
      )}

      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
        {media.mime_type.startsWith('image/') && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={media.alt_text || media.filename}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-medium truncate" title={media.original_name}>
          {media.original_name}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(media.size_bytes)}</span>
          <span>{media.created_at ? formatDate(media.created_at) : 'Unknown date'}</span>
        </div>
        {media.alt_text && (
          <p className="text-xs text-muted-foreground truncate" title={media.alt_text}>
            {media.alt_text}
          </p>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-sm font-medium">
          {selectable ? (selected ? 'Deselect' : 'Select') : 'View Details'}
        </span>
      </div>
    </Card>
  )
}