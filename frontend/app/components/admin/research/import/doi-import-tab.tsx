'use client'

import { useState } from 'react'
import { FileText, Plus, AlertCircle, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Textarea } from '@/components/ui/textarea'
import { Publication } from '@/types/publications'

interface DOIResult {
  doi: string
  title?: string
  authors?: string[]
  journal?: string
  year?: number
  abstract?: string
  status: 'pending' | 'found' | 'not-found' | 'error'
  error?: string
}

interface DOIImportTabProps {
  onImportSuccess: (publications: Publication[]) => void
  onImportError: (error: string) => void
  onImportProgress: (successful: number, failed: number, total: number) => void
  disabled?: boolean
}

export default function DOIImportTab({
  onImportSuccess,
  onImportError,
  onImportProgress,
  disabled = false
}: DOIImportTabProps) {
  const [singleDOI, setSingleDOI] = useState('')
  const [bulkDOIs, setBulkDOIs] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [doiResults, setDOIResults] = useState<DOIResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Validate DOI format
  const validateDOI = (doi: string): boolean => {
    const doiRegex = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/
    return doiRegex.test(doi.trim())
  }

  // Clean and extract DOI from URL or text
  const cleanDOI = (input: string): string => {
    const cleaned = input.trim()
    
    // If it's a URL, extract the DOI part
    const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:dx\.)?doi\.org\/(.+)/)
    if (urlMatch) {
      return urlMatch[1]
    }
    
    // If it starts with "doi:", remove that prefix
    if (cleaned.toLowerCase().startsWith('doi:')) {
      return cleaned.substring(4).trim()
    }
    
    return cleaned
  }

  // Add single DOI
  const handleAddSingleDOI = () => {
    const cleanedDOI = cleanDOI(singleDOI)
    
    if (!cleanedDOI) {
      setError('Please enter a DOI')
      return
    }

    if (!validateDOI(cleanedDOI)) {
      setError('Invalid DOI format. DOI should be in format: 10.1234/example')
      return
    }

    if (doiResults.some(result => result.doi === cleanedDOI)) {
      setError('This DOI has already been added')
      return
    }

    setDOIResults(prev => [...prev, {
      doi: cleanedDOI,
      status: 'pending'
    }])
    setSingleDOI('')
    setError(null)
  }

  // Add bulk DOIs
  const handleAddBulkDOIs = () => {
    if (!bulkDOIs.trim()) {
      setError('Please enter DOIs to add')
      return
    }

    const lines = bulkDOIs.split('\n').map(line => line.trim()).filter(line => line)
    const validDOIs: DOIResult[] = []
    const errors: string[] = []

    lines.forEach((line, index) => {
      const cleanedDOI = cleanDOI(line)
      
      if (!cleanedDOI) {
        errors.push(`Line ${index + 1}: Empty DOI`)
        return
      }

      if (!validateDOI(cleanedDOI)) {
        errors.push(`Line ${index + 1}: Invalid DOI format - ${cleanedDOI}`)
        return
      }

      if (doiResults.some(result => result.doi === cleanedDOI) || 
          validDOIs.some(result => result.doi === cleanedDOI)) {
        errors.push(`Line ${index + 1}: Duplicate DOI - ${cleanedDOI}`)
        return
      }

      validDOIs.push({
        doi: cleanedDOI,
        status: 'pending'
      })
    })

    if (errors.length > 0) {
      setError(`${errors.length} error(s) found:\n${errors.join('\n')}`)
    } else {
      setError(null)
    }

    if (validDOIs.length > 0) {
      setDOIResults(prev => [...prev, ...validDOIs])
      setBulkDOIs('')
    }
  }

  // Remove DOI from list
  const handleRemoveDOI = (doi: string) => {
    setDOIResults(prev => prev.filter(result => result.doi !== doi))
  }

  // Clear all DOIs
  const handleClearAll = () => {
    setDOIResults([])
    setError(null)
  }

  // Look up DOI metadata
  const handleLookup = async () => {
    if (doiResults.length === 0) {
      setError('Please add at least one DOI')
      return
    }

    setIsLookingUp(true)
    setError(null)

    try {
      const updatedResults = [...doiResults]

      for (let i = 0; i < updatedResults.length; i++) {
        const result = updatedResults[i]
        
        if (result.status !== 'pending') continue

        try {
          const response = await fetch('/api/admin/publications/import/doi/lookup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doi: result.doi })
          })

          if (response.ok) {
            const data = await response.json()
            updatedResults[i] = {
              ...result,
              ...data.metadata,
              status: 'found'
            }
          } else {
            const errorData = await response.json()
            updatedResults[i] = {
              ...result,
              status: 'not-found',
              error: errorData.error || 'Failed to retrieve metadata'
            }
          }
        } catch (error) {
          updatedResults[i] = {
            ...result,
            status: 'error',
            error: 'Network error during lookup'
          }
        }

        // Update results incrementally
        setDOIResults([...updatedResults])
      }
    } catch (error) {
      console.error('Lookup error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during lookup')
    } finally {
      setIsLookingUp(false)
    }
  }

  // Import found publications
  const handleImport = async () => {
    const foundResults = doiResults.filter(result => result.status === 'found')
    
    if (foundResults.length === 0) {
      setError('No publications found to import. Please lookup DOI metadata first.')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      let successful = 0
      let failed = 0
      const total = foundResults.length
      const importedPublications: Publication[] = []

      // Update progress
      onImportProgress(0, 0, total)

      for (const result of foundResults) {
        try {
          const response = await fetch('/api/admin/publications/import/doi/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              doi: result.doi,
              title: result.title,
              authors: result.authors,
              journal: result.journal,
              year: result.year,
              abstract: result.abstract
            })
          })

          if (response.ok) {
            const importedPub = await response.json()
            importedPublications.push(importedPub.publication)
            successful++
          } else {
            failed++
          }
        } catch (error) {
          console.error(`Failed to import DOI ${result.doi}:`, error)
          failed++
        }

        // Update progress
        onImportProgress(successful, failed, total)
      }

      if (successful > 0) {
        onImportSuccess(importedPublications)
      } else {
        onImportError(`Failed to import all ${total} publications`)
      }
    } catch (error) {
      console.error('Import error:', error)
      onImportError(error instanceof Error ? error.message : 'An error occurred during import')
    } finally {
      setIsImporting(false)
    }
  }

  const foundCount = doiResults.filter(r => r.status === 'found').length
  const pendingCount = doiResults.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* DOI Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add DOIs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Single DOI Input */}
          <div className="space-y-2">
            <Label htmlFor="single-doi">Single DOI</Label>
            <div className="flex gap-2">
              <Input
                id="single-doi"
                placeholder="10.1234/example or https://doi.org/10.1234/example"
                value={singleDOI}
                onChange={(e) => setSingleDOI(e.target.value)}
                disabled={disabled || isLookingUp}
                onKeyDown={(e) => e.key === 'Enter' && !isLookingUp && handleAddSingleDOI()}
              />
              <Button 
                onClick={handleAddSingleDOI}
                disabled={disabled || isLookingUp || !singleDOI.trim()}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Bulk DOI Input */}
          <div className="space-y-2">
            <Label htmlFor="bulk-dois">Bulk DOIs (one per line)</Label>
            <Textarea
              id="bulk-dois"
              placeholder="10.1234/example1&#10;10.1234/example2&#10;https://doi.org/10.1234/example3"
              value={bulkDOIs}
              onChange={(e) => setBulkDOIs(e.target.value)}
              disabled={disabled || isLookingUp}
              rows={4}
            />
            <Button 
              onClick={handleAddBulkDOIs}
              disabled={disabled || isLookingUp || !bulkDOIs.trim()}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add DOIs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* DOI List */}
      {doiResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                DOI List ({doiResults.length} total)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={disabled || isLookingUp || isImporting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {pendingCount > 0 && (
                  <Button
                    onClick={handleLookup}
                    disabled={disabled || isLookingUp}
                    variant="secondary"
                  >
                    {isLookingUp ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Looking up...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Lookup Metadata ({pendingCount})
                      </>
                    )}
                  </Button>
                )}
                {foundCount > 0 && (
                  <Button
                    onClick={handleImport}
                    disabled={disabled || isImporting || foundCount === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isImporting ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Import Found ({foundCount})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {doiResults.map((result, index) => (
                <div key={`${result.doi}-${index}`} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          result.status === 'found' ? 'default' :
                          result.status === 'pending' ? 'secondary' :
                          result.status === 'not-found' ? 'outline' : 'destructive'
                        }>
                          {result.status === 'found' ? 'Found' :
                           result.status === 'pending' ? 'Pending' :
                           result.status === 'not-found' ? 'Not Found' : 'Error'}
                        </Badge>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {result.doi}
                        </code>
                      </div>
                      
                      {result.title && (
                        <h4 className="font-semibold text-sm leading-relaxed">
                          {result.title}
                        </h4>
                      )}
                      
                      {result.authors && result.authors.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Authors:</strong> {result.authors.slice(0, 3).join(', ')}
                          {result.authors.length > 3 && `, et al. (${result.authors.length} total)`}
                        </p>
                      )}
                      
                      {result.journal && result.year && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Published:</strong> {result.journal} ({result.year})
                        </p>
                      )}
                      
                      {result.error && (
                        <p className="text-xs text-red-600">
                          <strong>Error:</strong> {result.error}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveDOI(result.doi)}
                      disabled={disabled || isLookingUp || isImporting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DOI Format Help */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-sm text-green-900">Supported DOI Formats</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-green-800 space-y-2">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <strong>Accepted formats:</strong>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>10.1234/example</li>
                <li>doi:10.1234/example</li>
                <li>https://doi.org/10.1234/example</li>
                <li>https://dx.doi.org/10.1234/example</li>
              </ul>
            </div>
            <div>
              <strong>Tips:</strong>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Copy DOIs from journal websites</li>
                <li>Use PubMed or Google Scholar</li>
                <li>Check DOI format before adding</li>
                <li>Lookup validates DOI existence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}