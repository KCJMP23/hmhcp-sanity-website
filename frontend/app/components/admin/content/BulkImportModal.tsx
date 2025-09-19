/**
 * Bulk Import Modal
 * Handles bulk import of content with validation, preview, and error handling
 */

import React, { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Upload,
  FileText,
  Download,
  AlertTriangle,
  Check,
  X,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  FileCode,
  Loader2
} from 'lucide-react'
import { AdminModal } from '../ui/modals/AdminModal'
import { AdminButton } from '../ui/forms/AdminButton'
import { AdminFileUpload } from '../ui/forms/AdminFileUpload'
import { AdminSelect } from '../ui/forms/AdminSelect'
import { AdminCheckbox } from '../ui/forms/AdminCheckbox'
import { AdminDataTable } from '../ui/tables/AdminDataTable'
import type { BulkOperation, BulkOperationResult } from '@/lib/types/bulk-operations'

interface ImportRecord {
  id?: string
  title: string
  slug?: string
  content?: string
  status?: 'draft' | 'published' | 'archived'
  category?: string
  tags?: string[]
  author?: string
  publishedAt?: string
  seoTitle?: string
  seoDescription?: string
  [key: string]: any
}

interface ValidationError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
  value?: any
}

interface ImportPreview {
  records: ImportRecord[]
  validRecords: ImportRecord[]
  errors: ValidationError[]
  warnings: ValidationError[]
  duplicates: ImportRecord[]
  statistics: {
    total: number
    valid: number
    errors: number
    warnings: number
    duplicates: number
  }
}

interface BulkImportModalProps {
  open: boolean
  onClose: () => void
  contentType: 'pages' | 'posts' | 'services' | 'platforms' | 'team-members' | 'testimonials'
  onImport: (operation: BulkOperation) => Promise<BulkOperationResult>
}

const CONTENT_SCHEMAS = {
  pages: {
    required: ['title', 'slug'],
    optional: ['content', 'status', 'seoTitle', 'seoDescription', 'publishedAt'],
    unique: ['slug']
  },
  posts: {
    required: ['title'],
    optional: ['slug', 'content', 'status', 'category', 'tags', 'author', 'publishedAt', 'seoTitle', 'seoDescription'],
    unique: ['slug']
  },
  services: {
    required: ['title', 'description'],
    optional: ['slug', 'status', 'category', 'tags', 'publishedAt'],
    unique: ['slug']
  },
  platforms: {
    required: ['title', 'description'],
    optional: ['slug', 'status', 'category', 'features', 'publishedAt'],
    unique: ['slug']
  },
  'team-members': {
    required: ['name', 'role'],
    optional: ['bio', 'email', 'phone', 'department', 'status'],
    unique: ['email']
  },
  testimonials: {
    required: ['content', 'author'],
    optional: ['authorRole', 'authorCompany', 'rating', 'status', 'publishedAt'],
    unique: []
  }
}

const IMPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Comma-separated values' },
  { value: 'json', label: 'JSON', icon: FileJson, description: 'JavaScript Object Notation' },
  { value: 'xml', label: 'XML', icon: FileCode, description: 'Extensible Markup Language' }
]

