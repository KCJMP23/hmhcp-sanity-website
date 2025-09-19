'use client'

import { useState } from 'react'
import { MousePointer, Edit, Trash2, GripVertical, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ButtonBlockProps {
  id: string
  content: {
    text: string
    link: string
    style: 'primary' | 'secondary' | 'outline' | 'ghost'
    size: 'sm' | 'default' | 'lg'
    icon?: string
    openInNewTab: boolean
  }
  styles: {
    alignment?: 'left' | 'center' | 'right'
    width?: 'auto' | 'full' | 'custom'
    customWidth?: string
    padding?: string
    margin?: string
  }
  isSelected: boolean
  isPreview: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
  onSelect: () => void
}

export function ButtonBlock({
  id,
  content,
  styles,
  isSelected,
  isPreview,
  onUpdate,
  onDelete,
  onSelect
}: ButtonBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(content.text)
  const [editLink, setEditLink] = useState(content.link)

  const handleSave = () => {
    onUpdate({
      content: { 
        ...content, 
        text: editText,
        link: editLink
      }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(content.text)
    setEditLink(content.link)
    setIsEditing(false)
  }

  const getAlignmentClass = () => {
    switch (styles.alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      default: return 'text-center'
    }
  }

  const getButtonWidthClass = () => {
    switch (styles.width) {
      case 'full': return 'w-full'
      case 'custom': return ''
      default: return 'w-auto'
    }
  }

  const getButtonSize = () => {
    switch (content.size) {
      case 'sm': return 'px-3 py-1.5 text-sm'
      case 'lg': return 'px-6 py-3 text-lg'
      default: return 'px-4 py-2'
    }
  }

  const getButtonStyle = () => {
    const baseClass = ' font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    switch (content.style) {
      case 'primary':
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`
      case 'secondary':
        return `${baseClass} bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500`
      case 'outline':
        return `${baseClass} border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800`
      case 'ghost':
        return `${baseClass} text-gray-700 hover:bg-gray-100 focus:ring-blue-500 dark:text-gray-200 dark:hover:bg-gray-800`
      default:
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`
    }
  }

  if (isPreview) {
    return (
      <div 
        className={getAlignmentClass()}
        style={{ padding: styles.padding, margin: styles.margin }}
      >
        {content.link ? (
          <a
            href={content.link}
            target={content.openInNewTab ? '_blank' : '_self'}
            rel={content.openInNewTab ? 'noopener noreferrer' : undefined}
            className={cn(
              'inline-flex items-center gap-2',
              getButtonStyle(),
              getButtonSize(),
              getButtonWidthClass()
            )}
            style={styles.width === 'custom' ? { width: styles.customWidth } : undefined}
          >
            {content.text}
            {content.openInNewTab && <ExternalLink className="w-4 h-4" />}
          </a>
        ) : (
          <button
            className={cn(
              'inline-flex items-center gap-2',
              getButtonStyle(),
              getButtonSize(),
              getButtonWidthClass()
            )}
            style={styles.width === 'custom' ? { width: styles.customWidth } : undefined}
          >
            {content.text}
          </button>
        )}
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
          <Select
            value={content.style}
            onValueChange={(value: any) => onUpdate({
              content: { ...content, style: value }
            })}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={content.size}
            onValueChange={(value: any) => onUpdate({
              content: { ...content, size: value }
            })}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">SM</SelectItem>
              <SelectItem value="default">MD</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
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
      <div className={getAlignmentClass()}>
        <button
          className={cn(
            'inline-flex items-center gap-2 cursor-pointer',
            getButtonStyle(),
            getButtonSize(),
            getButtonWidthClass()
          )}
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          style={styles.width === 'custom' ? { width: styles.customWidth } : undefined}
        >
          {content.text || 'Click me'}
          {content.openInNewTab && <ExternalLink className="w-4 h-4" />}
        </button>
      </div>

      {/* Edit modal */}
      {isEditing && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10">
          <h4 className="font-medium mb-3">Edit Button</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Button Text</label>
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Enter button text..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Link URL</label>
              <Input
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="openInNewTab"
                checked={content.openInNewTab}
                onChange={(e) => onUpdate({
                  content: { ...content, openInNewTab: e.target.checked }
                })}
              />
              <label htmlFor="openInNewTab" className="text-sm">
                Open in new tab
              </label>
            </div>
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
          <MousePointer className="w-3 h-3" />
          Button
        </div>
      </div>
    </div>
  )
}