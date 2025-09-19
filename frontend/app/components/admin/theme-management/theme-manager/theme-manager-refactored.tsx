'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Palette,
  Layout,
  RefreshCw,
  Save
} from 'lucide-react'
import { ThemeList } from './theme-list'
import { ThemeEditor } from './theme-editor'
import { TemplateBrowser } from './template-browser'
import { TemplatePreview } from './template-preview'
import type { Theme, Template, PreviewMode } from './types'
import { DESIGN_TOKENS } from '@/lib/design-system/constants'

const ThemeManagerComponent = () => {
  
  // State management
  const [themes, setThemes] = useState<Theme[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load themes and templates
  useEffect(() => {
    loadThemes()
    loadTemplates()
  }, [])

  const loadThemes = async () => {
    // Load themes from API
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/themes')
      if (response.ok) {
        const data = await response.json()
        setThemes(data.themes || [])
        const activeTheme = data.themes?.find((t: Theme) => t.isActive)
        if (activeTheme) {
          setSelectedTheme(activeTheme)
        }
      } else {
        // Use default theme as fallback
        const defaultThemes: Theme[] = [
      {
        id: 'default',
        name: 'HM Healthcare Default',
        description: 'Clean, modern design with healthcare-focused colors',
        version: '1.0.0',
        author: 'HM Team',
        isActive: true,
        isDark: false,
        colors: {
          primary: DESIGN_TOKENS.colors.primary[600],
          secondary: DESIGN_TOKENS.colors.gray[600],
          accent: '#3B82F6',
          background: '#ffffff',
          foreground: '#111827',
          muted: '#f3f4f6',
          border: '#e5e7eb'
        },
        typography: {
          fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          fontSize: {
            base: '16px',
            heading: '48px'
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            bold: 700
          }
        },
        spacing: {
          unit: '8px',
          scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16]
        },
        borderRadius: {
          base: '8px',
          scale: [0, 0.25, 0.5, 1, 1.5, 2, 9999]
        }
      },
      {
        id: 'dark-modern',
        name: 'Dark Modern',
        description: 'Sleek dark theme with vibrant accents',
        version: '1.0.0',
        author: 'HM Team',
        isActive: false,
        isDark: true,
        colors: {
          primary: '#3b82f6',
          secondary: '#3B82F6',
          accent: '#3B82F6',
          background: '#0f172a',
          foreground: '#f1f5f9',
          muted: '#1e293b',
          border: '#334155'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            base: '16px',
            heading: '48px'
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            bold: 700
          }
        },
        spacing: {
          unit: '8px',
          scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16]
        },
        borderRadius: {
          base: '12px',
          scale: [0, 0.25, 0.5, 1, 1.5, 2, 9999]
        }
      },
      {
        id: 'minimal',
        name: 'Minimal Clean',
        description: 'Ultra-minimal design with focus on content',
        version: '1.0.0',
        author: 'Design Team',
        isActive: false,
        isDark: false,
        colors: {
          primary: '#000000',
          secondary: '#666666',
          accent: '#0066cc',
          background: '#ffffff',
          foreground: '#000000',
          muted: '#fafafa',
          border: '#eeeeee'
        },
        typography: {
          fontFamily: 'Georgia, serif',
          fontSize: {
            base: '18px',
            heading: '42px'
          },
          fontWeight: {
            normal: 400,
            medium: 400,
            bold: 700
          }
        },
        spacing: {
          unit: '8px',
          scale: [0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24]
        },
        borderRadius: {
          base: '0px',
          scale: [0, 0, 0, 0, 0, 0, 0]
        }
      }
    ]
        setThemes(defaultThemes)
        setActiveTheme(defaultThemes.find(t => t.isActive) || defaultThemes[0])
      }
    } catch (error) {
      console.error('Failed to load themes:', error)
      toast.error('Error loading themes', {
        description: 'Using default themes as fallback'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    // Load templates from API
    try {
      const response = await fetch('/api/admin/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        // Use default templates as fallback
        const defaultTemplates: Template[] = [
      {
        id: 'hero-1',
        name: 'Hero Section with CTA',
        description: 'Full-width hero section with call-to-action buttons',
        type: 'section',
        category: 'Heroes',
        content: `<section class="hero-section">
  <div class="hero-content">
    <h1>{{title}}</h1>
    <p>{{subtitle}}</p>
    <div class="hero-actions">
      <button class="btn-primary">{{primaryCTA}}</button>
      <button class="btn-secondary">{{secondaryCTA}}</button>
    </div>
  </div>
</section>`,
        variables: {
          title: 'Welcome to Healthcare Innovation',
          subtitle: 'Transforming patient care with cutting-edge technology',
          primaryCTA: 'Get Started',
          secondaryCTA: 'Learn More'
        }
      },
      {
        id: 'service-grid',
        name: 'Services Grid',
        description: '3-column grid layout for services',
        type: 'section',
        category: 'Content',
        content: `<section class="services-grid">
  <div class="container">
    <h2>{{title}}</h2>
    <div class="grid grid-cols-3 gap-6">
      {{#services}}
      <div class="service-card">
        <div class="service-icon">{{icon}}</div>
        <h3>{{name}}</h3>
        <p>{{description}}</p>
      </div>
      {{/services}}
    </div>
  </div>
</section>`,
        variables: {
          title: 'Our Services',
          services: []
        }
      },
      {
        id: 'blog-post',
        name: 'Blog Post Template',
        description: 'Standard blog post layout with sidebar',
        type: 'post',
        category: 'Posts',
        content: `<article class="blog-post">
  <header class="post-header">
    <h1>{{title}}</h1>
    <div class="post-meta">
      <span>By {{author}}</span>
      <span>{{date}}</span>
    </div>
  </header>
  <div class="post-content">
    {{content}}
  </div>
  <footer class="post-footer">
    <div class="post-tags">
      {{#tags}}
      <span class="tag">{{.}}</span>
      {{/tags}}
    </div>
  </footer>
</article>`,
        variables: {
          title: '',
          author: '',
          date: '',
          content: '',
          tags: []
        }
      }
    ]
        setTemplates(defaultTemplates)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      // Continue with empty templates
    }
  }

  // Theme management functions
  const applyTheme = (theme: Theme) => {
    setActiveTheme(theme)
    setThemes(themes.map(t => ({ ...t, isActive: t.id === theme.id })))
    
    // Apply theme to document
    const root = document.documentElement
    root.style.setProperty('--primary-color', theme.colors.primary)
    root.style.setProperty('--secondary-color', theme.colors.secondary)
    root.style.setProperty('--accent-color', theme.colors.accent)
    root.style.setProperty('--background-color', theme.colors.background)
    root.style.setProperty('--foreground-color', theme.colors.foreground)
    root.style.setProperty('--muted-color', theme.colors.muted)
    root.style.setProperty('--border-color', theme.colors.border)
    
    toast.success(`Theme applied: ${theme.name} is now active`)
  }

  const exportTheme = (theme: Theme) => {
    const themeData = JSON.stringify(theme, null, 2)
    const blob = new Blob([themeData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${theme.id}-theme.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importTheme = async (file: File) => {
    try {
      const text = await file.text()
      const theme = JSON.parse(text) as Theme
      theme.id = `imported-${Date.now()}`
      theme.isActive = false
      
      setThemes([...themes, theme])
      toast.success(`Theme imported: ${theme.name} has been imported successfully`)
    } catch (error) {
      toast.error('Import failed: Invalid theme file format')
    }
  }

  const duplicateTheme = (theme: Theme) => {
    const newTheme: Theme = {
      ...theme,
      id: `${theme.id}-copy-${Date.now()}`,
      name: `${theme.name} (Copy)`,
      isActive: false
    }
    
    setThemes([...themes, newTheme])
    toast.success(`Theme duplicated: ${newTheme.name} has been created`)
  }

  const deleteTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (theme?.isActive) {
      toast.error('Cannot delete active theme: Please activate another theme first')
      return
    }
    
    setThemes(themes.filter(t => t.id !== themeId))
    toast.success('Theme deleted: Theme has been removed')
  }

  // Template management functions
  const useTemplate = (template: Template) => {
    toast.success(`Template selected: ${template.name} is ready to use`)
  }

  const duplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`
    }
    
    setTemplates([...templates, newTemplate])
    toast.success(`Template duplicated: ${newTemplate.name} has been created`)
  }

  const exportTemplate = (template: Template) => {
    const templateData = JSON.stringify(template, null, 2)
    const blob = new Blob([templateData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.id}-template.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetToDefault = () => {
    const defaultTheme = themes.find(t => t.id === 'default')
    if (defaultTheme) {
      applyTheme(defaultTheme)
    }
  }

  const saveChanges = async () => {
    // Save changes to API
    try {
      const response = await fetch('/api/admin/themes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themes,
          activeThemeId: activeTheme?.id
        })
      })
      
      if (response.ok) {
        toast.success('Changes saved: Your theme changes have been saved successfully')
      } else {
        throw new Error('Failed to save changes')
      }
    } catch (error) {
      console.error('Failed to save theme changes:', error)
      toast.error('Error saving changes: Failed to save theme changes. Please try again.')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Theme & Template Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize the look and feel of your website
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={resetToDefault} className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button size="sm" onClick={saveChanges} className="rounded-full">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="themes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md rounded-lg">
          <TabsTrigger value="themes" className="gap-2 rounded-md">
            <Palette className="h-4 w-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 rounded-md">
            <Layout className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Theme List */}
            <div className="lg:col-span-1">
              <ThemeList
                themes={themes}
                activeTheme={activeTheme}
                onThemeSelect={setActiveTheme}
                onImportTheme={importTheme}
                onApplyTheme={applyTheme}
                onDuplicateTheme={duplicateTheme}
                onExportTheme={exportTheme}
                onDeleteTheme={deleteTheme}
              />
            </div>

            {/* Theme Editor */}
            <div className="lg:col-span-2">
              <ThemeEditor
                activeTheme={activeTheme}
                isEditing={isEditing}
                showCode={showCode}
                onToggleEditing={() => setIsEditing(!isEditing)}
                onToggleCode={() => setShowCode(!showCode)}
                onThemeUpdate={setActiveTheme}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Browser */}
            <div className="lg:col-span-1">
              <TemplateBrowser
                templates={templates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
              />
            </div>

            {/* Template Preview */}
            <div className="lg:col-span-2">
              <TemplatePreview
                selectedTemplate={selectedTemplate}
                previewMode={previewMode}
                onPreviewModeChange={setPreviewMode}
                onTemplateUpdate={setSelectedTemplate}
                onUseTemplate={useTemplate}
                onDuplicateTemplate={duplicateTemplate}
                onExportTemplate={exportTemplate}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export with React.memo for performance optimization
export const ThemeManager = memo(ThemeManagerComponent)