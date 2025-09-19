"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAdminToast } from '@/hooks/use-admin-toast'
import { toast } from '@/hooks/use-toast'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Upload, 
  User, 
  FileText, 
  Settings, 
  Database,
  Heart
} from 'lucide-react'

/**
 * Comprehensive Toast Notification Demo Component
 * Showcases all toast types and patterns for the admin interface
 */
export function ToastDemo() {
  const adminToast = useAdminToast()
  const [customTitle, setCustomTitle] = useState('Custom Toast')
  const [customMessage, setCustomMessage] = useState('This is a custom toast message')
  const [customDuration, setCustomDuration] = useState('5000')
  const [customType, setCustomType] = useState<'success' | 'error' | 'warning' | 'info'>('success')

  const showBasicToasts = () => {
    // Basic toast types
    toast.success({
      title: "Success Toast",
      description: "This is a success notification with an icon",
      duration: 4000
    })

    setTimeout(() => {
      toast.error({
        title: "Error Toast", 
        description: "This is an error notification with detailed message",
        duration: 6000
      })
    }, 1000)

    setTimeout(() => {
      toast.warning({
        title: "Warning Toast",
        description: "This is a warning notification about something important",
        duration: 5000
      })
    }, 2000)

    setTimeout(() => {
      toast.info({
        title: "Info Toast",
        description: "This is an informational notification with helpful details",
        duration: 4000
      })
    }, 3000)
  }

  const showUserManagementToasts = () => {
    adminToast.user.created('John Doe')
    setTimeout(() => adminToast.user.updated('Jane Smith'), 1000)
    setTimeout(() => adminToast.user.deleted('Bob Wilson'), 2000)
  }

  const showContentManagementToasts = () => {
    adminToast.content.saved('post', 'My Amazing Blog Post')
    setTimeout(() => adminToast.content.published('page', 'About Us Page'), 1000)
    setTimeout(() => adminToast.content.deleted('post', 'Draft Article'), 2000)
    setTimeout(() => adminToast.content.bulkOperation('delete', 5, 'post'), 3000)
  }

  const showHealthcareToasts = () => {
    adminToast.healthcare.trial.created('COVID-19 Vaccine Study')
    setTimeout(() => adminToast.healthcare.publication.created('Clinical Research Findings'), 1000)
    setTimeout(() => adminToast.healthcare.qualityStudy.updated('Patient Safety Analysis'), 2000)
  }

  const showFileOperationToasts = () => {
    adminToast.file.uploadSuccess('document.pdf')
    setTimeout(() => adminToast.file.deleteSuccess('old-file.jpg'), 1000)
    setTimeout(() => adminToast.file.quotaExceeded('storage', '100MB'), 2000)
  }

  const showFormValidationToasts = () => {
    adminToast.form.validationError('Email Address')
    setTimeout(() => adminToast.form.unsavedChanges(), 1500)
  }

  const showApiOperationToasts = () => {
    adminToast.api.loading('Saving data')
    setTimeout(() => adminToast.api.networkError('save data'), 2000)
    setTimeout(() => adminToast.api.unauthorized(), 3000)
  }

  const showCustomToast = () => {
    const duration = parseInt(customDuration) || 5000
    
    toast[customType]({
      title: customTitle,
      description: customMessage,
      duration: duration
    })
  }

  const showAsyncOperation = async () => {
    try {
      adminToast.api.loading('Processing async operation...')
      
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate random success/failure
      if (Math.random() > 0.3) {
        adminToast.admin.postSaved('Async Content')
      } else {
        throw new Error('Network timeout occurred')
      }
    } catch (error) {
      adminToast.api.serverError(error instanceof Error ? error.message : 'Operation failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-light text-gray-900 dark:text-gray-100 tracking-[-0.005em]">
          Toast Notification System
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-text">
          Comprehensive Apple-inspired toast notifications for the admin interface
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Toast Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Basic Toast Types
            </CardTitle>
            <CardDescription>
              Fundamental toast notifications with different variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showBasicToasts} className="w-full">
              Show All Basic Toasts
            </Button>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">Success</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="outline">Warning</Badge>
              <Badge variant="default">Info</Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              User Management
            </CardTitle>
            <CardDescription>
              Toasts for user CRUD operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showUserManagementToasts} className="w-full">
              Demo User Operations
            </Button>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Create, update, and delete user notifications
            </div>
          </CardContent>
        </Card>

        {/* Content Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Content Management
            </CardTitle>
            <CardDescription>
              Toasts for posts, pages, and content operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showContentManagementToasts} className="w-full">
              Demo Content Operations
            </Button>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Save, publish, delete, and bulk operations
            </div>
          </CardContent>
        </Card>

        {/* Healthcare-Specific */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Healthcare Operations
            </CardTitle>
            <CardDescription>
              Specialized toasts for medical content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showHealthcareToasts} className="w-full">
              Demo Healthcare Operations
            </Button>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Clinical trials, publications, quality studies
            </div>
          </CardContent>
        </Card>

        {/* File Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              File Operations
            </CardTitle>
            <CardDescription>
              Upload, delete, and quota notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showFileOperationToasts} className="w-full">
              Demo File Operations
            </Button>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              File uploads, deletions, and storage limits
            </div>
          </CardContent>
        </Card>

        {/* Form Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Form Validation
            </CardTitle>
            <CardDescription>
              Form errors and validation messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showFormValidationToasts} className="w-full">
              Demo Form Errors
            </Button>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Field validation and unsaved changes
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* API Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            API & Async Operations
          </CardTitle>
          <CardDescription>
            Network requests, loading states, and async operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={showApiOperationToasts} variant="outline">
              Demo API Errors
            </Button>
            <Button onClick={showAsyncOperation}>
              Demo Async Operation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Custom Toast Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Custom Toast Builder
          </CardTitle>
          <CardDescription>
            Create custom toasts with your own content and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-title">Title</Label>
              <Input
                id="custom-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Toast title"
              />
            </div>
            <div>
              <Label htmlFor="custom-type">Type</Label>
              <Select value={customType} onValueChange={(value: any) => setCustomType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="custom-message">Message</Label>
            <Input
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Toast message"
            />
          </div>
          
          <div>
            <Label htmlFor="custom-duration">Duration (ms)</Label>
            <Input
              id="custom-duration"
              type="number"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              placeholder="5000"
            />
          </div>
          
          <Button onClick={showCustomToast} className="w-full">
            Show Custom Toast
          </Button>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to use the toast system in your components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg font-mono text-sm">
            <div className="text-green-600 dark:text-green-400">// Import the hook</div>
            <div className="text-gray-800 dark:text-gray-200">
              import {"{ useAdminToast }"} from '@/hooks/use-admin-toast'
            </div>
            <br />
            <div className="text-green-600 dark:text-green-400">// Use in component</div>
            <div className="text-gray-800 dark:text-gray-200">
              const adminToast = useAdminToast()
            </div>
            <br />
            <div className="text-green-600 dark:text-green-400">// Show success toast</div>
            <div className="text-gray-800 dark:text-gray-200">
              adminToast.user.created('John Doe')
            </div>
            <br />
            <div className="text-green-600 dark:text-green-400">// Show error toast</div>
            <div className="text-gray-800 dark:text-gray-200">
              adminToast.api.serverError('Something went wrong')
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}