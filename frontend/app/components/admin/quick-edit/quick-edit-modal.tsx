'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { 
  CalendarIcon,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  Tag,
  Folder,
  User,
  Clock,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickEditItem {
  id: string
  title: string
  slug: string
  status: 'published' | 'draft' | 'scheduled' | 'private'
  visibility: 'public' | 'private' | 'password'
  publishDate?: Date
  author?: string
  excerpt?: string
  categories?: string[]
  tags?: string[]
  featuredImage?: string
  password?: string
  seoTitle?: string
  seoDescription?: string
  type: 'post' | 'page'
}

interface QuickEditModalProps {
  item: QuickEditItem | null
  onClose: () => void
  onSave: (item: QuickEditItem) => Promise<void>
}

export function QuickEditModal({ item, onClose, onSave }: QuickEditModalProps) {
  const [editedItem, setEditedItem] = useState<QuickEditItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (item) {
      setEditedItem({ ...item })
    }
  }, [item])

  if (!item || !editedItem) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedItem)
      onClose()
    } catch (error) {
      console.error('Quick edit save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && editedItem.tags) {
      setEditedItem({
        ...editedItem,
        tags: [...editedItem.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    if (editedItem.tags) {
      setEditedItem({
        ...editedItem,
        tags: editedItem.tags.filter(t => t !== tag)
      })
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Quick Edit: {item.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="publishing">Publishing</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            <TabsContent value="general" className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedItem.title}
                  onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={editedItem.slug}
                    onChange={(e) => setEditedItem({ ...editedItem, slug: e.target.value })}
                    placeholder="/page-url"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const generatedSlug = editedItem.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')
                      setEditedItem({ ...editedItem, slug: `/${generatedSlug}` })
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={editedItem.excerpt || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, excerpt: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>

              {/* Categories */}
              <div>
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Healthcare', 'Technology', 'Research', 'News'].map(category => (
                    <label key={category} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editedItem.categories?.includes(category)}
                        onChange={(e) => {
                          const categories = editedItem.categories || []
                          setEditedItem({
                            ...editedItem,
                            categories: e.target.checked
                              ? [...categories, category]
                              : categories.filter(c => c !== category)
                          })
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                    />
                    <Button onClick={addTag} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedItem.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-blue-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publishing" className="space-y-4">
              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={editedItem.status}
                  onValueChange={(value: any) => setEditedItem({ ...editedItem, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Published
                      </div>
                    </SelectItem>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        Draft
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Scheduled
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        Private
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div>
                <Label>Visibility</Label>
                <Select
                  value={editedItem.visibility}
                  onValueChange={(value: any) => setEditedItem({ ...editedItem, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Private
                      </div>
                    </SelectItem>
                    <SelectItem value="password">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Password Protected
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password field for password-protected posts */}
              {editedItem.visibility === 'password' && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={editedItem.password || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, password: e.target.value })}
                      placeholder="Enter password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Publish Date */}
              <div>
                <Label>Publish Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !editedItem.publishDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editedItem.publishDate ? format(editedItem.publishDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editedItem.publishDate}
                      onSelect={(date) => date && setEditedItem({ ...editedItem, publishDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Author */}
              <div>
                <Label>Author</Label>
                <Select
                  value={editedItem.author}
                  onValueChange={(value) => setEditedItem({ ...editedItem, author: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select author" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comments */}
              <div className="flex items-center justify-between">
                <Label htmlFor="comments">Allow Comments</Label>
                <Switch id="comments" />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              {/* SEO Title */}
              <div>
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={editedItem.seoTitle || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, seoTitle: e.target.value })}
                  placeholder="Custom title for search engines"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editedItem.seoTitle?.length || 0}/60 characters
                </p>
              </div>

              {/* SEO Description */}
              <div>
                <Label htmlFor="seo-description">SEO Description</Label>
                <Textarea
                  id="seo-description"
                  value={editedItem.seoDescription || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, seoDescription: e.target.value })}
                  placeholder="Brief description for search results"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editedItem.seoDescription?.length || 0}/160 characters
                </p>
              </div>

              {/* Preview */}
              <div className="mt-4">
                <Label>Search Preview</Label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-full">
                  <div className="text-blue-600 dark:text-blue-400 text-lg">
                    {editedItem.seoTitle || editedItem.title}
                  </div>
                  <div className="text-green-700 dark:text-blue-400 text-sm">
                    {window.location.origin}{editedItem.slug}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {editedItem.seoDescription || editedItem.excerpt || 'No description provided'}
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}