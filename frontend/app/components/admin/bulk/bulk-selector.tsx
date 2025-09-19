'use client'

import { useState, useCallback, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  CheckSquare, 
  Square, 
  Minus, 
  ChevronDown,
  Filter,
  X
} from 'lucide-react'

interface BulkSelectorProps<T = any> {
  items: T[]
  selectedItems: Set<string>
  onSelectionChange: (selectedIds: Set<string>) => void
  getItemId: (item: T) => string
  getItemLabel?: (item: T) => string
  disabled?: boolean
  maxSelection?: number
  filters?: {
    key: string
    label: string
    options: Array<{ value: string; label: string }>
  }[]
  onFiltersChange?: (filters: Record<string, string>) => void
  className?: string
}

export function BulkSelector<T = any>({
  items,
  selectedItems,
  onSelectionChange,
  getItemId,
  getItemLabel = (item: T) => String(item),
  disabled = false,
  maxSelection,
  filters = [],
  onFiltersChange,
  className
}: BulkSelectorProps<T>) {
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  // Calculate selection state
  const selectionState = useMemo(() => {
    const totalItems = items.length
    const selectedCount = selectedItems.size
    
    if (selectedCount === 0) {
      return { state: 'none' as const, count: 0 }
    } else if (selectedCount === totalItems) {
      return { state: 'all' as const, count: selectedCount }
    } else {
      return { state: 'partial' as const, count: selectedCount }
    }
  }, [items.length, selectedItems.size])

  // Handle select all/none
  const handleSelectAll = useCallback(() => {
    if (disabled) return
    
    if (selectionState.state === 'all') {
      // Deselect all
      onSelectionChange(new Set())
    } else {
      // Select all (respecting max selection)
      const itemIds = items.map(getItemId)
      const newSelection = maxSelection 
        ? new Set(itemIds.slice(0, maxSelection))
        : new Set(itemIds)
      onSelectionChange(newSelection)
    }
  }, [items, selectionState.state, onSelectionChange, getItemId, disabled, maxSelection])

  // Handle individual item selection
  const handleItemToggle = useCallback((item: T) => {
    if (disabled) return
    
    const itemId = getItemId(item)
    const newSelection = new Set(selectedItems)
    
    if (selectedItems.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      // Check max selection limit
      if (maxSelection && newSelection.size >= maxSelection) {
        return // Don't add if at limit
      }
      newSelection.add(itemId)
    }
    
    onSelectionChange(newSelection)
  }, [selectedItems, onSelectionChange, getItemId, disabled, maxSelection])

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey: string, value: string) => {
    const newFilters = { ...activeFilters }
    
    if (value === 'all' || value === '') {
      delete newFilters[filterKey]
    } else {
      newFilters[filterKey] = value
    }
    
    setActiveFilters(newFilters)
    onFiltersChange?.(newFilters)
  }, [activeFilters, onFiltersChange])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters({})
    onFiltersChange?.({})
  }, [onFiltersChange])

  // Clear selection
  const clearSelection = useCallback(() => {
    onSelectionChange(new Set())
  }, [onSelectionChange])

  // Render selection icon
  const SelectionIcon = useMemo(() => {
    switch (selectionState.state) {
      case 'all':
        return CheckSquare
      case 'partial':
        return Minus
      default:
        return Square
    }
  }, [selectionState.state])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with bulk controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {/* Selection Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled || items.length === 0}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <SelectionIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {selectionState.state === 'all' ? 'Deselect All' : 'Select All'}
            </span>
          </Button>
          
          {selectionState.count > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {selectionState.count} selected
              </Badge>
              
              {maxSelection && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (max {maxSelection})
                </span>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Clear selection</span>
              </Button>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        {filters.length > 0 && (
          <div className="flex items-center gap-2">
            {Object.keys(activeFilters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear filters
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-3 w-3" />
              Filters
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {filter.label}:
              </label>
              <Select
                value={activeFilters[filter.key] || 'all'}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {maxSelection && selectionState.count > 0 && (
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectionState.count} of {maxSelection} items selected
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectionState.count / maxSelection) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Individual item selector component
interface BulkItemSelectorProps<T = any> {
  item: T
  selected: boolean
  onToggle: (item: T) => void
  disabled?: boolean
  getItemId: (item: T) => string
  getItemLabel?: (item: T) => string
  renderItem?: (item: T) => React.ReactNode
  className?: string
}

export function BulkItemSelector<T = any>({
  item,
  selected,
  onToggle,
  disabled = false,
  getItemId,
  getItemLabel = (item: T) => String(item),
  renderItem,
  className
}: BulkItemSelectorProps<T>) {
  const itemId = getItemId(item)
  const itemLabel = getItemLabel(item)

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
        selected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={() => !disabled && onToggle(item)}
    >
      <Checkbox
        id={`bulk-item-${itemId}`}
        checked={selected}
        onChange={() => !disabled && onToggle(item)}
        disabled={disabled}
        className="pointer-events-none"
      />
      
      <div className="flex-1 min-w-0">
        {renderItem ? renderItem(item) : (
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {itemLabel}
          </div>
        )}
      </div>
      
      {selected && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Selected
        </Badge>
      )}
    </div>
  )
}

// Hook for managing bulk selection state
export function useBulkSelection<T = any>(
  items: T[],
  getItemId: (item: T) => string,
  initialSelection: Set<string> = new Set()
) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(initialSelection)

  const selectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => new Set([...prev, itemId]))
  }, [])

  const deselectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
  }, [])

  const toggleItem = useCallback((item: T) => {
    const itemId = getItemId(item)
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [getItemId])

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(items.map(getItemId)))
  }, [items, getItemId])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedItems.has(getItemId(item)))
  }, [items, selectedItems, getItemId])

  return {
    selectedItems,
    setSelectedItems,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    clearSelection,
    getSelectedItems,
    selectedCount: selectedItems.size,
    hasSelection: selectedItems.size > 0,
    isAllSelected: selectedItems.size === items.length && items.length > 0
  }
}