/**
 * Bulk Selection Manager
 * Manages selection state and provides utilities for bulk operations
 */

import React, { 
  createContext, 
  useContext, 
  useCallback, 
  useMemo, 
  ReactNode,
  useState,
  useEffect
} from 'react'

export interface BulkSelectionState {
  selectedIds: Set<string>
  selectedCount: number
  isAllSelected: boolean
  isIndeterminate: boolean
  hasSelection: boolean
}

export interface BulkSelectionActions {
  selectItem: (id: string) => void
  deselectItem: (id: string) => void
  toggleItem: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  toggleAll: (ids: string[]) => void
  isItemSelected: (id: string) => boolean
  selectRange: (startId: string, endId: string, allIds: string[]) => void
  invertSelection: (allIds: string[]) => void
}

export interface BulkSelectionConfig {
  maxSelection?: number
  persistSelection?: boolean
  storageKey?: string
  onSelectionChange?: (state: BulkSelectionState) => void
  onMaxSelectionReached?: (maxSelection: number) => void
}

interface BulkSelectionContextValue extends BulkSelectionState, BulkSelectionActions {
  config: BulkSelectionConfig
}

const BulkSelectionContext = createContext<BulkSelectionContextValue | null>(null)

export function useBulkSelection() {
  const context = useContext(BulkSelectionContext)
  if (!context) {
    throw new Error('useBulkSelection must be used within a BulkSelectionProvider')
  }
  return context
}

interface BulkSelectionProviderProps {
  children: ReactNode
  config?: BulkSelectionConfig
  totalItems?: number
  allIds?: string[]
}

export function BulkSelectionProvider({
  children,
  config = {},
  totalItems = 0,
  allIds = []
}: BulkSelectionProviderProps) {
  const {
    maxSelection,
    persistSelection = false,
    storageKey = 'bulk-selection',
    onSelectionChange,
    onMaxSelectionReached
  } = config

  // Initialize selection from localStorage if persistence is enabled
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (persistSelection && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const ids = JSON.parse(stored)
          return new Set(Array.isArray(ids) ? ids : [])
        }
      } catch (error) {
        console.warn('Failed to load persisted selection:', error)
      }
    }
    return new Set()
  })

  // Persist selection changes to localStorage
  useEffect(() => {
    if (persistSelection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify([...selectedIds]))
      } catch (error) {
        console.warn('Failed to persist selection:', error)
      }
    }
  }, [selectedIds, persistSelection, storageKey])

  // Calculate derived state
  const state = useMemo<BulkSelectionState>(() => {
    const selectedCount = selectedIds.size
    const isAllSelected = selectedCount > 0 && selectedCount === totalItems && totalItems > 0
    const isIndeterminate = selectedCount > 0 && selectedCount < totalItems
    const hasSelection = selectedCount > 0

    return {
      selectedIds,
      selectedCount,
      isAllSelected,
      isIndeterminate,
      hasSelection
    }
  }, [selectedIds, totalItems])

  // Notify about selection changes
  useEffect(() => {
    onSelectionChange?.(state)
  }, [state, onSelectionChange])

  // Selection actions
  const selectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (maxSelection && prev.size >= maxSelection && !prev.has(id)) {
        onMaxSelectionReached?.(maxSelection)
        return prev
      }
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [maxSelection, onMaxSelectionReached])

  const deselectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.has(id)) {
        const next = new Set(prev)
        next.delete(id)
        return next
      } else {
        if (maxSelection && prev.size >= maxSelection) {
          onMaxSelectionReached?.(maxSelection)
          return prev
        }
        const next = new Set(prev)
        next.add(id)
        return next
      }
    })
  }, [maxSelection, onMaxSelectionReached])

  const selectAll = useCallback((ids: string[]) => {
    if (maxSelection && ids.length > maxSelection) {
      onMaxSelectionReached?.(maxSelection)
      setSelectedIds(new Set(ids.slice(0, maxSelection)))
    } else {
      setSelectedIds(new Set(ids))
    }
  }, [maxSelection, onMaxSelectionReached])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      if (prev.size === ids.length) {
        return new Set()
      } else {
        if (maxSelection && ids.length > maxSelection) {
          onMaxSelectionReached?.(maxSelection)
          return new Set(ids.slice(0, maxSelection))
        }
        return new Set(ids)
      }
    })
  }, [maxSelection, onMaxSelectionReached])

  const isItemSelected = useCallback((id: string) => {
    return selectedIds.has(id)
  }, [selectedIds])

  const selectRange = useCallback((startId: string, endId: string, allIds: string[]) => {
    const startIndex = allIds.indexOf(startId)
    const endIndex = allIds.indexOf(endId)
    
    if (startIndex === -1 || endIndex === -1) return
    
    const [start, end] = startIndex <= endIndex 
      ? [startIndex, endIndex] 
      : [endIndex, startIndex]
    
    const rangeIds = allIds.slice(start, end + 1)
    
    setSelectedIds(prev => {
      const next = new Set(prev)
      
      if (maxSelection && next.size + rangeIds.length > maxSelection) {
        const availableSpace = maxSelection - next.size
        if (availableSpace > 0) {
          rangeIds.slice(0, availableSpace).forEach(id => next.add(id))
        }
        onMaxSelectionReached?.(maxSelection)
      } else {
        rangeIds.forEach(id => next.add(id))
      }
      
      return next
    })
  }, [maxSelection, onMaxSelectionReached])

  const invertSelection = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set<string>()
      
      ids.forEach(id => {
        if (!prev.has(id)) {
          if (maxSelection && next.size >= maxSelection) {
            return
          }
          next.add(id)
        }
      })
      
      if (maxSelection && next.size >= maxSelection) {
        onMaxSelectionReached?.(maxSelection)
      }
      
      return next
    })
  }, [maxSelection, onMaxSelectionReached])

  const contextValue: BulkSelectionContextValue = {
    // State
    ...state,
    
    // Actions
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    clearSelection,
    toggleAll,
    isItemSelected,
    selectRange,
    invertSelection,
    
    // Config
    config
  }

  return (
    <BulkSelectionContext.Provider value={contextValue}>
      {children}
    </BulkSelectionContext.Provider>
  )
}

