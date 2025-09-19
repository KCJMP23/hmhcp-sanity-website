'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Download, Plus } from 'lucide-react'
import { PUBLICATION_TYPES, PUBLICATION_STATUS, RESEARCH_AREAS } from './types'

interface PublicationFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterType: string
  setFilterType: (type: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  filterArea: string
  setFilterArea: (area: string) => void
  onAddNew: () => void
  onExport: () => void
}

export function PublicationFilters({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterArea,
  setFilterArea,
  onAddNew,
  onExport
}: PublicationFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Publication Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PUBLICATION_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {PUBLICATION_STATUS.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Research Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {RESEARCH_AREAS.map(area => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button onClick={onAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Publication
        </Button>
      </div>
    </div>
  )
}