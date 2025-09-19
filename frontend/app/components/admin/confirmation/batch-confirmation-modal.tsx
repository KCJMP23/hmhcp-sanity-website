'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Package,
  FileText,
  User,
  Image,
  MessageCircle,
  Settings,
  Trash2,
  Archive,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BatchConfirmationProps, ConfirmationItem } from './types'
import { BaseConfirmationModal } from './base-confirmation-modal'

/**
 * Entity type icons for visual identification
 */
const entityIcons = {
  post: FileText,
  page: FileText,
  media: Image,
  comment: MessageCircle,
  user: User,
  menu: Settings,
  widget: Settings,
  clinical_trial: Package,
  publication: FileText,
  quality_study: Package,
  platform: Settings,
  backup: Package,
  setting: Settings
}

/**
 * Batch Confirmation Modal Component
 * Enhanced confirmation modal for bulk operations with item preview and management
 */
export function BatchConfirmationModal({
  // Inherited from BaseConfirmationModal
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  risk,
  action,
  entity,
  consequences = [],
  confirmButtonText,
  cancelButtonText,
  isLoading = false,
  error,
  
  // Batch-specific props
  items,
  showItemPreview = true,
  maxPreviewItems = 10,
  onItemRemove,
  onItemToggle,
  selectedItems,
  
  ...baseProps
}: BatchConfirmationProps) {
  // Internal state for item management
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllItems, setShowAllItems] = useState(false)
  const [localSelectedItems, setLocalSelectedItems] = useState<Set<string | number>>(
    selectedItems || new Set(items.map(item => item.id))
  )
  
  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    
    const query = searchQuery.toLowerCase()
    return items.filter(item => 
      (item.title?.toLowerCase().includes(query)) ||
      (item.name?.toLowerCase().includes(query)) ||
      (item.type?.toLowerCase().includes(query))
    )
  }, [items, searchQuery])
  
  // Items to display (limited or all based on showAllItems state)
  const displayedItems = useMemo(() => {
    if (showAllItems) return filteredItems
    return filteredItems.slice(0, maxPreviewItems)
  }, [filteredItems, showAllItems, maxPreviewItems])
  
  // Selected items count
  const selectedCount = localSelectedItems.size
  
  // Handle item selection toggle
  const handleItemToggle = (item: ConfirmationItem, selected: boolean) => {
    const newSelected = new Set(localSelectedItems)
    if (selected) {
      newSelected.add(item.id)
    } else {
      newSelected.delete(item.id)
    }
    setLocalSelectedItems(newSelected)
    onItemToggle?.(item, selected)
  }
  
  // Handle select all/none
  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setLocalSelectedItems(new Set(items.map(item => item.id)))
    } else {
      setLocalSelectedItems(new Set())
    }
  }
  
  // Handle item removal
  const handleItemRemove = (item: ConfirmationItem) => {
    const newSelected = new Set(localSelectedItems)
    newSelected.delete(item.id)
    setLocalSelectedItems(newSelected)
    onItemRemove?.(item)
  }
  
  // Generate enhanced description with item count
  const enhancedDescription = useMemo(() => {
    if (description) return description
    
    const actionText = action.replace('_', ' ')
    const itemCount = selectedCount
    const entityText = entity || 'item'
    const plural = itemCount !== 1 ? 's' : ''
    
    return `Are you sure you want to ${actionText} ${itemCount} ${entityText}${plural}?`
  }, [description, action, selectedCount, entity])
  
  // Generate enhanced title
  const enhancedTitle = useMemo(() => {
    if (title) return title
    
    const actionText = action.replace('_', ' ')
    return `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Multiple Items`
  }, [title, action])
  
  // Custom content for batch operations
  const batchContent = (
    <div className="space-y-4">
      {/* Selection summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">
            {selectedCount} of {items.length} items selected
          </span>
        </div>
        
        {/* Select all/none controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelectAll(true)}
            disabled={selectedCount === items.length}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelectAll(false)}
            disabled={selectedCount === 0}
            className="text-xs"
          >
            Select None
          </Button>
        </div>
      </div>
      
      {/* Item preview section */}
      {showItemPreview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Items to be affected:</h4>
            
            {/* Search input */}
            {items.length > 5 && (
              <div className="relative">
                <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="pl-7 h-7 text-xs w-32"
                />
              </div>
            )}
          </div>
          
          {/* Items list */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <ScrollArea className="max-h-48">
              <div className="divide-y divide-gray-100">
                {displayedItems.map((item) => {
                  const isSelected = localSelectedItems.has(item.id)
                  const EntityIcon = item.type && entityIcons[item.type as keyof typeof entityIcons] || FileText
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors',
                        !isSelected && 'opacity-60'
                      )}
                    >
                      {/* Selection checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
                        className="shrink-0"
                      />
                      
                      {/* Entity icon */}
                      <div className="shrink-0">
                        <EntityIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Item details */}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.title || item.name || `Item ${item.id}`}
                        </div>
                        {(item.type || item.metadata) && (
                          <div className="flex items-center gap-2 mt-1">
                            {item.type && (
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                            )}
                            {item.metadata?.status && (
                              <Badge variant="outline" className="text-xs">
                                {item.metadata.status}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Remove button */}
                      {onItemRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleItemRemove(item)}
                          className="shrink-0 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </ScrollArea>
            
            {/* Show more/less toggle */}
            {filteredItems.length > maxPreviewItems && (
              <div className="border-t border-gray-100 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="w-full h-8 text-xs text-gray-600 hover:text-gray-900"
                >
                  {showAllItems ? (
                    <>
                      <ChevronRight className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show {filteredItems.length - maxPreviewItems} More Items
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {/* No items found message */}
          {searchQuery && filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items found matching "{searchQuery}"</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Batch operation consequences */}
      {selectedCount > 1 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-amber-900">
                Bulk Operation
              </div>
              <div className="text-xs text-amber-700 mt-1">
                This action will be applied to {selectedCount} items simultaneously. 
                Please review the selection carefully before proceeding.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced consequences for batch operations */}
      {consequences.length === 0 && selectedCount > 1 && (
        <div className="space-y-2">
          <Separator />
          <div className="flex items-start gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="shrink-0 p-1 bg-blue-100 rounded-full"
            >
              <Trash2 className="h-3 w-3 text-blue-600" />
            </motion.div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                Batch processing
              </div>
              <div className="text-xs text-gray-600">
                {selectedCount} items will be processed sequentially
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  
  // Handle confirmation with selected items
  const handleBatchConfirm = async () => {
    // Update the items prop to only include selected items
    const selectedItemsArray = items.filter(item => localSelectedItems.has(item.id))
    
    // Call the original confirm handler
    await onConfirm()
  }
  
  // Disable confirmation if no items are selected
  const canConfirm = selectedCount > 0
  
  return (
    <BaseConfirmationModal
      {...baseProps}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={handleBatchConfirm}
      onCancel={onCancel}
      title={enhancedTitle}
      description={enhancedDescription}
      risk={risk}
      action={action}
      entity={entity}
      items={items.filter(item => localSelectedItems.has(item.id))}
      consequences={consequences}
      confirmButtonText={confirmButtonText || `${action.replace('_', ' ')} ${selectedCount} Items`}
      cancelButtonText={cancelButtonText}
      isLoading={isLoading}
      error={error}
      customContent={batchContent}
      // Disable confirmation if no items selected
      typeToConfirm={canConfirm ? baseProps.typeToConfirm : {
        enabled: true,
        phrase: 'NO ITEMS SELECTED',
        placeholder: 'Please select items first'
      }}
    />
  )
}