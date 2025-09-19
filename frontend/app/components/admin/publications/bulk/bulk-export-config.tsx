/**
 * Bulk Export Config Component - Story 3.7c Task 4
 * Configuration interface for bulk export operations
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  FileText, 
  Database, 
  Archive,
  Settings,
  Play,
  Pause,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { 
  BulkExportRequest, 
  ExportFormat,
  ExportProgress 
} from '@/types/publications'
import { useBulkExport } from '@/hooks/use-bulk-export'
import { cn } from '@/lib/utils'

interface BulkExportConfigProps {
  selectedPublications: string[]
  onExportComplete?: (progress: ExportProgress) => void
  className?: string
}

const EXPORT_FORMATS: { value: ExportFormat; label: string; icon: any; description: string }[] = [
  { value: 'csv', label: 'CSV', icon: FileText, description: 'Spreadsheet format' },
  { value: 'json', label: 'JSON', icon: Database, description: 'Structured data' },
  { value: 'bibtex', label: 'BibTeX', icon: FileText, description: 'LaTeX bibliography' },
  { value: 'ris', label: 'RIS', icon: FileText, description: 'Reference manager' },
  { value: 'citations-apa', label: 'APA Citations', icon: FileText, description: 'APA formatted' },
  { value: 'citations-mla', label: 'MLA Citations', icon: FileText, description: 'MLA formatted' }
]

export function BulkExportConfig({ 
  selectedPublications, 
  onExportComplete,
  className 
}: BulkExportConfigProps) {
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['csv'])
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    publicationType: '',
    status: 'published' as const
  })
  const [options, setOptions] = useState({
    includeAbstracts: true,
    includePdfUrls: false,
    includeMetadata: true,
    groupByYear: false,
    sortBy: 'title' as const,
    sortOrder: 'asc' as const
  })
  const [exportOptions, setExportOptions] = useState({
    filename: `publications_export_${new Date().toISOString().split('T')[0]}`,
    includeMetadata: true,
    separateByFormat: true,
    compression: 'zip' as const
  })

  const {
    startExport,
    cancelExport,
    downloadExport,
    currentProgress,
    isExporting,
    getProgressPercentage,
    getRemainingTime,
    canCancel,
    canDownload,
    formatTimeEstimate,
    formatFileSize
  } = useBulkExport({
    onExportComplete
  })

  const handleFormatToggle = (format: ExportFormat) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    )
  }

  const handleStartExport = async () => {
    if (selectedFormats.length === 0) return

    const request: BulkExportRequest = {
      publicationIds: selectedPublications,
      formats: selectedFormats,
      filters: {
        ...filters,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        publicationType: filters.publicationType || undefined
      },
      options,
      exportOptions
    }

    await startExport(request)
  }

  const progressPercentage = getProgressPercentage()
  const remainingTime = getRemainingTime()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Export Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Export Formats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXPORT_FORMATS.map(format => (
              <div
                key={format.value}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  selectedFormats.includes(format.value)
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => handleFormatToggle(format.value)}
              >
                <Checkbox
                  checked={selectedFormats.includes(format.value)}
                  readOnly
                />
                <format.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{format.label}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Content Options</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAbstracts"
                  checked={options.includeAbstracts}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeAbstracts: checked || false }))
                  }
                />
                <Label htmlFor="includeAbstracts" className="text-sm">Include Abstracts</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePdfUrls"
                  checked={options.includePdfUrls}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includePdfUrls: checked || false }))
                  }
                />
                <Label htmlFor="includePdfUrls" className="text-sm">Include PDF URLs</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeMetadata: checked || false }))
                  }
                />
                <Label htmlFor="includeMetadata" className="text-sm">Include Metadata</Label>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Organization</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="groupByYear"
                  checked={options.groupByYear}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, groupByYear: checked || false }))
                  }
                />
                <Label htmlFor="groupByYear" className="text-sm">Group by Year</Label>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Sort By</Label>
                <Select
                  value={options.sortBy}
                  onValueChange={(value) => 
                    setOptions(prev => ({ ...prev, sortBy: value as any }))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="authors">Authors</SelectItem>
                    <SelectItem value="journal">Journal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">File Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Filename</Label>
                <Input
                  value={exportOptions.filename}
                  onChange={(e) => 
                    setExportOptions(prev => ({ ...prev, filename: e.target.value }))
                  }
                  placeholder="Export filename"
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Compression</Label>
                <Select
                  value={exportOptions.compression}
                  onValueChange={(value) => 
                    setExportOptions(prev => ({ ...prev, compression: value as any }))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zip">ZIP Archive</SelectItem>
                    <SelectItem value="gzip">GZIP</SelectItem>
                    <SelectItem value="none">No Compression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="separateByFormat"
                checked={exportOptions.separateByFormat}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, separateByFormat: checked || false }))
                }
              />
              <Label htmlFor="separateByFormat" className="text-sm">
                Separate files by format
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {currentProgress && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {currentProgress.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : currentProgress.status === 'failed' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                )}
                Export Progress
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    currentProgress.status === 'completed' ? 'default' :
                    currentProgress.status === 'failed' ? 'destructive' :
                    'secondary'
                  }
                >
                  {currentProgress.status}
                </Badge>
                
                {canCancel() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelExport}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress: {currentProgress.processedRecords} / {currentProgress.totalRecords}</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Current Operation:</span>
                <div className="text-muted-foreground">{currentProgress.currentOperation}</div>
              </div>
              
              {remainingTime && remainingTime > 0 && (
                <div>
                  <span className="font-medium">Time Remaining:</span>
                  <div className="text-muted-foreground">{formatTimeEstimate(remainingTime)}</div>
                </div>
              )}
              
              {currentProgress.estimatedSize && (
                <div>
                  <span className="font-medium">Estimated Size:</span>
                  <div className="text-muted-foreground">
                    {formatFileSize(currentProgress.estimatedSize)}
                  </div>
                </div>
              )}
              
              <div>
                <span className="font-medium">Formats:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentProgress.formats.map(format => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {currentProgress.status === 'completed' && canDownload() && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Export completed successfully!</span>
                    <Button
                      onClick={() => downloadExport(currentProgress.exportId)}
                      className="ml-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {currentProgress.status === 'failed' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Export failed: {currentProgress.error || 'Unknown error occurred'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedPublications.length} publication{selectedPublications.length !== 1 ? 's' : ''} selected
          {selectedFormats.length > 0 && (
            <span> • {selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isExporting ? (
            <Button disabled className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Exporting...
            </Button>
          ) : (
            <Button
              onClick={handleStartExport}
              disabled={selectedPublications.length === 0 || selectedFormats.length === 0}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Export
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}