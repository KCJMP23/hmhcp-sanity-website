'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  GripVertical,
  Trash2,
  Settings,
  Home,
  FileText,
  Hash,
  FolderOpen,
  Link,
  ExternalLink
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SortableMenuItemProps, MenuItem } from './types'

export function SortableMenuItem({ 
  item, 
  onUpdate, 
  onDelete,
  depth = 0 
}: SortableMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getIcon = () => {
    switch (item.type) {
      case 'home': return <Home className="h-4 w-4" />
      case 'page': return <FileText className="h-4 w-4" />
      case 'post': return <Hash className="h-4 w-4" />
      case 'category': return <FolderOpen className="h-4 w-4" />
      case 'custom': return item.target === '_blank' ? <ExternalLink className="h-4 w-4" /> : <Link className="h-4 w-4" />
      default: return <Link className="h-4 w-4" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`ml-${depth * 8}`}
    >
      <div className="group bg-white border rounded-lg p-3 hover:shadow-sm">
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>

          {getIcon()}

          <div className="flex-1">
            <input
              type="text"
              value={item.label}
              onChange={(e) => onUpdate(item.id, { label: e.target.value })}
              className="font-medium text-sm w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
            />
            <input
              type="text"
              value={item.url}
              onChange={(e) => onUpdate(item.id, { url: e.target.value })}
              className="text-xs text-gray-500 w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 mt-1"
            />
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="opacity-0 group-hover:opacity-100"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <div>
              <Label className="text-xs">CSS Classes</Label>
              <Input
                value={item.cssClasses || ''}
                onChange={(e) => onUpdate(item.id, { cssClasses: e.target.value })}
                placeholder="custom-class"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={item.description || ''}
                onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                placeholder="Navigation label description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={item.target === '_blank'}
                onCheckedChange={(checked) => 
                  onUpdate(item.id, { target: checked ? '_blank' : '_self' })
                }
              />
              <Label className="text-xs">Open in new tab</Label>
            </div>
          </div>
        )}
      </div>

      {item.children && item.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {item.children.map(child => (
            <SortableMenuItem
              key={child.id}
              item={child}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}