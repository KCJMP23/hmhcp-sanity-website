/**
 * Comprehensive Confirmation Modal System
 * 
 * A complete confirmation modal system with risk-based hierarchy, 
 * batch operations, undo functionality, and Apple-inspired design.
 * 
 * Features:
 * - Risk-based confirmation levels (low, medium, high, critical)
 * - Type-to-confirm for critical actions
 * - Batch confirmation with item preview
 * - Undo queue with recovery mechanism
 * - Keyboard navigation and accessibility
 * - Apple-inspired design with healthcare focus
 * - Integration with existing toast system
 * 
 * Usage Examples:
 * 
 * 1. Basic confirmation:
 * ```tsx
 * const { confirm } = useConfirmation()
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     risk: 'high',
 *     action: 'delete',
 *     entity: 'post',
 *     item: { id: '1', title: 'My Post' },
 *     onConfirm: async () => {
 *       await deletePost('1')
 *     }
 *   })
 * }
 * ```
 * 
 * 2. Batch confirmation:
 * ```tsx
 * const { confirmBatch } = useConfirmation()
 * 
 * const handleBulkDelete = async () => {
 *   const confirmed = await confirmBatch({
 *     risk: 'high',
 *     action: 'bulk_delete',
 *     entity: 'post',
 *     items: selectedPosts,
 *     showItemPreview: true,
 *     onConfirm: async () => {
 *       await bulkDeletePosts(selectedPosts.map(p => p.id))
 *     }
 *   })
 * }
 * ```
 * 
 * 3. With undo support:
 * ```tsx
 * const { executeWithUndo } = useUndoableConfirmation()
 * 
 * const handleDeleteWithUndo = async () => {
 *   await executeWithUndo(
 *     () => deletePost(post.id),
 *     {
 *       action: 'delete',
 *       entity: 'post',
 *       items: [post],
 *       description: `Deleted "${post.title}"`,
 *       undoAction: () => restorePost(post.id)
 *     }
 *   )
 * }
 * ```
 * 
 * 4. Preset confirmations:
 * ```tsx
 * const { confirmWithPreset } = usePresetConfirmations()
 * 
 * const handleUserDelete = async () => {
 *   const confirmed = await confirmWithPreset('user_delete', {
 *     item: user,
 *     onConfirm: async () => {
 *       await deleteUser(user.id)
 *     }
 *   })
 * }
 * ```
 * 
 * 5. Contextual confirmation:
 * ```tsx
 * const { confirmAction } = useContextualConfirmation()
 * 
 * const handleAction = async () => {
 *   // Automatically determines risk level and configuration
 *   const confirmed = await confirmAction(
 *     'delete_permanent',
 *     'clinical_trial',
 *     undefined,
 *     selectedTrials
 *   )
 * }
 * ```
 */

// Core components
export { BaseConfirmationModal } from './base-confirmation-modal'
export { BatchConfirmationModal } from './batch-confirmation-modal'

// Provider and context
export { 
  ConfirmationProvider, 
  useConfirmation, 
  withConfirmation, 
  useTemporaryConfirmation 
} from './confirmation-provider'

// Undo system
export {
  UndoProvider,
  useUndo,
  useUndoableConfirmation,
  createUndoableAction,
  undoActions
} from './undo-system'

// Hooks
export {
  useConfirmationModal,
  useBatchConfirmationModal,
  useQuickConfirmations,
  usePresetConfirmations,
  useContextualConfirmation,
  useFormConfirmation,
  confirmationUtils
} from './hooks'

// Configuration and types
export {
  getRiskLevel,
  getRiskConfig,
  getPresetConfig,
  riskLevelConfigs,
  actionRiskMapping,
  entityRiskAdjustments,
  confirmationPresets,
  keyboardShortcuts,
  animationDurations,
  defaultTexts
} from './config'

export type {
  // Core types
  ConfirmationRisk,
  ConfirmationAction,
  ConfirmationEntity,
  ConfirmationItem,
  ConfirmationConsequence,
  RelatedItem,
  
  // Configuration types
  TypeToConfirmConfig,
  UndoConfig,
  RiskLevelConfig,
  UndoQueueItem,
  ConfirmationPreset,
  KeyboardShortcuts,
  
  // Component props
  ConfirmationModalProps,
  BatchConfirmationProps,
  ConfirmationContextValue
} from './types'

