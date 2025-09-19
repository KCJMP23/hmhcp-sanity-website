'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  EyeOff,
  Filter,
  X,
  Clock,
  AlertCircle,
  UserX,
  Database,
  FileWarning,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SecurityDashboardResponse } from '@/lib/types/security'

// Define ThreatIndicator type locally since it might not be exported
interface ThreatIndicator {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  count: number
  trend: 'increasing' | 'decreasing' | 'stable'
  lastOccurrence: Date
}

interface ThreatIndicatorsProps {
  data: SecurityDashboardResponse['data'] | null
  timeRange: string
  className?: string
  onAcknowledge?: (id: string) => void
  onDismiss?: (id: string) => void
}

export function ThreatIndicators({ 
  data, 
  timeRange,
  className,
  onAcknowledge,
  onDismiss
}: ThreatIndicatorsProps) {
  const isLoading = !data
  const indicators = data?.detailed_metrics?.threatIndicators || []
  const vulnerabilities = data?.metrics?.vulnerability_count || 0
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const filteredIndicators = indicators.filter(indicator => {
    const severityMatch = selectedSeverity === 'all' || indicator.severity === selectedSeverity
    const typeMatch = selectedType === 'all' || indicator.type === selectedType
    return severityMatch && typeMatch
  })

  const severityCounts = indicators.reduce((acc, indicator) => {
    acc[indicator.severity] = (acc[indicator.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Threat Indicators</h3>
          <p className="text-sm text-gray-600">
            Real-time security threats and anomalies detected
          </p>
        </div>
        <ThreatSummaryBadges counts={severityCounts} isLoading={isLoading} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <Tabs value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="critical" className="text-xs">Critical</TabsTrigger>
            <TabsTrigger value="high" className="text-xs">High</TabsTrigger>
            <TabsTrigger value="medium" className="text-xs">Medium</TabsTrigger>
            <TabsTrigger value="low" className="text-xs">Low</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs">All Types</TabsTrigger>
            <TabsTrigger value="failed_login" className="text-xs">Failed Logins</TabsTrigger>
            <TabsTrigger value="suspicious_access" className="text-xs">Suspicious Access</TabsTrigger>
            <TabsTrigger value="data_breach_attempt" className="text-xs">Breach Attempts</TabsTrigger>
            <TabsTrigger value="compliance_violation" className="text-xs">Violations</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Critical Alerts */}
      {filteredIndicators.filter(i => i.severity === 'critical').map(indicator => (
        <Alert key={indicator.id} className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Threat Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {indicator.description}
            <div className="mt-2 flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-700 border-red-200 hover:bg-red-100"
                onClick={() => onAcknowledge?.(indicator.id)}
              >
                Acknowledge
              </Button>
              <span className="text-xs text-red-600">
                Last seen: {formatRelativeTime(indicator.lastOccurrence)}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      ))}

      {/* Threat Indicators Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <ThreatIndicatorSkeleton />
        ) : filteredIndicators.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No threat indicators found</p>
                <p className="text-sm">Your system appears secure with the current filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredIndicators.map(indicator => (
            <ThreatIndicatorCard
              key={indicator.id}
              indicator={indicator}
              showDetails={showDetails === indicator.id}
              onToggleDetails={() => setShowDetails(
                showDetails === indicator.id ? null : indicator.id
              )}
              onAcknowledge={onAcknowledge}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>

      {/* Trend Analysis */}
      {!isLoading && indicators.length > 0 && (
        <ThreatTrendAnalysis indicators={indicators} />
      )}
    </div>
  )
}

function ThreatSummaryBadges({ 
  counts, 
  isLoading 
}: { 
  counts: Record<string, number>
  isLoading: boolean 
}) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  const severityConfig = {
    critical: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
    high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
    medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
    low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertTriangle }
  }

  return (
    <div className="flex gap-2">
      {Object.entries(severityConfig).map(([severity, config]) => {
        const count = counts[severity] || 0
        const Icon = config.icon
        return (
          <Badge
            key={severity}
            variant="outline"
            className={cn("gap-1", config.color)}
          >
            <Icon className="h-3 w-3" />
            {count} {severity}
          </Badge>
        )
      })}
    </div>
  )
}

