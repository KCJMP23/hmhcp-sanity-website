'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Upload,
  Check,
  Moon,
  Sun,
  Download,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Copy } from 'lucide-react'
import type { ThemeListProps } from './types'

export function ThemeList({
  themes,
  activeTheme,
  onThemeSelect,
  onImportTheme,
  onApplyTheme,
  onDuplicateTheme,
  onExportTheme,
  onDeleteTheme
}: ThemeListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Available Themes</h3>
        <label htmlFor="theme-upload" className="cursor-pointer">
          <Button variant="outline" size="sm" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </span>
          </Button>
          <input
            id="theme-upload"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImportTheme(file)
            }}
          />
        </label>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-3">
          {themes.map((theme) => (
            <Card
              key={theme.id}
              className={cn(
                "cursor-pointer transition-all",
                theme.isActive && "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
              )}
              onClick={() => onThemeSelect(theme)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {theme.name}
                      {theme.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {theme.description}
                    </CardDescription>
                  </div>
                  {theme.isDark ? (
                    <Moon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>v{theme.version}</span>
                  <span>•</span>
                  <span>{theme.author}</span>
                </div>
                
                {/* Color Preview */}
                <div className="flex gap-1 mt-3">
                  {Object.entries(theme.colors).slice(0, 5).map(([key, color]) => (
                    <div
                      key={key}
                      className="w-6 h-6 rounded-md border border-gray-200"
                      style={{ backgroundColor: color }}
                      title={key}
                    />
                  ))}
                </div>

                {theme === activeTheme && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        onApplyTheme(theme)
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicateTheme(theme)
                      }}
                      className="rounded-lg"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onExportTheme(theme)
                      }}
                      className="rounded-lg"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {!theme.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTheme(theme.id)
                        }}
                        className="rounded-lg"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}