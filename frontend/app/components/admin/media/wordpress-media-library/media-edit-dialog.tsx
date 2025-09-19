'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Crop, RotateCw, Sliders } from 'lucide-react'
import type { MediaEditDialogProps } from './types'

export function MediaEditDialog({ 
  item, 
  onClose, 
  onSave 
}: MediaEditDialogProps) {
  const [formData, setFormData] = useState({
    altText: item.metadata?.altText || '',
    caption: item.metadata?.caption || '',
    tags: (item.metadata?.tags || []).join(', ')
  })

  const handleSave = () => {
    onSave({
      ...item,
      metadata: {
        ...item.metadata,
        altText: formData.altText,
        caption: formData.caption,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Preview */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-full overflow-hidden">
              {item.mime_type.startsWith('image/') ? (
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {item.mime_type.startsWith('image/') && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Crop className="h-4 w-4 mr-2" />
                  Crop
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <Button variant="outline" size="sm">
                  <Sliders className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <Label>Filename</Label>
              <p className="text-sm text-gray-600">{item.filename}</p>
            </div>

            <div>
              <Label>File URL</Label>
              <Input value={item.url} readOnly />
            </div>

            <div>
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                value={formData.altText}
                onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                placeholder="Describe this media for accessibility"
              />
            </div>

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Add a caption"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Comma-separated tags"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}