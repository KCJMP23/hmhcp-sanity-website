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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
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
  Star,
  Target
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReputationScore {
  id: string
  provider: string
  score: number
  previous_score: number
  max_score: number
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  trend: 'up' | 'down' | 'stable'
  last_updated: string
  factors: ReputationFactor[]
  recommendations: string[]
}

interface ReputationFactor {
  id: string
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  current_value: number
  target_value: number
  description: string
}

interface ReputationHistory {
  id: string
  provider: string
  score: number
  date: string
  factors: {
    volume: number
    bounces: number
    complaints: number
    engagement: number
  }
}

const reputationProviders = [
  { value: 'all', label: 'All Providers' },
  { value: 'gmail', label: 'Gmail', description: 'Google Gmail reputation' },
  { value: 'outlook', label: 'Outlook', description: 'Microsoft Outlook reputation' },
  { value: 'yahoo', label: 'Yahoo', description: 'Yahoo Mail reputation' },
  { value: 'aol', label: 'AOL', description: 'AOL Mail reputation' },
  { value: 'icloud', label: 'iCloud', description: 'Apple iCloud Mail reputation' }
]

const timeRanges = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' }
]

export function EmailReputationManager() {
  const [reputationScores, setReputationScores] = useState<ReputationScore[]>([])
  const [reputationHistory, setReputationHistory] = useState<ReputationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const { toast } = useToast()

  useEffect(() => {
    loadReputationData()
  }, [selectedProvider, selectedTimeRange])

  const loadReputationData = async () => {
    try {
      setLoading(true)
      const [scoresResponse, historyResponse] = await Promise.all([
        fetch(`/api/admin/email/deliverability/reputation/scores?provider=${selectedProvider}`),
        fetch(`/api/admin/email/deliverability/reputation/history?provider=${selectedProvider}&time_range=${selectedTimeRange}`)
      ])
      
      const [scoresData, historyData] = await Promise.all([
        scoresResponse.json(),
        historyResponse.json()
      ])
      
      if (scoresData.success) {
        setReputationScores(scoresData.data)
      }
      
      if (historyData.success) {
        setReputationHistory(historyData.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reputation data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadReputationData()
    toast({
      title: 'Success',
      description: 'Reputation data refreshed'
    })
  }

  const handleExportReputation = async () => {
    try {
      const response = await fetch('/api/admin/email/deliverability/reputation/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: selectedProvider,
          time_range: selectedTimeRange
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Reputation data exported successfully'
        })
      } else {
        throw new Error('Failed to export reputation data')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export reputation data',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      excellent: { color: 'bg-green-100 text-green-800', icon: Star },
      good: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      fair: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      poor: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.good
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getImpactBadge = (impact: string) => {
    const impactConfig = {
      positive: { color: 'bg-green-100 text-green-800' },
      negative: { color: 'bg-red-100 text-red-800' },
      neutral: { color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = impactConfig[impact as keyof typeof impactConfig] || impactConfig.neutral
    
    return (
      <Badge className={config.color}>
        {impact.charAt(0).toUpperCase() + impact.slice(1)}
      </Badge>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getProviderInfo = (provider: string) => {
    return reputationProviders.find(p => p.value === provider) || reputationProviders[0]
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
          <p className="mt-2 text-muted-foreground">Loading reputation data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reputation Manager</h2>
          <p className="text-muted-foreground">
            Monitor and manage sender reputation across email providers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportReputation}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Reputation Filters
          </CardTitle>
          <CardDescription>
            Filter reputation data by provider and time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {reputationProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div>
                        <div className="font-medium">{provider.label}</div>
                        {provider.description && (
                          <div className="text-xs text-muted-foreground">{provider.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reputation Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reputation Scores
          </CardTitle>
          <CardDescription>
            Current reputation scores across email providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Previous Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reputationScores.map((score) => {
                const providerInfo = getProviderInfo(score.provider)
                const change = score.score - score.previous_score
                const changePercentage = score.previous_score > 0 
                  ? ((change / score.previous_score) * 100).toFixed(1)
                  : '0.0'
                
                return (
                  <TableRow key={score.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{providerInfo.label}</div>
                        <div className="text-sm text-muted-foreground">{providerInfo.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-lg ${getScoreColor(score.score, score.max_score)}`}>
                          {score.score}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {score.max_score}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {score.previous_score} / {score.max_score}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(score.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(score.trend)}
                        <span className={`text-sm ${getTrendColor(score.trend)}`}>
                          {change > 0 ? '+' : ''}{changePercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(score.last_updated).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle view details
                            console.log('View reputation details:', score.id)
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

      {/* Reputation Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Reputation Factors
          </CardTitle>
          <CardDescription>
            Factors affecting your sender reputation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reputationScores.map((score) => (
              <div key={score.id} className="p-4 border rounded-lg">
                <div className="font-medium mb-3">{getProviderInfo(score.provider).label} Factors</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {score.factors.map((factor) => (
                    <div key={factor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{factor.name}</div>
                        <div className="text-sm text-muted-foreground">{factor.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-medium">{factor.current_value}</div>
                          <div className="text-xs text-muted-foreground">Target: {factor.target_value}</div>
                        </div>
                        {getImpactBadge(factor.impact)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reputation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Reputation Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve sender reputation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reputationScores.map((score) => (
              score.recommendations.length > 0 && (
                <div key={score.id} className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">
                    {getProviderInfo(score.provider).label} Recommendations
                  </div>
                  <ul className="space-y-1 text-sm text-blue-700">
                    {score.recommendations.map((recommendation, index) => (
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
