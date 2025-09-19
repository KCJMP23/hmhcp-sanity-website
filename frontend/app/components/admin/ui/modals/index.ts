/**
 * Admin Modals Index
 * Export all modal and overlay components for the admin interface
 */

// Modal Components
export { default as AdminModal } from './AdminModal'
export type { AdminModalProps } from '../types'

// Dialog Components  
export { default as AdminDialog } from './AdminDialog'

// Drawer Components
export { default as AdminDrawer } from './AdminDrawer'

// Tooltip Components
export { 
  default as AdminTooltip,
  HelpTooltip,
  InfoTooltip, 
  WarningTooltip,
  ErrorTooltip,
  SuccessTooltip
} from './AdminTooltip'

// Popover Components
export {
  default as AdminPopover,
  MenuPopover,
  InfoPopover,
  FormPopover,
  PanelPopover
} from './AdminPopover'

// Re-export common types used by modals
export type {
  BaseAdminComponentProps,
  AdminSeverity,
  AdminSize
} from '../types'