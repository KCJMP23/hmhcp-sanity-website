'use client'

import { useState, useCallback, useMemo } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { BulkSelector, BulkItemSelector, useBulkSelection } from './bulk-selector'
import { BulkActionsToolbar, BULK_ACTIONS, useBulkActions } from './bulk-actions-toolbar'
import { BulkProgressModal, useBulkProgress } from './bulk-progress-modal'

interface Post {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  category: string
  author_id: string
  created_at: string
  updated_at: string
}

interface BulkPostsManagerProps {
  posts: Post[]
  onPostsUpdate: () => void
  loading?: boolean
  className?: string
}

export function BulkPostsManager({ 
  posts, 
  onPostsUpdate, 
  loading = false,
  className 
}: BulkPostsManagerProps) {
  const { toast } = useToast()
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(posts)
  
  // Bulk selection hook
  const {
    selectedItems,
    setSelectedItems,
    toggleItem,
    clearSelection,
    getSelectedItems,
    selectedCount,
    hasSelection
  } = useBulkSelection(filteredPosts, (post) => post.id)

  // Bulk actions hook
  const {
    loading: actionLoading,
    error: actionError,
    executeAction,
    clearError
  } = useBulkActions()

  // Progress tracking hook
  const {
    activeJob,
    showModal,
    modalTitle,
    modalDescription,
    startOperation,
    closeModal
  } = useBulkProgress()

  // Filter configuration
  const filters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      options: [
        ...new Set(posts.map(post => post.category))
      ].map(category => ({ value: category, label: category }))
    }
  ], [posts])

  // Available bulk actions
  const availableActions = useMemo(() => [
    BULK_ACTIONS.PUBLISH,
    BULK_ACTIONS.UNPUBLISH,
    BULK_ACTIONS.ARCHIVE,
    {
      ...BULK_ACTIONS.DUPLICATE,
      maxItems: 10 // Limit duplicates for posts
    },
    BULK_ACTIONS.DELETE
  ], [])

  // Handle filter changes
  const handleFiltersChange = useCallback((activeFilters: Record<string, string>) => {
    let filtered = [...posts]

    Object.entries(activeFilters).forEach(([key, value]) => {
      switch (key) {
        case 'status':
          filtered = filtered.filter(post => post.status === value)
          break
        case 'category':
          filtered = filtered.filter(post => post.category === value)
          break
      }
    })

    setFilteredPosts(filtered)
    
    // Clear selection when filters change
    clearSelection()
  }, [posts, clearSelection])

  // Handle bulk actions
  const handleBulkAction = useCallback(async (actionId: string) => {
    const selectedPosts = getSelectedItems()
    const selectedIds = selectedPosts.map(post => post.id)

    if (selectedIds.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select items to perform bulk actions.',
        variant: 'destructive'
      })
      return
    }

    try {
      // For large operations, use the job queue
      if (selectedIds.length > 50) {
        const response = await fetch('/api/admin/bulk/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bulk_posts',
            payload: {
              action: actionId,
              ids: selectedIds
            },
            total_items: selectedIds.length
          })
        })

        if (!response.ok) {
          throw new Error('Failed to start bulk operation')
        }

        const { jobId } = await response.json()
        
        startOperation(
          jobId,
          `Bulk ${actionId} Posts`,
          `Processing ${selectedIds.length} posts...`
        )

      } else {
        // For smaller operations, execute directly
        await executeAction(
          actionId,
          selectedIds,
          '/api/admin/bulk/posts'
        )

        toast({
          title: 'Bulk Action Completed',
          description: `Successfully ${actionId}ed ${selectedIds.length} posts.`
        })

        // Refresh data
        onPostsUpdate()
        clearSelection()
      }

    } catch (error) {
      toast({
        title: 'Bulk Action Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      })
    }
  }, [getSelectedItems, executeAction, toast, onPostsUpdate, clearSelection, startOperation])

  // Handle operation completion
  const handleOperationComplete = useCallback((results: any) => {
    toast({
      title: 'Bulk Operation Completed',
      description: `${results.success} items processed successfully, ${results.failed} failed.`,
      variant: results.failed > 0 ? 'destructive' : 'default'
    })

    // Refresh data and clear selection
    onPostsUpdate()
    clearSelection()
  }, [toast, onPostsUpdate, clearSelection])

  // Render individual post item
  const renderPostItem = useCallback((post: Post) => (
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {post.title}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {post.category} • {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            post.status === 'published' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : post.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {post.status}
          </span>
        </div>
      </div>
    </div>
  ), [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bulk Selector */}
      <BulkSelector
        items={filteredPosts}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        getItemId={(post) => post.id}
        getItemLabel={(post) => post.title}
        disabled={loading}
        maxSelection={1000}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Posts List */}
      <div className="space-y-2">
        {filteredPosts.map((post) => (
          <BulkItemSelector
            key={post.id}
            item={post}
            selected={selectedItems.has(post.id)}
            onToggle={toggleItem}
            disabled={loading || actionLoading}
            getItemId={(post) => post.id}
            renderItem={renderPostItem}
          />
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No posts found matching your criteria.
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {hasSelection && (
        <BulkActionsToolbar
          selectedCount={selectedCount}
          totalCount={filteredPosts.length}
          actions={availableActions}
          onAction={handleBulkAction}
          loading={actionLoading || loading}
          disabled={loading}
        />
      )}

      {/* Progress Modal */}
      <BulkProgressModal
        open={showModal}
        onOpenChange={closeModal}
        jobId={activeJob}
        title={modalTitle}
        description={modalDescription}
        onComplete={handleOperationComplete}
        allowCancel={true}
        showDetails={true}
      />

      {/* Error Display */}
      {actionError && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm font-medium">Error: {actionError}</span>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Example usage in a page component
export default function PostsManagementPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load posts on mount
  useState(() => {
    fetchPosts()
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Posts Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select and perform bulk operations on your posts
        </p>
      </div>

      <BulkPostsManager
        posts={posts}
        onPostsUpdate={fetchPosts}
        loading={loading}
      />
    </div>
  )
}