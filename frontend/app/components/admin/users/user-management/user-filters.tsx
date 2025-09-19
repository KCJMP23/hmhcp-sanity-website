'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Download, Plus, Upload } from 'lucide-react'
import type { UserFilters } from './types'
import { USER_ROLES, DEPARTMENTS } from './types'

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onAddNew: () => void
  onExport: () => void
  onImport: () => void
  selectedCount: number
  onBulkAction: (action: string) => void
}

export function UserFiltersComponent({
  filters,
  onFiltersChange,
  onAddNew,
  onExport,
  onImport,
  selectedCount,
  onBulkAction
}: UserFiltersProps) {
  const updateFilter = (key: keyof UserFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="space-y-4">
      {/* Search and Primary Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-8 rounded-lg"
            />
          </div>
          
          <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
            <SelectTrigger className="w-[150px] rounded-lg">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {USER_ROLES.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.department} onValueChange={(value) => updateFilter('department', value)}>
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="w-[140px] rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onImport} className="rounded-full">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={onExport} className="rounded-full">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={onAddNew} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-full border">
          <span className="text-sm text-blue-700">
            {selectedCount} user{selectedCount === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('activate')}
              className="rounded-md"
            >
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('deactivate')}
              className="rounded-md"
            >
              Deactivate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('resend_welcome')}
              className="rounded-md"
            >
              Resend Welcome
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkAction('delete')}
              className="rounded-md"
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}