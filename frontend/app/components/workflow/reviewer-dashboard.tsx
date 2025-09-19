'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Scale,
  FileText,
  User,
  Calendar,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  ChevronRight,
  Star,
  TrendingUp,
  Target,
  Activity,
  Award,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import WorkflowStatusIndicator from './workflow-status-indicator'
import type { ContentReview, WorkflowInstance, ContentComment } from '@/lib/dal/workflow'

interface ReviewerDashboardProps {
  currentUserId: string
  reviews: ContentReview[]
  workflowInstances: WorkflowInstance[]
  comments: ContentComment[]
  onAcceptReview?: (reviewId: string, feedback?: string) => Promise<void>
  onRejectReview?: (reviewId: string, feedback: string, changes: any[]) => Promise<void>
  onRequestChanges?: (reviewId: string, feedback: string, changes: any[]) => Promise<void>
  onAssignReview?: (contentId: string, reviewerId: string, reviewType: string) => Promise<void>
  className?: string
}

type SortField = 'due_date' | 'priority' | 'created_at' | 'review_type'
type SortOrder = 'asc' | 'desc'
type FilterStatus = 'all' | 'pending' | 'overdue' | 'completed'
type FilterType = 'all' | 'content' | 'medical' | 'legal' | 'technical'

const PRIORITY_COLORS = {
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  normal: 'text-gray-600 bg-gray-50 border-gray-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  urgent: 'text-red-600 bg-red-50 border-red-200'
}

const REVIEW_TYPE_COLORS = {
  content: 'text-blue-600 bg-blue-50 border-blue-200',
  medical: 'text-red-600 bg-red-50 border-red-200',
  legal: 'text-purple-600 bg-purple-50 border-purple-200',
  technical: 'text-green-600 bg-green-50 border-green-200'
}

const REVIEW_TYPE_ICONS = {
  content: Eye,
  medical: Shield,
  legal: Scale,
  technical: FileText
}

