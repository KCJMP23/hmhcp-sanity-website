'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { 
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Copy,
  Edit,
  Tag,
  User,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react'

export type BulkAction = {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive' | 'secondary'
  requiresConfirmation?: boolean
  confirmationTitle?: string
  confirmationMessage?: string
  disabled?: boolean
  maxItems?: number
}

interface BulkActionsToolbarProps {
  selectedCount: number
  totalCount: number
  actions: BulkAction[]
  onAction: (actionId: string) => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  maxWidth?: boolean
  className?: string
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  actions,
  onAction,
  loading = false,
  disabled = false,
  maxWidth = true,
  className
}: BulkActionsToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filter actions based on selection count and availability
  const availableActions = actions.filter(action => {
    if (action.disabled) return false
    if (action.maxItems && selectedCount > action.maxItems) return false
    return true
  })

  // Split actions into primary and secondary
  const primaryActions = availableActions.slice(0, 3)
  const secondaryActions = availableActions.slice(3)

  const handleAction = useCallback(async (action: BulkAction) => {
    if (loading || disabled || actionLoading) return

    if (action.requiresConfirmation) {
      setConfirmAction(action)
      return
    }

    setActionLoading(action.id)
    try {
      await onAction(action.id)
    } finally {
      setActionLoading(null)
    }
  }, [onAction, loading, disabled, actionLoading])

  const handleConfirmedAction = useCallback(async () => {
    if (!confirmAction) return

    setActionLoading(confirmAction.id)
    try {
      await onAction(confirmAction.id)
    } finally {
      setActionLoading(null)
      setConfirmAction(null)
    }
  }, [confirmAction, onAction])

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div className={`
        fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-lg
        p-4
        transition-all duration-200 ease-in-out
        ${maxWidth ? 'max-w-4xl w-full mx-6' : ''}
        ${className}
      `}>
        <div className="flex items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              of {totalCount} items
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {primaryActions.map((action) => {
              const Icon = action.icon
              const isActionLoading = actionLoading === action.id

              return (
                <Button
                  key={action.id}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={() => handleAction(action)}
                  disabled={loading || disabled || actionLoading !== null}
                  className="flex items-center gap-2"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    Icon && <Icon className="h-4 w-4" />
                  )}
                  {action.label}
                </Button>
              )
            })}

            {/* More Actions Dropdown */}
            {secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading || disabled || actionLoading !== null}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {secondaryActions.map((action) => {
                    const Icon = action.icon
                    const isActionLoading = actionLoading === action.id

                    return (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={() => handleAction(action)}
                        disabled={loading || disabled || actionLoading !== null}
                        className={`flex items-center gap-2 ${
                          action.variant === 'destructive' 
                            ? 'text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400'
                            : ''
                        }`}
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          Icon && <Icon className="h-4 w-4" />
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmAction?.confirmationTitle || `Confirm ${confirmAction?.label}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmationMessage || 
                `Are you sure you want to ${confirmAction?.label.toLowerCase()} ${selectedCount} item${selectedCount === 1 ? '' : 's'}? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              disabled={actionLoading !== null}
              className={confirmAction?.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionLoading === confirmAction?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Confirm ${confirmAction?.label}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Predefined bulk actions for common use cases
export const BULK_ACTIONS = {
  // Content actions
  PUBLISH: {
    id: 'publish',
    label: 'Publish',
    icon: Eye,
    variant: 'default' as const
  },
  UNPUBLISH: {
    id: 'unpublish',
    label: 'Unpublish',
    icon: EyeOff,
    variant: 'secondary' as const
  },
  ARCHIVE: {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'secondary' as const,
    requiresConfirmation: true,
    confirmationMessage: 'Archived items will be moved out of active content but can be restored later.'
  },
  DELETE: {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive' as const,
    requiresConfirmation: true,
    confirmationTitle: 'Delete Items',
    confirmationMessage: 'This action is permanent and cannot be undone. All selected items and their data will be permanently removed.'
  },
  DUPLICATE: {
    id: 'duplicate',
    label: 'Duplicate',
    icon: Copy,
    variant: 'default' as const,
    maxItems: 50 // Limit duplicates to prevent performance issues
  },

  // User actions
  ACTIVATE_USERS: {
    id: 'activate',
    label: 'Activate',
    icon: User,
    variant: 'default' as const
  },
  DEACTIVATE_USERS: {
    id: 'deactivate',
    label: 'Deactivate',
    icon: User,
    variant: 'secondary' as const,
    requiresConfirmation: true,
    confirmationMessage: 'Deactivated users will not be able to log in or access the system.'
  },
  DELETE_USERS: {
    id: 'delete_users',
    label: 'Delete Users',
    icon: Trash2,
    variant: 'destructive' as const,
    requiresConfirmation: true,
    confirmationTitle: 'Delete Users',
    confirmationMessage: 'This will permanently delete user accounts and all associated data. This action cannot be undone.'
  },

  // Metadata actions
  ADD_TAGS: {
    id: 'add_tags',
    label: 'Add Tags',
    icon: Tag,
    variant: 'default' as const
  },
  REMOVE_TAGS: {
    id: 'remove_tags',
    label: 'Remove Tags',
    icon: Tag,
    variant: 'secondary' as const
  },
  CHANGE_AUTHOR: {
    id: 'change_author',
    label: 'Change Author',
    icon: User,
    variant: 'default' as const
  },
  UPDATE_DATE: {
    id: 'update_date',
    label: 'Update Date',
    icon: Calendar,
    variant: 'default' as const
  }
} as const

// Hook for managing bulk actions state
export function useBulkActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<{ action: string; count: number } | null>(null)

  const executeAction = useCallback(async (
    actionId: string,
    selectedIds: string[],
    apiEndpoint: string,
    payload: any = {}
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: actionId,
          ids: selectedIds,
          ...payload
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Action failed')
      }

      const result = await response.json()
      
      setLastAction({
        action: actionId,
        count: selectedIds.length
      })

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      throw error

    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearLastAction = useCallback(() => {
    setLastAction(null)
  }, [])

  return {
    loading,
    error,
    lastAction,
    executeAction,
    clearError,
    clearLastAction
  }
}