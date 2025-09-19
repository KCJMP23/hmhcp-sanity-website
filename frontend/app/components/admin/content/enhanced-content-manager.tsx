'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  User,
  Tag,
  Upload,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Send,
  Archive,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Star,
  Heart,
  MessageSquare,
  TrendingUp,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface ContentItem {
  id: string
  type: string
  title: string
  slug: string
  status: string
  workflow_state: string
  excerpt?: string
  featured_image_url?: string
  view_count: number
  like_count: number
  comment_count: number
  scheduled_publish_at?: string
  published_at?: string
  created_at: string
  updated_at: string
  author: {
    id: string
    email: string
    role: string
  }
  category?: {
    id: string
    name: string
    slug: string
  }
}

interface ContentFormData {
  type: string
  title: string
  slug: string
  content: any
  excerpt: string
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  tags: string[]
  featured_image_url: string
  social_image_url: string
  category_id: string
  scheduled_publish_at: string
}

const WORKFLOW_STATES = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Edit },
  in_review: { color: 'bg-yellow-100 text-yellow-800', label: 'In Review', icon: Clock },
  approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
  published: { color: 'bg-blue-100 text-blue-800', label: 'Published', icon: Globe },
  scheduled: { color: 'bg-purple-100 text-purple-800', label: 'Scheduled', icon: Calendar },
  archived: { color: 'bg-red-100 text-red-800', label: 'Archived', icon: Archive }
}

const CONTENT_TYPES = [
  { value: 'page', label: 'Page' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'clinical_trial', label: 'Clinical Trial' },
  { value: 'research_publication', label: 'Research Publication' },
  { value: 'quality_study', label: 'Quality Study' }
]

export function EnhancedContentManager() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    workflow_state: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [formData, setFormData] = useState<Partial<ContentFormData>>({})
  const [categories, setCategories] = useState<any[]>([])

  // Load content items
  const loadContent = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const response = await fetch(`/api/admin/content/enhanced?${params}`)
      if (!response.ok) throw new Error('Failed to load content')

      const data = await response.json()
      setContentItems(data.data || [])
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch (error) {
      console.error('Error loading content:', error)
      toast.error('Failed to load content items')
    } finally {
      setLoading(false)
    }
  }

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  useEffect(() => {
    loadContent()
  }, [pagination.page, filters])

  useEffect(() => {
    loadCategories()
  }, [])

  // Handle workflow state change
  const handleWorkflowChange = async (contentId: string, newState: string) => {
    try {
      const response = await fetch('/api/admin/content/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({
          content_id: contentId,
          new_state: newState,
          user_id: 'current-user-id' // Replace with actual user ID
        })
      })

      if (!response.ok) throw new Error('Failed to update workflow state')

      toast.success('Workflow state updated successfully')

      loadContent()
    } catch (error) {
      console.error('Error updating workflow:', error)
      toast.error('Failed to update workflow state')
    }
  }

  // Handle bulk operations
  const handleBulkOperation = async (operation: string) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to perform bulk operations')
      return
    }

    try {
      const response = await fetch('/api/admin/content/workflow', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({
          content_ids: selectedItems,
          new_state: operation,
          user_id: 'current-user-id' // Replace with actual user ID
        })
      })

      if (!response.ok) throw new Error('Failed to perform bulk operation')

      const result = await response.json()
      toast.success(`${result.successful} items updated, ${result.failed} failed`)

      setSelectedItems([])
      loadContent()
    } catch (error) {
      console.error('Error with bulk operation:', error)
      toast.error('Failed to perform bulk operation')
    }
  }

  // Get CSRF token (implement this function)
  const getCSRFToken = async () => {
    // Implementation depends on your CSRF system
    return 'csrf-token'
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display text-gray-900 dark:text-white tracking-tight">
            Content Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all content with advanced workflow and publishing controls
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Content
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-text">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 rounded-lg"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type">Content Type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {CONTENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workflow_state">Workflow State</Label>
              <Select 
                value={filters.workflow_state} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, workflow_state: value }))}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All states</SelectItem>
                  {Object.entries(WORKFLOW_STATES).map(([key, state]) => (
                    <SelectItem key={key} value={key}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ type: '', status: '', workflow_state: '', search: '' })}
                className="rounded-lg"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="rounded-2xl border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-text text-blue-700 dark:text-blue-300">
                {selectedItems.length} items selected
              </span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('in_review')}
                  className="rounded-lg"
                >
                  Submit for Review
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('published')}
                  className="rounded-lg"
                >
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('archived')}
                  className="rounded-lg"
                >
                  Archive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Table */}
      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-text">Content Items</CardTitle>
          <CardDescription>
            {pagination.total} total items • Page {pagination.page} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === contentItems.length && contentItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(contentItems.map(item => item.id))
                          } else {
                            setSelectedItems([])
                          }
                        }}
                        className="rounded-sm"
                      />
                    </TableHead>
                    <TableHead>Title & Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentItems.map((item) => {
                    const StateIcon = WORKFLOW_STATES[item.workflow_state as keyof typeof WORKFLOW_STATES]?.icon || FileText
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(prev => [...prev, item.id])
                              } else {
                                setSelectedItems(prev => prev.filter(id => id !== item.id))
                              }
                            }}
                            className="rounded-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-text font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs rounded-md">
                                {CONTENT_TYPES.find(t => t.value === item.type)?.label || item.type}
                              </Badge>
                              {item.category && (
                                <Badge variant="secondary" className="text-xs rounded-md">
                                  {item.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <StateIcon className="w-4 h-4" />
                            <Badge 
                              className={`${WORKFLOW_STATES[item.workflow_state as keyof typeof WORKFLOW_STATES]?.color || 'bg-gray-100 text-gray-800'} text-xs rounded-md`}
                            >
                              {WORKFLOW_STATES[item.workflow_state as keyof typeof WORKFLOW_STATES]?.label || item.workflow_state}
                            </Badge>
                          </div>
                          {item.scheduled_publish_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Scheduled: {formatDate(item.scheduled_publish_at)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{item.view_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{item.like_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{item.comment_count}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {item.author.email}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1 rounded-md">
                            {item.author.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs text-gray-500">
                            <div>Created: {formatDate(item.created_at)}</div>
                            <div>Updated: {formatDate(item.updated_at)}</div>
                            {item.published_at && (
                              <div>Published: {formatDate(item.published_at)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                              className="rounded-lg"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Select onValueChange={(value) => handleWorkflowChange(item.id, value)}>
                              <SelectTrigger className="w-32 h-8 rounded-lg">
                                <SelectValue placeholder="Actions" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(WORKFLOW_STATES).map(([key, state]) => (
                                  <SelectItem key={key} value={key} disabled={key === item.workflow_state}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="rounded-lg"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="rounded-lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}