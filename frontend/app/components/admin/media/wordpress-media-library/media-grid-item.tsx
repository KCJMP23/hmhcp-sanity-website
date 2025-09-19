'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  FileText,
  MoreVertical,
  Edit,
  Eye,
  Download,
  Trash2
} from 'lucide-react'
import type { MediaGridItemProps } from './types'

export function MediaGridItem({ 
  item, 
  isSelected, 
  onSelect, 
  onEdit 
}: MediaGridItemProps) {
  const itemType = item.mime_type.startsWith('image/') ? 'image' : 'file'

  return (
    <div className="relative group">
      <div 
        className={`
          aspect-square rounded-lg overflow-hidden cursor-pointer
          border-2 transition-all
          ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        `}
        onClick={() => onSelect(!isSelected)}
      >
        {itemType === 'image' ? (
          <img
            src={item.url}
            alt={item.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Selection checkbox */}
      <div className="absolute top-2 left-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(!!checked)}
          className="bg-white"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* File info */}
      <div className="mt-2">
        <p className="text-xs font-medium truncate">{item.filename}</p>
        <p className="text-xs text-gray-500">
          {item.dimensions ? `${item.dimensions.width}×${item.dimensions.height}` : 'File'}
        </p>
      </div>
    </div>
  )
}