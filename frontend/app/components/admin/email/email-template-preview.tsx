'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Code, 
  Smartphone, 
  Monitor,
  Shield,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import type { EmailTemplate } from '@/types/email-campaigns'

interface EmailTemplatePreviewProps {
  template: EmailTemplate
}

export function EmailTemplatePreview({ template }: EmailTemplatePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showCompliance, setShowCompliance] = useState(true)

  const getComplianceStatus = () => {
    const compliance = template.healthcare_compliance || {}
    const statuses = []
    
    if (compliance.hipaa) statuses.push({ name: 'HIPAA', status: 'compliant', color: 'bg-green-100 text-green-800' })
    if (compliance.can_spam) statuses.push({ name: 'CAN-SPAM', status: 'compliant', color: 'bg-green-100 text-green-800' })
    if (compliance.fda) statuses.push({ name: 'FDA', status: 'compliant', color: 'bg-green-100 text-green-800' })
    if (compliance.gdpr) statuses.push({ name: 'GDPR', status: 'compliant', color: 'bg-green-100 text-green-800' })
    
    return statuses
  }

  const checkComplianceIssues = () => {
    const issues = []
    const content = template.template_definition?.html_content?.toLowerCase() || ''
    
    // Check for PHI indicators
    const phiIndicators = ['ssn', 'social security', 'patient id', 'medical record', 'diagnosis', 'treatment']
    phiIndicators.forEach(indicator => {
      if (content.includes(indicator)) {
        issues.push(`Content may contain PHI: "${indicator}"`)
      }
    })
    
    // Check for required compliance elements
    if (template.healthcare_compliance?.can_spam) {
      if (!content.includes('unsubscribe')) {
        issues.push('CAN-SPAM compliance requires unsubscribe link')
      }
      if (!content.includes('physical address')) {
        issues.push('CAN-SPAM compliance requires physical address')
      }
    }
    
    return issues
  }

  const complianceStatuses = getComplianceStatus()
  const complianceIssues = checkComplianceIssues()

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {template.name}
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompliance(!showCompliance)}
              >
                {showCompliance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCompliance ? 'Hide' : 'Show'} Compliance
              </Button>
            </div>
          </div>
        </CardHeader>
        {showCompliance && (
          <CardContent>
            <div className="space-y-4">
              {/* Compliance Status */}
              <div>
                <h4 className="font-medium mb-2">Compliance Status</h4>
                <div className="flex gap-2">
                  {complianceStatuses.map((status) => (
                    <Badge key={status.name} className={status.color}>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {status.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Compliance Issues */}
              {complianceIssues.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Compliance Issues
                  </h4>
                  <ul className="space-y-1">
                    {complianceIssues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-700">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="mr-2 h-4 w-4" />
            Desktop
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Email Preview */}
      <Tabs defaultValue="html" className="space-y-4">
        <TabsList>
          <TabsTrigger value="html" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            HTML Preview
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Text Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="html">
          <Card>
            <CardHeader>
              <CardTitle>HTML Email Preview</CardTitle>
              <CardDescription>
                How your email will appear in email clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`border rounded-lg overflow-hidden ${
                previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
              }`}>
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <div className="text-sm font-medium">Subject: {template.template_definition?.subject || 'No subject'}</div>
                </div>
                <div className="p-4 bg-white">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: template.template_definition?.html_content || '<p>No HTML content available</p>' 
                    }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Plain Text Preview</CardTitle>
              <CardDescription>
                Plain text version of your email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`border rounded-lg overflow-hidden ${
                previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
              }`}>
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <div className="text-sm font-medium">Subject: {template.template_definition?.subject || 'No subject'}</div>
                </div>
                <div className="p-4 bg-white">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {template.template_definition?.text_content || 'No text content available'}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Category:</span>
              <span className="ml-2 capitalize">{template.category?.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-2">{new Date(template.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <span className="ml-2">{new Date(template.updated_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium">Target Audience:</span>
              <span className="ml-2">{template.target_audience?.length || 0} segments</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
