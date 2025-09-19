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
  Copy, 
  Trash2, 
  Eye,
  Filter,
  MoreHorizontal,
  Mail,
  Calendar,
  BookOpen,
  Megaphone,
  Shield
} from 'lucide-react'
import { EmailTemplateBuilder } from './email-template-builder'
import { EmailTemplatePreview } from './email-template-preview'
import { useToast } from '@/hooks/use-toast'
import type { EmailTemplate } from '@/types/email-campaigns'

const templateCategories = [
  { value: 'newsletter', label: 'Newsletter', icon: Mail, color: 'bg-blue-100 text-blue-800' },
  { value: 'appointment_reminder', label: 'Appointment Reminder', icon: Calendar, color: 'bg-green-100 text-green-800' },
  { value: 'educational', label: 'Educational', icon: BookOpen, color: 'bg-purple-100 text-purple-800' },
  { value: 'promotional', label: 'Promotional', icon: Megaphone, color: 'bg-orange-100 text-orange-800' },
  { value: 'compliance', label: 'Compliance', icon: Shield, color: 'bg-red-100 text-red-800' },
]

export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isNewTemplate, setIsNewTemplate] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
      } else {
        throw new Error(data.error || 'Failed to load templates')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsNewTemplate(false)
    setShowBuilder(true)
  }

  const handleNew = () => {
    setSelectedTemplate(null)
    setIsNewTemplate(true)
    setShowBuilder(true)
  }

  const handleDuplicate = (template: EmailTemplate) => {
    const duplicated = {
      ...template,
      id: undefined,
      name: `${template.name} (Copy)`,
      created_at: undefined,
      updated_at: undefined
    }
    setSelectedTemplate(duplicated)
    setIsNewTemplate(true)
    setShowBuilder(true)
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleDelete = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/email/templates/${templateId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadTemplates()
        toast({
          title: 'Success',
          description: 'Template deleted successfully'
        })
      } else {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      })
    }
  }

  const handleSave = async (template: EmailTemplate) => {
    try {
      const url = isNewTemplate 
        ? '/api/admin/email/templates'
        : `/api/admin/email/templates/${template.id}`
      
      const method = isNewTemplate ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      })
      
      if (response.ok) {
        await loadTemplates()
        setShowBuilder(false)
        toast({
          title: 'Success',
          description: isNewTemplate ? 'Template created successfully' : 'Template updated successfully'
        })
      } else {
        throw new Error('Failed to save template')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      })
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryInfo = (category: string) => {
    return templateCategories.find(cat => cat.value === category) || templateCategories[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">
            Create and manage healthcare-compliant email templates
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {templateCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
          <CardDescription>
            Manage your email templates and their healthcare compliance settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => {
                const categoryInfo = getCategoryInfo(template.category)
                const CategoryIcon = categoryInfo.icon
                
                return (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryInfo.color}>
                        <CategoryIcon className="mr-1 h-3 w-3" />
                        {categoryInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(template.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {template.healthcare_compliance?.hipaa && (
                          <Badge variant="outline" className="text-xs">HIPAA</Badge>
                        )}
                        {template.healthcare_compliance?.can_spam && (
                          <Badge variant="outline" className="text-xs">CAN-SPAM</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id!)}
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

      {/* Template Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewTemplate ? 'Create New Template' : 'Edit Template'}
            </DialogTitle>
            <DialogDescription>
              {isNewTemplate 
                ? 'Create a new healthcare-compliant email template'
                : 'Edit the selected email template'
              }
            </DialogDescription>
          </DialogHeader>
          <EmailTemplateBuilder
            template={selectedTemplate}
            onSave={handleSave}
            onCancel={() => setShowBuilder(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your email template will look to recipients
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <EmailTemplatePreview template={selectedTemplate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}