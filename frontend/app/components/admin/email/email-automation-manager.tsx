'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Eye,
  Workflow,
  Calendar,
  Users,
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailAutomation } from '@/types/email-campaigns'

export function EmailAutomationManager() {
  const [automations, setAutomations] = useState<EmailAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAutomations()
  }, [])

  const loadAutomations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/automations')
      const data = await response.json()
      
      if (data.success) {
        setAutomations(data.data)
      } else {
        throw new Error(data.error || 'Failed to load automations')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email automations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (automationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/email/automations/${automationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: !isActive })
      })
      
      if (response.ok) {
        await loadAutomations()
        toast({
          title: 'Success',
          description: `Automation ${!isActive ? 'activated' : 'deactivated'} successfully`
        })
      } else {
        throw new Error('Failed to update automation')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update automation',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (automationId: string) => {
    try {
      const response = await fetch(`/api/admin/email/automations/${automationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadAutomations()
        toast({
          title: 'Success',
          description: 'Automation deleted successfully'
        })
      } else {
        throw new Error('Failed to delete automation')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete automation',
        variant: 'destructive'
      })
    }
  }

  const getTriggerTypeBadge = (triggerType: string) => {
    switch (triggerType) {
      case 'welcome':
        return <Badge className="bg-green-100 text-green-800">Welcome Series</Badge>
      case 'appointment_reminder':
        return <Badge className="bg-blue-100 text-blue-800">Appointment Reminder</Badge>
      case 're_engagement':
        return <Badge className="bg-orange-100 text-orange-800">Re-engagement</Badge>
      case 'educational':
        return <Badge className="bg-purple-100 text-purple-800">Educational</Badge>
      case 'compliance':
        return <Badge className="bg-red-100 text-red-800">Compliance</Badge>
      default:
        return <Badge variant="secondary">{triggerType}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading automations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Automations</h2>
          <p className="text-muted-foreground">
            Create and manage automated email workflows
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.filter(a => a.active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.2%</div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automations ({automations.length})</CardTitle>
          <CardDescription>
            Manage your automated email workflows and triggers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Emails Sent</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{automation.name}</div>
                      {automation.description && (
                        <div className="text-sm text-muted-foreground">
                          {automation.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTriggerTypeBadge(automation.trigger_type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={automation.active ? 'default' : 'secondary'}>
                      {automation.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {automation.emails_sent || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      {automation.open_rate || 0}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(automation.created_at).toLocaleDateString()}
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
                        onClick={() => {/* Handle edit */}}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(automation.id!, automation.active)}
                      >
                        {automation.active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(automation.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
