'use client'

import { useState } from 'react'
import { Minus, Trash2, GripVertical, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SpacerBlockProps {
  id: string
  content: {
    height: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom'
    customHeight?: string
    showDivider?: boolean
    dividerStyle?: 'solid' | 'dashed' | 'dotted'
    dividerColor?: string
  }
  styles: {
    margin?: string
    backgroundColor?: string
  }
  isSelected: boolean
  isPreview: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
  onSelect: () => void
}

export function SpacerBlock({
  id,
  content,
  styles,
  isSelected,
  isPreview,
  onUpdate,
  onDelete,
  onSelect
}: SpacerBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editCustomHeight, setEditCustomHeight] = useState(content.customHeight || '50px')

  const handleSave = () => {
    onUpdate({
      content: {
        ...content,
        customHeight: editCustomHeight
      }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditCustomHeight(content.customHeight || '50px')
    setIsEditing(false)
  }

  const getHeightValue = () => {
    switch (content.height) {
      case 'xs': return '0.5rem' // 8px
      case 'sm': return '1rem'   // 16px
      case 'md': return '2rem'   // 32px
      case 'lg': return '4rem'   // 64px
      case 'xl': return '8rem'   // 128px
      case 'custom': return content.customHeight || '50px'
      default: return '2rem'
    }
  }

  const getHeightClass = () => {
    switch (content.height) {
      case 'xs': return 'h-2'
      case 'sm': return 'h-4'
      case 'md': return 'h-8'
      case 'lg': return 'h-16'
      case 'xl': return 'h-32'
      default: return ''
    }
  }

  const getDividerStyle = () => {
    if (!content.showDivider) return {}
    
    return {
      borderTop: `1px ${content.dividerStyle || 'solid'} ${content.dividerColor || '#e5e7eb'}`,
    }
  }

  if (isPreview) {
    return (
      <div
        className={cn(
          'w-full',
          content.height !== 'custom' && getHeightClass()
        )}
        style={{
          height: content.height === 'custom' ? getHeightValue() : undefined,
          margin: styles.margin,
          backgroundColor: styles.backgroundColor,
          ...getDividerStyle()
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        'relative group border-2 border-dashed border-transparent ',
        isSelected && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
      </div>

      {/* Block controls */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 shadow-sm">
          <Select
            value={content.height}
            onValueChange={(value: any) => onUpdate({
              content: { ...content, height: value }
            })}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xs">XS</SelectItem>
              <SelectItem value="sm">SM</SelectItem>
              <SelectItem value="md">MD</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
              <SelectItem value="xl">XL</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {content.height === 'custom' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          )}

          <div className="w-px h-6 bg-gray-300" />

          <Button
            size="sm"
            variant={content.showDivider ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({
                content: { ...content, showDivider: !content.showDivider }
              })
            }}
          >
            <Minus className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Spacer visualization */}
      <div className="p-4">
        <div
          className={cn(
            'w-full border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 ',
            'flex items-center justify-center relative',
            content.height !== 'custom' && getHeightClass()
          )}
          style={{
            height: content.height === 'custom' ? getHeightValue() : undefined,
            backgroundColor: styles.backgroundColor,
            ...getDividerStyle()
          }}
        >
          {/* Height indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1">
              {content.height === 'custom' ? getHeightValue() : content.height.toUpperCase()} Spacer
              {content.showDivider && ' + Divider'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {isEditing && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10">
          <h4 className="font-medium mb-3">Custom Height</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Height (CSS units)</label>
              <Input
                value={editCustomHeight}
                onChange={(e) => setEditCustomHeight(e.target.value)}
                placeholder="50px, 2rem, 10vh, etc..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: 50px, 2rem, 5vh, 100px
              </p>
            </div>
            
            {content.showDivider && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Divider Style</label>
                  <Select
                    value={content.dividerStyle || 'solid'}
                    onValueChange={(value: any) => onUpdate({
                      content: { ...content, dividerStyle: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Divider Color</label>
                  <Input
                    type="color"
                    value={content.dividerColor || '#e5e7eb'}
                    onChange={(e) => onUpdate({
                      content: { ...content, dividerColor: e.target.value }
                    })}
                  />
                </div>
              </>
            )}
            
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Block type indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1">
          <Minus className="w-3 h-3" />
          Spacer
        </div>
      </div>
    </div>
  )
}