/**
 * Hook for managing keyboard-enhanced bulk selection
 * Supports Shift+Click for range selection and Ctrl/Cmd+Click for individual toggles
 */
export function useBulkSelectionKeyboard(allIds: string[]) {
  const { 
    selectItem, 
    deselectItem, 
    toggleItem, 
    selectRange,
    isItemSelected,
    clearSelection
  } = useBulkSelection()
  
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const handleItemClick = useCallback((
    id: string, 
    event: React.MouseEvent
  ) => {
    if (event.shiftKey && lastSelectedId) {
      // Range selection
      selectRange(lastSelectedId, id, allIds)
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle individual item
      toggleItem(id)
      setLastSelectedId(id)
    } else {
      // Single selection (clear others and select this one)
      clearSelection()
      selectItem(id)
      setLastSelectedId(id)
    }
  }, [lastSelectedId, selectRange, toggleItem, clearSelection, selectItem, allIds])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearSelection()
      setLastSelectedId(null)
    }
  }, [clearSelection])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    handleItemClick,
    isItemSelected,
    lastSelectedId
  }
}

/**
 * Utility hook for managing bulk operation state
 */
export function useBulkOperations() {
  const { selectedIds, selectedCount, clearSelection } = useBulkSelection()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<any>(null)

  const executeOperation = useCallback(async (
    operation: string,
    handler: (selectedIds: string[]) => Promise<any>
  ) => {
    if (selectedCount === 0) return

    setIsProcessing(true)
    setCurrentOperation(operation)
    
    try {
      const result = await handler([...selectedIds])
      setLastResult(result)
      
      if (result.success) {
        clearSelection()
      }
      
      return result
    } catch (error) {
      console.error(`Error executing bulk operation ${operation}:`, error)
      throw error
    } finally {
      setIsProcessing(false)
      setCurrentOperation(null)
    }
  }, [selectedIds, selectedCount, clearSelection])

  return {
    selectedIds: [...selectedIds],
    selectedCount,
    isProcessing,
    currentOperation,
    lastResult,
    executeOperation
  }
}