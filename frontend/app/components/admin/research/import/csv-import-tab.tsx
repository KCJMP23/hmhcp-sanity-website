'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Separator } from '@/components/ui/separator'
import { Publication } from '@/types/publications'

interface CSVValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  errors: string[]
  preview: any[]
}

interface CSVImportTabProps {
  onImportSuccess: (publications: Publication[]) => void
  onImportError: (error: string, failedCount?: number, totalCount?: number) => void
  onImportProgress: (successful: number, failed: number, total: number) => void
  disabled?: boolean
}

export default function CSVImportTab({
  onImportSuccess,
  onImportError,
  onImportProgress,
  disabled = false
}: CSVImportTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Required CSV columns
  const requiredColumns = ['title', 'authors', 'journal', 'year']
  const optionalColumns = ['volume', 'issue', 'pages', 'doi', 'pmid', 'abstract', 'keywords', 'publicationType', 'impactFactor', 'citations']

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB')
        return
      }

      setSelectedFile(file)
      setValidationResult(null)
      setError(null)
    }
  }

  // Handle file drop
  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setSelectedFile(file)
      setValidationResult(null)
      setError(null)
    }
  }

  // Prevent default drag behavior
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      'title',
      'authors',
      'journal', 
      'year',
      'volume',
      'issue',
      'pages',
      'doi',
      'pmid',
      'abstract',
      'keywords',
      'publicationType',
      'impactFactor',
      'citations'
    ]

    const sampleData = [
      {
        title: 'Sample Research Paper on Healthcare Technology',
        authors: 'Smith, J.; Johnson, M.; Williams, K.',
        journal: 'Journal of Medical Technology',
        year: '2023',
        volume: '45',
        issue: '2',
        pages: '123-135',
        doi: '10.1234/jmt.2023.45.123',
        pmid: '12345678',
        abstract: 'This study examines the impact of healthcare technology on patient outcomes...',
        keywords: 'healthcare; technology; patient outcomes; medical devices',
        publicationType: 'journal-article',
        impactFactor: '3.2',
        citations: '15'
      }
    ]

    const csvContent = [
      headers.join(','),
      sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(',') || value.includes('"') ? 
            `"${value.replace(/"/g, '""')}"` : value
        }).join(',')
      ).join('\n')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'publications_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Validate CSV file
  const handleValidate = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first')
      return
    }

    setIsValidating(true)
    setError(null)
    setValidationResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/admin/publications/import/csv/validate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to validate CSV file')
      }

      const result = await response.json()
      setValidationResult(result)
    } catch (error) {
      console.error('Validation error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during validation')
    } finally {
      setIsValidating(false)
    }
  }

  // Import CSV file
  const handleImport = async () => {
    if (!selectedFile || !validationResult?.isValid) {
      setError('Please validate your CSV file first')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Start import
      const response = await fetch('/api/admin/publications/import/csv/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import CSV file')
      }

      const result = await response.json()
      
      if (result.successful > 0) {
        onImportSuccess(result.publications || [])
      } else {
        onImportError('No publications were imported', result.failed, result.total)
      }
    } catch (error) {
      console.error('Import error:', error)
      onImportError(error instanceof Error ? error.message : 'An error occurred during import')
    } finally {
      setIsImporting(false)
    }
  }

  // Clear file selection
  const handleClearFile = () => {
    setSelectedFile(null)
    setValidationResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center space-y-4 transition-colors ${
              selectedFile 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {selectedFile ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
            </div>
            
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-800">
                  File Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-green-600">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFile}
                  disabled={disabled || isValidating || isImporting}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Maximum file size: 10MB
                </p>
              </div>
            )}
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={disabled || isValidating || isImporting}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isValidating || isImporting}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose CSV File
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={disabled}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>

            {selectedFile && !validationResult && (
              <Button
                onClick={handleValidate}
                disabled={disabled || isValidating}
                variant="secondary"
              >
                {isValidating ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Validate File
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Card className={validationResult.isValid ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className={`text-lg flex items-center gap-2 ${
              validationResult.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              Validation {validationResult.isValid ? 'Passed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Validation Stats */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary">
                Total Rows: {validationResult.totalRows}
              </Badge>
              <Badge variant={validationResult.validRows > 0 ? 'default' : 'outline'}>
                Valid: {validationResult.validRows}
              </Badge>
              {validationResult.errors.length > 0 && (
                <Badge variant="destructive">
                  Errors: {validationResult.errors.length}
                </Badge>
              )}
            </div>

            {/* Validation Errors */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-800">Validation Errors:</h4>
                <div className="bg-red-50 border border-red-200 rounded p-3 max-h-48 overflow-y-auto">
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Data Preview */}
            {validationResult.preview && validationResult.preview.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Data Preview (first 3 rows):</h4>
                <div className="bg-gray-50 border rounded p-3 overflow-x-auto">
                  <div className="space-y-2 text-xs">
                    {validationResult.preview.slice(0, 3).map((row, index) => (
                      <div key={index} className="bg-white border rounded p-2">
                        <div className="font-medium">Row {index + 1}:</div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div><strong>Title:</strong> {row.title || 'N/A'}</div>
                          <div><strong>Journal:</strong> {row.journal || 'N/A'}</div>
                          <div><strong>Year:</strong> {row.year || 'N/A'}</div>
                          <div><strong>Authors:</strong> {
                            Array.isArray(row.authors) ? row.authors.slice(0, 2).join(', ') : (row.authors || 'N/A')
                          }</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Import Button */}
            {validationResult.isValid && (
              <div className="pt-2">
                <Button
                  onClick={handleImport}
                  disabled={disabled || isImporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Importing {validationResult.validRows} publications...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import {validationResult.validRows} Publications
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CSV Format Requirements */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-900">CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-yellow-800 space-y-3">
          <div className="space-y-2">
            <div>
              <strong>Required columns:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {requiredColumns.map(col => (
                  <Badge key={col} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <strong>Optional columns:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {optionalColumns.map(col => (
                  <Badge key={col} variant="secondary" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-yellow-300" />

          <div className="space-y-2">
            <h4 className="font-semibold">Formatting Guidelines:</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><strong>Authors:</strong> Separate multiple authors with semicolons (;)</li>
              <li><strong>Keywords:</strong> Separate with semicolons or commas</li>
              <li><strong>Year:</strong> 4-digit year (e.g., 2023)</li>
              <li><strong>DOI:</strong> Full DOI format (e.g., 10.1234/example)</li>
              <li><strong>Citations/Impact Factor:</strong> Numeric values only</li>
              <li><strong>Quotes:</strong> Use double quotes for text containing commas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}