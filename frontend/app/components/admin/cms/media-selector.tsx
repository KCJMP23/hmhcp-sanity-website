'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { 
  Search, 
  Upload, 
  Image, 
  File, 
  Video, 
  Music, 
  FileText,
  Check,
  X,
  Loader2,
  Grid,
  List,
  Filter
} from 'lucide-react'
import { MediaItem } from '@/lib/types/cms-types'

interface MediaSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaItem) => void
  multiple?: boolean
  accept?: string // MIME types to accept
}

export function MediaSelector({ isOpen, onClose, onSelect, multiple = false, accept }: MediaSelectorProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadMedia()
    }
  }, [isOpen])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/media')
      if (!response.ok) throw new Error('Failed to load media')
      
      const result = await response.json()
      setMedia(result.data || [])
    } catch (error) {
      console.error('Failed to load media:', error)
      toast({
        title: 'Error',
        description: 'Failed to load media library',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      
      // Reload media library
      loadMedia()
      
      toast({
        title: 'Success',
        description: `Uploaded ${files.length} file(s)`
      })
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload files',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredMedia = media.filter((item) => {
    const matchesSearch = !searchQuery || 
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || 
      (filterType === 'image' && item.mime_type.startsWith('image/')) ||
      (filterType === 'video' && item.mime_type.startsWith('video/')) ||
      (filterType === 'audio' && item.mime_type.startsWith('audio/')) ||
      (filterType === 'document' && (item.mime_type.includes('pdf') || item.mime_type.includes('document')))
    
    const matchesAccept = !accept || accept.split(',').some(type => 
      item.mime_type.includes(type.trim()) || 
      item.filename.toLowerCase().endsWith(type.trim().replace('*', ''))
    )
    
    return matchesSearch && matchesType && matchesAccept
  })

  const handleItemClick = (item: MediaItem) => {
    if (multiple) {
      const newSelected = new Set(selectedItems)
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id)
      } else {
        newSelected.add(item.id)
      }
      setSelectedItems(newSelected)
    } else {
      onSelect(item)
      onClose()
    }
  }

  const handleConfirmSelection = () => {
    if (multiple && selectedItems.size > 0) {
      const selectedMedia = media.filter(item => selectedItems.has(item.id))
      selectedMedia.forEach(item => onSelect(item))
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Media Library
          </DialogTitle>
          <DialogDescription>
            Select media files for your content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Upload Button */}
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.accept = accept || '*/*'
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files && files.length > 0) {
                    handleFileUpload(files)
                  }
                }
                input.click()
              }}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload
            </Button>
          </div>

          {/* Media Grid/List */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading media...
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Image className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No media found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'Upload your first media file to get started'
                  }
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredMedia.map((item) => (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <CardContent className="p-2">
                      <div className="aspect-square bg-muted rounded-md mb-2 overflow-hidden relative">
                        {item.mime_type.startsWith('image/') ? (
                          <img
                            src={item.thumbnail_url || item.url}
                            alt={item.alt_text || item.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {getFileIcon(item.mime_type)}
                          </div>
                        )}
                        {selectedItems.has(item.id) && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs">
                        <p className="font-medium truncate" title={item.filename}>
                          {item.filename}
                        </p>
                        <p className="text-muted-foreground">
                          {formatFileSize(item.size)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                      selectedItems.has(item.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                      {item.mime_type.startsWith('image/') ? (
                        <img
                          src={item.thumbnail_url || item.url}
                          alt={item.alt_text || item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {getFileIcon(item.mime_type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.filename}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(item.size)}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.mime_type.split('/')[1].toUpperCase()}
                        </Badge>
                        {item.dimensions && (
                          <span>
                            {item.dimensions.width}x{item.dimensions.height}
                          </span>
                        )}
                      </div>
                      {item.alt_text && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.alt_text}
                        </p>
                      )}
                    </div>

                    {selectedItems.has(item.id) && (
                      <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {multiple && selectedItems.size > 0 
                ? `${selectedItems.size} item(s) selected`
                : `${filteredMedia.length} item(s) available`
              }
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {multiple && selectedItems.size > 0 && (
                <Button onClick={handleConfirmSelection}>
                  Use Selected ({selectedItems.size})
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}