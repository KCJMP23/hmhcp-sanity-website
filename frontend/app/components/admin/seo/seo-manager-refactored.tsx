'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { SEOAnalysis, SEOFormData, SEOFilters, SEOPagination } from './seo-manager/types'
import { SEOFiltersComponent } from './seo-manager/seo-filters'
import { SEOTable } from './seo-manager/seo-table'
import { SEOFormDialog } from './seo-manager/seo-form-dialog'

export function SEOManager() {

  // State management
  const [seoData, setSeoData] = useState<SEOAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState<SEOFilters>({
    search: '',
    score_range: '',
    content_type: ''
  })
  const [pagination, setPagination] = useState<SEOPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SEOAnalysis | null>(null)
  const [formData, setFormData] = useState<Partial<SEOFormData>>({})
  const [contentPages, setContentPages] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any>(null)

  // Load SEO data
  const loadSEOData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const response = await fetch(`/api/admin/seo?${params}`)
      if (!response.ok) throw new Error('Failed to load SEO data')

      const data = await response.json()
      setSeoData(data.data || [])
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch (error) {
      console.error('Error loading SEO data:', error)
      toast.error('Failed to load SEO data')
    } finally {
      setLoading(false)
    }
  }

  // Load content pages for dropdown
  const loadContentPages = async () => {
    try {
      const response = await fetch('/api/admin/content/enhanced?limit=100')
      if (response.ok) {
        const data = await response.json()
        setContentPages(data.data || [])
      }
    } catch (error) {
      console.error('Error loading content pages:', error)
    }
  }

  useEffect(() => {
    loadSEOData()
  }, [pagination.page, filters])

  useEffect(() => {
    loadContentPages()
  }, [])

  // Get CSRF token
  const getCSRFToken = async () => {
    try {
      const response = await fetch('/api/csrf-token')
      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
      return ''
    }
  }

  // Run SEO analysis
  const runSEOAnalysis = async (contentId: string) => {
    try {
      setAnalyzing(contentId)
      const response = await fetch('/api/admin/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ content_id: contentId })
      })

      if (!response.ok) throw new Error('Failed to run SEO analysis')

      const result = await response.json()
      toast.success(`Analysis Complete: SEO score: ${result.seo_score}/100. ${result.recommendations.length} recommendations generated.`)

      loadSEOData()
    } catch (error) {
      console.error('Error running SEO analysis:', error)
      toast.error('Failed to run SEO analysis')
    } finally {
      setAnalyzing(null)
    }
  }

  // Bulk SEO analysis
  const runBulkAnalysis = async () => {
    if (selectedItems.length === 0) {
      toast.error('No Selection: Please select items to analyze')
      return
    }

    try {
      setAnalyzing('bulk')
      const response = await fetch('/api/admin/seo/analyze-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({ content_ids: selectedItems })
      })

      if (!response.ok) throw new Error('Failed to run bulk analysis')

      const result = await response.json()
      toast.success(`Bulk Analysis Complete: ${result.successful} pages analyzed, ${result.failed} failed`)

      setSelectedItems([])
      loadSEOData()
    } catch (error) {
      console.error('Error with bulk analysis:', error)
      toast.error('Failed to run bulk analysis')
    } finally {
      setAnalyzing(null)
    }
  }

  // Save SEO settings
  const saveSEOSettings = async () => {
    try {
      const response = await fetch('/api/admin/seo', {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCSRFToken()
        },
        body: JSON.stringify({
          ...(editingItem && { id: editingItem.id }),
          ...formData
        })
      })

      if (!response.ok) throw new Error('Failed to save SEO settings')

      toast.success('SEO settings saved successfully')

      setIsEditDialogOpen(false)
      setEditingItem(null)
      setFormData({})
      loadSEOData()
    } catch (error) {
      console.error('Error saving SEO settings:', error)
      toast.error('Failed to save SEO settings')
    }
  }

  // Generate social media preview
  const generatePreview = (item: SEOAnalysis, platform: 'facebook' | 'twitter' | 'linkedin') => {
    const data = {
      facebook: {
        title: item.og_title || item.meta_title,
        description: item.og_description || item.meta_description,
        image: item.og_image,
        url: item.page_url
      },
      twitter: {
        title: item.twitter_title || item.meta_title,
        description: item.twitter_description || item.meta_description,
        image: item.twitter_image || item.og_image,
        card: item.twitter_card
      },
      linkedin: {
        title: item.og_title || item.meta_title,
        description: item.og_description || item.meta_description,
        image: item.og_image,
        url: item.page_url
      }
    }

    setPreviewData({ platform, ...data[platform] })
  }

  // Handle editing
  const handleEdit = (item: SEOAnalysis) => {
    setEditingItem(item)
    setFormData({
      content_id: item.content_id,
      meta_title: item.meta_title,
      meta_description: item.meta_description,
      meta_keywords: item.meta_keywords,
      og_title: item.og_title,
      og_description: item.og_description,
      og_image: item.og_image,
      og_type: item.og_type,
      twitter_card: item.twitter_card,
      twitter_title: item.twitter_title,
      twitter_description: item.twitter_description,
      twitter_image: item.twitter_image,
      canonical_url: item.canonical_url,
      robots_meta: item.robots_meta,
      schema_markup: item.schema_markup
    })
    setIsEditDialogOpen(true)
  }

  // Handle add new
  const handleAddNew = () => {
    setEditingItem(null)
    setFormData({})
    setIsEditDialogOpen(true)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      {/* Filters and Header */}
      <SEOFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        selectedCount={selectedItems.length}
        onBulkAnalysis={runBulkAnalysis}
        onAddNew={handleAddNew}
        analyzing={analyzing}
      />

      {/* SEO Data Table */}
      <SEOTable
        seoData={seoData}
        loading={loading}
        analyzing={analyzing}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onEdit={handleEdit}
        onAnalyze={runSEOAnalysis}
        onGeneratePreview={generatePreview}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Edit SEO Dialog */}
      <SEOFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingItem(null)
          setFormData({})
        }}
        editingItem={editingItem}
        formData={formData}
        onFormDataChange={setFormData}
        contentPages={contentPages}
        onSave={saveSEOSettings}
      />
    </div>
  )
}