'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Monitor,
  Tablet,
  Smartphone,
  Package,
  Download
} from 'lucide-react'
import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TemplatePreviewProps } from './types'
import { PREVIEW_CLASSES } from './types'

export function TemplatePreview({
  selectedTemplate,
  previewMode,
  onPreviewModeChange,
  onTemplateUpdate,
  onUseTemplate,
  onDuplicateTemplate,
  onExportTemplate
}: TemplatePreviewProps) {
  if (!selectedTemplate) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-gray-500">Select a template to preview</p>
        </CardContent>
      </Card>
    )
  }

  const updateTemplateVariable = (key: string, value: string) => {
    const updatedTemplate = {
      ...selectedTemplate,
      variables: {
        ...selectedTemplate.variables,
        [key]: value
      }
    }
    onTemplateUpdate(updatedTemplate)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{selectedTemplate.name}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPreviewModeChange('desktop')}
              className={cn(
                "rounded-lg",
                previewMode === 'desktop' && "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPreviewModeChange('tablet')}
              className={cn(
                "rounded-lg",
                previewMode === 'tablet' && "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPreviewModeChange('mobile')}
              className={cn(
                "rounded-lg",
                previewMode === 'mobile' && "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview">
          <TabsList className="mb-4 rounded-lg">
            <TabsTrigger value="preview" className="rounded-md">Preview</TabsTrigger>
            <TabsTrigger value="code" className="rounded-md">Code</TabsTrigger>
            <TabsTrigger value="variables" className="rounded-md">Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <div className={cn(
              "border rounded-lg p-4 bg-white dark:bg-gray-900 min-h-[400px]",
              PREVIEW_CLASSES[previewMode]
            )}>
              <div dangerouslySetInnerHTML={{ 
                __html: selectedTemplate.content.replace(
                  /\{\{(\w+)\}\}/g,
                  (match, key) => selectedTemplate.variables[key] || match
                )
              }} />
            </div>
          </TabsContent>

          <TabsContent value="code">
            <Textarea
              className="font-mono text-sm rounded-lg"
              rows={15}
              value={selectedTemplate.content}
              readOnly
            />
          </TabsContent>

          <TabsContent value="variables">
            <div className="space-y-4">
              {Object.entries(selectedTemplate.variables).map(([key, value]) => (
                <div key={key}>
                  <Label>{key}</Label>
                  <Input
                    value={Array.isArray(value) ? value.join(', ') : value}
                    onChange={(e) => {
                      const newValue = Array.isArray(value) 
                        ? e.target.value.split(',').map(v => v.trim())
                        : e.target.value
                      updateTemplateVariable(key, Array.isArray(newValue) ? newValue.join(', ') : newValue)
                    }}
                    className="mt-1 rounded-lg"
                    placeholder={Array.isArray(value) ? 'Comma-separated values' : 'Enter value'}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button 
            className="flex-1 rounded-full" 
            onClick={() => onUseTemplate(selectedTemplate)}
          >
            <Package className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Button 
            variant="outline" 
            className="rounded-full"
            onClick={() => onDuplicateTemplate(selectedTemplate)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button 
            variant="outline" 
            className="rounded-full"
            onClick={() => onExportTemplate(selectedTemplate)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}