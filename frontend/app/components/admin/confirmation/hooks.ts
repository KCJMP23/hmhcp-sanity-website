'use client'

import { useState, useCallback, useContext, createContext } from 'react'
import { ConfirmationModalProps, BatchConfirmationProps, ConfirmationPreset, ConfirmationItem, ConfirmationAction, ConfirmationEntity, ConfirmationContextValue } from './types'
import { getPresetConfig, getRiskLevel } from './config'

/**
 * Confirmation Context
 */
const ConfirmationContext = createContext<ConfirmationContextValue | null>(null)

/**
 * Hook to use confirmation functionality
 * Must be used within ConfirmationProvider
 */
export function useConfirmation(): ConfirmationContextValue {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider')
  }
  return context
}

/**
 * Hook for managing confirmation modal state
 */
export function useConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<Partial<ConfirmationModalProps> | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  // Show confirmation modal
  const confirm = useCallback((modalConfig: Omit<ConfirmationModalProps, 'isOpen' | 'onOpenChange'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(modalConfig)
      setIsOpen(true)
      setResolvePromise(() => resolve)
    })
  }, [])

  // Handle confirmation
  const handleConfirm = useCallback(async () => {
    try {
      if (config?.onConfirm) {
        await config.onConfirm()
      }
      setIsOpen(false)
      resolvePromise?.(true)
    } catch (error) {
      console.error('Confirmation action failed:', error)
      // Don't close modal on error, let user retry
    }
  }, [config, resolvePromise])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setIsOpen(false)
    resolvePromise?.(false)
    config?.onCancel?.()
  }, [config, resolvePromise])

  // Handle open change
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleCancel()
    }
  }, [handleCancel])

  // Reset modal state
  const reset = useCallback(() => {
    setIsOpen(false)
    setConfig(null)
    setResolvePromise(null)
  }, [])

  return {
    // State
    isOpen,
    config,
    
    // Actions
    confirm,
    handleConfirm,
    handleCancel,
    handleOpenChange,
    reset,
    
    // Modal props
    modalProps: config ? {
      ...config,
      isOpen,
      onOpenChange: handleOpenChange,
      onConfirm: handleConfirm,
      onCancel: handleCancel
    } as ConfirmationModalProps : null
  }
}

/**
 * Hook for batch confirmation modal state
 */
export function useBatchConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<Partial<BatchConfirmationProps> | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  // Show batch confirmation modal
  const confirmBatch = useCallback((modalConfig: Omit<BatchConfirmationProps, 'isOpen' | 'onOpenChange'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(modalConfig)
      setIsOpen(true)
      setResolvePromise(() => resolve)
    })
  }, [])

  // Handle confirmation
  const handleConfirm = useCallback(async () => {
    try {
      if (config?.onConfirm) {
        await config.onConfirm()
      }
      setIsOpen(false)
      resolvePromise?.(true)
    } catch (error) {
      console.error('Batch confirmation action failed:', error)
    }
  }, [config, resolvePromise])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setIsOpen(false)
    resolvePromise?.(false)
    config?.onCancel?.()
  }, [config, resolvePromise])

  // Handle open change
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleCancel()
    }
  }, [handleCancel])

  return {
    // State
    isOpen,
    config,
    
    // Actions
    confirmBatch,
    handleConfirm,
    handleCancel,
    handleOpenChange,
    
    // Modal props
    modalProps: config ? {
      ...config,
      isOpen,
      onOpenChange: handleOpenChange,
      onConfirm: handleConfirm,
      onCancel: handleCancel
    } as BatchConfirmationProps : null
  }
}

/**
 * Quick confirmation hooks for common operations
 */
export function useQuickConfirmations() {
  const { confirm: baseConfirm } = useConfirmation()

  return {
    /**
     * Quick delete confirmation
     */
    confirmDelete: useCallback(async (
      item: ConfirmationItem,
      permanent: boolean = false
    ): Promise<boolean> => {
      const preset = permanent ? 'delete_permanent' : 'delete'
      const presetConfig = getPresetConfig(preset)
      
      return baseConfirm({
        ...presetConfig,
        risk: permanent ? 'critical' : 'high',
        action: permanent ? 'delete_permanent' : 'delete',
        item,
        title: permanent ? 'Permanently Delete Item' : 'Delete Item',
        description: permanent 
          ? `Are you sure you want to permanently delete "${item.title || item.name}"? This action cannot be undone.`
          : `Are you sure you want to delete "${item.title || item.name}"? It will be moved to trash.`,
        onConfirm: async () => {
          // This will be handled by the confirmation modal
          console.log('Delete confirmed for:', item)
        }
      })
    }, [baseConfirm]),

    /**
     * Quick trash confirmation for multiple items
     */
    confirmTrash: useCallback(async (items: ConfirmationItem[]): Promise<boolean> => {
      const presetConfig = getPresetConfig('trash')
      
      return baseConfirm({
        ...presetConfig,
        risk: 'medium',
        action: 'trash',
        items,
        title: 'Move to Trash',
        description: `Move ${items.length} item${items.length > 1 ? 's' : ''} to trash?`,
        onConfirm: async () => {
          // This will be handled by the confirmation modal
          console.log('Move to trash confirmed for:', items.length, 'items')
        }
      })
    }, [baseConfirm]),

    /**
     * Quick critical action confirmation
     */
    confirmCritical: useCallback(async (
      action: string,
      consequences: string[] = []
    ): Promise<boolean> => {
      return baseConfirm({
        risk: 'critical',
        action: 'delete_permanent',
        title: 'Critical Action Required',
        description: `You are about to perform a critical action: ${action}`,
        consequences: consequences.map(consequence => ({
          type: 'danger' as const,
          title: 'Warning',
          description: consequence
        })),
        typeToConfirm: {
          enabled: true,
          phrase: 'CONFIRM',
          placeholder: 'Type CONFIRM to proceed'
        },
        requiresApproval: true,
        onConfirm: async () => {
          // This will be handled by the confirmation modal
          console.log('Critical action confirmed:', action)
        }
      })
    }, [baseConfirm])
  }
}

