'use client'

import { useState, useEffect } from 'react'
import { Filter, Star, Trash2, Edit, Plus, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface SavedFilter {
  id: string
  name: string
  filterConfig: any
  createdBy: string
  isPublic: boolean
  usageCount: number
  createdAt: string
}

interface SavedFiltersProps {
  onFilterApply: (filterConfig: any) => void
  className?: string
}

export function SavedFilters({ onFilterApply, className }: SavedFiltersProps) {
  const [filters, setFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null)
  const [filterName, setFilterName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [currentFilterConfig, setCurrentFilterConfig] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFilters()
  }, [])

  const loadFilters = async () => {
    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch('/api/cms/media/filters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load filters')

      const result = await response.json()
      setFilters(result.data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load saved filters',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveFilter = async () => {
    if (!filterName.trim() || !currentFilterConfig) return

    try {
      const token = localStorage.getItem('cms_token')
      const url = editingFilter 
        ? `/api/cms/media/filters/${editingFilter.id}`
        : '/api/cms/media/filters'
      
      const response = await fetch(url, {
        method: editingFilter ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: filterName.trim(),
          filterConfig: currentFilterConfig,
          isPublic
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save filter')
      }

      await loadFilters()
      resetDialog()

      toast({
        title: 'Success',
        description: `Filter ${editingFilter ? 'updated' : 'saved'} successfully`
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const deleteFilter = async (filterId: string) => {
    if (!confirm('Are you sure you want to delete this filter?')) return

    try {
      const token = localStorage.getItem('cms_token')
      const response = await fetch(`/api/cms/media/filters/${filterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete filter')
      }

      await loadFilters()

      toast({
        title: 'Success',
        description: 'Filter deleted successfully'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    }
  }

  const applyFilter = async (filter: SavedFilter) => {
    try {
      // Increment usage count
      const token = localStorage.getItem('cms_token')
      await fetch(`/api/cms/media/filters/${filter.id}/use`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      onFilterApply(filter.filterConfig)
      
      toast({
        title: 'Filter Applied',
        description: `Applied filter: ${filter.name}`
      })

      // Reload to update usage count
      loadFilters()

    } catch (error) {
      // Still apply the filter even if usage tracking fails
      onFilterApply(filter.filterConfig)
      
      toast({
        title: 'Filter Applied',
        description: `Applied filter: ${filter.name}`
      })
    }
  }

  const startEdit = (filter: SavedFilter) => {
    setEditingFilter(filter)
    setFilterName(filter.name)
    setIsPublic(filter.isPublic)
    setCurrentFilterConfig(filter.filterConfig)
    setShowCreateDialog(true)
  }

  const resetDialog = () => {
    setEditingFilter(null)
    setFilterName('')
    setIsPublic(false)
    setCurrentFilterConfig(null)
    setShowCreateDialog(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFilterSummary = (filterConfig: any) => {
    const parts = []
    
    if (filterConfig.search) parts.push(`Search: "${filterConfig.search}"`)
    if (filterConfig.folderIds?.length) parts.push(`${filterConfig.folderIds.length} folder(s)`)
    if (filterConfig.tagIds?.length) parts.push(`${filterConfig.tagIds.length} tag(s)`)
    if (filterConfig.mimeTypes?.length) parts.push(`${filterConfig.mimeTypes.length} file type(s)`)
    if (filterConfig.dateFrom || filterConfig.dateTo) parts.push('Date range')
    if (filterConfig.sizeMin || filterConfig.sizeMax) parts.push('Size range')
    if (filterConfig.widthMin || filterConfig.widthMax || filterConfig.heightMin || filterConfig.heightMax) {
      parts.push('Dimensions')
    }
    if (filterConfig.hasUsage !== undefined) parts.push(filterConfig.hasUsage ? 'Used files' : 'Unused files')

    return parts.length > 0 ? parts.join(', ') : 'No filters applied'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Saved Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Saved Filters
              <Badge variant="secondary">{filters.length}</Badge>
            </span>
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={!currentFilterConfig}
            >
              <Plus className="w-4 h-4 mr-2" />
              Save Current
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {filters.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Saved Filters
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Save your frequently used filter combinations for quick access.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map(filter => (
                <div 
                  key={filter.id}
                  className="border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {filter.name}
                        </h4>
                        <div className="flex gap-1">
                          {filter.isPublic ? (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Used {filter.usageCount} times
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {getFilterSummary(filter.filterConfig)}
                      </p>

                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Created {formatDate(filter.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyFilter(filter)}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Apply
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(filter)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFilter(filter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={resetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFilter ? 'Edit Filter' : 'Save Filter'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Filter name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              maxLength={100}
            />

            <label className="flex items-center space-x-2">
              <Checkbox
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <span className="text-sm">
                Make public (visible to all users)
              </span>
            </label>

            {currentFilterConfig && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800">
                <h4 className="text-sm font-medium mb-2">Filter Preview:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getFilterSummary(currentFilterConfig)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={saveFilter} 
                disabled={!filterName.trim()}
              >
                {editingFilter ? 'Update Filter' : 'Save Filter'}
              </Button>
              <Button variant="outline" onClick={resetDialog}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}