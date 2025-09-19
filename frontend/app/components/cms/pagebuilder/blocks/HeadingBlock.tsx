'use client'

import React, { useState } from 'react'
import { Heading, Edit, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface HeadingBlockProps {
  id: string
  content: {
    text: string
    level: 1 | 2 | 3 | 4 | 5 | 6
  }
  styles: {
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    padding?: string
    margin?: string
  }
  isSelected: boolean
  isPreview: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
  onSelect: () => void
}

export function HeadingBlock({
  id,
  content,
  styles,
  isSelected,
  isPreview,
  onUpdate,
  onDelete,
  onSelect
}: HeadingBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(content.text)

  const handleSave = () => {
    onUpdate({
      content: { ...content, text: editText }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(content.text)
    setIsEditing(false)
  }

  const handleLevelChange = (level: string) => {
    onUpdate({
      content: { ...content, level: parseInt(level) as 1 | 2 | 3 | 4 | 5 | 6 }
    })
  }

  const getHeadingClass = () => {
    switch (content.level) {
      case 1: return 'text-4xl font-bold'
      case 2: return 'text-3xl font-bold'
      case 3: return 'text-2xl font-semibold'
      case 4: return 'text-xl font-semibold'
      case 5: return 'text-lg font-medium'
      case 6: return 'text-base font-medium'
      default: return 'text-2xl font-semibold'
    }
  }

  const HeadingTag = `h${content.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  if (isPreview) {
    return React.createElement(
      HeadingTag,
      {
        className: cn(getHeadingClass()),
        style: {
          color: styles.color,
          textAlign: styles.textAlign,
          padding: styles.padding,
          margin: styles.margin
        }
      },
      content.text
    )
  }

  return (
    <div
      className={cn(
        'relative group border-2 border-dashed border-transparent  p-4',
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
            value={content.level.toString()}
            onValueChange={handleLevelChange}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
              <SelectItem value="4">H4</SelectItem>
              <SelectItem value="5">H5</SelectItem>
              <SelectItem value="6">H6</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <Edit className="w-3 h-3" />
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

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter heading text..."
            className={getHeadingClass()}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        React.createElement(
          HeadingTag,
          {
            className: cn('cursor-text', getHeadingClass()),
            style: {
              color: styles.color,
              textAlign: styles.textAlign
            },
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation()
              setIsEditing(true)
            }
          },
          content.text || React.createElement('span', { className: 'text-gray-400' }, 'Click to add heading...')
        )
      )}

      {/* Block type indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1">
          <Heading className="w-3 h-3" />
          H{content.level}
        </div>
      </div>
    </div>
  )
}