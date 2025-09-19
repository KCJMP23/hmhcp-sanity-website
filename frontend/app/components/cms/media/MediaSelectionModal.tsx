'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MediaLibrary } from './MediaLibrary'
import { MediaUploader } from './MediaUploader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface MediaSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelect: (media: MediaFile | MediaFile[]) => void
  multiple?: boolean
  acceptedTypes?: string[]
  title?: string
}

export function MediaSelectionModal({
  open,
  onClose,
  onSelect,
  multiple = false,
  acceptedTypes,
  title = 'Select Media'
}: MediaSelectionModalProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([])
  const [activeTab, setActiveTab] = useState('library')

  const handleSelect = () => {
    if (selectedMedia.length > 0) {
      onSelect(multiple ? selectedMedia : selectedMedia[0])
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedMedia([])
    setActiveTab('library')
    onClose()
  }

  const handleUploadComplete = (files: MediaFile[]) => {
    if (files.length > 0) {
      onSelect(multiple ? files : files[0])
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 overflow-auto">
            <MediaLibrary
              selectionMode={multiple ? 'multiple' : 'single'}
              selectedMedia={selectedMedia}
              onSelectionChange={setSelectedMedia}
              onMediaSelect={(media) => {
                if (!multiple) {
                  onSelect(media)
                  handleClose()
                }
              }}
            />
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-auto">
            <MediaUploader
              onUploadComplete={handleUploadComplete}
              maxFiles={multiple ? 10 : 1}
              acceptedFileTypes={acceptedTypes}
              autoUpload={true}
            />
          </TabsContent>
        </Tabs>

        {activeTab === 'library' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              disabled={selectedMedia.length === 0}
            >
              Select {selectedMedia.length > 0 && `(${selectedMedia.length})`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}