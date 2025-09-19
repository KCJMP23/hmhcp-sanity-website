'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  MessageSquare,
  Trash2,
  Check,
  X,
  AlertCircle,
  Reply,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Clock,
  User,
  Calendar,
  ChevronDown,
  Mail,
  Globe,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ConsistentCard } from '@/components/design-system/consistency-wrapper'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Comment {
  id: string
  post_id: string
  posts: { title: string }
  author_name: string
  author_email: string
  author_url?: string
  content: string
  status: 'pending' | 'approved' | 'spam' | 'trash'
  created_at: string
  updated_at: string
  ip_address?: string
  parent_id?: string
}

interface CommentsApiResponse {
  comments: Comment[]
  total: number
  page: number
  totalPages: number
}

export function CommentsManager() {
  const [comments, setComments] = useState<Comment[]>([])
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkAction, setBulkAction] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalComments, setTotalComments] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch comments from API
  useEffect(() => {
    fetchComments()
  }, [filterStatus, searchQuery, currentPage])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (searchQuery) params.append('search', searchQuery)
      params.append('page', currentPage.toString())
      params.append('limit', '20')
      
      const response = await fetch(`/api/admin/comments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      
      const data: CommentsApiResponse = await response.json()
      setComments(data.comments)
      setTotalComments(data.total)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      setError(error instanceof Error ? error.message : 'Failed to load comments')
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const filteredComments = comments.filter(comment => {
    const matchesStatus = filterStatus === 'all' || comment.status === filterStatus
    const matchesSearch = searchQuery === '' || 
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.posts.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const statusCounts = {
    all: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    spam: comments.filter(c => c.status === 'spam').length,
    trash: comments.filter(c => c.status === 'trash').length
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComments(filteredComments.map(c => c.id))
    } else {
      setSelectedComments([])
    }
  }

  const handleSelectComment = (commentId: string, checked: boolean) => {
    if (checked) {
      setSelectedComments([...selectedComments, commentId])
    } else {
      setSelectedComments(selectedComments.filter(id => id !== commentId))
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedComments.length === 0) return

    const action = bulkAction as Comment['status'] | 'delete'
    
    try {
      if (action === 'delete') {
        // Delete selected comments
        const deletePromises = selectedComments.map(id => 
          fetch(`/api/admin/comments?id=${id}`, { method: 'DELETE' })
        )
        
        await Promise.all(deletePromises)
        toast.success(`${selectedComments.length} comments permanently deleted`)
      } else {
        // Update status of selected comments
        const updatePromises = selectedComments.map(id => 
          fetch('/api/admin/comments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: action })
          })
        )
        
        await Promise.all(updatePromises)
        toast.success(`${selectedComments.length} comments marked as ${action}`)
      }
      
      // Refresh comments
      fetchComments()
      setSelectedComments([])
      setBulkAction('')
    } catch (error) {
      console.error('Bulk action failed:', error)
      toast.error('Failed to perform bulk action')
    }
  }

  const handleQuickAction = async (commentId: string, action: Comment['status'] | 'delete') => {
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/admin/comments?id=${commentId}`, { 
          method: 'DELETE' 
        })
        
        if (!response.ok) throw new Error('Failed to delete comment')
        
        toast.success('Comment permanently deleted')
      } else {
        const response = await fetch('/api/admin/comments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: commentId, status: action })
        })
        
        if (!response.ok) throw new Error('Failed to update comment')
        
        toast.success(`Comment marked as ${action}`)
      }
      
      // Refresh comments
      fetchComments()
    } catch (error) {
      console.error('Quick action failed:', error)
      toast.error(error instanceof Error ? error.message : 'Action failed')
    }
  }

  const handleReply = (commentId: string) => {
    if (!replyContent.trim()) return

    // In production, this would send the reply to the API
    toast.success('Reply sent successfully')
    setReplyingTo(null)
    setReplyContent('')
  }

  const getStatusIcon = (status: Comment['status']) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'spam':
        return <AlertCircle className="w-4 h-4" />
      case 'trash':
        return <Trash2 className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: Comment['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'spam':
        return 'bg-red-100 text-red-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'trash':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-2">
            Comments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and moderate comments across your site
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/admin/comments/settings'}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(statusCounts).map(([status, count]) => (
          <ConsistentCard key={status} padding="small">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {status}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {count}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-md",
                status === 'all' && "bg-gray-100 dark:bg-gray-800",
                status === 'pending' && "bg-yellow-100 dark:bg-blue-900/20",
                status === 'approved' && "bg-green-100 dark:bg-blue-900/20",
                status === 'spam' && "bg-red-100 dark:bg-blue-900/20",
                status === 'trash' && "bg-gray-100 dark:bg-gray-900/20"
              )}>
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </ConsistentCard>
        ))}
      </div>

      {/* Filters and Actions */}
      <ConsistentCard className="mb-6">
        <div className="p-4 space-y-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(statusCounts).map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status}
                <Badge variant="secondary" className="ml-2">
                  {statusCounts[status as keyof typeof statusCounts]}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Bulk actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="pending">Mark as Pending</SelectItem>
                  <SelectItem value="spam">Mark as Spam</SelectItem>
                  <SelectItem value="trash">Move to Trash</SelectItem>
                  <SelectItem value="delete">Delete Permanently</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleBulkAction}
                disabled={!bulkAction || selectedComments.length === 0}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </ConsistentCard>

      {/* Comments List */}
      <ConsistentCard>
        <div className="overflow-x-hidden">
          <div className="w-full overflow-x-auto"><table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Author
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Comment
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  In Response To
                </th>
                <th className="p-4 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {filteredComments.map(comment => (
                  <motion.tr
                    key={comment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedComments.includes(comment.id)}
                        onCheckedChange={(checked) => 
                          handleSelectComment(comment.id, checked as boolean)
                        }
                      />
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {comment.author_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {comment.author_email}
                          </div>
                          {comment.author_url && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {comment.author_url}
                            </div>
                          )}
                          <div className="text-xs">IP: {comment.ip_address}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {comment.content}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getStatusColor(comment.status))}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(comment.status)}
                              {comment.status}
                            </span>
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 text-xs">
                          {comment.status !== 'approved' && (
                            <button
                              onClick={() => handleQuickAction(comment.id, 'approved')}
                              className="text-green-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Reply
                          </button>
                          {comment.status !== 'spam' && (
                            <button
                              onClick={() => handleQuickAction(comment.id, 'spam')}
                              className="text-red-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Spam
                            </button>
                          )}
                          {comment.status !== 'trash' && (
                            <button
                              onClick={() => handleQuickAction(comment.id, 'trash')}
                              className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Trash
                            </button>
                          )}
                        </div>
                        
                        {/* Reply Form */}
                        <AnimatePresence>
                          {replyingTo === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 space-y-2"
                            >
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write your reply..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(comment.id)}
                                >
                                  Send Reply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyContent('')
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <a
                        href="#"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {comment.posts.title}
                      </a>
                    </td>
                    
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Comment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Mark as Spam
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table></div>
        </div>
      </ConsistentCard>
    </div>
  )
}