'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { MediaFiltersProps } from './types'

export function MediaFilters({ 
  filters, 
  currentFolder, 
  folders, 
  onFiltersChange, 
  onFolderChange 
}: MediaFiltersProps) {
  return (
    <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                id="search"
                placeholder="Search media..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-10 rounded-lg"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="folder">Folder</Label>
            <Select 
              value={currentFolder} 
              onValueChange={onFolderChange}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/">Root</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder} value={folder}>
                    {folder.split('/').pop() || folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="type">File Type</Label>
            <Select 
              value={filters.mime_type} 
              onValueChange={(value) => onFiltersChange({ ...filters, mime_type: value })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="application/pdf">PDFs</SelectItem>
                <SelectItem value="text">Text files</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Filter by tags..."
              value={filters.tags}
              onChange={(e) => onFiltersChange({ ...filters, tags: e.target.value })}
              className="rounded-lg"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}