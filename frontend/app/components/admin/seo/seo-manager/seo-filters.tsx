'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Zap, Plus, Loader2 } from 'lucide-react'
import type { SEOFilters } from './types'

interface SEOFiltersProps {
  filters: SEOFilters
  onFiltersChange: (filters: SEOFilters) => void
  selectedCount: number
  onBulkAnalysis: () => void
  onAddNew: () => void
  analyzing: string | null
}

export function SEOFiltersComponent({
  filters,
  onFiltersChange,
  selectedCount,
  onBulkAnalysis,
  onAddNew,
  analyzing
}: SEOFiltersProps) {
  const updateFilter = (key: keyof SEOFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <>
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display text-gray-900 dark:text-white tracking-tight">
            SEO Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Optimize your content for search engines and social media
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={onBulkAnalysis}
            disabled={selectedCount === 0 || analyzing === 'bulk'}
            className="bg-green-600 hover:bg-blue-700 text-white rounded-full"
          >
            {analyzing === 'bulk' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Analyze Selected
          </Button>
          <Button
            onClick={onAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add SEO Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-text">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search pages..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="score_range">SEO Score</Label>
              <Select 
                value={filters.score_range} 
                onValueChange={(value) => updateFilter('score_range', value)}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="All scores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All scores</SelectItem>
                  <SelectItem value="excellent">Excellent (90-100)</SelectItem>
                  <SelectItem value="good">Good (70-89)</SelectItem>
                  <SelectItem value="fair">Fair (50-69)</SelectItem>
                  <SelectItem value="poor">Poor (0-49)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => onFiltersChange({ search: '', score_range: '', content_type: '' })}
                className="rounded-lg"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <Card className="rounded-2xl border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-text text-blue-700 dark:text-blue-300">
                {selectedCount} items selected
              </span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onBulkAnalysis}
                  disabled={analyzing === 'bulk'}
                  className="rounded-full"
                >
                  {analyzing === 'bulk' ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 mr-1" />
                  )}
                  Analyze All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}