export function ReviewerDashboard({
  currentUserId,
  reviews = [],
  workflowInstances = [],
  comments = [],
  onAcceptReview,
  onRejectReview,
  onRequestChanges,
  onAssignReview,
  className
}: ReviewerDashboardProps) {
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')

  // Filter reviews for current user
  const myReviews = reviews.filter(review => review.reviewer_id === currentUserId)

  // Calculate review statistics
  const reviewStats = useMemo(() => {
    const now = new Date()
    const pending = myReviews.filter(r => r.status === 'pending').length
    const overdue = myReviews.filter(r => 
      r.status === 'pending' && r.due_date && new Date(r.due_date) < now
    ).length
    const completed = myReviews.filter(r => 
      ['approved', 'rejected', 'needs_changes'].includes(r.status)
    ).length
    const totalAssigned = myReviews.length

    return {
      pending,
      overdue,
      completed,
      totalAssigned,
      completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0
    }
  }, [myReviews])

  // Get average review time
  const avgReviewTime = useMemo(() => {
    const completedReviews = myReviews.filter(r => r.completed_at)
    if (completedReviews.length === 0) return 0

    const totalTime = completedReviews.reduce((acc, review) => {
      const start = new Date(review.assigned_at)
      const end = new Date(review.completed_at!)
      return acc + (end.getTime() - start.getTime())
    }, 0)

    return Math.round(totalTime / completedReviews.length / (1000 * 60 * 60)) // Convert to hours
  }, [myReviews])

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = myReviews

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(review => 
        review.content_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.review_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.feedback?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const now = new Date()
      switch (filterStatus) {
        case 'pending':
          filtered = filtered.filter(r => r.status === 'pending')
          break
        case 'overdue':
          filtered = filtered.filter(r => 
            r.status === 'pending' && r.due_date && new Date(r.due_date) < now
          )
          break
        case 'completed':
          filtered = filtered.filter(r => 
            ['approved', 'rejected', 'needs_changes'].includes(r.status)
          )
          break
      }
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.review_type === filterType)
    }

    // Sort reviews
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date) : new Date('9999-12-31')
          bValue = b.due_date ? new Date(b.due_date) : new Date('9999-12-31')
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'review_type':
          aValue = a.review_type
          bValue = b.review_type
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [myReviews, searchQuery, filterStatus, filterType, sortField, sortOrder])

  // Get reviews by tab
  const getReviewsForTab = (tab: string) => {
    switch (tab) {
      case 'pending':
        return filteredAndSortedReviews.filter(r => r.status === 'pending')
      case 'overdue':
        const now = new Date()
        return filteredAndSortedReviews.filter(r => 
          r.status === 'pending' && r.due_date && new Date(r.due_date) < now
        )
      case 'completed':
        return filteredAndSortedReviews.filter(r => 
          ['approved', 'rejected', 'needs_changes'].includes(r.status)
        )
      default:
        return filteredAndSortedReviews
    }
  }

  const tabReviews = getReviewsForTab(activeTab)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your assigned content reviews and track progress</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <User className="h-3 w-3 mr-1" />
            Reviewer
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-blue-600">{reviewStats.pending}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              {reviewStats.overdue > 0 && (
                <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {reviewStats.overdue} overdue
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{reviewStats.completed}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Progress 
                  value={reviewStats.completionRate} 
                  className="flex-1 h-1" 
                />
                <span className="text-sm text-gray-500">{reviewStats.completionRate}%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Review Time</p>
                  <p className="text-2xl font-bold text-purple-600">{avgReviewTime}h</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Average completion time
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                  <p className="text-2xl font-bold text-gray-900">{reviewStats.totalAssigned}</p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                All-time reviews
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reviews by content ID, type, or feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="created_at">Created</SelectItem>
                  <SelectItem value="review_type">Type</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {reviewStats.pending > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {reviewStats.pending}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="overdue" className="relative">
            Overdue
            {reviewStats.overdue > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {reviewStats.overdue}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {reviewStats.completed}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger value="all">All Reviews</TabsTrigger>
        </TabsList>

        {/* Review List */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {tabReviews.length > 0 ? (
              tabReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ReviewCard
                    review={review}
                    onAccept={onAcceptReview}
                    onReject={onRejectReview}
                    onRequestChanges={onRequestChanges}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'pending' && 'No pending reviews'}
                  {activeTab === 'overdue' && 'No overdue reviews'}
                  {activeTab === 'completed' && 'No completed reviews'}
                  {activeTab === 'all' && 'No reviews found'}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'pending' && 'You\'re all caught up! New reviews will appear here when assigned.'}
                  {activeTab === 'overdue' && 'Great job staying on top of your reviews!'}
                  {activeTab === 'completed' && 'Completed reviews will appear here as you finish them.'}
                  {activeTab === 'all' && 'Try adjusting your search or filter criteria.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )
}

// Individual Review Card Component
function ReviewCard({
  review,
  onAccept,
  onReject,
  onRequestChanges
}: {
  review: ContentReview
  onAccept?: (reviewId: string, feedback?: string) => Promise<void>
  onReject?: (reviewId: string, feedback: string, changes: any[]) => Promise<void>
  onRequestChanges?: (reviewId: string, feedback: string, changes: any[]) => Promise<void>
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedback, setFeedback] = useState(review.feedback || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const TypeIcon = REVIEW_TYPE_ICONS[review.review_type]
  const isOverdue = review.due_date && new Date(review.due_date) < new Date()
  const isPending = review.status === 'pending'
  
  const handleAction = async (action: 'approve' | 'reject' | 'changes', actionFeedback?: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      switch (action) {
        case 'approve':
          if (onAccept) await onAccept(review.id, actionFeedback || feedback)
          break
        case 'reject':
          if (onReject) await onReject(review.id, actionFeedback || feedback, [])
          break
        case 'changes':
          if (onRequestChanges) await onRequestChanges(review.id, actionFeedback || feedback, [])
          break
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const timeToComplete = review.due_date 
    ? Math.max(0, Math.ceil((new Date(review.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isOverdue && 'border-red-200 bg-red-50/50',
      review.priority === 'urgent' && 'ring-2 ring-red-200',
      review.priority === 'high' && 'ring-1 ring-orange-200'
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              REVIEW_TYPE_COLORS[review.review_type]
            )}>
              <TypeIcon className="h-5 w-5" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {review.review_type.charAt(0).toUpperCase() + review.review_type.slice(1)} Review
                </h3>
                <Badge variant="outline" className={PRIORITY_COLORS[review.priority]}>
                  {review.priority}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Overdue
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                Content ID: {review.content_id}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Assigned {new Date(review.assigned_at).toLocaleDateString()}
                </div>
                
                {review.due_date && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due {new Date(review.due_date).toLocaleDateString()}
                    {timeToComplete !== null && (
                      <span className={cn(
                        'ml-1',
                        timeToComplete <= 1 && 'text-red-600 font-medium',
                        timeToComplete <= 3 && timeToComplete > 1 && 'text-orange-600'
                      )}>
                        ({timeToComplete === 0 ? 'Today' : `${timeToComplete} days left`})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-90'
            )} />
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {(isExpanded || isPending) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 space-y-4">
              {/* Existing Feedback */}
              {review.feedback && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700">Previous Feedback:</Label>
                  <p className="text-sm text-gray-600 mt-1">{review.feedback}</p>
                </div>
              )}

              {/* Review Actions for Pending Reviews */}
              {isPending && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor={`feedback-${review.id}`}>Review Feedback</Label>
                    <textarea
                      id={`feedback-${review.id}`}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add your review comments and feedback..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAction('approve')}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleAction('changes')}
                      disabled={isSubmitting}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleAction('reject')}
                      disabled={isSubmitting}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Completed Review Status */}
              {!isPending && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {review.status === 'approved' && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Approved</span>
                      </>
                    )}
                    {review.status === 'rejected' && (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Rejected</span>
                      </>
                    )}
                    {review.status === 'needs_changes' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Changes Requested</span>
                      </>
                    )}
                  </div>
                  
                  {review.completed_at && (
                    <span className="text-sm text-gray-500">
                      Completed {new Date(review.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}