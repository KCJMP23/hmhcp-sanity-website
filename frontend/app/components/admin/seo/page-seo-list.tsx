'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Search,
  Edit,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Plus
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { PageSEOEditor } from './page-seo-editor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PageSEO } from '@/lib/seo/seo-manager'

export function PageSEOList() {
  const [pages, setPages] = useState<PageSEO[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPage, setSelectedPage] = useState<PageSEO | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [newPagePath, setNewPagePath] = useState('')
  const [showNewPage, setShowNewPage] = useState(false)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/seo/pages')
      const data = await res.json()
      setPages(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load page SEO data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (page: PageSEO) => {
    setSelectedPage(page)
    setShowEditor(true)
  }

  const handleNewPage = () => {
    if (!newPagePath.startsWith('/')) {
      toast({
        title: 'Error',
        description: 'Page path must start with /',
        variant: 'destructive'
      })
      return
    }

    setSelectedPage({
      page_path: newPagePath,
      meta_title: '',
      meta_description: '',
      meta_keywords: [],
      twitter_card: 'summary_large_image',
      no_index: false,
      no_follow: false
    })
    setShowEditor(true)
    setShowNewPage(false)
    setNewPagePath('')
  }

  const filteredPages = pages.filter(page =>
    page.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.meta_title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSEOScore = (page: PageSEO) => {
    let score = 0
    if (page.meta_title && page.meta_title.length >= 30 && page.meta_title.length <= 60) score += 25
    if (page.meta_description && page.meta_description.length >= 120 && page.meta_description.length <= 160) score += 25
    if (page.meta_keywords && page.meta_keywords.length > 0) score += 15
    if (page.og_title && page.og_description) score += 20
    if (page.schema_markup) score += 15
    return score
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <AlertCircle className="h-4 w-4" />
    return <XCircle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-sm border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowNewPage(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Page
        </Button>
      </div>

      <div className="space-y-4">
        {filteredPages.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pages found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Add your first page SEO settings'}
            </p>
          </Card>
        ) : (
          filteredPages.map((page) => {
            const score = getSEOScore(page)
            return (
              <Card key={page.page_path} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{page.page_path}</h4>
                      <div className={`flex items-center gap-1 ${getScoreColor(score)}`}>
                        {getScoreIcon(score)}
                        <span className="text-sm font-medium">{score}%</span>
                      </div>
                      {page.no_index && (
                        <Badge variant="secondary" className="text-xs">
                          No Index
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {page.meta_title || 'No title set'}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {page.meta_description || 'No description set'}
                    </p>
                    {page.meta_keywords && page.meta_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {page.meta_keywords.slice(0, 3).map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {page.meta_keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{page.meta_keywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Page SEO: {selectedPage?.page_path}
            </DialogTitle>
          </DialogHeader>
          {selectedPage && (
            <PageSEOEditor
              pagePath={selectedPage.page_path}
              onSave={() => {
                setShowEditor(false)
                fetchPages()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNewPage} onOpenChange={setShowNewPage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Page SEO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="page_path">Page Path</Label>
              <Input
                id="page_path"
                value={newPagePath}
                onChange={(e) => setNewPagePath(e.target.value)}
                placeholder="/example-page"
              />
              <p className="text-sm text-gray-600 mt-1">
                Enter the URL path for the page (must start with /)
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewPage(false)}>
                Cancel
              </Button>
              <Button onClick={handleNewPage}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}