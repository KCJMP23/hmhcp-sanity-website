'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface MediaTag {
  id: string
  name: string
  color: string
  description?: string
  usageCount: number
  createdAt: string
}

interface MediaTagManagerProps {
  onTagsChange?: () => void
  selectedTags?: string[]
  onTagToggle?: (tagId: string) => void
}

const TAG_COLORS = [
  '#EF4444', '#3B82F6', '#3B82F6', '#3B82F6', '#3B82F6',
  '#EC4899', '#6B7280', '#14B8A6', '#3B82F6', '#84CC16'
]

export function MediaTagManager({ onTagsChange, selectedTags = [], onTagToggle }: MediaTagManagerProps) {
  const [tags, setTags] = useState<MediaTag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<MediaTag | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagDescription, setNewTagDescription] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const { toast } = useToast()

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/tags', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load tags')

      const result = await response.json()
      setTags(result.data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createTag = async () => {
    if (!newTagName.trim()) return

    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: newTagDescription.trim() || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tag')
      }

      await loadTags()
      onTagsChange?.()
      
      setNewTagName('')
      setNewTagDescription('')
      setNewTagColor(TAG_COLORS[0])
      setShowCreateDialog(false)

      toast({
        title: 'Success',
        description: 'Tag created successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const updateTag = async () => {
    if (!editingTag || !newTagName.trim()) return

    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch(`/api/cms/media/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: newTagDescription.trim() || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tag')
      }

      await loadTags()
      onTagsChange?.()
      
      setEditingTag(null)
      setNewTagName('')
      setNewTagDescription('')
      setNewTagColor(TAG_COLORS[0])

      toast({
        title: 'Success',
        description: 'Tag updated successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch(`/api/cms/media/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tag')
      }

      await loadTags()
      onTagsChange?.()

      toast({
        title: 'Success',
        description: 'Tag deleted successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const startEdit = (tag: MediaTag) => {
    setEditingTag(tag)
    setNewTagName(tag.name)
    setNewTagDescription(tag.description || '')
    setNewTagColor(tag.color)
    setShowCreateDialog(true)
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setNewTagName('')
    setNewTagDescription('')
    setNewTagColor(TAG_COLORS[0])
    setShowCreateDialog(false)
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Media Tags
        </h3>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Tag
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No tags created yet. Create your first tag to organize media files.
          </p>
        ) : (
          tags.map(tag => (
            <div 
              key={tag.id} 
              className={`flex items-center justify-between p-2  border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedTags.includes(tag.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
              }`}
              onClick={() => onTagToggle?.(tag.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                <div 
                  className="w-3 h-3" 
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm font-medium">{tag.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {tag.usageCount}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    startEdit(tag)
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTag(tag.id)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              maxLength={50}
            />
            
            <Input
              placeholder="Description (optional)"
              value={newTagDescription}
              onChange={(e) => setNewTagDescription(e.target.value)}
            />

            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {TAG_COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8  border-2 ${
                      newTagColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingTag ? updateTag : createTag} 
                disabled={!newTagName.trim()}
              >
                {editingTag ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}