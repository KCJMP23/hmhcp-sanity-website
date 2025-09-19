'use client'

// Theme and Template Types
export interface Theme {
  id: string
  name: string
  description: string
  version: string
  author: string
  isActive: boolean
  isDark: boolean
  preview?: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
  }
  typography: {
    fontFamily: string
    fontSize: {
      base: string
      heading: string
    }
    fontWeight: {
      normal: number
      medium: number
      bold: number
    }
  }
  spacing: {
    unit: string
    scale: number[]
  }
  borderRadius: {
    base: string
    scale: number[]
  }
  customCSS?: string
}

export interface Template {
  id: string
  name: string
  description: string
  type: 'page' | 'post' | 'section' | 'component'
  category: string
  preview?: string
  content: string
  variables: Record<string, any>
}

// Preview mode type
export type PreviewMode = 'desktop' | 'tablet' | 'mobile'

// Theme actions props
export interface ThemeActionsProps {
  theme: Theme
  isActive: boolean
  onApply: (theme: Theme) => void
  onDuplicate: (theme: Theme) => void
  onExport: (theme: Theme) => void
  onDelete: (themeId: string) => void
}

// Theme list props
export interface ThemeListProps {
  themes: Theme[]
  activeTheme: Theme | null
  onThemeSelect: (theme: Theme) => void
  onImportTheme: (file: File) => void
  onApplyTheme: (theme: Theme) => void
  onDuplicateTheme: (theme: Theme) => void
  onExportTheme: (theme: Theme) => void
  onDeleteTheme: (themeId: string) => void
}

// Theme editor props
export interface ThemeEditorProps {
  activeTheme: Theme | null
  isEditing: boolean
  showCode: boolean
  onToggleEditing: () => void
  onToggleCode: () => void
  onThemeUpdate: (theme: Theme) => void
}

// Template browser props
export interface TemplateBrowserProps {
  templates: Template[]
  selectedTemplate: Template | null
  onTemplateSelect: (template: Template) => void
}

// Template preview props
export interface TemplatePreviewProps {
  selectedTemplate: Template | null
  previewMode: PreviewMode
  onPreviewModeChange: (mode: PreviewMode) => void
  onTemplateUpdate: (template: Template) => void
  onUseTemplate: (template: Template) => void
  onDuplicateTemplate: (template: Template) => void
  onExportTemplate: (template: Template) => void
}

// Constants
export const TEMPLATE_CATEGORIES = ['Heroes', 'Content', 'Posts', 'Components'] as const

export const PREVIEW_CLASSES = {
  desktop: 'w-full',
  tablet: 'max-w-2xl mx-auto',
  mobile: 'max-w-sm mx-auto'
} as const