'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PHIDetection {
  id: string
  type: 'ssn' | 'name' | 'dob' | 'address' | 'phone' | 'email' | 'mrn' | 'insurance' | 'other'
  value: string
  confidence: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  position: {
    start: number
    end: number
  }
  suggestion: string
}

interface PHIResult {
  has_phi: boolean
  total_detections: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  detections: PHIDetection[]
  recommendations: string[]
  risk_score: number
}

const phiTypes = [
  { 
    type: 'ssn', 
    label: 'Social Security Number', 
    icon: CreditCard,
    description: '9-digit SSN format',
    severity: 'critical'
  },
  { 
    type: 'name', 
    label: 'Patient Name', 
    icon: User,
    description: 'Full patient names',
    severity: 'high'
  },
  { 
    type: 'dob', 
    label: 'Date of Birth', 
    icon: Calendar,
    description: 'Birth dates and ages',
    severity: 'high'
  },
  { 
    type: 'address', 
    label: 'Address', 
    icon: MapPin,
    description: 'Physical addresses',
    severity: 'medium'
  },
  { 
    type: 'phone', 
    label: 'Phone Number', 
    icon: Phone,
    description: 'Phone numbers',
    severity: 'medium'
  },
  { 
    type: 'email', 
    label: 'Email Address', 
    icon: Mail,
    description: 'Patient email addresses',
    severity: 'medium'
  },
  { 
    type: 'mrn', 
    label: 'Medical Record Number', 
    icon: FileText,
    description: 'Medical record identifiers',
    severity: 'critical'
  },
  { 
    type: 'insurance', 
    label: 'Insurance Information', 
    icon: Shield,
    description: 'Insurance policy numbers',
    severity: 'high'
  }
]

export function EmailPHIDetector() {
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [result, setResult] = useState<PHIResult | null>(null)
  const [selectedDetection, setSelectedDetection] = useState<PHIDetection | null>(null)
  const { toast } = useToast()

  const detectPHI = async () => {
    if (!content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter content to scan for PHI',
        variant: 'destructive'
      })
      return
    }

    setDetecting(true)
    try {
      const response = await fetch('/api/admin/email/compliance/detect-phi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          subject
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        toast({
          title: 'PHI Detection Complete',
          description: `Found ${data.data.total_detections} potential PHI instances`
        })
      } else {
        throw new Error(data.error || 'PHI detection failed')
      }
    } catch (error) {
      toast({
        title: 'Detection Error',
        description: 'Failed to detect PHI in content',
        variant: 'destructive'
      })
    } finally {
      setDetecting(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const highlightPHI = (text: string, detections: PHIDetection[]) => {
    if (!detections.length) return text

    let highlighted = text
    const sortedDetections = [...detections].sort((a, b) => b.position.start - a.position.start)

    sortedDetections.forEach((detection) => {
      const before = highlighted.substring(0, detection.position.start)
      const match = highlighted.substring(detection.position.start, detection.position.end)
      const after = highlighted.substring(detection.position.end)
      
      highlighted = `${before}<mark class="bg-yellow-200 px-1 rounded" data-detection-id="${detection.id}">${match}</mark>${after}`
    })

    return highlighted
  }

  const getTypeInfo = (type: string) => {
    return phiTypes.find(t => t.type === type) || phiTypes[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PHI Detector</h2>
          <p className="text-muted-foreground">
            Scan email content for Protected Health Information (PHI)
          </p>
        </div>
        <Button onClick={detectPHI} disabled={detecting}>
          <Search className="mr-2 h-4 w-4" />
          {detecting ? 'Scanning...' : 'Scan for PHI'}
        </Button>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Content to Scan</CardTitle>
          <CardDescription>
            Enter email content to scan for Protected Health Information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the email content to scan for PHI..."
              rows={8}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detection Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              PHI Detection Results
            </CardTitle>
            <CardDescription>
              Protected Health Information detected in the content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Risk Assessment */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {result.has_phi ? (
                  <XCircle className="h-8 w-8 text-red-600" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {result.has_phi ? 'PHI Detected' : 'No PHI Detected'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {result.has_phi 
                      ? 'Content contains Protected Health Information'
                      : 'Content appears to be free of PHI'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getRiskScoreColor(result.risk_score)}`}>
                  {result.risk_score}%
                </div>
                <div className="text-sm text-muted-foreground">Risk Score</div>
              </div>
            </div>

            {/* Detection Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.critical_count}</div>
                <div className="text-sm text-red-800">Critical</div>
              </div>
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{result.high_count}</div>
                <div className="text-sm text-orange-800">High</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.medium_count}</div>
                <div className="text-sm text-yellow-800">Medium</div>
              </div>
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.low_count}</div>
                <div className="text-sm text-blue-800">Low</div>
              </div>
            </div>

            {/* Detected PHI */}
            {result.detections.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Detected PHI Instances</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.detections.map((detection) => {
                      const typeInfo = getTypeInfo(detection.type)
                      const TypeIcon = typeInfo.icon
                      
                      return (
                        <TableRow key={detection.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{typeInfo.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {typeInfo.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {detection.value}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(detection.severity)}
                              <Badge className={getSeverityColor(detection.severity)}>
                                {detection.severity.toUpperCase()}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {Math.round(detection.confidence * 100)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDetection(detection)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

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

      {/* PHI Type Reference */}
      <Card>
        <CardHeader>
          <CardTitle>PHI Types Reference</CardTitle>
          <CardDescription>
            Common types of Protected Health Information to watch for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {phiTypes.map((type) => {
              const Icon = type.icon
              return (
                <div key={type.type} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                  <Badge className={getSeverityColor(type.severity)}>
                    {type.severity.toUpperCase()}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
