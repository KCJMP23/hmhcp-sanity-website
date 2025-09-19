'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { FiltersSectionProps } from './types'
import { TRIAL_STATUSES, PHASES } from './types'

export function FiltersSection({ filters, onFiltersChange }: FiltersSectionProps) {
  const updateFilter = (key: keyof typeof filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search Trials</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by title, ID, or sponsor..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {Object.entries(TRIAL_STATUSES).map(([key, status]) => (
                  <SelectItem key={key} value={key}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="phase">Phase</Label>
            <Select 
              value={filters.phase} 
              onValueChange={(value) => updateFilter('phase', value)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All phases</SelectItem>
                {PHASES.map(phase => (
                  <SelectItem key={phase.value} value={phase.value}>
                    {phase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}