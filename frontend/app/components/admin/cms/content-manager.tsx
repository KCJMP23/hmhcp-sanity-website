'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  User,
  FileText,
  Sparkles,
  Globe,
  Smartphone,
  Navigation,
  Image,
  Users,
  Settings,
  BookOpen
} from 'lucide-react'
import { BaseContentItem } from '@/lib/types/cms-types'
import { ContentEditor } from './content-editor'
import { AIContentGenerator } from './ai-content-generator'
import { ContentPreview } from './content-preview'
import { format } from 'date-fns'

interface ContentManagerProps {
  initialContentType?: string
}

export function ContentManager({ initialContentType = 'all' }: ContentManagerProps) {
  const [content, setContent] = useState<BaseContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContentType, setSelectedContentType] = useState(initialContentType)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedContent, setSelectedContent] = useState<BaseContentItem | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Content type configurations
  const contentTypes = [
    { value: 'all', label: 'All Content', icon: FileText, description: 'All content types' },
    { value: 'homepage-hero', label: 'Homepage Hero', icon: Globe, description: 'Main homepage hero section' },
    { value: 'cro-showcase', label: 'CRO Showcase', icon: Sparkles, description: 'Apple-style showcase cards' },
    { value: 'phone-showcase', label: 'Phone Showcase', icon: Smartphone, description: 'Interactive phone screens' },
    { value: 'navigation', label: 'Navigation', icon: Navigation, description: 'Site navigation menus' },
    { value: 'platform-page', label: 'Platform Pages', icon: Settings, description: 'Platform detail pages' },
    { value: 'service-page', label: 'Service Pages', icon: Users, description: 'Service description pages' },
    { value: 'research-page', label: 'Research Pages', icon: BookOpen, description: 'Research and publications' },
    { value: 'blog-post', label: 'Blog Posts', icon: FileText, description: 'Blog articles and posts' },
    { value: 'footer', label: 'Footer Content', icon: Navigation, description: 'Footer sections and links' },
    { value: 'media-item', label: 'Media Library', icon: Image, description: 'Images and media files' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ]

  useEffect(() => {
    loadContent()
  }, [selectedContentType, statusFilter, currentPage, searchQuery])

  const loadContent = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (selectedContentType !== 'all') {
        params.append('type', selectedContentType)
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/admin/cms/content?${params}`)
      if (!response.ok) throw new Error('Failed to load content')

      const result = await response.json()
      setContent(result.data || [])
      setTotalPages(result.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load content:', error)
      toast({
        title: 'Error',
        description: 'Failed to load content. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedContent(null)
    setIsEditorOpen(true)
  }

  const handleEdit = (item: BaseContentItem) => {
    setSelectedContent(item)
    setIsEditorOpen(true)
  }

  const handlePreview = (item: BaseContentItem) => {
    setSelectedContent(item)
    setIsPreviewOpen(true)
  }

  const handleDelete = async (item: BaseContentItem) => {
    if (!confirm(`Are you sure you want to archive "${item.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/cms/content/${item.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete content')

      toast({
        title: 'Success',
        description: 'Content archived successfully'
      })

      loadContent()
    } catch (error) {
      console.error('Failed to delete content:', error)
      toast({
        title: 'Error',
        description: 'Failed to archive content. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleAIGenerate = () => {
    setIsAIGeneratorOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default'
      case 'draft': return 'secondary'
      case 'archived': return 'outline'
      default: return 'secondary'
    }
  }

  const getContentTypeIcon = (type: string) => {
    const contentType = contentTypes.find(ct => ct.value === type)
    return contentType?.icon || FileText
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all website content with AI-powered assistance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAIGenerate} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Content Type Tabs */}
      <Tabs value={selectedContentType} onValueChange={setSelectedContentType} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11">
          {contentTypes.map((type) => {
            const Icon = type.icon
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{type.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadContent} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Content Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{content.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content.filter(item => item.status === 'published').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content.filter(item => item.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content.filter(item => item.status === 'archived').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Table */}
        <TabsContent value={selectedContentType} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading content...</span>
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No content found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your filters or search query'
                      : 'Create your first piece of content to get started'
                    }
                  </p>
                  <Button onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Content
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => {
                      const Icon = getContentTypeIcon(item.type)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              {item.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.status)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(item.updated_at), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="w-3 h-3" />
                              {item.author_id}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(item)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedContent ? 'Edit Content' : 'Create New Content'}
            </DialogTitle>
            <DialogDescription>
              {selectedContent 
                ? `Editing "${selectedContent.title}"`
                : 'Create new content with AI assistance'
              }
            </DialogDescription>
          </DialogHeader>
          <ContentEditor
            content={selectedContent}
            onSave={(updatedContent) => {
              setIsEditorOpen(false)
              loadContent()
              toast({
                title: 'Success',
                description: 'Content saved successfully'
              })
            }}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
            <DialogDescription>
              Preview how this content will appear on the website
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <ContentPreview content={selectedContent} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAIGeneratorOpen} onOpenChange={setIsAIGeneratorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>AI Content Generator</DialogTitle>
            <DialogDescription>
              Generate new content using BMAD Method AI agents
            </DialogDescription>
          </DialogHeader>
          <AIContentGenerator
            onGenerate={(generatedContent) => {
              setIsAIGeneratorOpen(false)
              // Handle generated content
              toast({
                title: 'Success',
                description: 'Content generated successfully'
              })
            }}
            onCancel={() => setIsAIGeneratorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}