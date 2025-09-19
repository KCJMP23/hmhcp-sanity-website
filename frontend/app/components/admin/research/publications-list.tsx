'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  Users,
  BookOpen,
  ExternalLink
} from 'lucide-react'
import { Publication, PublicationsFilters, PaginationInfo } from '@/types/publications'
import { formatDate } from '@/lib/utils'

interface PublicationsListProps {
  publications: Publication[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo
  filters: PublicationsFilters
  onFiltersChange: (filters: Partial<PublicationsFilters>) => void
  onPageChange: (page: number) => void
  onEdit: (publication: Publication) => void
  onDelete: (publicationId: string) => void
}

export default function PublicationsList({
  publications,
  loading,
  error,
  pagination,
  filters,
  onFiltersChange,
  onPageChange,
  onEdit,
  onDelete,
}: PublicationsListProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null)

  const handleDeleteClick = (publication: Publication) => {
    setPublicationToDelete(publication)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (publicationToDelete) {
      onDelete(publicationToDelete.id)
      setDeleteDialogOpen(false)
      setPublicationToDelete(null)
    }
  }

  const handleEditClick = (publication: Publication) => {
    // Navigate to edit page or call onEdit
    router.push(`/admin/research/publications/${publication.id}/edit`)
  }

  const getStatusBadge = (status: Publication['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPublicationTypeBadge = (type: string) => {
    const colors = {
      'Research Article': 'bg-blue-100 text-blue-800',
      'Review': 'bg-green-100 text-green-800',
      'Case Study': 'bg-purple-100 text-purple-800',
      'Editorial': 'bg-orange-100 text-orange-800',
      'Conference Paper': 'bg-gray-100 text-gray-800',
    }
    const colorClass = colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    
    return (
      <Badge className={`${colorClass} hover:${colorClass}`}>
        {type}
      </Badge>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Table skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error loading publications</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!loading && publications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Publications
              </CardTitle>
            </div>
            <Button onClick={() => router.push('/admin/research/publications/new')}>
              Add Publication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search publications..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value as any })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No publications found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.status !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first publication.'}
            </p>
            <Button onClick={() => router.push('/admin/research/publications/new')}>
              Add First Publication
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Publications ({pagination.totalItems})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage research publications and academic papers
            </p>
          </div>
          <Button onClick={() => router.push('/admin/research/publications/new')}>
            Add Publication
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title or author..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value as any })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Publications Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Authors</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publications.map((publication) => (
                <TableRow key={publication.id} className="hover:bg-muted/50">
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <div className="font-medium text-sm leading-none">
                        {publication.title}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {getPublicationTypeBadge(publication.publicationType)}
                        {publication.impactFactor && (
                          <Badge variant="outline" className="text-xs">
                            IF: {publication.impactFactor}
                          </Badge>
                        )}
                        {publication.citations && (
                          <Badge variant="outline" className="text-xs">
                            Citations: {publication.citations}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <Users className="h-3 w-3 inline mr-1" />
                      {publication.authors.slice(0, 2).join(', ')}
                      {publication.authors.length > 2 && (
                        <span className="text-muted-foreground">
                          {' '}+{publication.authors.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      <span className="truncate max-w-32">{publication.journal}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {publication.year}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(publication.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {publication.doi && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://doi.org/${publication.doi}`, '_blank')}
                          title="View DOI"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(publication)}
                        title="Edit publication"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(publication)}
                        title="Delete publication"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} publications
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    className={pagination.currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={page === pagination.currentPage}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    className={pagination.currentPage >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Publication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{publicationToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}