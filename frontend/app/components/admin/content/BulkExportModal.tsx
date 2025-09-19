/**
 * Bulk Export Modal
 * Handles bulk export of content with format options and filtering
 */

import React, { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileCode,
  FileText,
  Filter,
  Settings,
  Calendar,
  Tag,
  User,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { AdminModal } from '../ui/modals/AdminModal'
import { AdminButton } from '../ui/forms/AdminButton'
import { AdminSelect } from '../ui/forms/AdminSelect'
import { AdminCheckbox } from '../ui/forms/AdminCheckbox'
import { AdminInput } from '../ui/forms/AdminInput'
import { AdminDatePicker } from '../ui/forms/AdminDatePicker'

interface ExportOptions {
  format: 'csv' | 'json' | 'xml' | 'xlsx'
  scope: 'selected' | 'filtered' | 'all'
  fields: string[]
  filters: {
    status?: string[]
    dateRange?: {
      from?: string
      to?: string
    }
    category?: string
    author?: string
    tags?: string[]
  }
  includeMetadata: boolean
  includeContent: boolean
  flattenStructure: boolean
}

interface BulkExportModalProps {
  open: boolean
  onClose: () => void
  contentType: 'pages' | 'posts' | 'services' | 'platforms' | 'team-members' | 'testimonials'
  selectedCount: number
  totalCount: number
}

const EXPORT_FORMATS = [
  {
    value: 'csv',
    label: 'CSV',
    icon: FileSpreadsheet,
    description: 'Comma-separated values - Excel compatible',
    maxSize: 1000000 // 1M rows
  },
  {
    value: 'xlsx',
    label: 'Excel (XLSX)',
    icon: FileSpreadsheet,
    description: 'Microsoft Excel format',
    maxSize: 100000 // 100k rows
  },
  {
    value: 'json',
    label: 'JSON',
    icon: FileJson,
    description: 'JavaScript Object Notation',
    maxSize: 500000 // 500k rows
  },
  {
    value: 'xml',
    label: 'XML',
    icon: FileCode,
    description: 'Extensible Markup Language',
    maxSize: 100000 // 100k rows
  }
]

const CONTENT_FIELDS = {
  pages: [
    { value: 'id', label: 'ID', required: true },
    { value: 'title', label: 'Title', required: true },
    { value: 'slug', label: 'Slug' },
    { value: 'content', label: 'Content' },
    { value: 'status', label: 'Status' },
    { value: 'seoTitle', label: 'SEO Title' },
    { value: 'seoDescription', label: 'SEO Description' },
    { value: 'publishedAt', label: 'Published Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'author', label: 'Author' }
  ],
  posts: [
    { value: 'id', label: 'ID', required: true },
    { value: 'title', label: 'Title', required: true },
    { value: 'slug', label: 'Slug' },
    { value: 'content', label: 'Content' },
    { value: 'excerpt', label: 'Excerpt' },
    { value: 'status', label: 'Status' },
    { value: 'category', label: 'Category' },
    { value: 'tags', label: 'Tags' },
    { value: 'author', label: 'Author' },
    { value: 'publishedAt', label: 'Published Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'seoTitle', label: 'SEO Title' },
    { value: 'seoDescription', label: 'SEO Description' }
  ],
  services: [
    { value: 'id', label: 'ID', required: true },
    { value: 'title', label: 'Title', required: true },
    { value: 'description', label: 'Description' },
    { value: 'slug', label: 'Slug' },
    { value: 'status', label: 'Status' },
    { value: 'category', label: 'Category' },
    { value: 'features', label: 'Features' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'publishedAt', label: 'Published Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ],
  platforms: [
    { value: 'id', label: 'ID', required: true },
    { value: 'title', label: 'Title', required: true },
    { value: 'description', label: 'Description' },
    { value: 'slug', label: 'Slug' },
    { value: 'status', label: 'Status' },
    { value: 'category', label: 'Category' },
    { value: 'features', label: 'Features' },
    { value: 'technologies', label: 'Technologies' },
    { value: 'publishedAt', label: 'Published Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ],
  'team-members': [
    { value: 'id', label: 'ID', required: true },
    { value: 'name', label: 'Name', required: true },
    { value: 'role', label: 'Role' },
    { value: 'department', label: 'Department' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'bio', label: 'Bio' },
    { value: 'skills', label: 'Skills' },
    { value: 'status', label: 'Status' },
    { value: 'joinedAt', label: 'Joined Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ],
  testimonials: [
    { value: 'id', label: 'ID', required: true },
    { value: 'content', label: 'Content', required: true },
    { value: 'author', label: 'Author' },
    { value: 'authorRole', label: 'Author Role' },
    { value: 'authorCompany', label: 'Author Company' },
    { value: 'rating', label: 'Rating' },
    { value: 'status', label: 'Status' },
    { value: 'publishedAt', label: 'Published Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ]
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
]

export function BulkExportModal({
  open,
  onClose,
  contentType,
  selectedCount,
  totalCount
}: BulkExportModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>(() => {
    const fields = CONTENT_FIELDS[contentType]
    return {
      format: 'csv',
      scope: selectedCount > 0 ? 'selected' : 'all',
      fields: fields.filter(f => f.required).map(f => f.value),
      filters: {},
      includeMetadata: true,
      includeContent: true,
      flattenStructure: false
    }
  })

  const availableFields = CONTENT_FIELDS[contentType]
  const selectedFormat = EXPORT_FORMATS.find(f => f.value === exportOptions.format)
  const estimatedCount = exportOptions.scope === 'selected' ? selectedCount : totalCount

  const handleFieldToggle = useCallback((field: string, checked: boolean) => {
    const fieldConfig = availableFields.find(f => f.value === field)
    if (fieldConfig?.required && !checked) return // Can't unselect required fields

    setExportOptions(prev => ({
      ...prev,
      fields: checked 
        ? [...prev.fields, field]
        : prev.fields.filter(f => f !== field)
    }))
  }, [availableFields])

  const handleSelectAllFields = useCallback(() => {
    setExportOptions(prev => ({
      ...prev,
      fields: availableFields.map(f => f.value)
    }))
  }, [availableFields])

  const handleSelectRequiredFields = useCallback(() => {
    setExportOptions(prev => ({
      ...prev,
      fields: availableFields.filter(f => f.required).map(f => f.value)
    }))
  }, [availableFields])

  const handleStatusFilterChange = useCallback((statuses: string[]) => {
    setExportOptions(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        status: statuses.length > 0 ? statuses : undefined
      }
    }))
  }, [])

  const handleDateRangeChange = useCallback((field: 'from' | 'to', value: string) => {
    setExportOptions(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        dateRange: {
          ...prev.filters.dateRange,
          [field]: value || undefined
        }
      }
    }))
  }, [])

  const handleExport = useCallback(async () => {
    if (exportOptions.fields.length === 0) return

    setIsExporting(true)

    try {
      // Build query parameters
      const params = new URLSearchParams({
        format: exportOptions.format,
        scope: exportOptions.scope,
        fields: exportOptions.fields.join(','),
        includeMetadata: exportOptions.includeMetadata.toString(),
        includeContent: exportOptions.includeContent.toString(),
        flattenStructure: exportOptions.flattenStructure.toString()
      })

      // Add filters
      if (exportOptions.filters.status?.length) {
        params.append('statusFilter', exportOptions.filters.status.join(','))
      }
      if (exportOptions.filters.dateRange?.from) {
        params.append('dateFrom', exportOptions.filters.dateRange.from)
      }
      if (exportOptions.filters.dateRange?.to) {
        params.append('dateTo', exportOptions.filters.dateRange.to)
      }
      if (exportOptions.filters.category) {
        params.append('categoryFilter', exportOptions.filters.category)
      }
      if (exportOptions.filters.author) {
        params.append('authorFilter', exportOptions.filters.author)
      }

      // Make export request
      const response = await fetch(`/api/admin/bulk/${contentType}/export?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const scopeLabel = exportOptions.scope === 'selected' ? 'selected' : 'all'
      a.download = `${contentType}-${scopeLabel}-${timestamp}.${exportOptions.format}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      // Show error notification
    } finally {
      setIsExporting(false)
    }
  }, [exportOptions, contentType, onClose])

  const isValidExport = useMemo(() => {
    return exportOptions.fields.length > 0 && 
           estimatedCount > 0 &&
           (!selectedFormat || estimatedCount <= selectedFormat.maxSize)
  }, [exportOptions.fields.length, estimatedCount, selectedFormat])

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Export Content"
      size="lg"
    >
      <div className="space-y-6">
        {/* Export Format */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Export Format</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {EXPORT_FORMATS.map(format => (
              <div
                key={format.value}
                onClick={() => setExportOptions(prev => ({ ...prev, format: format.value }))}
                className={cn(
                  'p-4 border rounded-lg cursor-pointer transition-colors',
                  exportOptions.format === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <format.icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{format.label}</div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedFormat && estimatedCount > selectedFormat.maxSize && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <X className="h-4 w-4" />
                <span className="text-sm">
                  Format limit exceeded: {estimatedCount.toLocaleString()} records (max: {selectedFormat.maxSize.toLocaleString()})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Export Scope */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Export Scope</h3>
          
          <div className="space-y-2">
            {selectedCount > 0 && (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="selected"
                  checked={exportOptions.scope === 'selected'}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    scope: e.target.value as any 
                  }))}
                />
                <span>Selected items ({selectedCount.toLocaleString()})</span>
              </label>
            )}
            
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                value="all"
                checked={exportOptions.scope === 'all'}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  scope: e.target.value as any 
                }))}
              />
              <span>All items ({totalCount.toLocaleString()})</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                value="filtered"
                checked={exportOptions.scope === 'filtered'}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  scope: e.target.value as any 
                }))}
              />
              <span>Filtered items (based on filters below)</span>
            </label>
          </div>
        </div>

        {/* Field Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Fields to Export</h3>
            <div className="flex gap-2">
              <AdminButton 
                variant="outline" 
                size="sm" 
                onClick={handleSelectRequiredFields}
              >
                Required Only
              </AdminButton>
              <AdminButton 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAllFields}
              >
                Select All
              </AdminButton>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {availableFields.map(field => (
              <AdminCheckbox
                key={field.value}
                checked={exportOptions.fields.includes(field.value)}
                onChange={(e) => handleFieldToggle(field.value, e.target.checked)}
                disabled={field.required}
                label={field.label}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Filters (for filtered scope) */}
        {exportOptions.scope === 'filtered' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map(status => (
                    <AdminCheckbox
                      key={status.value}
                      checked={exportOptions.filters.status?.includes(status.value) || false}
                      onChange={(e) => {
                        const current = exportOptions.filters.status || []
                        const updated = e.target.checked
                          ? [...current, status.value]
                          : current.filter(s => s !== status.value)
                        handleStatusFilterChange(updated)
                      }}
                      label={status.label}
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <div className="space-y-2">
                  <AdminDatePicker
                    placeholder="From date"
                    value={exportOptions.filters.dateRange?.from || ''}
                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                    size="sm"
                  />
                  <AdminDatePicker
                    placeholder="To date"
                    value={exportOptions.filters.dateRange?.to || ''}
                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                    size="sm"
                  />
                </div>
              </div>

              {/* Category Filter (for applicable content types) */}
              {['posts', 'services', 'platforms'].includes(contentType) && (
                <AdminInput
                  label="Category"
                  placeholder="Filter by category"
                  value={exportOptions.filters.category || ''}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, category: e.target.value || undefined }
                  }))}
                  size="sm"
                />
              )}

              {/* Author Filter (for applicable content types) */}
              {['posts', 'pages'].includes(contentType) && (
                <AdminInput
                  label="Author"
                  placeholder="Filter by author"
                  value={exportOptions.filters.author || ''}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, author: e.target.value || undefined }
                  }))}
                  size="sm"
                />
              )}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Options
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminCheckbox
              checked={exportOptions.includeMetadata}
              onChange={(e) => setExportOptions(prev => ({ 
                ...prev, 
                includeMetadata: e.target.checked 
              }))}
              label="Include Metadata"
              description="Export creation/update dates and author info"
              size="sm"
            />
            
            <AdminCheckbox
              checked={exportOptions.includeContent}
              onChange={(e) => setExportOptions(prev => ({ 
                ...prev, 
                includeContent: e.target.checked 
              }))}
              label="Include Full Content"
              description="Export full text content (may increase file size)"
              size="sm"
            />
            
            {['json', 'xml'].includes(exportOptions.format) && (
              <AdminCheckbox
                checked={exportOptions.flattenStructure}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  flattenStructure: e.target.checked 
                }))}
                label="Flatten Structure"
                description="Convert nested objects to flat key-value pairs"
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Export Summary */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium mb-2">Export Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Format: <span className="font-medium">{selectedFormat?.label}</span></div>
            <div>Records: <span className="font-medium">{estimatedCount.toLocaleString()}</span></div>
            <div>Fields: <span className="font-medium">{exportOptions.fields.length}</span></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <AdminButton variant="outline" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            onClick={handleExport}
            disabled={!isValidExport || isExporting}
            loading={isExporting}
            icon={Download}
          >
            Export
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  )
}