function ThreatIndicatorCard({
  indicator,
  showDetails,
  onToggleDetails,
  onAcknowledge,
  onDismiss
}: {
  indicator: ThreatIndicator
  showDetails: boolean
  onToggleDetails: () => void
  onAcknowledge?: (id: string) => void
  onDismiss?: (id: string) => void
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-blue-500 bg-blue-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800'
      case 'high': return 'text-orange-800'
      case 'medium': return 'text-yellow-800'
      case 'low': return 'text-blue-800'
      default: return 'text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <UserX className="h-4 w-4" />
      case 'suspicious_access': return <Eye className="h-4 w-4" />
      case 'data_breach_attempt': return <Database className="h-4 w-4" />
      case 'compliance_violation': return <FileWarning className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className={cn("border-l-4", getSeverityColor(indicator.severity))}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={getSeverityTextColor(indicator.severity)}>
              {getTypeIcon(indicator.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">
                  {formatThreatType(indicator.type)}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getSeverityTextColor(indicator.severity))}
                >
                  {indicator.severity.toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {indicator.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDetails}
              className="h-8 w-8 p-0"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(indicator.id)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">{indicator.count}</span>
              <span>occurrences</span>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(indicator.trend)}
              <span className="capitalize">{indicator.trend}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatRelativeTime(indicator.lastOccurrence)}</span>
            </div>
          </div>
          
          {onAcknowledge && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(indicator.id)}
              className="gap-1"
            >
              <Shield className="h-3 w-3" />
              Acknowledge
            </Button>
          )}
        </div>

        {/* Threat Level Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Threat Level</span>
            <span className="text-xs text-gray-500">{getThreatLevelPercentage(indicator)}%</span>
          </div>
          <Progress 
            value={getThreatLevelPercentage(indicator)} 
            className="h-2"
          />
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">First Detected:</span>
                <div className="text-gray-600">
                  {formatDateTime(new Date(Date.now() - (24 * 60 * 60 * 1000)))}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Occurrence:</span>
                <div className="text-gray-600">
                  {formatDateTime(indicator.lastOccurrence)}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Frequency:</span>
                <div className="text-gray-600">
                  {getFrequencyDescription(indicator.count, indicator.trend)}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <div className="text-gray-600">Active</div>
              </div>
            </div>

            {/* Additional Context */}
            <div>
              <span className="font-medium text-gray-700 text-sm">Risk Assessment:</span>
              <div className="text-sm text-gray-600 mt-1">
                {getRiskAssessment(indicator)}
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <span className="font-medium text-gray-700 text-sm">Recommended Actions:</span>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                {getRecommendedActions(indicator).map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ThreatTrendAnalysis({ indicators }: { indicators: ThreatIndicator[] }) {
  const trendCounts = indicators.reduce((acc, indicator) => {
    acc[indicator.trend] = (acc[indicator.trend] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalThreats = indicators.reduce((sum, indicator) => sum + indicator.count, 0)
  const avgThreatLevel = indicators.length > 0 
    ? indicators.reduce((sum, indicator) => sum + getThreatLevelPercentage(indicator), 0) / indicators.length 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Threat Trend Analysis
        </CardTitle>
        <CardDescription>
          Overall threat landscape and trending patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">{indicators.length}</div>
            <div className="text-sm text-gray-600">Active Indicators</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">{totalThreats}</div>
            <div className="text-sm text-gray-600">Total Occurrences</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-orange-600">{avgThreatLevel.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Avg Threat Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {trendCounts.decreasing || 0}
            </div>
            <div className="text-sm text-gray-600">Decreasing Threats</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Trend Distribution</div>
          <div className="flex gap-2">
            {Object.entries(trendCounts).map(([trend, count]) => {
              const percentage = (count / indicators.length) * 100
              const color = {
                increasing: 'bg-red-500',
                decreasing: 'bg-green-500',
                stable: 'bg-gray-500'
              }[trend] || 'bg-blue-500'

              return (
                <div key={trend} className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs capitalize text-gray-600">{trend}</span>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ThreatIndicatorSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-64" />
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-2 bg-gray-200 rounded w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Helper functions
function formatThreatType(type: string): string {
  const typeMap = {
    failed_login: 'Failed Login Attempts',
    suspicious_access: 'Suspicious Access Pattern',
    data_breach_attempt: 'Data Breach Attempt',
    compliance_violation: 'Compliance Violation'
  }
  return typeMap[type as keyof typeof typeMap] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getThreatLevelPercentage(indicator: ThreatIndicator): number {
  const severityScores = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 100
  }
  return severityScores[indicator.severity as keyof typeof severityScores] || 0
}

function getFrequencyDescription(count: number, trend: string): string {
  let frequency = 'Normal'
  if (count > 50) frequency = 'Very High'
  else if (count > 20) frequency = 'High'
  else if (count > 10) frequency = 'Moderate'
  
  const trendText = trend === 'increasing' ? ' (Rising)' : 
                   trend === 'decreasing' ? ' (Declining)' : ''
  
  return frequency + trendText
}

function getRiskAssessment(indicator: ThreatIndicator): string {
  const assessments = {
    failed_login: 'Potential brute force attack or credential stuffing attempt. Monitor for patterns and consider implementing additional authentication controls.',
    suspicious_access: 'Unusual access patterns detected. Could indicate compromised credentials or insider threat activity.',
    data_breach_attempt: 'Direct attempt to access sensitive data without authorization. High priority security incident requiring immediate investigation.',
    compliance_violation: 'Activity that violates HIPAA or other compliance requirements. May result in regulatory penalties if not addressed.'
  }
  return assessments[indicator.type as keyof typeof assessments] || 'Unknown threat pattern requiring investigation.'
}

function getRecommendedActions(indicator: ThreatIndicator): string[] {
  const actions = {
    failed_login: [
      'Review user account for compromise indicators',
      'Consider implementing account lockout policies',
      'Enable multi-factor authentication',
      'Monitor source IP addresses for blocking'
    ],
    suspicious_access: [
      'Investigate user session details and access patterns',
      'Verify user identity through alternative channels',
      'Review access permissions and role assignments',
      'Consider temporary access restrictions'
    ],
    data_breach_attempt: [
      'Immediately investigate the incident source',
      'Review and strengthen data access controls',
      'Notify security team and stakeholders',
      'Document incident for compliance reporting'
    ],
    compliance_violation: [
      'Document the violation for audit trail',
      'Review and update compliance policies',
      'Provide additional training to affected users',
      'Implement preventive controls'
    ]
  }
  return actions[indicator.type as keyof typeof actions] || ['Investigate incident details', 'Review security controls', 'Document findings']
}