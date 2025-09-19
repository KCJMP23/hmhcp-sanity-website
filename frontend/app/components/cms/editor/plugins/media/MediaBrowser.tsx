'use client'

import { useState, useEffect } from 'react'
import { Image, FileText, Video, Upload, X, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MediaGrid } from '@/components/cms/media/MediaGrid'
import { MediaUploader } from '@/components/cms/media/MediaUploader'
import { FolderTree } from '@/components/cms/media/organization/FolderTree'
import { MediaTagManager } from '@/components/cms/media/organization/MediaTagManager'
import { useToast } from '@/hooks/use-toast'
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
}

interface MediaBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (file: MediaFile, options?: MediaInsertOptions) => void
  allowMultiple?: boolean
  fileTypes?: string[]
  maxSelections?: number
}

interface MediaInsertOptions {
  alignment?: 'left' | 'center' | 'right' | 'full'
  caption?: string
  linkText?: string
  responsive?: boolean
}

export function MediaBrowser({ 
  isOpen, 
  onClose, 
  onSelect, 
  allowMultiple = false,
  fileTypes,
  maxSelections = 1 
}: MediaBrowserProps) {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('browse')
  const [insertOptions, setInsertOptions] = useState<MediaInsertOptions>({
    alignment: 'center',
    responsive: true
  })
  const { toast } = useToast()

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([])
      setSearchQuery('')
      setInsertOptions({
        alignment: 'center',
        responsive: true
      })
    }
  }, [isOpen])

  const handleFileSelect = (file: MediaFile) => {
    if (!allowMultiple) {
      setSelectedFiles([file])
      return
    }

    if (selectedFiles.find(f => f.id === file.id)) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id))
    } else if (selectedFiles.length < maxSelections) {
      setSelectedFiles([...selectedFiles, file])
    } else {
      toast({
        title: 'Selection Limit Reached',
        description: `You can only select up to ${maxSelections} files`,
        variant: 'destructive'
      })
    }
  }

  const handleInsert = () => {
    if (selectedFiles.length === 0) return

    if (allowMultiple && selectedFiles.length > 1) {
      // For galleries or multiple files
      selectedFiles.forEach(file => {
        onSelect(file, insertOptions)
      })
    } else {
      // Single file insertion
      onSelect(selectedFiles[0], insertOptions)
    }

    onClose()
  }

  const handleUploadComplete = (files: MediaFile[]) => {
    if (files.length > 0) {
      if (allowMultiple) {
        setSelectedFiles(prev => [...prev, ...files].slice(0, maxSelections))
      } else {
        setSelectedFiles([files[0]])
      }
      setActiveTab('browse')
    }
  }

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const isImageFile = (file: MediaFile) => file.mime_type.startsWith('image/')
  const isVideoFile = (file: MediaFile) => file.mime_type.startsWith('video/')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Media Library</span>
            <Badge variant="secondary">
              {selectedFiles.length} selected
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Media</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 flex overflow-hidden mt-4">
            <div className="flex gap-4 h-full">
              {/* Sidebar */}
              <div className="w-64 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <Input
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-4"
                  />
                </div>

                <FolderTree
                  onFolderSelect={setSelectedFolderId}
                  selectedFolderId={selectedFolderId}
                  allowEdit={false}
                />

                <MediaTagManager />
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-y-auto">
                <MediaGrid
                  onFileSelect={handleFileSelect}
                  selectedFiles={selectedFiles}
                  folderId={selectedFolderId}
                  searchQuery={searchQuery}
                  fileTypes={fileTypes}
                  allowMultiple={allowMultiple}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-hidden mt-4">
            <MediaUploader
              onUploadComplete={handleUploadComplete}
              folderId={selectedFolderId}
              allowMultiple={allowMultiple}
              acceptedTypes={fileTypes}
            />
          </TabsContent>
        </Tabs>

        {/* Insert options */}
        {selectedFiles.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Insert Options</h4>
            
            {selectedFiles.length === 1 && isImageFile(selectedFiles[0]) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Alignment</label>
                  <select
                    value={insertOptions.alignment}
                    onChange={(e) => setInsertOptions(prev => ({
                      ...prev,
                      alignment: e.target.value as any
                    }))}
                    className="w-full p-2 border border-gray-300"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="full">Full Width</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Caption</label>
                  <Input
                    placeholder="Image caption (optional)"
                    value={insertOptions.caption || ''}
                    onChange={(e) => setInsertOptions(prev => ({
                      ...prev,
                      caption: e.target.value
                    }))}
                  />
                </div>
              </div>
            )}

            {selectedFiles.length === 1 && !isImageFile(selectedFiles[0]) && (
              <div>
                <label className="text-sm font-medium mb-2 block">Link Text</label>
                <Input
                  placeholder="Custom link text (optional)"
                  value={insertOptions.linkText || ''}
                  onChange={(e) => setInsertOptions(prev => ({
                    ...prev,
                    linkText: e.target.value
                  }))}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="responsive"
                checked={insertOptions.responsive}
                onChange={(e) => setInsertOptions(prev => ({
                  ...prev,
                  responsive: e.target.checked
                }))}
              />
              <label htmlFor="responsive" className="text-sm">
                Use responsive images (recommended)
              </label>
            </div>

            {/* Selected files preview */}
            <div className="max-h-32 overflow-y-auto">
              <h5 className="text-sm font-medium mb-2">Selected Files:</h5>
              <div className="space-y-2">
                {selectedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800">
                    {getFileTypeIcon(file.mime_type)}
                    <span className="flex-1 text-sm truncate">{file.original_name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFiles(files => files.filter(f => f.id !== file.id))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {allowMultiple 
              ? `${selectedFiles.length} of ${maxSelections} files selected`
              : selectedFiles.length > 0 ? '1 file selected' : 'No files selected'
            }
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleInsert}
              disabled={selectedFiles.length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Insert Media
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}