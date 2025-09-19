/**
 * Bulk Operations Toolbar
 * Comprehensive bulk operations interface for admin content management
 */

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  CheckSquare,
  Square,
  Minus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Tag,
  Download,
  Upload,
  Copy,
  Move,
  MoreHorizontal,
  AlertTriangle,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { AdminButton } from '../ui/forms/AdminButton'
import { AdminCheckbox } from '../ui/forms/AdminCheckbox'
import { AdminDropdown } from '../ui/forms/AdminDropdown'
import { BulkImportModal } from './BulkImportModal'
import { BulkExportModal } from './BulkExportModal'
import type { BulkOperation, BulkOperationResult } from '@/lib/types/bulk-operations'

interface BulkOperationsToolbarProps {
  selectedCount: number
  totalCount: number
  contentType: 'pages' | 'posts' | 'services' | 'platforms' | 'team-members' | 'testimonials'
  isAllSelected: boolean
  isIndeterminate: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkOperation: (operation: BulkOperation) => Promise<BulkOperationResult>
  disabled?: boolean
  className?: string
}

const CONTENT_TYPE_LABELS = {
  'pages': 'Pages',
  'posts': 'Posts',
  'services': 'Services',
  'platforms': 'Platforms',
  'team-members': 'Team Members',
  'testimonials': 'Testimonials'
}

const QUICK_ACTIONS = [
  {
    id: 'publish',
    label: 'Publish',
    icon: Eye,
    description: 'Make selected items visible to public',
    variant: 'success' as const,
    confirmRequired: false
  },
  {
    id: 'unpublish',
    label: 'Unpublish',
    icon: EyeOff,
    description: 'Hide selected items from public',
    variant: 'secondary' as const,
    confirmRequired: false
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    description: 'Archive selected items',
    variant: 'outline' as const,
    confirmRequired: false
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    description: 'Permanently delete selected items',
    variant: 'danger' as const,
    confirmRequired: true
  }
]

const ADVANCED_ACTIONS = [
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: Copy,
    description: 'Create copies of selected items'
  },
  {
    id: 'move',
    label: 'Move to Category',
    icon: Move,
    description: 'Move selected items to a different category'
  },
  {
    id: 'bulk-tag',
    label: 'Bulk Tag',
    icon: Tag,
    description: 'Apply tags to selected items'
  },
  {
    id: 'seo-update',
    label: 'SEO Update',
    icon: Edit3,
    description: 'Update SEO metadata for selected items'
  }
]

export function BulkOperationsToolbar({
  selectedCount,
  totalCount,
  contentType,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  onClearSelection,
  onBulkOperation,
  disabled = false,
  className
}: BulkOperationsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [pendingOperation, setPendingOperation] = useState<string | null>(null)

  const handleQuickAction = useCallback(async (actionId: string) => {
    if (selectedCount === 0) return

    const action = QUICK_ACTIONS.find(a => a.id === actionId)
    if (!action) return

    if (action.confirmRequired) {
      // Show confirmation dialog for dangerous actions
      const confirmed = window.confirm(
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} ${CONTENT_TYPE_LABELS[contentType].toLowerCase()}?\n\nThis action cannot be undone.`
      )
      if (!confirmed) return
    }

    setIsProcessing(true)
    setPendingOperation(actionId)

    try {
      const result = await onBulkOperation({
        action: actionId as any,
        type: contentType,
        selectedIds: [], // This would be passed from parent
        options: {}
      })

      if (result.success) {
        // Show success notification
        console.log(`Bulk ${actionId} completed: ${result.successCount} items processed`)
      } else {
        // Show error notification
        console.error(`Bulk ${actionId} failed:`, result.errors)
      }
    } catch (error) {
      console.error(`Error performing bulk ${actionId}:`, error)
    } finally {
      setIsProcessing(false)
      setPendingOperation(null)
    }
  }, [selectedCount, contentType, onBulkOperation])

  const handleAdvancedAction = useCallback(async (actionId: string) => {
    // Advanced actions would show specialized modals/forms
    console.log(`Advanced action: ${actionId}`)
  }, [])

  const handleExport = useCallback(() => {
    setShowExportModal(true)
  }, [])

  const handleImport = useCallback(() => {
    setShowImportModal(true)
  }, [])

  if (selectedCount === 0) {
    // Minimal toolbar when no items are selected
    return (
      <div className={cn('flex items-center justify-between py-2', className)}>
        <div className="flex items-center gap-2">
          <AdminCheckbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={onSelectAll}
            disabled={disabled || totalCount === 0}
            size="sm"
          />
          <span className="text-sm text-gray-600">
            {totalCount} {CONTENT_TYPE_LABELS[contentType].toLowerCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <AdminButton
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={handleImport}
            disabled={disabled}
          >
            Import
          </AdminButton>
          <AdminButton
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExport}
            disabled={disabled}
          >
            Export
          </AdminButton>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn(
        'flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg',
        'transition-all duration-200',
        className
      )}>
        {/* Selection Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AdminCheckbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={onSelectAll}
              disabled={disabled}
              size="sm"
            />
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-900">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
              {selectedCount < totalCount && (
                <span className="text-sm text-blue-600">
                  of {totalCount} total
                </span>
              )}
            </div>
          </div>
          
          <AdminButton
            variant="ghost"
            size="sm"
            icon={X}
            onClick={onClearSelection}
            disabled={disabled || isProcessing}
          >
            Clear Selection
          </AdminButton>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <AdminButton
              key={action.id}
              variant={action.variant}
              size="sm"
              icon={isProcessing && pendingOperation === action.id ? Loader2 : action.icon}
              onClick={() => handleQuickAction(action.id)}
              disabled={disabled || isProcessing}
              loading={isProcessing && pendingOperation === action.id}
              title={action.description}
            >
              {action.label}
            </AdminButton>
          ))}
          
          {/* Advanced Actions Dropdown */}
          <AdminDropdown
            trigger={
              <AdminButton
                variant="outline"
                size="sm"
                icon={MoreHorizontal}
                disabled={disabled || isProcessing}
              >
                More Actions
              </AdminButton>
            }
            items={ADVANCED_ACTIONS.map(action => ({
              id: action.id,
              label: action.label,
              icon: action.icon,
              description: action.description,
              onClick: () => handleAdvancedAction(action.id)
            }))}
          />
          
          {/* Export/Import Actions */}
          <div className="flex gap-2 ml-auto">
            <AdminButton
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExport}
              disabled={disabled || isProcessing}
            >
              Export Selected
            </AdminButton>
            <AdminButton
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={handleImport}
              disabled={disabled || isProcessing}
            >
              Import
            </AdminButton>
          </div>
        </div>

        {/* Operation Status */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing {pendingOperation}...
          </div>
        )}
      </div>

      {/* Import Modal */}
      <BulkImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        contentType={contentType}
        onImport={onBulkOperation}
      />

      {/* Export Modal */}
      <BulkExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        contentType={contentType}
        selectedCount={selectedCount}
        totalCount={totalCount}
      />
    </>
  )
}