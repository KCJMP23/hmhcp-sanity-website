'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { EditDialogProps, MediaItem } from './types'

export function EditDialog({ 
  editingItem, 
  onClose, 
  onSave 
}: EditDialogProps) {
  const [formData, setFormData] = useState<Partial<MediaItem>>({})

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem)
    }
  }, [editingItem])

  const handleSave = () => {
    if (editingItem && formData) {
      onSave(editingItem.id, formData)
    }
  }

  const updateFormData = (field: keyof MediaItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!editingItem) return null

  return (
    <Dialog open={!!editingItem} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-text">Edit Media</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={formData.filename || ''}
              onChange={(e) => updateFormData('filename', e.target.value)}
              className="rounded-lg"
            />
          </div>
          
          <div>
            <Label htmlFor="alt_text">Alt Text</Label>
            <Input
              id="alt_text"
              value={formData.alt_text || ''}
              onChange={(e) => updateFormData('alt_text', e.target.value)}
              className="rounded-lg"
              placeholder="Descriptive text for accessibility"
            />
          </div>
          
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={formData.caption || ''}
              onChange={(e) => updateFormData('caption', e.target.value)}
              className="rounded-lg"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => updateFormData('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              className="rounded-lg"
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}