/**
 * Risk Level Configurations
 * Defines visual treatment and interaction requirements for each risk level
 * Following Apple-inspired design with healthcare-focused color psychology
 */

import { 
  ConfirmationRisk, 
  ConfirmationAction, 
  ConfirmationEntity,
  RiskLevelConfig,
  ConfirmationPreset,
  ConfirmationModalProps 
} from './types'

/**
 * Risk level visual and interaction configurations
 */
export const riskLevelConfigs: Record<ConfirmationRisk, RiskLevelConfig> = {
  low: {
    colors: {
      primary: 'rgb(59, 130, 246)', // blue-500
      secondary: 'rgb(147, 197, 253)', // blue-300
      accent: 'rgb(219, 234, 254)', // blue-100
      text: 'rgb(30, 58, 138)', // blue-900
      background: 'rgb(248, 250, 252)', // slate-50
      border: 'rgb(203, 213, 225)', // slate-300
    },
    icon: {
      name: 'Info',
      color: 'text-blue-500',
      size: 'h-5 w-5'
    },
    animation: {
      initial: 'scale(0.95) opacity-0',
      animate: 'scale(1) opacity-100',
      exit: 'scale(0.95) opacity-0',
      duration: 200
    },
    requirements: {
      typeToConfirm: false,
      doubleConfirm: false,
      delay: 0
    }
  },
  
  medium: {
    colors: {
      primary: 'rgb(245, 158, 11)', // amber-500
      secondary: 'rgb(251, 191, 36)', // amber-400
      accent: 'rgb(254, 243, 199)', // amber-100
      text: 'rgb(146, 64, 14)', // amber-900
      background: 'rgb(255, 251, 235)', // amber-50
      border: 'rgb(252, 211, 77)', // amber-300
    },
    icon: {
      name: 'AlertTriangle',
      color: 'text-amber-500',
      size: 'h-5 w-5'
    },
    animation: {
      initial: 'scale(0.9) opacity-0 y-4',
      animate: 'scale(1) opacity-100 y-0',
      exit: 'scale(0.9) opacity-0 y-4',
      duration: 300
    },
    requirements: {
      typeToConfirm: false,
      doubleConfirm: false,
      delay: 500 // half second delay
    }
  },
  
  high: {
    colors: {
      primary: 'rgb(239, 68, 68)', // red-500
      secondary: 'rgb(248, 113, 113)', // red-400
      accent: 'rgb(254, 226, 226)', // red-100
      text: 'rgb(127, 29, 29)', // red-900
      background: 'rgb(255, 241, 242)', // red-50
      border: 'rgb(252, 165, 165)', // red-300
    },
    icon: {
      name: 'AlertOctagon',
      color: 'text-red-500',
      size: 'h-6 w-6'
    },
    animation: {
      initial: 'scale(0.8) opacity-0 y-8',
      animate: 'scale(1) opacity-100 y-0',
      exit: 'scale(0.8) opacity-0 y-8',
      duration: 400
    },
    requirements: {
      typeToConfirm: false,
      doubleConfirm: true,
      delay: 1500 // 1.5 second delay
    }
  },
  
  critical: {
    colors: {
      primary: 'rgb(220, 38, 127)', // pink-600 (more severe than red)
      secondary: 'rgb(244, 63, 94)', // rose-500
      accent: 'rgb(255, 228, 230)', // rose-100
      text: 'rgb(136, 19, 55)', // rose-900
      background: 'rgb(255, 241, 242)', // rose-50
      border: 'rgb(251, 113, 133)', // rose-400
    },
    icon: {
      name: 'ShieldAlert',
      color: 'text-pink-600',
      size: 'h-6 w-6'
    },
    animation: {
      initial: 'scale(0.7) opacity-0 y-12',
      animate: 'scale(1) opacity-100 y-0',
      exit: 'scale(0.7) opacity-0 y-12',
      duration: 500
    },
    requirements: {
      typeToConfirm: true,
      doubleConfirm: true,
      delay: 3000 // 3 second delay
    }
  }
}

/**
 * Action to risk level mapping
 * Determines default risk level for each action type
 */