export function BulkImportModal({
  open,
  onClose,
  contentType,
  onImport
}: BulkImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [selectedFormat, setSelectedFormat] = useState('csv')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateOnly: false,
    defaultStatus: 'draft' as 'draft' | 'published' | 'archived'
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<BulkOperationResult | null>(null)

  const schema = CONTENT_SCHEMAS[contentType]

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const selectedFile = files[0]
    setFile(selectedFile)

    // Auto-detect format based on file extension
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (extension && ['csv', 'json', 'xml'].includes(extension)) {
      setSelectedFormat(extension)
    }
  }, [])

  const validateRecord = useCallback((record: ImportRecord, index: number): ValidationError[] => {
    const errors: ValidationError[] = []

    // Check required fields
    schema.required.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push({
          row: index + 1,
          field,
          message: `Required field '${field}' is missing or empty`,
          severity: 'error'
        })
      }
    })

    // Validate specific field formats
    if (record.slug && !/^[a-z0-9-]+$/.test(record.slug)) {
      errors.push({
        row: index + 1,
        field: 'slug',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
        severity: 'error'
      })
    }

    if (record.status && !['draft', 'published', 'archived'].includes(record.status)) {
      errors.push({
        row: index + 1,
        field: 'status',
        message: 'Status must be draft, published, or archived',
        severity: 'error'
      })
    }

    if (record.publishedAt && isNaN(Date.parse(record.publishedAt))) {
      errors.push({
        row: index + 1,
        field: 'publishedAt',
        message: 'Published date must be a valid date format',
        severity: 'warning'
      })
    }

    // Email validation for team members
    if (contentType === 'team-members' && record.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(record.email)) {
        errors.push({
          row: index + 1,
          field: 'email',
          message: 'Invalid email format',
          severity: 'error'
        })
      }
    }

    return errors
  }, [schema, contentType])

  const parseFile = useCallback(async (file: File, format: string): Promise<ImportRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          let records: ImportRecord[] = []

          switch (format) {
            case 'csv':
              records = parseCSV(content)
              break
            case 'json':
              records = JSON.parse(content)
              if (!Array.isArray(records)) {
                records = [records]
              }
              break
            case 'xml':
              records = parseXML(content)
              break
            default:
              throw new Error(`Unsupported format: ${format}`)
          }

          resolve(records)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const parseCSV = (content: string): ImportRecord[] => {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const records: ImportRecord[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const record: ImportRecord = {}

      headers.forEach((header, index) => {
        const value = values[index]
        if (value !== undefined && value !== '') {
          // Handle special fields
          if (header === 'tags' && value) {
            record[header] = value.split(';').map(tag => tag.trim())
          } else {
            record[header] = value
          }
        }
      })

      if (Object.keys(record).length > 0) {
        records.push(record)
      }
    }

    return records
  }

  const parseXML = (content: string): ImportRecord[] => {
    // Basic XML parsing - in a real implementation, use a proper XML parser
    const records: ImportRecord[] = []
    const itemMatches = content.match(/<item[^>]*>([\s\S]*?)<\/item>/gi)
    
    if (itemMatches) {
      itemMatches.forEach(itemXml => {
        const record: ImportRecord = {}
        const fieldMatches = itemXml.match(/<([^>\/\s]+)[^>]*>([^<]*)<\/\1>/gi)
        
        if (fieldMatches) {
          fieldMatches.forEach(fieldXml => {
            const match = fieldXml.match(/<([^>\/\s]+)[^>]*>([^<]*)<\/\1>/)
            if (match) {
              const [, fieldName, value] = match
              if (value.trim()) {
                record[fieldName] = value.trim()
              }
            }
          })
        }
        
        if (Object.keys(record).length > 0) {
          records.push(record)
        }
      })
    }

    return records
  }

  const generatePreview = useCallback(async () => {
    if (!file) return

    setIsProcessing(true)
    
    try {
      const records = await parseFile(file, selectedFormat)
      const allErrors: ValidationError[] = []
      const validRecords: ImportRecord[] = []
      const duplicates: ImportRecord[] = []

      // Validate each record
      records.forEach((record, index) => {
        const errors = validateRecord(record, index)
        allErrors.push(...errors)

        if (errors.filter(e => e.severity === 'error').length === 0) {
          validRecords.push(record)
        }
      })

      // Check for duplicates based on unique fields
      if (schema.unique.length > 0) {
        const seen = new Set()
        records.forEach(record => {
          schema.unique.forEach(field => {
            if (record[field]) {
              const key = `${field}:${record[field]}`
              if (seen.has(key)) {
                duplicates.push(record)
              } else {
                seen.add(key)
              }
            }
          })
        })
      }

      const preview: ImportPreview = {
        records,
        validRecords,
        errors: allErrors.filter(e => e.severity === 'error'),
        warnings: allErrors.filter(e => e.severity === 'warning'),
        duplicates,
        statistics: {
          total: records.length,
          valid: validRecords.length,
          errors: allErrors.filter(e => e.severity === 'error').length,
          warnings: allErrors.filter(e => e.severity === 'warning').length,
          duplicates: duplicates.length
        }
      }

      setPreview(preview)
      setStep('preview')
    } catch (error) {
      console.error('Error parsing file:', error)
      // Show error notification
    } finally {
      setIsProcessing(false)
    }
  }, [file, selectedFormat, validateRecord, schema])

  const handleImport = useCallback(async () => {
    if (!preview || preview.validRecords.length === 0) return

    setStep('importing')
    setIsProcessing(true)

    try {
      const result = await onImport({
        action: 'import',
        type: contentType,
        selectedIds: [],
        options: {
          records: preview.validRecords,
          ...importOptions
        }
      })

      setImportResult(result)
      setStep('complete')
    } catch (error) {
      console.error('Import failed:', error)
      // Handle error
    } finally {
      setIsProcessing(false)
    }
  }, [preview, onImport, contentType, importOptions])

  const handleClose = useCallback(() => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setImportResult(null)
    setIsProcessing(false)
    onClose()
  }, [onClose])

  const downloadTemplate = useCallback(() => {
    const headers = [...schema.required, ...schema.optional]
    const csvContent = headers.join(',') + '\n'
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contentType}-import-template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [schema, contentType])

  const previewColumns = useMemo(() => [
    { field: 'title', label: 'Title', searchable: true },
    { field: 'status', label: 'Status' },
    { field: 'category', label: 'Category' },
    { field: 'author', label: 'Author' },
    { field: 'publishedAt', label: 'Published', type: 'date' as const }
  ], [])

  const errorColumns = useMemo(() => [
    { field: 'row', label: 'Row', width: '80px' },
    { field: 'field', label: 'Field' },
    { field: 'message', label: 'Error Message' },
    { 
      field: 'severity', 
      label: 'Severity',
      render: (value: string) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          value === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        )}>
          {value}
        </span>
      )
    }
  ], [])

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title="Bulk Import"
      size="xl"
    >
      <div className="space-y-6">
        {step === 'upload' && (
          <>
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Upload Import File</h3>
                <AdminButton
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={downloadTemplate}
                >
                  Download Template
                </AdminButton>
              </div>

              <AdminSelect
                label="File Format"
                value={selectedFormat}
                onChange={(value) => setSelectedFormat(value as string)}
                options={IMPORT_FORMATS.map(format => ({
                  value: format.value,
                  label: format.label,
                  description: format.description
                }))}
              />

              <AdminFileUpload
                accept=".csv,.json,.xml"
                multiple={false}
                onChange={handleFileSelect}
                label="Select file to import"
                helper={`Supported formats: ${IMPORT_FORMATS.map(f => f.label).join(', ')}`}
              />

              {file && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{file.name}</p>
                      <p className="text-sm text-blue-600">
                        {(file.size / 1024).toFixed(1)} KB • {selectedFormat.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Import Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Import Options</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <AdminCheckbox
                  checked={importOptions.skipDuplicates}
                  onChange={(e) => setImportOptions(prev => ({ 
                    ...prev, 
                    skipDuplicates: e.target.checked 
                  }))}
                  label="Skip Duplicates"
                  description="Skip records that already exist"
                />
                
                <AdminCheckbox
                  checked={importOptions.updateExisting}
                  onChange={(e) => setImportOptions(prev => ({ 
                    ...prev, 
                    updateExisting: e.target.checked 
                  }))}
                  label="Update Existing"
                  description="Update existing records with new data"
                />
              </div>

              <AdminSelect
                label="Default Status"
                value={importOptions.defaultStatus}
                onChange={(value) => setImportOptions(prev => ({ 
                  ...prev, 
                  defaultStatus: value as any 
                }))}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' }
                ]}
              />
            </div>

            <div className="flex justify-end gap-3">
              <AdminButton variant="outline" onClick={handleClose}>
                Cancel
              </AdminButton>
              <AdminButton
                onClick={generatePreview}
                disabled={!file || isProcessing}
                loading={isProcessing}
                icon={Eye}
              >
                Preview Import
              </AdminButton>
            </div>
          </>
        )}

        {step === 'preview' && preview && (
          <>
            {/* Import Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {preview.statistics.total}
                </div>
                <div className="text-sm text-blue-600">Total Records</div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {preview.statistics.valid}
                </div>
                <div className="text-sm text-green-600">Valid Records</div>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-900">
                  {preview.statistics.errors}
                </div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-2xl font-bold text-yellow-900">
                  {preview.statistics.warnings}
                </div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
            </div>

            {/* Errors and Warnings */}
            {(preview.errors.length > 0 || preview.warnings.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Issues Found</h3>
                <AdminDataTable
                  data={[...preview.errors, ...preview.warnings]}
                  columns={errorColumns}
                  pageSize={10}
                  emptyMessage="No issues found"
                />
              </div>
            )}

            {/* Preview Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preview Data</h3>
              <AdminDataTable
                data={preview.validRecords.slice(0, 10)}
                columns={previewColumns}
                pageSize={10}
                emptyMessage="No valid records to preview"
              />
              {preview.validRecords.length > 10 && (
                <p className="text-sm text-gray-500">
                  Showing first 10 of {preview.validRecords.length} valid records
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <AdminButton 
                variant="outline" 
                onClick={() => setStep('upload')}
                icon={RefreshCw}
              >
                Back to Upload
              </AdminButton>
              
              <div className="flex gap-3">
                <AdminButton variant="outline" onClick={handleClose}>
                  Cancel
                </AdminButton>
                <AdminButton
                  onClick={handleImport}
                  disabled={preview.statistics.valid === 0 || preview.statistics.errors > 0}
                  icon={Upload}
                >
                  Import {preview.statistics.valid} Records
                </AdminButton>
              </div>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-medium mb-2">Importing Records</h3>
            <p className="text-gray-600">Please wait while we process your import...</p>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className={cn(
                'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
                importResult.success ? 'bg-green-100' : 'bg-red-100'
              )}>
                {importResult.success ? (
                  <Check className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                )}
              </div>
              
              <h3 className="text-lg font-medium mb-2">
                {importResult.success ? 'Import Completed' : 'Import Failed'}
              </h3>
              
              <p className="text-gray-600">
                {importResult.success 
                  ? `Successfully imported ${importResult.successCount} records`
                  : `Import failed with ${importResult.errorCount} errors`
                }
              </p>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-900">Errors:</h4>
                <div className="space-y-1">
                  {importResult.errors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-sm text-red-600">• {error}</p>
                  ))}
                  {importResult.errors.length > 5 && (
                    <p className="text-sm text-gray-500">
                      ...and {importResult.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <AdminButton onClick={handleClose}>
                Close
              </AdminButton>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  )
}