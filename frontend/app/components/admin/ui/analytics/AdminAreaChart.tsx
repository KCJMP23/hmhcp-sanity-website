'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  EyeOff,
  Layers,
  BarChart3
} from 'lucide-react'
import { ChartTooltip } from './ChartTooltip'
import { ChartLegend } from './ChartLegend'

export interface AreaDataPoint {
  /** X-axis value (typically time/date) */
  x: string | number
  /** Y-axis values for different metrics */
  [key: string]: string | number
}

export interface AreaSeriesConfig {
  /** Data key for the series */
  dataKey: string
  /** Display name for the series */
  name: string
  /** Area fill color (hex or CSS color) */
  fill: string
  /** Stroke color for area border */
  stroke?: string
  /** Stroke width */
  strokeWidth?: number
  /** Fill opacity */
  fillOpacity?: number
  /** Whether series is visible */
  visible?: boolean
  /** Stack ID for stacked areas */
  stackId?: string
  /** Area type */
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter'
  /** HIPAA compliance level for healthcare data */
  hipaaCompliance?: 'public' | 'restricted' | 'phi'
}

export interface AdminAreaChartProps {
  /** Chart data array */
  data: AreaDataPoint[]
  /** Configuration for each area series */
  series: AreaSeriesConfig[]
  /** Chart title */
  title: string
  /** Chart description */
  description?: string
  /** Height of the chart container */
  height?: number
  /** X-axis label */
  xAxisLabel?: string
  /** Y-axis label */
  yAxisLabel?: string
  /** Whether to show grid lines */
  showGrid?: boolean
  /** Whether to show brush for zooming */
  showBrush?: boolean
  /** Whether to show export controls */
  showExport?: boolean
  /** Whether to animate chart on load */
  animate?: boolean
  /** Chart type */
  chartType?: 'area' | 'stacked' | 'percent'
  /** Reference lines to display */
  referenceLines?: Array<{
    value: number
    color: string
    label: string
    strokeDasharray?: string
  }>
  /** Custom color scheme for healthcare compliance */
  colorScheme?: 'default' | 'healthcare' | 'accessible'
  /** HIPAA compliance mode */
  hipaaMode?: boolean
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string
  /** Gradient configuration */
  useGradients?: boolean
  /** Connect null data points */
  connectNulls?: boolean
  /** Callback when exporting data */
  onExport?: (format: 'png' | 'svg' | 'csv') => void
  /** Callback when data point is clicked */
  onDataPointClick?: (data: AreaDataPoint) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * AdminAreaChart - Healthcare-compliant area chart component for admin analytics
 * 
 * Features:
 * - Standard, stacked, and percentage area charts
 * - Interactive tooltips with healthcare-specific formatting
 * - Export functionality (PNG, SVG, CSV)
 * - HIPAA compliance mode for PHI data
 * - Responsive design with accessibility features
 * - Zoom and brush controls
 * - Reference lines for benchmarks
 * - Gradient fills for enhanced visualization
 * 
 * @example
 * ```tsx
 * const data = [
 *   { month: '2024-01', newPatients: 120, returning: 340 },
 *   { month: '2024-02', newPatients: 135, returning: 380 },
 * ]
 * 
 * const series = [
 *   { 
 *     dataKey: 'newPatients', 
 *     name: 'New Patients', 
 *     fill: '#0ea5e9', 
 *     stackId: 'patients',
 *     hipaaCompliance: 'restricted' 
 *   },
 *   { 
 *     dataKey: 'returning', 
 *     name: 'Returning Patients', 
 *     fill: '#10b981', 
 *     stackId: 'patients',
 *     hipaaCompliance: 'phi' 
 *   },
 * ]
 * 
 * <AdminAreaChart 
 *   data={data} 
 *   series={series}
 *   title="Patient Flow Analysis"
 *   chartType="stacked"
 *   hipaaMode={true}
 *   useGradients={true}
 * />
 * ```
 */
export function AdminAreaChart({
  data,
  series,
  title,
  description,
  height = 400,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showBrush = false,
  showExport = true,
  animate = true,
  chartType = 'area',
  referenceLines = [],
  colorScheme = 'healthcare',
  hipaaMode = false,
  loading = false,
  error,
  useGradients = true,
  connectNulls = false,
  onExport,
  onDataPointClick,
  className = ''
}: AdminAreaChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    series.reduce((acc, s) => ({ ...acc, [s.dataKey]: s.visible !== false }), {})
  )
  const [zoomLevel, setZoomLevel] = useState(100)

  // Color schemes for healthcare compliance
  const colorSchemes = {
    default: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    healthcare: ['#0369a1', '#059669', '#dc2626', '#7c2d12', '#581c87'],
    accessible: ['#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db']
  }

  // Get colors based on scheme
  const getSeriesColors = useCallback(() => {
    const colors = colorSchemes[colorScheme]
    return series.map((s, index) => ({
      ...s,
      fill: s.fill || colors[index % colors.length],
      stroke: s.stroke || colors[index % colors.length]
    }))
  }, [series, colorScheme])

