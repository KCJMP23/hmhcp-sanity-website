'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ConfirmationModalProps, BatchConfirmationProps, ConfirmationContextValue, ConfirmationItem } from './types'
import { BaseConfirmationModal } from './base-confirmation-modal'
import { BatchConfirmationModal } from './batch-confirmation-modal'
import { UndoProvider } from './undo-system'

/**
 * Confirmation Context
 */
const ConfirmationContext = createContext<ConfirmationContextValue | null>(null)

/**
 * Confirmation Provider Props
 */
interface ConfirmationProviderProps {
  children: React.ReactNode
  // Undo system configuration
  enableUndo?: boolean
  undoPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  undoDuration?: number
  maxUndoQueueSize?: number
}

/**
 * Confirmation Provider Component
 * Provides confirmation modal functionality throughout the application
 */
export function ConfirmationProvider({
  children,
  enableUndo = true,
  undoPosition = 'top-right',
  undoDuration = 10000,
  maxUndoQueueSize = 5
}: ConfirmationProviderProps) {
  // Modal state management
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean
    config: Partial<ConfirmationModalProps> | null
    resolver: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    config: null,
    resolver: null
  })

  const [batchModal, setBatchModal] = useState<{
    isOpen: boolean
    config: Partial<BatchConfirmationProps> | null
    resolver: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    config: null,
    resolver: null
  })

  const [isConfirming, setIsConfirming] = useState(false)
  const [currentRisk, setCurrentRisk] = useState<'low' | 'medium' | 'high' | 'critical' | null>(null)

  // Single confirmation modal
  const confirm = useCallback((config: Omit<ConfirmationModalProps, 'isOpen' | 'onOpenChange'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setCurrentRisk(config.risk)
      setConfirmationModal({
        isOpen: true,
        config,
        resolver: resolve
      })
    })
  }, [])

  // Batch confirmation modal
  const confirmBatch = useCallback((config: Omit<BatchConfirmationProps, 'isOpen' | 'onOpenChange'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setCurrentRisk(config.risk)
      setBatchModal({
        isOpen: true,
        config,
        resolver: resolve
      })
    })
  }, [])

  // Quick confirmations
  const confirmDelete = useCallback(async (item: ConfirmationItem, permanent: boolean = false): Promise<boolean> => {
    return confirm({
      risk: permanent ? 'critical' : 'high',
      action: permanent ? 'delete_permanent' : 'delete',
      entity: 'post',
      item,
      title: permanent ? 'Permanently Delete Item' : 'Delete Item',
      description: permanent 
        ? `Are you sure you want to permanently delete "${item.title || item.name}"? This action cannot be undone.`
        : `Are you sure you want to delete "${item.title || item.name}"? It will be moved to trash.`,
      typeToConfirm: permanent ? {
        enabled: true,
        phrase: 'DELETE',
        placeholder: 'Type DELETE to confirm'
      } : undefined,
      onConfirm: async () => {
        // This will be handled by the confirmation modal
        console.log('Delete confirmed for:', item)
      }
    })
  }, [confirm])

  const confirmTrash = useCallback(async (items: ConfirmationItem[]): Promise<boolean> => {
    return confirmBatch({
      risk: 'medium',
      action: 'trash',
      entity: 'post',
      items,
      title: 'Move to Trash',
      description: `Move ${items.length} item${items.length > 1 ? 's' : ''} to trash?`,
      consequences: [{
        type: 'warning',
        title: 'Items will be moved to trash',
        description: 'You can restore them later from the trash folder'
      }],
      onConfirm: async () => {
        // This will be handled by the confirmation modal
        console.log('Move to trash confirmed for:', items.length, 'items')
      }
    })
  }, [confirmBatch])

  const confirmCritical = useCallback(async (action: string, consequences: string[] = []): Promise<boolean> => {
    return confirm({
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
  }, [confirm])

  // Handle confirmation modal actions
  const handleConfirmationConfirm = useCallback(async () => {
    if (!confirmationModal.config?.onConfirm) return

    setIsConfirming(true)
    try {
      await confirmationModal.config.onConfirm()
      setConfirmationModal(prev => ({ ...prev, isOpen: false }))
      confirmationModal.resolver?.(true)
    } catch (error) {
      console.error('Confirmation action failed:', error)
      // Keep modal open on error
    } finally {
      setIsConfirming(false)
    }
  }, [confirmationModal])

  const handleConfirmationCancel = useCallback(() => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }))
    setCurrentRisk(null)
    confirmationModal.resolver?.(false)
    confirmationModal.config?.onCancel?.()
  }, [confirmationModal])

  const handleConfirmationOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleConfirmationCancel()
    }
  }, [handleConfirmationCancel])

  // Handle batch modal actions
  const handleBatchConfirm = useCallback(async () => {
    if (!batchModal.config?.onConfirm) return

    setIsConfirming(true)
    try {
      await batchModal.config.onConfirm()
      setBatchModal(prev => ({ ...prev, isOpen: false }))
      batchModal.resolver?.(true)
    } catch (error) {
      console.error('Batch confirmation action failed:', error)
      // Keep modal open on error
    } finally {
      setIsConfirming(false)
    }
  }, [batchModal])

  const handleBatchCancel = useCallback(() => {
    setBatchModal(prev => ({ ...prev, isOpen: false }))
    setCurrentRisk(null)
    batchModal.resolver?.(false)
    batchModal.config?.onCancel?.()
  }, [batchModal])

  const handleBatchOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleBatchCancel()
    }
  }, [handleBatchCancel])

  // Context value
  const contextValue: ConfirmationContextValue = {
    confirm,
    confirmBatch,
    confirmDelete,
    confirmTrash,
    confirmCritical,
    isConfirming,
    currentRisk
  }

  // Wrap with undo provider if enabled
  const content = (
    <ConfirmationContext.Provider value={contextValue}>
      {children}
      
      {/* Single Confirmation Modal */}
      {confirmationModal.config && confirmationModal.config.risk && confirmationModal.config.action && (
        <BaseConfirmationModal
          risk={confirmationModal.config.risk}
          action={confirmationModal.config.action}
          entity={confirmationModal.config.entity}
          item={confirmationModal.config.item}
          items={confirmationModal.config.items}
          consequences={confirmationModal.config.consequences}
          relatedItems={confirmationModal.config.relatedItems}
          typeToConfirm={confirmationModal.config.typeToConfirm}
          requiresApproval={confirmationModal.config.requiresApproval}
          icon={confirmationModal.config.icon}
          illustration={confirmationModal.config.illustration}
          confirmButtonText={confirmationModal.config.confirmButtonText}
          cancelButtonText={confirmationModal.config.cancelButtonText}
          variant={confirmationModal.config.variant}
          error={confirmationModal.config.error}
          undo={confirmationModal.config.undo}
          ariaLabel={confirmationModal.config.ariaLabel}
          ariaDescription={confirmationModal.config.ariaDescription}
          title={confirmationModal.config.title}
          description={confirmationModal.config.description}
          customContent={confirmationModal.config.customContent}
          isOpen={confirmationModal.isOpen}
          onOpenChange={handleConfirmationOpenChange}
          onConfirm={handleConfirmationConfirm}
          onCancel={handleConfirmationCancel}
          isLoading={isConfirming}
        />
      )}
      
      {/* Batch Confirmation Modal */}
      {batchModal.config && batchModal.config.items && batchModal.config.risk && batchModal.config.action && (
        <BatchConfirmationModal
          risk={batchModal.config.risk}
          action={batchModal.config.action}
          entity={batchModal.config.entity}
          items={batchModal.config.items}
          consequences={batchModal.config.consequences}
          relatedItems={batchModal.config.relatedItems}
          typeToConfirm={batchModal.config.typeToConfirm}
          requiresApproval={batchModal.config.requiresApproval}
          icon={batchModal.config.icon}
          illustration={batchModal.config.illustration}
          confirmButtonText={batchModal.config.confirmButtonText}
          cancelButtonText={batchModal.config.cancelButtonText}
          variant={batchModal.config.variant}
          error={batchModal.config.error}
          undo={batchModal.config.undo}
          ariaLabel={batchModal.config.ariaLabel}
          ariaDescription={batchModal.config.ariaDescription}
          title={batchModal.config.title}
          description={batchModal.config.description}
          customContent={batchModal.config.customContent}
          showItemPreview={batchModal.config.showItemPreview}
          maxPreviewItems={batchModal.config.maxPreviewItems}
          onItemRemove={batchModal.config.onItemRemove}
          onItemToggle={batchModal.config.onItemToggle}
          selectedItems={batchModal.config.selectedItems}
          isOpen={batchModal.isOpen}
          onOpenChange={handleBatchOpenChange}
          onConfirm={handleBatchConfirm}
          onCancel={handleBatchCancel}
          isLoading={isConfirming}
        />
      )}
    </ConfirmationContext.Provider>
  )

  if (enableUndo) {
    return (
      <UndoProvider
        position={undoPosition}
        defaultDuration={undoDuration}
        maxQueueSize={maxUndoQueueSize}
      >
        {content}
      </UndoProvider>
    )
  }

  return content
}

