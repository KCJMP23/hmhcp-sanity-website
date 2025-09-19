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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Mail,
  User,
  Calendar,
  Search
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ComplianceCheck {
  id: string
  type: 'can_spam' | 'hipaa' | 'gdpr' | 'fda' | 'general'
  name: string
  description: string
  status: 'pass' | 'fail' | 'warning'
  details: string
  required: boolean
}

interface ComplianceResult {
  overall_status: 'compliant' | 'non_compliant' | 'warning'
  checks: ComplianceCheck[]
  recommendations: string[]
  score: number
}

const complianceTypes = [
  { value: 'can_spam', label: 'CAN-SPAM Act', description: 'US email marketing regulations' },
  { value: 'hipaa', label: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
  { value: 'gdpr', label: 'GDPR', description: 'General Data Protection Regulation' },
  { value: 'fda', label: 'FDA', description: 'Food and Drug Administration guidelines' },
  { value: 'general', label: 'General', description: 'General healthcare compliance' }
]

export function EmailComplianceValidator() {
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [complianceType, setComplianceType] = useState<string>('all')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const { toast } = useToast()

  const validateContent = async () => {
    if (!content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter content to validate',
        variant: 'destructive'
      })
      return
    }

    setValidating(true)
    try {
      const response = await fetch('/api/admin/email/compliance/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          subject,
          from_name: fromName,
          from_email: fromEmail,
          reply_to: replyTo,
          compliance_type: complianceType
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        toast({
          title: 'Validation Complete',
          description: `Compliance score: ${data.data.score}%`
        })
      } else {
        throw new Error(data.error || 'Validation failed')
      }
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: 'Failed to validate content',
        variant: 'destructive'
      })
    } finally {
      setValidating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800'
      case 'fail':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600'
      case 'non_compliant':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Validator</h2>
          <p className="text-muted-foreground">
            Validate email content against healthcare compliance regulations
          </p>
        </div>
        <Button onClick={validateContent} disabled={validating}>
          <Shield className="mr-2 h-4 w-4" />
          {validating ? 'Validating...' : 'Validate Content'}
        </Button>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Email Content to Validate</CardTitle>
          <CardDescription>
            Enter the email content you want to validate for compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compliance_type">Compliance Type</Label>
              <Select value={complianceType} onValueChange={setComplianceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select compliance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regulations</SelectItem>
                  {complianceTypes.map((type) => (
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Healthcare Organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@healthcare.org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply_to">Reply-To Email</Label>
              <Input
                id="reply_to"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="support@healthcare.org"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the email content to validate..."
              rows={8}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Validation Results
            </CardTitle>
            <CardDescription>
              Compliance validation results and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.overall_status)}
                <div>
                  <h3 className="font-semibold">Overall Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.overall_status === 'compliant' && 'Content is compliant with all regulations'}
                    {result.overall_status === 'non_compliant' && 'Content has compliance violations'}
                    {result.overall_status === 'warning' && 'Content has compliance warnings'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getOverallStatusColor(result.overall_status)}`}>
                  {result.score}%
                </div>
                <div className="text-sm text-muted-foreground">Compliance Score</div>
              </div>
            </div>

            {/* Individual Checks */}
            <div>
              <h4 className="font-medium mb-3">Compliance Checks</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.checks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{check.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {check.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          <Badge className={getStatusColor(check.status)}>
                            {check.status.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{check.details}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={check.required ? 'destructive' : 'secondary'}>
                          {check.required ? 'Required' : 'Optional'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Quick Reference</CardTitle>
          <CardDescription>
            Key compliance requirements for healthcare email marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-800">CAN-SPAM Requirements</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Clear and honest subject lines</li>
                <li>• Valid physical address</li>
                <li>• Clear unsubscribe mechanism</li>
                <li>• Honest sender identification</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800">HIPAA Requirements</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• No PHI in email content</li>
                <li>• Patient consent for communications</li>
                <li>• Secure transmission methods</li>
                <li>• Audit trail maintenance</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-purple-800">GDPR Requirements</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Explicit consent for marketing</li>
                <li>• Right to be forgotten</li>
                <li>• Data protection by design</li>
                <li>• Privacy policy transparency</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-orange-800">FDA Requirements</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Accurate medical claims</li>
                <li>• Proper disclaimers</li>
                <li>• No misleading information</li>
                <li>• Professional medical review</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
