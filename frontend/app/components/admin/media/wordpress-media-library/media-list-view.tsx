'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Edit } from 'lucide-react'
import type { MediaListViewProps } from './types'
import { formatFileSize } from './types'

export function MediaListView({ 
  items, 
  selectedItems, 
  onSelect, 
  onEdit 
}: MediaListViewProps) {
  return (
    <div className="w-full overflow-x-auto"><table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="w-10 p-2">
            <Checkbox
              checked={selectedItems.length === items.length}
              onCheckedChange={(checked) => 
                onSelect(checked ? items.map(i => i.id) : [])
              }
            />
          </th>
          <th className="text-left p-2">File</th>
          <th className="text-left p-2">Author</th>
          <th className="text-left p-2">Uploaded</th>
          <th className="text-left p-2">File size</th>
          <th className="w-10 p-2"></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b hover:bg-gray-50">
            <td className="p-2">
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onCheckedChange={(checked) => {
                  onSelect(
                    checked 
                      ? [...selectedItems, item.id]
                      : selectedItems.filter(id => id !== item.id)
                  )
                }}
              />
            </td>
            <td className="p-2">
              <div className="flex items-center gap-3">
                {item.mime_type.startsWith('image/') ? (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{item.filename}</p>
                  <p className="text-sm text-gray-500">
                    {item.metadata?.altText || 'No description'}
                  </p>
                </div>
              </div>
            </td>
            <td className="p-2 text-sm">{item.uploaded_by}</td>
            <td className="p-2 text-sm">
              {new Date(item.created_at).toLocaleDateString()}
            </td>
            <td className="p-2 text-sm">{formatFileSize(item.size)}</td>
            <td className="p-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table></div>
  )
}