'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  FileText,
  Globe,
  Archive,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Page {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  author_id: string
  created_at: string
  updated_at: string
  published_at?: string
  admin_users?: {
    email: string
  }
}

export function PagesManagement() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletePageId, setDeletePageId] = useState<string | null>(null)

  useEffect(() => {
    fetchPages()
  }, [statusFilter])

  const fetchPages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/admin/pages?${params}`)
      const data = await res.json()
      
      if (res.ok) {
        setPages(data.items || [])
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch pages',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pages',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/pages/${id}/publish`, {
        method: 'POST'
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Page published successfully'
        })
        fetchPages()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to publish page',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish page',
        variant: 'destructive'
      })
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/pages/${id}/unpublish`, {
        method: 'POST'
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Page unpublished successfully'
        })
        fetchPages()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to unpublish page',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unpublish page',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!deletePageId) return

    try {
      const res = await fetch(`/api/admin/pages/${deletePageId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Page deleted successfully'
        })
        fetchPages()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete page',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive'
      })
    } finally {
      setDeletePageId(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/pages/${id}/duplicate`, {
        method: 'POST'
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Page duplicated successfully'
        })
        fetchPages()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to duplicate page',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate page',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            Create and manage custom pages with the visual page builder
          </p>
        </div>
        <Button 
          onClick={() => router.push('/admin/pages/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Page
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPages()}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="icon"
          onClick={fetchPages}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Pages Table */}
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading pages...
                  </div>
                </TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No pages found</p>
                    <Button 
                      size="sm" 
                      onClick={() => router.push('/admin/pages/new')}
                    >
                      Create your first page
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    {getStatusIcon(page.status)}
                  </TableCell>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                  <TableCell>{getStatusBadge(page.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {page.admin_users?.email || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(page.updated_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Page
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push(`/admin/pages/${page.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Page
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(page.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {page.status === 'published' ? (
                          <DropdownMenuItem onClick={() => handleUnpublish(page.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Unpublish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePublish(page.id)}>
                            <Globe className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeletePageId(page.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePageId} onOpenChange={() => setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the page
              and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}