'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { logger } from '@/lib/logging/client-safe-logger'
// Using Winston logger for notifications
import {
  Menu,
  Search,
  Filter,
  Plus,
  Edit,
  Copy,
  Eye,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Globe,
  Smartphone,
  Layout,
  Sidebar,
  Shield,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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

interface Navigation {
  id: string
  name: string
  location: 'header' | 'footer' | 'mobile' | 'sidebar'
  status: 'active' | 'inactive' | 'draft'
  itemsCount: number
  isDefault: boolean
  updatedAt: string
  updatedBy?: {
    full_name: string
    email: string
  }
  hasSpecialPermissions?: boolean
  userHasAccess?: boolean
}

interface NavigationListProps {
  initialData: Navigation[]
  totalCount: number
  currentPage: number
  pageSize: number
}

const locationIcons = {
  header: Globe,
  footer: Layout,
  mobile: Smartphone,
  sidebar: Sidebar,
}

const statusColors = {
  active: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
}

export default function NavigationList({
  initialData,
  totalCount,
  currentPage,
  pageSize,
}: NavigationListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [navigations, setNavigations] = useState(initialData)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; navigation?: Navigation }>({ open: false })
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const totalPages = Math.ceil(totalCount / pageSize)

  const updateSearchParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    startTransition(() => {
      router.push(`/admin/navigation?${params.toString()}`)
    })
  }, [router, searchParams])

  const handleDelete = async (navigation: Navigation) => {
    try {
      const response = await fetch(`/api/admin/navigations/${navigation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete navigation')
      }

      setNavigations(navigations.filter(n => n.id !== navigation.id))
      logger.info('Navigation deleted successfully', {
        component: 'NavigationList',
        action: 'deleteNavigation',
        navigationId: navigation.id
      })
      setDeleteDialog({ open: false })
    } catch (error) {
      logger.error('Failed to delete navigation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'NavigationList',
        action: 'deleteNavigation',
        navigationId: navigation.id
      })
    }
  }

  const handleDuplicate = async (navigation: Navigation) => {
    try {
      const response = await fetch('/api/admin/navigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${navigation.name} (Copy)`,
          location: navigation.location,
          status: 'draft',
          is_default: false,
        }),
      })

      if (!response.ok) throw new Error('Failed to duplicate navigation')

      const { data } = await response.json()
      logger.info('Navigation duplicated successfully', {
        component: 'NavigationList',
        action: 'duplicateNavigation',
        navigationId: navigation.id
      })
      router.refresh()
    } catch (error) {
      logger.error('Failed to duplicate navigation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'NavigationList',
        action: 'duplicateNavigation',
        navigationId: navigation.id
      })
    }
  }

  const handleBulkStatusUpdate = async (status: 'active' | 'inactive') => {
    try {
      const updates = selectedItems.map(id =>
        fetch(`/api/admin/navigations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      )

      await Promise.all(updates)
      logger.info('Bulk navigation update completed', {
        component: 'NavigationList',
        action: 'handleBulkUpdate',
        updatedCount: selectedItems.length,
        operation: 'bulk_update'
      })
      setSelectedItems([])
      router.refresh()
    } catch (error) {
      logger.error('Failed to update navigations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'NavigationList',
        action: 'handleBulkUpdate',
        itemCount: selectedItems.length
      })
    }
  }

  const filteredNavigations = navigations.filter(nav => {
    const matchesSearch = nav.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = locationFilter === 'all' || nav.location === locationFilter
    const matchesStatus = statusFilter === 'all' || nav.status === statusFilter
    return matchesSearch && matchesLocation && matchesStatus
  })

  const sortedNavigations = [...filteredNavigations].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'location':
        return a.location.localeCompare(b.location)
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      default:
        return 0
    }
  })

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search navigations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Link href="/admin/navigation/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Navigation
          </Button>
        </Link>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 flex items-center justify-between"
        >
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedItems.length} items selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate('active')}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate('inactive')}
            >
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedItems([])}
            >
              Clear
            </Button>
          </div>
        </motion.div>
      )}

      {/* Navigation Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden">
        <div className="overflow-x-hidden">
          <div className="w-full overflow-x-auto"><table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === sortedNavigations.length && sortedNavigations.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(sortedNavigations.map(n => n.id))
                      } else {
                        setSelectedItems([])
                      }
                    }}
                    className="border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {sortedNavigations.map((navigation) => {
                  const LocationIcon = locationIcons[navigation.location]
                  
                  return (
                    <motion.tr
                      key={navigation.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(navigation.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, navigation.id])
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== navigation.id))
                            }
                          }}
                          className="border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {navigation.name}
                              </span>
                              {navigation.hasSpecialPermissions && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                              {navigation.userHasAccess === false && (
                                <Lock className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            {navigation.isDefault && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                          <LocationIcon className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{navigation.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn('capitalize', statusColors[navigation.status])}>
                          {navigation.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {navigation.itemsCount} items
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(navigation.updatedAt).toLocaleDateString()}
                        </div>
                        {navigation.updatedBy && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            by {navigation.updatedBy.full_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/navigation/edit/${navigation.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(navigation)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/navigation/${navigation.id}/preview`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/navigation/edit/${navigation.id}?tab=permissions`}>
                                <Shield className="h-4 w-4 mr-2" />
                                Permissions
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-blue-400"
                              onClick={() => setDeleteDialog({ open: true, navigation })}
                              disabled={navigation.isDefault}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table></div>
        </div>

        {/* Empty State */}
        {sortedNavigations.length === 0 && (
          <div className="text-center py-12">
            <Menu className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No navigations found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || locationFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating a new navigation menu'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSearchParams({ page: String(currentPage - 1) })}
              disabled={currentPage === 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSearchParams({ page: String(i + 1) })}
                disabled={isPending}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSearchParams({ page: String(currentPage + 1) })}
              disabled={currentPage === totalPages || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Navigation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.navigation?.name}"? This action cannot be undone
              and will remove all associated menu items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.navigation && handleDelete(deleteDialog.navigation)}
              className="bg-red-600 hover:bg-blue-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}