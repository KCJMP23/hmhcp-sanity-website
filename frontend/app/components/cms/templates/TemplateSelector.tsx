'use client'

import { useState, useEffect } from 'react'
import { Search, Grid, List, Star, Clock, User, Eye, FileText, Image, Layout, Newspaper, ShoppingBag, TrendingUp, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useCMSAuth } from '@/features/cms-auth/hooks/useCMSAuth'
import { cn } from '@/lib/utils'
import { TemplateService } from '@/services/cms/templateService'
import type { CMSTemplate } from '@/types/cms-content'
import { logger } from '@/lib/logger';

interface TemplateSelectorProps {
  onSelectTemplate: (template: CMSTemplate | null) => void
  onCancel?: () => void
  className?: string
}

const TEMPLATE_ICONS = {
  general: FileText,
  blog: Newspaper,
  landing: Layout,
  product: ShoppingBag,
  'case-study': TrendingUp
}

export function TemplateSelector({ onSelectTemplate, onCancel, className }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<CMSTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<CMSTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = await TemplateService.getTemplates()
      setTemplates(data)
    } catch (error) {
      logger.error('Error fetching templates:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || template.templateType === selectedType
    return matchesSearch && matchesType
  })

  const handleSelectTemplate = (template: CMSTemplate) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
  }

  const handleConfirmSelection = () => {
    onSelectTemplate(selectedTemplate)
    setPreviewOpen(false)
  }

  const handleStartBlank = () => {
    onSelectTemplate(null)
  }

  const getTemplateTypes = () => {
    const types = new Set(templates.map(t => t.templateType || 'general'))
    return Array.from(types)
  }

  const renderTemplateCard = (template: CMSTemplate) => {
    const Icon = TEMPLATE_ICONS[template.templateType as keyof typeof TEMPLATE_ICONS] || FileText
    
    return (
      <Card
        key={template.id}
        className={cn(
          "group relative cursor-pointer transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02]",
          "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        )}
        onClick={() => handleSelectTemplate(template)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <Icon className="h-8 w-8 text-primary" />
            {template.usageCount && template.usageCount > 10 && (
              <Badge variant="secondary" className="text-xs">
                Popular
              </Badge>
            )}
          </div>
          <CardTitle>{template.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="capitalize">
              {template.templateType}
            </Badge>
            {template.usageCount && template.usageCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {template.usageCount} uses
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTemplateList = (template: CMSTemplate) => {
    const Icon = TEMPLATE_ICONS[template.templateType as keyof typeof TEMPLATE_ICONS] || FileText
    
    return (
      <Card
        key={template.id}
        className={cn(
          "group cursor-pointer transition-all duration-300",
          "hover:shadow-md"
        )}
        onClick={() => handleSelectTemplate(template)}
      >
        <div className="p-4 flex items-center gap-4">
          <Icon className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">
                {template.name}
              </h3>
              <div className="flex items-center gap-2">
                {template.usageCount && template.usageCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {template.usageCount} uses
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {template.description}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Choose a Template</h2>
            <p className="text-muted-foreground mt-1">
              Start with a pre-designed template or create from scratch
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <div className="flex items-center gap-1 bg-muted p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {getTemplateTypes().map(type => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type.replace('-', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Blank Template Option */}
        <Card className="cursor-pointer border-dashed hover:border-primary transition-colors"
          onClick={handleStartBlank}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Start from Scratch
            </CardTitle>
            <CardDescription>
              Create your content with a blank canvas
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found matching your criteria</p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
          )}>
            {filteredTemplates.map(template => 
              viewMode === 'grid' 
                ? renderTemplateCard(template)
                : renderTemplateList(template)
            )}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Review this template before using it for your content
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="border p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>

              {selectedTemplate.metadata && (
                <div className="border p-4">
                  <h4 className="font-medium mb-2">Default Settings</h4>
                  <div className="space-y-2 text-sm">
                    {selectedTemplate.metadata.categoryId && (
                      <div>
                        <span className="font-medium">Category:</span> Pre-selected
                      </div>
                    )}
                    {selectedTemplate.metadata.tags && selectedTemplate.metadata.tags.length > 0 && (
                      <div>
                        <span className="font-medium">Tags:</span>{' '}
                        {selectedTemplate.metadata.tags.join(', ')}
                      </div>
                    )}
                    {selectedTemplate.metadata.ogType && (
                      <div>
                        <span className="font-medium">Open Graph Type:</span>{' '}
                        {selectedTemplate.metadata.ogType}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border p-4">
                <h4 className="font-medium mb-2">Template Statistics</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Created {new Date(selectedTemplate.createdAt!).toLocaleDateString()}</span>
                  </div>
                  {selectedTemplate.usageCount && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>Used {selectedTemplate.usageCount} times</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmSelection}>
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}