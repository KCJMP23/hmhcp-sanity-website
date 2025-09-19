/**
 * Confirmation Modal System Types
 * Comprehensive typing for confirmation dialogs with risk-based hierarchy
 */

import { ReactNode } from 'react'

/**
 * Risk levels for confirmation actions
 * Determines visual treatment, required interactions, and safety measures
 */
export type ConfirmationRisk = 'low' | 'medium' | 'high' | 'critical'

/**
 * Action types that can be confirmed
 * Used for contextual messaging and icons
 */
export type ConfirmationAction = 
  // Content Actions
  | 'archive' | 'unarchive'
  | 'publish' | 'unpublish' 
  | 'trash' | 'restore'
  | 'delete' | 'delete_permanent'
  | 'duplicate' | 'export'
  // User Actions
  | 'deactivate_user' | 'activate_user'
  | 'delete_user' | 'change_role'
  | 'reset_password' | 'force_logout'
  // System Actions
  | 'clear_cache' | 'reset_settings'
  | 'backup_create' | 'backup_restore'
  | 'maintenance_enable' | 'maintenance_disable'
  // Batch Actions
  | 'bulk_edit' | 'bulk_delete'
  | 'bulk_archive' | 'bulk_publish'
  // Healthcare Specific
  | 'delete_trial' | 'delete_publication'
  | 'archive_study' | 'export_data'

/**
 * Entity types being acted upon
 */
export type ConfirmationEntity = 
  | 'post' | 'page' | 'media' | 'comment'
  | 'user' | 'role' | 'menu' | 'widget'
  | 'clinical_trial' | 'publication' | 'quality_study'
  | 'platform' | 'backup' | 'setting'

/**
 * Item being acted upon in the confirmation
 */
export interface ConfirmationItem {
  id: string | number
  title?: string
  name?: string
  type?: string
  metadata?: Record<string, any>
}

/**
 * Consequence information to display to users
 */
export interface ConfirmationConsequence {
  type: 'warning' | 'danger' | 'info'
  title: string
  description: string
  icon?: ReactNode
}

/**
 * Related items that might be affected
 */
export interface RelatedItem {
  id: string | number
  title: string
  type: string
  relationship: string // 'child', 'dependency', 'reference', etc.
}

/**
 * Configuration for type-to-confirm functionality
 */
export interface TypeToConfirmConfig {
  enabled: boolean
  phrase: string
  placeholder?: string
  caseSensitive?: boolean
}

/**
 * Undo configuration
 */
export interface UndoConfig {
  enabled: boolean
  duration: number // milliseconds
  action: () => Promise<void>
  description?: string
}

/**
 * Base confirmation modal props
 */
export interface ConfirmationModalProps {
  // State Management
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  
  // Content
  title?: string
  description?: string | ReactNode
  customContent?: ReactNode
  
  // Risk and Action Context
  risk: ConfirmationRisk
  action: ConfirmationAction
  entity?: ConfirmationEntity
  
  // Items and Context
  item?: ConfirmationItem
  items?: ConfirmationItem[] // for batch operations
  consequences?: ConfirmationConsequence[]
  relatedItems?: RelatedItem[]
  
  // Interaction Requirements
  typeToConfirm?: TypeToConfirmConfig
  requiresApproval?: boolean // extra checkbox for critical actions
  
  // Visual Customization
  icon?: ReactNode
  illustration?: ReactNode
  confirmButtonText?: string
  cancelButtonText?: string
  variant?: 'default' | 'destructive' | 'warning'
  
  // State
  isLoading?: boolean
  error?: string
  
  // Undo Support
  undo?: UndoConfig
  
  // Accessibility
  ariaLabel?: string
  ariaDescription?: string
}

/**
 * Batch confirmation specific props
 */
export interface BatchConfirmationProps extends Omit<ConfirmationModalProps, 'item'> {
  items: ConfirmationItem[]
  showItemPreview?: boolean
  maxPreviewItems?: number
  onItemRemove?: (item: ConfirmationItem) => void
  onItemToggle?: (item: ConfirmationItem, selected: boolean) => void
  selectedItems?: Set<string | number>
}

/**
 * Confirmation context for provider
 */
export interface ConfirmationContextValue {
  // Single confirmation
  confirm: (config: Omit<ConfirmationModalProps, 'isOpen' | 'onOpenChange'>) => Promise<boolean>
  
  // Batch confirmation
  confirmBatch: (config: Omit<BatchConfirmationProps, 'isOpen' | 'onOpenChange'>) => Promise<boolean>
  
  // Quick confirmations
  confirmDelete: (item: ConfirmationItem, permanent?: boolean) => Promise<boolean>
  confirmTrash: (items: ConfirmationItem[]) => Promise<boolean>
  confirmCritical: (action: string, consequences?: string[]) => Promise<boolean>
  
  // State
  isConfirming: boolean
  currentRisk: ConfirmationRisk | null
}

/**
 * Risk level configurations
 */
export interface RiskLevelConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
    border: string
  }
  icon: {
    name: string
    color: string
    size: string
  }
  animation: {
    initial: string
    animate: string
    exit: string
    duration: number
  }
  requirements: {
    typeToConfirm: boolean
    doubleConfirm: boolean
    delay: number // minimum time before confirm is enabled
  }
}

/**
 * Undo queue item
 */
export interface UndoQueueItem {
  id: string
  action: ConfirmationAction
  entity: ConfirmationEntity
  items: ConfirmationItem[]
  undoAction: () => Promise<void>
  timestamp: number
  duration: number
  description: string
}

/**
 * Confirmation modal presets
 */
export type ConfirmationPreset = 
  | 'delete'
  | 'delete_permanent' 
  | 'trash'
  | 'archive'
  | 'publish'
  | 'unpublish'
  | 'bulk_delete'
  | 'bulk_archive'
  | 'user_delete'
  | 'user_deactivate'
  | 'system_reset'
  | 'backup_restore'
  | 'maintenance_mode'

/**
 * Keyboard shortcuts for confirmation modals
 */
export interface KeyboardShortcuts {
  confirm: string[] // e.g., ['Enter', 'Ctrl+Enter']
  cancel: string[] // e.g., ['Escape', 'Ctrl+C']
  focus_confirm: string[] // e.g., ['Tab']
  focus_cancel: string[] // e.g., ['Shift+Tab']
}