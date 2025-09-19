'use client'

import { useState } from 'react'
import { Type, Edit, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface TextBlockProps {
  id: string
  content: {
    text: string
    format?: 'paragraph' | 'quote' | 'code'
  }
  styles: {
    fontSize?: string
    fontWeight?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    padding?: string
    margin?: string
  }
  isSelected: boolean
  isPreview: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
  onSelect: () => void
}

export function TextBlock({
  id,
  content,
  styles,
  isSelected,
  isPreview,
  onUpdate,
  onDelete,
  onSelect
}: TextBlockProps) {
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

  const getFormatStyles = () => {
    switch (content.format) {
      case 'quote':
        return 'border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400'
      case 'code':
        return 'bg-gray-100 dark:bg-gray-800  p-3 font-mono text-sm'
      default:
        return ''
    }
  }

  if (isPreview) {
    return (
      <div
        className={cn('relative', getFormatStyles())}
        style={{
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          color: styles.color,
          textAlign: styles.textAlign,
          padding: styles.padding,
          margin: styles.margin
        }}
      >
        {content.text.split('\n').map((line, index) => (
          <p key={index} className={index > 0 ? 'mt-2' : ''}>
            {line}
          </p>
        ))}
      </div>
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
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter your text..."
            className="min-h-[100px]"
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
        <div
          className={cn('cursor-text', getFormatStyles())}
          style={{
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            color: styles.color,
            textAlign: styles.textAlign
          }}
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
        >
          {content.text || (
            <span className="text-gray-400">Click to add text...</span>
          )}
        </div>
      )}

      {/* Block type indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1">
          <Type className="w-3 h-3" />
          Text
        </div>
      </div>
    </div>
  )
}