/**
 * Hook for preset-based confirmations
 */
export function usePresetConfirmations() {
  const { confirm } = useConfirmation()

  return {
    /**
     * Show confirmation using a preset
     */
    confirmWithPreset: useCallback(async (
      preset: ConfirmationPreset,
      overrides: Partial<ConfirmationModalProps> = {}
    ): Promise<boolean> => {
      const presetConfig = getPresetConfig(preset)
      
      // Ensure required properties are provided
      if (!presetConfig.risk || !presetConfig.action) {
        throw new Error(`Preset ${preset} is missing required properties`)
      }
      
      return confirm({
        risk: presetConfig.risk!,
        action: presetConfig.action!,
        entity: presetConfig.entity,
        item: presetConfig.item,
        items: presetConfig.items,
        consequences: presetConfig.consequences,
        relatedItems: presetConfig.relatedItems,
        typeToConfirm: presetConfig.typeToConfirm,
        requiresApproval: presetConfig.requiresApproval,
        icon: presetConfig.icon,
        illustration: presetConfig.illustration,
        confirmButtonText: presetConfig.confirmButtonText,
        cancelButtonText: presetConfig.cancelButtonText,
        variant: presetConfig.variant,
        error: presetConfig.error,
        undo: presetConfig.undo,
        ariaLabel: presetConfig.ariaLabel,
        ariaDescription: presetConfig.ariaDescription,
        title: presetConfig.title,
        description: presetConfig.description,
        customContent: presetConfig.customContent,
        onConfirm: presetConfig.onConfirm || (async () => {
          console.log('Preset action confirmed:', preset)
        }),
        onCancel: presetConfig.onCancel,
        ...overrides
      })
    }, [confirm])
  }
}

/**
 * Hook for context-aware confirmations
 * Automatically determines risk levels and configurations based on action and entity
 */
export function useContextualConfirmation() {
  const { confirm, confirmBatch } = useConfirmation()

  return {
    /**
     * Confirm action with automatic risk assessment
     */
    confirmAction: useCallback(async (
      action: ConfirmationAction,
      entity: ConfirmationEntity,
      item?: ConfirmationItem,
      items?: ConfirmationItem[],
      overrides: Partial<ConfirmationModalProps> = {}
    ): Promise<boolean> => {
      const risk = getRiskLevel(action, entity)
      const isBatch = items && items.length > 0
      
      const baseConfig: Partial<ConfirmationModalProps> = {
        risk,
        action,
        entity,
        item,
        items,
        title: `${action.replace('_', ' ')} ${entity}${isBatch ? 's' : ''}`,
        description: isBatch
          ? `Are you sure you want to ${action.replace('_', ' ')} ${items.length} ${entity}${items.length > 1 ? 's' : ''}?`
          : `Are you sure you want to ${action.replace('_', ' ')} this ${entity}?`,
        ...overrides
      }

      if (isBatch) {
        return confirmBatch(baseConfig as BatchConfirmationProps)
      } else {
        return confirm(baseConfig as ConfirmationModalProps)
      }
    }, [confirm, confirmBatch]),

    /**
     * Confirm with automatic consequence detection
     */
    confirmWithConsequences: useCallback(async (
      action: ConfirmationAction,
      entity: ConfirmationEntity,
      items: ConfirmationItem[],
      additionalConsequences: string[] = []
    ): Promise<boolean> => {
      const risk = getRiskLevel(action, entity)
      
      // Auto-generate consequences based on action and entity
      const consequences = []
      
      if (action === 'delete_permanent') {
        consequences.push({
          type: 'danger' as const,
          title: 'Permanent deletion',
          description: 'Items will be completely removed and cannot be recovered'
        })
      } else if (action === 'delete') {
        consequences.push({
          type: 'warning' as const,
          title: 'Move to trash',
          description: 'Items will be moved to trash and can be restored later'
        })
      }
      
      if (entity === 'user' && (action === 'delete' || action === 'delete_permanent')) {
        consequences.push({
          type: 'warning' as const,
          title: 'Content ownership',
          description: 'Content created by these users may need to be reassigned'
        })
      }
      
      if (items.length > 10) {
        consequences.push({
          type: 'info' as const,
          title: 'Large batch operation',
          description: 'This operation will process many items and may take some time'
        })
      }
      
      // Add custom consequences
      additionalConsequences.forEach(consequence => {
        consequences.push({
          type: 'warning' as const,
          title: 'Additional consideration',
          description: consequence
        })
      })

      return confirmBatch({
        risk,
        action,
        entity,
        items,
        consequences,
        title: `${action.replace('_', ' ')} ${items.length} ${entity}${items.length > 1 ? 's' : ''}`,
        description: `This action will affect ${items.length} ${entity}${items.length > 1 ? 's' : ''}. Please review the consequences below.`,
        onConfirm: async () => {
          // This will be handled by the confirmation modal
          console.log('Batch action confirmed:', action, 'for', items.length, 'items')
        }
      })
    }, [confirmBatch])
  }
}

