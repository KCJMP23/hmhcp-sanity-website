/**
 * Citation Preview Component - Story 3.7c Task 4
 * Live preview of formatted citations with validation and styling
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Copy, 
  Eye, 
  Code, 
  AlertCircle, 
  CheckCircle,
  Info,
  Download,
  RefreshCw
} from 'lucide-react'
import { 
  Publication, 
  CitationFormat, 
  CitationStyle, 
  CitationOptions,
  CitationValidation
} from '@/types/publications'
import { 
  generateCitation, 
  validateCitation, 
  copyToClipboard,
  formatCitationForDisplay,
  convertToBibTeX,
  convertToRIS
} from '@/lib/utils/citation-formatting'
import { cn } from '@/lib/utils'

interface CitationPreviewProps {
  publications: Publication[]
  format: CitationFormat
  style: CitationStyle
  options: CitationOptions
  className?: string
}

export function CitationPreview({ 
  publications, 
  format, 
  style, 
  options,
  className 
}: CitationPreviewProps) {
  const [showValidation, setShowValidation] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  /**
   * Generate citations for all publications
   */
  const generatedCitations = useMemo(() => {
    return publications.map(publication => {
      let citation = ''
      
      switch (format) {
        case 'bibtex':
          citation = convertToBibTeX(publication)
          break
        case 'ris':
          citation = convertToRIS(publication)
          break
        default:
          citation = generateCitation(publication, style, format, options)
      }
      
      return {
        citation,
        publication,
        validation: validateCitation(publication)
      }
    })
  }, [publications, format, style, options])

  /**
   * Get overall validation summary
   */
  const validationSummary = useMemo(() => {
    const validations = generatedCitations.map(item => item.validation)
    const total = validations.length
    const valid = validations.filter(v => v.isValid).length
    const averageScore = validations.reduce((sum, v) => sum + v.score, 0) / total || 0
    const totalErrors = validations.reduce((sum, v) => sum + v.errors.length, 0)
    const totalWarnings = validations.reduce((sum, v) => sum + v.warnings.length, 0)
    
    return {
      total,
      valid,
      averageScore: Math.round(averageScore),
      totalErrors,
      totalWarnings,
      completeness: Math.round(validations.reduce((sum, v) => sum + v.completeness, 0) / total || 0)
    }
  }, [generatedCitations])

  /**
   * Copy citation to clipboard
   */
  const handleCopy = async (citation: string, index: number) => {
    const success = await copyToClipboard(citation)
    if (success) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  /**
   * Copy all citations
   */
  const handleCopyAll = async () => {
    const allCitations = generatedCitations.map(item => item.citation).join('\n\n')
    const success = await copyToClipboard(allCitations)
    if (success) {
      setCopiedIndex(-1) // Special index for "copy all"
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  /**
   * Refresh citations (force re-generation)
   */
  const handleRefresh = () => {
    // Force re-render by updating a timestamp or similar
    // This will trigger the useMemo to recalculate
    window.location.reload = () => window.location.reload()
  }

  if (publications.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No publications selected for preview.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Validation Summary */}
      {showValidation && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Citation Quality Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValidation(!showValidation)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {validationSummary.valid}
                </div>
                <div className="text-xs text-muted-foreground">Valid</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {validationSummary.averageScore}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {validationSummary.totalWarnings}
                </div>
                <div className="text-xs text-muted-foreground">Warnings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {validationSummary.totalErrors}
                </div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
            
            {(validationSummary.totalErrors > 0 || validationSummary.totalWarnings > 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {validationSummary.totalErrors > 0 && (
                    <span className="text-red-600 font-medium">
                      {validationSummary.totalErrors} error{validationSummary.totalErrors !== 1 ? 's' : ''} found. 
                    </span>
                  )}
                  {validationSummary.totalWarnings > 0 && (
                    <span className="text-orange-600 font-medium ml-2">
                      {validationSummary.totalWarnings} warning{validationSummary.totalWarnings !== 1 ? 's' : ''} found.
                    </span>
                  )}
                  {' '}Consider improving data quality for better citations.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Citation Preview ({publications.length} publication{publications.length !== 1 ? 's' : ''})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {style.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {format.toUpperCase()}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAll}
                disabled={generatedCitations.length === 0}
              >
                {copiedIndex === -1 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted" className="mt-4">
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {generatedCitations.map((item, index) => (
                    <Card key={item.publication.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div 
                              className={cn(
                                'prose prose-sm max-w-none',
                                format === 'html' ? 'prose-html' : 'font-mono text-sm',
                                'whitespace-pre-wrap break-words'
                              )}
                              dangerouslySetInnerHTML={{
                                __html: format === 'html' 
                                  ? item.citation 
                                  : formatCitationForDisplay(item.citation, 'text')
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.validation.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                            )}
                            
                            <Badge 
                              variant={item.validation.score >= 80 ? 'default' : 
                                     item.validation.score >= 60 ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {item.validation.score}%
                            </Badge>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(item.citation, index)}
                            >
                              {copiedIndex === index ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Badge variant="outline" className="text-xs">
                            {item.publication.publicationType}
                          </Badge>
                          {item.publication.year && (
                            <Badge variant="outline" className="text-xs">
                              {item.publication.year}
                            </Badge>
                          )}
                          {item.publication.doi && (
                            <Badge variant="outline" className="text-xs">
                              DOI
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="raw" className="mt-4">
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {generatedCitations.map((item, index) => (
                    <Card key={item.publication.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <pre className="flex-1 text-xs font-mono whitespace-pre-wrap break-words bg-gray-50 p-3 rounded">
                            {item.citation}
                          </pre>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(item.citation, index)}
                          >
                            {copiedIndex === index ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="validation" className="mt-4">
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {generatedCitations.map((item) => (
                    <Card key={item.publication.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {item.publication.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={item.validation.isValid ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {item.validation.isValid ? 'Valid' : 'Invalid'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.validation.score}% • {item.validation.completeness}% complete
                              </Badge>
                            </div>
                          </div>
                          
                          {item.validation.errors.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-red-600">Errors</h5>
                              {item.validation.errors.map((error, errorIndex) => (
                                <Alert key={errorIndex} className="border-red-200">
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  <AlertDescription className="text-sm">
                                    <span className="font-medium">{error.field}:</span> {error.message}
                                    {error.suggestion && (
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        Suggestion: {error.suggestion}
                                      </div>
                                    )}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          )}
                          
                          {item.validation.warnings.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-orange-600">Warnings</h5>
                              {item.validation.warnings.map((warning, warningIndex) => (
                                <Alert key={warningIndex} className="border-orange-200">
                                  <Info className="h-4 w-4 text-orange-500" />
                                  <AlertDescription className="text-sm">
                                    <span className="font-medium">{warning.field}:</span> {warning.message}
                                    {warning.suggestion && (
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        Suggestion: {warning.suggestion}
                                      </div>
                                    )}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}