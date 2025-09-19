'use client'

import { useState } from 'react'
import { Image, Edit, Trash2, GripVertical, Upload, AlignLeft, AlignCenter, AlignRight, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ImageBlockProps {
  id: string
  content: {
    src: string
    alt: string
    caption?: string
  }
  styles: {
    width?: string
    height?: string
    objectFit?: 'cover' | 'contain' | 'fill'
    alignment?: 'left' | 'center' | 'right' | 'full'
    padding?: string
    margin?: string
  }
  isSelected: boolean
  isPreview: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
  onSelect: () => void
}

export function ImageBlock({
  id,
  content,
  styles,
  isSelected,
  isPreview,
  onUpdate,
  onDelete,
  onSelect
}: ImageBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editAlt, setEditAlt] = useState(content.alt)
  const [editCaption, setEditCaption] = useState(content.caption || '')
  const [showMediaBrowser, setShowMediaBrowser] = useState(false)

  const handleSave = () => {
    onUpdate({
      content: { 
        ...content, 
        alt: editAlt,
        caption: editCaption || undefined
      }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditAlt(content.alt)
    setEditCaption(content.caption || '')
    setIsEditing(false)
  }

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right' | 'full') => {
    onUpdate({
      styles: { ...styles, alignment }
    })
  }

  const getAlignmentClass = () => {
    switch (styles.alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'full': return 'w-full'
      default: return 'text-center'
    }
  }

  const getImageClass = () => {
    const baseClass = ' shadow-md'
    switch (styles.alignment) {
      case 'left': return `${baseClass} float-left mr-4 mb-4 max-w-sm`
      case 'right': return `${baseClass} float-right ml-4 mb-4 max-w-sm`
      case 'full': return `${baseClass} w-full`
      default: return `${baseClass} mx-auto block max-w-full`
    }
  }

  if (isPreview) {
    return (
      <div className={getAlignmentClass()}>
        {content.src ? (
          <>
            <img
              src={content.src}
              alt={content.alt}
              className={getImageClass()}
              style={{
                width: styles.width,
                height: styles.height,
                objectFit: styles.objectFit,
                borderRadius: 0
              }}
            />
            {content.caption && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic text-center">
                {content.caption}
              </p>
            )}
          </>
        ) : (
          <div className="bg-gray-200 dark:bg-gray-700 p-8 text-center">
            <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No image selected</p>
          </div>
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
          {/* Alignment controls */}
          <Button
            size="sm"
            variant={styles.alignment === 'left' ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              handleAlignmentChange('left')
            }}
          >
            <AlignLeft className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={styles.alignment === 'center' ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              handleAlignmentChange('center')
            }}
          >
            <AlignCenter className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={styles.alignment === 'right' ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              handleAlignmentChange('right')
            }}
          >
            <AlignRight className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={styles.alignment === 'full' ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              handleAlignmentChange('full')
            }}
          >
            <Maximize className="w-3 h-3" />
          </Button>

          <div className="w-px h-6 bg-gray-300" />

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setShowMediaBrowser(true)
            }}
          >
            <Upload className="w-3 h-3" />
          </Button>
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
      {content.src ? (
        <div className={getAlignmentClass()}>
          <img
            src={content.src}
            alt={content.alt}
            className={getImageClass()}
            style={{
              width: styles.width,
              height: styles.height,
              objectFit: styles.objectFit,
              borderRadius: 0
            }}
          />
          {content.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic text-center">
              {content.caption}
            </p>
          )}
        </div>
      ) : (
        <div
          className="bg-gray-200 dark:bg-gray-700 p-8 text-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setShowMediaBrowser(true)
          }}
        >
          <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Click to add image</p>
        </div>
      )}

      {/* Edit modal */}
      {isEditing && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10">
          <h4 className="font-medium mb-3">Edit Image</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Alt Text</label>
              <Input
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                placeholder="Describe the image..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Caption (optional)</label>
              <Input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Image caption..."
              />
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
          <Image className="w-3 h-3" />
          Image
        </div>
      </div>
    </div>
  )
}