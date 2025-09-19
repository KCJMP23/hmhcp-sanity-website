/**
 * Security Metrics Visualization Components
 * Advanced charts for security dashboard metrics
 * 
 * Story 1.6 Task 6: Security Dashboard Implementation
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts'
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Eye,
  Users,
  Lock,
  Globe
} from 'lucide-react'

// Types
interface SecurityScoreData {
  timestamp: string
  security_score: number
  threats_detected: number
  vulnerabilities_fixed: number
}

interface ThreatDistribution {
  name: string
  value: number
  color: string
}

interface ActivityMetrics {
  date: string
  successful_logins: number
  failed_attempts: number
  blocked_ips: number
  suspicious_activity: number
}

interface ComplianceMetrics {
  component: string
  score: number
  status: 'compliant' | 'warning' | 'non_compliant'
}

// Props interfaces
interface SecurityScoreChartProps {
  data: SecurityScoreData[]
  className?: string
}

interface ThreatDistributionChartProps {
  data: ThreatDistribution[]
  className?: string
}

interface ActivityTimelineChartProps {
  data: ActivityMetrics[]
  className?: string
}

interface ComplianceRadarChartProps {
  data: ComplianceMetrics[]
  className?: string
}

interface SecurityMetricsGridProps {
  metrics: {
    overall_security_score: number
    active_threats: number
    blocked_attempts_24h: number
    mfa_adoption_rate: number
    vulnerability_score: number
    compliance_score: number
  }
  className?: string
}

// Security Score Trend Chart
export const SecurityScoreChart: React.FC<SecurityScoreChartProps> = ({ data, className = '' }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">{`Time: ${label}`}</p>
          <p className="text-sm text-blue-600">{`Security Score: ${payload[0].value}%`}</p>
          {payload[1] && (
            <p className="text-sm text-red-600">{`Threats: ${payload[1].value}`}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Security Score Trend
        </h3>
        <p className="text-sm text-gray-600 mt-1">7-day security score history</p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#64748b" 
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="security_score"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#scoreGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// Threat Distribution Pie Chart
export const ThreatDistributionChart: React.FC<ThreatDistributionChartProps> = ({ data, className = '' }) => {
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Threat Distribution
        </h3>
        <p className="text-sm text-gray-600 mt-1">Active threats by category</p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={<CustomLabel />}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: string) => [`${value} threats`, name]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// Activity Timeline Chart
export const ActivityTimelineChart: React.FC<ActivityTimelineChartProps> = ({ data, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Activity Timeline
        </h3>
        <p className="text-sm text-gray-600 mt-1">Authentication and security events</p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={12}
            />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="successful_logins" 
              name="Successful Logins"
              fill="#10B981" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="failed_attempts" 
              name="Failed Attempts"
              fill="#F59E0B" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="blocked_ips" 
              name="Blocked IPs"
              fill="#EF4444" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="suspicious_activity" 
              name="Suspicious Activity"
              fill="#8B5CF6" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// Compliance Status Radar Chart (simplified as bar chart)
export const ComplianceStatusChart: React.FC<ComplianceRadarChartProps> = ({ data, className = '' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return '#10B981'
      case 'warning':
        return '#F59E0B'
      case 'non_compliant':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-purple-600" />
          Compliance Status
        </h3>
        <p className="text-sm text-gray-600 mt-1">HIPAA and security compliance scores</p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} />
            <YAxis 
              type="category" 
              dataKey="component" 
              stroke="#64748b" 
              fontSize={12}
              width={120}
            />
            <Tooltip 
              formatter={(value: any, name: string, props: any) => [
                `${value}%`, 
                `${props.payload.component} Score`
              ]}
            />
            <Bar 
              dataKey="score" 
              radius={[0, 4, 4, 0]}
              fill={(entry: any) => getStatusColor(entry.status)}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// Security Metrics Grid with KPI Cards
export const SecurityMetricsGrid: React.FC<SecurityMetricsGridProps> = ({ metrics, className = '' }) => {
  const metricCards = [
    {
      title: 'Security Score',
      value: `${metrics.overall_security_score}%`,
      icon: Shield,
      color: metrics.overall_security_score >= 90 ? 'green' : metrics.overall_security_score >= 70 ? 'yellow' : 'red',
      trend: 'up' // Mock trend
    },
    {
      title: 'Active Threats',
      value: metrics.active_threats.toString(),
      icon: AlertTriangle,
      color: metrics.active_threats === 0 ? 'green' : metrics.active_threats < 5 ? 'yellow' : 'red',
      trend: 'down'
    },
    {
      title: 'Blocked Attempts',
      value: metrics.blocked_attempts_24h.toString(),
      icon: Eye,
      color: 'blue',
      trend: 'up'
    },
    {
      title: 'MFA Adoption',
      value: `${metrics.mfa_adoption_rate}%`,
      icon: Users,
      color: metrics.mfa_adoption_rate >= 90 ? 'green' : metrics.mfa_adoption_rate >= 70 ? 'yellow' : 'red',
      trend: 'up'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' }
      case 'yellow':
        return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-600' }
      case 'red':
        return { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-600' }
      case 'blue':
        return { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-600' }
    }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metricCards.map((card, index) => {
        const colors = getColorClasses(card.color)
        const IconComponent = card.icon
        const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown
        
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-3xl font-bold ${colors.text} mt-1`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <IconComponent className={`h-6 w-6 ${colors.icon}`} />
              </div>
            </div>
            
            <div className="flex items-center mt-4">
              <TrendIcon className={`h-4 w-4 ${card.trend === 'up' ? 'text-green-500' : 'text-red-500'} mr-1`} />
              <span className="text-sm text-gray-600">
                {card.trend === 'up' ? 'Trending up' : 'Trending down'}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Real-time Security Activity Feed
interface SecurityActivityFeedProps {
  activities: Array<{
    id: string
    type: 'login' | 'threat' | 'alert' | 'blocked'
    message: string
    timestamp: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
  className?: string
}

export const SecurityActivityFeed: React.FC<SecurityActivityFeedProps> = ({ activities, className = '' }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Users className="h-4 w-4" />
      case 'threat':
        return <AlertTriangle className="h-4 w-4" />
      case 'alert':
        return <Eye className="h-4 w-4" />
      case 'blocked':
        return <Shield className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Real-time Activity Feed
        </h3>
        <p className="text-sm text-gray-600 mt-1">Live security events and activities</p>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg border ${getSeverityColor(activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${getSeverityColor(activity.severity)}`}>
                      {activity.severity}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}