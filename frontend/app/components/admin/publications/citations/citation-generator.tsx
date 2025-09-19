/**
 * Citation Generator Component - Story 3.7c Task 4
 * Main citation interface with format and style selection
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Copy, 
  Download, 
  BookOpen, 
  FileText, 
  Code, 
  Database,
  Heart,
  HeartHandshake,
  Check,
  AlertCircle
} from 'lucide-react'
import { Publication, CitationFormat, CitationStyle, CitationOptions } from '@/types/publications'
import { useCitationApi } from '@/hooks/use-citation-api'
import { generateCitation, validateCitation, copyToClipboard, downloadCitation } from '@/lib/utils/citation-formatting'
import { CitationPreview } from './citation-preview'
import { cn } from '@/lib/utils'

interface CitationGeneratorProps {
  publications: Publication[]
  selectedPublications?: string[]
  onSelectionChange?: (selected: string[]) => void
  className?: string
}

const CITATION_FORMATS: { value: CitationFormat; label: string; icon: any; description: string }[] = [
  { value: 'text', label: 'Text', icon: FileText, description: 'Plain text citation' },
  { value: 'html', label: 'HTML', icon: Code, description: 'HTML formatted citation' },
  { value: 'bibtex', label: 'BibTeX', icon: Database, description: 'LaTeX bibliography format' },
  { value: 'ris', label: 'RIS', icon: BookOpen, description: 'Reference manager format' },
  { value: 'json', label: 'JSON', icon: Code, description: 'Structured data format' },
]

const CITATION_STYLES: { value: CitationStyle; label: string; field: string; description: string }[] = [
  { value: 'apa', label: 'APA', field: 'Psychology', description: 'American Psychological Association' },
  { value: 'mla', label: 'MLA', field: 'Literature', description: 'Modern Language Association' },
  { value: 'chicago', label: 'Chicago', field: 'History', description: 'Chicago Manual of Style' },
  { value: 'vancouver', label: 'Vancouver', field: 'Medicine', description: 'International Committee of Medical Journal Editors' },
  { value: 'harvard', label: 'Harvard', field: 'General', description: 'Harvard referencing system' },
  { value: 'ieee', label: 'IEEE', field: 'Engineering', description: 'Institute of Electrical and Electronics Engineers' },
  { value: 'nature', label: 'Nature', field: 'Science', description: 'Nature journal citation style' },
  { value: 'ama', label: 'AMA', field: 'Medicine', description: 'American Medical Association' },
]

export function CitationGenerator({ 
  publications, 
  selectedPublications = [], 
  onSelectionChange,
  className 
}: CitationGeneratorProps) {
  const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('text')
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('apa')
  const [citationOptions, setCitationOptions] = useState<CitationOptions>({
    includeAbstract: false,
    includeUrl: false,
    includeDoi: true,
    includeAccessed: false,
    sortBy: 'author',
    sortOrder: 'asc',
    groupByYear: false,
    numberEntries: false,
    includePageNumbers: true,
    useShortAuthorNames: false,
    includeIssn: false
  })
  
  const [generatedCitations, setGeneratedCitations] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const {
    generateCitation: apiGenerateCitation,
    isGenerating,
    addToFavorites,
    removeFromFavorites
  } = useCitationApi({
    enableHistory: true,
    onSuccess: (citation) => {
      console.log('Citation generated:', citation)
    }
  })

  /**
   * Handle publication selection
   */
  const handlePublicationToggle = (publicationId: string) => {
    const newSelection = selectedPublications.includes(publicationId)
      ? selectedPublications.filter(id => id !== publicationId)
      : [...selectedPublications, publicationId]
    
    onSelectionChange?.(newSelection)
  }

  /**
   * Generate citations for selected publications
   */
  const handleGenerateCitations = async () => {
    if (selectedPublications.length === 0) return
    
    const citations: string[] = []
    
    for (const publicationId of selectedPublications) {
      const publication = publications.find(p => p.id === publicationId)
      if (!publication) continue
      
      // Generate citation locally for preview
      const citation = generateCitation(publication, selectedStyle, selectedFormat, citationOptions)
      citations.push(citation)
      
      // Also generate via API for history tracking
      await apiGenerateCitation(publicationId, selectedFormat, selectedStyle, citationOptions)
    }
    
    setGeneratedCitations(citations)
  }

  /**
   * Copy all citations to clipboard
   */
  const handleCopyAll = async () => {
    const combinedCitations = generatedCitations.join('\n\n')
    const success = await copyToClipboard(combinedCitations)
    if (!success) {
      console.error('Failed to copy citations')
    }
  }

  /**
   * Download citations as file
   */
  const handleDownload = () => {
    const combinedCitations = generatedCitations.join('\n\n')
    const filename = `citations-${selectedStyle}-${Date.now()}.${selectedFormat === 'bibtex' ? 'bib' : selectedFormat === 'ris' ? 'ris' : 'txt'}`
    const mimeType = selectedFormat === 'json' ? 'application/json' : 'text/plain'
    
    downloadCitation(combinedCitations, filename, mimeType)
  }

  /**
   * Toggle favorite status
   */
  const handleToggleFavorite = (publicationId: string) => {
    const isFavorite = favorites.has(publicationId)
    
    if (isFavorite) {
      setFavorites(prev => {
        const newSet = new Set(prev)
        newSet.delete(publicationId)
        return newSet
      })
      removeFromFavorites(publicationId)
    } else {
      setFavorites(prev => new Set(prev).add(publicationId))
      addToFavorites(publicationId)
    }
  }

  /**
   * Update citation options
   */
  const updateOption = (key: keyof CitationOptions, value: any) => {
    setCitationOptions(prev => ({ ...prev, [key]: value }))
  }

  /**
   * Get selected publications data
   */
  const selectedPublicationsData = publications.filter(p => 
    selectedPublications.includes(p.id)
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Publication Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Select Publications ({selectedPublications.length} selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {publications.map(publication => {
              const isSelected = selectedPublications.includes(publication.id)
              const isFavorite = favorites.has(publication.id)
              const validation = validateCitation(publication)
              
              return (
                <div
                  key={publication.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handlePublicationToggle(publication.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {publication.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {publication.authors.join(', ')} ({publication.year})
                        </p>
                        {publication.journal && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {publication.journal}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(publication.id)}
                          className="h-8 w-8 p-0"
                        >
                          {isFavorite ? (
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          ) : (
                            <HeartHandshake className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {validation.isValid ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {publication.publicationType}
                      </Badge>
                      {validation.score && (
                        <Badge 
                          variant={validation.score >= 80 ? 'default' : validation.score >= 60 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {validation.score}% complete
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {publications.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No publications available for citation generation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Citation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Citation Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="format" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="format">Format & Style</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="format" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Citation Format</Label>
                  <Select value={selectedFormat} onValueChange={(value: CitationFormat) => setSelectedFormat(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITATION_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          <div className="flex items-center gap-2">
                            <format.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {format.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Citation Style</Label>
                  <Select value={selectedStyle} onValueChange={(value: CitationStyle) => setSelectedStyle(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITATION_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {style.field} • {style.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="options" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Include Fields</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeDoi"
                      checked={citationOptions.includeDoi}
                      onCheckedChange={(checked) => updateOption('includeDoi', checked)}
                    />
                    <Label htmlFor="includeDoi">Include DOI</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeUrl"
                      checked={citationOptions.includeUrl}
                      onCheckedChange={(checked) => updateOption('includeUrl', checked)}
                    />
                    <Label htmlFor="includeUrl">Include URL</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeAbstract"
                      checked={citationOptions.includeAbstract}
                      onCheckedChange={(checked) => updateOption('includeAbstract', checked)}
                    />
                    <Label htmlFor="includeAbstract">Include Abstract</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeAccessed"
                      checked={citationOptions.includeAccessed}
                      onCheckedChange={(checked) => updateOption('includeAccessed', checked)}
                    />
                    <Label htmlFor="includeAccessed">Include Access Date</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Formatting Options</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="groupByYear"
                      checked={citationOptions.groupByYear}
                      onCheckedChange={(checked) => updateOption('groupByYear', checked)}
                    />
                    <Label htmlFor="groupByYear">Group by Year</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="numberEntries"
                      checked={citationOptions.numberEntries}
                      onCheckedChange={(checked) => updateOption('numberEntries', checked)}
                    />
                    <Label htmlFor="numberEntries">Number Entries</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="useShortAuthorNames"
                      checked={citationOptions.useShortAuthorNames}
                      onCheckedChange={(checked) => updateOption('useShortAuthorNames', checked)}
                    />
                    <Label htmlFor="useShortAuthorNames">Use Short Author Names</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select 
                      value={citationOptions.sortBy} 
                      onValueChange={(value) => updateOption('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                        <SelectItem value="journal">Journal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              {selectedPublicationsData.length > 0 ? (
                <CitationPreview
                  publications={selectedPublicationsData}
                  format={selectedFormat}
                  style={selectedStyle}
                  options={citationOptions}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Select publications to see citation preview.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedPublications.length} publication{selectedPublications.length !== 1 ? 's' : ''} selected
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyAll}
            disabled={generatedCitations.length === 0}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy All
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={generatedCitations.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          
          <Button
            onClick={handleGenerateCitations}
            disabled={selectedPublications.length === 0 || isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate Citations
          </Button>
        </div>
      </div>
    </div>
  )
}