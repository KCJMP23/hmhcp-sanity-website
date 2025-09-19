'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  BarChart3,
  Target,
  Users,
  TrendingUp,
  Calendar,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailABTest } from '@/types/email-campaigns'

const testStatuses = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100' },
  { value: 'running', label: 'Running', color: 'bg-blue-100' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100' }
]

const testTypes = [
  { value: 'subject_line', label: 'Subject Line', description: 'Test different subject lines' },
  { value: 'content', label: 'Content', description: 'Test different email content' },
  { value: 'send_time', label: 'Send Time', description: 'Test different send times' },
  { value: 'from_name', label: 'From Name', description: 'Test different sender names' },
  { value: 'template', label: 'Template', description: 'Test different email templates' }
]

export function EmailABTestingManager() {
  const [tests, setTests] = useState<EmailABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedTest, setSelectedTest] = useState<EmailABTest | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [isNewTest, setIsNewTest] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/ab-tests')
      const data = await response.json()
      
      if (data.success) {
        setTests(data.data)
      } else {
        throw new Error(data.error || 'Failed to load A/B tests')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load A/B tests',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (test: EmailABTest) => {
    setSelectedTest(test)
    setIsNewTest(false)
    setShowBuilder(true)
  }

  const handleNew = () => {
    setSelectedTest(null)
    setIsNewTest(true)
    setShowBuilder(true)
  }

  const handleDuplicate = (test: EmailABTest) => {
    const duplicated = {
      ...test,
      id: undefined,
      name: `${test.name} (Copy)`,
      status: 'draft',
      created_at: undefined,
      updated_at: undefined
    }
    setSelectedTest(duplicated)
    setIsNewTest(true)
    setShowBuilder(true)
  }

  const handleDelete = async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/email/ab-tests/${testId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadTests()
        toast({
          title: 'Success',
          description: 'A/B test deleted successfully'
        })
      } else {
        throw new Error('Failed to delete A/B test')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete A/B test',
        variant: 'destructive'
      })
    }
  }

  const handleStart = async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/email/ab-tests/${testId}/start`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadTests()
        toast({
          title: 'Success',
          description: 'A/B test started successfully'
        })
      } else {
        throw new Error('Failed to start A/B test')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start A/B test',
        variant: 'destructive'
      })
    }
  }

  const handlePause = async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/email/ab-tests/${testId}/pause`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadTests()
        toast({
          title: 'Success',
          description: 'A/B test paused successfully'
        })
      } else {
        throw new Error('Failed to pause A/B test')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause A/B test',
        variant: 'destructive'
      })
    }
  }

  const handleComplete = async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/email/ab-tests/${testId}/complete`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadTests()
        toast({
          title: 'Success',
          description: 'A/B test completed successfully'
        })
      } else {
        throw new Error('Failed to complete A/B test')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete A/B test',
        variant: 'destructive'
      })
    }
  }

  const getStatusInfo = (status: string) => {
    return testStatuses.find(s => s.value === status) || testStatuses[0]
  }

  const getTypeInfo = (type: string) => {
    return testTypes.find(t => t.value === type) || testTypes[0]
  }

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter
    const matchesType = typeFilter === 'all' || test.test_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading A/B tests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Testing</h2>
          <p className="text-muted-foreground">
            Create and manage A/B tests to optimize your email campaigns
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          New A/B Test
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search A/B tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Target className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {testStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <BarChart3 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {testTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* A/B Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>A/B Tests ({filteredTests.length})</CardTitle>
          <CardDescription>
            Manage your email A/B tests and analyze results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.map((test) => {
                const statusInfo = getStatusInfo(test.status)
                const typeInfo = getTypeInfo(test.test_type)
                
                return (
                  <TableRow key={test.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{test.name}</div>
                        {test.description && (
                          <div className="text-sm text-muted-foreground">
                            {test.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <BarChart3 className="h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 w-fit ${statusInfo.color}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${statusInfo.color.replace('bg-', 'bg-').replace('-100', '-500')}`}></div>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          {test.winner_variant || 'TBD'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {test.confidence_level ? `${test.confidence_level}% confidence` : 'In progress'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {test.participant_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {test.duration_days || 0} days
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Handle view */}}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(test)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {test.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStart(test.id!)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePause(test.id!)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComplete(test.id!)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(test)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(test.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* A/B Test Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewTest ? 'Create New A/B Test' : 'Edit A/B Test'}
            </DialogTitle>
            <DialogDescription>
              {isNewTest 
                ? 'Create a new A/B test to optimize your email campaigns'
                : 'Edit the selected A/B test'
              }
            </DialogDescription>
          </DialogHeader>
          {/* A/B Test Builder Component would go here */}
          <div className="p-8 text-center text-muted-foreground">
            A/B Test Builder Component (To be implemented)
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
