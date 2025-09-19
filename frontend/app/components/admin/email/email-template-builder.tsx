'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  X, 
  Eye, 
  Code, 
  Palette,
  Shield,
  Mail,
  Calendar,
  BookOpen,
  Megaphone,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailTemplate, EmailTemplateDefinition, HealthcareComplianceConfig } from '@/types/email-campaigns'

interface EmailTemplateBuilderProps {
  template?: EmailTemplate | null
  onSave: (template: EmailTemplate) => void
  onCancel: () => void
}

const templateCategories = [
  { value: 'newsletter', label: 'Newsletter', icon: Mail, description: 'Regular healthcare newsletters' },
  { value: 'appointment_reminder', label: 'Appointment Reminder', icon: Calendar, description: 'Patient appointment reminders' },
  { value: 'educational', label: 'Educational', icon: BookOpen, description: 'Educational healthcare content' },
  { value: 'promotional', label: 'Promotional', icon: Megaphone, description: 'Healthcare service promotions' },
  { value: 'compliance', label: 'Compliance', icon: Shield, description: 'Compliance and legal notices' },
]

const healthcareComplianceOptions = [
  { id: 'hipaa', label: 'HIPAA Compliant', description: 'Meets HIPAA privacy requirements' },
  { id: 'can_spam', label: 'CAN-SPAM Compliant', description: 'Meets CAN-SPAM Act requirements' },
  { id: 'fda', label: 'FDA Guidelines', description: 'Follows FDA marketing guidelines' },
  { id: 'gdpr', label: 'GDPR Compliant', description: 'Meets GDPR privacy requirements' },
]

export function EmailTemplateBuilder({ template, onSave, onCancel }: EmailTemplateBuilderProps) {
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    name: '',
    description: '',
    category: 'newsletter',
    template_definition: {
      subject: '',
      html_content: '',
      text_content: '',
      variables: []
    },
    healthcare_compliance: {
      hipaa: false,
      can_spam: false,
      fda: false,
      gdpr: false
    },
    target_audience: [],
    is_active: true
  })
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')
  const [complianceErrors, setComplianceErrors] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (template) {
      setFormData(template)
    }
  }, [template])

  const validateCompliance = () => {
    const errors: string[] = []
    
    // Check for PHI indicators
    const content = formData.template_definition?.html_content?.toLowerCase() || ''
    const phiIndicators = ['ssn', 'social security', 'patient id', 'medical record', 'diagnosis', 'treatment']
    
    phiIndicators.forEach(indicator => {
      if (content.includes(indicator)) {
        errors.push(`Content may contain PHI: "${indicator}"`)
      }
    })
    
    // Check for required compliance elements
    if (formData.healthcare_compliance?.can_spam) {
      if (!content.includes('unsubscribe')) {
        errors.push('CAN-SPAM compliance requires unsubscribe link')
      }
      if (!content.includes('physical address')) {
        errors.push('CAN-SPAM compliance requires physical address')
      }
    }
    
    setComplianceErrors(errors)
    return errors.length === 0
  }

  const handleSave = () => {
    if (!validateCompliance()) {
      toast({
        title: 'Compliance Issues',
        description: 'Please fix compliance issues before saving',
        variant: 'destructive'
      })
      return
    }

    const templateData: EmailTemplate = {
      id: formData.id,
      name: formData.name || '',
      description: formData.description || '',
      category: formData.category || 'newsletter',
      template_definition: formData.template_definition || {
        subject: '',
        html_content: '',
        text_content: '',
        variables: []
      },
      healthcare_compliance: formData.healthcare_compliance || {
        hipaa: false,
        can_spam: false,
        fda: false,
        gdpr: false
      },
      target_audience: formData.target_audience || [],
      is_active: formData.is_active ?? true,
      created_by: formData.created_by || '',
      created_at: formData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onSave(templateData)
  }

  const handleComplianceChange = (complianceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      healthcare_compliance: {
        ...prev.healthcare_compliance,
        [complianceId]: checked
      }
    }))
  }

  const getCategoryInfo = (category: string) => {
    return templateCategories.find(cat => cat.value === category) || templateCategories[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {template ? 'Edit Template' : 'Create New Template'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Build a healthcare-compliant email template
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Compliance Errors */}
      {complianceErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Compliance Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {complianceErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Basic information about your email template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category || 'newsletter'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.map((category) => {
                        const Icon = category.icon
                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{category.label}</div>
                                <div className="text-xs text-muted-foreground">{category.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
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
                  placeholder="Describe the purpose of this template"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Template</Label>
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
                Define the subject line and content for your email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.template_definition?.subject || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    template_definition: {
                      ...prev.template_definition!,
                      subject: e.target.value
                    }
                  }))}
                  placeholder="Enter email subject line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="html_content">HTML Content</Label>
                <Textarea
                  id="html_content"
                  value={formData.template_definition?.html_content || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    template_definition: {
                      ...prev.template_definition!,
                      html_content: e.target.value
                    }
                  }))}
                  placeholder="Enter HTML content for your email"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_content">Plain Text Content</Label>
                <Textarea
                  id="text_content"
                  value={formData.template_definition?.text_content || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    template_definition: {
                      ...prev.template_definition!,
                      text_content: e.target.value
                    }
                  }))}
                  placeholder="Enter plain text version of your email"
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Compliance</CardTitle>
              <CardDescription>
                Configure compliance settings for healthcare regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthcareComplianceOptions.map((option) => (
                <div key={option.id} className="flex items-start space-x-3">
                  <Switch
                    id={option.id}
                    checked={formData.healthcare_compliance?.[option.id as keyof HealthcareComplianceConfig] || false}
                    onCheckedChange={(checked) => handleComplianceChange(option.id, checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={option.id} className="text-sm font-medium">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* Compliance Status */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Compliance Status</h4>
                <div className="space-y-2">
                  {Object.entries(formData.healthcare_compliance || {}).map(([key, value]) => {
                    const option = healthcareComplianceOptions.find(opt => opt.id === key)
                    if (!option) return null
                    
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">{option.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                Preview how your email template will look to recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={previewMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('html')}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    HTML Preview
                  </Button>
                  <Button
                    variant={previewMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('text')}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Text Preview
                  </Button>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="text-sm font-medium mb-2">Subject: {formData.template_definition?.subject || 'No subject'}</div>
                  <div className="prose max-w-none">
                    {previewMode === 'html' ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: formData.template_definition?.html_content || '<p>No HTML content</p>' 
                        }} 
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm">
                        {formData.template_definition?.text_content || 'No text content'}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