export const actionRiskMapping: Record<ConfirmationAction, ConfirmationRisk> = {
  // Low Risk Actions
  archive: 'low',
  unarchive: 'low',
  unpublish: 'low',
  duplicate: 'low',
  export: 'low',
  
  // Medium Risk Actions
  publish: 'medium',
  trash: 'medium',
  restore: 'medium',
  deactivate_user: 'medium',
  activate_user: 'medium',
  change_role: 'medium',
  clear_cache: 'medium',
  bulk_edit: 'medium',
  bulk_archive: 'medium',
  bulk_publish: 'medium',
  archive_study: 'medium',
  export_data: 'medium',
  
  // High Risk Actions
  delete: 'high',
  reset_password: 'high',
  force_logout: 'high',
  reset_settings: 'high',
  backup_create: 'high',
  maintenance_enable: 'high',
  maintenance_disable: 'high',
  bulk_delete: 'high',
  delete_trial: 'high',
  delete_publication: 'high',
  
  // Critical Risk Actions
  delete_permanent: 'critical',
  delete_user: 'critical',
  backup_restore: 'critical'
}

/**
 * Entity-specific risk adjustments
 * Some entities require higher risk levels regardless of action
 */
export const entityRiskAdjustments: Partial<Record<ConfirmationEntity, Partial<Record<ConfirmationAction, ConfirmationRisk>>>> = {
  user: {
    delete: 'critical',
    deactivate_user: 'high'
  },
  clinical_trial: {
    delete: 'critical',
    archive: 'medium'
  },
  publication: {
    delete: 'critical'
  },
  quality_study: {
    delete: 'critical'
  },
  backup: {
    delete: 'critical'
  },
  setting: {
    reset_settings: 'critical'
  }
}

/**
 * Confirmation presets for common actions
 * Pre-configured confirmation modals for frequently used operations
 */
export const confirmationPresets: Record<ConfirmationPreset, Partial<ConfirmationModalProps>> = {
  delete: {
    risk: 'high',
    action: 'delete',
    title: 'Delete Item',
    description: 'Are you sure you want to delete this item?',
    confirmButtonText: 'Delete',
    consequences: [
      {
        type: 'warning',
        title: 'Item will be moved to trash',
        description: 'You can restore it later from the trash'
      }
    ]
  },
  
  delete_permanent: {
    risk: 'critical',
    action: 'delete_permanent',
    title: 'Permanently Delete',
    description: 'This action cannot be undone.',
    confirmButtonText: 'Delete Permanently',
    typeToConfirm: {
      enabled: true,
      phrase: 'DELETE',
      placeholder: 'Type DELETE to confirm'
    },
    consequences: [
      {
        type: 'danger',
        title: 'Permanent deletion',
        description: 'This item will be completely removed and cannot be recovered'
      }
    ]
  },
  
  trash: {
    risk: 'medium',
    action: 'trash',
    title: 'Move to Trash',
    description: 'Move selected items to trash?',
    confirmButtonText: 'Move to Trash',
    consequences: [
      {
        type: 'warning',
        title: 'Items will be moved to trash',
        description: 'You can restore them later from the trash folder'
      }
    ]
  },
  
  archive: {
    risk: 'low',
    action: 'archive',
    title: 'Archive Item',
    description: 'Archive this item?',
    confirmButtonText: 'Archive'
  },
  
  publish: {
    risk: 'medium',
    action: 'publish',
    title: 'Publish Item',
    description: 'Make this item publicly visible?',
    confirmButtonText: 'Publish',
    consequences: [
      {
        type: 'info',
        title: 'Item will be public',
        description: 'This item will be visible to all visitors'
      }
    ]
  },
  
  unpublish: {
    risk: 'low',
    action: 'unpublish',
    title: 'Unpublish Item',
    description: 'Hide this item from public view?',
    confirmButtonText: 'Unpublish'
  },
  
  bulk_delete: {
    risk: 'high',
    action: 'bulk_delete',
    title: 'Delete Multiple Items',
    description: 'Delete all selected items?',
    confirmButtonText: 'Delete All',
    consequences: [
      {
        type: 'warning',
        title: 'Multiple items affected',
        description: 'All selected items will be moved to trash'
      }
    ]
  },
  
  bulk_archive: {
    risk: 'medium',
    action: 'bulk_archive',
    title: 'Archive Multiple Items',
    description: 'Archive all selected items?',
    confirmButtonText: 'Archive All'
  },
  
  user_delete: {
    risk: 'critical',
    action: 'delete_user',
    entity: 'user',
    title: 'Delete User Account',
    description: 'This will permanently delete the user account.',
    confirmButtonText: 'Delete User',
    typeToConfirm: {
      enabled: true,
      phrase: 'DELETE USER',
      placeholder: 'Type DELETE USER to confirm'
    },
    consequences: [
      {
        type: 'danger',
        title: 'Account deletion',
        description: 'All user data, content, and history will be permanently removed'
      },
      {
        type: 'warning',
        title: 'Content ownership',
        description: 'Content created by this user may need to be reassigned'
      }
    ]
  },
  
  user_deactivate: {
    risk: 'high',
    action: 'deactivate_user',
    entity: 'user',
    title: 'Deactivate User',
    description: 'Prevent this user from logging in?',
    confirmButtonText: 'Deactivate',
    consequences: [
      {
        type: 'warning',
        title: 'Access suspended',
        description: 'User will not be able to log in until reactivated'
      }
    ]
  },
  
  system_reset: {
    risk: 'critical',
    action: 'reset_settings',
    title: 'Reset System Settings',
    description: 'Reset all settings to default values?',
    confirmButtonText: 'Reset Settings',
    typeToConfirm: {
      enabled: true,
      phrase: 'RESET',
      placeholder: 'Type RESET to confirm'
    },
    consequences: [
      {
        type: 'danger',
        title: 'All customizations lost',
        description: 'Theme, configurations, and custom settings will be reset'
      },
      {
        type: 'warning',
        title: 'System restart required',
        description: 'The system may need to restart after reset'
      }
    ]
  },
  
  backup_restore: {
    risk: 'critical',
    action: 'backup_restore',
    entity: 'backup',
    title: 'Restore from Backup',
    description: 'Restore system from backup? Current data will be lost.',
    confirmButtonText: 'Restore Backup',
    typeToConfirm: {
      enabled: true,
      phrase: 'RESTORE',
      placeholder: 'Type RESTORE to confirm'
    },
    consequences: [
      {
        type: 'danger',
        title: 'Current data will be lost',
        description: 'All current content and settings will be overwritten'
      },
      {
        type: 'warning',
        title: 'Extended downtime',
        description: 'The restore process may take several minutes'
      }
    ]
  },
  
  maintenance_mode: {
    risk: 'high',
    action: 'maintenance_enable',
    title: 'Enable Maintenance Mode',
    description: 'Put the site into maintenance mode?',
    confirmButtonText: 'Enable Maintenance',
    consequences: [
      {
        type: 'warning',
        title: 'Site will be offline',
        description: 'Visitors will see a maintenance page'
      },
      {
        type: 'info',
        title: 'Admin access preserved',
        description: 'Administrators can still access the backend'
      }
    ]
  }
}

