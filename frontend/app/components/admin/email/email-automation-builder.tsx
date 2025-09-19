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
  Workflow,
  Plus,
  Trash2,
  Play,
  Pause,
  Save,
  Eye,
  Clock,
  Target,
  Mail,
  User,
  Calendar,
  Settings,
  ArrowRight,
  Branch
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailAutomation, AutomationStep, AutomationTrigger } from '@/types/email-campaigns'

interface EmailAutomationBuilderProps {
  automation?: EmailAutomation | null
  onSave?: (automation: EmailAutomation) => void
  onCancel?: () => void
}

const automationTypes = [
  { value: 'welcome_series', label: 'Welcome Series', description: 'Onboard new contacts' },
  { value: 'appointment_reminders', label: 'Appointment Reminders', description: 'Send appointment notifications' },
  { value: 'follow_up', label: 'Follow-up Series', description: 'Post-appointment follow-ups' },
  { value: 're_engagement', label: 'Re-engagement', description: 'Win back inactive contacts' },
  { value: 'educational', label: 'Educational Series', description: 'Health education content' },
  { value: 'seasonal', label: 'Seasonal Campaigns', description: 'Holiday and seasonal content' },
  { value: 'custom', label: 'Custom Workflow', description: 'Build your own automation' }
]

const triggerTypes = [
  { value: 'contact_added', label: 'Contact Added', description: 'When a new contact is added' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled', description: 'When an appointment is scheduled' },
  { value: 'appointment_completed', label: 'Appointment Completed', description: 'When an appointment is completed' },
  { value: 'email_opened', label: 'Email Opened', description: 'When an email is opened' },
  { value: 'email_clicked', label: 'Email Clicked', description: 'When an email link is clicked' },
  { value: 'form_submitted', label: 'Form Submitted', description: 'When a form is submitted' },
  { value: 'date_based', label: 'Date Based', description: 'Triggered on specific dates' },
  { value: 'inactivity', label: 'Inactivity', description: 'When contact becomes inactive' }
]

const delayTypes = [
  { value: 'immediate', label: 'Immediate', description: 'Send immediately' },
  { value: 'minutes', label: 'Minutes', description: 'Wait X minutes' },
  { value: 'hours', label: 'Hours', description: 'Wait X hours' },
  { value: 'days', label: 'Days', description: 'Wait X days' },
  { value: 'weeks', label: 'Weeks', description: 'Wait X weeks' },
  { value: 'months', label: 'Months', description: 'Wait X months' }
]

export function EmailAutomationBuilder({ automation, onSave, onCancel }: EmailAutomationBuilderProps) {
  const [formData, setFormData] = useState<Partial<EmailAutomation>>({
    name: '',
    description: '',
    automation_type: 'welcome_series',
    trigger: {
      type: 'contact_added',
      conditions: [],
      delay: { type: 'immediate', value: 0 }
    },
    steps: [],
    is_active: true
  })
  const [templates, setTemplates] = useState<any[]>([])
  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const { toast } = useToast()

  useEffect(() => {
    if (automation) {
      setFormData(automation)
    }
    loadTemplates()
    loadSegments()
  }, [automation])

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

  const addStep = () => {
    const newStep: AutomationStep = {
      id: `step_${Date.now()}`,
      type: 'email',
      name: `Step ${(formData.steps?.length || 0) + 1}`,
      template_id: '',
      delay: { type: 'days', value: 1 },
      conditions: [],
      is_active: true
    }
    
    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }))
  }

  const updateStep = (stepId: string, updates: Partial<AutomationStep>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ) || []
    }))
  }

  const removeStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter(step => step.id !== stepId) || []
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.trigger || (formData.steps?.length || 0) === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and add at least one step',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const url = automation?.id 
        ? `/api/admin/email/automations/${automation.id}`
        : '/api/admin/email/automations'
      
      const method = automation?.id ? 'PUT' : 'POST'
      
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
          description: automation?.id ? 'Automation updated successfully' : 'Automation created successfully'
        })
        if (onSave) {
          onSave(result.data)
        }
      } else {
        throw new Error('Failed to save automation')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save automation',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTypeInfo = (type: string) => {
    return automationTypes.find(t => t.value === type) || automationTypes[0]
  }

  const getTriggerInfo = (type: string) => {
    return triggerTypes.find(t => t.value === type) || triggerTypes[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {automation ? 'Edit Automation' : 'Create New Automation'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Build automated email sequences and workflows
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
          <Button onClick={handleSave} disabled={loading}>
            <Play className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save & Activate'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="trigger">Trigger</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Information</CardTitle>
              <CardDescription>
                Basic details about your email automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Automation Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter automation name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="automation_type">Automation Type *</Label>
                  <Select
                    value={formData.automation_type || 'welcome_series'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, automation_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select automation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {automationTypes.map((type) => (
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
                  placeholder="Describe the purpose of this automation"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active Automation</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trigger Configuration */}
        <TabsContent value="trigger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Trigger</CardTitle>
              <CardDescription>
                Configure when this automation should start
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger_type">Trigger Type *</Label>
                <Select
                  value={formData.trigger?.type || 'contact_added'}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    trigger: { ...prev.trigger!, type: value as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((type) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delay_type">Delay Type</Label>
                  <Select
                    value={formData.trigger?.delay?.type || 'immediate'}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      trigger: { 
                        ...prev.trigger!, 
                        delay: { ...prev.trigger!.delay!, type: value as any }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delay type" />
                    </SelectTrigger>
                    <SelectContent>
                      {delayTypes.map((type) => (
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
                <div className="space-y-2">
                  <Label htmlFor="delay_value">Delay Value</Label>
                  <Input
                    id="delay_value"
                    type="number"
                    min="0"
                    value={formData.trigger?.delay?.value || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      trigger: { 
                        ...prev.trigger!, 
                        delay: { ...prev.trigger!.delay!, value: parseInt(e.target.value) || 0 }
                      }
                    }))}
                    placeholder="Enter delay value"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Steps */}
        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Automation Steps</span>
                <Button onClick={addStep} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </CardTitle>
              <CardDescription>
                Define the sequence of emails in your automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.steps?.map((step, index) => (
                <div key={step.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{step.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {step.type === 'email' ? 'Email Step' : 'Condition Step'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Step Name</Label>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(step.id, { name: e.target.value })}
                        placeholder="Enter step name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Template</Label>
                      <Select
                        value={step.template_id || ''}
                        onValueChange={(value) => updateStep(step.id, { template_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id!}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay Type</Label>
                      <Select
                        value={step.delay?.type || 'days'}
                        onValueChange={(value) => updateStep(step.id, { 
                          delay: { ...step.delay!, type: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delay type" />
                        </SelectTrigger>
                        <SelectContent>
                          {delayTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Delay Value</Label>
                      <Input
                        type="number"
                        min="0"
                        value={step.delay?.value || 0}
                        onChange={(e) => updateStep(step.id, { 
                          delay: { ...step.delay!, value: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="Enter delay value"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!formData.steps || formData.steps.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No steps added yet. Click "Add Step" to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Preview</CardTitle>
              <CardDescription>
                Review your automation configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Automation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {formData.name || 'Untitled Automation'}</div>
                    <div><strong>Type:</strong> {getTypeInfo(formData.automation_type || 'welcome_series').label}</div>
                    <div><strong>Description:</strong> {formData.description || 'No description'}</div>
                    <div><strong>Status:</strong> {formData.is_active ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Trigger Configuration</h4>
                  <div className="text-sm">
                    <div><strong>Trigger:</strong> {getTriggerInfo(formData.trigger?.type || 'contact_added').label}</div>
                    <div><strong>Delay:</strong> {formData.trigger?.delay?.value || 0} {formData.trigger?.delay?.type || 'immediate'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Automation Steps ({formData.steps?.length || 0})</h4>
                  {formData.steps && formData.steps.length > 0 ? (
                    <div className="space-y-2">
                      {formData.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{step.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {step.delay?.value || 0} {step.delay?.type || 'immediate'} delay
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No steps configured</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
