'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Users,
  Activity,
  DollarSign,
  Heart,
  Clock,
  BarChart3,
  Zap,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface KPITarget {
  /** Target value */
  value: number
  /** Target label */
  label?: string
  /** Target type */
  type?: 'minimum' | 'maximum' | 'exact'
}

export interface KPITrend {
  /** Current period value */
  current: number
  /** Previous period value */
  previous: number
  /** Period label (e.g., "vs last month") */
  periodLabel?: string
  /** Custom trend calculation */
  customTrend?: number
}

export interface AdminKPICardProps {
  /** KPI title */
  title: string
  /** KPI value */
  value: number | string
  /** KPI description */
  description?: string
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>
  /** Value formatting function */
  valueFormat?: (value: number | string) => string
  /** Unit label (e.g., "patients", "%", "$") */
  unit?: string
  /** Trend data for comparison */
  trend?: KPITrend
  /** Target values */
  target?: KPITarget
  /** Color scheme */
  colorScheme?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'healthcare'
  /** Card size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show progress bar (for targets) */
  showProgress?: boolean
  /** Whether to show trend */
  showTrend?: boolean
  /** Whether to show target indicator */
  showTarget?: boolean
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string
  /** HIPAA compliance mode */
  hipaaMode?: boolean
  /** HIPAA compliance level */
  hipaaCompliance?: 'public' | 'restricted' | 'phi'
  /** Additional metadata */
  metadata?: Record<string, any>
  /** Last updated timestamp */
  lastUpdated?: Date
  /** Whether the card is clickable */
  clickable?: boolean
  /** Whether the KPI can be hidden */
  allowHide?: boolean
  /** Custom status indicator */
  status?: 'normal' | 'warning' | 'critical' | 'good'
  /** Drill-down availability */
  hasDrillDown?: boolean
  /** Callback when card is clicked */
  onClick?: () => void
  /** Callback when hide/show is toggled */
  onToggleVisibility?: (visible: boolean) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * AdminKPICard - Healthcare-compliant KPI card component for admin analytics
 * 
 * Features:
 * - Configurable color schemes and sizes
 * - Trend indicators with period comparisons
 * - Target tracking with progress bars
 * - HIPAA compliance mode for PHI data
 * - Status indicators for critical metrics
 * - Interactive drill-down capabilities
 * - Healthcare-specific icons and formatting
 * 
 * @example
 * ```tsx
 * <AdminKPICard
 *   title="Patient Satisfaction"
 *   value={4.7}
 *   unit="/ 5.0"
 *   icon={Heart}
 *   trend={{ current: 4.7, previous: 4.5, periodLabel: "vs last month" }}
 *   target={{ value: 4.5, type: "minimum" }}
 *   colorScheme="healthcare"
 *   showProgress={true}
 *   hipaaMode={true}
 *   onClick={() => console.log('Drill down to satisfaction details')}
 * />
 * ```
 */
export function AdminKPICard({
  title,
  value,
  description,
  icon: IconComponent,
  valueFormat = (val) => val.toString(),
  unit,
  trend,
  target,
  colorScheme = 'default',
  size = 'md',
  showProgress = false,
  showTrend = true,
  showTarget = true,
  loading = false,
  error,
  hipaaMode = false,
  hipaaCompliance = 'public',
  metadata,
  lastUpdated,
  clickable = false,
  allowHide = false,
  status = 'normal',
  hasDrillDown = false,
  onClick,
  onToggleVisibility,
  className = ''
}: AdminKPICardProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Color scheme configurations
  const colorSchemes = {
    default: {
      icon: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      trend: { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-gray-500' },
      progress: 'bg-blue-500'
    },
    success: {
      icon: 'text-green-500',
      bg: 'bg-green-50',
      border: 'border-green-200',
      trend: { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-gray-500' },
      progress: 'bg-green-500'
    },
    warning: {
      icon: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      trend: { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-gray-500' },
      progress: 'bg-amber-500'
    },
    danger: {
      icon: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      trend: { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-gray-500' },
      progress: 'bg-red-500'
    },
    info: {
      icon: 'text-cyan-500',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      trend: { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-gray-500' },
      progress: 'bg-cyan-500'
    },
    healthcare: {
      icon: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      trend: { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-gray-500' },
      progress: 'bg-blue-600'
    }
  }

  // Size configurations
  const sizes = {
    sm: { padding: 'p-4', icon: 'h-5 w-5', title: 'text-sm', value: 'text-lg', spacing: 'space-y-2' },
    md: { padding: 'p-6', icon: 'h-6 w-6', title: 'text-base', value: 'text-2xl', spacing: 'space-y-3' },
    lg: { padding: 'p-8', icon: 'h-8 w-8', title: 'text-lg', value: 'text-3xl', spacing: 'space-y-4' }
  }

  // Process value for HIPAA compliance
  const displayValue = useMemo(() => {
    if (hipaaMode && hipaaCompliance === 'phi' && typeof value === 'number') {
      return Math.round(value / 10) * 10
    }
    return value
  }, [value, hipaaMode, hipaaCompliance])

  // Calculate trend
  const trendData = useMemo(() => {
    if (!trend || !showTrend) return null

    const trendValue = trend.customTrend ?? ((trend.current - trend.previous) / trend.previous) * 100
    const isPositive = trendValue > 0
    const isNegative = trendValue < 0
    const isNeutral = trendValue === 0

    return {
      value: trendValue,
      isPositive,
      isNegative,
      isNeutral,
      icon: isPositive ? TrendingUp : isNegative ? TrendingDown : Minus,
      periodLabel: trend.periodLabel || 'vs previous period'
    }
  }, [trend, showTrend])

  // Calculate target progress
  const targetProgress = useMemo(() => {
    if (!target || !showTarget || typeof displayValue !== 'number') return null

    let progress = 0
    let status: 'on-track' | 'below-target' | 'above-target' = 'on-track'

    if (target.type === 'minimum') {
      progress = (displayValue / target.value) * 100
      status = displayValue >= target.value ? 'on-track' : 'below-target'
    } else if (target.type === 'maximum') {
      progress = Math.min((displayValue / target.value) * 100, 100)
      status = displayValue <= target.value ? 'on-track' : 'above-target'
    } else { // exact
      const tolerance = target.value * 0.1 // 10% tolerance
      const distance = Math.abs(displayValue - target.value)
      progress = Math.max(0, (1 - distance / target.value) * 100)
      status = distance <= tolerance ? 'on-track' : 'below-target'
    }

    return { progress: Math.min(progress, 100), status }
  }, [displayValue, target, showTarget])

  // Get status icon and color
  const getStatusIndicator = useCallback(() => {
    switch (status) {
      case 'good':
        return { icon: CheckCircle, color: 'text-green-500' }
      case 'warning':
        return { icon: AlertTriangle, color: 'text-amber-500' }
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-500' }
      default:
        return { icon: Info, color: 'text-gray-400' }
    }
  }, [status])

  // Handle visibility toggle
  const toggleVisibility = useCallback(() => {
    const newVisibility = !isVisible
    setIsVisible(newVisibility)
    onToggleVisibility?.(newVisibility)
  }, [isVisible, onToggleVisibility])

  if (loading) {
    return (
      <Card className={`${sizes[size].padding} ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 w-4 bg-gray-200 rounded" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${sizes[size].padding} border-red-200 ${className}`}>
        <div className="text-red-600">
          <AlertTriangle className="h-5 w-5 mb-2" />
          <div className="font-medium">{title}</div>
          <div className="text-sm">{error}</div>
        </div>
      </Card>
    )
  }

  if (!isVisible) {
    return (
      <Card className={`${sizes[size].padding} bg-gray-50 border-dashed ${className}`}>
        <div className="flex items-center justify-between text-gray-400">
          <span className="text-sm">{title} (hidden)</span>
          {allowHide && (
            <Button variant="ghost" size="sm" onClick={toggleVisibility} className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>
    )
  }

  const scheme = colorSchemes[colorScheme]
  const sizeConfig = sizes[size]
  const statusIndicator = getStatusIndicator()

  return (
    <TooltipProvider>
      <Card 
        className={`
          ${sizeConfig.padding} ${scheme.border} transition-all duration-200
          ${clickable || onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        <div className={sizeConfig.spacing}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {IconComponent && (
                <div className={`${scheme.bg} p-2 rounded-lg`}>
                  <IconComponent className={`${sizeConfig.icon} ${scheme.icon}`} />
                </div>
              )}
              <div>
                <h3 className={`font-semibold ${sizeConfig.title} text-gray-900`}>{title}</h3>
                {description && (
                  <p className="text-xs text-gray-500">{description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Status Indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <statusIndicator.icon className={`h-4 w-4 ${statusIndicator.color}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <span>Status: {status}</span>
                </TooltipContent>
              </Tooltip>

              {/* HIPAA Badge */}
              {hipaaMode && hipaaCompliance === 'phi' && (
                <Badge variant="secondary" className="text-xs">PHI</Badge>
              )}

              {/* Hide/Show Toggle */}
              {allowHide && (
                <Button variant="ghost" size="sm" onClick={toggleVisibility} className="h-6 w-6 p-0">
                  <EyeOff className="h-3 w-3" />
                </Button>
              )}

              {/* Drill Down Indicator */}
              {hasDrillDown && (
                <BarChart3 className="h-3 w-3 text-gray-400" />
              )}
            </div>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className={`font-bold ${sizeConfig.value} text-gray-900`}>
              {valueFormat(displayValue)}
            </span>
            {unit && (
              <span className="text-sm text-gray-500">{unit}</span>
            )}
            
            {/* Trend Indicator */}
            {trendData && (
              <div className="flex items-center gap-1 ml-2">
                <trendData.icon className={`h-3 w-3 ${
                  trendData.isPositive 
                    ? scheme.trend.positive
                    : trendData.isNegative 
                    ? scheme.trend.negative 
                    : scheme.trend.neutral
                }`} />
                <span className={`text-xs font-medium ${
                  trendData.isPositive 
                    ? scheme.trend.positive
                    : trendData.isNegative 
                    ? scheme.trend.negative 
                    : scheme.trend.neutral
                }`}>
                  {Math.abs(trendData.value).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Target Progress */}
          {targetProgress && showProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Target: {valueFormat(target!.value)} ({target!.label || target!.type})
                </span>
                <span className={`font-medium ${
                  targetProgress.status === 'on-track' 
                    ? 'text-green-600' 
                    : 'text-amber-600'
                }`}>
                  {targetProgress.progress.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={targetProgress.progress}
                className="h-2"
              />
            </div>
          )}

          {/* Trend Period Label */}
          {trendData && (
            <div className="text-xs text-gray-500">
              {trendData.periodLabel}
            </div>
          )}

          {/* Metadata */}
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="text-xs text-gray-400 border-t pt-2">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdated.toLocaleDateString()}</span>
            </div>
          )}

          {/* HIPAA Notice */}
          {hipaaMode && hipaaCompliance === 'phi' && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <Shield className="h-3 w-3 inline mr-1" />
              Values anonymized for HIPAA compliance
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  )
}

// Common healthcare-specific KPI card presets
export const HealthcareKPIPresets = {
  PatientSatisfaction: (props: Partial<AdminKPICardProps>) => (
    <AdminKPICard
      icon={Heart}
      colorScheme="healthcare"
      unit="/ 5.0"
      valueFormat={(val) => Number(val).toFixed(1)}
      {...props}
    />
  ),

  PatientVolume: (props: Partial<AdminKPICardProps>) => (
    <AdminKPICard
      icon={Users}
      colorScheme="info"
      valueFormat={(val) => Number(val).toLocaleString()}
      {...props}
    />
  ),

  AverageWaitTime: (props: Partial<AdminKPICardProps>) => (
    <AdminKPICard
      icon={Clock}
      colorScheme="warning"
      unit="min"
      valueFormat={(val) => Number(val).toFixed(0)}
      {...props}
    />
  ),

  Revenue: (props: Partial<AdminKPICardProps>) => (
    <AdminKPICard
      icon={DollarSign}
      colorScheme="success"
      valueFormat={(val) => `$${Number(val).toLocaleString()}`}
      {...props}
    />
  ),

  ReadmissionRate: (props: Partial<AdminKPICardProps>) => (
    <AdminKPICard
      icon={Activity}
      colorScheme="danger"
      unit="%"
      valueFormat={(val) => Number(val).toFixed(2)}
      {...props}
    />
  )
}

export default AdminKPICard