"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  User,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/cms/content/management/StatusBadge"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { logger } from '@/lib/logger';

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: any
  status: 'draft' | 'review' | 'published' | 'scheduled' | 'archived'
  author: {
    id: string
    name: string
    email: string
  }
  category: {
    id: string
    name: string
    slug: string
  } | null
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  featured_image: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  view_count: number
}

export function BlogManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])

  useEffect(() => {
    fetchPosts()
  }, [currentPage, statusFilter, categoryFilter, searchQuery])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchQuery,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(categoryFilter !== "all" && { category: categoryFilter })
      })

      const response = await fetch(`/api/cms/blog?${params}`)

      if (!response.ok) throw new Error("Failed to fetch blog posts")

      const data = await response.json()
      setPosts(data.posts || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      logger.error("Error fetching blog posts:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      const response = await fetch(`/api/cms/blog/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error("Failed to delete blog post")
      
      fetchPosts()
    } catch (error) {
      logger.error("Error deleting blog post:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedPosts.length) return
    if (!confirm(`Delete ${selectedPosts.length} selected posts?`)) return

    try {
      const response = await fetch(`/api/cms/blog/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: selectedPosts })
      })

      if (!response.ok) throw new Error("Failed to delete posts")
      
      setSelectedPosts([])
      fetchPosts()
    } catch (error) {
      logger.error("Error deleting posts:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const togglePostSelection = (id: string) => {
    setSelectedPosts(prev =>
      prev.includes(id)
        ? prev.filter(postId => postId !== id)
        : [...prev, id]
    )
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
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage blog posts
          </p>
        </div>
        <Link href="/admin/cms/blog/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
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
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border bg-white dark:bg-gray-800"
            >
              <option value="all">All Categories</option>
              <option value="news">News</option>
              <option value="insights">Insights</option>
              <option value="updates">Updates</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedPosts.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20">
              <span className="text-sm font-medium">
                {selectedPosts.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </div>
          )}

          {/* Posts Table */}
          <div className="overflow-x-hidden">
            <div className="w-full overflow-x-auto"><table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPosts(posts.map(p => p.id))
                        } else {
                          setSelectedPosts([])
                        }
                      }}
                      checked={selectedPosts.length === posts.length && posts.length > 0}
                    />
                  </th>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Author</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Views</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/cms/blog/edit/${post.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {post.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">/{post.slug}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{post.author.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {post.category ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={post.status} size="sm" />
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.created_at), "MMM d, yyyy")}
                        </div>
                        {post.published_at && (
                          <div className="flex items-center gap-1 text-blue-600 mt-1">
                            <CheckCircle className="h-3 w-3" />
                            Published
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="h-3 w-3" />
                        {post.view_count}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/cms/blog/edit/${post.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/blog/${post.slug}`} >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
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
              Showing {posts.length} of {totalPages * 10} posts
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