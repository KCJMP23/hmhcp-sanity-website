/**
 * Admin Component Type Definitions
 * Healthcare-compliant admin UI component interfaces
 */

import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import { VariantProps } from 'class-variance-authority'

// Base component props that all admin components extend
export interface BaseAdminComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

// Healthcare-specific validation types
export interface HealthcareValidation {
  hipaaCompliant?: boolean
  medicalDataType?: 'PHI' | 'PII' | 'GENERAL' | 'SENSITIVE'
  validationPattern?: string
  sanitizationRequired?: boolean
}

// Common size variants for admin components
export type AdminSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Common severity levels for healthcare notifications
export type AdminSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical'

// Button component props
export interface AdminButtonProps extends BaseAdminComponentProps, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: AdminSize
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

// Input component props with healthcare validation
export interface AdminInputProps extends BaseAdminComponentProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helper?: string
  hint?: string
  required?: boolean
  healthcare?: HealthcareValidation
  icon?: ReactNode
  prefix?: string
  suffix?: string
  validation?: {
    status?: 'success' | 'warning' | 'info'
  }
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Textarea component props
export interface AdminTextareaProps extends BaseAdminComponentProps {
  id?: string
  name?: string
  label?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  rows?: number
  maxLength?: number
  autoResize?: boolean
  showCharCount?: boolean
  error?: string
  helper?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  healthcare?: HealthcareValidation
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Checkbox component props
export interface AdminCheckboxProps extends BaseAdminComponentProps {
  id?: string
  name?: string
  label?: string
  description?: string
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
  error?: string
  helper?: string
  required?: boolean
  disabled?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Radio component props
export interface AdminRadioOption {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
}

export interface AdminRadioProps extends BaseAdminComponentProps {
  id?: string
  name?: string
  label?: string
  options: AdminRadioOption[]
  value?: string | number
  defaultValue?: string | number
  orientation?: 'horizontal' | 'vertical'
  error?: string
  helper?: string
  required?: boolean
  disabled?: boolean
  onChange?: (value: string | number) => void
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Switch component props
export interface AdminSwitchProps extends BaseAdminComponentProps {
  id?: string
  name?: string
  label?: string
  description?: string
  checked?: boolean
  defaultChecked?: boolean
  labelPosition?: 'left' | 'right' | 'top' | 'bottom'
  error?: string
  helper?: string
  required?: boolean
  disabled?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Date picker component props
export interface AdminDatePickerProps extends BaseAdminComponentProps {
  id?: string
  name?: string
  label?: string
  placeholder?: string
  value?: string | Date
  defaultValue?: string | Date
  min?: string | Date
  max?: string | Date
  disabledDates?: (string | Date)[]
  format?: string
  showTime?: boolean
  clearable?: boolean
  error?: string
  helper?: string
  required?: boolean
  disabled?: boolean
  onChange?: (value: { target: { value: string } }) => void
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// File upload component props
export interface AdminFileUploadProps extends BaseAdminComponentProps {
  id?: string
  name?: string
  label?: string
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  error?: string
  helper?: string
  required?: boolean
  disabled?: boolean
  onChange?: (files: File[]) => void
  onRemove?: (file: File) => void
  healthcare?: HealthcareValidation
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
}

// Select component props
export interface AdminSelectOption {
  value: string | number
  label: string
  disabled?: boolean
  description?: string
}

export interface AdminSelectProps extends BaseAdminComponentProps {
  id?: string
  name?: string
  label?: string
  options: AdminSelectOption[]
  value?: string | number | (string | number)[]
  defaultValue?: string | number | (string | number)[]
  onChange?: (value: string | number | (string | number)[]) => void
  placeholder?: string
  error?: string
  helper?: string
  required?: boolean
  disabled?: boolean
  searchable?: boolean
  multiple?: boolean
  clearable?: boolean
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Data table column definition
export interface AdminDataTableColumn<T = any> {
  field: string
  label: string
  type?: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'currency' | 'percentage' | 'custom'
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  hidden?: boolean
  nowrap?: boolean
  render?: (value: any, row: T) => ReactNode
  healthcare?: boolean
}

// Backwards compatibility
export interface AdminTableColumn<T = any> extends AdminDataTableColumn<T> {}

// Data table action
export interface AdminDataTableAction<T = any> {
  label: string
  icon?: ReactNode
  handler: (row: T) => void
}

// Data table bulk action
export interface AdminDataTableBulkAction {
  label: string
  icon?: ReactNode
  handler: (selectedIds: (string | number)[]) => void
}

// Data table props
export interface AdminDataTableProps<T = any> extends BaseAdminComponentProps {
  columns: AdminDataTableColumn<T>[]
  data: T[]
  searchable?: boolean
  searchableFields?: string[]
  filterable?: boolean
  sortable?: boolean
  selectable?: boolean
  expandable?: boolean
  actions?: AdminDataTableAction<T>[]
  bulkActions?: AdminDataTableBulkAction[]
  pageSize?: number
  pageSizeOptions?: number[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  onRowClick?: (row: T) => void
  onRowExpand?: (row: T) => void
  healthcare?: HealthcareValidation
  variant?: 'default' | 'outline' | 'filled' | 'ghost'
}

// Modal component props
export interface AdminModalProps extends BaseAdminComponentProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
}

// Dialog component props
export interface AdminDialogProps extends BaseAdminComponentProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  severity?: AdminSeverity | 'question'
  content?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  destructive?: boolean
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  persistent?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Drawer component props
export interface AdminDrawerProps extends BaseAdminComponentProps {
  open: boolean
  onClose: () => void
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  position?: 'left' | 'right' | 'top' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'overlay' | 'push' | 'mini'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showCloseButton?: boolean
  resizable?: boolean
  collapsible?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  footer?: ReactNode
  header?: ReactNode
  persistent?: boolean
}

// Tooltip component props
export interface AdminTooltipProps extends BaseAdminComponentProps {
  content: ReactNode
  trigger?: ReactNode
  triggerProps?: React.HTMLAttributes<HTMLButtonElement>
  asChild?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  variant?: 'default' | 'help' | 'info' | 'warning' | 'error' | 'success'
  severity?: AdminSeverity
  size?: 'sm' | 'md' | 'lg'
  maxWidth?: string
  medicalContext?: boolean
  hipaaCompliant?: boolean
  title?: string
  description?: string
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'link'
  }>
}

// Popover component props
export interface AdminPopoverProps extends BaseAdminComponentProps {
  content: ReactNode
  title?: string
  description?: string
  trigger?: ReactNode
  triggerProps?: React.HTMLAttributes<HTMLButtonElement>
  asChild?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  variant?: 'default' | 'menu' | 'panel' | 'form' | 'info'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: string
  maxHeight?: string
  arrow?: boolean
  closable?: boolean
  medicalContext?: boolean
  hipaaCompliant?: boolean
  actions?: Array<{
    label: string
    onClick: () => void
    icon?: ReactNode
    variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'link'
    disabled?: boolean
    separator?: boolean
  }>
}

// Toast notification props
export interface AdminToastProps extends BaseAdminComponentProps {
  id: string
  title: string
  description?: string
  severity?: AdminSeverity
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

// Chart component base props
export interface AdminChartProps extends BaseAdminComponentProps {
  data: any[]
  width?: number | string
  height?: number | string
  loading?: boolean
  error?: string
  onDataPointClick?: (data: any) => void
  exportable?: boolean
}

// Drag and drop component props
export interface AdminDraggableProps extends BaseAdminComponentProps {
  draggableId: string
  index: number
  isDragDisabled?: boolean
  children: (provided: any, snapshot: any) => ReactNode
}

// Loading/skeleton props
export interface AdminSkeletonProps extends BaseAdminComponentProps {
  width?: number | string
  height?: number | string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
}

// Form validation schema type
export interface AdminFormValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | undefined
  healthcare?: HealthcareValidation
}

// Theme configuration for admin components
export interface AdminThemeConfig {
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string
    background: string
    foreground: string
    border: string
    muted: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    full: string
  }
  animation: {
    fast: string
    normal: string
    slow: string
  }
}

// Export utility type for extracting variant props
export type AdminComponentVariants<T> = T extends VariantProps<infer V> ? V : never