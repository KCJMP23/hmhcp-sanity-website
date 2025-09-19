'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  BarChart3,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ComplianceReport {
  id: string
  regulation: string
  compliance_score: number
  total_checks: number
  passed_checks: number
  failed_checks: number
  warnings: number
  last_checked: string
  status: 'compliant' | 'non_compliant' | 'warning'
  violations: ComplianceViolation[]
}

interface ComplianceViolation {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affected_campaigns: number
  affected_contacts: number
  first_detected: string
  last_detected: string
  status: 'open' | 'resolved' | 'ignored'
  resolution_notes: string
}

const regulations = [
  { value: 'can_spam', label: 'CAN-SPAM Act', description: 'US email marketing regulations' },
  { value: 'gdpr', label: 'GDPR', description: 'EU General Data Protection Regulation' },
  { value: 'hipaa', label: 'HIPAA', description: 'US Health Insurance Portability and Accountability Act' },
  { value: 'fda', label: 'FDA', description: 'US Food and Drug Administration regulations' },
  { value: 'ccpa', label: 'CCPA', description: 'California Consumer Privacy Act' },
  { value: 'all', label: 'All Regulations', description: 'All compliance regulations' }
]

const violationTypes = [
  { value: 'missing_unsubscribe', label: 'Missing Unsubscribe Link', severity: 'critical' },
  { value: 'invalid_unsubscribe', label: 'Invalid Unsubscribe Link', severity: 'high' },
  { value: 'missing_physical_address', label: 'Missing Physical Address', severity: 'high' },
  { value: 'deceptive_subject', label: 'Deceptive Subject Line', severity: 'medium' },
  { value: 'missing_identification', label: 'Missing Sender Identification', severity: 'medium' },
  { value: 'phi_detected', label: 'PHI Detected in Email', severity: 'critical' },
  { value: 'consent_missing', label: 'Missing Consent', severity: 'high' },
  { value: 'data_retention', label: 'Data Retention Violation', severity: 'medium' }
]

export function EmailComplianceReporting() {
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [violations, setViolations] = useState<ComplianceViolation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegulation, setSelectedRegulation] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [dateRange, setDateRange] = useState('30d')
  const { toast } = useToast()

  useEffect(() => {
    loadComplianceData()
  }, [selectedRegulation, dateRange])

  const loadComplianceData = async () => {
    try {
      setLoading(true)
      const [reportsResponse, violationsResponse] = await Promise.all([
        fetch(`/api/admin/email/compliance/reports?regulation=${selectedRegulation}&date_range=${dateRange}`),
        fetch(`/api/admin/email/compliance/violations?regulation=${selectedRegulation}&severity=${selectedSeverity}`)
      ])
      
      const [reportsData, violationsData] = await Promise.all([
        reportsResponse.json(),
        violationsResponse.json()
      ])
      
      if (reportsData.success) {
        setReports(reportsData.data)
      }
      
      if (violationsData.success) {
        setViolations(violationsData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load compliance data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (regulation: string) => {
    try {
      const response = await fetch(`/api/admin/email/compliance/reports/${regulation}/export`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Compliance report exported successfully'
        })
      } else {
        throw new Error('Failed to export report')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export compliance report',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      compliant: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      non_compliant: { color: 'bg-red-100 text-red-800', icon: XCircle },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.compliant
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'bg-blue-100 text-blue-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      high: { color: 'bg-orange-100 text-orange-800' },
      critical: { color: 'bg-red-100 text-red-800' }
    }
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.low
    
    return (
      <Badge className={config.color}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const getRegulationInfo = (regulation: string) => {
    return regulations.find(r => r.value === regulation) || regulations[0]
  }

  const getViolationTypeInfo = (type: string) => {
    return violationTypes.find(t => t.value === type) || violationTypes[0]
  }

  const overallComplianceScore = reports.length > 0 
    ? reports.reduce((sum, r) => sum + r.compliance_score, 0) / reports.length
    : 0

  const totalViolations = violations.length
  const criticalViolations = violations.filter(v => v.severity === 'critical').length
  const highViolations = violations.filter(v => v.severity === 'high').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Reporting</h2>
          <p className="text-muted-foreground">
            Monitor compliance across all email regulations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadComplianceData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExportReport(selectedRegulation)}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallComplianceScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {overallComplianceScore >= 95 ? 'Excellent' : 
               overallComplianceScore >= 85 ? 'Good' : 
               overallComplianceScore >= 70 ? 'Fair' : 'Poor'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViolations}</div>
            <p className="text-xs text-muted-foreground">
              {criticalViolations} critical, {highViolations} high
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regulations Monitored</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              Active compliance monitoring
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.length > 0 ? new Date(reports[0].last_checked).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Compliance check
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Compliance Filters
          </CardTitle>
          <CardDescription>
            Filter compliance data by regulation and severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Regulation</label>
              <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select regulation" />
                </SelectTrigger>
                <SelectContent>
                  {regulations.map((regulation) => (
                    <SelectItem key={regulation.value} value={regulation.value}>
                      <div>
                        <div className="font-medium">{regulation.label}</div>
                        <div className="text-xs text-muted-foreground">{regulation.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Reports
          </CardTitle>
          <CardDescription>
            Detailed compliance status by regulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Regulation</TableHead>
                <TableHead>Compliance Score</TableHead>
                <TableHead>Checks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const regulationInfo = getRegulationInfo(report.regulation)
                
                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{regulationInfo.label}</div>
                        <div className="text-sm text-muted-foreground">{regulationInfo.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{report.compliance_score.toFixed(1)}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              report.compliance_score >= 95 ? 'bg-green-500' :
                              report.compliance_score >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${report.compliance_score}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{report.passed_checks} passed</div>
                        <div className="text-red-600">{report.failed_checks} failed</div>
                        <div className="text-yellow-600">{report.warnings} warnings</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(report.last_checked).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportReport(report.regulation)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle view details
                            console.log('View details for report:', report.id)
                          }}
                        >
                          <Activity className="h-4 w-4" />
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

      {/* Compliance Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Compliance Violations
          </CardTitle>
          <CardDescription>
            Active compliance violations requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Affected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>First Detected</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((violation) => {
                const typeInfo = getViolationTypeInfo(violation.type)
                
                return (
                  <TableRow key={violation.id}>
                    <TableCell>
                      <div className="font-medium">{typeInfo.label}</div>
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(violation.severity)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm">{violation.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{violation.affected_campaigns} campaigns</div>
                        <div>{violation.affected_contacts} contacts</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={violation.status === 'open' ? 'destructive' : 'secondary'}>
                        {violation.status.charAt(0).toUpperCase() + violation.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(violation.first_detected).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle resolve violation
                            console.log('Resolve violation:', violation.id)
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle view details
                            console.log('View violation details:', violation.id)
                          }}
                        >
                          <Activity className="h-4 w-4" />
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
    </div>
  )
}