/**
 * Hook for form-integrated confirmations
 * Useful for forms that need confirmation before submission
 */
export function useFormConfirmation() {
  const { confirm } = useConfirmation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  return {
    isSubmitting,
    
    /**
     * Submit with confirmation
     */
    submitWithConfirmation: useCallback(async <T>(
      submitFunction: () => Promise<T>,
      confirmationConfig: Partial<ConfirmationModalProps>
    ): Promise<T | null> => {
      try {
        const confirmed = await confirm({
          risk: 'medium',
          action: 'bulk_edit',
          title: 'Confirm Submission',
          description: 'Are you sure you want to submit these changes?',
          onConfirm: async () => {
            // This will be handled by the confirmation modal
            console.log('Form submission confirmed')
          },
          ...confirmationConfig
        })

        if (!confirmed) {
          return null
        }

        setIsSubmitting(true)
        const result = await submitFunction()
        return result

      } catch (error) {
        console.error('Form submission failed:', error)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    }, [confirm]),

    /**
     * Reset with confirmation
     */
    resetWithConfirmation: useCallback(async (
      resetFunction: () => void,
      hasUnsavedChanges: boolean = true
    ): Promise<boolean> => {
      if (!hasUnsavedChanges) {
        resetFunction()
        return true
      }

      const confirmed = await confirm({
        risk: 'medium',
        action: 'delete',
        title: 'Discard Changes',
        description: 'You have unsaved changes. Are you sure you want to discard them?',
        confirmButtonText: 'Discard Changes',
        consequences: [{
          type: 'warning',
          title: 'Unsaved changes will be lost',
          description: 'All current changes will be permanently lost'
        }],
        onConfirm: async () => {
          // This will be handled by the confirmation modal
          console.log('Reset changes confirmed')
        }
      })

      if (confirmed) {
        resetFunction()
      }

      return confirmed
    }, [confirm])
  }
}

/**
 * Utility functions for creating confirmation configurations
 */
export const confirmationUtils = {
  /**
   * Create basic confirmation config
   */
  createBasicConfig: (
    action: ConfirmationAction,
    entity: ConfirmationEntity,
    item?: ConfirmationItem
  ): Partial<ConfirmationModalProps> => ({
    risk: getRiskLevel(action, entity),
    action,
    entity,
    item,
    title: `${action.replace('_', ' ')} ${entity}`,
    description: item 
      ? `Are you sure you want to ${action.replace('_', ' ')} "${item.title || item.name}"?`
      : `Are you sure you want to ${action.replace('_', ' ')} this ${entity}?`
  }),

  /**
   * Create batch confirmation config
   */
  createBatchConfig: (
    action: ConfirmationAction,
    entity: ConfirmationEntity,
    items: ConfirmationItem[]
  ): Partial<BatchConfirmationProps> => ({
    risk: getRiskLevel(action, entity),
    action,
    entity,
    items,
    title: `${action.replace('_', ' ')} ${items.length} ${entity}${items.length > 1 ? 's' : ''}`,
    description: `Are you sure you want to ${action.replace('_', ' ')} ${items.length} ${entity}${items.length > 1 ? 's' : ''}?`,
    showItemPreview: true
  }),

  /**
   * Create critical action config
   */
  createCriticalConfig: (
    title: string,
    description: string,
    confirmPhrase: string = 'DELETE'
  ): Partial<ConfirmationModalProps> => ({
    risk: 'critical',
    action: 'delete_permanent',
    title,
    description,
    typeToConfirm: {
      enabled: true,
      phrase: confirmPhrase,
      placeholder: `Type ${confirmPhrase} to confirm`
    },
    requiresApproval: true
  })
}