/**
 * Hook to use confirmation functionality
 */
export function useConfirmation(): ConfirmationContextValue {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider')
  }
  return context
}

/**
 * Higher-order component to wrap components with confirmation functionality
 */
export function withConfirmation<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithConfirmationComponent(props: P) {
    return (
      <ConfirmationProvider>
        <Component {...props} />
      </ConfirmationProvider>
    )
  }
}

/**
 * Confirmation hook for components outside the provider
 * Creates a temporary confirmation context
 */
export function useTemporaryConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<Partial<ConfirmationModalProps> | null>(null)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((confirmConfig: Omit<ConfirmationModalProps, 'isOpen' | 'onOpenChange'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(confirmConfig)
      setIsOpen(true)
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    try {
      if (config?.onConfirm) {
        await config.onConfirm()
      }
      setIsOpen(false)
      resolver?.(true)
    } catch (error) {
      console.error('Temporary confirmation failed:', error)
    }
  }, [config, resolver])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    resolver?.(false)
    config?.onCancel?.()
  }, [config, resolver])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleCancel()
    }
  }, [handleCancel])

  const modal = config && config.risk && config.action ? (
    <BaseConfirmationModal
      risk={config.risk}
      action={config.action}
      entity={config.entity}
      item={config.item}
      items={config.items}
      consequences={config.consequences}
      relatedItems={config.relatedItems}
      typeToConfirm={config.typeToConfirm}
      requiresApproval={config.requiresApproval}
      icon={config.icon}
      illustration={config.illustration}
      confirmButtonText={config.confirmButtonText}
      cancelButtonText={config.cancelButtonText}
      variant={config.variant}
      error={config.error}
      undo={config.undo}
      ariaLabel={config.ariaLabel}
      ariaDescription={config.ariaDescription}
      title={config.title}
      description={config.description}
      customContent={config.customContent}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return {
    confirm,
    modal,
    isOpen
  }
}