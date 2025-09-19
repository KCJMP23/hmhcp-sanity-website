"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  MapPin,
  Building,
  Clock,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/cms/content/management/StatusBadge"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { logger } from '@/lib/logger';

interface Career {
  id: string
  title: string
  slug: string
  department: string
  location: string
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience_level: 'entry' | 'mid' | 'senior' | 'executive'
  salary_range: {
    min: number
    max: number
    currency: string
  } | null
  description: string
  requirements: string[]
  benefits: string[]
  status: 'active' | 'draft' | 'closed'
  posted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  application_count: number
}

export function CareersManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCareers, setSelectedCareers] = useState<string[]>([])

  useEffect(() => {
    fetchCareers()
  }, [currentPage, statusFilter, departmentFilter, searchQuery])

  const fetchCareers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchQuery,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(departmentFilter !== "all" && { department: departmentFilter })
      })

      const response = await fetch(`/api/cms/careers?${params}`)

      if (!response.ok) throw new Error("Failed to fetch careers")

      const data = await response.json()
      setCareers(data.careers || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      logger.error("Error fetching careers:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return

    try {
      const response = await fetch(`/api/cms/careers/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete career")
      
      fetchCareers()
    } catch (error) {
      logger.error("Error deleting career:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleStatusChange = async (id: string, status: 'active' | 'closed') => {
    try {
      const response = await fetch(`/api/cms/careers/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error("Failed to update status")
      
      fetchCareers()
    } catch (error) {
      logger.error("Error updating status:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const getEmploymentTypeLabel = (type: string) => {
    const labels = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getExperienceLevelLabel = (level: string) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive'
    }
    return labels[level as keyof typeof labels] || level
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
          <h1 className="text-3xl font-bold">Careers Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage job postings and applications
          </p>
        </div>
        <Link href="/admin/cms/careers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold">{careers.filter(c => c.status === 'active').length}</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold">{careers.reduce((sum, c) => sum + c.application_count, 0)}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Departments</p>
              <p className="text-2xl font-bold">{new Set(careers.map(c => c.department)).size}</p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Locations</p>
              <p className="text-2xl font-bold">{new Set(careers.map(c => c.location)).size}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
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
                placeholder="Search jobs..."
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
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border bg-white dark:bg-gray-800"
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="sales">Sales</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
              <option value="hr">Human Resources</option>
            </select>
          </div>

          {/* Jobs Table */}
          <div className="overflow-x-hidden">
            <div className="w-full overflow-x-auto"><table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Position</th>
                  <th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Location</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Applications</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Posted</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {careers.map((career) => (
                  <tr key={career.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/cms/careers/edit/${career.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {career.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {getExperienceLevelLabel(career.experience_level)}
                          {career.salary_range && (
                            <span className="ml-2">
                              • ${career.salary_range.min.toLocaleString()}-${career.salary_range.max.toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{career.department}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{career.location}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700">
                        {getEmploymentTypeLabel(career.employment_type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        {career.application_count}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge 
                        status={career.status === 'active' ? 'published' : career.status} 
                        size="sm" 
                      />
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-500">
                        {career.posted_at 
                          ? format(new Date(career.posted_at), "MMM d, yyyy")
                          : "Not posted"
                        }
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/cms/careers/edit/${career.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/cms/careers/${career.id}/applications`}>
                          <Button variant="ghost" size="sm">
                            <Users className="h-4 w-4" />
                          </Button>
                        </Link>
                        {career.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(career.id, 'closed')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(career.id, 'active')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(career.id)}
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
              Showing {careers.length} of {totalPages * 10} jobs
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