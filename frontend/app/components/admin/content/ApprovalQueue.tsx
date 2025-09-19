/**
 * Approval Queue Dashboard Component
 * Interface for viewing and managing workflow approval queues
 * Story 1.4 Task 8 - Comprehensive workflow management system
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTab 
} from '@/components/ui/tabs'
import { 
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  Users,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ================================
// Types
// ================================

interface WorkflowQueueItem {
  workflowInstance: {
    id: string
    contentType: string
    contentId: string
    currentState: string
    assignedTo?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: string
    metadata: Record<string, any>
    createdBy: string
    createdAt: string
    updatedAt: string
  }
  contentTitle: string
  contentType: string
  author: string
  submittedAt: string
  daysInQueue: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
}

interface WorkflowQueueStats {
  totalPending: number
  totalOverdue: number
  averageProcessingTime: number
  byContentType: Record<string, number>
  byPriority: Record<string, number>
  byAssignee: Record<string, number>
}

interface ApprovalQueueData {
  pending: WorkflowQueueItem[]
  overdue: WorkflowQueueItem[]
  recent: WorkflowQueueItem[]
  stats: WorkflowQueueStats
}

interface ApprovalQueueProps {
  currentUser: {
    id: string
    role: string
    name: string
  }
  onItemSelect?: (item: WorkflowQueueItem) => void
}

// ================================
// Priority Badge Component
// ================================

const PriorityBadge: React.FC<{ priority: string; showIcon?: boolean }> = ({ 
  priority, 
  showIcon = true 
}) => {
  const config = {
    urgent: { color: 'bg-red-500 text-white', icon: AlertTriangle },
    high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    medium: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    low: { color: 'bg-green-100 text-green-800', icon: Clock }
  }[priority] || { color: 'bg-gray-100 text-gray-800', icon: Clock }

  const Icon = config.icon

  return (
    <Badge className={config.color}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {priority.toUpperCase()}
    </Badge>
  )
}

// ================================
// Stats Card Component
// ================================

const StatsCard: React.FC<{
  title: string
  value: number
  description: string
  icon: React.ElementType
  color: string
}> = ({ title, value, description, icon: Icon, color }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <div className={cn('p-3 rounded-full', color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ================================
// Queue Table Component
// ================================

const QueueTable: React.FC<{
  items: WorkflowQueueItem[]
  showOverdueColumn?: boolean
  onItemSelect?: (item: WorkflowQueueItem) => void
  onBulkAction?: (action: string, items: WorkflowQueueItem[]) => void
}> = ({ items, showOverdueColumn = false, onItemSelect, onBulkAction }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
  }

  const selectAllItems = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(item => item.workflowInstance.id)))
    }
  }

  const handleBulkAction = () => {
    if (!bulkAction || selectedItems.size === 0) return

    const selectedItemObjects = items.filter(item => 
      selectedItems.has(item.workflowInstance.id)
    )
    
    onBulkAction?.(bulkAction, selectedItemObjects)
    setSelectedItems(new Set())
    setBulkAction('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'blog_post':
        return FileText
      case 'page':
        return FileText
      default:
        return FileText
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No items in queue</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
          </span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approve">Approve All</SelectItem>
              <SelectItem value="reject">Reject All</SelectItem>
              <SelectItem value="assign">Assign To...</SelectItem>
              <SelectItem value="priority">Change Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            onClick={handleBulkAction}
            disabled={!bulkAction}
          >
            Execute
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedItems(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={selectAllItems}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Submitted</TableHead>
              {showOverdueColumn && <TableHead>Days Overdue</TableHead>}
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const ContentIcon = getContentTypeIcon(item.contentType)
              const isSelected = selectedItems.has(item.workflowInstance.id)
              const isOverdue = item.daysInQueue > 3 // Configurable threshold

              return (
                <TableRow 
                  key={item.workflowInstance.id}
                  className={cn(
                    isSelected && "bg-blue-50",
                    isOverdue && "border-l-4 border-l-red-400"
                  )}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.workflowInstance.id)}
                      className="rounded"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ContentIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-sm">
                          {item.contentTitle}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {item.workflowInstance.contentId.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.contentType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{item.author}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <PriorityBadge priority={item.priority} />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(item.submittedAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.daysInQueue} day{item.daysInQueue > 1 ? 's' : ''} ago
                    </div>
                  </TableCell>
                  
                  {showOverdueColumn && (
                    <TableCell>
                      {item.daysInQueue > 3 ? (
                        <Badge variant="destructive">
                          {item.daysInQueue - 3} days
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  )}
                  
                  <TableCell>
                    {item.workflowInstance.assignedTo ? (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{item.workflowInstance.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onItemSelect?.(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ================================
// Main ApprovalQueue Component
// ================================

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  currentUser,
  onItemSelect
}) => {
  const [data, setData] = useState<ApprovalQueueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    contentType: '',
    priority: '',
    assignee: ''
  })
  const [activeTab, setActiveTab] = useState('pending')

  // Load approval queue data
  useEffect(() => {
    loadApprovalQueue()
  }, [])

  const loadApprovalQueue = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/workflow/approve', {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load approval queue: ${response.statusText}`)
      }

      const responseData = await response.json()
      setData(responseData.data)

    } catch (err) {
      console.error('Failed to load approval queue:', err)
      setError(err instanceof Error ? err.message : 'Failed to load approval queue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkAction = async (action: string, items: WorkflowQueueItem[]) => {
    try {
      const workflowIds = items.map(item => item.workflowInstance.id)
      
      const response = await fetch('/api/admin/workflow/approve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        },
        body: JSON.stringify({
          workflowIds,
          action,
          comment: `Bulk ${action} by ${currentUser.name}`
        })
      })

      if (!response.ok) {
        throw new Error(`Bulk action failed: ${response.statusText}`)
      }

      // Reload data
      await loadApprovalQueue()

    } catch (err) {
      console.error('Bulk action failed:', err)
      alert(`Bulk action failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const filteredPendingItems = data?.pending?.filter(item => {
    if (filters.search && !item.contentTitle.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.contentType && item.contentType !== filters.contentType) {
      return false
    }
    if (filters.priority && item.priority !== filters.priority) {
      return false
    }
    if (filters.assignee && item.workflowInstance.assignedTo !== filters.assignee) {
      return false
    }
    return true
  }) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading approval queue...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-red-600">Error Loading Queue</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadApprovalQueue} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            No approval queue data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <p className="text-gray-600">Review and manage pending content workflows</p>
        </div>
        <Button onClick={loadApprovalQueue} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Items"
          value={data.stats.totalPending}
          description="Awaiting review"
          icon={Clock}
          color="bg-blue-500"
        />
        <StatsCard
          title="Overdue Items"
          value={data.stats.totalOverdue}
          description="Past due date"
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatsCard
          title="Avg Process Time"
          value={data.stats.averageProcessingTime}
          description="Days to complete"
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatsCard
          title="Completed Today"
          value={data.recent.length}
          description="Recently processed"
          icon={CheckCircle}
          color="bg-purple-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <Select 
                value={filters.contentType} 
                onValueChange={(value) => setFilters({ ...filters, contentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="blog_post">Blog Posts</SelectItem>
                  <SelectItem value="page">Pages</SelectItem>
                  <SelectItem value="platform">Platforms</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select 
                value={filters.priority} 
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <Select 
                value={filters.assignee} 
                onValueChange={(value) => setFilters({ ...filters, assignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {/* Dynamic assignee options would be loaded from API */}
                  <SelectItem value="reviewer-1">John Smith</SelectItem>
                  <SelectItem value="reviewer-2">Sarah Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTab value="pending">
                Pending ({filteredPendingItems.length})
              </TabsTab>
              <TabsTab value="overdue">
                Overdue ({data.overdue.length})
              </TabsTab>
              <TabsTab value="recent">
                Recent ({data.recent.length})
              </TabsTab>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="pending">
              <QueueTable 
                items={filteredPendingItems}
                onItemSelect={onItemSelect}
                onBulkAction={handleBulkAction}
              />
            </TabsContent>

            <TabsContent value="overdue">
              <QueueTable 
                items={data.overdue}
                showOverdueColumn={true}
                onItemSelect={onItemSelect}
                onBulkAction={handleBulkAction}
              />
            </TabsContent>

            <TabsContent value="recent">
              <QueueTable 
                items={data.recent}
                onItemSelect={onItemSelect}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

export default ApprovalQueue