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
  BarChart3,
  Users,
  Mail,
  Calendar
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailCampaign } from '@/types/email-campaigns'

export function EmailCampaignManager() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/campaigns')
      const data = await response.json()
      
      if (data.success) {
        setCampaigns(data.data)
      } else {
        throw new Error(data.error || 'Failed to load campaigns')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email campaigns',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/email/campaigns/${campaignId}/start`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadCampaigns()
        toast({
          title: 'Success',
          description: 'Campaign started successfully'
        })
      } else {
        throw new Error('Failed to start campaign')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start campaign',
        variant: 'destructive'
      })
    }
  }

  const handlePause = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/email/campaigns/${campaignId}/pause`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadCampaigns()
        toast({
          title: 'Success',
          description: 'Campaign paused successfully'
        })
      } else {
        throw new Error('Failed to pause campaign')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause campaign',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/email/campaigns/${campaignId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadCampaigns()
        toast({
          title: 'Success',
          description: 'Campaign deleted successfully'
        })
      } else {
        throw new Error('Failed to delete campaign')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>
      case 'running':
        return <Badge variant="default">Running</Badge>
      case 'paused':
        return <Badge variant="destructive">Paused</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Create and manage your email marketing campaigns
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({campaigns.length})</CardTitle>
          <CardDescription>
            Manage your email marketing campaigns and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Click Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-sm text-muted-foreground">
                          {campaign.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(campaign.status || 'draft')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {campaign.recipient_count || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {campaign.open_rate || 0}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      {campaign.click_rate || 0}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(campaign.created_at).toLocaleDateString()}
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
                      {campaign.status === 'draft' || campaign.status === 'paused' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStart(campaign.id!)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : campaign.status === 'running' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePause(campaign.id!)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(campaign.id!)}
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