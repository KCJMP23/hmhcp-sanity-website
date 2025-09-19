'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, BookOpen, Database, Edit, Eye } from 'lucide-react'
import { DashboardWidget } from './dashboard-widget'
import type { ContentManagementProps } from './types'

export function ContentManagement({ stats, isLoading, formatDate }: ContentManagementProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Recent Pages */}
      <DashboardWidget 
        title="Recent Pages" 
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/content">Manage All</Link>
          </Button>
        }
      >
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading pages...</div>
          ) : stats.recentPages.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No pages yet. <Link href="/admin/content/new" className="text-blue-600 hover:text-blue-700">Create your first page</Link>.
            </div>
          ) : (
            stats.recentPages.map((page: any) => (
              <div key={page.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{page.title}</p>
                    <p className="text-xs text-gray-500">
                      {page.status} • {page.updatedAt ? formatDate(page.updatedAt) : 'No date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/content/edit/${page.id}`}>
                      <Edit className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/${page.slug}`} >
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardWidget>

      {/* Recent Posts */}
      <DashboardWidget 
        title="Recent Blog Posts" 
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/blog">Manage All</Link>
          </Button>
        }
      >
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading posts...</div>
          ) : stats.recentPosts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No posts yet. <Link href="/admin/content/posts/new" className="text-blue-600 hover:text-blue-700">Write your first post</Link>.
            </div>
          ) : (
            stats.recentPosts.map((post: any) => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <BookOpen className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-500">
                      {post.status} • {post.updatedAt ? formatDate(post.updatedAt) : 'No date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/content/edit/${post.id}`}>
                      <Edit className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/blog/${post.slug}`} >
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardWidget>

      {/* Recent Media */}
      <DashboardWidget 
        title="Recent Media" 
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/media">Manage All</Link>
          </Button>
        }
      >
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading media...</div>
          ) : stats.recentMedia.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No media yet. <Link href="/admin/media" className="text-blue-600 hover:text-blue-700">Upload your first file</Link>.
            </div>
          ) : (
            stats.recentMedia.map((media: any) => (
              <div key={media.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Database className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{media.original_name || media.filename}</p>
                    <p className="text-xs text-gray-500">
                      {media.mime_type} • {media.file_size ? (media.file_size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={media.public_url} >
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardWidget>
    </div>
  )
}