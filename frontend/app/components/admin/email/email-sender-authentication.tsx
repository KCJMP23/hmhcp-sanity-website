'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Lock,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Mail,
  Activity,
  Zap,
  Globe,
  Shield,
  Copy,
  Eye,
  Edit
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AuthenticationRecord {
  id: string
  domain: string
  record_type: 'SPF' | 'DKIM' | 'DMARC'
  record_value: string
  status: 'valid' | 'invalid' | 'missing' | 'pending'
  last_checked: string
  expires_at: string
  priority: number
  selector: string
  key_length: number
  algorithm: string
  policy: string
  subdomain_policy: string
  percentage: number
  rua: string
  ruf: string
  recommendations: string[]
}

interface AuthenticationTest {
  id: string
  domain: string
  test_type: 'SPF' | 'DKIM' | 'DMARC' | 'all'
  status: 'passed' | 'failed' | 'warning'
  score: number
  max_score: number
  details: {
    spf: boolean
    dkim: boolean
    dmarc: boolean
    alignment: boolean
  }
  tested_at: string
  results: AuthenticationTestResult[]
}

interface AuthenticationTestResult {
  id: string
  test_name: string
  status: 'passed' | 'failed' | 'warning'
  message: string
  recommendation: string
}

const recordTypes = [
  { value: 'all', label: 'All Records' },
  { value: 'SPF', label: 'SPF', description: 'Sender Policy Framework' },
  { value: 'DKIM', label: 'DKIM', description: 'DomainKeys Identified Mail' },
  { value: 'DMARC', label: 'DMARC', description: 'Domain-based Message Authentication' }
]

const testTypes = [
  { value: 'all', label: 'All Tests' },
  { value: 'SPF', label: 'SPF Test' },
  { value: 'DKIM', label: 'DKIM Test' },
  { value: 'DMARC', label: 'DMARC Test' },
  { value: 'all', label: 'Complete Test' }
]

export function EmailSenderAuthentication() {
  const [records, setRecords] = useState<AuthenticationRecord[]>([])
  const [tests, setTests] = useState<AuthenticationTest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedTestType, setSelectedTestType] = useState('all')
  const [newDomain, setNewDomain] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadAuthenticationData()
  }, [selectedType, selectedTestType])

  const loadAuthenticationData = async () => {
    try {
      setLoading(true)
      const [recordsResponse, testsResponse] = await Promise.all([
        fetch(`/api/admin/email/deliverability/authentication/records?type=${selectedType}`),
        fetch(`/api/admin/email/deliverability/authentication/tests?type=${selectedTestType}`)
      ])
      
      const [recordsData, testsData] = await Promise.all([
        recordsResponse.json(),
        testsResponse.json()
      ])
      
      if (recordsData.success) {
        setRecords(recordsData.data)
      }
      
      if (testsData.success) {
        setTests(testsData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load authentication data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestDomain = async (domain: string) => {
    try {
      const response = await fetch('/api/admin/email/deliverability/authentication/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Domain authentication test completed'
        })
        loadAuthenticationData()
      } else {
        throw new Error('Failed to test domain')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test domain authentication',
        variant: 'destructive'
      })
    }
  }

  const handleGenerateRecord = async (domain: string, recordType: string) => {
    try {
      const response = await fetch('/api/admin/email/deliverability/authentication/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain, record_type: recordType })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `${recordType} record generated successfully`
        })
        loadAuthenticationData()
      } else {
        throw new Error('Failed to generate record')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate authentication record',
        variant: 'destructive'
      })
    }
  }

  const handleCopyRecord = (recordValue: string) => {
    navigator.clipboard.writeText(recordValue)
    toast({
      title: 'Success',
      description: 'Record copied to clipboard'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      valid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      invalid: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      missing: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTestStatusBadge = (status: string) => {
    const statusConfig = {
      passed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.failed
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRecordTypeInfo = (type: string) => {
    return recordTypes.find(t => t.value === type) || recordTypes[0]
  }

  const getTestTypeInfo = (type: string) => {
    return testTypes.find(t => t.value === type) || testTypes[0]
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    if (percentage >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading authentication data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sender Authentication</h2>
          <p className="text-muted-foreground">
            Configure SPF, DKIM, and DMARC records for email authentication
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAuthenticationData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Domain Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Authentication Test
          </CardTitle>
          <CardDescription>
            Test domain authentication records and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => handleTestDomain(newDomain)}
                disabled={!newDomain}
              >
                <Activity className="mr-2 h-4 w-4" />
                Test Domain
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication Records
          </CardTitle>
          <CardDescription>
            Manage SPF, DKIM, and DMARC records for your domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select record type" />
              </SelectTrigger>
              <SelectContent>
                {recordTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      {type.description && (
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Record Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Record Value</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.domain}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.record_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.status)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm font-mono truncate">
                        {record.record_value}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(record.last_checked).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyRecord(record.record_value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Handle view details
                          console.log('View record details:', record.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateRecord(record.domain, record.record_type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Authentication Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Authentication Tests
          </CardTitle>
          <CardDescription>
            Test results and validation for domain authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <Select value={selectedTestType} onValueChange={setSelectedTestType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                {testTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Test Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Tested At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    <div className="font-medium">{test.domain}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{test.test_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {getTestStatusBadge(test.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getScoreColor(test.score, test.max_score)}`}>
                        {test.score}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {test.max_score}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {test.details.spf && <Badge className="bg-green-100 text-green-800">SPF</Badge>}
                      {test.details.dkim && <Badge className="bg-green-100 text-green-800">DKIM</Badge>}
                      {test.details.dmarc && <Badge className="bg-green-100 text-green-800">DMARC</Badge>}
                      {test.details.alignment && <Badge className="bg-green-100 text-green-800">Align</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(test.tested_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Handle view details
                          console.log('View test details:', test.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Authentication Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Authentication Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve email authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((record) => (
              record.recommendations.length > 0 && (
                <div key={record.id} className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">
                    {record.domain} - {record.record_type} Recommendations
                  </div>
                  <ul className="space-y-1 text-sm text-blue-700">
                    {record.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
