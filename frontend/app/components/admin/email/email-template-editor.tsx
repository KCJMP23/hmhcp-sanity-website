'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { 
  FileText,
  Code,
  Eye,
  Save,
  X,
  Plus,
  Mail,
  User,
  Calendar,
  MapPin,
  Hash
} from 'lucide-react'
import type { EmailTemplate } from '@/lib/email/email-manager'
import dynamic from 'next/dynamic'

// Dynamically import the editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-full" />
})

interface EmailTemplateEditorProps {
  template?: EmailTemplate
  onSave: (template: EmailTemplate) => void
  onCancel: () => void
}

const VARIABLE_ICONS: Record<string, React.ElementType> = {
  first_name: User,
  last_name: User,
  email: Mail,
  appointment_date: Calendar,
  appointment_time: Calendar,
  appointment_location: MapPin,
  provider_name: User,
  newsletter_content: FileText
}

export function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<EmailTemplate>({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    variables: template?.variables || [],
    category: template?.category || 'custom',
    is_active: template?.is_active ?? true
  })
  const [newVariable, setNewVariable] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit')
  const [previewData, setPreviewData] = useState<Record<string, string>>({})

  useEffect(() => {
    // Initialize preview data with sample values
    const initialPreview: Record<string, string> = {}
    formData.variables.forEach(variable => {
      switch (variable) {
        case 'first_name':
          initialPreview[variable] = 'John'
          break
        case 'last_name':
          initialPreview[variable] = 'Doe'
          break
        case 'email':
          initialPreview[variable] = 'john.doe@example.com'
          break
        case 'appointment_date':
          initialPreview[variable] = 'March 15, 2025'
          break
        case 'appointment_time':
          initialPreview[variable] = '2:00 PM'
          break
        case 'appointment_location':
          initialPreview[variable] = 'Main Clinic, Room 201'
          break
        case 'provider_name':
          initialPreview[variable] = 'Dr. Sarah Johnson'
          break
        default:
          initialPreview[variable] = `[${variable}]`
      }
    })
    setPreviewData(initialPreview)
  }, [formData.variables])

  const handleAddVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable.toLowerCase().replace(/\s+/g, '_')]
      })
      setNewVariable('')
    }
  }

  const handleRemoveVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }
    
    onSave(formData)
  }

  const replaceVariables = (text: string): string => {
    let result = text
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  const getPreviewHtml = () => {
    const processedBody = replaceVariables(formData.body)
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1, h2, h3 { color: #1a202c; }
            a { color: #2563eb; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            ${processedBody}
            <div class="footer">
              <p>This email was sent by Healthcare Management HCP. If you no longer wish to receive these emails, please <a href="#">unsubscribe</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Welcome Email"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: EmailTemplate['category']) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="appointment">Appointment</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g., Welcome to Healthcare Management Platform"
          required
        />
        <p className="text-sm text-gray-600 mt-1">
          You can use variables like {'{{first_name}}'} in the subject
        </p>
      </div>

      <div>
        <Label>Template Variables</Label>
        <div className="flex gap-2 mb-3">
          <Input
            value={newVariable}
            onChange={(e) => setNewVariable(e.target.value)}
            placeholder="Add a variable (e.g., patient_name)"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVariable())}
          />
          <Button type="button" onClick={handleAddVariable} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.variables.map((variable: string) => {
            const IconComponent = VARIABLE_ICONS[variable] || Hash
            return (
              <Badge key={variable} variant="secondary" className="flex items-center gap-1">
                {React.createElement(IconComponent, { className: "h-3 w-3" })}
                {`{{${variable}}}`}
                <button
                  type="button"
                  onClick={() => handleRemoveVariable(variable)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Email Body</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={viewMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('edit')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              type="button"
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              type="button"
              variant={viewMode === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('code')}
            >
              <Code className="h-4 w-4 mr-1" />
              HTML
            </Button>
          </div>
        </div>
        
        {viewMode === 'edit' && (
          <RichTextEditor
            value={formData.body}
            onChange={(value) => setFormData({ ...formData, body: value })}
            placeholder="Write your email content here..."
          />
        )}
        
        {viewMode === 'preview' && (
          <Card className="p-0 overflow-hidden">
            <iframe
              srcDoc={getPreviewHtml()}
              className="w-full h-96 border-0"
              title="Email Preview"
            />
          </Card>
        )}
        
        {viewMode === 'code' && (
          <Textarea
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="font-mono text-sm h-96"
            placeholder="<h1>Hello {{first_name}}</h1>"
          />
        )}
      </div>

      {viewMode === 'preview' && formData.variables.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Preview Variables</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {formData.variables.map((variable) => (
              <div key={variable}>
                <Label htmlFor={`preview-${variable}`} className="text-sm">
                  {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <Input
                  id={`preview-${variable}`}
                  value={previewData[variable] || ''}
                  onChange={(e) => setPreviewData({
                    ...previewData,
                    [variable]: e.target.value
                  })}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Template is active</Label>
        </div>
        
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>
    </form>
  )
}