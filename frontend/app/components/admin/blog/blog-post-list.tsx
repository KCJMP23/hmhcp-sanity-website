'use client'

import { useState } from 'react'
import { Edit as PencilIcon, Trash2 as TrashIcon, Eye as EyeIcon, Zap, Workflow, Edit3 } from 'lucide-react'
import { BlogPost } from '@/types/blog'

interface BlogPostListProps {
  posts: BlogPost[]
  onEdit: (post: BlogPost) => void
  onDelete: (postId: string) => void
}

// Mock data for testing when no posts exist
const MOCK_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Indulge in Sweetness: Hot Honey Infused Desserts to Try!',
    slug: 'hot-honey-desserts',
    content: 'Discover the perfect balance of sweet and spicy with these hot honey dessert recipes...',
    excerpt: 'Transform your dessert game with hot honey! Discover recipes, tips, and sweet-spicy treats like flourless cake, crème brûlée, and pecan pie.',
    status: 'published',
    featuredImage: '/images/hot-honey-desserts.png',
    author: 'Teddy Danielson',
    publishedAt: '2025-07-31T10:00:00Z',
    updatedAt: '2025-07-31T18:30:00Z',
    tags: ['dessert', 'hot honey', 'recipes']
  },
  {
    id: '2',
    title: 'Hot Honey Glazes for Grilled Meats: Elevate Your BBQ Game',
    slug: 'hot-honey-bbq-glazes',
    content: 'Take your grilling to the next level with these hot honey glazes...',
    excerpt: 'Elevate your BBQ with hot honey glazes that add the perfect sweet-spicy kick to grilled meats.',
    status: 'published',
    featuredImage: '/images/hot-honey-bbq-feat.png',
    author: 'Teddy Danielson',
    publishedAt: '2025-07-31T08:00:00Z',
    updatedAt: '2025-07-31T16:45:00Z',
    tags: ['bbq', 'grilling', 'hot honey', 'meat']
  },
  {
    id: '3',
    title: 'Hot Honey in Smoothies and Bowls: Adding a Spicy Kick',
    slug: 'hot-honey-smoothies',
    content: 'Revolutionize your morning routine with hot honey smoothies...',
    excerpt: 'Add a spicy kick to your healthy breakfast with hot honey smoothies and bowls.',
    status: 'published',
    featuredImage: '/images/hot-honey-smoothies.png',
    author: 'Teddy Danielson',
    publishedAt: '2025-05-06T00:00:00Z',
    updatedAt: '2025-05-06T00:00:00Z',
    tags: ['smoothies', 'breakfast', 'healthy', 'hot honey']
  },
  {
    id: '4',
    title: 'Vegan Hot Honey Alternatives: Plant-Based Options Explored',
    slug: 'vegan-hot-honey',
    content: 'Explore plant-based alternatives to traditional hot honey...',
    excerpt: 'Discover delicious vegan alternatives to hot honey that maintain the same sweet-spicy profile.',
    status: 'draft',
    featuredImage: undefined,
    author: 'Teddy Danielson',
    publishedAt: '2025-07-30T15:00:00Z',
    updatedAt: '2025-07-30T15:00:00Z',
    tags: ['vegan', 'plant-based', 'alternatives']
  }
]

export default function BlogPostList({ posts, onEdit, onDelete }: BlogPostListProps) {
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  
  // Use mock data if no posts provided
  const displayPosts = posts.length > 0 ? posts : MOCK_POSTS

  const handleSelectAll = () => {
    if (selectedPosts.size === displayPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(displayPosts.map(p => p.id)))
    }
  }

  const handleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  const handleBulkAction = (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedPosts.size === 0) return
    
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedPosts.size} post(s)?`)) return
      selectedPosts.forEach(postId => onDelete(postId))
      setSelectedPosts(new Set())
    } else {
      // Handle bulk publish/unpublish
      console.log(`${action} ${selectedPosts.size} posts`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const renderSourceBadge = (post: BlogPost) => {
    // Check for source field or aiGenerated flag
    const source = (post as any).source || (post.aiGenerated ? 'ai' : 'manual')
    
    switch (source) {
      case 'make.com':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Workflow className="h-3 w-3 mr-1" />
            Make.com
          </span>
        )
      case 'zapier':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Zap className="h-3 w-3 mr-1" />
            Zapier
          </span>
        )
      case 'ai':
      case 'ai_generated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <Workflow className="h-3 w-3 mr-1" />
            AI Generated
          </span>
        )
      case 'api':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
            <Workflow className="h-3 w-3 mr-1" />
            API
          </span>
        )
      case 'manual':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Edit3 className="h-3 w-3 mr-1" />
            Manual
          </span>
        )
    }
  }

  if (displayPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating your first blog post.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Unpublish
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPosts.size === displayPosts.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visibility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Blog
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Published
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedPosts.has(post.id)}
                    onChange={() => handleSelectPost(post.id)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {post.featuredImage ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={post.featuredImage}
                          alt={post.title}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">{post.excerpt}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    post.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {post.status === 'published' ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderSourceBadge(post)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {post.author}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Default Blog
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(post.updatedAt)} at {formatTime(post.updatedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.publishedAt ? formatDate(post.publishedAt) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      className="text-gray-400 hover:text-gray-600"
                      title="View post"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(post)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit post"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(post.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete post"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{displayPosts.length}</span> of{' '}
            <span className="font-medium">{displayPosts.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              &lt;
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">1-{displayPosts.length}</span>
            <button className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
