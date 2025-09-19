'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Clock,
  Users,
  Target,
  Mail,
  Save,
  Send,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailCampaign, EmailTemplate, EmailSegment } from '@/types/email-campaigns'

interface EmailCampaignBuilderProps {
  campaign?: EmailCampaign | null
  onSave?: (campaign: EmailCampaign) => void
  onCancel?: () => void
}

const campaignTypes = [
  { value: 'newsletter', label: 'Newsletter', description: 'Regular updates and news' },
  { value: 'promotional', label: 'Promotional', description: 'Marketing and sales campaigns' },
  { value: 'educational', label: 'Educational', description: 'Healthcare education content' },
  { value: 'appointment_reminder', label: 'Appointment Reminder', description: 'Patient appointment notifications' },
  { value: 'follow_up', label: 'Follow-up', description: 'Post-appointment follow-ups' },
  { value: 'welcome', label: 'Welcome Series', description: 'New contact onboarding' },
  { value: 're_engagement', label: 'Re-engagement', description: 'Win back inactive contacts' }
]

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-gray-100' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100' },
  { value: 'high', label: 'High', color: 'bg-yellow-100' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100' }
]

export function EmailCampaignBuilder({ campaign, onSave, onCancel }: EmailCampaignBuilderProps) {
  const [formData, setFormData] = useState<Partial<EmailCampaign>>({
    name: '',
    description: '',
    campaign_type: 'newsletter',
    template_id: '',
    segment_id: '',
    subject_line: '',
    from_name: '',
    from_email: '',
    reply_to: '',
    priority: 'normal',
    scheduled_at: '',
    is_ab_test: false,
    ab_test_percentage: 50,
    is_active: true
  })
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [segments, setSegments] = useState<EmailSegment[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const { toast } = useToast()

  useEffect(() => {
    if (campaign) {
      setFormData(campaign)
    }
    loadTemplates()
    loadSegments()
  }, [campaign])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadSegments = async () => {
    try {
      const response = await fetch('/api/admin/email/segments')
      const data = await response.json()
      if (data.success) {
        setSegments(data.data)
      }
    } catch (error) {
      console.error('Error loading segments:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.subject_line || !formData.template_id || !formData.segment_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const url = campaign?.id 
        ? `/api/admin/email/campaigns/${campaign.id}`
        : '/api/admin/email/campaigns'
      
      const method = campaign?.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Success',
          description: campaign?.id ? 'Campaign updated successfully' : 'Campaign created successfully'
        })
        if (onSave) {
          onSave(result.data)
        }
      } else {
        throw new Error('Failed to save campaign')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save campaign',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!formData.name || !formData.subject_line || !formData.template_id || !formData.segment_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields before sending',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // First save the campaign
      await handleSave()
      
      // Then send it
      const response = await fetch(`/api/admin/email/campaigns/${formData.id}/send`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Campaign sent successfully'
        })
      } else {
        throw new Error('Failed to send campaign')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send campaign',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getPriorityInfo = (priority: string) => {
    return priorityLevels.find(p => p.value === priority) || priorityLevels[1]
  }

  const getTypeInfo = (type: string) => {
    return campaignTypes.find(t => t.value === type) || campaignTypes[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Build and configure your email campaign
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="outline" onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Sending...' : 'Send Campaign'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>
                Basic details about your email campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign_type">Campaign Type *</Label>
                  <Select
                    value={formData.campaign_type || 'newsletter'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, campaign_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this campaign"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority || 'normal'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${priority.color}`}></div>
                            {priority.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active Campaign</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Configure the email template and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template_id">Email Template *</Label>
                <Select
                  value={formData.template_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id!}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.category}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject_line">Subject Line *</Label>
                <Input
                  id="subject_line"
                  value={formData.subject_line || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                  placeholder="Enter email subject line"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name *</Label>
                  <Input
                    id="from_name"
                    value={formData.from_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder="Healthcare Organization"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email *</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={formData.from_email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder="noreply@healthcare.org"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply_to">Reply-To Email</Label>
                <Input
                  id="reply_to"
                  type="email"
                  value={formData.reply_to || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reply_to: e.target.value }))}
                  placeholder="support@healthcare.org"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targeting */}
        <TabsContent value="targeting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audience Targeting</CardTitle>
              <CardDescription>
                Select the audience for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="segment_id">Target Segment *</Label>
                <Select
                  value={formData.segment_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, segment_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id!}>
                        <div>
                          <div className="font-medium">{segment.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {segment.contact_count} contacts • {segment.segment_type}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.segment_id && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Segment Details</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    This campaign will be sent to the selected segment. 
                    Make sure the segment is appropriate for your campaign type.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling */}
        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Scheduling</CardTitle>
              <CardDescription>
                Configure when and how often to send the campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Send Date & Time</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to send immediately
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Scheduling Tips</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Best times: Tuesday-Thursday, 10 AM - 2 PM</li>
                  <li>• Avoid: Monday mornings, Friday afternoons</li>
                  <li>• Consider time zones for your audience</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Testing */}
        <TabsContent value="ab-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing Configuration</CardTitle>
              <CardDescription>
                Set up A/B testing for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_ab_test"
                  checked={formData.is_ab_test ?? false}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_ab_test: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_ab_test">Enable A/B Testing</Label>
              </div>

              {formData.is_ab_test && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ab_test_percentage">Test Percentage</Label>
                    <Input
                      id="ab_test_percentage"
                      type="number"
                      min="10"
                      max="90"
                      value={formData.ab_test_percentage || 50}
                      onChange={(e) => setFormData(prev => ({ ...prev, ab_test_percentage: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of audience to include in A/B test (10-90%)
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">A/B Testing Benefits</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Test subject lines, content, and send times</li>
                      <li>• Improve open rates and engagement</li>
                      <li>• Data-driven campaign optimization</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Preview</CardTitle>
              <CardDescription>
                Review your campaign before sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Campaign Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {formData.name || 'Untitled Campaign'}</div>
                    <div><strong>Type:</strong> {getTypeInfo(formData.campaign_type || 'newsletter').label}</div>
                    <div><strong>Subject:</strong> {formData.subject_line || 'No subject line'}</div>
                    <div><strong>From:</strong> {formData.from_name} &lt;{formData.from_email}&gt;</div>
                    <div><strong>Priority:</strong> {getPriorityInfo(formData.priority || 'normal').label}</div>
                    {formData.scheduled_at && (
                      <div><strong>Scheduled:</strong> {new Date(formData.scheduled_at).toLocaleString()}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Targeting</h4>
                  {formData.segment_id ? (
                    <div className="text-sm">
                      <div><strong>Segment:</strong> {segments.find(s => s.id === formData.segment_id)?.name || 'Unknown'}</div>
                      <div><strong>Contact Count:</strong> {segments.find(s => s.id === formData.segment_id)?.contact_count || 0} contacts</div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No segment selected</p>
                  )}
                </div>
                
                {formData.is_ab_test && (
                  <div>
                    <h4 className="font-medium mb-2">A/B Testing</h4>
                    <div className="text-sm">
                      <div><strong>Test Percentage:</strong> {formData.ab_test_percentage}%</div>
                      <div><strong>Test Audience:</strong> {Math.round((segments.find(s => s.id === formData.segment_id)?.contact_count || 0) * (formData.ab_test_percentage || 50) / 100)} contacts</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}