'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Code } from 'lucide-react'
import type { ThemeEditorProps } from './types'

export function ThemeEditor({
  activeTheme,
  isEditing,
  showCode,
  onToggleEditing,
  onToggleCode,
  onThemeUpdate
}: ThemeEditorProps) {
  if (!activeTheme) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-gray-500">Select a theme to edit</p>
        </CardContent>
      </Card>
    )
  }

  const updateThemeProperty = (path: string[], value: any) => {
    const updatedTheme = { ...activeTheme }
    let current = updatedTheme as any
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    
    onThemeUpdate(updatedTheme)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Theme Editor: {activeTheme.name}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCode}
              className="rounded-full"
            >
              <Code className="h-4 w-4 mr-2" />
              {showCode ? 'Visual' : 'Code'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEditing}
              className="rounded-full"
            >
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showCode ? (
          <Textarea
            className="font-mono text-sm rounded-lg"
            rows={20}
            value={JSON.stringify(activeTheme, null, 2)}
            readOnly={!isEditing}
            onChange={(e) => {
              if (isEditing) {
                try {
                  const parsed = JSON.parse(e.target.value)
                  onThemeUpdate(parsed)
                } catch {
                  // Invalid JSON, don't update
                }
              }
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Theme Info */}
            <div>
              <h4 className="font-medium mb-3">Theme Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Theme Name</Label>
                  <Input
                    value={activeTheme.name}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                    onChange={(e) => updateThemeProperty(['name'], e.target.value)}
                  />
                </div>
                <div>
                  <Label>Version</Label>
                  <Input
                    value={activeTheme.version}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                    onChange={(e) => updateThemeProperty(['version'], e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={activeTheme.description}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                    onChange={(e) => updateThemeProperty(['description'], e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="font-medium mb-3">Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(activeTheme.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="capitalize w-24">{key}</Label>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="color"
                        value={value}
                        disabled={!isEditing}
                        className="w-12 h-8 p-1 rounded-lg"
                        onChange={(e) => updateThemeProperty(['colors', key], e.target.value)}
                      />
                      <Input
                        type="text"
                        value={value}
                        disabled={!isEditing}
                        className="flex-1 rounded-lg"
                        onChange={(e) => updateThemeProperty(['colors', key], e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="font-medium mb-3">Typography</h4>
              <div className="space-y-3">
                <div>
                  <Label>Font Family</Label>
                  <Input
                    value={activeTheme.typography.fontFamily}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                    onChange={(e) => updateThemeProperty(['typography', 'fontFamily'], e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Font Size</Label>
                    <Input
                      value={activeTheme.typography.fontSize.base}
                      disabled={!isEditing}
                      className="mt-1 rounded-lg"
                      onChange={(e) => updateThemeProperty(['typography', 'fontSize', 'base'], e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Heading Font Size</Label>
                    <Input
                      value={activeTheme.typography.fontSize.heading}
                      disabled={!isEditing}
                      className="mt-1 rounded-lg"
                      onChange={(e) => updateThemeProperty(['typography', 'fontSize', 'heading'], e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Normal Weight</Label>
                    <Input
                      type="number"
                      value={activeTheme.typography.fontWeight.normal}
                      disabled={!isEditing}
                      className="mt-1 rounded-lg"
                      onChange={(e) => updateThemeProperty(['typography', 'fontWeight', 'normal'], parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Medium Weight</Label>
                    <Input
                      type="number"
                      value={activeTheme.typography.fontWeight.medium}
                      disabled={!isEditing}
                      className="mt-1 rounded-lg"
                      onChange={(e) => updateThemeProperty(['typography', 'fontWeight', 'medium'], parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Bold Weight</Label>
                    <Input
                      type="number"
                      value={activeTheme.typography.fontWeight.bold}
                      disabled={!isEditing}
                      className="mt-1 rounded-lg"
                      onChange={(e) => updateThemeProperty(['typography', 'fontWeight', 'bold'], parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="font-medium mb-3">Spacing & Radius</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Spacing Unit</Label>
                  <Input
                    value={activeTheme.spacing.unit}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                    onChange={(e) => updateThemeProperty(['spacing', 'unit'], e.target.value)}
                  />
                </div>
                <div>
                  <Label>Border Radius Base</Label>
                  <Input
                    value={activeTheme.borderRadius.base}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                    onChange={(e) => updateThemeProperty(['borderRadius', 'base'], e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Custom CSS */}
            <div>
              <h4 className="font-medium mb-3">Custom CSS</h4>
              <Textarea
                className="font-mono text-sm rounded-lg"
                rows={10}
                placeholder="/* Add custom CSS here */"
                value={activeTheme.customCSS || ''}
                disabled={!isEditing}
                onChange={(e) => updateThemeProperty(['customCSS'], e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}