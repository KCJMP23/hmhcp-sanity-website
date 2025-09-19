'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Copy, 
  Download, 
  Trash2, 
  Save,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react'
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

interface MediaUsage {
  id: string
  type: string
  location: string
  last_accessed?: string
}
import { logger } from '@/lib/logger';

interface MediaDetailModalProps {
  media: MediaFile
  onClose: () => void
  onUpdate?: (media: MediaFile) => void
  onDelete?: (id: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function MediaDetailModal({
  media,
  onClose,
  onUpdate,
  onDelete,
  canEdit = false,
  canDelete = false
}: MediaDetailModalProps) {
  const [metadata, setMetadata] = useState({
    alt_text: media.alt_text || '',
    title: media.title || '',
    description: media.description || ''
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [usage, setUsage] = useState<MediaUsage[]>([])
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [publicUrl, setPublicUrl] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchUsage()
    fetchPublicUrl()
  }, [media.id])

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/cms/media/${media.id}/usage`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      logger.error('Failed to fetch usage:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoadingUsage(false)
    }
  }

  const fetchPublicUrl = async () => {
    try {
      const response = await fetch(`/api/cms/media/${media.id}/url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPublicUrl(data.url)
      }
    } catch (error) {
      logger.error('Failed to fetch public URL:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleSave = async () => {
    if (!canEdit) return

    setSaving(true)
    try {
      const response = await fetch(`/api/cms/media/${media.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify(metadata)
      })

      if (!response.ok) {
        throw new Error('Failed to update media')
      }

      const updatedMedia = await response.json()
      onUpdate?.(updatedMedia)
      
      toast({
        title: 'Success',
        description: 'Media metadata updated successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update media metadata',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete || usage.length > 0) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/cms/media/${media.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        }
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete media')
      }

      onDelete?.(media.id)
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete media',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString))
  }

  const isImage = media.mime_type.startsWith('image/')

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Media Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
              {isImage ? (
                <img
                  src={publicUrl}
                  alt={media.alt_text || media.filename}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2">
                      {/* File type icon */}
                      <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">{media.mime_type}</p>
                  </div>
                </div>
              )}
            </div>

            {/* File info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Filename:</span>
                <span className="font-medium">{media.original_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{formatFileSize(media.size_bytes)}</span>
              </div>
              {media.width && media.height && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium">{media.width} × {media.height}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{media.mime_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploaded:</span>
                <span className="font-medium">{media.created_at ? formatDate(media.created_at) : 'Unknown date'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(publicUrl)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(publicUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = publicUrl
                  a.download = media.original_name
                  a.click()
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  value={metadata.alt_text}
                  onChange={(e) => setMetadata(prev => ({ ...prev, alt_text: e.target.value }))}
                  placeholder="Describe this image for accessibility"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Media title"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about this media"
                  rows={3}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* Usage info */}
            {loadingUsage ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : usage.length > 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This media is used in {usage.length} location{usage.length > 1 ? 's' : ''}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  This media is not currently being used
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete || usage.length > 0 || deleting}
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!canEdit || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}