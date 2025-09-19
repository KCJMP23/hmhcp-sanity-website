'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Edit,
  Loader2,
  AlertCircle,
  Zap,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react'
import type { SEOAnalysis, SEOPagination } from './types'
import { SEO_SCORE_RANGES } from './types'

interface SEOTableProps {
  seoData: SEOAnalysis[]
  loading: boolean
  analyzing: string | null
  selectedItems: string[]
  onSelectionChange: (items: string[]) => void
  onEdit: (item: SEOAnalysis) => void
  onAnalyze: (contentId: string) => void
  onGeneratePreview: (item: SEOAnalysis, platform: 'facebook' | 'twitter' | 'linkedin') => void
  pagination: SEOPagination
  onPageChange: (page: number) => void
}

export function SEOTable({
  seoData,
  loading,
  analyzing,
  selectedItems,
  onSelectionChange,
  onEdit,
  onAnalyze,
  onGeneratePreview,
  pagination,
  onPageChange
}: SEOTableProps) {
  // Get SEO score badge
  const getSEOScoreBadge = (score: number) => {
    let scoreData = SEO_SCORE_RANGES.poor
    if (score >= 90) scoreData = SEO_SCORE_RANGES.excellent
    else if (score >= 70) scoreData = SEO_SCORE_RANGES.good
    else if (score >= 50) scoreData = SEO_SCORE_RANGES.fair

    return (
      <Badge className={`${scoreData.color} text-xs rounded-md`}>
        {score}/100 - {scoreData.label}
      </Badge>
    )
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-text">Pages & SEO Analysis</CardTitle>
        <CardDescription>
          {pagination.total} total pages • Page {pagination.page} of {pagination.totalPages}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === seoData.length && seoData.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectionChange(seoData.map(item => item.id))
                        } else {
                          onSelectionChange([])
                        }
                      }}
                      className="rounded-sm"
                    />
                  </TableHead>
                  <TableHead>Page & Title</TableHead>
                  <TableHead>SEO Score</TableHead>
                  <TableHead>Meta Information</TableHead>
                  <TableHead>Social Media</TableHead>
                  <TableHead>Last Analysis</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seoData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onSelectionChange([...selectedItems, item.id])
                          } else {
                            onSelectionChange(selectedItems.filter(id => id !== item.id))
                          }
                        }}
                        className="rounded-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-text font-medium text-gray-900 dark:text-white">
                          {item.meta_title || item.content?.title || 'No Title'}
                        </div>
                        <div className="text-sm text-blue-600 hover:text-blue-800">
                          <a href={item.page_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            {item.page_url}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                        {item.content && (
                          <Badge variant="outline" className="text-xs rounded-md">
                            {item.content.type}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getSEOScoreBadge(item.seo_score)}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-lg" 
                            style={{ width: `${Math.min(item.seo_score, 100)}%` }}
                          />
                        </div>
                        {item.issues.length > 0 && (
                          <div className="flex items-center text-xs text-red-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {item.issues.length} issues
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium">Title:</span>
                          <span className={`ml-1 ${item.title_length > 60 ? 'text-red-600' : 'text-green-600'}`}>
                            {item.title_length} chars
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Desc:</span>
                          <span className={`ml-1 ${item.description_length > 160 ? 'text-red-600' : 'text-green-600'}`}>
                            {item.description_length} chars
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Keywords:</span>
                          <span className="ml-1">{item.keywords_count}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGeneratePreview(item, 'facebook')}
                          className="p-1 rounded-md"
                        >
                          <Facebook className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGeneratePreview(item, 'twitter')}
                          className="p-1 rounded-md"
                        >
                          <Twitter className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGeneratePreview(item, 'linkedin')}
                          className="p-1 rounded-md"
                        >
                          <Linkedin className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {item.last_analyzed ? formatDate(item.last_analyzed) : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(item)}
                          className="rounded-lg"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAnalyze(item.content_id)}
                          disabled={analyzing === item.content_id}
                          className="rounded-lg"
                        >
                          {analyzing === item.content_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="rounded-lg"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}