  // Filter data for HIPAA compliance and calculate percentages
  const processedData = useMemo(() => {
    let processed = [...data]
    
    // Apply HIPAA filtering
    if (hipaaMode) {
      processed = processed.map(point => {
        const filtered = { ...point }
        series.forEach(s => {
          if (s.hipaaCompliance === 'phi' && hipaaMode) {
            // Anonymize PHI data
            if (typeof filtered[s.dataKey] === 'number') {
              filtered[s.dataKey] = Math.round(filtered[s.dataKey] as number / 10) * 10
            }
          }
        })
        return filtered
      })
    }

    // For percentage charts, calculate percentages
    if (chartType === 'percent') {
      processed = processed.map(point => {
        const total = series.reduce((sum, s) => {
          if (visibleSeries[s.dataKey]) {
            return sum + (point[s.dataKey] as number || 0)
          }
          return sum
        }, 0)

        const withPercentages = { ...point }
        series.forEach(s => {
          if (visibleSeries[s.dataKey] && total > 0) {
            withPercentages[`${s.dataKey}_percent`] = ((point[s.dataKey] as number || 0) / total) * 100
          }
        })
        return withPercentages
      })
    }

    return processed
  }, [data, series, hipaaMode, chartType, visibleSeries])

  // Calculate trend for each series
  const calculateTrend = useCallback((dataKey: string) => {
    if (processedData.length < 2) return 0
    const actualDataKey = chartType === 'percent' ? `${dataKey}_percent` : dataKey
    const first = processedData[0][actualDataKey] as number
    const last = processedData[processedData.length - 1][actualDataKey] as number
    return ((last - first) / first) * 100
  }, [processedData, chartType])

  // Export handlers
  const handleExport = useCallback((format: 'png' | 'svg' | 'csv') => {
    if (format === 'csv') {
      const csv = [
        Object.keys(processedData[0] || {}).join(','),
        ...processedData.map(row => Object.values(row).join(','))
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_data.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      onExport?.(format)
    }
  }, [processedData, title, onExport])

  // Toggle series visibility
  const toggleSeries = useCallback((dataKey: string) => {
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }, [])

  // Reset zoom
  const resetZoom = useCallback(() => {
    setZoomLevel(100)
  }, [])

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`w-full border-red-200 ${className}`}>
        <CardHeader>
          <CardTitle className="text-red-600">{title}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const seriesWithColors = getSeriesColors()

  return (
    <Card className={`w-full ${className}`}>
      {/* Gradient Definitions */}
      {useGradients && (
        <defs>
          {seriesWithColors.map((s, index) => (
            <linearGradient key={s.dataKey} id={`gradient-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.fill} stopOpacity={0.8} />
              <stop offset="95%" stopColor={s.fill} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hipaaMode && (
              <Badge variant="secondary" className="text-xs">
                HIPAA Mode
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs capitalize">
              {chartType}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                title="Chart type"
              >
                {chartType === 'stacked' || chartType === 'percent' ? (
                  <Layers className="h-3 w-3" />
                ) : (
                  <BarChart3 className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                className="h-8 px-2"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                className="h-8 px-2"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetZoom}
                className="h-8 px-2"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
            
            {showExport && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  className="h-8 px-2"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Series Legend with Trends */}
        <div className="flex flex-wrap gap-4 pt-2">
          {seriesWithColors.map(s => {
            const trend = calculateTrend(s.dataKey)
            const isVisible = visibleSeries[s.dataKey]
            
            return (
              <div
                key={s.dataKey}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleSeries(s.dataKey)}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: isVisible ? s.fill : '#e5e7eb' }}
                />
                <span className={`text-sm font-medium ${!isVisible ? 'text-gray-400' : ''}`}>
                  {s.name}
                </span>
                {isVisible && (
                  <Button variant="ghost" size="sm" className="h-4 p-0">
                    {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                )}
                {trend !== 0 && chartType !== 'percent' && (
                  <div className="flex items-center gap-1">
                    {trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {Math.abs(trend).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div 
          className="w-full" 
          style={{ height: `${height}px`, transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onClick={onDataPointClick}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#f0f0f0"
                  opacity={0.6}
                />
              )}
              
              <XAxis 
                dataKey="x"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              />
              
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                domain={chartType === 'percent' ? [0, 100] : undefined}
              />

              <ChartTooltip 
                hipaaMode={hipaaMode}
                colorScheme={colorScheme}
                formatter={(value, name) => {
                  if (chartType === 'percent' && name.includes('_percent')) {
                    return [`${Number(value).toFixed(1)}%`, name.replace('_percent', '')]
                  }
                  return [value, name]
                }}
              />

              <ChartLegend />

              {/* Reference Lines */}
              {referenceLines.map((line, index) => (
                <ReferenceLine
                  key={index}
                  y={line.value}
                  stroke={line.color}
                  strokeDasharray={line.strokeDasharray || "5 5"}
                  label={{ value: line.label, position: "topRight" }}
                />
              ))}

              {/* Data Areas */}
              {seriesWithColors.map(s => {
                if (!visibleSeries[s.dataKey]) return null

                const dataKey = chartType === 'percent' ? `${s.dataKey}_percent` : s.dataKey
                const stackId = chartType === 'stacked' || chartType === 'percent' ? 'stack' : s.stackId
                const fillColor = useGradients ? `url(#gradient-${s.dataKey})` : s.fill

                return (
                  <Area
                    key={s.dataKey}
                    type={s.type || 'monotone'}
                    dataKey={dataKey}
                    stackId={stackId}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth || 2}
                    fill={fillColor}
                    fillOpacity={s.fillOpacity || (useGradients ? 1 : 0.6)}
                    animationDuration={animate ? 1000 : 0}
                    connectNulls={connectNulls}
                    dot={false}
                    activeDot={{ r: 4, stroke: s.stroke, strokeWidth: 2, fill: '#ffffff' }}
                  />
                )
              })}

              {/* Brush for zooming */}
              {showBrush && (
                <Brush 
                  dataKey="x" 
                  height={30}
                  stroke="#0ea5e9"
                  fill="#f0f9ff"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminAreaChart