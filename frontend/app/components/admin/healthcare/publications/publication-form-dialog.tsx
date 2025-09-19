'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import type { PublicationFormData, ResearchPublication } from './types'
import { PUBLICATION_TYPES, PUBLICATION_STATUS, RESEARCH_AREAS } from './types'

interface PublicationFormDialogProps {
  isOpen: boolean
  onClose: () => void
  publication?: ResearchPublication | null
  onSubmit: (data: PublicationFormData) => Promise<void>
}

export function PublicationFormDialog({
  isOpen,
  onClose,
  publication,
  onSubmit
}: PublicationFormDialogProps) {
  const [currentTab, setCurrentTab] = useState('basic')
  const [formData, setFormData] = useState<PublicationFormData>({
    title: publication?.title || '',
    abstract: publication?.abstract || '',
    authors: publication?.authors || [],
    publication_type: publication?.publication_type || 'journal_article',
    journal_name: publication?.journal_name || '',
    volume: publication?.volume || '',
    issue: publication?.issue || '',
    pages: publication?.pages || '',
    doi: publication?.doi || '',
    pmid: publication?.pmid || '',
    publication_date: publication?.publication_date ? new Date(publication.publication_date) : null,
    status: publication?.status || 'draft',
    impact_factor: publication?.impact_factor || 0,
    keywords: publication?.keywords || [],
    research_area: publication?.research_area || '',
    funding_source: publication?.funding_source || '',
    corresponding_author: publication?.corresponding_author || '',
    affiliated_institutions: publication?.affiliated_institutions || [],
    peer_reviewed: publication?.peer_reviewed || true,
    open_access: publication?.open_access || false,
    pdf_url: publication?.pdf_url || ''
  })

  const [newAuthor, setNewAuthor] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [newInstitution, setNewInstitution] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    onClose()
  }

  const addAuthor = () => {
    if (newAuthor.trim()) {
      setFormData(prev => ({
        ...prev,
        authors: [...prev.authors, newAuthor.trim()]
      }))
      setNewAuthor('')
    }
  }

  const removeAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }))
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const addInstitution = () => {
    if (newInstitution.trim()) {
      setFormData(prev => ({
        ...prev,
        affiliated_institutions: [...prev.affiliated_institutions, newInstitution.trim()]
      }))
      setNewInstitution('')
    }
  }

  const removeInstitution = (index: number) => {
    setFormData(prev => ({
      ...prev,
      affiliated_institutions: prev.affiliated_institutions.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {publication ? 'Edit Research Publication' : 'Add Research Publication'}
          </DialogTitle>
          <DialogDescription>
            {publication ? 'Update publication details' : 'Create a new research publication entry'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Publication Details</TabsTrigger>
              <TabsTrigger value="authors">Authors & Institutions</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="abstract">Abstract *</Label>
                <Textarea
                  id="abstract"
                  value={formData.abstract}
                  onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                  required
                  rows={6}
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publication_type">Publication Type *</Label>
                  <Select
                    value={formData.publication_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, publication_type: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PUBLICATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PUBLICATION_STATUS.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="research_area">Research Area *</Label>
                <Select
                  value={formData.research_area}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, research_area: value }))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESEARCH_AREAS.map(area => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div>
                <Label htmlFor="journal_name">Journal/Conference Name</Label>
                <Input
                  id="journal_name"
                  value={formData.journal_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, journal_name: e.target.value }))}
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="publication_date">Publication Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-full"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.publication_date ? format(formData.publication_date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.publication_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, publication_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    value={formData.volume}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="issue">Issue</Label>
                  <Input
                    id="issue"
                    value={formData.issue}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="pages">Pages</Label>
                  <Input
                    id="pages"
                    value={formData.pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                    className="rounded-lg"
                    placeholder="e.g., 123-145"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={formData.doi}
                    onChange={(e) => setFormData(prev => ({ ...prev, doi: e.target.value }))}
                    className="rounded-lg"
                    placeholder="10.1000/182"
                  />
                </div>
                <div>
                  <Label htmlFor="pmid">PMID</Label>
                  <Input
                    id="pmid"
                    value={formData.pmid}
                    onChange={(e) => setFormData(prev => ({ ...prev, pmid: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="impact_factor">Impact Factor</Label>
                  <Input
                    id="impact_factor"
                    type="number"
                    step="0.001"
                    value={formData.impact_factor}
                    onChange={(e) => setFormData(prev => ({ ...prev, impact_factor: parseFloat(e.target.value) || 0 }))}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="pdf_url">PDF URL</Label>
                  <Input
                    id="pdf_url"
                    value={formData.pdf_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, pdf_url: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="peer_reviewed"
                    checked={formData.peer_reviewed}
                    onChange={(e) => setFormData(prev => ({ ...prev, peer_reviewed: e.target.checked }))}
                    className="rounded-sm"
                  />
                  <Label htmlFor="peer_reviewed">Peer Reviewed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="open_access"
                    checked={formData.open_access}
                    onChange={(e) => setFormData(prev => ({ ...prev, open_access: e.target.checked }))}
                    className="rounded-sm"
                  />
                  <Label htmlFor="open_access">Open Access</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="authors" className="space-y-4">
              <div>
                <Label htmlFor="corresponding_author">Corresponding Author *</Label>
                <Input
                  id="corresponding_author"
                  value={formData.corresponding_author}
                  onChange={(e) => setFormData(prev => ({ ...prev, corresponding_author: e.target.value }))}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label>Authors</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Add author name"
                    className="rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                  />
                  <Button type="button" onClick={addAuthor} className="rounded-full">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.authors.map((author, index) => (
                    <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <span className="text-sm">{author}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAuthor(index)}
                        className="h-4 w-4 p-0 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Affiliated Institutions</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newInstitution}
                    onChange={(e) => setNewInstitution(e.target.value)}
                    placeholder="Add institution"
                    className="rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInstitution())}
                  />
                  <Button type="button" onClick={addInstitution} className="rounded-full">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.affiliated_institutions.map((institution, index) => (
                    <div key={index} className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
                      <span className="text-sm">{institution}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInstitution(index)}
                        className="h-4 w-4 p-0 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <div>
                <Label>Keywords</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword"
                    className="rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" onClick={addKeyword} className="rounded-full">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      <span className="text-sm">{keyword}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyword(index)}
                        className="h-4 w-4 p-0 hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="funding_source">Funding Source</Label>
                <Textarea
                  id="funding_source"
                  value={formData.funding_source}
                  onChange={(e) => setFormData(prev => ({ ...prev, funding_source: e.target.value }))}
                  rows={3}
                  className="rounded-lg"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" className="rounded-full">
              {publication ? 'Update Publication' : 'Create Publication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}