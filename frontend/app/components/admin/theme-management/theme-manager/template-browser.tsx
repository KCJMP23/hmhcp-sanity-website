'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TemplateBrowserProps } from './types'
import { TEMPLATE_CATEGORIES } from './types'

export function TemplateBrowser({
  templates,
  selectedTemplate,
  onTemplateSelect
}: TemplateBrowserProps) {
  return (
    <div className="space-y-4">
      {/* Template Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {TEMPLATE_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant="ghost"
                className="w-full justify-start rounded-full"
                onClick={() => {
                  const template = templates.find(t => t.category === category)
                  if (template) onTemplateSelect(template)
                }}
              >
                <Layers className="h-4 w-4 mr-2" />
                {category}
                <Badge variant="secondary" className="ml-auto rounded-md">
                  {templates.filter(t => t.category === category).length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedTemplate?.id === template.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => onTemplateSelect(template)}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.description}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs rounded-md">
                      {template.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs rounded-md">
                      {template.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}