/**
 * Get risk level for a specific action and entity combination
 */
export function getRiskLevel(
  action: ConfirmationAction, 
  entity?: ConfirmationEntity
): ConfirmationRisk {
  // Check for entity-specific risk adjustments
  if (entity && entityRiskAdjustments[entity]?.[action]) {
    return entityRiskAdjustments[entity]![action]!
  }
  
  // Return default risk level for action
  return actionRiskMapping[action] || 'medium'
}

/**
 * Get configuration for a risk level
 */
export function getRiskConfig(risk: ConfirmationRisk): RiskLevelConfig {
  return riskLevelConfigs[risk]
}

/**
 * Get preset configuration
 */
export function getPresetConfig(preset: ConfirmationPreset): Partial<ConfirmationModalProps> {
  return confirmationPresets[preset]
}

/**
 * Keyboard shortcuts
 */
export const keyboardShortcuts = {
  confirm: ['Enter'],
  confirmAlt: ['Ctrl+Enter', 'Cmd+Enter'],
  cancel: ['Escape'],
  focusConfirm: ['Tab'],
  focusCancel: ['Shift+Tab'],
  typeToConfirm: ['ArrowDown', 'ArrowUp'] // Focus type-to-confirm input
}

/**
 * Animation durations (in milliseconds)
 */
export const animationDurations = {
  fadeIn: 200,
  fadeOut: 150,
  slideIn: 300,
  slideOut: 200,
  spring: 400,
  typeToConfirm: 100, // typing feedback
  buttonHover: 150
}

/**
 * Default confirmation texts
 */
export const defaultTexts = {
  buttons: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    archive: 'Archive',
    publish: 'Publish',
    unpublish: 'Unpublish',
    trash: 'Move to Trash'
  },
  loading: {
    processing: 'Processing...',
    deleting: 'Deleting...',
    archiving: 'Archiving...',
    publishing: 'Publishing...',
    saving: 'Saving...'
  },
  placeholders: {
    typeToConfirm: 'Type to confirm',
    search: 'Search items...'
  }
}