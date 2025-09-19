'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Activity, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Download,
  Clock,
  User,
  Lock
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"

interface AuditEvent {
  id: string
  eventType: string
  userId: string
  userEmail: string
  userRole: string
  requestId: string
  ipAddress: string
  userAgent: string
  details: Record<string, any>
  createdAt: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface ComplianceMetrics {
  totalEvents: number
  securityViolations: number
  accessAttempts: number
  dataOperations: number
  complianceScore: number
  lastAuditDate: string
  hipaaCompliantOperations: number
  encryptedDataOperations: number
}

interface AuditComplianceMonitorProps {
  className?: string
  showDetailed?: boolean
}

export function AuditComplianceMonitor({ 
  className = "", 
  showDetailed = false 
}: AuditComplianceMonitorProps) {
  const { user, checkPermission } = useAuth()
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  // Check if user has audit viewing permissions
  const canViewAudit = checkPermission('audit.view') || checkPermission('admin.full')
  const canExportAudit = checkPermission('audit.export') || checkPermission('admin.full')

  useEffect(() => {
    if (canViewAudit) {
      loadAuditData()
    }
  }, [canViewAudit, timeRange])

  const loadAuditData = async () => {
    try {
      setIsLoading(true)
      
      const [eventsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/admin/security/audit-events?timeRange=${timeRange}&limit=10`),
        fetch(`/api/admin/security/compliance-metrics?timeRange=${timeRange}`)
      ])

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setAuditEvents(eventsData.events || [])
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.metrics)
      }
    } catch (error) {
      console.error('Failed to load audit data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportAuditData = async () => {
    try {
      const response = await fetch(`/api/admin/security/audit-export?timeRange=${timeRange}`, {
        method: 'POST'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `audit-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export audit data:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ACCESS_GRANTED':
      case 'ACCESS_ATTEMPT':
        return <User className="h-4 w-4" />
      case 'ACCESS_DENIED':
      case 'SECURITY_VIOLATION':
        return <Lock className="h-4 w-4" />
      case 'DATA_CREATE':
      case 'DATA_UPDATE':
      case 'DATA_DELETE':
        return <FileText className="h-4 w-4" />
      case 'DATA_READ':
        return <Eye className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getComplianceLevel = (score: number) => {
    if (score >= 95) return { level: 'Excellent', color: 'text-green-600', icon: CheckCircle }
    if (score >= 85) return { level: 'Good', color: 'text-blue-600', icon: CheckCircle }
    if (score >= 70) return { level: 'Fair', color: 'text-yellow-600', icon: AlertTriangle }
    return { level: 'Needs Attention', color: 'text-red-600', icon: AlertTriangle }
  }

  if (!canViewAudit) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Insufficient permissions to view audit and compliance data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin mr-2" />
            Loading compliance data...
          </div>
        </CardContent>
      </Card>
    )
  }

  const compliance = metrics ? getComplianceLevel(metrics.complianceScore) : null

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            HIPAA Compliance Status
            {compliance && (
              <Badge className={`ml-2 ${getSeverityColor(
                compliance.level === 'Excellent' ? 'low' :
                compliance.level === 'Good' ? 'medium' :
                compliance.level === 'Fair' ? 'high' : 'critical'
              )}`}>
                {compliance.level}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className={`text-2xl font-bold ${compliance?.color}`}>
                  {metrics.complianceScore}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">HIPAA Operations</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.hipaaCompliantOperations}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.securityViolations}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Encrypted Ops</p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.encryptedDataOperations}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Audit Events */}
      {showDetailed && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Audit Events
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
                {canExportAudit && (
                  <Button
                    onClick={exportAuditData}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditEvents.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No audit events found for the selected time range
                </p>
              ) : (
                auditEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.eventType)}
                        <span className="font-medium">{event.eventType}</span>
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{event.userEmail}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Alerts */}
      {metrics && metrics.securityViolations > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Security Alert:</span> {metrics.securityViolations} security 
            violations detected in the last {timeRange}. Review audit logs and take appropriate action.
          </AlertDescription>
        </Alert>
      )}

      {/* HIPAA Compliance Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">HIPAA Compliance</h4>
              <p className="text-sm text-blue-800 mt-1">
                All automation activities are logged and monitored for HIPAA compliance. 
                Audit trails are maintained for {metrics?.lastAuditDate ? 
                  `data from ${new Date(metrics.lastAuditDate).toLocaleDateString()}` : 
                  'all system activities'
                }. Regular compliance assessments ensure data protection standards are met.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}