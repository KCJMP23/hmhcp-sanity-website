'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Lock,
  Database,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SecurityDashboardResponse } from '@/lib/types/security'

interface SecurityMetricsProps {
  data: SecurityDashboardResponse['data'] | null
  timeRange: string
}

export function SecurityMetrics({ 
  data, 
  timeRange
}: SecurityMetricsProps) {
  const isLoading = !data
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Security Metrics</h2>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive security overview and threat analysis for {timeRange}
        </p>
      </div>

      {/* Security Score Overview */}
      {data?.metrics && (
        <SecurityScoreCard metrics={data.metrics} isLoading={isLoading} />
      )}

      {/* Activity Summary */}
      {data?.activity_summary && (
        <ActivitySummaryCard 
          summary={data.activity_summary} 
          isLoading={isLoading}
          timeRange={timeRange}
        />
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="scores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scores">Security Scores</TabsTrigger>
          <TabsTrigger value="activity">Activity Details</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          {data?.metrics && <DetailedScoreBreakdown metrics={data.metrics} isLoading={isLoading} />}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {data?.activity_summary && (
            <DetailedActivityMetrics 
              summary={data.activity_summary} 
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {data?.compliance_status && (
            <ComplianceStatusCard 
              compliance={data.compliance_status} 
              isLoading={isLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SecurityScoreCard({ 
  metrics, 
  isLoading 
}: { 
  metrics: any; 
  isLoading: boolean 
}) {
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-6 w-6 text-green-600" />
    if (score >= 60) return <AlertTriangle className="h-6 w-6 text-yellow-600" />
    return <XCircle className="h-6 w-6 text-red-600" />
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Overall Security Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {getScoreIcon(metrics.overall_score)}
            <div>
              <div className={cn("text-3xl font-bold", getScoreColor(metrics.overall_score))}>
                {isLoading ? '--' : metrics.overall_score}
              </div>
              <div className="text-sm text-gray-600">out of 100</div>
            </div>
          </div>
          <div className="space-y-2">
            <Badge 
              variant="outline" 
              className={cn("text-sm px-3 py-1", getThreatLevelColor(metrics.threat_level))}
            >
              {metrics.threat_level.toUpperCase()} THREAT
            </Badge>
            <Badge 
              variant="outline" 
              className={cn("text-sm px-3 py-1", getSystemHealthColor(metrics.system_health))}
            >
              {metrics.system_health.toUpperCase()} HEALTH
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreMetric
            label="Overall Score"
            value={metrics.overall_score}
            icon={<Shield className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <ScoreMetric
            label="MFA Adoption"
            value={metrics.mfa_adoption_rate}
            icon={<Lock className="h-4 w-4" />}
            isLoading={isLoading}
            suffix="%"
          />
          <ScoreMetric
            label="Compliance"
            value={metrics.compliance_score}
            icon={<CheckCircle className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <ScoreMetric
            label="Active Incidents"
            value={metrics.active_incidents}
            icon={<AlertTriangle className="h-4 w-4" />}
            isLoading={isLoading}
            isWarning={metrics.active_incidents > 0}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreMetric({ 
  label, 
  value, 
  icon, 
  isLoading,
  suffix = '',
  isWarning = false
}: { 
  label: string
  value: number
  icon: React.ReactNode
  isLoading: boolean 
  suffix?: string
  isWarning?: boolean
}) {
  const getProgressColor = (score: number) => {
    if (isWarning && score > 0) return 'bg-red-500'
    if (score >= 90) return 'bg-green-500'
    if (score >= 75) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getValueColor = () => {
    if (isWarning && value > 0) return 'text-red-600'
    if (value >= 90) return 'text-green-600'
    if (value >= 75) return 'text-yellow-600'
    if (value >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-2 text-gray-600">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={cn("text-xl font-semibold", getValueColor())}>
        {isLoading ? '--' : value}{suffix}
      </div>
      {!isWarning && (
        <Progress 
          value={isLoading ? 0 : Math.min(value, 100)} 
          className="h-2 mt-2"
          style={{
            backgroundColor: '#f3f4f6'
          }}
        />
      )}
    </div>
  )
}

function ActivitySummaryCard({ 
  summary, 
  isLoading, 
  timeRange 
}: { 
  summary: any
  isLoading: boolean
  timeRange: string 
}) {
  const formatTimeRange = (range: string) => {
    switch (range) {
      case '1h': return 'Last Hour'
      case '24h': return 'Last 24 Hours'
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      default: return 'Time Period'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Activity Summary
        </CardTitle>
        <CardDescription>
          Security-related activity for {formatTimeRange(timeRange)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <ActivityMetric
            label="Total Sessions"
            value={summary.total_sessions}
            icon={<Users className="h-4 w-4 text-blue-500" />}
            isLoading={isLoading}
          />
          <ActivityMetric
            label="Successful Logins"
            value={summary.successful_logins}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            isLoading={isLoading}
          />
          <ActivityMetric
            label="Failed Logins"
            value={summary.failed_logins}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            isLoading={isLoading}
          />
          <ActivityMetric
            label="Data Access"
            value={summary.data_access_events}
            icon={<Database className="h-4 w-4 text-purple-500" />}
            isLoading={isLoading}
          />
          <ActivityMetric
            label="Admin Actions"
            value={summary.admin_actions}
            icon={<Shield className="h-4 w-4 text-orange-500" />}
            isLoading={isLoading}
          />
          <ActivityMetric
            label="Compliance Events"
            value={summary.compliance_events}
            icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityMetric({ 
  label, 
  value, 
  icon, 
  isLoading 
}: {
  label: string
  value: number
  icon: React.ReactNode
  isLoading: boolean
}) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-1">
        {isLoading ? '--' : value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  )
}

function DetailedScoreBreakdown({ score, isLoading }: { score: SecurityScore; isLoading: boolean }) {
  const scoreDetails = [
    {
      category: 'Authentication Security',
      score: score.authentication,
      description: 'Login success rates, MFA adoption, and authentication controls',
      icon: <Lock className="h-5 w-5" />
    },
    {
      category: 'Access Control',
      score: score.access,
      description: 'Authorization controls, privilege management, and access violations',
      icon: <Users className="h-5 w-5" />
    },
    {
      category: 'Data Protection',
      score: score.dataProtection,
      description: 'Encryption, data handling, and breach prevention measures',
      icon: <Database className="h-5 w-5" />
    },
    {
      category: 'Compliance Adherence',
      score: score.compliance,
      description: 'HIPAA compliance, audit trails, and regulatory requirements',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ]

  return (
    <div className="grid gap-4">
      {scoreDetails.map((detail, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">{detail.icon}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{detail.category}</h4>
                  <p className="text-sm text-gray-600">{detail.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '--' : detail.score}
                </div>
                <div className="text-sm text-gray-600">/100</div>
              </div>
            </div>
            <Progress value={isLoading ? 0 : detail.score} className="h-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DetailedActivityMetrics({ 
  summary, 
  isLoading 
}: { 
  summary: ActivitySummary
  isLoading: boolean 
}) {
  const loginSuccessRate = summary.totalSessions > 0 
    ? ((summary.successfulLogins / (summary.successfulLogins + summary.failedLogins)) * 100)
    : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Login Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">Success Rate</div>
              <div className="text-2xl font-semibold text-green-600 mb-2">
                {isLoading ? '--' : `${loginSuccessRate.toFixed(1)}%`}
              </div>
              <Progress value={isLoading ? 0 : loginSuccessRate} className="h-2" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">Total Attempts</div>
              <div className="text-2xl font-semibold text-gray-900">
                {isLoading ? '--' : (summary.successfulLogins + summary.failedLogins).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {isLoading ? '--' : summary.successfulLogins.toLocaleString()} successful, {' '}
                {isLoading ? '--' : summary.failedLogins.toLocaleString()} failed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-purple-600">
                {isLoading ? '--' : summary.dataAccess.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Data Access Events</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-orange-600">
                {isLoading ? '--' : summary.adminActions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Admin Actions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-blue-600">
                {isLoading ? '--' : summary.totalSessions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-yellow-600">
                {isLoading ? '--' : summary.complianceEvents.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Compliance Events</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ComplianceStatusCard({ 
  compliance, 
  isLoading 
}: { 
  compliance: any
  isLoading: boolean 
}) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>HIPAA Compliance Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-medium">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            {compliance.hipaaCompliant ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={compliance.hipaaCompliant ? 'text-green-600' : 'text-red-600'}>
              {compliance.hipaaCompliant ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Risk Level</div>
            <Badge className={getRiskColor(compliance.riskLevel)}>
              {compliance.riskLevel.toUpperCase()}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Violations</div>
            <div className="text-xl font-semibold text-red-600">
              {isLoading ? '--' : compliance.violations}
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-1">Last Audit</div>
          <div className="text-sm text-gray-900">
            {isLoading ? '--' : new Date(compliance.lastAudit).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}