'use client'

import { useState } from 'react'
import { Trash2, Move, Tag, Download, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
}

interface MediaFolder {
  id: string
  name: string
  parentId?: string
}

interface MediaTag {
  id: string
  name: string
  color: string
}

interface BulkActionsBarProps {
  selectedFiles: MediaFile[]
  folders: MediaFolder[]
  tags: MediaTag[]
  onSelectionClear: () => void
  onActionComplete: () => void
}

export function BulkActionsBar({ 
  selectedFiles, 
  folders, 
  tags, 
  onSelectionClear, 
  onActionComplete 
}: BulkActionsBarProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { toast } = useToast()

  if (selectedFiles.length === 0) return null

  const performBulkOperation = async (operation: string, options: any = {}) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation,
          mediaIds: selectedFiles.map(f => f.id),
          ...options
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${operation} files`)
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: result.data.message || `${operation} completed successfully`
      })

      onActionComplete()
      onSelectionClear()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async () => {
    if (!selectedFolder && selectedFolder !== '') {
      toast({
        title: 'Error',
        description: 'Please select a destination folder',
        variant: 'destructive'
      })
      return
    }

    await performBulkOperation('move', { 
      folderId: selectedFolder === 'root' ? null : selectedFolder 
    })
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
      return
    }

    await performBulkOperation('delete')
  }

  const handleTag = async () => {
    if (selectedTags.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one tag',
        variant: 'destructive'
      })
      return
    }

    await performBulkOperation('tag', { tagIds: selectedTags })
  }

  const handleDownload = async () => {
    try {
      const fileUrls = selectedFiles.map(file => ({
        name: file.original_name,
        url: `/api/cms/media/${file.id}/url`
      }))

      for (const file of fileUrls) {
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      toast({
        title: 'Success',
        description: `Started downloading ${selectedFiles.length} file(s)`
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download files',
        variant: 'destructive'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size_bytes, 0)

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-4 z-50 max-w-4xl w-full mx-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            <span className="text-gray-500 ml-2">({formatFileSize(totalSize)})</span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root Folder</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={handleMove}
              disabled={loading || !selectedFolder}
            >
              <Move className="w-4 h-4 mr-2" />
              Move
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select tags" />
              </SelectTrigger>
              <SelectContent>
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3" 
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={handleTag}
              disabled={loading || selectedTags.length === 0}
            >
              <Tag className="w-4 h-4 mr-2" />
              Tag
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onSelectionClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}