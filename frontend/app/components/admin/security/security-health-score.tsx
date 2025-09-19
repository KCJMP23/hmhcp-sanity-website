'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Shield, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart,
  Lock,
  Users,
  Database,
  FileCheck,
  Calendar,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SecurityDashboardResponse } from '@/lib/types/security'

// Define local types since they might not be exported
interface SecurityScore {
  overall: number
  authentication: number
  access: number
  dataProtection: number
  compliance: number
  threatLevel: string
}

interface SecurityHealthScoreProps {
  data: SecurityDashboardResponse['data'] | null
  isLoading: boolean
  historicalData?: SecurityScoreHistory[]
  onViewHistory?: () => void
  onExportReport?: () => void
  className?: string
}

interface SecurityScoreHistory {
  timestamp: Date
  score: SecurityScore
  incidents: number
  changes: string[]
}

interface ScoreImprovement {
  category: string
  current: number
  previous?: number
  change: number
  trend: 'improving' | 'declining' | 'stable'
  recommendations: string[]
}

export function SecurityHealthScore({ 
  data, 
  isLoading, 
  historicalData = [],
  onViewHistory,
  onExportReport,
  className 
}: SecurityHealthScoreProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d')
  const [showDetails, setShowDetails] = useState(false)
  
  // Extract score from the new data structure
  const score = data?.detailed_metrics?.securityScore ? {
    overall: data.detailed_metrics.securityScore.overall || 0,
    authentication: data.detailed_metrics.securityScore.authentication || 0,
    access: data.detailed_metrics.securityScore.access || 0,
    dataProtection: data.detailed_metrics.securityScore.dataProtection || 0,
    compliance: data.detailed_metrics.securityScore.compliance || 0,
    threatLevel: data.detailed_metrics.securityScore.threatLevel || 'unknown'
  } : null
  
  const improvements = score ? calculateImprovements(score, historicalData) : []

  if (!score && !isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No security data available</p>
            <p className="text-sm">Security metrics are being calculated</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Score Display */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl">Security Health Score</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
              {onExportReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportReport}
                  className="gap-2"
                >
                  <FileCheck className="h-4 w-4" />
                  Export Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MainScoreDisplay score={score} isLoading={isLoading} />
          
          {showDetails && score && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <DetailedScoreBreakdown score={score} isLoading={isLoading} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {score && [
          { 
            category: 'Authentication', 
            score: score.authentication, 
            icon: Lock,
            color: 'blue',
            description: 'Login security and MFA adoption'
          },
          { 
            category: 'Access Control', 
            score: score.access, 
            icon: Users,
            color: 'green',
            description: 'Permission management and authorization'
          },
          { 
            category: 'Data Protection', 
            score: score.dataProtection, 
            icon: Database,
            color: 'purple',
            description: 'Encryption and data security measures'
          },
          { 
            category: 'Compliance', 
            score: score.compliance, 
            icon: FileCheck,
            color: 'orange',
            description: 'HIPAA adherence and regulatory compliance'
          }
        ].map((component, index) => (
          <ScoreComponentCard
            key={component.category}
            component={component}
            improvement={improvements[index]}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Historical Trends */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <CardTitle>Security Trends</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Tabs value={selectedTimeframe} onValueChange={(v: any) => setSelectedTimeframe(v)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="7d" className="text-xs">7 Days</TabsTrigger>
                    <TabsTrigger value="30d" className="text-xs">30 Days</TabsTrigger>
                    <TabsTrigger value="90d" className="text-xs">90 Days</TabsTrigger>
                  </TabsList>
                </Tabs>
                {onViewHistory && (
                  <Button variant="outline" size="sm" onClick={onViewHistory}>
                    View History
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HistoricalTrends 
              data={historicalData} 
              timeframe={selectedTimeframe}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Improvement Recommendations */}
      {improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Security Improvements
            </CardTitle>
            <CardDescription>
              Actionable recommendations to enhance your security posture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImprovementRecommendations 
              improvements={improvements}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Threat Level Assessment */}
      {score && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Threat Level Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThreatLevelDisplay 
              threatLevel={score.threatLevel}
              overallScore={score.overall}
              incidentCount={data?.security_incidents?.length || 0}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MainScoreDisplay({ 
  score, 
  isLoading 
}: { 
  score: SecurityScore | undefined
  isLoading: boolean 
}) {
  if (isLoading) {
    return (
      <div className="text-center">
        <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
      </div>
    )
  }

  if (!score) return null

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent security posture'
    if (score >= 75) return 'Good security with room for improvement'
    if (score >= 60) return 'Moderate security requiring attention'
    return 'Poor security requiring immediate action'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'EXCELLENT', color: 'bg-green-100 text-green-800 border-green-200' }
    if (score >= 75) return { text: 'GOOD', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    if (score >= 60) return { text: 'FAIR', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    return { text: 'POOR', color: 'bg-red-100 text-red-800 border-red-200' }
  }

  const badge = getScoreBadge(score.overall)

  return (
    <div className="text-center">
      <div className="relative inline-block mb-6">
        <div className="relative">
          <Progress 
            value={score.overall} 
            className="h-24 w-24 rounded-full"
            style={{
              transform: 'rotate(-90deg)'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={cn("text-3xl font-bold", getScoreColor(score.overall))}>
                {score.overall}
              </div>
              <div className="text-xs text-gray-600">/100</div>
            </div>
          </div>
        </div>
      </div>
      
      <Badge variant="outline" className={cn("mb-2", badge.color)}>
        {badge.text}
      </Badge>
      
      <p className="text-gray-600 text-sm">
        {getScoreDescription(score.overall)}
      </p>
      
      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          <span>Threat Level: {score.threatLevel.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

function DetailedScoreBreakdown({ 
  score, 
  isLoading 
}: { 
  score: SecurityScore
  isLoading: boolean 
}) {
  const components = [
    {
      name: 'Authentication Security',
      value: score.authentication,
      description: 'Multi-factor authentication, login security, and password policies',
      weight: '25%'
    },
    {
      name: 'Access Control',
      value: score.access,
      description: 'Role-based permissions, authorization controls, and privilege management',
      weight: '25%'
    },
    {
      name: 'Data Protection',
      value: score.dataProtection,
      description: 'Data encryption, backup security, and privacy controls',
      weight: '25%'
    },
    {
      name: 'Compliance',
      value: score.compliance,
      description: 'HIPAA compliance, audit trails, and regulatory adherence',
      weight: '25%'
    }
  ]

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Score Components</h4>
      <div className="space-y-3">
        {components.map((component, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">{component.name}</span>
                <span className="text-sm font-semibold text-gray-700">
                  {isLoading ? '--' : component.value}/100
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{component.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Weight: {component.weight}</span>
                <span>
                  Contribution: {isLoading ? '--' : Math.round(component.value * 0.25)}pts
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreComponentCard({ 
  component, 
  improvement, 
  isLoading 
}: {
  component: {
    category: string
    score: number
    icon: any
    color: string
    description: string
  }
  improvement?: ScoreImprovement
  isLoading: boolean
}) {
  const Icon = component.icon
  
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", getColorClasses(component.color))}>
                  <Icon className="h-4 w-4" />
                </div>
                {improvement && getTrendIcon(improvement.trend) && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(improvement.trend)}
                    <span className="text-xs text-gray-600">
                      {improvement.change > 0 ? '+' : ''}{improvement.change}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {isLoading ? '--' : component.score}
              </div>
              
              <div className="text-sm font-medium text-gray-700 mb-2">
                {component.category}
              </div>
              
              <Progress 
                value={isLoading ? 0 : component.score} 
                className="h-2 mb-2"
              />
              
              <div className="text-xs text-gray-600">
                {component.description}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm max-w-48">
            <p className="font-medium">{component.category}</p>
            <p>{component.description}</p>
            {improvement && improvement.recommendations.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Top Recommendation:</p>
                <p>{improvement.recommendations[0]}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function HistoricalTrends({ 
  data, 
  timeframe, 
  isLoading 
}: {
  data: SecurityScoreHistory[]
  timeframe: '7d' | '30d' | '90d'
  isLoading: boolean
}) {
  const filteredData = data.slice(-getDataPoints(timeframe))
  
  if (isLoading || filteredData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No historical data available</p>
      </div>
    )
  }

  const latestScore = filteredData[filteredData.length - 1]?.score.overall || 0
  const earliestScore = filteredData[0]?.score.overall || 0
  const trend = latestScore - earliestScore

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {trend > 0 ? '+' : ''}{trend} points
          </div>
          <div className="text-sm text-gray-600">
            Change over {timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : '90 days'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trend > 0 ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : trend < 0 ? (
            <TrendingDown className="h-5 w-5 text-red-500" />
          ) : (
            <Activity className="h-5 w-5 text-gray-500" />
          )}
          <span className={cn(
            "text-sm font-medium",
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"
          )}>
            {trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>

      {/* Simple trend visualization */}
      <div className="space-y-2">
        {['Authentication', 'Access Control', 'Data Protection', 'Compliance'].map((category, index) => {
          const current = latestScore
          const previous = earliestScore
          const categoryTrend = current - previous
          
          return (
            <div key={category} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <span className="text-sm text-gray-700">{category}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{current}</span>
                <div className="flex items-center gap-1">
                  {categoryTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : categoryTrend < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : null}
                  <span className={cn(
                    "text-xs",
                    categoryTrend > 0 ? "text-green-600" : categoryTrend < 0 ? "text-red-600" : "text-gray-500"
                  )}>
                    {categoryTrend > 0 ? '+' : ''}{categoryTrend}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ImprovementRecommendations({ 
  improvements, 
  isLoading 
}: {
  improvements: ScoreImprovement[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-64" />
          </div>
        ))}
      </div>
    )
  }

  const prioritizedImprovements = improvements
    .filter(imp => imp.current < 85) // Focus on categories that need improvement
    .sort((a, b) => a.current - b.current) // Lowest scores first

  return (
    <div className="space-y-3">
      {prioritizedImprovements.map((improvement, index) => (
        <div key={improvement.category} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-900">
                {improvement.category}
              </div>
              <Badge variant="outline" className="text-xs">
                Priority {index + 1}
              </Badge>
            </div>
            <div className="text-sm font-semibold text-blue-600">
              {improvement.current}/100
            </div>
          </div>
          
          {improvement.recommendations.length > 0 && (
            <div className="space-y-1">
              {improvement.recommendations.slice(0, 2).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <Target className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {prioritizedImprovements.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Award className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="font-medium">Excellent Security Posture!</p>
          <p className="text-sm">All security categories are performing well.</p>
        </div>
      )}
    </div>
  )
}

function ThreatLevelDisplay({ 
  threatLevel, 
  overallScore, 
  incidentCount, 
  isLoading 
}: {
  threatLevel: string
  overallScore: number
  incidentCount: number
  isLoading: boolean
}) {
  const getThreatLevelConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          description: 'Immediate action required to address critical security vulnerabilities'
        }
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: AlertCircle,
          description: 'Multiple security issues require prompt attention'
        }
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
          description: 'Some security improvements recommended'
        }
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          description: 'Security posture is good with minimal risks'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Shield,
          description: 'Threat level assessment in progress'
        }
    }
  }

  const config = getThreatLevelConfig(threatLevel)
  const Icon = config.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-gray-600" />
          <div>
            <div className="font-medium text-gray-900">Current Threat Level</div>
            <div className="text-sm text-gray-600">{config.description}</div>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-lg px-3 py-1", config.color)}>
          {threatLevel.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {isLoading ? '--' : overallScore}
          </div>
          <div className="text-sm text-gray-600">Security Score</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-red-600">
            {isLoading ? '--' : incidentCount}
          </div>
          <div className="text-sm text-gray-600">Active Incidents</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-blue-600">
            {isLoading ? '--' : Math.max(0, 100 - overallScore)}
          </div>
          <div className="text-sm text-gray-600">Risk Points</div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function calculateImprovements(
  currentScore: SecurityScore, 
  historicalData: SecurityScoreHistory[]
): ScoreImprovement[] {
  const previousScore = historicalData[historicalData.length - 2]?.score
  
  const categories = [
    { name: 'Authentication', current: currentScore.authentication, previous: previousScore?.authentication },
    { name: 'Access Control', current: currentScore.access, previous: previousScore?.access },
    { name: 'Data Protection', current: currentScore.dataProtection, previous: previousScore?.dataProtection },
    { name: 'Compliance', current: currentScore.compliance, previous: previousScore?.compliance }
  ]

  return categories.map(category => {
    const change = category.previous ? category.current - category.previous : 0
    const trend = change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable'
    
    return {
      category: category.name,
      current: category.current,
      previous: category.previous,
      change,
      trend,
      recommendations: getRecommendations(category.name, category.current)
    }
  })
}

function getRecommendations(category: string, score: number): string[] {
  const recommendations: Record<string, string[]> = {
    'Authentication': [
      'Enable multi-factor authentication for all users',
      'Implement stronger password policies',
      'Review and update authentication protocols',
      'Monitor for suspicious login patterns'
    ],
    'Access Control': [
      'Review user permissions and roles',
      'Implement principle of least privilege',
      'Conduct regular access reviews',
      'Strengthen authorization controls'
    ],
    'Data Protection': [
      'Enhance data encryption standards',
      'Implement data loss prevention measures',
      'Review backup and recovery procedures',
      'Strengthen data access controls'
    ],
    'Compliance': [
      'Conduct comprehensive HIPAA audit',
      'Update compliance documentation',
      'Implement additional audit trails',
      'Provide compliance training to staff'
    ]
  }

  const categoryRecs = recommendations[category] || []
  
  // Return more recommendations for lower scores
  if (score < 70) return categoryRecs
  if (score < 85) return categoryRecs.slice(0, 2)
  return categoryRecs.slice(0, 1)
}

function getDataPoints(timeframe: '7d' | '30d' | '90d'): number {
  switch (timeframe) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    default: return 30
  }
}