"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  FileSearch,
  Building,
  Target,
  TrendingUp,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Download,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/cms/content/management/StatusBadge"
import { useCMSAuth } from "@/features/cms-auth/hooks/useCMSAuth"
import { format } from "date-fns"
import { logger } from '@/lib/logger';

interface CaseStudy {
  id: string
  title: string
  slug: string
  client_name: string
  industry: string
  challenge: string
  solution: string
  results: {
    metric: string
    value: string
    improvement: string
  }[]
  technologies: string[]
  duration: string
  team_size: number
  featured_image: string | null
  pdf_download: string | null
  status: 'draft' | 'review' | 'published' | 'archived'
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  view_count: number
  download_count: number
}

export function StudiesManagement() {
  const router = useRouter()
  const { user } = useCMSAuth()
  const [studies, setStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStudies, setSelectedStudies] = useState<string[]>([])

  useEffect(() => {
    fetchStudies()
  }, [currentPage, statusFilter, industryFilter, searchQuery])

  const fetchStudies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchQuery,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(industryFilter !== "all" && { industry: industryFilter })
      })

      const response = await fetch(`/api/cms/studies?${params}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      })

      if (!response.ok) throw new Error("Failed to fetch case studies")

      const data = await response.json()
      setStudies(data.studies || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      logger.error("Error fetching studies:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this case study?")) return

    try {
      const response = await fetch(`/api/cms/studies/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      })

      if (!response.ok) throw new Error("Failed to delete study")
      
      fetchStudies()
    } catch (error) {
      logger.error("Error deleting study:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/cms/studies/${id}/featured`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ featured: !featured })
      })

      if (!response.ok) throw new Error("Failed to update featured status")
      
      fetchStudies()
    } catch (error) {
      logger.error("Error updating featured status:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const getIndustryColor = (industry: string) => {
    const colors: Record<string, string> = {
      'Healthcare': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'Finance': 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      'Technology': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'Retail': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'Manufacturing': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
    return colors[industry] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Case Studies</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Showcase client success stories and results
          </p>
        </div>
        <Link href="/admin/cms/studies/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Study
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published Studies</p>
              <p className="text-2xl font-bold">{studies.filter(s => s.status === 'published').length}</p>
            </div>
            <FileSearch className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold">{studies.reduce((sum, s) => sum + s.view_count, 0)}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Downloads</p>
              <p className="text-2xl font-bold">{studies.reduce((sum, s) => sum + s.download_count, 0)}</p>
            </div>
            <Download className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Featured</p>
              <p className="text-2xl font-bold">{studies.filter(s => s.featured).length}</p>
            </div>
            <Award className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search studies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-3 py-2 border bg-white dark:bg-gray-800"
            >
              <option value="all">All Industries</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Technology">Technology</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
            </select>
          </div>

          {/* Studies Table */}
          <div className="overflow-x-hidden">
            <div className="w-full overflow-x-auto"><table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Case Study</th>
                  <th className="text-left p-4">Client</th>
                  <th className="text-left p-4">Industry</th>
                  <th className="text-left p-4">Metrics</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Stats</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((study) => (
                  <tr key={study.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/cms/studies/edit/${study.id}`}
                          className="font-medium hover:text-blue-600 flex items-center gap-2"
                        >
                          {study.title}
                          {study.featured && (
                            <Award className="h-4 w-4 text-blue-500" />
                          )}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {study.duration} • {study.team_size} team members
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{study.client_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1  text-xs ${getIndustryColor(study.industry)}`}>
                        {study.industry}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {study.results.slice(0, 2).map((result, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-blue-600" />
                            <span className="font-medium">{result.improvement}</span>
                            <span className="text-gray-500">{result.metric}</span>
                          </div>
                        ))}
                        {study.results.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{study.results.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={study.status} size="sm" />
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye className="h-3 w-3" />
                          {study.view_count} views
                        </div>
                        {study.pdf_download && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Download className="h-3 w-3" />
                            {study.download_count} downloads
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/cms/studies/edit/${study.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/case-studies/${study.slug}`} >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(study.id, study.featured)}
                        >
                          <Award className={`h-4 w-4 ${study.featured ? 'text-blue-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(study.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {studies.length} of {totalPages * 10} studies
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}