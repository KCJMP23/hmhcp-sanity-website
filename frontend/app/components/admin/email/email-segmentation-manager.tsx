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
  Filter,
  Users,
  Target,
  Activity,
  Calendar
} from 'lucide-react'
import { EmailSegmentBuilder } from './email-segment-builder'
import { useToast } from '@/hooks/use-toast'
import type { EmailSegment } from '@/types/email-campaigns'

const segmentTypes = [
  { value: 'healthcare_specialty', label: 'Healthcare Specialty', icon: Target },
  { value: 'patient_condition', label: 'Patient Condition', icon: Activity },
  { value: 'engagement_level', label: 'Engagement Level', icon: Users },
  { value: 'geographic', label: 'Geographic', icon: Target },
  { value: 'demographic', label: 'Demographic', icon: Users },
  { value: 'behavioral', label: 'Behavioral', icon: Activity },
]

export function EmailSegmentationManager() {
  const [segments, setSegments] = useState<EmailSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedSegment, setSelectedSegment] = useState<EmailSegment | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [isNewSegment, setIsNewSegment] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSegments()
  }, [])

  const loadSegments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/segments')
      const data = await response.json()
      
      if (data.success) {
        setSegments(data.data)
      } else {
        throw new Error(data.error || 'Failed to load segments')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email segments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (segment: EmailSegment) => {
    setSelectedSegment(segment)
    setIsNewSegment(false)
    setShowBuilder(true)
  }

  const handleNew = () => {
    setSelectedSegment(null)
    setIsNewSegment(true)
    setShowBuilder(true)
  }

  const handleDuplicate = (segment: EmailSegment) => {
    const duplicated = {
      ...segment,
      id: undefined,
      name: `${segment.name} (Copy)`,
      created_at: undefined,
      updated_at: undefined
    }
    setSelectedSegment(duplicated)
    setIsNewSegment(true)
    setShowBuilder(true)
  }

  const handleDelete = async (segmentId: string) => {
    try {
      const response = await fetch(`/api/admin/email/segments/${segmentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadSegments()
        toast({
          title: 'Success',
          description: 'Segment deleted successfully'
        })
      } else {
        throw new Error('Failed to delete segment')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete segment',
        variant: 'destructive'
      })
    }
  }

  const handleSave = async (segment: EmailSegment) => {
    try {
      const url = isNewSegment 
        ? '/api/admin/email/segments'
        : `/api/admin/email/segments/${segment.id}`
      
      const method = isNewSegment ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(segment)
      })
      
      if (response.ok) {
        await loadSegments()
        setShowBuilder(false)
        toast({
          title: 'Success',
          description: isNewSegment ? 'Segment created successfully' : 'Segment updated successfully'
        })
      } else {
        throw new Error('Failed to save segment')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save segment',
        variant: 'destructive'
      })
    }
  }

  const getTypeInfo = (type: string) => {
    return segmentTypes.find(t => t.value === type) || segmentTypes[0]
  }

  const filteredSegments = segments.filter(segment => {
    const matchesSearch = segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         segment.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || segment.segment_type === typeFilter
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading segments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Segments</h2>
          <p className="text-muted-foreground">
            Create and manage targeted contact segments for your campaigns
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Segment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search segments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {segmentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Segments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Segments ({filteredSegments.length})</CardTitle>
          <CardDescription>
            Manage your contact segments and targeting criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Count</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSegments.map((segment) => {
                const typeInfo = getTypeInfo(segment.segment_type)
                const TypeIcon = typeInfo.icon
                
                return (
                  <TableRow key={segment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{segment.name}</div>
                        {segment.description && (
                          <div className="text-sm text-muted-foreground">
                            {segment.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {segment.contact_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {segment.criteria && Object.keys(segment.criteria).length > 0
                          ? `${Object.keys(segment.criteria).length} criteria`
                          : 'No criteria'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(segment.updated_at).toLocaleDateString()}
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
                          onClick={() => handleEdit(segment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(segment)}
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(segment.id!)}
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

      {/* Segment Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewSegment ? 'Create New Segment' : 'Edit Segment'}
            </DialogTitle>
            <DialogDescription>
              {isNewSegment 
                ? 'Create a new contact segment with targeting criteria'
                : 'Edit the selected contact segment'
              }
            </DialogDescription>
          </DialogHeader>
          <EmailSegmentBuilder
            segment={selectedSegment}
            onSave={handleSave}
            onCancel={() => setShowBuilder(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
