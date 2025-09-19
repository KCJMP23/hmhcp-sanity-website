'use client'

import { useState } from 'react'
import { Columns, Edit, Trash2, GripVertical, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { TextBlock } from './TextBlock'
import { HeadingBlock } from './HeadingBlock'
import { ImageBlock } from './ImageBlock'
import { ButtonBlock } from './ButtonBlock'

interface Column {
  id: string
  blocks: any[]
  width: number // percentage of total width
}

interface ColumnsBlockProps {
  id: string
  content: {
    columns: Column[]
    gap: 'sm' | 'md' | 'lg'
  }
  styles: {
    padding?: string
    margin?: string
    backgroundColor?: string
  }
  isSelected: boolean
  isPreview: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
  onSelect: () => void
}

const BlockComponents = {
  text: TextBlock,
  heading: HeadingBlock,
  image: ImageBlock,
  button: ButtonBlock,
}

export function ColumnsBlock({
  id,
  content,
  styles,
  isSelected,
  isPreview,
  onUpdate,
  onDelete,
  onSelect
}: ColumnsBlockProps) {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      blocks: [],
      width: Math.floor(100 / (content.columns.length + 1))
    }
    
    // Recalculate existing column widths
    const updatedColumns = content.columns.map(col => ({
      ...col,
      width: Math.floor(100 / (content.columns.length + 1))
    }))
    
    onUpdate({
      content: {
        ...content,
        columns: [...updatedColumns, newColumn]
      }
    })
  }

  const handleRemoveColumn = (columnId: string) => {
    if (content.columns.length <= 1) return
    
    const updatedColumns = content.columns
      .filter(col => col.id !== columnId)
      .map(col => ({
        ...col,
        width: Math.floor(100 / (content.columns.length - 1))
      }))
    
    onUpdate({
      content: {
        ...content,
        columns: updatedColumns
      }
    })
  }

  const handleAddBlock = (columnId: string, blockType: string) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: blockType,
      content: getDefaultBlockContent(blockType),
      styles: {}
    }
    
    const updatedColumns = content.columns.map(col => 
      col.id === columnId 
        ? { ...col, blocks: [...col.blocks, newBlock] }
        : col
    )
    
    onUpdate({
      content: {
        ...content,
        columns: updatedColumns
      }
    })
  }

  const handleUpdateBlock = (columnId: string, blockId: string, updates: any) => {
    const updatedColumns = content.columns.map(col => 
      col.id === columnId 
        ? {
            ...col,
            blocks: col.blocks.map(block => 
              block.id === blockId ? { ...block, ...updates } : block
            )
          }
        : col
    )
    
    onUpdate({
      content: {
        ...content,
        columns: updatedColumns
      }
    })
  }

  const handleDeleteBlock = (columnId: string, blockId: string) => {
    const updatedColumns = content.columns.map(col => 
      col.id === columnId 
        ? { ...col, blocks: col.blocks.filter(block => block.id !== blockId) }
        : col
    )
    
    onUpdate({
      content: {
        ...content,
        columns: updatedColumns
      }
    })
  }

  const getDefaultBlockContent = (blockType: string) => {
    switch (blockType) {
      case 'text':
        return { text: '', format: 'paragraph' }
      case 'heading':
        return { text: '', level: 2 }
      case 'image':
        return { src: '', alt: '', caption: '' }
      case 'button':
        return { text: 'Click me', link: '', style: 'primary', size: 'default', openInNewTab: false }
      default:
        return {}
    }
  }

  const getGapClass = () => {
    switch (content.gap) {
      case 'sm': return 'gap-2'
      case 'lg': return 'gap-8'
      default: return 'gap-4'
    }
  }

  if (isPreview) {
    return (
      <div 
        className={cn('flex', getGapClass())}
        style={{
          padding: styles.padding,
          margin: styles.margin,
          backgroundColor: styles.backgroundColor,
          borderRadius: 0
        }}
      >
        {content.columns.map((column) => (
          <div 
            key={column.id} 
            className="flex-1"
            style={{ width: `${column.width}%` }}
          >
            {column.blocks.map((block) => {
              const BlockComponent = BlockComponents[block.type as keyof typeof BlockComponents]
              if (!BlockComponent) return null
              
              return (
                <BlockComponent
                  key={block.id}
                  {...block}
                  isSelected={false}
                  isPreview={true}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  onSelect={() => {}}
                />
              )
            })}
          </div>
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
          <Select
            value={content.gap}
            onValueChange={(value: any) => onUpdate({
              content: { ...content, gap: value }
            })}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">SM</SelectItem>
              <SelectItem value="md">MD</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              handleAddColumn()
            }}
            disabled={content.columns.length >= 4}
          >
            <Plus className="w-3 h-3" />
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

      {/* Columns content */}
      <div className={cn('flex', getGapClass())}>
        {content.columns.map((column) => (
          <div 
            key={column.id} 
            className={cn(
              'flex-1 min-h-[100px] border border-dashed border-gray-300 dark:border-gray-600  p-2',
              selectedColumn === column.id && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            )}
            style={{ width: `${column.width}%` }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedColumn(column.id)
            }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Column {column.width}%</span>
              <div className="flex gap-1">
                {content.columns.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveColumn(column.id)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Column blocks */}
            <div className="space-y-2">
              {column.blocks.map((block) => {
                const BlockComponent = BlockComponents[block.type as keyof typeof BlockComponents]
                if (!BlockComponent) return null
                
                return (
                  <BlockComponent
                    key={block.id}
                    {...block}
                    isSelected={selectedBlock === block.id}
                    isPreview={false}
                    onUpdate={(updates: any) => handleUpdateBlock(column.id, block.id, updates)}
                    onDelete={() => handleDeleteBlock(column.id, block.id)}
                    onSelect={() => setSelectedBlock(block.id)}
                  />
                )
              })}
              
              {/* Add block button */}
              {selectedColumn === column.id && (
                <div className="flex gap-1 flex-wrap">
                  {Object.keys(BlockComponents).map((blockType) => (
                    <Button
                      key={blockType}
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddBlock(column.id, blockType)
                      }}
                      className="text-xs h-6"
                    >
                      + {blockType}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Block type indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1">
          <Columns className="w-3 h-3" />
          Columns
        </div>
      </div>
    </div>
  )
}