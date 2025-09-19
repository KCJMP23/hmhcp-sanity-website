'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MediaLibrary } from './MediaLibrary'
import { EnhancedMediaUploader } from './EnhancedMediaUploader'
import { cn } from '@/lib/utils'
import { Image, Upload, X } from 'lucide-react'
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

interface MediaPickerProps {
  value?: MediaFile | MediaFile[]
  onChange: (media: MediaFile | MediaFile[] | null) => void
  multiple?: boolean
  accept?: string[]
  maxFiles?: number
  label?: string
  placeholder?: string
  className?: string
}

export function MediaPicker({
  value,
  onChange,
  multiple = false,
  accept = ['image/*', 'application/pdf'],
  maxFiles = 10,
  label = 'Select Media',
  placeholder = 'No media selected',
  className
}: MediaPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'library' | 'upload'>('library')

  const selectedMedia = Array.isArray(value) ? value : value ? [value] : []

  const handleSelect = (media: MediaFile) => {
    if (multiple) {
      const currentSelection = Array.isArray(value) ? value : []
      const isSelected = currentSelection.some(m => m.id === media.id)
      
      if (isSelected) {
        onChange(currentSelection.filter(m => m.id !== media.id))
      } else if (currentSelection.length < maxFiles) {
        onChange([...currentSelection, media])
      }
    } else {
      onChange(media)
      setDialogOpen(false)
    }
  }

  const handleRemove = (mediaId: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(m => m.id !== mediaId))
    } else {
      onChange(null)
    }
  }

  const handleUploadComplete = (files: MediaFile[]) => {
    // Files are already in MediaFile format from EnhancedMediaUploader
    const mediaFiles: MediaFile[] = files

    if (multiple) {
      const currentSelection = Array.isArray(value) ? value : []
      onChange([...currentSelection, ...mediaFiles].slice(0, maxFiles))
    } else {
      onChange(mediaFiles[0])
    }

    setUploadOpen(false)
    setDialogOpen(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}

      {/* Selected Media Preview */}
      {selectedMedia.length > 0 ? (
        <div className="space-y-2">
          {selectedMedia.map((media) => (
            <div
              key={media.id}
              className="flex items-center gap-3 p-3 border bg-zinc-50 dark:bg-zinc-900"
            >
              {media.mime_type.startsWith('image/') ? (
                <img
                  src={media.publicUrl || media.url || ''}
                  alt={media.alt_text || media.filename}
                  className="h-16 w-16 object-cover"
                />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                  <Image className="h-8 w-8 text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{media.filename}</p>
                {media.width && media.height && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {media.width} × {media.height}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(media.id)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {multiple && selectedMedia.length < maxFiles && (
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
              className="w-full"
            >
              <Image className="h-4 w-4 mr-2" />
              Add More Media ({selectedMedia.length}/{maxFiles})
            </Button>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setDialogOpen(true)}
          className="w-full justify-start"
        >
          <Image className="h-4 w-4 mr-2" />
          {placeholder}
        </Button>
      )}

      {/* Media Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <Button
              variant={selectedTab === 'library' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('library')}
            >
              Media Library
            </Button>
            <Button
              variant={selectedTab === 'upload' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('upload')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>

          {selectedTab === 'library' ? (
            <div className="overflow-y-auto max-h-[60vh]">
              <MediaLibrary
                onMediaSelect={handleSelect}
                selectionMode="single"
              />
            </div>
          ) : (
            <div className="p-4">
              <EnhancedMediaUploader
                onUploadComplete={handleUploadComplete}
                acceptedFileTypes={accept}
                maxFiles={maxFiles}
                allowMultiple={multiple}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}