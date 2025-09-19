'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Users,
  Mail,
  Target,
  X
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useToast } from '@/hooks/use-toast'

interface ImportResult {
  success: boolean
  total: number
  imported: number
  errors: number
  duplicates: number
  invalid: number
  errors_list: string[]
}

export function EmailContactImport() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setImportResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  })

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/admin/email/contacts/import', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setProgress(100)

      const result = await response.json()
      
      if (result.success) {
        setImportResult(result.data)
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${result.data.imported} contacts`
        })
      } else {
        throw new Error(result.error || 'Import failed')
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import contacts',
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = [
      'email,contact_type,healthcare_specialty,organization_id,first_name,last_name,phone,address,city,state,zip_code,country',
      'doctor@example.com,healthcare_professional,Cardiology,org-123,Dr. John,Smith,555-0123,123 Main St,New York,NY,10001,USA',
      'patient@example.com,patient,,org-123,Jane,Doe,555-0124,456 Oak Ave,Los Angeles,CA,90210,USA',
      'contact@example.com,general_contact,,org-123,Bob,Johnson,555-0125,789 Pine St,Chicago,IL,60601,USA'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contact-import-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const clearFile = () => {
    setFile(null)
    setImportResult(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Contacts</h2>
          <p className="text-muted-foreground">
            Import contacts from CSV or Excel files
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Import Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
          <CardDescription>
            Follow these steps to successfully import your contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Required Fields</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• email (required)</li>
                <li>• contact_type (healthcare_professional, patient, general_contact)</li>
                <li>• healthcare_specialty (for healthcare professionals)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Optional Fields</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• first_name, last_name</li>
                <li>• phone, address, city, state</li>
                <li>• zip_code, country</li>
                <li>• organization_id</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Healthcare Compliance</p>
                <p className="text-blue-700">
                  All imported contacts will be validated for healthcare compliance. 
                  Ensure you have proper consent for all contacts before importing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Select a CSV or Excel file to import contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-muted-foreground mb-4">
                or click to select a file
              </p>
              <div className="flex gap-2 justify-center">
                <Badge variant="outline">CSV</Badge>
                <Badge variant="outline">XLS</Badge>
                <Badge variant="outline">XLSX</Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                onClick={handleImport} 
                disabled={importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Contacts
                  </>
                )}
              </Button>
              
              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing contacts...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{importResult.imported}</div>
                <div className="text-sm text-muted-foreground">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-muted-foreground">Duplicates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{importResult.invalid}</div>
                <div className="text-sm text-muted-foreground">Invalid</div>
              </div>
            </div>
            
            {importResult.errors_list.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-800">Error Details</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importResult.errors_list.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
